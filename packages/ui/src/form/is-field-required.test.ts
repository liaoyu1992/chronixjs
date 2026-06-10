import { describe, expect, it } from 'vitest';

import { isFieldRequired } from './is-field-required.js';

describe('isFieldRequired', () => {
  it('returns false for undefined', () => {
    expect(isFieldRequired(undefined)).toBe(false);
  });

  it('returns false for empty array', () => {
    expect(isFieldRequired([])).toBe(false);
  });

  it('returns true for single rule with required: true', () => {
    expect(isFieldRequired({ required: true, message: 'Required' })).toBe(true);
  });

  it('returns false for single rule without required', () => {
    expect(isFieldRequired({ type: 'email', message: 'Invalid' })).toBe(false);
  });

  it('returns true when any rule in array has required: true', () => {
    expect(
      isFieldRequired([
        { type: 'string', min: 3, message: 'Too short' },
        { required: true, message: 'Required' },
      ]),
    ).toBe(true);
  });

  it('returns false when no rule has required: true', () => {
    expect(
      isFieldRequired([
        { type: 'string', min: 3 },
        { type: 'string', max: 50 },
      ]),
    ).toBe(false);
  });

  it('ignores required: false', () => {
    expect(isFieldRequired({ required: false })).toBe(false);
  });
});
