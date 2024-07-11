/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { AssistantService } from './assistant/types';
import type { EsqlService } from './esql';

export interface InvestigateAppServices {
  esql: EsqlService;
  assistant: AssistantService;
}
