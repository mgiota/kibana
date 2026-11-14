/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { loggingSystemMock } from '@kbn/core-logging-server-mocks';
import type { APMRouteHandlerResources } from '../../apm_routes/register_apm_server_routes';
import { LocalTailSamplingControlApi, getTailSamplingControlApi } from './control_api';
import { tailSamplingRouteRepository } from './route';
import {
  InMemoryTailSamplingStore,
  getTailSamplingStore,
  type TailSamplingToStore,
} from './tail_sampling_store';

jest.mock('./tail_sampling_store', () => ({
  ...jest.requireActual('./tail_sampling_store'),
  getTailSamplingStore: jest.fn(),
}));
jest.mock('./control_api', () => ({
  ...jest.requireActual('./control_api'),
  getTailSamplingControlApi: jest.fn(),
}));

const policies = [
  { name: 'errors', type: 'status_code', status_code: { status_codes: ['ERROR'] } },
  { name: 'rest', type: 'probabilistic', probabilistic: { sampling_percentage: 10 } },
];

const stored: TailSamplingToStore = {
  enabled: true,
  processor: 'tail_sampling',
  config: { policies },
  configHash: 'hash-1',
  updatedBy: 'elastic',
};

function getResources(
  overrides: { flag?: boolean; body?: unknown } = {}
): APMRouteHandlerResources {
  const { flag = true, body } = overrides;
  return {
    featureFlags: { managedTailSamplingAvailable: flag },
    logger: loggingSystemMock.createLogger(),
    params: { body },
    request: {},
    core: {
      start: async () => ({
        security: { authc: { getCurrentUser: () => ({ username: 'elastic' }) } },
      }),
    },
  } as unknown as APMRouteHandlerResources;
}

describe('tail sampling routes', () => {
  let store: InMemoryTailSamplingStore;

  beforeEach(() => {
    store = new InMemoryTailSamplingStore();
    (getTailSamplingStore as jest.Mock).mockReturnValue(store);
    (getTailSamplingControlApi as jest.Mock).mockReturnValue(
      new LocalTailSamplingControlApi(loggingSystemMock.createLogger())
    );
  });

  describe('GET /internal/tail_sampling', () => {
    const route = tailSamplingRouteRepository['GET /internal/tail_sampling'];

    it('returns 404 when the feature flag is off', async () => {
      await expect(route.handler(getResources({ flag: false }))).rejects.toMatchObject({
        output: { statusCode: 404 },
      });
    });

    it('returns the empty state when nothing is saved', async () => {
      expect(await route.handler(getResources())).toEqual({
        saved: false,
        enabled: false,
        processor: 'tail_sampling',
        config: { policies: [] },
        hash: null,
      });
    });

    it('returns the stored state', async () => {
      const saved = await store.save(stored);
      expect(await route.handler(getResources())).toEqual({
        saved: true,
        enabled: true,
        processor: 'tail_sampling',
        config: { policies },
        hash: 'hash-1',
        version: saved.version,
        updatedBy: 'elastic',
        updatedAt: saved.updatedAt,
      });
    });

    it('returns a disabled config as saved but not enabled', async () => {
      await store.save({ ...stored, enabled: false });
      expect(await route.handler(getResources())).toMatchObject({ saved: true, enabled: false });
    });
  });

  describe('POST /internal/tail_sampling/_validate', () => {
    const route = tailSamplingRouteRepository['POST /internal/tail_sampling/_validate'];
    type ValidateResources = Parameters<typeof route.handler>[0];
    const getValidateResources = (overrides: { flag?: boolean; body: unknown }) =>
      getResources(overrides) as ValidateResources;
    const body = (config: { policies: unknown[] }) => ({
      processor: 'tail_sampling',
      config,
    });

    it('returns 404 when the feature flag is off', async () => {
      await expect(
        route.handler(getValidateResources({ flag: false, body: body({ policies }) }))
      ).rejects.toMatchObject({ output: { statusCode: 404 } });
    });

    it('returns valid, a hash and no diagnostics or warnings for a valid config', async () => {
      const result = await route.handler(getValidateResources({ body: body({ policies }) }));
      expect(result).toEqual({
        valid: true,
        diagnostics: [],
        warnings: [],
        hash: expect.stringMatching(/^[0-9a-f]{64}$/),
      });
    });

    it('returns diagnostics and no warnings for an invalid config', async () => {
      const result = await route.handler(
        getValidateResources({ body: body({ policies: [{ name: 'bad', type: 'nope' }] }) })
      );
      expect(result.valid).toBe(false);
      expect(result.diagnostics.length).toBeGreaterThan(0);
      expect(result.warnings).toEqual([]);
    });

    it('returns warnings for a valid config', async () => {
      const result = await route.handler(
        getValidateResources({
          body: body({
            policies: [
              { name: 'limit', type: 'rate_limiting', rate_limiting: { spans_per_second: 100 } },
            ],
          }),
        })
      );
      expect(result.valid).toBe(true);
      expect(result.warnings).toEqual([
        expect.objectContaining({ code: 'rate_limit_per_replica' }),
      ]);
    });

    it('writes nothing', async () => {
      await route.handler(getValidateResources({ body: body({ policies }) }));
      expect(await store.get()).toBeUndefined();
    });
  });
});
