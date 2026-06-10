import { describe, expect, it } from 'vitest';

import { defaultTooltipProps } from './tooltip-spec.js';

describe('defaultTooltipProps', () => {
  it('matches defaults (top placement / hover trigger / 6px offset)', () => {
    expect(defaultTooltipProps).toEqual({
      content: '',
      show: undefined,
      trigger: 'hover',
      placement: 'top',
      offset: 6,
      flip: true,
      disabled: false,
    });
  });
});
