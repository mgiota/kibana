/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { EmbeddableInput } from '@kbn/embeddable-plugin/public';
import { type CoreStart, IUiSettingsClient, ApplicationStart } from '@kbn/core/public';

export interface EmbeddableSloProps {
  sloId: string;
  sloInstanceId: string;
  startTime: number | null;
  endTime: number | null;
}

export interface SloConfigurationProps {
  onCreate: (props: EmbeddableSloProps) => void;
  onCancel: () => void;
}

export type SloEmbeddableInput = EmbeddableInput & EmbeddableSloProps;

export interface SloEmbeddableDeps {
  uiSettings: IUiSettingsClient;
  http: CoreStart['http'];
  i18n: CoreStart['i18n'];
  application: ApplicationStart;
}
