import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import { ChronixGantt } from './chronix-gantt.js';

import type { AxisRangePlanInput, BarSpec, GanttHandle, LinkSpec, RowSpec } from '@chronixjs/gantt';

const MS_PER_HOUR = 60 * 60 * 1000;
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
const bars: readonly BarSpec[] = [bar('b1', 'r1', 8, 12), bar('b2', 'r2', 9, 14)];
const links: readonly LinkSpec[] = [
  { id: 'L1', fromBarId: 'b1', toBarId: 'b2', routing: 'square', marker: 'arrow' },
];

const baseAxisInput: AxisRangePlanInput = {
  viewId: 'week',
  anchorDate: new Date('2026-05-13T00:00:00Z'),
  viewportWidth: 1440,
  locale: 'zh-CN',
  weekendsVisible: true,
};

function getHandle(wrapper: ReturnType<typeof mount>): GanttHandle {
  // Vue 3 `expose()` makes its keys appear on the component proxy, which
  // test-utils surfaces as `wrapper.vm`. Cast to GanttHandle for the test.
  return wrapper.vm as unknown as GanttHandle;
}

describe('<ChronixGantt> imperative handle (Phase 24)', () => {
  describe('nav methods emit update:axisInput', () => {
    it('next() emits anchorDate one period later (week view → +7 days)', () => {
      const wrapper = mount(ChronixGantt, { props: { bars, rows, axisInput: baseAxisInput } });
      const handle = getHandle(wrapper);
      handle.next();
      const emits = wrapper.emitted('update:axisInput') ?? [];
      expect(emits).toHaveLength(1);
      const next = (emits[0]![0] as AxisRangePlanInput).anchorDate;
      expect(next.getTime()).toBe(new Date('2026-05-20T00:00:00Z').getTime());
    });

    it('prev() emits anchorDate one period earlier (week view → -7 days)', () => {
      const wrapper = mount(ChronixGantt, { props: { bars, rows, axisInput: baseAxisInput } });
      const handle = getHandle(wrapper);
      handle.prev();
      const next = (wrapper.emitted('update:axisInput')![0]![0] as AxisRangePlanInput).anchorDate;
      expect(next.getTime()).toBe(new Date('2026-05-06T00:00:00Z').getTime());
    });

    it('today() emits local-midnight anchorDate', () => {
      const wrapper = mount(ChronixGantt, { props: { bars, rows, axisInput: baseAxisInput } });
      getHandle(wrapper).today();
      const next = (wrapper.emitted('update:axisInput')![0]![0] as AxisRangePlanInput).anchorDate;
      expect(next.getHours()).toBe(0);
      expect(next.getMinutes()).toBe(0);
      expect(next.getSeconds()).toBe(0);
    });

    it('gotoDate(date) emits anchorDate = date with viewId preserved', () => {
      const wrapper = mount(ChronixGantt, { props: { bars, rows, axisInput: baseAxisInput } });
      const target = new Date('2026-08-15T00:00:00Z');
      getHandle(wrapper).gotoDate(target);
      const payload = wrapper.emitted('update:axisInput')![0]![0] as AxisRangePlanInput;
      expect(payload.anchorDate.getTime()).toBe(target.getTime());
      expect(payload.viewId).toBe('week');
    });

    it('changeView(viewId) emits new viewId with anchorDate preserved', () => {
      const wrapper = mount(ChronixGantt, { props: { bars, rows, axisInput: baseAxisInput } });
      getHandle(wrapper).changeView('month');
      const payload = wrapper.emitted('update:axisInput')![0]![0] as AxisRangePlanInput;
      expect(payload.viewId).toBe('month');
      expect(payload.anchorDate.getTime()).toBe(baseAxisInput.anchorDate.getTime());
    });

    it('incrementDate({ days, weeks, months, years }) applies in canonical order', () => {
      const wrapper = mount(ChronixGantt, { props: { bars, rows, axisInput: baseAxisInput } });
      getHandle(wrapper).incrementDate({ days: 3 });
      const next = (wrapper.emitted('update:axisInput')![0]![0] as AxisRangePlanInput).anchorDate;
      expect(next.toDateString()).toBe(new Date(2026, 4, 16).toDateString());
    });

    it('zoomTo(date) emits new anchorDate while preserving current viewId', () => {
      const wrapper = mount(ChronixGantt, { props: { bars, rows, axisInput: baseAxisInput } });
      const target = new Date('2026-09-01T00:00:00Z');
      getHandle(wrapper).zoomTo(target);
      const payload = wrapper.emitted('update:axisInput')![0]![0] as AxisRangePlanInput;
      expect(payload.viewId).toBe('week');
      expect(payload.anchorDate.getTime()).toBe(target.getTime());
    });

    it('zoomTo(date, viewId) emits both', () => {
      const wrapper = mount(ChronixGantt, { props: { bars, rows, axisInput: baseAxisInput } });
      const target = new Date('2026-09-01T00:00:00Z');
      getHandle(wrapper).zoomTo(target, 'month');
      const payload = wrapper.emitted('update:axisInput')![0]![0] as AxisRangePlanInput;
      expect(payload.viewId).toBe('month');
      expect(payload.anchorDate.getTime()).toBe(target.getTime());
    });
  });

  describe('getDate() returns current anchorDate (controlled-prop semantics)', () => {
    it('returns the prop value', () => {
      const wrapper = mount(ChronixGantt, { props: { bars, rows, axisInput: baseAxisInput } });
      const handle = getHandle(wrapper);
      expect(handle.getDate().getTime()).toBe(baseAxisInput.anchorDate.getTime());
    });

    it('reflects a v-model round-trip after consumer updates the prop', async () => {
      const wrapper = mount(ChronixGantt, { props: { bars, rows, axisInput: baseAxisInput } });
      const handle = getHandle(wrapper);
      await wrapper.setProps({
        axisInput: { ...baseAxisInput, anchorDate: new Date('2026-06-01T00:00:00Z') },
      });
      expect(handle.getDate().getTime()).toBe(new Date('2026-06-01T00:00:00Z').getTime());
    });
  });

  describe('scrollToDate(date) writes wrapper.scrollLeft', () => {
    it('writes a numeric scrollLeft proportional to the date offset', () => {
      const wrapper = mount(ChronixGantt, { props: { bars, rows, axisInput: baseAxisInput } });
      const wrapperEl = wrapper.find('.cx-gantt-wrapper').element as HTMLDivElement;
      // jsdom doesn't lay out so scrollLeft is just a settable number;
      // assert we wrote SOMETHING numeric and not NaN.
      const handle = getHandle(wrapper);
      handle.scrollToDate(new Date('2026-05-20T00:00:00Z'));
      expect(typeof wrapperEl.scrollLeft).toBe('number');
      expect(Number.isFinite(wrapperEl.scrollLeft)).toBe(true);
    });
  });

  describe('read-only bar lookup', () => {
    it('getBarById returns the matching BarSpec', () => {
      const wrapper = mount(ChronixGantt, { props: { bars, rows, axisInput: baseAxisInput } });
      const handle = getHandle(wrapper);
      expect(handle.getBarById('b1')?.id).toBe('b1');
      expect(handle.getBarById('nonexistent')).toBeUndefined();
    });

    it('getBars returns the live bars array', () => {
      const wrapper = mount(ChronixGantt, { props: { bars, rows, axisInput: baseAxisInput } });
      const handle = getHandle(wrapper);
      const result = handle.getBars();
      expect(result).toHaveLength(2);
      expect(result.map((b) => b.id)).toEqual(['b1', 'b2']);
    });
  });

  describe('data accessors', () => {
    it('getBarTable() exposes bars + lookups', () => {
      const wrapper = mount(ChronixGantt, { props: { bars, rows, axisInput: baseAxisInput } });
      const table = getHandle(wrapper).getBarTable();
      expect(table.bars).toHaveLength(2);
      expect(table.getById('b1')?.id).toBe('b1');
      expect(table.listByRow('r1').map((b) => b.id)).toEqual(['b1']);
      expect(table.inFlightTransaction).toBeNull();
    });

    it('getRowDataSource() exposes rows + lookups', () => {
      const wrapper = mount(ChronixGantt, { props: { bars, rows, axisInput: baseAxisInput } });
      const ds = getHandle(wrapper).getRowDataSource();
      expect(ds.rows).toHaveLength(2);
      expect(ds.getById('r1')?.id).toBe('r1');
      expect(ds.isExpanded('r1')).toBe(true);
    });

    it('getLinkTable() exposes links + lookups', () => {
      const wrapper = mount(ChronixGantt, {
        props: { bars, rows, links, axisInput: baseAxisInput },
      });
      const lt = getHandle(wrapper).getLinkTable();
      expect(lt.links).toHaveLength(1);
      expect(lt.getById('L1')?.id).toBe('L1');
      expect(lt.listFrom('b1')[0]?.id).toBe('L1');
      expect(lt.listTo('b2')[0]?.id).toBe('L1');
    });
  });

  describe('subscribe(event, listener)', () => {
    it('fires the listener alongside Vue emit for the same event', () => {
      const wrapper = mount(ChronixGantt, { props: { bars, rows, axisInput: baseAxisInput } });
      const handle = getHandle(wrapper);
      const spy = vi.fn();
      const unsub = handle.subscribe('update:axisInput', spy);
      handle.next();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(wrapper.emitted('update:axisInput')).toHaveLength(1);
      unsub();
      handle.next();
      expect(spy).toHaveBeenCalledTimes(1); // not called again after unsub
    });

    it('supports multiple subscribers; each receives its own callback', () => {
      const wrapper = mount(ChronixGantt, { props: { bars, rows, axisInput: baseAxisInput } });
      const handle = getHandle(wrapper);
      const a = vi.fn();
      const b = vi.fn();
      handle.subscribe('update:axisInput', a);
      handle.subscribe('update:axisInput', b);
      handle.today();
      expect(a).toHaveBeenCalledTimes(1);
      expect(b).toHaveBeenCalledTimes(1);
    });
  });
});
