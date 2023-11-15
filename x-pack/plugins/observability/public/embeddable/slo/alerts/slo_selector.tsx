/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { EuiComboBox, EuiComboBoxOptionOption, EuiFormRow } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { debounce } from 'lodash';
import { ALL_VALUE, SLOWithSummaryResponse } from '@kbn/slo-schema';
import { useFetchSloList } from '../../../hooks/slo/use_fetch_slo_list';
interface SloItem {
  id: string | undefined;
  instanceId: string | undefined;
  name: string;
}

interface Props {
  initialSlos?: SloItem[];
  onSelected: (slos: SLOWithSummaryResponse[] | undefined) => void;
  hasError?: boolean;
}

const SLO_REQUIRED = i18n.translate('xpack.observability.sloEmbeddable.config.errors.sloRequired', {
  defaultMessage: 'SLO is required.',
});

export function SloSelector({ initialSlos, onSelected, hasError }: Props) {
  const initialSelectedOptions = initialSlos?.map((slo) => {
    const label = slo.instanceId !== ALL_VALUE ? `${slo.name} (: ${slo.instanceId})` : slo.name;
    return {
      label,
      value: `${slo.id}-${slo.instanceId}`,
      instanceId: slo.instanceId,
    };
  });
  const [options, setOptions] = useState<Array<EuiComboBoxOptionOption<string>>>();
  const [selectedOptions, setSelectedOptions] = useState<Array<EuiComboBoxOptionOption<string>>>(
    initialSelectedOptions ?? []
  );
  const [searchValue, setSearchValue] = useState<string>('');
  const {
    isInitialLoading,
    isLoading,
    data: sloList,
  } = useFetchSloList({
    kqlQuery: `slo.name: ${searchValue.replaceAll(' ', '*')}*`,
  });

  useEffect(() => {
    const isLoadedWithData = !isLoading && sloList!.results !== undefined;
    const opts: Array<EuiComboBoxOptionOption<string>> = isLoadedWithData
      ? sloList!.results!.map((slo) => {
          const label =
            slo.instanceId !== ALL_VALUE
              ? `${slo.name} (${slo.groupBy}: ${slo.instanceId})`
              : slo.name;
          return {
            value: `${slo.id}-${slo.instanceId}`,
            label,
            instanceId: slo.instanceId,
          };
        })
      : [];
    setOptions(opts);
  }, [isLoading, sloList]);

  const onChange = (opts: Array<EuiComboBoxOptionOption<string>>) => {
    setSelectedOptions(opts);
    const selectedSlos =
      opts.length >= 1
        ? sloList!.results?.filter((slo) =>
            opts.find((opt) => opt.value === `${slo.id}-${slo.instanceId}`)
          )
        : undefined;
    onSelected(selectedSlos);
  };

  const onSearchChange = useMemo(
    () =>
      debounce((value: string) => {
        setSearchValue(value);
      }, 300),
    []
  );

  if (isInitialLoading) {
    return null;
  }

  return (
    <EuiFormRow fullWidth isInvalid={hasError} error={hasError ? SLO_REQUIRED : undefined}>
      <EuiComboBox
        aria-label={i18n.translate(
          'xpack.observability.sloEmbeddable.config.sloSelector.ariaLabel',
          {
            defaultMessage: 'SLO',
          }
        )}
        placeholder={i18n.translate(
          'xpack.observability.sloEmbeddable.config.sloSelector.placeholder',
          {
            defaultMessage: 'Select a SLO',
          }
        )}
        data-test-subj="sloSelector"
        options={options}
        selectedOptions={selectedOptions}
        async
        isLoading={isLoading}
        onChange={onChange}
        fullWidth
        onSearchChange={onSearchChange}
        isInvalid={hasError}
      />
    </EuiFormRow>
  );
}
