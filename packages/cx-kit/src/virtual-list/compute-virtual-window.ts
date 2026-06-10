/**
 * Default overscan: render N extra items above + below the visible
 * window so scroll-driven item mounts don't pop in at the edge.
 * Matches the conventional virtual-list default of 3 (same constant
 * used by chronix-table's `virtualRowsPass`).
 */
export const DEFAULT_VIRTUAL_WINDOW_OVERSCAN = 3;

/**
 * Input to `computeVirtualWindow`.
 *
 * Pure shape — all fields are plain numbers, no callbacks, no
 * framework reactivity. Consumers wire the function output into
 * their own `computed` / `useMemo` to handle re-evaluation on
 * scroll / resize.
 *
 * Phase 96 ships uniform `itemHeightPx` only; variable-height
 * support is queued for Phase 96.1 as a sibling helper
 * (`computeVirtualWindowVariable`) per design Decision B.1.
 */
export interface VirtualWindowInput {
  /** Total number of items in the virtual list. */
  readonly totalItemCount: number;

  /**
   * Pixel height of every item. Uniform across all items in v1.
   * Variable-height support is queued for a future phase.
   */
  readonly itemHeightPx: number;

  /** Scroll offset of the scrollport in pixels from the top of the content layer. */
  readonly scrollTop: number;

  /** Visible scrollport height in pixels (the `clientHeight` of the scroll container). */
  readonly viewportHeight: number;

  /**
   * Optional buffer of N extra items rendered above + below the
   * visible window so scroll-driven item mounts don't pop in at the
   * edge. Defaults to `DEFAULT_VIRTUAL_WINDOW_OVERSCAN` (= 3). Set
   * to 0 to disable overscan.
   */
  readonly overscan?: number;
}

/**
 * Output of `computeVirtualWindow`.
 *
 * Consumers render items in the half-open range `[startIndex,
 * endIndex)`, translate the rendered container by `offsetTopPx`, and
 * size the scrollport's inner content layer to `totalHeightPx` so
 * the native scrollbar reflects the full scroll range.
 *
 * Empty / degenerate input ⇒ `startIndex === endIndex === 0` (the
 * empty half-open range). `totalHeightPx` may be non-zero even for
 * empty windows (e.g. `viewportHeight === 0` pre-mount) so the
 * consumer can already reserve scroll height.
 */
export interface VirtualWindow {
  /** Inclusive start index of the visible window (post-overscan). */
  readonly startIndex: number;

  /** Exclusive end index of the visible window (post-overscan), clamped to `totalItemCount`. */
  readonly endIndex: number;

  /** Pixel offset to apply to the rendered container (translate-Y) so visible items land at the correct scroll position. */
  readonly offsetTopPx: number;

  /** Pixel height of the full content layer (`totalItemCount * itemHeightPx`, clamped non-negative) for the scrollport's inner content. */
  readonly totalHeightPx: number;
}

const EMPTY_WINDOW_DEFAULTS = {
  startIndex: 0,
  endIndex: 0,
  offsetTopPx: 0,
} as const;

/**
 * Resolve the visible item window for a given scroll + viewport.
 *
 * Algorithm (uniform-height fast path, O(1)):
 *
 * 1. **Trivial empties** — `totalItemCount <= 0` OR
 *    `itemHeightPx <= 0` returns an empty window with
 *    `totalHeightPx = 0` (no scroll range to reserve).
 * 2. **Pre-mount frame** — `viewportHeight <= 0` returns an empty
 *    window with the correct `totalHeightPx` (= `totalItemCount *
 *    itemHeightPx`) so the consumer can already render a fully-
 *    sized scrollport before viewport metrics are available.
 * 3. **Clamp `scrollTop`** — Safari rubber-band bounce can emit
 *    transient negative `scrollTop`; treat as 0.
 * 4. **Compute raw window** — `rawStart = floor(scrollTop /
 *    itemHeightPx)`; `rawEnd = ceil((scrollTop + viewportHeight) /
 *    itemHeightPx)`.
 * 5. **Apply overscan + clamp** — `startIndex = max(0, rawStart -
 *    overscan)`; `endIndex = min(totalItemCount, rawEnd + overscan)`.
 *    Out-of-bounds `scrollTop` (consumer scrolled past content)
 *    naturally produces an `endIndex` clamped at `totalItemCount`
 *    and a `startIndex` that may be at or near `totalItemCount` —
 *    consumer can detect via `startIndex >= endIndex` and render
 *    empty.
 * 6. **Offsets** — `offsetTopPx = startIndex * itemHeightPx`;
 *    `totalHeightPx = totalItemCount * itemHeightPx`.
 *
 * Design rationale: returns a fresh object on every call (no
 * internal memoization). The consumer's framework reactivity
 * (`computed` / `useMemo`) already memoizes by input identity;
 * adding a cache here would either duplicate that work or risk
 * stale-window bugs if the cache key didn't match the consumer's
 * memoization boundary.
 */
export function computeVirtualWindow(input: VirtualWindowInput): VirtualWindow {
  const { totalItemCount, itemHeightPx, scrollTop, viewportHeight } = input;
  const overscan = Math.max(0, input.overscan ?? DEFAULT_VIRTUAL_WINDOW_OVERSCAN);

  if (totalItemCount <= 0 || itemHeightPx <= 0) {
    return { ...EMPTY_WINDOW_DEFAULTS, totalHeightPx: 0 };
  }

  const totalHeightPx = totalItemCount * itemHeightPx;

  if (viewportHeight <= 0) {
    return { ...EMPTY_WINDOW_DEFAULTS, totalHeightPx };
  }

  const effectiveScrollTop = Math.max(0, scrollTop);
  const rawStart = Math.floor(effectiveScrollTop / itemHeightPx);
  const rawEnd = Math.ceil((effectiveScrollTop + viewportHeight) / itemHeightPx);

  const startIndex = Math.max(0, Math.min(totalItemCount, rawStart - overscan));
  const endIndex = Math.max(startIndex, Math.min(totalItemCount, rawEnd + overscan));
  const offsetTopPx = startIndex * itemHeightPx;

  return { startIndex, endIndex, offsetTopPx, totalHeightPx };
}
