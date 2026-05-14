import {
  defaultPointerCaptureSession,
  defaultPointerHitTester,
  type AnyTransaction,
  type BarDragTransaction,
  type BarResizeTransaction,
  type CalendarRangeSelectTransaction,
  type PlacedBar,
  type PlannedAxis,
  type PointerCaptureConfig,
  type PointerHitResult,
  type SwimlaneStrip,
  type TimeRange,
} from '@chronixjs/gantt';
import { computed, ref, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue';

/**
 * Commit payload emitted when a `BarDragTransaction` completes — sourced
 * by mapping the bar's recorded pointer delta through the axis pxPerMs
 * and applying it to the bar's original time range.
 */
export interface BarDropPayload {
  readonly barId: string;
  readonly oldRange: TimeRange;
  readonly newRange: TimeRange;
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
  /** Allow bar drag + edge resize. Default false. */
  readonly editable?: MaybeRefOrGetter<boolean>;
  /** Allow calendar range-select on empty rows. Default false. */
  readonly selectable?: MaybeRefOrGetter<boolean>;
  /** Forwarded to the hit-tester. Default 8 px. */
  readonly edgeZoneWidth?: MaybeRefOrGetter<number>;
  /** Forwarded to the hit-tester. */
  readonly overlayIdByBarId?: MaybeRefOrGetter<ReadonlyMap<string, string>>;
  /** Snap drag-time delta to this multiple. Default no snap. */
  readonly snapDurationMs?: MaybeRefOrGetter<number>;
  /** Fires after a `BarDragTransaction` commits. */
  readonly onBarDrop?: (payload: BarDropPayload) => void;
  /** Fires after a `BarResizeTransaction` commits. */
  readonly onBarResize?: (payload: BarResizePayload) => void;
  /** Fires after a `CalendarRangeSelectTransaction` commits. */
  readonly onSelect?: (payload: SelectPayload) => void;
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
   * Commit (or abort) the active transaction. On commit, the
   * corresponding `onBar* / onSelect` callback fires with the resolved
   * range. After commit the composable's state resets.
   */
  commit(): void;
  /** The current in-flight transaction, or `null` when idle. */
  readonly activeTransaction: ComputedRef<AnyTransaction | null>;
  /** The result of the last `defaultPointerHitTester.test()` from `begin()`. */
  readonly lastHit: ComputedRef<PointerHitResult | null>;
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

  function begin(contentX: number, contentY: number): void {
    const overlayMap = toValue(input.overlayIdByBarId);
    const hit = defaultPointerHitTester.test({
      contentX,
      contentY,
      placedBars: toValue(input.placedBars),
      strips: toValue(input.strips),
      ...(overlayMap !== undefined ? { overlayIdByBarId: overlayMap } : {}),
      edgeZoneWidth: toValue(input.edgeZoneWidth ?? 8),
    });
    lastHitResult.value = hit;
    if (!hit) return;

    const editable = toValue(input.editable ?? false);
    const selectable = toValue(input.selectable ?? false);
    // The overlayId, when present, signals the bar wants a permissive
    // requireInitialHit (progress-handle pattern). For v1 we route all
    // bar-* hits through REQUIRE_HIT since progress-handle isn't wired.
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
    else if (txn.kind === 'calendar-range-select') commitSelect(txn, snapDurationMs);

    transaction.value = null;
    lastHitResult.value = null;
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
    input.onBarDrop?.({ barId: txn.barId, oldRange: originalRange, newRange: out.resolvedRange });
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

  return {
    begin,
    advance,
    commit,
    activeTransaction: computed(() => transaction.value),
    lastHit: computed(() => lastHitResult.value),
  };
}
