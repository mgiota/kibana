/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiFlexGroup, EuiFlexItem, EuiSpacer, EuiText } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import type { TailSamplingPolicy } from '@kbn/apm-api-shared';
import React from 'react';
import { PolicyCard } from './policy_card';

interface Props {
  policies: TailSamplingPolicy[];
}

export function PoliciesTab({ policies }: Props) {
  return (
    <>
      <EuiText size="s" color="subdued">
        <p>
          {i18n.translate('xpack.apm.tailSampling.policies.description', {
            defaultMessage:
              'Each trace is checked against every policy once it completes. It is kept when any policy keeps it, unless a drop policy matches. Policy order does not matter. Traces that match no policy are not kept.',
          })}
        </p>
      </EuiText>
      <EuiSpacer size="m" />
      <EuiFlexGroup direction="column" gutterSize="s">
        {policies.map((policy, index) => (
          <EuiFlexItem key={index}>
            <PolicyCard policy={policy} />
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
    </>
  );
}
