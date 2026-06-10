import { describe, expect, it } from 'vitest';

import { defaultDynamicInputProps, type DynamicInputProps } from './dynamic-input-props.js';

function props(over: Partial<DynamicInputProps> = {}): DynamicInputProps {
  return { ...defaultDynamicInputProps, ...over };
}

describe('defaultDynamicInputProps', () => {
  it('matches defaults', () => {
    expect(defaultDynamicInputProps).toEqual({
      value: [],
      min: 0,
      disabled: false,
      placeholder: '',
    });
  });

  it('accepts overrides', () => {
    const p = props({ value: ['a', 'b'], max: 10, disabled: true });
    expect(p.value).toEqual(['a', 'b']);
    expect(p.max).toBe(10);
    expect(p.disabled).toBe(true);
  });
});
