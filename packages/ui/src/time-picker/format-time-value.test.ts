import { describe, expect, it } from 'vitest';

import { formatTimeValue } from './format-time-value.js';

describe('formatTimeValue', () => {
  it('formats a valid Date with HH:mm:ss', () => {
    const result = formatTimeValue(new Date(2026, 5, 15, 14, 30, 45), 'HH:mm:ss');
    expect(result).toBe('14:30:45');
  });

  it('returns empty string for undefined', () => {
    expect(formatTimeValue(undefined, 'HH:mm:ss')).toBe('');
  });

  it('returns empty string for invalid date', () => {
    expect(formatTimeValue(new Date('invalid'), 'HH:mm:ss')).toBe('');
  });
});
