import { describe, expect, it } from 'vitest';

import { hitTestFromClient } from './hit-test-from-client.js';

import type { PlannedAxis, SwimlaneStrip } from '../layout/types.js';

const MS_PER_HOUR = 60 * 60 * 1000;
const todayMs = (() => {
  const d = new Date('2026-05-13T00:00:00Z');
  d.setHours(0, 0, 0, 0);
  return d.getTime();
})();

// Day view axis: 24 ticks at 60px/hour, anchored at midnight.
function dayAxis(): PlannedAxis {
  const ticks = Array.from({ length: 24 }, (_, i) => ({
    time: new Date(todayMs + i * MS_PER_HOUR),
    x: i * 60,
  }));
  return {
    viewId: 'day',
    slotDurationMs: MS_PER_HOUR,
    slotWidth: 60,
    totalWidth: 24 * 60,
    ticks,
    headerRows: [],
    weekendDayIndexes: [],
  } as unknown as PlannedAxis;
}

// 3 strips: r1 at y=0..40, r2 at y=40..80, r3 at y=80..120.
const strips: readonly SwimlaneStrip[] = [
  { rowId: 'r1', y: 0, height: 40 },
  { rowId: 'r2', y: 40, height: 40 },
  { rowId: 'r3', y: 80, height: 40 },
];

// Body rect at (100, 50) in page coords — common case where the chart
// pane is offset from the page origin by sidebar / header.
const bodyRect = { left: 100, top: 50 };

describe('hitTestFromClient', () => {
  it('happy path: client coords inside body + valid strip → {time, rowId}', () => {
    // clientX 220 → contentX = 220 - 100 + 0 = 120 → 2h after midnight.
    // clientY 110 → contentY = 110 - 50 + 0 = 60 → strip r2 (40..80).
    const result = hitTestFromClient({
      clientX: 220,
      clientY: 110,
      bodyRect,
      scrollLeft: 0,
      scrollTop: 0,
      axis: dayAxis(),
      strips,
    });
    expect(result).not.toBeNull();
    expect(result!.rowId).toBe('r2');
    expect(result!.time.getTime()).toBe(todayMs + 2 * MS_PER_HOUR);
  });

  it('returns null when clientX is left of bodyRect.left', () => {
    const result = hitTestFromClient({
      clientX: 50, // < bodyRect.left = 100 → contentX = -50
      clientY: 110,
      bodyRect,
      scrollLeft: 0,
      scrollTop: 0,
      axis: dayAxis(),
      strips,
    });
    expect(result).toBeNull();
  });

  it('returns null when clientY is above bodyRect.top', () => {
    const result = hitTestFromClient({
      clientX: 220,
      clientY: 20, // < bodyRect.top = 50 → contentY = -30
      bodyRect,
      scrollLeft: 0,
      scrollTop: 0,
      axis: dayAxis(),
      strips,
    });
    expect(result).toBeNull();
  });

  it('returns null when clientY falls below the last strip', () => {
    // contentY = 250 - 50 = 200; strips end at y=120 → no owner.
    const result = hitTestFromClient({
      clientX: 220,
      clientY: 250,
      bodyRect,
      scrollLeft: 0,
      scrollTop: 0,
      axis: dayAxis(),
      strips,
    });
    expect(result).toBeNull();
  });

  it('honors scrollLeft + scrollTop when transforming client → content coords', () => {
    // scrollLeft 300 means content origin is 300px to the left of bodyRect.left
    // in the OPPOSITE direction — the visible content starts at contentX = 300.
    // clientX 220 → contentX = 220 - 100 + 300 = 420 → 7h after midnight.
    // clientY 110 + scrollTop 40 → contentY = 110 - 50 + 40 = 100 → strip r3.
    const result = hitTestFromClient({
      clientX: 220,
      clientY: 110,
      bodyRect,
      scrollLeft: 300,
      scrollTop: 40,
      axis: dayAxis(),
      strips,
    });
    expect(result).not.toBeNull();
    expect(result!.rowId).toBe('r3');
    expect(result!.time.getTime()).toBe(todayMs + 7 * MS_PER_HOUR);
  });

  it('returns null when the axis has no ticks (xToTime returns NaN-Date)', () => {
    const emptyAxis = { ...dayAxis(), ticks: [] } as unknown as PlannedAxis;
    const result = hitTestFromClient({
      clientX: 220,
      clientY: 110,
      bodyRect,
      scrollLeft: 0,
      scrollTop: 0,
      axis: emptyAxis,
      strips,
    });
    expect(result).toBeNull();
  });

  it('returns null when client point falls in an inter-strip gap', () => {
    // 1-px gap between strips: r1 ends at y=40, r2 starts at y=40 (closed-
    // open: y=40 belongs to r2, not r1). So a gap-test requires holes in
    // the strips array.
    const gappedStrips: readonly SwimlaneStrip[] = [
      { rowId: 'r1', y: 0, height: 40 },
      // gap 40..45
      { rowId: 'r2', y: 45, height: 40 },
    ];
    // contentY = 92 - 50 = 42 → in the 40..45 gap.
    const result = hitTestFromClient({
      clientX: 220,
      clientY: 92,
      bodyRect,
      scrollLeft: 0,
      scrollTop: 0,
      axis: dayAxis(),
      strips: gappedStrips,
    });
    expect(result).toBeNull();
  });
});
