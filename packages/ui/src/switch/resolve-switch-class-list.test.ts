import { describe, expect, it } from 'vitest';

import { resolveSwitchClassList } from './resolve-switch-class-list.js';
import { defaultSwitchProps, type SwitchProps } from './switch-spec.js';

function props(over: Partial<SwitchProps> = {}): SwitchProps {
  return { ...defaultSwitchProps, ...over };
}

describe('resolveSwitchClassList', () => {
  it('returns base + --medium for defaults', () => {
    expect(resolveSwitchClassList(props())).toEqual(['cx-ui-switch', 'cx-ui-switch--medium']);
  });

  it('emits --checked when checked=true', () => {
    expect(resolveSwitchClassList(props({ checked: true }))).toContain('cx-ui-switch--checked');
  });

  it('emits --small / --large for size variants', () => {
    expect(resolveSwitchClassList(props({ size: 'small' }))).toContain('cx-ui-switch--small');
    expect(resolveSwitchClassList(props({ size: 'large' }))).toContain('cx-ui-switch--large');
  });

  it('emits --disabled + --invalid when set', () => {
    const classes = resolveSwitchClassList(props({ disabled: true, error: 'bad' }));
    expect(classes).toContain('cx-ui-switch--disabled');
    expect(classes).toContain('cx-ui-switch--invalid');
  });
});
