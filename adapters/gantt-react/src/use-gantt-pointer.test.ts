import {
  defaultAxisRangePlanner,
  type PlacedBar,
  type PlannedAxis,
  type SwimlaneStrip,
  type TimeRange,
} from '@chronixjs/gantt';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  useGanttPointer,
  type BarDragStartCallback,
  type BarDragStopCallback,
  type BarDropPayload,
  type BarProgressPayload,
  type BarResizePayload,
  type BarResizeStartCallback,
  type BarResizeStopCallback,
  type SelectPayload,
} from './use-gantt-pointer.js';

const mockBarDrop = (): ReturnType<typeof vi.fn<(p: BarDropPayload) => void>> =>
  vi.fn<(p: BarDropPayload) => void>();
const mockBarResize = (): ReturnType<typeof vi.fn<(p: BarResizePayload) => void>> =>
  vi.fn<(p: BarResizePayload) => void>();
const mockSelect = (): ReturnType<typeof vi.fn<(p: SelectPayload) => void>> =>
  vi.fn<(p: SelectPayload) => void>();
const mockBarProgress = (): ReturnType<typeof vi.fn<(p: BarProgressPayload) => void>> =>
  vi.fn<(p: BarProgressPayload) => void>();

const MS_PER_HOUR = 60 * 60 * 1000;

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

const placedBars: readonly PlacedBar[] = [
  { barId: 'b1', x: 480, y: 8, width: 240, height: 30, isStart: true, isEnd: true },
];

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
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars,
        strips,
        axis: dayAxis(),
        barRanges,
        editable: true,
        onBarDrop,
      }),
    );

    act(() => {
      result.current.begin(600, 20);
    });
    expect(result.current.activeTransaction?.kind).toBe('bar-drag');
    expect(result.current.lastHit?.kind).toBe('bar-body');

    act(() => {
      result.current.advance(660, 20);
    });
    expect(result.current.activeTransaction?.kind).toBe('bar-drag');

    act(() => {
      result.current.commit();
    });
    expect(result.current.activeTransaction).toBeNull();
    expect(onBarDrop).toHaveBeenCalledOnce();
    const payload = onBarDrop.mock.calls[0]![0];
    expect(payload.barId).toBe('b1');
    expect(payload.oldRange.start.toISOString()).toBe(barRanges.get('b1')!.start.toISOString());
    expect(payload.newRange.start.getTime() - payload.oldRange.start.getTime()).toBe(MS_PER_HOUR);
    expect(payload.newRange.end.getTime() - payload.oldRange.end.getTime()).toBe(MS_PER_HOUR);
  });

  it('skips bar-drag when editable=false (default)', () => {
    const onBarDrop = mockBarDrop();
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars,
        strips,
        axis: dayAxis(),
        barRanges,
        onBarDrop,
      }),
    );
    act(() => {
      result.current.begin(600, 20);
    });
    expect(result.current.activeTransaction).toBeNull();
    expect(result.current.lastHit?.kind).toBe('bar-body');
    act(() => {
      result.current.advance(660, 20);
    });
    act(() => {
      result.current.commit();
    });
    expect(onBarDrop).not.toHaveBeenCalled();
  });
});

describe('useGanttPointer — bar resize', () => {
  it('begin on bar-edge-end + advance right + commit emits onBarResize with end-shift only', () => {
    const onBarResize = mockBarResize();
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars,
        strips,
        axis: dayAxis(),
        barRanges,
        editable: true,
        onBarResize,
      }),
    );

    act(() => {
      result.current.begin(715, 20);
    });
    expect(result.current.activeTransaction?.kind).toBe('bar-resize');
    expect(result.current.lastHit?.kind).toBe('bar-edge-end');

    act(() => {
      result.current.advance(775, 20);
    });
    act(() => {
      result.current.commit();
    });

    expect(onBarResize).toHaveBeenCalledOnce();
    const payload = onBarResize.mock.calls[0]![0];
    expect(payload.barId).toBe('b1');
    expect(payload.edge).toBe('end');
    expect(payload.newRange.start.getTime()).toBe(payload.oldRange.start.getTime());
    expect(payload.newRange.end.getTime() - payload.oldRange.end.getTime()).toBe(MS_PER_HOUR);
  });

  it('begin on bar-edge-start + advance left + commit emits onBarResize with start-shift only', () => {
    const onBarResize = mockBarResize();
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars,
        strips,
        axis: dayAxis(),
        barRanges,
        editable: true,
        onBarResize,
      }),
    );

    act(() => {
      result.current.begin(485, 20);
    });
    expect(result.current.lastHit?.kind).toBe('bar-edge-start');

    act(() => {
      result.current.advance(455, 20);
    });
    act(() => {
      result.current.commit();
    });

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
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars: [],
        strips,
        axis: dayAxis(),
        barRanges: new Map(),
        selectable: true,
        onSelect,
      }),
    );

    act(() => {
      result.current.begin(120, 20);
    });
    expect(result.current.activeTransaction?.kind).toBe('calendar-range-select');
    expect(result.current.lastHit?.kind).toBe('empty-row');

    act(() => {
      result.current.advance(300, 20);
    });
    act(() => {
      result.current.commit();
    });

    expect(onSelect).toHaveBeenCalledOnce();
    const payload = onSelect.mock.calls[0]![0];
    expect(payload.rowId).toBe('r1');
    expect(payload.range.end.getTime() - payload.range.start.getTime()).toBe(3 * MS_PER_HOUR);
    expect(payload.range.start.getTime() - todayMs).toBe(2 * MS_PER_HOUR);
  });

  it('skips range-select when selectable=false (default)', () => {
    const onSelect = mockSelect();
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars: [],
        strips,
        axis: dayAxis(),
        barRanges: new Map(),
        onSelect,
      }),
    );
    act(() => {
      result.current.begin(120, 20);
    });
    expect(result.current.activeTransaction).toBeNull();
    act(() => {
      result.current.commit();
    });
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe('useGanttPointer — lifecycle invariants', () => {
  it('advance is a no-op when no transaction is active', () => {
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars,
        strips,
        axis: dayAxis(),
        barRanges,
        editable: true,
      }),
    );
    expect(result.current.activeTransaction).toBeNull();
    act(() => {
      result.current.advance(700, 20);
    });
    expect(result.current.activeTransaction).toBeNull();
  });

  it('commit is a no-op when no transaction is active', () => {
    const onBarDrop = mockBarDrop();
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars,
        strips,
        axis: dayAxis(),
        barRanges,
        editable: true,
        onBarDrop,
      }),
    );
    act(() => {
      result.current.commit();
    });
    expect(onBarDrop).not.toHaveBeenCalled();
  });

  it('a missed click (no hit) leaves activeTransaction null and lastHit null', () => {
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars,
        strips,
        axis: dayAxis(),
        barRanges,
        editable: true,
        selectable: true,
      }),
    );
    act(() => {
      result.current.begin(600, -5);
    });
    expect(result.current.lastHit).toBeNull();
    expect(result.current.activeTransaction).toBeNull();
  });

  it('begin → commit without advance still emits with a zero-delta range', () => {
    const onBarDrop = mockBarDrop();
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars,
        strips,
        axis: dayAxis(),
        barRanges,
        editable: true,
        onBarDrop,
      }),
    );
    act(() => {
      result.current.begin(600, 20);
    });
    act(() => {
      result.current.commit();
    });
    expect(onBarDrop).toHaveBeenCalledOnce();
    const payload = onBarDrop.mock.calls[0]![0];
    expect(payload.newRange.start.getTime()).toBe(payload.oldRange.start.getTime());
  });

  it('begin without a barRanges entry skips emit (orphan-safe)', () => {
    const onBarDrop = mockBarDrop();
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars,
        strips,
        axis: dayAxis(),
        barRanges: new Map(),
        editable: true,
        onBarDrop,
      }),
    );
    act(() => {
      result.current.begin(600, 20);
    });
    expect(result.current.activeTransaction?.kind).toBe('bar-drag');
    act(() => {
      result.current.commit();
    });
    expect(onBarDrop).not.toHaveBeenCalled();
  });

  it('snapDurationMs is forwarded to commitBarDrag', () => {
    const onBarDrop = mockBarDrop();
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars,
        strips,
        axis: dayAxis(),
        barRanges,
        editable: true,
        snapDurationMs: 60 * 60 * 1000,
        onBarDrop,
      }),
    );
    act(() => {
      result.current.begin(600, 20);
    });
    act(() => {
      result.current.advance(630, 20);
    });
    act(() => {
      result.current.commit();
    });
    const payload = onBarDrop.mock.calls[0]![0];
    expect(payload.newRange.start.getTime() - payload.oldRange.start.getTime()).toBe(MS_PER_HOUR);
  });
});

describe('useGanttPointer — progress handle', () => {
  const overlayIdByBarId = new Map([['b1', 'progress-handle']]);
  const barProgressById = new Map([['b1', 50]]);

  it('begin on the handle rect routes to beginProgressHandle (initialProgress, barWidth pinned)', () => {
    const onBarProgress = mockBarProgress();
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars,
        strips,
        axis: dayAxis(),
        barRanges,
        overlayIdByBarId,
        barProgressById,
        editable: true,
        onBarProgress,
      }),
    );

    act(() => {
      result.current.begin(600, 38);
    });
    expect(result.current.lastHit?.kind).toBe('progress-handle');
    const txn = result.current.activeTransaction;
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
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars,
        strips,
        axis: dayAxis(),
        barRanges,
        overlayIdByBarId,
        barProgressById,
        editable: true,
        onBarProgress,
      }),
    );
    act(() => {
      result.current.begin(600, 38);
    });
    act(() => {
      result.current.advance(624, 23);
    });
    const txn = result.current.activeTransaction;
    if (txn?.kind === 'progress-handle') {
      expect(txn.projectedProgress).toBeCloseTo(60, 5);
    }
  });

  it('commit fires onBarProgress with clamped new value', () => {
    const onBarProgress = mockBarProgress();
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars,
        strips,
        axis: dayAxis(),
        barRanges,
        overlayIdByBarId,
        barProgressById,
        editable: true,
        onBarProgress,
      }),
    );
    act(() => {
      result.current.begin(600, 38);
    });
    act(() => {
      result.current.advance(636, 23);
    });
    act(() => {
      result.current.commit();
    });
    expect(onBarProgress).toHaveBeenCalledOnce();
    const payload = onBarProgress.mock.calls[0]![0];
    expect(payload.barId).toBe('b1');
    expect(payload.oldProgress).toBe(50);
    expect(payload.newProgress).toBeCloseTo(65, 5);
  });

  it('clamps projectedProgress to [0, 100] at commit (dragging past 100%)', () => {
    const onBarProgress = mockBarProgress();
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars,
        strips,
        axis: dayAxis(),
        barRanges,
        overlayIdByBarId,
        barProgressById,
        editable: true,
        onBarProgress,
      }),
    );
    act(() => {
      result.current.begin(600, 38);
    });
    act(() => {
      result.current.advance(1100, 23);
    });
    act(() => {
      result.current.commit();
    });
    expect(onBarProgress.mock.calls[0]![0].newProgress).toBe(100);
  });

  it('clamps below 0 too (dragging far left)', () => {
    const onBarProgress = mockBarProgress();
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars,
        strips,
        axis: dayAxis(),
        barRanges,
        overlayIdByBarId,
        barProgressById,
        editable: true,
        onBarProgress,
      }),
    );
    act(() => {
      result.current.begin(600, 38);
    });
    act(() => {
      result.current.advance(100, 23);
    });
    act(() => {
      result.current.commit();
    });
    expect(onBarProgress.mock.calls[0]![0].newProgress).toBe(0);
  });

  it('skipped when bar has no overlayId (handle rect not produced)', () => {
    const onBarProgress = mockBarProgress();
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars,
        strips,
        axis: dayAxis(),
        barRanges,
        barProgressById,
        editable: true,
        onBarProgress,
      }),
    );
    act(() => {
      result.current.begin(600, 38);
    });
    expect(result.current.lastHit?.kind).toBe('bar-body');
    act(() => {
      result.current.commit();
    });
    expect(onBarProgress).not.toHaveBeenCalled();
  });

  it('skipped when editable=false even with overlay + progress declared', () => {
    const onBarProgress = mockBarProgress();
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars,
        strips,
        axis: dayAxis(),
        barRanges,
        overlayIdByBarId,
        barProgressById,
        onBarProgress,
      }),
    );
    act(() => {
      result.current.begin(600, 38);
    });
    expect(result.current.lastHit?.kind).toBe('progress-handle');
    expect(result.current.activeTransaction).toBeNull();
    act(() => {
      result.current.commit();
    });
    expect(onBarProgress).not.toHaveBeenCalled();
  });

  it('handle position tracks the current progress: 25% bar has handle at x=540', () => {
    const onBarProgress = mockBarProgress();
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars,
        strips,
        axis: dayAxis(),
        barRanges,
        overlayIdByBarId,
        barProgressById: new Map([['b1', 25]]),
        editable: true,
        onBarProgress,
      }),
    );
    act(() => {
      result.current.begin(600, 38);
    });
    expect(result.current.lastHit?.kind).toBe('bar-body');
    act(() => {
      result.current.commit();
    });
    act(() => {
      result.current.begin(540, 38);
    });
    expect(result.current.lastHit?.kind).toBe('progress-handle');
  });
});

describe('useGanttPointer — abort', () => {
  it('abort() clears an in-flight bar-drag without firing onBarDrop', () => {
    const onBarDrop = mockBarDrop();
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars,
        strips,
        axis: dayAxis(),
        barRanges,
        editable: true,
        onBarDrop,
      }),
    );
    act(() => {
      result.current.begin(600, 20);
    });
    act(() => {
      result.current.advance(660, 20);
    });
    expect(result.current.activeTransaction?.kind).toBe('bar-drag');

    act(() => {
      result.current.abort();
    });
    expect(result.current.activeTransaction).toBeNull();
    expect(result.current.lastHit).toBeNull();
    expect(onBarDrop).not.toHaveBeenCalled();
  });

  it('abort() then advance() is a no-op (transaction stays null)', () => {
    const onBarDrop = mockBarDrop();
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars,
        strips,
        axis: dayAxis(),
        barRanges,
        editable: true,
        onBarDrop,
      }),
    );
    act(() => {
      result.current.begin(600, 20);
    });
    act(() => {
      result.current.abort();
    });
    act(() => {
      result.current.advance(800, 20);
    });
    expect(result.current.activeTransaction).toBeNull();
  });

  it('abort() then begin() starts a fresh transaction', () => {
    const onBarDrop = mockBarDrop();
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars,
        strips,
        axis: dayAxis(),
        barRanges,
        editable: true,
        onBarDrop,
      }),
    );
    act(() => {
      result.current.begin(600, 20);
    });
    act(() => {
      result.current.advance(660, 20);
    });
    act(() => {
      result.current.abort();
    });

    act(() => {
      result.current.begin(600, 20);
    });
    const txn = result.current.activeTransaction;
    expect(txn?.kind).toBe('bar-drag');
    if (txn?.kind === 'bar-drag') {
      expect(txn.deltaX).toBe(0);
      expect(txn.deltaY).toBe(0);
    }
  });

  it('abort() when idle is a safe no-op', () => {
    const onBarDrop = mockBarDrop();
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars,
        strips,
        axis: dayAxis(),
        barRanges,
        editable: true,
        onBarDrop,
      }),
    );
    expect(result.current.activeTransaction).toBeNull();
    act(() => {
      result.current.abort();
    });
    expect(result.current.activeTransaction).toBeNull();
    expect(onBarDrop).not.toHaveBeenCalled();
  });
});

describe('useGanttPointer — cross-row drag ', () => {
  const stripsForCrossRow: readonly SwimlaneStrip[] = [
    { rowId: 'r1', y: 0, height: 40 },
    { rowId: 'r2', y: 40, height: 40 },
  ];
  const placedBarsForCrossRow: readonly PlacedBar[] = [
    { barId: 'b1', x: 480, y: 8, width: 240, height: 30, isStart: true, isEnd: true },
  ];
  const barRowIds = new Map<string, string>([['b1', 'r1']]);

  it('projectedRowId is null outside a bar-drag transaction', () => {
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars: placedBarsForCrossRow,
        strips: stripsForCrossRow,
        axis: dayAxis(),
        barRanges,
        barRowIds,
        editable: true,
      }),
    );
    expect(result.current.projectedRowId).toBeNull();
    act(() => {
      result.current.begin(100, 20);
    });
    expect(result.current.projectedRowId).toBeNull();
  });

  it('projectedRowId tracks the strip containing the pointer y mid-drag', () => {
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars: placedBarsForCrossRow,
        strips: stripsForCrossRow,
        axis: dayAxis(),
        barRanges,
        barRowIds,
        editable: true,
      }),
    );

    act(() => {
      result.current.begin(600, 20);
    });
    expect(result.current.activeTransaction?.kind).toBe('bar-drag');
    expect(result.current.projectedRowId).toBe('r1');

    act(() => {
      result.current.advance(600, 60);
    });
    expect(result.current.projectedRowId).toBe('r2');

    act(() => {
      result.current.advance(600, 500);
    });
    expect(result.current.projectedRowId).toBeNull();

    act(() => {
      result.current.advance(600, 25);
    });
    expect(result.current.projectedRowId).toBe('r1');
  });

  it('cross-row commit emits newRowId !== oldRowId; out-of-strip drop reverts to oldRowId', () => {
    const onBarDrop = mockBarDrop();
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars: placedBarsForCrossRow,
        strips: stripsForCrossRow,
        axis: dayAxis(),
        barRanges,
        barRowIds,
        editable: true,
        onBarDrop,
      }),
    );

    act(() => {
      result.current.begin(600, 20);
    });
    act(() => {
      result.current.advance(600, 60);
    });
    act(() => {
      result.current.commit();
    });
    expect(onBarDrop).toHaveBeenCalledOnce();
    const crossRowPayload = onBarDrop.mock.calls[0]![0];
    expect(crossRowPayload.barId).toBe('b1');
    expect(crossRowPayload.oldRowId).toBe('r1');
    expect(crossRowPayload.newRowId).toBe('r2');

    onBarDrop.mockClear();
    act(() => {
      result.current.begin(600, 20);
    });
    act(() => {
      result.current.advance(610, 25);
    });
    act(() => {
      result.current.commit();
    });
    const sameRowPayload = onBarDrop.mock.calls[0]![0];
    expect(sameRowPayload.oldRowId).toBe('r1');
    expect(sameRowPayload.newRowId).toBe('r1');

    onBarDrop.mockClear();
    act(() => {
      result.current.begin(600, 20);
    });
    act(() => {
      result.current.advance(600, 500);
    });
    act(() => {
      result.current.commit();
    });
    const outOfStripPayload = onBarDrop.mock.calls[0]![0];
    expect(outOfStripPayload.oldRowId).toBe('r1');
    expect(outOfStripPayload.newRowId).toBe('r1');
  });
});

describe('useGanttPointer — drag/resize lifecycle emits ', () => {
  const mockDragStart = (): ReturnType<typeof vi.fn<(p: BarDragStartCallback) => void>> =>
    vi.fn<(p: BarDragStartCallback) => void>();
  const mockDragStop = (): ReturnType<typeof vi.fn<(p: BarDragStopCallback) => void>> =>
    vi.fn<(p: BarDragStopCallback) => void>();
  const mockResizeStart = (): ReturnType<typeof vi.fn<(p: BarResizeStartCallback) => void>> =>
    vi.fn<(p: BarResizeStartCallback) => void>();
  const mockResizeStop = (): ReturnType<typeof vi.fn<(p: BarResizeStopCallback) => void>> =>
    vi.fn<(p: BarResizeStopCallback) => void>();

  it('0-delta drag: begin → commit fires NEITHER onBarDragStart NOR onBarDragStop', () => {
    const onBarDragStart = mockDragStart();
    const onBarDragStop = mockDragStop();
    const onBarDrop = mockBarDrop();
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars,
        strips,
        axis: dayAxis(),
        barRanges,
        editable: true,
        onBarDragStart,
        onBarDragStop,
        onBarDrop,
      }),
    );
    act(() => {
      result.current.begin(600, 20);
    });
    act(() => {
      result.current.commit();
    });
    expect(onBarDragStart).not.toHaveBeenCalled();
    expect(onBarDragStop).not.toHaveBeenCalled();
    expect(onBarDrop).toHaveBeenCalledTimes(1);
  });

  it('non-zero drag: begin → advance(+60,0) → commit fires start once, then stop, then onBarDrop in order', () => {
    const onBarDragStart = mockDragStart();
    const onBarDragStop = mockDragStop();
    const onBarDrop = mockBarDrop();
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars,
        strips,
        axis: dayAxis(),
        barRanges,
        editable: true,
        onBarDragStart,
        onBarDragStop,
        onBarDrop,
      }),
    );
    act(() => {
      result.current.begin(600, 20);
    });
    act(() => {
      result.current.advance(660, 20);
    });
    expect(onBarDragStart).toHaveBeenCalledTimes(1);
    expect(onBarDragStart).toHaveBeenCalledWith({ barId: 'b1' });
    expect(onBarDragStop).not.toHaveBeenCalled();
    act(() => {
      result.current.commit();
    });
    expect(onBarDragStop).toHaveBeenCalledTimes(1);
    expect(onBarDragStop).toHaveBeenCalledWith({ barId: 'b1' });
    const stopOrder = onBarDragStop.mock.invocationCallOrder[0];
    const dropOrder = onBarDrop.mock.invocationCallOrder[0];
    expect(stopOrder).toBeDefined();
    expect(dropOrder).toBeDefined();
    expect(stopOrder!).toBeLessThan(dropOrder!);
  });

  it('multi-advance drag fires start EXACTLY ONCE, stop once', () => {
    const onBarDragStart = mockDragStart();
    const onBarDragStop = mockDragStop();
    const onBarDrop = mockBarDrop();
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars,
        strips,
        axis: dayAxis(),
        barRanges,
        editable: true,
        onBarDragStart,
        onBarDragStop,
        onBarDrop,
      }),
    );
    act(() => {
      result.current.begin(600, 20);
    });
    act(() => {
      result.current.advance(630, 20);
    });
    act(() => {
      result.current.advance(660, 20);
    });
    act(() => {
      result.current.advance(690, 20);
    });
    expect(onBarDragStart).toHaveBeenCalledTimes(1);
    act(() => {
      result.current.commit();
    });
    expect(onBarDragStop).toHaveBeenCalledTimes(1);
  });

  it('abort after non-zero advance: start fires, stop fires, onBarDrop does NOT fire', () => {
    const onBarDragStart = mockDragStart();
    const onBarDragStop = mockDragStop();
    const onBarDrop = mockBarDrop();
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars,
        strips,
        axis: dayAxis(),
        barRanges,
        editable: true,
        onBarDragStart,
        onBarDragStop,
        onBarDrop,
      }),
    );
    act(() => {
      result.current.begin(600, 20);
    });
    act(() => {
      result.current.advance(660, 20);
    });
    expect(onBarDragStart).toHaveBeenCalledTimes(1);
    act(() => {
      result.current.abort();
    });
    expect(onBarDragStop).toHaveBeenCalledTimes(1);
    expect(onBarDrop).not.toHaveBeenCalled();
  });

  it('0-delta resize fires NEITHER resize-start NOR resize-stop', () => {
    const onBarResizeStart = mockResizeStart();
    const onBarResizeStop = mockResizeStop();
    const onBarResize = mockBarResize();
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars,
        strips,
        axis: dayAxis(),
        barRanges,
        editable: true,
        onBarResizeStart,
        onBarResizeStop,
        onBarResize,
      }),
    );
    act(() => {
      result.current.begin(715, 20);
    });
    expect(result.current.activeTransaction?.kind).toBe('bar-resize');
    act(() => {
      result.current.commit();
    });
    expect(onBarResizeStart).not.toHaveBeenCalled();
    expect(onBarResizeStop).not.toHaveBeenCalled();
  });

  it('non-zero resize fires resize-start with edge:end, then resize-stop, then onBarResize', () => {
    const onBarResizeStart = mockResizeStart();
    const onBarResizeStop = mockResizeStop();
    const onBarResize = mockBarResize();
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars,
        strips,
        axis: dayAxis(),
        barRanges,
        editable: true,
        onBarResizeStart,
        onBarResizeStop,
        onBarResize,
      }),
    );
    act(() => {
      result.current.begin(715, 20);
    });
    act(() => {
      result.current.advance(775, 20);
    });
    expect(onBarResizeStart).toHaveBeenCalledTimes(1);
    expect(onBarResizeStart).toHaveBeenCalledWith({ barId: 'b1', edge: 'end' });
    act(() => {
      result.current.commit();
    });
    expect(onBarResizeStop).toHaveBeenCalledTimes(1);
    expect(onBarResizeStop).toHaveBeenCalledWith({ barId: 'b1', edge: 'end' });
    const stopOrder = onBarResizeStop.mock.invocationCallOrder[0];
    const resizeOrder = onBarResize.mock.invocationCallOrder[0];
    expect(stopOrder!).toBeLessThan(resizeOrder!);
  });
});

describe('useGanttPointer — drag-distance gate', () => {
  it('default pointerMinDistance=5: 3-px Pythagorean advance leaves dragDistanceSurpassed=false', () => {
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars,
        strips,
        axis: dayAxis(),
        barRanges,
        editable: true,
      }),
    );
    act(() => {
      result.current.begin(600, 20);
    });
    expect(result.current.dragDistanceSurpassed).toBe(false);
    act(() => {
      result.current.advance(603, 20);
    });
    expect(result.current.dragDistanceSurpassed).toBe(false);
  });

  it('5-px Pythagorean advance (exact boundary) flips dragDistanceSurpassed=true', () => {
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars,
        strips,
        axis: dayAxis(),
        barRanges,
        editable: true,
      }),
    );
    act(() => {
      result.current.begin(600, 20);
    });
    act(() => {
      result.current.advance(603, 24);
    });
    expect(result.current.dragDistanceSurpassed).toBe(true);
  });

  it('sticky behavior: surpass at advance 1, drift back at advance 2, flag stays true', () => {
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars,
        strips,
        axis: dayAxis(),
        barRanges,
        editable: true,
      }),
    );
    act(() => {
      result.current.begin(600, 20);
    });
    act(() => {
      result.current.advance(610, 20);
    });
    expect(result.current.dragDistanceSurpassed).toBe(true);
    act(() => {
      result.current.advance(602, 20);
    });
    expect(result.current.dragDistanceSurpassed).toBe(true);
  });

  it('pointerMinDistance=0 disables the gate: any non-zero delta surpasses', () => {
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars,
        strips,
        axis: dayAxis(),
        barRanges,
        editable: true,
        pointerMinDistance: 0,
      }),
    );
    act(() => {
      result.current.begin(600, 20);
    });
    expect(result.current.dragDistanceSurpassed).toBe(false);
    act(() => {
      result.current.advance(601, 20);
    });
    expect(result.current.dragDistanceSurpassed).toBe(true);
  });

  it('onBarDragStart now gates on threshold (sub-threshold advances do NOT fire start)', () => {
    const onBarDragStart = vi.fn<(p: BarDragStartCallback) => void>();
    const { result } = renderHook(() =>
      useGanttPointer({
        placedBars,
        strips,
        axis: dayAxis(),
        barRanges,
        editable: true,
        onBarDragStart,
      }),
    );
    act(() => {
      result.current.begin(600, 20);
    });
    act(() => {
      result.current.advance(602, 20);
    });
    expect(onBarDragStart).not.toHaveBeenCalled();
    act(() => {
      result.current.advance(610, 20);
    });
    expect(onBarDragStart).toHaveBeenCalledTimes(1);
  });

  it('threshold applies to all 4 transaction kinds (bar-drag / bar-resize / calendar-range-select)', () => {
    const checks: { kind: string; beginX: number; beginY: number; advanceX: number }[] = [
      { kind: 'bar-drag', beginX: 600, beginY: 20, advanceX: 610 },
      { kind: 'bar-resize', beginX: 482, beginY: 20, advanceX: 492 },
      { kind: 'calendar-range-select', beginX: 100, beginY: 60, advanceX: 110 },
    ];
    for (const { kind, beginX, beginY, advanceX } of checks) {
      const { result } = renderHook(() =>
        useGanttPointer({
          placedBars,
          strips,
          axis: dayAxis(),
          barRanges,
          editable: true,
          selectable: true,
        }),
      );
      act(() => {
        result.current.begin(beginX, beginY);
      });
      expect(result.current.activeTransaction?.kind, `kind=${kind} begin`).toBe(kind);
      expect(result.current.dragDistanceSurpassed, `kind=${kind} pre-advance`).toBe(false);
      act(() => {
        result.current.advance(advanceX, beginY);
      });
      expect(result.current.dragDistanceSurpassed, `kind=${kind} post-advance`).toBe(true);
    }
  });
});
