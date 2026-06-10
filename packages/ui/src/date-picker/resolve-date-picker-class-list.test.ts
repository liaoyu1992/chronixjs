import { describe, expect, it } from 'vitest';

import {
  resolveDatePickerRootClassList,
  resolveDatePickerDayClassList,
} from './resolve-date-picker-class-list.js';

describe('resolveDatePickerRootClassList', () => {
  it('returns root class with no modifiers', () => {
    const cls = resolveDatePickerRootClassList({ disabled: false, open: false });
    expect(cls).toEqual(['cx-ui-date-picker']);
  });

  it('adds disabled and open modifiers', () => {
    const cls = resolveDatePickerRootClassList({ disabled: true, open: true });
    expect(cls).toContain('cx-ui-date-picker--disabled');
    expect(cls).toContain('cx-ui-date-picker--open');
  });
});

describe('resolveDatePickerDayClassList', () => {
  it('marks today and selected', () => {
    const cls = resolveDatePickerDayClassList({
      isCurrentMonth: true,
      isToday: true,
      isSelected: true,
      isDisabled: false,
    });
    expect(cls).toContain('cx-ui-date-picker__day--today');
    expect(cls).toContain('cx-ui-date-picker__day--selected');
  });

  it('marks other month', () => {
    const cls = resolveDatePickerDayClassList({
      isCurrentMonth: false,
      isToday: false,
      isSelected: false,
      isDisabled: false,
    });
    expect(cls).toContain('cx-ui-date-picker__day--other-month');
  });
});
