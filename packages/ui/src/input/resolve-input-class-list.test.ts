import { describe, expect, it } from 'vitest';

import { defaultInputProps, type InputProps } from './input-props.js';
import { resolveInputClassList } from './resolve-input-class-list.js';

function props(over: Partial<InputProps> = {}): InputProps {
  return { ...defaultInputProps, ...over };
}

describe('resolveInputClassList', () => {
  it('returns base + --text + --medium for defaults', () => {
    expect(resolveInputClassList(props())).toEqual([
      'cx-ui-input',
      'cx-ui-input--text',
      'cx-ui-input--medium',
    ]);
  });

  it('emits --textarea + --large modifiers', () => {
    expect(resolveInputClassList(props({ type: 'textarea', size: 'large' }))).toEqual([
      'cx-ui-input',
      'cx-ui-input--textarea',
      'cx-ui-input--large',
    ]);
  });

  it('adds --disabled + --clearable + --invalid when set', () => {
    const classes = resolveInputClassList(
      props({ disabled: true, clearable: true, error: 'oops' }),
    );
    expect(classes).toContain('cx-ui-input--disabled');
    expect(classes).toContain('cx-ui-input--clearable');
    expect(classes).toContain('cx-ui-input--invalid');
  });

  it('omits --invalid when error is undefined', () => {
    expect(
      resolveInputClassList(props({ error: undefined })).some((c) => c.endsWith('--invalid')),
    ).toBe(false);
  });
});
