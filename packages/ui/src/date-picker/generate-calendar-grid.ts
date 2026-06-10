/**
 * Calendar grid generation — Phase 32 (2026-06-05).
 *
 * Produces a 42-cell (6 rows × 7 columns) grid for a given year/month.
 * Shared by DatePicker and Calendar components.
 *
 * Uses date-fns for date math. No DOM dependency.
 */

import {
  addDays,
  getDate,
  getDay,
  getMonth,
  getYear,
  isSameDay,
  startOfMonth,
  subDays,
} from 'date-fns';

export interface CalendarGridCell {
  /** The date this cell represents. */
  readonly date: Date;
  /** Whether this date belongs to the displayed month. */
  readonly isCurrentMonth: boolean;
  /** Whether this date is today. */
  readonly isToday: boolean;
  /** Day-of-month number (1–31). */
  readonly dayOfMonth: number;
}

export interface GenerateCalendarGridOptions {
  /** Year (e.g. 2026). */
  readonly year: number;
  /** Month (0-based, 0=January). */
  readonly month: number;
  /** First day of week: 0=Sunday, 1=Monday, … 6=Saturday. */
  readonly firstDayOfWeek: number;
  /** Current date (for `isToday`). Defaults to `new Date()`. */
  readonly today?: Date;
}

/**
 * Generate a 42-cell calendar grid for the given year/month.
 *
 * The grid always has exactly 42 cells (6 rows × 7 columns).
 * Cells before the first of the month belong to the previous month;
 * cells after the last of the month belong to the next month.
 *
 * Algorithm:
 * 1. Find the first day of the target month.
 * 2. Find its day-of-week.
 * 3. Shift backwards so the grid starts on `firstDayOfWeek`.
 * 4. Emit 42 consecutive dates from that start point.
 */
export function generateCalendarGrid(options: GenerateCalendarGridOptions): CalendarGridCell[] {
  const { year, month, firstDayOfWeek, today = new Date() } = options;

  const firstOfMonth = startOfMonth(new Date(year, month, 1));
  const dayOfWeek = getDay(firstOfMonth); // 0=Sun … 6=Sat

  // How many days to go back so the grid starts on firstDayOfWeek?
  // (dayOfWeek - firstDayOfWeek + 7) % 7 gives the offset.
  const offset = (dayOfWeek - firstDayOfWeek + 7) % 7;
  const gridStart = subDays(firstOfMonth, offset);

  const cells: CalendarGridCell[] = [];
  for (let i = 0; i < 42; i++) {
    const cellDate = addDays(gridStart, i);
    cells.push({
      date: cellDate,
      isCurrentMonth: getMonth(cellDate) === month && getYear(cellDate) === year,
      isToday: isSameDay(cellDate, today),
      dayOfMonth: getDate(cellDate),
    });
  }

  return cells;
}
