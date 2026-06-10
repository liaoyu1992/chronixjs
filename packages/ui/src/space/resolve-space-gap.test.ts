import { describe, expect, it } from 'vitest';

import { resolveSpaceGap } from './resolve-space-gap.js';

describe('resolveSpaceGap', () => {
  it('returns var() with 8px fallback for "small"', () => {
    expect(resolveSpaceGap('small')).toBe('var(--cx-ui-space-gap-small, 8px)');
  });

  it('returns var() with 12px fallback for "medium"', () => {
    expect(resolveSpaceGap('medium')).toBe('var(--cx-ui-space-gap-medium, 12px)');
  });

  it('returns var() with 24px fallback for "large"', () => {
    expect(resolveSpaceGap('large')).toBe('var(--cx-ui-space-gap-large, 24px)');
  });

  it('returns "Npx" verbatim for numeric values', () => {
    expect(resolveSpaceGap(0)).toBe('0px');
    expect(resolveSpaceGap(4)).toBe('4px');
    expect(resolveSpaceGap(20)).toBe('20px');
  });

  it('handles fractional pixel values', () => {
    expect(resolveSpaceGap(0.5)).toBe('0.5px');
    expect(resolveSpaceGap(2.25)).toBe('2.25px');
  });
});
