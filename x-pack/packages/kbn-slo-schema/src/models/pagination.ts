/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { AggregationsAggregate } from '@elastic/elasticsearch/lib/api/types';

export interface Paginated<T> {
  total: number;
  page: number;
  perPage: number;
  results: T[];
  aggs: Record<string, AggregationsAggregate> | undefined;
}

export interface Pagination {
  page: number;
  perPage: number;
}
