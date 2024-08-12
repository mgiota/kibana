/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { services as kibanaApiIntegrationServices } from '@kbn/test-suites-src/api_integration/services';
import { services as commonServices } from '../../common/services';

// @ts-ignore not ts yet
import { EsSupertestWithoutAuthProvider } from './es_supertest_without_auth';

import { UsageAPIProvider } from './usage_api';

import { AiopsProvider } from './aiops';
import { InfraOpsSourceConfigurationProvider } from './infraops_source_configuration';
import { MachineLearningProvider } from './ml';
import { IngestManagerProvider } from '../../common/services/ingest_manager';
import { TransformProvider } from './transform';
import { IngestPipelinesProvider } from './ingest_pipelines';
import { IndexManagementProvider } from './index_management';
import { DataViewApiProvider } from './data_view_api';
import { SloApiProvider } from './slo';
import { SloApiProvider as SloApiProviderNew } from './slo_api';
import { AlertingApiProvider } from './alerting_api';
import { SecuritySolutionApiProvider } from './security_solution_api.gen';

export const services = {
  ...commonServices,

  esSupertest: kibanaApiIntegrationServices.esSupertest,
  supertest: kibanaApiIntegrationServices.supertest,

  aiops: AiopsProvider,
  dataViewApi: DataViewApiProvider,
  esSupertestWithoutAuth: EsSupertestWithoutAuthProvider,
  infraOpsSourceConfiguration: InfraOpsSourceConfigurationProvider,
  usageAPI: UsageAPIProvider,
  ml: MachineLearningProvider,
  ingestManager: IngestManagerProvider,
  transform: TransformProvider,
  ingestPipelines: IngestPipelinesProvider,
  indexManagement: IndexManagementProvider,
  slo: SloApiProvider,
  securitySolutionApi: SecuritySolutionApiProvider,
  alertingApi: AlertingApiProvider,
  sloApi: SloApiProviderNew, // TODO: There was already an slo service here for the slo api tests. Unify SloApiProvider and SloApiProviderNew as part of the slo API migration issue https://github.com/elastic/kibana/issues/183397
};
