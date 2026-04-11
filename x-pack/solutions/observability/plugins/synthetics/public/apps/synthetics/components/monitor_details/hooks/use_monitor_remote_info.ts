/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RemoteMonitorInfo } from '../../../../../../common/runtime_types/remote';
import { selectOverviewStatus } from '../../../state/overview_status';

/**
 * Looks up remote monitor info from the overview status state for a given configId.
 * Returns the RemoteMonitorInfo if the monitor was fetched from a remote cluster,
 * or undefined if it is a local monitor.
 */
export function useMonitorRemoteInfo(configId: string): RemoteMonitorInfo | undefined {
  const { allConfigs } = useSelector(selectOverviewStatus);

  return useMemo(() => {
    if (!allConfigs) {
      return undefined;
    }
    const match = allConfigs.find((config) => config.configId === configId);
    return match?.remote;
  }, [allConfigs, configId]);
}
