/**
 * chronix-ui space module — Phase 17 (2026-06-02).
 *
 * Core IR for the Space 1D layout primitive. Adapter components
 * consume these types + pure helpers to render framework-specific
 * flexbox containers with identical class structure.
 */

export type { SpaceAlign, SpaceJustify, SpaceProps, SpaceSize } from './space-spec.js';
export { defaultSpaceProps } from './space-spec.js';
export { resolveSpaceClassList } from './resolve-space-class-list.js';
export { resolveSpaceGap } from './resolve-space-gap.js';
export { CHRONIX_SPACE_CSS, ensureChronixSpaceStyles } from './space-styles.js';
