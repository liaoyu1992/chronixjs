/**
 * Popover component IR — Phase 26 (2026-06-03). Tier B base popup
 * surface with rich content slot, 4 trigger types, 12 placements +
 * flip, controlled + uncontrolled visibility, portal-mounted overlay.
 *
 * Shared core helpers (Phase 4 `resolvePopupPlacement`, Phase 26
 * `PopupTrigger` + `nextPopupZIndex`) are imported by adapters; this
 * file ships only the prop IR + class-list resolver shape.
 */

import type { PopupPlacement } from '../popup/popup-spec.js';
import type { PopupTrigger } from '../popup/trigger-spec.js';

export interface PopoverProps {
  /**
   * Controlled visibility. `undefined` = uncontrolled (adapter owns the
   * open state). Any boolean value = controlled (consumer drives via
   * `update:show` events; adapter rendering honors the prop value).
   */
  readonly show: boolean | undefined;
  readonly trigger: PopupTrigger;
  readonly placement: PopupPlacement;
  readonly offset: number;
  readonly flip: boolean;
  readonly widthMatch: boolean;
  readonly disabled: boolean;
}

export const defaultPopoverProps: PopoverProps = {
  show: undefined,
  trigger: 'hover',
  placement: 'bottom',
  offset: 4,
  flip: true,
  widthMatch: false,
  disabled: false,
};
