/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { i18n } from '@kbn/i18n';
import { EuiButtonEmpty } from '@elastic/eui';
import React from 'react';
const SEARCH_OBJECT_TYPE = 'search';

interface Props {
  handleOnClick: () => void;
}

export function AddFromLibraryButton({ handleOnClick }: Props) {
  const onClick = () => {
    handleOnClick();
  };
  return (
    <EuiButtonEmpty data-test-subj="addFromLibraryButton" onClick={onClick}>
      {i18n.translate('xpack.observability.addFromLibraryButton.addFromLibraryButtonEmptyLabel', {
        defaultMessage: 'Add from library',
      })}
    </EuiButtonEmpty>
  );
}
