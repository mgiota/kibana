/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

export {
  useGetAppUrl,
  useNavigateTo,
  useNavigation,
  getNavigationPropsFromId,
} from './src/navigation';
export type { GetAppUrl, NavigateTo } from './src/navigation';
export { NavigationProvider } from './src/context';
export {
  SecurityPageName,
  ExternalPageName,
  LinkCategoryType,
  SECURITY_UI_APP_ID,
} from './src/constants';
export * from './src/types';
// export { mockGetAppUrl, mockNavigateTo } from './mocks/navigation';
export * from './src/links';
