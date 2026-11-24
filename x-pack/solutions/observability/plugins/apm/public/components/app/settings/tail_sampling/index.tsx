/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiCallOut,
  EuiHealth,
  EuiSkeletonText,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import type { TailSamplingResponse } from '@kbn/apm-api-shared';
import React, { useEffect, useState } from 'react';
import { FETCH_STATUS, useFetcher } from '../../../../hooks/use_fetcher';
import { PoliciesTab } from './policies/policies_tab';

export function TailSamplingSettings() {
  const [latest, setLatest] = useState<TailSamplingResponse>();
  const { data, status } = useFetcher(
    (callApmApi) => callApmApi('GET /internal/tail_sampling'),
    [],
    // The settings are not time-based, so a time range refresh must not refetch them.
    { preservePreviousData: true, skipTimeRangeRefreshUpdate: true }
  );

  useEffect(() => {
    if (data) {
      setLatest(data);
    }
  }, [data]);

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
      ) : !latest ? (
        <EuiSkeletonText lines={6} />
      ) : (
        <>
          {latest.saved && (
            <>
              {latest.enabled ? (
                <EuiHealth color="success" data-test-subj="apmTailSamplingSummary">
                  {i18n.translate('xpack.apm.tailSampling.summary.enabled', {
                    defaultMessage:
                      'On: {count, plural, one {# saved policy is} other {# saved policies are}} applied.',
                    values: { count: latest.config.policies.length },
                  })}
                </EuiHealth>
              ) : (
                <EuiCallOut
                  size="s"
                  color="warning"
                  iconType="warning"
                  data-test-subj="apmTailSamplingSummary"
                  title={i18n.translate('xpack.apm.tailSampling.summary.disabled.title', {
                    defaultMessage: 'Tail-based sampling is off',
                  })}
                >
                  {i18n.translate('xpack.apm.tailSampling.summary.disabled.body', {
                    defaultMessage:
                      'All traces are kept. {count, plural, one {The saved policy is} other {The # saved policies are}} not applied. Enable sampling to turn it on again.',
                    values: { count: latest.config.policies.length },
                  })}
                </EuiCallOut>
              )}
              <EuiSpacer size="m" />
            </>
          )}
          <PoliciesTab saved={latest} onSaved={setLatest} />
        </>
      )}
    </>
  );
}
