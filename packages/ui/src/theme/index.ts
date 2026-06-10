/**
 * chronix-ui theme module — Phase 1 (2026-06-01).
 *
 * Public surface:
 *
 * - `ChronixUITheme` + `ChronixUIThemeCommon` + `ChronixButtonTheme` —
 *   nested theme interface (Phase 0.1 Decision B.1).
 * - `defaultChronixUITheme` (light) + `defaultChronixUIThemeDark` —
 *   preset themes (Phase 0.1 Decision C.1).
 * - `cssVarsForUITheme` — pure converter to `--cx-ui-*` CSS vars
 *   (Phase 0.1 Decision A.1).
 * - `mergeChronixUITheme` — deep-merge helper for theme composition.
 * - `ChronixUIThemeOverrides` — partial overlay type for the merge helper.
 */

export type {
  ChronixButtonTheme,
  ChronixUITheme,
  ChronixUIThemeCommon,
  ChronixUIThemeOverrides,
} from './chronix-ui-theme.js';
export { defaultChronixUITheme, defaultChronixUIThemeDark } from './chronix-ui-theme.js';
export { cssVarsForUITheme } from './css-vars-for-ui-theme.js';
export { mergeChronixUITheme } from './merge-ui-theme.js';
