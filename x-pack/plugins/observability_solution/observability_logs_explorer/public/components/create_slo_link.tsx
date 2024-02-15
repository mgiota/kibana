/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiHeaderLink } from '@elastic/eui';
import { hydrateDatasetSelection } from '@kbn/logs-explorer-plugin/common';
import { MatchedStateFromActor } from '@kbn/xstate-utils';
import React, { useMemo, useState } from 'react';
import { ObservabilityPublicStart } from '@kbn/observability-plugin/public';
import { useActor } from '@xstate/react';
import { createSLoLabel } from '../../common/translations';
import {
  ObservabilityLogsExplorerService,
  useObservabilityLogsExplorerPageStateContext,
} from '../state_machines/observability_logs_explorer/src';

type InitializedPageState = MatchedStateFromActor<
  ObservabilityLogsExplorerService,
  { initialized: 'validLogsExplorerState' }
>;

export const CreateSloLinkForValidState = React.memo(
  ({
    observability: { getCreateSLOFlyout: CreateSloFlyout },
  }: {
    observability: ObservabilityPublicStart;
  }) => {
    const [pageState] = useActor(useObservabilityLogsExplorerPageStateContext());

    const {
      context: { logsExplorerState },
    } = pageState as InitializedPageState;

    const [isCreateFlyoutOpen, setCreateSLOFlyoutOpen] = useState(false);

    const sloParams = useMemo(() => {
      if (!logsExplorerState)
        return {
          indicator: {
            type: 'sli.kql.custom' as const,
            params: {},
          },
        };
      const dataView = hydrateDatasetSelection(logsExplorerState.datasetSelection).toDataviewSpec();
      const query =
        logsExplorerState?.query && 'query' in logsExplorerState.query
          ? String(logsExplorerState.query.query)
          : undefined;
      const filters = logsExplorerState?.filters ?? [];
      return {
        indicator: {
          type: 'sli.kql.custom' as const,
          params: {
            index: dataView.title,
            timestampField: dataView?.timeFieldName,
            good:
              filters.length > 0
                ? {
                    kqlQuery: query,
                    filters,
                  }
                : query,
          },
        },
        groupBy: logsExplorerState.chart.breakdownField ?? undefined,
      };
    }, [logsExplorerState]);

    return (
      <>
        <EuiHeaderLink
          color="primary"
          onClick={() => {
            setCreateSLOFlyoutOpen(true);
          }}
          iconType="visGauge"
        >
          {createSLoLabel}
        </EuiHeaderLink>
        {isCreateFlyoutOpen && (
          <CreateSloFlyout
            onClose={() => setCreateSLOFlyoutOpen(false)}
            initialValues={sloParams}
          />
        )}
      </>
    );
  }
);
