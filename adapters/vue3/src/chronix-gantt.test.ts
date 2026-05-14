import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixGantt } from './chronix-gantt.js';

import type { AxisRangePlanInput, BarSpec, RowSpec } from '@chronixjs/gantt';

const MS_PER_HOUR = 60 * 60 * 1000;

// Local midnight anchor — see use-gantt-layout.test.ts for the TZ
// rationale (axis planner normalizes anchorDate to local midnight).
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

const rows: readonly RowSpec[] = [
  { id: 'r1', columns: {} },
  { id: 'r2', columns: {} },
];

const axisInput: AxisRangePlanInput = {
  viewId: 'day',
  anchorDate: new Date('2026-05-13T00:00:00Z'),
  viewportWidth: 1440,
  locale: 'zh-CN',
  weekendsVisible: true,
};

describe('<ChronixGantt>', () => {
  it('renders one <rect data-bar-id> per placed bar', () => {
    const bars: readonly BarSpec[] = [bar('b1', 'r1', 8, 12), bar('b2', 'r2', 9, 14)];
    const wrapper = mount(ChronixGantt, {
      props: { bars, rows, axisInput },
    });
    const rects = wrapper.findAll('[data-bar-id]');
    expect(rects).toHaveLength(2);
    expect(rects[0]!.attributes('data-bar-id')).toBe('b1');
    expect(rects[1]!.attributes('data-bar-id')).toBe('b2');
  });

  it('renders the root svg with chronix-native cx-gantt class and the active view id', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput },
    });
    const svg = wrapper.find('svg');
    expect(svg.classes()).toContain('cx-gantt');
    expect(svg.attributes('data-axis-view')).toBe('day');
  });

  it('sizes rects from layout output: width = duration × pxPerMs, x = (start - axisStart) × pxPerMs', () => {
    const bars: readonly BarSpec[] = [bar('b1', 'r1', 8, 12)]; // 4 hours
    const wrapper = mount(ChronixGantt, {
      props: { bars, rows, axisInput },
    });
    const rect = wrapper.find('[data-bar-id="b1"]');
    // Day view: slotWidth 60, slotDuration 1h, axisStart = local midnight.
    expect(Number(rect.attributes('width'))).toBeCloseTo(240, 5);
    expect(Number(rect.attributes('x'))).toBeCloseTo(8 * 60, 5);
    expect(Number(rect.attributes('height'))).toBe(30);
    expect(Number(rect.attributes('y'))).toBe(8);
  });

  it('reacts to props.bars changes — rect count updates after a setProps', async () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [bar('b1', 'r1', 8, 12)], rows, axisInput },
    });
    expect(wrapper.findAll('[data-bar-id]')).toHaveLength(1);
    await wrapper.setProps({
      bars: [bar('b1', 'r1', 8, 12), bar('b2', 'r2', 10, 14)],
    });
    expect(wrapper.findAll('[data-bar-id]')).toHaveLength(2);
  });

  it('omits orphan bars (rowId not in rows) from the rendered output', () => {
    const bars: readonly BarSpec[] = [bar('b1', 'r1', 8, 12), bar('orphan', 'no-such-row', 10, 14)];
    const wrapper = mount(ChronixGantt, {
      props: { bars, rows, axisInput },
    });
    expect(wrapper.findAll('[data-bar-id]')).toHaveLength(1);
    expect(wrapper.find('[data-bar-id="b1"]').exists()).toBe(true);
    expect(wrapper.find('[data-bar-id="orphan"]').exists()).toBe(false);
  });

  it('honors custom barHeight + barVerticalPadding props', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12)],
        rows,
        axisInput,
        barHeight: 20,
        barVerticalPadding: 4,
      },
    });
    const rect = wrapper.find('[data-bar-id="b1"]');
    expect(Number(rect.attributes('height'))).toBe(20);
    expect(Number(rect.attributes('y'))).toBe(4);
  });
});

describe('<ChronixGantt> interactions', () => {
  it('editable: pointerdown on bar body → pointermove → pointerup emits `bar-drop` with shifted range', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12)],
        rows,
        axisInput,
        editable: true,
      },
    });
    // Bar 'b1' content bounds: x ∈ [480, 720], y ∈ [8, 38] (day view, hour 8–12).
    // Happy-dom returns {0,0,…} for getBoundingClientRect on un-laid-out SVG,
    // so clientX equals contentX in the test environment.
    const svg = wrapper.find('svg');
    await svg.trigger('pointerdown', { clientX: 600, clientY: 20, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 660, clientY: 20, pointerId: 1 });
    await svg.trigger('pointerup', { clientX: 660, clientY: 20, pointerId: 1 });

    const emitted = wrapper.emitted('bar-drop');
    expect(emitted).toBeTruthy();
    expect(emitted!).toHaveLength(1);
    const payload = emitted![0]![0] as {
      barId: string;
      oldRange: { start: Date };
      newRange: { start: Date };
    };
    expect(payload.barId).toBe('b1');
    expect(payload.newRange.start.getTime() - payload.oldRange.start.getTime()).toBe(MS_PER_HOUR);
  });

  it('editable: pointerdown on bar end-edge → drag right → emits `bar-resize` with end-edge shift', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12)],
        rows,
        axisInput,
        editable: true,
      },
    });
    const svg = wrapper.find('svg');
    // Bar end edge at x=720; default 8-px end zone is [712, 720]. Click 715, drag +60.
    await svg.trigger('pointerdown', { clientX: 715, clientY: 20, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 775, clientY: 20, pointerId: 1 });
    await svg.trigger('pointerup', { clientX: 775, clientY: 20, pointerId: 1 });

    const emitted = wrapper.emitted('bar-resize');
    expect(emitted).toBeTruthy();
    expect(emitted!).toHaveLength(1);
    const payload = emitted![0]![0] as {
      edge: string;
      oldRange: { end: Date };
      newRange: { end: Date };
    };
    expect(payload.edge).toBe('end');
    expect(payload.newRange.end.getTime() - payload.oldRange.end.getTime()).toBe(MS_PER_HOUR);
  });

  it('selectable: pointerdown on empty row → drag → emits `select` with the resolved range', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [], // no bars → click anywhere on a strip is empty-row
        rows,
        axisInput,
        selectable: true,
      },
    });
    const svg = wrapper.find('svg');
    // Hour 2 → hour 5 on row r1.
    await svg.trigger('pointerdown', { clientX: 120, clientY: 20, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 300, clientY: 20, pointerId: 1 });
    await svg.trigger('pointerup', { clientX: 300, clientY: 20, pointerId: 1 });

    const emitted = wrapper.emitted('select');
    expect(emitted).toBeTruthy();
    expect(emitted!).toHaveLength(1);
    const payload = emitted![0]![0] as { rowId: string; range: { start: Date; end: Date } };
    expect(payload.rowId).toBe('r1');
    expect(payload.range.end.getTime() - payload.range.start.getTime()).toBe(3 * MS_PER_HOUR);
  });

  it('not editable + not selectable: pointer events do not start a transaction', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12)],
        rows,
        axisInput,
      },
    });
    const svg = wrapper.find('svg');
    await svg.trigger('pointerdown', { clientX: 600, clientY: 20, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 660, clientY: 20, pointerId: 1 });
    await svg.trigger('pointerup', { clientX: 660, clientY: 20, pointerId: 1 });

    expect(wrapper.emitted('bar-drop')).toBeFalsy();
    expect(wrapper.emitted('bar-resize')).toBeFalsy();
    expect(wrapper.emitted('select')).toBeFalsy();
  });
});
