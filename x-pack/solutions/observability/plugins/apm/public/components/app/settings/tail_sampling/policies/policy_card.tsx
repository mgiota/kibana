/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiBadge,
  EuiButtonIcon,
  EuiCheckboxGroup,
  EuiCodeBlock,
  EuiComboBox,
  EuiFieldNumber,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiPanel,
  EuiSpacer,
  EuiSwitch,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import type { TailSamplingPolicy } from '@kbn/apm-api-shared';
import React from 'react';
import { stringify } from 'yaml';
import { statusCodeValues } from '../../../../../../common/tail_sampling/policy_schema';
import { formPolicyLabels, getFormPolicyKind } from './form_policy';

interface StringAttributeBlock {
  key: string;
  values: string[];
  enabled_regex_matching?: boolean;
}

interface Props {
  policy: TailSamplingPolicy;
  onChange: (policy: TailSamplingPolicy) => void;
  onRemove: () => void;
}

// The default max width of EuiFormRow, so fields side by side match the policy name field.
const fieldItemCss = { width: 400 };

function toNumber(value: string): number | undefined {
  return value === '' ? undefined : Number(value);
}

function StringAttributeFields({
  block,
  onChange,
}: {
  block: StringAttributeBlock;
  onChange: (block: StringAttributeBlock) => void;
}) {
  return (
    <EuiFlexGroup gutterSize="m" wrap>
      <EuiFlexItem grow={false} css={fieldItemCss}>
        <EuiFormRow
          label={i18n.translate('xpack.apm.tailSampling.form.attributeKey', {
            defaultMessage: 'Attribute',
          })}
        >
          <EuiFieldText
            data-test-subj="apmTailSamplingAttributeKey"
            placeholder="customer.tier"
            value={block.key ?? ''}
            onChange={(event) => onChange({ ...block, key: event.target.value })}
          />
        </EuiFormRow>
      </EuiFlexItem>
      <EuiFlexItem grow={false} css={fieldItemCss}>
        <EuiFormRow
          label={i18n.translate('xpack.apm.tailSampling.form.attributeValues', {
            defaultMessage: 'Values',
          })}
        >
          <EuiComboBox
            data-test-subj="apmTailSamplingAttributeValues"
            noSuggestions
            selectedOptions={(block.values ?? []).map((value) => ({ label: value }))}
            onCreateOption={(value) =>
              onChange({ ...block, values: [...(block.values ?? []), value] })
            }
            onChange={(options) =>
              onChange({ ...block, values: options.map(({ label }) => label) })
            }
          />
        </EuiFormRow>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiFormRow hasEmptyLabelSpace>
          <EuiSwitch
            label={i18n.translate('xpack.apm.tailSampling.form.regex', {
              defaultMessage: 'Regular expressions',
            })}
            checked={block.enabled_regex_matching ?? false}
            onChange={(event) =>
              onChange({
                ...block,
                enabled_regex_matching: event.target.checked || undefined,
              })
            }
          />
        </EuiFormRow>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}

function PolicyFields({
  policy,
  onChange,
}: {
  policy: TailSamplingPolicy;
  onChange: (policy: TailSamplingPolicy) => void;
}) {
  switch (policy.type) {
    case 'status_code': {
      const block = policy.status_code as { status_codes: string[] };
      return (
        <EuiFormRow
          label={i18n.translate('xpack.apm.tailSampling.form.statusCodes', {
            defaultMessage: 'Keep traces with a span in status',
          })}
        >
          <EuiCheckboxGroup
            options={statusCodeValues.map((code) => ({ id: code, label: code }))}
            idToSelectedMap={Object.fromEntries(
              (block.status_codes ?? []).map((code) => [code, true])
            )}
            onChange={(code) => {
              const codes = block.status_codes ?? [];
              onChange({
                ...policy,
                status_code: {
                  status_codes: codes.includes(code)
                    ? codes.filter((value) => value !== code)
                    : [...codes, code],
                },
              });
            }}
          />
        </EuiFormRow>
      );
    }
    case 'latency': {
      const block = policy.latency as { threshold_ms?: number; upper_threshold_ms?: number };
      return (
        <EuiFlexGroup gutterSize="m" wrap>
          <EuiFlexItem grow={false} css={fieldItemCss}>
            <EuiFormRow
              label={i18n.translate('xpack.apm.tailSampling.form.thresholdMs', {
                defaultMessage: 'Trace duration at least',
              })}
            >
              <EuiFieldNumber
                data-test-subj="apmTailSamplingLatencyThreshold"
                min={0}
                append="ms"
                value={block.threshold_ms ?? ''}
                onChange={(event) =>
                  onChange({
                    ...policy,
                    latency: { ...block, threshold_ms: toNumber(event.target.value) },
                  })
                }
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem grow={false} css={fieldItemCss}>
            <EuiFormRow
              label={i18n.translate('xpack.apm.tailSampling.form.upperThresholdMs', {
                defaultMessage: 'and at most (optional)',
              })}
            >
              <EuiFieldNumber
                data-test-subj="apmTailSamplingLatencyUpperThreshold"
                min={0}
                append="ms"
                value={block.upper_threshold_ms ?? ''}
                onChange={(event) =>
                  onChange({
                    ...policy,
                    latency: { ...block, upper_threshold_ms: toNumber(event.target.value) },
                  })
                }
              />
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>
      );
    }
    case 'probabilistic': {
      const block = policy.probabilistic as { sampling_percentage?: number };
      return (
        <EuiFormRow
          label={i18n.translate('xpack.apm.tailSampling.form.percentage', {
            defaultMessage: 'Share of traces to keep',
          })}
        >
          <EuiFieldNumber
            data-test-subj="apmTailSamplingPercentage"
            min={0}
            max={100}
            step="any"
            append="%"
            value={block.sampling_percentage ?? ''}
            onChange={(event) =>
              onChange({
                ...policy,
                probabilistic: { sampling_percentage: toNumber(event.target.value) },
              })
            }
          />
        </EuiFormRow>
      );
    }
    case 'string_attribute':
      return (
        <StringAttributeFields
          block={policy.string_attribute as StringAttributeBlock}
          onChange={(block) => onChange({ ...policy, string_attribute: block })}
        />
      );
    case 'drop': {
      const [subPolicy] = (policy.drop as { drop_sub_policy: TailSamplingPolicy[] })
        .drop_sub_policy;
      return (
        <StringAttributeFields
          block={subPolicy.string_attribute as StringAttributeBlock}
          onChange={(block) =>
            onChange({
              ...policy,
              drop: { drop_sub_policy: [{ ...subPolicy, string_attribute: block }] },
            })
          }
        />
      );
    }
    default:
      return null;
  }
}

export function PolicyCard({ policy, onChange, onRemove }: Props) {
  const kind = getFormPolicyKind(policy);
  const isDrop = policy.type === 'drop';
  const removeLabel = i18n.translate('xpack.apm.tailSampling.form.remove', {
    defaultMessage: 'Remove policy',
  });

  return (
    <EuiPanel hasBorder paddingSize="m" data-test-subj="apmTailSamplingPolicyCard">
      <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiBadge color={isDrop ? 'danger' : 'hollow'}>{String(policy.type)}</EuiBadge>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText size="s">
            <strong>{kind ? formPolicyLabels[kind] : String(policy.name ?? '')}</strong>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiToolTip content={removeLabel} disableScreenReaderOutput>
            <EuiButtonIcon
              data-test-subj="apmTailSamplingRemovePolicy"
              iconType="trash"
              color="danger"
              aria-label={removeLabel}
              onClick={onRemove}
            />
          </EuiToolTip>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="m" />

      {kind ? (
        <EuiFlexGroup direction="column" gutterSize="m">
          <EuiFlexItem>
            <EuiFormRow
              label={i18n.translate('xpack.apm.tailSampling.form.name', {
                defaultMessage: 'Policy name',
              })}
            >
              <EuiFieldText
                data-test-subj="apmTailSamplingPolicyName"
                value={String(policy.name ?? '')}
                onChange={(event) => onChange({ ...policy, name: event.target.value })}
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem>
            <PolicyFields policy={policy} onChange={onChange} />
          </EuiFlexItem>
        </EuiFlexGroup>
      ) : (
        // The form can't edit this policy without losing settings. The YAML editor will.
        <EuiCodeBlock language="yaml" fontSize="s" paddingSize="s" isCopyable>
          {stringify(policy)}
        </EuiCodeBlock>
      )}
    </EuiPanel>
  );
}
