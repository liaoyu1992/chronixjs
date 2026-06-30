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
import { computed, unref, type ComputedRef, type Ref } from 'vue';

/**
 * Vue 2.7's terminal Composition API surface predates Vue 3.3's `toValue`
 * helper and its `MaybeRefOrGetter<T>` type by ~1 year. The local shim
 * below restores API symmetry with the vue3 adapter's composable so the
 * call sites (`bars: () => props.bars`, etc.) stay identical across
 * frameworks. Implementation: function input → invoke; otherwise unref.
 */
export type MaybeRefOrGetter<T> = T | Ref<T> | (() => T);

function toValue<T>(source: MaybeRefOrGetter<T>): T {
  if (typeof source === 'function') return (source as () => T)();
  return unref(source);
}

/**
 * Reactive inputs to the Vue2 adapter's layout pipeline. Refs and
 * getters are both accepted — the local `toValue` shim normalizes at
 * read time.
 */
export interface UseGanttLayoutInput {
  /** Bars to lay out. */
  readonly bars: MaybeRefOrGetter<readonly BarSpec[]>;
  /** Rows in display order. Tree relationships in `parentId` are ignored by v0. */
  readonly rows: MaybeRefOrGetter<readonly RowSpec[]>;
  /** Axis planner input. View, anchor date, viewport width, locale, weekends-visible. */
  readonly axisInput: MaybeRefOrGetter<AxisRangePlanInput>;
  /** Fixed bar height in pixels. Default 30 to match the original spec. */
  readonly barHeight?: MaybeRefOrGetter<number>;
  /** Top padding between strip top and bar top. Default 8. */
  readonly barVerticalPadding?: MaybeRefOrGetter<number>;
  /**
   * Inter-row gap in pixels modeling the CSS row-divider border. Default 1.
   * Matches the original `<tr>` row-bottom border between
   * visually adjacent rows.
   */
  readonly rowSpacing?: MaybeRefOrGetter<number>;
  /** Default row height for rows whose computed height-hint is `undefined`. Default 38. */
  readonly defaultRowHeight?: MaybeRefOrGetter<number>;
  /**
   * vertical spacing in pixels between stacked bars on the same
   * row (when same-row bars have overlapping time and get distributed
   * across stack levels). Must match the height-pass's spacing for
   * placement and height calculation to agree. Default 10.
   */
  readonly barStackSpacing?: MaybeRefOrGetter<number>;
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
 * Reactive Vue2 wrapper over chronix's four pure-functional layout passes
 * (axis planning → stack-height → swimlane → bar placement). Composables
 * own no DOM and no pointer state — they output the same shapes the
 * core's pass methods would, just lifted into `ComputedRef` for template
 * binding. Interactions wire separately ('s pointer composable).
 *
 * Pipeline call order must stay intact: `axis` → `stackHeightOutput`
 * (`.compute`) → `rowsWithHints` (clones each row with `heightByRowId`
 * injected) → `swimlaneOutput` (`.layout`) → `placementOutput` (`.place`,
 * with `levelByBarId` threaded in alongside `barStackSpacing`). Skipping
 * the rows-with-hints step or omitting `levelByBarId` produces silent
 * geometric drift on rows with stacked overlapping bars.
 */
export function useGanttLayout(input: UseGanttLayoutInput): UseGanttLayoutOutput {
  const axis = computed(() => defaultAxisRangePlanner.plan(toValue(input.axisInput)));

  // split the stack-height pass output into a single ComputedRef
  // so both heightByRowId AND levelByBarId stay reactive through one
  // computation. Pre-Phase-30 only heightByRowId was extracted; levelByBarId
  // was the discarded piece causing the same-row-overlapping-bars-at-same-Y
  // gap.
  const stackHeightOutput = computed(() =>
    defaultBarStackHeightPass.compute({
      bars: toValue(input.bars),
      rows: toValue(input.rows),
      axis: axis.value,
      barHeight: toValue(input.barHeight ?? 30),
      barStackSpacing: toValue(input.barStackSpacing ?? 5),
    }),
  );

  const rowsWithHints = computed(() =>
    toValue(input.rows).map((row): RowSpec => {
      const hint = stackHeightOutput.value.heightByRowId.get(row.id);
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
      barVerticalPadding: toValue(input.barVerticalPadding ?? 4),
      // thread per-bar level from the stack-height pass into
      // the placement pass so same-row overlapping bars get distributed
      // across Y. Pass barStackSpacing alongside so placement's per-level
      // offset matches the height-pass's reserved row height.
      levelByBarId: stackHeightOutput.value.levelByBarId,
      barStackSpacing: toValue(input.barStackSpacing ?? 5),
    }),
  );

  const placedBars = computed(() => placementOutput.value.placedBars);

  const contentSize = computed(() => ({
    width: axis.value.totalWidth,
    height: swimlaneOutput.value.totalHeight,
  }));

  return { axis, strips, placedBars, contentSize };
}
