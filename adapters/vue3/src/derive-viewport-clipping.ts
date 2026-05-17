/**
 * Phase 27.1: derives viewport-clipping flags + viewport-locked
 * triangle apex positions for a single bar. Pure function — does
 * NOT read Vue refs. The adapter pulls reactive `scrollLeft` +
 * `clientWidth` from `useChartScrollState` (Phase 23) and feeds
 * them in alongside the bar's live render geometry.
 *
 * `isViewportClippedStart` fires when the bar's left edge is to
 * the LEFT of the visible viewport — i.e. the user has scrolled
 * right past the bar's start. Independent of Phase 27's
 * axis-clipping flag (`bar.isStart`): a bar can be inside the
 * axis (`bar.isStart === true`) but scrolled out of view
 * (`isViewportClippedStart === true`).
 *
 * `clientWidth === 0` short-circuits both viewport-clipped checks
 * to `false` — this is the pre-mount frame before the chart-pane's
 * `ResizeObserver` has reported the first measurement. Without
 * the guard, `viewportRight = scrollLeft + 0` would erroneously
 * flag every bar whose right edge exceeds `scrollLeft` as
 * viewport-clipped-right. Matches the parity reference's
 * `containerWidth === undefined` short-circuit semantically.
 *
 * Apex positions in CONTENT-COORDS (the chart's content coordinate
 * system, absolute from the leftmost axis tick). When the
 * viewport-clipped sub-case fires, the apex locks to the visible
 * viewport edge in content-coords: `scrollLeft + triangleMargin`
 * (left), `scrollLeft + clientWidth - triangleMargin` (right).
 * The chart-pane's native scroll then translates these into the
 * user's viewport coordinates at paint time, so the user sees the
 * apex 1 px inside the visible viewport edge regardless of how
 * far the bar has scrolled offscreen.
 *
 * Strict `<` / `>` boundaries: a bar whose left edge is EXACTLY at
 * `scrollLeft` is NOT viewport-clipped (the edge sits on the first
 * visible pixel). Symmetric on the right.
 */
export interface ViewportClippingResult {
  readonly isViewportClippedStart: boolean;
  readonly isViewportClippedEnd: boolean;
  /** Content-coord apex x for the viewport-locked LEFT triangle (only valid when `isViewportClippedStart`). */
  readonly viewportLockedLeftApexX: number;
  /** Content-coord apex x for the viewport-locked RIGHT triangle (only valid when `isViewportClippedEnd`). */
  readonly viewportLockedRightApexX: number;
}

export function deriveViewportClipping(
  renderX: number,
  renderWidth: number,
  scrollLeft: number,
  clientWidth: number,
  triangleMargin: number,
): ViewportClippingResult {
  if (clientWidth === 0) {
    return {
      isViewportClippedStart: false,
      isViewportClippedEnd: false,
      viewportLockedLeftApexX: 0,
      viewportLockedRightApexX: 0,
    };
  }
  const viewportRight = scrollLeft + clientWidth;
  return {
    isViewportClippedStart: renderX < scrollLeft,
    isViewportClippedEnd: renderX + renderWidth > viewportRight,
    viewportLockedLeftApexX: scrollLeft + triangleMargin,
    viewportLockedRightApexX: viewportRight - triangleMargin,
  };
}
