import { describe, expect, it } from 'vitest';

import { defaultDynamicTagsProps, type DynamicTagsProps } from './dynamic-tags-props.js';

function props(over: Partial<DynamicTagsProps> = {}): DynamicTagsProps {
  return { ...defaultDynamicTagsProps, ...over };
}

describe('defaultDynamicTagsProps', () => {
  it('matches defaults', () => {
    expect(defaultDynamicTagsProps).toEqual({
      value: [],
      closable: true,
      disabled: false,
    });
  });

  it('accepts overrides', () => {
    const p = props({ value: ['alpha', 'beta'], max: 5, disabled: true });
    expect(p.value).toEqual(['alpha', 'beta']);
    expect(p.max).toBe(5);
    expect(p.disabled).toBe(true);
  });
});
