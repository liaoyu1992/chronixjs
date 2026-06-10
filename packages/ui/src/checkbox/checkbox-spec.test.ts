import { describe, expect, it } from 'vitest';

import { defaultCheckboxProps, resolveCheckboxIconState } from './checkbox-spec.js';

describe('defaultCheckboxProps', () => {
  it('matches defaults', () => {
    expect(defaultCheckboxProps).toEqual({
      checked: false,
      indeterminate: false,
      disabled: false,
      label: undefined,
      error: undefined,
    });
  });
});

describe('resolveCheckboxIconState', () => {
  it('returns "unchecked" when neither checked nor indeterminate', () => {
    expect(resolveCheckboxIconState(false, false)).toBe('unchecked');
  });

  it('returns "checked" when only checked is true', () => {
    expect(resolveCheckboxIconState(true, false)).toBe('checked');
  });

  it('returns "indeterminate" when only indeterminate is true', () => {
    expect(resolveCheckboxIconState(false, true)).toBe('indeterminate');
  });

  it('prefers indeterminate over checked when both true', () => {
    expect(resolveCheckboxIconState(true, true)).toBe('indeterminate');
  });
});
