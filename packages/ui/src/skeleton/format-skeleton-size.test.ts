import { describe, expect, it } from 'vitest';

import { formatSkeletonSize } from './format-skeleton-size.js';

describe('formatSkeletonSize', () => {
  it('returns undefined for undefined input', () => {
    expect(formatSkeletonSize(undefined)).toBeUndefined();
  });

  it('appends px to numeric values', () => {
    expect(formatSkeletonSize(0)).toBe('0px');
    expect(formatSkeletonSize(200)).toBe('200px');
    expect(formatSkeletonSize(36.5)).toBe('36.5px');
  });

  it('returns string values verbatim', () => {
    expect(formatSkeletonSize('100%')).toBe('100%');
    expect(formatSkeletonSize('3em')).toBe('3em');
    expect(formatSkeletonSize('clamp(100px, 50%, 400px)')).toBe('clamp(100px, 50%, 400px)');
  });

  it('returns empty string verbatim (caller may treat as no-op)', () => {
    expect(formatSkeletonSize('')).toBe('');
  });

  it('passes negative numeric values through with px suffix (no clamping)', () => {
    expect(formatSkeletonSize(-10)).toBe('-10px');
  });
});
