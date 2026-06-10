import { describe, expect, it } from 'vitest';

import {
  resolveCalendarRootClassList,
  resolveCalendarDayClassList,
} from './resolve-calendar-class-list.js';

describe('resolveCalendarRootClassList', () => {
  it('returns root class with no modifiers', () => {
    const cls = resolveCalendarRootClassList({ disabled: false });
    expect(cls).toEqual(['cx-ui-calendar']);
  });

  it('adds disabled modifier', () => {
    const cls = resolveCalendarRootClassList({ disabled: true });
    expect(cls).toContain('cx-ui-calendar--disabled');
  });
});

describe('resolveCalendarDayClassList', () => {
  it('marks today, selected, and current month', () => {
    const cls = resolveCalendarDayClassList({
      isCurrentMonth: true,
      isToday: true,
      isSelected: true,
      isDisabled: false,
    });
    expect(cls).toContain('cx-ui-calendar__day--today');
    expect(cls).toContain('cx-ui-calendar__day--selected');
    expect(cls).not.toContain('cx-ui-calendar__day--other-month');
  });

  it('marks other month and disabled', () => {
    const cls = resolveCalendarDayClassList({
      isCurrentMonth: false,
      isToday: false,
      isSelected: false,
      isDisabled: true,
    });
    expect(cls).toContain('cx-ui-calendar__day--other-month');
    expect(cls).toContain('cx-ui-calendar__day--disabled');
  });
});
