import { describe, expect, it } from 'vitest';

import { defaultButtonGroupProps, type ButtonGroupProps } from './button-group-spec.js';
import { resolveButtonGroupClassList } from './resolve-button-group-class-list.js';

function props(over: Partial<ButtonGroupProps> = {}): ButtonGroupProps {
  return { ...defaultButtonGroupProps, ...over };
}

describe('resolveButtonGroupClassList', () => {
  it('returns base + --horizontal for default props', () => {
    expect(resolveButtonGroupClassList(props())).toEqual([
      'cx-ui-button-group',
      'cx-ui-button-group--horizontal',
    ]);
  });

  it('emits --vertical when vertical=true', () => {
    expect(resolveButtonGroupClassList(props({ vertical: true }))).toEqual([
      'cx-ui-button-group',
      'cx-ui-button-group--vertical',
    ]);
  });

  it('returns a fresh array per call', () => {
    expect(resolveButtonGroupClassList(props())).not.toBe(resolveButtonGroupClassList(props()));
  });
});
