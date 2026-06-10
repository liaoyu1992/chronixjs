import { describe, expect, it } from 'vitest';

import { parseTimeString } from './parse-time-string.js';

describe('parseTimeString', () => {
  it('parses a valid time string', () => {
    const result = parseTimeString('14:30:45', 'HH:mm:ss');
    expect(result).not.toBeNull();
    expect(result!.getHours()).toBe(14);
    expect(result!.getMinutes()).toBe(30);
    expect(result!.getSeconds()).toBe(45);
  });

  it('returns null for empty string', () => {
    expect(parseTimeString('', 'HH:mm:ss')).toBeNull();
  });

  it('returns null for invalid format', () => {
    expect(parseTimeString('not-a-time', 'HH:mm:ss')).toBeNull();
  });
});
