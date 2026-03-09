/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { SyntheticsMonitorDetailsResponse } from '@kbn/observability-agent-builder-plugin/server';
import { toSyntheticsMonitorDetailsResponse } from './register_data_provider';
import type { SavedObject } from '@kbn/core-saved-objects-api-server';
import type { EncryptedSyntheticsMonitorAttributes } from '../../common/runtime_types';
import { ConfigKey } from '../../common/runtime_types';

describe('toSyntheticsMonitorDetailsResponse', () => {
  const mockMonitorAttributes: EncryptedSyntheticsMonitorAttributes = {
    [ConfigKey.NAME]: 'Test Monitor',
    [ConfigKey.MONITOR_TYPE]: 'http',
    [ConfigKey.ENABLED]: true,
    [ConfigKey.SCHEDULE]: { number: '3', unit: 'm' },
    [ConfigKey.LOCATIONS]: [
      { id: 'us_central', label: 'US Central' },
      { id: 'private_1', label: 'Private Location', agentPolicyId: 'policy-1' },
    ],
    [ConfigKey.TAGS]: ['tag1', 'tag2'],
  } as EncryptedSyntheticsMonitorAttributes;

  const mockMonitor: SavedObject<EncryptedSyntheticsMonitorAttributes> = {
    id: 'monitor-123',
    type: 'synthetics-monitor',
    attributes: mockMonitorAttributes,
    references: [],
  };

  it('returns an object that satisfies SyntheticsMonitorDetailsResponse', () => {
    const result = toSyntheticsMonitorDetailsResponse(mockMonitor);

    // Type assertion: ensures the return value is assignable to the contract type.
    // If toSyntheticsMonitorDetailsResponse ever returns an incompatible shape,
    // this assignment will fail at compile time.
    const _typeCheck: SyntheticsMonitorDetailsResponse = result;

    expect(result).toEqual({
      id: 'monitor-123',
      name: 'Test Monitor',
      type: 'http',
      enabled: true,
      schedule: { number: '3', unit: 'm' },
      locations: [
        { id: 'us_central', label: 'US Central' },
        { id: 'private_1', label: 'Private Location', agentPolicyId: 'policy-1' },
      ],
      tags: ['tag1', 'tag2'],
    });
  });

  it('handles optional tags when undefined', () => {
    const monitorWithoutTags: SavedObject<EncryptedSyntheticsMonitorAttributes> = {
      ...mockMonitor,
      attributes: {
        ...mockMonitorAttributes,
        [ConfigKey.TAGS]: undefined,
      } as EncryptedSyntheticsMonitorAttributes,
    };

    const result = toSyntheticsMonitorDetailsResponse(monitorWithoutTags);

    const _typeCheck: SyntheticsMonitorDetailsResponse = result;
    expect(result.tags).toBeUndefined();
    expect(result.id).toBe('monitor-123');
  });
});
