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
