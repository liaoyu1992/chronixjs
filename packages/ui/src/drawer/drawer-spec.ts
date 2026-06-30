/**
 * Drawer component IR — . Tier B portal-mounted
 * surface that slides in from an edge of the viewport. Shares the
 * focus-trap + body-scroll-lock + Escape-close infra with
 * Modal (via the adapter `useModalLifecycle` composable / hook);
 * differs from Modal in layout-only (edge-pinned vs centered).
 *
 * Re-uses Modal's `ModalCloseReason` since `close('mask' | 'esc' |
 * 'close-button')` is identical semantically.
 */

import type { ModalCloseReason } from '../modal/modal-spec.js';

/**
 * Edge the drawer pins to + slides from. Closed union — kept at 4
 * cardinal edges to keep the modifier truth-table small.
 */
export type DrawerPlacement = 'left' | 'right' | 'top' | 'bottom';

export interface DrawerProps {
  /** Controlled visibility (idiom). */
  readonly show: boolean | undefined;
  readonly placement: DrawerPlacement;
  readonly title: string | undefined;
  readonly mask: boolean;
  readonly maskClosable: boolean;
  readonly escClosable: boolean;
  /** Applied as inline `width` when placement is 'left' | 'right'. */
  readonly width: number | string;
  /** Applied as inline `height` when placement is 'top' | 'bottom'. */
  readonly height: number | string;
  readonly disabled: boolean;
}

export const defaultDrawerProps: DrawerProps = {
  show: undefined,
  placement: 'right',
  title: undefined,
  mask: true,
  maskClosable: true,
  escClosable: true,
  width: 400,
  height: 400,
  disabled: false,
};

/**
 * Re-export Modal's close-reason union for consumer convenience
 * (Drawer emits identical reasons).
 */
export type DrawerCloseReason = ModalCloseReason;

/**
 * Resolve the inline panel dimension style based on placement. Returns
 * `{ width }` for horizontal (left/right) and `{ height }` for vertical
 * (top/bottom) — the adapter spreads the result into the panel style.
 */
export function resolveDrawerDimensionStyle(input: {
  readonly placement: DrawerPlacement;
  readonly width: number | string;
  readonly height: number | string;
}): Record<string, string> {
  const { placement, width, height } = input;
  if (placement === 'left' || placement === 'right') {
    return { width: typeof width === 'number' ? `${width}px` : width };
  }
  return { height: typeof height === 'number' ? `${height}px` : height };
}
