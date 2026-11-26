/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';
import type { TailSamplingPolicy } from '@kbn/apm-api-shared';
import { validateTailSamplingPolicies } from '../../../../../../common/tail_sampling';

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

export type PolicyAction = 'keep' | 'drop';

// The types the flyout offers. Drop is an action on the attribute type, not a type of its own.
export type FormPolicyType = Exclude<FormPolicyKind, 'drop'>;

export const formPolicyTypeLabels: Record<FormPolicyType, string> = {
  status_code: i18n.translate('xpack.apm.tailSampling.form.type.statusCode', {
    defaultMessage: 'Status',
  }),
  latency: i18n.translate('xpack.apm.tailSampling.form.type.latency', {
    defaultMessage: 'Slow traces',
  }),
  string_attribute: i18n.translate('xpack.apm.tailSampling.form.type.attribute', {
    defaultMessage: 'Attribute',
  }),
  probabilistic: i18n.translate('xpack.apm.tailSampling.form.type.probabilistic', {
    defaultMessage: 'Share of all traces',
  }),
};

export const formPolicyTypes = Object.keys(formPolicyTypeLabels) as FormPolicyType[];

interface StringAttributeSummary {
  key?: string;
  values?: string[];
  enabled_regex_matching?: boolean;
}

/** Whether a matching trace is kept or dropped by the policy. */
export const getPolicyAction = (policy: TailSamplingPolicy): PolicyAction =>
  policy.type === 'drop' ? 'drop' : 'keep';

/** The form type of a policy the form can edit: a drop policy is shown as an attribute policy. */
export const getFormPolicyType = (kind: FormPolicyKind): FormPolicyType =>
  kind === 'drop' ? 'string_attribute' : kind;

const getDropSubPolicy = (policy: TailSamplingPolicy): TailSamplingPolicy => {
  const [subPolicy] = (policy.drop as { drop_sub_policy: TailSamplingPolicy[] }).drop_sub_policy;
  return subPolicy;
};

/**
 * Switches an attribute policy between keep (`string_attribute`) and drop (`drop` wrapping the
 * same condition). Any other policy is returned unchanged.
 */
export const setAttributePolicyAction = (
  policy: TailSamplingPolicy,
  action: PolicyAction,
  name: string = policy.name
): TailSamplingPolicy => {
  const kind = getFormPolicyKind(policy);
  if (kind === 'string_attribute' && action === 'drop') {
    return {
      name,
      type: 'drop',
      drop: {
        drop_sub_policy: [
          {
            name: `${name}-match`,
            type: 'string_attribute',
            string_attribute: policy.string_attribute,
          },
        ],
      },
    };
  }
  if (kind === 'drop' && action === 'keep') {
    return {
      name,
      type: 'string_attribute',
      string_attribute: getDropSubPolicy(policy).string_attribute,
    };
  }
  return policy;
};

const noConditionLabel = i18n.translate('xpack.apm.tailSampling.summary.noCondition', {
  defaultMessage: 'No condition set',
});

const describeStringAttribute = ({
  key,
  values,
  enabled_regex_matching: isRegex,
}: StringAttributeSummary) => {
  if (!key && !values?.length) {
    return noConditionLabel;
  }
  const attribute = key ?? '';
  const matchValues = (values ?? []).join(', ');
  return isRegex
    ? i18n.translate('xpack.apm.tailSampling.summary.attributeMatches', {
        defaultMessage: '{attribute} matches {matchValues}',
        values: { attribute, matchValues },
      })
    : i18n.translate('xpack.apm.tailSampling.summary.attributeIs', {
        defaultMessage: '{attribute} is {matchValues}',
        values: { attribute, matchValues },
      });
};

/** The condition of a policy in one line, or undefined when the form can't edit the policy. */
export const describePolicy = (policy: TailSamplingPolicy): string | undefined => {
  switch (getFormPolicyKind(policy)) {
    case 'status_code': {
      const { status_codes: statusCodes } = policy.status_code as { status_codes?: string[] };
      if (!statusCodes?.length) {
        return noConditionLabel;
      }
      return i18n.translate('xpack.apm.tailSampling.summary.statusCode', {
        defaultMessage: 'Status is {codes}',
        values: { codes: (statusCodes ?? []).join(', ') },
      });
    }
    case 'latency': {
      const { threshold_ms: min, upper_threshold_ms: max } = policy.latency as {
        threshold_ms?: number;
        upper_threshold_ms?: number;
      };
      return max === undefined
        ? i18n.translate('xpack.apm.tailSampling.summary.latency', {
            defaultMessage: 'Duration at least {min} ms',
            values: { min: String(min ?? '') },
          })
        : i18n.translate('xpack.apm.tailSampling.summary.latencyRange', {
            defaultMessage: 'Duration between {min} and {max} ms',
            values: { min: String(min ?? ''), max: String(max) },
          });
    }
    case 'probabilistic': {
      const { sampling_percentage: percentage } = policy.probabilistic as {
        sampling_percentage?: number;
      };
      return i18n.translate('xpack.apm.tailSampling.summary.probabilistic', {
        defaultMessage: '{percentage}% of all traces',
        values: { percentage: String(percentage ?? '') },
      });
    }
    case 'string_attribute':
      return describeStringAttribute(policy.string_attribute as StringAttributeSummary);
    case 'drop':
      return describeStringAttribute(
        getDropSubPolicy(policy).string_attribute as StringAttributeSummary
      );
    default:
      return undefined;
  }
};

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

export type FormFieldName =
  | 'name'
  | 'key'
  | 'values'
  | 'status_codes'
  | 'threshold_ms'
  | 'upper_threshold_ms'
  | 'sampling_percentage';

// Errors of the policy in the flyout, by form field. `other` holds what belongs to no field.
export type PolicyFieldErrors = Partial<Record<FormFieldName, string>> & { other?: string[] };

const fieldErrorMessages: Record<FormFieldName, string> = {
  name: i18n.translate('xpack.apm.tailSampling.fieldError.name', {
    defaultMessage: 'Enter a policy name.',
  }),
  key: i18n.translate('xpack.apm.tailSampling.fieldError.key', {
    defaultMessage: 'Enter an attribute.',
  }),
  values: i18n.translate('xpack.apm.tailSampling.fieldError.values', {
    defaultMessage: 'Add at least one value.',
  }),
  status_codes: i18n.translate('xpack.apm.tailSampling.fieldError.statusCodes', {
    defaultMessage: 'Select at least one status.',
  }),
  threshold_ms: i18n.translate('xpack.apm.tailSampling.fieldError.thresholdMs', {
    defaultMessage: 'Enter a whole number of milliseconds, 0 or more.',
  }),
  upper_threshold_ms: i18n.translate('xpack.apm.tailSampling.fieldError.upperThresholdMs', {
    defaultMessage: 'Enter a whole number greater than the lower duration, or leave it empty.',
  }),
  sampling_percentage: i18n.translate('xpack.apm.tailSampling.fieldError.samplingPercentage', {
    defaultMessage: 'Enter a percentage above 0, up to 100.',
  }),
};

const duplicateNameMessage = i18n.translate('xpack.apm.tailSampling.fieldError.duplicateName', {
  defaultMessage: 'Another policy already uses this name.',
});

const isFormFieldName = (value: unknown): value is FormFieldName =>
  typeof value === 'string' && value in fieldErrorMessages;

/**
 * The field a diagnostic path points at: its last named segment. A `name` deeper than the
 * policy itself belongs to a sub-policy, which the form has no field for.
 */
export const getDiagnosticField = (path: Array<string | number> = []): string | undefined => {
  if (path.length === 1) {
    return String(path[0]);
  }
  const [field] = path
    .filter((segment) => typeof segment === 'string' && segment !== 'name')
    .slice(-1);
  return field === undefined ? undefined : String(field);
};

/** Runs the local policy checks on one policy and returns the errors by form field. */
export const getPolicyFieldErrors = (
  policy: TailSamplingPolicy,
  otherNames: string[]
): PolicyFieldErrors => {
  const errors: PolicyFieldErrors = {};
  for (const { path, message } of validateTailSamplingPolicies([policy])) {
    const field = getDiagnosticField(path);
    if (isFormFieldName(field)) {
      errors[field] = fieldErrorMessages[field];
    } else {
      errors.other = [...(errors.other ?? []), message];
    }
  }
  if (errors.name === undefined && otherNames.includes(policy.name)) {
    errors.name = duplicateNameMessage;
  }
  return errors;
};

export const hasPolicyFieldErrors = (errors: PolicyFieldErrors): boolean =>
  Object.keys(errors).length > 0;
