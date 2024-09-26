/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React from 'react';

import { LandingLinksIconsCategories } from '@kbn/security-solution-navigation/landing_links';
// import { LandingLinksIconsCategories } from '@kbn/landing-pages';
import { LinkCategoryType, NavigationProvider } from '@kbn/security-solution-navigation';
import { KibanaPageTemplate } from '@kbn/shared-ux-page-kibana-template';
import { useKibana } from '@kbn/kibana-react-plugin/public';
import type { InternalChromeStart } from '@kbn/core-chrome-browser-internal';
import useObservable from 'react-use/lib/useObservable';
import { EuiPageHeader, EuiSpacer } from '@elastic/eui';
import { ProjectNavigationService } from '@kbn/core-chrome-browser-internal';
import type { ChromeProjectNavigationNode } from '@kbn/core-chrome-browser';
import { IconLensLazy } from './lazy_icons';

const mockCore = {
  application: {
    navigateToApp: () => {},
    getUrlForApp: () => '#',
  },
}
// import { InternalChromeStart } from '@kbn/core-chrome-browser-internal';

// const find = (id: string, nodes: any): ChromeProjectNavigationNode | null => {
//   // Recursively search for the node with the given id
//   for (const node of nodes) {
//     if (node.id === id) {
//       return node;
//     }
//     if (node.children) {
//       const found = find(id, node.children);
//       if (found) {
//         return found;
//       }
//     }
//   }
//   return null;
// };

function findNodeById(id: string, navigationTree$: any): ChromeProjectNavigationNode | null {
  const allNodes = navigationTree$.footer;
  console.log(allNodes, '!!allNodes')
  if (!allNodes) return null;

   const find = (nodes: ChromeProjectNavigationNode[]): ChromeProjectNavigationNode | null => {
    // Recursively search for the node with the given id
    for (const node of nodes) {
      if (node.id === id) {
        return node;
      }
      if (node.children) {
        const found = find(node.children);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };
  return find(allNodes);
}

// export const mlNavCategories = [
//   {
//     type: LinkCategoryType.separator,
//     linkIds: [
//       ExternalPageName.mlOverview,
//       ExternalPageName.mlNotifications,
//       ExternalPageName.mlMemoryUsage,
//     ],
//   },
//   {
//     type: LinkCategoryType.title,
//     label: ANOMALY_DETECTION_CATEGORY,
//     linkIds: [
//       ExternalPageName.mlAnomalyDetection,
//       ExternalPageName.mlAnomalyExplorer,
//       ExternalPageName.mlSingleMetricViewer,
//       ExternalPageName.mlSuppliedConfigurations,
//       ExternalPageName.mlSettings,
//     ],
//   },
//   {
//     type: LinkCategoryType.title,
//     label: DATA_FRAME_ANALYTICS_CATEGORY,
//     linkIds: [
//       ExternalPageName.mlDataFrameAnalytics,
//       ExternalPageName.mlResultExplorer,
//       ExternalPageName.mlAnalyticsMap,
//     ],
//   },
//   {
//     type: LinkCategoryType.title,
//     label: MODEL_MANAGEMENT_CATEGORY,
//     linkIds: [ExternalPageName.mlNodesOverview],
//   },
//   {
//     type: LinkCategoryType.title,
//     label: DATA_VISUALIZER_CATEGORY,
//     linkIds: [
//       ExternalPageName.mlFileUpload,
//       ExternalPageName.mlIndexDataVisualizer,
//       ExternalPageName.mlESQLdataVisualizer,
//       ExternalPageName.mlDataDrift,
//     ],
//   },
//   {
//     type: LinkCategoryType.title,
//     label: AIOPS_LABS_CATEGORY,
//     linkIds: [
//       ExternalPageName.mlExplainLogRateSpikes,
//       ExternalPageName.mlLogPatternAnalysis,
//       ExternalPageName.mlChangePointDetections,
//     ],
//   },
// ];

// navLinks define the navigation links for the Security Solution pages and External pages as well
// export const mlNavLinks = [
//   {
//     id: ExternalPageName.mlOverview,
//     title: OVERVIEW_TITLE,
//     landingIcon: IconLensLazy,
//     description: OVERVIEW_DESC,
//   },
//   {
//     id: ExternalPageName.mlNotifications,
//     title: NOTIFICATIONS_TITLE,
//     landingIcon: IconMarketingLazy,
//     description: NOTIFICATIONS_DESC,
//   },
//   {
//     id: ExternalPageName.mlMemoryUsage,
//     title: MEMORY_USAGE_TITLE,
//     landingIcon: IconInfraLazy,
//     description: MEMORY_USAGE_DESC,
//   },
//   {
//     id: ExternalPageName.mlAnomalyDetection,
//     title: ANOMALY_DETECTION_TITLE,
//     landingIcon: IconJobsLazy,
//     description: ANOMALY_DETECTION_DESC,
//   },
//   {
//     id: ExternalPageName.mlAnomalyExplorer,
//     title: ANOMALY_EXPLORER_TITLE,
//     landingIcon: IconKeywordLazy,
//     description: ANOMALY_EXPLORER_DESC,
//   },
//   {
//     id: ExternalPageName.mlSingleMetricViewer,
//     title: SINGLE_METRIC_VIEWER_TITLE,
//     landingIcon: IconVisualizationLazy,
//     description: SINGLE_METRIC_VIEWER_DESC,
//   },
//   {
//     id: ExternalPageName.mlSuppliedConfigurations,
//     title: SUPPLIED_CONFIGURATIONS_TITLE,
//     landingIcon: IconJobsLazy,
//     description: SUPPLIED_CONFIGURATIONS_DESC,
//   },
//   {
//     id: ExternalPageName.mlSettings,
//     title: SETTINGS_TITLE,
//     landingIcon: IconSettingsLazy,
//     description: SETTINGS_DESC,
//   },
//   {
//     id: ExternalPageName.mlDataFrameAnalytics,
//     title: DATA_FRAME_ANALYTICS_TITLE,
//     landingIcon: IconJobsLazy,
//     description: DATA_FRAME_ANALYTICS_DESC,
//   },
//   {
//     id: ExternalPageName.mlResultExplorer,
//     title: RESULT_EXPLORER_TITLE,
//     landingIcon: IconDashboardLazy,
//     description: RESULT_EXPLORER_DESC,
//   },
//   {
//     id: ExternalPageName.mlAnalyticsMap,
//     title: ANALYTICS_MAP_TITLE,
//     landingIcon: IconChartArrowLazy,
//     description: ANALYTICS_MAP_DESC,
//   },
//   {
//     id: ExternalPageName.mlNodesOverview,
//     title: NODES_OVERVIEW_TITLE,
//     landingIcon: IconManagerLazy,
//     description: NODES_OVERVIEW_DESC,
//   },
//   {
//     id: ExternalPageName.mlFileUpload,
//     title: FILE_UPLOAD_TITLE,
//     landingIcon: IconFilebeatLazy,
//     description: FILE_UPLOAD_DESC,
//   },
//   {
//     id: ExternalPageName.mlIndexDataVisualizer,
//     title: INDEX_DATA_VISUALIZER_TITLE,
//     landingIcon: IconDataViewLazy,
//     description: INDEX_DATA_VISUALIZER_DESC,
//   },
//   {
//     id: ExternalPageName.mlESQLdataVisualizer,
//     title: ESQL_DATA_VISUALIZER_TITLE,
//     landingIcon: 'sqlApp',
//     description: ESQL_DATA_VISUALIZER_DESC,
//   },
//   {
//     id: ExternalPageName.mlDataDrift,
//     title: DATA_DRIFT_TITLE,
//     landingIcon: IconRapidBarGraphLazy,
//     description: DATA_DRIFT_TITLE,
//   },
//   {
//     id: ExternalPageName.mlExplainLogRateSpikes,
//     title: LOG_RATE_ANALYSIS_TITLE,
//     landingIcon: IconFilebeatChartLazy,
//     description: LOG_RATE_ANALYSIS_DESC,
//   },
//   {
//     id: ExternalPageName.mlLogPatternAnalysis,
//     title: LOG_PATTERN_ANALYSIS_TITLE,
//     landingIcon: IconReplicationLazy,
//     description: LOG_PATTERN_ANALYSIS_DESC,
//   },
//   {
//     id: ExternalPageName.mlChangePointDetections,
//     title: CHANGE_POINT_DETECTIONS_TITLE,
//     landingIcon: IconIntuitiveLazy,
//     description: CHANGE_POINT_DETECTIONS_DESC,
//   },
// ];

// MachineLearningLandingPage
export const LandingPage: React.FC = () => {
  const { services } = useKibana();
  const chrome = services.chrome;
  const { project } = chrome as InternalChromeStart;
  console.log(project, '!!chrome');
  const navigationTreeUi$ = project.getNavigationTreeUi$();
  console.log(navigationTreeUi$, '!!navigationTreeUi$');
  const navigationTree = useObservable(navigationTreeUi$, { body: [] });
  console.log(navigationTree, '!!navigationTree')
  const x = findNodeById('landing', navigationTree);
  console.log(x, '!!xx')
  // console.log(navigationTree.footer, '!!navigationTree');
  // const x = find('landing', navigationTree.footer);
  // useKibana -> get chrome
  // const { chrome } = useKibana().services;
  // chrome.
  // extract the generation on links and pass it to the generic component
  // const link = useRootNavLink(SecurityPageName.mlLanding); // TODO check why it breaks the page
  const link = {
    links: [
      {
        id: 'ml:overview',
        title: 'Overview',
        description: 'Overview page',
        landingIcon: IconLensLazy,
      },
    ],
    categories: [
      {
        type: LinkCategoryType.title,
        label: 'Overview',
        linkIds: ['ml:overview'],
      },
      {
        type: LinkCategoryType.separator,
        linkIds: ['ml:overview'],
      },
    ],
    title: 'Test something',
  };
  const { links = [], categories = [], title } = link ?? {};

  return (
    <KibanaPageTemplate restrictWidth={false} contentBorder={false} grow={true}>
      <KibanaPageTemplate.Section>
        <EuiPageHeader pageTitle={title} />
        <EuiSpacer size="l" />
        <EuiSpacer size="xl" />
        <NavigationProvider core={mockCore}>
          <LandingLinksIconsCategories links={links} categories={categories} />
        </NavigationProvider>
      </KibanaPageTemplate.Section>
    </KibanaPageTemplate>
  );
};
