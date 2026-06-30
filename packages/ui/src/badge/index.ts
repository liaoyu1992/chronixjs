/**
 * chronix-ui badge module — .
 *
 * Core IR for the Badge component. Adapter components consume these
 * types + pure helpers to render framework-specific badge elements
 * with identical class structure.
 *
 * Public surface:
 *
 * - `BadgeProps` + `defaultBadgeProps` — declarative props + defaults.
 * - `BadgeType` — narrow string union for the indicator color.
 * - `resolveBadgeClassList` — class set on the root.
 * - `resolveBadgeSupClassList` — class set on the indicator inner.
 * - `formatBadgeValue` — value + max → display string.
 * - `CHRONIX_BADGE_CSS` + `ensureChronixBadgeStyles` — shared
 *   stylesheet + idempotent injection helper.
 */

export type { BadgeProps, BadgeType } from './badge-spec.js';
export { defaultBadgeProps } from './badge-spec.js';
export { resolveBadgeClassList, resolveBadgeSupClassList } from './resolve-badge-class-list.js';
export { formatBadgeValue } from './format-badge-value.js';
export { CHRONIX_BADGE_CSS, ensureChronixBadgeStyles } from './badge-styles.js';
