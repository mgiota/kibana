/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ALL_VALUE } from '@kbn/slo-schema';
import type {
  AlertsEmbeddableState,
  SloItem,
} from '../../../../server/lib/embeddables/alerts_schema';

export interface LegacyAlertsSloItem {
  id: string;
  instanceId: string;
  groupBy: string[];
  name: string;
}

/** Maps legacy camelCase slo item to current snake_case schema. */
function mapLegacySloItem(
  slo: Record<string, unknown>,
  legacyShowAllGroupByInstances: boolean
): SloItem {
  const rawGroupBy = (slo.group_by ?? slo.groupBy) as string[] | undefined;
  let sloInstanceId = (slo.slo_instance_id as string) ?? (slo.instanceId as string) ?? '';
  if (legacyShowAllGroupByInstances && sloInstanceId && sloInstanceId !== ALL_VALUE) {
    sloInstanceId = ALL_VALUE;
  }
  return {
    slo_id: (slo.slo_id as string) ?? (slo.id as string) ?? '',
    slo_instance_id: sloInstanceId,
    name: (slo.name as string) ?? '',
    group_by: Array.isArray(rawGroupBy) ? rawGroupBy : [],
  };
}

export interface LegacyAlertsState {
  showAllGroupByInstances?: boolean;
  slos: LegacyAlertsSloItem[];
}

/** Transforms SLO Alerts embeddable state for serialization. Migrates legacy camelCase to snake_case. */
export function transformAlertsOut(storedState: AlertsEmbeddableState): AlertsEmbeddableState {
  const state = storedState as AlertsEmbeddableState & {
    slos?: Array<Record<string, unknown>>;
    showAllGroupByInstances?: boolean;
    show_all_group_by_instances?: boolean;
  };
  const legacyShowAll =
    state.show_all_group_by_instances ?? state.showAllGroupByInstances ?? false;
  const { showAllGroupByInstances: _legacy1, show_all_group_by_instances: _legacy2, ...rest } =
    state;
  const slos =
    state.slos?.map((slo) => {
      const hasLegacy = 'id' in slo || 'instanceId' in slo || 'groupBy' in slo;
      return hasLegacy
        ? mapLegacySloItem(slo, legacyShowAll)
        : (() => {
            const item = slo as SloItem;
            if (legacyShowAll && item.slo_instance_id && item.slo_instance_id !== ALL_VALUE) {
              return { ...item, slo_instance_id: ALL_VALUE };
            }
            return item;
          })();
    }) ?? [];
  return { ...rest, slos };
}
