import { describe, expect, it } from 'vitest';

import {
  clampSplitSize,
  defaultSplitProps,
  resolveSplitFirstPaneStyle,
  resolveSplitSizePx,
} from './split-spec.js';

describe('defaultSplitProps', () => {
  it('matches the documented defaults', () => {
    expect(defaultSplitProps).toEqual({
      direction: 'horizontal',
      defaultSize: '50%',
      size: undefined,
      minSize: 0,
      maxSize: '100%',
      disabled: false,
    });
  });
});

describe('resolveSplitFirstPaneStyle', () => {
  it('emits flexBasis as px when size is a number', () => {
    expect(resolveSplitFirstPaneStyle({ size: 200 })).toEqual({
      flexBasis: '200px',
      flexGrow: '0',
      flexShrink: '0',
    });
  });

  it('passes string sizes verbatim', () => {
    expect(resolveSplitFirstPaneStyle({ size: '40%' })['flexBasis']).toBe('40%');
    expect(resolveSplitFirstPaneStyle({ size: '20rem' })['flexBasis']).toBe('20rem');
  });
});

describe('resolveSplitSizePx', () => {
  it('passes numbers through verbatim', () => {
    expect(resolveSplitSizePx({ value: 240, containerLengthPx: 1000 })).toBe(240);
  });

  it('resolves percentages against the container length', () => {
    expect(resolveSplitSizePx({ value: '40%', containerLengthPx: 1000 })).toBe(400);
    expect(resolveSplitSizePx({ value: '100%', containerLengthPx: 800 })).toBe(800);
  });

  it('resolves px strings', () => {
    expect(resolveSplitSizePx({ value: '320px', containerLengthPx: 1000 })).toBe(320);
  });

  it('returns null for unresolvable string units (rem etc.)', () => {
    expect(resolveSplitSizePx({ value: '20rem', containerLengthPx: 1000 })).toBeNull();
  });
});

describe('clampSplitSize', () => {
  it('keeps value within [min, max] when in range', () => {
    expect(
      clampSplitSize({
        proposedPx: 400,
        minSize: 100,
        maxSize: 800,
        containerLengthPx: 1000,
      }),
    ).toBe(400);
  });

  it('clamps below min', () => {
    expect(
      clampSplitSize({
        proposedPx: 50,
        minSize: 100,
        maxSize: 800,
        containerLengthPx: 1000,
      }),
    ).toBe(100);
  });

  it('clamps above max', () => {
    expect(
      clampSplitSize({
        proposedPx: 900,
        minSize: 100,
        maxSize: 800,
        containerLengthPx: 1000,
      }),
    ).toBe(800);
  });

  it('falls back to 0 / container length when bounds are unresolvable strings', () => {
    expect(
      clampSplitSize({
        proposedPx: -10,
        minSize: '5rem',
        maxSize: '40rem',
        containerLengthPx: 1000,
      }),
    ).toBe(0);
    expect(
      clampSplitSize({
        proposedPx: 1500,
        minSize: '5rem',
        maxSize: '40rem',
        containerLengthPx: 1000,
      }),
    ).toBe(1000);
  });

  it('resolves percentage bounds against container length', () => {
    expect(
      clampSplitSize({
        proposedPx: 150,
        minSize: '20%',
        maxSize: '80%',
        containerLengthPx: 1000,
      }),
    ).toBe(200);
  });
});
