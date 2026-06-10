import { describe, expect, it } from 'vitest';

import { defaultSwitchProps } from './switch-spec.js';

describe('defaultSwitchProps', () => {
  it('matches defaults', () => {
    expect(defaultSwitchProps).toEqual({
      checked: false,
      disabled: false,
      size: 'medium',
      error: undefined,
    });
  });
});
