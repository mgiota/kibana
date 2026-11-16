/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';
import type { TailSamplingPolicy } from '@kbn/apm-api-shared';

export type FormPolicyKind =
  | 'status_code'
  | 'latency'
  | 'string_attribute'
  | 'probabilistic'
  | 'drop';

export const formPolicyLabels: Record<FormPolicyKind, string> = {
  status_code: i18n.translate('xpack.apm.tailSampling.form.kind.statusCode', {
    defaultMessage: 'Keep traces by status',
  }),
  latency: i18n.translate('xpack.apm.tailSampling.form.kind.latency', {
    defaultMessage: 'Keep slow traces',
  }),
  string_attribute: i18n.translate('xpack.apm.tailSampling.form.kind.attribute', {
    defaultMessage: 'Keep traces with an attribute value',
  }),
  probabilistic: i18n.translate('xpack.apm.tailSampling.form.kind.probabilistic', {
    defaultMessage: 'Keep a share of all traces',
  }),
  drop: i18n.translate('xpack.apm.tailSampling.form.kind.drop', {
    defaultMessage: 'Drop traces with an attribute value',
  }),
};

export const formPolicyKinds = Object.keys(formPolicyLabels) as FormPolicyKind[];

const hasOnlyKeys = (value: unknown, keys: string[]) =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  Object.keys(value).every((key) => keys.includes(key));

function isFormStringAttribute(block: unknown) {
  return hasOnlyKeys(block, ['key', 'values', 'enabled_regex_matching']);
}

/** Whether the form can edit the policy without losing any of its settings. */
export function getFormPolicyKind(policy: TailSamplingPolicy): FormPolicyKind | undefined {
  if (!hasOnlyKeys(policy, ['name', 'type', String(policy.type)])) {
    return undefined;
  }
  const block = policy[String(policy.type)];
  switch (policy.type) {
    case 'status_code':
      return hasOnlyKeys(block, ['status_codes']) ? 'status_code' : undefined;
    case 'latency':
      return hasOnlyKeys(block, ['threshold_ms', 'upper_threshold_ms']) ? 'latency' : undefined;
    case 'probabilistic':
      return hasOnlyKeys(block, ['sampling_percentage']) ? 'probabilistic' : undefined;
    case 'string_attribute':
      return isFormStringAttribute(block) ? 'string_attribute' : undefined;
    case 'drop': {
      const subPolicies = (block as { drop_sub_policy?: unknown } | undefined)?.drop_sub_policy;
      if (!Array.isArray(subPolicies) || subPolicies.length !== 1) {
        return undefined;
      }
      const [subPolicy] = subPolicies;
      return hasOnlyKeys(block, ['drop_sub_policy']) &&
        hasOnlyKeys(subPolicy, ['name', 'type', 'string_attribute']) &&
        subPolicy.type === 'string_attribute' &&
        isFormStringAttribute(subPolicy.string_attribute)
        ? 'drop'
        : undefined;
    }
    default:
      return undefined;
  }
}

function getUniqueName(base: string, existingNames: string[]) {
  let name = base;
  let suffix = 2;
  while (existingNames.includes(name)) {
    name = `${base}-${suffix++}`;
  }
  return name;
}

export function createFormPolicy(
  kind: FormPolicyKind,
  existingNames: string[]
): TailSamplingPolicy {
  switch (kind) {
    case 'status_code':
      return {
        name: getUniqueName('keep-errors', existingNames),
        type: 'status_code',
        status_code: { status_codes: ['ERROR'] },
      };
    case 'latency':
      return {
        name: getUniqueName('keep-slow', existingNames),
        type: 'latency',
        latency: { threshold_ms: 1000 },
      };
    case 'string_attribute':
      return {
        name: getUniqueName('keep-attribute', existingNames),
        type: 'string_attribute',
        string_attribute: { key: '', values: [] },
      };
    case 'probabilistic':
      return {
        name: getUniqueName('baseline', existingNames),
        type: 'probabilistic',
        probabilistic: { sampling_percentage: 10 },
      };
    case 'drop': {
      const name = getUniqueName('drop-attribute', existingNames);
      return {
        name,
        type: 'drop',
        drop: {
          drop_sub_policy: [
            {
              name: `${name}-match`,
              type: 'string_attribute',
              string_attribute: { key: '', values: [] },
            },
          ],
        },
      };
    }
  }
}
