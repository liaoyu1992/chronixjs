import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixGantt } from './chronix-gantt.js';

import type { AxisRangePlanInput, BarSpec, RowSpec } from '@chronixjs/gantt';
import type { VueConstructor } from 'vue';

/**
 * Mirrors chronix-vue3:36-158's `describe('<ChronixGantt> dual-scrollport
 * architecture — Phase 23', ...)` block — chart-only subset (sidebar
 * cases #1 / #4 / #10 from vue3 are skipped because chronix-vue2 has
 * no sidebar / columns prop). Plus 1 vue2-specific case asserting the
 * Phase 31.5 → 31.5.2 `scrollToDate` real-impl behavior at the
 * dual-scrollport level.
 */

const GanttForTest = ChronixGantt as unknown as VueConstructor;

const anchor = new Date('2026-05-13T00:00:00');
const rows: readonly RowSpec[] = [
  { id: 'r1', columns: { name: 'r1' } },
  { id: 'r2', columns: { name: 'r2' } },
];

const axisInput: AxisRangePlanInput = {
  viewId: 'day',
  anchorDate: anchor,
  viewportWidth: 1440,
  locale: 'zh-CN',
  weekendsVisible: true,
};

function bar(id: string, rowId: string): BarSpec {
  return {
    id,
    rowId,
    range: {
      start: new Date(anchor.getTime() + 2 * 60 * 60 * 1000),
      end: new Date(anchor.getTime() + 6 * 60 * 60 * 1000),
    },
    dprIntent: 'crisp-pixel',
  };
}

describe('<ChronixGantt> dual-scrollport architecture (Phase 31.5.2)', () => {
  it('renders cx-gantt-chart-pane + cx-gantt-chart-header-pane scroll containers', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [], rows, axisInput },
    });
    expect(wrapper.find('div.cx-gantt-chart-pane').exists()).toBe(true);
    expect(wrapper.find('div.cx-gantt-chart-header-pane').exists()).toBe(true);
    // chronix-vue2 has no sidebar so sidebar-pane / sidebar-header-pane
    // should NOT exist (deferred per Phase 31.5.2 Decision A.1).
    expect(wrapper.find('div.cx-gantt-sidebar-pane').exists()).toBe(false);
    expect(wrapper.find('div.cx-gantt-sidebar-header-pane').exists()).toBe(false);
  });

  it('chart-pane has overflow:auto; chart-header-pane has overflow:hidden', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [], rows, axisInput },
    });
    const chartPane = wrapper.find('div.cx-gantt-chart-pane').element as HTMLElement;
    const chartHeaderPane = wrapper.find('div.cx-gantt-chart-header-pane').element as HTMLElement;
    expect(chartPane.style.overflowX).toBe('auto');
    expect(chartPane.style.overflowY).toBe('hidden');
    expect(chartHeaderPane.style.overflow).toBe('hidden');
  });

  it('wrapper is a CSS grid; grid-template-rows includes maxBodyHeight when set', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [], rows, axisInput, maxBodyHeight: '400px' },
    });
    const wrapperEl = wrapper.find('div.cx-gantt-wrapper').element as HTMLElement;
    expect(wrapperEl.style.display).toBe('grid');
    expect(wrapperEl.style.gridTemplateRows).toContain('400px');
    // Wrapper itself owns no overflow — panes own scroll.
    expect(wrapperEl.style.overflow).toBe('');
  });

  it('grid-template-rows defaults row 2 to `auto` when maxBodyHeight is omitted', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [], rows, axisInput },
    });
    const wrapperEl = wrapper.find('div.cx-gantt-wrapper').element as HTMLElement;
    expect(wrapperEl.style.gridTemplateRows).toContain('auto');
  });

  it('chart-header-inner wrapper exists with willChange:transform (translateX target)', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [], rows, axisInput },
    });
    const inner = wrapper.find('div.cx-gantt-chart-header-inner').element as HTMLElement;
    expect(inner.style.willChange).toBe('transform');
    // The header SVG sits inside this inner wrapper.
    expect(inner.querySelector('svg.cx-gantt-header')).not.toBeNull();
  });

  it('scrolling the chart-pane writes translateX onto the chart-header-inner', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [bar('a', 'r1')], rows, axisInput },
    });
    const chartPane = wrapper.find('div.cx-gantt-chart-pane').element as HTMLElement;
    const inner = wrapper.find('div.cx-gantt-chart-header-inner').element as HTMLElement;
    // Before any scroll, the inner has no transform applied.
    expect(inner.style.transform).toBe('');
    // Drive a horizontal scroll and dispatch the scroll event.
    chartPane.scrollLeft = 200;
    chartPane.dispatchEvent(new Event('scroll'));
    expect(inner.style.transform).toBe('translateX(-200px)');
  });

  it('handle.scrollToDate(date) writes chart-pane.scrollLeft (pxPerMs × (date - axisStart))', () => {
    interface HandleInstance {
      scrollToDate: (date: Date) => void;
    }
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [bar('a', 'r1')], rows, axisInput },
    });
    const chartPane = wrapper.find('div.cx-gantt-chart-pane').element as HTMLElement;
    expect(chartPane.scrollLeft).toBe(0);
    // Day view: anchor is 2026-05-13, so axis starts on / near anchor.
    // Target 1 day past anchor → some positive scrollLeft.
    const target = new Date(anchor.getTime() + 24 * 60 * 60 * 1000);
    const handle = wrapper.vm as unknown as HandleInstance;
    handle.scrollToDate(target);
    expect(chartPane.scrollLeft).toBeGreaterThan(0);
  });
});
