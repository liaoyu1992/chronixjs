import { describe, expect, it } from 'vitest';

import { formatStatisticValue, STATISTIC_PLACEHOLDER } from './format-statistic-value.js';

describe('formatStatisticValue', () => {
  it('returns "-" placeholder for undefined input', () => {
    expect(formatStatisticValue(undefined, undefined)).toBe(STATISTIC_PLACEHOLDER);
    expect(formatStatisticValue(undefined, 2)).toBe(STATISTIC_PLACEHOLDER);
  });

  it('returns string values verbatim', () => {
    expect(formatStatisticValue('1.23K', undefined)).toBe('1.23K');
    expect(formatStatisticValue('$1,234', 2)).toBe('$1,234');
  });

  it('returns "-" placeholder for non-finite numeric (NaN / Infinity)', () => {
    expect(formatStatisticValue(Number.NaN, undefined)).toBe(STATISTIC_PLACEHOLDER);
    expect(formatStatisticValue(Number.POSITIVE_INFINITY, 2)).toBe(STATISTIC_PLACEHOLDER);
    expect(formatStatisticValue(Number.NEGATIVE_INFINITY, undefined)).toBe(STATISTIC_PLACEHOLDER);
  });

  it('returns numeric value verbatim when precision is undefined', () => {
    expect(formatStatisticValue(0, undefined)).toBe('0');
    expect(formatStatisticValue(42, undefined)).toBe('42');
    expect(formatStatisticValue(1234.5678, undefined)).toBe('1234.5678');
  });

  it('applies toFixed(precision) for numeric value + numeric precision', () => {
    expect(formatStatisticValue(1.5, 0)).toBe('2');
    expect(formatStatisticValue(1.23, 2)).toBe('1.23');
    expect(formatStatisticValue(1, 3)).toBe('1.000');
    expect(formatStatisticValue(1234.5678, 2)).toBe('1234.57');
  });

  it('clamps negative precision to 0 (no RangeError)', () => {
    expect(formatStatisticValue(1.5, -3)).toBe('2');
  });

  it('clamps precision > 100 to 100 (no RangeError)', () => {
    expect(() => formatStatisticValue(1, 200)).not.toThrow();
  });

  it('floors fractional precision (e.g. 2.7 → 2)', () => {
    expect(formatStatisticValue(1.234, 2.7)).toBe('1.23');
  });

  it('STATISTIC_PLACEHOLDER constant is the hyphen "-"', () => {
    expect(STATISTIC_PLACEHOLDER).toBe('-');
  });
});
