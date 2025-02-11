/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React, { memo, useCallback, useMemo } from 'react';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyoutHeader,
  EuiTitle,
  EuiFlyoutBody,
  EuiFlyoutFooter,
} from '@elastic/eui';
import { useExpandableFlyoutApi, useExpandableFlyoutState } from '@kbn/expandable-flyout';

export const RightPanel = memo(() => {
  const { openLeftPanel, closeLeftPanel } = useExpandableFlyoutApi();

  const panels = useExpandableFlyoutState();
  const isExpanded: boolean = !!panels.left;

  const collapseDetails = useCallback(() => closeLeftPanel(), [closeLeftPanel]);

  const expandDetails = useCallback(() => {
    openLeftPanel({ id: 'rule-details-left' });
  }, [openLeftPanel]);

  const collapseButton = useMemo(
    () => (
      <EuiButtonEmpty
        data-test-subj="o11yCollapseButtonCollapseDetailsButton"
        iconSide="left"
        onClick={collapseDetails}
        iconType="arrowEnd"
        size="s"
        aria-label={i18n.translate(
          'xpack.observability.flyout.right.header.collapseDetailButtonAriaLabel',
          {
            defaultMessage: 'Collapse details',
          }
        )}
      >
        <FormattedMessage
          id="xpack.observability.flyout.right.header.collapseDetailButtonLabel"
          defaultMessage="Collapse details"
        />
      </EuiButtonEmpty>
    ),
    [collapseDetails]
  );

  const expandButton = useMemo(
    () => (
      <EuiButtonEmpty
        data-test-subj="o11yExpandButtonExpandDetailsButton"
        iconSide="left"
        onClick={expandDetails}
        iconType="arrowStart"
        size="s"
        aria-label={i18n.translate(
          'xpack.observability.flyout.right.header.expandDetailButtonAriaLabel',
          {
            defaultMessage: 'Expand details',
          }
        )}
      >
        <FormattedMessage
          id="xpack.observability.flyout.right.header.expandDetailButtonLabel"
          defaultMessage="Expand details"
        />
      </EuiButtonEmpty>
    ),
    [expandDetails]
  );

  return (
    <>
      <EuiFlyoutHeader>
        <EuiFlexGroup
          direction="row"
          justifyContent="spaceBetween"
          alignItems="center"
          gutterSize="none"
          responsive={false}
        >
          <EuiFlexItem grow={false}>{isExpanded ? collapseButton : expandButton}</EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <p>{'Example of a right component body'}</p>
      </EuiFlyoutBody>
      <EuiFlyoutFooter>
        <EuiFlexGroup justifyContent="flexEnd">
          <EuiFlexItem grow={false}>
            <EuiButton data-test-subj="o11yRightPanelButton" color="primary">
              {'Footer button'}
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </>
  );
});
