/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  Axis,
  BarSeries,
  Chart,
  Position,
  ScaleType,
  Settings,
  niceTimeFormatter,
} from '@elastic/charts';
import { useEuiTheme } from '@elastic/eui';
import { useElasticChartsTheme } from '@kbn/charts-theme';
import { i18n } from '@kbn/i18n';
import type { TailSamplingPreviewBucket } from '@kbn/apm-api-shared';
import React, { useMemo } from 'react';
import { getVizColorForIndex } from '../../../../../../common/viz_colors';
import { getPreviewChartSeries, type PreviewChartSeries } from './preview_chart_series';

interface Props {
  buckets: TailSamplingPreviewBucket[];
  start: number;
  end: number;
}

const CHART_HEIGHT = 180;

const droppedLabel = i18n.translate('xpack.apm.tailSampling.preview.chart.dropped', {
  defaultMessage: 'Dropped',
});
const notKeptLabel = i18n.translate('xpack.apm.tailSampling.preview.chart.notKept', {
  defaultMessage: 'Not kept',
});

const getSeriesName = ({ kind, policyName }: PreviewChartSeries): string => {
  if (kind === 'dropped') {
    return droppedLabel;
  }
  if (kind === 'notKept') {
    return notKeptLabel;
  }
  return i18n.translate('xpack.apm.tailSampling.preview.chart.keptBy', {
    defaultMessage: 'Kept: {policyName}',
    values: { policyName },
  });
};

/** Traces per 5 minutes over the last hour, split into what each policy keeps and the rest. */
export function PolicyPreviewChart({ buckets, start, end }: Props) {
  const { euiTheme } = useEuiTheme();
  const baseTheme = useElasticChartsTheme();
  const series = useMemo(() => getPreviewChartSeries(buckets), [buckets]);
  const timeFormatter = useMemo(() => niceTimeFormatter([start, end]), [start, end]);

  if (series.length === 0) {
    return null;
  }

  // Kept traces take the palette. Dropped and not-kept stay quiet, so what is kept stands out.
  let keptIndex = 0;
  const getColor = ({ kind }: PreviewChartSeries): string => {
    if (kind === 'dropped') {
      return euiTheme.colors.danger;
    }
    if (kind === 'notKept') {
      return euiTheme.colors.lightShade;
    }
    return getVizColorForIndex(keptIndex++, euiTheme);
  };

  return (
    <Chart size={{ height: CHART_HEIGHT }} data-test-subj="apmTailSamplingPreviewChart">
      <Settings
        baseTheme={baseTheme}
        showLegend
        legendPosition={Position.Right}
        locale={i18n.getLocale()}
        ariaLabel={i18n.translate('xpack.apm.tailSampling.preview.chart.ariaLabel', {
          defaultMessage: 'Traces per 5 minutes in the last hour, kept and not kept',
        })}
      />
      <Axis
        id="x-axis"
        position={Position.Bottom}
        tickFormat={timeFormatter}
        gridLine={{ visible: false }}
      />
      <Axis
        id="y-axis"
        position={Position.Left}
        ticks={4}
        gridLine={{ visible: true }}
        title={i18n.translate('xpack.apm.tailSampling.preview.chart.yAxis', {
          defaultMessage: 'Traces',
        })}
      />
      {series.map((serie) => (
        <BarSeries
          key={serie.id}
          id={serie.id}
          name={getSeriesName(serie)}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor="x"
          yAccessors={['y']}
          stackAccessors={['x']}
          data={serie.data}
          color={getColor(serie)}
        />
      ))}
    </Chart>
  );
}
