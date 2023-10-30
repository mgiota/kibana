/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useCallback } from 'react';
import { stringHash } from '@kbn/ml-string-hash';
import { AttachmentType } from '@kbn/cases-plugin/common';
import { SloEmbeddableInput } from '../embeddable/slo/overview/types';
import { useKibana } from '../utils/kibana_react';

const SLO_EMBEDDABLE = 'SLO_EMBEDDABLE';
/**
 * Returns a callback for opening the cases modal with provided attachment state.
 */
export const useCasesModal = <EmbeddableType extends typeof SLO_EMBEDDABLE>(
  embeddableType: EmbeddableType
) => {
  const { cases } = useKibana().services;
  const selectCaseModal = cases?.hooks.useCasesAddToExistingCaseModal();

  return useCallback(
    (persistableState: Partial<Omit<SloEmbeddableInput, 'id'>>) => {
      const persistableStateAttachmentState = {
        ...persistableState,
        // Creates unique id based on the input
        id: stringHash(JSON.stringify(persistableState)).toString(),
      };
      if (!selectCaseModal) {
        throw new Error('Cases modal is not available');
      }

      selectCaseModal.open({
        getAttachments: () => [
          {
            type: AttachmentType.persistableState,
            persistableStateAttachmentTypeId: embeddableType,
            persistableStateAttachmentState: JSON.parse(
              JSON.stringify(persistableStateAttachmentState)
            ),
          },
        ],
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [embeddableType]
  );
};
