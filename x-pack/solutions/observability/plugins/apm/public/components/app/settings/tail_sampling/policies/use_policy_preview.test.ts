/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { getKeptPercentage, getTopKeepingPolicy } from './use_policy_preview';

describe('getKeptPercentage', () => {
  it('rounds to a whole percentage', () => {
    expect(getKeptPercentage({ total: 159816, kept: 87847 })).toBe(55);
    expect(getKeptPercentage({ total: 1000, kept: 4 })).toBe(0);
  });

  it('is undefined when there are no traces', () => {
    expect(getKeptPercentage({ total: 0, kept: 0 })).toBeUndefined();
  });

  it('never goes above 100, as the counts are approximate', () => {
    expect(getKeptPercentage({ total: 100, kept: 103 })).toBe(100);
  });
});

describe('getTopKeepingPolicy', () => {
  it('is the policy that keeps the most traces', () => {
    expect(
      getTopKeepingPolicy({
        keptByPolicy: [
          { policyName: 'keep-errors', kept: 79850 },
          { policyName: 'keep-slow', kept: 0 },
          { policyName: 'baseline', kept: 7997 },
        ],
      })
    ).toEqual({ policyName: 'keep-errors', kept: 79850 });
  });

  it('is undefined when no policy keeps a trace', () => {
    expect(getTopKeepingPolicy({ keptByPolicy: [] })).toBeUndefined();
    expect(
      getTopKeepingPolicy({ keptByPolicy: [{ policyName: 'keep-errors', kept: 0 }] })
    ).toBeUndefined();
  });
});
