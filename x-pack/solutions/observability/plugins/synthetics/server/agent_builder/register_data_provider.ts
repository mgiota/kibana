/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { CoreSetup, KibanaRequest } from '@kbn/core/server';
import type { SyntheticsMonitorDetailsResponse } from '@kbn/observability-agent-builder-plugin/server';
import type {
  SyntheticsPluginsSetupDependencies,
  SyntheticsPluginsStartDependencies,
} from '../types';
import type { SavedObject } from '@kbn/core-saved-objects-api-server';
import type { EncryptedSyntheticsMonitorAttributes } from '../../common/runtime_types';
import { MonitorConfigRepository } from '../services/monitor_config_repository';
import { ConfigKey } from '../../common/runtime_types';

/**
 * Builds the response shape for the syntheticsMonitorDetails data provider.
 * Extracted for testability and to assert compatibility with SyntheticsMonitorDetailsResponse.
 */
export function toSyntheticsMonitorDetailsResponse(
  monitor: SavedObject<EncryptedSyntheticsMonitorAttributes>
): SyntheticsMonitorDetailsResponse {
  const { attributes } = monitor;
  return {
    id: monitor.id,
    name: attributes[ConfigKey.NAME],
    type: attributes[ConfigKey.MONITOR_TYPE],
    enabled: attributes[ConfigKey.ENABLED],
    schedule: attributes[ConfigKey.SCHEDULE],
    locations: attributes[ConfigKey.LOCATIONS],
    tags: attributes[ConfigKey.TAGS],
  } satisfies SyntheticsMonitorDetailsResponse;
}

export function registerDataProviders({
  core,
  plugins,
}: {
  core: CoreSetup;
  plugins: SyntheticsPluginsSetupDependencies;
}) {
  const { observabilityAgentBuilder } = plugins;
  if (!observabilityAgentBuilder) {
    return;
  }

  observabilityAgentBuilder.registerDataProvider(
    'syntheticsMonitorDetails',
    async ({ request, configId }: { request: KibanaRequest; configId: string }) => {
      const [coreStart, pluginsStart] = await (
        core as CoreSetup<SyntheticsPluginsStartDependencies>
      ).getStartServices();

      const savedObjectsClient = coreStart.savedObjects.getScopedClient(request);
      const encryptedSavedObjectsClient = pluginsStart.encryptedSavedObjects.getClient();

      const monitorConfigRepository = new MonitorConfigRepository(
        savedObjectsClient,
        encryptedSavedObjectsClient
      );

      const monitor = await monitorConfigRepository.get(configId);
      return toSyntheticsMonitorDetailsResponse(monitor);
    }
  );
}
