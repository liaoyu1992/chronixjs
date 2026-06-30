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
 * Lifecycle callback payload for `bar-drag` transactions. Fires only
 * after a drag is CONFIRMED — i.e. after the first `advance()` call
 * that yields a non-zero `deltaX` or `deltaY`. Pure 0-delta clicks
 * never trigger start/stop, matching the original spec's "isDragging gate"
 * semantics where a click-without-move emits neither lifecycle event.
 */
export interface BarDragStartCallback {
  readonly barId: string;
}

/**
 * Lifecycle callback payload for the end of a `bar-drag` transaction.
 * Fires on `commit()` (immediately before `onBarDrop`) AND on `abort()`
 * — symmetric to the original spec's "fire stop regardless of mutation
 * validity" rule, so consumers can reset their drag-state UI without
 * having to distinguish the two paths. Consumers infer commit-vs-abort
 * from whether `onBarDrop` runs afterwards.
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

/**
 * validation rejection payloads. Fired when the commit-time
 * validator gate (`validateDrop` / `validateResize` / `validateSelect`)
 * vetoes a commit. The corresponding success callback (`onBarDrop` /
 * `onBarResize` / `onSelect`) does NOT fire — the bar visually reverts
 * to its previous state and the host receives this rejection payload
 * with the would-be values + the failing predicate's reason.
 */
export interface BarDropRejectedPayload {
  readonly barId: string;
  readonly oldRange: TimeRange;
  readonly attemptedRange: TimeRange;
  readonly oldRowId: string;
  readonly attemptedRowId: string;
  readonly reason: RejectionReason;
}

export interface BarResizeRejectedPayload {
  readonly barId: string;
  readonly edge: 'start' | 'end';
  readonly oldRange: TimeRange;
  readonly attemptedRange: TimeRange;
  readonly reason: RejectionReason;
}

export interface SelectRejectedPayload {
  readonly rowId: string;
  readonly attemptedRange: TimeRange;
  readonly reason: RejectionReason;
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
  /**
   * fine-grained drag gate. When `false`, the bar drag
   * transaction (move event's start time) does NOT start even when
   * `editable` is true. Default `true` (matches `editable` semantics
   * pre-Phase-54). Mirrors the original `eventStartEditable`
   * global option.
   */
  readonly eventStartEditable?: MaybeRefOrGetter<boolean>;
  /**
   * fine-grained resize gate. When `false`, the bar resize
   * transaction (change event's duration via edge drag) does NOT start
   * even when `editable` is true. Default `true`. Mirrors the parity
   * reference's `eventDurationEditable` global option.
   */
  readonly eventDurationEditable?: MaybeRefOrGetter<boolean>;
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
   * (mirrors the protruding-triangle visual from the original spec).
   */
  readonly progressHandleSize?: MaybeRefOrGetter<number>;
  /** Snap drag-time delta to this multiple. Default no snap. */
  readonly snapDurationMs?: MaybeRefOrGetter<number>;
  /**
   * minimum Pythagorean distance (in CSS pixels) from the
   * pointerdown origin before the active transaction is treated as a
   * confirmed drag. Below this threshold, the pointer-up aborts the
   * transaction + the adapter fires the `bar-click` /
   * `empty-area-click` emit instead.
   *
   * Default 5 (matches the original `minDistance` /
   * `eventDragMinDistance`). Set to `0` to disable the gate (every
   * non-zero delta commits — chronix's pre-Phase-25 behavior).
   *
   * Applies uniformly to all 4 transaction kinds (bar-drag,
   * bar-resize, progress-handle, calendar-range-select). Per-
   * transaction-kind thresholds (the original spec's
   * `eventDragMinDistance` vs `selectMinDistance` separation) are
   * parked until consumer demand surfaces.
   *
   * Note: progress-handle gestures still commit regardless of
   * distance — reaching the handle hit zone IS the intent, matching
   * the original spec's same exemption.
   */
  readonly pointerMinDistance?: MaybeRefOrGetter<number>;
  /** Fires after a `BarDragTransaction` commits. */
  readonly onBarDrop?: (payload: BarDropPayload) => void;
  /** Fires after a `BarResizeTransaction` commits. */
  readonly onBarResize?: (payload: BarResizePayload) => void;
  /** Fires after a `CalendarRangeSelectTransaction` commits. */
  readonly onSelect?: (payload: SelectPayload) => void;
  /** Fires after a `ProgressHandleTransaction` commits. */
  readonly onBarProgress?: (payload: BarProgressPayload) => void;
  /**
   * Fires the first time an `advance()` after a `bar-drag` begin
   * yields a non-zero pointer delta. Lazy semantics ensure pure
   * 0-delta clicks never fire start/stop.
   */
  readonly onBarDragStart?: (payload: BarDragStartCallback) => void;
  /**
   * Fires on `commit()` or `abort()` of a `bar-drag` transaction, IF
   * `onBarDragStart` already fired for the same transaction.
   * Sequenced BEFORE `onBarDrop` on the commit path so consumers see
   * a clean "lifecycle is ending" signal before any mutation arrives.
   */
  readonly onBarDragStop?: (payload: BarDragStopCallback) => void;
  /** Symmetric to `onBarDragStart` but for `bar-resize` transactions. */
  readonly onBarResizeStart?: (payload: BarResizeStartCallback) => void;
  /** Symmetric to `onBarDragStop` but for `bar-resize` transactions. */
  readonly onBarResizeStop?: (payload: BarResizeStopCallback) => void;
  /**
   * full bar list, consulted by the commit-time validator
   * gate to evaluate `eventOverlap` against other bars. Optional —
   * when omitted, overlap is skipped (effectively `eventOverlap: true`)
   * and the gate only runs constraint + allow predicates.
   */
  readonly bars?: MaybeRefOrGetter<readonly BarSpec[]>;
  /**
   * `eventAllow(proposal, movingBar)` predicate. Runs on bar-drag +
   * bar-resize commit. Return `false` to veto the commit; the bar
   * reverts and `onBarDropRejected` / `onBarResizeRejected` fires.
   */
  readonly eventAllow?: MaybeRefOrGetter<EventAllowFunc | undefined>;
  /**
   * `selectAllow(proposal)` predicate. Runs on calendar-range-select
   * commit. Return `false` to veto; `onSelectRejected` fires.
   */
  readonly selectAllow?: MaybeRefOrGetter<SelectAllowFunc | undefined>;
  /**
   * `eventOverlap` policy: `true` (default) allows all overlap;
   * `false` rejects any cross-row time-intersecting bar; a function
   * receives `(stillBar, movingBar)` and returns `false` to reject.
   * Same-row overlap is always permitted (bar-stack layout handles it).
   */
  readonly eventOverlap?: MaybeRefOrGetter<boolean | EventOverlapFunc | undefined>;
  /**
   * Constrains drag / resize / select destinations to a time window
   * + optional row whitelist. See `EventConstraint` for the shape.
   */
  readonly eventConstraint?: MaybeRefOrGetter<EventConstraint | undefined>;
  /**
   * independent overlap policy for calendar-range-select.
   * Falls back to `eventOverlap` when unset. Function form receives
   * `(stillBar, null)` — range-select has no moving bar.
   */
  readonly selectOverlap?: MaybeRefOrGetter<boolean | EventOverlapFunc | undefined>;
  /**
   * independent constraint window for calendar-range-select.
   * Falls back to `eventConstraint` when unset.
   */
  readonly selectConstraint?: MaybeRefOrGetter<EventConstraint | undefined>;
  /** fires when a `BarDragTransaction` commit is rejected. */
  readonly onBarDropRejected?: (payload: BarDropRejectedPayload) => void;
  /** fires when a `BarResizeTransaction` commit is rejected. */
  readonly onBarResizeRejected?: (payload: BarResizeRejectedPayload) => void;
  /** fires when a `CalendarRangeSelectTransaction` commit is rejected. */
  readonly onSelectRejected?: (payload: SelectRejectedPayload) => void;
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
   * also fire `'bar-click'`. addition.
   */
  readonly wasDragCommit: ComputedRef<boolean>;
  /**
   * `true` once the active transaction's pointer has moved
   * at least `pointerMinDistance` pixels (Pythagorean) from the
   * pointerdown origin. STICKY: stays `true` for the rest of the
   * gesture even if the pointer drifts back inside the threshold.
   * Reset to `false` at each `begin()`.
   *
   * Read by the adapter's `onPointerup` to decide abort-vs-commit:
   * when `false` at release time, the transaction aborts as a click
   * (`bar-click` / `empty-area-click` emit instead of the
   * commit-time emit); when `true`, the transaction commits.
   *
   * Always `false` between transactions (when `activeTransaction`
   * is `null`).
   */
  readonly dragDistanceSurpassed: ComputedRef<boolean>;
  /**
   * Synchronously check if a transaction is currently active.
   * Returns `true` if `transaction.value` is non-null.
   *
   * Use this in event handlers that need to check the transaction state
   * immediately after calling `begin()`, where the `activeTransaction`
   * computed ref may not have updated yet due to Vue's reactivity timing.
   */
  hasActiveTransaction(): boolean;
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
  // not fire click. .
  const dragCommittedFlag = ref(false);
  // lazy-fire latch for the start/stop lifecycle callbacks.
  // Reset on each `begin()`; set to true on the first `advance()` that
  // produces a non-zero delta for a drag/resize transaction. Read by
  // `commit()` / `abort()` to decide whether the symmetric stop
  // callback fires — pure 0-delta clicks leave it false so neither
  // start nor stop fires.
  const dragStartFired = ref(false);
  // sticky "ever surpassed" flag for the Pythagorean
  // distance gate. Mirrors the original spec's
  // `FeaturefulElementDragging.isDistanceSurpassed` instance field.
  // Reset on each `begin()`; flipped to `true` on the first
  // `advance()` where the pointer's Pythagorean distance from the
  // pointerdown origin meets or exceeds `pointerMinDistance`. Stays
  // `true` for the rest of the gesture even if the pointer drifts
  // back below the threshold — `dragstart` cannot un-fire.
  const dragDistanceSurpassedFlag = ref(false);
  // pointerdown content-space origin tracked at the
  // composable level so the distance gate applies uniformly across
  // all 4 transaction kinds, including `calendar-range-select` whose
  // transaction shape is time-domain (no deltaX/deltaY pixel fields).
  // Reset on each `begin()` to the current pointerdown coordinates.
  const lastBeginPx = ref<{ x: number; y: number } | null>(null);

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
  // placed-bar geometry. Handle is an upward-pointing triangle at the bar's
  // bottom edge (tip at bar.y + bar.height, base extends below by TRIANGLE_SIZE).
  // Bars missing from `barProgressById` or `overlayIdByBarId` don't get a
  // handle entry — the rect map only contains opt-in bars.
  const progressHandleRectsByBarId = computed<
    ReadonlyMap<string, { x: number; y: number; width: number; height: number }>
  >(() => {
    const rects = new Map<string, { x: number; y: number; width: number; height: number }>();
    const overlayMap = toValue(input.overlayIdByBarId);
    const progressMap = toValue(input.barProgressById);
    if (!overlayMap || !progressMap) return rects;
    const TRIANGLE_SIZE = 6;
    for (const placed of toValue(input.placedBars)) {
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
  });

  function placedBarById(barId: string): PlacedBar | undefined {
    for (const placed of toValue(input.placedBars)) {
      if (placed.barId === barId) return placed;
    }
    return undefined;
  }

  function begin(contentX: number, contentY: number): void {
    // reset the drag-committed flag at the start of every
    // pointer interaction. The adapter checks this at pointerup to
    // decide whether to also fire `'bar-click'`.
    dragCommittedFlag.value = false;
    // reset the start-fired latch so the first non-zero
    // advance of this new transaction can re-fire start.
    dragStartFired.value = false;
    // reset the distance-surpassed sticky flag + capture
    // the pointerdown origin so subsequent advances compute distance
    // against a consistent reference. Origin always captured even if
    // no transaction starts (the early-return below sets `null`
    // transaction but the flag stays false either way).
    dragDistanceSurpassedFlag.value = false;
    lastBeginPx.value = { x: contentX, y: contentY };
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
    // fine-grained drag/resize gates. AND with the master
    // `editable` flag. Default `true` so pre-Phase-54 consumers (who
    // never set these) see no behavior change.
    const eventStartEditable = toValue(input.eventStartEditable ?? true);
    const eventDurationEditable = toValue(input.eventDurationEditable ?? true);
    const selectable = toValue(input.selectable ?? false);
    // Progress-handle hits use `requireInitialHit: false` (the
    // separate-overlay-layer escape valve). Other hit kinds with an
    // overlayId fall through to ALLOW_MISS too — the overlay membership
    // signals the bar wants permissive capture. Default REQUIRE_HIT.
    const config =
      hit.kind !== 'empty-row' && hit.overlayId !== undefined ? ALLOW_MISS : REQUIRE_HIT;

    if (hit.kind === 'bar-body' && editable && eventStartEditable) {
      transaction.value = defaultPointerCaptureSession.beginBarDrag({
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

    // update the sticky Pythagorean-distance gate against
    // the pointerdown origin. Once the flag flips true it stays true
    // for the rest of the gesture, even if the pointer drifts back
    // inside the threshold — matches the original spec's
    // `FeaturefulElementDragging.isDistanceSurpassed` semantics. The
    // origin lives on `lastBeginPx` (captured at `begin()`) so the
    // check applies uniformly to all 4 transaction kinds, including
    // `calendar-range-select` whose transaction shape lacks
    // deltaX/deltaY pixel fields.
    if (!dragDistanceSurpassedFlag.value && lastBeginPx.value !== null) {
      const minDistance = toValue(input.pointerMinDistance ?? 5);
      const dx = contentX - lastBeginPx.value.x;
      const dy = contentY - lastBeginPx.value.y;
      // Squared comparison avoids `Math.sqrt` — same idiom as
      // `FeaturefulElementDragging.ts:108-112`. Threshold 0 collapses
      // to "any non-zero delta surpasses" (chronix pre-Phase-25
      // strict-zero gate).
      if (dx * dx + dy * dy >= minDistance * minDistance) {
        dragDistanceSurpassedFlag.value = true;
      }
    }

    // + lazy-fire start once the transaction's
    // pointer has moved past the distance threshold (sticky
    // flag). Pure clicks or sub-threshold wiggles never flip the
    // flag, so start (and the symmetric stop on commit/abort) stays
    // unfired — matching the original spec where `dragstart` lives behind
    // `handleDistanceSurpassed`.
    if (!dragStartFired.value && dragDistanceSurpassedFlag.value) {
      const updated = transaction.value;
      if (updated?.kind === 'bar-drag') {
        dragStartFired.value = true;
        input.onBarDragStart?.({ barId: updated.barId });
      } else if (updated?.kind === 'bar-resize') {
        dragStartFired.value = true;
        input.onBarResizeStart?.({ barId: updated.barId, edge: updated.edge });
      }
    }
  }

  function commit(): void {
    const txn = transaction.value;
    if (!txn) return;
    const snapDurationMs = toValue(input.snapDurationMs);

    // stop fires BEFORE the commit callback. Reference order
    // is `handleDragEnd` line 450 (eventDragStop) → line 457+ (drop).
    // Gated by `dragStartFired` so a transaction that started but
    // immediately hit commit without advancing (synthetic test path)
    // still won't fire spurious stops.
    if (dragStartFired.value) {
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

    // mark that a commit fired so the adapter's pointerup
    // handler suppresses the subsequent `'bar-click'` emit.
    dragCommittedFlag.value = true;
    transaction.value = null;
    // NOTE: lastHitResult is intentionally retained until the next
    // begin() — the adapter's post-commit click decision still reads
    // it to know which bar would have been clicked.
  }

  /**
   * Build a `ValidationContext` from the composable's reactive
   * validator inputs. Each `MaybeRefOrGetter` is resolved via
   * `toValue` so the host can pass static values, refs, or getters
   * interchangeably. Fields that resolve to `undefined` are omitted
   * to match `ValidationContext`'s optional-field shape under
   * `exactOptionalPropertyTypes`.
   */
  function buildValidationContext() {
    const bars = toValue(input.bars) ?? [];
    const eventAllow = toValue(input.eventAllow);
    const selectAllow = toValue(input.selectAllow);
    const eventOverlap = toValue(input.eventOverlap);
    const eventConstraint = toValue(input.eventConstraint);
    const selectOverlap = toValue(input.selectOverlap);
    const selectConstraint = toValue(input.selectConstraint);
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
    // No bars list, or movingBar absent: skip validation. Same default
    // as omitting the prop entirely — keeps existing demos that don't
    // pass `bars` to the composable working unchanged.
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

    // commit-time validation gate. When any validator vetoes,
    // skip the success callback and fire the rejected callback instead.
    // Bars list is optional; when omitted, overlap check is skipped.
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
    const barRanges = toValue(input.barRanges);
    const originalRange = barRanges.get(txn.barId);
    if (!originalRange) return;
    const out = defaultPointerCaptureSession.commitBarResize({
      txn,
      originalRange,
      pxPerMs: pxPerMs(),
      ...(snapDurationMs !== undefined ? { snapDurationMs } : {}),
    });
    // resize stays on the same row, so the proposal's rowId
    // is the bar's current rowId. Skip validation if `bars` isn't
    // supplied (preserves pre-Phase-19 behavior for tests that don't
    // thread bars through the composable).
    const barRowIds = toValue(input.barRowIds);
    const currentRowId = barRowIds?.get(txn.barId) ?? '';
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
    // + validate range-select commit through the
    // full validator chain (constraint → overlap → allow), with the
    // `select*` siblings falling back to `event*` when unset.
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

  function abort(): void {
    // fire stop on abort too. Reference fires
    // `eventDragStop` / `eventResizeStop` regardless of whether the
    // mutation was valid, so a confirmed drag that gets cancelled
    // (browser pointercancel, or the adapter's mid-drag escape)
    // still resets the consumer's drag-state symmetrically. Gated by
    // `dragStartFired` so an aborted-without-advance transaction
    // doesn't fire a stop with no matching start.
    const txn = transaction.value;
    if (dragStartFired.value && txn) {
      if (txn.kind === 'bar-drag') {
        input.onBarDragStop?.({ barId: txn.barId });
      } else if (txn.kind === 'bar-resize') {
        input.onBarResizeStop?.({ barId: txn.barId, edge: txn.edge });
      }
    }
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
    dragDistanceSurpassed: computed(() => dragDistanceSurpassedFlag.value),
    hasActiveTransaction: () => transaction.value !== null,
  };
}
