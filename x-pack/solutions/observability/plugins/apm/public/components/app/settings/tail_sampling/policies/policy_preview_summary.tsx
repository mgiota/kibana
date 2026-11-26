/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiSkeletonText,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import type { TailSamplingPolicy } from '@kbn/apm-api-shared';
import React from 'react';
import { isPending } from '../../../../../hooks/use_fetcher';
import { PolicyPreviewChart } from './policy_preview_chart';
import { getKeptPercentage, getTopKeepingPolicy, usePolicyPreview } from './use_policy_preview';

// From this share on, sampling saves little, and the page says so.
const KEEPS_ALMOST_ALL_PERCENTAGE = 95;

interface Props {
  policies: TailSamplingPolicy[];
  // False while the list is empty or has local errors. Nothing is estimated then.
  isEnabled: boolean;
}

/** A panel above the list: how much of the last hour's traces the list would keep. */
export function PolicyPreviewSummary({ policies, isEnabled }: Props) {
  const { data, status } = usePolicyPreview(policies, isEnabled);

  if (!isEnabled) {
    return null;
  }

  if (!data) {
    // A failed estimate shows nothing. The page works without it.
    return isPending(status) ? (
      <EuiPanel color="primary" hasBorder paddingSize="m">
        <EuiSkeletonText lines={2} />
      </EuiPanel>
    ) : null;
  }

  const percentage = getKeptPercentage(data);
  const topPolicy = getTopKeepingPolicy(data);

  const keepsAlmostAll = percentage !== undefined && percentage >= KEEPS_ALMOST_ALL_PERCENTAGE;

  return (
    <EuiPanel
      color={keepsAlmostAll ? 'warning' : 'primary'}
      hasBorder
      paddingSize="m"
      data-test-subj="apmTailSamplingPreviewSummary"
    >
      {percentage === undefined ? (
        <EuiText size="s">
          {i18n.translate('xpack.apm.tailSampling.preview.noTraces', {
            defaultMessage: 'No traces in the last hour, so there is no estimate.',
          })}
        </EuiText>
      ) : (
        <EuiFlexGroup alignItems="center" gutterSize="l" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiTitle size="l">
              <span data-test-subj="apmTailSamplingPreviewPercentage">{`${percentage}%`}</span>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText size="s">
              <strong>
                {i18n.translate('xpack.apm.tailSampling.preview.title', {
                  defaultMessage: 'Estimated share of traces kept',
                })}
              </strong>
            </EuiText>
            <EuiText size="s">
              {i18n.translate('xpack.apm.tailSampling.preview.counts', {
                defaultMessage:
                  '{kept, number} of {total, number} traces from the last hour would be kept.',
                values: { kept: data.kept, total: data.total },
              })}
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      )}
      {keepsAlmostAll && (
        <>
          <EuiSpacer size="s" />
          <EuiText size="s" data-test-subj="apmTailSamplingPreviewKeepsAlmostAll">
            {topPolicy
              ? i18n.translate('xpack.apm.tailSampling.preview.keepsAlmostAllByPolicy', {
                  defaultMessage:
                    'This keeps almost all your traces, so sampling would save little. The largest part is kept by {policyName}.',
                  values: { policyName: topPolicy.policyName },
                })
              : i18n.translate('xpack.apm.tailSampling.preview.keepsAlmostAll', {
                  defaultMessage:
                    'This keeps almost all your traces, so sampling would save little.',
                })}
          </EuiText>
        </>
      )}
      {percentage !== undefined && (
        <>
          <EuiSpacer size="m" />
          <PolicyPreviewChart buckets={data.buckets} start={data.start} end={data.end} />
        </>
      )}
      {percentage !== undefined && data.basis === 'kept_traces' && (
        <EuiText size="xs" color="subdued">
          {i18n.translate('xpack.apm.tailSampling.preview.keptTracesBasis', {
            defaultMessage:
              'Sampling is on, so only kept traces are stored. The estimate is based on those.',
          })}
        </EuiText>
      )}
      {data.unsupportedPolicies.length > 0 && (
        <EuiText size="xs" color="subdued">
          {i18n.translate('xpack.apm.tailSampling.preview.unsupported', {
            defaultMessage: 'Not counted in the estimate: {names}.',
            values: { names: data.unsupportedPolicies.join(', ') },
          })}
        </EuiText>
      )}
    </EuiPanel>
  );
}
