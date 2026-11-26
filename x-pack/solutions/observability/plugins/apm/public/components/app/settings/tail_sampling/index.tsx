/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiAccordion,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSkeletonText,
  EuiSpacer,
  EuiText,
  EuiTitle,
  useGeneratedHtmlId,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import type { TailSamplingResponse } from '@kbn/apm-api-shared';
import React, { useEffect, useState } from 'react';
import { FETCH_STATUS, useFetcher } from '../../../../hooks/use_fetcher';
import { PoliciesTab } from './policies/policies_tab';
import { SamplingSwitch } from './sampling_switch';

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

  const scopeAccordionId = useGeneratedHtmlId({ prefix: 'apmTailSamplingScope' });

  return (
    <>
      <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" gutterSize="m">
        <EuiFlexItem grow={false}>
          <EuiTitle size="s">
            <h2>
              {i18n.translate('xpack.apm.tailSampling.title', {
                defaultMessage: 'Tail-based sampling',
              })}
            </h2>
          </EuiTitle>
        </EuiFlexItem>
        {latest && status !== FETCH_STATUS.FAILURE && (
          <EuiFlexItem grow={false}>
            <SamplingSwitch saved={latest} onChange={setLatest} />
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
      <EuiSpacer size="s" />
      <EuiText size="s" color="subdued">
        <p>
          {i18n.translate('xpack.apm.tailSampling.intro', {
            defaultMessage:
              'Keep the traces that matter and drop the rest. Each trace is judged once it is complete, so you can decide by its errors, duration or attributes.',
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
          <EuiAccordion
            id={scopeAccordionId}
            data-test-subj="apmTailSamplingScope"
            buttonContent={i18n.translate('xpack.apm.tailSampling.scope.title', {
              defaultMessage: 'What is sampled',
            })}
            paddingSize="s"
          >
            <EuiText size="s" color="subdued">
              <ul>
                <li>
                  {i18n.translate('xpack.apm.tailSampling.scope.applies', {
                    defaultMessage:
                      'Traces sent to the managed OTLP endpoint and from Elastic APM agents are sampled.',
                  })}
                </li>
                <li>
                  {i18n.translate('xpack.apm.tailSampling.scope.streams', {
                    defaultMessage: 'Traces collected through Streams sources are not sampled.',
                  })}
                </li>
                <li>
                  {i18n.translate('xpack.apm.tailSampling.scope.metrics', {
                    defaultMessage:
                      'Service metrics are computed from all traces, before sampling.',
                  })}
                </li>
              </ul>
            </EuiText>
          </EuiAccordion>
          <EuiSpacer size="l" />
          <PoliciesTab saved={latest} onSaved={setLatest} />
        </>
      )}
    </>
  );
}
