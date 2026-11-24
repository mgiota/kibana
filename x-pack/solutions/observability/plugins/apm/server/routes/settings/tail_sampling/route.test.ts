/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { loggingSystemMock } from '@kbn/core-logging-server-mocks';
import type { APMRouteHandlerResources } from '../../apm_routes/register_apm_server_routes';
import { LocalTailSamplingControlApi, getTailSamplingControlApi } from './control_api';
import { getPoliciesHash } from './get_policies_hash';
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

    it('writes nothing', async () => {
      await route.handler(getValidateResources({ body: body({ policies }) }));
      expect(await store.get()).toBeUndefined();
    });
  });

  describe('PUT /internal/tail_sampling', () => {
    const route = tailSamplingRouteRepository['PUT /internal/tail_sampling'];
    type SaveResources = Parameters<typeof route.handler>[0];
    const getSaveResources = (overrides: { flag?: boolean; body: unknown }) =>
      getResources(overrides) as SaveResources;

    const validHash = getPoliciesHash(policies);
    const saveBody = (extra: Record<string, unknown> = {}) => ({
      processor: 'tail_sampling',
      config: { policies },
      ...extra,
    });
    const getControlApi = () => getTailSamplingControlApi(loggingSystemMock.createLogger());

    it('returns 404 when the feature flag is off', async () => {
      await expect(
        route.handler(getSaveResources({ flag: false, body: saveBody() }))
      ).rejects.toMatchObject({ output: { statusCode: 404 } });
    });

    it('saves the config as enabled and returns it', async () => {
      const result = await route.handler(getSaveResources({ body: saveBody() }));
      expect(result).toMatchObject({
        saved: true,
        enabled: true,
        processor: 'tail_sampling',
        config: { policies },
        hash: validHash,
        updatedBy: 'elastic',
      });
      expect(await store.get()).toMatchObject({ enabled: true, configHash: validHash });
    });

    it('applies the config through the control API', async () => {
      const apply = jest.spyOn(getControlApi(), 'apply');
      await route.handler(getSaveResources({ body: saveBody() }));
      expect(apply).toHaveBeenCalledWith({ policies }, validHash);
    });

    it('returns 400 and writes nothing when the config is invalid', async () => {
      const apply = jest.spyOn(getControlApi(), 'apply');
      await expect(
        route.handler(
          getSaveResources({
            body: saveBody({ config: { policies: [{ name: 'bad', type: 'nope' }] } }),
          })
        )
      ).rejects.toMatchObject({ output: { statusCode: 400 } });
      expect(await store.get()).toBeUndefined();
      expect(apply).not.toHaveBeenCalled();
    });

    it('saves when the version matches', async () => {
      const first = await store.save(stored);
      const result = await route.handler(
        getSaveResources({ body: saveBody({ version: first.version }) })
      );
      expect(result).toMatchObject({ saved: true, hash: validHash });
      expect(result.version).not.toBe(first.version);
    });

    it('returns 409 and keeps the stored config when the version is stale', async () => {
      const first = await store.save(stored);
      const second = await store.save(stored);
      await expect(
        route.handler(getSaveResources({ body: saveBody({ version: first.version }) }))
      ).rejects.toMatchObject({ output: { statusCode: 409 } });
      expect(await store.get()).toEqual(second);
    });

    it('still saves when the control API call fails, and logs a warning', async () => {
      jest.spyOn(getControlApi(), 'apply').mockRejectedValue(new Error('unreachable'));
      const resources = getSaveResources({ body: saveBody() });
      const result = await route.handler(resources);
      expect(result).toMatchObject({ saved: true, enabled: true });
      expect(await store.get()).toMatchObject({ configHash: validHash });
      expect(resources.logger.warn).toHaveBeenCalledWith(expect.stringContaining('unreachable'));
    });
  });

  describe('POST /internal/tail_sampling/_disable', () => {
    const route = tailSamplingRouteRepository['POST /internal/tail_sampling/_disable'];
    const getControlApi = () => getTailSamplingControlApi(loggingSystemMock.createLogger());

    it('returns 404 when the feature flag is off', async () => {
      await expect(route.handler(getResources({ flag: false }))).rejects.toMatchObject({
        output: { statusCode: 404 },
      });
    });

    it('returns the empty state and does nothing when nothing is saved', async () => {
      const deactivate = jest.spyOn(getControlApi(), 'deactivate');
      expect(await route.handler(getResources())).toMatchObject({ saved: false, enabled: false });
      expect(deactivate).not.toHaveBeenCalled();
    });

    it('does nothing when sampling is already off', async () => {
      const disabled = await store.save({ ...stored, enabled: false });
      const deactivate = jest.spyOn(getControlApi(), 'deactivate');
      expect(await route.handler(getResources())).toMatchObject({
        enabled: false,
        version: disabled.version,
      });
      expect(deactivate).not.toHaveBeenCalled();
    });

    it('turns sampling off, keeps the config and deactivates', async () => {
      await store.save(stored);
      const deactivate = jest.spyOn(getControlApi(), 'deactivate');
      const result = await route.handler(getResources());
      expect(result).toMatchObject({
        saved: true,
        enabled: false,
        config: { policies },
        hash: 'hash-1',
      });
      expect(await store.get()).toMatchObject({ enabled: false, config: { policies } });
      expect(deactivate).toHaveBeenCalledTimes(1);
    });

    it('still disables when the control API call fails, and logs a warning', async () => {
      await store.save(stored);
      jest.spyOn(getControlApi(), 'deactivate').mockRejectedValue(new Error('unreachable'));
      const resources = getResources();
      expect(await route.handler(resources)).toMatchObject({ enabled: false });
      expect(resources.logger.warn).toHaveBeenCalledWith(expect.stringContaining('unreachable'));
    });
  });
});
