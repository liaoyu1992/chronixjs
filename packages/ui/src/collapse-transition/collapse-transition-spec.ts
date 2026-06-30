/**
 * CollapseTransition component IR — . Tier B
 * primitive: wraps arbitrary content in a height transition driven by
 * `buildHeightCollapseTransitionStyles`. The adapter measures
 * `element.scrollHeight` after mount + applies the 6-phase styles.
 *
 * Consumed internally by `ChronixCollapse` for each item body; also
 * exposed as a standalone export for ad-hoc expand/collapse needs.
 *
 * Out-of-scope (v0.2):
 * - Auto-resize after expansion (height locked at measured value).
 * - Custom easing per call beyond `spec.easing`.
 */

import { DEFAULT_TRANSITION_DURATION_MS } from '../transition/transition-spec.js';

export interface CollapseTransitionProps {
  /** Controlled visibility. Truthy = expanded; falsy = collapsed. */
  readonly show: boolean;
  /**
   * Animation duration in ms. Falls back to `DEFAULT_TRANSITION_DURATION_MS`
   * (200ms) when unspecified.
   */
  readonly duration: number;
}

export const defaultCollapseTransitionProps: CollapseTransitionProps = {
  show: false,
  duration: DEFAULT_TRANSITION_DURATION_MS,
};
