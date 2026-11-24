/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPopover,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import {
  TAIL_SAMPLING_PROCESSOR,
  type TailSamplingPolicy,
  type TailSamplingResponse,
  type ValidateTailSamplingResponse,
} from '@kbn/apm-api-shared';
import React, { useMemo, useState } from 'react';
import {
  normalizeTailSamplingConfig,
  validateTailSamplingPolicies,
} from '../../../../../../common/tail_sampling';
import { useApmPluginContext } from '../../../../../context/apm_plugin/use_apm_plugin_context';
import { getApmInternalServices } from '../../../../../plugin';
import { createFormPolicy, formPolicyKinds, formPolicyLabels } from './form_policy';
import { PolicyCard } from './policy_card';

interface Props {
  saved: TailSamplingResponse;
  onSaved: (response: TailSamplingResponse) => void;
}

const formatPath = (path?: Array<string | number>) => (path?.length ? path.join('.') : undefined);

export function PoliciesTab({ saved, onSaved }: Props) {
  const { core } = useApmPluginContext();
  const savedPolicies = saved.config.policies;
  const [policies, setPolicies] = useState<TailSamplingPolicy[]>(savedPolicies);
  const [validation, setValidation] = useState<{
    draftKey: string;
    response: ValidateTailSamplingResponse;
  }>();
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const draftKey = JSON.stringify(policies);
  const localDiagnostics = useMemo(() => validateTailSamplingPolicies(policies), [policies]);
  const serverValidation = validation?.draftKey === draftKey ? validation.response : undefined;
  const diagnostics = serverValidation?.diagnostics ?? localDiagnostics;
  const warnings = serverValidation?.warnings ?? [];
  // Saved policies are stored normalized, so compare normalized forms.
  const hasChanges =
    JSON.stringify(normalizeTailSamplingConfig(policies)) !==
    JSON.stringify(normalizeTailSamplingConfig(savedPolicies));
  const isUnchanged = saved.saved && saved.enabled && !hasChanges;
  const canSave = !!serverValidation?.valid && !isUnchanged;

  const policyNames = policies.map(({ name }) => String(name ?? ''));

  const updatePolicies = (next: TailSamplingPolicy[]) => {
    setPolicies(next);
  };

  const validate = async () => {
    setIsValidating(true);
    try {
      const { callApmApi } = getApmInternalServices();
      const response = await callApmApi('POST /internal/tail_sampling/_validate', {
        signal: null,
        params: {
          body: { processor: TAIL_SAMPLING_PROCESSOR, config: { policies } },
        },
      });
      setValidation({ draftKey, response });
    } catch (error) {
      core.notifications.toasts.addError(error, {
        title: i18n.translate('xpack.apm.tailSampling.validate.failed', {
          defaultMessage: 'Validation is unavailable. The policies were not saved.',
        }),
      });
    } finally {
      setIsValidating(false);
    }
  };

  const save = async () => {
    if (!serverValidation) {
      return;
    }
    setIsSaving(true);
    try {
      const { callApmApi } = getApmInternalServices();
      const response = await callApmApi('PUT /internal/tail_sampling', {
        signal: null,
        params: {
          body: {
            processor: TAIL_SAMPLING_PROCESSOR,
            config: { policies },
            version: saved.version,
          },
        },
      });
      core.notifications.toasts.addSuccess(
        i18n.translate('xpack.apm.tailSampling.save.succeeded', {
          defaultMessage: 'Policies saved.',
        })
      );
      setValidation(undefined);
      onSaved(response);
    } catch (error) {
      core.notifications.toasts.addError(error, {
        title: i18n.translate('xpack.apm.tailSampling.save.failed', {
          defaultMessage: 'The policies could not be saved',
        }),
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Nothing saved and nothing added: the empty state already says what to do, so do not show
  // the empty-list error on top of it.
  const showEmptyState = policies.length === 0 && !saved.saved;
  const globalDiagnostics = showEmptyState
    ? []
    : diagnostics.filter(({ policyIndex }) => policyIndex === undefined);
  const globalWarnings = warnings.filter(({ policyIndex }) => policyIndex === undefined);

  return (
    <>
      <EuiText size="s" color="subdued">
        <p>
          {i18n.translate('xpack.apm.tailSampling.policies.description', {
            defaultMessage:
              'Each trace is checked against every policy once it completes. It is kept when any policy keeps it, unless a drop policy matches. Policy order does not matter. Traces that match no policy are not kept.',
          })}
        </p>
      </EuiText>
      <EuiSpacer size="m" />

      <EuiFlexGroup justifyContent="flexEnd">
        <EuiFlexItem grow={false}>
          <EuiPopover
            aria-label={i18n.translate('xpack.apm.tailSampling.addPolicy.menu', {
              defaultMessage: 'Policy types',
            })}
            isOpen={isAddMenuOpen}
            closePopover={() => setIsAddMenuOpen(false)}
            panelPaddingSize="none"
            anchorPosition="downRight"
            button={
              <EuiButton
                data-test-subj="apmTailSamplingAddPolicy"
                iconType="plusCircle"
                size="s"
                onClick={() => setIsAddMenuOpen((open) => !open)}
              >
                {i18n.translate('xpack.apm.tailSampling.addPolicy', {
                  defaultMessage: 'Add policy',
                })}
              </EuiButton>
            }
          >
            <EuiContextMenuPanel
              items={formPolicyKinds.map((kind) => (
                <EuiContextMenuItem
                  key={kind}
                  data-test-subj={`apmTailSamplingAddPolicy_${kind}`}
                  onClick={() => {
                    setIsAddMenuOpen(false);
                    updatePolicies([...policies, createFormPolicy(kind, policyNames)]);
                  }}
                >
                  {formPolicyLabels[kind]}
                </EuiContextMenuItem>
              ))}
            />
          </EuiPopover>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="m" />

      {globalDiagnostics.map((diagnostic, index) => (
        <React.Fragment key={`${diagnostic.code}-${index}`}>
          <EuiCallOut size="s" iconType="error" color="danger" title={diagnostic.message} />
          <EuiSpacer size="s" />
        </React.Fragment>
      ))}
      {globalWarnings.map((warning, index) => (
        <React.Fragment key={`${warning.code}-${index}`}>
          <EuiCallOut size="s" iconType="warning" color="warning" title={warning.message} />
          <EuiSpacer size="s" />
        </React.Fragment>
      ))}

      {showEmptyState ? (
        <EuiEmptyPrompt
          data-test-subj="apmTailSamplingEmpty"
          iconType="flask"
          title={
            <h3>
              {i18n.translate('xpack.apm.tailSampling.empty.title', {
                defaultMessage: 'Tail-based sampling is not set up',
              })}
            </h3>
          }
          body={
            <p>
              {i18n.translate('xpack.apm.tailSampling.empty.body', {
                defaultMessage: 'All traces are kept until you add sampling policies.',
              })}
            </p>
          }
        />
      ) : (
        <EuiFlexGroup direction="column" gutterSize="s">
          {policies.map((policy, index) => (
            <EuiFlexItem key={index}>
              <PolicyCard
                policy={policy}
                diagnostics={diagnostics
                  .filter(({ policyIndex }) => policyIndex === index)
                  .map(({ message, path }) => ({ message, path: formatPath(path) }))}
                warnings={warnings
                  .filter(({ policyIndex }) => policyIndex === index)
                  .map(({ message, path }) => ({ message, path: formatPath(path) }))}
                onChange={(next) =>
                  updatePolicies(policies.map((current, i) => (i === index ? next : current)))
                }
                onRemove={() => updatePolicies(policies.filter((_, i) => i !== index))}
              />
            </EuiFlexItem>
          ))}
        </EuiFlexGroup>
      )}

      <EuiSpacer size="l" />
      <EuiFlexGroup justifyContent="flexEnd" alignItems="center" gutterSize="s">
        {serverValidation?.valid && (
          <EuiFlexItem grow={false}>
            <EuiText size="xs" color="success" data-test-subj="apmTailSamplingValidated">
              {i18n.translate('xpack.apm.tailSampling.validated', {
                defaultMessage: 'Validated, hash {hash}',
                values: { hash: serverValidation.hash.slice(0, 8) },
              })}
            </EuiText>
          </EuiFlexItem>
        )}
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty
            data-test-subj="apmTailSamplingRevert"
            isDisabled={!hasChanges}
            onClick={() => {
              updatePolicies(savedPolicies);
              setValidation(undefined);
            }}
          >
            {i18n.translate('xpack.apm.tailSampling.revert', {
              defaultMessage: 'Revert changes',
            })}
          </EuiButtonEmpty>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            data-test-subj="apmTailSamplingValidate"
            isLoading={isValidating}
            isDisabled={localDiagnostics.length > 0 || !!serverValidation}
            onClick={validate}
          >
            {i18n.translate('xpack.apm.tailSampling.validate', { defaultMessage: 'Validate' })}
          </EuiButton>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            data-test-subj="apmTailSamplingSave"
            fill
            isLoading={isSaving}
            isDisabled={!canSave}
            onClick={save}
          >
            {saved.enabled
              ? i18n.translate('xpack.apm.tailSampling.saveAndApply', {
                  defaultMessage: 'Save and apply',
                })
              : i18n.translate('xpack.apm.tailSampling.saveAndEnable', {
                  defaultMessage: 'Save and enable',
                })}
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
}
