/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { i18n } from '@kbn/i18n';
import React from 'react';
import { GroupListView } from './group_list_view';
import { useFetchSloGroups } from '../../../../hooks/slo/use_fetch_slo_groups';

interface Props {
  isCompact: boolean;
  groupBy: string;
  kqlQuery: string;
}

export function GroupView({ groupBy, isCompact, kqlQuery }: Props) {
  const { data, isLoading } = useFetchSloGroups();
  if (isLoading) {
    return (
      <div>
        {i18n.translate('xpack.observability.groupView.div.loadingLabel', {
          defaultMessage: 'Loading',
        })}
      </div>
    );
  }
  return (
    <>
      {data &&
        Object.keys(data).map((group) => {
          return <GroupListView group={group} kqlQuery={kqlQuery} isCompact={isCompact} />;
        })}
    </>
  );
}
