/**
 * sanity — de-risks (ColorPicker / Transfer / Slider / Pagination).
 * Validates that all core exports are importable and functional.
 */
import { describe, expect, it } from 'vitest';

import { resolveCalendarDayClassList } from '../calendar/resolve-calendar-class-list.js';
import { generateCalendarGrid, formatDateValue, parseDateString } from '../date-picker/index.js';
import { nextCalendarMonth } from '../date-picker/navigate-calendar.js';
import { formatTimeValue } from '../time-picker/format-time-value.js';
import { generateTimeUnits, findNearestTimeValue } from '../time-picker/generate-time-units.js';
import { parseTimeString } from '../time-picker/parse-time-string.js';

describe('sanity (de-risk)', () => {
  it('date-picker core exports work', () => {
    const grid = generateCalendarGrid({ year: 2026, month: 5, firstDayOfWeek: 0 });
    expect(grid).toHaveLength(42);

    const formatted = formatDateValue(new Date(2026, 5, 15), 'yyyy-MM-dd');
    expect(formatted).toBe('2026-06-15');

    const parsed = parseDateString('2026-06-15', 'yyyy-MM-dd');
    expect(parsed).not.toBeNull();
    expect(parsed!.getDate()).toBe(15);

    const next = nextCalendarMonth({ year: 2026, month: 11 });
    expect(next).toEqual({ year: 2027, month: 0 });
  });

  it('time-picker core exports work', () => {
    const units = generateTimeUnits({
      hourStep: 1,
      minuteStep: 15,
      secondStep: 1,
      use12Hours: false,
    });
    expect(units.hours).toHaveLength(24);
    expect(units.minutes).toEqual([0, 15, 30, 45]);

    const nearest = findNearestTimeValue(7, [0, 15, 30, 45]);
    expect(nearest).toBe(0);

    const formatted = formatTimeValue(new Date(2026, 5, 15, 14, 30, 0), 'HH:mm:ss');
    expect(formatted).toBe('14:30:00');

    const parsed = parseTimeString('14:30:00', 'HH:mm:ss');
    expect(parsed).not.toBeNull();
    expect(parsed!.getHours()).toBe(14);
  });

  it('calendar core exports work', () => {
    const cls = resolveCalendarDayClassList({
      isCurrentMonth: true,
      isToday: true,
      isSelected: false,
      isDisabled: false,
    });
    expect(cls).toContain('cx-ui-calendar__day--today');
  });
});
