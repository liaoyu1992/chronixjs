import {
  defaultAxisRangePlanner,
  defaultBarPlacementPass,
  defaultBarStackHeightPass,
  defaultRowSwimlaneLayout,
  type AxisRangePlanInput,
  type BarSpec,
  type PlacedBar,
  type PlannedAxis,
  type RowSpec,
  type SwimlaneStrip,
} from '@chronixjs/gantt';
import { useMemo } from 'react';

const DEFAULT_BAR_HEIGHT = 30;
// Phase 43: 4 px matches the new core defaults (firstBarTopPadding 4
// + barVerticalPadding 4) so single-bar rows render with symmetric
// 4+4 padding around the bar — matches the original spec's
// effective 4+4 default.
const DEFAULT_BAR_VERTICAL_PADDING = 4;
const DEFAULT_ROW_SPACING = 1;
const DEFAULT_ROW_HEIGHT = 38;
// Phase 43: 5 px matches the original effective
// `eventSpacing` default.
const DEFAULT_BAR_STACK_SPACING = 5;

/**
 * Plain-value inputs to the React adapter's layout pipeline. Unlike
 * Vue 2 / Vue 3 (which accept `MaybeRefOrGetter<T>` so the composable
 * unwraps refs lazily), React idiom is "the hook gets called with new
 * args each render" — `useMemo` deps tie recomputation to value
 * identity. Callers pass plain values; no ref / getter wrapping needed.
 */
export interface UseGanttLayoutInput {
  /** Bars to lay out. */
  readonly bars: readonly BarSpec[];
  /** Rows in display order. Tree relationships in `parentId` are ignored by v0. */
  readonly rows: readonly RowSpec[];
  /** Axis planner input. View, anchor date, viewport width, locale, weekends-visible. */
  readonly axisInput: AxisRangePlanInput;
  /** Fixed bar height in pixels. Default 30 to match the original spec. */
  readonly barHeight?: number;
  /** Top padding between strip top and bar top. Default 4 (matches core default for symmetric 4+4 padding with `firstBarTopPadding`). */
  readonly barVerticalPadding?: number;
  /**
   * Inter-row gap in pixels modeling the CSS row-divider border. Default 1.
   * Matches the original `<tr>` row-bottom border between
   * visually adjacent rows.
   */
  readonly rowSpacing?: number;
  /** Default row height for rows whose computed height-hint is `undefined`. Default 38. */
  readonly defaultRowHeight?: number;
  /**
   * Phase 30: vertical spacing in pixels between stacked bars on the same
   * row (when same-row bars have overlapping time and get distributed
   * across stack levels). Must match the height-pass's spacing for
   * placement and height calculation to agree. Default 5 (matches the
   * original effective `eventSpacing`).
   */
  readonly barStackSpacing?: number;
}

/**
 * Hook layout outputs. Plain values; React re-evaluates the hook each
 * render, and the internal `useMemo`s skip recomputation when their
 * inputs haven't changed identity. Callers bind directly to JSX
 * attributes; no `.value` unwrap.
 */
export interface UseGanttLayoutOutput {
  readonly axis: PlannedAxis;
  readonly strips: readonly SwimlaneStrip[];
  readonly placedBars: readonly PlacedBar[];
  /** Total content size for the scroll container's intrinsic dimensions. */
  readonly contentSize: { readonly width: number; readonly height: number };
}

/**
 * React wrapper over chronix's four pure-functional layout passes
 * (axis planning → stack-height → swimlane → bar placement). The hook
 * owns no DOM and no pointer state — it outputs the same shapes the
 * core's pass methods would, ready for direct JSX consumption.
 * Interactions wire separately (Phase 32.2's pointer hook).
 *
 * Pipeline call order must stay intact: `axis` → `stackHeightOutput`
 * (`.compute`) → `rowsWithHints` (clones each row with `heightByRowId`
 * injected) → `swimlaneOutput` (`.layout`) → `placementOutput` (`.place`,
 * with `levelByBarId` threaded in alongside `barStackSpacing`). Skipping
 * the rows-with-hints step or omitting `levelByBarId` produces silent
 * geometric drift on rows with stacked overlapping bars.
 */
export function useGanttLayout(input: UseGanttLayoutInput): UseGanttLayoutOutput {
  const {
    bars,
    rows,
    axisInput,
    barHeight = DEFAULT_BAR_HEIGHT,
    barVerticalPadding = DEFAULT_BAR_VERTICAL_PADDING,
    rowSpacing = DEFAULT_ROW_SPACING,
    defaultRowHeight = DEFAULT_ROW_HEIGHT,
    barStackSpacing = DEFAULT_BAR_STACK_SPACING,
  } = input;

  const axis = useMemo(() => defaultAxisRangePlanner.plan(axisInput), [axisInput]);

  // Phase 30: split the stack-height pass output into a single useMemo
  // so both heightByRowId AND levelByBarId stay reactive through one
  // computation. Pre-Phase-30 only heightByRowId was extracted; levelByBarId
  // was the discarded piece causing the same-row-overlapping-bars-at-same-Y
  // gap.
  const stackHeightOutput = useMemo(
    () =>
      defaultBarStackHeightPass.compute({
        bars,
        rows,
        axis,
        barHeight,
        barStackSpacing,
      }),
    [bars, rows, axis, barHeight, barStackSpacing],
  );

  const rowsWithHints = useMemo(
    () =>
      rows.map((row): RowSpec => {
        const hint = stackHeightOutput.heightByRowId.get(row.id);
        // RowSpec is readonly; clone with an updated heightHint when the
        // stack-height pass computed one. Falls back to the row's own hint
        // (or undefined → defaultRowHeight) when no in-range bar stacks on
        // this row.
        return hint != null ? { ...row, heightHint: hint } : row;
      }),
    [rows, stackHeightOutput],
  );

  const swimlaneOutput = useMemo(
    () =>
      defaultRowSwimlaneLayout.layout({
        rows: rowsWithHints,
        defaultRowHeight,
        rowSpacing,
      }),
    [rowsWithHints, defaultRowHeight, rowSpacing],
  );

  const strips = useMemo(() => swimlaneOutput.strips, [swimlaneOutput]);

  const placementOutput = useMemo(
    () =>
      defaultBarPlacementPass.place({
        bars,
        axis,
        strips,
        barHeight,
        barVerticalPadding,
        // Phase 30: thread per-bar level from the stack-height pass into
        // the placement pass so same-row overlapping bars get distributed
        // across Y. Pass barStackSpacing alongside so placement's per-level
        // offset matches the height-pass's reserved row height.
        levelByBarId: stackHeightOutput.levelByBarId,
        barStackSpacing,
      }),
    [bars, axis, strips, barHeight, barVerticalPadding, stackHeightOutput, barStackSpacing],
  );

  const placedBars = useMemo(() => placementOutput.placedBars, [placementOutput]);

  const contentSize = useMemo(
    () => ({
      width: axis.totalWidth,
      height: swimlaneOutput.totalHeight,
    }),
    [axis, swimlaneOutput],
  );

  return { axis, strips, placedBars, contentSize };
}
