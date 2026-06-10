import { describe, expect, it } from 'vitest';

import { formatProgressPercentage } from './format-progress-percentage.js';

describe('formatProgressPercentage', () => {
  it('returns zero shape for 0 / max=100', () => {
    expect(formatProgressPercentage(0)).toEqual({ display: '0%', clamped: 0 });
  });

  it('returns 42% for 42 / max=100', () => {
    expect(formatProgressPercentage(42)).toEqual({ display: '42%', clamped: 42 });
  });

  it('respects custom max (50/200 = 25%)', () => {
    expect(formatProgressPercentage(50, 200)).toEqual({ display: '25%', clamped: 25 });
  });

  it('clamps negative values to 0 + display "0%"', () => {
    expect(formatProgressPercentage(-7)).toEqual({ display: '0%', clamped: 0 });
  });

  it('clamps values over max to 100 + display "100%"', () => {
    expect(formatProgressPercentage(150)).toEqual({ display: '100%', clamped: 100 });
    expect(formatProgressPercentage(500, 100)).toEqual({ display: '100%', clamped: 100 });
  });

  it('returns zero shape for non-finite values', () => {
    expect(formatProgressPercentage(Number.NaN)).toEqual({ display: '0%', clamped: 0 });
    expect(formatProgressPercentage(Number.POSITIVE_INFINITY)).toEqual({
      display: '0%',
      clamped: 0,
    });
    expect(formatProgressPercentage(Number.NEGATIVE_INFINITY)).toEqual({
      display: '0%',
      clamped: 0,
    });
  });

  it('returns zero shape when max is 0 (avoids divide-by-zero)', () => {
    expect(formatProgressPercentage(10, 0)).toEqual({ display: '0%', clamped: 0 });
  });

  it('rounds the display string but preserves the precise clamped ratio', () => {
    // 33.3333… rounds to 33% but clamped stays exact for the fill bar
    const result = formatProgressPercentage(33.4567);
    expect(result.display).toBe('33%');
    expect(result.clamped).toBeCloseTo(33.4567, 4);
  });
});
