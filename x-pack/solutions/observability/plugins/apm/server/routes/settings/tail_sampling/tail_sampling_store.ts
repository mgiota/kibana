/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import type { TailSamplingConfig, TailSamplingProcessor } from '@kbn/apm-api-shared';

export interface StoredTailSampling {
  enabled: boolean;
  processor: TailSamplingProcessor;
  config: TailSamplingConfig;
  configHash: string;
  // Changes on every save. Sent back on save to detect a concurrent edit.
  version: string;
  updatedAt: string;
  updatedBy?: string;
}

export type TailSamplingToStore = Pick<
  StoredTailSampling,
  'enabled' | 'processor' | 'config' | 'configHash' | 'updatedBy'
>;

export class TailSamplingVersionConflictError extends Error {
  constructor() {
    super('The stored tail-sampling config has changed since it was read.');
  }
}

export interface TailSamplingStore {
  get(): Promise<StoredTailSampling | undefined>;
  /**
   * Replaces the stored document. When `version` is set and differs from the stored
   * document's version, throws `TailSamplingVersionConflictError` and writes nothing.
   */
  save(doc: TailSamplingToStore, version?: string): Promise<StoredTailSampling>;
}

/**
 * Keeps the document in this Kibana process. It is lost on restart and not shared
 * between Kibana instances, so it is only for local development and tests.
 * The saved object store replaces it.
 */
export class InMemoryTailSamplingStore implements TailSamplingStore {
  private doc?: StoredTailSampling;
  private counter = 0;

  async get() {
    return this.doc;
  }

  async save(doc: TailSamplingToStore, version?: string) {
    if (version !== undefined && version !== this.doc?.version) {
      throw new TailSamplingVersionConflictError();
    }
    this.counter += 1;
    this.doc = { ...doc, version: String(this.counter), updatedAt: new Date().toISOString() };
    return this.doc;
  }
}

let store: TailSamplingStore | undefined;

export function getTailSamplingStore(): TailSamplingStore {
  store ??= new InMemoryTailSamplingStore();
  return store;
}
