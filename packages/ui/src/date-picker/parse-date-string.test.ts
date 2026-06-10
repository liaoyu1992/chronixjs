import { describe, expect, it } from 'vitest';

import { parseDateString } from './parse-date-string.js';

describe('parseDateString', () => {
  it('parses a valid date string', () => {
    const result = parseDateString('2026-06-15', 'yyyy-MM-dd');
    expect(result).not.toBeNull();
    expect(result!.getFullYear()).toBe(2026);
    expect(result!.getMonth()).toBe(5); // June = 5
    expect(result!.getDate()).toBe(15);
  });

  it('returns null for empty string', () => {
    expect(parseDateString('', 'yyyy-MM-dd')).toBeNull();
  });

  it('returns null for invalid format', () => {
    expect(parseDateString('not-a-date', 'yyyy-MM-dd')).toBeNull();
  });

  it('parses custom format', () => {
    const result = parseDateString('01/05/2026', 'MM/dd/yyyy');
    expect(result).not.toBeNull();
    expect(result!.getFullYear()).toBe(2026);
    expect(result!.getMonth()).toBe(0); // January = 0
  });
});
