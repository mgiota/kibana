/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiCallOut,
  EuiEmptyPrompt,
  EuiSkeletonText,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import React from 'react';
import { FETCH_STATUS, useFetcher } from '../../../../hooks/use_fetcher';

export function TailSamplingSettings() {
  const { data, status } = useFetcher(
    (callApmApi) => callApmApi('GET /internal/tail_sampling'),
    [],
    { preservePreviousData: true }
  );

  return (
    <>
      <EuiTitle size="s">
        <h2>
          {i18n.translate('xpack.apm.tailSampling.title', {
            defaultMessage: 'Tail-based sampling',
          })}
        </h2>
      </EuiTitle>
      <EuiSpacer size="s" />
      <EuiText size="s" color="subdued">
        <p>
          {i18n.translate('xpack.apm.tailSampling.intro', {
            defaultMessage:
              'Decide which traces to keep after each trace completes. Applies to traces sent to the managed OTLP endpoint and from Elastic APM agents. Traces collected through Streams sources are not sampled. Service metrics are computed from all traces before sampling.',
          })}
        </p>
      </EuiText>
      <EuiSpacer size="m" />

      {status === FETCH_STATUS.FAILURE ? (
        <EuiCallOut
          announceOnMount
          color="danger"
          iconType="error"
          data-test-subj="apmTailSamplingLoadFailure"
          title={i18n.translate('xpack.apm.tailSampling.loadFailed', {
            defaultMessage: 'The tail-based sampling settings could not be loaded',
          })}
        />
      ) : !data ? (
        <EuiSkeletonText lines={6} />
      ) : !data.saved ? (
        <EuiEmptyPrompt
          data-test-subj="apmTailSamplingEmpty"
          iconType="flask"
          title={
            <h3>
              {i18n.translate('xpack.apm.tailSampling.empty.title', {
                defaultMessage: 'Tail-based sampling is not set up',
              })}
            </h3>
          }
          body={
            <p>
              {i18n.translate('xpack.apm.tailSampling.empty.body', {
                defaultMessage: 'All traces are kept until you add sampling policies.',
              })}
            </p>
          }
        />
      ) : (
        <EuiText size="s" data-test-subj="apmTailSamplingSummary">
          <p>
            {data.enabled
              ? i18n.translate('xpack.apm.tailSampling.summary.enabled', {
                  defaultMessage: 'Tail-based sampling is on with {count} saved policies.',
                  values: { count: data.config.policies.length },
                })
              : i18n.translate('xpack.apm.tailSampling.summary.disabled', {
                  defaultMessage: 'Tail-based sampling is off. {count} saved policies are kept.',
                  values: { count: data.config.policies.length },
                })}
          </p>
        </EuiText>
      )}
    </>
  );
}
