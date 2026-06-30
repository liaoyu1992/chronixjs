/**
 * FloatButtonGroup component IR — . Tier B
 * cluster of FloatButtons with optional click/hover trigger that
 * expands/collapses child buttons inline (NOT a portal popup — the
 * cluster is already `position: fixed`).
 *
 * Reuses `PopupTrigger` for the trigger discriminator and
 * the hover delay constants (`DEFAULT_HOVER_ENTER_DELAY_MS` /
 * `DEFAULT_HOVER_LEAVE_DELAY_MS`).
 *
 * Out-of-scope (v0.2):
 * - Menu mode (each child is a labeled item, not a sub-button).
 * - Auto-stack direction reversal based on viewport edge.
 */

import type { FloatButtonShape } from '../float-button/float-button-spec.js';

/**
 * The subset of `PopupTrigger` that makes sense for inline-expand
 * behavior. `'focus'` and `'manual'` deferred to v0.2.
 */
export type FloatButtonGroupTrigger = 'click' | 'hover';

export interface FloatButtonGroupProps {
  readonly shape: FloatButtonShape;
  /**
   * When defined, the group becomes expandable: the main button
   * toggles `expanded` on click (or hover with delays). When
   * undefined, children render in a static cluster (no main button,
   * no toggle).
   */
  readonly trigger: FloatButtonGroupTrigger | undefined;
  readonly right: number;
  readonly bottom: number;
  readonly top: number | undefined;
  readonly left: number | undefined;
  /** Short text on the main button (when `trigger` is defined). */
  readonly description: string | undefined;
}

export const defaultFloatButtonGroupProps: FloatButtonGroupProps = {
  shape: 'circle',
  trigger: undefined,
  right: 24,
  bottom: 24,
  top: undefined,
  left: undefined,
  description: undefined,
};
