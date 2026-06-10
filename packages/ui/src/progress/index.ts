/**
 * chronix-ui progress module — Phase 16 (2026-06-02). Line variant.
 *
 * Core IR for the Progress component. Adapter components consume
 * these types + pure helpers to render framework-specific progress
 * elements with identical class structure.
 */

export type { ProgressIndicatorPlacement, ProgressProps, ProgressType } from './progress-spec.js';
export { defaultProgressProps } from './progress-spec.js';
export { resolveProgressClassList } from './resolve-progress-class-list.js';
export {
  formatProgressPercentage,
  type FormattedProgressPercentage,
} from './format-progress-percentage.js';
export { CHRONIX_PROGRESS_CSS, ensureChronixProgressStyles } from './progress-styles.js';
