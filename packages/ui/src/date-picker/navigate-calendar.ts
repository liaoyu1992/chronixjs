/**
 * Calendar navigation helper — Phase 32 (2026-06-05).
 *
 * Pure functions for month/year navigation in calendar panels.
 */

import { addMonths, subMonths } from 'date-fns';

export interface CalendarViewMonth {
  readonly year: number;
  readonly month: number; // 0-based
}

/**
 * Navigate to the next month.
 */
export function nextCalendarMonth(view: CalendarViewMonth): CalendarViewMonth {
  const next = addMonths(new Date(view.year, view.month, 1), 1);
  return { year: next.getFullYear(), month: next.getMonth() };
}

/**
 * Navigate to the previous month.
 */
export function prevCalendarMonth(view: CalendarViewMonth): CalendarViewMonth {
  const prev = subMonths(new Date(view.year, view.month, 1), 1);
  return { year: prev.getFullYear(), month: prev.getMonth() };
}

/**
 * Get the display label for a calendar view month.
 * Returns e.g. "January 2026".
 */
export function calendarMonthLabel(view: CalendarViewMonth, monthNames: readonly string[]): string {
  return `${monthNames[view.month]} ${view.year}`;
}

/**
 * Derive the initial CalendarViewMonth from a Date value.
 * Falls back to today if value is undefined.
 */
export function deriveCalendarViewMonth(value: Date | undefined): CalendarViewMonth {
  const d = value ?? new Date();
  return { year: d.getFullYear(), month: d.getMonth() };
}
