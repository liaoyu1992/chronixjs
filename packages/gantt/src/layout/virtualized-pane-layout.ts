import type {
  IndexRange,
  VirtualizedPaneLayoutInput,
  VirtualizedPaneLayoutOutput,
} from './types.js';

/**
 * layout pass #5 — derives the subset of the timeline that's
 * actually in-frame, so the renderer can skip strips and slots outside
 * the visible viewport.
 *
 * Inputs are pure data (no DOM access): the planned axis, all
 * swimlane strips, the visible-viewport size, the current scroll
 * offset, and optional overscan to smooth scrolling by pre-rendering
 * a few extra rows/columns just outside the visible bounds.
 *
 * Outputs are inclusive `IndexRange`s into `strips` and `axis.ticks` —
 * empty ranges are `{-1, -1}`. The renderer reads these to decide
 * which `PlacedBar` / `RoutedLink` / tick to draw this frame.
 *
 * v0 uses linear scan for the strip range since strip counts in
 * practical demos are small (≤ ~100). Switch to binary search if a
 * caller hits a hot loop with thousands of strips.
 */
export interface VirtualizedPaneLayout {
  compute(input: VirtualizedPaneLayoutInput): VirtualizedPaneLayoutOutput;
}

const EMPTY_RANGE: IndexRange = { firstIndex: -1, lastIndex: -1 };

export const defaultVirtualizedPaneLayout: VirtualizedPaneLayout = {
  compute(input) {
    const { axis, strips, viewport, scroll } = input;
    const rowOverscan = Math.max(0, input.overscan?.rows ?? 0);
    const slotOverscan = Math.max(0, input.overscan?.slots ?? 0);

    const contentHeight = computeContentHeight(strips);
    const contentSize = { width: axis.totalWidth, height: contentHeight };

    const visibleStripRange = computeVisibleStripRange(
      strips,
      scroll.y,
      viewport.height,
      rowOverscan,
    );
    const visibleSlotRange = computeVisibleSlotRange(
      axis.slotWidth,
      axis.slotCount,
      axis.totalWidth,
      scroll.x,
      viewport.width,
      slotOverscan,
    );

    return { visibleStripRange, visibleSlotRange, contentSize };
  },
};

function computeContentHeight(strips: VirtualizedPaneLayoutInput['strips']): number {
  if (strips.length === 0) return 0;
  const last = strips[strips.length - 1];
  if (!last) return 0;
  return last.y + last.height;
}

function computeVisibleStripRange(
  strips: VirtualizedPaneLayoutInput['strips'],
  scrollY: number,
  viewportHeight: number,
  overscan: number,
): IndexRange {
  if (strips.length === 0 || viewportHeight <= 0) return EMPTY_RANGE;

  // Overlap rule: strip [y, y+h) is visible iff y+h > scrollY AND y < scrollY+vh.
  // Tie-handling: a strip whose bottom edge exactly equals scrollY is OUT —
  // it sits in the row above the viewport. A strip whose top exactly equals
  // scrollY+vh is OUT — it sits in the row below.
  const yTop = scrollY;
  const yBottom = scrollY + viewportHeight;

  let firstIndex = -1;
  let lastIndex = -1;
  for (let i = 0; i < strips.length; i += 1) {
    const s = strips[i];
    if (!s) continue;
    const stripBottom = s.y + s.height;
    if (stripBottom <= yTop) continue; // entirely above
    if (s.y >= yBottom) break; // entirely below — strips are sorted by y
    if (firstIndex === -1) firstIndex = i;
    lastIndex = i;
  }

  if (firstIndex === -1) return EMPTY_RANGE;
  if (overscan > 0) {
    firstIndex = Math.max(0, firstIndex - overscan);
    lastIndex = Math.min(strips.length - 1, lastIndex + overscan);
  }
  return { firstIndex, lastIndex };
}

function computeVisibleSlotRange(
  slotWidth: number,
  slotCount: number,
  totalWidth: number,
  scrollX: number,
  viewportWidth: number,
  overscan: number,
): IndexRange {
  if (slotCount <= 0 || slotWidth <= 0 || viewportWidth <= 0) return EMPTY_RANGE;

  // Clamp the visible X window into the axis bounds.
  const xLeft = Math.max(0, scrollX);
  const xRight = Math.min(totalWidth, scrollX + viewportWidth);
  if (xRight <= xLeft) return EMPTY_RANGE;

  // Slot i occupies [i × slotWidth, (i+1) × slotWidth).
  // First slot whose right edge > xLeft: i = floor(xLeft / slotWidth).
  // Last slot whose left edge < xRight: i = ceil(xRight / slotWidth) - 1.
  let firstIndex = Math.max(0, Math.floor(xLeft / slotWidth));
  let lastIndex = Math.min(slotCount - 1, Math.ceil(xRight / slotWidth) - 1);
  if (lastIndex < firstIndex) return EMPTY_RANGE;

  if (overscan > 0) {
    firstIndex = Math.max(0, firstIndex - overscan);
    lastIndex = Math.min(slotCount - 1, lastIndex + overscan);
  }
  return { firstIndex, lastIndex };
}
