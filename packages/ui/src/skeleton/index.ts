/**
 * chronix-ui skeleton module — .
 *
 * Core IR for the Skeleton placeholder. Adapter components consume
 * these types + pure helpers to render framework-specific placeholder
 * elements with identical class structure.
 */

export type { SkeletonProps, SkeletonShape } from './skeleton-spec.js';
export { defaultSkeletonProps } from './skeleton-spec.js';
export { resolveSkeletonClassList } from './resolve-skeleton-class-list.js';
export { formatSkeletonSize } from './format-skeleton-size.js';
export { CHRONIX_SKELETON_CSS, ensureChronixSkeletonStyles } from './skeleton-styles.js';
