import { describe, expect, it } from 'vitest';

import { computeNumberAnimationTween, formatAnimatedNumber } from './number-animation-helpers.js';

describe('computeNumberAnimationTween', () => {
  it('returns from when progress is 0', () => {
    expect(computeNumberAnimationTween(10, 100, 0)).toBe(10);
  });

  it('returns to when progress is 1', () => {
    expect(computeNumberAnimationTween(10, 100, 1)).toBe(100);
  });

  it('returns midpoint when progress is 0.5', () => {
    expect(computeNumberAnimationTween(0, 100, 0.5)).toBe(50);
  });

  it('returns midpoint for negative range', () => {
    expect(computeNumberAnimationTween(-100, 100, 0.5)).toBe(0);
  });

  it('handles from === to (no range)', () => {
    expect(computeNumberAnimationTween(42, 42, 0.75)).toBe(42);
  });
});

describe('formatAnimatedNumber', () => {
  it('formats with precision 0 (integer)', () => {
    expect(formatAnimatedNumber(1234, 0, false)).toBe('1234');
  });

  it('formats with precision 2', () => {
    expect(formatAnimatedNumber(12.3456, 2, false)).toBe('12.35');
  });

  it('omits separator when showSeparator is false', () => {
    expect(formatAnimatedNumber(1234567, 0, false)).toBe('1234567');
  });

  it('adds thousand separators when showSeparator is true', () => {
    const result = formatAnimatedNumber(1234567, 0, true);
    expect(result).toBe('1,234,567');
  });

  it('respects locale parameter for separators', () => {
    const result = formatAnimatedNumber(1234567, 0, true, 'de-DE');
    // German locale uses period as thousand separator
    expect(result).toContain('.');
  });

  it('formats with precision and separator combined', () => {
    const result = formatAnimatedNumber(1234567.89, 2, true);
    expect(result).toBe('1,234,567.89');
  });

  it('uses en-US as default locale when none provided', () => {
    const result = formatAnimatedNumber(1000, 0, true);
    expect(result).toBe('1,000');
  });
});
