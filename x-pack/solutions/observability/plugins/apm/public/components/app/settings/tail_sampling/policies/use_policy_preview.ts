/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  TAIL_SAMPLING_PROCESSOR,
  type TailSamplingPolicy,
  type TailSamplingPreviewCounts,
  type TailSamplingPreviewPolicyCount,
} from '@kbn/apm-api-shared';
import { useFetcher } from '../../../../../hooks/use_fetcher';

/**
 * Estimates what the policies would keep, from the stored traces. Pass `isEnabled: false`
 * while the policies are empty or invalid, so nothing is fetched.
 */
export function usePolicyPreview(policies: TailSamplingPolicy[], isEnabled: boolean) {
  return useFetcher(
    (callApmApi) => {
      if (!isEnabled) {
        return undefined;
      }
      return callApmApi('POST /internal/tail_sampling/_preview', {
        params: { body: { processor: TAIL_SAMPLING_PROCESSOR, config: { policies } } },
      });
    },
    [policies, isEnabled],
    // The estimate is an extra. A failure leaves the page as it is, without a toast.
    { preservePreviousData: false, showToastOnError: false, skipTimeRangeRefreshUpdate: true }
  );
}

/** The share of traces kept, as a whole percentage. Undefined when there are no traces. */
export const getKeptPercentage = ({
  total,
  kept,
}: Pick<TailSamplingPreviewCounts, 'total' | 'kept'>): number | undefined =>
  total > 0 ? Math.min(100, Math.round((kept / total) * 100)) : undefined;

/** The policy that keeps the most traces. Undefined when no policy keeps any. */
export const getTopKeepingPolicy = ({
  keptByPolicy,
}: Pick<TailSamplingPreviewCounts, 'keptByPolicy'>): TailSamplingPreviewPolicyCount | undefined =>
  keptByPolicy.reduce<TailSamplingPreviewPolicyCount | undefined>(
    (top, policy) => (policy.kept > (top?.kept ?? 0) ? policy : top),
    undefined
  );
