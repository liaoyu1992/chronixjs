import { describe, expect, it } from 'vitest';

import { defaultSelectProps } from './select-component-spec.js';

describe('defaultSelectProps', () => {
  it('has correct defaults', () => {
    expect(defaultSelectProps).toEqual({
      value: undefined,
      options: [],
      multiple: false,
      filterable: false,
      clearable: false,
      placeholder: '',
      disabled: false,
      loading: false,
      virtual: false,
      virtualItemHeight: 32,
      placement: 'bottom-start',
    });
  });
});
