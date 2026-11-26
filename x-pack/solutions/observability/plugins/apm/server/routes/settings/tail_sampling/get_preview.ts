/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import type { APMEventClient } from '@kbn/apm-data-access-plugin/server';
import type {
  TailSamplingPolicy,
  TailSamplingPreviewBucket,
  TailSamplingPreviewCounts,
} from '@kbn/apm-api-shared';
import { ProcessorEvent } from '@kbn/observability-plugin/common';
import { rangeQuery } from '@kbn/observability-plugin/server';
import { PROCESSOR_EVENT } from '../../../../common/es_fields/apm';
import {
  getPreviewAggs,
  getPreviewKeepAggName,
  getPreviewPlan,
  PREVIEW_AGG_DROPPED,
  PREVIEW_AGG_KEPT_OR_DROPPED,
  PREVIEW_AGG_TOTAL,
  type PreviewPlan,
} from './get_preview_query';
import { summarizePreviewCounts, type PreviewRawCounts } from './summarize_preview_counts';

export const PREVIEW_PERIOD_MS = 60 * 60 * 1000;
const PREVIEW_BUCKET_INTERVAL = '5m';
const PREVIEW_AGG_BUCKETS = 'buckets';

// The aggregation names depend on the policies, so the response is read by name and checked.
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readValue = (agg: unknown): number | undefined =>
  isRecord(agg) && typeof agg.value === 'number' ? agg.value : undefined;

// A count is either a cardinality, or a filter with a `traces` cardinality inside.
const readCount = (aggs: Record<string, unknown>, name: string): number => {
  const agg = aggs[name];
  return readValue(agg) ?? (isRecord(agg) ? readValue(agg.traces) : undefined) ?? 0;
};

const readRawCounts = (
  aggs: Record<string, unknown>,
  { keepFilters }: PreviewPlan
): PreviewRawCounts => ({
  total: readCount(aggs, PREVIEW_AGG_TOTAL),
  keptUnions: keepFilters.map((_, index) => readCount(aggs, getPreviewKeepAggName(index))),
  dropped: readCount(aggs, PREVIEW_AGG_DROPPED),
  keptOrDropped: readCount(aggs, PREVIEW_AGG_KEPT_OR_DROPPED),
});

export interface TailSamplingPreview extends TailSamplingPreviewCounts {
  start: number;
  end: number;
  buckets: TailSamplingPreviewBucket[];
  unsupportedPolicies: string[];
}

/** Counts, from the stored traces of the last hour, what the policies would keep. */
export async function getTailSamplingPreview({
  apmEventClient,
  policies,
  end,
}: {
  apmEventClient: APMEventClient;
  policies: TailSamplingPolicy[];
  end: number;
}): Promise<TailSamplingPreview> {
  const start = end - PREVIEW_PERIOD_MS;
  const plan = getPreviewPlan(policies);
  const aggs = getPreviewAggs(plan);

  const response = await apmEventClient.search(
    'get_tail_sampling_preview',
    {
      apm: { events: [ProcessorEvent.span, ProcessorEvent.transaction] },
      track_total_hits: false,
      size: 0,
      query: {
        bool: {
          filter: rangeQuery(start, end),
          // OpenTelemetry documents that were not processed by APM have no `processor.event`.
          should: [
            { terms: { [PROCESSOR_EVENT]: [ProcessorEvent.span, ProcessorEvent.transaction] } },
            { bool: { must_not: { exists: { field: PROCESSOR_EVENT } } } },
          ],
          minimum_should_match: 1,
        },
      },
      aggs: {
        ...aggs,
        [PREVIEW_AGG_BUCKETS]: {
          date_histogram: {
            field: '@timestamp',
            fixed_interval: PREVIEW_BUCKET_INTERVAL,
            min_doc_count: 0,
            extended_bounds: { min: start, max: end },
          },
          aggs,
        },
      },
    },
    { skipProcessorEventFilter: true }
  );

  const allAggs: Record<string, unknown> = isRecord(response.aggregations)
    ? response.aggregations
    : {};
  const histogram = allAggs[PREVIEW_AGG_BUCKETS];
  const bucketAggs =
    isRecord(histogram) && Array.isArray(histogram.buckets)
      ? histogram.buckets.filter(isRecord)
      : [];

  return {
    start,
    end,
    ...summarizePreviewCounts(readRawCounts(allAggs, plan), plan),
    buckets: bucketAggs.map((bucket) => ({
      timestamp: typeof bucket.key === 'number' ? bucket.key : 0,
      ...summarizePreviewCounts(readRawCounts(bucket, plan), plan),
    })),
    unsupportedPolicies: plan.unsupportedPolicies,
  };
}
