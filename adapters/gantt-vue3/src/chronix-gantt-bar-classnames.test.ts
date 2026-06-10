import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChronixGantt } from './chronix-gantt.js';

import type { AxisRangePlanInput, BarSpec, RowSpec } from '@chronixjs/gantt';

const MS_PER_HOUR = 60 * 60 * 1000;
const anchor = new Date('2026-05-13T00:00:00');
const rows: readonly RowSpec[] = [{ id: 'r1', columns: {} }];

function bar(id: string, startHourOffset: number, endHourOffset: number): BarSpec {
  return {
    id,
    rowId: 'r1',
    range: {
      start: new Date(anchor.getTime() + startHourOffset * MS_PER_HOUR),
      end: new Date(anchor.getTime() + endHourOffset * MS_PER_HOUR),
    },
    dprIntent: 'crisp-pixel',
  };
}

const axisInput: AxisRangePlanInput = {
  viewId: 'day',
  anchorDate: anchor,
  viewportWidth: 1440,
  locale: 'zh-CN',
  weekendsVisible: true,
};

describe('<ChronixGantt> barClassNamesCallback — Phase 28.3', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('omits extra classes when no callback set (default render only)', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [bar('a', 0, 4)], rows, axisInput },
    });
    const rect = wrapper.find('rect[data-bar-id="a"].cx-gantt-bar');
    expect(rect.exists()).toBe(true);
    // Class list should contain the built-in class + Phase 44 state
    // modifiers (--start + --end for a fully-in-axis bar). No
    // callback-supplied classes.
    expect(rect.classes().sort()).toEqual([
      'cx-gantt-bar',
      'cx-gantt-bar--end',
      'cx-gantt-bar--start',
    ]);
  });

  it('appends a single-string return as one class on the bar rect', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('a', 0, 4)],
        rows,
        axisInput,
        barClassNamesCallback: () => 'priority-high',
      },
    });
    const rect = wrapper.find('rect[data-bar-id="a"].cx-gantt-bar');
    expect(rect.classes().sort()).toEqual([
      'cx-gantt-bar',
      'cx-gantt-bar--end',
      'cx-gantt-bar--start',
      'priority-high',
    ]);
  });

  it('appends an array return verbatim to the class list', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('a', 0, 4)],
        rows,
        axisInput,
        barClassNamesCallback: () => ['warn', 'overdue'],
      },
    });
    const rect = wrapper.find('rect[data-bar-id="a"].cx-gantt-bar');
    expect(rect.classes().sort()).toEqual([
      'cx-gantt-bar',
      'cx-gantt-bar--end',
      'cx-gantt-bar--start',
      'overdue',
      'warn',
    ]);
  });

  it('undefined return leaves the bar rect with only default classes', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('a', 0, 4)],
        rows,
        axisInput,
        barClassNamesCallback: () => undefined,
      },
    });
    const rect = wrapper.find('rect[data-bar-id="a"].cx-gantt-bar');
    expect(rect.classes().sort()).toEqual([
      'cx-gantt-bar',
      'cx-gantt-bar--end',
      'cx-gantt-bar--start',
    ]);
  });

  it('custom classes coexist with cx-gantt-bar--selected modifier', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('a', 0, 4)],
        rows,
        axisInput,
        selectedBarIds: ['a'],
        barClassNamesCallback: () => 'priority-high',
      },
    });
    const rect = wrapper.find('rect[data-bar-id="a"].cx-gantt-bar');
    expect(rect.classes().sort()).toEqual([
      'cx-gantt-bar',
      'cx-gantt-bar--end',
      'cx-gantt-bar--selected',
      'cx-gantt-bar--start',
      'priority-high',
    ]);
  });

  it('does NOT propagate custom classes to selection-border / resize-zone / dot rects', () => {
    // Selection visuals (Phase 28.1) emit as separate sibling rects
    // with their own stable cx-gantt-bar-* modifier classes. The
    // callback's return applies ONLY to the main `.cx-gantt-bar`.
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('a', 0, 4)],
        rows,
        axisInput,
        editable: true,
        selectedBarIds: ['a'],
        barClassNamesCallback: () => 'priority-high',
      },
    });
    // The main bar rect has the custom class.
    const mainBar = wrapper.find('rect[data-bar-id="a"].cx-gantt-bar');
    expect(mainBar.classes()).toContain('priority-high');
    // The selection-border / resize-zones / dots do NOT.
    const selBorder = wrapper.find('rect.cx-gantt-bar-selection-border');
    expect(selBorder.classes()).not.toContain('priority-high');
    const startZone = wrapper.find('rect.cx-gantt-bar-resizer-start');
    expect(startZone.classes()).not.toContain('priority-high');
    const startDot = wrapper.find('rect.cx-gantt-bar-resizer-dot-start');
    expect(startDot.classes()).not.toContain('priority-high');
  });
});
