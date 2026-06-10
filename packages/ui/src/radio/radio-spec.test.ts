import { describe, expect, it } from 'vitest';

import { defaultRadioGroupProps, defaultRadioProps } from './radio-spec.js';

describe('defaultRadioGroupProps', () => {
  it('matches defaults', () => {
    expect(defaultRadioGroupProps).toEqual({
      value: '',
      options: [],
      disabled: false,
      error: undefined,
    });
  });
});

describe('defaultRadioProps', () => {
  it('matches defaults', () => {
    expect(defaultRadioProps).toEqual({
      checked: false,
      value: '',
      label: '',
      disabled: false,
    });
  });
});
