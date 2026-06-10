/**
 * chronix-ui tag module — Phase 13 (2026-06-02).
 *
 * Core IR for the Tag component. Adapter components in
 * `@chronixjs/ui-vue3` / `ui-vue2` / `ui-react` consume these types +
 * pure helpers to render framework-specific tag elements with
 * identical class structure (parity-by-construction).
 *
 * Public surface:
 *
 * - `TagProps` + `defaultTagProps` — declarative props bag + defaults.
 * - `TagType` / `TagSize` — narrow string unions for each prop axis.
 * - `resolveTagClassList(props)` — props → ordered array of
 *   `cx-ui-tag*` BEM class names.
 * - `CHRONIX_TAG_CSS` + `ensureChronixTagStyles` — shared stylesheet
 *   + idempotent injection helper.
 */

export type { TagProps, TagSize, TagType } from './tag-spec.js';
export { defaultTagProps } from './tag-spec.js';
export { resolveTagClassList } from './resolve-tag-class-list.js';
export { CHRONIX_TAG_CSS, ensureChronixTagStyles } from './tag-styles.js';
