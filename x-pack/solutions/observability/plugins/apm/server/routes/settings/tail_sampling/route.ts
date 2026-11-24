/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import Boom from '@hapi/boom';
import {
  routeDefinitions,
  TAIL_SAMPLING_PROCESSOR,
  type TailSamplingResponse,
  type ValidateTailSamplingResponse,
} from '@kbn/apm-api-shared';
import type { ApmFeatureFlags } from '../../../../common/apm_feature_flags';
import { createApmServerRoute } from '../../apm_routes/create_apm_server_route';
import type { APMRouteHandlerResources } from '../../apm_routes/register_apm_server_routes';
import { getTailSamplingControlApi } from './control_api';
import {
  getTailSamplingStore,
  TailSamplingVersionConflictError,
  type StoredTailSampling,
} from './tail_sampling_store';

function throwNotFoundIfUnavailable(featureFlags: ApmFeatureFlags): void {
  if (!featureFlags.managedTailSamplingAvailable) {
    throw Boom.notFound();
  }
}

function toResponse(stored: StoredTailSampling | undefined): TailSamplingResponse {
  if (!stored) {
    return {
      saved: false,
      enabled: false,
      processor: TAIL_SAMPLING_PROCESSOR,
      config: { policies: [] },
      hash: null,
    };
  }
  return {
    saved: true,
    enabled: stored.enabled,
    processor: stored.processor,
    config: stored.config,
    hash: stored.configHash,
    version: stored.version,
    updatedBy: stored.updatedBy,
    updatedAt: stored.updatedAt,
  };
}

async function getCurrentUsername({
  core,
  request,
}: APMRouteHandlerResources): Promise<string | undefined> {
  const coreStart = await core.start();
  return coreStart.security.authc.getCurrentUser(request)?.username;
}

const getTailSamplingRoute = createApmServerRoute({
  endpoint: routeDefinitions.tailSampling.get.endpoint,
  security: { authz: { requiredPrivileges: ['apm'] } },
  handler: async (resources): Promise<TailSamplingResponse> => {
    throwNotFoundIfUnavailable(resources.featureFlags);
    return toResponse(await getTailSamplingStore().get());
  },
});

const validateTailSamplingRoute = createApmServerRoute({
  endpoint: routeDefinitions.tailSampling.validate.endpoint,
  params: routeDefinitions.tailSampling.validate.params,
  security: { authz: { requiredPrivileges: ['apm'] } },
  handler: async (resources): Promise<ValidateTailSamplingResponse> => {
    throwNotFoundIfUnavailable(resources.featureFlags);
    const { config } = resources.params.body;
    const validation = await getTailSamplingControlApi(resources.logger).validate(config);
    return {
      ...validation,
      // The warning rules arrive in a separate change.
      warnings: [],
    };
  },
});

const saveTailSamplingRoute = createApmServerRoute({
  endpoint: routeDefinitions.tailSampling.save.endpoint,
  params: routeDefinitions.tailSampling.save.params,
  security: { authz: { requiredPrivileges: ['apm', 'apm_settings_write'] } },
  handler: async (resources): Promise<TailSamplingResponse> => {
    throwNotFoundIfUnavailable(resources.featureFlags);
    const { processor, config, version } = resources.params.body;
    const controlApi = getTailSamplingControlApi(resources.logger);

    const validation = await controlApi.validate(config);
    if (!validation.valid) {
      throw Boom.badRequest('The config did not pass validation.');
    }

    let stored: StoredTailSampling;
    try {
      stored = await getTailSamplingStore().save(
        {
          enabled: true,
          processor,
          config,
          configHash: validation.hash,
          updatedBy: await getCurrentUsername(resources),
        },
        version
      );
    } catch (error) {
      if (error instanceof TailSamplingVersionConflictError) {
        throw Boom.conflict('The config was changed by someone else. Reload and try again.');
      }
      throw error;
    }

    // The stored config is authoritative, so a failed control API call does not fail the save.
    try {
      await controlApi.apply(config, validation.hash);
    } catch (error) {
      resources.logger.warn(`Tail sampling: apply failed: ${error.message}`);
    }

    return toResponse(stored);
  },
});

const disableTailSamplingRoute = createApmServerRoute({
  endpoint: routeDefinitions.tailSampling.disable.endpoint,
  security: { authz: { requiredPrivileges: ['apm', 'apm_settings_write'] } },
  handler: async (resources): Promise<TailSamplingResponse> => {
    throwNotFoundIfUnavailable(resources.featureFlags);
    const store = getTailSamplingStore();
    const stored = await store.get();
    if (!stored?.enabled) {
      return toResponse(stored);
    }

    const disabled = await store.save({
      enabled: false,
      processor: stored.processor,
      config: stored.config,
      configHash: stored.configHash,
      updatedBy: await getCurrentUsername(resources),
    });

    try {
      await getTailSamplingControlApi(resources.logger).deactivate();
    } catch (error) {
      resources.logger.warn(`Tail sampling: deactivate failed: ${error.message}`);
    }

    return toResponse(disabled);
  },
});

export const tailSamplingRouteRepository = {
  ...getTailSamplingRoute,
  ...validateTailSamplingRoute,
  ...saveTailSamplingRoute,
  ...disableTailSamplingRoute,
};
