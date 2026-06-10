import { describe, expect, it } from 'vitest';

import { defaultBackTopProps, resolveBackTopStyle, shouldShowBackTop } from './back-top-spec.js';

describe('defaultBackTopProps', () => {
  it('matches defaults (threshold 100, right+bottom 40, smooth)', () => {
    expect(defaultBackTopProps).toEqual({
      visibilityThreshold: 100,
      right: 40,
      bottom: 40,
      behavior: 'smooth',
    });
  });
});

describe('shouldShowBackTop', () => {
  it('returns true when scrollY meets or exceeds threshold', () => {
    expect(shouldShowBackTop({ scrollY: 100, visibilityThreshold: 100 })).toBe(true);
    expect(shouldShowBackTop({ scrollY: 500, visibilityThreshold: 100 })).toBe(true);
  });
  it('returns false below threshold', () => {
    expect(shouldShowBackTop({ scrollY: 99, visibilityThreshold: 100 })).toBe(false);
    expect(shouldShowBackTop({ scrollY: 0, visibilityThreshold: 100 })).toBe(false);
  });
});

describe('resolveBackTopStyle', () => {
  it('builds the fixed-position inline style record', () => {
    expect(resolveBackTopStyle({ right: 40, bottom: 40 })).toEqual({
      position: 'fixed',
      right: '40px',
      bottom: '40px',
    });
  });
});
