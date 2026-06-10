import { describe, expect, it } from 'vitest';

import { resolveFlexGap } from './resolve-flex-gap.js';

describe('resolveFlexGap', () => {
  it('returns undefined for undefined input (adapter omits the style)', () => {
    expect(resolveFlexGap(undefined)).toBeUndefined();
  });

  it('returns var() with px fallback for tokens', () => {
    expect(resolveFlexGap('small')).toBe('var(--cx-ui-space-gap-small, 8px)');
    expect(resolveFlexGap('medium')).toBe('var(--cx-ui-space-gap-medium, 12px)');
    expect(resolveFlexGap('large')).toBe('var(--cx-ui-space-gap-large, 24px)');
  });

  it('returns "Npx" for numeric values', () => {
    expect(resolveFlexGap(0)).toBe('0px');
    expect(resolveFlexGap(8)).toBe('8px');
    expect(resolveFlexGap(40)).toBe('40px');
  });

  it('reuses the same CSS-var prefix as Space (shared theme contract)', () => {
    expect(resolveFlexGap('medium')).toContain('--cx-ui-space-gap-medium');
  });
});
