/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { IconType } from '@elastic/eui';
import { LinkCategoryType } from './constants';

export type LinkCategories<T extends string = string> = Readonly<Array<LinkCategory<T>>>;

export interface NavigationLink<T extends string = string> {
  categories?: LinkCategories<T>;
  description?: string;
  disabled?: boolean;
  id: T;
  landingIcon?: IconType;
  landingImage?: string;
  links?: Array<NavigationLink<T>>;
  title: string;
  sideNavIcon?: IconType;
  skipUrlState?: boolean;
  unauthorized?: boolean;
  isFooterLink?: boolean;
  isBeta?: boolean;
  betaOptions?: {
    text: string;
  };
}

export interface LinkCategory<T extends string = string> {
  linkIds?: readonly T[];
  label?: string;
  type?: LinkCategoryType;
  iconType?: IconType;
  categories?: Array<TitleLinkCategory<T>>; // nested categories are only supported by accordion type
}

export interface TitleLinkCategory<T extends string = string> extends LinkCategory<T> {
  type?: LinkCategoryType.title;
  linkIds: readonly T[];
  label: string;
}
