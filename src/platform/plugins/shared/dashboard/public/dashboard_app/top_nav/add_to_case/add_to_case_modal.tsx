/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */
import React, { useState, useMemo } from 'react';
import { AddPageAttachmentToCaseModal } from '@kbn/observability-shared-plugin/public';
import { type CasesPermissions } from '@kbn/cases-plugin/common';

import { type TimeRange } from '@kbn/data-plugin/common';
import { casesService, notificationsService } from '../../../services/kibana_services';
export function AddToCaseModal() {
  const getCasesContext = casesService?.ui?.getCasesContext;

  // TODO cases permissions
  const canUseCases = casesService?.helpers?.canUseCases;
  // const createCaseFlyout = casesService?.hooks.useCasesAddToNewCaseFlyout({ onSuccess: onAddToNewCase });
  const useCasesAddToExistingCaseModal = casesService?.hooks?.useCasesAddToExistingCaseModal!;
  const [isAddToCaseModalOpen, setIsAddToCaseModalOpen] = useState(false);
  const redirectUrl = ''; // TODO useDashboardLocator;
  const casesModal = useCasesAddToExistingCaseModal({
    onClose: (_, isCreateCase) => {
      if (!isCreateCase) {
        alert('close modal');
        // onCloseModal();
      }
    },
  });
  const casesPermissions: CasesPermissions = useMemo(() => {
    if (!canUseCases) {
      return {
        all: false,
        create: false,
        read: false,
        update: false,
        delete: false,
        push: false,
        connectors: false,
        settings: false,
        reopenCase: false,
        createComment: false,
        assign: false,
      };
    }
    return canUseCases();
  }, [canUseCases]);

  const hasCasesPermissions = useMemo(() => {
    return casesPermissions.read && casesPermissions.update && casesPermissions.push;
  }, [casesPermissions]);

  const CasesContext = getCasesContext();

  // simialar to
  // const redirectUrl = useMonitorDetailLocator({
  //   configId: monitor?.config_id ?? '',
  //   timeRange,
  //   locationId,
  //   tabId: 'history',
  //   useAbsoluteDate: true,
  // });

  const pageState = useMemo(() => {
    return {
      type: 'dashboard',
      url: {
        pathAndQuery: redirectUrl,
        label: 'Some dashboard', // dashboard title
        actionLabel: 'View dashboard', // or Go to dashboard
      },
    };
  }, [redirectUrl]);
  // TODO
  // const { dateRangeEnd, dateRangeStart, locationId } = useGetUrlParams();
  // const timeRange: TimeRange = useMemo(
  //   () => ({
  //     from: dateRangeStart,
  //     to: dateRangeEnd,
  //   }),
  //   [dateRangeStart, dateRangeEnd]
  // );

  const attachments = [
    {
      type: 'persistableState',
      persistableStateAttachmentTypeId: '.page',
      persistableStateAttachmentState: { foo: 'foo' },
    },
  ];
  alert('aaaa');
  return (
    <CasesContext
      permissions={casesPermissions}
      owner={['observability']}
      features={{ alerts: { sync: false } }}
    >
      <>
        <div>lala</div>
        {casesModal.open({
          getAttachments: () => [
            {
              type: 'persistableState',
              persistableStateAttachmentTypeId: '.page',
              persistableStateAttachmentState: pageState,
            },
          ],
        })}
      </>
    </CasesContext>
  );
}

// export function AddToCaseModal() {
//   console.log(casesService, '!!casesService');
//   const getCasesContext = casesService?.ui?.getCasesContext;
//   const useCasesAddToExistingCaseModal = casesService?.hooks?.useCasesAddToExistingCaseModal!;
//   const casesModal = useCasesAddToExistingCaseModal({
//     onClose: (_, isCreateCase) => {
//       if (!isCreateCase) {
//         alert('close modal');
//         // onCloseModal();
//       }
//     },
//   });

//   console.log(casesModal, '!!casesModal');

//   const CasesContext = getCasesContext();
//   return (
//     <CasesContext permissions={{} as CasesPermissions} owner={['observability']}>
//       <>
//         <div>lala</div>
//       </>
//     </CasesContext>
//   );
// }
