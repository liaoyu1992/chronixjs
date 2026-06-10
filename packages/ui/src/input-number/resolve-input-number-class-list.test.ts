import { describe, expect, it } from 'vitest';

import { defaultInputNumberProps, type InputNumberProps } from './input-number-spec.js';
import { resolveInputNumberClassList } from './resolve-input-number-class-list.js';

function props(over: Partial<InputNumberProps> = {}): InputNumberProps {
  return { ...defaultInputNumberProps, ...over };
}

describe('resolveInputNumberClassList', () => {
  it('returns base + --medium for defaults', () => {
    expect(resolveInputNumberClassList(props())).toEqual([
      'cx-ui-input-number',
      'cx-ui-input-number--medium',
    ]);
  });

  it('emits --small / --large for size variants', () => {
    expect(resolveInputNumberClassList(props({ size: 'small' }))).toContain(
      'cx-ui-input-number--small',
    );
    expect(resolveInputNumberClassList(props({ size: 'large' }))).toContain(
      'cx-ui-input-number--large',
    );
  });

  it('emits --disabled + --invalid when set', () => {
    const classes = resolveInputNumberClassList(props({ disabled: true, error: 'bad' }));
    expect(classes).toContain('cx-ui-input-number--disabled');
    expect(classes).toContain('cx-ui-input-number--invalid');
  });
});
