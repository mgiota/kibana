/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { getPreviewChartSeries } from './preview_chart_series';

const bucket = (timestamp: number, errors: number, baseline: number, dropped: number) => ({
  timestamp,
  total: 100,
  kept: errors + baseline,
  dropped,
  keptByPolicy: [
    { policyName: 'keep-errors', kept: errors },
    { policyName: 'keep-slow', kept: 0 },
    { policyName: 'baseline', kept: baseline },
  ],
});

describe('getPreviewChartSeries', () => {
  it('stacks the kept policies, the dropped traces and the rest', () => {
    const series = getPreviewChartSeries([bucket(1, 50, 5, 0), bucket(2, 40, 6, 0)]);
    expect(series.map(({ id }) => id)).toEqual(['kept-keep-errors', 'kept-baseline', 'not-kept']);
    expect(series[0].data).toEqual([
      { x: 1, y: 50 },
      { x: 2, y: 40 },
    ]);
    expect(series[2].data).toEqual([
      { x: 1, y: 45 },
      { x: 2, y: 54 },
    ]);
  });

  it('adds up to the total in every bucket', () => {
    const buckets = [bucket(1, 30, 5, 10), bucket(2, 20, 7, 0)];
    const series = getPreviewChartSeries(buckets);
    buckets.forEach((_, index) => {
      const sum = series.reduce((total, { data }) => total + data[index].y, 0);
      expect(sum).toBe(100);
    });
    expect(series.map(({ kind }) => kind)).toEqual(['kept', 'kept', 'dropped', 'notKept']);
  });

  it('keeps empty buckets, so gaps in the traffic show', () => {
    const empty = { timestamp: 3, total: 0, kept: 0, dropped: 0, keptByPolicy: [] };
    const series = getPreviewChartSeries([bucket(1, 50, 5, 0), empty]);
    expect(series[0].data).toEqual([
      { x: 1, y: 50 },
      { x: 3, y: 0 },
    ]);
  });

  it('has no series when there are no buckets', () => {
    expect(getPreviewChartSeries([])).toEqual([]);
  });
});
