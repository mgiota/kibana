/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { ElasticsearchClient, Logger } from '@kbn/core/server';
import { assertNever } from '@kbn/std';
import { SLO_SUMMARY_DESTINATION_INDEX_PATTERN } from '../../../common/slo/constants';
import { getElastichsearchQueryOrThrow } from './transform_generators';
import { Status } from '../../domain/models';

export type SortField = 'error_budget_consumed' | 'error_budget_remaining' | 'sli_value' | 'status';
export interface Sort {
  field: SortField;
  direction: 'asc' | 'desc';
}

interface EsSummaryDocument {
  slo: {
    id: string;
    revision: number;
    instanceId: string;
  };
  sliValue: number;
  errorBudgetConsumed: number;
  errorBudgetRemaining: number;
  errorBudgetInitial: number;
  errorBudgetEstimated: boolean;
  statusCode: number;
  status: Status;
  isTempDoc: boolean;
}
function toDocumentSortField(field: SortField) {
  switch (field) {
    case 'error_budget_consumed':
      return 'errorBudgetConsumed';
    case 'error_budget_remaining':
      return 'errorBudgetRemaining';
    case 'status':
      return 'status';
    case 'sli_value':
      return 'sliValue';
    default:
      assertNever(field);
  }
}

export class SummarySearchClientV2 {
  constructor(
    private esClient: ElasticsearchClient,
    private logger: Logger,
    private spaceId: string
  ) {}

  async search(kqlQuery: string, sort: Sort) {
    const summarySearch = await this.esClient.search<EsSummaryDocument>({
      index: SLO_SUMMARY_DESTINATION_INDEX_PATTERN,
      track_total_hits: true,
      query: {
        bool: {
          filter: [{ term: { spaceId: this.spaceId } }, getElastichsearchQueryOrThrow(kqlQuery)],
        },
      },
      aggs: {
        group_by_tags_buckets: {
          composite: {
            size: 2,
            sources: [
              {
                tags: {
                  terms: {
                    field: 'slo.tags',
                  },
                },
              },
            ],
          },
          aggs: {
            min_sli_value: {
              min: {
                field: 'sliValue',
              },
            },
            group_by_tags_docs: {
              top_hits: {
                size: 2,
                sort: [
                  {
                    sliValue: {
                      order: 'desc',
                    },
                  },
                ],
              },
            },
          },
        },
        group_by_status: {
          terms: {
            field: 'status',
          },
          aggs: {
            min_sli_value: {
              min: {
                field: 'sliValue',
              },
            },
          },
        },
        group_by_sli_type: {
          terms: {
            field: 'slo.indicator.type',
          },
          aggs: {
            min_sli_value: {
              min: {
                field: 'sliValue',
              },
            },
          },
        },
      },
      sort: {
        // non-temp first, then temp documents
        isTempDoc: {
          order: 'asc',
        },
        [toDocumentSortField(sort.field)]: {
          order: sort.direction,
        },
      },
      size: 2, // HARDCODE FOR NOW just for testing
    });
  }
}
