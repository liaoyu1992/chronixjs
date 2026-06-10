import type { ChronixLocale, ChronixLocaleOverrides } from './chronix-locale.js';

/**
 * Deep-merge a `ChronixLocaleOverrides` overlay on top of a base
 * `ChronixLocale`, returning a new locale. Slice-shallow semantics
 * matching `mergeChronixUITheme`:
 *
 * - `name` — shallow override.
 * - `common` — `{ ...base.common, ...overrides.common }` when overlay
 *   supplies it; otherwise base reference preserved.
 *
 * Phase 3 (2026-06-02). When future phases append per-component slices
 * to `ChronixLocale` (e.g. `datePicker`, `form`, …), extend this
 * function with the corresponding merge clauses — TypeScript will catch
 * missing branches because the return type requires the full shape.
 *
 * Use cases:
 *
 * ```ts
 * // Override one common label in en-US.
 * const customEnUS = mergeLocales(defaultEnUSLocale, {
 *   common: { ok: 'Got it', cancel: 'Dismiss' },
 * });
 *
 * // Build a locale variant (en-GB) by overriding spelling in en-US.
 * const enGB = mergeLocales(defaultEnUSLocale, {
 *   name: 'en-GB',
 *   common: { },
 * });
 * ```
 *
 * Immutability: returns a new object; never mutates `base` or
 * `overrides`. Slices not touched by overrides are reference-equal to
 * the base's values.
 */
export function mergeLocales(
  base: ChronixLocale,
  overrides: ChronixLocaleOverrides | undefined,
): ChronixLocale {
  if (!overrides) return base;
  return {
    name: overrides.name ?? base.name,
    common: overrides.common ? { ...base.common, ...overrides.common } : base.common,
  };
}
