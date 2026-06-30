/**
 * sidebar-divider drag-to-resize constants + clamp helper.
 * Relocated to core from `adapters/gantt-vue3/src/chronix-gantt.ts` locals
 * (3rd-consumer threshold pattern: when 3
 * adapters share a primitive, it consolidates here).
 *
 * Shared by chronix-vue3 + chronix-vue2 + chronix-react sidebar
 * divider state machines. Re-exported via the adapter index.ts files
 * so consumer-facing `import { SIDEBAR_DIVIDER_WIDTH } from
 * '@chronixjs/gantt-{vue3,vue2,react}'` paths continue to resolve
 * via the re-export idiom.
 */

/**
 * Fixed pixel width of the `cx-gantt-sidebar-divider` grid track.
 * Sits between the sidebar pane (left) and the chart panes (right)
 * in the wrapper's 3-column grid `${sidebarWidth}px
 * ${SIDEBAR_DIVIDER_WIDTH}px auto` (active only when the `columns`
 * prop is non-empty). Wide enough to be a comfortable grab target
 * for pointer drag without visually competing with chart content.
 */
export const SIDEBAR_DIVIDER_WIDTH = 4;

/**
 * Minimum pixel width allotted to BOTH the sidebar pane AND the
 * chart pane during a divider drag — the adapter clamps the
 * proposed sidebar width to `[MIN_SIDEBAR_AREA_WIDTH, wrapperWidth -
 * MIN_SIDEBAR_AREA_WIDTH]`. Prevents either pane from shrinking to
 * an unusable sliver (or going negative on overshoot).
 */
export const MIN_SIDEBAR_AREA_WIDTH = 40;

/**
 * Pure-functional clamp for a proposed sidebar pixel width against
 * the wrapper's measured pixel width. Returns the proposed value
 * clamped to `[MIN_SIDEBAR_AREA_WIDTH, max(MIN_SIDEBAR_AREA_WIDTH,
 * wrapperWidth - MIN_SIDEBAR_AREA_WIDTH)]`. Adapter pointer-move
 * handlers call this every event to keep `sidebarWidthOverride`
 * inside the legal range.
 *
 * Edge cases:
 *   - `wrapperWidth <= 2 × MIN_SIDEBAR_AREA_WIDTH`: the max bound
 *     collapses to `MIN_SIDEBAR_AREA_WIDTH`; the clamp returns
 *     exactly `MIN_SIDEBAR_AREA_WIDTH` regardless of `proposed`.
 *   - `proposed < MIN_SIDEBAR_AREA_WIDTH`: returns
 *     `MIN_SIDEBAR_AREA_WIDTH`.
 *   - `proposed > max`: returns `max`.
 */
export function clampSidebarWidth(proposed: number, wrapperWidth: number): number {
  const maxWidth = Math.max(MIN_SIDEBAR_AREA_WIDTH, wrapperWidth - MIN_SIDEBAR_AREA_WIDTH);
  return Math.max(MIN_SIDEBAR_AREA_WIDTH, Math.min(maxWidth, proposed));
}
