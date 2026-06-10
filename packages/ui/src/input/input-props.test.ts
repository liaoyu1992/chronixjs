import { describe, expect, it } from 'vitest';

import { defaultInputProps, getInputInnerTag, type InputProps } from './input-props.js';

function props(over: Partial<InputProps> = {}): InputProps {
  return { ...defaultInputProps, ...over };
}

describe('defaultInputProps', () => {
  it('matches defaults', () => {
    expect(defaultInputProps).toEqual({
      value: '',
      type: 'text',
      placeholder: undefined,
      disabled: false,
      clearable: false,
      size: 'medium',
      rows: 3,
      error: undefined,
    });
  });
});

describe('getInputInnerTag', () => {
  it('returns "input" for type=text', () => {
    expect(getInputInnerTag(props({ type: 'text' }))).toBe('input');
  });

  it('returns "textarea" for type=textarea', () => {
    expect(getInputInnerTag(props({ type: 'textarea' }))).toBe('textarea');
  });
});
