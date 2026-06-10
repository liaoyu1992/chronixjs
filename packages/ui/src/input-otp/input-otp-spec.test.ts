import { describe, expect, it } from 'vitest';

import { buildOtpCells, defaultInputOtpProps } from './input-otp-spec.js';

describe('defaultInputOtpProps', () => {
  it('matches defaults', () => {
    expect(defaultInputOtpProps).toEqual({
      value: '',
      length: 6,
      disabled: false,
      error: undefined,
    });
  });
});

describe('buildOtpCells', () => {
  it('pads empty string to N empty cells', () => {
    expect(buildOtpCells('', 4)).toEqual(['', '', '', '']);
  });

  it('splits value across cells then pads trailing', () => {
    expect(buildOtpCells('12', 4)).toEqual(['1', '2', '', '']);
  });

  it('clamps excess characters silently', () => {
    expect(buildOtpCells('123456789', 6)).toEqual(['1', '2', '3', '4', '5', '6']);
  });

  it('returns empty array for length <= 0', () => {
    expect(buildOtpCells('abc', 0)).toEqual([]);
  });
});
