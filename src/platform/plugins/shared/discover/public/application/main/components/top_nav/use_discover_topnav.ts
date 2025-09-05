/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { useMemo } from 'react';
import useObservable from 'react-use/lib/useObservable';
import type { SavedSearchCasesAttachmentPersistedState } from '@kbn/discover-utils';
import { SAVED_SEARCH_ATTACHMENT_TYPE } from '@kbn/discover-utils';
import type { PersistableStateAttachmentPayload } from '@kbn/cases-plugin/common/types/domain';
import { useDiscoverCustomization } from '../../../../customizations';
import { useDiscoverServices } from '../../../../hooks/use_discover_services';
import { useInspector } from '../../hooks/use_inspector';
import { useIsEsqlMode } from '../../hooks/use_is_esql_mode';
import {
  useSavedSearch,
  useSavedSearchHasChanged,
} from '../../state_management/discover_state_provider';
import type { DiscoverStateContainer } from '../../state_management/discover_state';
import { getTopNavBadges } from './get_top_nav_badges';
import { useTopNavLinks } from './use_top_nav_links';
import { useAdHocDataViews, useCurrentDataView } from '../../state_management/redux';
import { useHasShareIntegration } from '../../hooks/use_has_share_integration';
type PersistableStateAttachmentWithoutOwner = Omit<PersistableStateAttachmentPayload, 'owner'>;

const getSavedSearchCaseAttachment = ({
  index,
  timeRange,
  query,
  filters,
  timestampField,
}: SavedSearchCasesAttachmentPersistedState): PersistableStateAttachmentWithoutOwner => {
  const persistableStateAttachmentState: SavedSearchCasesAttachmentPersistedState = {
    index,
    timeRange,
    filters,
    timestampField,
    query,
  };
  // const persistableStateAttachmentState: SavedSearchCasesAttachmentPersistedState = {
  //   index,
  //   timeRange,
  //   query,
  //   filters,
  //   timestampField,
  // };
  return {
    persistableStateAttachmentState,
    persistableStateAttachmentTypeId: SAVED_SEARCH_ATTACHMENT_TYPE,
    type: 'persistableState',
  } as unknown as PersistableStateAttachmentWithoutOwner;
};

export const useDiscoverTopNav = ({
  stateContainer,
}: {
  stateContainer: DiscoverStateContainer;
}) => {
  const services = useDiscoverServices();
  const topNavCustomization = useDiscoverCustomization('top_nav');
  const hasSavedSearchChanges = useObservable(stateContainer.savedSearchState.getHasChanged$());
  const hasUnsavedChanges = Boolean(
    hasSavedSearchChanges && stateContainer.savedSearchState.getId()
  );

  const topNavBadges = useMemo(
    () =>
      getTopNavBadges({
        stateContainer,
        services,
        hasUnsavedChanges,
        topNavCustomization,
      }),
    [stateContainer, services, hasUnsavedChanges, topNavCustomization]
  );
  const savedSearchId = useSavedSearch().id;
  const savedSearchHasChanged = useSavedSearchHasChanged();
  const shouldShowESQLToDataViewTransitionModal = !savedSearchId || savedSearchHasChanged;
  const dataView = useCurrentDataView();
  console.log(dataView, '!!dataView in useDiscoverTopNav');
  console.log(stateContainer, '!!stateContainer');
  const { timefilter } = services.data.query.timefilter;
  const timeRange = timefilter.getTime();
  const filters = services.filterManager.getFilters();
  const query = services.data.query.queryString.getQuery();
  console.log(timeRange, '!!timeRange');
  console.log(filters, '!!filters');
  console.log(dataView.getIndexPattern(), '!!dataView.getIndexPattern()');
  console.log(services.data.query.queryString.getQuery(), '!!services.data.query');
  const adHocDataViews = useAdHocDataViews();
  const isEsqlMode = useIsEsqlMode();
  const onOpenInspector = useInspector({
    inspector: services.inspector,
    stateContainer,
  });
  const hasShareIntegration = useHasShareIntegration(services);
  const useCasesAddToExistingCaseModal = services.cases?.hooks?.useCasesAddToExistingCaseModal!;
  const casesModal = useCasesAddToExistingCaseModal();

  const getAttachments = () => {
    console.log(stateContainer, '!!stateContainer in getAttachments');
    // TODO: Implement logic to return the correct attachments array
    // For now, return an empty array or the correct attachment(s) as needed
    return [
      getSavedSearchCaseAttachment({
        index: dataView.getIndexPattern(),
        timeRange,
        filters,
        timestampField: dataView.timeFieldName,
        query,
      }),
      // getSavedSearchCaseAttachment({
      //   index: dataView.id,
      //   timeRange: stateContainer.timefilter.getTime(),
      //   query: stateContainer.queryState.getQuery(),
      //   filters: stateContainer.queryState.getFilters(),
      //   timestampField: dataView.timeFieldName,
      // }),
    ];
  };
  const onOpenAddToCase = () => {
    casesModal.open({ getAttachments }); // Pass the function, not its result
  };
  const topNavMenu = useTopNavLinks({
    dataView,
    services,
    state: stateContainer,
    onOpenInspector,
    isEsqlMode,
    adHocDataViews,
    topNavCustomization,
    shouldShowESQLToDataViewTransitionModal,
    hasShareIntegration,
    onOpenAddToCase,
  });

  return {
    topNavMenu,
    topNavBadges,
  };
};
