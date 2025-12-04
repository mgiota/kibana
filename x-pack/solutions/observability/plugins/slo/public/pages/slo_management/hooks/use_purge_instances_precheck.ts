/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { IHttpFetchError, ResponseErrorBody } from '@kbn/core/public';
import { i18n } from '@kbn/i18n';
import { useMutation } from '@kbn/react-query';
import type { PurgeInstancesInput, PurgeInstancesResponse } from '@kbn/slo-schema';
import { useKibana } from '../../../hooks/use_kibana';
import { usePluginContext } from '../../../hooks/use_plugin_context';

type ServerError = IHttpFetchError<ResponseErrorBody>;

export function usePurgeInstancesPrecheck() {
  const {
    notifications: { toasts },
  } = useKibana().services;
  const { sloClient } = usePluginContext();

  return useMutation<PurgeInstancesResponse, ServerError, PurgeInstancesInput>(
    ['purgeInstancesPrecheck'],
    ({ list, staleDuration }) => {
      return sloClient.fetch('POST /api/observability/slos/_purge_instances', {
        params: {
          body: {
            list,
            staleDuration,
            dryRun: true,
          },
        },
      });
    },
    {
      onError: (error) => {
        toasts.addError(new Error(error.body?.message ?? error.message), {
          title: i18n.translate('xpack.slo.bulkPurgePrecheck.errorNotification', {
            defaultMessage: 'Failed to run purge precheck',
          }),
        });
      },
    }
  );
}
