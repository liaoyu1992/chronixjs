import { type AxisRangePlanInput, type BarSpec, type RowSpec } from '@chronixjs/gantt';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixGantt, type ColumnSpec } from './index.js';

import type Vue from 'vue';

const baseAxisInput = (): AxisRangePlanInput => ({
  viewId: 'week',
  anchorDate: new Date('2026-05-18T00:00:00'),
  viewportWidth: 1440,
  locale: 'zh-CN',
  weekendsVisible: true,
});

const rows: readonly RowSpec[] = [
  { id: 'r1', columns: { region: '海口', base: '海口基地', name: '车间 A' } },
  { id: 'r2', columns: { region: '海口', base: '海口基地', name: '车间 B' } },
];

const columns: readonly ColumnSpec[] = [
  { key: 'region', label: '地区', width: 60, group: true },
  { key: 'base', label: '基地', width: 100, group: true },
  { key: 'name', label: '车间', width: 80 },
];

// Synthetic pointer event factory (jsdom doesn't ship PointerEvent in
// every Node version). We dispatch a CustomEvent shape with the keys
// our handler reads (`button`, `clientX`, `pointerId`,
// `preventDefault`). Sufficient for vitest + happy-dom.
function pointerEvent(
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel',
  opts: { clientX: number; button?: number; pointerId?: number },
): Event {
  const e = new Event(type, { bubbles: true, cancelable: true }) as Event & {
    clientX: number;
    button: number;
    pointerId: number;
  };
  e.clientX = opts.clientX;
  e.button = opts.button ?? 0;
  e.pointerId = opts.pointerId ?? 1;
  return e;
}

const GanttForTest = ChronixGantt as unknown as typeof Vue;

describe('<ChronixGantt> sidebar-divider drag (Phase 50)', () => {
  it('renders cx-gantt-sidebar-divider when sidebar is enabled', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [] as readonly BarSpec[], rows, axisInput: baseAxisInput(), columns },
    });
    expect(wrapper.find('div.cx-gantt-sidebar-divider').exists()).toBe(true);
  });

  it('divider sits at gridColumn 2 spanning grid rows 1-3 with col-resize cursor', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [] as readonly BarSpec[], rows, axisInput: baseAxisInput(), columns },
    });
    const divider = wrapper.find('div.cx-gantt-sidebar-divider').element as HTMLElement;
    expect(divider.style.gridColumn).toBe('2');
    expect(divider.style.gridRow).toBe('1 / 3');
    expect(divider.style.cursor).toBe('col-resize');
    expect(divider.style.touchAction).toBe('none');
  });

  it('divider has data-cx-divider="sidebar" attribute', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [] as readonly BarSpec[], rows, axisInput: baseAxisInput(), columns },
    });
    const divider = wrapper.find('div.cx-gantt-sidebar-divider').element as HTMLElement;
    expect(divider.getAttribute('data-cx-divider')).toBe('sidebar');
  });

  it('no-sidebar mode renders no divider', () => {
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: [] as readonly BarSpec[],
        rows: [{ id: 'r1', columns: { name: 'r1' } }],
        axisInput: baseAxisInput(),
      },
    });
    expect(wrapper.find('div.cx-gantt-sidebar-divider').exists()).toBe(false);
  });

  it('pointerdown + pointermove drags the sidebar wider — wrapper grid-template-columns updates', async () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [] as readonly BarSpec[], rows, axisInput: baseAxisInput(), columns },
      attachTo: document.body,
    });
    const wrapperEl = wrapper.find('div.cx-gantt-wrapper').element as HTMLElement;
    // jsdom wrapper has no real layout; stub getBoundingClientRect to a
    // realistic viewport so the clamp can grow proposed widths.
    Object.defineProperty(wrapperEl, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ width: 800, height: 400, top: 0, left: 0, right: 800, bottom: 400 }),
    });
    const divider = wrapper.find('div.cx-gantt-sidebar-divider').element as HTMLElement;
    // Base sidebar = 60 + 100 + 80 = 240. Drag from clientX=240 to 320 → +80 → 320.
    divider.dispatchEvent(pointerEvent('pointerdown', { clientX: 240 }));
    divider.dispatchEvent(pointerEvent('pointermove', { clientX: 320 }));
    await wrapper.vm.$nextTick();
    expect(wrapperEl.style.gridTemplateColumns).toBe('320px 4px auto');
    wrapper.destroy();
  });

  it('pointermove clamps to MIN_SIDEBAR_AREA_WIDTH (40) when proposed is below floor', async () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [] as readonly BarSpec[], rows, axisInput: baseAxisInput(), columns },
      attachTo: document.body,
    });
    const wrapperEl = wrapper.find('div.cx-gantt-wrapper').element as HTMLElement;
    Object.defineProperty(wrapperEl, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ width: 800, height: 400, top: 0, left: 0, right: 800, bottom: 400 }),
    });
    const divider = wrapper.find('div.cx-gantt-sidebar-divider').element as HTMLElement;
    // Drag from 240 to 100 → proposed = 240 + (100 - 240) = 100 (valid, no clamp).
    // Then drag to -500 → proposed = 240 + (-500 - 240) = -500 → clamps to 40.
    divider.dispatchEvent(pointerEvent('pointerdown', { clientX: 240 }));
    divider.dispatchEvent(pointerEvent('pointermove', { clientX: -500 }));
    await wrapper.vm.$nextTick();
    expect(wrapperEl.style.gridTemplateColumns).toBe('40px 4px auto');
    wrapper.destroy();
  });

  it('pointermove clamps to (wrapperWidth - MIN) when proposed exceeds ceiling', async () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [] as readonly BarSpec[], rows, axisInput: baseAxisInput(), columns },
      attachTo: document.body,
    });
    const wrapperEl = wrapper.find('div.cx-gantt-wrapper').element as HTMLElement;
    Object.defineProperty(wrapperEl, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ width: 500, height: 400, top: 0, left: 0, right: 500, bottom: 400 }),
    });
    const divider = wrapper.find('div.cx-gantt-sidebar-divider').element as HTMLElement;
    // wrapperWidth=500 → max=460. Drag from 240 to 9999 → proposed = 240 +
    // (9999 - 240) = 9999 → clamps to 460.
    divider.dispatchEvent(pointerEvent('pointerdown', { clientX: 240 }));
    divider.dispatchEvent(pointerEvent('pointermove', { clientX: 9999 }));
    await wrapper.vm.$nextTick();
    expect(wrapperEl.style.gridTemplateColumns).toBe('460px 4px auto');
    wrapper.destroy();
  });

  it('pointermove without prior pointerdown is a no-op', async () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [] as readonly BarSpec[], rows, axisInput: baseAxisInput(), columns },
    });
    const wrapperEl = wrapper.find('div.cx-gantt-wrapper').element as HTMLElement;
    const divider = wrapper.find('div.cx-gantt-sidebar-divider').element as HTMLElement;
    divider.dispatchEvent(pointerEvent('pointermove', { clientX: 600 }));
    await wrapper.vm.$nextTick();
    expect(wrapperEl.style.gridTemplateColumns).toBe('240px 4px auto');
  });

  it('pointerup clears drag-snapshot but preserves override', async () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [] as readonly BarSpec[], rows, axisInput: baseAxisInput(), columns },
      attachTo: document.body,
    });
    const wrapperEl = wrapper.find('div.cx-gantt-wrapper').element as HTMLElement;
    Object.defineProperty(wrapperEl, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ width: 800, height: 400, top: 0, left: 0, right: 800, bottom: 400 }),
    });
    const divider = wrapper.find('div.cx-gantt-sidebar-divider').element as HTMLElement;
    divider.dispatchEvent(pointerEvent('pointerdown', { clientX: 240 }));
    divider.dispatchEvent(pointerEvent('pointermove', { clientX: 320 }));
    divider.dispatchEvent(pointerEvent('pointerup', { clientX: 320 }));
    await wrapper.vm.$nextTick();
    // Width remains at 320 after release.
    expect(wrapperEl.style.gridTemplateColumns).toBe('320px 4px auto');
    // Subsequent pointermove without a new pointerdown is a no-op.
    divider.dispatchEvent(pointerEvent('pointermove', { clientX: 600 }));
    await wrapper.vm.$nextTick();
    expect(wrapperEl.style.gridTemplateColumns).toBe('320px 4px auto');
    wrapper.destroy();
  });

  it('pointercancel preserves the in-flight override + clears drag-snapshot', async () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [] as readonly BarSpec[], rows, axisInput: baseAxisInput(), columns },
      attachTo: document.body,
    });
    const wrapperEl = wrapper.find('div.cx-gantt-wrapper').element as HTMLElement;
    Object.defineProperty(wrapperEl, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ width: 800, height: 400, top: 0, left: 0, right: 800, bottom: 400 }),
    });
    const divider = wrapper.find('div.cx-gantt-sidebar-divider').element as HTMLElement;
    divider.dispatchEvent(pointerEvent('pointerdown', { clientX: 240 }));
    divider.dispatchEvent(pointerEvent('pointermove', { clientX: 300 }));
    divider.dispatchEvent(pointerEvent('pointercancel', { clientX: 300 }));
    await wrapper.vm.$nextTick();
    expect(wrapperEl.style.gridTemplateColumns).toBe('300px 4px auto');
    wrapper.destroy();
  });

  it('non-left mouse button (right click) does NOT initiate drag', async () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [] as readonly BarSpec[], rows, axisInput: baseAxisInput(), columns },
      attachTo: document.body,
    });
    const wrapperEl = wrapper.find('div.cx-gantt-wrapper').element as HTMLElement;
    Object.defineProperty(wrapperEl, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ width: 800, height: 400, top: 0, left: 0, right: 800, bottom: 400 }),
    });
    const divider = wrapper.find('div.cx-gantt-sidebar-divider').element as HTMLElement;
    divider.dispatchEvent(pointerEvent('pointerdown', { clientX: 240, button: 2 }));
    divider.dispatchEvent(pointerEvent('pointermove', { clientX: 320 }));
    await wrapper.vm.$nextTick();
    // Width should NOT have changed because pointerdown was ignored.
    expect(wrapperEl.style.gridTemplateColumns).toBe('240px 4px auto');
    wrapper.destroy();
  });

  it('sidebar <col> widths stay fixed during drag (columns do not scale)', async () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: [] as readonly BarSpec[], rows, axisInput: baseAxisInput(), columns },
      attachTo: document.body,
    });
    const wrapperEl = wrapper.find('div.cx-gantt-wrapper').element as HTMLElement;
    Object.defineProperty(wrapperEl, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ width: 800, height: 400, top: 0, left: 0, right: 800, bottom: 400 }),
    });
    const divider = wrapper.find('div.cx-gantt-sidebar-divider').element as HTMLElement;
    // Drag from base 240 to 480 (wider). Columns keep their declared
    // widths (60/100/80); the table fills the pane (`width: 100%`) so
    // widening leaves no empty sidebar-background gap. With no minWidth,
    // columns compress to fit when the sidebar's vertical scrollbar
    // appears (rather than overflowing + showing a horizontal scrollbar).
    divider.dispatchEvent(pointerEvent('pointerdown', { clientX: 240 }));
    divider.dispatchEvent(pointerEvent('pointermove', { clientX: 480 }));
    await wrapper.vm.$nextTick();
    const cols = wrapper.findAll('div.cx-gantt-sidebar-body col');
    expect((cols.at(0).element as HTMLTableColElement).style.width).toBe('60px');
    expect((cols.at(1).element as HTMLTableColElement).style.width).toBe('100px');
    expect((cols.at(2).element as HTMLTableColElement).style.width).toBe('80px');
    // Table fills the pane (width:100%, no minWidth).
    const bodyTable = wrapper.find('div.cx-gantt-sidebar-body table').element as HTMLElement;
    expect(bodyTable.style.width).toBe('100%');
    expect(bodyTable.style.minWidth).toBe('');
    // The grid track (pane width) does follow the drag → wider pane.
    expect(wrapperEl.style.gridTemplateColumns).toBe('480px 4px auto');
    wrapper.destroy();
  });
});
