/**
 * Date parsing helper — .
 *
 * Wraps date-fns `parse()` for consistent date input handling.
 */

import { isValid, parse } from 'date-fns';

/**
 * Parse a date string using the given date-fns format string.
 * Returns `null` if the string is empty or doesn't match the format.
 */
export function parseDateString(text: string, fmt: string): Date | null {
  if (!text) return null;
  const result = parse(text, fmt, new Date());
  if (!isValid(result)) return null;
  return result;
}
