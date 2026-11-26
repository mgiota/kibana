/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { z, lazySchema } from '@kbn/zod/v4';
import { defineRoute } from '../types';
import { tailSamplingSettingsSchema } from './types';
import type { TailSamplingPreviewResponse } from './types';

/**
 * Estimates how many of the recently stored traces a config would keep. Writes nothing
 * and does not call the control API.
 */
export const previewTailSamplingRoute = defineRoute<TailSamplingPreviewResponse>()({
  endpoint: 'POST /internal/tail_sampling/_preview',
  params: lazySchema(() =>
    z.object({
      body: tailSamplingSettingsSchema,
    })
  ),
});
