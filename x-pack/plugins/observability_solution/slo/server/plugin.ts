/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';
import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  DEFAULT_APP_CATEGORIES,
  Plugin,
  Logger,
  SavedObjectsClient,
} from '@kbn/core/server';
import { PluginSetupContract, PluginStartContract } from '@kbn/alerting-plugin/server';
import { PluginSetupContract as FeaturesSetup } from '@kbn/features-plugin/server';
import { RuleRegistryPluginSetupContract } from '@kbn/rule-registry-plugin/server';
import {
  TaskManagerSetupContract,
  TaskManagerStartContract,
} from '@kbn/task-manager-plugin/server';
import { SharePluginSetup } from '@kbn/share-plugin/server';
import { UsageCollectionSetup } from '@kbn/usage-collection-plugin/server';
import { SpacesPluginSetup, SpacesPluginStart } from '@kbn/spaces-plugin/server';
import { AlertsLocatorDefinition } from '@kbn/observability-plugin/common';
import { registerSloUsageCollector } from './lib/collectors/register';

import { SloOrphanSummaryCleanupTask } from './services/tasks/orphan_summary_cleanup_task';
import { sloFeatureId } from '../common';
import { SLO_BURN_RATE_RULE_TYPE_ID } from '../common/constants';
import { slo, SO_SLO_TYPE } from './saved_objects';
import { DefaultResourceInstaller, DefaultSLOInstaller } from './services';
import { registerRuleTypes } from './lib/rules/register_rule_types';
import { SloConfig } from '.';
import { registerRoutes } from './routes/register_routes';
import { getSloServerRouteRepository } from './routes/get_slo_server_route_repository';

// TODO think about renaming to singular
interface SlosPluginSetup {
  alerting: PluginSetupContract;
  ruleRegistry: RuleRegistryPluginSetupContract;
  share: SharePluginSetup;
  features: FeaturesSetup;
  taskManager: TaskManagerSetupContract;
  spaces?: SpacesPluginSetup;
  usageCollection?: UsageCollectionSetup;
}

interface SlosPluginStart {
  alerting: PluginStartContract;
  taskManager: TaskManagerStartContract;
  spaces?: SpacesPluginStart;
}

const sloRuleTypes = [SLO_BURN_RATE_RULE_TYPE_ID];

// TODO think about renaning SlosPlugin to SloPlugin
export class SlosPlugin implements Plugin<SlosPluginSetup, SlosPluginStart> {
  private readonly logger: Logger;
  private sloOrphanCleanupTask?: SloOrphanSummaryCleanupTask;

  constructor(private readonly initContext: PluginInitializerContext) {
    this.initContext = initContext;
    this.logger = initContext.logger.get();
  }

  public setup(core: CoreSetup, plugins: SlosPluginSetup) {
    const config = this.initContext.config.get<SloConfig>();
    const alertsLocator = plugins.share.url.locators.create(new AlertsLocatorDefinition());
    // Register server side APIs
    // defineRoutes(router);

    const savedObjectTypes = [SO_SLO_TYPE];

    plugins.features.registerKibanaFeature({
      id: sloFeatureId,
      name: i18n.translate('xpack.observability.featureRegistry.linkSloTitle', {
        defaultMessage: 'SLOs',
      }),
      order: 1200,
      category: DEFAULT_APP_CATEGORIES.observability,
      app: [sloFeatureId, 'kibana'],
      catalogue: [sloFeatureId, 'observability'],
      alerting: sloRuleTypes,
      privileges: {
        all: {
          app: [sloFeatureId, 'kibana'],
          catalogue: [sloFeatureId, 'observability'],
          api: ['slo_write', 'slo_read', 'rac'],
          savedObject: {
            all: savedObjectTypes,
            read: [],
          },
          alerting: {
            rule: {
              all: sloRuleTypes,
            },
            alert: {
              all: sloRuleTypes,
            },
          },
          ui: ['read', 'write'],
        },
        read: {
          app: [sloFeatureId, 'kibana'],
          catalogue: [sloFeatureId, 'observability'],
          api: ['slo_read', 'rac'],
          savedObject: {
            all: [],
            read: savedObjectTypes,
          },
          alerting: {
            rule: {
              read: sloRuleTypes,
            },
            alert: {
              read: sloRuleTypes,
            },
          },
          ui: ['read'],
        },
      },
    });

    const { ruleDataService } = plugins.ruleRegistry;

    core.savedObjects.registerType(slo);

    registerRuleTypes(plugins.alerting, core.http.basePath, this.logger, ruleDataService, {
      alertsLocator,
    });

    registerSloUsageCollector(plugins.usageCollection);

    core.getStartServices().then(([coreStart, pluginStart]) => {
      registerRoutes({
        core,
        config,
        dependencies: {
          pluginsSetup: {
            ...plugins,
            core,
          },
          spaces: pluginStart.spaces,
          ruleDataService,
          getRulesClientWithRequest: pluginStart.alerting.getRulesClientWithRequest,
        },
        logger: this.logger,
        repository: getSloServerRouteRepository(config),
      });

      const esInternalClient = coreStart.elasticsearch.client.asInternalUser;

      const sloResourceInstaller = new DefaultResourceInstaller(esInternalClient, this.logger);
      const sloInstaller = new DefaultSLOInstaller(sloResourceInstaller, this.logger);
      sloInstaller.install();
    });

    this.sloOrphanCleanupTask = new SloOrphanSummaryCleanupTask(
      plugins.taskManager,
      this.logger,
      config
    );
  }

  public start(core: CoreStart, plugins: SlosPluginStart) {
    this.logger.debug('slos: Started');
    const internalSoClient = new SavedObjectsClient(core.savedObjects.createInternalRepository());
    const internalEsClient = core.elasticsearch.client.asInternalUser;

    this.sloOrphanCleanupTask?.start(plugins.taskManager, internalSoClient, internalEsClient);

    return {};
  }

  public stop() {}
}
