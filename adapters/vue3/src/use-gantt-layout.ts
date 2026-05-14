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
import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue';

/**
 * Reactive inputs to the Vue3 adapter's layout pipeline. Refs and
 * getters are both accepted — `toValue` normalizes at read time.
 */
export interface UseGanttLayoutInput {
  /** Bars to lay out. */
  readonly bars: MaybeRefOrGetter<readonly BarSpec[]>;
  /** Rows in display order. Tree relationships in `parentId` are ignored by v0. */
  readonly rows: MaybeRefOrGetter<readonly RowSpec[]>;
  /** Axis planner input. View, anchor date, viewport width, locale, weekends-visible. */
  readonly axisInput: MaybeRefOrGetter<AxisRangePlanInput>;
  /** Fixed bar height in pixels. Default 30 to match the parity reference. */
  readonly barHeight?: MaybeRefOrGetter<number>;
  /** Top padding between strip top and bar top. Default 8. */
  readonly barVerticalPadding?: MaybeRefOrGetter<number>;
  /**
   * Inter-row gap in pixels modeling the CSS row-divider border. Default 1.
   * Matches the parity reference's `<tr>` row-bottom border between
   * visually adjacent rows.
   */
  readonly rowSpacing?: MaybeRefOrGetter<number>;
  /** Default row height for rows whose computed height-hint is `undefined`. Default 38. */
  readonly defaultRowHeight?: MaybeRefOrGetter<number>;
}

/**
 * Composable layout outputs. All values are reactive `ComputedRef`s —
 * they re-derive when the corresponding input changes, so callers can
 * bind them directly to template positions without manual watches.
 */
export interface UseGanttLayoutOutput {
  readonly axis: ComputedRef<PlannedAxis>;
  readonly strips: ComputedRef<readonly SwimlaneStrip[]>;
  readonly placedBars: ComputedRef<readonly PlacedBar[]>;
  /** Total content size for the scroll container's intrinsic dimensions. */
  readonly contentSize: ComputedRef<{ readonly width: number; readonly height: number }>;
}

/**
 * Reactive Vue3 wrapper over chronix's four pure-functional layout passes
 * (axis planning → stack-height → swimlane → bar placement). Composables
 * own no DOM and no pointer state — they output the same shapes the
 * core's pass methods would, just lifted into `ComputedRef` for template
 * binding. Interactions wire separately via `PointerHitTester` +
 * `PointerCaptureSession`.
 */
export function useGanttLayout(input: UseGanttLayoutInput): UseGanttLayoutOutput {
  const axis = computed(() => defaultAxisRangePlanner.plan(toValue(input.axisInput)));

  const heightByRowId = computed(
    () =>
      defaultBarStackHeightPass.compute({
        bars: toValue(input.bars),
        rows: toValue(input.rows),
        axis: axis.value,
        barHeight: toValue(input.barHeight ?? 30),
      }).heightByRowId,
  );

  const rowsWithHints = computed(() =>
    toValue(input.rows).map((row): RowSpec => {
      const hint = heightByRowId.value.get(row.id);
      // RowSpec is readonly; clone with an updated heightHint when the
      // stack-height pass computed one. Falls back to the row's own hint
      // (or undefined → defaultRowHeight) when no in-range bar stacks on
      // this row.
      return hint != null ? { ...row, heightHint: hint } : row;
    }),
  );

  const swimlaneOutput = computed(() =>
    defaultRowSwimlaneLayout.layout({
      rows: rowsWithHints.value,
      defaultRowHeight: toValue(input.defaultRowHeight ?? 38),
      rowSpacing: toValue(input.rowSpacing ?? 1),
    }),
  );

  const strips = computed(() => swimlaneOutput.value.strips);

  const placementOutput = computed(() =>
    defaultBarPlacementPass.place({
      bars: toValue(input.bars),
      axis: axis.value,
      strips: strips.value,
      barHeight: toValue(input.barHeight ?? 30),
      barVerticalPadding: toValue(input.barVerticalPadding ?? 8),
    }),
  );

  const placedBars = computed(() => placementOutput.value.placedBars);

  const contentSize = computed(() => ({
    width: axis.value.totalWidth,
    height: swimlaneOutput.value.totalHeight,
  }));

  return { axis, strips, placedBars, contentSize };
}
