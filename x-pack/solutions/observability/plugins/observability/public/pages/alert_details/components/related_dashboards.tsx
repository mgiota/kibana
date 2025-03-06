/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React from 'react';
import { i18n } from '@kbn/i18n';

export function RelatedDashboards({
  linkedDeshboards,
}: {
  linkedDeshboards: string[] | undefined;
}) {
  console.log(linkedDeshboards, '!!RelatedDashboards');
  return (
    <div>
      <h1>
        {i18n.translate('xpack.observability.relatedDashboards.h1.relatedDashboardsLabel', {
          defaultMessage: 'Related Dashboards',
        })}
      </h1>
      {linkedDeshboards &&
        linkedDeshboards.map((dashboard) => {
          console.log(dashboard, '!!dashboard');
          return (
            <div key={dashboard}>
              <a href={dashboard}>{dashboard}</a>
            </div>
          );
        })}
    </div>
  );
}
