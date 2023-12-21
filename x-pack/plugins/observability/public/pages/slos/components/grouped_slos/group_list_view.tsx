/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { memo, useState } from 'react';
import { EuiPanel, EuiAccordion, EuiTablePagination } from '@elastic/eui';
import { useFetchSloList } from '../../../../hooks/slo/use_fetch_slo_list';
import { SloListItems } from '../slo_list_items';
import { useUrlSearchState } from '../../hooks/use_url_search_state';

// Inside accordion render SloListItems, there pass the isCompact option as well
// also add pagination here
// update store to save both

export function GroupListView({ isCompact, group, groupBy }) {
  console.log(groupBy, group, '!!groupBy');
  const query = `"slo.tags": ${group}`;
  const { state, store: storeState } = useUrlSearchState();

  const [page, setPage] = useState(state.page);
  // TODO get sortBy and sortDirection from parent
  const {
    isLoading,
    isRefetching,
    isError,
    data: sloList,
  } = useFetchSloList({
    kqlQuery: query,
    perPage: 2,
    page: page + 1,
  });
  console.log(sloList, '!!group list');
  const { results = [], total = 0 } = sloList ?? {};
  console.log(total, '!!total');

  const handlePageClick = (pageNumber: number) => {
    setPage(pageNumber);
    storeState({ page: pageNumber });
  };

  return (
    <EuiPanel>
      <MemoEuiAccordion buttonContent={group}>
        <>
          <SloListItems
            sloList={results}
            loading={isLoading || isRefetching}
            error={isError}
            isCompact={isCompact}
          />
          <EuiTablePagination
            pageCount={Math.ceil(total / 2)}
            activePage={page}
            onChangePage={handlePageClick}
            itemsPerPage={2}
          />
        </>
      </MemoEuiAccordion>
    </EuiPanel>
  );
}

const MemoEuiAccordion = memo(EuiAccordion);
