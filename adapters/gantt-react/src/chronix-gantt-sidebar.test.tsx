import {
  type AxisRangePlanInput,
  type BarSpec,
  type ColumnSpec,
  type RowSpec,
} from '@chronixjs/gantt';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ChronixGantt } from './chronix-gantt.js';

afterEach(() => {
  cleanup();
});

const baseAxisInput = (): AxisRangePlanInput => ({
  viewId: 'week',
  anchorDate: new Date('2026-05-18T00:00:00'),
  viewportWidth: 1440,
  locale: 'zh-CN',
  weekendsVisible: true,
});

const makeBar = (id: string, rowId: string): BarSpec => ({
  id,
  rowId,
  range: {
    start: new Date('2026-05-19T02:00:00'),
    end: new Date('2026-05-19T06:00:00'),
  },
  dprIntent: 'crisp-pixel',
});

// Sample rows with region/base/name columns — region is grouped (rowspan
// merges 3 + 1 + 1), base is grouped (rowspan merges 2 + 1 + 1 + 1),
// name is leaf (no grouping).
const groupedRows: readonly RowSpec[] = [
  { id: 'w1', columns: { region: '海口', base: '海口基地', name: '车间 A' } },
  { id: 'w2', columns: { region: '海口', base: '海口基地', name: '车间 B' } },
  { id: 'w3', columns: { region: '海口', base: '空港基地', name: '车间 C' } },
  { id: 'w4', columns: { region: '三亚', base: '三亚基地', name: '车间 D' } },
  { id: 'w5', columns: { region: '广州', base: '广州基地', name: '车间 E' } },
];

const groupedColumns: readonly ColumnSpec[] = [
  { key: 'region', label: '地区', width: 60, group: true },
  { key: 'base', label: '基地', width: 100, group: true },
  { key: 'name', label: '车间', width: 80 },
];

describe('@chronixjs/gantt-react ChronixGantt — sidebar pane (Phase 48)', () => {
  describe('with `columns` prop (3-pane mode)', () => {
    it('renders cx-gantt-sidebar-pane + cx-gantt-sidebar-header-pane DOM', () => {
      const { container } = render(
        <ChronixGantt
          bars={[]}
          rows={groupedRows}
          axisInput={baseAxisInput()}
          columns={groupedColumns}
        />,
      );
      expect(container.querySelector('div.cx-gantt-sidebar-pane')).not.toBeNull();
      expect(container.querySelector('div.cx-gantt-sidebar-header-pane')).not.toBeNull();
      expect(container.querySelector('div.cx-gantt-chart-pane')).not.toBeNull();
      expect(container.querySelector('div.cx-gantt-chart-header-pane')).not.toBeNull();
    });

    it('sidebar-pane has overflow:auto + sidebar-header-pane has overflow:hidden', () => {
      const { container } = render(
        <ChronixGantt
          bars={[]}
          rows={groupedRows}
          axisInput={baseAxisInput()}
          columns={groupedColumns}
        />,
      );
      const sidebar = container.querySelector<HTMLDivElement>('div.cx-gantt-sidebar-pane')!;
      const sidebarHeader = container.querySelector<HTMLDivElement>(
        'div.cx-gantt-sidebar-header-pane',
      )!;
      expect(sidebar.style.overflow).toBe('auto');
      expect(sidebarHeader.style.overflow).toBe('hidden');
    });

    it('wrapper grid-template-columns becomes 2 tracks (sidebarWidth + auto) when sidebar is rendered', () => {
      const { container } = render(
        <ChronixGantt
          bars={[]}
          rows={groupedRows}
          axisInput={baseAxisInput()}
          columns={groupedColumns}
        />,
      );
      const wrapper = container.querySelector<HTMLDivElement>('div.cx-gantt-wrapper')!;
      // 60 + 100 + 80 = 240 px sidebar.
      // Phase 50: sidebar(240) + divider(8) + chart(auto) = 3-column grid.
      expect(wrapper.style.gridTemplateColumns).toBe('240px 8px auto');
    });

    it('chart-pane gridColumn = 2 when sidebar is rendered (default 1 otherwise)', () => {
      const { container } = render(
        <ChronixGantt
          bars={[]}
          rows={groupedRows}
          axisInput={baseAxisInput()}
          columns={groupedColumns}
        />,
      );
      const chartPane = container.querySelector<HTMLDivElement>('div.cx-gantt-chart-pane')!;
      // Phase 50: chart-pane shifts to column 3 (sidebar=1, divider=2, chart=3).
      expect(chartPane.style.gridColumn).toBe('3');
    });

    it('sidebar header table includes one <th> per column with the supplied label', () => {
      const { container } = render(
        <ChronixGantt
          bars={[]}
          rows={groupedRows}
          axisInput={baseAxisInput()}
          columns={groupedColumns}
        />,
      );
      const cells = container.querySelectorAll<HTMLTableCellElement>(
        'th.cx-gantt-sidebar-header-cell',
      );
      expect(cells.length).toBe(3);
      expect(cells[0]!.textContent).toBe('地区');
      expect(cells[1]!.textContent).toBe('基地');
      expect(cells[2]!.textContent).toBe('车间');
    });

    it('sidebar body table emits one <tr> per swimlane strip', () => {
      const { container } = render(
        <ChronixGantt
          bars={[]}
          rows={groupedRows}
          axisInput={baseAxisInput()}
          columns={groupedColumns}
        />,
      );
      const rows = container.querySelectorAll<HTMLTableRowElement>('tr.cx-gantt-sidebar-row');
      expect(rows.length).toBe(groupedRows.length);
    });

    it('vGrouping: grouped column emits rowSpan=N on the first row of a merged run', () => {
      const { container } = render(
        <ChronixGantt
          bars={[]}
          rows={groupedRows}
          axisInput={baseAxisInput()}
          columns={groupedColumns}
        />,
      );
      const regionCells = container.querySelectorAll<HTMLTableCellElement>(
        'td.cx-gantt-sidebar-cell[data-column-key="region"]',
      );
      // 海口 spans rows 1-3 (run of 3), 三亚 spans row 4 (run of 1), 广州 spans row 5 (run of 1)
      // → 3 cells total in DOM (rows 2-3 absorbed).
      expect(regionCells.length).toBe(3);
      expect(regionCells[0]!.getAttribute('rowspan')).toBe('3');
      expect(regionCells[0]!.textContent).toBe('海口');
      expect(regionCells[1]!.textContent).toBe('三亚');
      expect(regionCells[2]!.textContent).toBe('广州');
    });

    it('non-grouped column emits one cell per row with no rowSpan attribute', () => {
      const { container } = render(
        <ChronixGantt
          bars={[]}
          rows={groupedRows}
          axisInput={baseAxisInput()}
          columns={groupedColumns}
        />,
      );
      const nameCells = container.querySelectorAll<HTMLTableCellElement>(
        'td.cx-gantt-sidebar-cell[data-column-key="name"]',
      );
      expect(nameCells.length).toBe(groupedRows.length);
      for (const cell of nameCells) {
        expect(cell.getAttribute('rowspan')).toBeNull();
      }
    });

    it('colgroup widths match the supplied ColumnSpec widths in pixels', () => {
      const { container } = render(
        <ChronixGantt
          bars={[]}
          rows={groupedRows}
          axisInput={baseAxisInput()}
          columns={groupedColumns}
        />,
      );
      // The body table has the same colgroup as the header table.
      const cols = container.querySelectorAll<HTMLTableColElement>('div.cx-gantt-sidebar-body col');
      expect(cols.length).toBe(3);
      expect(cols[0]!.style.width).toBe('60px');
      expect(cols[1]!.style.width).toBe('100px');
      expect(cols[2]!.style.width).toBe('80px');
    });

    it('vertical scroll on chart-pane mirrors to sidebar-pane (lockstep via useScrollSync)', () => {
      const { container } = render(
        <ChronixGantt
          bars={[makeBar('a', 'w1')]}
          rows={groupedRows}
          axisInput={baseAxisInput()}
          columns={groupedColumns}
        />,
      );
      const chartPane = container.querySelector<HTMLDivElement>('div.cx-gantt-chart-pane')!;
      const sidebarPane = container.querySelector<HTMLDivElement>('div.cx-gantt-sidebar-pane')!;
      act(() => {
        chartPane.scrollTop = 50;
        fireEvent.scroll(chartPane);
      });
      expect(sidebarPane.scrollTop).toBe(50);
    });

    it('vertical scroll on sidebar-pane mirrors to chart-pane (reverse lockstep)', async () => {
      const { container } = render(
        <ChronixGantt
          bars={[makeBar('a', 'w1')]}
          rows={groupedRows}
          axisInput={baseAxisInput()}
          columns={groupedColumns}
        />,
      );
      const chartPane = container.querySelector<HTMLDivElement>('div.cx-gantt-chart-pane')!;
      const sidebarPane = container.querySelector<HTMLDivElement>('div.cx-gantt-sidebar-pane')!;
      // Wait a rAF tick to clear any source flag from any prior interaction.
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      act(() => {
        sidebarPane.scrollTop = 25;
        fireEvent.scroll(sidebarPane);
      });
      expect(chartPane.scrollTop).toBe(25);
    });

    it('sidebar-pane horizontal scroll writes translateX to sidebar-header-inner', () => {
      const { container } = render(
        <ChronixGantt
          bars={[]}
          rows={groupedRows}
          axisInput={baseAxisInput()}
          columns={groupedColumns}
        />,
      );
      const sidebarPane = container.querySelector<HTMLDivElement>('div.cx-gantt-sidebar-pane')!;
      const sidebarHeaderInner = container.querySelector<HTMLDivElement>(
        'div.cx-gantt-sidebar-header-inner',
      )!;
      Object.defineProperty(sidebarPane, 'scrollLeft', { value: 30, configurable: true });
      act(() => {
        fireEvent.scroll(sidebarPane);
      });
      expect(sidebarHeaderInner.style.transform).toBe('translateX(-30px)');
    });

    it('maxBodyHeight caps both panes consistently when sidebar is rendered', () => {
      const { container } = render(
        <ChronixGantt
          bars={[]}
          rows={groupedRows}
          axisInput={baseAxisInput()}
          columns={groupedColumns}
          maxBodyHeight="400px"
        />,
      );
      const chartPane = container.querySelector<HTMLDivElement>('div.cx-gantt-chart-pane')!;
      const sidebarPane = container.querySelector<HTMLDivElement>('div.cx-gantt-sidebar-pane')!;
      expect(chartPane.style.maxHeight).toBe('400px');
      expect(sidebarPane.style.maxHeight).toBe('400px');
    });
  });

  describe('without `columns` prop (default 2-pane mode preserved)', () => {
    it('no sidebar-pane or sidebar-header-pane in the DOM', () => {
      const { container } = render(
        <ChronixGantt
          bars={[]}
          rows={[{ id: 'r1', columns: { name: 'r1' } }]}
          axisInput={baseAxisInput()}
        />,
      );
      expect(container.querySelector('div.cx-gantt-sidebar-pane')).toBeNull();
      expect(container.querySelector('div.cx-gantt-sidebar-header-pane')).toBeNull();
    });

    it('empty columns array also takes the no-sidebar branch', () => {
      const { container } = render(
        <ChronixGantt
          bars={[]}
          rows={[{ id: 'r1', columns: {} }]}
          axisInput={baseAxisInput()}
          columns={[]}
        />,
      );
      expect(container.querySelector('div.cx-gantt-sidebar-pane')).toBeNull();
    });

    it('wrapper grid-template-columns stays "1fr" + chart-pane gridColumn = 1', () => {
      const { container } = render(
        <ChronixGantt bars={[]} rows={[{ id: 'r1', columns: {} }]} axisInput={baseAxisInput()} />,
      );
      const wrapper = container.querySelector<HTMLDivElement>('div.cx-gantt-wrapper')!;
      const chartPane = container.querySelector<HTMLDivElement>('div.cx-gantt-chart-pane')!;
      expect(wrapper.style.gridTemplateColumns).toBe('1fr');
      expect(chartPane.style.gridColumn).toBe('1');
    });
  });

  // Phase 49: the `computeRowSpans` pure-function tests previously
  // lived here have been migrated to `packages/gantt/src/api/
  // column-spec.test.ts` alongside the helper itself (Decision B.2).
  // Adapter-level sidebar tests above exercise the helper through the
  // render path; the dedicated core tests cover the pure-function
  // surface independently.
});
