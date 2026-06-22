import {
  defaultPointerCaptureSession,
  defaultPointerHitTester,
  defaultStripResolver,
  validateDrop,
  validateResize,
  validateSelect,
  type AnyTransaction,
  type BarDragTransaction,
  type BarResizeTransaction,
  type BarSpec,
  type CalendarRangeSelectTransaction,
  type EventAllowFunc,
  type EventConstraint,
  type EventOverlapFunc,
  type PlacedBar,
  type PlannedAxis,
  type PointerCaptureConfig,
  type PointerHitResult,
  type ProgressHandleTransaction,
  type RejectionReason,
  type SelectAllowFunc,
  type SwimlaneStrip,
  type TimeRange,
} from '@chronixjs/gantt';
import { flushSync } from 'react-dom';
import { useReducer, useRef } from 'react';

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
 * Lifecycle callback payload for `bar-drag` transactions (start). Fires
 * only after a drag is CONFIRMED — i.e. after the first `advance()` call
 * that yields a non-zero `deltaX` or `deltaY`. Pure 0-delta clicks never
 * trigger start/stop, matching the original spec's "isDragging gate"
 * semantics.
 */
export interface BarDragStartCallback {
  readonly barId: string;
}

/**
 * Lifecycle callback payload for the end of a `bar-drag` transaction.
 * Fires on `commit()` (immediately before `onBarDrop`) AND on `abort()` —
 * symmetric to the original spec's "fire stop regardless of mutation
 * validity" rule. Consumers infer commit-vs-abort from whether
 * `onBarDrop` runs afterwards.
 */
export interface BarDragStopCallback {
  readonly barId: string;
}

/** Lifecycle callback payload for `bar-resize` transactions (start). */
export interface BarResizeStartCallback {
  readonly barId: string;
  readonly edge: 'start' | 'end';
}

/** Lifecycle callback payload for `bar-resize` transactions (end). */
export interface BarResizeStopCallback {
  readonly barId: string;
  readonly edge: 'start' | 'end';
}

/** Phase 19 rejection payload for a vetoed `BarDragTransaction` commit. */
export interface BarDropRejectedPayload {
  readonly barId: string;
  readonly oldRange: TimeRange;
  readonly attemptedRange: TimeRange;
  readonly oldRowId: string;
  readonly attemptedRowId: string;
  readonly reason: RejectionReason;
}

/** Phase 19 rejection payload for a vetoed `BarResizeTransaction` commit. */
export interface BarResizeRejectedPayload {
  readonly barId: string;
  readonly edge: 'start' | 'end';
  readonly oldRange: TimeRange;
  readonly attemptedRange: TimeRange;
  readonly reason: RejectionReason;
}

/** Phase 19 rejection payload for a vetoed `CalendarRangeSelectTransaction` commit. */
export interface SelectRejectedPayload {
  readonly rowId: string;
  readonly attemptedRange: TimeRange;
  readonly reason: RejectionReason;
}

/**
 * Plain-value inputs to the React adapter's pointer hook. Unlike Vue 2 /
 * Vue 3 (which accept `MaybeRefOrGetter<T>` so the composable unwraps
 * refs lazily), React idiom passes plain values; the hook re-evaluates
 * each render and reads current values via the input prop slice.
 */
export interface UseGanttPointerInput {
  /** Output of `BarPlacementPass.place`. */
  readonly placedBars: readonly PlacedBar[];
  /** Output of `RowSwimlaneLayout.layout`. */
  readonly strips: readonly SwimlaneStrip[];
  /** Output of `AxisRangePlanner.plan`. Drives pxPerMs + content-x → time math. */
  readonly axis: PlannedAxis;
  /**
   * Map from `bar.id` to its source `TimeRange` (i.e. `BarSpec.range`).
   * Used at commit time as `originalRange` input to
   * `commitBarDrag` / `commitBarResize`. Bars absent from the map can't
   * commit a drag / resize.
   */
  readonly barRanges: ReadonlyMap<string, TimeRange>;
  /**
   * Map from `bar.id` to its source `rowId` (i.e. `BarSpec.rowId`).
   * Used at bar-drag commit to populate `BarDropPayload.oldRowId` so
   * consumers can detect row changes (`newRowId !== oldRowId`).
   * Optional — when omitted, `oldRowId` falls back to the empty string.
   */
  readonly barRowIds?: ReadonlyMap<string, string>;
  /** Allow bar drag + edge resize. Default false. */
  readonly editable?: boolean;
  /** Phase 54 — fine-grained drag gate. Default `true`. */
  readonly eventStartEditable?: boolean;
  /** Phase 54 — fine-grained resize gate. Default `true`. */
  readonly eventDurationEditable?: boolean;
  /** Allow calendar range-select on empty rows. Default false. */
  readonly selectable?: boolean;
  /** Forwarded to the hit-tester. Default 8 px. */
  readonly edgeZoneWidth?: number;
  /** Forwarded to the hit-tester. */
  readonly overlayIdByBarId?: ReadonlyMap<string, string>;
  /** Per-bar progress (0..100). */
  readonly barProgressById?: ReadonlyMap<string, number>;
  /** Width / height of the progress-handle rect in pixels. Default 12. */
  readonly progressHandleSize?: number;
  /** Snap drag-time delta to this multiple. Default no snap. */
  readonly snapDurationMs?: number;
  /**
   * Phase 25: minimum Pythagorean distance (in CSS pixels) from the
   * pointerdown origin before the active transaction is treated as a
   * confirmed drag. Below this threshold, the pointer-up aborts the
   * transaction; the adapter fires the `onBarClick` / `onEmptyAreaClick`
   * callback instead. Default 5. Set to `0` to disable the gate.
   */
  readonly pointerMinDistance?: number;
  /** Fires after a `BarDragTransaction` commits. */
  readonly onBarDrop?: (payload: BarDropPayload) => void;
  /** Fires after a `BarResizeTransaction` commits. */
  readonly onBarResize?: (payload: BarResizePayload) => void;
  /** Fires after a `CalendarRangeSelectTransaction` commits. */
  readonly onSelect?: (payload: SelectPayload) => void;
  /** Fires after a `ProgressHandleTransaction` commits. */
  readonly onBarProgress?: (payload: BarProgressPayload) => void;
  /**
   * Fires the first time an `advance()` after a `bar-drag` begin yields
   * a non-zero pointer delta. Lazy semantics ensure pure 0-delta clicks
   * never fire start/stop.
   */
  readonly onBarDragStart?: (payload: BarDragStartCallback) => void;
  /** Fires on `commit()` or `abort()` of a `bar-drag` transaction. */
  readonly onBarDragStop?: (payload: BarDragStopCallback) => void;
  /** Symmetric to `onBarDragStart` but for `bar-resize` transactions. */
  readonly onBarResizeStart?: (payload: BarResizeStartCallback) => void;
  /** Symmetric to `onBarDragStop` but for `bar-resize` transactions. */
  readonly onBarResizeStop?: (payload: BarResizeStopCallback) => void;
  /**
   * Phase 19: full bar list, consulted by the commit-time validator
   * gate to evaluate `eventOverlap` against other bars. Optional —
   * when omitted, the gate runs constraint + allow predicates only.
   */
  readonly bars?: readonly BarSpec[];
  /** `eventAllow(proposal, movingBar)` predicate. */
  readonly eventAllow?: EventAllowFunc;
  /** `selectAllow(proposal)` predicate. */
  readonly selectAllow?: SelectAllowFunc;
  /** `eventOverlap` policy: `true` allows all overlap; `false` rejects; function returns `false` to reject. */
  readonly eventOverlap?: boolean | EventOverlapFunc;
  /** Constrains drag / resize / select destinations to a time window + optional row whitelist. */
  readonly eventConstraint?: EventConstraint;
  /**
   * Phase 55: independent overlap policy for calendar-range-select.
   * Falls back to `eventOverlap` when unset. Function form receives
   * `(stillBar, null)` — range-select has no moving bar.
   */
  readonly selectOverlap?: boolean | EventOverlapFunc;
  /** Phase 55: independent constraint window for range-select. Falls back to `eventConstraint`. */
  readonly selectConstraint?: EventConstraint;
  /** Fires when a `BarDragTransaction` commit is rejected. */
  readonly onBarDropRejected?: (payload: BarDropRejectedPayload) => void;
  /** Fires when a `BarResizeTransaction` commit is rejected. */
  readonly onBarResizeRejected?: (payload: BarResizeRejectedPayload) => void;
  /** Fires when a `CalendarRangeSelectTransaction` commit is rejected. */
  readonly onSelectRejected?: (payload: SelectRejectedPayload) => void;
}

/**
 * Hook output. Getter properties on each reactive field so consumer
 * code that reads state immediately after `begin()` / `commit()` /
 * `abort()` sees the just-set value (matching vue2/vue3's
 * `ComputedRef.value` semantics). Reading e.g.
 * `pointer.activeTransaction` invokes the getter, which returns the
 * live `useRef` state. Re-renders are triggered by an internal
 * `useReducer` counter so JSX reading these properties stays in sync
 * across render cycles.
 */
export interface UseGanttPointerOutput {
  /**
   * Begin a transaction at the given content-space pointer position.
   * The hit-tester decides which kind based on what the pointer is over,
   * gated by `editable` / `selectable` config. If nothing starts, the
   * internal `activeTransaction` stays `null`.
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
   * commit the hook's state resets.
   */
  commit(): void;
  /**
   * Abort the active transaction without firing a commit callback.
   * Clears the in-flight transaction + lastHit. Used by callers
   * handling `pointercancel` or application-level escape gestures.
   */
  abort(): void;
  /** The current in-flight transaction, or `null` when idle. */
  readonly activeTransaction: AnyTransaction | null;
  /** The result of the last `defaultPointerHitTester.test()` from `begin()`. */
  readonly lastHit: PointerHitResult | null;
  /**
   * The rowId the pointer is currently over during an active bar-drag
   * transaction, or `null` when no bar-drag is in flight OR when the
   * pointer is in an inter-strip gap / outside the content area.
   */
  readonly projectedRowId: string | null;
  /**
   * `true` if the most recent `commit()` finalized a transaction.
   * Reset to `false` at the next `begin()`. Used by the adapter's
   * click-vs-drag discrimination — a pointerup that committed any
   * transaction (drag, resize, progress, range-select) should NOT
   * also fire `onBarClick`. Phase 12 addition.
   */
  readonly wasDragCommit: boolean;
  /**
   * Phase 25: `true` once the active transaction's pointer has moved at
   * least `pointerMinDistance` pixels (Pythagorean) from the pointerdown
   * origin. STICKY: stays `true` for the rest of the gesture even if
   * the pointer drifts back inside the threshold. Reset to `false` at
   * each `begin()`. Read by the adapter's `onPointerUp` to decide
   * abort-vs-commit.
   */
  readonly dragDistanceSurpassed: boolean;
  /**
   * Synchronously check if a transaction is currently active.
   * Returns `true` if `txnRef.current` is non-null.
   *
   * Use this in event handlers that need to check the transaction state
   * immediately after calling `begin()`. This method is provided for
   * cross-framework consistency with Vue adapters.
   */
  hasActiveTransaction(): boolean;
}

const REQUIRE_HIT: PointerCaptureConfig = { requireInitialHit: true };
const ALLOW_MISS: PointerCaptureConfig = { requireInitialHit: false };

/**
 * React 18 wrapper over chronix's framework-agnostic
 * `PointerHitTester` + `PointerCaptureSession`. Pure-logic: holds the
 * in-flight transaction in a ref, exposes `begin / advance / commit /
 * abort` plus reactive output fields read live via getter properties.
 * No DOM, no `setPointerCapture` calls — the consumer owns the JSX
 * pointer event handlers and the `setPointerCapture` lifecycle.
 *
 * Pipeline mirrors vue2/vue3's `useGanttPointer`. React translation:
 * `useRef` for sync-mutated state; `useReducer` counter triggers
 * re-renders so getter-based outputs propagate to JSX. Methods are
 * defined inline (not `useCallback`-wrapped) so they close over the
 * latest `input` each render — pointer events read the current input
 * slice (callbacks, editable / selectable flags, validator predicates).
 */
export function useGanttPointer(input: UseGanttPointerInput): UseGanttPointerOutput {
  const txnRef = useRef<AnyTransaction | null>(null);
  const lastHitRef = useRef<PointerHitResult | null>(null);
  // Set by `commit()`; reset by `begin()`. Read in the adapter's
  // pointerup handler to decide whether to also fire `onBarClick`.
  // Phase 12.
  const dragCommittedRef = useRef(false);
  // Phase 16: lazy-fire latch for the start/stop lifecycle callbacks.
  // Reset on each `begin()`; set to true on the first `advance()` that
  // produces a non-zero delta for a drag/resize transaction.
  const dragStartFiredRef = useRef(false);
  // Phase 25: sticky "ever surpassed" flag for the Pythagorean distance
  // gate. Mirrors the original spec's
  // `FeaturefulElementDragging.isDistanceSurpassed` instance field.
  // Stays `true` for the rest of the gesture even if the pointer drifts
  // back below the threshold — `dragstart` cannot un-fire.
  const dragDistanceSurpassedRef = useRef(false);
  // Phase 25: pointerdown content-space origin tracked at the hook
  // level so the distance gate applies uniformly across all 4
  // transaction kinds.
  const lastBeginPxRef = useRef<{ x: number; y: number } | null>(null);

  // Force-render counter — incremented inside begin / advance / commit /
  // abort whenever any exposed state changes so consumers reading the
  // getter-based output via JSX get a fresh render. Each method calls
  // `forceRender()` once at its end to coalesce multiple ref writes
  // into a single render.
  const [, forceRender] = useReducer((x: number) => x + 1, 0);

  function pxPerMs(): number {
    return input.axis.slotWidth / input.axis.slotDurationMs;
  }

  function axisStartMs(): number {
    return input.axis.ticks[0]?.time.getTime() ?? 0;
  }

  function contentXToTime(contentX: number): Date {
    return new Date(axisStartMs() + contentX / pxPerMs());
  }

  // Build the per-bar progress-handle rect map from bar progress + the
  // placed-bar geometry. Handle is an upward-pointing triangle at the bar's
  // bottom edge (tip at bar.y + bar.height, base extends below by TRIANGLE_SIZE).
  // Bars missing from `barProgressById` or `overlayIdByBarId` don't get a
  // handle entry — the rect map only contains opt-in bars.
  function buildProgressHandleRects(): ReadonlyMap<
    string,
    { x: number; y: number; width: number; height: number }
  > {
    const rects = new Map<string, { x: number; y: number; width: number; height: number }>();
    const overlayMap = input.overlayIdByBarId;
    const progressMap = input.barProgressById;
    if (!overlayMap || !progressMap) return rects;
    const TRIANGLE_SIZE = 6;
    for (const placed of input.placedBars) {
      if (!overlayMap.has(placed.barId)) continue;
      const progress = progressMap.get(placed.barId);
      if (progress === undefined) continue;
      const clamped = Math.max(0, Math.min(100, progress));
      const handleX = placed.x + (clamped / 100) * placed.width;
      const handleY = placed.y + placed.height; // Triangle tip at bar bottom
      // Hit rect covers the triangle shape with some padding for easier clicking
      rects.set(placed.barId, {
        x: handleX - TRIANGLE_SIZE,
        y: handleY,
        width: TRIANGLE_SIZE * 2,
        height: TRIANGLE_SIZE,
      });
    }
    return rects;
  }

  function placedBarById(barId: string): PlacedBar | undefined {
    for (const placed of input.placedBars) {
      if (placed.barId === barId) return placed;
    }
    return undefined;
  }

  function begin(contentX: number, contentY: number): void {
    // Phase 12: reset the drag-committed flag at the start of every
    // pointer interaction.
    dragCommittedRef.current = false;
    // Phase 16: reset the start-fired latch.
    dragStartFiredRef.current = false;
    // Phase 25: reset the distance-surpassed sticky flag + capture the
    // pointerdown origin.
    dragDistanceSurpassedRef.current = false;
    lastBeginPxRef.current = { x: contentX, y: contentY };

    const overlayMap = input.overlayIdByBarId;
    const handleRects = buildProgressHandleRects();
    const hit = defaultPointerHitTester.test({
      contentX,
      contentY,
      placedBars: input.placedBars,
      strips: input.strips,
      ...(overlayMap !== undefined ? { overlayIdByBarId: overlayMap } : {}),
      ...(handleRects.size > 0 ? { progressHandleByBarId: handleRects } : {}),
      edgeZoneWidth: input.edgeZoneWidth ?? 8,
    });
    lastHitRef.current = hit;
    if (!hit) {
      forceRender();
      return;
    }

    const editable = input.editable ?? false;
    // Phase 54 — default `true` so pre-Phase-54 consumers see no change.
    const eventStartEditable = input.eventStartEditable ?? true;
    const eventDurationEditable = input.eventDurationEditable ?? true;
    const selectable = input.selectable ?? false;
    // Progress-handle hits use `requireInitialHit: false`. Other hit
    // kinds with an overlayId fall through to ALLOW_MISS too.
    const config =
      hit.kind !== 'empty-row' && hit.overlayId !== undefined ? ALLOW_MISS : REQUIRE_HIT;

    if (hit.kind === 'bar-body' && editable && eventStartEditable) {
      txnRef.current = defaultPointerCaptureSession.beginBarDrag({
        barId: hit.barId,
        originPx: { x: contentX, y: contentY },
        config,
        initialHit: true,
      });
    } else if (
      (hit.kind === 'bar-edge-start' || hit.kind === 'bar-edge-end') &&
      editable &&
      eventDurationEditable
    ) {
      txnRef.current = defaultPointerCaptureSession.beginBarResize({
        barId: hit.barId,
        edge: hit.kind === 'bar-edge-start' ? 'start' : 'end',
        originPx: { x: contentX, y: contentY },
        config,
        initialHit: true,
      });
    } else if (hit.kind === 'progress-handle' && editable) {
      const progressMap = input.barProgressById;
      const placed = placedBarById(hit.barId);
      const initialProgress = progressMap?.get(hit.barId);
      if (placed === undefined || initialProgress === undefined) {
        forceRender();
        return;
      }
      txnRef.current = defaultPointerCaptureSession.beginProgressHandle({
        barId: hit.barId,
        originPx: { x: contentX, y: contentY },
        config: ALLOW_MISS,
        initialHit: true,
        initialProgress,
        barWidth: placed.width,
      });
    } else if (hit.kind === 'empty-row' && selectable) {
      txnRef.current = defaultPointerCaptureSession.beginCalendarRangeSelect({
        rowId: hit.rowId,
        anchorTime: contentXToTime(contentX),
        config,
        initialHit: true,
      });
    }
    forceRender();
  }

  function advance(contentX: number, contentY: number): void {
    const txn = txnRef.current;
    if (!txn) return;
    if (txn.kind === 'bar-drag') {
      txnRef.current = defaultPointerCaptureSession.advanceBarDrag(txn, {
        currentPx: { x: contentX, y: contentY },
      });
    } else if (txn.kind === 'bar-resize') {
      txnRef.current = defaultPointerCaptureSession.advanceBarResize(txn, {
        currentPx: { x: contentX, y: contentY },
      });
    } else if (txn.kind === 'progress-handle') {
      txnRef.current = defaultPointerCaptureSession.advanceProgressHandle(txn, {
        currentPx: { x: contentX, y: contentY },
      });
    } else if (txn.kind === 'calendar-range-select') {
      txnRef.current = defaultPointerCaptureSession.advanceCalendarRangeSelect(txn, {
        currentTime: contentXToTime(contentX),
      });
    }

    // Phase 25: update the sticky Pythagorean-distance gate. Once
    // `true`, stays `true` even if the pointer drifts back below.
    if (!dragDistanceSurpassedRef.current && lastBeginPxRef.current !== null) {
      const minDistance = input.pointerMinDistance ?? 5;
      const dx = contentX - lastBeginPxRef.current.x;
      const dy = contentY - lastBeginPxRef.current.y;
      if (dx * dx + dy * dy >= minDistance * minDistance) {
        dragDistanceSurpassedRef.current = true;
      }
    }

    // Phase 16 + Phase 25: lazy-fire start once the transaction's
    // pointer has moved past the distance threshold (Phase 25 sticky
    // flag).
    if (!dragStartFiredRef.current && dragDistanceSurpassedRef.current) {
      const updated = txnRef.current;
      if (updated?.kind === 'bar-drag') {
        dragStartFiredRef.current = true;
        input.onBarDragStart?.({ barId: updated.barId });
      } else if (updated?.kind === 'bar-resize') {
        dragStartFiredRef.current = true;
        input.onBarResizeStart?.({ barId: updated.barId, edge: updated.edge });
      }
    }

    // CRITICAL: Use flushSync to force synchronous rendering during
    // drag/resize operations. This matches Vue's synchronous ref updates
    // and prevents the bar from lagging behind the pointer.
    // Without flushSync, React's async batching causes the bar position
    // to update with a delay, creating a disconnect between pointer and bar.
    flushSync(() => {
      forceRender();
    });
  }

  /**
   * Build a `ValidationContext` from the validator inputs. Fields that
   * are `undefined` are omitted to match `ValidationContext`'s optional
   * shape under `exactOptionalPropertyTypes`.
   */
  function buildValidationContext() {
    const bars = input.bars ?? [];
    const eventAllow = input.eventAllow;
    const selectAllow = input.selectAllow;
    const eventOverlap = input.eventOverlap;
    const eventConstraint = input.eventConstraint;
    const selectOverlap = input.selectOverlap;
    const selectConstraint = input.selectConstraint;
    return {
      bars,
      ...(eventAllow !== undefined ? { eventAllow } : {}),
      ...(selectAllow !== undefined ? { selectAllow } : {}),
      ...(eventOverlap !== undefined ? { eventOverlap } : {}),
      ...(eventConstraint !== undefined ? { eventConstraint } : {}),
      ...(selectOverlap !== undefined ? { selectOverlap } : {}),
      ...(selectConstraint !== undefined ? { selectConstraint } : {}),
    };
  }

  function runDropValidation(
    barId: string,
    proposedRange: TimeRange,
    proposedRowId: string,
  ): RejectionReason | null {
    const ctx = buildValidationContext();
    const movingBar = ctx.bars.find((b) => b.id === barId);
    if (!movingBar) return null;
    return validateDrop({ range: proposedRange, rowId: proposedRowId }, movingBar, ctx);
  }

  function runResizeValidation(
    barId: string,
    proposedRange: TimeRange,
    currentRowId: string,
  ): RejectionReason | null {
    const ctx = buildValidationContext();
    const movingBar = ctx.bars.find((b) => b.id === barId);
    if (!movingBar) return null;
    return validateResize({ range: proposedRange, rowId: currentRowId }, movingBar, ctx);
  }

  function runSelectValidation(proposedRange: TimeRange, rowId: string): RejectionReason | null {
    const ctx = buildValidationContext();
    return validateSelect({ range: proposedRange, rowId }, ctx);
  }

  function commitDrag(txn: BarDragTransaction, snapDurationMs: number | undefined): void {
    const originalRange = input.barRanges.get(txn.barId);
    if (!originalRange) return;
    const out = defaultPointerCaptureSession.commitBarDrag({
      txn,
      originalRange,
      pxPerMs: pxPerMs(),
      ...(snapDurationMs !== undefined ? { snapDurationMs } : {}),
    });
    const oldRowId = input.barRowIds?.get(txn.barId) ?? '';
    const dropY = txn.originPx.y + txn.deltaY;
    const resolvedRowId = defaultStripResolver.atY(dropY, input.strips);
    const newRowId = resolvedRowId ?? oldRowId;

    // Phase 19: commit-time validation gate.
    const reason = runDropValidation(txn.barId, out.resolvedRange, newRowId);
    if (reason !== null) {
      input.onBarDropRejected?.({
        barId: txn.barId,
        oldRange: originalRange,
        attemptedRange: out.resolvedRange,
        oldRowId,
        attemptedRowId: newRowId,
        reason,
      });
      return;
    }

    input.onBarDrop?.({
      barId: txn.barId,
      oldRange: originalRange,
      newRange: out.resolvedRange,
      oldRowId,
      newRowId,
    });
  }

  function commitResize(txn: BarResizeTransaction, snapDurationMs: number | undefined): void {
    const originalRange = input.barRanges.get(txn.barId);
    if (!originalRange) return;
    const out = defaultPointerCaptureSession.commitBarResize({
      txn,
      originalRange,
      pxPerMs: pxPerMs(),
      ...(snapDurationMs !== undefined ? { snapDurationMs } : {}),
    });
    const currentRowId = input.barRowIds?.get(txn.barId) ?? '';
    const reason = runResizeValidation(txn.barId, out.resolvedRange, currentRowId);
    if (reason !== null) {
      input.onBarResizeRejected?.({
        barId: txn.barId,
        edge: txn.edge,
        oldRange: originalRange,
        attemptedRange: out.resolvedRange,
        reason,
      });
      return;
    }
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
    const reason = runSelectValidation(out.resolvedRange, txn.rowId);
    if (reason !== null) {
      input.onSelectRejected?.({
        rowId: txn.rowId,
        attemptedRange: out.resolvedRange,
        reason,
      });
      return;
    }
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

  function commit(): void {
    const txn = txnRef.current;
    if (!txn) return;
    const snapDurationMs = input.snapDurationMs;

    // Phase 16: stop fires BEFORE the commit callback. Gated by
    // `dragStartFired` so a transaction that started but immediately
    // hit commit without advancing still won't fire spurious stops.
    if (dragStartFiredRef.current) {
      if (txn.kind === 'bar-drag') {
        input.onBarDragStop?.({ barId: txn.barId });
      } else if (txn.kind === 'bar-resize') {
        input.onBarResizeStop?.({ barId: txn.barId, edge: txn.edge });
      }
    }

    if (txn.kind === 'bar-drag') commitDrag(txn, snapDurationMs);
    else if (txn.kind === 'bar-resize') commitResize(txn, snapDurationMs);
    else if (txn.kind === 'progress-handle') commitProgress(txn);
    else if (txn.kind === 'calendar-range-select') commitSelect(txn, snapDurationMs);

    // Phase 12: mark that a commit fired so the adapter's pointerup
    // handler suppresses the subsequent `onBarClick` callback.
    dragCommittedRef.current = true;
    txnRef.current = null;
    // NOTE: lastHitRef is intentionally retained until the next
    // begin() — the adapter's post-commit click decision still reads
    // it to know which bar would have been clicked.
    forceRender();
  }

  function abort(): void {
    // Phase 16: fire stop on abort too. Reference fires
    // `eventDragStop` / `eventResizeStop` regardless of whether the
    // mutation was valid.
    const txn = txnRef.current;
    if (dragStartFiredRef.current && txn) {
      if (txn.kind === 'bar-drag') {
        input.onBarDragStop?.({ barId: txn.barId });
      } else if (txn.kind === 'bar-resize') {
        input.onBarResizeStop?.({ barId: txn.barId, edge: txn.edge });
      }
    }
    txnRef.current = null;
    lastHitRef.current = null;
    forceRender();
  }

  // Live projection of "which row is the pointer over right now" during
  // a bar-drag transaction. Re-derived at every getter access — the
  // computation is O(strips.length) and runs only when consumers read it.
  function deriveProjectedRowId(): string | null {
    const txn = txnRef.current;
    if (txn?.kind !== 'bar-drag') return null;
    const dropY = txn.originPx.y + txn.deltaY;
    return defaultStripResolver.atY(dropY, input.strips);
  }

  return {
    begin,
    advance,
    commit,
    abort,
    get activeTransaction() {
      return txnRef.current;
    },
    get lastHit() {
      return lastHitRef.current;
    },
    get projectedRowId() {
      return deriveProjectedRowId();
    },
    get wasDragCommit() {
      return dragCommittedRef.current;
    },
    get dragDistanceSurpassed() {
      return dragDistanceSurpassedRef.current;
    },
    hasActiveTransaction: () => txnRef.current !== null,
  };
}
