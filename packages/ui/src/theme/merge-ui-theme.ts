import type { ChronixUITheme, ChronixUIThemeOverrides } from './chronix-ui-theme.js';

/**
 * Deep-merge a `ChronixUIThemeOverrides` overlay on top of a base
 * `ChronixUITheme`, returning a new theme. Slice-shallow merge: for each
 * slice present in `overrides`, the result's slice is
 * `{ ...base[slice], ...overrides[slice] }`. Slices NOT present in
 * `overrides` are preserved by reference (no spurious copy).
 *
 * per Decision C.1.
 *
 * Composition use cases:
 *
 * ```ts
 * // Brand color on top of light defaults.
 * const brandTheme = mergeChronixUITheme(defaultChronixUITheme, {
 *   common: { primaryColor: '#ff6b00', primaryColorHover: '#ff8533' },
 * });
 *
 * // Dark mode with brand override.
 * const darkBrand = mergeChronixUITheme(defaultChronixUIThemeDark, {
 *   common: { primaryColor: '#ff6b00' },
 *   button: { borderRadius: '8px' },
 * });
 *
 * // Chains compose left-to-right.
 * const final = mergeChronixUITheme(
 *   mergeChronixUITheme(defaultChronixUIThemeDark, brandOverrides),
 *   sessionOverrides,
 * );
 * ```
 *
 * Immutability: this function returns a new object and never mutates
 * `base` or `overrides`. Returned slices are fresh objects for slices
 * that had overrides; reference-identical for slices that didn't.
 *
 * Note: when chronix-ui adds new theme slices in future phases (e.g.
 * `tree`, `select`), this function must extend its
 * per-slice merge clauses. The cost is a small, well-localized edit per
 * slice; TypeScript will catch missing slices because the return type
 * requires them.
 */
export function mergeChronixUITheme(
  base: ChronixUITheme,
  overrides: ChronixUIThemeOverrides | undefined,
): ChronixUITheme {
  if (!overrides) return base;
  return {
    common: overrides.common ? { ...base.common, ...overrides.common } : base.common,
    button: overrides.button ? { ...base.button, ...overrides.button } : base.button,
  };
}
