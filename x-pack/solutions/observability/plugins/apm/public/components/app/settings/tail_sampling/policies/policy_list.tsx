/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiBadge,
  EuiButtonIcon,
  EuiCode,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import type { TailSamplingPolicy, ValidateTailSamplingResponse } from '@kbn/apm-api-shared';
import React from 'react';
import {
  describePolicy,
  getDiagnosticField,
  getPolicyAction,
  type PolicyAction,
} from './form_policy';

type Diagnostics = ValidateTailSamplingResponse['diagnostics'];

interface Props {
  policies: TailSamplingPolicy[];
  diagnostics: Diagnostics;
  warnings: Diagnostics;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
}

interface Row {
  policy: TailSamplingPolicy;
  // Position in the stored list. Grouping only changes how the policies are shown.
  index: number;
}

const groups: Array<{ action: PolicyAction; title: string; description: string }> = [
  {
    action: 'drop',
    title: i18n.translate('xpack.apm.tailSampling.list.drop.title', { defaultMessage: 'Drop' }),
    description: i18n.translate('xpack.apm.tailSampling.list.drop.description', {
      defaultMessage:
        'A trace that matches a drop policy is not kept, even if a keep policy also matches.',
    }),
  },
  {
    action: 'keep',
    title: i18n.translate('xpack.apm.tailSampling.list.keep.title', { defaultMessage: 'Keep' }),
    description: i18n.translate('xpack.apm.tailSampling.list.keep.description', {
      defaultMessage: 'A trace is kept if any of these policies matches.',
    }),
  },
];

const editLabel = i18n.translate('xpack.apm.tailSampling.list.edit', {
  defaultMessage: 'Edit policy',
});
const viewLabel = i18n.translate('xpack.apm.tailSampling.list.view', {
  defaultMessage: 'View policy',
});
const removeLabel = i18n.translate('xpack.apm.tailSampling.form.remove', {
  defaultMessage: 'Remove policy',
});

// Shows the field a diagnostic is about, not its whole path inside the policy.
const formatMessage = ({ message, path }: Diagnostics[number]) => {
  const field = getDiagnosticField(path);
  return field === undefined ? message : `${field}: ${message}`;
};

function PolicyRow({
  row: { policy, index },
  action,
  actionLabel,
  diagnostics,
  warnings,
  onEdit,
  onRemove,
}: {
  row: Row;
  action: PolicyAction;
  actionLabel: string;
  diagnostics: Diagnostics;
  warnings: Diagnostics;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
}) {
  const summary = describePolicy(policy);
  const openLabel = summary === undefined ? viewLabel : editLabel;

  return (
    <EuiPanel hasBorder paddingSize="s" data-test-subj="apmTailSamplingPolicyRow">
      <EuiFlexGroup alignItems="center" gutterSize="m" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiBadge color={action === 'drop' ? 'danger' : 'primary'}>{actionLabel}</EuiBadge>
        </EuiFlexItem>
        <EuiFlexItem grow={2}>
          <EuiText size="s">
            <strong>{policy.name}</strong>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={3}>
          {summary === undefined ? (
            <EuiText size="s" color="subdued">
              <EuiCode>{policy.type}</EuiCode>
            </EuiText>
          ) : (
            <EuiText size="s">{summary}</EuiText>
          )}
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiToolTip content={openLabel} disableScreenReaderOutput>
            <EuiButtonIcon
              data-test-subj="apmTailSamplingEditPolicy"
              iconType={summary === undefined ? 'eye' : 'pencil'}
              aria-label={openLabel}
              onClick={() => onEdit(index)}
            />
          </EuiToolTip>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiToolTip content={removeLabel} disableScreenReaderOutput>
            <EuiButtonIcon
              data-test-subj="apmTailSamplingRemovePolicy"
              iconType="trash"
              color="danger"
              aria-label={removeLabel}
              onClick={() => onRemove(index)}
            />
          </EuiToolTip>
        </EuiFlexItem>
      </EuiFlexGroup>
      {diagnostics.map((diagnostic, diagnosticIndex) => (
        <EuiText
          key={`error-${diagnosticIndex}`}
          size="xs"
          color="danger"
          data-test-subj="apmTailSamplingPolicyRowError"
        >
          {formatMessage(diagnostic)}
        </EuiText>
      ))}
      {warnings.map((warning, warningIndex) => (
        <EuiText key={`warning-${warningIndex}`} size="xs" color="warning">
          {formatMessage(warning)}
        </EuiText>
      ))}
    </EuiPanel>
  );
}

export function PolicyList({ policies, diagnostics, warnings, onEdit, onRemove }: Props) {
  const rows: Row[] = policies.map((policy, index) => ({ policy, index }));

  return (
    <>
      {groups.map(({ action, title, description }) => {
        const groupRows = rows.filter(({ policy }) => getPolicyAction(policy) === action);
        if (groupRows.length === 0) {
          return null;
        }
        return (
          <React.Fragment key={action}>
            <EuiText size="xs" data-test-subj={`apmTailSamplingPolicyGroup_${action}`}>
              <h3>{title}</h3>
              <p>{description}</p>
            </EuiText>
            <EuiSpacer size="s" />
            <EuiFlexGroup direction="column" gutterSize="s">
              {groupRows.map((row) => (
                <EuiFlexItem key={row.index}>
                  <PolicyRow
                    row={row}
                    action={action}
                    actionLabel={title}
                    diagnostics={diagnostics.filter(({ policyIndex }) => policyIndex === row.index)}
                    warnings={warnings.filter(({ policyIndex }) => policyIndex === row.index)}
                    onEdit={onEdit}
                    onRemove={onRemove}
                  />
                </EuiFlexItem>
              ))}
            </EuiFlexGroup>
            <EuiSpacer size="l" />
          </React.Fragment>
        );
      })}
    </>
  );
}
