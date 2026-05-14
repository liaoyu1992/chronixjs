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
