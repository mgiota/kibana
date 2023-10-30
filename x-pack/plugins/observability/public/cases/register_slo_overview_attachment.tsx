/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import type { CasesUiSetup } from '@kbn/cases-plugin/public';
import type { CoreStart } from '@kbn/core/public';
import { getEmbeddableSloOverview } from '../embeddable/slo/overview/slo_embeddable_overview_component';
import { ObservabilityPublicPluginsStart } from '../plugin';
export function registerSloOverviewAttachment(
  cases: CasesUiSetup,
  coreStart: CoreStart,
  pluginStart: ObservabilityPublicPluginsStart
) {
  const EmbeddableComponent = getEmbeddableSloOverview(coreStart, pluginStart);
  cases.attachmentFramework.registerPersistableState({
    id: 'SLO_EMBEDDABLE',
    icon: 'machineLearningApp',
    displayName: i18n.translate('xpack.observability.sloOverview.cases.attachmentName', {
      defaultMessage: 'SLO Overview',
    }),
    getAttachmentViewObject: () => ({
      event: (
        <FormattedMessage
          id="xpack.observability.sloOverview.cases.attachmentEvent"
          defaultMessage="added slo overview"
        />
      ),
      timelineAvatar: 'machineLearningApp',
      children: React.lazy(async () => {
        const { initComponent } = await import('./slo_overview_attachment');

        return {
          default: initComponent(EmbeddableComponent),
        };
      }),
    }),
  });
}
