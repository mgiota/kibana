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
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiText,
  EuiTitle,
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
import { PolicyFlyout } from './policy_flyout';
import { PolicyList } from './policy_list';
import { StarterSetBoxes } from './starter_set_boxes';
import { DEFAULT_STARTER_SET, findStarterSet, getStarterSetPolicies } from './starter_sets';

interface Props {
  saved: TailSamplingResponse;
  onSaved: (response: TailSamplingResponse) => void;
}

export function PoliciesTab({ saved, onSaved }: Props) {
  const { core } = useApmPluginContext();
  const savedPolicies = saved.config.policies;
  // A project with nothing saved opens on a recommended set, as an unsaved draft.
  const [policies, setPolicies] = useState<TailSamplingPolicy[]>(() =>
    saved.saved ? savedPolicies : getStarterSetPolicies(DEFAULT_STARTER_SET)
  );
  const [validation, setValidation] = useState<{
    draftKey: string;
    response: ValidateTailSamplingResponse;
  }>();
  const [isSaving, setIsSaving] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);
  // The flyout is open when set. Without an index it adds a policy.
  const [flyout, setFlyout] = useState<{ index?: number }>();

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
  // Save validates on the server itself. It stays off while this exact draft is known to be invalid.
  const canSave =
    !isUnchanged && localDiagnostics.length === 0 && serverValidation?.valid !== false;
  const saveLabel = saved.enabled
    ? i18n.translate('xpack.apm.tailSampling.saveAndApply', {
        defaultMessage: 'Save and apply',
      })
    : i18n.translate('xpack.apm.tailSampling.saveAndEnable', {
        defaultMessage: 'Save and enable',
      });

  const policyNames = policies.map(({ name }) => String(name ?? ''));

  const updatePolicies = (next: TailSamplingPolicy[]) => {
    setPolicies(next);
  };

  // Validates the policies on the server and saves them when they are valid. When they are
  // not, nothing is saved and the errors show on the rows.
  const save = async (toSave: TailSamplingPolicy[]) => {
    setIsSaving(true);
    try {
      const { callApmApi } = getApmInternalServices();
      const config = { policies: toSave };
      const validated = await callApmApi('POST /internal/tail_sampling/_validate', {
        signal: null,
        params: { body: { processor: TAIL_SAMPLING_PROCESSOR, config } },
      });
      if (!validated.valid) {
        setValidation({ draftKey: JSON.stringify(toSave), response: validated });
        core.notifications.toasts.addDanger(
          i18n.translate('xpack.apm.tailSampling.save.invalid', {
            defaultMessage: 'The policies were not saved. Fix the errors and save again.',
          })
        );
        return;
      }
      const response = await callApmApi('PUT /internal/tail_sampling', {
        signal: null,
        params: {
          body: { processor: TAIL_SAMPLING_PROCESSOR, config, version: saved.version },
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

  // The saved policies are kept, so sampling can be turned on again with a normal save.
  const disable = async () => {
    setIsDisabling(true);
    try {
      const { callApmApi } = getApmInternalServices();
      const response = await callApmApi('POST /internal/tail_sampling/_disable', {
        signal: null,
      });
      core.notifications.toasts.addSuccess(
        i18n.translate('xpack.apm.tailSampling.disable.succeeded', {
          defaultMessage: 'Tail-based sampling is off. The saved policies are kept.',
        })
      );
      onSaved(response);
    } catch (error) {
      core.notifications.toasts.addError(error, {
        title: i18n.translate('xpack.apm.tailSampling.disable.failed', {
          defaultMessage: 'Tail-based sampling could not be turned off',
        }),
      });
    } finally {
      setIsDisabling(false);
    }
  };

  // Prototype: turns sampling back on by saving the stored policies again, as they are. The
  // PUT validates the body. It is disabled while the draft has unsaved edits, so it never
  // enables something other than what the page shows.
  const enable = async () => {
    setIsEnabling(true);
    try {
      const { callApmApi } = getApmInternalServices();
      const response = await callApmApi('PUT /internal/tail_sampling', {
        signal: null,
        params: {
          body: {
            processor: saved.processor,
            config: saved.config,
            version: saved.version,
          },
        },
      });
      core.notifications.toasts.addSuccess(
        i18n.translate('xpack.apm.tailSampling.enable.succeeded', {
          defaultMessage: 'Tail-based sampling is on.',
        })
      );
      onSaved(response);
    } catch (error) {
      core.notifications.toasts.addError(error, {
        title: i18n.translate('xpack.apm.tailSampling.enable.failed', {
          defaultMessage: 'Tail-based sampling could not be turned on',
        }),
      });
    } finally {
      setIsEnabling(false);
    }
  };

  // Nothing saved and nothing added: the empty state already says what to do, so do not show
  // the empty-list error on top of it.
  const showEmptyState = policies.length === 0 && !saved.saved;
  const globalDiagnostics = showEmptyState
    ? []
    : diagnostics.filter(({ policyIndex }) => policyIndex === undefined);
  const globalWarnings = warnings.filter(({ policyIndex }) => policyIndex === undefined);

  const renderPolicies = () => {
    if (policies.length > 0) {
      return (
        <PolicyList
          policies={policies}
          diagnostics={diagnostics}
          warnings={warnings}
          onEdit={(index) => setFlyout({ index })}
          onRemove={(index) => updatePolicies(policies.filter((_, i) => i !== index))}
        />
      );
    }

    // A saved list that was emptied: offer the recommended set next to the error.
    if (saved.saved) {
      return (
        <EuiButtonEmpty
          data-test-subj="apmTailSamplingFillWithStarterSet"
          iconType="starEmpty"
          onClick={() => updatePolicies(getStarterSetPolicies(DEFAULT_STARTER_SET))}
        >
          {i18n.translate('xpack.apm.tailSampling.fillWithStarterSet', {
            defaultMessage: 'Fill with the recommended set',
          })}
        </EuiButtonEmpty>
      );
    }

    return (
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
    );
  };

  return (
    <>
      {/* Only until the first save. Choosing a set replaces the draft. */}
      {!saved.saved && (
        <>
          <StarterSetBoxes
            selected={findStarterSet(policies)}
            onSelect={(id) => {
              updatePolicies(getStarterSetPolicies(id));
              setValidation(undefined);
            }}
          />
          <EuiSpacer size="l" />
        </>
      )}

      <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiTitle size="xs">
            <h3>
              {i18n.translate('xpack.apm.tailSampling.policies.title', {
                defaultMessage: 'Policies',
              })}
            </h3>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            data-test-subj="apmTailSamplingAddPolicy"
            iconType="plusCircle"
            size="s"
            onClick={() => setFlyout({})}
          >
            {i18n.translate('xpack.apm.tailSampling.addPolicy', {
              defaultMessage: 'Add policy',
            })}
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="m" />

      {globalDiagnostics.map((diagnostic, index) => {
        // Sampling is already off, so "disable it instead" does not apply. Ask for a policy.
        const isEmptyListWhileOff = diagnostic.code === 'no_policies' && !saved.enabled;
        return (
          <React.Fragment key={`${diagnostic.code}-${index}`}>
            {isEmptyListWhileOff ? (
              <EuiCallOut
                announceOnMount
                size="s"
                color="primary"
                data-test-subj="apmTailSamplingAddPolicyHint"
                title={i18n.translate('xpack.apm.tailSampling.noPoliciesWhileOff', {
                  defaultMessage: 'Add at least one policy to turn tail-based sampling on.',
                })}
              />
            ) : (
              <EuiCallOut
                announceOnMount
                size="s"
                iconType="error"
                color="danger"
                title={diagnostic.message}
              />
            )}
            <EuiSpacer size="s" />
          </React.Fragment>
        );
      })}
      {globalWarnings.map((warning, index) => (
        <React.Fragment key={`${warning.code}-${index}`}>
          <EuiCallOut size="s" iconType="warning" color="warning" title={warning.message} />
          <EuiSpacer size="s" />
        </React.Fragment>
      ))}

      {renderPolicies()}

      {flyout && (
        <PolicyFlyout
          policy={flyout.index === undefined ? undefined : policies[flyout.index]}
          existingNames={policyNames.filter((_, i) => i !== flyout.index)}
          onClose={() => setFlyout(undefined)}
          onSubmit={(next) => {
            updatePolicies(
              flyout.index === undefined
                ? [...policies, next]
                : policies.map((current, i) => (i === flyout.index ? next : current))
            );
            setFlyout(undefined);
          }}
        />
      )}

      <EuiSpacer size="l" />
      <EuiFlexGroup justifyContent="flexEnd" alignItems="center" gutterSize="s">
        {saved.enabled && (
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              data-test-subj="apmTailSamplingDisable"
              color="danger"
              isLoading={isDisabling}
              onClick={disable}
            >
              {i18n.translate('xpack.apm.tailSampling.disable', {
                defaultMessage: 'Disable sampling',
              })}
            </EuiButtonEmpty>
          </EuiFlexItem>
        )}
        {saved.saved && !saved.enabled && (
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              data-test-subj="apmTailSamplingEnable"
              iconType="play"
              isLoading={isEnabling}
              isDisabled={hasChanges}
              onClick={enable}
            >
              {i18n.translate('xpack.apm.tailSampling.enable', {
                defaultMessage: 'Enable sampling',
              })}
            </EuiButtonEmpty>
          </EuiFlexItem>
        )}
        {hasChanges && (
          <>
            <EuiFlexItem grow={false}>
              <EuiText size="xs" color="subdued" data-test-subj="apmTailSamplingUnsaved">
                {i18n.translate('xpack.apm.tailSampling.unsavedChanges', {
                  defaultMessage: 'Unsaved changes',
                })}
              </EuiText>
            </EuiFlexItem>
            {saved.saved && (
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  data-test-subj="apmTailSamplingRevert"
                  onClick={() => {
                    updatePolicies(savedPolicies);
                    setValidation(undefined);
                  }}
                >
                  {i18n.translate('xpack.apm.tailSampling.discard', {
                    defaultMessage: 'Discard changes',
                  })}
                </EuiButtonEmpty>
              </EuiFlexItem>
            )}
          </>
        )}
        {!saved.saved && (
          <EuiFlexItem grow={false}>
            <EuiText size="xs" color="subdued">
              {i18n.translate('xpack.apm.tailSampling.metricsReassurance', {
                defaultMessage: 'Service metrics keep using all traces.',
              })}
            </EuiText>
          </EuiFlexItem>
        )}
        <EuiFlexItem grow={false}>
          <EuiButton
            data-test-subj="apmTailSamplingSave"
            fill
            isLoading={isSaving}
            isDisabled={!canSave}
            onClick={() => save(policies)}
          >
            {saveLabel}
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
}
