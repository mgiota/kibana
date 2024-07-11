/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { css } from '@emotion/css';
import type { TimeRange } from '@kbn/es-query';
import { SearchBar } from '@kbn/unified-search-plugin/public';
import React, { useEffect, useRef, useState } from 'react';
import { useKibana } from '../../hooks/use_kibana';

const parentClassName = css`
  width: 100%;
`;

export function InvestigateSearchBar({
  kuery,
  rangeFrom,
  rangeTo,
  onQueryChange,
  onQuerySubmit,
  onRefresh,
  onFocus,
  onBlur,
  showSubmitButton = true,
}: {
  kuery: string;
  rangeFrom?: string;
  rangeTo?: string;
  onQueryChange: (payload: { dateRange: TimeRange; kuery: string }) => void;
  onQuerySubmit: (
    payload: {
      dateRange: TimeRange;
      kuery: string;
    },
    isUpdate?: boolean
  ) => void;
  onRefresh?: Required<React.ComponentProps<typeof SearchBar>>['onRefresh'];
  onFocus?: () => void;
  onBlur?: () => void;
  showSubmitButton?: boolean;
}) {
  const searchBarQuery: Required<React.ComponentProps<typeof SearchBar>>['query'] = {
    language: 'kuery',
    query: kuery,
  };

  const [element, setElement] = useState<HTMLElement | null>(null);

  const onBlurRef = useRef(onBlur);
  onBlurRef.current = onBlur;

  const onFocusRef = useRef(onFocus);
  onFocusRef.current = onFocus;

  const {
    dependencies: {
      start: { unifiedSearch },
    },
  } = useKibana();

  useEffect(() => {
    if (!element) {
      return;
    }

    let inFocus = false;

    function updateFocus(activeElement: Element | null | undefined) {
      const thisElementContainsActiveElement = activeElement && element?.contains(activeElement);

      let nextInFocus = Boolean(thisElementContainsActiveElement);

      if (!nextInFocus) {
        const popoverContent = document.querySelector(
          '[data-test-subj=superDatePickerQuickMenu], .euiDatePopoverContent, .kbnTypeahead'
        );

        nextInFocus = Boolean(
          activeElement &&
            activeElement !== document.body &&
            (activeElement === popoverContent ||
              activeElement?.contains(popoverContent) ||
              popoverContent?.contains(activeElement))
        );
      }

      if (inFocus !== nextInFocus) {
        inFocus = Boolean(nextInFocus);

        if (inFocus) {
          onFocusRef.current?.();
        } else {
          onBlurRef.current?.();
        }
      }
    }

    function captureFocus() {
      updateFocus(document.activeElement);
    }

    function captureBlur(event: FocusEvent) {
      updateFocus(event.relatedTarget as Element | null);
    }

    window.addEventListener('focus', captureFocus, true);

    window.addEventListener('blur', captureBlur, true);

    return () => {
      window.removeEventListener('focus', captureFocus);
      window.removeEventListener('blur', captureBlur);
    };
  }, [element]);

  return (
    <div
      className={parentClassName}
      ref={(nextElement) => {
        setElement(nextElement);
      }}
    >
      <unifiedSearch.ui.SearchBar
        appName="investigate"
        onQueryChange={({ dateRange, query }) => {
          onQueryChange({ dateRange, kuery: String(query?.query) });
        }}
        onQuerySubmit={({ dateRange, query }) => {
          onQuerySubmit({ dateRange, kuery: String(query?.query) });
        }}
        showQueryInput
        showFilterBar={false}
        query={searchBarQuery}
        dateRangeFrom={rangeFrom}
        dateRangeTo={rangeTo}
        onRefresh={onRefresh}
        displayStyle="inPage"
        showSubmitButton={showSubmitButton}
        disableQueryLanguageSwitcher
        showQueryMenu={false}
      />
    </div>
  );
}
