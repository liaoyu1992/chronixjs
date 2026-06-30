/**
 * chronix-ui theme module — .
 *
 * Public surface:
 *
 * - `ChronixUITheme` + `ChronixUIThemeCommon` + `ChronixButtonTheme` —
 *   nested theme interface (Decision B.1).
 * - `defaultChronixUITheme` (light) + `defaultChronixUIThemeDark` —
 *   preset themes (Decision C.1).
 * - `cssVarsForUITheme` — pure converter to `--cx-ui-*` CSS vars
 *   (Decision A.1).
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
