import type { BarSpec, LinkSpec, RowSpec } from '../ir/index.js';

/** One tick on the axis. `x` is the logical position from the axis start. */
export interface AxisTick {
  readonly x: number;
  readonly time: Date;
  readonly label: string;
}

/** One cell in a header row above the ticks (e.g. month band over day ticks). */
export interface AxisHeaderCell {
  readonly x: number;
  readonly width: number;
  readonly label: string;
}

/**
 * A stacked header row. Multi-scale views (month / season / halfYear / year)
 * carry two rows: outer for the calendar band (e.g. month name), inner for
 * the per-slot label (e.g. day number).
 */
export interface AxisHeaderRow {
  readonly cells: readonly AxisHeaderCell[];
}

/**
 * The output of `AxisRangePlanner.plan`. Pure data — every layout pass
 * downstream reads from this and writes into render nodes.
 */
export interface PlannedAxis {
  readonly viewId: string;
  /** Width per slot in logical pixels. */
  readonly slotWidth: number;
  /**
   * Nominal time covered by one slot, in milliseconds. Required for
   * downstream passes that map a `Date` to an x position
   * (`pxPerMs = slotWidth / slotDurationMs`). The word "nominal" matters
   * because DST and other irregularities make actual tick-to-tick time
   * deltas vary; `ticks` carries the real time positions for that.
   */
  readonly slotDurationMs: number;
  /** Total axis width in logical pixels (`slotWidth × slotCount`). */
  readonly totalWidth: number;
  readonly slotCount: number;
  /** Tick positions in chronological order. */
  readonly ticks: readonly AxisTick[];
  /** Header rows from outermost (calendar band) to innermost (tick label). */
  readonly headerRows: readonly AxisHeaderRow[];
}

/** Six built-in view ids; mirrors the demo's headerToolbar buttons. */
export type ViewId = 'day' | 'week' | 'month' | 'season' | 'halfYear' | 'year';

export interface AxisRangePlanInput {
  readonly viewId: ViewId;
  /** Date the view should center on (typically "today" or user's gotoDate target). */
  readonly anchorDate: Date;
  /** Width of the timeline body viewport in logical pixels. */
  readonly viewportWidth: number;
  /** BCP-47 locale code, used by `Intl.DateTimeFormat` for tick labels. */
  readonly locale: string;
  /**
   * When false, Saturday + Sunday day-slots are filtered out of
   * `week` / `month` / `season` / `halfYear` / `year` views. Tick
   * X positions remain dense-packed (no visual gaps where weekends
   * would be) and header band widths (week dayCells, month-banded
   * monthCells) shrink to cover only the visible days. Slot width
   * is recomputed against the filtered slot count.
   *
   * `day` view is unaffected: it always renders 24 hourly ticks
   * on the anchor calendar day, weekend or not. This matches the
   * docstring's _"week-and-wider views"_ original scope.
   *
   * Bars whose timestamps fall on hidden weekend days are NOT
   * sliced in v0 — they render at their raw
   * `(t - axisStart) × pxPerMs` offset, which may visually land
   * inside an adjacent weekday's slot. Hidden-day bar slicing
   * (analog of the reference's per-segment lane slicer) is parked
   * for a follow-up phase.
   */
  readonly weekendsVisible: boolean;
}

/**
 * One row's vertical placement in the timeline body. Output of
 * `RowSwimlaneLayout.layout`. Bars on this row are positioned within this
 * strip's Y bounds by `BarPlacementPass`.
 */
export interface SwimlaneStrip {
  readonly rowId: string;
  /** Y-offset of the strip's top edge from the timeline body origin. */
  readonly y: number;
  readonly height: number;
}

export interface RowSwimlaneLayoutInput {
  /** Row specs in display order. Tree relationships in `parentId` are ignored by v0. */
  readonly rows: readonly RowSpec[];
  /** Used when a row has no `heightHint`. */
  readonly defaultRowHeight: number;
  /**
   * Pixels of inter-row spacing added between consecutive strips. Models
   * the CSS row-divider border (the parity reference's `<tr>` row-bottom
   * border occupies 1px between visually adjacent rows). When 0 (default),
   * strips are tile-packed with no gap.
   */
  readonly rowSpacing?: number;
}

export interface RowSwimlaneLayoutOutput {
  /** One strip per input row, in input order. */
  readonly strips: readonly SwimlaneStrip[];
  /** Sum of all strip heights. Used as the timeline body's vertical extent. */
  readonly totalHeight: number;
}

/** A bar with its computed pixel placement. Output of `BarPlacementPass.place`. */
export interface PlacedBar {
  readonly barId: string;
  /** Logical-pixel x of the bar's start edge. May be negative if the bar starts before the axis range. */
  readonly x: number;
  /** Logical-pixel y of the bar's top edge. */
  readonly y: number;
  /** Logical-pixel width — derived from the bar's duration. May extend past `axis.totalWidth`. */
  readonly width: number;
  /** Logical-pixel height — strip height minus vertical padding (top + bottom). */
  readonly height: number;
}

/**
 * Per-row height contribution from stacked bars. Output of
 * `BarStackHeightPass.compute`. Lets the caller pass these as
 * `RowSpec.heightHint` into `RowSwimlaneLayout` so the swimlane
 * accommodates the bars that will land on each row.
 */
export interface BarStackHeightPassOutput {
  /**
   * Computed height per input row, in input order. Always the same length
   * as `BarStackHeightPassInput.rows`.
   */
  readonly heightsPerRow: readonly number[];
  /** Same data as `heightsPerRow`, keyed by `RowSpec.id` for direct lookup. */
  readonly heightByRowId: ReadonlyMap<string, number>;
  /**
   * Phase 30: per-bar stacking level (0 = top track, 1 = second track,
   * etc.). Populated for every bar that intersects the axis range; bars
   * outside the axis range are absent from the map.
   *
   * Downstream `BarPlacementPass.place` reads this to assign Y offset
   * within the row strip — without it, all same-row bars would render
   * at the same Y coordinate even when their time windows overlap.
   *
   * Assignment policy: greedy interval coloring over bars sorted by
   * `(range.start ASC, range.end ASC)` per row. Two bars on the same
   * row with non-overlapping time both land on level 0; overlapping
   * bars get distinct levels in their sorted order.
   */
  readonly levelByBarId: ReadonlyMap<string, number>;
}

export interface BarStackHeightPassInput {
  /**
   * Bars to consider for stacking. Bars whose `range` falls entirely
   * outside the axis time range are filtered out — they don't render
   * and don't push the row taller.
   */
  readonly bars: readonly BarSpec[];
  /** Rows to compute heights for. Output preserves this order. */
  readonly rows: readonly RowSpec[];
  /** Drives the axis-range filter; bars outside `[ticks[0], ticks[0]+slotCount×slotDuration)` are ignored. */
  readonly axis: PlannedAxis;
  /** Fixed bar height in pixels. Default 30. */
  readonly barHeight?: number;
  /** Vertical gap between stacked bars in pixels. Default 10. */
  readonly barStackSpacing?: number;
  /** Top padding above the first stacked bar within the row. Default 8. */
  readonly firstBarTopPadding?: number;
  /** Bottom padding below the last stacked bar within the row. Default 4. */
  readonly lastBarBottomPadding?: number;
  /**
   * Floor height for any row, including rows with zero in-range bars.
   * Default: `barHeight + firstBarTopPadding` so a placeholder row still
   * has room for one bar's worth of clickable target area.
   */
  readonly minRowHeight?: number;
}

export interface BarPlacementPassInput {
  readonly bars: readonly BarSpec[];
  readonly axis: PlannedAxis;
  readonly strips: readonly SwimlaneStrip[];
  /**
   * Pixels of empty space above the bar relative to the strip's top edge.
   * Default 2. When `barHeight` is omitted, this is also the bottom padding
   * (so `bar.height = strip.height - 2 × barVerticalPadding`).
   */
  readonly barVerticalPadding?: number;
  /**
   * Fixed bar height in pixels. When set, `bar.height = barHeight`
   * regardless of strip dimensions; `bar.y = strip.y + barVerticalPadding`.
   * When unset, bar height fills the strip minus symmetric padding —
   * the v0 behavior, kept for callers that don't care about a separate
   * height knob (e.g. uniform-strip demos).
   *
   * The parity reference uses an `eventMinHeight` config (default 30) here
   * and stacks strips taller than that to fit multiple bars per row.
   * Chronix v1 exposes the same knob; the bar-row stacking that derives
   * strip heights from event collisions is a separate concern, owned by
   * the caller until a Phase 2.x pass lands.
   */
  readonly barHeight?: number;
  /**
   * Phase 30: per-bar stacking level from `BarStackHeightPass.compute`'s
   * output. When present, bar Y =
   * `strip.y + barVerticalPadding + level * (barHeight + barStackSpacing)`.
   * Bars absent from the map (or when the map itself is undefined)
   * default to level 0 — single-track placement, matching pre-Phase-30
   * behavior for callers that don't thread the height-pass output through.
   */
  readonly levelByBarId?: ReadonlyMap<string, number>;
  /**
   * Phase 30: vertical spacing in pixels between stacked bars on the same
   * row. Must match `BarStackHeightPassInput.barStackSpacing` so the placed
   * bars fit within the row height the height-pass reserved. Default 10
   * (matches the height-pass default for symmetry).
   *
   * Ignored when `levelByBarId` is undefined OR every bar resolves to
   * level 0 — single-track placement uses only `strip.y + barVerticalPadding`.
   */
  readonly barStackSpacing?: number;
}

export interface BarPlacementPassOutput {
  /** Placed bars in input order. Bars whose `rowId` doesn't match a strip are excluded. */
  readonly placedBars: readonly PlacedBar[];
  /** IDs of bars whose `rowId` didn't match any strip. */
  readonly orphanBarIds: readonly string[];
}

/**
 * Position + orientation of the marker at a link's destination. LinkRouter
 * does NOT carry the marker shape — that stays on `LinkSpec.marker` and
 * the render layer combines the two at draw time. This keeps routing
 * free of marker-rendering concerns.
 */
export interface RoutedLinkMarker {
  readonly x: number;
  readonly y: number;
  /** Rotation in degrees; 0 = pointing right (positive x axis). */
  readonly angleDeg: number;
}

/** One link with its computed SVG path + destination marker placement. */
export interface RoutedLink {
  readonly linkId: string;
  /** SVG path `d` attribute. v0 emits 3-segment square paths. */
  readonly pathD: string;
  readonly marker: RoutedLinkMarker;
  /** From `LinkSpec.colorOverride` if set; otherwise omitted. */
  readonly color?: string;
}

export interface LinkRouterInput {
  readonly links: readonly LinkSpec[];
  readonly placedBars: readonly PlacedBar[];
  /** Pixels of horizontal extension from a bar before turning. Default 12. */
  readonly elbowNubPx?: number;
  /**
   * Smooth routing only: pixel gap from the target's left edge to the
   * Bézier curve's pre-landing point. The final straight `L` segment
   * uses this length so the marker enters the target horizontally.
   * Default 20 — matches the reference's empirical value.
   */
  readonly smoothBeforeTargetGapPx?: number;
}

export interface LinkRouterOutput {
  /** Routed links in input order. Links with unresolved endpoints are excluded. */
  readonly routedLinks: readonly RoutedLink[];
  /** IDs of links whose `fromBarId` or `toBarId` didn't match any placedBar. */
  readonly orphanLinkIds: readonly string[];
}

/**
 * Half-open index range. `firstIndex` is the lowest index in range,
 * `lastIndex` is the highest. Both are −1 when the range is empty.
 * Inclusive bounds on both ends to match the standard "first..last"
 * idiom used elsewhere in chronix layout.
 */
export interface IndexRange {
  readonly firstIndex: number;
  readonly lastIndex: number;
}

export interface VirtualizedPaneViewport {
  /** Visible width of the timeline body in CSS pixels (post-sidebar). */
  readonly width: number;
  /** Visible height of the timeline body in CSS pixels. */
  readonly height: number;
}

export interface VirtualizedPaneScroll {
  /** Horizontal scroll offset of the timeline body, in CSS pixels. */
  readonly x: number;
  /** Vertical scroll offset of the timeline body, in CSS pixels. */
  readonly y: number;
}

export interface VirtualizedPaneOverscan {
  /** Extra strip indexes to include above/below the visible range. Default 0. */
  readonly rows?: number;
  /** Extra slot indexes to include left/right of the visible range. Default 0. */
  readonly slots?: number;
}

export interface VirtualizedPaneLayoutInput {
  readonly axis: PlannedAxis;
  readonly strips: readonly SwimlaneStrip[];
  readonly viewport: VirtualizedPaneViewport;
  readonly scroll: VirtualizedPaneScroll;
  readonly overscan?: VirtualizedPaneOverscan;
}

export interface VirtualizedPaneLayoutOutput {
  /**
   * Strip indexes (into the input `strips` array) whose Y bounds overlap
   * the overscan-adjusted viewport. Empty (`{-1, -1}`) when no strip is
   * visible — e.g. scroll past content end, or empty input.
   */
  readonly visibleStripRange: IndexRange;
  /**
   * Slot indexes (into the axis) whose X bounds overlap the overscan-
   * adjusted viewport. Empty when scrolled past the axis or empty axis.
   */
  readonly visibleSlotRange: IndexRange;
  /**
   * Total content footprint — the scroll container should be sized to
   * at least this. `width` = `axis.totalWidth`; `height` = bottom of the
   * last strip (`strip.y + strip.height` for the last entry, or 0 when
   * empty).
   */
  readonly contentSize: { readonly width: number; readonly height: number };
}
