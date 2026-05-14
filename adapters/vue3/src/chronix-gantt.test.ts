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

function progressBar(
  id: string,
  rowId: string,
  startHour: number,
  endHour: number,
  progressValue: number,
): BarSpec {
  return {
    ...bar(id, rowId, startHour, endHour),
    progress: { value: progressValue },
    pointerOverlayId: 'progress-handle',
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

  it('renders a div.cx-gantt-wrapper root carrying the active view id, with a header SVG + body SVG inside', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput },
    });
    const root = wrapper.find('div.cx-gantt-wrapper');
    expect(root.exists()).toBe(true);
    expect(root.attributes('data-axis-view')).toBe('day');
    expect(wrapper.find('svg.cx-gantt-header').exists()).toBe(true);
    expect(wrapper.find('svg.cx-gantt-body').exists()).toBe(true);
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

// The body SVG carries all pointer handlers and renders the bar group
// without any translate — its top edge (y=0) IS content-y 0. Happy-dom
// returns `{0, 0, ...}` for getBoundingClientRect on un-laid-out SVGs,
// so clientX/clientY directly equal content-x/content-y in this env.

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
    const cy = 20;
    const svg = wrapper.find('svg.cx-gantt-body');
    await svg.trigger('pointerdown', { clientX: 600, clientY: cy, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 660, clientY: cy, pointerId: 1 });
    await svg.trigger('pointerup', { clientX: 660, clientY: cy, pointerId: 1 });

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
    const svg = wrapper.find('svg.cx-gantt-body');
    // Bar end edge at x=720; default 8-px end zone is [712, 720]. Click 715, drag +60.
    const cy = 20;
    await svg.trigger('pointerdown', { clientX: 715, clientY: cy, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 775, clientY: cy, pointerId: 1 });
    await svg.trigger('pointerup', { clientX: 775, clientY: cy, pointerId: 1 });

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
    const svg = wrapper.find('svg.cx-gantt-body');
    // Hour 2 → hour 5 on row r1.
    const cy = 20;
    await svg.trigger('pointerdown', { clientX: 120, clientY: cy, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 300, clientY: cy, pointerId: 1 });
    await svg.trigger('pointerup', { clientX: 300, clientY: cy, pointerId: 1 });

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
    const svg = wrapper.find('svg.cx-gantt-body');
    const cy = 20;
    await svg.trigger('pointerdown', { clientX: 600, clientY: cy, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 660, clientY: cy, pointerId: 1 });
    await svg.trigger('pointerup', { clientX: 660, clientY: cy, pointerId: 1 });

    expect(wrapper.emitted('bar-drop')).toBeFalsy();
    expect(wrapper.emitted('bar-resize')).toBeFalsy();
    expect(wrapper.emitted('select')).toBeFalsy();
  });

  it('safety net: synthetic pointerdown with negative content-y on the body SVG starts no transaction', async () => {
    // The header SVG has no pointer handlers, so in a real browser the
    // body SVG never receives a negative-content-y event. The body
    // pointerdown handler keeps an `if (pos.y < 0) return` filter as a
    // safety net — this test exercises it directly by firing on the body
    // SVG with a negative clientY (happy-dom's rect.top is 0).
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12)],
        rows,
        axisInput,
        editable: true,
        selectable: true,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    await svg.trigger('pointerdown', { clientX: 600, clientY: -10, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 660, clientY: -10, pointerId: 1 });
    await svg.trigger('pointerup', { clientX: 660, clientY: -10, pointerId: 1 });

    expect(wrapper.emitted('bar-drop')).toBeFalsy();
    expect(wrapper.emitted('bar-resize')).toBeFalsy();
    expect(wrapper.emitted('select')).toBeFalsy();
  });
});

describe('<ChronixGantt> axis ticks', () => {
  it('day view: renders 24 tick labels with zh-CN hour text "0时" … "23时"', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput },
    });
    const labels = wrapper.findAll('.cx-gantt-tick-label');
    expect(labels).toHaveLength(24);
    for (let i = 0; i < 24; i += 1) {
      expect(labels[i]!.text()).toBe(`${i}时`);
    }
  });

  it('day view: tick lines have monotonically increasing x in [0, axis.totalWidth)', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput },
    });
    const lines = wrapper.findAll('.cx-gantt-tick-line');
    expect(lines).toHaveLength(24);
    let prev = -Infinity;
    for (const line of lines) {
      const x1 = Number(line.attributes('x1'));
      expect(x1).toBeGreaterThan(prev);
      // Day view: slotWidth = 60, totalWidth = 24 × 60 = 1440. Last tick at 23×60.
      expect(x1).toBeGreaterThanOrEqual(0);
      expect(x1).toBeLessThan(1440);
      // x1 === x2 (vertical line).
      expect(Number(line.attributes('x2'))).toBe(x1);
      prev = x1;
    }
  });

  it('header SVG height = default band (44 = 1 × 20 + 24); body SVG height = contentSize.height (77)', () => {
    // Two rows, defaultRowHeight 38, rowSpacing 1 → contentSize.height = 38 + 1 + 38 = 77.
    // Day view has 1 headerRow; band = 1×20 + 24 = 44.
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput },
    });
    expect(Number(wrapper.find('svg.cx-gantt-header').attributes('height'))).toBe(44);
    expect(Number(wrapper.find('svg.cx-gantt-body').attributes('height'))).toBe(77);
  });

  it('custom headerHeight + headerRowHeight: header SVG carries the band height; bar group has no translate', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12)],
        rows,
        axisInput,
        headerHeight: 40,
        headerRowHeight: 30,
      },
    });
    // One bar on r1 → r1 height = 8 + 30 + 4 = 42. r2 stays at 38.
    // Content height: 42 + 1 + 38 = 81. Header band: 1×30 + 40 = 70.
    expect(Number(wrapper.find('svg.cx-gantt-header').attributes('height'))).toBe(70);
    expect(Number(wrapper.find('svg.cx-gantt-body').attributes('height'))).toBe(81);
    // Bar group now sits at the body SVG's origin — no transform.
    const barsGroup = wrapper.find('.cx-gantt-bars');
    expect(barsGroup.attributes('transform')).toBeUndefined();
    // Rect's own y comes straight from the layout (y=8).
    const rect = wrapper.find('[data-bar-id="b1"]');
    expect(Number(rect.attributes('y'))).toBe(8);
  });

  it('headerHeight=0 + headerRowHeight=0: no axis-divider, no header cells, header SVG collapses to height 0', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput, headerHeight: 0, headerRowHeight: 0 },
    });
    expect(Number(wrapper.find('svg.cx-gantt-header').attributes('height'))).toBe(0);
    expect(Number(wrapper.find('svg.cx-gantt-body').attributes('height'))).toBe(77);
    expect(wrapper.find('.cx-gantt-axis-divider').exists()).toBe(false);
    expect(wrapper.findAll('.cx-gantt-header-cell')).toHaveLength(0);
    // Tick lines + labels still render (we don't gate them on headerHeight).
    expect(wrapper.findAll('.cx-gantt-tick-label')).toHaveLength(24);
  });

  it('axis-row group transform offsets by headerRows height (1 × 20 = 20)', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput },
    });
    const axisGroup = wrapper.find('.cx-gantt-axis');
    expect(axisGroup.attributes('transform')).toBe('translate(0, 20)');
  });
});

describe('<ChronixGantt> header rows', () => {
  it('day view: renders one header cell spanning the full axis width with the day label', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput },
    });
    const cells = wrapper.findAll('.cx-gantt-header-cell');
    expect(cells).toHaveLength(1);
    const cell = cells[0]!;
    expect(Number(cell.attributes('x'))).toBe(0);
    expect(Number(cell.attributes('width'))).toBe(1440);
    expect(Number(cell.attributes('y'))).toBe(0);
    expect(Number(cell.attributes('height'))).toBe(20);
    // Day-view header label is zh-CN long-date ("2026年5月13日"); just
    // confirm the label is non-empty and the text node exists.
    const labels = wrapper.findAll('.cx-gantt-header-cell-label');
    expect(labels).toHaveLength(1);
    expect(labels[0]!.text().length).toBeGreaterThan(0);
  });

  it('week view: renders 7 header cells (one per day) and 24×7 = 168 hour ticks', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [],
        rows,
        axisInput: { ...axisInput, viewId: 'week' },
      },
    });
    expect(wrapper.findAll('.cx-gantt-header-cell')).toHaveLength(7);
    expect(wrapper.findAll('.cx-gantt-tick-line')).toHaveLength(168);
    // Each day's cell width should be uniform: 7 cells, day-view-equivalent
    // slot width × 24 hours. Week-view floor: 4 × 13 = 52 → totalWidth = 52 × 168 = 8736.
    const cells = wrapper.findAll('.cx-gantt-header-cell');
    const widths = cells.map((c) => Number(c.attributes('width')));
    const min = Math.min(...widths);
    const max = Math.max(...widths);
    expect(max - min).toBe(0);
    expect(min).toBe(52 * 24);
  });

  it('month view: renders one month header cell + per-day tick labels in zh-CN', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [],
        rows,
        axisInput: { ...axisInput, viewId: 'month' },
      },
    });
    expect(wrapper.findAll('.cx-gantt-header-cell')).toHaveLength(1);
    // Day-resolution ticks: between 28 and 31 depending on month. zh-CN
    // day labels emitted by `weekday: 'narrow'` are `"DD日<wd>"`, e.g.
    // "1日五" — matching the reference DOM exactly.
    const tickLabels = wrapper.findAll('.cx-gantt-tick-label');
    expect(tickLabels.length).toBeGreaterThanOrEqual(28);
    expect(tickLabels.length).toBeLessThanOrEqual(31);
    expect(tickLabels[0]!.text()).toMatch(/^1日[一二三四五六日]$/u);
  });

  it('year view: 12 outer header cells (one per month) covering the year', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [],
        rows,
        axisInput: { ...axisInput, viewId: 'year' },
      },
    });
    expect(wrapper.findAll('.cx-gantt-header-cell')).toHaveLength(12);
  });

  it('headerRowHeight=0 hides cells but keeps tick row visible', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput, headerRowHeight: 0 },
    });
    expect(wrapper.findAll('.cx-gantt-header-cell')).toHaveLength(0);
    expect(wrapper.findAll('.cx-gantt-tick-label')).toHaveLength(24);
    // Axis group sits flush at y=0 with no headerRows above it.
    const axisGroup = wrapper.find('.cx-gantt-axis');
    expect(axisGroup.attributes('transform')).toBe('translate(0, 0)');
  });
});

describe('<ChronixGantt> progress overlay', () => {
  it('renders a progress fill + handle rect for bars with progress + pointerOverlayId', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [progressBar('b1', 'r1', 8, 12, 50)],
        rows,
        axisInput,
      },
    });
    // Bar 'b1' at x ∈ [480, 720], width 240. 50% → fill width 120, handle x=600.
    const fill = wrapper.find('.cx-gantt-progress-fill');
    expect(fill.exists()).toBe(true);
    expect(Number(fill.attributes('x'))).toBe(480);
    expect(Number(fill.attributes('width'))).toBe(120);
    const handle = wrapper.find('.cx-gantt-progress-handle');
    expect(handle.exists()).toBe(true);
    // Default handleSize 12, centered at handleX=600 → x=594..606.
    expect(Number(handle.attributes('x'))).toBe(594);
    expect(Number(handle.attributes('width'))).toBe(12);
    // Handle's overlay-id passes through.
    expect(handle.attributes('data-overlay-id')).toBe('progress-handle');
  });

  it('skips the progress overlay for bars without progress or without pointerOverlayId', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [
          bar('b1', 'r1', 8, 12), // no progress
          {
            // progress without overlay → also skipped (no hit zone makes sense)
            ...bar('b2', 'r2', 0, 4),
            progress: { value: 30 },
          },
        ],
        rows,
        axisInput,
      },
    });
    expect(wrapper.findAll('.cx-gantt-progress-fill')).toHaveLength(0);
    expect(wrapper.findAll('.cx-gantt-progress-handle')).toHaveLength(0);
  });

  it('handle hit (pointerdown at handle center) emits `bar-progress` after commit', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [progressBar('b1', 'r1', 8, 12, 50)],
        rows,
        axisInput,
        editable: true,
      },
    });
    // Handle for 50%-progress bar centered at content (600, 23). Drag
    // +24 px → +10% → 60%.
    const svg = wrapper.find('svg.cx-gantt-body');
    await svg.trigger('pointerdown', { clientX: 600, clientY: 23, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 624, clientY: 23, pointerId: 1 });
    await svg.trigger('pointerup', { clientX: 624, clientY: 23, pointerId: 1 });

    const emitted = wrapper.emitted('bar-progress');
    expect(emitted).toBeTruthy();
    expect(emitted!).toHaveLength(1);
    const payload = emitted![0]![0] as {
      barId: string;
      oldProgress: number;
      newProgress: number;
    };
    expect(payload.barId).toBe('b1');
    expect(payload.oldProgress).toBe(50);
    expect(payload.newProgress).toBeCloseTo(60, 5);
    // bar-drop / bar-resize should NOT fire — progress-handle is its own kind.
    expect(wrapper.emitted('bar-drop')).toBeFalsy();
    expect(wrapper.emitted('bar-resize')).toBeFalsy();
  });

  it('handle takes precedence over bar-body (clicking the handle does not drag the bar)', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [progressBar('b1', 'r1', 8, 12, 50)],
        rows,
        axisInput,
        editable: true,
      },
    });
    // Pointer at handle center (600, 23) is also inside the bar body —
    // handle wins. Commit fires `bar-progress`, not `bar-drop`.
    const svg = wrapper.find('svg.cx-gantt-body');
    await svg.trigger('pointerdown', { clientX: 600, clientY: 23, button: 0, pointerId: 1 });
    await svg.trigger('pointerup', { clientX: 600, clientY: 23, pointerId: 1 });
    expect(wrapper.emitted('bar-progress')).toHaveLength(1);
    expect(wrapper.emitted('bar-drop')).toBeFalsy();
  });

  it('pointerdown outside the handle but inside the bar body still drags the bar', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [progressBar('b1', 'r1', 8, 12, 50)],
        rows,
        axisInput,
        editable: true,
      },
    });
    // Click far left of the handle (handle x ∈ [594, 606]) — pointer at
    // content (500, 20). Should resolve to bar-body.
    const svg = wrapper.find('svg.cx-gantt-body');
    await svg.trigger('pointerdown', { clientX: 500, clientY: 20, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 560, clientY: 20, pointerId: 1 });
    await svg.trigger('pointerup', { clientX: 560, clientY: 20, pointerId: 1 });
    expect(wrapper.emitted('bar-drop')).toHaveLength(1);
    expect(wrapper.emitted('bar-progress')).toBeFalsy();
  });

  it('progress fill width tracks the bar.progress.value (25% → 60-px fill on a 240-px bar)', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [progressBar('b1', 'r1', 8, 12, 25)],
        rows,
        axisInput,
      },
    });
    const fill = wrapper.find('.cx-gantt-progress-fill');
    expect(Number(fill.attributes('width'))).toBe(60); // 0.25 × 240
    const handle = wrapper.find('.cx-gantt-progress-handle');
    // Handle centered at 480 + 60 = 540 → x = 534, width 12.
    expect(Number(handle.attributes('x'))).toBe(534);
  });
});

describe('<ChronixGantt> progress overlay — live update during drag', () => {
  it('mid-drag pointermove moves the rendered handle x to the projected position', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [progressBar('b1', 'r1', 8, 12, 50)],
        rows,
        axisInput,
        editable: true,
      },
    });
    // Bar at x ∈ [480, 720] (width 240). 50% → handle center x = 600,
    // handle rect x = 594. Drag +24 px in content space → projected 60%
    // → new handle center 480 + 0.6 × 240 = 624, rect x = 618.
    const svg = wrapper.find('svg.cx-gantt-body');
    await svg.trigger('pointerdown', { clientX: 600, clientY: 23, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 624, clientY: 23, pointerId: 1 });

    // Handle has moved BEFORE pointer-up. No bar-progress emit yet.
    const handle = wrapper.find('.cx-gantt-progress-handle');
    expect(Number(handle.attributes('x'))).toBe(618);
    expect(wrapper.emitted('bar-progress')).toBeFalsy();
  });

  it('mid-drag pointermove updates the progress-fill width to track the projected percentage', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [progressBar('b1', 'r1', 8, 12, 50)],
        rows,
        axisInput,
        editable: true,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    await svg.trigger('pointerdown', { clientX: 600, clientY: 23, button: 0, pointerId: 1 });
    // Drag +12 px → projected 55% → fill width 0.55 × 240 = 132.
    await svg.trigger('pointermove', { clientX: 612, clientY: 23, pointerId: 1 });

    const fill = wrapper.find('.cx-gantt-progress-fill');
    expect(Number(fill.attributes('width'))).toBe(132);
  });

  it('mid-drag projection is clamped to [0, 100] when pointer moves past the bar bounds', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [progressBar('b1', 'r1', 8, 12, 50)],
        rows,
        axisInput,
        editable: true,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    await svg.trigger('pointerdown', { clientX: 600, clientY: 23, button: 0, pointerId: 1 });
    // Drag +500 px — projection past 100%. Fill should clamp to bar.width;
    // handle should clamp to bar.x + bar.width − handleSize/2.
    await svg.trigger('pointermove', { clientX: 1100, clientY: 23, pointerId: 1 });

    const fill = wrapper.find('.cx-gantt-progress-fill');
    expect(Number(fill.attributes('width'))).toBe(240); // entire bar
    const handle = wrapper.find('.cx-gantt-progress-handle');
    expect(Number(handle.attributes('x'))).toBe(720 - 6); // 100% → x=720, rect x = 714
  });

  it('after pointer-up commit the live preview ends; fill width is back to bar.progress.value', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [progressBar('b1', 'r1', 8, 12, 50)],
        rows,
        axisInput,
        editable: true,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    await svg.trigger('pointerdown', { clientX: 600, clientY: 23, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 624, clientY: 23, pointerId: 1 });
    await svg.trigger('pointerup', { clientX: 624, clientY: 23, pointerId: 1 });

    // bar.progress.value is still 50 (the test doesn't write back; that's
    // the demo's job). With activeTransaction cleared the render falls
    // through to the persisted value → fill width is back to 120.
    const fill = wrapper.find('.cx-gantt-progress-fill');
    expect(Number(fill.attributes('width'))).toBe(120);
    expect(wrapper.emitted('bar-progress')).toHaveLength(1);
  });
});

describe('<ChronixGantt> progress overlay — text label', () => {
  it('renders the default "{value}%" label centered on the bar', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [progressBar('b1', 'r1', 8, 12, 50)],
        rows,
        axisInput,
      },
    });
    const label = wrapper.find('.cx-gantt-progress-label');
    expect(label.exists()).toBe(true);
    expect(label.text()).toBe('50%');
    // Bar at x ∈ [480, 720] → center x = 600. y-mid = 23 (+4 for baseline).
    expect(Number(label.attributes('x'))).toBe(600);
    expect(Number(label.attributes('y'))).toBe(27);
  });

  it('honors a custom textFormat with the {value} token', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [
          {
            ...progressBar('b1', 'r1', 8, 12, 75),
            progress: { value: 75, textFormat: '- {value}% 完成' },
          },
        ],
        rows,
        axisInput,
      },
    });
    expect(wrapper.find('.cx-gantt-progress-label').text()).toBe('- 75% 完成');
  });

  it('suppresses the label when BarProgress.showText is explicitly false', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [
          {
            ...progressBar('b1', 'r1', 8, 12, 50),
            progress: { value: 50, showText: false },
          },
        ],
        rows,
        axisInput,
      },
    });
    expect(wrapper.find('.cx-gantt-progress-label').exists()).toBe(false);
    // Fill + handle still render — only the text is suppressed.
    expect(wrapper.find('.cx-gantt-progress-fill').exists()).toBe(true);
    expect(wrapper.find('.cx-gantt-progress-handle').exists()).toBe(true);
  });

  it('label text live-updates during a progress-handle drag (50% → 60%)', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [progressBar('b1', 'r1', 8, 12, 50)],
        rows,
        axisInput,
        editable: true,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    await svg.trigger('pointerdown', { clientX: 600, clientY: 23, button: 0, pointerId: 1 });
    // +24 px → projected 60% on the 240-px-wide bar.
    await svg.trigger('pointermove', { clientX: 624, clientY: 23, pointerId: 1 });
    expect(wrapper.find('.cx-gantt-progress-label').text()).toBe('60%');
  });
});

describe('<ChronixGantt> bar-drag live-update', () => {
  it('mid-drag pointermove shifts the rendered bar rect x by deltaX', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12)],
        rows,
        axisInput,
        editable: true,
      },
    });
    // Bar at content x=480..720, y=8..38. Click center, drag +60 px right.
    const svg = wrapper.find('svg.cx-gantt-body');
    await svg.trigger('pointerdown', { clientX: 600, clientY: 20, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 660, clientY: 20, pointerId: 1 });

    const rect = wrapper.find('[data-bar-id="b1"]');
    expect(Number(rect.attributes('x'))).toBe(540); // 480 + 60
    expect(Number(rect.attributes('width'))).toBe(240); // unchanged
    expect(Number(rect.attributes('y'))).toBe(8); // unchanged (no y delta yet)
    // No commit yet.
    expect(wrapper.emitted('bar-drop')).toBeFalsy();
  });

  it('mid-drag pointermove shifts y when the pointer moves vertically', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12)],
        rows,
        axisInput,
        editable: true,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    await svg.trigger('pointerdown', { clientX: 600, clientY: 20, button: 0, pointerId: 1 });
    // Move +10 px down (still in content space; clientY shifts by same).
    await svg.trigger('pointermove', { clientX: 600, clientY: 30, pointerId: 1 });
    const rect = wrapper.find('[data-bar-id="b1"]');
    expect(Number(rect.attributes('y'))).toBe(18); // 8 + 10
  });

  it('after pointer-up commit the live preview ends; rect x is back to layout value', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12)],
        rows,
        axisInput,
        editable: true,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    await svg.trigger('pointerdown', { clientX: 600, clientY: 20, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 660, clientY: 20, pointerId: 1 });
    await svg.trigger('pointerup', { clientX: 660, clientY: 20, pointerId: 1 });

    // Test doesn't write back; bar.range is unchanged, so the next render
    // shows the bar at its original x=480.
    const rect = wrapper.find('[data-bar-id="b1"]');
    expect(Number(rect.attributes('x'))).toBe(480);
    expect(wrapper.emitted('bar-drop')).toHaveLength(1);
  });

  it('progress fill + handle + label track the bar during a bar-drag (anchored to render geometry)', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [progressBar('b1', 'r1', 8, 12, 50)],
        rows,
        axisInput,
        editable: true,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    // Click far left of the handle (content x=500), drag +60 right.
    await svg.trigger('pointerdown', { clientX: 500, clientY: 20, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 560, clientY: 20, pointerId: 1 });

    // Bar shifted by +60 → x=540. Progress fill (50%) now at renderX=540
    // with width 120; handle centered at 540 + 120 = 660 → rect x=654.
    expect(Number(wrapper.find('[data-bar-id="b1"]').attributes('x'))).toBe(540);
    expect(Number(wrapper.find('.cx-gantt-progress-fill').attributes('x'))).toBe(540);
    expect(Number(wrapper.find('.cx-gantt-progress-handle').attributes('x'))).toBe(654);
  });
});

describe('<ChronixGantt> bar-resize live-update', () => {
  it('end-edge mid-drag grows the rendered bar width (x unchanged)', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12)],
        rows,
        axisInput,
        editable: true,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    // Bar end edge at content x=720; default 8-px end zone is [712, 720].
    // Click 715, drag +60 px right.
    await svg.trigger('pointerdown', { clientX: 715, clientY: 20, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 775, clientY: 20, pointerId: 1 });

    const rect = wrapper.find('[data-bar-id="b1"]');
    expect(Number(rect.attributes('x'))).toBe(480); // start pinned
    expect(Number(rect.attributes('width'))).toBe(300); // 240 + 60
  });

  it('start-edge mid-drag shifts x left and grows width (when dragged leftward)', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12)],
        rows,
        axisInput,
        editable: true,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    // Bar start edge at content x=480; 485 is in start zone [480, 488].
    // Drag −30 px left.
    await svg.trigger('pointerdown', { clientX: 485, clientY: 20, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 455, clientY: 20, pointerId: 1 });

    const rect = wrapper.find('[data-bar-id="b1"]');
    expect(Number(rect.attributes('x'))).toBe(450); // 480 − 30
    expect(Number(rect.attributes('width'))).toBe(270); // 240 + 30 (end pinned)
  });

  it('end-edge cross-over clamps rendered width to 0 (does not go negative)', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12)],
        rows,
        axisInput,
        editable: true,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    // Drag end edge way past the start: pointerdown at end zone, move left
    // 500 px → width would be 240 − 500 = −260. Clamp to 0.
    await svg.trigger('pointerdown', { clientX: 715, clientY: 20, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 215, clientY: 20, pointerId: 1 });

    expect(Number(wrapper.find('[data-bar-id="b1"]').attributes('width'))).toBe(0);
  });
});

describe('<ChronixGantt> pointercancel', () => {
  it('pointercancel mid-drag aborts the in-flight transaction without firing emit', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12)],
        rows,
        axisInput,
        editable: true,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    await svg.trigger('pointerdown', { clientX: 600, clientY: 20, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 660, clientY: 20, pointerId: 1 });
    await svg.trigger('pointercancel', { clientX: 660, clientY: 20, pointerId: 1 });

    // No bar-drop emit; bar rect snaps back to original layout x.
    expect(wrapper.emitted('bar-drop')).toBeFalsy();
    expect(Number(wrapper.find('[data-bar-id="b1"]').attributes('x'))).toBe(480);
  });

  it('pointercancel mid-resize aborts without firing bar-resize', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12)],
        rows,
        axisInput,
        editable: true,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    await svg.trigger('pointerdown', { clientX: 715, clientY: 20, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 775, clientY: 20, pointerId: 1 });
    await svg.trigger('pointercancel', { clientX: 775, clientY: 20, pointerId: 1 });

    expect(wrapper.emitted('bar-resize')).toBeFalsy();
    // Width reset to the layout's 240.
    expect(Number(wrapper.find('[data-bar-id="b1"]').attributes('width'))).toBe(240);
  });

  it('pointercancel mid-progress-handle aborts without firing bar-progress', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [progressBar('b1', 'r1', 8, 12, 50)],
        rows,
        axisInput,
        editable: true,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    await svg.trigger('pointerdown', { clientX: 600, clientY: 23, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 624, clientY: 23, pointerId: 1 });
    await svg.trigger('pointercancel', { clientX: 624, clientY: 23, pointerId: 1 });

    expect(wrapper.emitted('bar-progress')).toBeFalsy();
    // Live preview ended; fill width is back to the persisted 50% × 240 = 120.
    expect(Number(wrapper.find('.cx-gantt-progress-fill').attributes('width'))).toBe(120);
  });

  it('pointercancel when no transaction is active is a safe no-op', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12)],
        rows,
        axisInput,
        editable: true,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    // No pointerdown — pointercancel arrives unsolicited.
    await svg.trigger('pointercancel', { clientX: 600, clientY: 20, pointerId: 1 });
    expect(wrapper.emitted('bar-drop')).toBeFalsy();
  });
});
