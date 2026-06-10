import { describe, expect, it } from 'vitest';

import { formatBadgeValue } from './format-badge-value.js';

describe('formatBadgeValue', () => {
  it('returns empty string for undefined / empty input', () => {
    expect(formatBadgeValue(undefined, undefined)).toBe('');
    expect(formatBadgeValue('', undefined)).toBe('');
    expect(formatBadgeValue(undefined, 99)).toBe('');
  });

  it('returns string values verbatim regardless of max', () => {
    expect(formatBadgeValue('NEW', undefined)).toBe('NEW');
    expect(formatBadgeValue('Hot', 5)).toBe('Hot');
  });

  it('stringifies numeric values without max (no truncation)', () => {
    expect(formatBadgeValue(0, undefined)).toBe('0');
    expect(formatBadgeValue(5, undefined)).toBe('5');
    expect(formatBadgeValue(999, undefined)).toBe('999');
  });

  it('does NOT truncate numeric values at or below max', () => {
    expect(formatBadgeValue(0, 99)).toBe('0');
    expect(formatBadgeValue(50, 99)).toBe('50');
    expect(formatBadgeValue(99, 99)).toBe('99');
  });

  it('truncates numeric values above max to `${max}+`', () => {
    expect(formatBadgeValue(100, 99)).toBe('99+');
    expect(formatBadgeValue(999, 99)).toBe('99+');
    expect(formatBadgeValue(51, 50)).toBe('50+');
  });

  it('handles negative numbers without special casing', () => {
    expect(formatBadgeValue(-1, undefined)).toBe('-1');
    // -1 is NOT greater than 99 → no truncation
    expect(formatBadgeValue(-1, 99)).toBe('-1');
  });
});
