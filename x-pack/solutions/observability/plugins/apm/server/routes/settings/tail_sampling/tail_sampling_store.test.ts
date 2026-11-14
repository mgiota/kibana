/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import {
  InMemoryTailSamplingStore,
  TailSamplingVersionConflictError,
  type TailSamplingToStore,
} from './tail_sampling_store';

const doc: TailSamplingToStore = {
  enabled: true,
  processor: 'tail_sampling',
  config: { policies: [{ name: 'all', type: 'always_sample' }] },
  configHash: 'hash-1',
  updatedBy: 'elastic',
};

describe('InMemoryTailSamplingStore', () => {
  let store: InMemoryTailSamplingStore;

  beforeEach(() => {
    store = new InMemoryTailSamplingStore();
  });

  it('returns undefined before anything is saved', async () => {
    expect(await store.get()).toBeUndefined();
  });

  it('saves a document and returns it with a version and timestamp', async () => {
    const saved = await store.save(doc);
    expect(saved).toEqual({ ...doc, version: expect.any(String), updatedAt: expect.any(String) });
    expect(new Date(saved.updatedAt).toISOString()).toBe(saved.updatedAt);
  });

  it('returns the saved document from get', async () => {
    const saved = await store.save(doc);
    expect(await store.get()).toEqual(saved);
  });

  it('changes the version on every save', async () => {
    const first = await store.save(doc);
    const second = await store.save(doc);
    expect(second.version).not.toBe(first.version);
  });

  it('replaces the document instead of merging', async () => {
    await store.save(doc);
    await store.save({ ...doc, enabled: false, updatedBy: undefined });
    const stored = await store.get();
    expect(stored?.enabled).toBe(false);
    expect(stored?.updatedBy).toBeUndefined();
  });

  describe('with a version', () => {
    it('saves when the version matches', async () => {
      const first = await store.save(doc);
      const second = await store.save({ ...doc, configHash: 'hash-2' }, first.version);
      expect(second.configHash).toBe('hash-2');
    });

    it('throws a conflict when the version is stale, and writes nothing', async () => {
      const first = await store.save(doc);
      const second = await store.save({ ...doc, configHash: 'hash-2' });

      await expect(
        store.save({ ...doc, configHash: 'hash-3' }, first.version)
      ).rejects.toBeInstanceOf(TailSamplingVersionConflictError);
      expect(await store.get()).toEqual(second);
    });

    it('throws a conflict when nothing is saved yet', async () => {
      await expect(store.save(doc, '1')).rejects.toBeInstanceOf(TailSamplingVersionConflictError);
      expect(await store.get()).toBeUndefined();
    });
  });
});
