import { describe, expect, it } from 'vitest';

import { defaultFloatButtonGroupProps } from './float-button-group-spec.js';

describe('defaultFloatButtonGroupProps', () => {
  it('defaults to static cluster (no trigger) at bottom-right 24', () => {
    expect(defaultFloatButtonGroupProps).toEqual({
      shape: 'circle',
      trigger: undefined,
      right: 24,
      bottom: 24,
      top: undefined,
      left: undefined,
      description: undefined,
    });
  });
});
