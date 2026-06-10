import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChronixGantt } from './chronix-gantt.js';

import type { AxisRangePlanInput, BarSpec, RowSpec } from '@chronixjs/gantt';

const MS_PER_HOUR = 60 * 60 * 1000;

// Day-view axis anchored to 2026-05-13 (Wed) midnight at
// viewportWidth=1440 produces slotWidth=60 (24 hourly slots), so a
// 4-hour bar spans 240 px — comfortably past every render gate the
// selection / resizer paths can fire on.
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

describe('<ChronixGantt> selection overlay + visible resize handle — Phase 28.1', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  // ----- Selection-border rect -----

  it('emits no `.cx-gantt-bar-selection-border` when no bar is selected', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [bar('a', 0, 4), bar('b', 6, 10)], rows, axisInput, editable: true },
    });
    expect(wrapper.findAll('rect.cx-gantt-bar-selection-border')).toHaveLength(0);
  });

  it('emits one `.cx-gantt-bar-selection-border` per selected axis-overlapping bar', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('a', 0, 4), bar('b', 6, 10), bar('c', 12, 16)],
        rows,
        axisInput,
        editable: true,
        selectedBarIds: ['a', 'c'],
      },
    });
    const borders = wrapper.findAll('rect.cx-gantt-bar-selection-border');
    expect(borders).toHaveLength(2);
    const barIds = borders.map((b) => b.attributes('data-bar-id')).sort();
    expect(barIds).toEqual(['a', 'c']);
  });

  it('omits selection-border for selected bars that fail axis-overlap gate (entirely before axis)', () => {
    // Bar entirely BEFORE axis-start (anchor) — startMs/endMs both
    // negative relative to axis. axis-overlap gate should suppress
    // the selection-border even though the bar is "selected".
    const offAxisBar: BarSpec = {
      id: 'off-axis',
      rowId: 'r1',
      range: {
        start: new Date(anchor.getTime() - 48 * MS_PER_HOUR),
        end: new Date(anchor.getTime() - 24 * MS_PER_HOUR),
      },
      dprIntent: 'crisp-pixel',
    };
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [offAxisBar, bar('on-axis', 2, 6)],
        rows,
        axisInput,
        editable: true,
        selectedBarIds: ['off-axis', 'on-axis'],
      },
    });
    const borders = wrapper.findAll('rect.cx-gantt-bar-selection-border');
    expect(borders).toHaveLength(1);
    expect(borders[0]!.attributes('data-bar-id')).toBe('on-axis');
  });

  it('selection-border `stroke` and `stroke-width` follow the theme tokens', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('a', 0, 4)],
        rows,
        axisInput,
        editable: true,
        selectedBarIds: ['a'],
        theme: {
          barSelectedBorderColor: '#3b82f6',
          barSelectedBorderWidth: 3,
        },
      },
    });
    const border = wrapper.find('rect.cx-gantt-bar-selection-border');
    expect(border.exists()).toBe(true);
    expect(border.attributes('stroke')).toBe('#3b82f6');
    expect(border.attributes('stroke-width')).toBe('3');
    expect(border.attributes('fill')).toBe('none');
    expect(border.attributes('pointer-events')).toBe('none');
  });

  // ----- Edge resize zones -----

  it('emits 2 `.cx-gantt-bar-resizer-*` rects per editable axis-overlapping bar regardless of selection', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('a', 0, 4), bar('b', 6, 10)],
        rows,
        axisInput,
        editable: true,
        // No selection.
      },
    });
    expect(wrapper.findAll('rect.cx-gantt-bar-resizer-start')).toHaveLength(2);
    expect(wrapper.findAll('rect.cx-gantt-bar-resizer-end')).toHaveLength(2);
  });

  it('does NOT emit resize-zone rects when `editable: false` (read-only mode)', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('a', 0, 4)],
        rows,
        axisInput,
        editable: false,
      },
    });
    expect(wrapper.findAll('rect.cx-gantt-bar-resizer-start')).toHaveLength(0);
    expect(wrapper.findAll('rect.cx-gantt-bar-resizer-end')).toHaveLength(0);
  });

  it('resize-zone `width` follows the `barResizerThickness` theme token', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('a', 0, 4)],
        rows,
        axisInput,
        editable: true,
        theme: { barResizerThickness: 12 },
      },
    });
    const startZone = wrapper.find('rect.cx-gantt-bar-resizer-start');
    const endZone = wrapper.find('rect.cx-gantt-bar-resizer-end');
    expect(startZone.attributes('width')).toBe('12');
    expect(endZone.attributes('width')).toBe('12');
  });

  it('resize-zone rect carries `cursor: ew-resize` inline style + `pointer-events: auto`', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [bar('a', 0, 4)], rows, axisInput, editable: true },
    });
    const startZone = wrapper.find('rect.cx-gantt-bar-resizer-start');
    // Vue serializes inline `style` as a CSS string; assert on substring.
    expect(startZone.attributes('style')).toContain('cursor: ew-resize');
    expect(startZone.attributes('pointer-events')).toBe('auto');
    expect(startZone.attributes('fill')).toBe('transparent');
  });

  // ----- Visible dot handles -----

  it('emits 2 `.cx-gantt-bar-resizer-dot-*` rects per selected editable axis-overlapping bar', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('a', 0, 4), bar('b', 6, 10)],
        rows,
        axisInput,
        editable: true,
        selectedBarIds: ['a'],
      },
    });
    expect(wrapper.findAll('rect.cx-gantt-bar-resizer-dot-start')).toHaveLength(1);
    expect(wrapper.findAll('rect.cx-gantt-bar-resizer-dot-end')).toHaveLength(1);
  });

  it('omits dot rects for unselected bars', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [bar('a', 0, 4)], rows, axisInput, editable: true },
    });
    expect(wrapper.findAll('rect.cx-gantt-bar-resizer-dot-start')).toHaveLength(0);
    expect(wrapper.findAll('rect.cx-gantt-bar-resizer-dot-end')).toHaveLength(0);
  });

  it('omits dot rects when `editable: false` even on a selected bar (read-only)', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('a', 0, 4)],
        rows,
        axisInput,
        editable: false,
        selectedBarIds: ['a'],
      },
    });
    expect(wrapper.findAll('rect.cx-gantt-bar-resizer-dot-start')).toHaveLength(0);
    expect(wrapper.findAll('rect.cx-gantt-bar-resizer-dot-end')).toHaveLength(0);
  });

  it('dot `width` and `height` follow the `barResizerDotSize` theme token', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('a', 0, 4)],
        rows,
        axisInput,
        editable: true,
        selectedBarIds: ['a'],
        theme: { barResizerDotSize: 10 },
      },
    });
    const startDot = wrapper.find('rect.cx-gantt-bar-resizer-dot-start');
    expect(startDot.attributes('width')).toBe('10');
    expect(startDot.attributes('height')).toBe('10');
    expect(startDot.attributes('fill')).toBe('#ffffff');
    expect(startDot.attributes('pointer-events')).toBe('none');
  });

  it('left dot x is `renderX + 1` (1-px inset) when bar has `isStart` (no left continuation triangle)', () => {
    // Bar (hours 2..6) is fully inside day-view axis → bar.isStart =
    // bar.isEnd = true. Default left dot x = bar.x + 1.
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('inside', 2, 6)],
        rows,
        axisInput,
        editable: true,
        selectedBarIds: ['inside'],
      },
    });
    const startDot = wrapper.find('rect.cx-gantt-bar-resizer-dot-start');
    // bar at hours 2..6, slotWidth 60 → bar.x = 2 * 60 = 120.
    // Left dot x = 120 + 1 = 121.
    expect(startDot.attributes('x')).toBe('121');
  });

  it('left dot x shifts right past continuation triangle when `!bar.isStart`', () => {
    // Bar that straddles the axis start (starts at -2 h, ends at 4 h)
    // → !isStart in BarPlacementPass. Left dot must clear the
    // continuation triangle: x = bar.x + TRIANGLE_MARGIN +
    // TRIANGLE_SIZE + DOT_TRIANGLE_GAP = bar.x + 1 + 6 + 2 = bar.x + 9.
    const straddler: BarSpec = {
      id: 'straddler',
      rowId: 'r1',
      range: {
        start: new Date(anchor.getTime() - 2 * MS_PER_HOUR),
        end: new Date(anchor.getTime() + 4 * MS_PER_HOUR),
      },
      dprIntent: 'crisp-pixel',
    };
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [straddler],
        rows,
        axisInput,
        editable: true,
        selectedBarIds: ['straddler'],
      },
    });
    const startDot = wrapper.find('rect.cx-gantt-bar-resizer-dot-start');
    // bar.x for a straddler that starts at -2h is -120 (axis origin = 0).
    // Left dot x = -120 + 9 = -111.
    expect(startDot.attributes('x')).toBe('-111');
  });

  it('right dot x mirrors the shift when `!bar.isEnd`', () => {
    // Bar that runs past axis end (starts at 20 h, ends at 26 h) →
    // !isEnd in BarPlacementPass. Right dot must clear the right
    // continuation triangle: x = bar.x + bar.width - TRIANGLE_MARGIN -
    // TRIANGLE_SIZE - DOT_TRIANGLE_GAP - dotSize = bar.x + bar.width -
    // 1 - 6 - 2 - 8 = bar.x + bar.width - 17.
    const straddler: BarSpec = {
      id: 'past-end',
      rowId: 'r1',
      range: {
        start: new Date(anchor.getTime() + 20 * MS_PER_HOUR),
        end: new Date(anchor.getTime() + 26 * MS_PER_HOUR),
      },
      dprIntent: 'crisp-pixel',
    };
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [straddler],
        rows,
        axisInput,
        editable: true,
        selectedBarIds: ['past-end'],
      },
    });
    const endDot = wrapper.find('rect.cx-gantt-bar-resizer-dot-end');
    // bar.x = 20 * 60 = 1200; bar.width = 6 * 60 = 360.
    // Right dot x = 1200 + 360 - 17 = 1543.
    expect(endDot.attributes('x')).toBe('1543');
  });

  it('omits selection visual entirely for selected off-axis bars (resize zones, border, dots all suppressed)', () => {
    // Bar entirely past axis end → no axis-overlap. None of the
    // selection visuals should render.
    const offAxisBar: BarSpec = {
      id: 'off',
      rowId: 'r1',
      range: {
        start: new Date(anchor.getTime() + 30 * MS_PER_HOUR),
        end: new Date(anchor.getTime() + 35 * MS_PER_HOUR),
      },
      dprIntent: 'crisp-pixel',
    };
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [offAxisBar],
        rows,
        axisInput,
        editable: true,
        selectedBarIds: ['off'],
      },
    });
    expect(wrapper.findAll('rect.cx-gantt-bar-selection-border')).toHaveLength(0);
    expect(wrapper.findAll('rect.cx-gantt-bar-resizer-start')).toHaveLength(0);
    expect(wrapper.findAll('rect.cx-gantt-bar-resizer-end')).toHaveLength(0);
    expect(wrapper.findAll('rect.cx-gantt-bar-resizer-dot-start')).toHaveLength(0);
    expect(wrapper.findAll('rect.cx-gantt-bar-resizer-dot-end')).toHaveLength(0);
  });
});
