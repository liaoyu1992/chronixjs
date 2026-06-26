import {
  BAR_SLOT_NAME,
  computeRowSpans,
  createSlotRegistry,
  defaultChronixTheme,
  snapVerticalGridLineX,
} from '@chronixjs/gantt';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';

import { ChronixGantt } from './chronix-gantt.js';

import type {
  AxisRangePlanInput,
  BarSlotArgs,
  BarSpec,
  ChronixTheme,
  RowSpec,
} from '@chronixjs/gantt';

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

  it('Phase 23: wrapper div is a grid and the chart-pane (NOT the wrapper) owns overflow', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput },
    });
    const root = wrapper.find('div.cx-gantt-wrapper').element as HTMLElement;
    // Wrapper is a grid container; overflow lives on the chart-pane.
    expect(root.style.display).toBe('grid');
    expect(root.style.overflow).toBe('');
    const chartPane = wrapper.find('div.cx-gantt-chart-pane').element as HTMLElement;
    expect(chartPane.style.overflow).toBe('auto');
  });

  it('Phase 23: header SVG sits inside cx-gantt-chart-header-pane (overflow: hidden) and is no longer sticky', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput },
    });
    const headerPane = wrapper.find('div.cx-gantt-chart-header-pane').element as HTMLElement;
    expect(headerPane.style.overflow).toBe('hidden');
    const header = wrapper.find('svg.cx-gantt-header').element as SVGSVGElement;
    // Dual-scrollport: header is structurally above chart-pane; sticky removed.
    expect(header.style.position).toBe('');
    expect(header.style.top).toBe('');
    // Opaque header background still preserved for visual chrome.
    expect(header.style.background).not.toBe('');
  });

  it('header SVG and body SVG render at the same width (both bound to axis.totalWidth) so horizontal scroll stays locked', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput },
    });
    const headerWidth = wrapper.find('svg.cx-gantt-header').attributes('width');
    const bodyWidth = wrapper.find('svg.cx-gantt-body').attributes('width');
    expect(headerWidth).toBe(bodyWidth);
    // Day view: 24 hours × slotWidth 60 = 1440.
    expect(Number(bodyWidth)).toBe(1440);
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
    expect(Number(rect.attributes('y'))).toBe(4); // Phase 43: barVerticalPadding default 8 → 4
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

  it('cross-row drag: mid-drag renders bar at target strip Y + intra-strip offset', async () => {
    // Two bars (one per row) so both strips get definite heights from
    // `BarStackHeightPass`. Strip layout with default props (Phase 43):
    //   r1: y=0,  height=38 (barHeight 30 + topPad 4 + bottomPad 4)
    //   r2: y=39, height=38 (rowSpacing 1 gap)
    // Bar 'b1' on r1: y=4 (=0 + barVerticalPadding 4), height 30. Intra-
    // strip offset = 4. Snap to r2 → renderY = 39 + 4 = 43.
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12), bar('b2', 'r2', 8, 12)],
        rows,
        axisInput,
        editable: true,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    // Begin at clientY=20 (inside r1 [0, 42)), drag to clientY=60
    // (inside r2 [43, 85)). deltaY = 40; originPx.y = 20; dropY = 60.
    await svg.trigger('pointerdown', { clientX: 600, clientY: 20, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 600, clientY: 60, pointerId: 1 });

    const b1 = wrapper.find('[data-bar-id="b1"]');
    expect(Number(b1.attributes('y'))).toBe(43); // Phase 43: r2.y (39) + barVerticalPadding (4)

    await svg.trigger('pointerup', { clientX: 600, clientY: 60, pointerId: 1 });
  });

  it('cross-row drag commit: bar-drop payload carries oldRowId + newRowId', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12), bar('b2', 'r2', 8, 12)],
        rows,
        axisInput,
        editable: true,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    await svg.trigger('pointerdown', { clientX: 600, clientY: 20, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 600, clientY: 60, pointerId: 1 });
    await svg.trigger('pointerup', { clientX: 600, clientY: 60, pointerId: 1 });

    const emitted = wrapper.emitted('bar-drop');
    expect(emitted).toBeTruthy();
    const payload = emitted![0]![0] as { oldRowId: string; newRowId: string };
    expect(payload.oldRowId).toBe('r1');
    expect(payload.newRowId).toBe('r2');
  });

  it('drag outside all strips: free-Y render + commit reverts newRowId to oldRowId', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12), bar('b2', 'r2', 8, 12)],
        rows,
        axisInput,
        editable: true,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    // Begin inside r1, drag to clientY=500 (well past r2's bottom at 85).
    await svg.trigger('pointerdown', { clientX: 600, clientY: 20, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 600, clientY: 500, pointerId: 1 });

    // No projected row → render falls back to free-Y = bar.y + deltaY = 4 + 480 = 484 (Phase 43 default).
    const b1 = wrapper.find('[data-bar-id="b1"]');
    expect(Number(b1.attributes('y'))).toBe(484);

    await svg.trigger('pointerup', { clientX: 600, clientY: 500, pointerId: 1 });
    const emitted = wrapper.emitted('bar-drop');
    const payload = emitted![0]![0] as { oldRowId: string; newRowId: string };
    expect(payload.oldRowId).toBe('r1');
    expect(payload.newRowId).toBe('r1'); // revert
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

describe('<ChronixGantt> validation gates (Phase 19)', () => {
  it('bar-drag rejected by eventOverlap: false → onBarDrop not emitted, onBarDropRejected fires with reason "overlap"', async () => {
    // b1 on r1 (8-12), b2 on r2 (9-13). Drag b1 right +60px (1 hour)
    // so its new range becomes 9-13 on r1 — cross-row time intersect
    // with b2 → reject.
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12), bar('b2', 'r2', 9, 13)],
        rows,
        axisInput,
        editable: true,
        eventOverlap: false,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    const cy = 20;
    await svg.trigger('pointerdown', { clientX: 600, clientY: cy, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 660, clientY: cy, pointerId: 1 });
    await svg.trigger('pointerup', { clientX: 660, clientY: cy, pointerId: 1 });

    expect(wrapper.emitted('bar-drop')).toBeFalsy();
    const rejected = wrapper.emitted('bar-drop-rejected');
    expect(rejected).toBeTruthy();
    expect(rejected!).toHaveLength(1);
    const payload = rejected![0]![0] as {
      barId: string;
      reason: string;
      attemptedRange: { start: Date; end: Date };
    };
    expect(payload.barId).toBe('b1');
    expect(payload.reason).toBe('overlap');
    expect(payload.attemptedRange.start.getTime()).toBe(
      new Date(todayMs + 9 * MS_PER_HOUR).getTime(),
    );
  });

  it('bar-resize rejected by eventConstraint → onBarResize not emitted, onBarResizeRejected fires with reason "constraint"', async () => {
    // b1 on r1 (8-12). Constraint window 8..12 — bar fits exactly at
    // start. Resize end +60px (1 hour) → new range 8-13. range.end=13
    // exceeds constraint.range.end=12 → reject.
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12)],
        rows,
        axisInput,
        editable: true,
        eventConstraint: {
          range: {
            start: new Date(todayMs + 8 * MS_PER_HOUR),
            end: new Date(todayMs + 12 * MS_PER_HOUR),
          },
        },
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    const cy = 20;
    // Click end-edge (x=720, default 8-px end zone [712..720]) + drag right +60.
    await svg.trigger('pointerdown', { clientX: 715, clientY: cy, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 775, clientY: cy, pointerId: 1 });
    await svg.trigger('pointerup', { clientX: 775, clientY: cy, pointerId: 1 });

    expect(wrapper.emitted('bar-resize')).toBeFalsy();
    const rejected = wrapper.emitted('bar-resize-rejected');
    expect(rejected).toBeTruthy();
    const payload = rejected![0]![0] as { barId: string; edge: string; reason: string };
    expect(payload.barId).toBe('b1');
    expect(payload.edge).toBe('end');
    expect(payload.reason).toBe('constraint');
  });

  it('range-select rejected by selectAllow → onSelect not emitted, onSelectRejected fires with reason "allow"', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [],
        rows,
        axisInput,
        selectable: true,
        selectAllow: () => false,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    const cy = 20;
    await svg.trigger('pointerdown', { clientX: 120, clientY: cy, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 300, clientY: cy, pointerId: 1 });
    await svg.trigger('pointerup', { clientX: 300, clientY: cy, pointerId: 1 });

    expect(wrapper.emitted('select')).toBeFalsy();
    const rejected = wrapper.emitted('select-rejected');
    expect(rejected).toBeTruthy();
    const payload = rejected![0]![0] as { rowId: string; reason: string };
    expect(payload.rowId).toBe('r1');
    expect(payload.reason).toBe('allow');
  });

  it('regression guard: with no validator props, commits go through as before', async () => {
    // Same fixture as the existing "editable: pointerdown → drop"
    // test but with two cross-row bars whose ranges would intersect
    // after the drag — without `eventOverlap: false` the commit still
    // fires. Confirms the validator path is opt-in.
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12), bar('b2', 'r2', 9, 13)],
        rows,
        axisInput,
        editable: true,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    const cy = 20;
    await svg.trigger('pointerdown', { clientX: 600, clientY: cy, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 660, clientY: cy, pointerId: 1 });
    await svg.trigger('pointerup', { clientX: 660, clientY: cy, pointerId: 1 });

    expect(wrapper.emitted('bar-drop')).toBeTruthy();
    expect(wrapper.emitted('bar-drop-rejected')).toBeFalsy();
  });

  it('eventOverlap: true (explicit) → no rejection even with intersecting cross-row bars', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12), bar('b2', 'r2', 9, 13)],
        rows,
        axisInput,
        editable: true,
        eventOverlap: true,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    const cy = 20;
    await svg.trigger('pointerdown', { clientX: 600, clientY: cy, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 660, clientY: cy, pointerId: 1 });
    await svg.trigger('pointerup', { clientX: 660, clientY: cy, pointerId: 1 });

    expect(wrapper.emitted('bar-drop')).toBeTruthy();
    expect(wrapper.emitted('bar-drop-rejected')).toBeFalsy();
  });

  it('progress-handle commit is never gated by eventConstraint (changing progress does not move the bar)', async () => {
    // Constraint window deliberately incompatible with the bar's range
    // (today-only at 0..1) — a drag or resize would be rejected. But a
    // progress drag should commit because validators don't apply to
    // progress.
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [progressBar('b1', 'r1', 8, 12, 50)],
        rows,
        axisInput,
        editable: true,
        eventConstraint: {
          range: {
            start: new Date(todayMs),
            end: new Date(todayMs + MS_PER_HOUR),
          },
        },
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    // Progress-handle center for 50%: x = 480 + (240 × 0.5) = 600.
    const handleX = 600;
    const handleY = 37;
    await svg.trigger('pointermove', { clientX: handleX, clientY: handleY, pointerId: 1 });
    await nextTick();
    await svg.trigger('pointerdown', {
      clientX: handleX,
      clientY: handleY,
      button: 0,
      pointerId: 1,
    });
    await svg.trigger('pointermove', {
      clientX: handleX + 60,
      clientY: handleY,
      pointerId: 1,
    });
    await svg.trigger('pointerup', {
      clientX: handleX + 60,
      clientY: handleY,
      pointerId: 1,
    });

    expect(wrapper.emitted('bar-progress')).toBeTruthy();
    expect(wrapper.emitted('bar-drop-rejected')).toBeFalsy();
    expect(wrapper.emitted('bar-resize-rejected')).toBeFalsy();
  });
});

describe('<ChronixGantt> selectOverlap / selectConstraint (Phase 55)', () => {
  it('range-select rejected by selectOverlap: false when proposal intersects an existing bar', async () => {
    // b1 on r2 (8-12) — different row from where we select, so pointerdown
    // lands in empty space (r1's strip). Drag-select on r1 from x=180 (3h)
    // → x=600 (10h) → proposal range 3-10 intersects b1's range 8-12 →
    // veto via selectOverlap.
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r2', 8, 12)],
        rows,
        axisInput,
        selectable: true,
        selectOverlap: false,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    const cy = 20;
    await svg.trigger('pointerdown', { clientX: 180, clientY: cy, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 600, clientY: cy, pointerId: 1 });
    await svg.trigger('pointerup', { clientX: 600, clientY: cy, pointerId: 1 });

    expect(wrapper.emitted('select')).toBeFalsy();
    const rejected = wrapper.emitted('select-rejected');
    expect(rejected).toBeTruthy();
    const payload = rejected![0]![0] as { rowId: string; reason: string };
    expect(payload.rowId).toBe('r1');
    expect(payload.reason).toBe('overlap');
  });

  it('selectConstraint narrower than eventConstraint vetoes select-only', async () => {
    // eventConstraint: 0..24h wide-open → drag passes.
    // selectConstraint: 8..12h narrow → select at 13..17 vetoed.
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [],
        rows,
        axisInput,
        selectable: true,
        eventConstraint: {
          range: {
            start: new Date(todayMs + 0 * MS_PER_HOUR),
            end: new Date(todayMs + 24 * MS_PER_HOUR),
          },
        },
        selectConstraint: {
          range: {
            start: new Date(todayMs + 8 * MS_PER_HOUR),
            end: new Date(todayMs + 12 * MS_PER_HOUR),
          },
        },
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    const cy = 20;
    // x=780 → 13h ; x=1020 → 17h. Outside [8..12].
    await svg.trigger('pointerdown', { clientX: 780, clientY: cy, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 1020, clientY: cy, pointerId: 1 });
    await svg.trigger('pointerup', { clientX: 1020, clientY: cy, pointerId: 1 });

    expect(wrapper.emitted('select')).toBeFalsy();
    const rejected = wrapper.emitted('select-rejected');
    expect(rejected).toBeTruthy();
    const payload = rejected![0]![0] as { rowId: string; reason: string };
    expect(payload.reason).toBe('constraint');
  });
});

describe('<ChronixGantt> bar color pipeline (Phase 20)', () => {
  it('default bar <rect> has inline fill + stroke matching theme defaults', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [bar('b1', 'r1', 8, 12)], rows, axisInput },
    });
    const rect = wrapper.find('[data-bar-id="b1"]');
    expect(rect.attributes('fill')).toBe(defaultChronixTheme.barBackgroundColor);
    expect(rect.attributes('stroke')).toBe(defaultChronixTheme.barBorderColor);
    // .cx-gantt-bar class is still present for non-color hooks (rx, ry, cursor).
    expect(rect.classes()).toContain('cx-gantt-bar');
  });

  it('barBackgroundColor prop overrides theme; border inherits via background-overrides-border umbrella', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12)],
        rows,
        axisInput,
        barBackgroundColor: '#10b981',
      },
    });
    const rect = wrapper.find('[data-bar-id="b1"]');
    expect(rect.attributes('fill')).toBe('#10b981');
    expect(rect.attributes('stroke')).toBe('#10b981');
  });

  it('BarSpec.style.backgroundColor overrides the component-prop layer', () => {
    const styledBar: BarSpec = {
      ...bar('b1', 'r1', 8, 12),
      style: { backgroundColor: '#ef4444' },
    };
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [styledBar],
        rows,
        axisInput,
        barBackgroundColor: '#10b981',
      },
    });
    const rect = wrapper.find('[data-bar-id="b1"]');
    expect(rect.attributes('fill')).toBe('#ef4444');
  });

  it('barBackgroundColorCallback overrides BarSpec.style and receives BarStyleArg with cascaded default', () => {
    const callback = vi.fn<(arg: { defaultBackgroundColor: string }) => string | undefined>(
      () => '#f59e0b',
    );
    const styledBar: BarSpec = {
      ...bar('b1', 'r1', 8, 12),
      style: { backgroundColor: '#ef4444' },
    };
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [styledBar],
        rows,
        axisInput,
        barBackgroundColorCallback: callback,
      },
    });
    const rect = wrapper.find('[data-bar-id="b1"]');
    expect(rect.attributes('fill')).toBe('#f59e0b');
    expect(callback).toHaveBeenCalled();
    expect(callback.mock.calls[0]?.[0]?.defaultBackgroundColor).toBe('#ef4444');
  });

  it('barColor umbrella prop sets both fill and stroke when specific props are absent', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12)],
        rows,
        axisInput,
        barColor: '#8b5cf6',
      },
    });
    const rect = wrapper.find('[data-bar-id="b1"]');
    expect(rect.attributes('fill')).toBe('#8b5cf6');
    expect(rect.attributes('stroke')).toBe('#8b5cf6');
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

  it('header SVG height = default band (44 = 1 × 20 + 24); body SVG height = contentSize.height (69)', () => {
    // Phase 43: two rows, empty-row default height 34 (= barHeight + firstBarTopPadding),
    // rowSpacing 1 → contentSize.height = 34 + 1 + 34 = 69.
    // Day view has 1 headerRow; band = 1×20 + 24 = 44.
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput },
    });
    expect(Number(wrapper.find('svg.cx-gantt-header').attributes('height'))).toBe(44);
    expect(Number(wrapper.find('svg.cx-gantt-body').attributes('height'))).toBe(69);
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
    // Phase 43: one bar on r1 → r1 height = 4 + 30 + 4 = 38. r2 (empty) = 34.
    // Content height: 38 + 1 + 34 = 73. Header band: 1×30 + 40 = 70.
    expect(Number(wrapper.find('svg.cx-gantt-header').attributes('height'))).toBe(70);
    expect(Number(wrapper.find('svg.cx-gantt-body').attributes('height'))).toBe(73);
    // Bar group now sits at the body SVG's origin — no transform.
    const barsGroup = wrapper.find('.cx-gantt-bars');
    expect(barsGroup.attributes('transform')).toBeUndefined();
    // Rect's own y comes straight from the layout (Phase 43: y=4 from barVerticalPadding 4).
    const rect = wrapper.find('[data-bar-id="b1"]');
    expect(Number(rect.attributes('y'))).toBe(4);
  });

  it('headerHeight=0 + headerRowHeight=0: no axis-divider, no header cells, header SVG collapses to height 0', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput, headerHeight: 0, headerRowHeight: 0 },
    });
    expect(Number(wrapper.find('svg.cx-gantt-header').attributes('height'))).toBe(0);
    expect(Number(wrapper.find('svg.cx-gantt-body').attributes('height'))).toBe(69); // Phase 43: 34 + 1 + 34
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
    // Cell edges are device-pixel snapped (vertical-twin of the body grid
    // vline snap) so the band border overlays the tick line; at dpr=1 the
    // left edge lands on 0.5 and the right edge clamps to totalWidth-0.5.
    const totalWidth = 1440;
    const expectedX = snapVerticalGridLineX(0, totalWidth);
    expect(Number(cell.attributes('x'))).toBe(expectedX);
    expect(Number(cell.attributes('width'))).toBe(
      snapVerticalGridLineX(totalWidth, totalWidth) - expectedX,
    );
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
    // Widths are uniform modulo a ≤1px device-pixel snap: the rightmost
    // cell's right edge clamps to totalWidth-0.5, so it renders 1px narrower.
    expect(max - min).toBeLessThanOrEqual(1);
    expect(max).toBe(52 * 24);
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
    // "1日五" — matching the original DOM exactly.
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
  it('renders a progress fill for bars with progress + pointerOverlayId (handle only on hover)', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [progressBar('b1', 'r1', 8, 12, 50)],
        rows,
        axisInput,
      },
    });
    // Bar 'b1' at x ∈ [480, 720], width 240. 50% → fill width 120.
    const fill = wrapper.find('.cx-gantt-progress-fill');
    expect(fill.exists()).toBe(true);
    expect(Number(fill.attributes('x'))).toBe(480);
    expect(Number(fill.attributes('width'))).toBe(120);
    // Handle is only visible when hovered
    const handle = wrapper.find('.cx-gantt-progress-handle');
    expect(handle.exists()).toBe(false);
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
    // Handle for 50%-progress bar centered at content (600, 37). Drag
    // +24 px → +10% → 60%.
    const svg = wrapper.find('svg.cx-gantt-body');
    await svg.trigger('pointermove', { clientX: 600, clientY: 37, pointerId: 1 });
    await nextTick();
    await svg.trigger('pointerdown', { clientX: 600, clientY: 37, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 624, clientY: 37, pointerId: 1 });
    await svg.trigger('pointerup', { clientX: 624, clientY: 37, pointerId: 1 });

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
    // Pointer at handle center (600, 37) is also inside the bar body —
    // handle wins. Commit fires `bar-progress`, not `bar-drop`.
    const svg = wrapper.find('svg.cx-gantt-body');
    await svg.trigger('pointermove', { clientX: 600, clientY: 37, pointerId: 1 });
    await nextTick();
    await svg.trigger('pointerdown', { clientX: 600, clientY: 37, button: 0, pointerId: 1 });
    await svg.trigger('pointerup', { clientX: 600, clientY: 37, pointerId: 1 });
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
    // Handle is only visible when hovered - no handle rendered initially
    expect(wrapper.find('.cx-gantt-progress-handle').exists()).toBe(false);
  });
});

describe('<ChronixGantt> progress overlay — live update during drag', () => {
  it('mid-drag pointermove moves the rendered handle to the projected position', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [progressBar('b1', 'r1', 8, 12, 50)],
        rows,
        axisInput,
        editable: true,
      },
    });
    // Bar at x ∈ [480, 720] (width 240). 50% → handle tip x = 600 at bar bottom.
    // Hover first to make handle visible, then drag +24 px in content space → projected 60%
    const svg = wrapper.find('svg.cx-gantt-body');
    await svg.trigger('pointermove', { clientX: 600, clientY: 37, pointerId: 1 });
    await nextTick();
    await svg.trigger('pointerdown', { clientX: 600, clientY: 37, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 624, clientY: 37, pointerId: 1 });

    // Handle is now visible during drag. No bar-progress emit yet.
    expect(wrapper.find('.cx-gantt-progress-handle').exists()).toBe(true);
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
    await svg.trigger('pointermove', { clientX: 600, clientY: 37, pointerId: 1 });
    await svg.trigger('pointerdown', { clientX: 600, clientY: 37, button: 0, pointerId: 1 });
    // Drag +12 px → projected 55% → fill width 0.55 × 240 = 132.
    await svg.trigger('pointermove', { clientX: 612, clientY: 37, pointerId: 1 });

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
    await svg.trigger('pointermove', { clientX: 600, clientY: 37, pointerId: 1 });
    await svg.trigger('pointerdown', { clientX: 600, clientY: 37, button: 0, pointerId: 1 });
    // Drag +500 px — projection past 100%. Fill should clamp to bar.width.
    await svg.trigger('pointermove', { clientX: 1100, clientY: 37, pointerId: 1 });

    const fill = wrapper.find('.cx-gantt-progress-fill');
    expect(Number(fill.attributes('width'))).toBe(240); // entire bar
    // Handle is visible during drag (triangle tip at bar.x + bar.width)
    expect(wrapper.find('.cx-gantt-progress-handle').exists()).toBe(true);
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
    await svg.trigger('pointermove', { clientX: 600, clientY: 37, pointerId: 1 });
    await svg.trigger('pointerdown', { clientX: 600, clientY: 37, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 624, clientY: 37, pointerId: 1 });
    await svg.trigger('pointerup', { clientX: 624, clientY: 37, pointerId: 1 });
    // Move mouse away to clear hover state
    await svg.trigger('pointermove', { clientX: 100, clientY: 100, pointerId: 1 });

    // bar.progress.value is still 50 (the test doesn't write back; that's
    // the demo's job). With activeTransaction cleared the render falls
    // through to the persisted value → fill width is back to 120.
    const fill = wrapper.find('.cx-gantt-progress-fill');
    expect(Number(fill.attributes('width'))).toBe(120);
    expect(wrapper.emitted('bar-progress')).toHaveLength(1);
    // Handle is hidden after mouse moves away
    expect(wrapper.find('.cx-gantt-progress-handle').exists()).toBe(false);
  });
});

describe('<ChronixGantt> progress overlay — in-title display', () => {
  it('renders progress in the bar title as "title (progress%)"', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [{ ...progressBar('b1', 'r1', 8, 12, 50), title: 'Task 1' }],
        rows,
        axisInput,
      },
    });
    const title = wrapper.find('.cx-gantt-bar-text');
    expect(title.exists()).toBe(true);
    expect(title.text()).toBe('Task 1 (50%)');
  });

  it('progress in title live-updates during a progress-handle drag (50% → 60%)', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [{ ...progressBar('b1', 'r1', 8, 12, 50), title: 'Task 1' }],
        rows,
        axisInput,
        editable: true,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    // Hover over progress handle position to make it visible
    await svg.trigger('pointermove', { clientX: 600, clientY: 37, pointerId: 1 });
    await svg.trigger('pointerdown', { clientX: 600, clientY: 37, button: 0, pointerId: 1 });
    // +24 px → projected 60% on the 240-px-wide bar.
    await svg.trigger('pointermove', { clientX: 624, clientY: 37, pointerId: 1 });
    expect(wrapper.find('.cx-gantt-bar-text').text()).toBe('Task 1 (60%)');
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
    // Bar at content x=480..720, y=4..34 (Phase 43). Click center, drag +60 px right.
    const svg = wrapper.find('svg.cx-gantt-body');
    await svg.trigger('pointerdown', { clientX: 600, clientY: 20, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 660, clientY: 20, pointerId: 1 });

    const rect = wrapper.find('[data-bar-id="b1"]');
    expect(Number(rect.attributes('x'))).toBe(540); // 480 + 60
    expect(Number(rect.attributes('width'))).toBe(240); // unchanged
    expect(Number(rect.attributes('y'))).toBe(4); // Phase 43: y=4 unchanged (no y delta yet)
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
    expect(Number(rect.attributes('y'))).toBe(14); // Phase 43: 4 + 10
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

  it('progress fill + handle track the bar during a bar-drag (anchored to render geometry)', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [progressBar('b1', 'r1', 8, 12, 50)],
        rows,
        axisInput,
        editable: true,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    // First hover near handle position to make it visible
    await svg.trigger('pointermove', { clientX: 600, clientY: 37, pointerId: 1 });
    // Click far left of the handle (content x=500), drag +60 right.
    await svg.trigger('pointerdown', { clientX: 500, clientY: 20, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 560, clientY: 20, pointerId: 1 });

    // Bar shifted by +60 → x=540. Progress fill (50%) now at renderX=540
    // with width 120; handle triangle tip at 540 + 120 = 660.
    expect(Number(wrapper.find('[data-bar-id="b1"]').attributes('x'))).toBe(540);
    expect(Number(wrapper.find('.cx-gantt-progress-fill').attributes('x'))).toBe(540);
    // Handle remains visible during bar-drag (hover state is preserved during active transaction)
    expect(wrapper.find('.cx-gantt-progress-handle').exists()).toBe(true);
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
    await svg.trigger('pointermove', { clientX: 600, clientY: 37, pointerId: 1 });
    await nextTick();
    await svg.trigger('pointerdown', { clientX: 600, clientY: 37, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 624, clientY: 37, pointerId: 1 });
    await svg.trigger('pointercancel', { clientX: 624, clientY: 37, pointerId: 1 });

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

describe('<ChronixGantt> resource-panel sidebar', () => {
  const rowsWithNames: readonly RowSpec[] = [
    { id: 'r1', columns: { region: '海口', vehicle: '车间 A' } },
    { id: 'r2', columns: { region: '海口', vehicle: '车间 B' } },
  ];

  it('with no `columns` prop the sidebar renders no DOM (back to the Phase 4.5 two-pane shape)', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows: rowsWithNames, axisInput },
    });
    expect(wrapper.find('.cx-gantt-sidebar-header').exists()).toBe(false);
    expect(wrapper.find('.cx-gantt-sidebar-body').exists()).toBe(false);
  });

  it('with an empty `columns: []` the sidebar is omitted (no-op shape)', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows: rowsWithNames, axisInput, columns: [] },
    });
    expect(wrapper.find('.cx-gantt-sidebar-header').exists()).toBe(false);
    expect(wrapper.find('.cx-gantt-sidebar-body').exists()).toBe(false);
  });

  it('with columns set, renders one sidebar-header-cell per column carrying the column label', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [],
        rows: rowsWithNames,
        axisInput,
        columns: [
          { key: 'region', label: '地区', width: 80 },
          { key: 'vehicle', label: '车间', width: 120 },
        ],
      },
    });
    const cells = wrapper.findAll('.cx-gantt-sidebar-header-cell');
    expect(cells).toHaveLength(2);
    expect(cells[0]!.text()).toBe('地区');
    expect(cells[0]!.attributes('data-column-key')).toBe('region');
    expect(cells[1]!.text()).toBe('车间');
    expect(cells[1]!.attributes('data-column-key')).toBe('vehicle');
  });

  it('with columns set, renders one sidebar-row per swimlane strip with `data-row-id` attribution', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [],
        rows: rowsWithNames,
        axisInput,
        columns: [{ key: 'region', label: '地区', width: 80 }],
      },
    });
    const sidebarRows = wrapper.findAll('.cx-gantt-sidebar-row');
    expect(sidebarRows).toHaveLength(2);
    expect(sidebarRows[0]!.attributes('data-row-id')).toBe('r1');
    expect(sidebarRows[1]!.attributes('data-row-id')).toBe('r2');
  });

  it('each sidebar row reads `RowSpec.columns[col.key]` for its cell text', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [],
        rows: rowsWithNames,
        axisInput,
        columns: [
          { key: 'region', label: '地区', width: 80 },
          { key: 'vehicle', label: '车间', width: 120 },
        ],
      },
    });
    const r1Cells = wrapper.findAll('[data-row-id="r1"].cx-gantt-sidebar-cell');
    expect(r1Cells).toHaveLength(2);
    expect(r1Cells[0]!.text()).toBe('海口');
    expect(r1Cells[1]!.text()).toBe('车间 A');
    const r2Cells = wrapper.findAll('[data-row-id="r2"].cx-gantt-sidebar-cell');
    expect(r2Cells[1]!.text()).toBe('车间 B');
  });

  it('missing `RowSpec.columns[key]` resolves to an empty cell rather than `undefined`', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [],
        // r1 has no `notes` field — the cell should fall back to empty.
        rows: [{ id: 'r1', columns: { region: '海口' } }] as readonly RowSpec[],
        axisInput,
        columns: [
          { key: 'region', label: '地区', width: 80 },
          { key: 'notes', label: '备注', width: 120 },
        ],
      },
    });
    const cells = wrapper.findAll('[data-row-id="r1"].cx-gantt-sidebar-cell');
    expect(cells[1]!.text()).toBe('');
  });

  it('sidebar `<tr>` heights bake rowSpacing into non-last rows so rowspan cells span the same y-range as body strips', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [],
        rows: rowsWithNames,
        axisInput,
        columns: [{ key: 'region', label: '地区', width: 80 }],
      },
    });
    const sidebarRows = wrapper.findAll('.cx-gantt-sidebar-row');
    // Phase 43: 2 strips. rowSpacing defaults to 1. Empty-row strip
    // default height = 34 (barHeight 30 + firstBarTopPadding 4).
    // Non-last row height = strip.height + rowSpacing = 34 + 1 = 35.
    // Last row stays at strip.height = 34.
    // Total table height = 35 + 34 = 69 = body strip-content total.
    expect((sidebarRows[0]!.element as HTMLElement).style.height).toBe('35px');
    expect((sidebarRows[1]!.element as HTMLElement).style.height).toBe('34px');
  });

  it('sidebar header table height matches the chart header band height (44 = 1 × 20 + 24)', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [],
        rows: rowsWithNames,
        axisInput,
        columns: [{ key: 'region', label: '地区', width: 80 }],
      },
    });
    // Height is on the inner `<table>` (the outer div carries only
    // sticky positioning + border + background).
    const headerTable = wrapper.find('.cx-gantt-sidebar-header table').element as HTMLTableElement;
    expect(headerTable.style.height).toBe('44px');
  });

  it('wrapper switches to `display: grid` with a three-column track template (sidebar | divider | chart) when sidebar is rendered', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [],
        rows: rowsWithNames,
        axisInput,
        columns: [
          { key: 'region', label: '地区', width: 80 },
          { key: 'vehicle', label: '车间', width: 120 },
        ],
      },
    });
    const root = wrapper.find('div.cx-gantt-wrapper').element as HTMLElement;
    expect(root.style.display).toBe('grid');
    // sidebarWidth = 80 + 120 = 200; middle track is the 8-px divider
    // (Phase 14); right track is `auto` so the grid's intrinsic width
    // grows with the chart and overflow:auto engages horizontal scroll.
    expect(root.style.gridTemplateColumns).toBe('200px 8px auto');
  });

  it('Phase 23: wrapper is a 1-column grid when `columns` is omitted (chart-only layout)', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows: rowsWithNames, axisInput },
    });
    const root = wrapper.find('div.cx-gantt-wrapper').element as HTMLElement;
    // Dual-scrollport applies even without sidebar: chart-header-pane
    // above chart-pane, in a single-column grid. Both panes own their
    // own overflow.
    expect(root.style.display).toBe('grid');
    expect(root.style.gridTemplateColumns).toBe('auto');
    expect(wrapper.find('div.cx-gantt-sidebar-pane').exists()).toBe(false);
    expect(wrapper.find('div.cx-gantt-sidebar-header-pane').exists()).toBe(false);
  });

  it('with columns set, the header SVG and body SVG still render at the same width (the chart pane is unchanged)', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [],
        rows: rowsWithNames,
        axisInput,
        columns: [{ key: 'region', label: '地区', width: 80 }],
      },
    });
    expect(wrapper.find('svg.cx-gantt-header').exists()).toBe(true);
    expect(wrapper.find('svg.cx-gantt-body').exists()).toBe(true);
    expect(wrapper.find('svg.cx-gantt-header').attributes('width')).toBe(
      wrapper.find('svg.cx-gantt-body').attributes('width'),
    );
  });

  it('Phase 23: sidebar-header sits inside cx-gantt-sidebar-header-pane (overflow: hidden), no longer sticky', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [],
        rows: rowsWithNames,
        axisInput,
        columns: [{ key: 'region', label: '地区', width: 80 }],
      },
    });
    const headerPane = wrapper.find('div.cx-gantt-sidebar-header-pane').element as HTMLElement;
    expect(headerPane.style.overflow).toBe('hidden');
    const header = wrapper.find('.cx-gantt-sidebar-header').element as HTMLElement;
    // Dual-scrollport: sticky positioning removed; sidebar-header
    // lives inside its own pane wrapper.
    expect(header.style.position).toBe('');
    expect(header.style.top).toBe('');
    expect(header.style.left).toBe('');
    // Background preserved for visual chrome.
    expect(header.style.background).not.toBe('');
  });

  it('Phase 23: sidebar-body sits inside cx-gantt-sidebar-pane (overflow: auto), no longer sticky', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [],
        rows: rowsWithNames,
        axisInput,
        columns: [{ key: 'region', label: '地区', width: 80 }],
      },
    });
    const sidebarPane = wrapper.find('div.cx-gantt-sidebar-pane').element as HTMLElement;
    expect(sidebarPane.style.overflow).toBe('auto');
    const body = wrapper.find('.cx-gantt-sidebar-body').element as HTMLElement;
    expect(body.style.position).toBe('');
    expect(body.style.left).toBe('');
    expect(body.style.background).not.toBe('');
  });

  it('Phase 23: no z-index stacking on sidebar/chart panes (sticky positioning removed)', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [],
        rows: rowsWithNames,
        axisInput,
        columns: [{ key: 'region', label: '地区', width: 80 }],
      },
    });
    const sh = (wrapper.find('.cx-gantt-sidebar-header').element as HTMLElement).style.zIndex;
    const ch = (wrapper.find('svg.cx-gantt-header').element as unknown as SVGSVGElement).style
      .zIndex;
    const sb = (wrapper.find('.cx-gantt-sidebar-body').element as HTMLElement).style.zIndex;
    // Under dual-scrollport, panes don't overlap (they're in distinct
    // grid cells) so z-index ladders aren't needed.
    expect(sh).toBe('');
    expect(ch).toBe('');
    expect(sb).toBe('');
  });
});

describe('computeRowSpans', () => {
  it('returns all-ones for columns without `group: true`', () => {
    const rows: readonly RowSpec[] = [
      { id: 'r1', columns: { region: '海口' } },
      { id: 'r2', columns: { region: '海口' } },
      { id: 'r3', columns: { region: '海口' } },
    ];
    const cols = [{ key: 'region', label: '地区', width: 80 }];
    expect(computeRowSpans(rows, cols)).toEqual([[1, 1, 1]]);
  });

  it('merges consecutive rows with the same value into a leading rowspan and absorbs the rest as 0', () => {
    const rows: readonly RowSpec[] = [
      { id: 'r1', columns: { region: '海口' } },
      { id: 'r2', columns: { region: '海口' } },
      { id: 'r3', columns: { region: '海口' } },
      { id: 'r4', columns: { region: '三亚' } },
    ];
    const cols = [{ key: 'region', label: '地区', width: 80, group: true }];
    expect(computeRowSpans(rows, cols)).toEqual([[3, 0, 0, 1]]);
  });

  it('does not merge non-adjacent rows that share a value (sandwich pattern)', () => {
    // 海口, 三亚, 海口 — the two 海口 rows are not adjacent, so they
    // each render their own individual cell. No rowspan, no merge.
    const rows: readonly RowSpec[] = [
      { id: 'r1', columns: { region: '海口' } },
      { id: 'r2', columns: { region: '三亚' } },
      { id: 'r3', columns: { region: '海口' } },
    ];
    const cols = [{ key: 'region', label: '地区', width: 80, group: true }];
    expect(computeRowSpans(rows, cols)).toEqual([[1, 1, 1]]);
  });

  it('emits an independent spans array per column (each column merges based on its own values)', () => {
    const rows: readonly RowSpec[] = [
      { id: 'r1', columns: { region: '海口', base: '海口基地' } },
      { id: 'r2', columns: { region: '海口', base: '海口基地' } },
      { id: 'r3', columns: { region: '海口', base: '空港基地' } },
      { id: 'r4', columns: { region: '三亚', base: '三亚基地' } },
    ];
    const cols = [
      { key: 'region', label: '地区', width: 80, group: true },
      { key: 'base', label: '基地', width: 100, group: true },
    ];
    // region: 海口×3 + 三亚×1 → [3, 0, 0, 1]
    // base:   海口基地×2 + 空港基地×1 + 三亚基地×1 → [2, 0, 1, 1]
    expect(computeRowSpans(rows, cols)).toEqual([
      [3, 0, 0, 1],
      [2, 0, 1, 1],
    ]);
  });

  it('treats `undefined` values as a distinct group (does not merge across missing keys)', () => {
    const rows: readonly RowSpec[] = [
      { id: 'r1', columns: { region: undefined } },
      { id: 'r2', columns: { region: undefined } },
      { id: 'r3', columns: { region: '海口' } },
    ];
    const cols = [{ key: 'region', label: '地区', width: 80, group: true }];
    // Two undefined rows ARE adjacent and equal → merge as rowspan 2.
    expect(computeRowSpans(rows, cols)).toEqual([[2, 0, 1]]);
  });
});

describe('<ChronixGantt> sidebar vGrouping (rowspan merge)', () => {
  // Three workshops in 海口, two in 三亚. The first two 海口 rows also
  // share 海口基地; the third 海口 row sits in a different base. This
  // exercises both region-level and base-level merges of different
  // spans, plus a non-merge in the workshop (leaf) column.
  const groupedRows: readonly RowSpec[] = [
    { id: 'r1', columns: { region: '海口', base: '海口基地', name: '1车间' } },
    { id: 'r2', columns: { region: '海口', base: '海口基地', name: '2车间' } },
    { id: 'r3', columns: { region: '海口', base: '空港基地', name: '3车间' } },
    { id: 'r4', columns: { region: '三亚', base: '三亚基地', name: '4车间' } },
  ];
  const groupedColumns = [
    { key: 'region', label: '地区', width: 60, group: true },
    { key: 'base', label: '基地', width: 100, group: true },
    { key: 'name', label: '车间', width: 80 },
  ];

  it('renders one `<td rowspan>` per merged group at the FIRST row of the group', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows: groupedRows, axisInput, columns: groupedColumns },
    });
    // Region 海口 starts at r1 with rowspan=3.
    const r1Region = wrapper.find('[data-row-id="r1"][data-column-key="region"]');
    expect(r1Region.exists()).toBe(true);
    expect(r1Region.attributes('rowspan')).toBe('3');
    expect(r1Region.text()).toBe('海口');
    // Region 三亚 starts at r4 with rowspan=1 — no rowspan attribute emitted.
    const r4Region = wrapper.find('[data-row-id="r4"][data-column-key="region"]');
    expect(r4Region.attributes('rowspan')).toBeUndefined();
    expect(r4Region.text()).toBe('三亚');
  });

  it('absorbed cells emit no DOM (only the leading row carries the rowspan cell)', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows: groupedRows, axisInput, columns: groupedColumns },
    });
    // r2 and r3 are absorbed in the region column — no region cell renders.
    expect(wrapper.find('[data-row-id="r2"][data-column-key="region"]').exists()).toBe(false);
    expect(wrapper.find('[data-row-id="r3"][data-column-key="region"]').exists()).toBe(false);
    // r2 is also absorbed in the base column (海口基地 spans r1+r2).
    expect(wrapper.find('[data-row-id="r2"][data-column-key="base"]').exists()).toBe(false);
    // r3 IS the leading row of its own base (空港基地 rowspan=1) — cell renders.
    expect(wrapper.find('[data-row-id="r3"][data-column-key="base"]').exists()).toBe(true);
  });

  it('merged cells render bold (font-weight: 600); individual cells render normal weight', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows: groupedRows, axisInput, columns: groupedColumns },
    });
    const r1Region = wrapper.find('[data-row-id="r1"][data-column-key="region"]')
      .element as HTMLTableCellElement;
    expect(r1Region.style.fontWeight).toBe('600');
    // Workshop column has no `group: true` → every cell is individual,
    // normal weight.
    const r1Name = wrapper.find('[data-row-id="r1"][data-column-key="name"]')
      .element as HTMLTableCellElement;
    expect(r1Name.style.fontWeight).toBe('400');
  });

  it('sidebar header is a `<table>` with a `<thead>` carrying one `<th>` per column', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows: groupedRows, axisInput, columns: groupedColumns },
    });
    expect(wrapper.find('.cx-gantt-sidebar-header table thead tr').exists()).toBe(true);
    const headerCells = wrapper.findAll('.cx-gantt-sidebar-header-cell');
    expect(headerCells).toHaveLength(3);
    expect(headerCells.map((c) => c.text())).toEqual(['地区', '基地', '车间']);
  });

  it('sidebar body is a `<table>` with a `<tbody>` carrying one `<tr>` per swimlane strip', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows: groupedRows, axisInput, columns: groupedColumns },
    });
    const bodyRows = wrapper.findAll('.cx-gantt-sidebar-body table tbody tr');
    expect(bodyRows).toHaveLength(4); // 4 rows = 4 strips
    expect(bodyRows.map((r) => r.attributes('data-row-id'))).toEqual(['r1', 'r2', 'r3', 'r4']);
  });

  it('Phase 23: the `.cx-gantt-sidebar-body` div lives inside the sidebar-pane wrapper (no longer sticky)', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows: groupedRows, axisInput, columns: groupedColumns },
    });
    const sidebarPane = wrapper.find('div.cx-gantt-sidebar-pane').element as HTMLElement;
    expect(sidebarPane.style.overflow).toBe('auto');
    const body = wrapper.find('.cx-gantt-sidebar-body').element as HTMLElement;
    expect(body.style.position).toBe('');
    expect(body.style.left).toBe('');
    // Body must sit inside the sidebar-pane DOM-wise.
    expect(sidebarPane.contains(body)).toBe(true);
  });

  it('header + body tables share the same per-column widths via matching `<colgroup>` entries', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows: groupedRows, axisInput, columns: groupedColumns },
    });
    const headerCols = wrapper.findAll('.cx-gantt-sidebar-header colgroup col');
    const bodyCols = wrapper.findAll('.cx-gantt-sidebar-body colgroup col');
    expect(headerCols).toHaveLength(3);
    expect(bodyCols).toHaveLength(3);
    for (let i = 0; i < 3; i++) {
      expect((headerCols[i]!.element as HTMLElement).style.width).toBe(
        (bodyCols[i]!.element as HTMLElement).style.width,
      );
    }
  });

  it('a `columns` array where no entry has `group: true` renders one cell per row in every column (no merges)', () => {
    // Same rows as the grouped test, but columns drop `group: true`
    // entirely. Every cell should render individually — backward
    // compatible with Phase 5 v0 behavior.
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [],
        rows: groupedRows,
        axisInput,
        columns: [
          { key: 'region', label: '地区', width: 60 },
          { key: 'base', label: '基地', width: 100 },
          { key: 'name', label: '车间', width: 80 },
        ],
      },
    });
    // Every (row, col) intersection has a cell — 4 × 3 = 12 cells.
    expect(wrapper.findAll('.cx-gantt-sidebar-cell')).toHaveLength(12);
    // No rowspan attribute anywhere.
    expect(wrapper.findAll('[rowspan]')).toHaveLength(0);
  });
});

describe('<ChronixGantt> theme (Phase 10)', () => {
  // Bar with progress so the progress-overlay-themed rect + label both
  // render in tests that exercise progress tokens.
  const progressBars = [
    {
      ...bar('b1', 'r1', 8, 12),
      progress: { value: 50 },
      pointerOverlayId: 'progress-handle',
    },
  ];

  it('renders header tick-label and outer-header-cell tokens from defaultChronixTheme', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [bar('b1', 'r1', 8, 12)], rows, axisInput },
    });
    // Default: headerTickLabel = '#6b7280', headerCellLabel = '#374151'.
    const tickLabel = wrapper.find('.cx-gantt-tick-label');
    expect(tickLabel.attributes('fill')).toBe('#6b7280');
    expect(Number(tickLabel.attributes('font-size'))).toBe(10);

    const headerCellLabel = wrapper.find('.cx-gantt-header-cell-label');
    expect(headerCellLabel.attributes('fill')).toBe('#374151');
    expect(Number(headerCellLabel.attributes('font-size'))).toBe(11);
  });

  it('partial theme override on `headerCellFill` propagates to outer header rects', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [],
        rows,
        axisInput,
        theme: { headerCellFill: '#fef3c7' },
      },
    });
    const cells = wrapper.findAll('.cx-gantt-header-cell');
    expect(cells.length).toBeGreaterThan(0);
    // All outer header rects pick up the override.
    for (const cell of cells) {
      expect(cell.attributes('fill')).toBe('#fef3c7');
    }
    // Other tokens stay at default — divider still uses '#9ca3af'.
    expect(wrapper.find('.cx-gantt-axis-divider').attributes('stroke')).toBe('#9ca3af');
  });

  it('theme.tickLabelFontSize override applies to every tick label', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [],
        rows,
        axisInput,
        theme: { tickLabelFontSize: 14 },
      },
    });
    const labels = wrapper.findAll('.cx-gantt-tick-label');
    expect(labels.length).toBe(24); // day view: 24 hour labels
    for (const label of labels) {
      expect(Number(label.attributes('font-size'))).toBe(14);
    }
  });

  it('theme.progressFill override propagates to the progress overlay rect', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: progressBars,
        rows,
        axisInput,
        theme: { progressFill: '#7c3aed' },
      },
    });
    const fill = wrapper.find('.cx-gantt-progress-fill');
    expect(fill.exists()).toBe(true);
    expect(fill.attributes('fill')).toBe('#7c3aed');
    // Opacity stays at default 0.35.
    expect(Number(fill.attributes('fill-opacity'))).toBeCloseTo(0.35, 5);
  });

  it('theme.linkDefaultColor override drives both link stroke and matching marker def color', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 1, 4), bar('b2', 'r2', 8, 12)],
        rows,
        axisInput,
        links: [{ id: 'l-1', fromBarId: 'b1', toBarId: 'b2', routing: 'square', marker: 'arrow' }],
        theme: { linkDefaultColor: '#ef4444' },
      },
    });
    const path = wrapper.find('path.cx-gantt-link');
    expect(path.attributes('stroke')).toBe('#ef4444');
    expect(path.attributes('marker-end')).toBe('url(#cx-marker-arrow-ef4444)');
    // The matching marker def exists with the override color.
    const arrowMarker = wrapper
      .find('defs.cx-gantt-defs')
      .element.querySelector(`marker#${CSS.escape('cx-marker-arrow-ef4444')}`);
    expect(arrowMarker).not.toBeNull();
    expect(arrowMarker!.querySelector('polygon')!.getAttribute('fill')).toBe('#ef4444');
  });

  it('theme.linkStrokeWidth override applies to link <path>', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 1, 4), bar('b2', 'r2', 8, 12)],
        rows,
        axisInput,
        links: [{ id: 'l-1', fromBarId: 'b1', toBarId: 'b2', routing: 'square', marker: 'arrow' }],
        theme: { linkStrokeWidth: 3 },
      },
    });
    const path = wrapper.find('path.cx-gantt-link');
    expect(Number(path.attributes('stroke-width'))).toBe(3);
  });
});

describe('<ChronixGantt> slot registry (Phase 11)', () => {
  it('no slotRegistry prop → bars render as default <rect class="cx-gantt-bar">', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12), bar('b2', 'r2', 1, 4)],
        rows,
        axisInput,
      },
    });
    const defaults = wrapper.findAll('rect.cx-gantt-bar');
    expect(defaults).toHaveLength(2);
    expect(defaults[0]!.attributes('data-bar-id')).toBe('b1');
    expect(wrapper.findAll('[data-custom-bar]')).toHaveLength(0);
  });

  it("'bar' slot template fires once per placed bar and fully replaces the default rect", () => {
    const registry = createSlotRegistry();
    registry.register(BAR_SLOT_NAME, () =>
      h('g', { 'data-custom-bar': true }, [h('circle', { r: 4 })]),
    );

    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12), bar('b2', 'r2', 1, 4)],
        rows,
        axisInput,
        slotRegistry: registry,
      },
    });
    expect(wrapper.findAll('[data-custom-bar]')).toHaveLength(2);
    expect(wrapper.findAll('rect.cx-gantt-bar')).toHaveLength(0);
  });

  it('slot template receives placedBar + sourceBar + live render geometry', () => {
    const calls: BarSlotArgs[] = [];
    const registry = createSlotRegistry();
    registry.register(BAR_SLOT_NAME, (ctx) => {
      calls.push(ctx.args as unknown as BarSlotArgs);
      return h('rect', {
        'data-probe-id': (ctx.args as unknown as BarSlotArgs).placedBar.barId,
      });
    });

    mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12)],
        rows,
        axisInput,
        slotRegistry: registry,
      },
    });
    expect(calls).toHaveLength(1);
    const args = calls[0]!;
    expect(args.placedBar.barId).toBe('b1');
    expect(args.sourceBar.id).toBe('b1');
    // Day view: hour 8 × slotWidth 60 = 480. No active transaction at
    // mount, so renderX === placedBar.x.
    expect(args.renderX).toBe(args.placedBar.x);
    expect(args.renderX).toBe(480);
    expect(args.renderY).toBe(args.placedBar.y);
    expect(args.renderWidth).toBe(args.placedBar.width);
    expect(args.renderHeight).toBe(args.placedBar.height);
    expect(args.activeTransaction).toBeNull();
  });

  it('slot template receives the effective theme (merged defaults + override)', () => {
    let receivedTheme: ChronixTheme | undefined;
    const registry = createSlotRegistry();
    registry.register(BAR_SLOT_NAME, (ctx) => {
      receivedTheme = (ctx.args as unknown as BarSlotArgs).theme;
      return h('rect', { 'data-themed': true });
    });

    mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12)],
        rows,
        axisInput,
        theme: { progressFill: '#7c3aed' },
        slotRegistry: registry,
      },
    });
    expect(receivedTheme).toBeDefined();
    // Overridden token comes through.
    expect(receivedTheme!.progressFill).toBe('#7c3aed');
    // Other tokens stay at defaults — proves the slot ctx receives the
    // MERGED theme, not just the partial override.
    expect(receivedTheme!.linkDefaultColor).toBe(defaultChronixTheme.linkDefaultColor);
  });

  it('unregister mid-life → next render falls back to default <rect>', async () => {
    const registry = createSlotRegistry();
    registry.register(BAR_SLOT_NAME, () => h('rect', { 'data-custom-bar': true }));

    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12)],
        rows,
        axisInput,
        slotRegistry: registry,
      },
    });
    expect(wrapper.findAll('[data-custom-bar]')).toHaveLength(1);
    expect(wrapper.findAll('rect.cx-gantt-bar')).toHaveLength(0);

    // Unregister, then trigger a re-render by changing a reactive
    // prop. The next render reads `registry.has('bar')` as false →
    // falls back to default rect.
    registry.unregister(BAR_SLOT_NAME);
    await wrapper.setProps({ bars: [bar('b1', 'r1', 9, 13)] });
    expect(wrapper.findAll('[data-custom-bar]')).toHaveLength(0);
    expect(wrapper.findAll('rect.cx-gantt-bar')).toHaveLength(1);
  });
});

describe('<ChronixGantt> selection model (Phase 12)', () => {
  it("plain click on bar body emits 'bar-click' with { barId, sourceBar, jsEvent }", async () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [bar('b1', 'r1', 8, 12)], rows, axisInput },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    // Pointerdown + pointerup at the same coords (no movement) inside
    // bar 'b1' content bounds (x ∈ [480, 720], y ∈ [8, 38]).
    await svg.trigger('pointerdown', { clientX: 600, clientY: 20, button: 0, pointerId: 1 });
    await svg.trigger('pointerup', { clientX: 600, clientY: 20, pointerId: 1 });

    const emitted = wrapper.emitted('bar-click');
    expect(emitted).toBeTruthy();
    expect(emitted).toHaveLength(1);
    const payload = emitted![0]![0] as { barId: string; sourceBar: { id: string } };
    expect(payload.barId).toBe('b1');
    expect(payload.sourceBar.id).toBe('b1');
  });

  it("'bar-click' does NOT fire after a non-zero-delta drag commit", async () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [bar('b1', 'r1', 8, 12)], rows, axisInput, editable: true },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    // Real drag: pointerdown → move +60px → pointerup.
    await svg.trigger('pointerdown', { clientX: 600, clientY: 20, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 660, clientY: 20, pointerId: 1 });
    await svg.trigger('pointerup', { clientX: 660, clientY: 20, pointerId: 1 });

    expect(wrapper.emitted('bar-drop')).toBeTruthy();
    expect(wrapper.emitted('bar-click')).toBeFalsy();
  });

  it("plain click on bar edge (resize zone) emits NEITHER 'bar-click' NOR 'bar-resize' for zero-delta", async () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [bar('b1', 'r1', 8, 12)], rows, axisInput, editable: true },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    // Bar end edge at x=720; default 8-px end zone is [712, 720]. Click 715, no movement.
    await svg.trigger('pointerdown', { clientX: 715, clientY: 20, button: 0, pointerId: 1 });
    await svg.trigger('pointerup', { clientX: 715, clientY: 20, pointerId: 1 });
    // Zero-delta bar-resize aborts; click discrimination on hit.kind
    // !== 'bar-body' also skips 'bar-click'.
    expect(wrapper.emitted('bar-click')).toBeFalsy();
    expect(wrapper.emitted('bar-resize')).toBeFalsy();
  });

  it("selectedBarIds prop applies '.cx-gantt-bar--selected' class to the matching default rect", () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12), bar('b2', 'r2', 1, 4)],
        rows,
        axisInput,
        selectedBarIds: ['b2'],
      },
    });
    const b1 = wrapper.find('[data-bar-id="b1"]');
    const b2 = wrapper.find('[data-bar-id="b2"]');
    expect(b1.classes()).toContain('cx-gantt-bar');
    expect(b1.classes()).not.toContain('cx-gantt-bar--selected');
    expect(b2.classes()).toContain('cx-gantt-bar');
    expect(b2.classes()).toContain('cx-gantt-bar--selected');
  });

  it('selectedBarIds propagates to BarSlotArgs.isSelected for the matching bar', () => {
    const seen: { barId: string; isSelected: boolean }[] = [];
    const registry = createSlotRegistry();
    registry.register(BAR_SLOT_NAME, (ctx) => {
      const args = ctx.args as unknown as BarSlotArgs;
      seen.push({ barId: args.placedBar.barId, isSelected: args.isSelected });
      return h('rect');
    });
    mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12), bar('b2', 'r2', 1, 4)],
        rows,
        axisInput,
        selectedBarIds: ['b1'],
        slotRegistry: registry,
      },
    });
    expect(seen).toHaveLength(2);
    const b1 = seen.find((s) => s.barId === 'b1');
    const b2 = seen.find((s) => s.barId === 'b2');
    expect(b1?.isSelected).toBe(true);
    expect(b2?.isSelected).toBe(false);
  });

  it("plain click on empty row emits 'empty-area-click' with { rowId, jsEvent }", async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [], // empty so click on row hits empty-row, not bar-body
        rows,
        axisInput,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    // Click on row r1 (y=20).
    await svg.trigger('pointerdown', { clientX: 200, clientY: 20, button: 0, pointerId: 1 });
    await svg.trigger('pointerup', { clientX: 200, clientY: 20, pointerId: 1 });

    const emitted = wrapper.emitted('empty-area-click');
    expect(emitted).toBeTruthy();
    expect(emitted).toHaveLength(1);
    const payload = emitted![0]![0] as { rowId: string | null };
    expect(payload.rowId).toBe('r1');
    // No bar-click (no bar at that position).
    expect(wrapper.emitted('bar-click')).toBeFalsy();
  });

  it('zero-delta drag (click with editable=true) emits bar-click, not bar-drop', async () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [bar('b1', 'r1', 8, 12)], rows, axisInput, editable: true },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    // editable=true → pointerdown starts bar-drag. Pointerup with no
    // movement = 0-delta → aborts the txn → click fires.
    await svg.trigger('pointerdown', { clientX: 600, clientY: 20, button: 0, pointerId: 1 });
    await svg.trigger('pointerup', { clientX: 600, clientY: 20, pointerId: 1 });

    expect(wrapper.emitted('bar-drop')).toBeFalsy();
    expect(wrapper.emitted('bar-click')).toBeTruthy();
  });
});

describe('<ChronixGantt> sidebar resize divider (Phase 14)', () => {
  const rowsWithNames: readonly RowSpec[] = [
    { id: 'r1', columns: { region: '海口', vehicle: '车间 A' } },
    { id: 'r2', columns: { region: '海口', vehicle: '车间 B' } },
  ];

  it('renders a divider element with `col-resize` cursor when the sidebar is present', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [],
        rows: rowsWithNames,
        axisInput,
        columns: [
          { key: 'region', label: '地区', width: 80 },
          { key: 'vehicle', label: '车间', width: 120 },
        ],
      },
    });
    const divider = wrapper.find('.cx-gantt-sidebar-divider');
    expect(divider.exists()).toBe(true);
    expect((divider.element as HTMLElement).style.cursor).toBe('col-resize');
    // Phase 23: under dual-scrollport the divider sits in grid column 2
    // naturally — no sticky-left positioning required.
    expect((divider.element as HTMLElement).style.left).toBe('');
    expect((divider.element as HTMLElement).style.position).toBe('');
  });

  it('renders no divider when `columns` is omitted (no-sidebar branch is unchanged)', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows: rowsWithNames, axisInput },
    });
    expect(wrapper.find('.cx-gantt-sidebar-divider').exists()).toBe(false);
  });

  it('drag updates wrapper `gridTemplateColumns` to the new sidebar width', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [],
        rows: rowsWithNames,
        axisInput,
        columns: [
          { key: 'region', label: '地区', width: 80 },
          { key: 'vehicle', label: '车间', width: 120 },
        ],
      },
    });
    // Stub the wrapper's getBoundingClientRect so the MAX clamp has a
    // realistic viewport width. happy-dom returns zero by default,
    // which would collapse maxWidth to MIN.
    const wrapperEl = wrapper.find('.cx-gantt-wrapper').element;
    vi.spyOn(wrapperEl, 'getBoundingClientRect').mockReturnValue({
      width: 1000,
      height: 600,
      top: 0,
      left: 0,
      right: 1000,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON() {
        return {};
      },
    });

    const divider = wrapper.find('.cx-gantt-sidebar-divider');
    await divider.trigger('pointerdown', { clientX: 200, button: 0, pointerId: 1 });
    // Drag right 50px → sidebar grows from 200 → 250.
    await divider.trigger('pointermove', { clientX: 250, pointerId: 1 });
    await divider.trigger('pointerup', { clientX: 250, pointerId: 1 });

    const root = wrapper.find('div.cx-gantt-wrapper').element as HTMLElement;
    expect(root.style.gridTemplateColumns).toBe('250px 8px auto');
  });

  it('MIN clamp prevents the sidebar from shrinking below 40px (chronix MIN)', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [],
        rows: rowsWithNames,
        axisInput,
        columns: [
          { key: 'region', label: '地区', width: 80 },
          { key: 'vehicle', label: '车间', width: 120 },
        ],
      },
    });
    const wrapperEl = wrapper.find('.cx-gantt-wrapper').element;
    vi.spyOn(wrapperEl, 'getBoundingClientRect').mockReturnValue({
      width: 1000,
      height: 600,
      top: 0,
      left: 0,
      right: 1000,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON() {
        return {};
      },
    });

    const divider = wrapper.find('.cx-gantt-sidebar-divider');
    // Drag far to the left: 200 − 500 = -300 → clamps to MIN = 40.
    await divider.trigger('pointerdown', { clientX: 200, button: 0, pointerId: 1 });
    await divider.trigger('pointermove', { clientX: -300, pointerId: 1 });

    const root = wrapper.find('div.cx-gantt-wrapper').element as HTMLElement;
    expect(root.style.gridTemplateColumns).toBe('40px 8px auto');
  });

  it('MAX clamp prevents the sidebar from growing past `wrapperWidth − MIN`', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [],
        rows: rowsWithNames,
        axisInput,
        columns: [
          { key: 'region', label: '地区', width: 80 },
          { key: 'vehicle', label: '车间', width: 120 },
        ],
      },
    });
    const wrapperEl = wrapper.find('.cx-gantt-wrapper').element;
    vi.spyOn(wrapperEl, 'getBoundingClientRect').mockReturnValue({
      width: 1000,
      height: 600,
      top: 0,
      left: 0,
      right: 1000,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON() {
        return {};
      },
    });

    const divider = wrapper.find('.cx-gantt-sidebar-divider');
    // Drag far to the right: 200 + 5000 = 5200 → clamps to wrapperWidth
    // − MIN = 1000 − 40 = 960.
    await divider.trigger('pointerdown', { clientX: 200, button: 0, pointerId: 1 });
    await divider.trigger('pointermove', { clientX: 5200, pointerId: 1 });

    const root = wrapper.find('div.cx-gantt-wrapper').element as HTMLElement;
    expect(root.style.gridTemplateColumns).toBe('960px 8px auto');
  });

  it('column widths stay fixed during drag — narrower pane overflows instead of compressing', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [],
        rows: rowsWithNames,
        axisInput,
        columns: [
          { key: 'region', label: '地区', width: 80 },
          { key: 'vehicle', label: '车间', width: 120 },
        ],
      },
    });
    const wrapperEl = wrapper.find('.cx-gantt-wrapper').element;
    vi.spyOn(wrapperEl, 'getBoundingClientRect').mockReturnValue({
      width: 1000,
      height: 600,
      top: 0,
      left: 0,
      right: 1000,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON() {
        return {};
      },
    });

    // Drag the sidebar from baseSum=200 down to override=100 (narrower
    // than the columns). Columns keep their declared widths (region=80,
    // vehicle=120); the sidebar table stays at the natural column sum
    // (200px) so the pane overflows and reveals a horizontal scrollbar
    // rather than scaling/compressing the cols.
    const divider = wrapper.find('.cx-gantt-sidebar-divider');
    await divider.trigger('pointerdown', { clientX: 200, button: 0, pointerId: 1 });
    await divider.trigger('pointermove', { clientX: 100, pointerId: 1 });

    const cols = wrapper.findAll('colgroup > col');
    // Two colgroups (header table + body table) × two columns = 4 <col>.
    expect(cols).toHaveLength(4);
    expect((cols[0]!.element as HTMLElement).style.width).toBe('80px');
    expect((cols[1]!.element as HTMLElement).style.width).toBe('120px');
    expect((cols[2]!.element as HTMLElement).style.width).toBe('80px');
    expect((cols[3]!.element as HTMLElement).style.width).toBe('120px');
    // The sidebar body table keeps the natural column-sum width (200px),
    // independent of the dragged pane width (100px).
    const bodyTable = wrapper.find('.cx-gantt-sidebar-body table').element as HTMLElement;
    expect(bodyTable.style.width).toBe('200px');
    // The grid track (pane width) does follow the drag → narrower pane.
    expect((wrapperEl as HTMLElement).style.gridTemplateColumns).toBe('100px 8px auto');
    // minWidth:0 lets the pane shrink below the table's natural width.
    const sidebarPane = wrapper.find('.cx-gantt-sidebar-pane').element as HTMLElement;
    expect(sidebarPane.style.minWidth).toBe('0');
  });
});

describe('<ChronixGantt> drag/resize lifecycle emits (Phase 16)', () => {
  it('drag bar body: emits bar-dragstart on first non-zero pointermove, bar-dragstop on pointerup, bar-drop after bar-dragstop', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12)],
        rows,
        axisInput,
        editable: true,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    const cy = 20;
    await svg.trigger('pointerdown', { clientX: 600, clientY: cy, button: 0, pointerId: 1 });
    // No start yet — delta is still 0.
    expect(wrapper.emitted('bar-dragstart')).toBeFalsy();
    await svg.trigger('pointermove', { clientX: 660, clientY: cy, pointerId: 1 });
    // After the first non-zero advance, bar-dragstart should be emitted.
    expect(wrapper.emitted('bar-dragstart')).toHaveLength(1);
    const startPayload = wrapper.emitted('bar-dragstart')![0]![0] as {
      barId: string;
      sourceBar: { id: string };
      jsEvent: { type: string };
    };
    expect(startPayload.barId).toBe('b1');
    expect(startPayload.sourceBar.id).toBe('b1');
    expect(startPayload.jsEvent.type).toBe('pointermove');
    expect(wrapper.emitted('bar-dragstop')).toBeFalsy();

    await svg.trigger('pointerup', { clientX: 660, clientY: cy, pointerId: 1 });
    expect(wrapper.emitted('bar-dragstop')).toHaveLength(1);
    const stopPayload = wrapper.emitted('bar-dragstop')![0]![0] as {
      barId: string;
      jsEvent: { type: string };
    };
    expect(stopPayload.barId).toBe('b1');
    // The pointerup event is what stop carries (refreshed by onPointerup).
    expect(stopPayload.jsEvent.type).toBe('pointerup');
    expect(wrapper.emitted('bar-drop')).toHaveLength(1);
  });

  it('plain click on bar (0-delta): NO bar-dragstart / bar-dragstop emitted; bar-click still fires', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12)],
        rows,
        axisInput,
        editable: true,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    const cy = 20;
    // editable=true → pointerdown starts bar-drag; pointerup with no
    // pointermove keeps delta at 0 → adapter aborts, lifecycle latch
    // never tripped, so no dragstart / dragstop fire.
    await svg.trigger('pointerdown', { clientX: 600, clientY: cy, button: 0, pointerId: 1 });
    await svg.trigger('pointerup', { clientX: 600, clientY: cy, pointerId: 1 });
    expect(wrapper.emitted('bar-dragstart')).toBeFalsy();
    expect(wrapper.emitted('bar-dragstop')).toBeFalsy();
    expect(wrapper.emitted('bar-drop')).toBeFalsy();
    // Phase 12 click discrimination still fires bar-click.
    expect(wrapper.emitted('bar-click')).toHaveLength(1);
  });

  it('drag bar end-edge: emits bar-resizestart with edge:end, bar-resizestop on pointerup, bar-resize after bar-resizestop', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12)],
        rows,
        axisInput,
        editable: true,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    const cy = 20;
    // End-edge zone is [712, 720] (edgeZoneWidth=8). Click 715, drag +60.
    await svg.trigger('pointerdown', { clientX: 715, clientY: cy, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 775, clientY: cy, pointerId: 1 });
    expect(wrapper.emitted('bar-resizestart')).toHaveLength(1);
    const startPayload = wrapper.emitted('bar-resizestart')![0]![0] as {
      barId: string;
      edge: string;
      sourceBar: { id: string };
    };
    expect(startPayload.barId).toBe('b1');
    expect(startPayload.edge).toBe('end');
    expect(startPayload.sourceBar.id).toBe('b1');

    await svg.trigger('pointerup', { clientX: 775, clientY: cy, pointerId: 1 });
    expect(wrapper.emitted('bar-resizestop')).toHaveLength(1);
    const stopPayload = wrapper.emitted('bar-resizestop')![0]![0] as {
      barId: string;
      edge: string;
    };
    expect(stopPayload.edge).toBe('end');
    expect(wrapper.emitted('bar-resize')).toHaveLength(1);
  });

  it('pointercancel mid-drag: bar-dragstart fires (drag was confirmed), bar-dragstop fires (regardless of valid mutation), bar-drop does NOT fire', async () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 8, 12)],
        rows,
        axisInput,
        editable: true,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    const cy = 20;
    await svg.trigger('pointerdown', { clientX: 600, clientY: cy, button: 0, pointerId: 1 });
    await svg.trigger('pointermove', { clientX: 660, clientY: cy, pointerId: 1 });
    expect(wrapper.emitted('bar-dragstart')).toHaveLength(1);
    await svg.trigger('pointercancel', { clientX: 660, clientY: cy, pointerId: 1 });
    expect(wrapper.emitted('bar-dragstop')).toHaveLength(1);
    expect(wrapper.emitted('bar-drop')).toBeFalsy();
  });
});

describe('<ChronixGantt> — Phase 21 todayLine', () => {
  // Pin `Date.now()` to mid-axis so the line lands inside the axis
  // range. The axisInput defaults to `anchorDate: 2026-05-13T00:00:00Z`
  // (day view spans the next 24 hours); 08:00 UTC is well inside that
  // span for any test runner timezone within ±12 hours of UTC.
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-05-13T08:00:00Z') });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders <line.cx-gantt-today-line> in both body + header SVGs when todayLine is `true`', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput, todayLine: true },
    });
    const lines = wrapper.findAll('line.cx-gantt-today-line');
    // One line in the header SVG + one in the body SVG.
    expect(lines).toHaveLength(2);
    const sides = lines.map((l) => l.attributes('data-today-line-side')).sort();
    expect(sides).toEqual(['body', 'header']);
  });

  it('does NOT render any today-line when todayLine prop is `false` (default)', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput },
    });
    expect(wrapper.findAll('line.cx-gantt-today-line')).toHaveLength(0);
    expect(wrapper.find('g.cx-gantt-today-line-tooltip').exists()).toBe(false);
  });

  it('does NOT render the line when today falls outside the axis range', () => {
    // Move "now" 30 days past the axis anchor → far beyond the day-view's
    // 24-hour window. resolvedTodayLine should return null.
    vi.setSystemTime(new Date('2026-06-13T08:00:00Z'));
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput, todayLine: true },
    });
    expect(wrapper.findAll('line.cx-gantt-today-line')).toHaveLength(0);
  });

  it('applies explicit color + width props to both line SVG elements', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [],
        rows,
        axisInput,
        todayLine: { color: '#3b82f6', width: 4 },
      },
    });
    const lines = wrapper.findAll('line.cx-gantt-today-line');
    expect(lines).toHaveLength(2);
    for (const line of lines) {
      expect(line.attributes('stroke')).toBe('#3b82f6');
      expect(line.attributes('stroke-width')).toBe('4');
    }
  });

  it('maps style: solid → no stroke-dasharray; dashed → "6 4"; dotted → "2 3"', () => {
    const cases: { style: 'solid' | 'dashed' | 'dotted'; expected: string | undefined }[] = [
      { style: 'solid', expected: undefined },
      { style: 'dashed', expected: '6 4' },
      { style: 'dotted', expected: '2 3' },
    ];
    for (const c of cases) {
      const wrapper = mount(ChronixGantt, {
        props: { bars: [], rows, axisInput, todayLine: { style: c.style } },
      });
      const line = wrapper.find('line.cx-gantt-today-line');
      expect(line.attributes('stroke-dasharray')).toBe(c.expected);
    }
  });

  it('renders the header tooltip group with default "今日" label; omits it when tooltip="" ', () => {
    const withTooltip = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput, todayLine: true },
    });
    const tooltip = withTooltip.find('g.cx-gantt-today-line-tooltip');
    expect(tooltip.exists()).toBe(true);
    expect(tooltip.find('text').text()).toBe('今日');

    const noTooltip = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput, todayLine: { tooltip: '' } },
    });
    expect(noTooltip.find('g.cx-gantt-today-line-tooltip').exists()).toBe(false);
    // The line itself still renders.
    expect(noTooltip.findAll('line.cx-gantt-today-line')).toHaveLength(2);
  });

  it("tooltip's rect fill follows the line color override (one knob drives both, matching original spec)", () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput, todayLine: { color: '#10b981' } },
    });
    const tooltipRect = wrapper.find('g.cx-gantt-today-line-tooltip rect');
    expect(tooltipRect.attributes('fill')).toBe('#10b981');
  });

  it('falls back to theme.todayLineColor / theme.todayLineTooltipBg when color is unset', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [],
        rows,
        axisInput,
        todayLine: {},
        theme: {
          todayLineColor: '#aa00bb',
          todayLineTooltipBg: '#cc11dd',
        },
      },
    });
    const line = wrapper.find('line.cx-gantt-today-line');
    expect(line.attributes('stroke')).toBe('#aa00bb');
    const tooltipRect = wrapper.find('g.cx-gantt-today-line-tooltip rect');
    expect(tooltipRect.attributes('fill')).toBe('#cc11dd');
  });
});

describe('Phase 22.2 todayCellBg', () => {
  it('renders no today-cell rect when prop is false (default)', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput },
    });
    expect(wrapper.find('rect.cx-gantt-today-cell').exists()).toBe(false);
  });

  it('renders today-cell rects in BOTH body + header SVG when todayCellBg is true', () => {
    const todayAxisInput: AxisRangePlanInput = {
      ...axisInput,
      anchorDate: new Date(),
    };
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput: todayAxisInput, todayCellBg: true },
    });
    const bodyCell = wrapper.find('rect.cx-gantt-today-cell[data-today-cell-side="body"]');
    const headerCell = wrapper.find('rect.cx-gantt-today-cell[data-today-cell-side="header"]');
    expect(bodyCell.exists()).toBe(true);
    expect(headerCell.exists()).toBe(true);
  });

  it('honors TodayCellBgOption.color prop override (overrides theme default)', () => {
    const todayAxisInput: AxisRangePlanInput = { ...axisInput, anchorDate: new Date() };
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [],
        rows,
        axisInput: todayAxisInput,
        todayCellBg: { color: 'rgba(100, 200, 50, 0.4)' },
      },
    });
    const bodyCell = wrapper.find('rect.cx-gantt-today-cell[data-today-cell-side="body"]');
    expect(bodyCell.attributes('fill')).toBe('rgba(100, 200, 50, 0.4)');
  });

  it('falls back to theme.todayCellBgColor when color is unset', () => {
    const todayAxisInput: AxisRangePlanInput = { ...axisInput, anchorDate: new Date() };
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [],
        rows,
        axisInput: todayAxisInput,
        todayCellBg: {},
        theme: { todayCellBgColor: 'rgba(50, 100, 200, 0.25)' },
      },
    });
    const bodyCell = wrapper.find('rect.cx-gantt-today-cell[data-today-cell-side="body"]');
    expect(bodyCell.attributes('fill')).toBe('rgba(50, 100, 200, 0.25)');
  });

  it('uses default theme color rgba(255, 220, 40, .15) when no overrides set', () => {
    const todayAxisInput: AxisRangePlanInput = { ...axisInput, anchorDate: new Date() };
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput: todayAxisInput, todayCellBg: true },
    });
    const bodyCell = wrapper.find('rect.cx-gantt-today-cell[data-today-cell-side="body"]');
    expect(bodyCell.attributes('fill')).toBe('rgba(255, 220, 40, .15)');
  });

  it('renders no rect when today is outside the axis range (far-past anchor)', () => {
    const farPastAxisInput: AxisRangePlanInput = {
      ...axisInput,
      anchorDate: new Date(2020, 0, 1),
    };
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput: farPastAxisInput, todayCellBg: true },
    });
    expect(wrapper.find('rect.cx-gantt-today-cell').exists()).toBe(false);
  });
});

describe('Phase 22 toolbar', () => {
  const DEMO_TOOLBAR = {
    left: 'prev,next today',
    center: 'title',
    right: 'day,week,month,season,halfYear,year',
  } as const;

  it('renders no toolbar root and no parent wrapper when headerToolbar is false (default)', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput },
    });
    expect(wrapper.find('div.cx-gantt-toolbar').exists()).toBe(false);
    expect(wrapper.find('div.cx-gantt-root').exists()).toBe(false);
    // chart wrapper is still the immediate render root
    expect(wrapper.find('div.cx-gantt-wrapper').exists()).toBe(true);
  });

  it('wraps the chart in cx-gantt-root and prepends cx-gantt-toolbar when headerToolbar is configured', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput, headerToolbar: DEMO_TOOLBAR },
    });
    const root = wrapper.find('div.cx-gantt-root');
    expect(root.exists()).toBe(true);
    expect(root.find('div.cx-gantt-toolbar').exists()).toBe(true);
    expect(root.find('div.cx-gantt-wrapper').exists()).toBe(true);
  });

  it('renders all 9 demo buttons (3 nav + 6 view) plus the title widget with chronix cx-* class names', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput, headerToolbar: DEMO_TOOLBAR },
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
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput, headerToolbar: DEMO_TOOLBAR }, // axisInput.viewId = 'day'
    });
    expect(wrapper.find('button.cx-gantt-day-button').attributes('aria-pressed')).toBe('true');
    expect(wrapper.find('button.cx-gantt-week-button').attributes('aria-pressed')).toBe('false');
    expect(wrapper.find('button.cx-gantt-month-button').attributes('aria-pressed')).toBe('false');
  });

  it('emits update:axisInput with a new viewId when a view button is clicked', async () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput, headerToolbar: DEMO_TOOLBAR },
    });
    await wrapper.find('button.cx-gantt-week-button').trigger('click');
    const emitted = wrapper.emitted('update:axisInput');
    expect(emitted).toBeTruthy();
    expect(emitted![0]![0]).toMatchObject({ viewId: 'week' });
    // anchorDate is preserved
    expect((emitted![0]![0] as AxisRangePlanInput).anchorDate.getTime()).toBe(
      axisInput.anchorDate.getTime(),
    );
  });

  it('emits update:axisInput with the next anchorDate when next is clicked', async () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput, headerToolbar: DEMO_TOOLBAR }, // day view → ±1 day
    });
    await wrapper.find('button.cx-gantt-next-button').trigger('click');
    const emitted = wrapper.emitted('update:axisInput')!;
    expect((emitted[0]![0] as AxisRangePlanInput).viewId).toBe('day');
    expect((emitted[0]![0] as AxisRangePlanInput).anchorDate.getDate()).toBe(
      axisInput.anchorDate.getDate() + 1,
    );
  });

  it('emits update:axisInput with the previous anchorDate when prev is clicked', async () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput, headerToolbar: DEMO_TOOLBAR },
    });
    await wrapper.find('button.cx-gantt-prev-button').trigger('click');
    const emitted = wrapper.emitted('update:axisInput')!;
    expect((emitted[0]![0] as AxisRangePlanInput).anchorDate.getDate()).toBe(
      axisInput.anchorDate.getDate() - 1,
    );
  });

  it('emits update:axisInput with a local-midnight Date when today is clicked', async () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput, headerToolbar: DEMO_TOOLBAR },
    });
    await wrapper.find('button.cx-gantt-today-button').trigger('click');
    const emitted = wrapper.emitted('update:axisInput')!;
    const next = (emitted[0]![0] as AxisRangePlanInput).anchorDate;
    expect(next.getHours()).toBe(0);
    expect(next.getMinutes()).toBe(0);
    expect(next.getSeconds()).toBe(0);
  });

  it('does not emit when the title widget is clicked (non-interactive)', async () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput, headerToolbar: DEMO_TOOLBAR },
    });
    await wrapper.find('h2.cx-gantt-toolbar-title').trigger('click');
    expect(wrapper.emitted('update:axisInput')).toBeUndefined();
  });

  it('updates the pressed button when axisInput.viewId changes (reactive controlled-prop)', async () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput, headerToolbar: DEMO_TOOLBAR },
    });
    expect(wrapper.find('button.cx-gantt-day-button').attributes('aria-pressed')).toBe('true');
    await wrapper.setProps({
      axisInput: { ...axisInput, viewId: 'month' },
    });
    expect(wrapper.find('button.cx-gantt-day-button').attributes('aria-pressed')).toBe('false');
    expect(wrapper.find('button.cx-gantt-month-button').attributes('aria-pressed')).toBe('true');
  });

  it('renders the title formatted per the current viewId (day → YYYY-MM-DD)', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput, headerToolbar: DEMO_TOOLBAR },
    });
    expect(wrapper.find('h2.cx-gantt-toolbar-title').text()).toBe('2026-05-13');
  });
});

describe('<ChronixGantt> — reference interaction parity (Phase 54)', () => {
  it('eventStartEditable={false} removes cx-gantt-bar--draggable but keeps cx-gantt-bar--resizable', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 1, 5)],
        rows,
        axisInput,
        editable: true,
        eventStartEditable: false,
      },
    });
    const rect = wrapper.find('rect[data-bar-id="b1"]');
    expect(rect.classes()).not.toContain('cx-gantt-bar--draggable');
    expect(rect.classes()).toContain('cx-gantt-bar--resizable');
  });

  it('eventDurationEditable={false} removes cx-gantt-bar--resizable + suppresses resizer rects', () => {
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('b1', 'r1', 1, 5)],
        rows,
        axisInput,
        editable: true,
        eventDurationEditable: false,
      },
    });
    const rect = wrapper.find('rect[data-bar-id="b1"]');
    expect(rect.classes()).toContain('cx-gantt-bar--draggable');
    expect(rect.classes()).not.toContain('cx-gantt-bar--resizable');
    // Resizer-zone rects suppressed when eventDurationEditable=false.
    expect(wrapper.findAll('rect.cx-gantt-bar-resizer-start').length).toBe(0);
    expect(wrapper.findAll('rect.cx-gantt-bar-resizer-end').length).toBe(0);
  });
});

describe('<ChronixGantt> hitTestFromClient (Phase 56)', () => {
  it('handle.hitTestFromClient maps client coords to {time, rowId} via body rect + axis + strips', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput },
    });
    const svg = wrapper.find('svg.cx-gantt-body').element as SVGSVGElement;
    // jsdom returns 0-rect by default. Override so the helper sees a
    // concrete origin — same idiom as the Phase 52 / 54 SFC tests for
    // pointer-coord math.
    svg.getBoundingClientRect = () =>
      ({ left: 100, top: 50, right: 1540, bottom: 530, width: 1440, height: 480 }) as DOMRect;
    const handle = wrapper.vm.$.exposed as { hitTestFromClient: (x: number, y: number) => unknown };
    // clientX 220 → contentX 120 → 2h after midnight. clientY 60 →
    // contentY 10 → first strip r1.
    const result = handle.hitTestFromClient(220, 60) as {
      time: Date;
      rowId: string;
    } | null;
    expect(result).not.toBeNull();
    expect(result!.rowId).toBe('r1');
    expect(result!.time.getTime()).toBe(todayMs + 2 * MS_PER_HOUR);
  });

  it('handle.hitTestFromClient returns null when clientX is left of body rect', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput },
    });
    const svg = wrapper.find('svg.cx-gantt-body').element as SVGSVGElement;
    svg.getBoundingClientRect = () =>
      ({ left: 100, top: 50, right: 1540, bottom: 530, width: 1440, height: 480 }) as DOMRect;
    const handle = wrapper.vm.$.exposed as { hitTestFromClient: (x: number, y: number) => unknown };
    const result = handle.hitTestFromClient(50, 60);
    expect(result).toBeNull();
  });
});
