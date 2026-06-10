import { describe, expect, it } from 'vitest';

import { defaultPopSelectProps } from './pop-select-spec.js';

describe('defaultPopSelectProps', () => {
  it('matches defaults (click trigger / bottom-start / empty options)', () => {
    expect(defaultPopSelectProps).toEqual({
      value: undefined,
      options: [],
      show: undefined,
      trigger: 'click',
      placement: 'bottom-start',
      offset: 4,
      flip: true,
      widthMatch: false,
      disabled: false,
    });
  });
});
