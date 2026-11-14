/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiBadge, EuiCodeBlock, EuiFlexGroup, EuiFlexItem, EuiPanel, EuiText } from '@elastic/eui';
import type { TailSamplingPolicy } from '@kbn/apm-api-shared';
import React from 'react';
import { stringify } from 'yaml';

interface Props {
  policy: TailSamplingPolicy;
}

export function PolicyCard({ policy }: Props) {
  const { name, type, ...settings } = policy;

  return (
    <EuiPanel hasBorder paddingSize="m" data-test-subj="apmTailSamplingPolicyCard">
      <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiBadge color={type === 'drop' ? 'danger' : 'hollow'}>{type}</EuiBadge>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText size="s">
            <strong>{name}</strong>
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
      {Object.keys(settings).length > 0 && (
        <EuiCodeBlock language="yaml" fontSize="s" paddingSize="s" isCopyable>
          {stringify(settings)}
        </EuiCodeBlock>
      )}
    </EuiPanel>
  );
}
