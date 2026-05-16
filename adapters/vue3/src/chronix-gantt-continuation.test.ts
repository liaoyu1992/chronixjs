import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChronixGantt } from './chronix-gantt.js';

import type { AxisRangePlanInput, BarSpec, RowSpec } from '@chronixjs/gantt';

const MS_PER_HOUR = 60 * 60 * 1000;

// Day-view axis anchored to 2026-05-13 (Wed) midnight. Bars expressed
// relative to that anchor produce deterministic isStart / isEnd flags.
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

describe('<ChronixGantt> continuation indicators — Phase 27', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('emits no continuation polygons when every bar is fully contained in the axis range', () => {
    // Day-view axis is 24h starting at 2026-05-13T00:00. Bars at hours
    // 3..6 and 10..14 are fully contained → both isStart && isEnd true
    // for both → zero triangles total.
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('contained-a', 3, 6), bar('contained-b', 10, 14)],
        rows,
        axisInput,
      },
    });
    expect(wrapper.findAll('polygon.cx-gantt-bar-continuation-indicator')).toHaveLength(0);
  });

  it('emits one `.cx-gantt-bar-continuation-left` polygon for a bar with `!isStart`', () => {
    // Bar starts at hour -4 (yesterday 20:00) → isStart=false → left triangle.
    // Ends at hour 6 → isEnd=true → no right triangle.
    const wrapper = mount(ChronixGantt, {
      props: { bars: [bar('crosses-start', -4, 6)], rows, axisInput },
    });
    expect(wrapper.findAll('polygon.cx-gantt-bar-continuation-left')).toHaveLength(1);
    expect(wrapper.findAll('polygon.cx-gantt-bar-continuation-right')).toHaveLength(0);
  });

  it('emits one `.cx-gantt-bar-continuation-right` polygon for a bar with `!isEnd`', () => {
    // Starts at hour 18 → isStart=true. Ends at hour 30 (next day 06:00)
    // → isEnd=false → right triangle only.
    const wrapper = mount(ChronixGantt, {
      props: { bars: [bar('crosses-end', 18, 30)], rows, axisInput },
    });
    expect(wrapper.findAll('polygon.cx-gantt-bar-continuation-left')).toHaveLength(0);
    expect(wrapper.findAll('polygon.cx-gantt-bar-continuation-right')).toHaveLength(1);
  });

  it('emits BOTH left + right polygons for a bar spanning the entire axis (before-to-after)', () => {
    // Starts at hour -10 (yesterday afternoon), ends at hour +30 (next-day
    // morning) → both flags false → both triangles.
    const wrapper = mount(ChronixGantt, {
      props: { bars: [bar('crosses-both', -10, 30)], rows, axisInput },
    });
    expect(wrapper.findAll('polygon.cx-gantt-bar-continuation-left')).toHaveLength(1);
    expect(wrapper.findAll('polygon.cx-gantt-bar-continuation-right')).toHaveLength(1);
  });

  it('left triangle apex x is at `placedBar.x + TRIANGLE_MARGIN` (1px inside the bar edge)', () => {
    // Bar starts at hour -4 → placedBar.x = -4 × slotWidth (slotWidth = 60
    // at viewportWidth 1440 / 24 hours). Apex at x = (-4 × 60) + 1 = -239.
    // We can't read TRIANGLE_MARGIN directly from the test (module-private
    // const), so test the relationship: the apex x equals
    // `placedBar.x + 1` (the parity reference's constant + chronix's port).
    const wrapper = mount(ChronixGantt, {
      props: { bars: [bar('crosses-start', -4, 6)], rows, axisInput },
    });
    const poly = wrapper.find('polygon.cx-gantt-bar-continuation-left');
    expect(poly.exists()).toBe(true);
    const points = poly.attributes('points')!;
    // points = "apexX,centerY baseX,topY baseX,bottomY"
    const apexX = Number(points.split(' ')[0]!.split(',')[0]);
    // placedBar.x = (-4h × 3600 × 1000 ms) × pxPerMs = -4 × slotWidth.
    // At viewportWidth 1440 with 24h slots → slotWidth = 60 → x = -240.
    // Apex = -240 + 1 = -239.
    expect(apexX).toBe(-239);
  });

  it('continuation polygons have `pointer-events: none` (no hit-test interference)', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [bar('crosses-both', -10, 30)], rows, axisInput },
    });
    const polygons = wrapper.findAll('polygon.cx-gantt-bar-continuation-indicator');
    expect(polygons).toHaveLength(2);
    for (const poly of polygons) {
      expect(poly.attributes('pointer-events')).toBe('none');
      expect(poly.attributes('fill')).toBe('#000');
      expect(poly.attributes('opacity')).toBe('0.8');
    }
  });
});
