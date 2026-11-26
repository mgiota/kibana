/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { summarizePreviewCounts } from './summarize_preview_counts';

const filter = { match_all: {} };
const keepFilters = [
  { policyName: 'keep-errors', filter },
  { policyName: 'keep-slow', filter },
];
const share = { policyName: 'baseline', percentage: 10 };

describe('summarizePreviewCounts', () => {
  it('counts each trace for the first keep policy that matches it', () => {
    expect(
      summarizePreviewCounts(
        { total: 1000, keptUnions: [50, 80], dropped: 0, keptOrDropped: 0 },
        { keepFilters }
      )
    ).toEqual({
      total: 1000,
      kept: 80,
      dropped: 0,
      keptByPolicy: [
        { policyName: 'keep-errors', kept: 50 },
        { policyName: 'keep-slow', kept: 30 },
      ],
    });
  });

  it('applies the share to the traces no other policy decided', () => {
    expect(
      summarizePreviewCounts(
        { total: 1000, keptUnions: [50, 80], dropped: 0, keptOrDropped: 0 },
        { keepFilters, share }
      )
    ).toEqual({
      total: 1000,
      kept: 172,
      dropped: 0,
      keptByPolicy: [
        { policyName: 'keep-errors', kept: 50 },
        { policyName: 'keep-slow', kept: 30 },
        { policyName: 'baseline', kept: 92 },
      ],
    });
  });

  it('keeps only the share when there is no keep condition', () => {
    expect(
      summarizePreviewCounts(
        { total: 1000, keptUnions: [], dropped: 0, keptOrDropped: 0 },
        { keepFilters: [], share }
      )
    ).toEqual({
      total: 1000,
      kept: 100,
      dropped: 0,
      keptByPolicy: [{ policyName: 'baseline', kept: 100 }],
    });
  });

  it('lets a drop win over a keep', () => {
    // 100 dropped, 80 matched by a keep, 20 of them by both: 160 match either.
    expect(
      summarizePreviewCounts(
        { total: 1000, keptUnions: [50, 80], dropped: 100, keptOrDropped: 160 },
        { keepFilters, share }
      )
    ).toEqual({
      total: 1000,
      kept: 144,
      dropped: 100,
      keptByPolicy: [
        // 60 of the 80 survive the drop, spread in proportion.
        { policyName: 'keep-errors', kept: 38 },
        { policyName: 'keep-slow', kept: 23 },
        // 10% of the 840 that are neither dropped nor kept by a condition.
        { policyName: 'baseline', kept: 84 },
      ],
    });
  });

  it('keeps nothing when there are no traces', () => {
    expect(
      summarizePreviewCounts(
        { total: 0, keptUnions: [0, 0], dropped: 0, keptOrDropped: 0 },
        { keepFilters, share }
      )
    ).toEqual({
      total: 0,
      kept: 0,
      dropped: 0,
      keptByPolicy: [
        { policyName: 'keep-errors', kept: 0 },
        { policyName: 'keep-slow', kept: 0 },
        { policyName: 'baseline', kept: 0 },
      ],
    });
  });

  it('stays within bounds when the approximate counts disagree', () => {
    const summary = summarizePreviewCounts(
      { total: 100, keptUnions: [120], dropped: 130, keptOrDropped: 125 },
      { keepFilters: keepFilters.slice(0, 1), share }
    );
    expect(summary.dropped).toBe(100);
    expect(summary.kept).toBe(0);
    expect(summary.keptByPolicy.every(({ kept }) => kept >= 0)).toBe(true);
  });
});
