/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiButton, EuiButtonEmpty, EuiText, EuiTourStep } from '@elastic/eui';
import type { EuiTourStepProps } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import React, { useEffect, useState } from 'react';
import { useLocalStorage } from '../../../../../hooks/use_local_storage';

export const TAIL_SAMPLING_TOUR_SEEN_KEY = 'apm.tailSampling.tourSeen';

// The parts of the page the steps point at.
export const TOUR_ANCHOR_START_FROM = 'apmTailSamplingStartFrom';
export const TOUR_ANCHOR_POLICIES = 'apmTailSamplingPoliciesHeader';
export const TOUR_ANCHOR_SAVE = 'apmTailSamplingSave';

const TOUR_WIDTH = 320;

interface TourStep {
  id: string;
  anchor: string;
  anchorPosition: EuiTourStepProps['anchorPosition'];
  title: string;
  content: string;
}

const steps: TourStep[] = [
  {
    id: 'startFrom',
    anchor: TOUR_ANCHOR_START_FROM,
    anchorPosition: 'downLeft',
    title: i18n.translate('xpack.apm.tailSampling.tour.startFrom.title', {
      defaultMessage: 'Pick a starting set',
    }),
    content: i18n.translate('xpack.apm.tailSampling.tour.startFrom.content', {
      defaultMessage: 'It fills the list of policies below. You can change the list afterwards.',
    }),
  },
  {
    id: 'policies',
    anchor: TOUR_ANCHOR_POLICIES,
    anchorPosition: 'upLeft',
    title: i18n.translate('xpack.apm.tailSampling.tour.policies.title', {
      defaultMessage: 'Policies decide what is kept',
    }),
    content: i18n.translate('xpack.apm.tailSampling.tour.policies.content', {
      defaultMessage:
        'A trace is kept if any keep policy matches, unless a drop policy matches too. Traces that match no policy are not kept.',
    }),
  },
  {
    id: 'save',
    anchor: TOUR_ANCHOR_SAVE,
    anchorPosition: 'upRight',
    title: i18n.translate('xpack.apm.tailSampling.tour.save.title', {
      defaultMessage: 'Nothing changes until you save',
    }),
    content: i18n.translate('xpack.apm.tailSampling.tour.save.content', {
      defaultMessage: 'Saving turns tail-based sampling on with the policies in the list.',
    }),
  },
];

/** A three-step tour of the page, shown once per browser on a first setup. */
export function PolicyTour({ isActive }: { isActive: boolean }) {
  const [isSeen, setIsSeen] = useLocalStorage(TAIL_SAMPLING_TOUR_SEEN_KEY, false);
  const [stepIndex, setStepIndex] = useState(0);
  // The anchors are siblings of the tour, so they exist only after the first render.
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [first, second, third] = steps;
  const step = stepIndex === 0 ? first : stepIndex === 1 ? second : third;

  if (!isActive || isSeen || !isMounted) {
    return null;
  }

  const finish = () => setIsSeen(true);
  const isLastStep = stepIndex === steps.length - 1;

  return (
    <EuiTourStep
      key={step.id}
      anchor={`[data-test-subj="${step.anchor}"]`}
      anchorPosition={step.anchorPosition}
      title={step.title}
      content={
        <EuiText size="s">
          <p>{step.content}</p>
        </EuiText>
      }
      step={stepIndex + 1}
      stepsTotal={steps.length}
      isStepOpen
      repositionOnScroll
      minWidth={TOUR_WIDTH}
      maxWidth={TOUR_WIDTH}
      onFinish={finish}
      data-test-subj={`apmTailSamplingTourStep_${step.id}`}
      footerAction={
        isLastStep ? (
          <EuiButton
            size="s"
            color="success"
            data-test-subj="apmTailSamplingTourFinish"
            onClick={finish}
          >
            {i18n.translate('xpack.apm.tailSampling.tour.finish', { defaultMessage: 'Finish' })}
          </EuiButton>
        ) : (
          [
            <EuiButtonEmpty
              key="skip"
              size="s"
              color="text"
              data-test-subj="apmTailSamplingTourSkip"
              onClick={finish}
            >
              {i18n.translate('xpack.apm.tailSampling.tour.skip', { defaultMessage: 'Skip tour' })}
            </EuiButtonEmpty>,
            <EuiButton
              key="next"
              size="s"
              color="success"
              data-test-subj="apmTailSamplingTourNext"
              onClick={() => setStepIndex(stepIndex + 1)}
            >
              {i18n.translate('xpack.apm.tailSampling.tour.next', { defaultMessage: 'Next' })}
            </EuiButton>,
          ]
        )
      }
    />
  );
}
