/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { EuiFieldSearch, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import React from 'react';
import { css } from '@emotion/react';
import { TechnicalPreviewBadge } from '../technical_preview_badge';

interface Props {
  placeholder: string;
  searchQuery: string;
  onChangeSearchQuery: (value: string) => void;
  techPreview?: boolean;
}

export function TableSearchBar({
  placeholder,
  searchQuery,
  onChangeSearchQuery,
  techPreview = false,
}: Props) {
  return (
    <EuiFlexGroup gutterSize="s">
      {techPreview ? (
        <EuiFlexItem
          grow={false}
          css={css`
            justify-content: center;
          `}
        >
          <TechnicalPreviewBadge icon="beaker" />
        </EuiFlexItem>
      ) : null}
      <EuiFlexItem>
        <EuiFieldSearch
          data-test-subj="tableSearchInput"
          placeholder={placeholder}
          fullWidth={true}
          value={searchQuery}
          onChange={(e) => {
            onChangeSearchQuery(e.target.value);
          }}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}

export function getItemsFilteredBySearchQuery<T, P extends keyof T>({
  items,
  fieldsToSearch,
  searchQuery,
}: {
  items: T[];
  fieldsToSearch: P[];
  searchQuery: string;
}) {
  return items.filter((item) => {
    return fieldsToSearch.some((field) => {
      const fieldValue = item[field] as unknown as string | undefined;
      return fieldValue?.toLowerCase().includes(searchQuery.toLowerCase());
    });
  });
}
