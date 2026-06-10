// @vitest-environment happy-dom

/**
 * Slider core tests — Phase 33 (2026-06-05).
 */

import { describe, expect, it } from 'vitest';

import {
  defaultSliderProps,
  computeSliderMarks,
  resolveSliderRootClassList,
  resolveSliderThumbClassList,
  resolveSliderMarkClassList,
  CHRONIX_SLIDER_CSS,
  ensureChronixSliderStyles,
} from './index.js';

describe('defaultSliderProps', () => {
  it('has correct defaults', () => {
    expect(defaultSliderProps.value).toBe(0);
    expect(defaultSliderProps.range).toBe(false);
    expect(defaultSliderProps.min).toBe(0);
    expect(defaultSliderProps.max).toBe(100);
    expect(defaultSliderProps.step).toBe(1);
    expect(defaultSliderProps.marks).toEqual({});
    expect(defaultSliderProps.disabled).toBe(false);
    expect(defaultSliderProps.tooltip).toBe(true);
    expect(defaultSliderProps.vertical).toBe(false);
  });
});

describe('computeSliderMarks', () => {
  it('returns empty for no marks', () => {
    expect(computeSliderMarks({}, 0, 100)).toEqual([]);
  });

  it('computes marks with correct percentages', () => {
    const marks = { 0: { label: 'Start' }, 50: { label: 'Mid' }, 100: { label: 'End' } };
    const result = computeSliderMarks(marks, 0, 100);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ value: 0, label: 'Start', percent: 0 });
    expect(result[1]).toEqual({ value: 50, label: 'Mid', percent: 50 });
    expect(result[2]).toEqual({ value: 100, label: 'End', percent: 100 });
  });

  it('sorts marks by value', () => {
    const marks = { 75: { label: 'C' }, 25: { label: 'A' }, 50: { label: 'B' } };
    const result = computeSliderMarks(marks, 0, 100);
    expect(result.map((m) => m.label)).toEqual(['A', 'B', 'C']);
  });

  it('filters out marks outside range', () => {
    const marks = { '-10': { label: 'Low' }, 50: { label: 'Mid' }, 200: { label: 'High' } };
    const result = computeSliderMarks(marks, 0, 100);
    expect(result).toHaveLength(1);
    expect(result[0]!.label).toBe('Mid');
  });

  it('returns empty for degenerate range', () => {
    const marks = { 50: { label: 'Mid' } };
    expect(computeSliderMarks(marks, 100, 100)).toEqual([]);
    expect(computeSliderMarks(marks, 100, 50)).toEqual([]);
  });

  it('computes percentage for non-zero min', () => {
    const marks = { 10: { label: 'A' }, 20: { label: 'B' } };
    const result = computeSliderMarks(marks, 10, 20);
    expect(result[0]!.percent).toBe(0);
    expect(result[1]!.percent).toBe(100);
  });
});

describe('resolveSliderRootClassList', () => {
  it('returns base class', () => {
    expect(resolveSliderRootClassList({ disabled: false, vertical: false })).toEqual([
      'cx-ui-slider',
    ]);
  });

  it('adds disabled modifier', () => {
    expect(resolveSliderRootClassList({ disabled: true, vertical: false })).toContain(
      'cx-ui-slider--disabled',
    );
  });

  it('adds vertical modifier', () => {
    expect(resolveSliderRootClassList({ disabled: false, vertical: true })).toContain(
      'cx-ui-slider--vertical',
    );
  });
});

describe('resolveSliderThumbClassList', () => {
  it('returns base class', () => {
    expect(resolveSliderThumbClassList({ dragging: false })).toEqual(['cx-ui-slider__thumb']);
  });

  it('adds dragging modifier', () => {
    expect(resolveSliderThumbClassList({ dragging: true })).toContain(
      'cx-ui-slider__thumb--dragging',
    );
  });
});

describe('resolveSliderMarkClassList', () => {
  it('adds active modifier', () => {
    expect(resolveSliderMarkClassList({ active: true })).toContain('cx-ui-slider__mark--active');
  });
});

describe('CHRONIX_SLIDER_CSS', () => {
  it('declares root BEM class', () => {
    expect(CHRONIX_SLIDER_CSS).toContain('.cx-ui-slider');
  });

  it('declares track element', () => {
    expect(CHRONIX_SLIDER_CSS).toContain('.cx-ui-slider__track');
  });

  it('declares fill element', () => {
    expect(CHRONIX_SLIDER_CSS).toContain('.cx-ui-slider__fill');
  });

  it('declares thumb element', () => {
    expect(CHRONIX_SLIDER_CSS).toContain('.cx-ui-slider__thumb');
  });

  it('declares marks element', () => {
    expect(CHRONIX_SLIDER_CSS).toContain('.cx-ui-slider__marks');
  });

  it('declares vertical modifier', () => {
    expect(CHRONIX_SLIDER_CSS).toContain('.cx-ui-slider--vertical');
  });

  it('declares disabled modifier', () => {
    expect(CHRONIX_SLIDER_CSS).toContain('.cx-ui-slider--disabled');
  });
});

describe('ensureChronixSliderStyles', () => {
  it('injects exactly one stylesheet across repeated calls', () => {
    ensureChronixSliderStyles();
    ensureChronixSliderStyles();
    ensureChronixSliderStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="slider"]');
    expect(styles.length).toBe(1);
  });
});
