import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChronixGantt } from './chronix-gantt.js';

import type { AxisRangePlanInput, BarSpec, ColumnSpec, RowSpec } from '@chronixjs/gantt';

const anchor = new Date('2026-05-13T00:00:00');
const rows: readonly RowSpec[] = [
  { id: 'r1', columns: { region: '海口' } },
  { id: 'r2', columns: { region: '三亚' } },
];

const axisInput: AxisRangePlanInput = {
  viewId: 'day',
  anchorDate: anchor,
  viewportWidth: 1440,
  locale: 'zh-CN',
  weekendsVisible: true,
};

const sidebarColumns: readonly ColumnSpec[] = [{ key: 'region', label: '地区', width: 80 }];

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

describe('<ChronixGantt> dual-scrollport architecture', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('with sidebar: renders cx-gantt-sidebar-pane + cx-gantt-chart-pane scroll containers', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput, columns: sidebarColumns },
    });
    expect(wrapper.find('div.cx-gantt-sidebar-pane').exists()).toBe(true);
    expect(wrapper.find('div.cx-gantt-chart-pane').exists()).toBe(true);
    expect(wrapper.find('div.cx-gantt-sidebar-header-pane').exists()).toBe(true);
    expect(wrapper.find('div.cx-gantt-chart-header-pane').exists()).toBe(true);
  });

  it('without sidebar (no columns): renders only chart-pane + chart-header-pane (no sidebar panes)', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput },
    });
    expect(wrapper.find('div.cx-gantt-chart-pane').exists()).toBe(true);
    expect(wrapper.find('div.cx-gantt-chart-header-pane').exists()).toBe(true);
    expect(wrapper.find('div.cx-gantt-sidebar-pane').exists()).toBe(false);
    expect(wrapper.find('div.cx-gantt-sidebar-header-pane').exists()).toBe(false);
  });

  it('chart-pane has overflow-x: auto / overflow-y: hidden; chart-header-pane has overflow: hidden', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput, columns: sidebarColumns },
    });
    const chartPane = wrapper.find('div.cx-gantt-chart-pane').element as HTMLElement;
    const chartHeaderPane = wrapper.find('div.cx-gantt-chart-header-pane').element as HTMLElement;
    // overflow-y: hidden — the chart owns no vertical scrollbar (the
    // sidebar does; the body SVG is translated to follow it). overflow-x
    // auto for the wide timeline's horizontal scrollbar.
    expect(chartPane.style.overflowX).toBe('auto');
    expect(chartPane.style.overflowY).toBe('hidden');
    expect(chartHeaderPane.style.overflow).toBe('hidden');
  });

  it('sidebar-pane has overflow-x: auto / overflow-y: auto; sidebar-header-pane has overflow: hidden', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput, columns: sidebarColumns },
    });
    const sidebarPane = wrapper.find('div.cx-gantt-sidebar-pane').element as HTMLElement;
    const sidebarHeaderPane = wrapper.find('div.cx-gantt-sidebar-header-pane')
      .element as HTMLElement;
    // overflow-y: auto — the sidebar owns the vertical scrollbar (it sits
    // on the sidebar/chart boundary — the resource area). overflow-x auto
    // so a narrowed sidebar can still scroll its columns.
    expect(sidebarPane.style.overflowX).toBe('auto');
    expect(sidebarPane.style.overflowY).toBe('auto');
    // overflow: hidden — the header shows no scrollbar of its own;
    // scrollbar-gutter: stable still reserves the body's scrollbar
    // gutter so header columns align with body columns.
    expect(sidebarHeaderPane.style.overflow).toBe('hidden');
    expect(sidebarHeaderPane.style.scrollbarGutter).toBe('stable');
  });

  it('wrapper is a CSS grid; grid-template-rows includes maxBodyHeight when set', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput, columns: sidebarColumns, maxBodyHeight: '70vh' },
    });
    const wrapperEl = wrapper.find('div.cx-gantt-wrapper').element as HTMLElement;
    expect(wrapperEl.style.display).toBe('grid');
    // Header band is 24 (axis tick) + 0 outer rows = 24 px; row 2 is the prop value.
    expect(wrapperEl.style.gridTemplateRows).toContain('70vh');
    // Wrapper itself has no overflow — panes own it.
    expect(wrapperEl.style.overflow).toBe('');
  });

  it('grid-template-rows defaults row 2 to `auto` when maxBodyHeight is omitted', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput, columns: sidebarColumns },
    });
    const wrapperEl = wrapper.find('div.cx-gantt-wrapper').element as HTMLElement;
    expect(wrapperEl.style.gridTemplateRows).toContain('auto');
  });

  it('chart-header-inner wrapper exists with willChange: transform (translateX target)', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput, columns: sidebarColumns },
    });
    const inner = wrapper.find('div.cx-gantt-chart-header-inner').element as HTMLElement;
    expect(inner.style.willChange).toBe('transform');
    // The header SVG sits inside this inner wrapper.
    expect(inner.querySelector('svg.cx-gantt-header')).not.toBeNull();
  });

  it('scrolling the chart-pane writes translateX onto the chart-header-inner', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [bar('a', 'r1')], rows, axisInput, columns: sidebarColumns },
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

  it('scrolling the sidebar-pane writes translateX onto the sidebar-header-inner (independent of chart)', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput, columns: sidebarColumns },
    });
    const sidebarPane = wrapper.find('div.cx-gantt-sidebar-pane').element as HTMLElement;
    const sidebarInner = wrapper.find('div.cx-gantt-sidebar-header-inner').element as HTMLElement;
    sidebarPane.scrollLeft = 30;
    sidebarPane.dispatchEvent(new Event('scroll'));
    expect(sidebarInner.style.transform).toBe('translateX(-30px)');
  });

  it('vertical scroll on sidebar-pane translates the chart body SVG (transform sync — chart owns no vertical scrollbar)', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput, columns: sidebarColumns },
    });
    const sidebarPane = wrapper.find('div.cx-gantt-sidebar-pane').element as HTMLElement;
    const bodySvg = wrapper.find('svg.cx-gantt-body').element as HTMLElement;
    // On mount the sync writes the initial transform (scrollTop = 0).
    expect(bodySvg.style.transform).toBe('translateY(-0px)');
    sidebarPane.scrollTop = 50;
    sidebarPane.dispatchEvent(new Event('scroll'));
    // The body SVG tracks the sidebar's scrollTop via translateY (the
    // chart-pane is overflow-y: hidden so it has no scrollbar).
    expect(bodySvg.style.transform).toBe('translateY(-50px)');
  });

  it('wheel over the chart forwards to the sidebar-pane scrollTop (chart is overflow-y: hidden)', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput, columns: sidebarColumns },
    });
    const chartPane = wrapper.find('div.cx-gantt-chart-pane').element as HTMLElement;
    const sidebarPane = wrapper.find('div.cx-gantt-sidebar-pane').element as HTMLElement;
    expect(sidebarPane.scrollTop).toBe(0);
    chartPane.dispatchEvent(new WheelEvent('wheel', { deltaY: 60 }));
    expect(sidebarPane.scrollTop).toBe(60);
  });
});
