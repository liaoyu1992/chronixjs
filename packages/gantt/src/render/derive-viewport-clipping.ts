/**
 * Phase 27.1 / Phase 32.6: derives viewport-clipping flags +
 * viewport-locked triangle apex positions for a single bar. Pure
 * function — no framework reactivity, no DOM. The adapter pulls
 * reactive `scrollLeft` + `clientWidth` from its `useChartScrollState`
 * hook/composable and feeds them in alongside the bar's live render
 * geometry.
 *
 * `isViewportClippedStart` fires when the bar OVERLAPS the visible
 * viewport AND its left edge is to the LEFT of the viewport — i.e.
 * the user has scrolled right past the bar's start but the bar
 * still has visible width inside the viewport. Independent of
 * Phase 27's axis-clipping flag (`bar.isStart`): a bar can be
 * inside the axis (`bar.isStart === true`) but partially scrolled
 * out of view (`isViewportClippedStart === true`).
 *
 * Phase 28.2.2 correctness guard: bars that fall ENTIRELY outside
 * the visible viewport (both edges past the same viewport boundary)
 * yield BOTH flags `false`. Without this guard, an offscreen bar's
 * non-overlapping edge would still trip the per-edge flag (e.g. a
 * bar fully right of the viewport had `isViewportClippedEnd === true`),
 * causing downstream consumers (`deriveEdgePaddedX`) to produce a
 * viewport-locked title / dot position on one edge and a default
 * position on the other — yielding negative `availableWidth` and
 * silently suppressing the title text for any wide bar scrolled
 * out of view. The original spec is scroll-invariant for
 * title positioning, so this guard restores cross-demo bar-text
 * count parity.
 *
 * `clientWidth === 0` short-circuits both viewport-clipped checks
 * to `false` — this is the pre-mount frame before the chart-pane's
 * `ResizeObserver` has reported the first measurement. Without
 * the guard, `viewportRight = scrollLeft + 0` would erroneously
 * flag every bar whose right edge exceeds `scrollLeft` as
 * viewport-clipped-right. Matches the original spec's
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
  // Phase 28.2.2: bar must actually OVERLAP the viewport before
  // either viewport-clipped flag fires. A bar entirely offscreen
  // (renderX + renderWidth <= scrollLeft, i.e. fully left of
  // viewport, OR renderX >= viewportRight, fully right of viewport)
  // returns all-false so downstream `deriveEdgePaddedX` consumers
  // fall through to the default / axis-clipped branches instead of
  // generating a viewport-locked position for a bar that has no
  // visible pixels.
  const overlapsViewport = renderX < viewportRight && renderX + renderWidth > scrollLeft;
  return {
    isViewportClippedStart: overlapsViewport && renderX < scrollLeft,
    isViewportClippedEnd: overlapsViewport && renderX + renderWidth > viewportRight,
    viewportLockedLeftApexX: scrollLeft + triangleMargin,
    viewportLockedRightApexX: viewportRight - triangleMargin,
  };
}
