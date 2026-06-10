import { describe, expect, it } from 'vitest';

import {
  STEP_INDICATOR_ERROR_PLACEHOLDER,
  STEP_INDICATOR_FINISH_PLACEHOLDER,
  defaultStepsProps,
  type StepItem,
  type StepsProps,
} from './steps-spec.js';

describe('defaultStepsProps', () => {
  it('matches the documented defaults (empty items, current=0, horizontal)', () => {
    expect(defaultStepsProps).toEqual({
      items: [],
      current: 0,
      direction: 'horizontal',
    });
  });

  it('is a StepsProps-shape that adapters can spread', () => {
    const items: StepItem[] = [
      { key: 'setup', title: 'Setup', description: undefined, status: undefined },
      { key: 'deploy', title: 'Deploy', description: undefined, status: 'error' },
    ];
    const override: StepsProps = {
      ...defaultStepsProps,
      items,
      current: 1,
      direction: 'vertical',
    };
    expect(override.items).toHaveLength(2);
    expect(override.current).toBe(1);
    expect(override.direction).toBe('vertical');
  });
});

describe('StepItem shape', () => {
  it('accepts items with explicit per-step status override', () => {
    const override: StepItem = {
      key: 'k',
      title: 'T',
      description: undefined,
      status: 'error',
    };
    expect(override.status).toBe('error');
  });

  it('accepts items with no status (auto-derive)', () => {
    const item: StepItem = {
      key: 'k',
      title: 'T',
      description: undefined,
      status: undefined,
    };
    expect(item.status).toBeUndefined();
  });
});

describe('STEP_INDICATOR_*_PLACEHOLDER constants', () => {
  it('exports the unicode check + cross placeholders', () => {
    expect(STEP_INDICATOR_FINISH_PLACEHOLDER).toBe('✓');
    expect(STEP_INDICATOR_ERROR_PLACEHOLDER).toBe('✕');
  });
});
