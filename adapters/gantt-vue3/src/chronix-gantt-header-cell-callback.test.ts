import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChronixGantt } from './chronix-gantt.js';

import type { AxisRangePlanInput, HeaderCellArg, RowSpec } from '@chronixjs/gantt';

const anchor = new Date('2026-05-13T00:00:00');
const rows: readonly RowSpec[] = [{ id: 'r1', columns: {} }];

const weekAxis: AxisRangePlanInput = {
  viewId: 'week',
  anchorDate: anchor,
  viewportWidth: 1440,
  locale: 'zh-CN',
  weekendsVisible: true,
};

describe('<ChronixGantt> headerCellClassNamesCallback', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-13T08:00:00'));
  });

  afterEach(() => {
    warnSpy.mockRestore();
    vi.useRealTimers();
  });

  it('no callback set → no extra classes beyond the built-in + day classes', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput: weekAxis },
    });
    const dayCells = wrapper.findAll('rect.cx-gantt-header-cell');
    for (const cell of dayCells) {
      const classes = cell.classes();
      // Each cell carries only base + day classes (cx-gantt-header-cell + cx-gantt-day* family).
      // No consumer-supplied class names.
      for (const cls of classes) {
        expect(cls.startsWith('cx-gantt-')).toBe(true);
      }
    }
  });

  it("callback returning array ['weekend'] adds class to matching cells", () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [],
        rows,
        axisInput: weekAxis,
        headerCellClassNamesCallback: (arg: HeaderCellArg) =>
          arg.dayMeta?.dayId === 'sat' || arg.dayMeta?.dayId === 'sun' ? ['weekend'] : undefined,
      },
    });
    const dayCells = wrapper.findAll('rect.cx-gantt-header-cell');
    // Sat = index 5, Sun = index 6 (week starts Mon).
    expect(dayCells[5]!.classes()).toContain('weekend');
    expect(dayCells[6]!.classes()).toContain('weekend');
    // Other day cells lack the extra class.
    expect(dayCells[0]!.classes()).not.toContain('weekend');
    expect(dayCells[2]!.classes()).not.toContain('weekend');
  });

  it('callback returning a single string wraps to a single-class append', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [],
        rows,
        axisInput: weekAxis,
        headerCellClassNamesCallback: () => 'all-bands',
      },
    });
    // Fires for outer band cells AND for tick labels — both should pick up the class.
    const dayCells = wrapper.findAll('rect.cx-gantt-header-cell');
    for (const cell of dayCells) {
      expect(cell.classes()).toContain('all-bands');
    }
    const tickLabels = wrapper.findAll('text.cx-gantt-tick-label');
    for (const label of tickLabels) {
      expect(label.classes()).toContain('all-bands');
    }
  });

  it('callback returning undefined leaves cells with only the default + day classes', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [],
        rows,
        axisInput: weekAxis,
        headerCellClassNamesCallback: () => undefined,
      },
    });
    const dayCells = wrapper.findAll('rect.cx-gantt-header-cell');
    for (const cell of dayCells) {
      for (const cls of cell.classes()) {
        expect(cls.startsWith('cx-gantt-')).toBe(true);
      }
    }
  });

  it('callback receives HeaderCellArg with correct bandIndex / cellIndex / date / dayMeta', () => {
    const calls: HeaderCellArg[] = [];
    mount(ChronixGantt, {
      props: {
        bars: [],
        rows,
        axisInput: weekAxis,
        headerCellClassNamesCallback: (arg: HeaderCellArg) => {
          calls.push(arg);
          return undefined;
        },
      },
    });
    // Outer band has 7 cells (bandIndex=1) + tick row has 168 ticks (bandIndex=0)
    // = 175 total invocations.
    expect(calls.length).toBe(7 + 168);
    // Outer band cells (bandIndex=1) come first per the render order.
    const bandCalls = calls.filter((c) => c.bandIndex === 1);
    expect(bandCalls.length).toBe(7);
    // First band cell is Monday — day-eligible.
    expect(bandCalls[0]!.cellIndex).toBe(0);
    expect(bandCalls[0]!.dayMeta?.dayId).toBe('mon');
    expect(bandCalls[0]!.date).toBeInstanceOf(Date);
    // Third band cell is Wednesday = today.
    expect(bandCalls[2]!.dayMeta?.isToday).toBe(true);
    // Tick row calls have bandIndex=0; for week view they're hourly so dayMeta is undefined.
    const tickCalls = calls.filter((c) => c.bandIndex === 0);
    expect(tickCalls.length).toBe(168);
    expect(tickCalls[0]!.dayMeta).toBeUndefined();
  });
});
