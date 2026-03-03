/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { GetDrilldownsSchemaFnType } from '@kbn/embeddable-plugin/server';
import type { TypeOf } from '@kbn/config-schema';
import { schema, Type } from '@kbn/config-schema';
import { serializedTitlesSchema } from '@kbn/presentation-publishing-schemas';
import { asCodeFilterSchema } from '@kbn/as-code-filters-schema';
import { SLO_EMBEDDABLE_SUPPORTED_TRIGGERS } from '../../../common/embeddables/overview/constants';

const SingleOverviewCustomSchema = schema.object({
  slo_id: schema.string({
    meta: { description: 'The ID of the SLO' },
  }),
  slo_instance_id: schema.maybe(
    schema.string({
      meta: {
        description:
          'ID of the SLO instance. Set when the SLO uses group_by; identifies which instance to show. When * is used, all instances are shown.',
      },
    })
  ),
  remote_name: schema.maybe(
    schema.string({
      meta: { description: 'The name of the remote SLO' },
    })
  ),
  overview_mode: schema.literal('single'),
});

const groupBySchema = schema.oneOf([
  schema.literal('slo.tags'),
  schema.literal('status'),
  schema.literal('slo.indicator.type'),
]);

const GroupOverviewCustomSchema = schema.object({
  group_filters: schema.maybe(
    schema.object({
      group_by: schema.maybe(groupBySchema),
      // Bounded to avoid unbounded-array warnings; 100 aligns with other embeddable list limits.
      groups: schema.maybe(schema.arrayOf(schema.string(), { maxSize: 100 })),
      // Bounded to avoid unbounded-array warnings; 500 matches dashboard filters limit.
      filters: schema.maybe(schema.arrayOf(asCodeFilterSchema, { maxSize: 500 })),
      kql_query: schema.maybe(schema.string()),
    })
  ),
  overview_mode: schema.literal('groups'),
});

function getSingleOverviewEmbeddableSchema(getDrilldownsSchema: GetDrilldownsSchemaFnType) {
  return schema.object(
    {
      ...SingleOverviewCustomSchema.getPropSchemas(),
      ...getDrilldownsSchema(SLO_EMBEDDABLE_SUPPORTED_TRIGGERS).getPropSchemas(),
      ...serializedTitlesSchema.getPropSchemas(),
    },
    {
      meta: {
        id: 'slo-single-overview-embeddable',
        description: 'SLO Single Overview embeddable schema',
      },
    }
  );
}

function getGroupOverviewEmbeddableSchema(getDrilldownsSchema: GetDrilldownsSchemaFnType) {
  return schema.object(
    {
      ...GroupOverviewCustomSchema.getPropSchemas(),
      ...getDrilldownsSchema(SLO_EMBEDDABLE_SUPPORTED_TRIGGERS).getPropSchemas(),
      ...serializedTitlesSchema.getPropSchemas(),
    },
    {
      meta: {
        id: 'slo-group-overview-embeddable',
        description: 'SLO Group Overview embeddable schema',
      },
    }
  );
}

function applyOverviewModeDefault(value: unknown): Record<string, unknown> {
  const raw = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  const overviewMode =
    raw.overview_mode !== undefined && raw.overview_mode !== null
      ? raw.overview_mode
      : raw.slo_id != null
      ? 'single'
      : 'groups';
  return { ...raw, overview_mode: overviewMode };
}

/**
 * Wraps the overview embeddable schema to default `overview_mode` when omitted:
 * - `'single'` when `slo_id` is provided
 * - `'groups'` when `slo_id` is not specified
 *
 * The default is applied at the Joi schema level so it works for both (1) route-level
 * request body validation (dashboard state schema uses configSchema.getSchema()) and
 * (2) handler-level panelSchema.validate(config).
 */
interface JoiRootLike {
  $_root?: { any: () => { custom: (fn: (v: unknown) => unknown) => unknown } };
}

function withOverviewModeDefaults<T>(inner: Type<T>): Type<T> {
  const innerSchema = inner.getSchema();
  const root = (innerSchema as unknown as JoiRootLike).$_root;
  if (!root) {
    return inner;
  }
  const anySchema = root.any();
  if (typeof anySchema?.custom !== 'function') {
    return inner;
  }
  const wrappedSchema = anySchema.custom((value: unknown) => {
    const normalized = applyOverviewModeDefault(value);
    const result = innerSchema.validate(normalized, { presence: 'required' });
    if ((result as { error?: Error }).error) {
      throw (result as { error: Error }).error;
    }
    return (result as { value: T }).value;
  });
  return new (class OverviewEmbeddableSchemaWithDefaults extends Type<T> {
    constructor(s: unknown) {
      // wrappedSchema is a Joi schema from the same root as innerSchema
      super(s as never);
    }
  })(wrappedSchema) as Type<T>;
}

export const getOverviewEmbeddableSchema = (getDrilldownsSchema: GetDrilldownsSchemaFnType) => {
  const unionSchema = schema.discriminatedUnion(
    'overview_mode',
    [
      getSingleOverviewEmbeddableSchema(getDrilldownsSchema),
      getGroupOverviewEmbeddableSchema(getDrilldownsSchema),
    ],
    { meta: { description: 'SLO Overview embeddable schema' } }
  );
  return withOverviewModeDefaults(unionSchema);
};

export type GroupBy = TypeOf<typeof groupBySchema>;
export type SingleOverviewCustomState = TypeOf<typeof SingleOverviewCustomSchema>;
export type GroupOverviewCustomState = TypeOf<typeof GroupOverviewCustomSchema>;
export type OverviewMode =
  | SingleOverviewCustomState['overview_mode']
  | GroupOverviewCustomState['overview_mode'];
export type GroupFilters = Required<GroupOverviewCustomState>['group_filters'];
export type OverviewEmbeddableState = TypeOf<ReturnType<typeof getOverviewEmbeddableSchema>>;
export type SingleOverviewEmbeddableState = TypeOf<
  ReturnType<typeof getSingleOverviewEmbeddableSchema>
>;
export type GroupOverviewEmbeddableState = TypeOf<
  ReturnType<typeof getGroupOverviewEmbeddableSchema>
>;
