/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { useQuery } from '@tanstack/react-query';
import { useKibana } from '../../utils/kibana_react';

export async function useFetchSloGroups() {
  const { http } = useKibana().services;
  try {
    const response = await http.get(`/api/observability/slos`, {
      query: {
        size: 0,
        aggs: {
          groupByTags: {
            terms: {
              field: "slo.tags"
            },
        }
      },
    });
  } catch (e) {
    console.log(e);
  }
}
