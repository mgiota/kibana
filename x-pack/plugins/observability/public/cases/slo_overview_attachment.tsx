/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { memoize } from 'lodash';
import React, { FC } from 'react';
import { PersistableStateAttachmentViewProps } from '@kbn/cases-plugin/public/client/attachment_framework/types';
import { FormattedMessage } from '@kbn/i18n-react';
import { EuiDescriptionList } from '@elastic/eui';
import deepEqual from 'fast-deep-equal';
import { EmbeddableSloProps } from '../embeddable/slo/overview/types';

export const initComponent = memoize((EmbeddableComponent: FC<EmbeddableSloProps>) => {
  return React.memo(
    (props: PersistableStateAttachmentViewProps) => {
      const { persistableStateAttachmentState } = props;

      const inputProps = persistableStateAttachmentState as unknown as EmbeddableSloProps;
      const listItems = [
        {
          title: (
            <FormattedMessage
              id="xpack.observability.sloOverview.cases.timeRangeLabel"
              defaultMessage="Some title"
            />
          ),
          description: 'Some description',
        },
      ];
      const style = { width: 250, height: 250 };
      const allProps = { ...inputProps, style };
      return (
        <>
          <EuiDescriptionList compressed type={'inline'} listItems={listItems} />
          <EmbeddableComponent {...allProps} />
        </>
      );
    },
    (prevProps, nextProps) =>
      deepEqual(
        prevProps.persistableStateAttachmentState,
        nextProps.persistableStateAttachmentState
      )
  );
});
