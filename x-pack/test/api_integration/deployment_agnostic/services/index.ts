/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { commonFunctionalServices } from '@kbn/ftr-common-functional-services';
import { deploymentAgnosticServices } from './deployment_agnostic_services';
import { DataViewApiProvider } from './data_view_api';
import { SloApiProvider } from './slo_api';
import { AlertingApiProvider } from './alerting_api';
import { services as commonServices } from '../../../common/services';

export type {
  InternalRequestHeader,
  RoleCredentials,
  SupertestWithoutAuthProviderType,
} from '@kbn/ftr-common-functional-services';

export const services = {
  ...commonServices,
  ...deploymentAgnosticServices,
  alertingApi: AlertingApiProvider,
  supertestWithoutAuth: commonFunctionalServices.supertestWithoutAuth,
  samlAuth: commonFunctionalServices.samlAuth,
  dataViewApi: DataViewApiProvider,
  sloApi: SloApiProvider,
  // create a new deployment-agnostic service and load here
};

export type DeploymentAgnosticCommonServices = typeof services;
