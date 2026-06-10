import { describe, expect, it } from 'vitest';

import { formatDateValue } from './format-date-value.js';

describe('formatDateValue', () => {
  it('formats a valid Date with yyyy-MM-dd', () => {
    const result = formatDateValue(new Date(2026, 5, 15), 'yyyy-MM-dd');
    expect(result).toBe('2026-06-15');
  });

  it('returns empty string for undefined', () => {
    expect(formatDateValue(undefined, 'yyyy-MM-dd')).toBe('');
  });

  it('returns empty string for invalid date', () => {
    expect(formatDateValue(new Date('invalid'), 'yyyy-MM-dd')).toBe('');
  });

  it('supports custom format patterns', () => {
    const result = formatDateValue(new Date(2026, 0, 5), 'MM/dd/yyyy');
    expect(result).toBe('01/05/2026');
  });
});
