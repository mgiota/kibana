/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { loggingSystemMock } from '@kbn/core-logging-server-mocks';
import { LocalTailSamplingControlApi } from './control_api';
import { getPoliciesHash } from './get_policies_hash';

const validPolicies = [
  { name: 'errors', type: 'status_code', status_code: { status_codes: ['ERROR'] } },
  { name: 'rest', type: 'probabilistic', probabilistic: { sampling_percentage: 10 } },
];

describe('LocalTailSamplingControlApi', () => {
  let logger: ReturnType<typeof loggingSystemMock.createLogger>;
  let api: LocalTailSamplingControlApi;

  beforeEach(() => {
    logger = loggingSystemMock.createLogger();
    api = new LocalTailSamplingControlApi(logger);
  });

  describe('validate', () => {
    it('returns the hash and no diagnostics for a valid config', async () => {
      const result = await api.validate({ policies: validPolicies });
      expect(result).toEqual({
        valid: true,
        diagnostics: [],
        hash: getPoliciesHash(validPolicies),
      });
    });

    it('returns diagnostics for an invalid config', async () => {
      const result = await api.validate({ policies: [{ name: 'bad', type: 'nope' }] });
      expect(result.valid).toBe(false);
      expect(result.diagnostics.length).toBeGreaterThan(0);
    });

    it('still returns a hash for an invalid config', async () => {
      const result = await api.validate({ policies: [{ name: 'bad', type: 'nope' }] });
      expect(result.hash).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('status', () => {
    it('is empty before anything is applied', async () => {
      expect(await api.getStatus()).toEqual({ desiredHash: undefined, activeHash: undefined });
    });

    it('reports the applied hash as both desired and active', async () => {
      await api.apply({ policies: validPolicies }, 'abc');
      expect(await api.getStatus()).toEqual({ desiredHash: 'abc', activeHash: 'abc' });
    });

    it('keeps only the latest applied hash', async () => {
      await api.apply({ policies: validPolicies }, 'abc');
      await api.apply({ policies: validPolicies }, 'def');
      expect(await api.getStatus()).toEqual({ desiredHash: 'def', activeHash: 'def' });
    });

    it('is empty again after deactivate', async () => {
      await api.apply({ policies: validPolicies }, 'abc');
      await api.deactivate();
      expect(await api.getStatus()).toEqual({ desiredHash: undefined, activeHash: undefined });
    });
  });

  it('logs apply and deactivate', async () => {
    await api.apply({ policies: validPolicies }, 'abc');
    await api.deactivate();
    expect(logger.info).toHaveBeenCalledTimes(2);
  });
});
