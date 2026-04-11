/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiButton, EuiCallOut, EuiLink } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import React from 'react';
import type { RemoteMonitorInfo } from '../../../../../../common/runtime_types/remote';
import { useKibanaSpace } from '../../../../../hooks/use_kibana_space';
import { createRemoteMonitorDetailsUrl } from '../../../utils/remote_monitor_urls';

export function MonitorRemoteCallout({
  remote,
  configId,
}: {
  remote: RemoteMonitorInfo;
  configId: string;
}) {
  const { space } = useKibanaSpace();
  const detailsUrl = createRemoteMonitorDetailsUrl(remote, configId, space?.id);

  return (
    <EuiCallOut
      title={i18n.translate('xpack.synthetics.monitorDetails.remoteCallout.title', {
        defaultMessage: 'Remote monitor',
      })}
      data-test-subj="syntheticsRemoteMonitorCallout"
    >
      <p>
        <FormattedMessage
          id="xpack.synthetics.monitorDetails.remoteCallout.description"
          defaultMessage="This is a remote monitor fetched from the remote cluster: {remoteName} with Kibana URL {kibanaUrl}. Configuration changes must be made on the remote Kibana instance."
          values={{
            remoteName: <strong>{remote.remoteName}</strong>,
            kibanaUrl: (
              <EuiLink
                data-test-subj="syntheticsRemoteMonitorCalloutKibanaLink"
                href={remote.kibanaUrl}
                target="_blank"
              >
                {remote.kibanaUrl}
              </EuiLink>
            ),
          }}
        />
      </p>
      {detailsUrl && (
        <EuiButton
          data-test-subj="syntheticsRemoteMonitorCalloutDetailsButton"
          href={detailsUrl}
          color="primary"
          target="_blank"
          iconType="external"
          iconSide="right"
        >
          {i18n.translate('xpack.synthetics.monitorDetails.remoteCallout.viewButton', {
            defaultMessage: 'View on remote instance',
          })}
        </EuiButton>
      )}
    </EuiCallOut>
  );
}
