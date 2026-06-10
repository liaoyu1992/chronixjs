/**
 * ButtonGroup IR — Phase 24 (2026-06-03). Tier A flex-container
 * that groups `<ChronixButton>` children with merged borders.
 */

import type { ButtonSize } from '../button/index.js';

export interface ButtonGroupProps {
  /** Lay out children vertically instead of horizontally. */
  readonly vertical: boolean;
  /**
   * When set, overrides each child button's `size` prop at render
   * time. `undefined` leaves child sizes untouched.
   */
  readonly size: ButtonSize | undefined;
}

export const defaultButtonGroupProps: ButtonGroupProps = {
  vertical: false,
  size: undefined,
};
