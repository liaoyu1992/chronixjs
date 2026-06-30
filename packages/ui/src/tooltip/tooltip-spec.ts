/**
 * Tooltip component IR — . Tier B text-only popup
 * surface. Thin styling variant of `<ChronixPopover>` with simpler API
 * (`content: string` prop instead of slot) and dark default theme.
 *
 * Multi-line / rich-text tooltips → use `<ChronixPopover>` directly.
 */

import type { PopupPlacement } from '../popup/popup-spec.js';
import type { PopupTrigger } from '../popup/trigger-spec.js';

export interface TooltipProps {
  /** Text content rendered inside the popup. Single-line/short labels. */
  readonly content: string;
  readonly show: boolean | undefined;
  readonly trigger: PopupTrigger;
  readonly placement: PopupPlacement;
  readonly offset: number;
  readonly flip: boolean;
  readonly disabled: boolean;
}

export const defaultTooltipProps: TooltipProps = {
  content: '',
  show: undefined,
  trigger: 'hover',
  placement: 'top',
  offset: 6,
  flip: true,
  disabled: false,
};
