/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { isRunningResponse } from '@kbn/data-plugin/common';
import { useQuery } from '@tanstack/react-query';
import { ElasticsearchClient } from '@kbn/core-elasticsearch-server';
import { useKibana } from '../../utils/kibana_react';
import { SLO_SUMMARY_DESTINATION_INDEX_PATTERN } from '../../../common/slo/constants';

export async function useFetchSloGroups() {
  // const { http } = useKibana().services;
  const {
    data: { search: searchService },
    http,
  } = useKibana().services;
  try {
    const aggsPromise = new Promise((resolve, reject) => {
      searchService
        .search({
          params: {
            index: SLO_SUMMARY_DESTINATION_INDEX_PATTERN,
            body: {
              size: 0,
              aggs: {
                groupByTags: {
                  terms: {
                    field: 'slo.tags',
                  },
                },
              },
            },
          },
        })
        .subscribe({
          next: (response) => {
            if (!isRunningResponse(response)) {
              resolve(response.rawResponse);
            }
          },
          error: (requestError) => {
            searchService.showError(requestError);
            reject(requestError);
          },
        });
    });
    const x = await aggsPromise;
    console.log(x, '!!aggs');
    return x;
  } catch (e) {
    console.log(e);
  }
}
