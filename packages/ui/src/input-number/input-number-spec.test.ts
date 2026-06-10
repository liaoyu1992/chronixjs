import { describe, expect, it } from 'vitest';

import { defaultInputNumberProps } from './input-number-spec.js';

describe('defaultInputNumberProps', () => {
  it('matches defaults (value=null, step=1, size=medium)', () => {
    expect(defaultInputNumberProps).toEqual({
      value: null,
      min: undefined,
      max: undefined,
      step: 1,
      disabled: false,
      size: 'medium',
      error: undefined,
    });
  });
});
