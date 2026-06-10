/**
 * chronix-ui number-animation module — Phase 35 (2026-06-05).
 *
 * Pure-function helpers for an animated number display. No DOM access,
 * no framework dependency. Adapters drive requestAnimationFrame (or
 * equivalent) and call `computeNumberAnimationTween` each frame, then
 * `formatAnimatedNumber` for the display string.
 */

export type { NumberAnimationProps } from './number-animation-props.js';
export { defaultNumberAnimationProps } from './number-animation-props.js';

export { computeNumberAnimationTween, formatAnimatedNumber } from './number-animation-helpers.js';

export { resolveNumberAnimationClassList } from './resolve-number-animation-class-list.js';

export {
  CHRONIX_NUMBER_ANIMATION_CSS,
  ensureChronixNumberAnimationStyles,
} from './number-animation-styles.js';
