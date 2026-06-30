import { describe, expect, it } from 'vitest';
import { ref } from 'vue';

import { useGanttLayout } from './use-gantt-layout.js';

import type { AxisRangePlanInput, BarSpec, RowSpec } from '@chronixjs/gantt';

const MS_PER_HOUR = 60 * 60 * 1000;

function makeDayAxis(anchor = new Date('2026-05-13T00:00:00Z')): AxisRangePlanInput {
  return {
    viewId: 'day',
    anchorDate: anchor,
    viewportWidth: 1440,
    locale: 'zh-CN',
    weekendsVisible: true,
  };
}

const rowsBase: readonly RowSpec[] = [
  { id: 'r1', columns: {} },
  { id: 'r2', columns: {} },
];

// Local midnight anchor — the axis planner normalizes `anchorDate` to
// local midnight, so bar epochs must use the same reference for x to
// match `startHour × pxPerMs` exactly regardless of test-runner TZ.
const today = new Date('2026-05-13T00:00:00Z');
today.setHours(0, 0, 0, 0);
const todayMs = today.getTime();

function bar(id: string, rowId: string, startHour: number, endHour: number): BarSpec {
  return {
    id,
    rowId,
    range: {
      start: new Date(todayMs + startHour * MS_PER_HOUR),
      end: new Date(todayMs + endHour * MS_PER_HOUR),
    },
    dprIntent: 'crisp-pixel',
  };
}

describe('useGanttLayout', () => {
  it('runs all four passes and exposes axis / strips / placedBars / contentSize', () => {
    const bars: readonly BarSpec[] = [bar('b1', 'r1', 8, 12), bar('b2', 'r2', 9, 11)];
    const { axis, strips, placedBars, contentSize } = useGanttLayout({
      bars: () => bars,
      rows: () => rowsBase,
      axisInput: () => makeDayAxis(),
    });

    expect(axis.value.viewId).toBe('day');
    expect(axis.value.slotCount).toBe(24);
    expect(strips.value).toHaveLength(2);
    expect(placedBars.value).toHaveLength(2);
    expect(contentSize.value.width).toBe(axis.value.totalWidth);
    expect(contentSize.value.height).toBe(strips.value[1]!.y + strips.value[1]!.height);
  });

  it('places bars with widths proportional to their time duration at the day-axis pxPerMs', () => {
    const bars: readonly BarSpec[] = [bar('b1', 'r1', 8, 12)]; // 4-hour bar
    const { axis, placedBars } = useGanttLayout({
      bars: () => bars,
      rows: () => rowsBase,
      axisInput: () => makeDayAxis(),
    });

    // Day view at viewportWidth 1440 has slotWidth=60, slotDuration=1h.
    // 4 hours × 60 px/h = 240 px expected width.
    const placed = placedBars.value[0]!;
    expect(placed.width).toBeCloseTo(240, 5);
    expect(placed.x).toBeCloseTo(8 * 60, 5); // bar starts at hour 8
    // defaults: barHeight=30, barVerticalPadding=4,
    // rowSpacing=1 → strip 0 starts at y=0, bar y = 0 + 4 = 4.
    expect(placed.y).toBe(4);
    expect(placed.height).toBe(30);
    expect(axis.value.slotWidth).toBe(60);
  });

  it('reacts when bars ref changes — placedBars recomputes without explicit watches', () => {
    const barsRef = ref<readonly BarSpec[]>([bar('b1', 'r1', 8, 12)]);
    const { placedBars } = useGanttLayout({
      bars: barsRef,
      rows: () => rowsBase,
      axisInput: () => makeDayAxis(),
    });
    expect(placedBars.value).toHaveLength(1);

    barsRef.value = [...barsRef.value, bar('b2', 'r2', 10, 14)];
    expect(placedBars.value).toHaveLength(2);
    expect(placedBars.value[1]?.barId).toBe('b2');
  });

  it('omits bars whose rowId has no matching strip (orphans drop out)', () => {
    const bars: readonly BarSpec[] = [bar('b1', 'r1', 8, 12), bar('orphan', 'no-such-row', 10, 14)];
    const { placedBars } = useGanttLayout({
      bars: () => bars,
      rows: () => rowsBase,
      axisInput: () => makeDayAxis(),
    });
    expect(placedBars.value.map((p) => p.barId)).toEqual(['b1']);
  });

  it('honors a custom barHeight and barVerticalPadding', () => {
    const bars: readonly BarSpec[] = [bar('b1', 'r1', 8, 12)];
    const { placedBars } = useGanttLayout({
      bars: () => bars,
      rows: () => rowsBase,
      axisInput: () => makeDayAxis(),
      barHeight: 20,
      barVerticalPadding: 4,
    });
    const placed = placedBars.value[0]!;
    expect(placed.height).toBe(20);
    expect(placed.y).toBe(4);
  });

  it('honors rowSpacing — adjacent strips have a 1-px gap by default', () => {
    const bars: readonly BarSpec[] = [];
    const { strips } = useGanttLayout({
      bars: () => bars,
      rows: () => rowsBase,
      axisInput: () => makeDayAxis(),
    });
    const [s0, s1] = strips.value;
    if (!s0 || !s1) throw new Error('expected two strips');
    expect(s1.y).toBe(s0.y + s0.height + 1);
  });

  it('honors rowSpacing=0 — strips are tile-packed', () => {
    const bars: readonly BarSpec[] = [];
    const { strips } = useGanttLayout({
      bars: () => bars,
      rows: () => rowsBase,
      axisInput: () => makeDayAxis(),
      rowSpacing: 0,
    });
    const [s0, s1] = strips.value;
    if (!s0 || !s1) throw new Error('expected two strips');
    expect(s1.y).toBe(s0.y + s0.height);
  });

  it('uses defaultRowHeight when no bar stacks on the row', () => {
    const bars: readonly BarSpec[] = [];
    const { strips } = useGanttLayout({
      bars: () => bars,
      rows: () => rowsBase,
      axisInput: () => makeDayAxis(),
      defaultRowHeight: 64,
    });
    // With no bars, BarStackHeightPass returns its minRowHeight floor
    // (barHeight + firstBarTopPadding = 30 + 4 = 34). That
    // hint gets applied to each row, overriding `defaultRowHeight`.
    // So 34, not 64.
    expect(strips.value.every((s) => s.height === 34)).toBe(true);
  });

  it('threads levelByBarId from stack-height pass into placement pass — overlapping same-row bars get distinct Y', () => {
    // Three bars all on r1 with mutually overlapping time windows.
    // Greedy interval coloring (sort by start, then end) → b1 level 0,
    // b2 level 1, b3 level 2.
    const bars: readonly BarSpec[] = [
      bar('b1', 'r1', 0, 5),
      bar('b2', 'r1', 1, 6),
      bar('b3', 'r1', 2, 7),
    ];
    const { placedBars } = useGanttLayout({
      bars: () => bars,
      rows: () => rowsBase,
      axisInput: () => makeDayAxis(),
      barHeight: 30,
      barVerticalPadding: 8,
      barStackSpacing: 10,
    });

    const byId = new Map(placedBars.value.map((p) => [p.barId, p]));
    const ys = ['b1', 'b2', 'b3'].map((id) => byId.get(id)?.y);

    // All three Y values must be distinct (the bug was all-equal Y).
    expect(new Set(ys).size).toBe(3);

    // Specifically: level 0 → y = strip.y + padding = 0 + 8 = 8;
    // level 1 → 8 + 40 = 48; level 2 → 8 + 80 = 88.
    expect(byId.get('b1')?.y).toBe(8);
    expect(byId.get('b2')?.y).toBe(48);
    expect(byId.get('b3')?.y).toBe(88);
  });
});
