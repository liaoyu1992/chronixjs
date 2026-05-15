import {
  defaultPointerCaptureSession,
  defaultPointerHitTester,
  defaultStripResolver,
  type AnyTransaction,
  type BarDragTransaction,
  type BarResizeTransaction,
  type CalendarRangeSelectTransaction,
  type PlacedBar,
  type PlannedAxis,
  type PointerCaptureConfig,
  type PointerHitResult,
  type ProgressHandleTransaction,
  type SwimlaneStrip,
  type TimeRange,
} from '@chronixjs/gantt';
import { computed, ref, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue';

/**
 * Commit payload emitted when a `BarDragTransaction` completes — sourced
 * by mapping the bar's recorded pointer delta through the axis pxPerMs
 * and applying it to the bar's original time range, plus resolving the
 * pointer's current y to a target strip's `rowId` for the cross-row case.
 *
 * `newRowId === oldRowId` when the pointer lands back on the source row,
 * in an inter-strip gap, or outside the content area entirely — the
 * fallback keeps consumer write-back logic uniform: `bar.rowId = p.newRowId`
 * is always safe.
 */
export interface BarDropPayload {
  readonly barId: string;
  readonly oldRange: TimeRange;
  readonly newRange: TimeRange;
  readonly oldRowId: string;
  readonly newRowId: string;
}

/** Commit payload for a `BarResizeTransaction`. */
export interface BarResizePayload {
  readonly barId: string;
  readonly edge: 'start' | 'end';
  readonly oldRange: TimeRange;
  readonly newRange: TimeRange;
}

/** Commit payload for a `CalendarRangeSelectTransaction`. */
export interface SelectPayload {
  readonly rowId: string;
  readonly range: TimeRange;
}

/** Commit payload for a `ProgressHandleTransaction`. */
export interface BarProgressPayload {
  readonly barId: string;
  /** Bar's `progress.value` at pointerdown (0..100). */
  readonly oldProgress: number;
  /** Bar's clamped final `progress.value` after the drag (0..100). */
  readonly newProgress: number;
}

/**
 * Reactive inputs to the pointer-interaction composable. The composable
 * is DOM-free: the consumer converts native PointerEvent coords into the
 * timeline body's content space (post-scroll, origin at `PlacedBar.x` /
 * `SwimlaneStrip.y = 0`) before calling `begin / advance`.
 */
export interface UseGanttPointerInput {
  /** Output of `BarPlacementPass.place`. */
  readonly placedBars: MaybeRefOrGetter<readonly PlacedBar[]>;
  /** Output of `RowSwimlaneLayout.layout`. */
  readonly strips: MaybeRefOrGetter<readonly SwimlaneStrip[]>;
  /** Output of `AxisRangePlanner.plan`. Drives pxPerMs + content-x → time math. */
  readonly axis: MaybeRefOrGetter<PlannedAxis>;
  /**
   * Map from `bar.id` to its source `TimeRange` (i.e. `BarSpec.range`).
   * Used at commit time as `originalRange` input to
   * `commitBarDrag` / `commitBarResize`. Bars absent from the map can't
   * commit a drag / resize.
   */
  readonly barRanges: MaybeRefOrGetter<ReadonlyMap<string, TimeRange>>;
  /**
   * Map from `bar.id` to its source `rowId` (i.e. `BarSpec.rowId`).
   * Used at bar-drag commit to populate `BarDropPayload.oldRowId` so
   * consumers can detect row changes (`newRowId !== oldRowId`).
   * Optional — when omitted, `oldRowId` falls back to the empty string
   * and `newRowId` falls back to the resolved strip's rowId (or empty
   * when out of strips). Production callers should always supply this
   * map alongside `barRanges`; the optionality exists for narrow tests
   * that don't exercise row changes.
   */
  readonly barRowIds?: MaybeRefOrGetter<ReadonlyMap<string, string>>;
  /** Allow bar drag + edge resize. Default false. */
  readonly editable?: MaybeRefOrGetter<boolean>;
  /** Allow calendar range-select on empty rows. Default false. */
  readonly selectable?: MaybeRefOrGetter<boolean>;
  /** Forwarded to the hit-tester. Default 8 px. */
  readonly edgeZoneWidth?: MaybeRefOrGetter<number>;
  /** Forwarded to the hit-tester. */
  readonly overlayIdByBarId?: MaybeRefOrGetter<ReadonlyMap<string, string>>;
  /**
   * Per-bar progress (0..100). When the matching entry is present AND
   * the bar declared a `pointerOverlayId`, the composable computes the
   * progress-handle rect (centered at `bar.x + progress/100 × bar.width`)
   * and routes hits inside the rect to a `ProgressHandleTransaction`.
   */
  readonly barProgressById?: MaybeRefOrGetter<ReadonlyMap<string, number>>;
  /**
   * Width / height of the progress-handle rect in pixels. Default 12.
   * The rect is centered horizontally on the progress-x and vertically
   * on the bar; it can extend slightly above / below the bar bounds
   * (mirrors the protruding-triangle visual from the reference).
   */
  readonly progressHandleSize?: MaybeRefOrGetter<number>;
  /** Snap drag-time delta to this multiple. Default no snap. */
  readonly snapDurationMs?: MaybeRefOrGetter<number>;
  /** Fires after a `BarDragTransaction` commits. */
  readonly onBarDrop?: (payload: BarDropPayload) => void;
  /** Fires after a `BarResizeTransaction` commits. */
  readonly onBarResize?: (payload: BarResizePayload) => void;
  /** Fires after a `CalendarRangeSelectTransaction` commits. */
  readonly onSelect?: (payload: SelectPayload) => void;
  /** Fires after a `ProgressHandleTransaction` commits. */
  readonly onBarProgress?: (payload: BarProgressPayload) => void;
}

export interface UseGanttPointerOutput {
  /**
   * Begin a transaction at the given content-space pointer position.
   * The hit-tester decides which kind based on what the pointer is over,
   * gated by `editable` / `selectable` config. If nothing starts the
   * composable's internal `activeTransaction` stays `null`.
   */
  begin(contentX: number, contentY: number): void;
  /**
   * Advance the active transaction with a new content-space position.
   * No-op when no transaction is active.
   */
  advance(contentX: number, contentY: number): void;
  /**
   * Commit the active transaction. On commit, the corresponding
   * `onBar* / onSelect` callback fires with the resolved range. After
   * commit the composable's state resets.
   */
  commit(): void;
  /**
   * Abort the active transaction without firing a commit callback.
   * Clears `activeTransaction` and `lastHit`. Used by callers handling
   * `pointercancel` (browser-initiated drag interruption) or
   * application-level escape gestures.
   */
  abort(): void;
  /** The current in-flight transaction, or `null` when idle. */
  readonly activeTransaction: ComputedRef<AnyTransaction | null>;
  /** The result of the last `defaultPointerHitTester.test()` from `begin()`. */
  readonly lastHit: ComputedRef<PointerHitResult | null>;
  /**
   * The rowId the pointer is currently over during an active bar-drag
   * transaction, or `null` when no bar-drag is in flight OR when the
   * pointer is in an inter-strip gap / outside the content area.
   *
   * Consumers can wire this into the render path to snap the dragging
   * bar's Y to the target strip (cross-row preview). The composable
   * itself doesn't render anything — `projectedRowId` is a pure
   * function of `activeTransaction` + `strips`.
   */
  readonly projectedRowId: ComputedRef<string | null>;
  /**
   * `true` if the most recent `commit()` finalized a transaction.
   * Reset to `false` at the next `begin()`. Used by the adapter's
   * click-vs-drag discrimination — a pointerup that committed any
   * transaction (drag, resize, progress, range-select) should NOT
   * also fire `'bar-click'`. Phase 12 addition.
   */
  readonly wasDragCommit: ComputedRef<boolean>;
}

const REQUIRE_HIT: PointerCaptureConfig = { requireInitialHit: true };
const ALLOW_MISS: PointerCaptureConfig = { requireInitialHit: false };

/**
 * Wires `PointerHitTester` + `PointerCaptureSession` into a Vue3
 * composable. Pure-logic: holds the in-flight transaction in a ref,
 * exposes `begin / advance / commit` plus the active transaction as a
 * `ComputedRef` for preview rendering. No DOM, no pointer-capture API
 * calls — the consumer owns the DOM event handlers and the
 * `setPointerCapture` lifecycle.
 *
 * Progress-handle transactions aren't wired here: the hit-test layer
 * doesn't currently model a `'progress-handle'` zone (see
 * audit/journal "Open / parked (hit-test)" for the v2 extension path),
 * so a bar's progress drag isn't reachable through the composable yet.
 */
export function useGanttPointer(input: UseGanttPointerInput): UseGanttPointerOutput {
  const transaction = ref<AnyTransaction | null>(null);
  const lastHitResult = ref<PointerHitResult | null>(null);
  // Set by `commit()`; reset by `begin()`. The adapter reads it during
  // the pointerup handler to decide whether to also emit `'bar-click'`
  // — a click that came AFTER a committed drag/resize/progress should
  // not fire click. Phase 12.
  const dragCommittedFlag = ref(false);

  function pxPerMs(): number {
    const a = toValue(input.axis);
    return a.slotWidth / a.slotDurationMs;
  }

  function axisStartMs(): number {
    const a = toValue(input.axis);
    return a.ticks[0]?.time.getTime() ?? 0;
  }

  function contentXToTime(contentX: number): Date {
    return new Date(axisStartMs() + contentX / pxPerMs());
  }

  // Build the per-bar progress-handle rect map from bar progress + the
  // placed-bar geometry. Rect is centered at the progress-x with a
  // square footprint of `progressHandleSize` (default 12 px). Bars
  // missing from `barProgressById` or `overlayIdByBarId` don't get a
  // handle entry — the rect map only contains opt-in bars.
  const progressHandleRectsByBarId = computed<
    ReadonlyMap<string, { x: number; y: number; width: number; height: number }>
  >(() => {
    const rects = new Map<string, { x: number; y: number; width: number; height: number }>();
    const overlayMap = toValue(input.overlayIdByBarId);
    const progressMap = toValue(input.barProgressById);
    if (!overlayMap || !progressMap) return rects;
    const size = toValue(input.progressHandleSize ?? 12);
    for (const placed of toValue(input.placedBars)) {
      if (!overlayMap.has(placed.barId)) continue;
      const progress = progressMap.get(placed.barId);
      if (progress === undefined) continue;
      const clamped = Math.max(0, Math.min(100, progress));
      const handleX = placed.x + (clamped / 100) * placed.width;
      rects.set(placed.barId, {
        x: handleX - size / 2,
        y: placed.y + placed.height / 2 - size / 2,
        width: size,
        height: size,
      });
    }
    return rects;
  });

  function placedBarById(barId: string): PlacedBar | undefined {
    for (const placed of toValue(input.placedBars)) {
      if (placed.barId === barId) return placed;
    }
    return undefined;
  }

  function begin(contentX: number, contentY: number): void {
    // Phase 12: reset the drag-committed flag at the start of every
    // pointer interaction. The adapter checks this at pointerup to
    // decide whether to also fire `'bar-click'`.
    dragCommittedFlag.value = false;
    const overlayMap = toValue(input.overlayIdByBarId);
    const handleRects = progressHandleRectsByBarId.value;
    const hit = defaultPointerHitTester.test({
      contentX,
      contentY,
      placedBars: toValue(input.placedBars),
      strips: toValue(input.strips),
      ...(overlayMap !== undefined ? { overlayIdByBarId: overlayMap } : {}),
      ...(handleRects.size > 0 ? { progressHandleByBarId: handleRects } : {}),
      edgeZoneWidth: toValue(input.edgeZoneWidth ?? 8),
    });
    lastHitResult.value = hit;
    if (!hit) return;

    const editable = toValue(input.editable ?? false);
    const selectable = toValue(input.selectable ?? false);
    // Progress-handle hits use `requireInitialHit: false` (the
    // separate-overlay-layer escape valve). Other hit kinds with an
    // overlayId fall through to ALLOW_MISS too — the overlay membership
    // signals the bar wants permissive capture. Default REQUIRE_HIT.
    const config =
      hit.kind !== 'empty-row' && hit.overlayId !== undefined ? ALLOW_MISS : REQUIRE_HIT;

    if (hit.kind === 'bar-body' && editable) {
      transaction.value = defaultPointerCaptureSession.beginBarDrag({
        barId: hit.barId,
        originPx: { x: contentX, y: contentY },
        config,
        initialHit: true,
      });
    } else if ((hit.kind === 'bar-edge-start' || hit.kind === 'bar-edge-end') && editable) {
      transaction.value = defaultPointerCaptureSession.beginBarResize({
        barId: hit.barId,
        edge: hit.kind === 'bar-edge-start' ? 'start' : 'end',
        originPx: { x: contentX, y: contentY },
        config,
        initialHit: true,
      });
    } else if (hit.kind === 'progress-handle' && editable) {
      // Progress drag is enabled by `editable` (mirrors bar-drag /
      // bar-resize). The bar must be in `barProgressById` to have
      // reached this branch — re-read it for the `initialProgress`.
      const progressMap = toValue(input.barProgressById);
      const placed = placedBarById(hit.barId);
      const initialProgress = progressMap?.get(hit.barId);
      if (placed === undefined || initialProgress === undefined) return;
      transaction.value = defaultPointerCaptureSession.beginProgressHandle({
        barId: hit.barId,
        originPx: { x: contentX, y: contentY },
        config: ALLOW_MISS,
        initialHit: true,
        initialProgress,
        barWidth: placed.width,
      });
    } else if (hit.kind === 'empty-row' && selectable) {
      transaction.value = defaultPointerCaptureSession.beginCalendarRangeSelect({
        rowId: hit.rowId,
        anchorTime: contentXToTime(contentX),
        config,
        initialHit: true,
      });
    }
  }

  function advance(contentX: number, contentY: number): void {
    const txn = transaction.value;
    if (!txn) return;
    if (txn.kind === 'bar-drag') {
      transaction.value = defaultPointerCaptureSession.advanceBarDrag(txn, {
        currentPx: { x: contentX, y: contentY },
      });
    } else if (txn.kind === 'bar-resize') {
      transaction.value = defaultPointerCaptureSession.advanceBarResize(txn, {
        currentPx: { x: contentX, y: contentY },
      });
    } else if (txn.kind === 'progress-handle') {
      transaction.value = defaultPointerCaptureSession.advanceProgressHandle(txn, {
        currentPx: { x: contentX, y: contentY },
      });
    } else if (txn.kind === 'calendar-range-select') {
      transaction.value = defaultPointerCaptureSession.advanceCalendarRangeSelect(txn, {
        currentTime: contentXToTime(contentX),
      });
    }
  }

  function commit(): void {
    const txn = transaction.value;
    if (!txn) return;
    const snapDurationMs = toValue(input.snapDurationMs);

    if (txn.kind === 'bar-drag') commitDrag(txn, snapDurationMs);
    else if (txn.kind === 'bar-resize') commitResize(txn, snapDurationMs);
    else if (txn.kind === 'progress-handle') commitProgress(txn);
    else if (txn.kind === 'calendar-range-select') commitSelect(txn, snapDurationMs);

    // Phase 12: mark that a commit fired so the adapter's pointerup
    // handler suppresses the subsequent `'bar-click'` emit.
    dragCommittedFlag.value = true;
    transaction.value = null;
    // NOTE: lastHitResult is intentionally retained until the next
    // begin() — the adapter's post-commit click decision still reads
    // it to know which bar would have been clicked.
  }

  function commitDrag(txn: BarDragTransaction, snapDurationMs: number | undefined): void {
    const barRanges = toValue(input.barRanges);
    const originalRange = barRanges.get(txn.barId);
    if (!originalRange) return;
    const out = defaultPointerCaptureSession.commitBarDrag({
      txn,
      originalRange,
      pxPerMs: pxPerMs(),
      ...(snapDurationMs !== undefined ? { snapDurationMs } : {}),
    });
    // Resolve the pointer's current y (origin + delta) to a target row.
    // Falls back to the source row when the pointer lands in a gap or
    // outside content — consumers see `newRowId === oldRowId` and treat
    // it as a no-op row change.
    const barRowIds = toValue(input.barRowIds);
    const oldRowId = barRowIds?.get(txn.barId) ?? '';
    const dropY = txn.originPx.y + txn.deltaY;
    const resolvedRowId = defaultStripResolver.atY(dropY, toValue(input.strips));
    const newRowId = resolvedRowId ?? oldRowId;
    input.onBarDrop?.({
      barId: txn.barId,
      oldRange: originalRange,
      newRange: out.resolvedRange,
      oldRowId,
      newRowId,
    });
  }

  function commitResize(txn: BarResizeTransaction, snapDurationMs: number | undefined): void {
    const barRanges = toValue(input.barRanges);
    const originalRange = barRanges.get(txn.barId);
    if (!originalRange) return;
    const out = defaultPointerCaptureSession.commitBarResize({
      txn,
      originalRange,
      pxPerMs: pxPerMs(),
      ...(snapDurationMs !== undefined ? { snapDurationMs } : {}),
    });
    input.onBarResize?.({
      barId: txn.barId,
      edge: txn.edge,
      oldRange: originalRange,
      newRange: out.resolvedRange,
    });
  }

  function commitSelect(
    txn: CalendarRangeSelectTransaction,
    snapDurationMs: number | undefined,
  ): void {
    const out = defaultPointerCaptureSession.commitCalendarRangeSelect({
      txn,
      ...(snapDurationMs !== undefined ? { snapDurationMs } : {}),
    });
    input.onSelect?.({ rowId: txn.rowId, range: out.resolvedRange });
  }

  function commitProgress(txn: ProgressHandleTransaction): void {
    const out = defaultPointerCaptureSession.commitProgressHandle({ txn });
    input.onBarProgress?.({
      barId: txn.barId,
      oldProgress: txn.initialProgress,
      newProgress: out.resolvedProgress,
    });
  }

  function abort(): void {
    transaction.value = null;
    lastHitResult.value = null;
  }

  // Live projection of "which row is the pointer over right now" during
  // a bar-drag transaction. Recomputed on every transaction-state /
  // strips-list change so the adapter's render path can snap the bar's
  // Y to the target strip mid-drag.
  const projectedRowId = computed<string | null>(() => {
    const txn = transaction.value;
    if (txn?.kind !== 'bar-drag') return null;
    const dropY = txn.originPx.y + txn.deltaY;
    return defaultStripResolver.atY(dropY, toValue(input.strips));
  });

  return {
    begin,
    advance,
    commit,
    abort,
    activeTransaction: computed(() => transaction.value),
    lastHit: computed(() => lastHitResult.value),
    projectedRowId,
    wasDragCommit: computed(() => dragCommittedFlag.value),
  };
}
