import {
  type AxisRangePlanInput,
  type BarSpec,
  type GanttHandle,
  type LinkSpec,
  type RowSpec,
} from '@chronixjs/gantt';
import { cleanup, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChronixGantt } from './chronix-gantt.js';

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

describe('<ChronixGantt> imperative GanttHandle (Phase 33)', () => {
  afterEach(() => {
    cleanup();
  });

  describe('nav methods fire onAxisInputChange', () => {
    it('next() fires anchorDate one period later (week view → +7 days)', () => {
      const ref = createRef<GanttHandle>();
      const onChange = vi.fn();
      render(
        <ChronixGantt
          ref={ref}
          bars={bars}
          rows={rows}
          axisInput={baseAxisInput}
          onAxisInputChange={onChange}
        />,
      );
      ref.current!.next();
      expect(onChange).toHaveBeenCalledTimes(1);
      const next = (onChange.mock.calls[0]![0] as AxisRangePlanInput).anchorDate;
      expect(next.getTime()).toBe(new Date('2026-05-20T00:00:00Z').getTime());
    });

    it('prev() fires anchorDate one period earlier (week view → -7 days)', () => {
      const ref = createRef<GanttHandle>();
      const onChange = vi.fn();
      render(
        <ChronixGantt
          ref={ref}
          bars={bars}
          rows={rows}
          axisInput={baseAxisInput}
          onAxisInputChange={onChange}
        />,
      );
      ref.current!.prev();
      const next = (onChange.mock.calls[0]![0] as AxisRangePlanInput).anchorDate;
      expect(next.getTime()).toBe(new Date('2026-05-06T00:00:00Z').getTime());
    });

    it('today() fires local-midnight anchorDate', () => {
      const ref = createRef<GanttHandle>();
      const onChange = vi.fn();
      render(
        <ChronixGantt
          ref={ref}
          bars={bars}
          rows={rows}
          axisInput={baseAxisInput}
          onAxisInputChange={onChange}
        />,
      );
      ref.current!.today();
      const next = (onChange.mock.calls[0]![0] as AxisRangePlanInput).anchorDate;
      expect(next.getHours()).toBe(0);
      expect(next.getMinutes()).toBe(0);
      expect(next.getSeconds()).toBe(0);
    });

    it('gotoDate(date) fires anchorDate = date with viewId preserved', () => {
      const ref = createRef<GanttHandle>();
      const onChange = vi.fn();
      render(
        <ChronixGantt
          ref={ref}
          bars={bars}
          rows={rows}
          axisInput={baseAxisInput}
          onAxisInputChange={onChange}
        />,
      );
      const target = new Date('2026-08-15T00:00:00Z');
      ref.current!.gotoDate(target);
      const payload = onChange.mock.calls[0]![0] as AxisRangePlanInput;
      expect(payload.anchorDate.getTime()).toBe(target.getTime());
      expect(payload.viewId).toBe('week');
    });

    it('changeView(viewId) fires new viewId with anchorDate preserved', () => {
      const ref = createRef<GanttHandle>();
      const onChange = vi.fn();
      render(
        <ChronixGantt
          ref={ref}
          bars={bars}
          rows={rows}
          axisInput={baseAxisInput}
          onAxisInputChange={onChange}
        />,
      );
      ref.current!.changeView('month');
      const payload = onChange.mock.calls[0]![0] as AxisRangePlanInput;
      expect(payload.viewId).toBe('month');
      expect(payload.anchorDate.getTime()).toBe(baseAxisInput.anchorDate.getTime());
    });

    it('incrementDate({ days }) applies day-count delta', () => {
      const ref = createRef<GanttHandle>();
      const onChange = vi.fn();
      render(
        <ChronixGantt
          ref={ref}
          bars={bars}
          rows={rows}
          axisInput={baseAxisInput}
          onAxisInputChange={onChange}
        />,
      );
      ref.current!.incrementDate({ days: 3 });
      const next = (onChange.mock.calls[0]![0] as AxisRangePlanInput).anchorDate;
      expect(next.toDateString()).toBe(new Date(2026, 4, 16).toDateString());
    });

    it('zoomTo(date) preserves current viewId', () => {
      const ref = createRef<GanttHandle>();
      const onChange = vi.fn();
      render(
        <ChronixGantt
          ref={ref}
          bars={bars}
          rows={rows}
          axisInput={baseAxisInput}
          onAxisInputChange={onChange}
        />,
      );
      const target = new Date('2026-09-01T00:00:00Z');
      ref.current!.zoomTo(target);
      const payload = onChange.mock.calls[0]![0] as AxisRangePlanInput;
      expect(payload.viewId).toBe('week');
      expect(payload.anchorDate.getTime()).toBe(target.getTime());
    });

    it('zoomTo(date, viewId) fires both', () => {
      const ref = createRef<GanttHandle>();
      const onChange = vi.fn();
      render(
        <ChronixGantt
          ref={ref}
          bars={bars}
          rows={rows}
          axisInput={baseAxisInput}
          onAxisInputChange={onChange}
        />,
      );
      const target = new Date('2026-09-01T00:00:00Z');
      ref.current!.zoomTo(target, 'month');
      const payload = onChange.mock.calls[0]![0] as AxisRangePlanInput;
      expect(payload.viewId).toBe('month');
      expect(payload.anchorDate.getTime()).toBe(target.getTime());
    });
  });

  describe('getDate() returns current anchorDate (controlled-prop semantics)', () => {
    it('returns the prop value', () => {
      const ref = createRef<GanttHandle>();
      render(<ChronixGantt ref={ref} bars={bars} rows={rows} axisInput={baseAxisInput} />);
      expect(ref.current!.getDate().getTime()).toBe(baseAxisInput.anchorDate.getTime());
    });

    it('reflects a controlled-prop round-trip after consumer updates the prop', () => {
      const ref = createRef<GanttHandle>();
      const { rerender } = render(
        <ChronixGantt ref={ref} bars={bars} rows={rows} axisInput={baseAxisInput} />,
      );
      const newAxisInput: AxisRangePlanInput = {
        ...baseAxisInput,
        anchorDate: new Date('2026-06-01T00:00:00Z'),
      };
      rerender(<ChronixGantt ref={ref} bars={bars} rows={rows} axisInput={newAxisInput} />);
      expect(ref.current!.getDate().getTime()).toBe(new Date('2026-06-01T00:00:00Z').getTime());
    });
  });

  describe('scrollToDate(date) writes chart-pane scrollLeft', () => {
    it('writes a finite number to chart-pane scrollLeft', () => {
      const ref = createRef<GanttHandle>();
      const { container } = render(
        <ChronixGantt ref={ref} bars={bars} rows={rows} axisInput={baseAxisInput} />,
      );
      const paneEl = container.querySelector<HTMLDivElement>('div.cx-gantt-chart-pane')!;
      // jsdom doesn't lay out so scrollLeft is just a settable number;
      // assert we wrote SOMETHING numeric and not NaN.
      ref.current!.scrollToDate(new Date('2026-05-20T00:00:00Z'));
      expect(typeof paneEl.scrollLeft).toBe('number');
      expect(Number.isFinite(paneEl.scrollLeft)).toBe(true);
    });
  });

  describe('read-only bar lookup', () => {
    it('getBarById returns the matching BarSpec', () => {
      const ref = createRef<GanttHandle>();
      render(<ChronixGantt ref={ref} bars={bars} rows={rows} axisInput={baseAxisInput} />);
      expect(ref.current!.getBarById('b1')?.id).toBe('b1');
      expect(ref.current!.getBarById('nonexistent')).toBeUndefined();
    });

    it('getBars returns the live bars array', () => {
      const ref = createRef<GanttHandle>();
      render(<ChronixGantt ref={ref} bars={bars} rows={rows} axisInput={baseAxisInput} />);
      const result = ref.current!.getBars();
      expect(result).toHaveLength(2);
      expect(result.map((b) => b.id)).toEqual(['b1', 'b2']);
    });
  });

  describe('data accessors', () => {
    it('getBarTable() exposes bars + lookups', () => {
      const ref = createRef<GanttHandle>();
      render(<ChronixGantt ref={ref} bars={bars} rows={rows} axisInput={baseAxisInput} />);
      const table = ref.current!.getBarTable();
      expect(table.bars).toHaveLength(2);
      expect(table.getById('b1')?.id).toBe('b1');
      expect(table.listByRow('r1').map((b) => b.id)).toEqual(['b1']);
      expect(table.inFlightTransaction).toBeNull();
    });

    it('getRowDataSource() exposes rows + lookups', () => {
      const ref = createRef<GanttHandle>();
      render(<ChronixGantt ref={ref} bars={bars} rows={rows} axisInput={baseAxisInput} />);
      const ds = ref.current!.getRowDataSource();
      expect(ds.rows).toHaveLength(2);
      expect(ds.getById('r1')?.id).toBe('r1');
      expect(ds.isExpanded('r1')).toBe(true);
    });

    it('getLinkTable() exposes links + lookups', () => {
      const ref = createRef<GanttHandle>();
      render(
        <ChronixGantt ref={ref} bars={bars} rows={rows} links={links} axisInput={baseAxisInput} />,
      );
      const lt = ref.current!.getLinkTable();
      expect(lt.links).toHaveLength(1);
      expect(lt.getById('L1')?.id).toBe('L1');
      expect(lt.listFrom('b1')[0]?.id).toBe('L1');
      expect(lt.listTo('b2')[0]?.id).toBe('L1');
    });
  });

  describe('subscribe(event, listener)', () => {
    it('fires the listener alongside onAxisInputChange callback prop', () => {
      const ref = createRef<GanttHandle>();
      const onChange = vi.fn();
      render(
        <ChronixGantt
          ref={ref}
          bars={bars}
          rows={rows}
          axisInput={baseAxisInput}
          onAxisInputChange={onChange}
        />,
      );
      const spy = vi.fn();
      const unsub = ref.current!.subscribe('update:axisInput', spy);
      ref.current!.next();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledTimes(1);
      unsub();
      ref.current!.next();
      expect(spy).toHaveBeenCalledTimes(1); // not called again after unsub
      expect(onChange).toHaveBeenCalledTimes(2); // callback prop still fires
    });

    it('supports multiple subscribers; each receives its own callback', () => {
      const ref = createRef<GanttHandle>();
      render(<ChronixGantt ref={ref} bars={bars} rows={rows} axisInput={baseAxisInput} />);
      const a = vi.fn();
      const b = vi.fn();
      ref.current!.subscribe('update:axisInput', a);
      ref.current!.subscribe('update:axisInput', b);
      ref.current!.today();
      expect(a).toHaveBeenCalledTimes(1);
      expect(b).toHaveBeenCalledTimes(1);
    });
  });
});
