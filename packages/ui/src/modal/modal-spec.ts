/**
 * Modal component IR — . Tier B portal-mounted
 * centered surface with half-translucent mask + focus trap + body
 * scroll lock + Escape close.
 *
 * Shared core helpers consumed by adapters: `nextPopupZIndex` (
 * z-index counter); `getFirstFocusable` / `getLastFocusable` (
 * focus-trap); `lockBodyScroll` / `unlockBodyScroll` .
 *
 * This file ships only the prop IR + close-reason union; the
 * `useModalLifecycle` composable / hook lives in each adapter.
 */

/**
 * Reason emitted with the `close` event so consumers can branch on
 * intent. The reference UI library distinguishes mask-click vs
 * escape vs close-button intents; we ship the same trio.
 */
export type ModalCloseReason = 'mask' | 'esc' | 'close-button';

export interface ModalProps {
  /**
   * Controlled visibility. `undefined` = uncontrolled; adapter owns
   * the open state. Any boolean = controlled.
   */
  readonly show: boolean | undefined;
  readonly title: string | undefined;
  /** Render the half-translucent mask backdrop behind the panel. */
  readonly mask: boolean;
  /** When `true`, clicking the mask emits `close('mask')` + closes. */
  readonly maskClosable: boolean;
  /** When `true`, pressing Escape emits `close('esc')` + closes. */
  readonly escClosable: boolean;
  /** Panel width — number → `${n}px`, string → applied as-is. */
  readonly width: number | string;
  /** When `true`, never opens (mirror Popover's `disabled` contract). */
  readonly disabled: boolean;
}

export const defaultModalProps: ModalProps = {
  show: undefined,
  title: undefined,
  mask: true,
  maskClosable: true,
  escClosable: true,
  width: 520,
  disabled: false,
};

/**
 * Resolve the inline `width` style value from the `ModalProps.width`
 * field. Numbers become `${n}px`; strings pass through verbatim (so
 * consumers can pass `'80%'` or `'40rem'` if they want).
 */
export function resolveModalWidthStyle(width: number | string): string {
  if (typeof width === 'number') return `${width}px`;
  return width;
}
