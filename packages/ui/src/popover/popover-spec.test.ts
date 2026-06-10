import { describe, expect, it } from 'vitest';

import { defaultPopoverProps } from './popover-spec.js';

describe('defaultPopoverProps', () => {
  it('matches defaults (uncontrolled / hover / bottom / offset 4 / flip on)', () => {
    expect(defaultPopoverProps).toEqual({
      show: undefined,
      trigger: 'hover',
      placement: 'bottom',
      offset: 4,
      flip: true,
      widthMatch: false,
      disabled: false,
    });
  });
});
