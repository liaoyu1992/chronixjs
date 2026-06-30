/**
 * chronix-ui grid module — .
 *
 * Core IR for the Grid 2D layout primitive. Adapter components
 * consume these types + pure helpers to render framework-specific
 * CSS Grid containers.
 */

export type { GridProps } from './grid-spec.js';
export { defaultGridProps } from './grid-spec.js';
export { resolveGridClassList } from './resolve-grid-class-list.js';
export { resolveGridTracks } from './resolve-grid-tracks.js';
export { resolveGridGap, type GridGapStyle } from './resolve-grid-gap.js';
export { CHRONIX_GRID_CSS, ensureChronixGridStyles } from './grid-styles.js';
