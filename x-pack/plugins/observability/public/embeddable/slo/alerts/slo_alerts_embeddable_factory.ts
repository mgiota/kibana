/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';
import type { CoreSetup } from '@kbn/core/public';
import {
  IContainer,
  EmbeddableFactoryDefinition,
  EmbeddableFactory,
  ErrorEmbeddable,
} from '@kbn/embeddable-plugin/public';
import { EmbeddableInput } from '@kbn/embeddable-plugin/public';
import { IProvidesPanelPlacementSettings } from '@kbn/dashboard-plugin/public/dashboard_container/component/panel_placement/types';
import { SLOAlertsEmbeddable, SLO_ALERTS_EMBEDDABLE } from './slo_alerts_embeddable';
import { ObservabilityPublicPluginsStart, ObservabilityPublicStart } from '../../..';

export type SloAlertsEmbeddableFactory = EmbeddableFactory;
export class SloAlertsEmbeddableFactoryDefinition
  implements EmbeddableFactoryDefinition, IProvidesPanelPlacementSettings<SloEmbeddableInput>
{
  public readonly type = SLO_ALERTS_EMBEDDABLE;

  public readonly grouping = [
    {
      id: 'slos',
      getDisplayName: () => 'SLOs',
    },
  ];

  constructor(
    private getStartServices: CoreSetup<
      ObservabilityPublicPluginsStart,
      ObservabilityPublicStart
    >['getStartServices']
  ) {}

  public async isEditable() {
    return true;
  }

  // public getPanelPlacementSettings: IProvidesPanelPlacementSettings<
  //   SloEmbeddableInput,
  //   unknown
  // >['getPanelPlacementSettings'] = () => {
  //   const width = 8;
  //   const height = 7;
  //   return { width, height };
  // };

  public async getExplicitInput(): Promise<Partial<SloEmbeddableInput>> {
    const [coreStart, pluginStart] = await this.getStartServices();
    try {
      const { resolveEmbeddableSloUserInput } = await import('./handle_explicit_input');
      return await resolveEmbeddableSloUserInput(coreStart, pluginStart);
    } catch (e) {
      return Promise.reject();
    }
  }

  public async create(initialInput: EmbeddableInput, parent?: IContainer) {
    try {
      const [coreStart, pluginsStart] = await this.getStartServices();
      console.log(coreStart, pluginsStart, '!!coreStart');

      const [
        { uiSettings, application, http, i18n: i18nService, notifications, settings },
        { triggersActionsUi, cases, data, security },
      ] = await this.getStartServices();
      // const [coreStart, pluginsStart] = await this.getStartServices();
      return new SLOAlertsEmbeddable(
        {
          uiSettings,
          application,
          http,
          i18n: i18nService,
          triggersActionsUi,
          notifications,
          cases,
          data,
          settings,
          security,
        },
        initialInput,
        parent
      );
    } catch (e) {
      return new ErrorEmbeddable(e, initialInput, parent);
    }
  }

  public getDescription() {
    return i18n.translate('xpack.observability.sloAlertsEmbeddable.description', {
      defaultMessage: 'Get SLO alerts',
    });
  }

  public getDisplayName() {
    return i18n.translate('xpack.observability.sloAlertsEmbeddable.displayName', {
      defaultMessage: 'SLO Alerts',
    });
  }

  public getIconType() {
    return 'alert';
  }
}
