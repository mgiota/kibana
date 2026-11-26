/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiButton,
  EuiButtonEmpty,
  EuiButtonGroup,
  EuiCodeBlock,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiFormRow,
  EuiRadioGroup,
  EuiSpacer,
  EuiText,
  EuiTitle,
  useGeneratedHtmlId,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import type { TailSamplingPolicy } from '@kbn/apm-api-shared';
import React, { useState } from 'react';
import { stringify } from 'yaml';
import {
  createFormPolicy,
  formPolicyTypeLabels,
  formPolicyTypes,
  getFormPolicyKind,
  getFormPolicyType,
  getPolicyAction,
  getPolicyFieldErrors,
  hasPolicyFieldErrors,
  setAttributePolicyAction,
  type FormPolicyType,
  type PolicyAction,
  type PolicyFieldErrors,
} from './form_policy';
import { PolicyFields } from './policy_fields';

interface Props {
  // The policy to edit. Undefined when adding one.
  policy?: TailSamplingPolicy;
  // Names of the other policies in the list. A policy name must not repeat one of them.
  existingNames: string[];
  onSubmit: (policy: TailSamplingPolicy) => void;
  onClose: () => void;
}

const actionLabels: Record<PolicyAction, string> = {
  keep: i18n.translate('xpack.apm.tailSampling.flyout.keep', { defaultMessage: 'Keep' }),
  drop: i18n.translate('xpack.apm.tailSampling.flyout.drop', { defaultMessage: 'Drop' }),
};

const actionRowLabel = i18n.translate('xpack.apm.tailSampling.flyout.actionLabel', {
  defaultMessage: 'When a trace matches',
});

const actionOptions = (Object.keys(actionLabels) as PolicyAction[]).map((action) => ({
  id: action,
  label: actionLabels[action],
  'data-test-subj': `apmTailSamplingPolicyAction_${action}`,
}));

const noErrors: PolicyFieldErrors = {};

const typeOptions = formPolicyTypes.map((type) => ({
  id: type,
  label: formPolicyTypeLabels[type],
  'data-test-subj': `apmTailSamplingPolicyType_${type}`,
}));

export function PolicyFlyout({ policy, existingNames, onSubmit, onClose }: Props) {
  const isNew = policy === undefined;
  const [draft, setDraft] = useState<TailSamplingPolicy>(
    () => policy ?? createFormPolicy('status_code', existingNames)
  );
  // A new policy keeps its generated name until the user types one.
  const [isNameEdited, setIsNameEdited] = useState(!isNew);
  const titleId = useGeneratedHtmlId({ prefix: 'apmTailSamplingPolicyFlyout' });
  const typeGroupName = useGeneratedHtmlId({ prefix: 'apmTailSamplingPolicyType' });

  // A new policy shows no errors until the user tries to add it.
  const [showErrors, setShowErrors] = useState(!isNew);

  const kind = getFormPolicyKind(draft);
  const action = getPolicyAction(draft);
  const fieldErrors = getPolicyFieldErrors(draft, existingNames);
  const errors = showErrors ? fieldErrors : noErrors;

  const submit = () => {
    if (hasPolicyFieldErrors(fieldErrors)) {
      setShowErrors(true);
      return;
    }
    onSubmit(draft);
  };

  const changeType = (type: FormPolicyType) => {
    const next = createFormPolicy(type, existingNames);
    setDraft(isNameEdited ? { ...next, name: draft.name } : next);
    setShowErrors(false);
  };

  const changeAction = (nextAction: PolicyAction) => {
    const generatedName = createFormPolicy(
      nextAction === 'drop' ? 'drop' : 'string_attribute',
      existingNames
    ).name;
    setDraft(
      setAttributePolicyAction(draft, nextAction, isNameEdited ? draft.name : generatedName)
    );
  };

  const title = isNew
    ? i18n.translate('xpack.apm.tailSampling.flyout.addTitle', { defaultMessage: 'Add policy' })
    : kind
    ? i18n.translate('xpack.apm.tailSampling.flyout.editTitle', { defaultMessage: 'Edit policy' })
    : i18n.translate('xpack.apm.tailSampling.flyout.viewTitle', { defaultMessage: 'View policy' });

  return (
    <EuiFlyout
      onClose={onClose}
      size="m"
      aria-labelledby={titleId}
      data-test-subj="apmTailSamplingPolicyFlyout"
    >
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="m">
          <h2 id={titleId}>{title}</h2>
        </EuiTitle>
      </EuiFlyoutHeader>

      <EuiFlyoutBody>
        {kind ? (
          <>
            {isNew && (
              <EuiFormRow
                label={i18n.translate('xpack.apm.tailSampling.flyout.type', {
                  defaultMessage: 'Type',
                })}
              >
                <EuiRadioGroup
                  data-test-subj="apmPolicyFlyoutRadioGroup"
                  name={typeGroupName}
                  options={typeOptions}
                  idSelected={getFormPolicyType(kind)}
                  onChange={(id) => changeType(id as FormPolicyType)}
                />
              </EuiFormRow>
            )}
            <EuiFormRow
              label={i18n.translate('xpack.apm.tailSampling.form.name', {
                defaultMessage: 'Policy name',
              })}
              isInvalid={errors.name !== undefined}
              error={errors.name}
            >
              <EuiFieldText
                data-test-subj="apmTailSamplingPolicyName"
                isInvalid={errors.name !== undefined}
                value={draft.name}
                onChange={(event) => {
                  setIsNameEdited(true);
                  setDraft({ ...draft, name: event.target.value });
                }}
              />
            </EuiFormRow>
            <EuiSpacer size="m" />
            <PolicyFields policy={draft} errors={errors} onChange={setDraft} />
            {errors.other?.map((message, index) => (
              <EuiText
                key={index}
                size="xs"
                color="danger"
                data-test-subj="apmTailSamplingPolicyFlyoutError"
              >
                {message}
              </EuiText>
            ))}
            {(kind === 'string_attribute' || kind === 'drop') && (
              <>
                <EuiSpacer size="m" />
                <EuiFormRow
                  label={actionRowLabel}
                  helpText={
                    action === 'drop'
                      ? i18n.translate('xpack.apm.tailSampling.flyout.dropHelp', {
                          defaultMessage:
                            'The trace is not kept, even if a keep policy also matches.',
                        })
                      : undefined
                  }
                >
                  <EuiButtonGroup
                    legend={actionRowLabel}
                    options={actionOptions}
                    idSelected={action}
                    onChange={(id) => changeAction(id as PolicyAction)}
                    color={action === 'drop' ? 'danger' : 'primary'}
                  />
                </EuiFormRow>
              </>
            )}
          </>
        ) : (
          <>
            <EuiText size="s" color="subdued">
              <p>
                {i18n.translate('xpack.apm.tailSampling.flyout.readOnly', {
                  defaultMessage:
                    'The form cannot edit this policy without losing some of its settings. It is saved as it is.',
                })}
              </p>
            </EuiText>
            <EuiSpacer size="m" />
            <EuiCodeBlock language="yaml" fontSize="s" paddingSize="s" isCopyable>
              {stringify(draft)}
            </EuiCodeBlock>
          </>
        )}
      </EuiFlyoutBody>

      <EuiFlyoutFooter>
        <EuiFlexGroup justifyContent="spaceBetween" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty data-test-subj="apmTailSamplingPolicyFlyoutCancel" onClick={onClose}>
              {kind
                ? i18n.translate('xpack.apm.tailSampling.flyout.cancel', {
                    defaultMessage: 'Cancel',
                  })
                : i18n.translate('xpack.apm.tailSampling.flyout.close', {
                    defaultMessage: 'Close',
                  })}
            </EuiButtonEmpty>
          </EuiFlexItem>
          {kind && (
            <EuiFlexItem grow={false}>
              <EuiButton
                data-test-subj="apmTailSamplingPolicyFlyoutSubmit"
                fill
                isDisabled={showErrors && hasPolicyFieldErrors(fieldErrors)}
                onClick={submit}
              >
                {isNew
                  ? i18n.translate('xpack.apm.tailSampling.flyout.add', {
                      defaultMessage: 'Add policy',
                    })
                  : i18n.translate('xpack.apm.tailSampling.flyout.update', {
                      defaultMessage: 'Update policy',
                    })}
              </EuiButton>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </EuiFlyout>
  );
}
