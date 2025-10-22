/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { fetchSLOHealthParamsSchema } from '@kbn/slo-schema';
import { GetSLOHealth } from '../../services';
import { createSloServerRoute } from '../create_slo_server_route';
import { assertPlatinumLicense } from './utils/assert_platinum_license';

export const fetchSloHealthRoute = createSloServerRoute({
  endpoint: 'POST /internal/observability/slos/_health',
  options: { access: 'internal' },
  security: {
    authz: {
      requiredPrivileges: ['slo_read'],
    },
  },
  params: fetchSLOHealthParamsSchema,
  handler: async ({ request, logger, params, plugins, getScopedClients }) => {
    await assertPlatinumLicense(plugins);

    const { scopedClusterClient } = await getScopedClients({ request, logger });
    const { repository } = await getScopedClients({ request, logger });

    // If the client requested paused state filter, find all disabled SLOs and
    // pass their ids in the list so GetSLOHealth can compute only those.
    let body = params.body;
    if (body.stateFilter === 'paused') {
      const perPage = 1000;
      let page = 1;
      let disabledIds: Array<{ sloId: string; sloInstanceId: string }> = [];
      while (true) {
        const pageResult = await repository.search('', { page, perPage }, { tags: [] });
        const disabledOnPage = pageResult.results
          .filter((slo) => slo.enabled === false)
          .map((slo) => ({ sloId: slo.id, sloInstanceId: slo.instanceId ?? '*' }));
        disabledIds = disabledIds.concat(disabledOnPage);
        const fetched = pageResult.page * pageResult.perPage;
        if (fetched >= pageResult.total) break;
        page += 1;
      }

      body = { ...body, list: disabledIds };
    }

    const getSLOHealth = new GetSLOHealth(scopedClusterClient);

    return await getSLOHealth.execute(body);
  },
});
