/**
 * chronix-ui locale module — Phase 3 (2026-06-02).
 *
 * Phase 2 (2026-06-01) shipped a `{ name }` stub used by the context
 * module. Phase 3 expands to the full locale system:
 *
 * - `ChronixLocale` + `ChronixLocaleCommon` + `ChronixLocaleOverrides` —
 *   nested-slice interfaces matching the theme module's shape.
 * - `defaultEnUSLocale` / `defaultZhCNLocale` / `defaultJaJPLocale` —
 *   3 preset locales (English / Simplified Chinese / Japanese).
 * - `mergeLocales(base, overrides)` — deep-merge helper for locale
 *   composition (e.g. override one label in a preset).
 * - `registerLocale` / `getLocale` / `hasLocale` / `listLocaleNames` —
 *   runtime locale registry. Pre-registered with the 3 presets.
 *
 * Future per-component locale slices (DatePicker, Form, Upload, …)
 * land in their respective component phases. The merge helper +
 * registry will extend without breaking — `ChronixLocale` slice
 * additions are additive only until v1.0.0.
 */

export type {
  ChronixLocale,
  ChronixLocaleCommon,
  ChronixLocaleOverrides,
} from './chronix-locale.js';
export { defaultEnUSLocale, defaultJaJPLocale, defaultZhCNLocale } from './chronix-locale.js';
export { mergeLocales } from './merge-locales.js';
export { getLocale, hasLocale, listLocaleNames, registerLocale } from './locale-registry.js';
