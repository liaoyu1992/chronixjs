/**
 * Popconfirm component IR — Phase 26 (2026-06-03). Tier B confirm-
 * before-action popup surface. Wraps `<ChronixPopover>` at adapter
 * scope with a chronix-rendered title + positive/negative button row.
 *
 * Click-driven by default (consumer wants explicit user confirmation —
 * hovering on by accident shouldn't surface a destructive-action prompt).
 */

import type { PopupPlacement } from '../popup/popup-spec.js';
import type { PopupTrigger } from '../popup/trigger-spec.js';

export interface PopconfirmProps {
  /** Text shown above the buttons. */
  readonly title: string;
  /** Confirm button label. Default `'OK'`. */
  readonly positiveText: string;
  /** Cancel button label. Default `'Cancel'`. */
  readonly negativeText: string;
  readonly show: boolean | undefined;
  readonly trigger: PopupTrigger;
  readonly placement: PopupPlacement;
  readonly offset: number;
  readonly flip: boolean;
  readonly disabled: boolean;
}

export const defaultPopconfirmProps: PopconfirmProps = {
  title: '',
  positiveText: 'OK',
  negativeText: 'Cancel',
  show: undefined,
  trigger: 'click',
  placement: 'top',
  offset: 4,
  flip: true,
  disabled: false,
};
