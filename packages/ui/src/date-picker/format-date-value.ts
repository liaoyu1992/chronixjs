/**
 * Date formatting helper — Phase 32 (2026-06-05).
 *
 * Wraps date-fns `format()` for consistent date display.
 */

import { format, isValid } from 'date-fns';

/**
 * Format a Date value using the given date-fns format string.
 * Returns empty string if the date is null/undefined/invalid.
 */
export function formatDateValue(date: Date | undefined, fmt: string): string {
  if (date === undefined) return '';
  if (!isValid(date)) return '';
  return format(date, fmt);
}
