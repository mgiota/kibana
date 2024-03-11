/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo } from 'react';
import { EuiFlyout, EuiFlyoutHeader, EuiFlyoutProps } from '@elastic/eui';
import { ALERT_UUID } from '@kbn/rule-data-utils';

import { EcsFieldsResponse } from '@kbn/rule-registry-plugin/common/search_strategy';
import { ObservabilityRuleTypeRegistry, TopAlert } from '@kbn/observability-plugin/public';
import { parseAlert } from '../alerts_table/common/parse_alert';
import { AlertsFlyoutHeader } from './alerts_flyout_header';
import { AlertsFlyoutBody } from './alerts_flyout_body';
import { AlertsFlyoutFooter } from './alerts_flyout_footer';

type AlertsFlyoutProps = {
  alert?: TopAlert;
  rawAlert?: EcsFieldsResponse;
  alerts?: Array<Record<string, unknown>>;
  isInApp?: boolean;
  observabilityRuleTypeRegistry: ObservabilityRuleTypeRegistry;
  selectedAlertId?: string;
} & EuiFlyoutProps;

export function AlertsFlyout({
  alert,
  rawAlert,
  alerts,
  isInApp = false,
  observabilityRuleTypeRegistry,
  onClose,
  selectedAlertId,
}: AlertsFlyoutProps) {
  const decoratedAlerts = useMemo(() => {
    const parseObservabilityAlert = parseAlert(observabilityRuleTypeRegistry);
    return (alerts ?? []).map(parseObservabilityAlert);
  }, [alerts, observabilityRuleTypeRegistry]);

  let alertData = alert;
  if (!alertData) {
    alertData = decoratedAlerts?.find((a) => a.fields[ALERT_UUID] === selectedAlertId) as TopAlert;
  }
  if (!alertData || !rawAlert) {
    return null;
  }

  return (
    <EuiFlyout className="oblt__flyout" onClose={onClose} size="m" data-test-subj="alertsFlyout">
      <EuiFlyoutHeader hasBorder>
        <AlertsFlyoutHeader alert={alertData} />
      </EuiFlyoutHeader>
      <AlertsFlyoutBody alert={alertData} rawAlert={rawAlert} />
      <AlertsFlyoutFooter alert={alertData} isInApp={isInApp} />
    </EuiFlyout>
  );
}

// eslint-disable-next-line import/no-default-export
export default AlertsFlyout;
