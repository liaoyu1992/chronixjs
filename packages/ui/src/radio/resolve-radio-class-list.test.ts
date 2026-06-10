import { describe, expect, it } from 'vitest';

import {
  defaultRadioGroupProps,
  defaultRadioProps,
  type RadioGroupProps,
  type RadioProps,
} from './radio-spec.js';
import { resolveRadioClassList, resolveRadioGroupClassList } from './resolve-radio-class-list.js';

function radio(over: Partial<RadioProps> = {}): RadioProps {
  return { ...defaultRadioProps, ...over };
}

function group(over: Partial<RadioGroupProps> = {}): RadioGroupProps {
  return { ...defaultRadioGroupProps, ...over };
}

describe('resolveRadioClassList', () => {
  it('returns base only for unchecked default', () => {
    expect(resolveRadioClassList(radio())).toEqual(['cx-ui-radio']);
  });

  it('emits --checked when checked=true', () => {
    expect(resolveRadioClassList(radio({ checked: true }))).toContain('cx-ui-radio--checked');
  });

  it('emits --disabled when disabled=true', () => {
    expect(resolveRadioClassList(radio({ disabled: true }))).toContain('cx-ui-radio--disabled');
  });
});

describe('resolveRadioGroupClassList', () => {
  it('returns base only for defaults', () => {
    expect(resolveRadioGroupClassList(group())).toEqual(['cx-ui-radio-group']);
  });

  it('emits --disabled + --invalid when set', () => {
    const classes = resolveRadioGroupClassList(group({ disabled: true, error: 'oops' }));
    expect(classes).toContain('cx-ui-radio-group--disabled');
    expect(classes).toContain('cx-ui-radio-group--invalid');
  });
});
