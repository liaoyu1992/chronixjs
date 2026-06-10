import type { DOMRectLike } from './popup-spec.js';

/**
 * Clamp the popup's top-left coords so the popup (width × height)
 * stays inside `viewportRect` shrunk by `paddingPx` on all four sides.
 * Pure function.
 *
 * Phase 4 (2026-06-02).
 *
 * Behavior:
 *
 * - If the popup is wider than the available viewport width (after
 *   padding), it's pinned to the LEFT edge (start of cross-axis range)
 *   so its overflowing portion extends to the right. Same for height
 *   (pinned to TOP edge). This matches user expectation: clamping a
 *   too-large popup never wraps it onto the opposite edge.
 * - Otherwise, the popup is clamped so neither edge crosses the
 *   padded-viewport boundary: `leftPx ∈ [vp.left + pad,
 *   vp.right - popupW - pad]`.
 */
export function clampPopupToViewport(
  popupLeftPx: number,
  popupTopPx: number,
  popupWidth: number,
  popupHeight: number,
  viewportRect: DOMRectLike,
  paddingPx: number,
): { leftPx: number; topPx: number } {
  const minLeft = viewportRect.left + paddingPx;
  const minTop = viewportRect.top + paddingPx;
  const maxLeft = viewportRect.right - popupWidth - paddingPx;
  const maxTop = viewportRect.bottom - popupHeight - paddingPx;
  // When maxLeft < minLeft (popup wider than padded viewport), keep the
  // popup pinned to minLeft so the visible portion starts at the
  // viewport's left edge (with padding). Same for maxTop < minTop.
  const clampedLeft =
    maxLeft < minLeft ? minLeft : Math.max(minLeft, Math.min(popupLeftPx, maxLeft));
  const clampedTop = maxTop < minTop ? minTop : Math.max(minTop, Math.min(popupTopPx, maxTop));
  return { leftPx: clampedLeft, topPx: clampedTop };
}
