/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import type { Logger } from '@kbn/core/server';
import type { TailSamplingConfig, TailSamplingDiagnostic } from '@kbn/apm-api-shared';
import { validateTailSamplingPolicies } from '../../../../common/tail_sampling';
import { getPoliciesHash } from './get_policies_hash';

export interface TailSamplingControlApiValidation {
  valid: boolean;
  diagnostics: TailSamplingDiagnostic[];
  hash: string;
}

export interface TailSamplingControlApiStatus {
  // The config the control API was last asked to roll out. Unset when sampling is off.
  desiredHash?: string;
  // The config the collectors run.
  activeHash?: string;
}

/** What Kibana needs from the tail-sampling control API. */
export interface TailSamplingControlApi {
  validate(config: TailSamplingConfig): Promise<TailSamplingControlApiValidation>;
  apply(config: TailSamplingConfig, hash: string): Promise<void>;
  deactivate(): Promise<void>;
  getStatus(): Promise<TailSamplingControlApiStatus>;
}

/**
 * Used while no control API is configured. It runs Kibana's own validator and
 * only logs `apply` and `deactivate`: nothing reaches a collector.
 */
export class LocalTailSamplingControlApi implements TailSamplingControlApi {
  private desiredHash?: string;

  constructor(private readonly logger: Logger) {}

  async validate(config: TailSamplingConfig) {
    const diagnostics = validateTailSamplingPolicies(config.policies);
    return {
      valid: diagnostics.length === 0,
      diagnostics,
      hash: getPoliciesHash(config.policies),
    };
  }

  async apply(config: TailSamplingConfig, hash: string) {
    this.desiredHash = hash;
    this.logger.info(`Tail sampling (local control API): apply ${hash}`);
  }

  async deactivate() {
    this.desiredHash = undefined;
    this.logger.info('Tail sampling (local control API): deactivate');
  }

  async getStatus() {
    return { desiredHash: this.desiredHash, activeHash: this.desiredHash };
  }
}

let controlApi: TailSamplingControlApi | undefined;

export function getTailSamplingControlApi(logger: Logger): TailSamplingControlApi {
  controlApi ??= new LocalTailSamplingControlApi(logger);
  return controlApi;
}
