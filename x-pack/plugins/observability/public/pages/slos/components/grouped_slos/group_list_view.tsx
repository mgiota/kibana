/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { memo } from 'react';
import { EuiPanel, EuiAccordion } from '@elastic/eui';
import { useFetchSloList } from '../../../../hooks/slo/use_fetch_slo_list';
import { SloListItems } from '../slo_list_items';

// Inside accordion render SloListItems, there pass the isCompact option as well
// also add pagination here
// update store to save both

export function GroupListView({ isCompact, group, groupBy }) {
  console.log(groupBy, group, '!!groupBy');
  const query = `"slo.tags": ${group}`;

  const {
    isLoading,
    isRefetching,
    isError,
    data: sloList,
  } = useFetchSloList({
    kqlQuery: query,
  });
  console.log(sloList, '!!group list');
  const { results = [], total = 0 } = sloList ?? {};

  return (
    <EuiPanel>
      <MemoEuiAccordion buttonContent={group}>
        <SloListItems
          sloList={results}
          loading={isLoading || isRefetching}
          error={isError}
          isCompact={isCompact}
        />
      </MemoEuiAccordion>
    </EuiPanel>
  );
}

const MemoEuiAccordion = memo(EuiAccordion);
