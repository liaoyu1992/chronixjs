import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChronixGantt } from './chronix-gantt.js';

import type { AxisRangePlanInput, BarSpec, RowSpec } from '@chronixjs/gantt';
import type Vue from 'vue';

const MS_PER_HOUR = 60 * 60 * 1000;

// Day-view axis on 2026-05-13 (Wed) midnight at viewportWidth=1440
// gives slotWidth=60 (24 hourly slots) so bar geometry is predictable:
// a 4-hour bar at hours 8-12 spans content x=480..720.
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

function barWithProgress(id: string): BarSpec {
  // 50% progress at hour 10 (x=600); progress-handle rect centered there.
  return {
    id,
    rowId: 'r1',
    range: {
      start: new Date(anchor.getTime() + 8 * MS_PER_HOUR),
      end: new Date(anchor.getTime() + 12 * MS_PER_HOUR),
    },
    progress: { value: 50 },
    pointerOverlayId: 'progress-overlay',
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

const pointerOpts = (clientX: number, clientY: number, pointerId = 1) => ({
  clientX,
  clientY,
  button: 0,
  pointerId,
});

const GanttForTest = ChronixGantt as unknown as typeof Vue;

describe('<ChronixGantt> drag-distance gate — Phase 25 (vue2 SFC integration)', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
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

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('sub-threshold pointer-wiggle (3 px) on bar body fires `bar-click` not `bar-drop`', async () => {
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: [bar('b1', 8, 12)],
        rows,
        axisInput,
        editable: true,
        // default pointerMinDistance = 5
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    // Press at (600, 20), wiggle to (603, 20) = Pythagorean 3 < 5, release.
    // Should NOT emit bar-drop; SHOULD emit bar-click.
    await svg.trigger('pointerdown', pointerOpts(600, 20));
    await svg.trigger('pointermove', pointerOpts(603, 20));
    await svg.trigger('pointerup', pointerOpts(603, 20));
    expect(wrapper.emitted('bar-drop')).toBeFalsy();
    const clicks = wrapper.emitted('bar-click');
    expect(clicks).toBeTruthy();
    expect(clicks!).toHaveLength(1);
  });

  it('above-threshold pointer-wiggle (10 px) on bar body fires `bar-drop` not `bar-click`', async () => {
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: [bar('b1', 8, 12)],
        rows,
        axisInput,
        editable: true,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    // 10-px advance — surpasses 5-px threshold.
    await svg.trigger('pointerdown', pointerOpts(600, 20));
    await svg.trigger('pointermove', pointerOpts(610, 20));
    await svg.trigger('pointerup', pointerOpts(610, 20));
    const drops = wrapper.emitted('bar-drop');
    expect(drops).toBeTruthy();
    expect(drops!).toHaveLength(1);
    expect(wrapper.emitted('bar-click')).toBeFalsy();
  });

  it('pointerMinDistance=0 restores pre-Phase-25 behavior — any non-zero delta commits a drag', async () => {
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: [bar('b1', 8, 12)],
        rows,
        axisInput,
        editable: true,
        pointerMinDistance: 0,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    // 1-px advance — pre-Phase-25 chronix would commit. With
    // pointerMinDistance=0, the gate is disabled and the commit fires.
    await svg.trigger('pointerdown', pointerOpts(600, 20));
    await svg.trigger('pointermove', pointerOpts(601, 20));
    await svg.trigger('pointerup', pointerOpts(601, 20));
    expect(wrapper.emitted('bar-drop')).toBeTruthy();
    expect(wrapper.emitted('bar-click')).toBeFalsy();
  });

  it('sub-threshold resize gesture on bar edge does NOT commit a resize', async () => {
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: [bar('b1', 8, 12)],
        rows,
        axisInput,
        editable: true,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    // Bar end-edge at x=720; the 8-px resize zone starts at 712.
    // Pointerdown at (716, 20) lands on the end-edge; wiggle 2 px < 5-px
    // threshold; release. No bar-resize commit fires (the gate
    // suppresses sub-threshold gestures across all 4 transaction kinds
    // — that's the load-bearing Phase 25 invariant). The adapter's
    // click path only fires bar-click for `bar-body` hits, not
    // bar-edge hits — sub-threshold edge gestures are simply dropped
    // silently (consistent with pre-Phase-25's 0-delta abort path).
    await svg.trigger('pointerdown', pointerOpts(716, 20));
    await svg.trigger('pointermove', pointerOpts(718, 20));
    await svg.trigger('pointerup', pointerOpts(718, 20));
    expect(wrapper.emitted('bar-resize')).toBeFalsy();
  });

  it('sub-threshold range-select gesture on empty row does NOT commit a select', async () => {
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: [bar('b1', 8, 12)],
        rows,
        axisInput,
        selectable: true,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    // Empty row r1's content-y spans the strip; bar is at (480, 8)..(720, 38)
    // so y=2 is empty-row-above-bar. x=200 is empty time.
    await svg.trigger('pointerdown', pointerOpts(200, 2));
    await svg.trigger('pointermove', pointerOpts(203, 2));
    await svg.trigger('pointerup', pointerOpts(203, 2));
    expect(wrapper.emitted('select')).toBeFalsy();
    // Sub-threshold empty-row gesture fires empty-area-click.
    expect(wrapper.emitted('empty-area-click')).toBeTruthy();
  });

  it('progress-handle gesture commits regardless of distance (handle hit = intent, mirrors reference)', async () => {
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: [barWithProgress('b1')],
        rows,
        axisInput,
        editable: true,
        progressHandleSize: 12,
      },
    });
    const svg = wrapper.find('svg.cx-gantt-body');
    // Bar at x=480..720; progress=50% → handle x = 480 + 0.5×240 = 600.
    // Handle rect spans (594, 17)..(606, 29). Pointerdown at (600, 23)
    // hits the handle. Wiggle 1 px and release; bar-progress should
    // still emit (progress-handle is exempted from the threshold gate).
    await svg.trigger('pointerdown', pointerOpts(600, 23));
    await svg.trigger('pointermove', pointerOpts(601, 23));
    await svg.trigger('pointerup', pointerOpts(601, 23));
    expect(wrapper.emitted('bar-progress')).toBeTruthy();
  });
});
