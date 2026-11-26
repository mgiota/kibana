/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import type { TailSamplingPreviewCounts } from '@kbn/apm-api-shared';
import type { PreviewPlan } from './get_preview_query';

export interface PreviewRawCounts {
  // Distinct traces.
  total: number;
  // Traces matching any of the first `i + 1` keep conditions, one entry per keep condition.
  keptUnions: number[];
  // Traces matching a drop condition.
  dropped: number;
  // Traces matching a keep or a drop condition.
  keptOrDropped: number;
}

const atLeastZero = (value: number): number => Math.max(0, value);

/**
 * Turns the distinct-trace counts into what the config would keep. A drop wins over a keep,
 * a trace that matches several keep policies counts for the first one, and the share policy
 * applies to the traces no other policy decided.
 */
export function summarizePreviewCounts(
  { total, keptUnions, dropped, keptOrDropped }: PreviewRawCounts,
  { keepFilters, share }: Pick<PreviewPlan, 'keepFilters' | 'share'>
): TailSamplingPreviewCounts {
  const matchedByKeep = keptUnions.length > 0 ? keptUnions[keptUnions.length - 1] : 0;
  // The counts are approximate, so the differences below are kept within their bounds.
  const droppedInTotal = Math.min(dropped, total);
  const keptByFilters =
    dropped > 0
      ? Math.min(atLeastZero(keptOrDropped - dropped), matchedByKeep)
      : Math.min(matchedByKeep, total);
  // Drops are spread over the keep policies in proportion, as they cannot be told apart.
  const dropFactor = matchedByKeep > 0 ? keptByFilters / matchedByKeep : 0;

  const keptByPolicy = keepFilters.map(({ policyName }, index) => {
    const previous = index === 0 ? 0 : keptUnions[index - 1];
    return {
      policyName,
      kept: Math.round(atLeastZero(keptUnions[index] - previous) * dropFactor),
    };
  });

  const undecided = atLeastZero(total - droppedInTotal - keptByFilters);
  const keptByShare = share ? Math.round((undecided * share.percentage) / 100) : 0;
  if (share) {
    keptByPolicy.push({ policyName: share.policyName, kept: keptByShare });
  }

  return {
    total,
    kept: Math.round(keptByFilters) + keptByShare,
    dropped: droppedInTotal,
    keptByPolicy,
  };
}
