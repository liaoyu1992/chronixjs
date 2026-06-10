import { describe, expect, it } from 'vitest';

import { defaultTreeSelectProps } from './tree-select-spec.js';

describe('defaultTreeSelectProps', () => {
  it('has correct defaults', () => {
    expect(defaultTreeSelectProps).toEqual({
      value: undefined,
      data: [],
      multiple: false,
      clearable: false,
      placeholder: '',
      disabled: false,
      expandedKeys: [],
      filterTree: false,
      placement: 'bottom-start',
    });
  });
});
