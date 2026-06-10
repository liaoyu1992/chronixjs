import { describe, expect, it } from 'vitest';

import { CHRONIX_CALENDAR_CSS, ensureChronixCalendarStyles } from './calendar-styles.js';

describe('CHRONIX_CALENDAR_CSS', () => {
  it('contains root class', () => {
    expect(CHRONIX_CALENDAR_CSS).toContain('.cx-ui-calendar');
  });

  it('contains header class', () => {
    expect(CHRONIX_CALENDAR_CSS).toContain('.cx-ui-calendar__header');
  });

  it('contains day class', () => {
    expect(CHRONIX_CALENDAR_CSS).toContain('.cx-ui-calendar__day');
  });

  it('contains weekdays class', () => {
    expect(CHRONIX_CALENDAR_CSS).toContain('.cx-ui-calendar__weekdays');
  });

  it('contains modifier classes', () => {
    expect(CHRONIX_CALENDAR_CSS).toContain('--disabled');
    expect(CHRONIX_CALENDAR_CSS).toContain('--selected');
    expect(CHRONIX_CALENDAR_CSS).toContain('--today');
    expect(CHRONIX_CALENDAR_CSS).toContain('--other-month');
  });
});

describe('ensureChronixCalendarStyles', () => {
  it('does not throw in non-DOM env', () => {
    expect(() => ensureChronixCalendarStyles()).not.toThrow();
  });
});
