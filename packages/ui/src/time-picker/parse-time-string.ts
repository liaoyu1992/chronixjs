/**
 * Time parsing helper — .
 */

import { isValid, parse } from 'date-fns';

/**
 * Parse a time string using the given date-fns format string.
 * Returns `null` if the string is empty or doesn't match the format.
 */
export function parseTimeString(text: string, fmt: string): Date | null {
  if (!text) return null;
  const result = parse(text, fmt, new Date());
  if (!isValid(result)) return null;
  return result;
}
