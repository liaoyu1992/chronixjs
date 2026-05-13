import type { BarSpec, RowSpec } from '../ir/index.js';

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
  /** When false, Saturday + Sunday slots are omitted from week-and-wider views. */
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

export interface BarPlacementPassInput {
  readonly bars: readonly BarSpec[];
  readonly axis: PlannedAxis;
  readonly strips: readonly SwimlaneStrip[];
  /** Pixels of empty space between a strip's top/bottom and the bar. Default 2. */
  readonly barVerticalPadding?: number;
}

export interface BarPlacementPassOutput {
  /** Placed bars in input order. Bars whose `rowId` doesn't match a strip are excluded. */
  readonly placedBars: readonly PlacedBar[];
  /** IDs of bars whose `rowId` didn't match any strip. */
  readonly orphanBarIds: readonly string[];
}
