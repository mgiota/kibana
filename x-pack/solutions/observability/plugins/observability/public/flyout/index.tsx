/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { ExpandableFlyout } from '@kbn/expandable-flyout';
import React, { memo, useCallback } from 'react';
import { RightPanel } from './rules/right';
import { LeftPanel } from './rules/left';

const expandableFlyoutDocumentsPanels = [
  {
    key: 'rule-details-right',
    component: (props) => <RightPanel />,
  },
  {
    key: 'rule-details-left',
    component: (props) => <LeftPanel />,
  },
];

export const ObservabilitySolutionFlyout = memo(() => {
  const onClose = useCallback(
    () =>
      window.dispatchEvent(
        new CustomEvent(SECURITY_SOLUTION_ON_CLOSE_EVENT, {
          detail: Flyouts.securitySolution,
        })
      ),
    []
  );

  return (
    <ExpandableFlyout
      registeredPanels={expandableFlyoutDocumentsPanels}
      paddingSize="none"
      onClose={onClose}
    />
  );
});
