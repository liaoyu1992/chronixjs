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

  it('y comes from the matching strip with default padding 2', () => {
    const { placedBars } = defaultBarPlacementPass.place({
      bars: [
        bar('b1', 'r1', '2026-05-13T00:00:00', '2026-05-13T01:00:00'),
        bar('b2', 'r2', '2026-05-13T00:00:00', '2026-05-13T01:00:00'),
        bar('b3', 'r3', '2026-05-13T00:00:00', '2026-05-13T01:00:00'),
      ],
      axis: dayAxis,
      strips: stripsLayout.strips,
    });

    expect(placedBars[0]?.y).toBe(0 + 2); // r1: y=0, padding=2
    expect(placedBars[1]?.y).toBe(30 + 2); // r2: y=30 (after r1's 30px height)
    expect(placedBars[2]?.y).toBe(60 + 2); // r3: y=60
  });

  it('height = strip.height - 2×padding', () => {
    const { placedBars } = defaultBarPlacementPass.place({
      bars: [
        bar('b1', 'r1', '2026-05-13T00:00:00', '2026-05-13T01:00:00'), // r1: 30-tall
        bar('b3', 'r3', '2026-05-13T00:00:00', '2026-05-13T01:00:00'), // r3: 50-tall
      ],
      axis: dayAxis,
      strips: stripsLayout.strips,
    });

    expect(placedBars[0]?.height).toBe(30 - 4); // 26
    expect(placedBars[1]?.height).toBe(50 - 4); // 46
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
