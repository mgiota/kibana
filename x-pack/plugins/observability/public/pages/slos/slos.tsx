/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useEffect, useState } from 'react';
import { FormattedMessage } from '@kbn/i18n-react';
import { encode } from '@kbn/rison';
import {
  EuiButton,
  EuiSpacer,
  EuiTitle,
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { useBreadcrumbs } from '@kbn/observability-shared-plugin/public';

import { SavedObjectFinder } from '@kbn/saved-objects-finder-plugin/public';
import { useKibana } from '../../utils/kibana_react';
import { usePluginContext } from '../../hooks/use_plugin_context';
import { useLicense } from '../../hooks/use_license';
import { useCapabilities } from '../../hooks/slo/use_capabilities';
import { useFetchSloList } from '../../hooks/slo/use_fetch_slo_list';
import { useFetchDataViews } from '../../hooks/use_fetch_data_views';

import { SloList } from './components/slo_list';
import { AutoRefreshButton } from '../../components/slo/auto_refresh_button';
import { HeaderTitle } from './components/header_title';
import { AddFromLibraryButton } from '../../components/slo/add_from_library_button/add_from_library_button';
import { FeedbackButton } from '../../components/slo/feedback_button/feedback_button';
import { paths } from '../../../common/locators/paths';
import { useAutoRefreshStorage } from '../../components/slo/auto_refresh_button/hooks/use_auto_refresh_storage';
import { HeaderMenu } from '../overview/components/header_menu/header_menu';
import { SloOutdatedCallout } from '../../components/slo/slo_outdated_callout';
const SEARCH_OBJECT_TYPE = 'search';

export function SlosPage() {
  const {
    application: { navigateToUrl },
    http: { basePath },
    savedObjectsTagging,
    uiSettings,
    contentManagement: { client: contentClient },
    dataViews: dataViewsService,
  } = useKibana().services;
  console.log(dataViewsService, '!!dataViewsService');
  const { ObservabilityPageTemplate } = usePluginContext();
  const { hasWriteCapabilities } = useCapabilities();
  const { hasAtLeast } = useLicense();

  const { isLoading, isError, data: sloList } = useFetchSloList();
  const { total } = sloList ?? { total: 0 };

  const { storeAutoRefreshState, getAutoRefreshState } = useAutoRefreshStorage();
  const [isAutoRefreshing, setIsAutoRefreshing] = useState<boolean>(getAutoRefreshState());
  const [isAddToLibraryOpen, setIsAddToLibraryOpen] = useState(false);
  const { isLoading: isDataViewsLoading, data: dataViews = [] } = useFetchDataViews();
  console.log(dataViews, '!!dataViewssss');
  useBreadcrumbs([
    {
      href: basePath.prepend(paths.observability.slos),
      text: i18n.translate('xpack.observability.breadcrumbs.slosLinkText', {
        defaultMessage: 'SLOs',
      }),
      deepLinkId: 'observability-overview:slos',
    },
  ]);

  useEffect(() => {
    if ((!isLoading && total === 0) || hasAtLeast('platinum') === false || isError) {
      navigateToUrl(basePath.prepend(paths.observability.slosWelcome));
    }
  }, [basePath, hasAtLeast, isError, isLoading, navigateToUrl, total]);

  const handleClickCreateSlo = () => {
    navigateToUrl(basePath.prepend(paths.observability.sloCreate));
  };

  const handleToggleAutoRefresh = () => {
    setIsAutoRefreshing(!isAutoRefreshing);
    storeAutoRefreshState(!isAutoRefreshing);
  };

  const onCloseSavedSearch = () => {
    setIsAddToLibraryOpen(false);
  };

  const handleAddToLibraryOnClick = () => {
    setIsAddToLibraryOpen(true);
  };

  return (
    <ObservabilityPageTemplate
      pageHeader={{
        pageTitle: <HeaderTitle />,
        rightSideItems: [
          <EuiButton
            color="primary"
            data-test-subj="slosPageCreateNewSloButton"
            disabled={!hasWriteCapabilities}
            fill
            onClick={handleClickCreateSlo}
          >
            {i18n.translate('xpack.observability.slo.sloList.pageHeader.createNewButtonLabel', {
              defaultMessage: 'Create new SLO',
            })}
          </EuiButton>,
          <AutoRefreshButton
            isAutoRefreshing={isAutoRefreshing}
            onClick={handleToggleAutoRefresh}
          />,
          <AddFromLibraryButton handleOnClick={handleAddToLibraryOnClick} />,
          <FeedbackButton />,
        ],
        bottomBorder: false,
      }}
      data-test-subj="slosPage"
    >
      <HeaderMenu />
      <SloOutdatedCallout />
      <EuiSpacer size="l" />
      <SloList autoRefresh={isAutoRefreshing} />
      {isAddToLibraryOpen && (
        <EuiFlyout onClose={onCloseSavedSearch}>
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size="m">
              <h2>
                <FormattedMessage
                  id="discover.topNav.openSearchPanel.openSearchTitle"
                  defaultMessage="Saved search"
                />
              </h2>
            </EuiTitle>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            <SavedObjectFinder
              services={{ contentClient, uiSettings }}
              savedObjectMetaData={[
                {
                  type: SEARCH_OBJECT_TYPE,
                  getIconForSavedObject: () => 'discoverApp',
                  name: i18n.translate('xpack.observability.slosPage.savedSearch.savedObjectName', {
                    defaultMessage: 'Saved search',
                  }),
                },
              ]}
              onChoose={(...args) => {
                const savedSearch = args[3];
                console.log(savedSearch, '!!savedSearch');
                const parsedSearchSource = JSON.parse(
                  savedSearch.attributes.kibanaSavedObjectMeta.searchSourceJSON
                );
                console.log(parsedSearchSource, '!!parsedSearchSource');
                const query = parsedSearchSource.query.query;
                const filter = parsedSearchSource.filter;
                console.log(query, '!!query');
                console.log(filter, '!!filters');
                const references = savedSearch.references;
                console.log(references, '!!references');
                // TODO
                // 1. get indexName
                // 2. get filter
                // 3. get query
                // 4. send to the create form pre-filled with customKQL, dataview and good query
                // 5. before sending to the form maybe have a screenshot of the preview chart?
                // 6. How do I create a screenshot
                const dataViewId = references.filter(({ type }) => type === 'index-pattern')[0].id;
                // const indexName =
                //   dataViews.find((dataView) => dataView.id === dataViewId).title || '';

                dataViewsService.get(dataViewId).then((dataView) => {
                  console.log(dataView.timeFieldName, '!!aaa');
                  const indexName = dataView?.title;
                  const timestampField = dataView?.timeFieldName;
                  setIsAddToLibraryOpen(false);
                  navigateToUrl(
                    basePath.prepend(
                      paths.observability.sloCreateWithEncodedForm(
                        encode({
                          indicator: {
                            type: 'sli.kql.custom',
                            params: {
                              good: query,
                              index: indexName,
                              timestampField,
                            },
                          },
                        })
                      )
                    )
                  );
                });
                // const dataView = dataViews.find((dataView) => dataView.id === dataViewId);
              }}
            />
          </EuiFlyoutBody>
        </EuiFlyout>
      )}
    </ObservabilityPageTemplate>
  );
}
