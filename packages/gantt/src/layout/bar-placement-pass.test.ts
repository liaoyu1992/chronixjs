import { describe, expect, it } from 'vitest';

import { defaultAxisRangePlanner } from './axis-range-planner.js';
import { defaultBarPlacementPass } from './bar-placement-pass.js';
import { defaultRowSwimlaneLayout } from './row-swimlane-layout.js';

import type { AxisRangePlanInput } from './types.js';
import type { BarSpec } from '../ir/index.js';

const axisInput: AxisRangePlanInput = {
  viewId: 'day',
  anchorDate: new Date('2026-05-13T08:00:00'),
  viewportWidth: 1200,
  locale: 'zh-CN',
  weekendsVisible: true,
};

const dayAxis = defaultAxisRangePlanner.plan(axisInput);

const stripsLayout = defaultRowSwimlaneLayout.layout({
  rows: [
    { id: 'r1', columns: {} },
    { id: 'r2', columns: {} },
    { id: 'r3', columns: {}, heightHint: 50 },
  ],
  defaultRowHeight: 30,
});

const bar = (id: string, rowId: string, startISO: string, endISO: string): BarSpec => ({
  id,
  rowId,
  range: { start: new Date(startISO), end: new Date(endISO) },
  dprIntent: 'crisp-pixel',
});

describe('defaultBarPlacementPass — happy path (day view)', () => {
  it('places a bar starting at axis start at x=0', () => {
    const { placedBars } = defaultBarPlacementPass.place({
      bars: [bar('b1', 'r1', '2026-05-13T00:00:00', '2026-05-13T01:00:00')],
      axis: dayAxis,
      strips: stripsLayout.strips,
    });

    expect(placedBars[0]?.x).toBe(0);
  });

  it('width equals duration × slotWidth (1 hour slot on day view)', () => {
    const { placedBars } = defaultBarPlacementPass.place({
      bars: [bar('b1', 'r1', '2026-05-13T00:00:00', '2026-05-13T01:00:00')],
      axis: dayAxis,
      strips: stripsLayout.strips,
    });

    expect(placedBars[0]?.width).toBe(dayAxis.slotWidth);
  });

  it('x at 8:00 = 8 hours × slotWidth', () => {
    const { placedBars } = defaultBarPlacementPass.place({
      bars: [bar('b1', 'r1', '2026-05-13T08:00:00', '2026-05-13T10:30:00')],
      axis: dayAxis,
      strips: stripsLayout.strips,
    });

    expect(placedBars[0]?.x).toBe(8 * dayAxis.slotWidth);
    expect(placedBars[0]?.width).toBe(2.5 * dayAxis.slotWidth); // 2h30m
  });

  it('y comes from the matching strip with default padding 4 (Phase 43: was 2 pre-symmetric-4+4 fix)', () => {
    const { placedBars } = defaultBarPlacementPass.place({
      bars: [
        bar('b1', 'r1', '2026-05-13T00:00:00', '2026-05-13T01:00:00'),
        bar('b2', 'r2', '2026-05-13T00:00:00', '2026-05-13T01:00:00'),
        bar('b3', 'r3', '2026-05-13T00:00:00', '2026-05-13T01:00:00'),
      ],
      axis: dayAxis,
      strips: stripsLayout.strips,
    });

    expect(placedBars[0]?.y).toBe(0 + 4); // r1: y=0, padding=4
    expect(placedBars[1]?.y).toBe(30 + 4); // r2: y=30 (after r1's 30px height)
    expect(placedBars[2]?.y).toBe(60 + 4); // r3: y=60
  });

  it('height = strip.height - 2×padding (Phase 43: 2×4 = 8 pre-bar-height inset)', () => {
    const { placedBars } = defaultBarPlacementPass.place({
      bars: [
        bar('b1', 'r1', '2026-05-13T00:00:00', '2026-05-13T01:00:00'), // r1: 30-tall
        bar('b3', 'r3', '2026-05-13T00:00:00', '2026-05-13T01:00:00'), // r3: 50-tall
      ],
      axis: dayAxis,
      strips: stripsLayout.strips,
    });

    expect(placedBars[0]?.height).toBe(30 - 8); // 22 = 30 − 2×4
    expect(placedBars[1]?.height).toBe(50 - 8); // 42 = 50 − 2×4
  });

  it('respects custom barVerticalPadding', () => {
    const { placedBars } = defaultBarPlacementPass.place({
      bars: [bar('b1', 'r1', '2026-05-13T00:00:00', '2026-05-13T01:00:00')],
      axis: dayAxis,
      strips: stripsLayout.strips,
      barVerticalPadding: 5,
    });

    expect(placedBars[0]?.y).toBe(0 + 5);
    expect(placedBars[0]?.height).toBe(30 - 10);
  });

  it('explicit barHeight overrides strip-derived height; padding still drives y', () => {
    // Reference mode: fixed bar height (eventMinHeight=30) + top padding 8.
    // Bar should be at strip.y + 8 with height 30, regardless of strip.height.
    const tallerStrips = defaultRowSwimlaneLayout.layout({
      rows: [{ id: 'r1', columns: {}, heightHint: 43 }],
      defaultRowHeight: 43,
    });
    const { placedBars } = defaultBarPlacementPass.place({
      bars: [bar('b1', 'r1', '2026-05-13T00:00:00', '2026-05-13T01:00:00')],
      axis: dayAxis,
      strips: tallerStrips.strips,
      barVerticalPadding: 8,
      barHeight: 30,
    });

    expect(placedBars[0]?.y).toBe(0 + 8);
    expect(placedBars[0]?.height).toBe(30); // strip is 43 tall but bar is fixed 30
  });
});

describe('defaultBarPlacementPass — edge cases', () => {
  it('records orphan when bar.rowId does not match any strip', () => {
    const out = defaultBarPlacementPass.place({
      bars: [bar('b1', 'no-such-row', '2026-05-13T00:00:00', '2026-05-13T01:00:00')],
      axis: dayAxis,
      strips: stripsLayout.strips,
    });

    expect(out.placedBars).toHaveLength(0);
    expect(out.orphanBarIds).toEqual(['b1']);
  });

  it('emits both placed and orphan results when input mixes them', () => {
    const out = defaultBarPlacementPass.place({
      bars: [
        bar('b1', 'r1', '2026-05-13T00:00:00', '2026-05-13T01:00:00'),
        bar('b2', 'no-such-row', '2026-05-13T00:00:00', '2026-05-13T01:00:00'),
        bar('b3', 'r2', '2026-05-13T00:00:00', '2026-05-13T01:00:00'),
      ],
      axis: dayAxis,
      strips: stripsLayout.strips,
    });

    expect(out.placedBars.map((p) => p.barId)).toEqual(['b1', 'b3']);
    expect(out.orphanBarIds).toEqual(['b2']);
  });

  it('places bars with negative x when start is before the axis range', () => {
    const { placedBars } = defaultBarPlacementPass.place({
      bars: [bar('b1', 'r1', '2026-05-12T22:00:00', '2026-05-13T02:00:00')],
      axis: dayAxis,
      strips: stripsLayout.strips,
    });

    expect(placedBars[0]?.x).toBe(-2 * dayAxis.slotWidth); // started 2h before axis
    expect(placedBars[0]?.width).toBe(4 * dayAxis.slotWidth); // 4h duration
  });

  it('returns empty output when input has no bars', () => {
    const out = defaultBarPlacementPass.place({
      bars: [],
      axis: dayAxis,
      strips: stripsLayout.strips,
    });

    expect(out.placedBars).toEqual([]);
    expect(out.orphanBarIds).toEqual([]);
  });
});

describe('defaultBarPlacementPass — week view (slot still = 1 hour)', () => {
  it('places a bar on Tuesday 09:00 — 33 hours past Mon midnight', () => {
    const weekAxis = defaultAxisRangePlanner.plan({ ...axisInput, viewId: 'week' });
    const { placedBars } = defaultBarPlacementPass.place({
      bars: [bar('b1', 'r1', '2026-05-12T09:00:00', '2026-05-12T11:00:00')],
      axis: weekAxis,
      strips: stripsLayout.strips,
    });

    // Mon 5/11 00:00 + 24h (Tue 5/12 00:00) + 9h (Tue 09:00) = 33h offset
    expect(placedBars[0]?.x).toBe(33 * weekAxis.slotWidth);
    expect(placedBars[0]?.width).toBe(2 * weekAxis.slotWidth);
  });
});

describe('defaultBarPlacementPass — month view (slot = 1 day)', () => {
  it('places a bar starting on May 15 — 14 days past May 1', () => {
    const monthAxis = defaultAxisRangePlanner.plan({ ...axisInput, viewId: 'month' });
    const { placedBars } = defaultBarPlacementPass.place({
      bars: [bar('b1', 'r1', '2026-05-15T00:00:00', '2026-05-17T00:00:00')],
      axis: monthAxis,
      strips: stripsLayout.strips,
    });

    expect(placedBars[0]?.x).toBe(14 * monthAxis.slotWidth); // 14 days × slotWidth
    expect(placedBars[0]?.width).toBe(2 * monthAxis.slotWidth); // 2-day duration
  });
});

describe('defaultBarPlacementPass — stack-level Y placement (Phase 30)', () => {
  // Build a single tall strip so Y arithmetic isn't clipped by strip
  // height. Strip y=0, height=200 — plenty of room for 3 stacked bars
  // at barHeight=30 + stackSpacing=10 (total 110 incl. padding).
  const tallStrip = defaultRowSwimlaneLayout.layout({
    rows: [{ id: 'r1', columns: {}, heightHint: 200 }],
    defaultRowHeight: 200,
  });

  it('places 2 overlapping same-row bars at distinct Y offsets when levelByBarId provided', () => {
    const { placedBars } = defaultBarPlacementPass.place({
      bars: [
        bar('b1', 'r1', '2026-05-13T00:00:00', '2026-05-13T05:00:00'),
        bar('b2', 'r1', '2026-05-13T03:00:00', '2026-05-13T08:00:00'),
      ],
      axis: dayAxis,
      strips: tallStrip.strips,
      barHeight: 30,
      barVerticalPadding: 8,
      barStackSpacing: 10,
      levelByBarId: new Map([
        ['b1', 0],
        ['b2', 1],
      ]),
    });

    // Level 0: y = strip.y + padding = 0 + 8 = 8
    // Level 1: y = 8 + 1 × (30 + 10) = 48
    expect(placedBars[0]?.y).toBe(8);
    expect(placedBars[1]?.y).toBe(48);
  });

  it('places 3 mutually-overlapping bars at level 0 / 1 / 2 with correct stack spacing', () => {
    const { placedBars } = defaultBarPlacementPass.place({
      bars: [
        bar('a', 'r1', '2026-05-13T00:00:00', '2026-05-13T05:00:00'),
        bar('b', 'r1', '2026-05-13T01:00:00', '2026-05-13T06:00:00'),
        bar('c', 'r1', '2026-05-13T02:00:00', '2026-05-13T07:00:00'),
      ],
      axis: dayAxis,
      strips: tallStrip.strips,
      barHeight: 30,
      barVerticalPadding: 8,
      barStackSpacing: 10,
      levelByBarId: new Map([
        ['a', 0],
        ['b', 1],
        ['c', 2],
      ]),
    });

    // Level 0: y = 8
    // Level 1: y = 8 + 40 = 48
    // Level 2: y = 8 + 80 = 88
    expect(placedBars[0]?.y).toBe(8);
    expect(placedBars[1]?.y).toBe(48);
    expect(placedBars[2]?.y).toBe(88);
  });

  it('non-overlapping same-row bars all stay at level 0 (Y = strip.y + padding) when levelByBarId is provided with all-zero levels', () => {
    const { placedBars } = defaultBarPlacementPass.place({
      bars: [
        bar('first', 'r1', '2026-05-13T00:00:00', '2026-05-13T02:00:00'),
        bar('second', 'r1', '2026-05-13T03:00:00', '2026-05-13T05:00:00'),
        bar('third', 'r1', '2026-05-13T06:00:00', '2026-05-13T08:00:00'),
      ],
      axis: dayAxis,
      strips: tallStrip.strips,
      barHeight: 30,
      barVerticalPadding: 8,
      barStackSpacing: 10,
      levelByBarId: new Map([
        ['first', 0],
        ['second', 0],
        ['third', 0],
      ]),
    });

    for (const placed of placedBars) {
      expect(placed.y).toBe(8);
    }
  });

  it('bars absent from levelByBarId default to level 0 (pre-Phase-30 behavior preserved)', () => {
    const { placedBars } = defaultBarPlacementPass.place({
      bars: [bar('lonely', 'r1', '2026-05-13T00:00:00', '2026-05-13T02:00:00')],
      axis: dayAxis,
      strips: tallStrip.strips,
      barHeight: 30,
      barVerticalPadding: 8,
      // levelByBarId omitted entirely → defaults level 0
    });

    expect(placedBars[0]?.y).toBe(8);
  });
});

describe('defaultBarPlacementPass — Phase 27 continuation flags', () => {
  // Day-view axis spans 2026-05-13T00:00 → 2026-05-14T00:00 (24h).
  // Bars whose range fits inside that window get isStart=true && isEnd=true;
  // bars starting before midnight get !isStart; bars ending past next
  // midnight get !isEnd. A bar spanning the entire axis window from
  // before-to-after gets BOTH !isStart && !isEnd.

  it('bar starting AT axis start (00:00) → isStart=true', () => {
    const { placedBars } = defaultBarPlacementPass.place({
      bars: [bar('at-start', 'r1', '2026-05-13T00:00:00', '2026-05-13T03:00:00')],
      axis: dayAxis,
      strips: stripsLayout.strips,
    });

    expect(placedBars[0]?.isStart).toBe(true);
  });

  it('bar starting before axis start (yesterday) → isStart=false', () => {
    const { placedBars } = defaultBarPlacementPass.place({
      bars: [bar('before-start', 'r1', '2026-05-12T20:00:00', '2026-05-13T03:00:00')],
      axis: dayAxis,
      strips: stripsLayout.strips,
    });

    expect(placedBars[0]?.isStart).toBe(false);
  });

  it('bar ending AT axis end (next-day midnight) → isEnd=true', () => {
    const { placedBars } = defaultBarPlacementPass.place({
      bars: [bar('at-end', 'r1', '2026-05-13T20:00:00', '2026-05-14T00:00:00')],
      axis: dayAxis,
      strips: stripsLayout.strips,
    });

    expect(placedBars[0]?.isEnd).toBe(true);
  });

  it('bar ending past axis end (tomorrow) → isEnd=false', () => {
    const { placedBars } = defaultBarPlacementPass.place({
      bars: [bar('past-end', 'r1', '2026-05-13T20:00:00', '2026-05-14T05:00:00')],
      axis: dayAxis,
      strips: stripsLayout.strips,
    });

    expect(placedBars[0]?.isEnd).toBe(false);
  });

  it('bar fully contained inside axis range → both isStart && isEnd are true', () => {
    const { placedBars } = defaultBarPlacementPass.place({
      bars: [bar('contained', 'r1', '2026-05-13T03:00:00', '2026-05-13T15:00:00')],
      axis: dayAxis,
      strips: stripsLayout.strips,
    });

    expect(placedBars[0]?.isStart).toBe(true);
    expect(placedBars[0]?.isEnd).toBe(true);
  });

  it('bar spanning the entire axis from before to after → BOTH isStart=false && isEnd=false', () => {
    const { placedBars } = defaultBarPlacementPass.place({
      bars: [bar('span-all', 'r1', '2026-05-10T00:00:00', '2026-05-20T00:00:00')],
      axis: dayAxis,
      strips: stripsLayout.strips,
    });

    expect(placedBars[0]?.isStart).toBe(false);
    expect(placedBars[0]?.isEnd).toBe(false);
  });

  it('bar entirely BEFORE axis range (yesterday) → both isStart && isEnd are true (no continuation indicator)', () => {
    // Bar starts AND ends before axisStartMs (2026-05-13T00:00:00).
    // It has no visible segment in the original spec; chronix
    // matches by flagging both isStart=true && isEnd=true so the
    // adapter render skips both triangles.
    const { placedBars } = defaultBarPlacementPass.place({
      bars: [bar('before-axis', 'r1', '2026-05-10T08:00:00', '2026-05-12T20:00:00')],
      axis: dayAxis,
      strips: stripsLayout.strips,
    });

    expect(placedBars[0]?.isStart).toBe(true);
    expect(placedBars[0]?.isEnd).toBe(true);
  });

  it('bar entirely AFTER axis range (next week) → both isStart && isEnd are true (no continuation indicator)', () => {
    // Bar starts AND ends after the day-view's next-day midnight end.
    // Same suppression rule as before-axis.
    const { placedBars } = defaultBarPlacementPass.place({
      bars: [bar('after-axis', 'r1', '2026-05-20T08:00:00', '2026-05-21T17:00:00')],
      axis: dayAxis,
      strips: stripsLayout.strips,
    });

    expect(placedBars[0]?.isStart).toBe(true);
    expect(placedBars[0]?.isEnd).toBe(true);
  });
});
