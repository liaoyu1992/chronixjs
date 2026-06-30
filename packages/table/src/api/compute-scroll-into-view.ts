/**
 * pure scroll-math helper for auto-scrolling a
 * scroll container so a target rectangle becomes fully visible.
 *
 * The active-cell auto-scroll feature feeds this with the body
 * scrollport's current scroll position + the active cell's rect (top /
 * left / height / width in body content coordinates) + the pinned-zone
 * inset margins (`leftPinnedTotalWidth` / `rightPinnedTotalWidth` from
 * `pinnedColsPass`). The helper returns the new `scrollTop` /
 * `scrollLeft` the adapter should assign to the body element.
 *
 * **Algorithm** (per Decision B.1; per-axis identical math):
 *
 *   visibleStart = currentScroll + marginStart
 *   visibleEnd   = currentScroll + clientSize - marginEnd
 *   - target.start < visibleStart →
 *       newScroll = target.start - marginStart
 *   - target.start + target.size > visibleEnd →
 *       newScroll = target.start + target.size - clientSize + marginEnd
 *   - otherwise → newScroll = currentScroll (no change)
 *   clamp newScroll >= 0
 *
 * **Edge behavior**:
 * - `clientHeight <= 0` (pre-mount) → returns current `scrollTop`
 *   unchanged (no division; no negative scroll). Same for `clientWidth`.
 * - Target taller than the visible region → top-aligns
 *   (`scrollTop = target.top - margins.top`); user sees the top of the
 *   cell. Same posture for width.
 * - Margins omitted → all four sides default to 0 (no pinned overlays).
 *
 * Pure function. No DOM. No side effects.
 *
 * chronix-NEW (original grids ship `ensureIndexVisible` / `scrollToCell`
 * style methods that combine the compute + DOM mutation; the pure-
 * function shape with input numbers + output numbers is chronix's own,
 * matching the `computeNextActiveCell` vs AG-Grid's
 * `CellNavigationService` posture).
 */
export interface ScrollIntoViewViewport {
  readonly scrollTop: number;
  readonly scrollLeft: number;
  readonly clientHeight: number;
  readonly clientWidth: number;
}

export interface ScrollIntoViewTarget {
  readonly top: number;
  readonly left: number;
  readonly height: number;
  readonly width: number;
}

/**
 * Pinned-zone insets that reduce the effective visible region. Defaults
 * to 0 on every side. `left` / `right` correspond to
 * `leftPinnedTotalWidth` / `rightPinnedTotalWidth` from `pinnedColsPass`;
 * `top` / `bottom` are 0 today (header + footer are SIBLINGS of body, not
 * overlays above it) but reserved for future sticky-row pinning.
 */
export interface ScrollIntoViewMargins {
  readonly top?: number;
  readonly bottom?: number;
  readonly left?: number;
  readonly right?: number;
}

export interface ScrollIntoViewInput {
  readonly viewport: ScrollIntoViewViewport;
  readonly target: ScrollIntoViewTarget;
  readonly margins?: ScrollIntoViewMargins;
}

export interface ScrollIntoViewResult {
  readonly scrollTop: number;
  readonly scrollLeft: number;
}

function adjustAxis(
  currentScroll: number,
  clientSize: number,
  targetStart: number,
  targetSize: number,
  marginStart: number,
  marginEnd: number,
): number {
  if (clientSize <= 0) return currentScroll;
  const visibleStart = currentScroll + marginStart;
  const visibleEnd = currentScroll + clientSize - marginEnd;
  let next: number;
  if (targetStart < visibleStart) {
    next = targetStart - marginStart;
  } else if (targetStart + targetSize > visibleEnd) {
    next = targetStart + targetSize - clientSize + marginEnd;
  } else {
    next = currentScroll;
  }
  return Math.max(0, next);
}

export function computeScrollIntoView(input: ScrollIntoViewInput): ScrollIntoViewResult {
  const marginTop = input.margins?.top ?? 0;
  const marginBottom = input.margins?.bottom ?? 0;
  const marginLeft = input.margins?.left ?? 0;
  const marginRight = input.margins?.right ?? 0;
  const scrollTop = adjustAxis(
    input.viewport.scrollTop,
    input.viewport.clientHeight,
    input.target.top,
    input.target.height,
    marginTop,
    marginBottom,
  );
  const scrollLeft = adjustAxis(
    input.viewport.scrollLeft,
    input.viewport.clientWidth,
    input.target.left,
    input.target.width,
    marginLeft,
    marginRight,
  );
  return { scrollTop, scrollLeft };
}
