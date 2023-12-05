/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React, { useState, useEffect } from 'react';
import { FormattedMessage } from '@kbn/i18n-react';
import { i18n } from '@kbn/i18n';
import { EuiFlexGroup, EuiFlexItem, EuiLink } from '@elastic/eui';
import type { TimeRange } from '@kbn/es-query';
import { CONTEXT_MENU_TRIGGER } from '@kbn/embeddable-plugin/public';
import { IEmbeddable, EmbeddableOutput } from '@kbn/embeddable-plugin/public';
import { ActionExecutionContext } from '@kbn/ui-actions-plugin/public';
import { Subject } from 'rxjs';
import styled from 'styled-components';
import { SloAlertsSummary } from './components/slo_alerts_summary';
import { SloAlertsTable } from './components/slo_alerts_table';
import type { SloItem } from './types';
import { SloEmbeddableDeps } from './slo_alerts_embeddable';
import { SloAlertsEmbeddableInput } from './types';
import { EDIT_SLO_ALERTS_ACTION } from '../../../ui_actions/edit_slo_alerts_panel';
import { paths } from '../../../../common/locators/paths';

interface Props {
  deps: SloEmbeddableDeps;
  slos: SloItem[];
  timeRange: TimeRange;
  embeddable: IEmbeddable<SloAlertsEmbeddableInput, EmbeddableOutput>;
  onRenderComplete?: () => void;
  reloadSubject: Subject<TimeRange | undefined>;
}

export function SloAlertsWrapper({
  embeddable,
  slos,
  deps,
  timeRange: initialTimeRange,
  onRenderComplete,
  reloadSubject,
}: Props) {
  const {
    application: { navigateToUrl },
    http: { basePath },
  } = deps;

  const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange);

  const [lastRefreshTime, setLastRefreshTime] = useState<number | undefined>(undefined);

  useEffect(() => {
    const subs = reloadSubject?.subscribe((nTimeRange) => {
      if (nTimeRange && (nTimeRange.from !== timeRange.from || nTimeRange.to !== timeRange.to)) {
        setTimeRange(nTimeRange);
      }
      setLastRefreshTime(Date.now());
    });
    return () => {
      subs?.unsubscribe();
    };
  }, [reloadSubject, timeRange.from, timeRange.to]);

  useEffect(() => {
    setTimeRange(initialTimeRange);
  }, [initialTimeRange]);

  const [isSummaryLoaded, setIsSummaryLoaded] = useState(false);
  const [isTableLoaded, setIsTableLoaded] = useState(false);
  useEffect(() => {
    if (!onRenderComplete) {
      return;
    }
    if (isSummaryLoaded && isTableLoaded) {
      onRenderComplete();
    }
  }, [isSummaryLoaded, isTableLoaded, onRenderComplete]);
  const handleGoToAlertsClick = () => {
    let kuery = '';
    slos.map((slo, index) => {
      const shouldAddOr = index < slos.length - 1;
      kuery += `(slo.id:"${slo.id}" and slo.instanceId:"${slo.instanceId}")`;
      if (shouldAddOr) {
        kuery += ' or ';
      }
    });
    navigateToUrl(
      `${basePath.prepend(paths.observability.alerts)}?_a=(kuery:'${kuery}',rangeFrom:${
        timeRange.from
      },rangeTo:${timeRange.to})`
    );
  };

  return (
    <Wrapper>
      <EuiFlexGroup justifyContent="flexEnd">
        <EuiFlexItem
          css={`
            align-items: flex-end;
          `}
        >
          <EuiLink
            onClick={() => {
              const trigger = deps.uiActions.getTrigger(CONTEXT_MENU_TRIGGER);
              deps.uiActions.getAction(EDIT_SLO_ALERTS_ACTION).execute({
                trigger,
                embeddable,
              } as ActionExecutionContext);
            }}
            data-test-subj="o11ySloAlertsWrapperSlOsIncludedLink"
          >
            {i18n.translate('xpack.observability.sloAlertsWrapper.sLOsIncludedFlexItemLabel', {
              defaultMessage: '{numOfSlos} SLOs included',
              values: { numOfSlos: slos.length },
            })}
          </EuiLink>
        </EuiFlexItem>
        <EuiFlexItem
          grow={false}
          css={`
            margin-right: 35px;
          `}
        >
          <EuiLink
            data-test-subj="o11ySloAlertsWrapperGoToAlertsLink"
            onClick={handleGoToAlertsClick}
          >
            <FormattedMessage
              id="xpack.observability.sloAlertsWrapper.goToAlertsFlexItemLabel"
              defaultMessage="Go to alerts"
            />
          </EuiLink>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiFlexGroup direction="column" style={{ margin: '10px' }} responsive={true}>
        <EuiFlexItem>
          <SloAlertsSummary
            slos={slos}
            deps={deps}
            timeRange={timeRange}
            onLoaded={() => setIsSummaryLoaded(true)}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={true}>
          <SloAlertsTable
            slos={slos}
            deps={deps}
            timeRange={timeRange}
            onLoaded={() => setIsTableLoaded(true)}
            lastReloadRequestTime={lastRefreshTime}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  width: 100%;
`;
