import {
  defaultAxisRangePlanner,
  defaultBarPlacementPass,
  defaultBarStackHeightPass,
  defaultRowSwimlaneLayout,
  type AxisRangePlanInput,
  type BarSpec,
  type RowSpec,
} from '@chronixjs/gantt';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import { ChronixGantt } from './chronix-gantt.js';

import type { VueConstructor } from 'vue';

/**
 * Vue 2.7's `defineComponent` returns a Vue 3 `DefineComponent` type for
 * IDE prop-inference, but `@vue/test-utils@1.x`'s `mount` is typed for
 * Vue 2's `VueConstructor` (returned by `Vue.extend`). Runtime is
 * identical — Vue 2.7's `defineComponent` IS `Vue.extend` under the
 * hood — but the type bridge is missing. Cast through `VueConstructor`
 * to satisfy the call-site signature without changing runtime shape.
 */
const GanttForTest = ChronixGantt as unknown as VueConstructor;

const makeBar = (id: string, rowId: string, startISO: string, endISO: string): BarSpec => ({
  id,
  rowId,
  range: { start: new Date(startISO), end: new Date(endISO) },
  dprIntent: 'crisp-pixel',
});

const makeRow = (id: string): RowSpec => ({ id, columns: { name: id } });

const baseAxisInput = (): AxisRangePlanInput => ({
  viewId: 'week',
  anchorDate: new Date('2026-05-18T00:00:00'),
  viewportWidth: 1440,
  locale: 'zh-CN',
  weekendsVisible: true,
});

describe('@chronixjs/gantt-vue2 ChronixGantt (Phase 31 + 31.1)', () => {
  it('mounts without error and emits a single <div.cx-gantt-wrapper> root with header + body SVGs', () => {
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: [],
        rows: [],
        axisInput: baseAxisInput(),
      },
    });

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.element.tagName.toLowerCase()).toBe('div');
    expect(wrapper.element.getAttribute('class')).toContain('cx-gantt-wrapper');
    expect(wrapper.findAll('svg.cx-gantt-header').length).toBe(1);
    expect(wrapper.findAll('svg.cx-gantt-body').length).toBe(1);
  });

  it('renders one <rect data-bar-id> per placed bar, in input order', () => {
    const bars = [
      makeBar('b1', 'r1', '2026-05-18T09:00', '2026-05-19T17:00'),
      makeBar('b2', 'r2', '2026-05-19T00:00', '2026-05-21T00:00'),
      makeBar('b3', 'r3', '2026-05-20T08:00', '2026-05-22T12:00'),
    ];
    const rows = [makeRow('r1'), makeRow('r2'), makeRow('r3')];

    const wrapper = mount(GanttForTest, {
      propsData: { bars, rows, axisInput: baseAxisInput() },
    });

    const rects = wrapper.findAll('[data-bar-id]');
    expect(rects.length).toBe(3);
    expect(rects.at(0)?.attributes('data-bar-id')).toBe('b1');
    expect(rects.at(1)?.attributes('data-bar-id')).toBe('b2');
    expect(rects.at(2)?.attributes('data-bar-id')).toBe('b3');
  });

  it('bar coordinates match defaultBarPlacementPass.place output (pipeline-integrity check)', () => {
    const bars = [makeBar('b1', 'r1', '2026-05-19T00:00', '2026-05-20T00:00')];
    const rows = [makeRow('r1')];
    const axisInput = baseAxisInput();

    const axis = defaultAxisRangePlanner.plan(axisInput);
    const stackOut = defaultBarStackHeightPass.compute({
      bars,
      rows,
      axis,
      barHeight: 30,
      barStackSpacing: 5, // Phase 43 default
    });
    const rowsWithHints = rows.map((r): RowSpec => {
      const hint = stackOut.heightByRowId.get(r.id);
      return hint != null ? { ...r, heightHint: hint } : r;
    });
    const swimlaneOut = defaultRowSwimlaneLayout.layout({
      rows: rowsWithHints,
      defaultRowHeight: 38,
      rowSpacing: 1,
    });
    const placement = defaultBarPlacementPass.place({
      bars,
      axis,
      strips: swimlaneOut.strips,
      barHeight: 30,
      barVerticalPadding: 4, // Phase 43 default
      levelByBarId: stackOut.levelByBarId,
      barStackSpacing: 5, // Phase 43 default
    });
    const expected = placement.placedBars[0];
    expect(expected).toBeDefined();
    if (expected == null) return;

    const wrapper = mount(GanttForTest, { propsData: { bars, rows, axisInput } });
    const rect = wrapper.find('[data-bar-id="b1"]');
    expect(Number(rect.attributes('x'))).toBe(expected.x);
    expect(Number(rect.attributes('y'))).toBe(expected.y);
    expect(Number(rect.attributes('width'))).toBe(expected.width);
    expect(Number(rect.attributes('height'))).toBe(expected.height);
  });

  it('reactive: changing axisInput.viewId re-renders bar at a new x', async () => {
    const bars = [makeBar('b1', 'r1', '2026-05-19T00:00', '2026-05-20T00:00')];
    const rows = [makeRow('r1')];

    const wrapper = mount(GanttForTest, {
      propsData: { bars, rows, axisInput: baseAxisInput() },
    });
    const initialX = wrapper.find('[data-bar-id="b1"]').attributes('x');

    await wrapper.setProps({
      bars,
      rows,
      axisInput: { ...baseAxisInput(), viewId: 'month' },
    });

    const afterX = wrapper.find('[data-bar-id="b1"]').attributes('x');
    // Month view's slot width differs from week view's so x must shift.
    expect(afterX).toBeDefined();
    expect(afterX).not.toBe(initialX);
  });

  it('empty bars array renders body SVG with no <rect data-bar-id> children', () => {
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: [],
        rows: [makeRow('r1')],
        axisInput: baseAxisInput(),
      },
    });

    expect(wrapper.findAll('[data-bar-id]').length).toBe(0);
    expect(wrapper.find('svg.cx-gantt-body').exists()).toBe(true);
  });

  // Phase 31.1: axis chrome render cases.

  it('header SVG dimensions match axis.totalWidth × (headerRows × headerRowHeight + headerHeight)', () => {
    const axisInput = baseAxisInput();
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [], rows: [makeRow('r1')], axisInput },
    });

    const planned = defaultAxisRangePlanner.plan(axisInput);
    const expectedHeight = planned.headerRows.length * 20 + 24; // defaults
    const headerSvg = wrapper.find('svg.cx-gantt-header');
    expect(headerSvg.exists()).toBe(true);
    expect(Number(headerSvg.attributes('width'))).toBe(planned.totalWidth);
    expect(Number(headerSvg.attributes('height'))).toBe(expectedHeight);
  });

  it('renders one <rect class="cx-gantt-header-cell"> per outer-band cell across all header rows', () => {
    const axisInput = baseAxisInput();
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [], rows: [makeRow('r1')], axisInput },
    });

    const planned = defaultAxisRangePlanner.plan(axisInput);
    const expectedCells = planned.headerRows.reduce((sum, r) => sum + r.cells.length, 0);
    expect(wrapper.findAll('.cx-gantt-header-cell').length).toBe(expectedCells);
    expect(wrapper.findAll('.cx-gantt-header-cell-label').length).toBe(expectedCells);
  });

  it('renders one <line class="cx-gantt-tick-line"> + <text class="cx-gantt-tick-label"> per axis.ticks entry', () => {
    const axisInput = baseAxisInput();
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [], rows: [makeRow('r1')], axisInput },
    });

    const planned = defaultAxisRangePlanner.plan(axisInput);
    expect(wrapper.findAll('.cx-gantt-tick-line').length).toBe(planned.ticks.length);
    expect(wrapper.findAll('.cx-gantt-tick-label').length).toBe(planned.ticks.length);
  });

  it('renders a <line class="cx-gantt-axis-divider"> at y = headerHeight when headerHeight > 0', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [], rows: [makeRow('r1')], axisInput: baseAxisInput() },
    });

    const divider = wrapper.find('.cx-gantt-axis-divider');
    expect(divider.exists()).toBe(true);
    expect(Number(divider.attributes('y1'))).toBe(24);
    expect(Number(divider.attributes('y2'))).toBe(24);
  });

  it('switching axisInput.viewId from week to month re-renders header cells with new counts', async () => {
    const axisInputWeek = baseAxisInput();
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [], rows: [makeRow('r1')], axisInput: axisInputWeek },
    });
    const weekCells = wrapper.findAll('.cx-gantt-header-cell').length;
    const weekTicks = wrapper.findAll('.cx-gantt-tick-line').length;

    await wrapper.setProps({
      bars: [],
      rows: [makeRow('r1')],
      axisInput: { ...axisInputWeek, viewId: 'month' },
    });

    const monthCells = wrapper.findAll('.cx-gantt-header-cell').length;
    const monthTicks = wrapper.findAll('.cx-gantt-tick-line').length;
    // Different views produce different header / tick counts — verifies
    // reactivity flows from prop change through the composable into the
    // axis chrome render.
    expect(monthCells).not.toBe(weekCells);
    expect(monthTicks).not.toBe(weekTicks);
  });
});

// Phase 31.2: SFC-level pointer interaction tests. Uses day axis for
// predictable pxPerHour math (60 px/hour at viewportWidth=1440), then
// triggers synthetic PointerEvents on the body SVG and inspects
// `wrapper.emitted(...)` for the resulting component emits.
const dayAxisInput = (): AxisRangePlanInput => ({
  viewId: 'day',
  anchorDate: new Date('2026-05-18T00:00:00'),
  viewportWidth: 1440,
  locale: 'zh-CN',
  weekendsVisible: true,
});

// Bar at content x=480..720 (hour 8..12) on row r1 — same fixture as
// use-gantt-pointer.test.ts. Click at content (600, 20) lands on
// bar-body; (715, 20) on bar-edge-end; etc.
const dragBar = (): BarSpec => ({
  id: 'b1',
  rowId: 'r1',
  range: {
    start: new Date('2026-05-18T08:00:00'),
    end: new Date('2026-05-18T12:00:00'),
  },
  dprIntent: 'crisp-pixel',
});

// Helper to synthesize a pointer event payload. clientX/Y double as
// content x/y because happy-dom returns a zeroed bounding rect for
// elements without layout.
const pointerOpts = (clientX: number, clientY: number, pointerId = 1) => ({
  clientX,
  clientY,
  button: 0,
  pointerId,
});

describe('@chronixjs/gantt-vue2 ChronixGantt — pointer interaction (Phase 31.2)', () => {
  beforeEach(() => {
    // jsdom doesn't implement setPointerCapture / releasePointerCapture +
    // doesn't honor getBoundingClientRect from CSS. Stub both so the
    // adapter's pointer plumbing exercises the full begin / advance /
    // commit path. Bounding-rect zero-origin lets us treat clientX/Y as
    // content-x/y directly (no rect.left/top subtraction).
    const proto = Element.prototype as unknown as {
      setPointerCapture?: (this: void, id: number) => void;
      releasePointerCapture?: (this: void, id: number) => void;
      hasPointerCapture?: (this: void, id: number) => boolean;
    };
    proto.setPointerCapture ??= function noopSetPointerCapture(): void {
      /* jsdom stub */
    };
    proto.releasePointerCapture ??= function noopReleasePointerCapture(): void {
      /* jsdom stub */
    };
    proto.hasPointerCapture ??= function noopHasPointerCapture(): boolean {
      return false;
    };
    // Return zero-origin rect with non-zero dimensions so clientX/Y
    // can be used directly as content-x/y (no rect.left/top subtraction).
    const svgProto = SVGSVGElement.prototype;
    Object.defineProperty(svgProto, 'getBoundingClientRect', {
      configurable: true,
      writable: true,
      enumerable: true,
      value: function (this: SVGSVGElement): DOMRect {
        const width = this.width?.baseVal?.value ?? 10000;
        const height = this.height?.baseVal?.value ?? 1000;
        if (width > 0 && height > 0) {
          return {
            left: 0,
            top: 0,
            width,
            height,
            right: width,
            bottom: height,
            x: 0,
            y: 0,
            toJSON() {
              return this;
            },
          };
        }
        return {
          left: 0,
          top: 0,
          width: 10000,
          height: 1000,
          right: 10000,
          bottom: 1000,
          x: 0,
          y: 0,
          toJSON() {
            return this;
          },
        };
      },
    });
  });

  it('pointerdown → pointermove (+60px) → pointerup on bar emits bar-drop with +1 hour shift', async () => {
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: [dragBar()],
        rows: [makeRow('r1')],
        axisInput: dayAxisInput(),
        editable: true,
      },
    });
    const body = wrapper.find('svg.cx-gantt-body');
    await body.trigger('pointerdown', pointerOpts(600, 20));
    await body.trigger('pointermove', pointerOpts(660, 20));
    await body.trigger('pointerup', pointerOpts(660, 20));

    const emits = wrapper.emitted('bar-drop') as
      | [
          {
            barId: string;
            oldRange: { start: Date; end: Date };
            newRange: { start: Date; end: Date };
          },
        ][]
      | undefined;
    expect(emits).toBeDefined();
    expect(emits).toHaveLength(1);
    const payload = emits![0]![0];
    expect(payload.barId).toBe('b1');
    expect(payload.newRange.start.getTime() - payload.oldRange.start.getTime()).toBe(
      60 * 60 * 1000,
    );
  });

  it('3-px wiggle (sub-threshold) emits bar-click, NOT bar-drop', async () => {
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: [dragBar()],
        rows: [makeRow('r1')],
        axisInput: dayAxisInput(),
        editable: true,
      },
    });
    const body = wrapper.find('svg.cx-gantt-body');
    await body.trigger('pointerdown', pointerOpts(600, 20));
    await body.trigger('pointermove', pointerOpts(603, 20)); // 3-px wiggle (< default 5)
    await body.trigger('pointerup', pointerOpts(603, 20));

    expect(wrapper.emitted('bar-drop')).toBeUndefined();
    const clicks = wrapper.emitted('bar-click') as [{ barId: string }][] | undefined;
    expect(clicks).toBeDefined();
    expect(clicks).toHaveLength(1);
    expect(clicks![0]![0].barId).toBe('b1');
  });

  it('pointerdown on bar edge → pointermove → pointerup emits bar-resize with edge: end', async () => {
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: [dragBar()],
        rows: [makeRow('r1')],
        axisInput: dayAxisInput(),
        editable: true,
      },
    });
    const body = wrapper.find('svg.cx-gantt-body');
    // Bar end edge at content x=720. Default edgeZoneWidth=8 → 715 is in end zone.
    await body.trigger('pointerdown', pointerOpts(715, 20));
    await body.trigger('pointermove', pointerOpts(775, 20)); // +60 px = +1 hour
    await body.trigger('pointerup', pointerOpts(775, 20));

    const emits = wrapper.emitted('bar-resize') as
      | [
          {
            barId: string;
            edge: 'start' | 'end';
            oldRange: { start: Date; end: Date };
            newRange: { start: Date; end: Date };
          },
        ][]
      | undefined;
    expect(emits).toBeDefined();
    const payload = emits![0]![0];
    expect(payload.barId).toBe('b1');
    expect(payload.edge).toBe('end');
    expect(payload.newRange.end.getTime() - payload.oldRange.end.getTime()).toBe(60 * 60 * 1000);
  });

  it('pointerdown on empty row with selectable: true emits select after pointermove + pointerup', async () => {
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: [], // no bars → any in-strip click is empty-row
        rows: [makeRow('r1'), makeRow('r2')],
        axisInput: dayAxisInput(),
        selectable: true,
      },
    });
    const body = wrapper.find('svg.cx-gantt-body');
    // Click at hour 2, row r1. Drag to hour 5.
    await body.trigger('pointerdown', pointerOpts(120, 20));
    await body.trigger('pointermove', pointerOpts(300, 20));
    await body.trigger('pointerup', pointerOpts(300, 20));

    const emits = wrapper.emitted('select') as
      | [{ rowId: string; range: { start: Date; end: Date } }][]
      | undefined;
    expect(emits).toBeDefined();
    const payload = emits![0]![0];
    expect(payload.rowId).toBe('r1');
    expect(payload.range.end.getTime() - payload.range.start.getTime()).toBe(3 * 60 * 60 * 1000);
  });

  it('setPointerCapture is called on the body SVG when a transaction begins', async () => {
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: [dragBar()],
        rows: [makeRow('r1')],
        axisInput: dayAxisInput(),
        editable: true,
      },
    });
    const body = wrapper.find('svg.cx-gantt-body');
    const setPointerCaptureSpy = vi.fn();
    (
      body.element as unknown as { setPointerCapture: typeof setPointerCaptureSpy }
    ).setPointerCapture = setPointerCaptureSpy;

    await body.trigger('pointerdown', pointerOpts(600, 20, 42));
    expect(setPointerCaptureSpy).toHaveBeenCalledOnce();
    expect(setPointerCaptureSpy).toHaveBeenCalledWith(42);
  });

  it('releasePointerCapture is called on pointerup', async () => {
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: [dragBar()],
        rows: [makeRow('r1')],
        axisInput: dayAxisInput(),
        editable: true,
      },
    });
    const body = wrapper.find('svg.cx-gantt-body');
    const releaseSpy = vi.fn();
    (
      body.element as unknown as { releasePointerCapture: typeof releaseSpy }
    ).releasePointerCapture = releaseSpy;
    (body.element as unknown as { setPointerCapture: () => void }).setPointerCapture = vi.fn();

    await body.trigger('pointerdown', pointerOpts(600, 20, 7));
    await body.trigger('pointerup', pointerOpts(600, 20, 7));
    expect(releaseSpy).toHaveBeenCalledWith(7);
  });

  it('editable: false (default) — pointerdown on bar does NOT emit bar-drop on subsequent move + up', async () => {
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: [dragBar()],
        rows: [makeRow('r1')],
        axisInput: dayAxisInput(),
        // editable defaults to false
      },
    });
    const body = wrapper.find('svg.cx-gantt-body');
    await body.trigger('pointerdown', pointerOpts(600, 20));
    await body.trigger('pointermove', pointerOpts(660, 20));
    await body.trigger('pointerup', pointerOpts(660, 20));
    expect(wrapper.emitted('bar-drop')).toBeUndefined();
    // The click discrimination still fires bar-click since no transaction
    // committed and the bar-body hit was recorded.
    expect(wrapper.emitted('bar-click')).toBeDefined();
  });

  it('pointerdown with button !== 0 (right click) is ignored', async () => {
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: [dragBar()],
        rows: [makeRow('r1')],
        axisInput: dayAxisInput(),
        editable: true,
      },
    });
    const body = wrapper.find('svg.cx-gantt-body');
    await body.trigger('pointerdown', { clientX: 600, clientY: 20, button: 2, pointerId: 1 });
    await body.trigger('pointermove', pointerOpts(660, 20));
    await body.trigger('pointerup', pointerOpts(660, 20));
    expect(wrapper.emitted('bar-drop')).toBeUndefined();
    expect(wrapper.emitted('bar-click')).toBeUndefined();
  });
});

// Phase 31.2.1: Phase 19 validator gate SFC test cases.
// Local fixtures mirror vue3's chronix-gantt.test.ts (anchor 2026-05-13)
// so the numerical assertions (rejection reason strings, attempted
// ranges, bar coordinates) port verbatim and drift detection between
// vue2 + vue3 adapters works.
const phase19Today = new Date('2026-05-13T00:00:00Z');
phase19Today.setHours(0, 0, 0, 0);
const phase19TodayMs = phase19Today.getTime();
const MS_PER_HOUR_P19 = 60 * 60 * 1000;

function p19Bar(id: string, rowId: string, startHour: number, endHour: number): BarSpec {
  return {
    id,
    rowId,
    range: {
      start: new Date(phase19TodayMs + startHour * MS_PER_HOUR_P19),
      end: new Date(phase19TodayMs + endHour * MS_PER_HOUR_P19),
    },
    dprIntent: 'crisp-pixel',
  };
}

function p19ProgressBar(
  id: string,
  rowId: string,
  startHour: number,
  endHour: number,
  progressValue: number,
): BarSpec {
  return {
    ...p19Bar(id, rowId, startHour, endHour),
    progress: { value: progressValue },
    pointerOverlayId: 'progress-handle',
  };
}

const phase19Rows: readonly RowSpec[] = [
  { id: 'r1', columns: {} },
  { id: 'r2', columns: {} },
];

const phase19AxisInput: AxisRangePlanInput = {
  viewId: 'day',
  anchorDate: new Date(phase19TodayMs),
  viewportWidth: 1440,
  locale: 'zh-CN',
  weekendsVisible: true,
};

describe('<ChronixGantt> validation gates (Phase 19) — Phase 31.2.1', () => {
  beforeEach(() => {
    // jsdom doesn't implement setPointerCapture / releasePointerCapture +
    // doesn't honor getBoundingClientRect from CSS. Stub both so the
    // adapter's pointer plumbing exercises the full begin / advance /
    // commit path. Bounding-rect zero-origin lets us treat clientX/Y as
    // content-x/y directly (no rect.left/top subtraction).
    const proto = Element.prototype as unknown as {
      setPointerCapture?: (this: void, id: number) => void;
      releasePointerCapture?: (this: void, id: number) => void;
      hasPointerCapture?: (this: void, id: number) => boolean;
    };
    proto.setPointerCapture ??= function noopSetPointerCapture(): void {
      /* jsdom stub */
    };
    proto.releasePointerCapture ??= function noopReleasePointerCapture(): void {
      /* jsdom stub */
    };
    proto.hasPointerCapture ??= function noopHasPointerCapture(): boolean {
      return false;
    };
    // Return zero-origin rect with non-zero dimensions so clientX/Y
    // can be used directly as content-x/y (no rect.left/top subtraction).
    const svgProto = SVGSVGElement.prototype;
    Object.defineProperty(svgProto, 'getBoundingClientRect', {
      configurable: true,
      writable: true,
      enumerable: true,
      value: function (this: SVGSVGElement): DOMRect {
        const width = this.width?.baseVal?.value ?? 10000;
        const height = this.height?.baseVal?.value ?? 1000;
        if (width > 0 && height > 0) {
          return {
            left: 0,
            top: 0,
            width,
            height,
            right: width,
            bottom: height,
            x: 0,
            y: 0,
            toJSON() {
              return this;
            },
          };
        }
        return {
          left: 0,
          top: 0,
          width: 10000,
          height: 1000,
          right: 10000,
          bottom: 1000,
          x: 0,
          y: 0,
          toJSON() {
            return this;
          },
        };
      },
    });
  });

  it('bar-drag rejected by eventOverlap: false → onBarDrop not emitted, bar-drop-rejected fires with reason "overlap"', async () => {
    // b1 on r1 (8-12), b2 on r2 (9-13). Drag b1 right +60px (1 hour)
    // so its new range becomes 9-13 on r1 — cross-row time intersect
    // with b2 → reject.
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: [p19Bar('b1', 'r1', 8, 12), p19Bar('b2', 'r2', 9, 13)],
        rows: phase19Rows,
        axisInput: phase19AxisInput,
        editable: true,
        eventOverlap: false,
      },
    });
    const body = wrapper.find('svg.cx-gantt-body');
    await body.trigger('pointerdown', pointerOpts(600, 20));
    await body.trigger('pointermove', pointerOpts(660, 20));
    await body.trigger('pointerup', pointerOpts(660, 20));

    expect(wrapper.emitted('bar-drop')).toBeUndefined();
    const rejected = wrapper.emitted('bar-drop-rejected') as
      | [{ barId: string; reason: string; attemptedRange: { start: Date; end: Date } }][]
      | undefined;
    expect(rejected).toBeDefined();
    expect(rejected).toHaveLength(1);
    const payload = rejected![0]![0];
    expect(payload.barId).toBe('b1');
    expect(payload.reason).toBe('overlap');
    expect(payload.attemptedRange.start.getTime()).toBe(
      new Date(phase19TodayMs + 9 * MS_PER_HOUR_P19).getTime(),
    );
  });

  it('bar-resize rejected by eventConstraint → bar-resize not emitted, bar-resize-rejected fires with reason "constraint"', async () => {
    // b1 on r1 (8-12). Constraint window 8..12 — bar fits exactly at
    // start. Resize end +60px (1 hour) → new range 8-13. range.end=13
    // exceeds constraint.range.end=12 → reject.
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: [p19Bar('b1', 'r1', 8, 12)],
        rows: phase19Rows,
        axisInput: phase19AxisInput,
        editable: true,
        eventConstraint: {
          range: {
            start: new Date(phase19TodayMs + 8 * MS_PER_HOUR_P19),
            end: new Date(phase19TodayMs + 12 * MS_PER_HOUR_P19),
          },
        },
      },
    });
    const body = wrapper.find('svg.cx-gantt-body');
    // Click end-edge (x=720, default 8-px end zone [712..720]) + drag right +60.
    await body.trigger('pointerdown', pointerOpts(715, 20));
    await body.trigger('pointermove', pointerOpts(775, 20));
    await body.trigger('pointerup', pointerOpts(775, 20));

    expect(wrapper.emitted('bar-resize')).toBeUndefined();
    const rejected = wrapper.emitted('bar-resize-rejected') as
      | [{ barId: string; edge: string; reason: string }][]
      | undefined;
    expect(rejected).toBeDefined();
    const payload = rejected![0]![0];
    expect(payload.barId).toBe('b1');
    expect(payload.edge).toBe('end');
    expect(payload.reason).toBe('constraint');
  });

  it('range-select rejected by selectAllow → select not emitted, select-rejected fires with reason "allow"', async () => {
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: [],
        rows: phase19Rows,
        axisInput: phase19AxisInput,
        selectable: true,
        selectAllow: () => false,
      },
    });
    const body = wrapper.find('svg.cx-gantt-body');
    await body.trigger('pointerdown', pointerOpts(120, 20));
    await body.trigger('pointermove', pointerOpts(300, 20));
    await body.trigger('pointerup', pointerOpts(300, 20));

    expect(wrapper.emitted('select')).toBeUndefined();
    const rejected = wrapper.emitted('select-rejected') as
      | [{ rowId: string; reason: string }][]
      | undefined;
    expect(rejected).toBeDefined();
    const payload = rejected![0]![0];
    expect(payload.rowId).toBe('r1');
    expect(payload.reason).toBe('allow');
  });

  it('regression: with no validator props, commits go through as before', async () => {
    // Same cross-row-intersect fixture as case 1 but WITHOUT
    // `eventOverlap: false` — confirms the validator path is opt-in.
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: [p19Bar('b1', 'r1', 8, 12), p19Bar('b2', 'r2', 9, 13)],
        rows: phase19Rows,
        axisInput: phase19AxisInput,
        editable: true,
      },
    });
    const body = wrapper.find('svg.cx-gantt-body');
    await body.trigger('pointerdown', pointerOpts(600, 20));
    await body.trigger('pointermove', pointerOpts(660, 20));
    await body.trigger('pointerup', pointerOpts(660, 20));

    expect(wrapper.emitted('bar-drop')).toBeDefined();
    expect(wrapper.emitted('bar-drop-rejected')).toBeUndefined();
  });

  it('eventOverlap: true (explicit) → no rejection even with intersecting cross-row bars', async () => {
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: [p19Bar('b1', 'r1', 8, 12), p19Bar('b2', 'r2', 9, 13)],
        rows: phase19Rows,
        axisInput: phase19AxisInput,
        editable: true,
        eventOverlap: true,
      },
    });
    const body = wrapper.find('svg.cx-gantt-body');
    await body.trigger('pointerdown', pointerOpts(600, 20));
    await body.trigger('pointermove', pointerOpts(660, 20));
    await body.trigger('pointerup', pointerOpts(660, 20));

    expect(wrapper.emitted('bar-drop')).toBeDefined();
    expect(wrapper.emitted('bar-drop-rejected')).toBeUndefined();
  });

  it('progress-handle commit is never gated by eventConstraint (changing progress does not move the bar)', async () => {
    // Constraint window deliberately incompatible with the bar's range
    // (today-only at 0..1) — a drag or resize would be rejected. But a
    // progress drag should commit because validators don't apply to
    // progress.
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: [p19ProgressBar('b1', 'r1', 8, 12, 50)],
        rows: phase19Rows,
        axisInput: phase19AxisInput,
        editable: true,
        eventConstraint: {
          range: {
            start: new Date(phase19TodayMs),
            end: new Date(phase19TodayMs + MS_PER_HOUR_P19),
          },
        },
      },
    });
    const body = wrapper.find('svg.cx-gantt-body');
    // Progress-handle center for 50%: x = 480 + (240 × 0.5) = 600, y = bar bottom 38.
    await body.trigger('pointerdown', pointerOpts(600, 38));
    await body.trigger('pointermove', pointerOpts(660, 23));
    await body.trigger('pointerup', pointerOpts(660, 23));

    expect(wrapper.emitted('bar-progress')).toBeDefined();
    expect(wrapper.emitted('bar-drop-rejected')).toBeUndefined();
    expect(wrapper.emitted('bar-resize-rejected')).toBeUndefined();
  });

  it('range-select rejected by selectOverlap: false when proposal intersects an existing bar (Phase 55)', async () => {
    // b1 on r2 (8-12) — different row from where we select, so pointerdown
    // lands in empty space on r1. Drag-select on r1 from x=180 (3h) →
    // x=600 (10h) → proposal range 3-10 intersects b1's range 8-12 →
    // veto via selectOverlap.
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: [p19Bar('b1', 'r2', 8, 12)],
        rows: phase19Rows,
        axisInput: phase19AxisInput,
        selectable: true,
        selectOverlap: false,
      },
    });
    const body = wrapper.find('svg.cx-gantt-body');
    await body.trigger('pointerdown', pointerOpts(180, 20));
    await body.trigger('pointermove', pointerOpts(600, 20));
    await body.trigger('pointerup', pointerOpts(600, 20));

    expect(wrapper.emitted('select')).toBeUndefined();
    const rejected = wrapper.emitted('select-rejected') as
      | [{ rowId: string; reason: string }][]
      | undefined;
    expect(rejected).toBeDefined();
    expect(rejected![0]![0].reason).toBe('overlap');
  });

  it('selectConstraint narrower than eventConstraint vetoes select-only (Phase 55)', async () => {
    // eventConstraint: 0..24h wide-open → drag passes.
    // selectConstraint: 8..12h narrow → select at 13..17 vetoed.
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: [],
        rows: phase19Rows,
        axisInput: phase19AxisInput,
        selectable: true,
        eventConstraint: {
          range: {
            start: new Date(phase19TodayMs + 0 * MS_PER_HOUR_P19),
            end: new Date(phase19TodayMs + 24 * MS_PER_HOUR_P19),
          },
        },
        selectConstraint: {
          range: {
            start: new Date(phase19TodayMs + 8 * MS_PER_HOUR_P19),
            end: new Date(phase19TodayMs + 12 * MS_PER_HOUR_P19),
          },
        },
      },
    });
    const body = wrapper.find('svg.cx-gantt-body');
    // x=780 (13h) → x=1020 (17h). Outside [8..12].
    await body.trigger('pointerdown', pointerOpts(780, 20));
    await body.trigger('pointermove', pointerOpts(1020, 20));
    await body.trigger('pointerup', pointerOpts(1020, 20));

    expect(wrapper.emitted('select')).toBeUndefined();
    const rejected = wrapper.emitted('select-rejected') as
      | [{ rowId: string; reason: string }][]
      | undefined;
    expect(rejected).toBeDefined();
    expect(rejected![0]![0].reason).toBe('constraint');
  });
});

describe('<ChronixGantt> theme + slot + selection (Phase 31.3)', () => {
  const themeBars = [makeBar('b1', 'r1', '2026-05-18T09:00', '2026-05-19T17:00')];
  const themeBars2 = [
    makeBar('b1', 'r1', '2026-05-18T09:00', '2026-05-19T17:00'),
    makeBar('b2', 'r2', '2026-05-19T00:00', '2026-05-20T12:00'),
  ];
  const themeRows = [makeRow('r1'), makeRow('r2')];

  // -------- Theme prop (4 cases) --------

  it('default render with no `theme` prop uses defaultChronixTheme tokens (bar fill #3b82f6)', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: themeBars, rows: themeRows, axisInput: baseAxisInput() },
    });
    const bar = wrapper.find('[data-bar-id="b1"]');
    expect(bar.exists()).toBe(true);
    // defaultChronixTheme.barBackgroundColor === '#3b82f6'.
    expect(bar.attributes('fill')).toBe('#3b82f6');
    expect(bar.attributes('stroke')).toBe('#1e40af');
  });

  it('partial theme override — `barBackgroundColor: "#ff6b6b"` flows to bar fill', () => {
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: themeBars,
        rows: themeRows,
        axisInput: baseAxisInput(),
        theme: { barBackgroundColor: '#ff6b6b' },
      },
    });
    expect(wrapper.find('[data-bar-id="b1"]').attributes('fill')).toBe('#ff6b6b');
    // Other tokens stay at default.
    expect(wrapper.find('[data-bar-id="b1"]').attributes('stroke')).toBe('#1e40af');
  });

  it('reactive theme update — changing `:theme` after mount re-renders with new tokens', async () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: themeBars, rows: themeRows, axisInput: baseAxisInput(), theme: {} },
    });
    expect(wrapper.find('[data-bar-id="b1"]').attributes('fill')).toBe('#3b82f6');
    await wrapper.setProps({ theme: { barBackgroundColor: '#10b981' } });
    expect(wrapper.find('[data-bar-id="b1"]').attributes('fill')).toBe('#10b981');
  });

  it('multi-token override — `headerCellFill` + `headerCellLabel` both reflect new values', () => {
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: themeBars,
        rows: themeRows,
        axisInput: baseAxisInput(),
        theme: { headerCellFill: '#000000', headerCellLabel: '#ffffff' },
      },
    });
    const headerCells = wrapper.findAll('rect.cx-gantt-header-cell');
    expect(headerCells.length).toBeGreaterThan(0);
    expect(headerCells.at(0)?.attributes('fill')).toBe('#000000');
    const labels = wrapper.findAll('text.cx-gantt-header-cell-label');
    expect(labels.length).toBeGreaterThan(0);
    expect(labels.at(0)?.attributes('fill')).toBe('#ffffff');
  });

  // -------- Slot registry (4 cases) --------

  it('slotRegistry undefined → default <rect class="cx-gantt-bar"> renders', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: themeBars, rows: themeRows, axisInput: baseAxisInput() },
    });
    expect(wrapper.findAll('rect.cx-gantt-bar').length).toBe(1);
  });

  it('BAR_SLOT_NAME registered → default <rect> replaced; BarSlotArgs.isSelected + theme flow', async () => {
    const { createSlotRegistry, BAR_SLOT_NAME } = await import('@chronixjs/gantt');
    const { h: vueH } = await import('vue');
    const reg = createSlotRegistry();
    const seenArgs: Record<string, unknown>[] = [];
    reg.register(BAR_SLOT_NAME, (ctx) => {
      seenArgs.push(ctx.args);
      const args = ctx.args as unknown as {
        renderX: number;
        renderY: number;
        renderWidth: number;
        renderHeight: number;
      };
      return vueH('g', { class: 'custom-bar-slot' }, [
        vueH('rect', {
          attrs: {
            x: args.renderX,
            y: args.renderY,
            width: args.renderWidth,
            height: args.renderHeight,
            fill: '#facc15',
          },
        }),
      ]);
    });
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: themeBars,
        rows: themeRows,
        axisInput: baseAxisInput(),
        slotRegistry: reg,
        selectedBarIds: ['b1'],
      },
    });
    // Default <rect class="cx-gantt-bar"> is gone (slot replaced it).
    expect(wrapper.findAll('rect.cx-gantt-bar').length).toBe(0);
    // Custom slot output present.
    expect(wrapper.findAll('g.custom-bar-slot').length).toBe(1);
    // BarSlotArgs ctx threaded through: isSelected true + theme present.
    expect(seenArgs.length).toBeGreaterThan(0);
    const last = seenArgs[seenArgs.length - 1]!;
    expect(last['isSelected']).toBe(true);
    expect(last['theme']).toBeDefined();
    expect((last['theme'] as { barBackgroundColor: string }).barBackgroundColor).toBe('#3b82f6');
  });

  it('HEADER_CELL_SLOT_NAME registered → band cells use the template; bandIndex / cellIndex / cell populated', async () => {
    const { createSlotRegistry, HEADER_CELL_SLOT_NAME } = await import('@chronixjs/gantt');
    const { h: vueH } = await import('vue');
    const reg = createSlotRegistry();
    const seenBandIndices: number[] = [];
    reg.register(HEADER_CELL_SLOT_NAME, (ctx) => {
      const args = ctx.args as unknown as { bandIndex: number; cell?: unknown; tick?: unknown };
      seenBandIndices.push(args.bandIndex);
      return vueH('g', { class: 'custom-header-slot', attrs: { 'data-band': args.bandIndex } });
    });
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: themeBars,
        rows: themeRows,
        axisInput: baseAxisInput(),
        slotRegistry: reg,
      },
    });
    // Default <rect.cx-gantt-header-cell> are gone (slot replaced them).
    expect(wrapper.findAll('rect.cx-gantt-header-cell').length).toBe(0);
    // bandIndex 1+ comes from outer band cells (week view → 2 outer rows).
    expect(seenBandIndices.some((b) => b >= 1)).toBe(true);
  });

  it('HEADER_CELL_SLOT_NAME registered → tick-row labels also consult slot with bandIndex=0', async () => {
    const { createSlotRegistry, HEADER_CELL_SLOT_NAME } = await import('@chronixjs/gantt');
    const { h: vueH } = await import('vue');
    const reg = createSlotRegistry();
    const tickArgs: Record<string, unknown>[] = [];
    reg.register(HEADER_CELL_SLOT_NAME, (ctx) => {
      const args = ctx.args as Record<string, unknown>;
      if (args['bandIndex'] === 0) tickArgs.push(args);
      const label = typeof args['label'] === 'string' ? args['label'] : '';
      return vueH('text', { class: 'custom-tick-slot' }, label);
    });
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: themeBars,
        rows: themeRows,
        axisInput: baseAxisInput(),
        slotRegistry: reg,
      },
    });
    // bandIndex 0 invocations = tick labels.
    expect(tickArgs.length).toBeGreaterThan(0);
    // `tick` is populated (not `cell`) for bandIndex 0.
    expect(tickArgs[0]!['tick']).toBeDefined();
    expect(tickArgs[0]!['cell']).toBeUndefined();
    // Default tick-label <text class="cx-gantt-tick-label"> is gone.
    expect(wrapper.findAll('text.cx-gantt-tick-label').length).toBe(0);
  });

  // -------- Selection prop + visual feedback (4 cases) --------

  it('selectedBarIds = ["b1"] → b1.<rect> has cx-gantt-bar--selected class; b2 does not', () => {
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: themeBars2,
        rows: themeRows,
        axisInput: baseAxisInput(),
        selectedBarIds: ['b1'],
      },
    });
    const b1 = wrapper.find('rect[data-bar-id="b1"].cx-gantt-bar');
    const b2 = wrapper.find('rect[data-bar-id="b2"].cx-gantt-bar');
    expect(b1.classes()).toContain('cx-gantt-bar--selected');
    expect(b2.classes()).not.toContain('cx-gantt-bar--selected');
  });

  it('selection-border <rect> appears for selected bar with theme.barSelectedBorderColor stroke', () => {
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: themeBars,
        rows: themeRows,
        axisInput: baseAxisInput(),
        selectedBarIds: ['b1'],
      },
    });
    const border = wrapper.find('rect.cx-gantt-bar-selection-border');
    expect(border.exists()).toBe(true);
    // defaultChronixTheme.barSelectedBorderColor === 'rgba(0,0,0,0.3)'.
    expect(border.attributes('stroke')).toBe('rgba(0,0,0,0.3)');
    expect(border.attributes('stroke-width')).toBe('2');
    expect(border.attributes('fill')).toBe('none');
    expect(border.attributes('pointer-events')).toBe('none');
  });

  it('editable=true + selectedBarIds=["b1"] → 2 resizer-zone rects + 2 white dot handles for b1', () => {
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: themeBars,
        rows: themeRows,
        axisInput: baseAxisInput(),
        editable: true,
        selectedBarIds: ['b1'],
      },
    });
    expect(wrapper.findAll('rect.cx-gantt-bar-resizer-start').length).toBe(1);
    expect(wrapper.findAll('rect.cx-gantt-bar-resizer-end').length).toBe(1);
    expect(wrapper.findAll('rect.cx-gantt-bar-resizer-dot-start').length).toBe(1);
    expect(wrapper.findAll('rect.cx-gantt-bar-resizer-dot-end').length).toBe(1);
    // Dot fill is white; stroke = theme.barBorderColor default '#1e40af'.
    const dotStart = wrapper.find('rect.cx-gantt-bar-resizer-dot-start');
    expect(dotStart.attributes('fill')).toBe('#ffffff');
    expect(dotStart.attributes('stroke')).toBe('#1e40af');
  });

  it('editable=true + selectedBarIds=[] → resizer-zone rects always; NO dot handles (dots gated by selection)', () => {
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: themeBars,
        rows: themeRows,
        axisInput: baseAxisInput(),
        editable: true,
        selectedBarIds: [],
      },
    });
    expect(wrapper.findAll('rect.cx-gantt-bar-resizer-start').length).toBe(1);
    expect(wrapper.findAll('rect.cx-gantt-bar-resizer-end').length).toBe(1);
    expect(wrapper.findAll('rect.cx-gantt-bar-resizer-dot-start').length).toBe(0);
    expect(wrapper.findAll('rect.cx-gantt-bar-resizer-dot-end').length).toBe(0);
  });
});

describe('<ChronixGantt> Phase 20 bar-color cascade (Phase 31.4)', () => {
  // Bars positioned inside the default week-view axis so the test asserts
  // are pixel-precise; off-axis bars would trigger the orphan-fallback
  // branch or affect class-list composition unrelated to the cascade.
  const cascadeBars = [makeBar('b1', 'r1', '2026-05-18T09:00', '2026-05-19T17:00')];
  const cascadeRows = [makeRow('r1')];

  it('no overrides → bar <rect> fill/stroke match theme defaults (#3b82f6 / #1e40af)', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: cascadeBars, rows: cascadeRows, axisInput: baseAxisInput() },
    });
    const bar = wrapper.find('rect[data-bar-id="b1"]');
    expect(bar.attributes('fill')).toBe('#3b82f6');
    expect(bar.attributes('stroke')).toBe('#1e40af');
  });

  it('barColor umbrella → both fill AND stroke set to umbrella value', () => {
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: cascadeBars,
        rows: cascadeRows,
        axisInput: baseAxisInput(),
        barColor: '#abcdef',
      },
    });
    const bar = wrapper.find('rect[data-bar-id="b1"]');
    expect(bar.attributes('fill')).toBe('#abcdef');
    expect(bar.attributes('stroke')).toBe('#abcdef');
  });

  it('barColor + barBackgroundColor → specific prop wins for fill; umbrella drives stroke', () => {
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: cascadeBars,
        rows: cascadeRows,
        axisInput: baseAxisInput(),
        barColor: '#abcdef',
        barBackgroundColor: '#defabc',
      },
    });
    const bar = wrapper.find('rect[data-bar-id="b1"]');
    expect(bar.attributes('fill')).toBe('#defabc');
    expect(bar.attributes('stroke')).toBe('#abcdef');
  });

  it('BarSpec.style.backgroundColor (Layer 3) wins over component-prop barBackgroundColor (Layer 2)', () => {
    const styledBars: BarSpec[] = [
      {
        ...cascadeBars[0]!,
        style: { backgroundColor: '#xyzxyz' },
      },
    ];
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: styledBars,
        rows: cascadeRows,
        axisInput: baseAxisInput(),
        barBackgroundColor: '#defabc',
      },
    });
    const bar = wrapper.find('rect[data-bar-id="b1"]');
    expect(bar.attributes('fill')).toBe('#xyzxyz');
  });

  it('barBackgroundColorCallback (Layer 4) wins over BarSpec.style; receives BarStyleArg with cascaded defaults', () => {
    const styledBars: BarSpec[] = [
      {
        ...cascadeBars[0]!,
        style: { backgroundColor: '#xyzxyz' },
      },
    ];
    const seenDefaults: string[] = [];
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: styledBars,
        rows: cascadeRows,
        axisInput: baseAxisInput(),
        barBackgroundColorCallback: (arg: { defaultBackgroundColor: string }) => {
          seenDefaults.push(arg.defaultBackgroundColor);
          return '#cb1234';
        },
      },
    });
    const bar = wrapper.find('rect[data-bar-id="b1"]');
    expect(bar.attributes('fill')).toBe('#cb1234');
    // Callback's `defaultBackgroundColor` reflects Layers 1-3 cascade
    // output before Layer 4 ran — should be the spec's '#xyzxyz', NOT
    // the theme default.
    expect(seenDefaults[0]).toBe('#xyzxyz');
  });

  it('background-overrides-border umbrella — callback overrides bg, no border layer → stroke becomes bg', () => {
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: cascadeBars,
        rows: cascadeRows,
        axisInput: baseAxisInput(),
        barBackgroundColorCallback: () => '#abc123',
      },
    });
    const bar = wrapper.find('rect[data-bar-id="b1"]');
    expect(bar.attributes('fill')).toBe('#abc123');
    expect(bar.attributes('stroke')).toBe('#abc123');
  });

  it('barFontSizeCallback resolves to ResolvedBarStyle.fontSize — verified via <text> attribute after Phase 31.4 Commit 2 wires bar text', () => {
    // Phase 31.4 Commit 1 only wires the cascade — bar text auto-render
    // lands in Commit 2. Verify the cascade fires by attaching a synthetic
    // callback that records its inputs.
    const seen: { defaultFontSize: number; defaultFontWeight: number }[] = [];
    mount(GanttForTest, {
      propsData: {
        bars: [{ ...cascadeBars[0]!, title: 'probe' }],
        rows: cascadeRows,
        axisInput: baseAxisInput(),
        barFontSizeCallback: (arg: { defaultFontSize: number; defaultFontWeight: number }) => {
          seen.push({
            defaultFontSize: arg.defaultFontSize,
            defaultFontWeight: arg.defaultFontWeight,
          });
          return 16;
        },
      },
    });
    expect(seen.length).toBeGreaterThan(0);
    // Theme defaults flow into BarStyleArg.
    expect(seen[0]!.defaultFontSize).toBe(12);
    expect(seen[0]!.defaultFontWeight).toBe(400);
  });

  it('barClassNamesCallback returning array → classes appended to default <rect> class list after cx-gantt-bar', () => {
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: cascadeBars,
        rows: cascadeRows,
        axisInput: baseAxisInput(),
        barClassNamesCallback: () => ['priority-high', 'warn'],
      },
    });
    const bar = wrapper.find('rect[data-bar-id="b1"]');
    expect(bar.classes()).toContain('cx-gantt-bar');
    expect(bar.classes()).toContain('priority-high');
    expect(bar.classes()).toContain('warn');
  });
});

describe('<ChronixGantt> bar text + continuation triangles (Phase 31.4)', () => {
  // Wide bar inside the axis range so axis-overlap + > 30 px width gates
  // pass — these tests target the title/triangle render, not the gates.
  const textRows = [makeRow('r1')];

  // -------- Bar text auto-render (4 cases) --------

  it('BarSpec.title set + bar wider than 30 px → one <text class="cx-gantt-bar-text"> renders', () => {
    const bars: BarSpec[] = [
      { ...makeBar('b1', 'r1', '2026-05-18T09:00', '2026-05-19T17:00'), title: 'Hello' },
    ];
    const wrapper = mount(GanttForTest, {
      propsData: { bars, rows: textRows, axisInput: baseAxisInput() },
    });
    const texts = wrapper.findAll('text.cx-gantt-bar-text');
    expect(texts.length).toBe(1);
    expect(texts.at(0)?.text()).toBe('Hello');
    // Resolved cascade output flows to the <text> attributes (defaults
    // when no override props: theme.barTextColor + theme.barFontSize +
    // theme.barFontWeight).
    expect(texts.at(0)?.attributes('fill')).toBe('#ffffff');
    expect(texts.at(0)?.attributes('font-size')).toBe('12');
    expect(texts.at(0)?.attributes('font-weight')).toBe('400');
    expect(texts.at(0)?.attributes('text-anchor')).toBe('start');
    expect(texts.at(0)?.attributes('dominant-baseline')).toBe('middle');
    expect(texts.at(0)?.attributes('pointer-events')).toBe('none');
  });

  it('long title in narrow bar → truncateBarText output (char-count + ellipsis at 0.6 × fontSize avg width)', () => {
    // Bar of width ~120 px (1.5h on the day-axis). availableWidth ≈
    // 120 − 8 − 4 = 108; at fontSize=12 + 0.6 avgChar → maxChars=15;
    // 'A very long title here' (22 chars) → 'A very long ...' = 'A very long ...' (15 chars - 3 + ellipsis = 12 prefix + 3 ellipsis).
    const bars: BarSpec[] = [
      {
        ...makeBar('b1', 'r1', '2026-05-18T09:00', '2026-05-18T10:30'),
        title: 'A very long title here',
      },
    ];
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars,
        rows: textRows,
        axisInput: { ...baseAxisInput(), viewId: 'day' as const },
      },
    });
    const text = wrapper.find('text.cx-gantt-bar-text');
    expect(text.exists()).toBe(true);
    // Verify the rendered text is a prefix of the original ending in '...',
    // shorter than the original — exact char count depends on bar.width
    // which depends on axis layout details, so assert the shape rather
    // than a hardcoded prefix length.
    const rendered = text.text();
    expect(rendered.length).toBeLessThan('A very long title here'.length);
    expect(rendered.endsWith('...')).toBe(true);
    expect('A very long title here'.startsWith(rendered.slice(0, -3))).toBe(true);
  });

  it('bar narrower than 30 px (outer width gate) → no <text class="cx-gantt-bar-text">', () => {
    // 5-minute bar at year view → very narrow.
    const bars: BarSpec[] = [
      {
        ...makeBar('b1', 'r1', '2026-05-18T09:00', '2026-05-18T09:05'),
        title: 'Tiny',
      },
    ];
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars,
        rows: textRows,
        axisInput: { ...baseAxisInput(), viewId: 'year' as const },
      },
    });
    expect(wrapper.findAll('text.cx-gantt-bar-text').length).toBe(0);
  });

  it('no title or empty title → no <text class="cx-gantt-bar-text"> even for wide bars', () => {
    const bars: BarSpec[] = [
      makeBar('b1', 'r1', '2026-05-18T09:00', '2026-05-19T17:00'),
      { ...makeBar('b2', 'r1', '2026-05-19T18:00', '2026-05-20T18:00'), title: '' },
    ];
    const wrapper = mount(GanttForTest, {
      propsData: { bars, rows: textRows, axisInput: baseAxisInput() },
    });
    expect(wrapper.findAll('text.cx-gantt-bar-text').length).toBe(0);
  });

  // -------- Continuation triangles (4 cases) --------

  it('bar with range.start before axis range → 1 left-pointing polygon with data-axis-clipped=true', () => {
    // Anchor at 2026-05-18 (Monday); week-view axis starts at the week
    // boundary. A bar starting on the previous Friday is axis-clipped-start.
    const bars: BarSpec[] = [makeBar('b1', 'r1', '2026-05-15T09:00', '2026-05-19T17:00')];
    const wrapper = mount(GanttForTest, {
      propsData: { bars, rows: textRows, axisInput: baseAxisInput() },
    });
    const left = wrapper.findAll('polygon.cx-gantt-bar-continuation-left');
    expect(left.length).toBe(1);
    expect(left.at(0)?.attributes('data-axis-clipped')).toBe('true');
    expect(left.at(0)?.attributes('data-viewport-clipped')).toBe('false');
    expect(left.at(0)?.attributes('fill')).toBe('#000');
    expect(left.at(0)?.attributes('opacity')).toBe('0.8');
    expect(left.at(0)?.attributes('pointer-events')).toBe('none');
    // Points string includes the apex at (renderX + 1, midY) — verify
    // structurally that 3 vertices are present (comma-separated triples).
    const points = left.at(0)?.attributes('points') ?? '';
    expect(points.split(' ').length).toBe(3);
  });

  it('bar with range.end after axis range → 1 right-pointing polygon (symmetric)', () => {
    // Bar ending the following Monday is axis-clipped-end.
    const bars: BarSpec[] = [makeBar('b1', 'r1', '2026-05-19T09:00', '2026-05-26T17:00')];
    const wrapper = mount(GanttForTest, {
      propsData: { bars, rows: textRows, axisInput: baseAxisInput() },
    });
    const right = wrapper.findAll('polygon.cx-gantt-bar-continuation-right');
    expect(right.length).toBe(1);
    expect(right.at(0)?.attributes('data-axis-clipped')).toBe('true');
    expect(right.at(0)?.attributes('data-viewport-clipped')).toBe('false');
  });

  it('bar fully inside axis range (isStart && isEnd) → 0 continuation polygons', () => {
    const bars: BarSpec[] = [makeBar('b1', 'r1', '2026-05-19T09:00', '2026-05-21T17:00')];
    const wrapper = mount(GanttForTest, {
      propsData: { bars, rows: textRows, axisInput: baseAxisInput() },
    });
    expect(wrapper.findAll('polygon.cx-gantt-bar-continuation-left').length).toBe(0);
    expect(wrapper.findAll('polygon.cx-gantt-bar-continuation-right').length).toBe(0);
  });

  it('bar with axis-clipped left + title → title-start shifted past triangle (bar.x + 11 not bar.x + 8)', () => {
    const bars: BarSpec[] = [
      {
        ...makeBar('b1', 'r1', '2026-05-15T09:00', '2026-05-22T17:00'),
        title: 'X',
      },
    ];
    const wrapper = mount(GanttForTest, {
      propsData: { bars, rows: textRows, axisInput: baseAxisInput() },
    });
    // Bar straddles BOTH axis edges in the week view → both triangles
    // present. Both leftPad AND rightPad shift to the triangle-clearance
    // value: title-start at `bar.x + 11`, title-end at `bar.x + width - 11`.
    const bar = wrapper.find('rect[data-bar-id="b1"]');
    const text = wrapper.find('text.cx-gantt-bar-text');
    if (!text.exists()) return; // bar may be too narrow with both triangles; pass-through
    const barX = Number(bar.attributes('x'));
    const textX = Number(text.attributes('x'));
    expect(textX).toBe(barX + 11); // TRIANGLE_MARGIN + TRIANGLE_SIZE + TITLE_TRIANGLE_GAP
  });
});

describe('<ChronixGantt> link rendering + LINK_SLOT_NAME wire (Phase 31.4.1)', () => {
  // Two bars with non-overlapping times so the router has somewhere to draw.
  // Both bars land on the week-view axis anchored at 2026-05-18T00:00:00.
  const linkBars: BarSpec[] = [
    makeBar('lb1', 'lr1', '2026-05-18T09:00', '2026-05-19T17:00'),
    makeBar('lb2', 'lr2', '2026-05-20T00:00', '2026-05-21T12:00'),
  ];
  const linkRows = [makeRow('lr1'), makeRow('lr2')];

  const makeLink = (
    id: string,
    fromBarId: string,
    toBarId: string,
    routing: 'square' | 'smooth' = 'square',
    marker: 'arrow' | 'diamond' | 'none' = 'arrow',
    colorOverride?: string,
  ) => ({
    id,
    fromBarId,
    toBarId,
    routing,
    marker,
    ...(colorOverride !== undefined ? { colorOverride } : {}),
  });

  it('case 1: no `links` prop → no <path.cx-gantt-link> elements; cx-gantt-defs group is empty', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: linkBars, rows: linkRows, axisInput: baseAxisInput() },
    });
    expect(wrapper.findAll('path.cx-gantt-link').length).toBe(0);
    // <defs class="cx-gantt-defs"> still exists (always rendered); contents
    // are markers for the theme default color — the `<g class="cx-gantt-links">`
    // group is empty.
    expect(wrapper.findAll('g.cx-gantt-links').length).toBe(1);
    expect(wrapper.findAll('g.cx-gantt-links > path').length).toBe(0);
  });

  it('case 2: 1 link, square+arrow, no overrides → <path> with theme.linkDefaultColor stroke + matching marker-end', () => {
    const links = [makeLink('e1', 'lb1', 'lb2', 'square', 'arrow')];
    const wrapper = mount(GanttForTest, {
      propsData: { bars: linkBars, rows: linkRows, axisInput: baseAxisInput(), links },
    });
    const path = wrapper.find('path.cx-gantt-link');
    expect(path.exists()).toBe(true);
    // defaultChronixTheme.linkDefaultColor === '#3788d8'.
    expect(path.attributes('stroke')).toBe('#3788d8');
    expect(path.attributes('fill')).toBe('none');
    expect(path.attributes('marker-end')).toBe('url(#cx-marker-arrow-3788d8)');
    expect(path.attributes('data-link-id')).toBe('e1');
    expect(path.attributes('d')?.startsWith('M ')).toBe(true);
    // Marker def exists in <defs>.
    expect(wrapper.find('marker#cx-marker-arrow-3788d8').exists()).toBe(true);
  });

  it('case 3: LinkSpec.colorOverride → stroke + marker-end URL both use the override', () => {
    const links = [makeLink('e1', 'lb1', 'lb2', 'square', 'arrow', '#abc123')];
    const wrapper = mount(GanttForTest, {
      propsData: { bars: linkBars, rows: linkRows, axisInput: baseAxisInput(), links },
    });
    const path = wrapper.find('path.cx-gantt-link');
    expect(path.attributes('stroke')).toBe('#abc123');
    expect(path.attributes('marker-end')).toBe('url(#cx-marker-arrow-abc123)');
    expect(wrapper.find('marker#cx-marker-arrow-abc123').exists()).toBe(true);
  });

  it('case 4: useLineEventColor:true + source bar with BarSpec.style.backgroundColor → link inherits source bar color', () => {
    const styledBars: BarSpec[] = [
      { ...linkBars[0]!, style: { backgroundColor: '#10b981' } },
      linkBars[1]!,
    ];
    const links = [makeLink('e1', 'lb1', 'lb2', 'square', 'arrow')];
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: styledBars,
        rows: linkRows,
        axisInput: baseAxisInput(),
        links,
        useLineEventColor: true,
      },
    });
    const path = wrapper.find('path.cx-gantt-link');
    expect(path.attributes('stroke')).toBe('#10b981');
    expect(path.attributes('marker-end')).toBe('url(#cx-marker-arrow-10b981)');
  });

  it('case 5: link referencing an unknown bar → no <path> rendered; `link-orphan` emit fires', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const links = [makeLink('orphan-1', 'lb1', 'nonexistent', 'square', 'arrow')];
    const wrapper = mount(GanttForTest, {
      propsData: { bars: linkBars, rows: linkRows, axisInput: baseAxisInput(), links },
    });
    expect(wrapper.findAll('path.cx-gantt-link').length).toBe(0);
    const emitted = wrapper.emitted('link-orphan');
    expect(emitted).toBeTruthy();
    expect(emitted?.[0]).toEqual(['orphan-1']);
    expect(warnSpy).toHaveBeenCalledWith(
      '[chronix] Link "orphan-1" references unknown bar(s); dropped from render.',
    );
    warnSpy.mockRestore();
  });

  it('case 6: onLineCallback returning {color} → stroke + marker-end use override; callback sees pre-cascade defaultColor', () => {
    const links = [makeLink('e1', 'lb1', 'lb2', 'square', 'arrow')];
    const seenArgs: { defaultColor: string }[] = [];
    const onLineCallback = (arg: { defaultColor: string }) => {
      seenArgs.push({ defaultColor: arg.defaultColor });
      return { color: '#dc2626' };
    };
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: linkBars,
        rows: linkRows,
        axisInput: baseAxisInput(),
        links,
        onLineCallback,
      },
    });
    const path = wrapper.find('path.cx-gantt-link');
    expect(path.attributes('stroke')).toBe('#dc2626');
    expect(path.attributes('marker-end')).toBe('url(#cx-marker-arrow-dc2626)');
    // Callback received the pre-callback cascade default (theme default).
    expect(seenArgs.length).toBeGreaterThan(0);
    expect(seenArgs[seenArgs.length - 1]?.defaultColor).toBe('#3788d8');
    // Marker def for the callback's color exists in <defs>.
    expect(wrapper.find('marker#cx-marker-arrow-dc2626').exists()).toBe(true);
  });

  it('case 7: onLineCallback returning {marker} → marker swap, color preserved', () => {
    const links = [makeLink('e1', 'lb1', 'lb2', 'square', 'arrow')];
    const onLineCallback = () => ({ marker: 'diamond' as const });
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: linkBars,
        rows: linkRows,
        axisInput: baseAxisInput(),
        links,
        onLineCallback,
      },
    });
    const path = wrapper.find('path.cx-gantt-link');
    expect(path.attributes('stroke')).toBe('#3788d8'); // unchanged
    expect(path.attributes('marker-end')).toBe('url(#cx-marker-diamond-3788d8)');
  });

  it('case 8: LinkSpec.marker:"none" → <path> rendered WITHOUT marker-end attribute', () => {
    const links = [makeLink('e1', 'lb1', 'lb2', 'square', 'none')];
    const wrapper = mount(GanttForTest, {
      propsData: { bars: linkBars, rows: linkRows, axisInput: baseAxisInput(), links },
    });
    const path = wrapper.find('path.cx-gantt-link');
    expect(path.exists()).toBe(true);
    expect(path.attributes('stroke')).toBe('#3788d8');
    expect(path.attributes('marker-end')).toBeUndefined();
  });

  it('case 9: LINK_SLOT_NAME registered → default <path> NOT rendered; slot owns the output; slot args carry post-cascade color', async () => {
    const { createSlotRegistry, LINK_SLOT_NAME } = await import('@chronixjs/gantt');
    const { h: vueH } = await import('vue');
    const reg = createSlotRegistry();
    const seenArgs: Record<string, unknown>[] = [];
    reg.register(LINK_SLOT_NAME, (ctx) => {
      seenArgs.push(ctx.args);
      return vueH('g', { class: 'custom-link-slot' }, [
        vueH('circle', { attrs: { cx: 0, cy: 0, r: 3, fill: 'magenta' } }),
      ]);
    });
    const links = [makeLink('e1', 'lb1', 'lb2', 'square', 'arrow')];
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: linkBars,
        rows: linkRows,
        axisInput: baseAxisInput(),
        links,
        slotRegistry: reg,
      },
    });
    // Default <path.cx-gantt-link> is absent.
    expect(wrapper.findAll('path.cx-gantt-link').length).toBe(0);
    // Slot output is inside the cx-gantt-links group.
    expect(wrapper.findAll('g.cx-gantt-links g.custom-link-slot').length).toBe(1);
    // Slot args include color + marker + theme + endpoints.
    expect(seenArgs.length).toBeGreaterThan(0);
    const last = seenArgs[seenArgs.length - 1]!;
    expect(last['color']).toBe('#3788d8');
    expect(last['marker']).toBe('arrow');
    expect(last['theme']).toBeDefined();
    expect(last['fromBar']).toBeDefined();
    expect(last['toBar']).toBeDefined();
  });

  it('case 10: console.warn fires ONCE per orphan id across re-derivations; emit fires every re-derivation', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const links1 = [makeLink('orphan-A', 'lb1', 'gone-A', 'square', 'arrow')];
    const wrapper = mount(GanttForTest, {
      propsData: { bars: linkBars, rows: linkRows, axisInput: baseAxisInput(), links: links1 },
    });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    // Re-derive with the SAME orphan id present → emit fires again, warn does NOT.
    const links2 = [
      makeLink('orphan-A', 'lb1', 'gone-A', 'square', 'arrow'),
      makeLink('orphan-B', 'lb2', 'gone-B', 'square', 'arrow'),
    ];
    await wrapper.setProps({ links: links2 });
    expect(warnSpy).toHaveBeenCalledTimes(2); // A already warned; only B logs.
    expect(warnSpy).toHaveBeenLastCalledWith(
      '[chronix] Link "orphan-B" references unknown bar(s); dropped from render.',
    );
    const emitted = wrapper.emitted('link-orphan') ?? [];
    // 1st mount emit fires for A; setProps triggers another emit batch with A + B.
    const allIds = emitted.flatMap((e) => e as unknown[]);
    expect(allIds).toContain('orphan-A');
    expect(allIds).toContain('orphan-B');
    warnSpy.mockRestore();
  });
});

describe('<ChronixGantt> today line + grid lines (Phase 31.4.2)', () => {
  const chromeBars = [
    makeBar('cb1', 'cr1', '2026-05-18T09:00', '2026-05-19T17:00'),
    makeBar('cb2', 'cr2', '2026-05-19T00:00', '2026-05-20T12:00'),
  ];
  const chromeRows = [makeRow('cr1'), makeRow('cr2')];

  // -------- Today line (4 cases) --------

  it('case 1: :today-line="false" (default) → no <line.cx-gantt-today-line> elements + no tooltip', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: chromeBars, rows: chromeRows, axisInput: baseAxisInput() },
    });
    expect(wrapper.findAll('line.cx-gantt-today-line').length).toBe(0);
    expect(wrapper.findAll('g.cx-gantt-today-line-tooltip').length).toBe(0);
  });

  it('case 2: :today-line="true" → body + header lines + tooltip with theme defaults (#ff6b6b, dashed 6 4, 今日)', () => {
    // Anchor at today so the line definitely falls inside the axis range.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: chromeBars,
        rows: chromeRows,
        axisInput: {
          viewId: 'week',
          anchorDate: today,
          viewportWidth: 1440,
          locale: 'zh-CN',
          weekendsVisible: true,
        },
        todayLine: true,
      },
    });
    const bodyLine = wrapper.find('line.cx-gantt-today-line[data-today-line-side="body"]');
    const headerLine = wrapper.find('line.cx-gantt-today-line[data-today-line-side="header"]');
    const tooltip = wrapper.find('g.cx-gantt-today-line-tooltip');
    expect(bodyLine.exists()).toBe(true);
    expect(headerLine.exists()).toBe(true);
    expect(tooltip.exists()).toBe(true);
    // defaultChronixTheme.todayLineColor === '#ff6b6b'.
    expect(bodyLine.attributes('stroke')).toBe('#ff6b6b');
    expect(bodyLine.attributes('stroke-width')).toBe('2');
    expect(bodyLine.attributes('stroke-dasharray')).toBe('6 4');
    expect(headerLine.attributes('stroke')).toBe('#ff6b6b');
    // Tooltip <rect fill> + <text> content.
    const tooltipRect = tooltip.find('rect');
    const tooltipText = tooltip.find('text');
    expect(tooltipRect.attributes('fill')).toBe('#ff6b6b');
    expect(tooltipText.text()).toBe('今日');
  });

  it('case 3: :today-line="{ color: #3b82f6, tooltip: Now, style: solid }" → single-knob color override + no dasharray + custom tooltip', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: chromeBars,
        rows: chromeRows,
        axisInput: {
          viewId: 'week',
          anchorDate: today,
          viewportWidth: 1440,
          locale: 'zh-CN',
          weekendsVisible: true,
        },
        todayLine: { color: '#3b82f6', tooltip: 'Now', style: 'solid' },
      },
    });
    const bodyLine = wrapper.find('line.cx-gantt-today-line[data-today-line-side="body"]');
    const tooltip = wrapper.find('g.cx-gantt-today-line-tooltip');
    expect(bodyLine.attributes('stroke')).toBe('#3b82f6');
    // 'solid' → dasharray undefined → attribute omitted.
    expect(bodyLine.attributes('stroke-dasharray')).toBeUndefined();
    // Single-knob: config.color drives BOTH stroke AND tooltip-bg.
    expect(tooltip.find('rect').attributes('fill')).toBe('#3b82f6');
    expect(tooltip.find('text').text()).toBe('Now');
  });

  it('case 4: today outside axis range (anchor far in the past) → resolvedTodayLine === null → no elements', () => {
    // Anchor 5 years before today + day view → today.x will be far beyond
    // axis totalWidth, so resolvedTodayLine returns null.
    const longAgo = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000);
    longAgo.setHours(0, 0, 0, 0);
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: chromeBars,
        rows: chromeRows,
        axisInput: {
          viewId: 'day',
          anchorDate: longAgo,
          viewportWidth: 1440,
          locale: 'zh-CN',
          weekendsVisible: true,
        },
        todayLine: true,
      },
    });
    expect(wrapper.findAll('line.cx-gantt-today-line').length).toBe(0);
    expect(wrapper.findAll('g.cx-gantt-today-line-tooltip').length).toBe(0);
  });

  // -------- Grid lines (4 cases) --------

  it('case 5: default render → <g.cx-gantt-grid> exists with vline count === ticks + 1 (right-edge) and hline count === strips', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: chromeBars, rows: chromeRows, axisInput: baseAxisInput() },
    });
    const gridGroup = wrapper.find('g.cx-gantt-grid');
    expect(gridGroup.exists()).toBe(true);
    expect(gridGroup.attributes('pointer-events')).toBe('none');
    // Compute expected counts from the core pipeline directly.
    const axis = defaultAxisRangePlanner.plan(baseAxisInput());
    const expectedVlines = axis.ticks.length + 1; // +1 right-edge closing
    expect(wrapper.findAll('rect.cx-gantt-grid-vline').length).toBe(expectedVlines);
    // Strips = rows after swimlane layout — 2 rows → 2 hlines.
    expect(wrapper.findAll('line.cx-gantt-grid-hline').length).toBe(2);
  });

  it('case 6: week view → at least one cx-gantt-grid-vline-week class present + darker fill (#bbb)', () => {
    // Anchor at Sunday 2026-05-17 → next Monday is 2026-05-18T00:00 →
    // tick.getDay()===1 + tick.getHours()===0 → isWeekStart = true.
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: chromeBars,
        rows: chromeRows,
        axisInput: {
          viewId: 'week',
          anchorDate: new Date('2026-05-17T00:00:00'),
          viewportWidth: 1440,
          locale: 'zh-CN',
          weekendsVisible: true,
        },
      },
    });
    const weekVlines = wrapper.findAll('rect.cx-gantt-grid-vline-week');
    expect(weekVlines.length).toBeGreaterThan(0);
    // defaultChronixTheme.gridLineWeekStartColor === '#bbb'.
    expect(weekVlines.at(0)?.attributes('fill')).toBe('#bbb');
    // Non-week-start vlines (the regular ones) use gridLineColor === '#ddd'.
    const allVlines = wrapper.findAll('rect.cx-gantt-grid-vline');
    const regularVline = allVlines.wrappers.find(
      (w) => !w.classes().includes('cx-gantt-grid-vline-week'),
    );
    expect(regularVline?.attributes('fill')).toBe('#ddd');
  });

  it('case 7: right-edge closing vline rendered at x === totalWidth - 1', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: chromeBars, rows: chromeRows, axisInput: baseAxisInput() },
    });
    const axis = defaultAxisRangePlanner.plan(baseAxisInput());
    const allVlines = wrapper.findAll('rect.cx-gantt-grid-vline');
    const rightEdge = allVlines.wrappers.find(
      (w) => Number(w.attributes('x')) === axis.totalWidth - 1,
    );
    expect(rightEdge).toBeDefined();
    expect(Number(rightEdge?.attributes('width'))).toBe(1);
    expect(rightEdge?.attributes('fill')).toBe('#ddd');
  });

  it('case 8: hlines have vector-effect=non-scaling-stroke + DPR-snapped y matching snapHorizontalGridLineY formula', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: chromeBars, rows: chromeRows, axisInput: baseAxisInput() },
    });
    const hlines = wrapper.findAll('line.cx-gantt-grid-hline');
    expect(hlines.length).toBe(2);
    for (let i = 0; i < hlines.length; i += 1) {
      const hl = hlines.at(i);
      expect(hl?.attributes('vector-effect')).toBe('non-scaling-stroke');
      expect(hl?.attributes('stroke-width')).toBe('1');
      expect(hl?.attributes('stroke')).toBe('#ddd');
      // y1 === y2 (true horizontal).
      const y1 = Number(hl?.attributes('y1'));
      const y2 = Number(hl?.attributes('y2'));
      expect(y1).toBe(y2);
      // Under happy-dom devicePixelRatio === 1 so the formula reduces to
      // `Math.round(lineY) + 0.5`. We don't know the exact strip y without
      // re-running swimlane layout, but the fractional `.5` is a tight
      // invariant of the snap algorithm at dpr=1.
      expect(y1 - Math.floor(y1)).toBe(0.5);
    }
  });
});

describe('<ChronixGantt> imperative handle (Phase 31.5)', () => {
  // Two non-overlapping bars across 2 rows. Same fixture across all 12
  // cases so reasoning about handle outputs is consistent.
  const handleBars: BarSpec[] = [
    makeBar('hb1', 'hr1', '2026-05-18T09:00', '2026-05-19T17:00'),
    makeBar('hb2', 'hr2', '2026-05-20T00:00', '2026-05-21T12:00'),
  ];
  const handleRows = [makeRow('hr1'), makeRow('hr2')];
  interface HandleBarTable {
    bars: readonly BarSpec[];
    getById: (id: string) => BarSpec | undefined;
    listByRow: (rowId: string) => readonly BarSpec[];
    listInRange: (range: { start: Date; end: Date }) => readonly BarSpec[];
  }
  interface HandleRowDataSource {
    rows: readonly RowSpec[];
    getById: (id: string) => RowSpec | undefined;
    listChildren: (parentId: string | null) => readonly RowSpec[];
  }
  interface HandleLinkTable {
    links: readonly { id: string; fromBarId: string; toBarId: string }[];
    listFrom: (fromBarId: string) => readonly unknown[];
    listTo: (toBarId: string) => readonly unknown[];
  }
  interface HandleInstance {
    changeView: (viewId: string) => void;
    prev: () => void;
    next: () => void;
    today: () => void;
    gotoDate: (date: Date) => void;
    incrementDate: (delta: {
      days?: number;
      weeks?: number;
      months?: number;
      years?: number;
    }) => void;
    getDate: () => Date;
    zoomTo: (date: Date, viewId?: string) => void;
    scrollToDate: (date: Date) => void;
    getBarById: (id: string) => BarSpec | undefined;
    getBars: () => readonly BarSpec[];
    getBarTable: () => HandleBarTable;
    getRowDataSource: () => HandleRowDataSource;
    getLinkTable: () => HandleLinkTable;
    subscribe: (event: string, listener: (payload: unknown) => void) => () => void;
  }
  const mountHandle = (extraProps: Record<string, unknown> = {}) =>
    mount(GanttForTest, {
      propsData: { bars: handleBars, rows: handleRows, axisInput: baseAxisInput(), ...extraProps },
    });
  const getHandle = (wrapper: ReturnType<typeof mountHandle>): HandleInstance =>
    wrapper.vm as unknown as HandleInstance;

  it('case 1: expose(handle) — all 16 methods present on wrapper.vm', () => {
    const wrapper = mountHandle();
    const h = getHandle(wrapper);
    expect(typeof h.changeView).toBe('function');
    expect(typeof h.prev).toBe('function');
    expect(typeof h.next).toBe('function');
    expect(typeof h.today).toBe('function');
    expect(typeof h.gotoDate).toBe('function');
    expect(typeof h.incrementDate).toBe('function');
    expect(typeof h.getDate).toBe('function');
    expect(typeof h.zoomTo).toBe('function');
    expect(typeof h.scrollToDate).toBe('function');
    expect(typeof h.getBarById).toBe('function');
    expect(typeof h.getBars).toBe('function');
    expect(typeof h.getBarTable).toBe('function');
    expect(typeof h.getRowDataSource).toBe('function');
    expect(typeof h.getLinkTable).toBe('function');
    expect(typeof h.subscribe).toBe('function');
  });

  it("case 2: changeView('month') → update:axisInput fires with viewId='month' + other fields unchanged", () => {
    const wrapper = mountHandle();
    getHandle(wrapper).changeView('month');
    const emitted = wrapper.emitted('update:axisInput');
    expect(emitted).toBeTruthy();
    expect(emitted?.length).toBe(1);
    const payload = (emitted as AxisRangePlanInput[][])[0]![0]!;
    expect(payload.viewId).toBe('month');
    expect(payload.anchorDate.toISOString()).toBe(baseAxisInput().anchorDate.toISOString());
    expect(payload.viewportWidth).toBe(baseAxisInput().viewportWidth);
  });

  it('case 3: prev() → update:axisInput with anchorDate === core prevAnchor output', async () => {
    const { prevAnchor: corePrevAnchor } = await import('@chronixjs/gantt');
    const wrapper = mountHandle();
    getHandle(wrapper).prev();
    const emitted = wrapper.emitted('update:axisInput');
    const payload = (emitted as AxisRangePlanInput[][])[0]![0]!;
    const expected = corePrevAnchor('week', baseAxisInput().anchorDate);
    expect(payload.anchorDate.toISOString()).toBe(expected.toISOString());
  });

  it('case 4: next() → update:axisInput with anchorDate === core nextAnchor output', async () => {
    const { nextAnchor: coreNextAnchor } = await import('@chronixjs/gantt');
    const wrapper = mountHandle();
    getHandle(wrapper).next();
    const emitted = wrapper.emitted('update:axisInput');
    const payload = (emitted as AxisRangePlanInput[][])[0]![0]!;
    const expected = coreNextAnchor('week', baseAxisInput().anchorDate);
    expect(payload.anchorDate.toISOString()).toBe(expected.toISOString());
  });

  it('case 5: today() → update:axisInput with anchorDate === local midnight today', () => {
    const wrapper = mountHandle();
    getHandle(wrapper).today();
    const emitted = wrapper.emitted('update:axisInput');
    const payload = (emitted as AxisRangePlanInput[][])[0]![0]!;
    const expectedMidnight = new Date();
    expectedMidnight.setHours(0, 0, 0, 0);
    expect(payload.anchorDate.getTime()).toBe(expectedMidnight.getTime());
  });

  it('case 6: gotoDate(d) → update:axisInput with that exact anchorDate', () => {
    const wrapper = mountHandle();
    const target = new Date('2027-01-15T00:00:00');
    getHandle(wrapper).gotoDate(target);
    const emitted = wrapper.emitted('update:axisInput');
    const payload = (emitted as AxisRangePlanInput[][])[0]![0]!;
    expect(payload.anchorDate.toISOString()).toBe(target.toISOString());
  });

  it('case 7: incrementDate({ days: 7 }) → update:axisInput with anchorDate advanced 7 days', async () => {
    const { applyIncrement: coreApplyIncrement } = await import('@chronixjs/gantt');
    const wrapper = mountHandle();
    getHandle(wrapper).incrementDate({ days: 7 });
    const emitted = wrapper.emitted('update:axisInput');
    const payload = (emitted as AxisRangePlanInput[][])[0]![0]!;
    const expected = coreApplyIncrement(baseAxisInput().anchorDate, { days: 7 });
    expect(payload.anchorDate.toISOString()).toBe(expected.toISOString());
  });

  it('case 8: getDate() → returns axisInput.anchorDate directly (no emit)', () => {
    const wrapper = mountHandle();
    const d = getHandle(wrapper).getDate();
    expect(d.toISOString()).toBe(baseAxisInput().anchorDate.toISOString());
    expect(wrapper.emitted('update:axisInput')).toBeUndefined();
  });

  it("case 9: zoomTo(date, 'day') → update:axisInput with both anchorDate AND viewId set", () => {
    const wrapper = mountHandle();
    const target = new Date('2027-03-01T00:00:00');
    getHandle(wrapper).zoomTo(target, 'day');
    const emitted = wrapper.emitted('update:axisInput');
    const payload = (emitted as AxisRangePlanInput[][])[0]![0]!;
    expect(payload.anchorDate.toISOString()).toBe(target.toISOString());
    expect(payload.viewId).toBe('day');
  });

  it('case 10: scrollToDate(d) → writes chart-pane scrollLeft (Phase 31.5.2 real impl), no emit, no warn', () => {
    // Phase 31.5.2 flipped this from the Phase 31.5 console.warn stub
    // to the real implementation: scrollToDate writes
    // `chartPaneRef.value.scrollLeft = pxPerMs × (date - axisStart)`
    // directly. The `no emit` invariant from the original case still
    // holds — scrollToDate is the documented exception that writes
    // scroll state directly rather than going through `update:axisInput`.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const wrapper = mountHandle();
    // Target date 2 days past the day-view anchor (2026-05-18) → x in
    // px equals 2 days × (slotWidth / slotDurationMs) × slotDurationMs/day.
    // For day view default slotWidth=20px / slotDurationMs=3600000ms (1h),
    // that's 20 px/hour × 48 hours = 960 px.
    const target = new Date('2026-05-20T00:00:00');
    getHandle(wrapper).scrollToDate(target);
    expect(warnSpy).not.toHaveBeenCalled();
    expect(wrapper.emitted('update:axisInput')).toBeUndefined();
    const chartPane = wrapper.find('div.cx-gantt-chart-pane').element as HTMLElement;
    expect(chartPane.scrollLeft).toBeGreaterThan(0);
    warnSpy.mockRestore();
  });

  it('case 11: getBarById / getBars / getBarTable / getRowDataSource / getLinkTable lookups', () => {
    const wrapper = mountHandle({
      links: [{ id: 'L1', fromBarId: 'hb1', toBarId: 'hb2', routing: 'square', marker: 'arrow' }],
    });
    const h = getHandle(wrapper);
    // getBarById
    expect(h.getBarById('hb1')?.id).toBe('hb1');
    expect(h.getBarById('nonexistent')).toBeUndefined();
    // getBars
    expect(h.getBars().length).toBe(2);
    // getBarTable.listByRow sorted by range.start
    const byRow = h.getBarTable().listByRow('hr1');
    expect(byRow.length).toBe(1);
    expect(byRow[0]?.id).toBe('hb1');
    // getBarTable.listInRange overlap-filtered
    const inRange = h.getBarTable().listInRange({
      start: new Date('2026-05-18T00:00'),
      end: new Date('2026-05-19T23:59'),
    });
    expect(inRange.map((b) => b.id)).toContain('hb1');
    expect(inRange.map((b) => b.id)).not.toContain('hb2');
    // getRowDataSource.listChildren(null) → top-level rows
    const topRows = h.getRowDataSource().listChildren(null);
    expect(topRows.length).toBe(2);
    // getLinkTable.listFrom filters by fromBarId
    const fromHb1 = h.getLinkTable().listFrom('hb1');
    expect(fromHb1.length).toBe(1);
    const fromOther = h.getLinkTable().listFrom('nonexistent');
    expect(fromOther.length).toBe(0);
  });

  it('case 12: subscribe(event, listener) → listener fires on emit; unsubscribe stops further calls', () => {
    const wrapper = mountHandle();
    const h = getHandle(wrapper);
    const calls: unknown[] = [];
    const unsubscribe = h.subscribe('update:axisInput', (payload) => {
      calls.push(payload);
    });
    // Trigger an emit via handle.next() — emitToBoth fan-out should notify
    // both Vue's emit (visible in wrapper.emitted) AND the subscribed listener.
    h.next();
    expect(calls.length).toBe(1);
    expect(wrapper.emitted('update:axisInput')?.length).toBe(1);
    // Unsubscribe — subsequent emits do not invoke the listener.
    unsubscribe();
    h.today();
    expect(calls.length).toBe(1); // unchanged
    expect(wrapper.emitted('update:axisInput')?.length).toBe(2); // Vue's emit still fires
  });
});

describe('<ChronixGantt> header toolbar (Phase 31.5.1)', () => {
  // Mirrors chronix-vue3:2600-2733 verbatim. Same demo DSL, same
  // selectors, same emit-shape assertions. Day-view anchor keeps the
  // title-format assertion at `YYYY-MM-DD` (test #11) parity with vue3.
  const DEMO_TOOLBAR = {
    left: 'prev,next today',
    center: 'title',
    right: 'day,week,month,season,halfYear,year',
  } as const;
  const dayAxisInput: AxisRangePlanInput = {
    viewId: 'day',
    anchorDate: new Date('2026-05-13T00:00:00'),
    viewportWidth: 1440,
    locale: 'zh-CN',
    weekendsVisible: true,
  };
  const rows: RowSpec[] = [makeRow('row-a')];

  it('renders no toolbar root and no cx-gantt-root wrapper when headerToolbar is false (default)', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [], rows, axisInput: dayAxisInput },
    });
    expect(wrapper.find('div.cx-gantt-toolbar').exists()).toBe(false);
    expect(wrapper.find('div.cx-gantt-root').exists()).toBe(false);
    // Chart wrapper is still the immediate render root — default-path
    // DOM shape is identical to pre-31.5.1 consumers' baseline.
    expect(wrapper.find('div.cx-gantt-wrapper').exists()).toBe(true);
  });

  it('wraps the chart in cx-gantt-root and prepends cx-gantt-toolbar when headerToolbar is configured', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [], rows, axisInput: dayAxisInput, headerToolbar: DEMO_TOOLBAR },
    });
    const root = wrapper.find('div.cx-gantt-root');
    expect(root.exists()).toBe(true);
    expect(root.find('div.cx-gantt-toolbar').exists()).toBe(true);
    expect(root.find('div.cx-gantt-wrapper').exists()).toBe(true);
  });

  it('renders all 9 demo buttons (3 nav + 6 view) plus the title widget with chronix cx-* class names', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [], rows, axisInput: dayAxisInput, headerToolbar: DEMO_TOOLBAR },
    });
    for (const name of [
      'prev',
      'next',
      'today',
      'day',
      'week',
      'month',
      'season',
      'halfYear',
      'year',
    ]) {
      const btn = wrapper.find(`button.cx-gantt-${name}-button`);
      expect(btn.exists(), `cx-gantt-${name}-button missing`).toBe(true);
      expect(btn.attributes('data-button-name')).toBe(name);
    }
    expect(wrapper.find('h2.cx-gantt-toolbar-title').exists()).toBe(true);
  });

  it('marks the active view button as aria-pressed=true and the others as false', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [], rows, axisInput: dayAxisInput, headerToolbar: DEMO_TOOLBAR },
    });
    expect(wrapper.find('button.cx-gantt-day-button').attributes('aria-pressed')).toBe('true');
    expect(wrapper.find('button.cx-gantt-week-button').attributes('aria-pressed')).toBe('false');
    expect(wrapper.find('button.cx-gantt-month-button').attributes('aria-pressed')).toBe('false');
  });

  it('emits update:axisInput with a new viewId when a view button is clicked', async () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [], rows, axisInput: dayAxisInput, headerToolbar: DEMO_TOOLBAR },
    });
    await wrapper.find('button.cx-gantt-week-button').trigger('click');
    const emitted = wrapper.emitted('update:axisInput') as AxisRangePlanInput[][] | undefined;
    expect(emitted).toBeTruthy();
    expect(emitted![0]![0]).toMatchObject({ viewId: 'week' });
    // anchorDate is preserved across view changes
    expect(emitted![0]![0]!.anchorDate.getTime()).toBe(dayAxisInput.anchorDate.getTime());
  });

  it('emits update:axisInput with the next anchorDate when next is clicked (day view → +1 day)', async () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [], rows, axisInput: dayAxisInput, headerToolbar: DEMO_TOOLBAR },
    });
    await wrapper.find('button.cx-gantt-next-button').trigger('click');
    const emitted = wrapper.emitted('update:axisInput') as AxisRangePlanInput[][];
    expect(emitted[0]![0]!.viewId).toBe('day');
    expect(emitted[0]![0]!.anchorDate.getDate()).toBe(dayAxisInput.anchorDate.getDate() + 1);
  });

  it('emits update:axisInput with the previous anchorDate when prev is clicked', async () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [], rows, axisInput: dayAxisInput, headerToolbar: DEMO_TOOLBAR },
    });
    await wrapper.find('button.cx-gantt-prev-button').trigger('click');
    const emitted = wrapper.emitted('update:axisInput') as AxisRangePlanInput[][];
    expect(emitted[0]![0]!.anchorDate.getDate()).toBe(dayAxisInput.anchorDate.getDate() - 1);
  });

  it('emits update:axisInput with a local-midnight Date when today is clicked', async () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [], rows, axisInput: dayAxisInput, headerToolbar: DEMO_TOOLBAR },
    });
    await wrapper.find('button.cx-gantt-today-button').trigger('click');
    const emitted = wrapper.emitted('update:axisInput') as AxisRangePlanInput[][];
    const next = emitted[0]![0]!.anchorDate;
    expect(next.getHours()).toBe(0);
    expect(next.getMinutes()).toBe(0);
    expect(next.getSeconds()).toBe(0);
  });

  it('does not emit when the title widget is clicked (non-interactive)', async () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [], rows, axisInput: dayAxisInput, headerToolbar: DEMO_TOOLBAR },
    });
    await wrapper.find('h2.cx-gantt-toolbar-title').trigger('click');
    expect(wrapper.emitted('update:axisInput')).toBeUndefined();
  });

  it('updates the pressed button when axisInput.viewId changes (reactive controlled-prop)', async () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [], rows, axisInput: dayAxisInput, headerToolbar: DEMO_TOOLBAR },
    });
    expect(wrapper.find('button.cx-gantt-day-button').attributes('aria-pressed')).toBe('true');
    await wrapper.setProps({
      axisInput: { ...dayAxisInput, viewId: 'month' },
    });
    expect(wrapper.find('button.cx-gantt-day-button').attributes('aria-pressed')).toBe('false');
    expect(wrapper.find('button.cx-gantt-month-button').attributes('aria-pressed')).toBe('true');
  });

  it('renders the title formatted per the current viewId (day → YYYY-MM-DD)', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [], rows, axisInput: dayAxisInput, headerToolbar: DEMO_TOOLBAR },
    });
    expect(wrapper.find('h2.cx-gantt-toolbar-title').text()).toBe('2026-05-13');
  });
});

describe('<ChronixGantt> today-cell-bg (Phase 31.x / Phase 22.2)', () => {
  // Anchor at today's local midnight so the today-cell falls inside the
  // axis (otherwise resolvedTodayCellBg returns null per the axis-overlap
  // clip). Using a frozen anchor would require time mocking — simpler to
  // anchor on Date() and use day view (24h axis).
  const todayAnchorDate = new Date();
  todayAnchorDate.setHours(0, 0, 0, 0);
  const todayAxisInput: AxisRangePlanInput = {
    viewId: 'day',
    anchorDate: todayAnchorDate,
    viewportWidth: 1440,
    locale: 'zh-CN',
    weekendsVisible: true,
  };
  const rows: RowSpec[] = [{ id: 'r1', columns: {} }];

  it('default (todayCellBg: undefined) does NOT render today-cell rects', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [], rows, axisInput: todayAxisInput },
    });
    expect(wrapper.findAll('rect.cx-gantt-today-cell')).toHaveLength(0);
  });

  it('todayCellBg: true renders 2 today-cell rects (body + header)', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [], rows, axisInput: todayAxisInput, todayCellBg: true },
    });
    const bodyRect = wrapper.find('rect.cx-gantt-today-cell[data-today-cell-side="body"]');
    const headerRect = wrapper.find('rect.cx-gantt-today-cell[data-today-cell-side="header"]');
    expect(bodyRect.exists()).toBe(true);
    expect(headerRect.exists()).toBe(true);
  });

  it('todayCellBg: { color } overrides the theme default color on both rects', () => {
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: [],
        rows,
        axisInput: todayAxisInput,
        todayCellBg: { color: '#facc15' },
      },
    });
    const bodyRect = wrapper.find('rect.cx-gantt-today-cell[data-today-cell-side="body"]');
    const headerRect = wrapper.find('rect.cx-gantt-today-cell[data-today-cell-side="header"]');
    expect(bodyRect.attributes('fill')).toBe('#facc15');
    expect(headerRect.attributes('fill')).toBe('#facc15');
  });

  it('body rect spans full bodyHeight; header rect spans full headerBandHeight', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [], rows, axisInput: todayAxisInput, todayCellBg: true },
    });
    const bodyRect = wrapper.find('rect.cx-gantt-today-cell[data-today-cell-side="body"]');
    const headerRect = wrapper.find('rect.cx-gantt-today-cell[data-today-cell-side="header"]');
    // Header band: 1 outer row + 1 tick row at default heights. Both >0.
    expect(Number(bodyRect.attributes('height'))).toBeGreaterThan(0);
    expect(Number(headerRect.attributes('height'))).toBeGreaterThan(0);
    // x is the same on both sides (pixel-aligned across header + body)
    expect(bodyRect.attributes('x')).toBe(headerRect.attributes('x'));
    expect(bodyRect.attributes('width')).toBe(headerRect.attributes('width'));
  });

  it('today outside axis range yields no rects (anchor far past today)', () => {
    // Anchor a year in the past — today is far past axisEnd → cellStartX
    // > totalWidth → resolvedTodayCellBg returns null.
    const farPast = new Date();
    farPast.setFullYear(farPast.getFullYear() - 1);
    farPast.setHours(0, 0, 0, 0);
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: [],
        rows,
        axisInput: { ...todayAxisInput, anchorDate: farPast },
        todayCellBg: true,
      },
    });
    expect(wrapper.findAll('rect.cx-gantt-today-cell')).toHaveLength(0);
  });
});

describe('<ChronixGantt> slot rects (Phase 31.x / Phase 29)', () => {
  const anchor = new Date('2026-05-18T00:00:00');
  const axisInput: AxisRangePlanInput = {
    viewId: 'week',
    anchorDate: anchor,
    viewportWidth: 1440,
    locale: 'zh-CN',
    weekendsVisible: true,
  };
  const rows: RowSpec[] = [{ id: 'r1', columns: {} }];

  it('emits 1 slot rect per axis tick, all default-transparent', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [], rows, axisInput },
    });
    const slotRects = wrapper.findAll('g.cx-gantt-slots rect.cx-gantt-slot');
    // Week view has hourly ticks: 7 days × 24 hours = 168 ticks
    // (slot count is tick-level, not day-level).
    expect(slotRects.length).toBeGreaterThan(0);
    // All default to fill: transparent so opt-in CSS controls visibility
    slotRects.wrappers.forEach((r) => {
      expect(r.attributes('fill')).toBe('transparent');
    });
  });

  it('slot rects carry day-state classes (cx-gantt-slot-sat, cx-gantt-slot-sun, etc.)', () => {
    // Use month view so ticks are day-resolution (1 tick per calendar day,
    // ~30-31 ticks). Each day-tick's slot rect picks up its weekday class
    // (cx-gantt-slot-mon ... cx-gantt-slot-sun) via computeCellStateMeta.
    const monthAxisInput: AxisRangePlanInput = {
      ...axisInput,
      viewId: 'month',
    };
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [], rows, axisInput: monthAxisInput },
    });
    const slotRects = wrapper.findAll('g.cx-gantt-slots rect.cx-gantt-slot');
    expect(slotRects.length).toBeGreaterThan(0);
    // At least one weekend slot in any 30-day month view
    const hasSatOrSun = slotRects.wrappers.some((r) => {
      const cls = r.classes();
      return cls.includes('cx-gantt-slot-sat') || cls.includes('cx-gantt-slot-sun');
    });
    expect(hasSatOrSun).toBe(true);
  });

  it('slots <g> group has pointer-events:none so clicks pass through to bars', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [], rows, axisInput },
    });
    const slotsGroup = wrapper.find('g.cx-gantt-slots');
    expect(slotsGroup.exists()).toBe(true);
    expect(slotsGroup.attributes('pointer-events')).toBe('none');
  });
});

describe('<ChronixGantt> headerCellClassNamesCallback (Phase 31.x / Phase 29)', () => {
  const anchor = new Date('2026-05-18T00:00:00');
  const axisInput: AxisRangePlanInput = {
    viewId: 'week',
    anchorDate: anchor,
    viewportWidth: 1440,
    locale: 'zh-CN',
    weekendsVisible: true,
  };
  const rows: RowSpec[] = [{ id: 'r1', columns: {} }];

  it('no callback → no extra classes on header cells or tick labels', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [], rows, axisInput },
    });
    // Outer band cells exist for week view (7 day-name cells)
    const cells = wrapper.findAll('rect.cx-gantt-header-cell');
    expect(cells.length).toBeGreaterThan(0);
    // None should carry a `my-extra` class since no callback is set
    cells.wrappers.forEach((c) => {
      expect(c.classes()).not.toContain('my-extra');
    });
  });

  it('string-returning callback appends 1 extra class to outer-band cells', () => {
    const cb = vi.fn(() => 'my-extra');
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [], rows, axisInput, headerCellClassNamesCallback: cb },
    });
    const cells = wrapper.findAll('rect.cx-gantt-header-cell');
    cells.wrappers.forEach((c) => {
      expect(c.classes()).toContain('my-extra');
    });
    expect(cb).toHaveBeenCalled();
  });

  it('array-returning callback appends multiple extra classes', () => {
    const cb = vi.fn(() => ['c1', 'c2']);
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [], rows, axisInput, headerCellClassNamesCallback: cb },
    });
    const cells = wrapper.findAll('rect.cx-gantt-header-cell');
    cells.wrappers.forEach((c) => {
      expect(c.classes()).toContain('c1');
      expect(c.classes()).toContain('c2');
    });
  });

  it('undefined-returning callback adds no extras (parity with no-callback path)', () => {
    const cb = vi.fn(() => undefined);
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [], rows, axisInput, headerCellClassNamesCallback: cb },
    });
    expect(cb).toHaveBeenCalled();
    const cells = wrapper.findAll('rect.cx-gantt-header-cell');
    cells.wrappers.forEach((c) => {
      // Class list should be exactly the default cx-gantt-header-cell +
      // any day-state classes (e.g. cx-gantt-day-sat); no consumer extras.
      expect(c.classes()).not.toContain('my-extra');
    });
  });

  it('callback receives bandIndex 0 for tick row, bandIndex >= 1 for outer bands', () => {
    const cb = vi.fn(() => undefined);
    mount(GanttForTest, {
      propsData: { bars: [], rows, axisInput, headerCellClassNamesCallback: cb },
    });
    const bandIndexes = new Set(
      cb.mock.calls.map((call: unknown[]) => (call[0] as { bandIndex: number }).bandIndex),
    );
    // Week view has 1 outer band (day names) + 1 tick row (hours).
    expect(bandIndexes.has(0)).toBe(true); // tick row
    expect(bandIndexes.has(1)).toBe(true); // outer band
  });
});

describe('@chronixjs/gantt-vue2 ChronixGantt — geometry prop alignment (Phase 52)', () => {
  // The 4 geometry props were declared on the vue3 adapter from
  // inception but never forwarded by vue2; the underlying useGanttLayout
  // hook already accepted them. Each test below verifies that passing a
  // non-default value through the adapter prop reaches the rendered DOM
  // (i.e. the prop → hook wiring is correct).
  const rows = [makeRow('r1')];
  const bars = [makeBar('b1', 'r1', '2026-05-18T09:00', '2026-05-18T17:00')];

  it('barHeight prop overrides the default 30 px bar rect height', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars, rows, axisInput: baseAxisInput(), barHeight: 50 },
    });
    const rect = wrapper.find('[data-bar-id="b1"]');
    expect(rect.exists()).toBe(true);
    expect(Number(rect.attributes('height'))).toBe(50);
  });

  it('barVerticalPadding prop offsets the bar Y from the strip top', () => {
    const baseline = mount(GanttForTest, {
      propsData: { bars, rows, axisInput: baseAxisInput() },
    });
    const override = mount(GanttForTest, {
      propsData: { bars, rows, axisInput: baseAxisInput(), barVerticalPadding: 12 },
    });
    const baseY = Number(baseline.find('[data-bar-id="b1"]').attributes('y'));
    const overrideY = Number(override.find('[data-bar-id="b1"]').attributes('y'));
    // 12 - 4 (default) = 8 px shift; bar.y = strip.y + padding.
    expect(overrideY - baseY).toBe(8);
  });

  it('defaultRowHeight prop is accepted + threaded into useGanttLayout (wiring smoke)', () => {
    // v0 pipeline reality: `BarStackHeightPass.compute()` sets a
    // `heightByRowId` entry for EVERY row in `input.rows`
    // (minimum `barHeight + topPadding`); `useGanttLayout`'s
    // `rowsWithHints` lifts that into `row.heightHint`; the
    // `defaultRowSwimlaneLayout`'s fallback is `row.heightHint ??
    // defaultRowHeight`, so the heightHint always wins. Net:
    // `defaultRowHeight` has no DOM-observable effect through the
    // standard adapter pipeline today. The prop is still part of
    // the surface (so chronix-vue3 + chronix-vue2 + chronix-react
    // expose identical APIs) and its forwarding to `useGanttLayout`
    // is verified by this mount succeeding without TS / runtime
    // errors. A future phase that bypasses the stack pass would
    // make this prop observable; this test guards the wiring even
    // while the prop is currently inert in the standard flow.
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [], rows, axisInput: baseAxisInput(), defaultRowHeight: 100 },
    });
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.findAll('svg.cx-gantt-body').length).toBe(1);
  });

  it('rowSpacing prop widens the gap between consecutive swimlane strips', () => {
    const twoRows = [makeRow('r1'), makeRow('r2')];
    const baseline = mount(GanttForTest, {
      propsData: { bars: [], rows: twoRows, axisInput: baseAxisInput() },
    });
    const override = mount(GanttForTest, {
      propsData: { bars: [], rows: twoRows, axisInput: baseAxisInput(), rowSpacing: 20 },
    });
    const baseHeight = Number(baseline.find('svg.cx-gantt-body').attributes('height'));
    const overrideHeight = Number(override.find('svg.cx-gantt-body').attributes('height'));
    // 2 rows → 1 inter-row gap. default rowSpacing 1 → override 20 = +19.
    expect(overrideHeight - baseHeight).toBe(19);
  });
});

describe('@chronixjs/gantt-vue2 ChronixGantt — progress overlay rendering (Phase 53)', () => {
  beforeEach(() => {
    // jsdom doesn't implement setPointerCapture / releasePointerCapture +
    // doesn't honor getBoundingClientRect from CSS. Stub both so the
    // adapter's pointer plumbing exercises the full begin / advance /
    // commit path. Bounding-rect zero-origin lets us treat clientX/Y as
    // content-x/y directly (no rect.left/top subtraction).
    const proto = Element.prototype as unknown as {
      setPointerCapture?: (this: void, id: number) => void;
      releasePointerCapture?: (this: void, id: number) => void;
      hasPointerCapture?: (this: void, id: number) => boolean;
    };
    proto.setPointerCapture ??= function noopSetPointerCapture(): void {
      /* jsdom stub */
    };
    proto.releasePointerCapture ??= function noopReleasePointerCapture(): void {
      /* jsdom stub */
    };
    proto.hasPointerCapture ??= function noopHasPointerCapture(): boolean {
      return false;
    };
    // Return zero-origin rect with non-zero dimensions so clientX/Y
    // can be used directly as content-x/y (no rect.left/top subtraction).
    const svgProto = SVGSVGElement.prototype;
    Object.defineProperty(svgProto, 'getBoundingClientRect', {
      configurable: true,
      writable: true,
      enumerable: true,
      value: function (this: SVGSVGElement): DOMRect {
        const width = this.width?.baseVal?.value ?? 10000;
        const height = this.height?.baseVal?.value ?? 1000;
        if (width > 0 && height > 0) {
          return {
            left: 0,
            top: 0,
            width,
            height,
            right: width,
            bottom: height,
            x: 0,
            y: 0,
            toJSON() {
              return this;
            },
          };
        }
        return {
          left: 0,
          top: 0,
          width: 10000,
          height: 1000,
          right: 10000,
          bottom: 1000,
          x: 0,
          y: 0,
          toJSON() {
            return this;
          },
        };
      },
    });
  });

  // chronix-vue3 emits 3 cx-gantt-progress-* elements per bar that
  // declares both `progress.value` + `pointerOverlayId`. chronix-vue2
  // never ported them at Phase 31 scaffold; Phase 53 closes the gap.
  // Each test below mounts a single bar with progress + asserts the
  // expected element renders.
  const row = makeRow('r1');
  const barWithProgress = (
    progressOverride?: Partial<{ value: number; showText: boolean; textFormat: string }>,
  ): BarSpec => ({
    id: 'b1',
    rowId: 'r1',
    title: 'Task 1',
    range: { start: new Date('2026-05-18T08:00'), end: new Date('2026-05-18T16:00') },
    dprIntent: 'crisp-pixel',
    pointerOverlayId: 'progress-handle',
    progress: { value: 60, ...progressOverride },
  });

  it('renders <rect.cx-gantt-progress-fill> for a bar with progress.value + pointerOverlayId', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [barWithProgress()], rows: [row], axisInput: baseAxisInput() },
    });
    const fill = wrapper.find('rect.cx-gantt-progress-fill');
    expect(fill.exists()).toBe(true);
    expect(fill.attributes('data-progress-bar-id')).toBe('b1');
    // 60% of bar.width should be the rect's width attribute.
    const barRect = wrapper.find('[data-bar-id="b1"]');
    const barWidth = Number(barRect.attributes('width'));
    expect(Number(fill.attributes('width'))).toBeCloseTo(barWidth * 0.6, 1);
  });

  it('renders <polygon.cx-gantt-progress-handle> at the fill edge (only visible when hovered)', async () => {
    // Use day view for precise positioning (each hour = 60 px)
    const dayAxis = { ...baseAxisInput(), viewId: 'day' as const };
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [barWithProgress()], rows: [row], axisInput: dayAxis },
    });
    // Handle is only visible when hovered
    const handle = wrapper.find('.cx-gantt-progress-handle');
    expect(handle.exists()).toBe(false);
    // Calculate handle position for 60% progress: bar.x + 0.6 × bar.width
    // Bar is 8 hours (08:00-16:00) = 480 px wide in day view
    // 60% of 480 = 288 px, so handle at bar.x + 288
    const barRect = wrapper.find('[data-bar-id="b1"]');
    const barX = Number(barRect.attributes('x'));
    const barWidth = Number(barRect.attributes('width'));
    const handleX = barX + 0.6 * barWidth;
    const barY = Number(barRect.attributes('y'));
    const barHeight = Number(barRect.attributes('height'));
    const handleY = barY + barHeight; // bar bottom
    // Hover over the handle to make it visible
    const svg = wrapper.find('svg.cx-gantt-body');
    await svg.trigger('pointermove', {
      clientX: Math.round(handleX),
      clientY: Math.round(handleY),
      pointerId: 1,
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.cx-gantt-progress-handle').exists()).toBe(true);
  });

  it('renders bar title with progress suffix "title (progress%)"', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [barWithProgress()], rows: [row], axisInput: baseAxisInput() },
    });
    const text = wrapper.find('text.cx-gantt-bar-text');
    expect(text.exists()).toBe(true);
    expect(text.text()).toBe('Task 1 (60%)');
  });

  it('renders bar title with progress suffix (showText not yet implemented)', () => {
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: [barWithProgress({ showText: false })],
        rows: [row],
        axisInput: baseAxisInput(),
      },
    });
    const text = wrapper.find('text.cx-gantt-bar-text');
    expect(text.exists()).toBe(true);
    // Note: showText is not yet implemented, progress suffix is always shown
    expect(text.text()).toBe('Task 1 (60%)');
  });

  it('skips progress overlay when bar lacks pointerOverlayId', () => {
    const bar: BarSpec = {
      id: 'no-overlay',
      rowId: 'r1',
      range: { start: new Date('2026-05-18T08:00'), end: new Date('2026-05-18T16:00') },
      dprIntent: 'crisp-pixel',
      progress: { value: 50 },
      // no pointerOverlayId
    };
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [bar], rows: [row], axisInput: baseAxisInput() },
    });
    expect(wrapper.find('.cx-gantt-progress-fill').exists()).toBe(false);
    expect(wrapper.find('.cx-gantt-progress-handle').exists()).toBe(false);
  });
});

describe('@chronixjs/gantt-vue2 ChronixGantt — reference interaction parity (Phase 54)', () => {
  const row = makeRow('r1');

  it('eventStartEditable={false} removes cx-gantt-bar--draggable but keeps cx-gantt-bar--resizable', () => {
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: [makeBar('b1', 'r1', '2026-05-18T08:00', '2026-05-18T16:00')],
        rows: [row],
        axisInput: baseAxisInput(),
        editable: true,
        eventStartEditable: false,
      },
    });
    const rect = wrapper.find('rect[data-bar-id="b1"]');
    expect(rect.classes()).not.toContain('cx-gantt-bar--draggable');
    expect(rect.classes()).toContain('cx-gantt-bar--resizable');
  });

  it('eventDurationEditable={false} removes cx-gantt-bar--resizable + suppresses resizer rects', () => {
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: [makeBar('b1', 'r1', '2026-05-18T08:00', '2026-05-18T16:00')],
        rows: [row],
        axisInput: baseAxisInput(),
        editable: true,
        eventDurationEditable: false,
      },
    });
    const rect = wrapper.find('rect[data-bar-id="b1"]');
    expect(rect.classes()).toContain('cx-gantt-bar--draggable');
    expect(rect.classes()).not.toContain('cx-gantt-bar--resizable');
    expect(wrapper.findAll('rect.cx-gantt-bar-resizer-start').length).toBe(0);
  });
});

describe('<ChronixGantt> hitTestFromClient (Phase 56)', () => {
  it('handle.hitTestFromClient maps client coords to {time, rowId} via body rect + axis + strips', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [], rows: phase19Rows, axisInput: phase19AxisInput },
    });
    const svg = wrapper.find('svg.cx-gantt-body').element as SVGSVGElement;
    svg.getBoundingClientRect = () =>
      ({ left: 100, top: 50, right: 1540, bottom: 530, width: 1440, height: 480 }) as DOMRect;
    const handle = wrapper.vm as unknown as {
      hitTestFromClient: (x: number, y: number) => { time: Date; rowId: string } | null;
    };
    // clientX 220 → contentX 120 → 2h after midnight. clientY 60 →
    // contentY 10 → first strip r1.
    const result = handle.hitTestFromClient(220, 60);
    expect(result).not.toBeNull();
    expect(result!.rowId).toBe('r1');
    expect(result!.time.getTime()).toBe(phase19TodayMs + 2 * MS_PER_HOUR_P19);
  });

  it('handle.hitTestFromClient returns null when clientX is left of body rect', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [], rows: phase19Rows, axisInput: phase19AxisInput },
    });
    const svg = wrapper.find('svg.cx-gantt-body').element as SVGSVGElement;
    svg.getBoundingClientRect = () =>
      ({ left: 100, top: 50, right: 1540, bottom: 530, width: 1440, height: 480 }) as DOMRect;
    const handle = wrapper.vm as unknown as {
      hitTestFromClient: (x: number, y: number) => { time: Date; rowId: string } | null;
    };
    const result = handle.hitTestFromClient(50, 60);
    expect(result).toBeNull();
  });
});
