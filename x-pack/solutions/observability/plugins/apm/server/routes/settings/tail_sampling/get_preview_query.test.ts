/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import type { TailSamplingPolicy } from '@kbn/apm-api-shared';
import { getPreviewAggs, getPreviewPlan, MAX_PREVIEW_KEEP_FILTERS } from './get_preview_query';

const keepErrors: TailSamplingPolicy = {
  name: 'keep-errors',
  type: 'status_code',
  status_code: { status_codes: ['ERROR'] },
};
const keepSlow: TailSamplingPolicy = {
  name: 'keep-slow',
  type: 'latency',
  latency: { threshold_ms: 1000 },
};
const baseline: TailSamplingPolicy = {
  name: 'baseline',
  type: 'probabilistic',
  probabilistic: { sampling_percentage: 10 },
};
const dropHealth: TailSamplingPolicy = {
  name: 'drop-health-checks',
  type: 'drop',
  drop: {
    drop_sub_policy: [
      {
        name: 'drop-health-checks-match',
        type: 'string_attribute',
        string_attribute: { key: 'url.path', values: ['/healthz'] },
      },
    ],
  },
};

describe('getPreviewPlan', () => {
  it('sorts the policies of a starter set', () => {
    const plan = getPreviewPlan([keepErrors, keepSlow, baseline]);
    expect(plan.keepFilters.map(({ policyName }) => policyName)).toEqual([
      'keep-errors',
      'keep-slow',
    ]);
    expect(plan.dropFilters).toEqual([]);
    expect(plan.share).toEqual({ policyName: 'baseline', percentage: 10 });
    expect(plan.unsupportedPolicies).toEqual([]);
  });

  it('matches errors in classic APM and OpenTelemetry documents', () => {
    const [{ filter }] = getPreviewPlan([keepErrors]).keepFilters;
    expect(filter).toEqual({
      bool: {
        should: [
          { terms: { 'event.outcome': ['failure'] } },
          { terms: { 'status.code': ['Error'] } },
        ],
        minimum_should_match: 1,
      },
    });
  });

  it('matches slow root documents, in microseconds and in nanoseconds', () => {
    const [{ filter }] = getPreviewPlan([
      { name: 'mid', type: 'latency', latency: { threshold_ms: 500, upper_threshold_ms: 2000 } },
    ]).keepFilters;
    expect(filter).toEqual({
      bool: {
        must_not: [{ exists: { field: 'parent.id' } }],
        filter: [
          {
            bool: {
              should: [
                { range: { 'transaction.duration.us': { gte: 500000, lte: 2000000 } } },
                { range: { duration: { gte: 500000000, lte: 2000000000 } } },
              ],
              minimum_should_match: 1,
            },
          },
        ],
      },
    });
  });

  it('looks for an attribute where each data shape stores it', () => {
    const [{ filter }] = getPreviewPlan([
      {
        name: 'keep-top-customers',
        type: 'string_attribute',
        string_attribute: { key: 'customer.tier', values: ['enterprise', 'vip'] },
      },
    ]).keepFilters;
    expect(filter).toEqual({
      bool: {
        should: [
          { terms: { 'customer.tier': ['enterprise', 'vip'] } },
          { terms: { 'attributes.customer.tier': ['enterprise', 'vip'] } },
          { terms: { 'resource.attributes.customer.tier': ['enterprise', 'vip'] } },
          { terms: { 'labels.customer_tier': ['enterprise', 'vip'] } },
        ],
        minimum_should_match: 1,
      },
    });
  });

  it('puts the condition of a drop policy with the drops', () => {
    const plan = getPreviewPlan([dropHealth, keepErrors]);
    expect(plan.dropFilters).toHaveLength(1);
    expect(plan.keepFilters.map(({ policyName }) => policyName)).toEqual(['keep-errors']);
  });

  it('uses the largest share when there are several', () => {
    const plan = getPreviewPlan([
      baseline,
      { name: 'more', type: 'probabilistic', probabilistic: { sampling_percentage: 25 } },
    ]);
    expect(plan.share).toEqual({ policyName: 'more', percentage: 25 });
  });

  it('names the policies it cannot count', () => {
    const plan = getPreviewPlan([
      { name: 'always', type: 'always_sample' },
      {
        name: 'regex',
        type: 'string_attribute',
        string_attribute: { key: 'url.path', values: ['/health.*'], enabled_regex_matching: true },
      },
      {
        name: 'drop-two',
        type: 'drop',
        drop: { drop_sub_policy: [keepErrors, keepSlow] },
      },
    ]);
    expect(plan.unsupportedPolicies).toEqual(['always', 'regex', 'drop-two']);
    expect(plan.keepFilters).toEqual([]);
    expect(plan.dropFilters).toEqual([]);
  });

  it('leaves out keep conditions past the limit', () => {
    const many = Array.from({ length: MAX_PREVIEW_KEEP_FILTERS + 2 }, (_, index) => ({
      ...keepErrors,
      name: `keep-${index}`,
    }));
    const plan = getPreviewPlan(many);
    expect(plan.keepFilters).toHaveLength(MAX_PREVIEW_KEEP_FILTERS);
    expect(plan.unsupportedPolicies).toEqual([
      `keep-${MAX_PREVIEW_KEEP_FILTERS}`,
      `keep-${MAX_PREVIEW_KEEP_FILTERS + 1}`,
    ]);
  });
});

describe('getPreviewAggs', () => {
  it('counts the total only when there is nothing to match', () => {
    expect(Object.keys(getPreviewAggs(getPreviewPlan([baseline])))).toEqual(['total']);
  });

  it('adds one growing union per keep condition', () => {
    const plan = getPreviewPlan([keepErrors, keepSlow, baseline]);
    const aggs = getPreviewAggs(plan);
    expect(Object.keys(aggs)).toEqual(['total', 'kept_0', 'kept_1']);
    expect(aggs.kept_0.filter).toEqual({
      bool: { should: [plan.keepFilters[0].filter], minimum_should_match: 1 },
    });
    expect(aggs.kept_1.filter).toEqual({
      bool: {
        should: [plan.keepFilters[0].filter, plan.keepFilters[1].filter],
        minimum_should_match: 1,
      },
    });
  });

  it('adds the drop counts when a drop policy is present', () => {
    const aggs = getPreviewAggs(getPreviewPlan([dropHealth, keepErrors]));
    expect(Object.keys(aggs)).toEqual(['total', 'kept_0', 'dropped', 'kept_or_dropped']);
  });

  it('skips the overlap count when nothing is kept by a condition', () => {
    const aggs = getPreviewAggs(getPreviewPlan([dropHealth, baseline]));
    expect(Object.keys(aggs)).toEqual(['total', 'dropped']);
  });
});
