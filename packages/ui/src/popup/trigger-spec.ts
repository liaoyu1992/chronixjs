/**
 * Popup trigger type — . Shared across Popover /
 * Tooltip / Popconfirm / PopSelect (this phase) and Modal / Drawer /
 * Dropdown / Menu and Select family and
 * DatePicker / TimePicker / Calendar .
 *
 * Pure-data union: adapters wire DOM listeners corresponding to each
 * trigger type; the IR carries the discriminator only.
 *
 * - `'click'` — toggle on trigger click; click outside + Escape close.
 * - `'hover'` — show on mouseenter, hide on mouseleave (per-side delay).
 * - `'focus'` — show on focusin, hide on focusout (so focus inside the
 *   popup content keeps it open).
 * - `'manual'` — fully controlled via `show` prop; no internal listeners.
 */
export type PopupTrigger = 'click' | 'hover' | 'focus' | 'manual';

export const DEFAULT_POPUP_TRIGGER: PopupTrigger = 'hover';

/** Default hover-enter delay in ms — 100ms matches reference popover ergonomics. */
export const DEFAULT_HOVER_ENTER_DELAY_MS = 100;
/** Default hover-leave delay in ms — 200ms gives time to move into the popup. */
export const DEFAULT_HOVER_LEAVE_DELAY_MS = 200;
