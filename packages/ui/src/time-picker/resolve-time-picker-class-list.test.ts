import { describe, expect, it } from 'vitest';

import {
  resolveTimePickerRootClassList,
  resolveTimePickerColumnItemClassList,
} from './resolve-time-picker-class-list.js';

describe('resolveTimePickerRootClassList', () => {
  it('returns root class with no modifiers', () => {
    const cls = resolveTimePickerRootClassList({ disabled: false, open: false });
    expect(cls).toEqual(['cx-ui-time-picker']);
  });

  it('adds disabled and open modifiers', () => {
    const cls = resolveTimePickerRootClassList({ disabled: true, open: true });
    expect(cls).toContain('cx-ui-time-picker--disabled');
    expect(cls).toContain('cx-ui-time-picker--open');
  });
});

describe('resolveTimePickerColumnItemClassList', () => {
  it('marks selected and disabled', () => {
    const cls = resolveTimePickerColumnItemClassList({ isSelected: true, isDisabled: false });
    expect(cls).toContain('cx-ui-time-picker__item--selected');
  });
});
