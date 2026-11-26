/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { TailSamplingPolicy } from '@kbn/apm-api-shared';
import {
  createFormPolicy,
  describePolicy,
  getDiagnosticField,
  getFormPolicyKind,
  getPolicyAction,
  getPolicyFieldErrors,
  hasPolicyFieldErrors,
  setAttributePolicyAction,
} from './form_policy';

const keepAttribute: TailSamplingPolicy = {
  name: 'keep-vip',
  type: 'string_attribute',
  string_attribute: { key: 'customer.tier', values: ['enterprise', 'vip'] },
};

const dropAttribute: TailSamplingPolicy = {
  name: 'keep-vip',
  type: 'drop',
  drop: {
    drop_sub_policy: [
      {
        name: 'keep-vip-match',
        type: 'string_attribute',
        string_attribute: { key: 'customer.tier', values: ['enterprise', 'vip'] },
      },
    ],
  },
};

describe('getPolicyAction', () => {
  it('is drop only for a drop policy', () => {
    expect(getPolicyAction(dropAttribute)).toBe('drop');
    expect(getPolicyAction(keepAttribute)).toBe('keep');
    expect(getPolicyAction(createFormPolicy('probabilistic', []))).toBe('keep');
  });
});

describe('setAttributePolicyAction', () => {
  it('wraps an attribute policy in a drop policy', () => {
    expect(setAttributePolicyAction(keepAttribute, 'drop')).toEqual(dropAttribute);
  });

  it('unwraps a drop policy into an attribute policy', () => {
    expect(setAttributePolicyAction(dropAttribute, 'keep')).toEqual(keepAttribute);
  });

  it('keeps the condition through a round trip', () => {
    const dropped = setAttributePolicyAction(keepAttribute, 'drop');
    expect(setAttributePolicyAction(dropped, 'keep')).toEqual(keepAttribute);
  });

  it('uses the given name for the policy and its sub-policy', () => {
    const dropped = setAttributePolicyAction(keepAttribute, 'drop', 'drop-vip');
    expect(dropped.name).toBe('drop-vip');
    expect(dropped.drop).toEqual({
      drop_sub_policy: [expect.objectContaining({ name: 'drop-vip-match' })],
    });
  });

  it('returns the policy unchanged when the action already applies', () => {
    expect(setAttributePolicyAction(keepAttribute, 'keep')).toBe(keepAttribute);
    expect(setAttributePolicyAction(dropAttribute, 'drop')).toBe(dropAttribute);
  });

  it('returns other policies unchanged', () => {
    const latency = createFormPolicy('latency', []);
    expect(setAttributePolicyAction(latency, 'drop')).toBe(latency);
  });

  it('produces a policy the form can still edit', () => {
    expect(getFormPolicyKind(setAttributePolicyAction(keepAttribute, 'drop'))).toBe('drop');
    expect(getFormPolicyKind(setAttributePolicyAction(dropAttribute, 'keep'))).toBe(
      'string_attribute'
    );
  });
});

describe('describePolicy', () => {
  it('describes each kind the form can edit', () => {
    expect(describePolicy(createFormPolicy('status_code', []))).toBe('Status is ERROR');
    expect(describePolicy(createFormPolicy('latency', []))).toBe('Duration at least 1000 ms');
    expect(describePolicy(createFormPolicy('probabilistic', []))).toBe('10% of all traces');
    expect(describePolicy(keepAttribute)).toBe('customer.tier is enterprise, vip');
    expect(describePolicy(dropAttribute)).toBe('customer.tier is enterprise, vip');
  });

  it('describes a latency range', () => {
    expect(
      describePolicy({
        name: 'mid',
        type: 'latency',
        latency: { threshold_ms: 500, upper_threshold_ms: 2000 },
      })
    ).toBe('Duration between 500 and 2000 ms');
  });

  it('says "matches" when regular expressions are on', () => {
    expect(
      describePolicy({
        name: 'health',
        type: 'string_attribute',
        string_attribute: {
          key: 'http.target',
          values: ['/health.*'],
          enabled_regex_matching: true,
        },
      })
    ).toBe('http.target matches /health.*');
  });

  it('is undefined for a policy the form cannot edit', () => {
    expect(describePolicy({ name: 'always', type: 'always_sample' })).toBeUndefined();
  });
});

describe('describePolicy with nothing set', () => {
  it('says that no condition is set', () => {
    expect(describePolicy(createFormPolicy('string_attribute', []))).toBe('No condition set');
    expect(describePolicy(createFormPolicy('drop', []))).toBe('No condition set');
    expect(
      describePolicy({ name: 'none', type: 'status_code', status_code: { status_codes: [] } })
    ).toBe('No condition set');
  });
});

describe('getDiagnosticField', () => {
  it('is the last named segment of the path', () => {
    expect(getDiagnosticField(['latency', 'threshold_ms'])).toBe('threshold_ms');
    expect(getDiagnosticField(['string_attribute', 'values', 0])).toBe('values');
    expect(getDiagnosticField(['drop', 'drop_sub_policy', 0, 'string_attribute', 'key'])).toBe(
      'key'
    );
  });

  it('is name only for the policy itself', () => {
    expect(getDiagnosticField(['name'])).toBe('name');
    expect(getDiagnosticField(['drop', 'drop_sub_policy', 0, 'name'])).toBe('drop_sub_policy');
  });

  it('is undefined without a path', () => {
    expect(getDiagnosticField()).toBeUndefined();
    expect(getDiagnosticField([])).toBeUndefined();
  });
});

describe('getPolicyFieldErrors', () => {
  it('has no errors for a complete policy', () => {
    const errors = getPolicyFieldErrors(keepAttribute, ['keep-errors']);
    expect(errors).toEqual({});
    expect(hasPolicyFieldErrors(errors)).toBe(false);
  });

  it('reports the empty fields of a new attribute policy', () => {
    expect(getPolicyFieldErrors(createFormPolicy('string_attribute', []), [])).toEqual({
      key: 'Enter an attribute.',
      values: 'Add at least one value.',
    });
  });

  it('reports the fields of the condition inside a drop policy', () => {
    expect(getPolicyFieldErrors(createFormPolicy('drop', []), [])).toEqual({
      key: 'Enter an attribute.',
      values: 'Add at least one value.',
    });
  });

  it('reports an empty name', () => {
    expect(getPolicyFieldErrors({ ...keepAttribute, name: ' ' }, [])).toEqual({
      name: 'Enter a policy name.',
    });
  });

  it('reports a name another policy uses', () => {
    expect(getPolicyFieldErrors(keepAttribute, ['keep-vip'])).toEqual({
      name: 'Another policy already uses this name.',
    });
  });

  it('reports a percentage out of range', () => {
    expect(
      getPolicyFieldErrors(
        { name: 'none', type: 'probabilistic', probabilistic: { sampling_percentage: 0 } },
        []
      )
    ).toEqual({ sampling_percentage: 'Enter a percentage above 0, up to 100.' });
  });

  it('reports an upper duration that is not above the lower one', () => {
    const errors = getPolicyFieldErrors(
      { name: 'mid', type: 'latency', latency: { threshold_ms: 500, upper_threshold_ms: 100 } },
      []
    );
    expect(errors).toEqual({
      upper_threshold_ms:
        'Enter a whole number greater than the lower duration, or leave it empty.',
    });
    expect(hasPolicyFieldErrors(errors)).toBe(true);
  });
});
