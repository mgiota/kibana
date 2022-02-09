/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useState, useEffect } from 'react';
import { EuiBasicTable, EuiFlexGroup, EuiFlexItem, EuiButtonEmpty } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { usePluginContext } from '../../hooks/use_plugin_context';
import { useKibana } from '../../utils/kibana_react';

import { loadAlerts as loadRules } from '../../../../triggers_actions_ui/public';

interface RuleState {
  data: [];
}
export function RulesPage() {
  const { core, ObservabilityPageTemplate } = usePluginContext();
  const { docLinks } = useKibana().services;
  const {
    http,
    notifications: { toasts },
  } = core;
  const [rules, setRules] = useState<RuleState>({ data: [] });

  async function loadObservabilityRules() {
    try {
      const response = await loadRules({
        http,
        page: { index: 0, size: 10 },
        typesFilter: [
          'xpack.uptime.alerts.monitorStatus',
          'xpack.uptime.alerts.tls',
          'xpack.uptime.alerts.tlsCertificate',
          'xpack.uptime.alerts.durationAnomaly',
          'apm.error_rate',
          'apm.transaction_error_rate',
          'apm.transaction_duration',
          'apm.transaction_duration_anomaly',
          'metrics.alert.inventory.threshold',
          'metrics.alert.threshold',
          'logs.alert.document.count',
        ],
      });
      setRules({
        data: response.data as any,
      });
    } catch (_e) {
      toasts.addDanger({
        title: i18n.translate('xpack.observability.rules.loadError', {
          defaultMessage: 'Unable to load rules',
        }),
      });
    }
  }

  useEffect(() => {
    loadObservabilityRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const rulesTableColumns = [
    {
      field: 'name',
      name: 'Rule Name',
    },
  ];
  return (
    <ObservabilityPageTemplate
      pageHeader={{
        pageTitle: (
          <>{i18n.translate('xpack.observability.rulesTitle', { defaultMessage: 'Rules' })} </>
        ),
        rightSideItems: [
          <EuiButtonEmpty
            href={docLinks.links.alerting.guide}
            target="_blank"
            iconType="help"
            data-test-subj="documentationLink"
          >
            <FormattedMessage
              id="xpack.observability.rules.docsLinkText"
              defaultMessage="Documentation"
            />
          </EuiButtonEmpty>,
        ],
      }}
    >
      <EuiFlexGroup direction="column" gutterSize="s">
        <EuiFlexItem>
          <EuiBasicTable
            items={rules.data}
            columns={rulesTableColumns}
            selection={{ selectable: () => true }}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </ObservabilityPageTemplate>
  );
}
