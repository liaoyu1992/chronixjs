/**
 * chronix-ui icon module — Phase 9 (2026-06-02).
 *
 * Pure-data SVG icon descriptors + process-global registry. Adapters
 * render via `<svg>` + `<path>`; the IR ships only the data.
 *
 * Public surface:
 *
 * - `IconSpec` + `IconPathSpec` — descriptor types.
 * - `DEFAULT_ICON_VIEW_BOX` — `'0 0 24 24'` constant matching all
 *   chronix-NEW defaults.
 * - `DEFAULT_ICONS` — array of 12 chronix-NEW default icons
 *   (chevron-down / up / left / right, close, check, minus, search,
 *   info, warning, error, success).
 * - `registerIcon` / `getIcon` / `hasIcon` / `listIconNames` —
 *   runtime registry API (pre-registered with `DEFAULT_ICONS`).
 */

export type { IconPathSpec, IconSpec } from './icon-spec.js';
export { DEFAULT_ICONS, DEFAULT_ICON_VIEW_BOX } from './default-icons.js';
export { getIcon, hasIcon, listIconNames, registerIcon } from './icon-registry.js';
export type { IconProps } from './icon-props.js';
export { defaultIconProps, resolveIconRenderMode } from './icon-props.js';
export { resolveIconClassList } from './resolve-icon-class-list.js';
export { CHRONIX_ICON_CSS, ensureChronixIconStyles } from './icon-styles.js';
