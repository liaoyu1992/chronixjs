/**
 * Time formatting helper — .
 */

import { format, isValid } from 'date-fns';

/**
 * Format a Date value for time display using the given date-fns format string.
 * Returns empty string if the date is null/undefined/invalid.
 */
export function formatTimeValue(date: Date | undefined, fmt: string): string {
  if (date === undefined) return '';
  if (!isValid(date)) return '';
  return format(date, fmt);
}
