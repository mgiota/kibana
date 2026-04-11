/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { RemoteMonitorInfo } from '../../../../common/runtime_types/remote';

/**
 * Builds a base URL for a remote monitor details page on the remote Kibana instance.
 */
function createBaseRemoteMonitorDetailsUrl(
  remote: RemoteMonitorInfo,
  configId: string,
  spaceId: string = 'default'
): URL | undefined {
  if (!remote || remote.kibanaUrl === '') {
    return undefined;
  }

  const spacePath = spaceId !== 'default' ? `/s/${spaceId}` : '';
  const detailsPath = `/app/synthetics/monitor/${configId}`;

  return new URL(`${spacePath}${detailsPath}`, remote.kibanaUrl);
}

/**
 * Creates a URL string for viewing a remote monitor's details page on the remote Kibana instance.
 */
export function createRemoteMonitorDetailsUrl(
  remote: RemoteMonitorInfo,
  configId: string,
  spaceId: string = 'default'
): string | undefined {
  return createBaseRemoteMonitorDetailsUrl(remote, configId, spaceId)?.toString();
}
