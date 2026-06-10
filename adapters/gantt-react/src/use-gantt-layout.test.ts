import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useGanttLayout, type UseGanttLayoutInput } from './use-gantt-layout.js';

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

describe('useGanttLayout (react hook port)', () => {
  it('runs all four passes and exposes axis / strips / placedBars / contentSize', () => {
    const bars: readonly BarSpec[] = [bar('b1', 'r1', 8, 12), bar('b2', 'r2', 9, 11)];
    const { result } = renderHook(() =>
      useGanttLayout({ bars, rows: rowsBase, axisInput: makeDayAxis() }),
    );

    expect(result.current.axis.viewId).toBe('day');
    expect(result.current.axis.slotCount).toBe(24);
    expect(result.current.strips).toHaveLength(2);
    expect(result.current.placedBars).toHaveLength(2);
    expect(result.current.contentSize.width).toBe(result.current.axis.totalWidth);
    expect(result.current.contentSize.height).toBe(
      result.current.strips[1]!.y + result.current.strips[1]!.height,
    );
  });

  it('places bars with widths proportional to their time duration at the day-axis pxPerMs', () => {
    const bars: readonly BarSpec[] = [bar('b1', 'r1', 8, 12)]; // 4-hour bar
    const { result } = renderHook(() =>
      useGanttLayout({ bars, rows: rowsBase, axisInput: makeDayAxis() }),
    );

    // Day view at viewportWidth 1440 has slotWidth=60, slotDuration=1h.
    // 4 hours × 60 px/h = 240 px expected width.
    const placed = result.current.placedBars[0]!;
    expect(placed.width).toBeCloseTo(240, 5);
    expect(placed.x).toBeCloseTo(8 * 60, 5); // bar starts at hour 8
    // Phase 43 defaults: barHeight=30, barVerticalPadding=4,
    // rowSpacing=1 → strip 0 starts at y=0, bar y = 0 + 4 = 4.
    expect(placed.y).toBe(4);
    expect(placed.height).toBe(30);
    expect(result.current.axis.slotWidth).toBe(60);
  });

  it('recomputes when bars prop changes (rerender with new array identity)', () => {
    const initialBars: readonly BarSpec[] = [bar('b1', 'r1', 8, 12)];
    const { result, rerender } = renderHook<
      ReturnType<typeof useGanttLayout>,
      { input: UseGanttLayoutInput }
    >(({ input }) => useGanttLayout(input), {
      initialProps: { input: { bars: initialBars, rows: rowsBase, axisInput: makeDayAxis() } },
    });
    expect(result.current.placedBars).toHaveLength(1);

    const updatedBars: readonly BarSpec[] = [...initialBars, bar('b2', 'r2', 10, 14)];
    rerender({ input: { bars: updatedBars, rows: rowsBase, axisInput: makeDayAxis() } });
    expect(result.current.placedBars).toHaveLength(2);
    expect(result.current.placedBars[1]?.barId).toBe('b2');
  });

  it('empty bars array yields empty placedBars and strips matching rows', () => {
    const { result } = renderHook(() =>
      useGanttLayout({ bars: [], rows: rowsBase, axisInput: makeDayAxis() }),
    );

    expect(result.current.placedBars).toHaveLength(0);
    expect(result.current.strips).toHaveLength(2);
    // Empty bars → contentSize.height equals sum of strips + rowSpacing.
    expect(result.current.contentSize.height).toBe(
      result.current.strips[1]!.y + result.current.strips[1]!.height,
    );
  });

  it('barHeight override propagates to each placed bar', () => {
    const bars: readonly BarSpec[] = [bar('b1', 'r1', 8, 12)];
    const { result } = renderHook(() =>
      useGanttLayout({ bars, rows: rowsBase, axisInput: makeDayAxis(), barHeight: 50 }),
    );

    expect(result.current.placedBars[0]?.height).toBe(50);
  });

  it('axisInput.viewId switch from day to week recomputes axis + placedBars positions', () => {
    const bars: readonly BarSpec[] = [bar('b1', 'r1', 8, 12)];
    const dayAxisInput = makeDayAxis();
    const weekAxisInput: AxisRangePlanInput = { ...dayAxisInput, viewId: 'week' };

    const { result, rerender } = renderHook<
      ReturnType<typeof useGanttLayout>,
      { input: UseGanttLayoutInput }
    >(({ input }) => useGanttLayout(input), {
      initialProps: { input: { bars, rows: rowsBase, axisInput: dayAxisInput } },
    });
    const dayX = result.current.placedBars[0]?.x;
    expect(result.current.axis.viewId).toBe('day');

    rerender({ input: { bars, rows: rowsBase, axisInput: weekAxisInput } });
    expect(result.current.axis.viewId).toBe('week');
    // Week-view slotWidth ≠ day-view's, so x must shift.
    expect(result.current.placedBars[0]?.x).not.toBe(dayX);
  });

  it('Phase 30 stacking: same-row overlapping bars distribute across stack levels with 10px spacing', () => {
    // Phase 43: two bars on r1 with overlapping ranges → level 0 (y=4) and level 1
    // (y=4 + barHeight=30 + barStackSpacing=5 = 39).
    const bars: readonly BarSpec[] = [bar('b1', 'r1', 8, 12), bar('b2', 'r1', 10, 14)];
    const { result } = renderHook(() =>
      useGanttLayout({ bars, rows: rowsBase, axisInput: makeDayAxis() }),
    );

    const [first, second] = result.current.placedBars;
    expect(first?.barId).toBe('b1');
    expect(first?.y).toBe(4); // Phase 43: level 0 with new barVerticalPadding default
    expect(second?.barId).toBe('b2');
    expect(second?.y).toBe(39); // Phase 43: 4 + 30 + 5
  });

  it('contentSize.width equals axis.totalWidth and height equals last-strip bottom', () => {
    const bars: readonly BarSpec[] = [];
    const { result } = renderHook(() =>
      useGanttLayout({ bars, rows: rowsBase, axisInput: makeDayAxis() }),
    );

    expect(result.current.contentSize.width).toBe(result.current.axis.totalWidth);
    expect(result.current.contentSize.height).toBe(
      result.current.strips[1]!.y + result.current.strips[1]!.height,
    );
  });
});
