/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { i18n } from '@kbn/i18n';
import React from 'react';
import { SloListEmpty } from '../slo_list_empty';
import { GroupListView } from './group_list_view';
import { useFetchSloGroups } from '../../../../hooks/slo/use_fetch_slo_groups';
// useFetchSloList to get all slos for the specified tag, pass a query -> in progress
// add pagination in this file, probably not, I need pagination within accordion
// this file is similar to slo_list
export function GroupView({ groups, loading, groupBy, sloView, isCompact, kqlQuery }) {
  const { data, isLoading } = useFetchSloGroups({ kqlQuery, groupBy });
  console.log(data, '!!GroupView aggregations');
  // if (isLoading) {
  //   return <SloListEmpty />;
  // }
  return (
    <>
      <h1>
        {i18n.translate('xpack.observability.groupedSlos.h1.groupedSLOsLabel', {
          defaultMessage: 'Grouped SLOs',
        })}
      </h1>
      {data &&
        Object.keys(data).map((group, index) => {
          return (
            <GroupListView
              group={group}
              groupBy={groupBy}
              kqlQuery={kqlQuery}
              isCompact={isCompact}
            />
          );
        })}
    </>
  );
}
