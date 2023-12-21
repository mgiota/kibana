/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { i18n } from '@kbn/i18n';
import React, { memo } from 'react';
import { EuiPanel, EuiAccordion } from '@elastic/eui';
import { SloListEmpty } from '../slo_list_empty';

export function GroupedSlos2({ sloList, groupBy, loading }) {
  if (!loading && Object.keys(sloList).length === 0) {
    return <SloListEmpty />;
  }
  const groups = sloList;
  console.log(groups, '!!groups');

  return (
    <>
      <h1>
        {i18n.translate('xpack.observability.groupedSlos.h1.groupedSLOsLabel', {
          defaultMessage: 'Grouped SLOs',
        })}
      </h1>
      {groups &&
        Object.keys(groups).map((group, index) => {
          console.log(group, '!!group');

          return (
            <EuiPanel>
              <MemoEuiAccordion buttonContent={group} />
            </EuiPanel>
          );
        })}
    </>
  );
}

const MemoEuiAccordion = memo(EuiAccordion);
