/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiBadge,
  EuiCheckableCard,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiText,
  useGeneratedHtmlId,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import React from 'react';
import {
  DEFAULT_STARTER_SET,
  getStarterSetPercentage,
  starterSetIds,
  type StarterSetId,
} from './starter_sets';

interface Props {
  // The set the list is equal to. Undefined once the list was edited.
  selected?: StarterSetId;
  // Choosing a set replaces the list.
  onSelect: (id: StarterSetId) => void;
}

const setLabels: Record<StarterSetId, string> = {
  balanced: i18n.translate('xpack.apm.tailSampling.starterSet.balanced', {
    defaultMessage: 'Balanced',
  }),
  more: i18n.translate('xpack.apm.tailSampling.starterSet.more', {
    defaultMessage: 'Keep more',
  }),
  empty: i18n.translate('xpack.apm.tailSampling.starterSet.empty', {
    defaultMessage: 'Empty',
  }),
};

export function StarterSetBoxes({ selected, onSelect }: Props) {
  const radioName = useGeneratedHtmlId({ prefix: 'apmTailSamplingStarterSet' });

  return (
    <div data-test-subj="apmTailSamplingStartFrom">
      <EuiText size="s">
        <strong>
          {i18n.translate('xpack.apm.tailSampling.startFrom', {
            defaultMessage: 'Start from',
          })}
        </strong>
      </EuiText>
      <EuiSpacer size="s" />
      <EuiFlexGroup gutterSize="m" alignItems="stretch">
        {starterSetIds.map((id) => {
          const percentage = getStarterSetPercentage(id);
          return (
            <EuiFlexItem key={id} data-test-subj={`apmTailSamplingStarterSet_${id}`}>
              <EuiCheckableCard
                id={`${radioName}_${id}`}
                name={radioName}
                value={id}
                checked={selected === id}
                onChange={() => onSelect(id)}
                css={{ height: '100%' }}
                label={
                  <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                    <EuiFlexItem grow={false}>
                      <strong>{setLabels[id]}</strong>
                    </EuiFlexItem>
                    {id === DEFAULT_STARTER_SET && (
                      <EuiFlexItem grow={false}>
                        <EuiBadge color="primary">
                          {i18n.translate('xpack.apm.tailSampling.starterSet.recommended', {
                            defaultMessage: 'Recommended',
                          })}
                        </EuiBadge>
                      </EuiFlexItem>
                    )}
                  </EuiFlexGroup>
                }
              >
                {/* One line that says what the list below does not: the outcome of the set. */}
                {percentage === undefined ? (
                  <EuiText size="s" color="subdued">
                    {i18n.translate('xpack.apm.tailSampling.starterSet.emptyDescription', {
                      defaultMessage: 'No policies. Add your own.',
                    })}
                  </EuiText>
                ) : (
                  <EuiText size="s">
                    <FormattedMessage
                      id="xpack.apm.tailSampling.starterSet.description"
                      defaultMessage="Errors, slow traces and {share} of all traces"
                      values={{ share: <strong>{`${percentage}%`}</strong> }}
                    />
                  </EuiText>
                )}
              </EuiCheckableCard>
            </EuiFlexItem>
          );
        })}
      </EuiFlexGroup>
    </div>
  );
}
