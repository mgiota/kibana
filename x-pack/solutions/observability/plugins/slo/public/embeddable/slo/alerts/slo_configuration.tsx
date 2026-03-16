/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiFormRow,
  EuiTitle,
  useGeneratedHtmlId,
} from '@elastic/eui';
import { css } from '@emotion/react';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { ALL_VALUE } from '@kbn/slo-schema';
import type { SearchSLODefinitionItem } from '@kbn/slo-schema';
import React, { useState } from 'react';
import { SloDefinitionSelector } from '../overview/slo_definition_selector';
import { SloInstanceSelector } from '../overview/slo_instance_selector';
import type { AlertsCustomState, SloItem } from './types';

interface SloConfigurationProps {
  initialInput?: AlertsCustomState;
  onCreate: (props: AlertsCustomState) => void;
  onCancel: () => void;
}

interface SloRow {
  id: string;
  sloDefinition?: SearchSLODefinitionItem;
  instanceId?: string;
}

function toSloItem(row: SloRow): SloItem | undefined {
  if (!row.sloDefinition) return undefined;
  const hasGroupBy =
    row.sloDefinition.groupBy &&
    row.sloDefinition.groupBy.length > 0 &&
    !row.sloDefinition.groupBy.includes(ALL_VALUE);

  return {
    slo_id: row.sloDefinition.id,
    slo_instance_id: hasGroupBy ? row.instanceId ?? ALL_VALUE : ALL_VALUE,
    name: row.sloDefinition.name,
    group_by: [row.sloDefinition.groupBy].flat().filter(Boolean) as string[],
  };
}

export function SloConfiguration({ initialInput, onCreate, onCancel }: SloConfigurationProps) {
  const [rows, setRows] = useState<SloRow[]>(() => {
    const initial = initialInput?.slos ?? [];
    if (initial.length === 0) {
      return [{ id: 'row-0' }];
    }
    return initial.map((slo, idx) => ({
      id: `row-${idx}`,
      sloDefinition: {
        id: slo.slo_id,
        name: slo.name,
        groupBy: slo.group_by,
      } as SearchSLODefinitionItem,
      instanceId: slo.slo_instance_id,
    }));
  });

  const [hasError, setHasError] = useState(false);
  const [rowErrors, setRowErrors] = useState<Record<string, boolean>>({});

  const addRow = () => {
    setRows((prev) => [...prev, { id: `row-${Date.now()}` }]);
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    setRowErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const updateRow = (id: string, update: Partial<SloRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...update } : r)));
  };

  const onConfirmClick = () => {
    const slos: SloItem[] = [];
    const errors: Record<string, boolean> = {};

    for (const row of rows) {
      const item = toSloItem(row);
      if (!item) {
        if (row.sloDefinition !== undefined || row.instanceId !== undefined) {
          errors[row.id] = true;
        }
        continue;
      }
      if (!row.sloDefinition) {
        errors[row.id] = true;
        continue;
      }
      const hasGroupBy =
        row.sloDefinition.groupBy &&
        row.sloDefinition.groupBy.length > 0 &&
        !row.sloDefinition.groupBy.includes(ALL_VALUE);
      if (hasGroupBy && !row.instanceId) {
        errors[row.id] = true;
        continue;
      }
      slos.push(item);
    }

    setRowErrors(errors);
    setHasError(Object.keys(errors).length > 0);

    if (Object.keys(errors).length === 0 && slos.length > 0) {
      onCreate({ slos });
    }
  };

  const flyoutTitleId = useGeneratedHtmlId({
    prefix: 'alertsConfigurationFlyout',
  });

  return (
    <EuiFlyout
      onClose={onCancel}
      css={css`
        min-width: 550px;
      `}
      aria-labelledby={flyoutTitleId}
    >
      <EuiFlyoutHeader>
        <EuiTitle>
          <h2 id={flyoutTitleId}>
            {i18n.translate('xpack.slo.sloEmbeddable.config.sloSelector.headerTitle', {
              defaultMessage: 'Alerts configuration',
            })}
          </h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiFlexGroup direction="column" gutterSize="m">
          {rows.map((row) => {
            const hasGroupBy =
              row.sloDefinition?.groupBy &&
              row.sloDefinition.groupBy.length > 0 &&
              !row.sloDefinition.groupBy.includes(ALL_VALUE);
            const showInstanceSelector = hasGroupBy && !!row.sloDefinition;
            const rowHasError = rowErrors[row.id];

            return (
              <EuiFlexItem key={row.id}>
                <EuiFlexGroup
                  gutterSize="s"
                  alignItems="flexEnd"
                  css={css`
                    padding: 12px;
                    background: var(--euiColorEmptyShade);
                    border: 1px solid var(--euiColorLightShade);
                    border-radius: 4px;
                  `}
                >
                  <EuiFlexItem grow>
                    <EuiFlexGroup direction="column" gutterSize="s">
                      <EuiFlexItem>
                        <SloDefinitionSelector
                          initialSelected={row.sloDefinition}
                          onSelected={(slo) => {
                            updateRow(row.id, {
                              sloDefinition: slo,
                              instanceId: undefined,
                            });
                            setRowErrors((prev) => ({ ...prev, [row.id]: slo === undefined }));
                          }}
                          hasError={rowHasError && !row.sloDefinition}
                        />
                      </EuiFlexItem>
                      {showInstanceSelector && (
                        <EuiFlexItem>
                          <SloInstanceSelector
                            sloId={row.sloDefinition!.id}
                            remoteName={row.sloDefinition?.remote?.remoteName}
                            initialSelected={row.instanceId}
                            onSelected={(instanceId) => {
                              updateRow(row.id, { instanceId });
                            }}
                            hasError={rowHasError && hasGroupBy && !row.instanceId}
                          />
                        </EuiFlexItem>
                      )}
                    </EuiFlexGroup>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButtonEmpty
                      color="danger"
                      iconType="trash"
                      onClick={() => removeRow(row.id)}
                      aria-label={i18n.translate('xpack.slo.sloConfiguration.removeRowAriaLabel', {
                        defaultMessage: 'Remove SLO',
                      })}
                      data-test-subj={`sloAlertsConfigRemoveRow-${row.id}`}
                    />
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
            );
          })}
          <EuiFlexItem>
            <EuiFormRow>
              <EuiButtonEmpty
                iconType="plusInCircle"
                onClick={addRow}
                data-test-subj="sloAlertsConfigAddRow"
              >
                {i18n.translate('xpack.slo.sloConfiguration.addSloButton', {
                  defaultMessage: 'Add SLO',
                })}
              </EuiButtonEmpty>
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutBody>
      <EuiFlyoutFooter>
        <EuiFlexGroup justifyContent="spaceBetween">
          <EuiButtonEmpty onClick={onCancel} data-test-subj="sloCancelButton">
            <FormattedMessage
              id="xpack.slo.Embeddable.config.cancelButtonLabel"
              defaultMessage="Cancel"
            />
          </EuiButtonEmpty>

          <EuiButton
            data-test-subj="sloConfirmButton"
            isDisabled={hasError || rows.every((r) => !r.sloDefinition)}
            onClick={onConfirmClick}
            fill
          >
            <FormattedMessage
              id="xpack.slo.embeddableSlo.config.confirmButtonLabel"
              defaultMessage="Confirm configurations"
            />
          </EuiButton>
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </EuiFlyout>
  );
}
