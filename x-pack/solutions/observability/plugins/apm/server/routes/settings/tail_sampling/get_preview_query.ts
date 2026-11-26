/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import type {
  AggregationsAggregationContainer,
  QueryDslQueryContainer,
} from '@elastic/elasticsearch/lib/api/types';
import type { TailSamplingPolicy } from '@kbn/apm-api-shared';
import {
  DURATION,
  EVENT_OUTCOME,
  PARENT_ID,
  STATUS_CODE,
  TRACE_ID,
  TRANSACTION_DURATION,
} from '../../../../common/es_fields/apm';

// The estimate splits the kept traces by policy. More keep conditions than this are left out,
// to bound the number of aggregations.
export const MAX_PREVIEW_KEEP_FILTERS = 20;

// The most Elasticsearch counts exactly. Above it, distinct counts are approximate.
const PRECISION_THRESHOLD = 40000;

// Upstream status codes, as stored by classic APM (`event.outcome`) and OpenTelemetry (`status.code`).
const STATUS_CODE_VALUES: Record<string, { outcome: string; otel: string }> = {
  ERROR: { outcome: 'failure', otel: 'Error' },
  OK: { outcome: 'success', otel: 'Ok' },
  UNSET: { outcome: 'unknown', otel: 'Unset' },
};

export interface PreviewKeepFilter {
  policyName: string;
  filter: QueryDslQueryContainer;
}

export interface PreviewPlan {
  // Keep conditions, in the order of the policy list.
  keepFilters: PreviewKeepFilter[];
  // Conditions of the drop policies.
  dropFilters: QueryDslQueryContainer[];
  // The share-of-all-traces policy with the largest share, if any.
  share?: { policyName: string; percentage: number };
  unsupportedPolicies: string[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const anyOf = (queries: QueryDslQueryContainer[]): QueryDslQueryContainer => ({
  bool: { should: queries, minimum_should_match: 1 },
});

const getStatusCodeFilter = (block: unknown): QueryDslQueryContainer | undefined => {
  if (!isRecord(block) || !Array.isArray(block.status_codes) || block.status_codes.length === 0) {
    return undefined;
  }
  const values = block.status_codes.map((code) => STATUS_CODE_VALUES[String(code)]);
  if (values.some((value) => value === undefined)) {
    return undefined;
  }
  return anyOf([
    { terms: { [EVENT_OUTCOME]: values.map(({ outcome }) => outcome) } },
    { terms: { [STATUS_CODE]: values.map(({ otel }) => otel) } },
  ]);
};

// The collector measures a trace from its first span start to its last span end. The duration
// of the root document stands in for that.
const getLatencyFilter = (block: unknown): QueryDslQueryContainer | undefined => {
  if (!isRecord(block) || typeof block.threshold_ms !== 'number') {
    return undefined;
  }
  const { threshold_ms: min, upper_threshold_ms: max } = block;
  if (max !== undefined && typeof max !== 'number') {
    return undefined;
  }
  // `transaction.duration.us` is in microseconds, the OpenTelemetry `duration` in nanoseconds.
  const range = (factor: number) => ({
    gte: min * factor,
    ...(max === undefined ? {} : { lte: max * factor }),
  });
  return {
    bool: {
      must_not: [{ exists: { field: PARENT_ID } }],
      filter: [
        anyOf([
          { range: { [TRANSACTION_DURATION]: range(1000) } },
          { range: { [DURATION]: range(1000000) } },
        ]),
      ],
    },
  };
};

// An attribute can be stored under its own name, as an OpenTelemetry span or resource
// attribute, or as a classic APM label, where dots in the key are underscores.
const getStringAttributeFilter = (block: unknown): QueryDslQueryContainer | undefined => {
  if (
    !isRecord(block) ||
    typeof block.key !== 'string' ||
    block.key === '' ||
    !Array.isArray(block.values) ||
    block.values.length === 0 ||
    // The collector and Elasticsearch use different regular expression dialects.
    block.enabled_regex_matching === true ||
    block.invert_match === true
  ) {
    return undefined;
  }
  const { key } = block;
  const values = block.values.map((value) => String(value));
  const fields = [
    key,
    `attributes.${key}`,
    `resource.attributes.${key}`,
    `labels.${key.replace(/\./g, '_')}`,
  ];
  return anyOf(fields.map((field) => ({ terms: { [field]: values } })));
};

const getLeafFilter = (policy: TailSamplingPolicy): QueryDslQueryContainer | undefined => {
  switch (policy.type) {
    case 'status_code':
      return getStatusCodeFilter(policy.status_code);
    case 'latency':
      return getLatencyFilter(policy.latency);
    case 'string_attribute':
      return getStringAttributeFilter(policy.string_attribute);
    default:
      return undefined;
  }
};

// A drop policy drops a trace when all its sub-policies match. The estimate only covers
// a single condition, which is what the form creates.
const getDropFilter = (policy: TailSamplingPolicy): QueryDslQueryContainer | undefined => {
  const { drop } = policy;
  if (
    !isRecord(drop) ||
    !Array.isArray(drop.drop_sub_policy) ||
    drop.drop_sub_policy.length !== 1
  ) {
    return undefined;
  }
  const [subPolicy] = drop.drop_sub_policy;
  return isRecord(subPolicy) && typeof subPolicy.type === 'string'
    ? getLeafFilter(subPolicy as TailSamplingPolicy)
    : undefined;
};

const getSharePercentage = (policy: TailSamplingPolicy): number | undefined => {
  const { probabilistic } = policy;
  return isRecord(probabilistic) && typeof probabilistic.sampling_percentage === 'number'
    ? probabilistic.sampling_percentage
    : undefined;
};

/** Sorts the policies into what the estimate can count, and names the ones it cannot. */
export function getPreviewPlan(policies: TailSamplingPolicy[]): PreviewPlan {
  const plan: PreviewPlan = { keepFilters: [], dropFilters: [], unsupportedPolicies: [] };

  for (const policy of policies) {
    if (policy.type === 'probabilistic') {
      const percentage = getSharePercentage(policy);
      if (percentage === undefined) {
        plan.unsupportedPolicies.push(policy.name);
        // Policies with the same hash salt nest, so the largest share covers the others.
      } else if (plan.share === undefined || percentage > plan.share.percentage) {
        plan.share = { policyName: policy.name, percentage };
      }
      continue;
    }

    if (policy.type === 'drop') {
      const filter = getDropFilter(policy);
      if (filter) {
        plan.dropFilters.push(filter);
      } else {
        plan.unsupportedPolicies.push(policy.name);
      }
      continue;
    }

    const filter = getLeafFilter(policy);
    if (filter && plan.keepFilters.length < MAX_PREVIEW_KEEP_FILTERS) {
      plan.keepFilters.push({ policyName: policy.name, filter });
    } else {
      plan.unsupportedPolicies.push(policy.name);
    }
  }

  return plan;
}

const distinctTraces = (): AggregationsAggregationContainer => ({
  cardinality: { field: TRACE_ID, precision_threshold: PRECISION_THRESHOLD },
});

const distinctTracesMatching = (
  queries: QueryDslQueryContainer[]
): AggregationsAggregationContainer => ({
  filter: anyOf(queries),
  aggs: { traces: distinctTraces() },
});

export const PREVIEW_AGG_TOTAL = 'total';
export const PREVIEW_AGG_DROPPED = 'dropped';
export const PREVIEW_AGG_KEPT_OR_DROPPED = 'kept_or_dropped';
export const getPreviewKeepAggName = (index: number): string => `kept_${index}`;

/**
 * The distinct-trace counts the estimate needs. `kept_<i>` counts the traces that match any
 * of the first `i + 1` keep conditions, so the difference between two neighbours is what a
 * policy adds, and no trace is counted twice.
 */
export function getPreviewAggs({
  keepFilters,
  dropFilters,
}: Pick<PreviewPlan, 'keepFilters' | 'dropFilters'>): Record<
  string,
  AggregationsAggregationContainer
> {
  const aggs: Record<string, AggregationsAggregationContainer> = {
    [PREVIEW_AGG_TOTAL]: distinctTraces(),
  };

  keepFilters.forEach((_, index) => {
    aggs[getPreviewKeepAggName(index)] = distinctTracesMatching(
      keepFilters.slice(0, index + 1).map(({ filter }) => filter)
    );
  });

  if (dropFilters.length > 0) {
    aggs[PREVIEW_AGG_DROPPED] = distinctTracesMatching(dropFilters);
    // With `dropped` and the last `kept_<i>`, this gives the traces that are both kept and dropped.
    if (keepFilters.length > 0) {
      aggs[PREVIEW_AGG_KEPT_OR_DROPPED] = distinctTracesMatching([
        ...keepFilters.map(({ filter }) => filter),
        ...dropFilters,
      ]);
    }
  }

  return aggs;
}
