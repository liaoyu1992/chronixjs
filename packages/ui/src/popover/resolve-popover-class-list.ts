import type { PopupPlacement } from '../popup/popup-spec.js';

export interface ResolvePopoverClassListInput {
  /** Actual placement (post-flip) — drives the `--placement-*` modifier. */
  readonly actualPlacement: PopupPlacement;
  /** Whether the popover is currently visible (for the `--open` modifier). */
  readonly open: boolean;
}

export function resolvePopoverClassList(input: ResolvePopoverClassListInput): string[] {
  const classes = ['cx-ui-popover', `cx-ui-popover--${input.actualPlacement}`];
  if (input.open) classes.push('cx-ui-popover--open');
  return classes;
}
