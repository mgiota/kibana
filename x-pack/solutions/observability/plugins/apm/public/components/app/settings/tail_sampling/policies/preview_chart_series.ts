/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { TailSamplingPreviewBucket } from '@kbn/apm-api-shared';

export type PreviewSeriesKind = 'kept' | 'dropped' | 'notKept';

export interface PreviewChartSeries {
  id: string;
  kind: PreviewSeriesKind;
  // The policy name for a kept series. Undefined for the dropped and not-kept series.
  policyName?: string;
  data: Array<{ x: number; y: number }>;
}

/**
 * One stacked series per keep policy, then the dropped traces, then the rest. Every bucket
 * adds up to its total. Series that are zero in every bucket are left out.
 */
export function getPreviewChartSeries(buckets: TailSamplingPreviewBucket[]): PreviewChartSeries[] {
  const policyNames = Array.from(
    new Set(buckets.flatMap(({ keptByPolicy }) => keptByPolicy.map(({ policyName }) => policyName)))
  );

  const keptSeries: PreviewChartSeries[] = policyNames.map((policyName) => ({
    id: `kept-${policyName}`,
    kind: 'kept',
    policyName,
    data: buckets.map(({ timestamp, keptByPolicy }) => ({
      x: timestamp,
      y: keptByPolicy.find((policy) => policy.policyName === policyName)?.kept ?? 0,
    })),
  }));

  const droppedSeries: PreviewChartSeries = {
    id: 'dropped',
    kind: 'dropped',
    data: buckets.map(({ timestamp, dropped }) => ({ x: timestamp, y: dropped })),
  };

  const notKeptSeries: PreviewChartSeries = {
    id: 'not-kept',
    kind: 'notKept',
    data: buckets.map(({ timestamp, total, kept, dropped }) => ({
      x: timestamp,
      y: Math.max(0, total - kept - dropped),
    })),
  };

  return [...keptSeries, droppedSeries, notKeptSeries].filter(({ data }) =>
    data.some(({ y }) => y > 0)
  );
}
