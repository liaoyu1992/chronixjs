import type { DOMRectLike, PopupPlacement } from './popup-spec.js';

/**
 * Compute the popup's base (pre-flip, pre-clamp) top-left coordinates
 * for a given placement. Pure function — no viewport awareness; the
 * orchestrator (`resolvePopupPlacement`) handles flip + clamp on top.
 *
 * .
 *
 * For each placement:
 *
 * - **Main axis** (`top` / `bottom` / `left` / `right`) determines the
 *   anchored edge: `top` puts the popup ABOVE the anchor with `offsetPx`
 *   gap; `bottom` puts it BELOW; `left` to the LEFT; `right` to the RIGHT.
 * - **Alignment suffix** (`-start` / `-end` / omitted for center)
 *   determines cross-axis alignment:
 *   - For `top` / `bottom`: cross-axis is horizontal. `start` aligns
 *     popup-left with anchor-left; `end` aligns popup-right with
 *     anchor-right; center aligns popup-center with anchor-center.
 *   - For `left` / `right`: cross-axis is vertical. `start` aligns
 *     popup-top with anchor-top; `end` aligns popup-bottom with
 *     anchor-bottom; center aligns popup-center with anchor-center.
 *
 * Only `popupRect.width` and `popupRect.height` are read; the popup
 * hasn't been placed yet, so its current left/top are throwaway.
 */
export function computePopupBaseCoords(
  placement: PopupPlacement,
  anchorRect: DOMRectLike,
  popupRect: DOMRectLike,
  offsetPx: number,
): { leftPx: number; topPx: number } {
  const popupW = popupRect.width;
  const popupH = popupRect.height;
  switch (placement) {
    case 'top':
      return {
        leftPx: anchorRect.left + (anchorRect.width - popupW) / 2,
        topPx: anchorRect.top - popupH - offsetPx,
      };
    case 'top-start':
      return {
        leftPx: anchorRect.left,
        topPx: anchorRect.top - popupH - offsetPx,
      };
    case 'top-end':
      return {
        leftPx: anchorRect.left + anchorRect.width - popupW,
        topPx: anchorRect.top - popupH - offsetPx,
      };
    case 'bottom':
      return {
        leftPx: anchorRect.left + (anchorRect.width - popupW) / 2,
        topPx: anchorRect.bottom + offsetPx,
      };
    case 'bottom-start':
      return {
        leftPx: anchorRect.left,
        topPx: anchorRect.bottom + offsetPx,
      };
    case 'bottom-end':
      return {
        leftPx: anchorRect.left + anchorRect.width - popupW,
        topPx: anchorRect.bottom + offsetPx,
      };
    case 'left':
      return {
        leftPx: anchorRect.left - popupW - offsetPx,
        topPx: anchorRect.top + (anchorRect.height - popupH) / 2,
      };
    case 'left-start':
      return {
        leftPx: anchorRect.left - popupW - offsetPx,
        topPx: anchorRect.top,
      };
    case 'left-end':
      return {
        leftPx: anchorRect.left - popupW - offsetPx,
        topPx: anchorRect.top + anchorRect.height - popupH,
      };
    case 'right':
      return {
        leftPx: anchorRect.right + offsetPx,
        topPx: anchorRect.top + (anchorRect.height - popupH) / 2,
      };
    case 'right-start':
      return {
        leftPx: anchorRect.right + offsetPx,
        topPx: anchorRect.top,
      };
    case 'right-end':
      return {
        leftPx: anchorRect.right + offsetPx,
        topPx: anchorRect.top + anchorRect.height - popupH,
      };
  }
}
