import { describe, expect, it } from 'vitest';

import { defaultCheckboxProps, type CheckboxProps } from './checkbox-spec.js';
import { resolveCheckboxClassList } from './resolve-checkbox-class-list.js';

function props(over: Partial<CheckboxProps> = {}): CheckboxProps {
  return { ...defaultCheckboxProps, ...over };
}

describe('resolveCheckboxClassList', () => {
  it('returns base only for defaults', () => {
    expect(resolveCheckboxClassList(props())).toEqual(['cx-ui-checkbox']);
  });

  it('adds --checked modifier when checked=true', () => {
    expect(resolveCheckboxClassList(props({ checked: true }))).toContain('cx-ui-checkbox--checked');
  });

  it('adds --indeterminate modifier when indeterminate=true', () => {
    expect(resolveCheckboxClassList(props({ indeterminate: true }))).toContain(
      'cx-ui-checkbox--indeterminate',
    );
  });

  it('emits both --checked and --indeterminate when both set (precedence in icon resolver, not class list)', () => {
    const classes = resolveCheckboxClassList(props({ checked: true, indeterminate: true }));
    expect(classes).toContain('cx-ui-checkbox--checked');
    expect(classes).toContain('cx-ui-checkbox--indeterminate');
  });

  it('emits --disabled + --invalid when set', () => {
    const classes = resolveCheckboxClassList(props({ disabled: true, error: 'bad' }));
    expect(classes).toContain('cx-ui-checkbox--disabled');
    expect(classes).toContain('cx-ui-checkbox--invalid');
  });
});
