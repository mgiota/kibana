/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { TailSamplingPolicy } from '@kbn/apm-api-shared';
import { createFormPolicy } from './form_policy';

export type StarterSetId = 'balanced' | 'more' | 'empty';

export const starterSetIds: StarterSetId[] = ['balanced', 'more', 'empty'];

// What the list of a new project starts with.
export const DEFAULT_STARTER_SET: StarterSetId = 'balanced';

export interface StarterSetOptions {
  keepErrors: boolean;
  keepSlow: boolean;
  // Share of all traces to keep, in percent.
  percentage: number;
}

// Placeholder values until product decides the defaults.
const starterSetOptions: Record<Exclude<StarterSetId, 'empty'>, StarterSetOptions> = {
  balanced: { keepErrors: true, keepSlow: true, percentage: 10 },
  more: { keepErrors: true, keepSlow: true, percentage: 25 },
};

/** The form's default policies for the chosen rules, with the chosen share. */
export const createStarterPolicies = ({
  keepErrors,
  keepSlow,
  percentage,
}: StarterSetOptions): TailSamplingPolicy[] => {
  const policies: TailSamplingPolicy[] = [];
  const names = (): string[] => policies.map(({ name }) => name);

  if (keepErrors) {
    policies.push(createFormPolicy('status_code', names()));
  }
  if (keepSlow) {
    policies.push(createFormPolicy('latency', names()));
  }
  policies.push({
    ...createFormPolicy('probabilistic', names()),
    probabilistic: { sampling_percentage: percentage },
  });

  return policies;
};

/** The policies a starter set fills the list with. The empty set has none. */
export const getStarterSetPolicies = (id: StarterSetId): TailSamplingPolicy[] =>
  id === 'empty' ? [] : createStarterPolicies(starterSetOptions[id]);

/** The share of all traces a starter set keeps, in percent. The empty set has none. */
export const getStarterSetPercentage = (id: StarterSetId): number | undefined =>
  id === 'empty' ? undefined : starterSetOptions[id].percentage;

/** The starter set the policies are equal to, if any. An edited list matches none. */
export const findStarterSet = (policies: TailSamplingPolicy[]): StarterSetId | undefined => {
  const key = JSON.stringify(policies);
  return starterSetIds.find((id) => JSON.stringify(getStarterSetPolicies(id)) === key);
};
