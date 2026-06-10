import { describe, expect, it } from 'vitest';

import { getStepIndicatorContent } from './get-step-indicator-content.js';
import {
  STEP_INDICATOR_ERROR_PLACEHOLDER,
  STEP_INDICATOR_FINISH_PLACEHOLDER,
} from './steps-spec.js';

describe('getStepIndicatorContent', () => {
  it('returns the finish placeholder ("✓") for "finish" status', () => {
    expect(getStepIndicatorContent('finish', 0)).toBe(STEP_INDICATOR_FINISH_PLACEHOLDER);
    expect(getStepIndicatorContent('finish', 4)).toBe(STEP_INDICATOR_FINISH_PLACEHOLDER);
  });

  it('returns the error placeholder ("✕") for "error" status', () => {
    expect(getStepIndicatorContent('error', 1)).toBe(STEP_INDICATOR_ERROR_PLACEHOLDER);
  });

  it('returns 1-based index for "wait" status', () => {
    expect(getStepIndicatorContent('wait', 0)).toBe('1');
    expect(getStepIndicatorContent('wait', 4)).toBe('5');
  });

  it('returns 1-based index for "process" status', () => {
    expect(getStepIndicatorContent('process', 0)).toBe('1');
    expect(getStepIndicatorContent('process', 9)).toBe('10');
  });

  it('returned content is always a string (no Number leakage)', () => {
    expect(typeof getStepIndicatorContent('wait', 0)).toBe('string');
    expect(typeof getStepIndicatorContent('process', 0)).toBe('string');
    expect(typeof getStepIndicatorContent('finish', 0)).toBe('string');
    expect(typeof getStepIndicatorContent('error', 0)).toBe('string');
  });
});
