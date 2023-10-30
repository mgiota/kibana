/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React from 'react';
import type { CoreStart } from '@kbn/core/public';

import {
  EmbeddableFactory,
  EmbeddableOutput,
  EmbeddableRoot,
  useEmbeddableFactory,
} from '@kbn/embeddable-plugin/public';
import { EuiLoadingChart } from '@elastic/eui';
import { SLO_EMBEDDABLE } from './slo_embeddable';
import { ObservabilityPublicPluginsStart } from '../../..';
import type { SloEmbeddableInput } from './types';
import { EmbeddableSloProps } from './types';

export function getEmbeddableSloOverview(
  core: CoreStart,
  plugins: ObservabilityPublicPluginsStart
) {
  const { embeddable: embeddableStart } = plugins;
  const factory = embeddableStart.getEmbeddableFactory<SloEmbeddableInput>(SLO_EMBEDDABLE)!;
  return (props: EmbeddableSloProps) => {
    const input = { ...props };
    return <EmbeddableRootWrapper factory={factory} input={input as SloEmbeddableInput} />;
  };
}

function EmbeddableRootWrapper({
  factory,
  input,
}: {
  factory: EmbeddableFactory<SloEmbeddableInput, EmbeddableOutput>;
  input: SloEmbeddableInput;
}) {
  const [embeddable, loading, error] = useEmbeddableFactory<SloEmbeddableInput>({
    factory,
    input,
  });
  if (loading) {
    return <EuiLoadingChart />;
  }
  return <EmbeddableRoot embeddable={embeddable} loading={loading} error={error} input={input} />;
}
