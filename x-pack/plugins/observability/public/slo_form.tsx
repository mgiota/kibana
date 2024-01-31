/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { lazy } from 'react';
import React, { Suspense } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiLoadingSpinner } from '@elastic/eui';
import { EuiLoadingSpinnerSize } from '@elastic/eui/src/components/loading/loading_spinner';

function CenterJustifiedSpinner({ size }) {
  return (
    <EuiFlexGroup data-test-subj="centerJustifiedSpinner" justifyContent="center">
      <EuiFlexItem grow={false}>
        <EuiLoadingSpinner size={size || 'xl'} />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}

function suspendedComponentWithProps<T = unknown>(
  ComponentToSuspend: React.ComponentType<T>,
  size?: EuiLoadingSpinnerSize
) {
  return (props: T) => (
    <Suspense fallback={<CenterJustifiedSpinner size={size ?? 'm'} />}>
      <ComponentToSuspend {...props} />
    </Suspense>
  );
}

export const SloAddForm = suspendedComponentWithProps(lazy(() => import('./slo_add_form')));
