import { describe, expect, it } from 'vitest';

import { formatCountdownDuration } from './format-countdown-duration.js';

describe('formatCountdownDuration', () => {
  it('returns 00:00:00 for 0ms / precision 0', () => {
    expect(formatCountdownDuration(0, 0)).toBe('00:00:00');
  });

  it('formats whole-second values at precision 0', () => {
    expect(formatCountdownDuration(1_000, 0)).toBe('00:00:01');
    expect(formatCountdownDuration(61_000, 0)).toBe('00:01:01');
    expect(formatCountdownDuration(3_661_000, 0)).toBe('01:01:01');
  });

  it('zero-pads each axis to 2 digits', () => {
    expect(formatCountdownDuration(5_000, 0)).toBe('00:00:05');
  });

  it('handles hours > 99 without overflow (digits expand)', () => {
    // 100 hours = 360_000_000 ms; HH stays unpadded-3 because padStart preserves leading digits
    expect(formatCountdownDuration(360_000_000, 0)).toBe('100:00:00');
  });

  it('clamps negative remainingMs to 00:00:00', () => {
    expect(formatCountdownDuration(-5_000, 0)).toBe('00:00:00');
  });

  it('clamps non-finite remainingMs to 00:00:00', () => {
    expect(formatCountdownDuration(Number.NaN, 0)).toBe('00:00:00');
    expect(formatCountdownDuration(Number.POSITIVE_INFINITY, 0)).toBe('00:00:00');
    expect(formatCountdownDuration(Number.NEGATIVE_INFINITY, 2)).toBe('00:00:00.00');
  });

  describe('precision suffix', () => {
    it('precision=1 → .S (single fractional digit)', () => {
      expect(formatCountdownDuration(1_123, 1)).toBe('00:00:01.1');
      expect(formatCountdownDuration(1_900, 1)).toBe('00:00:01.9');
    });

    it('precision=2 → .SS (two fractional digits)', () => {
      expect(formatCountdownDuration(1_123, 2)).toBe('00:00:01.12');
      expect(formatCountdownDuration(1_005, 2)).toBe('00:00:01.00');
    });

    it('precision=3 → .SSS (three fractional digits)', () => {
      expect(formatCountdownDuration(1_123, 3)).toBe('00:00:01.123');
      expect(formatCountdownDuration(500, 3)).toBe('00:00:00.500');
    });

    it('truncates (does NOT round) fractional milliseconds', () => {
      // 1.999s should NOT round up to 2.000s — truncation lets the
      // display match the user's expectation of "at least this much
      // time remaining".
      expect(formatCountdownDuration(1_999, 1)).toBe('00:00:01.9');
      expect(formatCountdownDuration(1_999, 2)).toBe('00:00:01.99');
    });

    it('precision=0 + fractional remainder still floors seconds correctly', () => {
      expect(formatCountdownDuration(999, 0)).toBe('00:00:00');
      expect(formatCountdownDuration(1_999, 0)).toBe('00:00:01');
    });

    it('zero-pads fractional remainder when below the digit threshold', () => {
      expect(formatCountdownDuration(1_001, 2)).toBe('00:00:01.00');
      expect(formatCountdownDuration(1_010, 3)).toBe('00:00:01.010');
    });
  });
});
