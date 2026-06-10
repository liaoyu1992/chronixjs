/**
 * chronix-ui `getNestedValue` — Phase 34 (2026-06-05).
 *
 * Pure helper for dot-path access into a nested object. Used by FormItem
 * to read the current field value from the form model.
 *
 * ```ts
 * const model = { user: { email: 'alice@example.com' } };
 * getNestedValue(model, 'user.email') // → 'alice@example.com'
 * getNestedValue(model, 'user.phone') // → undefined
 * getNestedValue(model, '')           // → undefined
 * ```
 *
 * Returns `undefined` for any missing segment — no throw. Empty / nullish
 * path returns `undefined`.
 */
export function getNestedValue(model: Record<string, unknown>, path: string): unknown {
  if (!path) return undefined;
  const keys = path.split('.');
  let current: unknown = model;
  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}
