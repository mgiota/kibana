/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiButton,
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
import type { TailSamplingPolicy } from '@kbn/apm-api-shared';
import React, { useState } from 'react';
import { createFormPolicy, formPolicyKinds, formPolicyLabels } from './form_policy';
import { PolicyCard } from './policy_card';

interface Props {
  initialPolicies: TailSamplingPolicy[];
}

export function PoliciesTab({ initialPolicies }: Props) {
  const [policies, setPolicies] = useState<TailSamplingPolicy[]>(initialPolicies);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const policyNames = policies.map(({ name }) => String(name ?? ''));

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
                    setPolicies([...policies, createFormPolicy(kind, policyNames)]);
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

      {policies.length === 0 ? (
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
                onChange={(next) =>
                  setPolicies(policies.map((current, i) => (i === index ? next : current)))
                }
                onRemove={() => setPolicies(policies.filter((_, i) => i !== index))}
              />
            </EuiFlexItem>
          ))}
        </EuiFlexGroup>
      )}
    </>
  );
}
