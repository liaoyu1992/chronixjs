/**
 * chronix-ui flex module — Phase 17 (2026-06-02).
 *
 * Core IR for the Flex 1D layout primitive. Adapter components
 * consume these types + pure helpers to render framework-specific
 * flexbox containers.
 */

export type {
  FlexAlign,
  FlexDirection,
  FlexGap,
  FlexJustify,
  FlexProps,
  FlexWrap,
} from './flex-spec.js';
export { defaultFlexProps } from './flex-spec.js';
export { resolveFlexClassList } from './resolve-flex-class-list.js';
export { resolveFlexGap } from './resolve-flex-gap.js';
export { CHRONIX_FLEX_CSS, ensureChronixFlexStyles } from './flex-styles.js';
