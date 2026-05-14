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
}

export interface LinkRouterOutput {
  /** Routed links in input order. Links with unresolved endpoints are excluded. */
  readonly routedLinks: readonly RoutedLink[];
  /** IDs of links whose `fromBarId` or `toBarId` didn't match any placedBar. */
  readonly orphanLinkIds: readonly string[];
}
