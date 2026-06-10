import { describe, expect, it } from 'vitest';

import { defaultMenuProps } from './menu-spec.js';

describe('defaultMenuProps', () => {
  it('matches defaults (vertical, not collapsed, no items, no value)', () => {
    expect(defaultMenuProps).toEqual({
      value: undefined,
      items: [],
      mode: 'vertical',
      collapsed: false,
      disabled: false,
    });
  });
});
