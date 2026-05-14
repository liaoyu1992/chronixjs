import type { TimeRange } from '../ir/index.js';

import type { BarDragTransaction } from './transactions.js';

/**
 * Configuration for a `PointerCaptureSession`. Captured once at the
 * subject-registration site; the session itself is the runtime
 * implemented below.
 */
export interface PointerCaptureConfig {
  /**
   * Anti-regression hook #4. When `false`, the session is willing to start
   * even if the initial `pointerdown` did NOT land on the registered subject
   * element. Necessary when the subject lives inside a `PointerOverlayGroup`
   * that may not be the topmost layer at the pointerdown location — the
   * canonical case being the progress triangle, which renders in a separate
   * SVG layer above the otherwise pointer-events:none timeline body.
   *
   * The reference-codebase analog (see `audit/R2_MAPPING.md`) is an
   * undocumented escape-hatch boolean; chronix promotes it to a first-class,
   * documented config field with a name that states the semantic intent.
   *
   * Default: `true`. Set to `false` for progress-handle and other overlay
   * subjects whose hit zones may be obscured at pointerdown time.
   */
  readonly requireInitialHit: boolean;
}

/** Pixel coordinate in viewport space. */
export interface PointerPx {
  readonly x: number;
  readonly y: number;
}

export interface BeginBarDragInput {
  readonly barId: string;
  /** Pointer position at `pointerdown`, in viewport pixels. */
  readonly originPx: PointerPx;
  readonly config: PointerCaptureConfig;
  /**
   * Caller-determined: did the `pointerdown` land on the subject element?
   * The session uses this combined with `config.requireInitialHit` to
   * decide whether to start a transaction.
   */
  readonly initialHit: boolean;
  /** `performance.now()` snapshot at pointerdown. Defaults to the call-site `performance.now()`. */
  readonly startedAt?: number;
}

export interface AdvanceBarDragInput {
  /** Current pointer position, in viewport pixels. */
  readonly currentPx: PointerPx;
}

export interface CommitBarDragInput {
  readonly txn: BarDragTransaction;
  /** The bar's range at the start of the drag — `BarSpec.range` captured by the caller at pointerdown. */
  readonly originalRange: TimeRange;
  /** Pixels per millisecond on the time axis. Typically `axis.slotWidth / axis.slotDurationMs`. */
  readonly pxPerMs: number;
  /**
   * Optional: round the resolved time delta to a multiple of this many ms.
   * Mirrors the upstream `snapDuration` option. Omit for free drag.
   */
  readonly snapDurationMs?: number;
}

export interface CommitBarDragOutput {
  /** The bar's range after the drag is applied. */
  readonly resolvedRange: TimeRange;
  /** Time delta in milliseconds (after snap, if any). May be negative for left-drag. */
  readonly timeDeltaMs: number;
}

/**
 * Runtime for pointer-capture transactions. Pure functional — each
 * method returns a new transaction value or a resolved output; the
 * session holds no mutable state, so multiple drags can run in
 * parallel (e.g. one per touch-id) by keeping their own transaction
 * objects separately.
 *
 * v0 implements `BarDragTransaction` only. `BarResize`,
 * `ProgressHandle`, `CalendarRangeSelect` land in follow-ups; their
 * begin/advance/commit triplets will follow the same shape.
 */
export interface PointerCaptureSession {
  /**
   * Try to start a bar-drag. Returns `null` when the config's
   * `requireInitialHit` is true and `initialHit` is false — the caller
   * should NOT call advance/commit on a null transaction.
   */
  beginBarDrag(input: BeginBarDragInput): BarDragTransaction | null;
  /**
   * Recompute deltas from the original origin to the current pointer
   * position. Pure: returns a new transaction object; does not mutate.
   */
  advanceBarDrag(txn: BarDragTransaction, input: AdvanceBarDragInput): BarDragTransaction;
  /**
   * Resolve the drag to a final time-shifted range. Applies optional
   * snap-to-grid via `snapDurationMs`. Caller discards the transaction
   * after commit; cancellation is implicit — just drop the transaction
   * without calling commit.
   */
  commitBarDrag(input: CommitBarDragInput): CommitBarDragOutput;
}

export const defaultPointerCaptureSession: PointerCaptureSession = {
  beginBarDrag(input) {
    if (input.config.requireInitialHit && !input.initialHit) return null;
    return {
      kind: 'bar-drag',
      barId: input.barId,
      originPx: { x: input.originPx.x, y: input.originPx.y },
      deltaX: 0,
      deltaY: 0,
      startedAt: input.startedAt ?? performance.now(),
    };
  },

  advanceBarDrag(txn, input) {
    return {
      ...txn,
      deltaX: input.currentPx.x - txn.originPx.x,
      deltaY: input.currentPx.y - txn.originPx.y,
    };
  },

  commitBarDrag(input) {
    const { txn, originalRange, pxPerMs, snapDurationMs } = input;
    const rawDeltaMs = txn.deltaX / pxPerMs;
    const timeDeltaMs =
      snapDurationMs != null && snapDurationMs > 0
        ? Math.round(rawDeltaMs / snapDurationMs) * snapDurationMs
        : rawDeltaMs;
    return {
      resolvedRange: {
        start: new Date(originalRange.start.getTime() + timeDeltaMs),
        end: new Date(originalRange.end.getTime() + timeDeltaMs),
      },
      timeDeltaMs,
    };
  },
};
