import {
  defaultAxisRangePlanner,
  type PlacedBar,
  type PlannedAxis,
  type SwimlaneStrip,
  type TimeRange,
} from '@chronixjs/gantt';
import { describe, expect, it, vi } from 'vitest';

import {
  useGanttPointer,
  type BarDropPayload,
  type BarProgressPayload,
  type BarResizePayload,
  type SelectPayload,
} from './use-gantt-pointer.js';

// Typed mock factories — vi.fn() defaults to (any) => any; explicit
// generic params let the call-argument assertions stay safely typed
// without per-test casts.
const mockBarDrop = (): ReturnType<typeof vi.fn<(p: BarDropPayload) => void>> =>
  vi.fn<(p: BarDropPayload) => void>();
const mockBarResize = (): ReturnType<typeof vi.fn<(p: BarResizePayload) => void>> =>
  vi.fn<(p: BarResizePayload) => void>();
const mockSelect = (): ReturnType<typeof vi.fn<(p: SelectPayload) => void>> =>
  vi.fn<(p: SelectPayload) => void>();
const mockBarProgress = (): ReturnType<typeof vi.fn<(p: BarProgressPayload) => void>> =>
  vi.fn<(p: BarProgressPayload) => void>();

const MS_PER_HOUR = 60 * 60 * 1000;

// Local-midnight anchor — see use-gantt-layout.test.ts for the rationale.
const today = new Date('2026-05-13T00:00:00Z');
today.setHours(0, 0, 0, 0);
const todayMs = today.getTime();

function dayAxis(): PlannedAxis {
  return defaultAxisRangePlanner.plan({
    viewId: 'day',
    anchorDate: new Date(todayMs),
    viewportWidth: 1440,
    locale: 'zh-CN',
    weekendsVisible: true,
  });
}

const strips: readonly SwimlaneStrip[] = [
  { rowId: 'r1', y: 0, height: 40 },
  { rowId: 'r2', y: 40, height: 40 },
];

// Bar at content x=480..720 (hour 8..12) on row r1 with height 30 inside strip 0.
const placedBars: readonly PlacedBar[] = [{ barId: 'b1', x: 480, y: 8, width: 240, height: 30 }];

const barRanges = new Map<string, TimeRange>([
  [
    'b1',
    {
      start: new Date(todayMs + 8 * MS_PER_HOUR),
      end: new Date(todayMs + 12 * MS_PER_HOUR),
    },
  ],
]);

describe('useGanttPointer — bar drag', () => {
  it('begin on bar-body + advance + commit emits onBarDrop with shifted range', () => {
    const onBarDrop = mockBarDrop();
    const ptr = useGanttPointer({
      placedBars: () => placedBars,
      strips: () => strips,
      axis: () => dayAxis(),
      barRanges: () => barRanges,
      editable: true,
      onBarDrop,
    });

    // Click inside the bar body at content (600, 20) — bar spans 480..720.
    ptr.begin(600, 20);
    expect(ptr.activeTransaction.value?.kind).toBe('bar-drag');
    expect(ptr.lastHit.value?.kind).toBe('bar-body');

    // Drag +60 px (= +1 hour at day-view).
    ptr.advance(660, 20);
    expect(ptr.activeTransaction.value?.kind).toBe('bar-drag');

    ptr.commit();
    expect(ptr.activeTransaction.value).toBeNull();
    expect(onBarDrop).toHaveBeenCalledOnce();
    const payload = onBarDrop.mock.calls[0]![0];
    expect(payload.barId).toBe('b1');
    expect(payload.oldRange.start.toISOString()).toBe(barRanges.get('b1')!.start.toISOString());
    // +1 hour shift.
    expect(payload.newRange.start.getTime() - payload.oldRange.start.getTime()).toBe(MS_PER_HOUR);
    expect(payload.newRange.end.getTime() - payload.oldRange.end.getTime()).toBe(MS_PER_HOUR);
  });

  it('skips bar-drag when editable=false (default)', () => {
    const onBarDrop = mockBarDrop();
    const ptr = useGanttPointer({
      placedBars: () => placedBars,
      strips: () => strips,
      axis: () => dayAxis(),
      barRanges: () => barRanges,
      onBarDrop,
    });
    ptr.begin(600, 20);
    expect(ptr.activeTransaction.value).toBeNull();
    // Hit still recorded for diagnostic purposes even though no transaction started.
    expect(ptr.lastHit.value?.kind).toBe('bar-body');
    ptr.advance(660, 20);
    ptr.commit();
    expect(onBarDrop).not.toHaveBeenCalled();
  });
});

describe('useGanttPointer — bar resize', () => {
  it('begin on bar-edge-end + advance right + commit emits onBarResize with end-shift only', () => {
    const onBarResize = mockBarResize();
    const ptr = useGanttPointer({
      placedBars: () => placedBars,
      strips: () => strips,
      axis: () => dayAxis(),
      barRanges: () => barRanges,
      editable: true,
      onBarResize,
    });

    // Bar end edge at content x = 720. Default edgeZoneWidth = 8, so 715 is in end zone.
    ptr.begin(715, 20);
    expect(ptr.activeTransaction.value?.kind).toBe('bar-resize');
    expect(ptr.lastHit.value?.kind).toBe('bar-edge-end');

    // Drag right +60 px (= +1 hour).
    ptr.advance(775, 20);
    ptr.commit();

    expect(onBarResize).toHaveBeenCalledOnce();
    const payload = onBarResize.mock.calls[0]![0];
    expect(payload.barId).toBe('b1');
    expect(payload.edge).toBe('end');
    // Start unchanged.
    expect(payload.newRange.start.getTime()).toBe(payload.oldRange.start.getTime());
    // End shifted by +1 hour.
    expect(payload.newRange.end.getTime() - payload.oldRange.end.getTime()).toBe(MS_PER_HOUR);
  });

  it('begin on bar-edge-start + drag left + commit emits start-shift only', () => {
    const onBarResize = mockBarResize();
    const ptr = useGanttPointer({
      placedBars: () => placedBars,
      strips: () => strips,
      axis: () => dayAxis(),
      barRanges: () => barRanges,
      editable: true,
      onBarResize,
    });

    // Bar start edge at x = 480 → 485 lands in the 8-px start zone.
    ptr.begin(485, 20);
    expect(ptr.lastHit.value?.kind).toBe('bar-edge-start');

    // Drag left −30 px (= −0.5 hour).
    ptr.advance(455, 20);
    ptr.commit();

    expect(onBarResize).toHaveBeenCalledOnce();
    const payload = onBarResize.mock.calls[0]![0];
    expect(payload.edge).toBe('start');
    expect(payload.newRange.end.getTime()).toBe(payload.oldRange.end.getTime());
    expect(payload.newRange.start.getTime() - payload.oldRange.start.getTime()).toBe(
      -0.5 * MS_PER_HOUR,
    );
  });
});

describe('useGanttPointer — calendar range select', () => {
  it('begin on empty-row + advance + commit emits onSelect with the resolved range', () => {
    const onSelect = mockSelect();
    const ptr = useGanttPointer({
      placedBars: () => [], // no bars → click anywhere on a strip is empty-row
      strips: () => strips,
      axis: () => dayAxis(),
      barRanges: () => new Map(),
      selectable: true,
      onSelect,
    });

    // Click at content (120, 20) → hour 2, row r1. Drag to (300, 20) → hour 5.
    ptr.begin(120, 20);
    expect(ptr.activeTransaction.value?.kind).toBe('calendar-range-select');
    expect(ptr.lastHit.value?.kind).toBe('empty-row');

    ptr.advance(300, 20);
    ptr.commit();

    expect(onSelect).toHaveBeenCalledOnce();
    const payload = onSelect.mock.calls[0]![0];
    expect(payload.rowId).toBe('r1');
    // Hour 2 → 5 = 3-hour range.
    expect(payload.range.end.getTime() - payload.range.start.getTime()).toBe(3 * MS_PER_HOUR);
    // Range starts at hour 2 (= 2 × MS_PER_HOUR from local midnight).
    expect(payload.range.start.getTime() - todayMs).toBe(2 * MS_PER_HOUR);
  });

  it('skips range-select when selectable=false (default)', () => {
    const onSelect = mockSelect();
    const ptr = useGanttPointer({
      placedBars: () => [],
      strips: () => strips,
      axis: () => dayAxis(),
      barRanges: () => new Map(),
      onSelect,
    });
    ptr.begin(120, 20);
    expect(ptr.activeTransaction.value).toBeNull();
    ptr.commit();
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe('useGanttPointer — lifecycle invariants', () => {
  it('advance is a no-op when no transaction is active', () => {
    const ptr = useGanttPointer({
      placedBars: () => placedBars,
      strips: () => strips,
      axis: () => dayAxis(),
      barRanges: () => barRanges,
      editable: true,
    });
    expect(ptr.activeTransaction.value).toBeNull();
    ptr.advance(700, 20);
    expect(ptr.activeTransaction.value).toBeNull();
  });

  it('commit is a no-op when no transaction is active', () => {
    const onBarDrop = mockBarDrop();
    const ptr = useGanttPointer({
      placedBars: () => placedBars,
      strips: () => strips,
      axis: () => dayAxis(),
      barRanges: () => barRanges,
      editable: true,
      onBarDrop,
    });
    ptr.commit();
    expect(onBarDrop).not.toHaveBeenCalled();
  });

  it('a missed click (no hit) leaves activeTransaction null and lastHit null', () => {
    const ptr = useGanttPointer({
      placedBars: () => placedBars,
      strips: () => strips,
      axis: () => dayAxis(),
      barRanges: () => barRanges,
      editable: true,
      selectable: true,
    });
    // Click at y above all strips.
    ptr.begin(600, -5);
    expect(ptr.lastHit.value).toBeNull();
    expect(ptr.activeTransaction.value).toBeNull();
  });

  it('begin → commit without advance still emits with a zero-delta range', () => {
    const onBarDrop = mockBarDrop();
    const ptr = useGanttPointer({
      placedBars: () => placedBars,
      strips: () => strips,
      axis: () => dayAxis(),
      barRanges: () => barRanges,
      editable: true,
      onBarDrop,
    });
    ptr.begin(600, 20);
    ptr.commit();
    expect(onBarDrop).toHaveBeenCalledOnce();
    const payload = onBarDrop.mock.calls[0]![0];
    expect(payload.newRange.start.getTime()).toBe(payload.oldRange.start.getTime());
  });

  it('begin without a barRanges entry skips emit (orphan-safe)', () => {
    const onBarDrop = mockBarDrop();
    const ptr = useGanttPointer({
      placedBars: () => placedBars,
      strips: () => strips,
      axis: () => dayAxis(),
      barRanges: () => new Map(), // no entry for 'b1'
      editable: true,
      onBarDrop,
    });
    ptr.begin(600, 20);
    expect(ptr.activeTransaction.value?.kind).toBe('bar-drag'); // transaction started
    ptr.commit();
    expect(onBarDrop).not.toHaveBeenCalled(); // but commit skipped — no original range
  });

  it('snapDurationMs is forwarded to commitBarDrag', () => {
    const onBarDrop = mockBarDrop();
    const ptr = useGanttPointer({
      placedBars: () => placedBars,
      strips: () => strips,
      axis: () => dayAxis(),
      barRanges: () => barRanges,
      editable: true,
      // Snap to 1 hour. A 30-min raw drag should round to 1 hour.
      snapDurationMs: 60 * 60 * 1000,
      onBarDrop,
    });
    ptr.begin(600, 20);
    ptr.advance(630, 20); // +30 px = +30 min raw
    ptr.commit();
    const payload = onBarDrop.mock.calls[0]![0];
    // Math.round(30min / 60min) = 1 → snap to 60 min.
    expect(payload.newRange.start.getTime() - payload.oldRange.start.getTime()).toBe(MS_PER_HOUR);
  });
});

describe('useGanttPointer — progress handle', () => {
  // Bar 'b1' at content x=480..720 (width 240), y=8..38. 50% progress →
  // handle x = 480 + 0.5 × 240 = 600. Default handle size 12 → rect
  // x ∈ [594, 606], y ∈ [17, 29] (centered at bar y-mid = 23).
  const overlayIdByBarId = new Map([['b1', 'progress-handle']]);
  const barProgressById = new Map([['b1', 50]]);

  it('begin on the handle rect routes to beginProgressHandle (initialProgress, barWidth pinned)', () => {
    const onBarProgress = mockBarProgress();
    const ptr = useGanttPointer({
      placedBars: () => placedBars,
      strips: () => strips,
      axis: () => dayAxis(),
      barRanges: () => barRanges,
      overlayIdByBarId: () => overlayIdByBarId,
      barProgressById: () => barProgressById,
      editable: true,
      onBarProgress,
    });

    ptr.begin(600, 23); // dead-center of handle rect
    expect(ptr.lastHit.value?.kind).toBe('progress-handle');
    const txn = ptr.activeTransaction.value;
    expect(txn?.kind).toBe('progress-handle');
    if (txn?.kind === 'progress-handle') {
      expect(txn.barId).toBe('b1');
      expect(txn.initialProgress).toBe(50);
      expect(txn.barWidth).toBe(240);
      expect(txn.projectedProgress).toBe(50);
    }
  });

  it('advance updates projectedProgress as a percentage of barWidth', () => {
    const onBarProgress = mockBarProgress();
    const ptr = useGanttPointer({
      placedBars: () => placedBars,
      strips: () => strips,
      axis: () => dayAxis(),
      barRanges: () => barRanges,
      overlayIdByBarId: () => overlayIdByBarId,
      barProgressById: () => barProgressById,
      editable: true,
      onBarProgress,
    });
    ptr.begin(600, 23);
    // Drag +24 px on a 240-px-wide bar → +10% progress.
    ptr.advance(624, 23);
    const txn = ptr.activeTransaction.value;
    if (txn?.kind === 'progress-handle') {
      expect(txn.projectedProgress).toBeCloseTo(60, 5);
    }
  });

  it('commit fires onBarProgress with clamped new value', () => {
    const onBarProgress = mockBarProgress();
    const ptr = useGanttPointer({
      placedBars: () => placedBars,
      strips: () => strips,
      axis: () => dayAxis(),
      barRanges: () => barRanges,
      overlayIdByBarId: () => overlayIdByBarId,
      barProgressById: () => barProgressById,
      editable: true,
      onBarProgress,
    });
    ptr.begin(600, 23);
    ptr.advance(636, 23); // +36 px → +15% → 65%
    ptr.commit();
    expect(onBarProgress).toHaveBeenCalledOnce();
    const payload = onBarProgress.mock.calls[0]![0];
    expect(payload.barId).toBe('b1');
    expect(payload.oldProgress).toBe(50);
    expect(payload.newProgress).toBeCloseTo(65, 5);
  });

  it('clamps projectedProgress to [0, 100] at commit (dragging past 100%)', () => {
    const onBarProgress = mockBarProgress();
    const ptr = useGanttPointer({
      placedBars: () => placedBars,
      strips: () => strips,
      axis: () => dayAxis(),
      barRanges: () => barRanges,
      overlayIdByBarId: () => overlayIdByBarId,
      barProgressById: () => barProgressById,
      editable: true,
      onBarProgress,
    });
    ptr.begin(600, 23);
    // Drag +500 px — vastly past the bar's right edge. projectedProgress
    // mid-drag may exceed 100; commit must clamp.
    ptr.advance(1100, 23);
    ptr.commit();
    expect(onBarProgress.mock.calls[0]![0].newProgress).toBe(100);
  });

  it('clamps below 0 too (dragging far left)', () => {
    const onBarProgress = mockBarProgress();
    const ptr = useGanttPointer({
      placedBars: () => placedBars,
      strips: () => strips,
      axis: () => dayAxis(),
      barRanges: () => barRanges,
      overlayIdByBarId: () => overlayIdByBarId,
      barProgressById: () => barProgressById,
      editable: true,
      onBarProgress,
    });
    ptr.begin(600, 23);
    ptr.advance(100, 23); // far left of bar
    ptr.commit();
    expect(onBarProgress.mock.calls[0]![0].newProgress).toBe(0);
  });

  it('skipped when bar has no overlayId (handle rect not produced)', () => {
    const onBarProgress = mockBarProgress();
    const ptr = useGanttPointer({
      placedBars: () => placedBars,
      strips: () => strips,
      axis: () => dayAxis(),
      barRanges: () => barRanges,
      // No overlayIdByBarId — handle rect map stays empty.
      barProgressById: () => barProgressById,
      editable: true,
      onBarProgress,
    });
    ptr.begin(600, 23);
    // Falls through to bar-body (since editable=true and there's a bar there).
    expect(ptr.lastHit.value?.kind).toBe('bar-body');
    ptr.commit();
    expect(onBarProgress).not.toHaveBeenCalled();
  });

  it('skipped when editable=false even with overlay + progress declared', () => {
    const onBarProgress = mockBarProgress();
    const ptr = useGanttPointer({
      placedBars: () => placedBars,
      strips: () => strips,
      axis: () => dayAxis(),
      barRanges: () => barRanges,
      overlayIdByBarId: () => overlayIdByBarId,
      barProgressById: () => barProgressById,
      // editable: false (default)
      onBarProgress,
    });
    ptr.begin(600, 23);
    // Hit is still detected (for diagnostic) but no transaction starts.
    expect(ptr.lastHit.value?.kind).toBe('progress-handle');
    expect(ptr.activeTransaction.value).toBeNull();
    ptr.commit();
    expect(onBarProgress).not.toHaveBeenCalled();
  });

  it('handle position tracks the current progress: 25% bar has handle at x=540', () => {
    // 25% progress → handle x = 480 + 0.25 × 240 = 540.
    const onBarProgress = mockBarProgress();
    const ptr = useGanttPointer({
      placedBars: () => placedBars,
      strips: () => strips,
      axis: () => dayAxis(),
      barRanges: () => barRanges,
      overlayIdByBarId: () => overlayIdByBarId,
      barProgressById: () => new Map([['b1', 25]]),
      editable: true,
      onBarProgress,
    });
    // Clicking at the old handle center (600, 23) now lands on bar-body
    // because the handle moved to 540.
    ptr.begin(600, 23);
    expect(ptr.lastHit.value?.kind).toBe('bar-body');
    ptr.commit();
    // Re-test by clicking on the new handle location.
    ptr.begin(540, 23);
    expect(ptr.lastHit.value?.kind).toBe('progress-handle');
  });
});

describe('useGanttPointer — abort', () => {
  it('abort() clears an in-flight bar-drag without firing onBarDrop', () => {
    const onBarDrop = mockBarDrop();
    const ptr = useGanttPointer({
      placedBars: () => placedBars,
      strips: () => strips,
      axis: () => dayAxis(),
      barRanges: () => barRanges,
      editable: true,
      onBarDrop,
    });
    ptr.begin(600, 20);
    ptr.advance(660, 20);
    expect(ptr.activeTransaction.value?.kind).toBe('bar-drag');

    ptr.abort();
    expect(ptr.activeTransaction.value).toBeNull();
    expect(ptr.lastHit.value).toBeNull();
    expect(onBarDrop).not.toHaveBeenCalled();
  });

  it('abort() then advance() is a no-op (transaction stays null)', () => {
    const onBarDrop = mockBarDrop();
    const ptr = useGanttPointer({
      placedBars: () => placedBars,
      strips: () => strips,
      axis: () => dayAxis(),
      barRanges: () => barRanges,
      editable: true,
      onBarDrop,
    });
    ptr.begin(600, 20);
    ptr.abort();
    ptr.advance(800, 20);
    expect(ptr.activeTransaction.value).toBeNull();
  });

  it('abort() then begin() starts a fresh transaction', () => {
    const onBarDrop = mockBarDrop();
    const ptr = useGanttPointer({
      placedBars: () => placedBars,
      strips: () => strips,
      axis: () => dayAxis(),
      barRanges: () => barRanges,
      editable: true,
      onBarDrop,
    });
    ptr.begin(600, 20);
    ptr.advance(660, 20);
    ptr.abort();

    // Fresh begin produces a new bar-drag with deltaX=0.
    ptr.begin(600, 20);
    const txn = ptr.activeTransaction.value;
    expect(txn?.kind).toBe('bar-drag');
    if (txn?.kind === 'bar-drag') {
      expect(txn.deltaX).toBe(0);
      expect(txn.deltaY).toBe(0);
    }
  });

  it('abort() when idle is a safe no-op', () => {
    const onBarDrop = mockBarDrop();
    const ptr = useGanttPointer({
      placedBars: () => placedBars,
      strips: () => strips,
      axis: () => dayAxis(),
      barRanges: () => barRanges,
      editable: true,
      onBarDrop,
    });
    expect(ptr.activeTransaction.value).toBeNull();
    ptr.abort();
    expect(ptr.activeTransaction.value).toBeNull();
    expect(onBarDrop).not.toHaveBeenCalled();
  });
});

describe('useGanttPointer — cross-row drag (Phase 9)', () => {
  // r1 at y∈[0,40), r2 at y∈[40,80). Bar 'b1' lives in r1 (y=8), bar 'b2'
  // lives in r2 (y=48). Strip-divider gap omitted for simpler arithmetic
  // (rowSpacing=0 in this fixture; the resolver test file covers gap math).
  const stripsForCrossRow: readonly SwimlaneStrip[] = [
    { rowId: 'r1', y: 0, height: 40 },
    { rowId: 'r2', y: 40, height: 40 },
  ];
  const placedBarsForCrossRow: readonly PlacedBar[] = [
    { barId: 'b1', x: 480, y: 8, width: 240, height: 30 },
  ];
  const barRowIds = new Map<string, string>([['b1', 'r1']]);

  it('projectedRowId is null outside a bar-drag transaction', () => {
    const ptr = useGanttPointer({
      placedBars: () => placedBarsForCrossRow,
      strips: () => stripsForCrossRow,
      axis: () => dayAxis(),
      barRanges: () => barRanges,
      barRowIds: () => barRowIds,
      editable: true,
    });
    expect(ptr.projectedRowId.value).toBeNull(); // idle
    ptr.begin(100, 20); // miss (no bar at x=100)
    expect(ptr.projectedRowId.value).toBeNull(); // no txn started
  });

  it('projectedRowId tracks the strip containing the pointer y mid-drag', () => {
    const ptr = useGanttPointer({
      placedBars: () => placedBarsForCrossRow,
      strips: () => stripsForCrossRow,
      axis: () => dayAxis(),
      barRanges: () => barRanges,
      barRowIds: () => barRowIds,
      editable: true,
    });

    // Begin a drag on b1 at content (600, 20) — pointer is inside r1.
    ptr.begin(600, 20);
    expect(ptr.activeTransaction.value?.kind).toBe('bar-drag');
    expect(ptr.projectedRowId.value).toBe('r1');

    // Pointer crosses into r2 (y >= 40). originPx.y was 20, deltaY 40
    // puts pointer at 60 which is inside r2's [40, 80) range.
    ptr.advance(600, 60);
    expect(ptr.projectedRowId.value).toBe('r2');

    // Pointer drags way below all content → null.
    ptr.advance(600, 500);
    expect(ptr.projectedRowId.value).toBeNull();

    // Pointer drags back into r1 → r1.
    ptr.advance(600, 25);
    expect(ptr.projectedRowId.value).toBe('r1');
  });

  it('cross-row commit emits newRowId !== oldRowId; out-of-strip drop reverts to oldRowId', () => {
    const onBarDrop = mockBarDrop();
    const ptr = useGanttPointer({
      placedBars: () => placedBarsForCrossRow,
      strips: () => stripsForCrossRow,
      axis: () => dayAxis(),
      barRanges: () => barRanges,
      barRowIds: () => barRowIds,
      editable: true,
      onBarDrop,
    });

    // Drag b1 from r1 down into r2 and drop.
    ptr.begin(600, 20);
    ptr.advance(600, 60); // inside r2
    ptr.commit();
    expect(onBarDrop).toHaveBeenCalledOnce();
    const crossRowPayload = onBarDrop.mock.calls[0]![0];
    expect(crossRowPayload.barId).toBe('b1');
    expect(crossRowPayload.oldRowId).toBe('r1');
    expect(crossRowPayload.newRowId).toBe('r2');

    // Second drag: same row drop (still inside r1) → newRowId === oldRowId.
    onBarDrop.mockClear();
    ptr.begin(600, 20);
    ptr.advance(610, 25); // still inside r1
    ptr.commit();
    const sameRowPayload = onBarDrop.mock.calls[0]![0];
    expect(sameRowPayload.oldRowId).toBe('r1');
    expect(sameRowPayload.newRowId).toBe('r1');

    // Third drag: drop outside all strips (y=500) → newRowId reverts.
    onBarDrop.mockClear();
    ptr.begin(600, 20);
    ptr.advance(600, 500); // outside all strips
    ptr.commit();
    const outOfStripPayload = onBarDrop.mock.calls[0]![0];
    expect(outOfStripPayload.oldRowId).toBe('r1');
    expect(outOfStripPayload.newRowId).toBe('r1'); // fallback
  });
});
