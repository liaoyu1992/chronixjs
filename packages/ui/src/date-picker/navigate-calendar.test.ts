import { describe, expect, it } from 'vitest';

import {
  nextCalendarMonth,
  prevCalendarMonth,
  calendarMonthLabel,
  deriveCalendarViewMonth,
} from './navigate-calendar.js';

describe('navigate-calendar', () => {
  it('nextCalendarMonth wraps December to January', () => {
    const result = nextCalendarMonth({ year: 2026, month: 11 });
    expect(result).toEqual({ year: 2027, month: 0 });
  });

  it('prevCalendarMonth wraps January to December', () => {
    const result = prevCalendarMonth({ year: 2026, month: 0 });
    expect(result).toEqual({ year: 2025, month: 11 });
  });

  it('nextCalendarMonth increments month', () => {
    const result = nextCalendarMonth({ year: 2026, month: 5 });
    expect(result).toEqual({ year: 2026, month: 6 });
  });

  it('prevCalendarMonth decrements month', () => {
    const result = prevCalendarMonth({ year: 2026, month: 5 });
    expect(result).toEqual({ year: 2026, month: 4 });
  });

  it('calendarMonthLabel formats correctly', () => {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    expect(calendarMonthLabel({ year: 2026, month: 5 }, months)).toBe('June 2026');
  });

  it('deriveCalendarViewMonth uses value when provided', () => {
    const result = deriveCalendarViewMonth(new Date(2025, 2, 10));
    expect(result).toEqual({ year: 2025, month: 2 });
  });
});
