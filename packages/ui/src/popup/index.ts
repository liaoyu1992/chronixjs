/**
 * chronix-ui popup module — Phase 4 (2026-06-02) per Phase 0.2 Decision A.1 / B.1.
 *
 * Framework-agnostic popup positioning. Adapter packages
 * (`@chronixjs/ui-vue3`, `@chronixjs/ui-vue2`, `@chronixjs/ui-react`)
 * wrap this IR with DOM measurement + portal mounting + scroll/resize
 * observation; the math itself lives here.
 *
 * Public surface:
 *
 * - `PopupPlacement` — 12-value placement enum.
 * - `PopupSpec` — placement spec consumed by `resolvePopupPlacement`.
 * - `PopupPlacementInput` / `PopupPlacementResult` — pipeline I/O types.
 * - `DOMRectLike` — structural shape for browser `DOMRect`-compatible inputs.
 * - `defaultPopupSpec` — sensible defaults (placement: 'bottom', offset: 4,
 *   flip: true, widthMatch: false, viewportPadding: 8).
 * - `resolvePopupPlacement` — main orchestrator (widthMatch → flip → base → clamp).
 * - `computePopupBaseCoords` — 12-way placement → base coord switch.
 * - `flipPopupOnOverflow` — main-axis flip helper.
 * - `clampPopupToViewport` — viewport-clamp helper.
 */

export type {
  DOMRectLike,
  PopupPlacement,
  PopupPlacementInput,
  PopupPlacementResult,
  PopupSpec,
} from './popup-spec.js';
export { defaultPopupSpec } from './popup-spec.js';
export { clampPopupToViewport } from './clamp-popup-to-viewport.js';
export { computePopupBaseCoords } from './compute-popup-base-coords.js';
export { flipPopupOnOverflow } from './flip-popup-on-overflow.js';
export { resolvePopupPlacement } from './resolve-popup-placement.js';

/**
 * Phase 26 (2026-06-03) — popup trigger spec + z-index counter shared
 * across the 4 Popover-infra components (Popover / Tooltip / Popconfirm
 * / PopSelect) and downstream Phase 27+ popup-bearing components.
 */
export type { PopupTrigger } from './trigger-spec.js';
export {
  DEFAULT_HOVER_ENTER_DELAY_MS,
  DEFAULT_HOVER_LEAVE_DELAY_MS,
  DEFAULT_POPUP_TRIGGER,
} from './trigger-spec.js';
export { nextPopupZIndex, resetPopupZIndexForTests } from './z-index-counter.js';

/**
 * Phase 27 (2026-06-03) — focus-trap + body-scroll-lock helpers
 * shared by Modal + Drawer adapters' `useModalLifecycle` composable
 * / hook. KitFocusTrap promotion to cx-kit deferred until another
 * package needs it.
 */
export {
  DEFAULT_FOCUSABLE_SELECTOR,
  getFirstFocusable,
  getFocusableElements,
  getLastFocusable,
} from './focus-trap.js';
export {
  getBodyScrollLockCountForTests,
  lockBodyScroll,
  resetBodyScrollLockForTests,
  unlockBodyScroll,
} from './body-scroll-lock.js';
