/**
 * Select value normalization — Phase 31 (2026-06-04).
 *
 * Pure helper: normalizes the `value` prop (single string or string
 * array) into a canonical `string[]` depending on `multiple` mode.
 */

/**
 * Normalize a Select value prop into a `string[]`.
 *
 * - `multiple=false`: accepts `string | undefined` → `string[]` (0 or 1 items).
 * - `multiple=true`: accepts `readonly string[] | undefined` → `string[]`.
 * - `undefined` → `[]` (nothing selected).
 */
export function normalizeSelectValue(
  value: string | readonly string[] | undefined,
  multiple: boolean,
): string[] {
  if (value === undefined) return [];
  if (multiple) {
    if (Array.isArray(value)) return Array.from(value) as string[];
    return [value as string];
  }
  // Single-select: only the first value matters.
  if (Array.isArray(value)) {
    const first = value[0] as string | undefined;
    return first !== undefined ? [first] : [];
  }
  return [value as string];
}
