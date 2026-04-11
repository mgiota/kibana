/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiBadge, EuiFlexItem, EuiToolTip } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import type { MouseEvent } from 'react';
import React from 'react';
import type { RemoteMonitorInfo } from '../../../../../../common/runtime_types/remote';
import { useKibanaSpace } from '../../../../../hooks/use_kibana_space';
import { createRemoteMonitorDetailsUrl } from '../../../utils/remote_monitor_urls';

export function MonitorRemoteBadge({
  remote,
  configId,
}: {
  remote?: RemoteMonitorInfo;
  configId: string;
}) {
  const { space } = useKibanaSpace();

  if (!remote) {
    return null;
  }

  const detailsUrl = createRemoteMonitorDetailsUrl(remote, configId, space?.id);

  return (
    <EuiFlexItem grow={false}>
      <EuiToolTip content={remote.kibanaUrl} title={remote.remoteName}>
        <EuiBadge
          color="default"
          href={detailsUrl}
          target="_blank"
          data-test-subj="syntheticsRemoteMonitorBadge"
          onMouseDown={(e: MouseEvent) => {
            e.stopPropagation();
          }}
        >
          {i18n.translate('xpack.synthetics.remoteBadge.label', {
            defaultMessage: 'Remote',
          })}
        </EuiBadge>
      </EuiToolTip>
    </EuiFlexItem>
  );
}
