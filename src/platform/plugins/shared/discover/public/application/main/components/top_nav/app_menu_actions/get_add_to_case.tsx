/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */
import { i18n } from '@kbn/i18n';
import { AppMenuActionId, AppMenuActionType } from '@kbn/discover-utils';
import type { AppMenuActionSecondary } from '@kbn/discover-utils';
import type { DiscoverServices } from '../../../../../build_services';

export const getAddToCaseAppMenuItem = ({
  services,
}: {
  services: DiscoverServices;
}): AppMenuActionSecondary => {
  // const { cases } = services;

  return {
    id: AppMenuActionId.addToCase,
    type: AppMenuActionType.secondary,
    controlProps: {
      label: i18n.translate('discover.localMenu.addToCaseTitle', {
        defaultMessage: 'Add to case',
      }),
      description: i18n.translate('discover.localMenu.addToCaseDescription', {
        defaultMessage: 'Add the current selection to a case',
      }),
      testId: 'addToCaseButton',
      onClick: () => {
        alert('click add to case');
      },
    },
  };
};
