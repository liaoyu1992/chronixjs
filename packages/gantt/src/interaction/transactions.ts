import type { PendingTransaction } from '../data/index.js';

/**
 * Drag the body of a bar along the time axis (and/or across rows).
 * The hit subject is the bar body — NOT the resize edges or progress
 * triangle, which are separate transactions.
 */
export interface BarDragTransaction extends PendingTransaction {
  readonly kind: 'bar-drag';
  readonly barId: string;
  /** Pixel delta accumulated from pointerdown to now. */
  readonly deltaX: number;
  readonly deltaY: number;
}

/** Drag the start- or end-edge of a bar to change its duration. */
export interface BarResizeTransaction extends PendingTransaction {
  readonly kind: 'bar-resize';
  readonly barId: string;
  readonly edge: 'start' | 'end';
  /** Pixel delta accumulated from pointerdown to now. */
  readonly deltaX: number;
}

/**
 * Drag the progress triangle of a bar. Distinct transaction from
 * `BarDragTransaction` because the hit subject is a separate render-overlay
 * group (`PointerOverlayGroup`) and the effect targets `BarSpec.progress`
 * rather than `BarSpec.range`. The reference codebase explicitly excludes
 * progress-triangle hits from event-drag (see EventDragging.ts:125-126);
 * the two-transaction split here is the chronix-native expression of that
 * exclusion.
 */
export interface ProgressHandleTransaction extends PendingTransaction {
  readonly kind: 'progress-handle';
  readonly barId: string;
  /**
   * Projected progress value in 0..100 given the current pointer position.
   * May fall outside the range mid-drag; clamped at commit.
   */
  readonly projectedProgress: number;
}

/**
 * Drag on an empty calendar area to define a new date range, typically
 * leading to event creation on pointerup.
 */
export interface CalendarRangeSelectTransaction extends PendingTransaction {
  readonly kind: 'calendar-range-select';
  readonly rowId: string;
  /** Time at the original pointerdown position. */
  readonly anchorTime: Date;
  /** Time at the current pointer position. May be before or after `anchorTime`. */
  readonly currentTime: Date;
}

/**
 * Union of all pointer transactions. Use the `kind` discriminator to narrow:
 *
 * ```ts
 * if (t.kind === 'progress-handle') {
 *   // t: ProgressHandleTransaction here
 * }
 * ```
 */
export type AnyTransaction =
  | BarDragTransaction
  | BarResizeTransaction
  | ProgressHandleTransaction
  | CalendarRangeSelectTransaction;
