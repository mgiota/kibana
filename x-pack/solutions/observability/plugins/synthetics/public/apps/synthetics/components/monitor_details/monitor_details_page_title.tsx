/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { useParams } from 'react-router-dom';
import { MonitorSelector } from './monitor_selector/monitor_selector';
import { useSelectedMonitor } from './hooks/use_selected_monitor';
import { useMonitorRemoteInfo } from './hooks/use_monitor_remote_info';
import { MonitorRemoteBadge } from '../common/components/monitor_remote_badge';

export const MonitorDetailsPageTitle = () => {
  const { monitorId } = useParams<{ monitorId: string }>();
  const { monitor } = useSelectedMonitor();
  const remoteInfo = useMonitorRemoteInfo(monitorId);

  return (
    <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
      <EuiFlexItem grow={false} data-test-subj="monitorNameTitle">
        {monitor?.name}
      </EuiFlexItem>
      {remoteInfo && <MonitorRemoteBadge remote={remoteInfo} configId={monitorId} />}
      <EuiFlexItem>
        <MonitorSelector />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
