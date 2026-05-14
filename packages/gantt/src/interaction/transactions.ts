import type { PendingTransaction } from '../data/index.js';

/**
 * Drag the body of a bar along the time axis (and/or across rows).
 * The hit subject is the bar body — NOT the resize edges or progress
 * triangle, which are separate transactions.
 */
export interface BarDragTransaction extends PendingTransaction {
  readonly kind: 'bar-drag';
  readonly barId: string;
  /**
   * Viewport-pixel position at the original `pointerdown`. Pinned at
   * begin time so subsequent `advance` calls compute cumulative deltas
   * without the caller bookkeeping the origin.
   */
  readonly originPx: { readonly x: number; readonly y: number };
  /** Pixel delta accumulated from pointerdown to now (`current.x - origin.x`). */
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
 * rather than `BarSpec.range`. The upstream-reference codebase explicitly
 * excludes progress-triangle hits from event-drag; the two-transaction
 * split here is the chronix-native expression of that exclusion.
 */
export interface ProgressHandleTransaction extends PendingTransaction {
  readonly kind: 'progress-handle';
  readonly barId: string;
  /** Pointer position at `pointerdown`, in viewport pixels. Pinned at begin. */
  readonly originPx: { readonly x: number; readonly y: number };
  /** Bar's `progress.value` at `pointerdown` (0..100). Pinned at begin. */
  readonly initialProgress: number;
  /** Bar's rendered width in pixels at `pointerdown`. Pinned at begin. */
  readonly barWidth: number;
  /**
   * Projected progress value given the current pointer position. Computed
   * as `initialProgress + (currentX - originX) / barWidth * 100`. May fall
   * outside `[0, 100]` mid-drag; clamped to `[0, 100]` at commit.
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
