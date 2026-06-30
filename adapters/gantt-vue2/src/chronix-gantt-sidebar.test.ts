import { type AxisRangePlanInput, type BarSpec, type RowSpec } from '@chronixjs/gantt';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';

import { ChronixGantt, type ColumnSpec } from './index.js';

import type Vue from 'vue';

afterEach(() => {
  // @vue/test-utils v1 doesn't have a global cleanup hook; each test
  // explicitly destroys its wrapper via wrapper.destroy() if needed.
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

// 5-row grouped dataset shared with the react adapter sidebar tests.
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

const GanttForTest = ChronixGantt as unknown as typeof Vue;

describe('<ChronixGantt> sidebar pane (Phase 49)', () => {
  describe('with `columns` prop (3-pane mode)', () => {
    it('renders cx-gantt-sidebar-pane + cx-gantt-sidebar-header-pane DOM', () => {
      const wrapper = mount(GanttForTest, {
        propsData: {
          bars: [] as readonly BarSpec[],
          rows: groupedRows,
          axisInput: baseAxisInput(),
          columns: groupedColumns,
        },
      });
      expect(wrapper.find('div.cx-gantt-sidebar-pane').exists()).toBe(true);
      expect(wrapper.find('div.cx-gantt-sidebar-header-pane').exists()).toBe(true);
      expect(wrapper.find('div.cx-gantt-chart-pane').exists()).toBe(true);
      expect(wrapper.find('div.cx-gantt-chart-header-pane').exists()).toBe(true);
    });

    it('sidebar-pane has overflow:auto + sidebar-header-pane has overflow:hidden', () => {
      const wrapper = mount(GanttForTest, {
        propsData: {
          bars: [] as readonly BarSpec[],
          rows: groupedRows,
          axisInput: baseAxisInput(),
          columns: groupedColumns,
        },
      });
      const sidebar = wrapper.find('div.cx-gantt-sidebar-pane').element as HTMLElement;
      const sidebarHeader = wrapper.find('div.cx-gantt-sidebar-header-pane').element as HTMLElement;
      expect(sidebar.style.overflowX).toBe('auto');
      expect(sidebar.style.overflowY).toBe('auto');
      expect(sidebarHeader.style.overflow).toBe('hidden');
      expect(sidebarHeader.style.scrollbarGutter).toBe('stable');
    });

    it('wrapper grid-template-columns becomes 2 tracks when sidebar is rendered', () => {
      const wrapper = mount(GanttForTest, {
        propsData: {
          bars: [] as readonly BarSpec[],
          rows: groupedRows,
          axisInput: baseAxisInput(),
          columns: groupedColumns,
        },
      });
      const wrapperEl = wrapper.find('div.cx-gantt-wrapper').element as HTMLElement;
      // 60 + 100 + 80 = 240 px sidebar.
      // Phase 50: sidebar(240) + divider(8) + chart(auto) = 3-column grid.
      expect(wrapperEl.style.gridTemplateColumns).toBe('240px 4px auto');
    });

    it('chart-pane gridColumn = 2 when sidebar is rendered', () => {
      const wrapper = mount(GanttForTest, {
        propsData: {
          bars: [] as readonly BarSpec[],
          rows: groupedRows,
          axisInput: baseAxisInput(),
          columns: groupedColumns,
        },
      });
      const chartPane = wrapper.find('div.cx-gantt-chart-pane').element as HTMLElement;
      // Phase 50: chart-pane shifts to column 3 (sidebar=1, divider=2, chart=3).
      expect(chartPane.style.gridColumn).toBe('3');
    });

    it('sidebar header table includes one <th> per column with the supplied label', () => {
      const wrapper = mount(GanttForTest, {
        propsData: {
          bars: [] as readonly BarSpec[],
          rows: groupedRows,
          axisInput: baseAxisInput(),
          columns: groupedColumns,
        },
      });
      const cells = wrapper.findAll('th.cx-gantt-sidebar-header-cell');
      expect(cells.length).toBe(3);
      expect(cells.at(0).text()).toBe('地区');
      expect(cells.at(1).text()).toBe('基地');
      expect(cells.at(2).text()).toBe('车间');
    });

    it('sidebar body table emits one <tr> per swimlane strip', () => {
      const wrapper = mount(GanttForTest, {
        propsData: {
          bars: [] as readonly BarSpec[],
          rows: groupedRows,
          axisInput: baseAxisInput(),
          columns: groupedColumns,
        },
      });
      const rows = wrapper.findAll('tr.cx-gantt-sidebar-row');
      expect(rows.length).toBe(groupedRows.length);
    });

    it('vGrouping: grouped column emits rowspan=N on the first row of a merged run', () => {
      const wrapper = mount(GanttForTest, {
        propsData: {
          bars: [] as readonly BarSpec[],
          rows: groupedRows,
          axisInput: baseAxisInput(),
          columns: groupedColumns,
        },
      });
      const regionCells = wrapper.findAll('td.cx-gantt-sidebar-cell[data-column-key="region"]');
      // 海口 spans rows 1-3, 三亚 spans row 4, 广州 spans row 5 → 3 DOM cells.
      expect(regionCells.length).toBe(3);
      expect((regionCells.at(0).element as HTMLTableCellElement).getAttribute('rowspan')).toBe('3');
      expect(regionCells.at(0).text()).toBe('海口');
      expect(regionCells.at(1).text()).toBe('三亚');
      expect(regionCells.at(2).text()).toBe('广州');
    });

    it('non-grouped column emits one cell per row with no rowspan attribute', () => {
      const wrapper = mount(GanttForTest, {
        propsData: {
          bars: [] as readonly BarSpec[],
          rows: groupedRows,
          axisInput: baseAxisInput(),
          columns: groupedColumns,
        },
      });
      const nameCells = wrapper.findAll('td.cx-gantt-sidebar-cell[data-column-key="name"]');
      expect(nameCells.length).toBe(groupedRows.length);
      for (let i = 0; i < nameCells.length; i += 1) {
        const cell = nameCells.at(i).element as HTMLTableCellElement;
        expect(cell.getAttribute('rowspan')).toBeNull();
      }
    });

    it('colgroup widths match the supplied ColumnSpec widths in pixels', () => {
      const wrapper = mount(GanttForTest, {
        propsData: {
          bars: [] as readonly BarSpec[],
          rows: groupedRows,
          axisInput: baseAxisInput(),
          columns: groupedColumns,
        },
      });
      const cols = wrapper.findAll('div.cx-gantt-sidebar-body col');
      expect(cols.length).toBe(3);
      expect((cols.at(0).element as HTMLTableColElement).style.width).toBe('60px');
      expect((cols.at(1).element as HTMLTableColElement).style.width).toBe('100px');
      expect((cols.at(2).element as HTMLTableColElement).style.width).toBe('80px');
    });

    it('vertical scroll on sidebar-pane translates the chart body SVG (transform sync — chart owns no vertical scrollbar)', () => {
      const wrapper = mount(GanttForTest, {
        propsData: {
          bars: [makeBar('a', 'w1')],
          rows: groupedRows,
          axisInput: baseAxisInput(),
          columns: groupedColumns,
        },
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
      const wrapper = mount(GanttForTest, {
        propsData: {
          bars: [makeBar('a', 'w1')],
          rows: groupedRows,
          axisInput: baseAxisInput(),
          columns: groupedColumns,
        },
      });
      const chartPane = wrapper.find('div.cx-gantt-chart-pane').element as HTMLElement;
      const sidebarPane = wrapper.find('div.cx-gantt-sidebar-pane').element as HTMLElement;
      expect(sidebarPane.scrollTop).toBe(0);
      chartPane.dispatchEvent(new WheelEvent('wheel', { deltaY: 60 }));
      expect(sidebarPane.scrollTop).toBe(60);
    });

    it('sidebar-pane horizontal scroll writes translateX to sidebar-header-inner', () => {
      const wrapper = mount(GanttForTest, {
        propsData: {
          bars: [] as readonly BarSpec[],
          rows: groupedRows,
          axisInput: baseAxisInput(),
          columns: groupedColumns,
        },
      });
      const sidebarPane = wrapper.find('div.cx-gantt-sidebar-pane').element as HTMLElement;
      const sidebarHeaderInner = wrapper.find('div.cx-gantt-sidebar-header-inner')
        .element as HTMLElement;
      sidebarPane.scrollLeft = 30;
      sidebarPane.dispatchEvent(new Event('scroll'));
      expect(sidebarHeaderInner.style.transform).toBe('translateX(-30px)');
    });

    it('maxBodyHeight populates grid-template-rows row 2 when sidebar is rendered', () => {
      const wrapper = mount(GanttForTest, {
        propsData: {
          bars: [] as readonly BarSpec[],
          rows: groupedRows,
          axisInput: baseAxisInput(),
          columns: groupedColumns,
          maxBodyHeight: '400px',
        },
      });
      const wrapperEl = wrapper.find('div.cx-gantt-wrapper').element as HTMLElement;
      expect(wrapperEl.style.gridTemplateRows).toContain('400px');
    });
  });

  describe('without `columns` prop (default 2-pane mode preserved)', () => {
    it('no sidebar-pane or sidebar-header-pane in the DOM', () => {
      const wrapper = mount(GanttForTest, {
        propsData: {
          bars: [] as readonly BarSpec[],
          rows: [{ id: 'r1', columns: { name: 'r1' } }],
          axisInput: baseAxisInput(),
        },
      });
      expect(wrapper.find('div.cx-gantt-sidebar-pane').exists()).toBe(false);
      expect(wrapper.find('div.cx-gantt-sidebar-header-pane').exists()).toBe(false);
    });

    it('empty columns array also takes the no-sidebar branch', () => {
      const wrapper = mount(GanttForTest, {
        propsData: {
          bars: [] as readonly BarSpec[],
          rows: [{ id: 'r1', columns: {} }],
          axisInput: baseAxisInput(),
          columns: [] as readonly ColumnSpec[],
        },
      });
      expect(wrapper.find('div.cx-gantt-sidebar-pane').exists()).toBe(false);
    });

    it('wrapper grid-template-columns stays "auto" + chart-pane gridColumn = 1', () => {
      const wrapper = mount(GanttForTest, {
        propsData: {
          bars: [] as readonly BarSpec[],
          rows: [{ id: 'r1', columns: {} }],
          axisInput: baseAxisInput(),
        },
      });
      const wrapperEl = wrapper.find('div.cx-gantt-wrapper').element as HTMLElement;
      const chartPane = wrapper.find('div.cx-gantt-chart-pane').element as HTMLElement;
      expect(wrapperEl.style.gridTemplateColumns).toBe('auto');
      expect(chartPane.style.gridColumn).toBe('1');
    });
  });
});
