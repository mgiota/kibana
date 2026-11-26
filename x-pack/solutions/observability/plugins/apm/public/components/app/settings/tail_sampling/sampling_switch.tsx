/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingSpinner,
  EuiSwitch,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import type { TailSamplingResponse } from '@kbn/apm-api-shared';
import React, { useState } from 'react';
import { useApmPluginContext } from '../../../../context/apm_plugin/use_apm_plugin_context';
import { getApmInternalServices } from '../../../../plugin';

interface Props {
  saved: TailSamplingResponse;
  onChange: (response: TailSamplingResponse) => void;
}

/**
 * Turns sampling on and off with the saved policies. Unsaved edits stay a draft: turning on
 * saves the stored policies again, turning off keeps them for later.
 */
export function SamplingSwitch({ saved, onChange }: Props) {
  const { core } = useApmPluginContext();
  const [isUpdating, setIsUpdating] = useState(false);

  const turnOn = async () => {
    const { callApmApi } = getApmInternalServices();
    const response = await callApmApi('PUT /internal/tail_sampling', {
      signal: null,
      params: {
        body: { processor: saved.processor, config: saved.config, version: saved.version },
      },
    });
    core.notifications.toasts.addSuccess(
      i18n.translate('xpack.apm.tailSampling.enable.succeeded', {
        defaultMessage: 'Tail-based sampling is on.',
      })
    );
    onChange(response);
  };

  const turnOff = async () => {
    const { callApmApi } = getApmInternalServices();
    const response = await callApmApi('POST /internal/tail_sampling/_disable', { signal: null });
    core.notifications.toasts.addSuccess(
      i18n.translate('xpack.apm.tailSampling.disable.succeeded', {
        defaultMessage: 'Tail-based sampling is off. The saved policies are kept.',
      })
    );
    onChange(response);
  };

  const toggle = async (isOn: boolean) => {
    setIsUpdating(true);
    try {
      await (isOn ? turnOn() : turnOff());
    } catch (error) {
      core.notifications.toasts.addError(error, {
        title: isOn
          ? i18n.translate('xpack.apm.tailSampling.enable.failed', {
              defaultMessage: 'Tail-based sampling could not be turned on',
            })
          : i18n.translate('xpack.apm.tailSampling.disable.failed', {
              defaultMessage: 'Tail-based sampling could not be turned off',
            }),
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const switchControl = (
    <EuiSwitch
      data-test-subj="apmTailSamplingSwitch"
      label={
        saved.enabled
          ? i18n.translate('xpack.apm.tailSampling.switch.on', { defaultMessage: 'Sampling on' })
          : i18n.translate('xpack.apm.tailSampling.switch.off', {
              defaultMessage: 'Sampling off',
            })
      }
      checked={saved.enabled}
      // Nothing is stored to turn on before the first save.
      disabled={!saved.saved || isUpdating}
      onChange={(event) => toggle(event.target.checked)}
    />
  );

  // Sits at the top right of the page, on one line, centred on the title.
  return (
    <EuiFlexGroup
      alignItems="center"
      justifyContent="flexEnd"
      gutterSize="m"
      responsive={false}
      data-test-subj="apmTailSamplingSummary"
    >
      {isUpdating && (
        <EuiFlexItem grow={false}>
          <EuiLoadingSpinner size="m" />
        </EuiFlexItem>
      )}
      {!saved.enabled && (
        <EuiFlexItem grow={false}>
          <EuiText size="s" color="subdued" data-test-subj="apmTailSamplingOffNote">
            {i18n.translate('xpack.apm.tailSampling.switch.offNote', {
              defaultMessage: 'All traces are kept',
            })}
          </EuiText>
        </EuiFlexItem>
      )}
      <EuiFlexItem grow={false}>
        {saved.saved ? (
          switchControl
        ) : (
          <EuiToolTip
            content={i18n.translate('xpack.apm.tailSampling.switch.saveFirst', {
              defaultMessage: 'Save policies to turn sampling on.',
            })}
          >
            {/* A disabled switch does not trigger the tooltip, so it is wrapped. */}
            <span tabIndex={0}>{switchControl}</span>
          </EuiToolTip>
        )}
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}
