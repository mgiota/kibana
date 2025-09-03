/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */
import React from 'react';
import { SAVED_SEARCH_ATTACHMENT_TYPE } from '@kbn/discover-utils';
import {
  type PersistableStateAttachmentType,
  type AttachmentAction,
  type PersistableStateAttachmentViewProps,
} from '@kbn/cases-plugin/public/client/attachment_framework/types';
import { EuiAvatar } from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n-react';

const AttachmentChildrenLazy = React.lazy(() => import('./attachment_children'));

const getSavedSearchAttachmentActions = (state) => [
  {
    type: 'custom' as const,
    render: () => {},
    isPrimary: true,
  },
  {
    type: 'custom' as const,
    render: () => {},
    isPrimary: false,
  },
];

export const generateAttachmentType = () => ({
  id: SAVED_SEARCH_ATTACHMENT_TYPE,
  displayName: 'savedSearch',
  getAttachmentViewObject: (props) => {
    const { persistableStateAttachmentState } = props;
    return {
      event: (
        <FormattedMessage
          id="discover.cases.eventDescription"
          defaultMessage="added a Discover Session"
        />
      ),
      getActions: () => getSavedSearchAttachmentActions(persistableStateAttachmentState),
      timelineAvatar: <EuiAvatar name="indicator" color="subdued" iconType="discoverApp" />,
      children: AttachmentChildrenLazy as unknown as React.LazyExoticComponent<
        React.FC<PersistableStateAttachmentViewProps>
      >,
    };
  },
  icon: 'discoverApp',
});
