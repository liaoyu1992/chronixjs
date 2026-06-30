/**
 * chronix-ui divider module — .
 *
 * Core IR for the Divider component. Adapter components consume
 * these types + pure helpers to render framework-specific divider
 * elements with identical class structure.
 */

export type { DividerProps, DividerTitlePlacement } from './divider-spec.js';
export { defaultDividerProps } from './divider-spec.js';
export { resolveDividerClassList } from './resolve-divider-class-list.js';
export { CHRONIX_DIVIDER_CSS, ensureChronixDividerStyles } from './divider-styles.js';
