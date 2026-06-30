import { type AxisRangePlanInput, type HeaderCellArg, type RowSpec } from '@chronixjs/gantt';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChronixGantt } from './chronix-gantt.js';

const anchor = new Date('2026-05-13T00:00:00');
const rows: readonly RowSpec[] = [{ id: 'r1', columns: {} }];

const weekAxis: AxisRangePlanInput = {
  viewId: 'week',
  anchorDate: anchor,
  viewportWidth: 1440,
  locale: 'zh-CN',
  weekendsVisible: true,
};

describe('<ChronixGantt> headerCellClassNamesCallback (mirrors vue3)', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-13T08:00:00'));
  });

  afterEach(() => {
    warnSpy.mockRestore();
    vi.useRealTimers();
    cleanup();
  });

  it('no callback set → no extra classes beyond the built-in + day classes', () => {
    const { container } = render(<ChronixGantt bars={[]} rows={rows} axisInput={weekAxis} />);
    const dayCells = container.querySelectorAll('rect.cx-gantt-header-cell');
    for (const cell of Array.from(dayCells)) {
      for (const cls of Array.from(cell.classList)) {
        expect(cls.startsWith('cx-gantt-')).toBe(true);
      }
    }
  });

  it("callback returning array ['weekend'] adds class to matching cells", () => {
    const { container } = render(
      <ChronixGantt
        bars={[]}
        rows={rows}
        axisInput={weekAxis}
        headerCellClassNamesCallback={(arg: HeaderCellArg) =>
          arg.dayMeta?.dayId === 'sat' || arg.dayMeta?.dayId === 'sun' ? ['weekend'] : undefined
        }
      />,
    );
    const dayCells = container.querySelectorAll('rect.cx-gantt-header-cell');
    // Sat = index 5, Sun = index 6 (week starts Mon).
    expect(dayCells[5]!.classList.contains('weekend')).toBe(true);
    expect(dayCells[6]!.classList.contains('weekend')).toBe(true);
    expect(dayCells[0]!.classList.contains('weekend')).toBe(false);
    expect(dayCells[2]!.classList.contains('weekend')).toBe(false);
  });

  it('callback returning a single string wraps to a single-class append', () => {
    const { container } = render(
      <ChronixGantt
        bars={[]}
        rows={rows}
        axisInput={weekAxis}
        headerCellClassNamesCallback={() => 'all-bands'}
      />,
    );
    // Fires for outer band cells AND for tick labels.
    const dayCells = container.querySelectorAll('rect.cx-gantt-header-cell');
    for (const cell of Array.from(dayCells)) {
      expect(cell.classList.contains('all-bands')).toBe(true);
    }
    const tickLabels = container.querySelectorAll('text.cx-gantt-tick-label');
    for (const label of Array.from(tickLabels)) {
      expect(label.classList.contains('all-bands')).toBe(true);
    }
  });

  it('callback returning undefined leaves cells with only the default + day classes', () => {
    const { container } = render(
      <ChronixGantt
        bars={[]}
        rows={rows}
        axisInput={weekAxis}
        headerCellClassNamesCallback={() => undefined}
      />,
    );
    const dayCells = container.querySelectorAll('rect.cx-gantt-header-cell');
    for (const cell of Array.from(dayCells)) {
      for (const cls of Array.from(cell.classList)) {
        expect(cls.startsWith('cx-gantt-')).toBe(true);
      }
    }
  });

  it('callback receives HeaderCellArg with correct bandIndex / cellIndex / date / dayMeta', () => {
    const calls: HeaderCellArg[] = [];
    render(
      <ChronixGantt
        bars={[]}
        rows={rows}
        axisInput={weekAxis}
        headerCellClassNamesCallback={(arg: HeaderCellArg) => {
          calls.push(arg);
          return undefined;
        }}
      />,
    );
    // Outer band has 7 cells (bandIndex=1) + tick row has 168 hourly ticks (bandIndex=0)
    // = 175 total invocations.
    expect(calls.length).toBe(7 + 168);
    const bandCalls = calls.filter((c) => c.bandIndex === 1);
    expect(bandCalls.length).toBe(7);
    expect(bandCalls[0]!.cellIndex).toBe(0);
    expect(bandCalls[0]!.dayMeta?.dayId).toBe('mon');
    expect(bandCalls[0]!.date).toBeInstanceOf(Date);
    expect(bandCalls[2]!.dayMeta?.isToday).toBe(true);
    const tickCalls = calls.filter((c) => c.bandIndex === 0);
    expect(tickCalls.length).toBe(168);
    expect(tickCalls[0]!.dayMeta).toBeUndefined();
  });
});
