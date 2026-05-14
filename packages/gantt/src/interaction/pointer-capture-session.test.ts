import { describe, expect, it } from 'vitest';

import { defaultPointerCaptureSession } from './pointer-capture-session.js';

import type { PointerCaptureConfig } from './pointer-capture-session.js';
import type { TimeRange } from '../ir/index.js';

const REQUIRE_HIT: PointerCaptureConfig = { requireInitialHit: true };
const ALLOW_MISS: PointerCaptureConfig = { requireInitialHit: false };

const MS_PER_HOUR = 60 * 60 * 1000;
const dayAxisPxPerMs = 60 / MS_PER_HOUR; // 60px/hr → 1/60000 px/ms

describe('defaultPointerCaptureSession.beginBarDrag', () => {
  it('returns a transaction when the initial pointerdown hits the subject', () => {
    const txn = defaultPointerCaptureSession.beginBarDrag({
      barId: 'b1',
      originPx: { x: 100, y: 200 },
      config: REQUIRE_HIT,
      initialHit: true,
      startedAt: 1000,
    });
    expect(txn).not.toBeNull();
    expect(txn?.kind).toBe('bar-drag');
    expect(txn?.barId).toBe('b1');
    expect(txn?.originPx).toEqual({ x: 100, y: 200 });
    expect(txn?.deltaX).toBe(0);
    expect(txn?.deltaY).toBe(0);
    expect(txn?.startedAt).toBe(1000);
  });

  it('returns null when requireInitialHit=true and initialHit=false', () => {
    const txn = defaultPointerCaptureSession.beginBarDrag({
      barId: 'b1',
      originPx: { x: 100, y: 200 },
      config: REQUIRE_HIT,
      initialHit: false,
    });
    expect(txn).toBeNull();
  });

  it('starts even when initialHit=false if requireInitialHit=false (progress-handle case)', () => {
    const txn = defaultPointerCaptureSession.beginBarDrag({
      barId: 'b1',
      originPx: { x: 100, y: 200 },
      config: ALLOW_MISS,
      initialHit: false,
    });
    expect(txn).not.toBeNull();
    expect(txn?.barId).toBe('b1');
  });

  it('falls back to performance.now() when startedAt is omitted', () => {
    const before = performance.now();
    const txn = defaultPointerCaptureSession.beginBarDrag({
      barId: 'b1',
      originPx: { x: 0, y: 0 },
      config: REQUIRE_HIT,
      initialHit: true,
    });
    const after = performance.now();
    expect(txn?.startedAt).toBeGreaterThanOrEqual(before);
    expect(txn?.startedAt).toBeLessThanOrEqual(after);
  });
});

describe('defaultPointerCaptureSession.advanceBarDrag', () => {
  function startTxn() {
    return defaultPointerCaptureSession.beginBarDrag({
      barId: 'b1',
      originPx: { x: 100, y: 200 },
      config: REQUIRE_HIT,
      initialHit: true,
      startedAt: 1000,
    })!;
  }

  it('computes deltaX / deltaY relative to the original origin', () => {
    const txn = startTxn();
    const advanced = defaultPointerCaptureSession.advanceBarDrag(txn, {
      currentPx: { x: 160, y: 210 },
    });
    expect(advanced.deltaX).toBe(60);
    expect(advanced.deltaY).toBe(10);
  });

  it('accepts negative deltas (drag-left, drag-up)', () => {
    const txn = startTxn();
    const advanced = defaultPointerCaptureSession.advanceBarDrag(txn, {
      currentPx: { x: 40, y: 180 },
    });
    expect(advanced.deltaX).toBe(-60);
    expect(advanced.deltaY).toBe(-20);
  });

  it('is pure — multiple advances always recompute from the original origin, not the previous advance', () => {
    const txn = startTxn();
    const first = defaultPointerCaptureSession.advanceBarDrag(txn, {
      currentPx: { x: 150, y: 200 },
    });
    expect(first.deltaX).toBe(50);
    const second = defaultPointerCaptureSession.advanceBarDrag(first, {
      currentPx: { x: 200, y: 200 },
    });
    // Cumulative from original origin (100), NOT from first advance (150).
    expect(second.deltaX).toBe(100);
    expect(second.deltaY).toBe(0);
  });

  it('preserves immutable fields across advance', () => {
    const txn = startTxn();
    const advanced = defaultPointerCaptureSession.advanceBarDrag(txn, {
      currentPx: { x: 200, y: 200 },
    });
    expect(advanced.kind).toBe('bar-drag');
    expect(advanced.barId).toBe('b1');
    expect(advanced.originPx).toEqual({ x: 100, y: 200 });
    expect(advanced.startedAt).toBe(1000);
  });
});

describe('defaultPointerCaptureSession.commitBarDrag', () => {
  function dragged(deltaX: number) {
    const txn = defaultPointerCaptureSession.beginBarDrag({
      barId: 'b1',
      originPx: { x: 100, y: 200 },
      config: REQUIRE_HIT,
      initialHit: true,
      startedAt: 1000,
    })!;
    return defaultPointerCaptureSession.advanceBarDrag(txn, {
      currentPx: { x: 100 + deltaX, y: 200 },
    });
  }

  const baseRange: TimeRange = {
    start: new Date('2026-05-13T10:00:00Z'),
    end: new Date('2026-05-13T12:00:00Z'),
  };

  it('converts pixel delta to a shifted time range using pxPerMs', () => {
    // 60px drag at 60px/hour = 1 hour shift.
    const txn = dragged(60);
    const { resolvedRange, timeDeltaMs } = defaultPointerCaptureSession.commitBarDrag({
      txn,
      originalRange: baseRange,
      pxPerMs: dayAxisPxPerMs,
    });
    expect(timeDeltaMs).toBe(MS_PER_HOUR);
    expect(resolvedRange.start.toISOString()).toBe('2026-05-13T11:00:00.000Z');
    expect(resolvedRange.end.toISOString()).toBe('2026-05-13T13:00:00.000Z');
  });

  it('negative delta shifts the range backwards in time', () => {
    const txn = dragged(-30); // 0.5h backwards
    const { timeDeltaMs, resolvedRange } = defaultPointerCaptureSession.commitBarDrag({
      txn,
      originalRange: baseRange,
      pxPerMs: dayAxisPxPerMs,
    });
    expect(timeDeltaMs).toBe(-30 / dayAxisPxPerMs);
    expect(resolvedRange.start.toISOString()).toBe('2026-05-13T09:30:00.000Z');
    expect(resolvedRange.end.toISOString()).toBe('2026-05-13T11:30:00.000Z');
  });

  it('snaps the time delta to a multiple of snapDurationMs when provided', () => {
    // 35px drag at 60px/hour = 35 minutes of raw delta. Snap to 30min.
    const txn = dragged(35);
    const { timeDeltaMs, resolvedRange } = defaultPointerCaptureSession.commitBarDrag({
      txn,
      originalRange: baseRange,
      pxPerMs: dayAxisPxPerMs,
      snapDurationMs: 30 * 60 * 1000, // 30 minutes
    });
    // Raw: 35min × 60000ms/min = 2_100_000ms; round to nearest 30min (1_800_000ms).
    expect(timeDeltaMs).toBe(30 * 60 * 1000);
    expect(resolvedRange.start.toISOString()).toBe('2026-05-13T10:30:00.000Z');
  });

  it('snap rounds half-step delta down at exactly the midpoint (banker math not used — Math.round)', () => {
    // 45 minutes raw → snap-30 boundary at 45 = halfway. Math.round → 60min.
    const txn = dragged(45); // 45min raw
    const { timeDeltaMs } = defaultPointerCaptureSession.commitBarDrag({
      txn,
      originalRange: baseRange,
      pxPerMs: dayAxisPxPerMs,
      snapDurationMs: 30 * 60 * 1000,
    });
    // Math.round(1.5) rounds to 2 → 2 × 30min = 60min.
    expect(timeDeltaMs).toBe(60 * 60 * 1000);
  });

  it('snap rounds toward zero — small drift commits as no-op', () => {
    // 5px drag at 60px/hour = 5 minutes raw. Snap to 30min → 0.
    const txn = dragged(5);
    const { timeDeltaMs, resolvedRange } = defaultPointerCaptureSession.commitBarDrag({
      txn,
      originalRange: baseRange,
      pxPerMs: dayAxisPxPerMs,
      snapDurationMs: 30 * 60 * 1000,
    });
    expect(timeDeltaMs).toBe(0);
    expect(resolvedRange.start.toISOString()).toBe(baseRange.start.toISOString());
    expect(resolvedRange.end.toISOString()).toBe(baseRange.end.toISOString());
  });

  it('snapDurationMs <= 0 is treated as no-snap', () => {
    const txn = dragged(35);
    const { timeDeltaMs } = defaultPointerCaptureSession.commitBarDrag({
      txn,
      originalRange: baseRange,
      pxPerMs: dayAxisPxPerMs,
      snapDurationMs: 0,
    });
    // Same as no snap — raw 35min.
    expect(timeDeltaMs).toBe(35 * 60 * 1000);
  });

  it('commit does not mutate the original range', () => {
    const txn = dragged(60);
    const originalStart = baseRange.start.getTime();
    defaultPointerCaptureSession.commitBarDrag({
      txn,
      originalRange: baseRange,
      pxPerMs: dayAxisPxPerMs,
    });
    expect(baseRange.start.getTime()).toBe(originalStart);
  });
});

describe('defaultPointerCaptureSession — full lifecycle', () => {
  it('begin → advance × N → commit produces correctly shifted range', () => {
    const config = REQUIRE_HIT;
    const txn0 = defaultPointerCaptureSession.beginBarDrag({
      barId: 'b1',
      originPx: { x: 480, y: 8 }, // bar starts at hour 8 of day view
      config,
      initialHit: true,
      startedAt: 1000,
    });
    expect(txn0).not.toBeNull();

    let txn = txn0!;
    txn = defaultPointerCaptureSession.advanceBarDrag(txn, {
      currentPx: { x: 500, y: 8 },
    });
    expect(txn.deltaX).toBe(20);
    txn = defaultPointerCaptureSession.advanceBarDrag(txn, {
      currentPx: { x: 540, y: 8 },
    });
    expect(txn.deltaX).toBe(60); // 1h shift at 60px/h

    const { resolvedRange, timeDeltaMs } = defaultPointerCaptureSession.commitBarDrag({
      txn,
      originalRange: {
        start: new Date('2026-05-13T08:00:00Z'),
        end: new Date('2026-05-13T10:00:00Z'),
      },
      pxPerMs: dayAxisPxPerMs,
    });
    expect(timeDeltaMs).toBe(MS_PER_HOUR);
    expect(resolvedRange.start.toISOString()).toBe('2026-05-13T09:00:00.000Z');
    expect(resolvedRange.end.toISOString()).toBe('2026-05-13T11:00:00.000Z');
  });

  it('rejection at begin short-circuits the lifecycle', () => {
    const txn = defaultPointerCaptureSession.beginBarDrag({
      barId: 'b1',
      originPx: { x: 0, y: 0 },
      config: REQUIRE_HIT,
      initialHit: false,
    });
    expect(txn).toBeNull();
    // Caller should NOT call advance/commit on null. Test ensures the
    // begin step is the only gate.
  });
});

describe('defaultPointerCaptureSession.beginProgressHandle', () => {
  it('returns a transaction with origin / initial-progress / bar-width pinned', () => {
    const txn = defaultPointerCaptureSession.beginProgressHandle({
      barId: 'b1',
      originPx: { x: 750, y: 8 },
      config: ALLOW_MISS, // progress-handle canonical config
      initialHit: false,
      initialProgress: 50,
      barWidth: 6060,
      startedAt: 1000,
    });
    expect(txn).not.toBeNull();
    expect(txn?.kind).toBe('progress-handle');
    expect(txn?.barId).toBe('b1');
    expect(txn?.originPx).toEqual({ x: 750, y: 8 });
    expect(txn?.initialProgress).toBe(50);
    expect(txn?.barWidth).toBe(6060);
    expect(txn?.projectedProgress).toBe(50); // starts at initialProgress
    expect(txn?.startedAt).toBe(1000);
  });

  it('honors requireInitialHit when set true', () => {
    const accepted = defaultPointerCaptureSession.beginProgressHandle({
      barId: 'b1',
      originPx: { x: 0, y: 0 },
      config: REQUIRE_HIT,
      initialHit: true,
      initialProgress: 50,
      barWidth: 6060,
    });
    expect(accepted).not.toBeNull();

    const rejected = defaultPointerCaptureSession.beginProgressHandle({
      barId: 'b1',
      originPx: { x: 0, y: 0 },
      config: REQUIRE_HIT,
      initialHit: false,
      initialProgress: 50,
      barWidth: 6060,
    });
    expect(rejected).toBeNull();
  });
});

describe('defaultPointerCaptureSession.advanceProgressHandle', () => {
  function startTxn(initialProgress = 50, barWidth = 6060) {
    return defaultPointerCaptureSession.beginProgressHandle({
      barId: 'b1',
      originPx: { x: 750, y: 8 },
      config: ALLOW_MISS,
      initialHit: false,
      initialProgress,
      barWidth,
      startedAt: 1000,
    })!;
  }

  it('right-drag adds (deltaX / barWidth × 100) to initialProgress', () => {
    const txn = startTxn();
    // 60.6px drag at barWidth 6060 → exactly +1%
    const advanced = defaultPointerCaptureSession.advanceProgressHandle(txn, {
      currentPx: { x: 750 + 60.6, y: 8 },
    });
    expect(advanced.projectedProgress).toBeCloseTo(51, 6);
  });

  it('left-drag subtracts (deltaX / barWidth × 100)', () => {
    const txn = startTxn();
    const advanced = defaultPointerCaptureSession.advanceProgressHandle(txn, {
      currentPx: { x: 750 - 60.6, y: 8 },
    });
    expect(advanced.projectedProgress).toBeCloseTo(49, 6);
  });

  it('projected value may fall outside [0, 100] mid-drag (clamping is at commit)', () => {
    const txn = startTxn(/* initialProgress */ 5, /* barWidth */ 100);
    // Drag −10px on a 100px bar → −10%. From initial 5 → projected −5.
    const advanced = defaultPointerCaptureSession.advanceProgressHandle(txn, {
      currentPx: { x: 740, y: 8 },
    });
    expect(advanced.projectedProgress).toBeCloseTo(-5, 6);
  });

  it('cumulative-from-origin (idempotent over a pointer-move trace)', () => {
    const txn = startTxn();
    const a = defaultPointerCaptureSession.advanceProgressHandle(txn, {
      currentPx: { x: 780, y: 8 },
    });
    const b = defaultPointerCaptureSession.advanceProgressHandle(a, {
      currentPx: { x: 810, y: 8 },
    });
    // Cumulative from origin 750: deltaX = 60, progressDelta = 60/6060*100 ≈ 0.99.
    expect(b.projectedProgress).toBeCloseTo(50 + (60 / 6060) * 100, 6);
  });

  it('zero barWidth holds projectedProgress at initialProgress (no divide-by-zero)', () => {
    const txn = startTxn(/* initialProgress */ 50, /* barWidth */ 0);
    const advanced = defaultPointerCaptureSession.advanceProgressHandle(txn, {
      currentPx: { x: 9999, y: 8 },
    });
    expect(advanced.projectedProgress).toBe(50);
  });
});

describe('defaultPointerCaptureSession.commitProgressHandle', () => {
  function dragged(initialProgress: number, barWidth: number, deltaX: number) {
    const txn = defaultPointerCaptureSession.beginProgressHandle({
      barId: 'b1',
      originPx: { x: 750, y: 8 },
      config: ALLOW_MISS,
      initialHit: false,
      initialProgress,
      barWidth,
      startedAt: 1000,
    })!;
    return defaultPointerCaptureSession.advanceProgressHandle(txn, {
      currentPx: { x: 750 + deltaX, y: 8 },
    });
  }

  it('clamps low values to 0', () => {
    const txn = dragged(5, 100, -10); // projected −5
    const { resolvedProgress } = defaultPointerCaptureSession.commitProgressHandle({ txn });
    expect(resolvedProgress).toBe(0);
  });

  it('clamps high values to 100', () => {
    const txn = dragged(95, 100, 10); // projected 105
    const { resolvedProgress } = defaultPointerCaptureSession.commitProgressHandle({ txn });
    expect(resolvedProgress).toBe(100);
  });

  it('passes through in-range values unchanged', () => {
    const txn = dragged(50, 100, 25); // projected 75
    const { resolvedProgress } = defaultPointerCaptureSession.commitProgressHandle({ txn });
    expect(resolvedProgress).toBeCloseTo(75, 6);
  });
});

describe('defaultPointerCaptureSession.beginBarResize', () => {
  it('returns a transaction with edge + origin pinned (start-edge)', () => {
    const txn = defaultPointerCaptureSession.beginBarResize({
      barId: 'b1',
      edge: 'start',
      originPx: { x: 480, y: 10 },
      config: REQUIRE_HIT,
      initialHit: true,
      startedAt: 1000,
    });
    expect(txn).not.toBeNull();
    expect(txn?.kind).toBe('bar-resize');
    expect(txn?.barId).toBe('b1');
    expect(txn?.edge).toBe('start');
    expect(txn?.originPx).toEqual({ x: 480, y: 10 });
    expect(txn?.deltaX).toBe(0);
    expect(txn?.startedAt).toBe(1000);
  });

  it('end-edge variant', () => {
    const txn = defaultPointerCaptureSession.beginBarResize({
      barId: 'b1',
      edge: 'end',
      originPx: { x: 1200, y: 10 },
      config: REQUIRE_HIT,
      initialHit: true,
    });
    expect(txn?.edge).toBe('end');
  });

  it('honors requireInitialHit', () => {
    expect(
      defaultPointerCaptureSession.beginBarResize({
        barId: 'b1',
        edge: 'start',
        originPx: { x: 0, y: 0 },
        config: REQUIRE_HIT,
        initialHit: false,
      }),
    ).toBeNull();
  });
});

describe('defaultPointerCaptureSession.advanceBarResize', () => {
  it('computes deltaX cumulative from origin', () => {
    const txn = defaultPointerCaptureSession.beginBarResize({
      barId: 'b1',
      edge: 'end',
      originPx: { x: 1200, y: 10 },
      config: REQUIRE_HIT,
      initialHit: true,
    })!;
    const a = defaultPointerCaptureSession.advanceBarResize(txn, {
      currentPx: { x: 1250, y: 10 },
    });
    expect(a.deltaX).toBe(50);
    const b = defaultPointerCaptureSession.advanceBarResize(a, {
      currentPx: { x: 1320, y: 10 },
    });
    expect(b.deltaX).toBe(120); // 1320 − 1200, NOT 1320 − 1250
  });

  it('negative deltas (shrink end-edge / extend start-edge left)', () => {
    const txn = defaultPointerCaptureSession.beginBarResize({
      barId: 'b1',
      edge: 'end',
      originPx: { x: 1200, y: 10 },
      config: REQUIRE_HIT,
      initialHit: true,
    })!;
    const a = defaultPointerCaptureSession.advanceBarResize(txn, {
      currentPx: { x: 1140, y: 10 },
    });
    expect(a.deltaX).toBe(-60);
  });
});

describe('defaultPointerCaptureSession.commitBarResize', () => {
  const baseRange = {
    start: new Date('2026-05-13T10:00:00Z'),
    end: new Date('2026-05-13T12:00:00Z'),
  };

  function resized(edge: 'start' | 'end', deltaX: number) {
    const txn = defaultPointerCaptureSession.beginBarResize({
      barId: 'b1',
      edge,
      originPx: { x: 0, y: 0 },
      config: REQUIRE_HIT,
      initialHit: true,
    })!;
    return defaultPointerCaptureSession.advanceBarResize(txn, {
      currentPx: { x: deltaX, y: 0 },
    });
  }

  it('start-edge resize shifts only start; end is unchanged', () => {
    const txn = resized('start', 60); // 60px → +1h at 60px/h
    const { resolvedRange, timeDeltaMs } = defaultPointerCaptureSession.commitBarResize({
      txn,
      originalRange: baseRange,
      pxPerMs: dayAxisPxPerMs,
    });
    expect(timeDeltaMs).toBe(MS_PER_HOUR);
    expect(resolvedRange.start.toISOString()).toBe('2026-05-13T11:00:00.000Z');
    expect(resolvedRange.end).toBe(baseRange.end); // same reference, unchanged
  });

  it('end-edge resize shifts only end; start is unchanged', () => {
    const txn = resized('end', 60);
    const { resolvedRange, timeDeltaMs } = defaultPointerCaptureSession.commitBarResize({
      txn,
      originalRange: baseRange,
      pxPerMs: dayAxisPxPerMs,
    });
    expect(timeDeltaMs).toBe(MS_PER_HOUR);
    expect(resolvedRange.start).toBe(baseRange.start);
    expect(resolvedRange.end.toISOString()).toBe('2026-05-13T13:00:00.000Z');
  });

  it('negative delta on start-edge extends the bar backward', () => {
    const txn = resized('start', -30); // 0.5h backward
    const { resolvedRange } = defaultPointerCaptureSession.commitBarResize({
      txn,
      originalRange: baseRange,
      pxPerMs: dayAxisPxPerMs,
    });
    expect(resolvedRange.start.toISOString()).toBe('2026-05-13T09:30:00.000Z');
    expect(resolvedRange.end).toBe(baseRange.end);
  });

  it('snap-to-grid rounds the delta — same semantic as BarDrag', () => {
    const txn = resized('end', 35); // raw 35min
    const { timeDeltaMs, resolvedRange } = defaultPointerCaptureSession.commitBarResize({
      txn,
      originalRange: baseRange,
      pxPerMs: dayAxisPxPerMs,
      snapDurationMs: 30 * 60 * 1000,
    });
    expect(timeDeltaMs).toBe(30 * 60 * 1000); // snap to 30min
    expect(resolvedRange.end.toISOString()).toBe('2026-05-13T12:30:00.000Z');
  });

  it('cross-over: start dragged past end produces start > end (caller must clamp/reject)', () => {
    // Bar is [10:00, 12:00]. Drag start +3h → start = 13:00 > end = 12:00.
    const txn = resized('start', 180); // 3h forward
    const { resolvedRange } = defaultPointerCaptureSession.commitBarResize({
      txn,
      originalRange: baseRange,
      pxPerMs: dayAxisPxPerMs,
    });
    expect(resolvedRange.start.toISOString()).toBe('2026-05-13T13:00:00.000Z');
    expect(resolvedRange.end.toISOString()).toBe('2026-05-13T12:00:00.000Z');
    expect(resolvedRange.start.getTime()).toBeGreaterThan(resolvedRange.end.getTime());
  });

  it('commit does not mutate the input range', () => {
    const original = {
      start: new Date('2026-05-13T10:00:00Z'),
      end: new Date('2026-05-13T12:00:00Z'),
    };
    const origStartMs = original.start.getTime();
    const txn = resized('end', 60);
    defaultPointerCaptureSession.commitBarResize({
      txn,
      originalRange: original,
      pxPerMs: dayAxisPxPerMs,
    });
    expect(original.start.getTime()).toBe(origStartMs);
  });
});

describe('defaultPointerCaptureSession — bar-resize full lifecycle', () => {
  it('begin → advance × N → commit shifts the chosen edge', () => {
    const txn0 = defaultPointerCaptureSession.beginBarResize({
      barId: 'b1',
      edge: 'end',
      originPx: { x: 1200, y: 10 },
      config: REQUIRE_HIT,
      initialHit: true,
      startedAt: 1000,
    });
    expect(txn0).not.toBeNull();

    let txn = txn0!;
    txn = defaultPointerCaptureSession.advanceBarResize(txn, {
      currentPx: { x: 1230, y: 10 },
    });
    txn = defaultPointerCaptureSession.advanceBarResize(txn, {
      currentPx: { x: 1290, y: 10 },
    });
    expect(txn.deltaX).toBe(90); // 1.5h shift

    const { resolvedRange } = defaultPointerCaptureSession.commitBarResize({
      txn,
      originalRange: {
        start: new Date('2026-05-13T08:00:00Z'),
        end: new Date('2026-05-13T10:00:00Z'),
      },
      pxPerMs: dayAxisPxPerMs,
    });
    expect(resolvedRange.end.toISOString()).toBe('2026-05-13T11:30:00.000Z');
  });
});

describe('defaultPointerCaptureSession — progress-handle full lifecycle', () => {
  it('reproduces the recorded progress-handle drag math: 60px/6060 + initial 50 → 50.99 (rounds to 51)', () => {
    // Numbers lifted from recordings/progress-handle-drag/log.json:
    //   pointer-down at viewport x=1241.796875
    //   pointer-up   at viewport x=1301.796875
    //   delta = 60. Bar (event-4, instance 17) width = 6060 px.
    //   Initial progress = 50 (from event source data).
    const txn0 = defaultPointerCaptureSession.beginProgressHandle({
      barId: 'event-4',
      originPx: { x: 1241.796875, y: 737.6875 },
      config: ALLOW_MISS,
      initialHit: false,
      initialProgress: 50,
      barWidth: 6060,
      startedAt: 1000,
    });
    expect(txn0).not.toBeNull();

    const txn = defaultPointerCaptureSession.advanceProgressHandle(txn0!, {
      currentPx: { x: 1301.796875, y: 737.6875 },
    });
    const { resolvedProgress } = defaultPointerCaptureSession.commitProgressHandle({ txn });

    expect(resolvedProgress).toBeCloseTo(50 + (60 / 6060) * 100, 6);
    expect(Math.round(resolvedProgress)).toBe(51); // matches recorded display text
  });
});
