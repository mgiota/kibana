/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { getPolicyFieldErrors } from './form_policy';
import {
  createStarterPolicies,
  DEFAULT_STARTER_SET,
  findStarterSet,
  getStarterSetPolicies,
} from './starter_sets';

describe('getStarterSetPolicies', () => {
  it('creates the balanced set', () => {
    expect(getStarterSetPolicies('balanced')).toEqual([
      { name: 'keep-errors', type: 'status_code', status_code: { status_codes: ['ERROR'] } },
      { name: 'keep-slow', type: 'latency', latency: { threshold_ms: 1000 } },
      { name: 'baseline', type: 'probabilistic', probabilistic: { sampling_percentage: 10 } },
    ]);
  });

  it('keeps a larger share in the keep more set', () => {
    const policies = getStarterSetPolicies('more');
    expect(policies.map(({ name }) => name)).toEqual(['keep-errors', 'keep-slow', 'baseline']);
    expect(policies.slice(-1)).toEqual([
      { name: 'baseline', type: 'probabilistic', probabilistic: { sampling_percentage: 25 } },
    ]);
  });

  it('has no policies in the empty set', () => {
    expect(getStarterSetPolicies('empty')).toEqual([]);
  });

  it('creates policies that pass the local checks', () => {
    const policies = getStarterSetPolicies(DEFAULT_STARTER_SET);
    policies.forEach((policy) => {
      const otherNames = policies.filter((other) => other !== policy).map(({ name }) => name);
      expect(getPolicyFieldErrors(policy, otherNames)).toEqual({});
    });
  });
});

describe('createStarterPolicies', () => {
  it('leaves out the rules that are switched off', () => {
    expect(createStarterPolicies({ keepErrors: false, keepSlow: false, percentage: 5 })).toEqual([
      { name: 'baseline', type: 'probabilistic', probabilistic: { sampling_percentage: 5 } },
    ]);
    expect(
      createStarterPolicies({ keepErrors: false, keepSlow: true, percentage: 5 }).map(
        ({ name }) => name
      )
    ).toEqual(['keep-slow', 'baseline']);
  });
});

describe('findStarterSet', () => {
  it('finds the set a list is equal to', () => {
    expect(findStarterSet(getStarterSetPolicies('balanced'))).toBe('balanced');
    expect(findStarterSet(getStarterSetPolicies('more'))).toBe('more');
    expect(findStarterSet([])).toBe('empty');
  });

  it('finds none for an edited list', () => {
    const [first, ...rest] = getStarterSetPolicies('balanced');
    expect(findStarterSet(rest)).toBeUndefined();
    expect(findStarterSet([{ ...first, name: 'renamed' }, ...rest])).toBeUndefined();
  });
});
