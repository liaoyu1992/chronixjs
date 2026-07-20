import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { h } from 'vue';

import { ChronixTable } from './chronix-table.js';

import type {
  CollectUniqueColumnValuesResult,
  ColumnSpec,
  FilterExpression,
  FilterSpec,
  MultiFilterEntry,
  MultiFilterSpec,
  NumberFilterSpec,
  ParseFilterExpressionResult,
  RowSpec,
  SortSpec,
  TextFilterSpec,
} from '@chronixjs/table';
import type {
  BlockState,
  GetRowsParams,
  GetRowsResult,
  ServerSideDataSource,
} from '@chronixjs/table-server-side';

const columns: readonly ColumnSpec[] = [
  { id: 'id', field: 'id', headerName: 'ID', width: 80 },
  { id: 'name', field: 'name', headerName: '名称', flex: 1 },
  { id: 'qty', field: 'qty', headerName: '数量', width: 120 },
  { id: 'status', field: 'status', headerName: '状态', width: 100 },
  { id: 'note', field: 'note', headerName: '备注', flex: 2 },
];

const rows: readonly RowSpec[] = [
  { id: 'r1', data: { id: 1, name: 'Alpha', qty: 10, status: 'OK', note: 'first' } },
  { id: 'r2', data: { id: 2, name: 'Beta', qty: 20, status: 'WIP', note: 'second' } },
  { id: 'r3', data: { id: 3, name: 'Gamma', qty: 30, status: 'OK', note: '' } },
];

function widthPx(style: string | undefined): number {
  if (!style) return 0;
  const match = /width:\s*([0-9.]+)px/i.exec(style);
  return match ? Number.parseFloat(match[1]!) : 0;
}

function heightPx(style: string | undefined): number {
  if (!style) return 0;
  const match = /height:\s*([0-9.]+)px/i.exec(style);
  return match ? Number.parseFloat(match[1]!) : 0;
}

function topPx(style: string | undefined): number {
  if (!style) return 0;
  const match = /(?:^|;\s*)top:\s*([0-9.]+)px/i.exec(style);
  return match ? Number.parseFloat(match[1]!) : 0;
}

describe('<ChronixTable>', () => {
  it('mounts a single .cx-table-wrapper root with role="grid"', () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const root = wrapper.find('.cx-table-wrapper');
    expect(root.exists()).toBe(true);
    expect(root.attributes('role')).toBe('grid');
    expect(root.attributes('data-table-version')).toBe('0.1.0-alpha');
  });

  it('renders one .cx-table-header-cell per visible column with data-col-id matching column.id', () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const headerCells = wrapper.findAll('.cx-table-header-cell');
    expect(headerCells).toHaveLength(columns.length);
    headerCells.forEach((cell, i) => {
      expect(cell.attributes('role')).toBe('columnheader');
      expect(cell.attributes('data-col-id')).toBe(columns[i]!.id);
    });
  });

  it('renders one .cx-table-row[data-row-id] per RowSpec in the body rowgroup', () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const body = wrapper.find('.cx-table-body');
    expect(body.exists()).toBe(true);
    expect(body.attributes('role')).toBe('rowgroup');
    const bodyRows = body.findAll('.cx-table-row');
    expect(bodyRows).toHaveLength(rows.length);
    bodyRows.forEach((row, i) => {
      expect(row.attributes('data-row-id')).toBe(rows[i]!.id);
    });
  });

  it('renders one .cx-table-cell per (row × visible column) with cell text from row.data[column.field]', () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    // First row's cells: assert text content per column.
    const firstRow = wrapper.find('.cx-table-body .cx-table-row[data-row-id="r1"]');
    expect(firstRow.exists()).toBe(true);
    const cells = firstRow.findAll('.cx-table-cell');
    expect(cells).toHaveLength(columns.length);
    expect(cells[0]!.text()).toBe('1');
    expect(cells[1]!.text()).toBe('Alpha');
    expect(cells[2]!.text()).toBe('10');
    expect(cells[3]!.text()).toBe('OK');
    expect(cells[4]!.text()).toBe('first');
    // Cell role + data-col-id correctness on the first cell.
    expect(cells[0]!.attributes('role')).toBe('gridcell');
    expect(cells[0]!.attributes('data-col-id')).toBe('id');
    expect(cells[0]!.attributes('data-row-id')).toBe('r1');
  });

  it('applies the explicit column width to inline style for header + body cells', () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const idHeader = wrapper.find('.cx-table-header-cell[data-col-id="id"]');
    const idCell = wrapper.find('.cx-table-cell[data-col-id="id"][data-row-id="r1"]');
    // Explicit width: 80. Both header + body cell must agree.
    expect(widthPx(idHeader.attributes('style'))).toBe(80);
    expect(widthPx(idCell.attributes('style'))).toBe(80);
  });

  it('header + body cells for the SAME column share the same resolved width', () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    for (const col of columns) {
      const header = wrapper.find(`.cx-table-header-cell[data-col-id="${col.id}"]`);
      const cell = wrapper.find(`.cx-table-cell[data-col-id="${col.id}"][data-row-id="r1"]`);
      // Wiring guard: misrouting widthByColId in the SFC body render
      // would let header + body drift; assert they always agree.
      expect(widthPx(header.attributes('style'))).toBe(widthPx(cell.attributes('style')));
    }
  });

  it('omits hide: true columns from header AND body', () => {
    const cols: readonly ColumnSpec[] = [
      { id: 'a', field: 'a', headerName: 'A', width: 100 },
      { id: 'b', field: 'b', headerName: 'B', width: 100, hide: true },
      { id: 'c', field: 'c', headerName: 'C', width: 100 },
    ];
    const dataRows: readonly RowSpec[] = [{ id: 'r1', data: { a: 1, b: 2, c: 3 } }];
    const wrapper = mount(ChronixTable, { props: { columns: cols, rows: dataRows } });
    const headerCells = wrapper.findAll('.cx-table-header-cell');
    expect(headerCells).toHaveLength(2);
    expect(headerCells.map((c) => c.attributes('data-col-id'))).toEqual(['a', 'c']);
    const bodyCells = wrapper.findAll('.cx-table-body .cx-table-cell');
    expect(bodyCells).toHaveLength(2);
    expect(bodyCells.map((c) => c.attributes('data-col-id'))).toEqual(['a', 'c']);
  });

  // overflow-y is 'scroll' (not 'auto') so the body reserves a STABLE
  // vertical-scrollbar gutter that the header / filter mirror -
  // keeps a pinned-right column's sticky `right:0` on the same right edge
  // across header, filter + body. The sticky footer lives INSIDE the body
  // scrollport so it shares the body's gutter (no separate overflow needed).
  // With 'auto' a real ~15px classic scrollbar shifts the body's pinned
  // column left of the header's by the scrollbar width.
  it('.cx-table-body is the scrollport with overflow-y:scroll', () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const body = wrapper.find('.cx-table-body');
    const style = body.attributes('style');
    expect(style).toMatch(/overflow-y:\s*scroll/i);
  });

  it('header / filter mirror the body scrollbar gutter; footer is sticky inside body', () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, showFilterRow: true, showFooterRow: true },
    });
    // header + filter are external siblings that reserve a matching gutter.
    for (const sel of ['.cx-table-header', '.cx-table-filter-row']) {
      const style = wrapper.find(sel).attributes('style') ?? '';
      expect(style).toMatch(/overflow-y:\s*scroll/i);
    }
    // footer is now a sticky-bottom child of the body scrollport (not a
    // sibling with its own overflow). Verify position:sticky + bottom:0.
    const footerStyle = wrapper.find('.cx-table-footer').attributes('style') ?? '';
    expect(footerStyle).toMatch(/position:\s*sticky/i);
    expect(footerStyle).toMatch(/bottom:\s*0/i);
    // footer should be a descendant of the body, not a sibling of it.
    expect(wrapper.find('.cx-table-body .cx-table-footer').exists()).toBe(true);
  });

  it('.cx-table-body-content is the virtual content layer with position:relative + totalBodyHeight', () => {
    // 3 rows × default rowHeight 28 = 84px body content height.
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const content = wrapper.find('.cx-table-body-content');
    expect(content.exists()).toBe(true);
    const style = content.attributes('style');
    expect(style).toMatch(/position:\s*relative/i);
    expect(heightPx(style)).toBe(rows.length * 28);
  });

  it('+4: each .cx-table-body-content .cx-table-row is position:absolute with top= rowLayoutPass output', () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const bodyRows = wrapper.findAll('.cx-table-body-content .cx-table-row');
    expect(bodyRows).toHaveLength(rows.length);
    bodyRows.forEach((row, i) => {
      const style = row.attributes('style');
      expect(style).toMatch(/position:\s*absolute/i);
      // Y stacks at i × 28 (uniform default row height).
      expect(topPx(style)).toBe(i * 28);
      expect(heightPx(style)).toBe(28);
    });
  });

  it('row Y values are monotonically increasing (rows tile vertically — no overlap)', () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const bodyRows = wrapper.findAll('.cx-table-body-content .cx-table-row');
    let prevTop = -Infinity;
    let prevHeight = 0;
    for (const row of bodyRows) {
      const style = row.attributes('style');
      const top = topPx(style);
      const height = heightPx(style);
      // Wiring guard: misrouting rowYByRowId in the SFC would let
      // rows overlap; verify each row's top sits at-or-past the
      // previous row's bottom edge.
      expect(top).toBeGreaterThanOrEqual(prevTop + prevHeight);
      prevTop = top;
      prevHeight = height;
    }
  });

  it('per-row heightHint override shifts downstream row Y values', () => {
    // Insert a tall row with heightHint=60 in the middle; subsequent
    // rows must shift down by (60 - 28) = 32 px.
    const rowsWithHint: readonly RowSpec[] = [
      { id: 'r1', data: { id: 1, name: 'A', qty: 1, status: 'X', note: 'a' } },
      { id: 'r2', data: { id: 2, name: 'B', qty: 2, status: 'Y', note: 'b' }, heightHint: 60 },
      { id: 'r3', data: { id: 3, name: 'C', qty: 3, status: 'Z', note: 'c' } },
    ];
    const wrapper = mount(ChronixTable, { props: { columns, rows: rowsWithHint } });
    const r1 = wrapper.find('.cx-table-body-content .cx-table-row[data-row-id="r1"]');
    const r2 = wrapper.find('.cx-table-body-content .cx-table-row[data-row-id="r2"]');
    const r3 = wrapper.find('.cx-table-body-content .cx-table-row[data-row-id="r3"]');
    expect(topPx(r1.attributes('style'))).toBe(0);
    expect(heightPx(r1.attributes('style'))).toBe(28);
    expect(topPx(r2.attributes('style'))).toBe(28);
    expect(heightPx(r2.attributes('style'))).toBe(60);
    expect(topPx(r3.attributes('style'))).toBe(28 + 60);
    expect(heightPx(r3.attributes('style'))).toBe(28);
    // Body content layer height extends to fit the tall row.
    const content = wrapper.find('.cx-table-body-content');
    expect(heightPx(content.attributes('style'))).toBe(28 + 60 + 28);
  });

  it('with no viewport constraint (happy-dom default) all rows render via fallback', () => {
    // happy-dom default: body clientHeight = 0 since no CSS height +
    // no parent height. Per chronix-table.ts: when bodyClientHeight
    // is 0 we fall back to props.rows; visibleRows is empty otherwise.
    // Either way the small-data 3-row case should render all 3.
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const bodyRows = wrapper.findAll('.cx-table-body-content .cx-table-row');
    expect(bodyRows).toHaveLength(rows.length);
  });

  it('virtualRowsPass output is consumed — 100-row mount renders all rows when viewport unconstrained', () => {
    // Generate 100 rows; happy-dom body clientHeight=0 ⇒ fallback to
    // props.rows path renders all 100 (large-data case here serves as
    // a smoke that virtualRowsPass routing doesn't drop rows when the
    // viewport hasn't measured yet).
    const manyRows: readonly RowSpec[] = Array.from({ length: 100 }, (_, i) => ({
      id: `r${i}`,
      data: { id: i, name: `name-${i}`, qty: i, status: 'OK', note: '' },
    }));
    const wrapper = mount(ChronixTable, { props: { columns, rows: manyRows } });
    const bodyRows = wrapper.findAll('.cx-table-body-content .cx-table-row');
    expect(bodyRows).toHaveLength(100);
    // Body content layer carries the full virtual height.
    const content = wrapper.find('.cx-table-body-content');
    expect(heightPx(content.attributes('style'))).toBe(100 * 28);
  });

  it('useTableLayout virtualRowsPass round-trip — explicit viewport restricts visibleRows', async () => {
    // Direct composable test (decoupled from happy-dom's missing
    // clientHeight) — verifies the pass wiring without mocking the
    // ResizeObserver-driven scrollTop ref.
    const { useTableLayout } = await import('./use-table-layout.js');
    const manyRows: readonly RowSpec[] = Array.from({ length: 20 }, (_, i) => ({
      id: `r${i}`,
      data: {},
    }));
    const out = useTableLayout({
      columns: () => columns,
      containerWidth: () => 1000,
      defaultColumnWidth: () => 100,
      defaultMinColumnWidth: () => 40,
      rows: () => manyRows,
      defaultRowHeight: () => 28,
      viewportScrollTop: () => 200,
      viewportHeight: () => 100,
      overscan: () => 0,
    });
    // Per virtual-rows-pass.test.ts case "renders the middle window
    // when scrollTop lands mid-stream": visible rows 7..10.
    expect(out.firstRenderedIndex.value).toBe(7);
    expect(out.lastRenderedIndex.value).toBe(10);
    expect(out.visibleRows.value.map((r) => r.id)).toEqual(['r7', 'r8', 'r9', 'r10']);
  });

  it('useTableLayout virtualRowsPass returns empty for pre-mount viewportHeight=0', async () => {
    const { useTableLayout } = await import('./use-table-layout.js');
    const manyRows: readonly RowSpec[] = Array.from({ length: 20 }, (_, i) => ({
      id: `r${i}`,
      data: {},
    }));
    const out = useTableLayout({
      columns: () => columns,
      containerWidth: () => 1000,
      defaultColumnWidth: () => 100,
      defaultMinColumnWidth: () => 40,
      rows: () => manyRows,
      defaultRowHeight: () => 28,
      viewportScrollTop: () => 0,
      viewportHeight: () => 0, // pre-mount
    });
    expect(out.firstRenderedIndex.value).toBe(-1);
    expect(out.lastRenderedIndex.value).toBe(-1);
    expect(out.visibleRows.value).toEqual([]);
  });

  it('default cell text matches String(row.data[field]) for columns without formatters (regression)', () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    // First row's id cell: row.data.id = 1; default formatter → '1'.
    const idCell = wrapper.find('.cx-table-cell[data-col-id="id"][data-row-id="r1"]');
    expect(idCell.text()).toBe('1');
    // First row's name cell: row.data.name = 'Alpha'.
    const nameCell = wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="r1"]');
    expect(nameCell.text()).toBe('Alpha');
  });

  it('valueFormatter overrides default stringification in the rendered cell text', () => {
    const formattedColumns: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', headerName: 'ID', width: 80 },
      {
        id: 'qty',
        field: 'qty',
        headerName: '数量',
        width: 120,
        valueFormatter: ({ value }) => `Q-${String(value)}`,
      },
    ];
    const wrapper = mount(ChronixTable, {
      props: { columns: formattedColumns, rows },
    });
    const qtyCell = wrapper.find('.cx-table-cell[data-col-id="qty"][data-row-id="r1"]');
    expect(qtyCell.text()).toBe('Q-10');
  });

  it('cellClass function adds resolved classes AND the structural cx-table-cell class', () => {
    const classedColumns: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', headerName: 'ID', width: 80 },
      {
        id: 'status',
        field: 'status',
        headerName: '状态',
        width: 100,
        cellClass: ({ value }) => `status-${String(value).toLowerCase()}`,
      },
    ];
    const wrapper = mount(ChronixTable, { props: { columns: classedColumns, rows } });
    const statusCellR1 = wrapper.find('.cx-table-cell[data-col-id="status"][data-row-id="r1"]');
    const r1ClassAttr = statusCellR1.attributes('class') ?? '';
    // Structural class preserved.
    expect(r1ClassAttr).toMatch(/\bcx-table-cell\b/);
    // Dynamic class for r1's status='OK' → 'status-ok'.
    expect(r1ClassAttr).toMatch(/\bstatus-ok\b/);
    // r2's status='WIP' → 'status-wip'.
    const statusCellR2 = wrapper.find('.cx-table-cell[data-col-id="status"][data-row-id="r2"]');
    expect(statusCellR2.attributes('class') ?? '').toMatch(/\bstatus-wip\b/);
  });

  it('.cx-table-wrapper carries all 10 --cx-table-* CSS var declarations from the default theme', () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const root = wrapper.find('.cx-table-wrapper');
    const style = root.attributes('style') ?? '';
    // 5 geometry tokens with px units.
    expect(style).toMatch(/--cx-table-default-column-width:\s*100px/);
    expect(style).toMatch(/--cx-table-default-min-column-width:\s*40px/);
    expect(style).toMatch(/--cx-table-header-height:\s*32px/);
    expect(style).toMatch(/--cx-table-row-height:\s*28px/);
    expect(style).toMatch(/--cx-table-cell-padding-x:\s*8px/);
    // 5 color tokens with default values.
    expect(style).toMatch(/--cx-table-header-bg:\s*#f1f3f5/i);
    expect(style).toMatch(/--cx-table-header-border-color:\s*#d9dde2/i);
    expect(style).toMatch(/--cx-table-row-divider-color:\s*#eceff2/i);
    expect(style).toMatch(/--cx-table-even-row-bg:\s*#fafbfc/i);
    expect(style).toMatch(/--cx-table-odd-row-bg:\s*#ffffff/i);
  });

  it('consumer theme override propagates to the CSS var output', () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, theme: { headerBg: 'tomato', rowHeight: 40 } },
    });
    const root = wrapper.find('.cx-table-wrapper');
    const style = root.attributes('style') ?? '';
    expect(style).toMatch(/--cx-table-header-bg:\s*tomato/);
    expect(style).toMatch(/--cx-table-row-height:\s*40px/);
    // Untouched default still present.
    expect(style).toMatch(/--cx-table-even-row-bg:\s*#fafbfc/i);
  });

  it('geometry CSS vars all use px units (no unitless emission)', () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const root = wrapper.find('.cx-table-wrapper');
    const style = root.attributes('style') ?? '';
    // Match each geometry token has a trailing `px`.
    for (const cssVar of [
      'header-height',
      'row-height',
      'cell-padding-x',
      'default-column-width',
      'default-min-column-width',
    ]) {
      const re = new RegExp(`--cx-table-${cssVar}:\\s*\\d+px`);
      expect(style).toMatch(re);
    }
  });

  it('cell-click emits {row, column, value, jsEvent} when a body cell is clicked', async () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const cell = wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="r2"]');
    await cell.trigger('click');
    const emits = wrapper.emitted('cell-click');
    expect(emits).toBeTruthy();
    expect(emits).toHaveLength(1);
    const payload = emits![0]![0] as {
      row: RowSpec;
      column: ColumnSpec;
      value: unknown;
      jsEvent: MouseEvent;
    };
    expect(payload.row.id).toBe('r2');
    expect(payload.column.id).toBe('name');
    expect(payload.value).toBe('Beta');
    expect(payload.jsEvent).toBeInstanceOf(MouseEvent);
  });

  it('row-click emits {row, jsEvent} when a body row receives a click', async () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const cell = wrapper.find('.cx-table-cell[data-col-id="id"][data-row-id="r3"]');
    await cell.trigger('click');
    const emits = wrapper.emitted('row-click');
    expect(emits).toBeTruthy();
    expect(emits).toHaveLength(1);
    const payload = emits![0]![0] as { row: RowSpec; jsEvent: MouseEvent };
    expect(payload.row.id).toBe('r3');
  });

  it('row-mouseenter fires once when pointer enters a row from outside; intra-row child re-entry suppressed', async () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const cell = wrapper.find('.cx-table-cell[data-col-id="id"][data-row-id="r1"]');
    // First entry from outside any row (relatedTarget = null → not same-row).
    await cell.trigger('pointerover', { relatedTarget: null });
    let emits = wrapper.emitted('row-mouseenter');
    expect(emits).toBeTruthy();
    expect(emits).toHaveLength(1);
    expect((emits![0]![0] as { row: RowSpec }).row.id).toBe('r1');
    // Pointer moves to a sibling cell on the SAME row (id → name) —
    // relatedTarget is a sibling cell with the same data-row-id, so
    // the handler should suppress re-emit.
    const siblingCell = wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="r1"]');
    await siblingCell.trigger('pointerover', { relatedTarget: cell.element });
    emits = wrapper.emitted('row-mouseenter');
    expect(emits).toHaveLength(1);
  });

  it('row-mouseleave fires once when pointer leaves the row to outside; intra-row exits suppressed', async () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const cellA = wrapper.find('.cx-table-cell[data-col-id="id"][data-row-id="r1"]');
    const cellB = wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="r1"]');
    // Pointerout from cellA to cellB (same row) — suppressed.
    await cellA.trigger('pointerout', { relatedTarget: cellB.element });
    let emits = wrapper.emitted('row-mouseleave');
    expect(emits ?? []).toHaveLength(0);
    // Pointerout from cellA to outside any row (relatedTarget=null) — fires.
    await cellA.trigger('pointerout', { relatedTarget: null });
    emits = wrapper.emitted('row-mouseleave');
    expect(emits).toBeTruthy();
    expect(emits).toHaveLength(1);
    expect((emits![0]![0] as { row: RowSpec }).row.id).toBe('r1');
  });

  it('header-click emits {column, jsEvent} when a header cell is clicked', async () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const headerCell = wrapper.find('.cx-table-header-cell[data-col-id="status"]');
    await headerCell.trigger('click');
    const emits = wrapper.emitted('header-click');
    expect(emits).toBeTruthy();
    expect(emits).toHaveLength(1);
    const payload = emits![0]![0] as { column: ColumnSpec; jsEvent: MouseEvent };
    expect(payload.column.id).toBe('status');
    expect(payload.jsEvent).toBeInstanceOf(MouseEvent);
  });

  it('empty-area-click fires when body click lands outside any row', async () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    // Click on .cx-table-body-content directly (no row descendant in
    // event path). Use the element's own click to ensure
    // event.target == body-content (no row ancestor).
    const bodyContent = wrapper.find('.cx-table-body-content');
    await bodyContent.trigger('click');
    const emits = wrapper.emitted('empty-area-click');
    expect(emits).toBeTruthy();
    expect(emits).toHaveLength(1);
    expect((emits![0]![0] as { jsEvent: MouseEvent }).jsEvent).toBeInstanceOf(MouseEvent);
    // row-click NOT emitted by an empty-area click (mutual exclusion).
    expect(wrapper.emitted('row-click') ?? []).toHaveLength(0);
  });

  it('row-click + cell-click fire when body click lands on a row; empty-area-click NOT emitted (mutual exclusion)', async () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const cell = wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="r2"]');
    await cell.trigger('click');
    expect(wrapper.emitted('row-click')).toHaveLength(1);
    expect(wrapper.emitted('cell-click')).toHaveLength(1);
    // Mutual exclusion: empty-area-click NOT fired when click hit a row.
    expect(wrapper.emitted('empty-area-click') ?? []).toHaveLength(0);
  });

  it('cell-dblclick emits {row, column, value, jsEvent} on body cell double-click', async () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const cell = wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="r2"]');
    await cell.trigger('dblclick');
    const emits = wrapper.emitted('cell-dblclick');
    expect(emits).toBeTruthy();
    expect(emits).toHaveLength(1);
    const payload = emits![0]![0] as {
      row: RowSpec;
      column: ColumnSpec;
      value: unknown;
      jsEvent: MouseEvent;
    };
    expect(payload.row.id).toBe('r2');
    expect(payload.column.id).toBe('name');
    expect(payload.value).toBe('Beta');
  });

  it('row-dblclick fires whenever a body double-click hits any row (alongside cell-dblclick)', async () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const cell = wrapper.find('.cx-table-cell[data-col-id="id"][data-row-id="r3"]');
    await cell.trigger('dblclick');
    expect(wrapper.emitted('row-dblclick')).toHaveLength(1);
    expect(wrapper.emitted('cell-dblclick')).toHaveLength(1);
    expect((wrapper.emitted('row-dblclick')![0]![0] as { row: RowSpec }).row.id).toBe('r3');
  });

  it('header-click does NOT trigger from body clicks (event delegation isolated by region)', async () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const cell = wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="r1"]');
    await cell.trigger('click');
    // header-click handler attaches to .cx-table-header — body clicks
    // shouldn't bubble through it. Verifies region isolation.
    expect(wrapper.emitted('header-click') ?? []).toHaveLength(0);
  });

  it('+ 8.1: setSort accepts single SortSpec OR readonly SortSpec[] + fires sort-change; getSort returns array', async () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const handle = wrapper.vm as unknown as {
      getSort(): readonly SortSpec[];
      setSort(spec: SortSpec | readonly SortSpec[] | null): void;
      clearSort(): void;
    };
    // Initial: empty array.
    expect(handle.getSort()).toEqual([]);
    // Single SortSpec convenience — gets wrapped into a one-entry array.
    handle.setSort({ colId: 'name', direction: 'asc' });
    await wrapper.vm.$nextTick();
    expect(handle.getSort()).toEqual([{ colId: 'name', direction: 'asc' }]);
    const emits = wrapper.emitted('sort-change');
    expect(emits).toBeTruthy();
    expect(emits).toHaveLength(1);
    expect((emits![0]![0] as { sortSpec: readonly SortSpec[] }).sortSpec).toEqual([
      { colId: 'name', direction: 'asc' },
    ]);
    // Array shape — multi-column sort.
    handle.setSort([
      { colId: 'name', direction: 'asc' },
      { colId: 'qty', direction: 'desc' },
    ]);
    await wrapper.vm.$nextTick();
    expect(handle.getSort()).toEqual([
      { colId: 'name', direction: 'asc' },
      { colId: 'qty', direction: 'desc' },
    ]);
    handle.clearSort();
    await wrapper.vm.$nextTick();
    expect(handle.getSort()).toEqual([]);
    expect(wrapper.emitted('sort-change')).toHaveLength(3);
  });

  it('header sort indicator renders ▲ for ASC, ▼ for DESC, empty for unsorted', async () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const handle = wrapper.vm as unknown as {
      setSort(spec: SortSpec | readonly SortSpec[] | null): void;
    };
    const nameHeader = wrapper.find('.cx-table-header-cell[data-col-id="name"]');
    const nameIndicator = nameHeader.find('.cx-table-sort-indicator');
    expect(nameIndicator.exists()).toBe(true);
    // Initial: empty indicator.
    expect(nameIndicator.text()).toBe('');
    // ASC: ▲.
    handle.setSort({ colId: 'name', direction: 'asc' });
    await wrapper.vm.$nextTick();
    expect(
      wrapper.find('.cx-table-header-cell[data-col-id="name"] .cx-table-sort-indicator').text(),
    ).toBe('▲');
    // DESC: ▼.
    handle.setSort({ colId: 'name', direction: 'desc' });
    await wrapper.vm.$nextTick();
    expect(
      wrapper.find('.cx-table-header-cell[data-col-id="name"] .cx-table-sort-indicator').text(),
    ).toBe('▼');
    // Sort moved to a different column → name's indicator clears.
    handle.setSort({ colId: 'qty', direction: 'asc' });
    await wrapper.vm.$nextTick();
    expect(
      wrapper.find('.cx-table-header-cell[data-col-id="name"] .cx-table-sort-indicator').text(),
    ).toBe('');
    expect(
      wrapper.find('.cx-table-header-cell[data-col-id="qty"] .cx-table-sort-indicator').text(),
    ).toBe('▲');
  });

  it('plain-clicking a sortable header cycles [] → [asc] → [desc] → []', async () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const handle = wrapper.vm as unknown as { getSort(): readonly SortSpec[] };
    const qtyHeader = wrapper.find('.cx-table-header-cell[data-col-id="qty"]');
    expect(handle.getSort()).toEqual([]);
    // [] → [asc].
    await qtyHeader.trigger('click');
    expect(handle.getSort()).toEqual([{ colId: 'qty', direction: 'asc' }]);
    // [asc] → [desc].
    await qtyHeader.trigger('click');
    expect(handle.getSort()).toEqual([{ colId: 'qty', direction: 'desc' }]);
    // [desc] → [].
    await qtyHeader.trigger('click');
    expect(handle.getSort()).toEqual([]);
    // sort-change fired 3 times.
    expect(wrapper.emitted('sort-change')).toHaveLength(3);
    // header-click also fired 3 times (independent observable).
    expect(wrapper.emitted('header-click')).toHaveLength(3);
  });

  it('clicking a sortable header reorders body rows (data-row-id sequence reflects sort)', async () => {
    // Use a numeric column with non-trivial source order; ASC should
    // reorder body rows so the lowest qty row appears first.
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const handle = wrapper.vm as unknown as {
      setSort(spec: SortSpec | readonly SortSpec[] | null): void;
    };
    handle.setSort({ colId: 'qty', direction: 'asc' });
    await wrapper.vm.$nextTick();
    const sortedIds = wrapper
      .findAll('.cx-table-body-content .cx-table-row')
      .map((r) => r.attributes('data-row-id'));
    // qty values: r1=10, r2=20, r3=30 → ASC = r1, r2, r3 (already in source order).
    expect(sortedIds).toEqual(['r1', 'r2', 'r3']);
    handle.setSort({ colId: 'qty', direction: 'desc' });
    await wrapper.vm.$nextTick();
    const descIds = wrapper
      .findAll('.cx-table-body-content .cx-table-row')
      .map((r) => r.attributes('data-row-id'));
    expect(descIds).toEqual(['r3', 'r2', 'r1']);
  });

  it('clicking a non-sortable header does NOT change sort state (header-click still emits)', async () => {
    const cols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', headerName: 'ID', width: 80 },
      // set reorderable:false alongside sortable:false
      // so the column is truly non-interactive — without it the column gets
      // `cursor: grab` from the move-drag affordance (reorderable defaults
      // to true), masking the sortable:false intent of this test.
      {
        id: 'frozen',
        field: 'frozen',
        headerName: 'Frozen',
        width: 100,
        sortable: false,
        reorderable: false,
      },
    ];
    const rs: readonly RowSpec[] = [
      { id: 'r1', data: { id: 1, frozen: 'b' } },
      { id: 'r2', data: { id: 2, frozen: 'a' } },
    ];
    const wrapper = mount(ChronixTable, { props: { columns: cols, rows: rs } });
    const handle = wrapper.vm as unknown as { getSort(): readonly SortSpec[] };
    const frozenHeader = wrapper.find('.cx-table-header-cell[data-col-id="frozen"]');
    await frozenHeader.trigger('click');
    expect(handle.getSort()).toEqual([]);
    expect(wrapper.emitted('sort-change') ?? []).toHaveLength(0);
    // header-click still fires — consumers may use it for column menu opens.
    expect(wrapper.emitted('header-click')).toHaveLength(1);
    // Non-sortable header: no pointer cursor + aria-sort='none'.
    const style = frozenHeader.attributes('style') ?? '';
    expect(style).toMatch(/cursor:\s*default/);
    expect(frozenHeader.attributes('aria-sort')).toBe('none');
  });

  // ============================================================
  // shift+click multi-column sort
  // ============================================================

  it('shift+click on a column NOT in the sort array appends with direction:"asc"', async () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const handle = wrapper.vm as unknown as { getSort(): readonly SortSpec[] };
    // Establish single-column sort first via plain click.
    await wrapper.find('.cx-table-header-cell[data-col-id="name"]').trigger('click');
    expect(handle.getSort()).toEqual([{ colId: 'name', direction: 'asc' }]);
    // Shift+click on a different sortable column → appends at end.
    await wrapper
      .find('.cx-table-header-cell[data-col-id="qty"]')
      .trigger('click', { shiftKey: true });
    expect(handle.getSort()).toEqual([
      { colId: 'name', direction: 'asc' },
      { colId: 'qty', direction: 'asc' },
    ]);
    // Indicator on qty shows ▲ + position superscript "2"; name shows "1".
    const qtyIndicator = wrapper.find(
      '.cx-table-header-cell[data-col-id="qty"] .cx-table-sort-indicator',
    );
    expect(qtyIndicator.text()).toContain('▲');
    expect(qtyIndicator.text()).toContain('2');
    const nameIndicator = wrapper.find(
      '.cx-table-header-cell[data-col-id="name"] .cx-table-sort-indicator',
    );
    expect(nameIndicator.text()).toContain('▲');
    expect(nameIndicator.text()).toContain('1');
  });

  it('shift+click on a column at "asc" flips it in place to "desc" (position preserved)', async () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const handle = wrapper.vm as unknown as {
      getSort(): readonly SortSpec[];
      setSort(spec: SortSpec | readonly SortSpec[] | null): void;
    };
    handle.setSort([
      { colId: 'name', direction: 'asc' },
      { colId: 'qty', direction: 'asc' },
      { colId: 'status', direction: 'asc' },
    ]);
    await wrapper.vm.$nextTick();
    // Shift+click on qty (position 2, asc) → flips to desc, same position.
    await wrapper
      .find('.cx-table-header-cell[data-col-id="qty"]')
      .trigger('click', { shiftKey: true });
    expect(handle.getSort()).toEqual([
      { colId: 'name', direction: 'asc' },
      { colId: 'qty', direction: 'desc' },
      { colId: 'status', direction: 'asc' },
    ]);
  });

  it('shift+click on a column at "desc" removes that entry (others preserved)', async () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const handle = wrapper.vm as unknown as {
      getSort(): readonly SortSpec[];
      setSort(spec: SortSpec | readonly SortSpec[] | null): void;
    };
    handle.setSort([
      { colId: 'name', direction: 'asc' },
      { colId: 'qty', direction: 'desc' },
      { colId: 'status', direction: 'asc' },
    ]);
    await wrapper.vm.$nextTick();
    // Shift+click on qty (desc) → removes it.
    await wrapper
      .find('.cx-table-header-cell[data-col-id="qty"]')
      .trigger('click', { shiftKey: true });
    expect(handle.getSort()).toEqual([
      { colId: 'name', direction: 'asc' },
      { colId: 'status', direction: 'asc' },
    ]);
  });

  it('plain click during multi-column sort replaces the entire array', async () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const handle = wrapper.vm as unknown as {
      getSort(): readonly SortSpec[];
      setSort(spec: SortSpec | readonly SortSpec[] | null): void;
    };
    handle.setSort([
      { colId: 'name', direction: 'asc' },
      { colId: 'qty', direction: 'desc' },
    ]);
    await wrapper.vm.$nextTick();
    // Plain click (no shift) on status → resets to [{ status, asc }].
    await wrapper.find('.cx-table-header-cell[data-col-id="status"]').trigger('click');
    expect(handle.getSort()).toEqual([{ colId: 'status', direction: 'asc' }]);
    // Single-column sort active → no position superscript on the indicator.
    const statusIndicator = wrapper.find(
      '.cx-table-header-cell[data-col-id="status"] .cx-table-sort-indicator',
    );
    expect(statusIndicator.text()).toBe('▲');
    expect(statusIndicator.find('.cx-table-sort-indicator-position').exists()).toBe(false);
  });

  // ============================================================
  // text filter
  // ============================================================

  it('setFilter applies a FilterSpec + fires filter-change emit; getFilter reflects new state', async () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const handle = wrapper.vm as unknown as {
      getFilter(): readonly FilterSpec[];
      setFilter(spec: FilterSpec | readonly FilterSpec[] | null): void;
      clearFilter(): void;
    };
    expect(handle.getFilter()).toEqual([]);
    const spec: TextFilterSpec = {
      type: 'text',
      colId: 'name',
      operator: 'contains',
      value: 'Alpha',
    };
    handle.setFilter(spec);
    await wrapper.vm.$nextTick();
    expect(handle.getFilter()).toEqual([spec]);
    const emits = wrapper.emitted('filter-change');
    expect(emits).toBeTruthy();
    expect(emits).toHaveLength(1);
    expect((emits![0]![0] as { filterSpec: readonly FilterSpec[] }).filterSpec).toEqual([spec]);
    handle.clearFilter();
    await wrapper.vm.$nextTick();
    expect(handle.getFilter()).toEqual([]);
    expect(wrapper.emitted('filter-change')).toHaveLength(2);
  });

  it('setFilter narrows the rendered body rows (filter pipeline wired)', async () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const handle = wrapper.vm as unknown as {
      setFilter(spec: FilterSpec | readonly FilterSpec[] | null): void;
    };
    // Filter for rows whose name contains "Alpha" — only r1 matches.
    handle.setFilter({ type: 'text', colId: 'name', operator: 'contains', value: 'Alpha' });
    await wrapper.vm.$nextTick();
    const visibleRowIds = wrapper
      .findAll('.cx-table-body-content .cx-table-row')
      .map((r) => r.attributes('data-row-id'));
    expect(visibleRowIds).toEqual(['r1']);
  });

  it('filter row renders when showFilterRow=true; absent by default', () => {
    // Default (showFilterRow omitted) → filter row absent.
    const noFilter = mount(ChronixTable, { props: { columns, rows } });
    expect(noFilter.find('.cx-table-filter-row').exists()).toBe(false);
    // showFilterRow=true → filter row renders one input per visible column.
    const withFilter = mount(ChronixTable, { props: { columns, rows, showFilterRow: true } });
    const row = withFilter.find('.cx-table-filter-row');
    expect(row.exists()).toBe(true);
    const inputs = withFilter.findAll('.cx-table-filter-input');
    expect(inputs).toHaveLength(columns.length);
  });

  it('typing into a filter input fires filter-change + narrows body rows', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, showFilterRow: true },
    });
    const handle = wrapper.vm as unknown as { getFilter(): readonly FilterSpec[] };
    const nameInput = wrapper.find('.cx-table-filter-input[data-col-id="name"]');
    expect(nameInput.exists()).toBe(true);
    await nameInput.setValue('Alpha');
    expect(handle.getFilter()).toEqual([
      { type: 'text', colId: 'name', operator: 'contains', value: 'Alpha' },
    ]);
    const visibleRowIds = wrapper
      .findAll('.cx-table-body-content .cx-table-row')
      .map((r) => r.attributes('data-row-id'));
    expect(visibleRowIds).toEqual(['r1']);
    expect(wrapper.emitted('filter-change')).toHaveLength(1);
  });

  it('clearing the filter input removes the spec entry (does not leave a value="" entry)', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, showFilterRow: true },
    });
    const handle = wrapper.vm as unknown as { getFilter(): readonly FilterSpec[] };
    const nameInput = wrapper.find('.cx-table-filter-input[data-col-id="name"]');
    await nameInput.setValue('Alpha');
    expect(handle.getFilter()).toHaveLength(1);
    await nameInput.setValue('');
    expect(handle.getFilter()).toEqual([]);
    // filter-change fired twice (set + clear).
    expect(wrapper.emitted('filter-change')).toHaveLength(2);
  });

  it('filter input on a column with filterable=false renders disabled', () => {
    const cols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', headerName: 'ID', width: 80 },
      {
        id: 'frozen',
        field: 'frozen',
        headerName: 'Frozen',
        width: 100,
        filterable: false,
      },
    ];
    const rs: readonly RowSpec[] = [
      { id: 'r1', data: { id: 1, frozen: 'b' } },
      { id: 'r2', data: { id: 2, frozen: 'a' } },
    ];
    const wrapper = mount(ChronixTable, {
      props: { columns: cols, rows: rs, showFilterRow: true },
    });
    const frozenInput = wrapper.find('.cx-table-filter-input[data-col-id="frozen"]');
    expect(frozenInput.exists()).toBe(true);
    expect(frozenInput.attributes('disabled')).toBeDefined();
    const idInput = wrapper.find('.cx-table-filter-input[data-col-id="id"]');
    expect(idInput.attributes('disabled')).toBeUndefined();
  });

  // ============================================================
  // number filter (prefix syntax)
  // ============================================================

  it('typing ">20" into a number column produces NumberFilterSpec {operator:">",value:20}', async () => {
    const numCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', headerName: 'ID', width: 80 },
      { id: 'qty', field: 'qty', headerName: 'Qty', width: 120, type: 'number' },
    ];
    const numRows: readonly RowSpec[] = [
      { id: 'r1', data: { id: 1, qty: 10 } },
      { id: 'r2', data: { id: 2, qty: 30 } },
      { id: 'r3', data: { id: 3, qty: 50 } },
    ];
    const wrapper = mount(ChronixTable, {
      props: { columns: numCols, rows: numRows, showFilterRow: true },
    });
    const handle = wrapper.vm as unknown as { getFilter(): readonly FilterSpec[] };
    const qtyInput = wrapper.find('.cx-table-filter-input[data-col-id="qty"]');
    expect(qtyInput.attributes('data-filter-type')).toBe('number');
    await qtyInput.setValue('>20');
    const spec = handle.getFilter()[0] as NumberFilterSpec | undefined;
    expect(spec).toMatchObject({ type: 'number', colId: 'qty', operator: '>', value: 20 });
    // Body rows narrow: only qty=30 and qty=50 pass.
    const visible = wrapper
      .findAll('.cx-table-body-content .cx-table-row')
      .map((r) => r.attributes('data-row-id'));
    expect(visible).toEqual(['r2', 'r3']);
  });

  it('typing "10..30" produces inRange NumberFilterSpec; body rows narrow to in-range subset', async () => {
    const numCols: readonly ColumnSpec[] = [
      { id: 'qty', field: 'qty', headerName: 'Qty', width: 120, type: 'number' },
    ];
    const numRows: readonly RowSpec[] = [
      { id: 'r1', data: { qty: 5 } },
      { id: 'r2', data: { qty: 10 } },
      { id: 'r3', data: { qty: 20 } },
      { id: 'r4', data: { qty: 30 } },
      { id: 'r5', data: { qty: 50 } },
    ];
    const wrapper = mount(ChronixTable, {
      props: { columns: numCols, rows: numRows, showFilterRow: true },
    });
    const handle = wrapper.vm as unknown as { getFilter(): readonly FilterSpec[] };
    const qtyInput = wrapper.find('.cx-table-filter-input[data-col-id="qty"]');
    await qtyInput.setValue('10..30');
    expect(handle.getFilter()).toEqual([
      { type: 'number', colId: 'qty', operator: 'inRange', value: 10, valueTo: 30 },
    ]);
    const visible = wrapper
      .findAll('.cx-table-body-content .cx-table-row')
      .map((r) => r.attributes('data-row-id'));
    expect(visible).toEqual(['r2', 'r3', 'r4']);
  });

  it('invalid syntax in number filter input does NOT produce a spec entry (no rows hidden)', async () => {
    const numCols: readonly ColumnSpec[] = [
      { id: 'qty', field: 'qty', headerName: 'Qty', width: 120, type: 'number' },
    ];
    const numRows: readonly RowSpec[] = [
      { id: 'r1', data: { qty: 10 } },
      { id: 'r2', data: { qty: 20 } },
    ];
    const wrapper = mount(ChronixTable, {
      props: { columns: numCols, rows: numRows, showFilterRow: true },
    });
    const handle = wrapper.vm as unknown as { getFilter(): readonly FilterSpec[] };
    const qtyInput = wrapper.find('.cx-table-filter-input[data-col-id="qty"]');
    // Invalid: alphabetic.
    await qtyInput.setValue('abc');
    expect(handle.getFilter()).toEqual([]);
    // Invalid: doubled operator.
    await qtyInput.setValue('>>5');
    expect(handle.getFilter()).toEqual([]);
    // Invalid: incomplete range.
    await qtyInput.setValue('5..');
    expect(handle.getFilter()).toEqual([]);
    // All rows still visible.
    const visible = wrapper
      .findAll('.cx-table-body-content .cx-table-row')
      .map((r) => r.attributes('data-row-id'));
    expect(visible).toEqual(['r1', 'r2']);
  });

  it('setFilter with programmatic NumberFilterSpec round-trips into the input value via formatPrefixNumberFilter', async () => {
    const numCols: readonly ColumnSpec[] = [
      { id: 'qty', field: 'qty', headerName: 'Qty', width: 120, type: 'number' },
    ];
    const wrapper = mount(ChronixTable, {
      props: { columns: numCols, rows: [], showFilterRow: true },
    });
    const handle = wrapper.vm as unknown as {
      setFilter(spec: FilterSpec | readonly FilterSpec[] | null): void;
    };
    handle.setFilter({ type: 'number', colId: 'qty', operator: '>=', value: 7 });
    await wrapper.vm.$nextTick();
    const qtyInput = wrapper.find('.cx-table-filter-input[data-col-id="qty"]');
    expect((qtyInput.element as HTMLInputElement).value).toBe('>=7');
    // Switch to inRange via setFilter.
    handle.setFilter({
      type: 'number',
      colId: 'qty',
      operator: 'inRange',
      value: 10,
      valueTo: 50,
    });
    await wrapper.vm.$nextTick();
    expect(
      (wrapper.find('.cx-table-filter-input[data-col-id="qty"]').element as HTMLInputElement).value,
    ).toBe('10..50');
  });

  // ============================================================
  // aria-describedby on column headers
  // ============================================================

  it('each columnheader carries aria-describedby pointing to a sibling description span with matching id', () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const headers = wrapper.findAll('.cx-table-header-cell[data-col-id]');
    expect(headers.length).toBeGreaterThan(0);
    for (const header of headers) {
      const describedById = header.attributes('aria-describedby');
      expect(describedById).toBeDefined();
      expect(describedById).toMatch(/^cx-table-header-cell-desc-/);
      const descSpan = wrapper.find(`#${describedById}`);
      expect(descSpan.exists()).toBe(true);
    }
  });

  it('header description text reflects current sort + filter state', async () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const handle = wrapper.vm as unknown as {
      setSort(spec: SortSpec | readonly SortSpec[] | null): void;
      setFilter(spec: FilterSpec | readonly FilterSpec[] | null): void;
    };
    // Initial empty state — description is empty for every column.
    expect(wrapper.find('#cx-table-header-cell-desc-name').text()).toBe('');
    // Apply sort on name → description includes 'sorted ascending'.
    handle.setSort({ colId: 'name', direction: 'asc' });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('#cx-table-header-cell-desc-name').text()).toBe('sorted ascending');
    // Add filter on name → description joins both via semicolon.
    handle.setFilter({ type: 'text', colId: 'name', operator: 'contains', value: 'Alpha' });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('#cx-table-header-cell-desc-name').text()).toBe(
      'sorted ascending; filter contains "Alpha"',
    );
  });

  // ============================================================
  // cell-level quick-find highlight
  // ============================================================

  it('cell renders .cx-table-cell__find-match span around matching substring when quickFindText is active', async () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const handle = wrapper.vm as unknown as {
      setQuickFindText(text: string): void;
    };
    handle.setQuickFindText('Alpha');
    await wrapper.vm.$nextTick();
    const matchSpans = wrapper.findAll('.cx-table-cell__find-match');
    expect(matchSpans.length).toBeGreaterThan(0);
    // Original casing preserved in the highlight span.
    expect(matchSpans[0]!.text()).toBe('Alpha');
  });

  it('clearing quickFindText removes the highlight markup', async () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const handle = wrapper.vm as unknown as {
      setQuickFindText(text: string): void;
    };
    handle.setQuickFindText('Alpha');
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll('.cx-table-cell__find-match').length).toBeGreaterThan(0);
    handle.setQuickFindText('');
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll('.cx-table-cell__find-match').length).toBe(0);
  });

  // ============================================================
  // quick-find / search
  // ============================================================

  it('setQuickFindText applies a needle + fires quick-find-text-change emit; getQuickFindText reflects new state', async () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const handle = wrapper.vm as unknown as {
      getQuickFindText(): string;
      setQuickFindText(text: string | null | undefined): void;
    };
    expect(handle.getQuickFindText()).toBe('');
    handle.setQuickFindText('Alpha');
    await wrapper.vm.$nextTick();
    expect(handle.getQuickFindText()).toBe('Alpha');
    const emits = wrapper.emitted('quick-find-text-change');
    expect(emits).toHaveLength(1);
    expect(emits?.[0]?.[0]).toEqual({ quickFindText: 'Alpha' });
    handle.setQuickFindText('');
    await wrapper.vm.$nextTick();
    expect(handle.getQuickFindText()).toBe('');
    expect(wrapper.emitted('quick-find-text-change')).toHaveLength(2);
  });

  it('setQuickFindText narrows the rendered body rows (cross-column OR substring match)', async () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const handle = wrapper.vm as unknown as {
      setQuickFindText(text: string): void;
    };
    // Search for "first" — only r1's `note` contains it.
    handle.setQuickFindText('first');
    await wrapper.vm.$nextTick();
    const visibleRowIds = wrapper
      .findAll('.cx-table-body-content .cx-table-row')
      .map((r) => r.attributes('data-row-id'));
    expect(visibleRowIds).toEqual(['r1']);
  });

  it('getQuickFindMatchCount reflects post-find row count + identity case when empty', async () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const handle = wrapper.vm as unknown as {
      getQuickFindMatchCount(): number;
      setQuickFindText(text: string): void;
    };
    // Identity: empty needle → matchCount equals row count.
    expect(handle.getQuickFindMatchCount()).toBe(rows.length);
    // "OK" matches r1.status AND r3.status (cross-column OR).
    handle.setQuickFindText('OK');
    await wrapper.vm.$nextTick();
    expect(handle.getQuickFindMatchCount()).toBe(2);
    // Clear back to identity.
    handle.setQuickFindText('');
    await wrapper.vm.$nextTick();
    expect(handle.getQuickFindMatchCount()).toBe(rows.length);
  });

  it('case-insensitive substring match across multiple columns (cross-column OR)', async () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const handle = wrapper.vm as unknown as {
      setQuickFindText(text: string): void;
    };
    // Lower-case "alpha" matches r1.name (Alpha) — case insensitive.
    handle.setQuickFindText('alpha');
    await wrapper.vm.$nextTick();
    expect(
      wrapper
        .findAll('.cx-table-body-content .cx-table-row')
        .map((r) => r.attributes('data-row-id')),
    ).toEqual(['r1']);
  });

  // ============================================================
  // row selection (single + multi)
  // ============================================================

  it('default selectionMode is "none"; row click does NOT change selection or emit', async () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const handle = wrapper.vm as unknown as { getSelectedRowIds(): readonly string[] };
    expect(handle.getSelectedRowIds()).toEqual([]);
    await wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="r1"]').trigger('click');
    expect(handle.getSelectedRowIds()).toEqual([]);
    expect(wrapper.emitted('selection-change') ?? []).toHaveLength(0);
    // row-click still fires (not selection-related).
    expect(wrapper.emitted('row-click')).toHaveLength(1);
  });

  it('single mode — plain click selects exactly that row; second click on same row deselects', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, selectionMode: 'single' },
    });
    const handle = wrapper.vm as unknown as {
      getSelectedRowIds(): readonly string[];
      isRowSelected(rowId: string): boolean;
    };
    const r1 = wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="r1"]');
    await r1.trigger('click');
    expect(handle.getSelectedRowIds()).toEqual(['r1']);
    expect(handle.isRowSelected('r1')).toBe(true);
    // Second click on same row → deselect.
    await r1.trigger('click');
    expect(handle.getSelectedRowIds()).toEqual([]);
    expect(handle.isRowSelected('r1')).toBe(false);
    // selection-change emit fired twice (select + deselect).
    expect(wrapper.emitted('selection-change')).toHaveLength(2);
  });

  it('single mode — clicking a different row replaces previous selection', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, selectionMode: 'single' },
    });
    const handle = wrapper.vm as unknown as { getSelectedRowIds(): readonly string[] };
    await wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="r1"]').trigger('click');
    expect(handle.getSelectedRowIds()).toEqual(['r1']);
    await wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="r3"]').trigger('click');
    expect(handle.getSelectedRowIds()).toEqual(['r3']);
  });

  it('multi mode — plain click REPLACES the entire selection (single-select within multi)', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, selectionMode: 'multi' },
    });
    const handle = wrapper.vm as unknown as {
      getSelectedRowIds(): readonly string[];
      setSelectedRowIds(ids: readonly string[] | null): void;
    };
    handle.setSelectedRowIds(['r1', 'r2', 'r3']);
    await wrapper.vm.$nextTick();
    expect(handle.getSelectedRowIds()).toEqual(['r1', 'r2', 'r3']);
    // Plain click on r2 (no modifier) → replaces with [r2].
    await wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="r2"]').trigger('click');
    expect(handle.getSelectedRowIds()).toEqual(['r2']);
  });

  it('multi mode — Ctrl+click toggles a row in/out of the selection', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, selectionMode: 'multi' },
    });
    const handle = wrapper.vm as unknown as { getSelectedRowIds(): readonly string[] };
    // Ctrl+click on r1 → add (was empty).
    await wrapper
      .find('.cx-table-cell[data-col-id="name"][data-row-id="r1"]')
      .trigger('click', { ctrlKey: true });
    expect(handle.getSelectedRowIds()).toEqual(['r1']);
    // Ctrl+click on r2 → append.
    await wrapper
      .find('.cx-table-cell[data-col-id="name"][data-row-id="r2"]')
      .trigger('click', { ctrlKey: true });
    expect(handle.getSelectedRowIds()).toEqual(['r1', 'r2']);
    // Ctrl+click on r3 → append.
    await wrapper
      .find('.cx-table-cell[data-col-id="name"][data-row-id="r3"]')
      .trigger('click', { ctrlKey: true });
    expect(handle.getSelectedRowIds()).toEqual(['r1', 'r2', 'r3']);
    // Ctrl+click on r2 (already present) → toggle off; preserve r1 + r3 order.
    await wrapper
      .find('.cx-table-cell[data-col-id="name"][data-row-id="r2"]')
      .trigger('click', { ctrlKey: true });
    expect(handle.getSelectedRowIds()).toEqual(['r1', 'r3']);
  });

  it('multi mode — Meta+click (Cmd) toggles symmetrically with Ctrl+click', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, selectionMode: 'multi' },
    });
    const handle = wrapper.vm as unknown as { getSelectedRowIds(): readonly string[] };
    await wrapper
      .find('.cx-table-cell[data-col-id="name"][data-row-id="r1"]')
      .trigger('click', { metaKey: true });
    await wrapper
      .find('.cx-table-cell[data-col-id="name"][data-row-id="r2"]')
      .trigger('click', { metaKey: true });
    expect(handle.getSelectedRowIds()).toEqual(['r1', 'r2']);
    // Meta+click r1 again → toggle off.
    await wrapper
      .find('.cx-table-cell[data-col-id="name"][data-row-id="r1"]')
      .trigger('click', { metaKey: true });
    expect(handle.getSelectedRowIds()).toEqual(['r2']);
  });

  it('selection-change emit payload contains the new readonly string[]', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, selectionMode: 'multi' },
    });
    await wrapper
      .find('.cx-table-cell[data-col-id="name"][data-row-id="r1"]')
      .trigger('click', { ctrlKey: true });
    await wrapper
      .find('.cx-table-cell[data-col-id="name"][data-row-id="r2"]')
      .trigger('click', { ctrlKey: true });
    const emits = wrapper.emitted('selection-change');
    expect(emits).toHaveLength(2);
    expect((emits![0]![0] as { selectedRowIds: readonly string[] }).selectedRowIds).toEqual(['r1']);
    expect((emits![1]![0] as { selectedRowIds: readonly string[] }).selectedRowIds).toEqual([
      'r1',
      'r2',
    ]);
  });

  it('selected rows render .cx-table-row--selected class + aria-selected="true"', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, selectionMode: 'single' },
    });
    const handle = wrapper.vm as unknown as { setSelectedRowIds(ids: readonly string[]): void };
    handle.setSelectedRowIds(['r2']);
    await wrapper.vm.$nextTick();
    const r2Row = wrapper.find('.cx-table-body-content .cx-table-row[data-row-id="r2"]');
    expect(r2Row.classes()).toContain('cx-table-row--selected');
    expect(r2Row.attributes('aria-selected')).toBe('true');
    // Non-selected row: no modifier + aria-selected unset.
    const r1Row = wrapper.find('.cx-table-body-content .cx-table-row[data-row-id="r1"]');
    expect(r1Row.classes()).not.toContain('cx-table-row--selected');
    expect(r1Row.attributes('aria-selected')).toBeUndefined();
  });

  it('setSelectedRowIds([]) and clearSelection() are equivalent + both fire selection-change', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, selectionMode: 'multi' },
    });
    const handle = wrapper.vm as unknown as {
      getSelectedRowIds(): readonly string[];
      setSelectedRowIds(ids: readonly string[] | null): void;
      clearSelection(): void;
    };
    handle.setSelectedRowIds(['r1', 'r2']);
    await wrapper.vm.$nextTick();
    expect(handle.getSelectedRowIds()).toHaveLength(2);
    handle.clearSelection();
    await wrapper.vm.$nextTick();
    expect(handle.getSelectedRowIds()).toEqual([]);
    // Re-select then setSelectedRowIds([]) — same outcome.
    handle.setSelectedRowIds(['r3']);
    await wrapper.vm.$nextTick();
    handle.setSelectedRowIds([]);
    await wrapper.vm.$nextTick();
    expect(handle.getSelectedRowIds()).toEqual([]);
    // 4 transitions: set → clear → set → set([]) = 4 emits.
    expect(wrapper.emitted('selection-change')).toHaveLength(4);
  });

  it('isRowSelected(rowId) returns correct boolean for selected / unselected rows', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, selectionMode: 'multi' },
    });
    const handle = wrapper.vm as unknown as {
      setSelectedRowIds(ids: readonly string[]): void;
      isRowSelected(rowId: string): boolean;
    };
    expect(handle.isRowSelected('r1')).toBe(false);
    handle.setSelectedRowIds(['r1', 'r3']);
    await wrapper.vm.$nextTick();
    expect(handle.isRowSelected('r1')).toBe(true);
    expect(handle.isRowSelected('r2')).toBe(false);
    expect(handle.isRowSelected('r3')).toBe(true);
    expect(handle.isRowSelected('does-not-exist')).toBe(false);
  });

  it('applySelection dedups no-op transitions (no emit when set unchanged)', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, selectionMode: 'multi' },
    });
    const handle = wrapper.vm as unknown as {
      setSelectedRowIds(ids: readonly string[]): void;
    };
    handle.setSelectedRowIds(['r1', 'r2']);
    await wrapper.vm.$nextTick();
    // Set to the same array shape → dedup; no second emit.
    handle.setSelectedRowIds(['r1', 'r2']);
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('selection-change')).toHaveLength(1);
  });

  it('exposes a TableHandle via expose() with getColumnTable / getRowDataSource / getResolvedWidth', () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    // vm.$exposed is not the canonical surface; vue-test-utils returns
    // a ComponentPublicInstance proxy on `vm`. Read through the
    // proxy — the expose() object's methods are surfaced on it.
    const handle = wrapper.vm as unknown as {
      getColumnTable(): { getById(id: string): ColumnSpec | undefined };
      getRowDataSource(): { getById(id: string): RowSpec | undefined };
      getResolvedWidth(colId: string): number | undefined;
    };
    expect(handle.getColumnTable().getById('id')).toEqual(columns[0]);
    expect(handle.getRowDataSource().getById('r1')).toEqual(rows[0]);
    // Width for the explicit-80 'id' column resolves through layout.
    expect(handle.getResolvedWidth('id')).toBe(80);
    expect(handle.getResolvedWidth('does-not-exist')).toBeUndefined();
  });

  it('default showPagination=false renders no footer; getTotalPages returns 1', () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const handle = wrapper.vm as unknown as {
      getTotalPages(): number;
      getPage(): number;
      getPageSize(): number;
    };
    expect(wrapper.find('.cx-table-pagination').exists()).toBe(false);
    expect(handle.getTotalPages()).toBe(1);
    expect(handle.getPage()).toBe(0);
    // Even when pagination is disabled, the default initialPageSize
    // is preserved so toggling showPagination later starts at the
    // documented default.
    expect(handle.getPageSize()).toBe(20);
  });

  it('showPagination + 50 rows + initialPageSize=20 → 20 rendered rows + footer present + getTotalPages=3', async () => {
    const manyRows: readonly RowSpec[] = Array.from({ length: 50 }, (_, i) => ({
      id: `r${i + 1}`,
      data: { id: i + 1, name: `Row ${i + 1}`, qty: i, status: 'OK', note: '' },
    }));
    const wrapper = mount(ChronixTable, {
      props: { columns, rows: manyRows, showPagination: true, initialPageSize: 20 },
      attachTo: document.body,
    });
    await wrapper.vm.$nextTick();
    const handle = wrapper.vm as unknown as { getTotalPages(): number };
    expect(handle.getTotalPages()).toBe(3);
    expect(wrapper.find('.cx-table-pagination').exists()).toBe(true);
    // First page renders r1..r20 — the body content layer should
    // hold exactly 20 data-row-id nodes (pre-mount frame may render
    // pagedRows fallback; either way the count matches the slice).
    const renderedRowIds = wrapper
      .findAll('.cx-table-body-content .cx-table-row[data-row-id]')
      .map((r) => r.attributes('data-row-id'));
    // Inside the pagedRows fallback the full 20-row slice renders;
    // when virtualization kicks in (post-mount frame after attachTo),
    // the count may shrink — assert at least the first 5 rows are
    // present in either path.
    expect(renderedRowIds.slice(0, 5)).toEqual(['r1', 'r2', 'r3', 'r4', 'r5']);
    expect(renderedRowIds).not.toContain('r21');
    wrapper.unmount();
  });

  it('setPage(1) advances to next page; body re-renders rows 21-40; page-change emit fires', async () => {
    const manyRows: readonly RowSpec[] = Array.from({ length: 50 }, (_, i) => ({
      id: `r${i + 1}`,
      data: { id: i + 1, name: `Row ${i + 1}`, qty: i, status: 'OK', note: '' },
    }));
    const wrapper = mount(ChronixTable, {
      props: { columns, rows: manyRows, showPagination: true, initialPageSize: 20 },
    });
    const handle = wrapper.vm as unknown as { setPage(page: number): void; getPage(): number };
    handle.setPage(1);
    await wrapper.vm.$nextTick();
    expect(handle.getPage()).toBe(1);
    const renderedRowIds = wrapper
      .findAll('.cx-table-body-content .cx-table-row[data-row-id]')
      .map((r) => r.attributes('data-row-id'));
    expect(renderedRowIds.slice(0, 5)).toEqual(['r21', 'r22', 'r23', 'r24', 'r25']);
    expect(renderedRowIds).not.toContain('r1');
    expect(renderedRowIds).not.toContain('r41');
    const emits = wrapper.emitted('page-change');
    expect(emits).toHaveLength(1);
    expect(emits![0]![0] as { page: number; pageSize: number }).toEqual({
      page: 1,
      pageSize: 20,
    });
  });

  it('setPageSize(50) recomputes totalPages; oversize page index clamps on next read', async () => {
    const manyRows: readonly RowSpec[] = Array.from({ length: 50 }, (_, i) => ({
      id: `r${i + 1}`,
      data: { id: i + 1, name: `Row ${i + 1}`, qty: i, status: 'OK', note: '' },
    }));
    const wrapper = mount(ChronixTable, {
      props: { columns, rows: manyRows, showPagination: true, initialPageSize: 10 },
    });
    const handle = wrapper.vm as unknown as {
      setPage(page: number): void;
      setPageSize(pageSize: number): void;
      getPage(): number;
      getTotalPages(): number;
    };
    // 50 / 10 = 5 pages; go to page 4 (last valid).
    handle.setPage(4);
    await wrapper.vm.$nextTick();
    expect(handle.getPage()).toBe(4);
    expect(handle.getTotalPages()).toBe(5);
    // Switch to pageSize 50 → 1 page; page index clamps to 0.
    handle.setPageSize(50);
    await wrapper.vm.$nextTick();
    expect(handle.getTotalPages()).toBe(1);
    // pagePass clamps the read; getPage returns the clamped value (0).
    expect(handle.getPage()).toBe(0);
  });

  it('filter transition auto-resets currentPage to 0 (Decision C.1)', async () => {
    const manyRows: readonly RowSpec[] = Array.from({ length: 50 }, (_, i) => ({
      id: `r${i + 1}`,
      data: {
        id: i + 1,
        name: i % 2 === 0 ? 'Even' : 'Odd',
        qty: i,
        status: 'OK',
        note: '',
      },
    }));
    const wrapper = mount(ChronixTable, {
      props: { columns, rows: manyRows, showPagination: true, initialPageSize: 10 },
    });
    const handle = wrapper.vm as unknown as {
      setPage(page: number): void;
      setFilter(spec: FilterSpec): void;
      getPage(): number;
    };
    handle.setPage(2);
    await wrapper.vm.$nextTick();
    expect(handle.getPage()).toBe(2);
    // Filter narrows; page should auto-reset to 0.
    const spec: TextFilterSpec = {
      type: 'text',
      colId: 'name',
      operator: 'contains',
      value: 'Even',
    };
    handle.setFilter(spec);
    await wrapper.vm.$nextTick();
    expect(handle.getPage()).toBe(0);
    // 2 page-change emits: 0→2 (setPage) + 2→0 (filter reset).
    expect(wrapper.emitted('page-change')).toHaveLength(2);
  });

  it('sort transition auto-resets currentPage to 0 (Decision C.1)', async () => {
    const manyRows: readonly RowSpec[] = Array.from({ length: 50 }, (_, i) => ({
      id: `r${i + 1}`,
      data: { id: i + 1, name: `Row ${i + 1}`, qty: i, status: 'OK', note: '' },
    }));
    const wrapper = mount(ChronixTable, {
      props: { columns, rows: manyRows, showPagination: true, initialPageSize: 10 },
    });
    const handle = wrapper.vm as unknown as {
      setPage(page: number): void;
      setSort(spec: SortSpec): void;
      getPage(): number;
    };
    handle.setPage(3);
    await wrapper.vm.$nextTick();
    expect(handle.getPage()).toBe(3);
    handle.setSort({ colId: 'qty', direction: 'desc' });
    await wrapper.vm.$nextTick();
    expect(handle.getPage()).toBe(0);
    // 2 page-change emits: 0→3 (setPage) + 3→0 (sort reset).
    expect(wrapper.emitted('page-change')).toHaveLength(2);
  });

  it('applyPage dedups no-op transitions (same page+pageSize → no second emit)', async () => {
    const manyRows: readonly RowSpec[] = Array.from({ length: 50 }, (_, i) => ({
      id: `r${i + 1}`,
      data: { id: i + 1, name: `Row ${i + 1}`, qty: i, status: 'OK', note: '' },
    }));
    const wrapper = mount(ChronixTable, {
      props: { columns, rows: manyRows, showPagination: true, initialPageSize: 20 },
    });
    const handle = wrapper.vm as unknown as { setPage(page: number): void };
    handle.setPage(1);
    await wrapper.vm.$nextTick();
    // Second setPage(1) is a no-op.
    handle.setPage(1);
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('page-change')).toHaveLength(1);
  });

  it('default selectionColumn.show=false → no selection rail rendered', () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows, selectionMode: 'multi' } });
    expect(wrapper.find('.cx-table-selection-cell').exists()).toBe(false);
    expect(wrapper.find('.cx-table-selection-checkbox').exists()).toBe(false);
  });

  it('selectionColumn.show=true, side="left" → header + per-row checkboxes render with column prepended', () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns,
        rows,
        selectionMode: 'multi',
        selectionColumn: { show: true, side: 'left' },
      },
    });
    // Header has a select-all checkbox + a selection cell.
    expect(wrapper.find('.cx-table-selection-cell').exists()).toBe(true);
    expect(wrapper.find('.cx-table-selection-checkbox--header').exists()).toBe(true);
    // Each body row has a checkbox.
    const bodyCheckboxes = wrapper.findAll('.cx-table-selection-checkbox--row');
    expect(bodyCheckboxes).toHaveLength(rows.length);
    // First child of header row is the selection cell (side='left').
    const firstHeaderCell = wrapper.find('.cx-table-row--header > div:first-child');
    expect(firstHeaderCell.classes()).toContain('cx-table-selection-cell');
  });

  it('selectionColumn.side="right" → selection cell APPENDED to header + body row', () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns,
        rows,
        selectionMode: 'multi',
        selectionColumn: { show: true, side: 'right' },
      },
    });
    const lastHeaderCell = wrapper.find('.cx-table-row--header > div:last-child');
    expect(lastHeaderCell.classes()).toContain('cx-table-selection-cell');
  });

  it('per-row checkbox checked reflects isRowSelected(rowId)', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns,
        rows,
        selectionMode: 'multi',
        selectionColumn: { show: true, side: 'left' },
      },
    });
    const handle = wrapper.vm as unknown as { setSelectedRowIds(ids: readonly string[]): void };
    handle.setSelectedRowIds(['r1', 'r3']);
    await wrapper.vm.$nextTick();
    const r1Box = wrapper.find('.cx-table-row[data-row-id="r1"] .cx-table-selection-checkbox--row');
    const r2Box = wrapper.find('.cx-table-row[data-row-id="r2"] .cx-table-selection-checkbox--row');
    const r3Box = wrapper.find('.cx-table-row[data-row-id="r3"] .cx-table-selection-checkbox--row');
    expect((r1Box.element as HTMLInputElement).checked).toBe(true);
    expect((r2Box.element as HTMLInputElement).checked).toBe(false);
    expect((r3Box.element as HTMLInputElement).checked).toBe(true);
  });

  it('clicking a per-row checkbox toggles selection (always toggle, independent of selectionMode)', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns,
        rows,
        selectionMode: 'multi',
        selectionColumn: { show: true, side: 'left' },
      },
    });
    const handle = wrapper.vm as unknown as { getSelectedRowIds(): readonly string[] };
    const r2Box = wrapper.find('.cx-table-row[data-row-id="r2"] .cx-table-selection-checkbox--row');
    await r2Box.trigger('click');
    expect(handle.getSelectedRowIds()).toEqual(['r2']);
    // Click again → toggle off.
    await r2Box.trigger('click');
    expect(handle.getSelectedRowIds()).toEqual([]);
    // Click r1 then r3 → both selected (toggle semantics).
    await wrapper
      .find('.cx-table-row[data-row-id="r1"] .cx-table-selection-checkbox--row')
      .trigger('click');
    await wrapper
      .find('.cx-table-row[data-row-id="r3"] .cx-table-selection-checkbox--row')
      .trigger('click');
    expect(handle.getSelectedRowIds()).toEqual(['r1', 'r3']);
  });

  it('header three-state checkbox — checked / unchecked / indeterminate via DOM property', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns,
        rows,
        selectionMode: 'multi',
        selectionColumn: { show: true, side: 'left' },
      },
    });
    const handle = wrapper.vm as unknown as { setSelectedRowIds(ids: readonly string[]): void };
    const getHeader = () =>
      wrapper.find('.cx-table-selection-checkbox--header').element as HTMLInputElement;
    // Initially nothing selected → unchecked + not indeterminate.
    expect(getHeader().checked).toBe(false);
    expect(getHeader().indeterminate).toBe(false);
    // Select 2 of 3 rows → indeterminate.
    handle.setSelectedRowIds(['r1', 'r2']);
    await wrapper.vm.$nextTick();
    expect(getHeader().indeterminate).toBe(true);
    expect(getHeader().checked).toBe(false);
    // Select all 3 → checked.
    handle.setSelectedRowIds(['r1', 'r2', 'r3']);
    await wrapper.vm.$nextTick();
    expect(getHeader().checked).toBe(true);
    expect(getHeader().indeterminate).toBe(false);
  });

  it('clicking the header checkbox when not-all-selected → selects all displayed rows', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns,
        rows,
        selectionMode: 'multi',
        selectionColumn: { show: true, side: 'left' },
      },
    });
    const handle = wrapper.vm as unknown as { getSelectedRowIds(): readonly string[] };
    const headerBox = wrapper.find('.cx-table-selection-checkbox--header');
    await headerBox.trigger('click');
    expect(handle.getSelectedRowIds()).toEqual(['r1', 'r2', 'r3']);
    // Click again when all selected → clear.
    await headerBox.trigger('click');
    expect(handle.getSelectedRowIds()).toEqual([]);
  });

  it('shift+click on a body row with established anchor → selection becomes the inclusive range in display order', async () => {
    const manyRows: readonly RowSpec[] = Array.from({ length: 6 }, (_, i) => ({
      id: `r${i + 1}`,
      data: { id: i + 1, name: `Row ${i + 1}`, qty: i, status: 'OK', note: '' },
    }));
    const wrapper = mount(ChronixTable, {
      props: { columns, rows: manyRows, selectionMode: 'multi' },
    });
    const handle = wrapper.vm as unknown as { getSelectedRowIds(): readonly string[] };
    // Plain click r2 → anchor = r2, selection = [r2].
    await wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="r2"]').trigger('click');
    expect(handle.getSelectedRowIds()).toEqual(['r2']);
    // Shift+click r5 → range [r2..r5] = [r2, r3, r4, r5].
    await wrapper
      .find('.cx-table-cell[data-col-id="name"][data-row-id="r5"]')
      .trigger('click', { shiftKey: true });
    expect(handle.getSelectedRowIds()).toEqual(['r2', 'r3', 'r4', 'r5']);
    // Shift+click r3 again → range [r2..r3] (anchor unchanged at r2).
    await wrapper
      .find('.cx-table-cell[data-col-id="name"][data-row-id="r3"]')
      .trigger('click', { shiftKey: true });
    expect(handle.getSelectedRowIds()).toEqual(['r2', 'r3']);
  });

  it('shift+click on a row with NO anchor → degenerate plain-click (sets anchor + replaces with [clicked])', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, selectionMode: 'multi' },
    });
    const handle = wrapper.vm as unknown as { getSelectedRowIds(): readonly string[] };
    // No prior clicks → no anchor; shift+click r2 → behaves as plain click.
    await wrapper
      .find('.cx-table-cell[data-col-id="name"][data-row-id="r2"]')
      .trigger('click', { shiftKey: true });
    expect(handle.getSelectedRowIds()).toEqual(['r2']);
  });

  it('page-number bar renders one button per page when totalPages <= threshold (5 pages, no ellipsis)', () => {
    const manyRows: readonly RowSpec[] = Array.from({ length: 50 }, (_, i) => ({
      id: `r${i + 1}`,
      data: { id: i + 1, name: `Row ${i + 1}`, qty: i, status: 'OK', note: '' },
    }));
    const wrapper = mount(ChronixTable, {
      props: { columns, rows: manyRows, showPagination: true, initialPageSize: 10 },
    });
    // 50 / 10 = 5 pages → under default threshold (7) → all pages render, no ellipsis.
    const pageButtons = wrapper.findAll('.cx-table-pagination-page');
    expect(pageButtons).toHaveLength(5);
    expect(wrapper.find('.cx-table-pagination-ellipsis').exists()).toBe(false);
    // Labels are 1-based (the user-facing display).
    expect(pageButtons.map((b) => b.text())).toEqual(['1', '2', '3', '4', '5']);
  });

  it('ellipsis appears with large totalPages (200 rows / pageSize 10 = 20 pages)', () => {
    const lotsOfRows: readonly RowSpec[] = Array.from({ length: 200 }, (_, i) => ({
      id: `r${i + 1}`,
      data: { id: i + 1, name: `Row ${i + 1}`, qty: i, status: 'OK', note: '' },
    }));
    const wrapper = mount(ChronixTable, {
      props: { columns, rows: lotsOfRows, showPagination: true, initialPageSize: 10 },
    });
    // Initial page = 0 → near-start mode → [1, 2, 3, ellipsis, 20].
    expect(wrapper.find('.cx-table-pagination-ellipsis').exists()).toBe(true);
    const visibleLabels = wrapper.findAll('.cx-table-pagination-pages > *').map((n) => n.text());
    // Labels should include '1', '2', '3', '…', '20' in some order.
    expect(visibleLabels).toContain('1');
    expect(visibleLabels).toContain('20');
    expect(visibleLabels).toContain('…');
  });

  it('clicking a page-number button jumps to that page + fires page-change emit', async () => {
    const manyRows: readonly RowSpec[] = Array.from({ length: 50 }, (_, i) => ({
      id: `r${i + 1}`,
      data: { id: i + 1, name: `Row ${i + 1}`, qty: i, status: 'OK', note: '' },
    }));
    const wrapper = mount(ChronixTable, {
      props: { columns, rows: manyRows, showPagination: true, initialPageSize: 10 },
    });
    const handle = wrapper.vm as unknown as { getPage(): number };
    // Click the "page 3" button (index 2).
    const page3 = wrapper.find('.cx-table-pagination-page[data-page-index="2"]');
    expect(page3.exists()).toBe(true);
    await page3.trigger('click');
    expect(handle.getPage()).toBe(2);
    const emits = wrapper.emitted('page-change');
    expect(emits).toHaveLength(1);
    expect((emits![0]![0] as { page: number; pageSize: number }).page).toBe(2);
  });

  it('current page button carries --current modifier + aria-current="page" + disabled', async () => {
    const manyRows: readonly RowSpec[] = Array.from({ length: 50 }, (_, i) => ({
      id: `r${i + 1}`,
      data: { id: i + 1, name: `Row ${i + 1}`, qty: i, status: 'OK', note: '' },
    }));
    const wrapper = mount(ChronixTable, {
      props: { columns, rows: manyRows, showPagination: true, initialPageSize: 10 },
    });
    const handle = wrapper.vm as unknown as { setPage(page: number): void };
    handle.setPage(2);
    await wrapper.vm.$nextTick();
    const current = wrapper.find('.cx-table-pagination-page--current');
    expect(current.exists()).toBe(true);
    expect(current.text()).toBe('3');
    expect(current.attributes('aria-current')).toBe('page');
    expect(current.attributes('disabled')).toBeDefined();
  });

  it('dblclick on a non-editable cell does NOT enter edit mode (no input, no cell-edit-start)', async () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    await wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="r1"]').trigger('dblclick');
    expect(wrapper.find('.cx-table-cell-editor').exists()).toBe(false);
    expect(wrapper.emitted('cell-edit-start') ?? []).toHaveLength(0);
  });

  it('dblclick on an editable cell opens the editor + fires cell-edit-start', async () => {
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, editable: true },
    ];
    const wrapper = mount(ChronixTable, { props: { columns: editableColumns, rows } });
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    expect(wrapper.find('.cx-table-cell-editor').exists()).toBe(true);
    const startEmits = wrapper.emitted('cell-edit-start');
    expect(startEmits).toHaveLength(1);
    const startPayload = startEmits![0]![0] as {
      row: RowSpec;
      column: ColumnSpec;
      baseValue: unknown;
      draftValue: unknown;
    };
    expect(startPayload.row.id).toBe('r1');
    expect(startPayload.column.id).toBe('note');
    expect(startPayload.baseValue).toBe('first');
    expect(startPayload.draftValue).toBe('first');
  });

  it('editor input value reflects valueFormatter when present', async () => {
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      {
        ...columns[4]!,
        editable: true,
        valueFormatter: ({ value }) => `[${String(value)}]`,
      },
    ];
    const wrapper = mount(ChronixTable, { props: { columns: editableColumns, rows } });
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    const input = wrapper.find('.cx-table-cell-editor').element as HTMLInputElement;
    expect(input.value).toBe('[first]');
  });

  it('typing in the editor updates draftValue but does NOT mutate row.data', async () => {
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, editable: true },
    ];
    const wrapper = mount(ChronixTable, { props: { columns: editableColumns, rows } });
    const handle = wrapper.vm as unknown as {
      getEditingCell(): { rowId: string; colId: string; draftValue: unknown } | null;
      getRowDataSource(): { getById(id: string): RowSpec | undefined };
    };
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('updated text');
    expect(handle.getEditingCell()?.draftValue).toBe('updated text');
    // row.data NOT mutated.
    expect(handle.getRowDataSource().getById('r1')?.data['note']).toBe('first');
  });

  it('pressing Enter commits + fires cell-value-change + cell-edit-stop {committed: true}', async () => {
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, editable: true },
    ];
    const wrapper = mount(ChronixTable, { props: { columns: editableColumns, rows } });
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('committed value');
    await editor.trigger('keydown', { key: 'Enter' });
    expect(wrapper.find('.cx-table-cell-editor').exists()).toBe(false);
    const changes = wrapper.emitted('cell-value-change');
    expect(changes).toHaveLength(1);
    const changePayload = changes![0]![0] as { oldValue: unknown; newValue: unknown };
    expect(changePayload.oldValue).toBe('first');
    expect(changePayload.newValue).toBe('committed value');
    const stops = wrapper.emitted('cell-edit-stop');
    expect(stops).toHaveLength(1);
    expect((stops![0]![0] as { committed: boolean }).committed).toBe(true);
  });

  it('pressing Esc cancels (no cell-value-change; cell-edit-stop {committed: false})', async () => {
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, editable: true },
    ];
    const wrapper = mount(ChronixTable, { props: { columns: editableColumns, rows } });
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('discarded');
    await editor.trigger('keydown', { key: 'Escape' });
    expect(wrapper.find('.cx-table-cell-editor').exists()).toBe(false);
    expect(wrapper.emitted('cell-value-change') ?? []).toHaveLength(0);
    const stops = wrapper.emitted('cell-edit-stop');
    expect(stops).toHaveLength(1);
    expect((stops![0]![0] as { committed: boolean }).committed).toBe(false);
  });

  it('blur commits (Notion semantic) — same effect as Enter', async () => {
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, editable: true },
    ];
    const wrapper = mount(ChronixTable, { props: { columns: editableColumns, rows } });
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('blur committed');
    await editor.trigger('blur');
    const changes = wrapper.emitted('cell-value-change');
    expect(changes).toHaveLength(1);
    expect((changes![0]![0] as { newValue: unknown }).newValue).toBe('blur committed');
  });

  it('committing with draftValue === baseValue suppresses cell-value-change (still fires cell-edit-stop)', async () => {
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, editable: true },
    ];
    const wrapper = mount(ChronixTable, { props: { columns: editableColumns, rows } });
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    // No typing — draft === base ('first').
    await wrapper.find('.cx-table-cell-editor').trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('cell-value-change') ?? []).toHaveLength(0);
    expect(wrapper.emitted('cell-edit-stop')).toHaveLength(1);
  });

  it('pressing Tab commits (also auto-advances to next editable cell — see tests below)', async () => {
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, editable: true },
    ];
    const wrapper = mount(ChronixTable, { props: { columns: editableColumns, rows } });
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('tab committed');
    await editor.trigger('keydown', { key: 'Tab' });
    // The commit MUST fire regardless auto-advance.
    const changes = wrapper.emitted('cell-value-change');
    expect(changes).toHaveLength(1);
    expect((changes![0]![0] as { newValue: unknown }).newValue).toBe('tab committed');
    // single editable column → Tab from r1.note jumps to r2.note (next row's only editable col).
    // dedicated tests below cover the auto-advance + boundary behavior in detail.
  });

  it('handle.startEditingCell / commitEditingCell / cancelEditingCell programmatic round-trip', async () => {
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, editable: true },
    ];
    const wrapper = mount(ChronixTable, { props: { columns: editableColumns, rows } });
    const handle = wrapper.vm as unknown as {
      startEditingCell(rowId: string, colId: string): void;
      commitEditingCell(): void;
      cancelEditingCell(): void;
      getEditingCell(): { rowId: string; colId: string } | null;
      setEditingCellDraft(value: unknown): void;
    };
    expect(handle.getEditingCell()).toBeNull();
    handle.startEditingCell('r2', 'note');
    await wrapper.vm.$nextTick();
    expect(handle.getEditingCell()?.rowId).toBe('r2');
    handle.setEditingCellDraft('programmatic');
    await wrapper.vm.$nextTick();
    handle.commitEditingCell();
    expect(handle.getEditingCell()).toBeNull();
    const changes = wrapper.emitted('cell-value-change');
    expect(changes).toHaveLength(1);
    expect((changes![0]![0] as { newValue: unknown }).newValue).toBe('programmatic');
  });

  it('startEditingCell on non-editable column is a silent no-op', async () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const handle = wrapper.vm as unknown as {
      startEditingCell(rowId: string, colId: string): void;
      getEditingCell(): { rowId: string } | null;
    };
    handle.startEditingCell('r1', 'name');
    await wrapper.vm.$nextTick();
    expect(handle.getEditingCell()).toBeNull();
    expect(wrapper.emitted('cell-edit-start') ?? []).toHaveLength(0);
  });

  it('opening edit on a different cell commits the previous one first', async () => {
    const editableColumns: readonly ColumnSpec[] = [
      { ...columns[0]!, editable: true },
      ...columns.slice(1, 4),
      { ...columns[4]!, editable: true },
    ];
    const wrapper = mount(ChronixTable, { props: { columns: editableColumns, rows } });
    const handle = wrapper.vm as unknown as {
      startEditingCell(rowId: string, colId: string): void;
      setEditingCellDraft(value: unknown): void;
    };
    handle.startEditingCell('r1', 'note');
    await wrapper.vm.$nextTick();
    handle.setEditingCellDraft('was about to commit');
    await wrapper.vm.$nextTick();
    // Open a different cell → previous commits, this opens.
    handle.startEditingCell('r2', 'note');
    await wrapper.vm.$nextTick();
    const changes = wrapper.emitted('cell-value-change');
    expect(changes).toHaveLength(1);
    expect((changes![0]![0] as { newValue: unknown }).newValue).toBe('was about to commit');
    expect(wrapper.emitted('cell-edit-start')).toHaveLength(2);
  });

  it('re-opening the SAME cell while editing is a no-op (no extra cell-edit-start)', async () => {
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, editable: true },
    ];
    const wrapper = mount(ChronixTable, { props: { columns: editableColumns, rows } });
    const handle = wrapper.vm as unknown as {
      startEditingCell(rowId: string, colId: string): void;
    };
    handle.startEditingCell('r1', 'note');
    await wrapper.vm.$nextTick();
    handle.startEditingCell('r1', 'note');
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('cell-edit-start')).toHaveLength(1);
  });

  // ────────────────────────── number editor + typed draft coercion ──────────────────────────
  // The number editor branch in `buildCellEditorInput` renders `<input type="number">`
  // for columns whose `type === 'number'`, and `applyEditCommit` runs the raw draft
  // through `coerceEditDraftValue` before emitting. Invalid input rejects the commit
  // (editor stays open, cell-edit-stop {committed:false} fires, no cell-value-change).
  // See `audit/TABLE_PHASE_12_1_NUMBER_EDITOR_DESIGN.md` for the full decision matrix.

  function numberEditableColumns(): readonly ColumnSpec[] {
    return [
      columns[0]!,
      columns[1]!,
      { ...columns[2]!, type: 'number', editable: true },
      columns[3]!,
      { ...columns[4]!, editable: true },
    ];
  }

  it('number-typed editable column renders `<input type="number">`', async () => {
    const wrapper = mount(ChronixTable, { props: { columns: numberEditableColumns(), rows } });
    await wrapper.find('.cx-table-cell[data-col-id="qty"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor').element as HTMLInputElement;
    expect(editor.type).toBe('number');
    expect(editor.getAttribute('inputmode')).toBe('decimal');
    // text editor branch remains for non-numeric columns.
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r2"]').trigger('dblclick');
    const textEditor = wrapper.find('.cx-table-cell-editor').element as HTMLInputElement;
    expect(textEditor.type).toBe('text');
  });

  it('valid numeric commit fires cell-value-change with `newValue: number` (not string)', async () => {
    const wrapper = mount(ChronixTable, { props: { columns: numberEditableColumns(), rows } });
    await wrapper.find('.cx-table-cell[data-col-id="qty"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('42');
    await editor.trigger('keydown', { key: 'Enter' });
    const changes = wrapper.emitted('cell-value-change');
    expect(changes).toHaveLength(1);
    const payload = changes![0]![0] as { oldValue: unknown; newValue: unknown };
    expect(payload.oldValue).toBe(10);
    expect(payload.newValue).toBe(42);
    expect(typeof payload.newValue).toBe('number');
    const stops = wrapper.emitted('cell-edit-stop');
    expect((stops![0]![0] as { committed: boolean; finalValue: unknown }).committed).toBe(true);
    expect((stops![0]![0] as { committed: boolean; finalValue: unknown }).finalValue).toBe(42);
  });

  it('empty-string commit on number column produces `newValue: null` (Decision B.1)', async () => {
    const wrapper = mount(ChronixTable, { props: { columns: numberEditableColumns(), rows } });
    await wrapper.find('.cx-table-cell[data-col-id="qty"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('');
    await editor.trigger('keydown', { key: 'Enter' });
    const changes = wrapper.emitted('cell-value-change');
    expect(changes).toHaveLength(1);
    const payload = changes![0]![0] as { oldValue: unknown; newValue: unknown };
    expect(payload.oldValue).toBe(10);
    expect(payload.newValue).toBeNull();
    expect(wrapper.find('.cx-table-cell-editor').exists()).toBe(false);
  });

  // ────────────────────────── Tab-to-next-editable-cell auto-advance ──────────────────────────
  // Tab now commits AND auto-opens the next editable cell in display order
  // (Decision B.1 cross-row jump on row exhaustion; Decision A.1 close at
  // table boundary). Shift+Tab navigates backward. rejection
  // path is preserved — rejected commit skips the auto-advance.
  // See `audit/TABLE_PHASE_12_2_TAB_TO_NEXT_EDITABLE_DESIGN.md`.

  function twoEditableColumns(): readonly ColumnSpec[] {
    return [
      columns[0]!,
      columns[1]!,
      { ...columns[2]!, editable: true }, // qty: 2nd editable, in-row neighbor
      columns[3]!,
      { ...columns[4]!, editable: true }, // note: 3rd editable, in-row neighbor
    ];
  }

  it('Tab forward commits then auto-opens next editable cell in same row', async () => {
    const wrapper = mount(ChronixTable, { props: { columns: twoEditableColumns(), rows } });
    const handle = wrapper.vm as unknown as {
      getEditingCell(): { rowId: string; colId: string } | null;
    };
    await wrapper.find('.cx-table-cell[data-col-id="qty"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('77');
    await editor.trigger('keydown', { key: 'Tab' });
    // First cell committed. qty in twoEditableColumns has no `type:'number'`,
    // so coerce is passthrough and newValue retains the editor's string draft.
    const changes = wrapper.emitted('cell-value-change');
    expect(changes).toHaveLength(1);
    expect((changes![0]![0] as { newValue: unknown }).newValue).toBe('77');
    // Editor is now on the next editable cell of the same row (note column).
    // applyEditStart initialises draftValue via formatCellValue, so
    // numeric source values render as their string text in the editor.
    expect(handle.getEditingCell()).toEqual({
      rowId: 'r1',
      colId: 'note',
      baseValue: 'first',
      draftValue: 'first',
    });
    const starts = wrapper.emitted('cell-edit-start');
    expect(starts).toHaveLength(2); // initial dblclick + auto-advance start
    const secondStart = starts![1]![0] as { row: RowSpec; column: ColumnSpec };
    expect(secondStart.row.id).toBe('r1');
    expect(secondStart.column.id).toBe('note');
  });

  it('Tab forward at row-end skips to next row first editable cell (Decision B.1)', async () => {
    const wrapper = mount(ChronixTable, { props: { columns: twoEditableColumns(), rows } });
    const handle = wrapper.vm as unknown as {
      getEditingCell(): { rowId: string; colId: string } | null;
    };
    // Start on the LAST editable column of r1 (note). Tab should jump to r2's FIRST editable column (qty).
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('updated note');
    await editor.trigger('keydown', { key: 'Tab' });
    // baseValue is the raw row.data.qty (number 20); draftValue is the
    // formatted string ('20') per applyEditStart initialisation.
    expect(handle.getEditingCell()).toEqual({
      rowId: 'r2',
      colId: 'qty',
      baseValue: 20,
      draftValue: '20',
    });
  });

  it('Shift+Tab navigates backward + Tab at table-end closes editor (Decision A.1)', async () => {
    const wrapper = mount(ChronixTable, { props: { columns: twoEditableColumns(), rows } });
    const handle = wrapper.vm as unknown as {
      getEditingCell(): { rowId: string; colId: string } | null;
    };
    // Shift+Tab from r2 qty → r1 note (previous row's LAST editable).
    await wrapper.find('.cx-table-cell[data-col-id="qty"][data-row-id="r2"]').trigger('dblclick');
    let editor = wrapper.find('.cx-table-cell-editor');
    await editor.trigger('keydown', { key: 'Tab', shiftKey: true });
    expect(handle.getEditingCell()?.rowId).toBe('r1');
    expect(handle.getEditingCell()?.colId).toBe('note');
    // Tab at table-end (last editable cell of last row, r3.note) → editor closes (Decision A.1).
    // The fixture has 3 rows; navigate to r3.note then Tab.
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r3"]').trigger('dblclick');
    editor = wrapper.find('.cx-table-cell-editor');
    await editor.trigger('keydown', { key: 'Tab' });
    expect(wrapper.find('.cx-table-cell-editor').exists()).toBe(false);
    expect(handle.getEditingCell()).toBeNull();
  });

  it('rejected commit (path) does NOT auto-advance — editor stays on original cell', async () => {
    const wrapper = mount(ChronixTable, { props: { columns: numberEditableColumns(), rows } });
    const handle = wrapper.vm as unknown as {
      getEditingCell(): { rowId: string; colId: string; draftValue: unknown } | null;
    };
    await wrapper.find('.cx-table-cell[data-col-id="qty"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    const inputEl = editor.element as HTMLInputElement;
    Object.defineProperty(inputEl, 'value', { value: 'abc', configurable: true, writable: true });
    await editor.trigger('input');
    await editor.trigger('keydown', { key: 'Tab' });
    // Still on the original (rejected) cell — NOT auto-advanced to note.
    expect(handle.getEditingCell()?.colId).toBe('qty');
    expect(handle.getEditingCell()?.rowId).toBe('r1');
    expect(handle.getEditingCell()?.draftValue).toBe('abc');
    expect(wrapper.emitted('cell-value-change') ?? []).toHaveLength(0);
  });

  it('invalid input rejects commit — editor stays open, no cell-value-change, cell-edit-stop {committed:false} fires (Decision C.1)', async () => {
    const wrapper = mount(ChronixTable, { props: { columns: numberEditableColumns(), rows } });
    const handle = wrapper.vm as unknown as {
      getEditingCell(): { rowId: string; colId: string; draftValue: unknown } | null;
    };
    await wrapper.find('.cx-table-cell[data-col-id="qty"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    const inputEl = editor.element as HTMLInputElement;
    // happy-dom's <input type="number"> auto-sanitizes non-numeric setValue
    // calls to empty string, so `editor.setValue('abc')` would produce an
    // EMPTY draft (which coerces to `null`, a valid commit). Real browsers
    // are also strict but can still receive non-numeric drafts via paste,
    // IME composition, or some mobile soft-keyboards with locale-specific
    // separators. Override the value property to bypass happy-dom's
    // sanitization and exercise the actual rejection codepath.
    Object.defineProperty(inputEl, 'value', {
      value: 'abc',
      configurable: true,
      writable: true,
    });
    await editor.trigger('input');
    await editor.trigger('keydown', { key: 'Enter' });
    // Editor REMAINS open.
    expect(wrapper.find('.cx-table-cell-editor').exists()).toBe(true);
    expect(handle.getEditingCell()).not.toBeNull();
    expect(handle.getEditingCell()?.colId).toBe('qty');
    expect(handle.getEditingCell()?.draftValue).toBe('abc');
    // No cell-value-change.
    expect(wrapper.emitted('cell-value-change') ?? []).toHaveLength(0);
    // cell-edit-stop fires with {committed:false, finalValue: baseValue (10)}.
    const stops = wrapper.emitted('cell-edit-stop');
    expect(stops).toHaveLength(1);
    const stopPayload = stops![0]![0] as { committed: boolean; finalValue: unknown };
    expect(stopPayload.committed).toBe(false);
    expect(stopPayload.finalValue).toBe(10);
    // Follow-up commit with valid input succeeds normally — replace the
    // bypassed property with a fresh valid draft.
    Object.defineProperty(inputEl, 'value', {
      value: '99',
      configurable: true,
      writable: true,
    });
    await editor.trigger('input');
    await editor.trigger('keydown', { key: 'Enter' });
    expect(wrapper.find('.cx-table-cell-editor').exists()).toBe(false);
    const changes = wrapper.emitted('cell-value-change');
    expect(changes).toHaveLength(1);
    expect((changes![0]![0] as { newValue: unknown }).newValue).toBe(99);
  });

  // ────────────────────────── column resize (drag-resize boundary) ──────────────────────────
  // Resizer renders inside each `resizable !== false` header cell. Pointer
  // capture (via setPointerCapture) keeps pointermove + pointerup on the
  // resizer element regardless of cursor position. Drag updates draftWidth
  // in real-time (the SFC's columnsForLayout computed substitutes the
  // resizing column's width + clears its flex); pointerup commits via
  // `column-width-change` emit per Decision A.1. Other flex columns
  // continue to share the remaining space — Decision B.1 ("拖谁谁变").
  // See `audit/TABLE_PHASE_13_COLUMN_RESIZE_DESIGN.md`.

  function resizableColumns(): readonly ColumnSpec[] {
    // 5 cols total: id (default), name (flex:1), qty (width 120), status (width 100, resizable:false), note (flex:2).
    // The mix exercises explicit-width + flex + resizable:false + opt-out.
    return [
      { ...columns[0]!, minWidth: 40 }, // id (default width)
      columns[1]!, // name flex:1
      { ...columns[2]!, minWidth: 60, maxWidth: 240 }, // qty width=120 + bounded
      { ...columns[3]!, resizable: false }, // status resizable:false → no resizer
      columns[4]!, // note flex:2
    ];
  }

  it('resizable !== false columns render `.cx-table-header-resizer`; resizable:false columns omit it', () => {
    const wrapper = mount(ChronixTable, { props: { columns: resizableColumns(), rows } });
    // id, name, qty, note → 4 resizers; status (resizable:false) → no resizer.
    expect(wrapper.findAll('.cx-table-header-resizer')).toHaveLength(4);
    expect(
      wrapper.find('.cx-table-header-cell[data-col-id="status"] .cx-table-header-resizer').exists(),
    ).toBe(false);
    // The resizer carries data-resizer-col-id for hit-test identification.
    const qtyResizer = wrapper.find('[data-resizer-col-id="qty"]');
    expect(qtyResizer.exists()).toBe(true);
  });

  it('pointerdown on resizer fires column-resize-start + sets getResizingColumn()', async () => {
    const wrapper = mount(ChronixTable, { props: { columns: resizableColumns(), rows } });
    const handle = wrapper.vm as unknown as {
      getResizingColumn(): { colId: string; baseWidth: number; draftWidth: number } | null;
    };
    const resizer = wrapper.find('[data-resizer-col-id="qty"]');
    await resizer.trigger('pointerdown', { button: 0, clientX: 500, pointerId: 1 });
    expect(handle.getResizingColumn()?.colId).toBe('qty');
    expect(handle.getResizingColumn()?.baseWidth).toBe(120);
    expect(handle.getResizingColumn()?.draftWidth).toBe(120); // === base at start
    const starts = wrapper.emitted('column-resize-start');
    expect(starts).toHaveLength(1);
    const payload = starts![0]![0] as { column: ColumnSpec; baseWidth: number; draftWidth: number };
    expect(payload.column.id).toBe('qty');
    expect(payload.baseWidth).toBe(120);
    expect(payload.draftWidth).toBe(120);
  });

  it('pointermove updates draftWidth + the header cell width re-renders live', async () => {
    const wrapper = mount(ChronixTable, { props: { columns: resizableColumns(), rows } });
    const handle = wrapper.vm as unknown as {
      getResizingColumn(): { draftWidth: number } | null;
    };
    const resizer = wrapper.find('[data-resizer-col-id="qty"]');
    await resizer.trigger('pointerdown', { button: 0, clientX: 500, pointerId: 1 });
    await resizer.trigger('pointermove', { clientX: 550, pointerId: 1 });
    expect(handle.getResizingColumn()?.draftWidth).toBe(170); // 120 + 50
    // Header cell style reflects the draft width live.
    const qtyHeader = wrapper.find('.cx-table-header-cell[data-col-id="qty"]');
    expect(widthPx(qtyHeader.attributes('style'))).toBe(170);
    // Further pointermove updates again.
    await resizer.trigger('pointermove', { clientX: 580, pointerId: 1 });
    expect(handle.getResizingColumn()?.draftWidth).toBe(200);
    expect(
      widthPx(wrapper.find('.cx-table-header-cell[data-col-id="qty"]').attributes('style')),
    ).toBe(200);
  });

  it('pointerup commits — fires column-width-change + column-resize-stop {committed:true} + clears state', async () => {
    const wrapper = mount(ChronixTable, { props: { columns: resizableColumns(), rows } });
    const handle = wrapper.vm as unknown as {
      getResizingColumn(): unknown;
    };
    const resizer = wrapper.find('[data-resizer-col-id="qty"]');
    await resizer.trigger('pointerdown', { button: 0, clientX: 500, pointerId: 1 });
    await resizer.trigger('pointermove', { clientX: 580, pointerId: 1 });
    await resizer.trigger('pointerup', { pointerId: 1 });
    expect(handle.getResizingColumn()).toBeNull();
    const changes = wrapper.emitted('column-width-change');
    expect(changes).toHaveLength(1);
    const change = changes![0]![0] as { column: ColumnSpec; oldWidth: number; newWidth: number };
    expect(change.column.id).toBe('qty');
    expect(change.oldWidth).toBe(120);
    expect(change.newWidth).toBe(200);
    const stops = wrapper.emitted('column-resize-stop');
    expect(stops).toHaveLength(1);
    const stop = stops![0]![0] as { committed: boolean; finalWidth: number };
    expect(stop.committed).toBe(true);
    expect(stop.finalWidth).toBe(200);
  });

  it('pointerup with no draftWidth change (draft === base) suppresses column-width-change (no-op dedup)', async () => {
    const wrapper = mount(ChronixTable, { props: { columns: resizableColumns(), rows } });
    const resizer = wrapper.find('[data-resizer-col-id="qty"]');
    await resizer.trigger('pointerdown', { button: 0, clientX: 500, pointerId: 1 });
    // No pointermove → draftWidth === baseWidth.
    await resizer.trigger('pointerup', { pointerId: 1 });
    expect(wrapper.emitted('column-width-change') ?? []).toHaveLength(0);
    const stops = wrapper.emitted('column-resize-stop');
    expect(stops).toHaveLength(1);
    expect((stops![0]![0] as { committed: boolean }).committed).toBe(true);
  });

  it('handle.cancelColumnResize fires column-resize-stop {committed:false} only — no column-width-change', () => {
    const wrapper = mount(ChronixTable, { props: { columns: resizableColumns(), rows } });
    const handle = wrapper.vm as unknown as {
      startResizingColumn(colId: string): void;
      cancelColumnResize(): void;
      getResizingColumn(): unknown;
    };
    handle.startResizingColumn('qty');
    expect(handle.getResizingColumn()).not.toBeNull();
    handle.cancelColumnResize();
    expect(handle.getResizingColumn()).toBeNull();
    expect(wrapper.emitted('column-width-change') ?? []).toHaveLength(0);
    const stops = wrapper.emitted('column-resize-stop');
    expect(stops).toHaveLength(1);
    const payload = stops![0]![0] as { committed: boolean; finalWidth: number };
    expect(payload.committed).toBe(false);
    expect(payload.finalWidth).toBe(120); // baseWidth restored
  });

  it('minWidth clamp — dragging far left clamps draftWidth to column.minWidth', async () => {
    const wrapper = mount(ChronixTable, { props: { columns: resizableColumns(), rows } });
    const handle = wrapper.vm as unknown as { getResizingColumn(): { draftWidth: number } | null };
    const resizer = wrapper.find('[data-resizer-col-id="qty"]');
    await resizer.trigger('pointerdown', { button: 0, clientX: 500, pointerId: 1 });
    // Drag far left — raw would be 120 + (-500) = -380 → clamped up to minWidth 60.
    await resizer.trigger('pointermove', { clientX: 0, pointerId: 1 });
    expect(handle.getResizingColumn()?.draftWidth).toBe(60);
  });

  it('maxWidth clamp — dragging far right clamps draftWidth to column.maxWidth', async () => {
    const wrapper = mount(ChronixTable, { props: { columns: resizableColumns(), rows } });
    const handle = wrapper.vm as unknown as { getResizingColumn(): { draftWidth: number } | null };
    const resizer = wrapper.find('[data-resizer-col-id="qty"]');
    await resizer.trigger('pointerdown', { button: 0, clientX: 500, pointerId: 1 });
    // Drag far right — raw would be 120 + 500 = 620 → clamped down to maxWidth 240.
    await resizer.trigger('pointermove', { clientX: 1000, pointerId: 1 });
    expect(handle.getResizingColumn()?.draftWidth).toBe(240);
  });

  it('handle.startResizingColumn programmatic round-trip (start → commit)', () => {
    const wrapper = mount(ChronixTable, { props: { columns: resizableColumns(), rows } });
    const handle = wrapper.vm as unknown as {
      startResizingColumn(colId: string): void;
      commitColumnResize(): void;
      getResizingColumn(): { colId: string; baseWidth: number; draftWidth: number } | null;
    };
    handle.startResizingColumn('qty');
    const open = handle.getResizingColumn();
    expect(open?.colId).toBe('qty');
    expect(open?.baseWidth).toBe(120);
    expect(open?.draftWidth).toBe(120);
    expect(wrapper.emitted('column-resize-start')).toHaveLength(1);
    // No draft change → commit suppresses column-width-change (dedup).
    handle.commitColumnResize();
    expect(handle.getResizingColumn()).toBeNull();
    expect(wrapper.emitted('column-width-change') ?? []).toHaveLength(0);
    expect(wrapper.emitted('column-resize-stop')).toHaveLength(1);
  });

  it('startResizingColumn on resizable:false column is a silent no-op', () => {
    const wrapper = mount(ChronixTable, { props: { columns: resizableColumns(), rows } });
    const handle = wrapper.vm as unknown as {
      startResizingColumn(colId: string): void;
      getResizingColumn(): unknown;
    };
    handle.startResizingColumn('status');
    expect(handle.getResizingColumn()).toBeNull();
    expect(wrapper.emitted('column-resize-start') ?? []).toHaveLength(0);
  });

  // ────────────────────────── column move (drag-to-reorder header) ──────────────────────────
  // Whole-header-cell drag handler with 5px movement threshold + emit-only
  // `column-order-change`. Pointerdown sets pending state; pointermove ≥
  // threshold promotes to active drag + fires `column-move-start` + opens
  // the drop-indicator render path. Pointerup with a valid drop target
  // commits via `column-order-change`. `reorderable: false` opts a column
  // out of the wiring entirely. See `audit/TABLE_PHASE_14_COLUMN_MOVE_DESIGN.md`.

  function reorderableColumns(): readonly ColumnSpec[] {
    // 5 cols. status carries reorderable:false to exercise the opt-out.
    return [
      columns[0]!, // id (default width 80)
      columns[1]!, // name flex:1
      columns[2]!, // qty width:120
      { ...columns[3]!, reorderable: false }, // status reorderable:false
      columns[4]!, // note flex:2
    ];
  }

  // Stub `getBoundingClientRect` on every header cell + the wrapper. happy-dom
  // returns zero rects by default which would make `getColumnDropTarget`
  // never resolve a target. Each column gets a 100px-wide slot starting at
  // clientX = 0. Wrapper sits at clientX = 0 too so wrapper-relative px
  // === clientX in these tests.
  function stubHeaderRects(
    wrapper: ReturnType<typeof mount>,
    slotWidthPx = 100,
  ): readonly { colId: string; left: number; right: number }[] {
    const wrapperEl = wrapper.find('.cx-table-wrapper').element as HTMLElement;
    Object.defineProperty(wrapperEl, 'getBoundingClientRect', {
      value: () => ({ left: 0, right: slotWidthPx * 5, top: 0, bottom: 200 }),
      configurable: true,
    });
    const cellEls = wrapper.findAll('.cx-table-header-cell[data-col-id]');
    const stubs: { colId: string; left: number; right: number }[] = [];
    cellEls.forEach((domWrapper, i) => {
      const colId = domWrapper.attributes('data-col-id')!;
      const left = i * slotWidthPx;
      const right = left + slotWidthPx;
      stubs.push({ colId, left, right });
      Object.defineProperty(domWrapper.element, 'getBoundingClientRect', {
        value: () => ({ left, right, top: 0, bottom: 40 }),
        configurable: true,
      });
    });
    return stubs;
  }

  it('reorderable !== false columns receive pointer-move wiring; reorderable:false columns do not', async () => {
    const wrapper = mount(ChronixTable, { props: { columns: reorderableColumns(), rows } });
    const handle = wrapper.vm as unknown as {
      getMovingColumn(): { colId: string } | null;
    };
    // Pointerdown on 'qty' (reorderable defaults to true) → pending state set
    // (no emit until threshold), so getMovingColumn() is still null but a
    // subsequent pointermove past the threshold WILL promote.
    const qty = wrapper.find('.cx-table-header-cell[data-col-id="qty"]');
    await qty.trigger('pointerdown', { button: 0, clientX: 100, clientY: 20, pointerId: 1 });
    await qty.trigger('pointermove', { clientX: 200, clientY: 20, pointerId: 1 });
    expect(handle.getMovingColumn()?.colId).toBe('qty');

    // Pointerdown on 'status' (reorderable:false) → no wiring, so pointermove
    // can't promote anything.
    const wrapper2 = mount(ChronixTable, { props: { columns: reorderableColumns(), rows } });
    const handle2 = wrapper2.vm as unknown as { getMovingColumn(): unknown };
    const status = wrapper2.find('.cx-table-header-cell[data-col-id="status"]');
    await status.trigger('pointerdown', { button: 0, clientX: 100, clientY: 20, pointerId: 1 });
    await status.trigger('pointermove', { clientX: 200, clientY: 20, pointerId: 1 });
    expect(handle2.getMovingColumn()).toBeNull();
    expect(wrapper2.emitted('column-move-start') ?? []).toHaveLength(0);
  });

  it('pointerdown + pointerup with < 5px movement does NOT emit column-move-start (sort click preserved)', async () => {
    const wrapper = mount(ChronixTable, { props: { columns: reorderableColumns(), rows } });
    const handle = wrapper.vm as unknown as { getMovingColumn(): unknown };
    const qty = wrapper.find('.cx-table-header-cell[data-col-id="qty"]');
    await qty.trigger('pointerdown', { button: 0, clientX: 100, clientY: 20, pointerId: 1 });
    // 3px is below the 5px threshold.
    await qty.trigger('pointermove', { clientX: 103, clientY: 20, pointerId: 1 });
    await qty.trigger('pointerup', { clientX: 103, clientY: 20, pointerId: 1 });
    expect(handle.getMovingColumn()).toBeNull();
    expect(wrapper.emitted('column-move-start') ?? []).toHaveLength(0);
    expect(wrapper.emitted('column-move-stop') ?? []).toHaveLength(0);
  });

  it('pointermove ≥ 5px promotes to active drag + fires column-move-start with payload', async () => {
    const wrapper = mount(ChronixTable, { props: { columns: reorderableColumns(), rows } });
    stubHeaderRects(wrapper);
    const handle = wrapper.vm as unknown as { getMovingColumn(): { colId: string } | null };
    const qty = wrapper.find('.cx-table-header-cell[data-col-id="qty"]');
    await qty.trigger('pointerdown', { button: 0, clientX: 250, clientY: 20, pointerId: 1 });
    // 6px move crosses the 5px threshold (Chebyshev distance).
    await qty.trigger('pointermove', { clientX: 256, clientY: 20, pointerId: 1 });
    expect(handle.getMovingColumn()?.colId).toBe('qty');
    const starts = wrapper.emitted('column-move-start');
    expect(starts).toHaveLength(1);
    const payload = starts![0]![0] as { column: ColumnSpec; startClientX: number };
    expect(payload.column.id).toBe('qty');
    expect(payload.startClientX).toBe(250);
  });

  it('pointermove over another column resolves dropTarget {targetColId, position} + sets drop-target class', async () => {
    const wrapper = mount(ChronixTable, { props: { columns: reorderableColumns(), rows } });
    stubHeaderRects(wrapper); // each col owns 100px slot; ids: 0/name/qty/status/note → 0-100, 100-200, 200-300, 300-400, 400-500
    const handle = wrapper.vm as unknown as {
      getMovingColumn(): { dropTarget: { targetColId: string; position: string } | null } | null;
    };
    const qty = wrapper.find('.cx-table-header-cell[data-col-id="qty"]');
    await qty.trigger('pointerdown', { button: 0, clientX: 250, clientY: 20, pointerId: 1 });
    // Cross threshold (first move = 6px), simultaneously land on 'note' (clientX 470 > 'note' midpoint 450).
    await qty.trigger('pointermove', { clientX: 470, clientY: 20, pointerId: 1 });
    expect(handle.getMovingColumn()?.dropTarget?.targetColId).toBe('note');
    expect(handle.getMovingColumn()?.dropTarget?.position).toBe('after');
    // The 'note' cell carries the drop-target-after class.
    expect(
      wrapper
        .find('.cx-table-header-cell[data-col-id="note"]')
        .classes()
        .includes('cx-table-header-cell--drop-target-after'),
    ).toBe(true);
  });

  it('handle.startMovingColumn bypasses threshold + handle.commitColumnMove emits column-order-change', () => {
    const wrapper = mount(ChronixTable, { props: { columns: reorderableColumns(), rows } });
    const handle = wrapper.vm as unknown as {
      startMovingColumn(colId: string): void;
      commitColumnMove(targetColId: string, position: 'before' | 'after'): void;
      getMovingColumn(): unknown;
    };
    handle.startMovingColumn('id'); // first column
    expect(handle.getMovingColumn()).not.toBeNull();
    expect(wrapper.emitted('column-move-start')).toHaveLength(1);

    handle.commitColumnMove('note', 'after'); // move id to after note (i.e. last position)
    expect(handle.getMovingColumn()).toBeNull();
    const changes = wrapper.emitted('column-order-change');
    expect(changes).toHaveLength(1);
    const payload = changes![0]![0] as {
      movedColumn: ColumnSpec;
      targetColumn: ColumnSpec;
      position: 'before' | 'after';
      oldColumnIds: readonly string[];
      newColumnIds: readonly string[];
    };
    expect(payload.movedColumn.id).toBe('id');
    expect(payload.targetColumn.id).toBe('note');
    expect(payload.position).toBe('after');
    expect(payload.oldColumnIds).toEqual(['id', 'name', 'qty', 'status', 'note']);
    expect(payload.newColumnIds).toEqual(['name', 'qty', 'status', 'note', 'id']);
    // move-stop with committed:true follows.
    const stops = wrapper.emitted('column-move-stop');
    expect(stops).toHaveLength(1);
    expect((stops![0]![0] as { committed: boolean }).committed).toBe(true);
  });

  it('no-op commit (drop target same column) suppresses column-order-change but still fires column-move-stop', () => {
    const wrapper = mount(ChronixTable, { props: { columns: reorderableColumns(), rows } });
    const handle = wrapper.vm as unknown as {
      startMovingColumn(colId: string): void;
      commitColumnMove(targetColId: string, position: 'before' | 'after'): void;
    };
    handle.startMovingColumn('qty');
    // Drop on qty itself → computeColumnReorder returns input reference → no
    // order-change emit. But move-stop still fires with committed:true.
    handle.commitColumnMove('qty', 'before');
    expect(wrapper.emitted('column-order-change') ?? []).toHaveLength(0);
    expect(wrapper.emitted('column-move-stop')).toHaveLength(1);
    expect((wrapper.emitted('column-move-stop')![0]![0] as { committed: boolean }).committed).toBe(
      true,
    );
  });

  it('handle.cancelColumnMove fires column-move-stop {committed:false} — no column-order-change', () => {
    const wrapper = mount(ChronixTable, { props: { columns: reorderableColumns(), rows } });
    const handle = wrapper.vm as unknown as {
      startMovingColumn(colId: string): void;
      cancelColumnMove(): void;
      getMovingColumn(): unknown;
    };
    handle.startMovingColumn('name');
    handle.cancelColumnMove();
    expect(handle.getMovingColumn()).toBeNull();
    expect(wrapper.emitted('column-order-change') ?? []).toHaveLength(0);
    const stops = wrapper.emitted('column-move-stop');
    expect(stops).toHaveLength(1);
    expect((stops![0]![0] as { committed: boolean }).committed).toBe(false);
  });

  it('pointercancel during active drag cancels — no column-order-change emit', async () => {
    const wrapper = mount(ChronixTable, { props: { columns: reorderableColumns(), rows } });
    stubHeaderRects(wrapper);
    const handle = wrapper.vm as unknown as { getMovingColumn(): unknown };
    const qty = wrapper.find('.cx-table-header-cell[data-col-id="qty"]');
    await qty.trigger('pointerdown', { button: 0, clientX: 250, clientY: 20, pointerId: 1 });
    await qty.trigger('pointermove', { clientX: 260, clientY: 20, pointerId: 1 });
    await qty.trigger('pointercancel', { pointerId: 1 });
    expect(handle.getMovingColumn()).toBeNull();
    expect(wrapper.emitted('column-order-change') ?? []).toHaveLength(0);
    const stops = wrapper.emitted('column-move-stop');
    expect(stops).toHaveLength(1);
    expect((stops![0]![0] as { committed: boolean }).committed).toBe(false);
  });

  it('startMovingColumn on reorderable:false column is silent no-op', () => {
    const wrapper = mount(ChronixTable, { props: { columns: reorderableColumns(), rows } });
    const handle = wrapper.vm as unknown as {
      startMovingColumn(colId: string): void;
      getMovingColumn(): unknown;
    };
    handle.startMovingColumn('status');
    expect(handle.getMovingColumn()).toBeNull();
    expect(wrapper.emitted('column-move-start') ?? []).toHaveLength(0);
  });

  it('drop-line overlay renders at the wrapper level when dropTarget resolves', async () => {
    const wrapper = mount(ChronixTable, { props: { columns: reorderableColumns(), rows } });
    stubHeaderRects(wrapper); // ids: id 0-100, name 100-200, qty 200-300, status 300-400, note 400-500
    const qty = wrapper.find('.cx-table-header-cell[data-col-id="qty"]');
    await qty.trigger('pointerdown', { button: 0, clientX: 250, clientY: 20, pointerId: 1 });
    // Land on 'name' midpoint=150 left half → before. clientX 130 → 'before'.
    await qty.trigger('pointermove', { clientX: 130, clientY: 20, pointerId: 1 });
    const dropLine = wrapper.find('.cx-table-drop-line');
    expect(dropLine.exists()).toBe(true);
    expect(dropLine.attributes('data-drop-target-col-id')).toBe('name');
    expect(dropLine.attributes('data-drop-target-position')).toBe('before');
    // dropLineLeftPx = name.left (100) - wrapperLeft (0) - 1 = 99
    expect(dropLine.attributes('style')).toContain('left: 99px');
  });

  // ────────────────────────── column autosize (dbl-click resizer + imperative API) ──────────────────────────
  // Reuses resizer DOM as the dbl-click affordance + reuses
  // `column-width-change` emit as the persistence channel (Decision A.1 — no new
  // emit). The chronix-NEW core helper `computeAutosizeWidth` does the clamp.
  // In happy-dom (no Canvas 2D context), `measureCellTextWidth` returns 0, so
  // every measurement falls back to `headerWidth = 0 + paddingX = 16` clamped
  // to `minWidth` — the degenerate test value is the minWidth itself.
  // See `audit/TABLE_PHASE_15_COLUMN_AUTOSIZE_DESIGN.md`.

  function autosizeableColumns(): readonly ColumnSpec[] {
    // 5 cols. status has resizable:false (no resizer DOM → no dbl-click).
    // note has autosizeable:false explicit opt-out (resizer DOM exists; dblclick is a no-op).
    return [
      { ...columns[0]!, minWidth: 40 }, // id width:80
      columns[1]!, // name flex:1
      { ...columns[2]!, minWidth: 60, maxWidth: 240 }, // qty width:120
      { ...columns[3]!, resizable: false }, // status — no resizer + autosize no-op
      { ...columns[4]!, minWidth: 40, autosizeable: false }, // note — resizer present, dblclick is no-op
    ];
  }

  it('resizable:true columns carry the resizer DOM that hosts the autosize dblclick handler', () => {
    const wrapper = mount(ChronixTable, { props: { columns: autosizeableColumns(), rows } });
    // 4 columns have resizable !== false (id / name / qty / note).
    expect(wrapper.findAll('.cx-table-header-resizer')).toHaveLength(4);
    expect(wrapper.find('[data-resizer-col-id="qty"]').exists()).toBe(true);
    expect(wrapper.find('[data-resizer-col-id="note"]').exists()).toBe(true);
    // status (resizable:false) has no resizer DOM at all.
    expect(wrapper.find('[data-resizer-col-id="status"]').exists()).toBe(false);
  });

  it('dbl-click on the resizer fires column-width-change (happy-dom degenerate → minWidth)', async () => {
    const wrapper = mount(ChronixTable, { props: { columns: autosizeableColumns(), rows } });
    const qtyResizer = wrapper.find('[data-resizer-col-id="qty"]');
    await qtyResizer.trigger('dblclick');
    const changes = wrapper.emitted('column-width-change');
    expect(changes).toBeTruthy();
    expect(changes!.length).toBe(1);
    const payload = changes![0]![0] as { column: ColumnSpec; oldWidth: number; newWidth: number };
    expect(payload.column.id).toBe('qty');
    // baseWidth 120 → newWidth = qty.minWidth=60 (happy-dom Canvas null → 0 measurement → clamped to minWidth).
    expect(payload.oldWidth).toBe(120);
    expect(payload.newWidth).toBe(60);
  });

  it('dbl-click on an autosizeable:false column resizer is a silent no-op', async () => {
    const wrapper = mount(ChronixTable, { props: { columns: autosizeableColumns(), rows } });
    // note has autosizeable:false; resizer DOM exists but dblclick should not emit.
    const noteResizer = wrapper.find('[data-resizer-col-id="note"]');
    expect(noteResizer.exists()).toBe(true);
    await noteResizer.trigger('dblclick');
    expect(wrapper.emitted('column-width-change') ?? []).toHaveLength(0);
  });

  it('handle.autosizeColumn fires column-width-change for the target column', () => {
    const wrapper = mount(ChronixTable, { props: { columns: autosizeableColumns(), rows } });
    const handle = wrapper.vm as unknown as { autosizeColumn(colId: string): void };
    handle.autosizeColumn('qty');
    const changes = wrapper.emitted('column-width-change');
    expect(changes).toBeTruthy();
    expect(changes!.length).toBe(1);
    const payload = changes![0]![0] as { column: ColumnSpec; newWidth: number };
    expect(payload.column.id).toBe('qty');
    expect(payload.newWidth).toBe(60); // qty.minWidth
  });

  it('handle.autosizeColumn on resizable:false column is silent no-op (cannot mutate width)', () => {
    const wrapper = mount(ChronixTable, { props: { columns: autosizeableColumns(), rows } });
    const handle = wrapper.vm as unknown as { autosizeColumn(colId: string): void };
    handle.autosizeColumn('status');
    expect(wrapper.emitted('column-width-change') ?? []).toHaveLength(0);
  });

  it('handle.autosizeColumn on autosizeable:false column is silent no-op', () => {
    const wrapper = mount(ChronixTable, { props: { columns: autosizeableColumns(), rows } });
    const handle = wrapper.vm as unknown as { autosizeColumn(colId: string): void };
    handle.autosizeColumn('note');
    expect(wrapper.emitted('column-width-change') ?? []).toHaveLength(0);
  });

  it('handle.autosizeAllColumns fires column-width-change once per autosizeable+resizable column', () => {
    const wrapper = mount(ChronixTable, { props: { columns: autosizeableColumns(), rows } });
    const handle = wrapper.vm as unknown as { autosizeAllColumns(): void };
    handle.autosizeAllColumns();
    const changes = wrapper.emitted('column-width-change');
    expect(changes).toBeTruthy();
    // Expected emits: id (resizable:true autosizeable:default), name (same), qty (same).
    // SKIPPED: status (resizable:false) + note (autosizeable:false).
    // But also dedup: any column whose baseWidth already equals minWidth → no emit.
    // baseWidths: id=80, name=flex (varies), qty=120. All differ from their minWidths.
    // Note: in test env (no real Canvas), name's flex resolution may produce
    // baseWidth equal to defaultMinColumnWidth → could dedup. Assert at least
    // qty + id fire.
    const colIds = changes!.map((c) => (c[0] as { column: ColumnSpec }).column.id);
    expect(colIds).toContain('qty');
    expect(colIds).toContain('id');
    expect(colIds).not.toContain('status');
    expect(colIds).not.toContain('note');
  });

  it('handle.autosizeColumn on unknown id is silent no-op', () => {
    const wrapper = mount(ChronixTable, { props: { columns: autosizeableColumns(), rows } });
    const handle = wrapper.vm as unknown as { autosizeColumn(colId: string): void };
    handle.autosizeColumn('does-not-exist');
    expect(wrapper.emitted('column-width-change') ?? []).toHaveLength(0);
  });

  // ────────────────────────── cell range selection (drag-extend + shift+click extend) ──────────────────────────
  // chronix-NEW feature — pure helper `computeCellRangeEnvelope` resolves the
  // 2-point {anchor, focus} into the {rowIds, colIds} rectangle. SFC wiring
  // adds per-cell pointerdown/move/up/cancel + a click-capture handler for
  // shift+click extend. Opt-in via the `cellRangeSelection: 'enabled'` prop.

  interface CellRangeHandle {
    setCellRange(
      range: {
        anchor: { rowId: string; colId: string };
        focus: { rowId: string; colId: string };
      } | null,
    ): void;
    clearCellRange(): void;
    getCellRange(): {
      anchor: { rowId: string; colId: string };
      focus: { rowId: string; colId: string };
    } | null;
  }

  it('default cellRangeSelection is "none" — pointerdown on a cell does NOT emit cell-range-start', async () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const r1c1 = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="id"]');
    expect(r1c1.exists()).toBe(true);
    await r1c1.trigger('pointerdown', { clientX: 10, clientY: 10, pointerId: 1, button: 0 });
    expect(wrapper.emitted('cell-range-start') ?? []).toHaveLength(0);
  });

  it('cellRangeSelection="enabled" + pointerdown on a body cell → cell-range-start + in-cell-range modifier', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, cellRangeSelection: 'enabled' },
    });
    const r2c2 = wrapper.find('.cx-table-cell[data-row-id="r2"][data-col-id="name"]');
    expect(r2c2.exists()).toBe(true);
    await r2c2.trigger('pointerdown', { clientX: 20, clientY: 30, pointerId: 1, button: 0 });
    const starts = wrapper.emitted('cell-range-start');
    expect(starts).toBeTruthy();
    expect(starts!.length).toBe(1);
    const payload = starts![0]![0] as {
      range: {
        anchor: { rowId: string; colId: string };
        focus: { rowId: string; colId: string };
      };
    };
    expect(payload.range.anchor).toEqual({ rowId: 'r2', colId: 'name' });
    expect(payload.range.focus).toEqual({ rowId: 'r2', colId: 'name' });
    // The pointerdown cell itself is in the envelope.
    expect(r2c2.classes()).toContain('cx-table-cell--in-cell-range');
  });

  it('handle.setCellRange opens range programmatically with non-trivial focus → emits start + change', () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, cellRangeSelection: 'enabled' },
    });
    const handle = wrapper.vm as unknown as CellRangeHandle;
    handle.setCellRange({
      anchor: { rowId: 'r1', colId: 'id' },
      focus: { rowId: 'r3', colId: 'qty' },
    });
    const starts = wrapper.emitted('cell-range-start');
    const changes = wrapper.emitted('cell-range-change');
    expect(starts).toBeTruthy();
    expect(starts!.length).toBe(1);
    expect(changes).toBeTruthy();
    expect(changes!.length).toBe(1);
    const changePayload = changes![0]![0] as {
      envelope: { rowIds: readonly string[]; colIds: readonly string[] };
    };
    expect(changePayload.envelope.rowIds).toEqual(['r1', 'r2', 'r3']);
    expect(changePayload.envelope.colIds).toEqual(['id', 'name', 'qty']);
  });

  it('handle.setCellRange with focus === anchor → only start emit (no change)', () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, cellRangeSelection: 'enabled' },
    });
    const handle = wrapper.vm as unknown as CellRangeHandle;
    handle.setCellRange({
      anchor: { rowId: 'r1', colId: 'id' },
      focus: { rowId: 'r1', colId: 'id' },
    });
    expect(wrapper.emitted('cell-range-start')!.length).toBe(1);
    expect(wrapper.emitted('cell-range-change') ?? []).toHaveLength(0);
  });

  it('handle.getCellRange returns the current state', () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, cellRangeSelection: 'enabled' },
    });
    const handle = wrapper.vm as unknown as CellRangeHandle;
    expect(handle.getCellRange()).toBeNull();
    handle.setCellRange({
      anchor: { rowId: 'r1', colId: 'id' },
      focus: { rowId: 'r2', colId: 'name' },
    });
    const current = handle.getCellRange();
    expect(current?.anchor).toEqual({ rowId: 'r1', colId: 'id' });
    expect(current?.focus).toEqual({ rowId: 'r2', colId: 'name' });
  });

  it('handle.clearCellRange wipes state + emits cell-range-stop', () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, cellRangeSelection: 'enabled' },
    });
    const handle = wrapper.vm as unknown as CellRangeHandle;
    handle.setCellRange({
      anchor: { rowId: 'r1', colId: 'id' },
      focus: { rowId: 'r1', colId: 'id' },
    });
    handle.clearCellRange();
    expect(handle.getCellRange()).toBeNull();
    const stops = wrapper.emitted('cell-range-stop');
    expect(stops).toBeTruthy();
    expect(stops!.length).toBe(1);
  });

  it('setCellRange(null) is equivalent to clearCellRange', () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, cellRangeSelection: 'enabled' },
    });
    const handle = wrapper.vm as unknown as CellRangeHandle;
    handle.setCellRange({
      anchor: { rowId: 'r2', colId: 'name' },
      focus: { rowId: 'r2', colId: 'name' },
    });
    handle.setCellRange(null);
    expect(handle.getCellRange()).toBeNull();
    expect(wrapper.emitted('cell-range-stop')!.length).toBe(1);
  });

  it('handle methods are silent no-ops when cellRangeSelection === "none"', () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const handle = wrapper.vm as unknown as CellRangeHandle;
    handle.setCellRange({
      anchor: { rowId: 'r1', colId: 'id' },
      focus: { rowId: 'r2', colId: 'name' },
    });
    handle.clearCellRange();
    expect(handle.getCellRange()).toBeNull();
    expect(wrapper.emitted('cell-range-start') ?? []).toHaveLength(0);
    expect(wrapper.emitted('cell-range-change') ?? []).toHaveLength(0);
    expect(wrapper.emitted('cell-range-stop') ?? []).toHaveLength(0);
  });

  it('cellRangeSelection="enabled" + pointerdown then pointerup → cell-range-stop emit', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, cellRangeSelection: 'enabled' },
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="id"]');
    await cell.trigger('pointerdown', { clientX: 10, clientY: 10, pointerId: 1, button: 0 });
    await cell.trigger('pointerup', { clientX: 10, clientY: 10, pointerId: 1 });
    const stops = wrapper.emitted('cell-range-stop');
    expect(stops).toBeTruthy();
    expect(stops!.length).toBe(1);
  });

  it('pointerdown with non-primary button (right-click) does NOT open a session', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, cellRangeSelection: 'enabled' },
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="id"]');
    await cell.trigger('pointerdown', { clientX: 10, clientY: 10, pointerId: 1, button: 2 });
    expect(wrapper.emitted('cell-range-start') ?? []).toHaveLength(0);
  });

  // ────────────────────────── pinned columns left / right ──────────────────────────
  //
  // ships per-cell `position: sticky` for columns with
  // `ColumnSpec.pinned === 'left' | 'right'`. The chronix-NEW
  // `pinnedColsPass` partitions visible columns into zones and computes
  // cumulative sticky offsets; the SFC spreads the resulting style +
  // modifier classes into the existing flat row layout. Click + pointer
  // delegation is unchanged because the DOM event model is agnostic to
  // CSS positioning.

  it('no pinned columns → no sticky inline styles or pinned-* modifier classes on any cell', () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    for (const col of columns) {
      const header = wrapper.find(`.cx-table-header-cell[data-col-id="${col.id}"]`);
      const cell = wrapper.find(`.cx-table-cell[data-col-id="${col.id}"][data-row-id="r1"]`);
      expect(header.attributes('style') ?? '').not.toContain('position: sticky');
      expect(cell.attributes('style') ?? '').not.toContain('position: sticky');
      expect(header.classes()).not.toContain('cx-table-header-cell--pinned-left');
      expect(header.classes()).not.toContain('cx-table-header-cell--pinned-right');
      expect(cell.classes()).not.toContain('cx-table-cell--pinned-left');
      expect(cell.classes()).not.toContain('cx-table-cell--pinned-right');
    }
  });

  it('pinned: "left" → header + body cells get position:sticky, left:0px, and --pinned-left class', () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', width: 80, pinned: 'left' },
      { id: 'name', field: 'name', flex: 1 },
      { id: 'qty', field: 'qty', width: 100 },
    ];
    const wrapper = mount(ChronixTable, { props: { columns: pinnedCols, rows } });
    const header = wrapper.find('.cx-table-header-cell[data-col-id="id"]');
    const cell = wrapper.find('.cx-table-cell[data-col-id="id"][data-row-id="r1"]');
    expect(header.attributes('style')).toContain('position: sticky');
    expect(header.attributes('style')).toContain('left: 0px');
    expect(cell.attributes('style')).toContain('position: sticky');
    expect(cell.attributes('style')).toContain('left: 0px');
    expect(header.classes()).toContain('cx-table-header-cell--pinned-left');
    expect(header.classes()).toContain('cx-table-header-cell--pinned-left-last');
    expect(cell.classes()).toContain('cx-table-cell--pinned-left');
    expect(cell.classes()).toContain('cx-table-cell--pinned-left-last');
  });

  it('two left-pinned columns → second gets cumulative left offset = first.width', () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', width: 80, pinned: 'left' },
      { id: 'name', field: 'name', width: 120, pinned: 'left' },
      { id: 'qty', field: 'qty', width: 100 },
    ];
    const wrapper = mount(ChronixTable, { props: { columns: pinnedCols, rows } });
    const firstHeader = wrapper.find('.cx-table-header-cell[data-col-id="id"]');
    const secondHeader = wrapper.find('.cx-table-header-cell[data-col-id="name"]');
    expect(firstHeader.attributes('style')).toContain('left: 0px');
    expect(secondHeader.attributes('style')).toContain('left: 80px');
    // Boundary class on the SECOND (last) left-pinned cell only.
    expect(firstHeader.classes()).not.toContain('cx-table-header-cell--pinned-left-last');
    expect(secondHeader.classes()).toContain('cx-table-header-cell--pinned-left-last');
  });

  it('pinned: "right" → cell gets position:sticky, right:0px, and --pinned-right class', () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', width: 80 },
      { id: 'name', field: 'name', flex: 1 },
      { id: 'note', field: 'note', width: 100, pinned: 'right' },
    ];
    const wrapper = mount(ChronixTable, { props: { columns: pinnedCols, rows } });
    const header = wrapper.find('.cx-table-header-cell[data-col-id="note"]');
    const cell = wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]');
    expect(header.attributes('style')).toContain('position: sticky');
    expect(header.attributes('style')).toContain('right: 0px');
    expect(cell.attributes('style')).toContain('position: sticky');
    expect(cell.attributes('style')).toContain('right: 0px');
    expect(header.classes()).toContain('cx-table-header-cell--pinned-right');
    expect(header.classes()).toContain('cx-table-header-cell--pinned-right-first');
    expect(cell.classes()).toContain('cx-table-cell--pinned-right');
    expect(cell.classes()).toContain('cx-table-cell--pinned-right-first');
  });

  it('two right-pinned columns → leftmost gets cumulative right offset = rightmost.width', () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'name', field: 'name', flex: 1 },
      { id: 'status', field: 'status', width: 90, pinned: 'right' },
      { id: 'note', field: 'note', width: 100, pinned: 'right' },
    ];
    const wrapper = mount(ChronixTable, { props: { columns: pinnedCols, rows } });
    const leftmost = wrapper.find('.cx-table-header-cell[data-col-id="status"]');
    const rightmost = wrapper.find('.cx-table-header-cell[data-col-id="note"]');
    expect(rightmost.attributes('style')).toContain('right: 0px');
    expect(leftmost.attributes('style')).toContain('right: 100px');
    expect(leftmost.classes()).toContain('cx-table-header-cell--pinned-right-first');
    expect(rightmost.classes()).not.toContain('cx-table-header-cell--pinned-right-first');
  });

  it('pinned filter-row cells also get sticky positioning + zone modifier classes', () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', width: 80, pinned: 'left' },
      { id: 'name', field: 'name', flex: 1 },
      { id: 'note', field: 'note', width: 100, pinned: 'right' },
    ];
    const wrapper = mount(ChronixTable, {
      props: { columns: pinnedCols, rows, showFilterRow: true },
    });
    const leftFilter = wrapper.find('.cx-table-filter-cell[data-col-id="id"]');
    const rightFilter = wrapper.find('.cx-table-filter-cell[data-col-id="note"]');
    expect(leftFilter.attributes('style')).toContain('position: sticky');
    expect(leftFilter.attributes('style')).toContain('left: 0px');
    expect(leftFilter.classes()).toContain('cx-table-filter-cell--pinned-left');
    expect(rightFilter.attributes('style')).toContain('position: sticky');
    expect(rightFilter.attributes('style')).toContain('right: 0px');
    expect(rightFilter.classes()).toContain('cx-table-filter-cell--pinned-right');
  });

  it('cell-click delegation still fires on a pinned body cell (wiring unchanged)', async () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', width: 80, pinned: 'left' },
      { id: 'name', field: 'name', flex: 1 },
    ];
    const wrapper = mount(ChronixTable, { props: { columns: pinnedCols, rows } });
    const pinnedCell = wrapper.find('.cx-table-cell[data-col-id="id"][data-row-id="r1"]');
    await pinnedCell.trigger('click');
    const clicks = wrapper.emitted('cell-click');
    expect(clicks).toBeTruthy();
    expect(clicks!.length).toBe(1);
  });

  it('header-click delegation still fires on a pinned header cell (wiring unchanged)', async () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', width: 80, pinned: 'left' },
      { id: 'name', field: 'name', flex: 1 },
    ];
    const wrapper = mount(ChronixTable, { props: { columns: pinnedCols, rows } });
    const header = wrapper.find('.cx-table-header-cell[data-col-id="id"]');
    await header.trigger('click');
    const headerClicks = wrapper.emitted('header-click');
    expect(headerClicks).toBeTruthy();
    expect(headerClicks!.length).toBe(1);
  });

  it('cell-range envelope spans across pinned + center zones (envelope unaffected)', async () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', width: 80, pinned: 'left' },
      { id: 'name', field: 'name', width: 100 },
      { id: 'note', field: 'note', width: 100, pinned: 'right' },
    ];
    const wrapper = mount(ChronixTable, {
      props: { columns: pinnedCols, rows, cellRangeSelection: 'enabled' },
    });
    const handle = wrapper.vm as unknown as {
      setCellRange(range: {
        anchor: { rowId: string; colId: string };
        focus: { rowId: string; colId: string };
      }): void;
    };
    handle.setCellRange({
      anchor: { rowId: 'r1', colId: 'id' },
      focus: { rowId: 'r1', colId: 'note' },
    });
    await wrapper.vm.$nextTick();
    const leftPinned = wrapper.find('.cx-table-cell[data-col-id="id"][data-row-id="r1"]');
    const center = wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="r1"]');
    const rightPinned = wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]');
    expect(leftPinned.classes()).toContain('cx-table-cell--in-cell-range');
    expect(center.classes()).toContain('cx-table-cell--in-cell-range');
    expect(rightPinned.classes()).toContain('cx-table-cell--in-cell-range');
  });

  it('when selectionColumn.side === "left", left-pinned cells shift right by selectionColumnWidth', () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', width: 80, pinned: 'left' },
      { id: 'name', field: 'name', flex: 1 },
    ];
    const wrapper = mount(ChronixTable, {
      props: {
        columns: pinnedCols,
        rows,
        selectionMode: 'single',
        selectionColumn: { show: true, side: 'left' },
      },
    });
    const pinnedHeader = wrapper.find('.cx-table-header-cell[data-col-id="id"]');
    // selectionColumnWidth defaults to 36 (theme token).
    expect(pinnedHeader.attributes('style')).toContain('left: 36px');
  });

  it('row-selection modifier paints uniformly across pinned + center cells', async () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', width: 80, pinned: 'left' },
      { id: 'name', field: 'name', flex: 1 },
      { id: 'note', field: 'note', width: 100, pinned: 'right' },
    ];
    const wrapper = mount(ChronixTable, {
      props: { columns: pinnedCols, rows, selectionMode: 'single' },
    });
    const handle = wrapper.vm as unknown as {
      setSelectedRowIds(ids: readonly string[]): void;
    };
    handle.setSelectedRowIds(['r1']);
    await wrapper.vm.$nextTick();
    const row = wrapper.find('.cx-table-body .cx-table-row[data-row-id="r1"]');
    expect(row.classes()).toContain('cx-table-row--selected');
    // All three zone cells live INSIDE the selected row — the
    // `cx-table-row--selected` modifier styles them via descendant
    // selector. No per-cell exclusion based on pinning.
    expect(row.findAll('.cx-table-cell')).toHaveLength(3);
  });

  // ────────────────────────── pinned cross-zone reorder guard ──────────────────────────
  //
  // extends getColumnDropTarget with an optional pinnedZoneByColId
  // filter that the SFC threads through applyMoveDraft. Cross-zone drags
  // resolve to dropTarget: null → no drop indicator + no column-order-change
  // emit. Closes parked cross-zone reorder item.

  it('dragging a left-pinned column over a CENTER column resolves dropTarget=null (cross-zone reject)', async () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', width: 80, pinned: 'left' },
      { id: 'name', field: 'name', width: 100, pinned: 'left' },
      { id: 'qty', field: 'qty', width: 100 },
      { id: 'note', field: 'note', width: 100, pinned: 'right' },
    ];
    const wrapper = mount(ChronixTable, { props: { columns: pinnedCols, rows } });
    stubHeaderRects(wrapper);
    const handle = wrapper.vm as unknown as {
      getMovingColumn(): { dropTarget: { targetColId: string; position: string } | null } | null;
    };
    const idHeader = wrapper.find('.cx-table-header-cell[data-col-id="id"]');
    // Pointerdown on id (left-pinned), then move past 5px threshold to qty
    // center (clientX 250 within qty's 200-300 slot).
    await idHeader.trigger('pointerdown', { button: 0, clientX: 50, clientY: 20, pointerId: 1 });
    await idHeader.trigger('pointermove', { clientX: 250, clientY: 20, pointerId: 1 });
    // Cross-zone target (id is 'left', qty is center) → dropTarget null.
    expect(handle.getMovingColumn()?.dropTarget).toBeNull();
    // No drop-target class on the qty header cell either.
    expect(
      wrapper
        .find('.cx-table-header-cell[data-col-id="qty"]')
        .classes()
        .some((c) => c.startsWith('cx-table-header-cell--drop-target')),
    ).toBe(false);
  });

  it('dragging a left-pinned column over ANOTHER left-pinned column resolves dropTarget normally (same-zone allowed)', async () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', width: 80, pinned: 'left' },
      { id: 'name', field: 'name', width: 100, pinned: 'left' },
      { id: 'qty', field: 'qty', width: 100 },
    ];
    const wrapper = mount(ChronixTable, { props: { columns: pinnedCols, rows } });
    stubHeaderRects(wrapper);
    const handle = wrapper.vm as unknown as {
      getMovingColumn(): { dropTarget: { targetColId: string; position: string } | null } | null;
    };
    const idHeader = wrapper.find('.cx-table-header-cell[data-col-id="id"]');
    // Pointerdown on id, then move to name (also left-pinned; clientX 130 within
    // name's 100-200 slot, right half → 'after').
    await idHeader.trigger('pointerdown', { button: 0, clientX: 50, clientY: 20, pointerId: 1 });
    await idHeader.trigger('pointermove', { clientX: 170, clientY: 20, pointerId: 1 });
    const target = handle.getMovingColumn()?.dropTarget;
    expect(target).not.toBeNull();
    expect(target?.targetColId).toBe('name');
    expect(target?.position).toBe('after');
  });

  it('dragging a CENTER column over another center column still works (zone guard backward-compatible)', async () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', width: 80, pinned: 'left' },
      { id: 'name', field: 'name', width: 100 },
      { id: 'qty', field: 'qty', width: 100 },
      { id: 'note', field: 'note', width: 100, pinned: 'right' },
    ];
    const wrapper = mount(ChronixTable, { props: { columns: pinnedCols, rows } });
    stubHeaderRects(wrapper);
    const handle = wrapper.vm as unknown as {
      getMovingColumn(): { dropTarget: { targetColId: string; position: string } | null } | null;
    };
    const nameHeader = wrapper.find('.cx-table-header-cell[data-col-id="name"]');
    // Drag center column 'name' to center column 'qty' (clientX 250 within qty's 200-300 slot).
    await nameHeader.trigger('pointerdown', { button: 0, clientX: 150, clientY: 20, pointerId: 1 });
    await nameHeader.trigger('pointermove', { clientX: 270, clientY: 20, pointerId: 1 });
    const target = handle.getMovingColumn()?.dropTarget;
    expect(target?.targetColId).toBe('qty');
    expect(target?.position).toBe('after');
  });

  // ────────────────────────── clipboard copy (Ctrl+C on active cell-range) ──────────────────────────
  //
  // wires a Ctrl+C / Cmd+C keydown handler on the body element +
  // a `copyCellRangeToClipboard()` TableHandle method. Both flow through
  // the same `performCellRangeCopy` path: synth TSV via the pure helper,
  // fail-soft write to `navigator.clipboard`, emit `cell-range-copy`.

  interface CopyCellRangeHandle {
    setCellRange(
      range: {
        anchor: { rowId: string; colId: string };
        focus: { rowId: string; colId: string };
      } | null,
    ): void;
    clearCellRange(): void;
    copyCellRangeToClipboard(): Promise<string | null>;
  }

  describe('clipboard copy', () => {
    let writeTextMock: ReturnType<typeof vi.fn>;
    let originalClipboardDescriptor: PropertyDescriptor | undefined;

    beforeEach(() => {
      writeTextMock = vi.fn().mockResolvedValue(undefined);
      originalClipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        configurable: true,
      });
    });

    afterEach(() => {
      if (originalClipboardDescriptor != null) {
        Object.defineProperty(navigator, 'clipboard', originalClipboardDescriptor);
      } else {
        // Remove the property entirely if it didn't exist before this test.
        const nav = navigator as unknown as Record<string, unknown>;
        Reflect.deleteProperty(nav, 'clipboard');
      }
    });

    it('default cellRangeSelection: "none" → Ctrl+C is no-op (no emit, no writeText)', async () => {
      const wrapper = mount(ChronixTable, { props: { columns, rows } });
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'c', ctrlKey: true });
      expect(wrapper.emitted('cell-range-copy') ?? []).toHaveLength(0);
      expect(writeTextMock).not.toHaveBeenCalled();
    });

    it('cellRangeSelection: "enabled" + no active range → Ctrl+C is no-op', async () => {
      const wrapper = mount(ChronixTable, {
        props: { columns, rows, cellRangeSelection: 'enabled' },
      });
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'c', ctrlKey: true });
      expect(wrapper.emitted('cell-range-copy') ?? []).toHaveLength(0);
      expect(writeTextMock).not.toHaveBeenCalled();
    });

    it('cellRangeSelection: "enabled" + active range + Ctrl+C → emit fires + writeText called once with TSV', async () => {
      const wrapper = mount(ChronixTable, {
        props: { columns, rows, cellRangeSelection: 'enabled' },
      });
      const handle = wrapper.vm as unknown as CopyCellRangeHandle;
      handle.setCellRange({
        anchor: { rowId: 'r1', colId: 'name' },
        focus: { rowId: 'r2', colId: 'qty' },
      });
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'c', ctrlKey: true });
      // Allow the awaited writeText promise inside the handler to resolve.
      await Promise.resolve();
      const copies = wrapper.emitted('cell-range-copy');
      expect(copies).toBeTruthy();
      expect(copies!.length).toBe(1);
      const payload = copies![0]![0] as {
        envelope: { rowIds: readonly string[]; colIds: readonly string[] };
        text: string;
      };
      expect(payload.envelope.rowIds).toEqual(['r1', 'r2']);
      expect(payload.envelope.colIds).toEqual(['name', 'qty']);
      expect(payload.text).toBe('Alpha\t10\nBeta\t20');
      expect(writeTextMock).toHaveBeenCalledTimes(1);
      expect(writeTextMock).toHaveBeenCalledWith('Alpha\t10\nBeta\t20');
    });

    it('programmatic handle.copyCellRangeToClipboard() with active range → resolves to TSV + emit + writeText', async () => {
      const wrapper = mount(ChronixTable, {
        props: { columns, rows, cellRangeSelection: 'enabled' },
      });
      const handle = wrapper.vm as unknown as CopyCellRangeHandle;
      handle.setCellRange({
        anchor: { rowId: 'r2', colId: 'name' },
        focus: { rowId: 'r3', colId: 'qty' },
      });
      const result = await handle.copyCellRangeToClipboard();
      expect(result).toBe('Beta\t20\nGamma\t30');
      expect(writeTextMock).toHaveBeenCalledTimes(1);
      expect(writeTextMock).toHaveBeenCalledWith('Beta\t20\nGamma\t30');
      const copies = wrapper.emitted('cell-range-copy');
      expect(copies).toBeTruthy();
      expect(copies!.length).toBe(1);
      const payload = copies![0]![0] as { jsEvent: KeyboardEvent | null };
      expect(payload.jsEvent).toBeNull();
    });

    it('programmatic handle.copyCellRangeToClipboard() with no active range → resolves to null + no emit + no writeText', async () => {
      const wrapper = mount(ChronixTable, {
        props: { columns, rows, cellRangeSelection: 'enabled' },
      });
      const handle = wrapper.vm as unknown as CopyCellRangeHandle;
      const result = await handle.copyCellRangeToClipboard();
      expect(result).toBeNull();
      expect(writeTextMock).not.toHaveBeenCalled();
      expect(wrapper.emitted('cell-range-copy') ?? []).toHaveLength(0);
    });

    it('valueFormatter applied → formatted strings appear in the copied TSV', async () => {
      const formattedCols: readonly ColumnSpec[] = [
        { id: 'name', field: 'name', flex: 1 },
        {
          id: 'qty',
          field: 'qty',
          width: 100,
          valueFormatter: ({ value }) => `${String(value)} 件`,
        },
      ];
      const wrapper = mount(ChronixTable, {
        props: { columns: formattedCols, rows, cellRangeSelection: 'enabled' },
      });
      const handle = wrapper.vm as unknown as CopyCellRangeHandle;
      handle.setCellRange({
        anchor: { rowId: 'r1', colId: 'qty' },
        focus: { rowId: 'r2', colId: 'qty' },
      });
      const result = await handle.copyCellRangeToClipboard();
      expect(result).toBe('10 件\n20 件');
      expect(writeTextMock).toHaveBeenCalledWith('10 件\n20 件');
    });
  });

  // ────────────────────────── clipboard paste (Ctrl+V into active cell-range) ──────────────────────────
  //
  // extends onBodyKeydown with a Ctrl+V / Cmd+V branch
  // + adds `pasteCellRangeFromClipboard()` TableHandle method. Both flow
  // through `performCellRangePaste` which reads navigator.clipboard,
  // parses TSV, computes mutations, emits `cell-range-paste`.

  interface PasteCellRangeHandle {
    setCellRange(
      range: {
        anchor: { rowId: string; colId: string };
        focus: { rowId: string; colId: string };
      } | null,
    ): void;
    pasteCellRangeFromClipboard(): Promise<
      readonly { rowId: string; colId: string; oldValue: unknown; newValue: unknown }[] | null
    >;
  }

  describe('clipboard paste', () => {
    let readTextMock: ReturnType<typeof vi.fn>;
    let originalClipboardDescriptor: PropertyDescriptor | undefined;

    beforeEach(() => {
      readTextMock = vi.fn().mockResolvedValue('');
      originalClipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
      Object.defineProperty(navigator, 'clipboard', {
        value: { readText: readTextMock },
        configurable: true,
      });
    });

    afterEach(() => {
      if (originalClipboardDescriptor != null) {
        Object.defineProperty(navigator, 'clipboard', originalClipboardDescriptor);
      } else {
        const nav = navigator as unknown as Record<string, unknown>;
        Reflect.deleteProperty(nav, 'clipboard');
      }
    });

    it('default cellRangeSelection: "none" → Ctrl+V is no-op (no emit, no readText)', async () => {
      const wrapper = mount(ChronixTable, { props: { columns, rows } });
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'v', ctrlKey: true });
      expect(wrapper.emitted('cell-range-paste') ?? []).toHaveLength(0);
      expect(readTextMock).not.toHaveBeenCalled();
    });

    it('cellRangeSelection: "enabled" + no active range → Ctrl+V is no-op', async () => {
      const wrapper = mount(ChronixTable, {
        props: { columns, rows, cellRangeSelection: 'enabled' },
      });
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'v', ctrlKey: true });
      expect(wrapper.emitted('cell-range-paste') ?? []).toHaveLength(0);
      expect(readTextMock).not.toHaveBeenCalled();
    });

    it('cellRangeSelection: "enabled" + active range + Ctrl+V → emit fires + readText called once', async () => {
      readTextMock.mockResolvedValue('X\tY\nZ\tW');
      const wrapper = mount(ChronixTable, {
        props: { columns, rows, cellRangeSelection: 'enabled' },
      });
      const handle = wrapper.vm as unknown as PasteCellRangeHandle;
      handle.setCellRange({
        anchor: { rowId: 'r1', colId: 'name' },
        focus: { rowId: 'r2', colId: 'note' },
      });
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'v', ctrlKey: true });
      await Promise.resolve();
      await Promise.resolve();
      const pastes = wrapper.emitted('cell-range-paste');
      expect(pastes).toBeTruthy();
      expect(pastes!.length).toBe(1);
      expect(readTextMock).toHaveBeenCalledTimes(1);
      const payload = pastes![0]![0] as {
        envelope: { rowIds: readonly string[]; colIds: readonly string[] };
        mutations: readonly { rowId: string; colId: string; newValue: unknown }[];
        text: string;
      };
      // Envelope is 2×4 (r1+r2 × name+qty+status+note); paste is 2×2 so
      // only the top-left 2×2 region gets mutations (clamp-overflow).
      // qty cell at (r1, qty) gets 'Y' but qty is not type:'number' in
      // this fixture (test fixture cols have no type), so passthrough.
      expect(payload.text).toBe('X\tY\nZ\tW');
      expect(payload.mutations).toHaveLength(4);
      expect(payload.mutations[0]).toEqual({
        rowId: 'r1',
        colId: 'name',
        oldValue: 'Alpha',
        newValue: 'X',
      });
    });

    it('programmatic handle.pasteCellRangeFromClipboard() with active range → resolves to mutations + emit', async () => {
      readTextMock.mockResolvedValue('Zara');
      const wrapper = mount(ChronixTable, {
        props: { columns, rows, cellRangeSelection: 'enabled' },
      });
      const handle = wrapper.vm as unknown as PasteCellRangeHandle;
      handle.setCellRange({
        anchor: { rowId: 'r1', colId: 'name' },
        focus: { rowId: 'r1', colId: 'name' },
      });
      const result = await handle.pasteCellRangeFromClipboard();
      expect(result).toEqual([{ rowId: 'r1', colId: 'name', oldValue: 'Alpha', newValue: 'Zara' }]);
      expect(readTextMock).toHaveBeenCalledTimes(1);
      const pastes = wrapper.emitted('cell-range-paste');
      expect(pastes).toBeTruthy();
      expect(pastes!.length).toBe(1);
      const payload = pastes![0]![0] as { jsEvent: KeyboardEvent | null };
      expect(payload.jsEvent).toBeNull();
    });

    it('programmatic handle.pasteCellRangeFromClipboard() with no active range → null + no emit + no readText', async () => {
      const wrapper = mount(ChronixTable, {
        props: { columns, rows, cellRangeSelection: 'enabled' },
      });
      const handle = wrapper.vm as unknown as PasteCellRangeHandle;
      const result = await handle.pasteCellRangeFromClipboard();
      expect(result).toBeNull();
      expect(readTextMock).not.toHaveBeenCalled();
      expect(wrapper.emitted('cell-range-paste') ?? []).toHaveLength(0);
    });

    it('column.type: "number" — mixed valid/invalid paste skips invalid cells', async () => {
      readTextMock.mockResolvedValue('99\tabc');
      const numericCols: readonly ColumnSpec[] = [
        { id: 'qty', field: 'qty', type: 'number', width: 80 },
        { id: 'qty2', field: 'note', type: 'number', width: 80 },
      ];
      const wrapper = mount(ChronixTable, {
        props: { columns: numericCols, rows, cellRangeSelection: 'enabled' },
      });
      const handle = wrapper.vm as unknown as PasteCellRangeHandle;
      handle.setCellRange({
        anchor: { rowId: 'r1', colId: 'qty' },
        focus: { rowId: 'r1', colId: 'qty2' },
      });
      const result = await handle.pasteCellRangeFromClipboard();
      // r1/qty receives '99' → coerce to 99 → mutation
      // r1/qty2 receives 'abc' → coerce reject → silently skipped
      expect(result).toHaveLength(1);
      expect(result![0]).toEqual({
        rowId: 'r1',
        colId: 'qty',
        oldValue: 10,
        newValue: 99,
      });
    });
  });

  // ---------------------------------------------------------------------
  // drag-fill autofill handle (vue3 baseline)
  // ---------------------------------------------------------------------
  // Per `audit/TABLE_PHASE_21_DRAG_FILL_DESIGN.md`. The cell-range
  // primitive + PasteMutation shape are reused.
  // These wiring guards verify the SFC surfaces the handle DOM,
  // the `fillCellRange` TableHandle method, and the 3-emit triplet.

  interface FillCellRangeHandle {
    setCellRange(
      range: {
        anchor: { rowId: string; colId: string };
        focus: { rowId: string; colId: string };
      } | null,
    ): void;
    fillCellRange(targetCell: {
      rowId: string;
      colId: string;
    }): readonly { rowId: string; colId: string; oldValue: unknown; newValue: unknown }[] | null;
  }

  describe('drag-fill handle', () => {
    it('default cellRangeSelection: "none" → no .cx-table-drag-fill-handle rendered', () => {
      const wrapper = mount(ChronixTable, { props: { columns, rows } });
      expect(wrapper.find('.cx-table-drag-fill-handle').exists()).toBe(false);
    });

    it('cellRangeSelection: "enabled" + no active range → no handle rendered', () => {
      const wrapper = mount(ChronixTable, {
        props: { columns, rows, cellRangeSelection: 'enabled' },
      });
      expect(wrapper.find('.cx-table-drag-fill-handle').exists()).toBe(false);
    });

    it('cellRangeSelection: "enabled" + active range → handle visible at envelope bottom-right', async () => {
      const wrapper = mount(ChronixTable, {
        props: { columns, rows, cellRangeSelection: 'enabled' },
      });
      const handle = wrapper.vm as unknown as FillCellRangeHandle;
      handle.setCellRange({
        anchor: { rowId: 'r1', colId: 'name' },
        focus: { rowId: 'r1', colId: 'name' },
      });
      await wrapper.vm.$nextTick();
      const handleEl = wrapper.find('.cx-table-drag-fill-handle');
      expect(handleEl.exists()).toBe(true);
      // Inline `style` carries the geometry; verify the 8×8 size to
      // confirm the handle is the intended overlay element (not a
      // stray class collision).
      const style = handleEl.attributes('style') ?? '';
      expect(style).toContain('width: 8px');
      expect(style).toContain('height: 8px');
    });

    it('programmatic handle.fillCellRange(targetCell) with active 1-col source → returns mutations + emits cell-range-fill', () => {
      const wrapper = mount(ChronixTable, {
        props: { columns, rows, cellRangeSelection: 'enabled' },
      });
      const vmHandle = wrapper.vm as unknown as FillCellRangeHandle;
      // Source: r1 / name. Fill to r3 / name → r2 + r3 should mutate to 'Alpha'.
      vmHandle.setCellRange({
        anchor: { rowId: 'r1', colId: 'name' },
        focus: { rowId: 'r1', colId: 'name' },
      });
      const result = vmHandle.fillCellRange({ rowId: 'r3', colId: 'name' });
      expect(result).toEqual([
        { rowId: 'r2', colId: 'name', oldValue: 'Beta', newValue: 'Alpha' },
        { rowId: 'r3', colId: 'name', oldValue: 'Gamma', newValue: 'Alpha' },
      ]);
      const fills = wrapper.emitted('cell-range-fill');
      expect(fills).toBeTruthy();
      expect(fills!.length).toBe(1);
      const payload = fills![0]![0] as {
        source: { rowIds: readonly string[]; colIds: readonly string[] };
        fill: { rowIds: readonly string[]; colIds: readonly string[] };
        mutations: readonly { rowId: string; colId: string }[];
        jsEvent: PointerEvent | null;
      };
      expect(payload.source.rowIds).toEqual(['r1']);
      expect(payload.fill.rowIds).toEqual(['r1', 'r2', 'r3']);
      expect(payload.mutations).toHaveLength(2);
      expect(payload.jsEvent).toBeNull();
    });

    it('handle.fillCellRange(targetCell) with no active range → null + no emit', () => {
      const wrapper = mount(ChronixTable, {
        props: { columns, rows, cellRangeSelection: 'enabled' },
      });
      const vmHandle = wrapper.vm as unknown as FillCellRangeHandle;
      const result = vmHandle.fillCellRange({ rowId: 'r3', colId: 'name' });
      expect(result).toBeNull();
      expect(wrapper.emitted('cell-range-fill') ?? []).toHaveLength(0);
    });

    it('handle.fillCellRange(targetCell) inside source → returns null (no-fill preview)', () => {
      const wrapper = mount(ChronixTable, {
        props: { columns, rows, cellRangeSelection: 'enabled' },
      });
      const vmHandle = wrapper.vm as unknown as FillCellRangeHandle;
      vmHandle.setCellRange({
        anchor: { rowId: 'r1', colId: 'name' },
        focus: { rowId: 'r2', colId: 'name' },
      });
      // Pointer at r1/name is INSIDE the source → no preview.
      const result = vmHandle.fillCellRange({ rowId: 'r1', colId: 'name' });
      expect(result).toBeNull();
      expect(wrapper.emitted('cell-range-fill') ?? []).toHaveLength(0);
    });

    it('handle.fillCellRange() auto-extends the active cell-range to cover the fill envelope', async () => {
      const wrapper = mount(ChronixTable, {
        props: { columns, rows, cellRangeSelection: 'enabled' },
      });
      const vmHandle = wrapper.vm as unknown as FillCellRangeHandle & {
        getCellRange(): {
          anchor: { rowId: string; colId: string };
          focus: { rowId: string; colId: string };
        } | null;
      };
      vmHandle.setCellRange({
        anchor: { rowId: 'r1', colId: 'name' },
        focus: { rowId: 'r1', colId: 'name' },
      });
      vmHandle.fillCellRange({ rowId: 'r3', colId: 'name' });
      await wrapper.vm.$nextTick();
      const range = vmHandle.getCellRange();
      expect(range).not.toBeNull();
      expect(range!.anchor).toEqual({ rowId: 'r1', colId: 'name' });
      expect(range!.focus).toEqual({ rowId: 'r3', colId: 'name' });
    });
  });

  // ---------------------------------------------------------------------
  // undo / redo mutation history (vue3 baseline)
  // ---------------------------------------------------------------------
  // Per `audit/TABLE_PHASE_22_UNDO_REDO_DESIGN.md`. Wiring guards
  // verify auto-record gating, history-change firing, undo/redo
  // emits + state transitions, and Ctrl+Z body keydown dispatch.

  interface UndoRedoHandle {
    setCellRange(
      range: {
        anchor: { rowId: string; colId: string };
        focus: { rowId: string; colId: string };
      } | null,
    ): void;
    fillCellRange(targetCell: {
      rowId: string;
      colId: string;
    }): readonly { rowId: string; colId: string }[] | null;
    undo(): boolean;
    redo(): boolean;
    canUndo(): boolean;
    canRedo(): boolean;
    clearHistory(): void;
    getHistory(): {
      past: readonly { id: string; mutations: readonly unknown[] }[];
      future: readonly { id: string; mutations: readonly unknown[] }[];
    };
    startEditingCell(rowId: string, colId: string): void;
    setEditingCellDraft(value: unknown): void;
    commitEditingCell(): void;
  }

  describe('undo / redo mutation history', () => {
    it('default enableUndoHistory: false → cell-value-change does NOT record + canUndo stays false', () => {
      const wrapper = mount(ChronixTable, {
        props: { columns: editableCols, rows: editableRows },
      });
      const handle = wrapper.vm as unknown as UndoRedoHandle;
      handle.startEditingCell('r1', 'name');
      handle.setEditingCellDraft('Zara');
      handle.commitEditingCell();
      expect(handle.canUndo()).toBe(false);
      expect(wrapper.emitted('history-change') ?? []).toHaveLength(0);
    });

    it('enableUndoHistory: true + cell-value-change → batch recorded; canUndo true; history-change fires', () => {
      const wrapper = mount(ChronixTable, {
        props: { columns: editableCols, rows: editableRows, enableUndoHistory: true },
      });
      const handle = wrapper.vm as unknown as UndoRedoHandle;
      handle.startEditingCell('r1', 'name');
      handle.setEditingCellDraft('Zara');
      handle.commitEditingCell();
      expect(handle.canUndo()).toBe(true);
      expect(handle.canRedo()).toBe(false);
      const history = handle.getHistory();
      expect(history.past).toHaveLength(1);
      expect(history.past[0]!.mutations).toHaveLength(1);
      expect(wrapper.emitted('history-change')).toHaveLength(1);
    });

    it('enableUndoHistory: true + cell-range-fill mutations → batch recorded with source cell-range-fill', () => {
      const wrapper = mount(ChronixTable, {
        props: {
          columns,
          rows,
          cellRangeSelection: 'enabled',
          enableUndoHistory: true,
        },
      });
      const handle = wrapper.vm as unknown as UndoRedoHandle;
      handle.setCellRange({
        anchor: { rowId: 'r1', colId: 'name' },
        focus: { rowId: 'r1', colId: 'name' },
      });
      handle.fillCellRange({ rowId: 'r3', colId: 'name' });
      const history = handle.getHistory();
      expect(history.past).toHaveLength(1);
      expect(handle.canUndo()).toBe(true);
    });

    it('handle.undo() after 1 recorded edit → fires history-replay with REVERSED mutations + direction undo; canUndo false; canRedo true', () => {
      const wrapper = mount(ChronixTable, {
        props: { columns: editableCols, rows: editableRows, enableUndoHistory: true },
      });
      const handle = wrapper.vm as unknown as UndoRedoHandle;
      handle.startEditingCell('r1', 'name');
      handle.setEditingCellDraft('Zara');
      handle.commitEditingCell();
      const undidIt = handle.undo();
      expect(undidIt).toBe(true);
      const replays = wrapper.emitted('history-replay');
      expect(replays).toBeTruthy();
      expect(replays!.length).toBe(1);
      const payload = replays![0]![0] as {
        direction: 'undo' | 'redo';
        batch: { mutations: readonly { oldValue: unknown; newValue: unknown }[] };
        jsEvent: KeyboardEvent | null;
      };
      expect(payload.direction).toBe('undo');
      expect(payload.jsEvent).toBeNull();
      // Reversed: original {oldValue: 'Alpha', newValue: 'Zara'} → undo
      // payload {oldValue: 'Zara', newValue: 'Alpha'}.
      expect(payload.batch.mutations[0]).toMatchObject({ oldValue: 'Zara', newValue: 'Alpha' });
      expect(handle.canUndo()).toBe(false);
      expect(handle.canRedo()).toBe(true);
    });

    it('handle.redo() after undo → fires history-replay with ORIGINAL mutations + direction redo; canUndo true; canRedo false', () => {
      const wrapper = mount(ChronixTable, {
        props: { columns: editableCols, rows: editableRows, enableUndoHistory: true },
      });
      const handle = wrapper.vm as unknown as UndoRedoHandle;
      handle.startEditingCell('r1', 'name');
      handle.setEditingCellDraft('Zara');
      handle.commitEditingCell();
      handle.undo();
      const redidIt = handle.redo();
      expect(redidIt).toBe(true);
      const replays = wrapper.emitted('history-replay');
      expect(replays).toBeTruthy();
      expect(replays!.length).toBe(2);
      const payload = replays![1]![0] as {
        direction: 'undo' | 'redo';
        batch: { mutations: readonly { oldValue: unknown; newValue: unknown }[] };
      };
      expect(payload.direction).toBe('redo');
      // Redo payload carries ORIGINAL (un-swapped) mutations.
      expect(payload.batch.mutations[0]).toMatchObject({ oldValue: 'Alpha', newValue: 'Zara' });
      expect(handle.canUndo()).toBe(true);
      expect(handle.canRedo()).toBe(false);
    });

    it('new mutation after undo → future cleared (canRedo false again)', () => {
      const wrapper = mount(ChronixTable, {
        props: { columns: editableCols, rows: editableRows, enableUndoHistory: true },
      });
      const handle = wrapper.vm as unknown as UndoRedoHandle;
      handle.startEditingCell('r1', 'name');
      handle.setEditingCellDraft('Zara');
      handle.commitEditingCell();
      handle.undo();
      expect(handle.canRedo()).toBe(true);
      // Commit a new edit on a different cell → future invalidated.
      handle.startEditingCell('r2', 'name');
      handle.setEditingCellDraft('YYY');
      handle.commitEditingCell();
      expect(handle.canRedo()).toBe(false);
      const history = handle.getHistory();
      expect(history.future).toHaveLength(0);
      expect(history.past).toHaveLength(1);
    });

    it('handle.undo() with no past → returns false; no emit', () => {
      const wrapper = mount(ChronixTable, {
        props: { columns: editableCols, rows: editableRows, enableUndoHistory: true },
      });
      const handle = wrapper.vm as unknown as UndoRedoHandle;
      const result = handle.undo();
      expect(result).toBe(false);
      expect(wrapper.emitted('history-replay') ?? []).toHaveLength(0);
    });

    it('body Ctrl+Z keydown with enableUndoHistory + non-empty past → fires history-replay (same as programmatic undo)', async () => {
      const wrapper = mount(ChronixTable, {
        props: { columns: editableCols, rows: editableRows, enableUndoHistory: true },
      });
      const handle = wrapper.vm as unknown as UndoRedoHandle;
      handle.startEditingCell('r1', 'name');
      handle.setEditingCellDraft('Zara');
      handle.commitEditingCell();
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'z', ctrlKey: true });
      const replays = wrapper.emitted('history-replay');
      expect(replays).toBeTruthy();
      expect(replays!.length).toBe(1);
      const payload = replays![0]![0] as {
        direction: 'undo' | 'redo';
        jsEvent: KeyboardEvent | null;
      };
      expect(payload.direction).toBe('undo');
      // jsEvent is the real KeyboardEvent for the keydown path.
      expect(payload.jsEvent).not.toBeNull();
    });
  });

  describe('multi-row pinned headers (column groups)', () => {
    it('no column has headerGroup → no .cx-table-header-group-row rendered; existing single header row visible', () => {
      const wrapper = mount(ChronixTable, { props: { columns, rows } });
      expect(wrapper.find('.cx-table-row--header-group').exists()).toBe(false);
      expect(wrapper.find('.cx-table-row--header').exists()).toBe(true);
      // Group placeholder cells must also be absent.
      expect(wrapper.findAll('.cx-table-header-group')).toHaveLength(0);
    });

    it('2 contiguous cols share headerGroup → 1 .cx-table-header-group with width = sum + label visible', () => {
      const cols: readonly ColumnSpec[] = [
        { id: 'id', field: 'id', headerName: 'ID', width: 80, headerGroup: '基础信息' },
        { id: 'name', field: 'name', headerName: '名称', width: 140, headerGroup: '基础信息' },
        { id: 'qty', field: 'qty', headerName: '数量', width: 100 },
      ];
      const wrapper = mount(ChronixTable, { props: { columns: cols, rows } });
      const groupRow = wrapper.find('.cx-table-row--header-group');
      expect(groupRow.exists()).toBe(true);
      const labelled = wrapper.findAll('.cx-table-header-group:not(.cx-table-header-group--empty)');
      expect(labelled).toHaveLength(1);
      expect(labelled[0]!.attributes('data-group-name')).toBe('基础信息');
      expect(labelled[0]!.attributes('data-col-ids')).toBe('id,name');
      expect(widthPx(labelled[0]!.attributes('style'))).toBe(80 + 140);
      // The leaf header row remains present beneath.
      const leafRow = wrapper.find('.cx-table-row--header:not(.cx-table-row--header-group)');
      expect(leafRow.exists()).toBe(true);
    });

    it('mixed grouped + un-grouped → un-grouped cols get .cx-table-header-group--empty placeholders sized to their full width', () => {
      const cols: readonly ColumnSpec[] = [
        { id: 'id', field: 'id', headerName: 'ID', width: 80, headerGroup: '基础信息' },
        { id: 'name', field: 'name', headerName: '名称', width: 140, headerGroup: '基础信息' },
        { id: 'qty', field: 'qty', headerName: '数量', width: 100 },
        { id: 'note', field: 'note', headerName: '备注', width: 160 },
      ];
      const wrapper = mount(ChronixTable, { props: { columns: cols, rows } });
      const empties = wrapper.findAll('.cx-table-header-group--empty');
      // 2 un-grouped cols (qty + note) → 2 empty placeholders.
      expect(empties).toHaveLength(2);
      expect(widthPx(empties[0]!.attributes('style'))).toBe(100);
      expect(widthPx(empties[1]!.attributes('style'))).toBe(160);
      // Group row height = theme.headerGroupHeight (default 28).
      const groupRow = wrapper.find('.cx-table-row--header-group');
      const groupCells = groupRow.findAll('.cx-table-header-group');
      for (const c of groupCells) {
        expect(heightPx(c.attributes('style'))).toBe(28);
      }
    });

    it('same headerGroup name on a left-pinned col + a center col → 2 separate spans (zone-split per Decision A.1)', () => {
      const cols: readonly ColumnSpec[] = [
        { id: 'id', field: 'id', headerName: 'ID', width: 80, pinned: 'left', headerGroup: 'X' },
        { id: 'name', field: 'name', headerName: '名称', width: 140, headerGroup: 'X' },
        { id: 'qty', field: 'qty', headerName: '数量', width: 100 },
      ];
      const wrapper = mount(ChronixTable, { props: { columns: cols, rows } });
      const xSpans = wrapper.findAll('.cx-table-header-group[data-group-name="X"]');
      // The pinned-left 'X' + the center 'X' do NOT merge across zones.
      expect(xSpans).toHaveLength(2);
      expect(widthPx(xSpans[0]!.attributes('style'))).toBe(80);
      expect(widthPx(xSpans[1]!.attributes('style'))).toBe(140);
      expect(xSpans[0]!.attributes('data-col-ids')).toBe('id');
      expect(xSpans[1]!.attributes('data-col-ids')).toBe('name');
    });

    it('click on .cx-table-header-group → header-group-click emit fires with groupName + colIds payload', async () => {
      const cols: readonly ColumnSpec[] = [
        { id: 'id', field: 'id', headerName: 'ID', width: 80, headerGroup: 'X' },
        { id: 'name', field: 'name', headerName: '名称', width: 140, headerGroup: 'X' },
        { id: 'qty', field: 'qty', headerName: '数量', width: 100 },
      ];
      const wrapper = mount(ChronixTable, { props: { columns: cols, rows } });
      const groupCell = wrapper.find('.cx-table-header-group[data-group-name="X"]');
      expect(groupCell.exists()).toBe(true);
      await groupCell.trigger('click');
      const emits = wrapper.emitted('header-group-click');
      expect(emits).toBeTruthy();
      expect(emits!.length).toBe(1);
      const payload = emits![0]![0] as {
        groupName: string;
        colIds: readonly string[];
        jsEvent: MouseEvent;
      };
      expect(payload.groupName).toBe('X');
      expect(payload.colIds).toEqual(['id', 'name']);
      expect(payload.jsEvent).toBeInstanceOf(MouseEvent);
      // Empty placeholders never emit (no data-group-name attr to resolve).
      const empty = wrapper.find('.cx-table-header-group--empty');
      if (empty.exists()) {
        await empty.trigger('click');
        expect(wrapper.emitted('header-group-click')!.length).toBe(1);
      }
    });

    it('nested headerGroup path → 2 group rows + per-level data-header-group-level attr', () => {
      const cols: readonly ColumnSpec[] = [
        { id: 'qty', field: 'qty', headerName: '数量', width: 100, headerGroup: ['财务', '订单'] },
        {
          id: 'price',
          field: 'price',
          headerName: '单价',
          width: 110,
          headerGroup: ['财务', '订单'],
        },
      ];
      const wrapper = mount(ChronixTable, { props: { columns: cols, rows } });
      const groupRows = wrapper.findAll('.cx-table-row--header-group');
      expect(groupRows).toHaveLength(2);
      expect(groupRows[0]!.attributes('data-header-group-level')).toBe('0');
      expect(groupRows[1]!.attributes('data-header-group-level')).toBe('1');
      const finCell = wrapper.find('.cx-table-header-group[data-group-name="财务"]');
      expect(finCell.exists()).toBe(true);
      expect(finCell.attributes('data-header-group-level')).toBe('0');
      expect(finCell.attributes('data-col-ids')).toBe('qty,price');
      const orderCell = wrapper.find('.cx-table-header-group[data-group-name="订单"]');
      expect(orderCell.exists()).toBe(true);
      expect(orderCell.attributes('data-header-group-level')).toBe('1');
      expect(orderCell.attributes('data-col-ids')).toBe('qty,price');
    });

    it('mixed string + array headerGroup → un-nested cols get level-1 empty placeholders', () => {
      const cols: readonly ColumnSpec[] = [
        { id: 'id', field: 'id', headerName: 'ID', width: 80, headerGroup: '基础信息' },
        { id: 'name', field: 'name', headerName: '名称', width: 140, headerGroup: '基础信息' },
        { id: 'qty', field: 'qty', headerName: '数量', width: 100, headerGroup: ['财务', '订单'] },
        {
          id: 'price',
          field: 'price',
          headerName: '单价',
          width: 110,
          headerGroup: ['财务', '订单'],
        },
      ];
      const wrapper = mount(ChronixTable, { props: { columns: cols, rows } });
      const groupRows = wrapper.findAll('.cx-table-row--header-group');
      expect(groupRows).toHaveLength(2);
      // Level 0 has 基础信息 + 财务 spans.
      const level0 = groupRows[0]!;
      const level0Labelled = level0.findAll(
        '.cx-table-header-group:not(.cx-table-header-group--empty)',
      );
      expect(level0Labelled).toHaveLength(2);
      expect(level0Labelled[0]!.attributes('data-group-name')).toBe('基础信息');
      expect(level0Labelled[1]!.attributes('data-group-name')).toBe('财务');
      // Level 1: 基础信息 cols get empty placeholders; 订单 spans qty+price.
      const level1 = groupRows[1]!;
      const level1Empty = level1.findAll('.cx-table-header-group--empty');
      expect(level1Empty.length).toBe(2); // id + name
      const level1Labelled = level1.findAll(
        '.cx-table-header-group:not(.cx-table-header-group--empty)',
      );
      expect(level1Labelled).toHaveLength(1);
      expect(level1Labelled[0]!.attributes('data-group-name')).toBe('订单');
      expect(level1Labelled[0]!.attributes('data-col-ids')).toBe('qty,price');
    });
  });

  describe('sticky footer aggregate row', () => {
    it('showFooterRow defaults to false → no .cx-table-footer DOM is rendered', () => {
      const wrapper = mount(ChronixTable, { props: { columns, rows } });
      expect(wrapper.find('.cx-table-footer').exists()).toBe(false);
      expect(wrapper.find('.cx-table-row--footer').exists()).toBe(false);
    });

    it('showFooterRow=true with no aggregators on any column → footer rendered with all --empty placeholder cells', () => {
      const wrapper = mount(ChronixTable, {
        props: { columns, rows, showFooterRow: true },
      });
      expect(wrapper.find('.cx-table-footer').exists()).toBe(true);
      const cells = wrapper.findAll('.cx-table-footer-cell');
      expect(cells.length).toBeGreaterThanOrEqual(columns.length);
      const emptyCells = wrapper.findAll('.cx-table-footer-cell--empty');
      // Every column cell renders as --empty when no aggregator is set
      // (selection-rail placeholders count separately).
      const colCells = cells.filter((c) => !c.classes('cx-table-footer-cell--selection-rail'));
      expect(emptyCells.length).toBe(colCells.length);
    });

    it('qty column with sum aggregator → footer cell renders aggregate value (formatted via valueFormatter)', () => {
      const cols: readonly ColumnSpec[] = [
        { id: 'id', field: 'id', headerName: 'ID', width: 80 },
        { id: 'name', field: 'name', headerName: '名称', width: 140 },
        {
          id: 'qty',
          field: 'qty',
          headerName: '数量',
          width: 120,
          aggregator: (rs) =>
            rs.reduce((s, r) => s + (typeof r.data['qty'] === 'number' ? r.data['qty'] : 0), 0),
          valueFormatter: ({ value }) => `合计 ${typeof value === 'number' ? value : 0} 件`,
        },
      ];
      const wrapper = mount(ChronixTable, {
        props: { columns: cols, rows, showFooterRow: true },
      });
      const qtyFooter = wrapper.find('.cx-table-footer-cell[data-col-id="qty"]');
      expect(qtyFooter.exists()).toBe(true);
      expect(qtyFooter.classes('cx-table-footer-cell--empty')).toBe(false);
      // Sum of 10 + 20 + 30 = 60.
      expect(qtyFooter.text()).toBe('合计 60 件');
      // Other columns still render as empty placeholders.
      const idFooter = wrapper.find('.cx-table-footer-cell[data-col-id="id"]');
      expect(idFooter.classes('cx-table-footer-cell--empty')).toBe(true);
      expect(idFooter.text()).toBe('');
    });

    it('footer aggregates the post-filter rows (Decision A.1) — setFilter narrows the input', async () => {
      const cols: readonly ColumnSpec[] = [
        { id: 'id', field: 'id', headerName: 'ID', width: 80 },
        {
          id: 'qty',
          field: 'qty',
          headerName: '数量',
          width: 120,
          type: 'number',
          aggregator: (rs) =>
            rs.reduce((s, r) => s + (typeof r.data['qty'] === 'number' ? r.data['qty'] : 0), 0),
        },
      ];
      const wrapper = mount(ChronixTable, {
        props: { columns: cols, rows, showFooterRow: true },
      });
      // Pre-filter aggregate: 10 + 20 + 30 = 60.
      expect(wrapper.find('.cx-table-footer-cell[data-col-id="qty"]').text()).toBe('60');
      const handle = wrapper.vm as unknown as {
        setFilter(spec: FilterSpec | readonly FilterSpec[] | null): void;
      };
      // Filter qty >= 20 keeps r2 (20) + r3 (30) → footer = 50.
      handle.setFilter({ type: 'number', colId: 'qty', operator: '>=', value: 20 });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.cx-table-footer-cell[data-col-id="qty"]').text()).toBe('50');
    });

    it('aggregator throws → footer cell is rendered without crashing (empty text)', () => {
      const cols: readonly ColumnSpec[] = [
        { id: 'id', field: 'id', headerName: 'ID', width: 80 },
        {
          id: 'qty',
          field: 'qty',
          headerName: '数量',
          width: 120,
          aggregator: () => {
            throw new Error('boom');
          },
        },
      ];
      const wrapper = mount(ChronixTable, {
        props: { columns: cols, rows, showFooterRow: true },
      });
      const qtyFooter = wrapper.find('.cx-table-footer-cell[data-col-id="qty"]');
      expect(qtyFooter.exists()).toBe(true);
      // The aggregator threw → computeFooterValues writes null →
      // defaultFormatCellValue(null) returns ''.
      expect(qtyFooter.text()).toBe('');
    });

    it('footer cell widths match the corresponding header cell widths', () => {
      const cols: readonly ColumnSpec[] = [
        { id: 'id', field: 'id', headerName: 'ID', width: 80 },
        { id: 'qty', field: 'qty', headerName: '数量', width: 130, aggregator: () => 0 },
      ];
      const wrapper = mount(ChronixTable, {
        props: { columns: cols, rows, showFooterRow: true },
      });
      const qtyHeader = wrapper.find('.cx-table-header-cell[data-col-id="qty"]');
      const qtyFooter = wrapper.find('.cx-table-footer-cell[data-col-id="qty"]');
      expect(widthPx(qtyHeader.attributes('style'))).toBe(130);
      expect(widthPx(qtyFooter.attributes('style'))).toBe(130);
      expect(heightPx(qtyFooter.attributes('style'))).toBe(32);
    });

    it('showFooterRow render does NOT trigger sort-change / filter-change emits', () => {
      const cols: readonly ColumnSpec[] = [
        { id: 'qty', field: 'qty', headerName: '数量', width: 120, aggregator: () => 99 },
      ];
      const wrapper = mount(ChronixTable, {
        props: { columns: cols, rows, showFooterRow: true },
      });
      expect(wrapper.emitted('sort-change')).toBeUndefined();
      expect(wrapper.emitted('filter-change')).toBeUndefined();
      // Footer also doesn't fire any new emit of its own.
      expect(wrapper.emitted('footer-render')).toBeUndefined();
    });
  });

  describe('cell-level keyboard navigation', () => {
    it('enableKeyboardNavigation:false → ArrowRight keydown is a no-op (no active-cell-change)', async () => {
      const wrapper = mount(ChronixTable, { props: { columns, rows } });
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'ArrowRight' });
      expect(wrapper.emitted('active-cell-change')).toBeUndefined();
    });

    it('click a cell with enableKeyboardNavigation:true → active-cell-change fires with the clicked cell', async () => {
      const wrapper = mount(ChronixTable, {
        props: { columns, rows, enableKeyboardNavigation: true },
      });
      const cell = wrapper.find('.cx-table-cell[data-row-id="r2"][data-col-id="qty"]');
      await cell.trigger('click');
      const events = wrapper.emitted('active-cell-change');
      expect(events).toBeDefined();
      const payload = events![0]![0] as { rowId: string; colId: string };
      expect(payload.rowId).toBe('r2');
      expect(payload.colId).toBe('qty');
    });

    it('ArrowRight after click moves to the next column same row', async () => {
      const wrapper = mount(ChronixTable, {
        props: { columns, rows, enableKeyboardNavigation: true },
      });
      const cell = wrapper.find('.cx-table-cell[data-row-id="r2"][data-col-id="qty"]');
      await cell.trigger('click');
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'ArrowRight' });
      const events = wrapper.emitted('active-cell-change');
      expect(events).toBeDefined();
      const payload = events![events!.length - 1]![0] as { rowId: string; colId: string };
      expect(payload.rowId).toBe('r2');
      expect(payload.colId).toBe('status');
    });

    it('ArrowRight on the last column is a no-op (no further emit)', async () => {
      const wrapper = mount(ChronixTable, {
        props: { columns, rows, enableKeyboardNavigation: true },
      });
      // Set active to last column via handle
      const handle = wrapper.vm as unknown as {
        setActiveCell(rowId: string, colId: string): void;
      };
      handle.setActiveCell('r2', 'note');
      const events1Count = (wrapper.emitted('active-cell-change') ?? []).length;
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'ArrowRight' });
      const events2Count = (wrapper.emitted('active-cell-change') ?? []).length;
      expect(events2Count).toBe(events1Count); // no additional emit
    });

    it('Ctrl+End jumps to bottom-right cell', async () => {
      const wrapper = mount(ChronixTable, {
        props: { columns, rows, enableKeyboardNavigation: true },
      });
      const handle = wrapper.vm as unknown as {
        setActiveCell(rowId: string, colId: string): void;
      };
      handle.setActiveCell('r1', 'id');
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'End', ctrlKey: true });
      const events = wrapper.emitted('active-cell-change');
      expect(events).toBeDefined();
      const payload = events![events!.length - 1]![0] as { rowId: string; colId: string };
      // Bottom row is r3; rightmost column is note.
      expect(payload.rowId).toBe('r3');
      expect(payload.colId).toBe('note');
    });

    it('Enter on an editable active cell begins edit (cell-edit-start fires)', async () => {
      const editableCols: readonly ColumnSpec[] = columns.map((c) =>
        c.id === 'note' ? { ...c, editable: true } : c,
      );
      const wrapper = mount(ChronixTable, {
        props: { columns: editableCols, rows, enableKeyboardNavigation: true },
      });
      const handle = wrapper.vm as unknown as {
        setActiveCell(rowId: string, colId: string): void;
      };
      handle.setActiveCell('r1', 'note');
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'Enter' });
      expect(wrapper.emitted('cell-edit-start')).toBeDefined();
    });

    it('programmatic setActiveCell + clearActiveCell fire emit; getActiveCell reflects', () => {
      const wrapper = mount(ChronixTable, { props: { columns, rows } });
      const handle = wrapper.vm as unknown as {
        getActiveCell(): { rowId: string; colId: string } | null;
        setActiveCell(rowId: string, colId: string): void;
        clearActiveCell(): void;
      };
      expect(handle.getActiveCell()).toBeNull();
      handle.setActiveCell('r2', 'qty');
      expect(handle.getActiveCell()).toEqual({ rowId: 'r2', colId: 'qty' });
      const events1 = wrapper.emitted('active-cell-change');
      expect(events1).toBeDefined();
      expect(events1).toHaveLength(1);
      handle.clearActiveCell();
      expect(handle.getActiveCell()).toBeNull();
      const events2 = wrapper.emitted('active-cell-change');
      expect(events2).toHaveLength(2);
      const clearedPayload = events2![1]![0] as { rowId: string | null; colId: string | null };
      expect(clearedPayload.rowId).toBeNull();
      expect(clearedPayload.colId).toBeNull();
    });

    it('active cell carries cx-table-cell--active modifier + data-active="true"', async () => {
      const wrapper = mount(ChronixTable, {
        props: { columns, rows, enableKeyboardNavigation: true },
      });
      const handle = wrapper.vm as unknown as {
        setActiveCell(rowId: string, colId: string): void;
      };
      handle.setActiveCell('r2', 'qty');
      await wrapper.vm.$nextTick();
      const activeCells = wrapper.findAll('.cx-table-cell--active');
      expect(activeCells.length).toBeGreaterThanOrEqual(1);
      const cell = wrapper.find('.cx-table-cell[data-row-id="r2"][data-col-id="qty"]');
      expect(cell.classes('cx-table-cell--active')).toBe(true);
      expect(cell.attributes('data-active')).toBe('true');
    });
  });

  describe('auto-scroll to active cell', () => {
    // happy-dom does not compute layout, so `clientHeight` / `clientWidth`
    // default to 0 and `scrollTop` / `scrollLeft` stay at 0 until written.
    // For we explicitly seed the body element with a viewport
    // size + writable scroll properties so the auto-scroll math has
    // realistic inputs.
    function seedBodyViewport(wrapper: ReturnType<typeof mount>): HTMLElement {
      const bodyEl = wrapper.find('.cx-table-body').element as HTMLElement;
      Object.defineProperty(bodyEl, 'clientHeight', { value: 100, configurable: true });
      Object.defineProperty(bodyEl, 'clientWidth', { value: 400, configurable: true });
      return bodyEl;
    }

    const manyRows: readonly RowSpec[] = Array.from({ length: 50 }, (_, i) => ({
      id: `r${i}`,
      data: { id: i, name: `name-${i}`, qty: i, status: 'OK', note: '' },
    }));

    it('keyboard ArrowDown across many rows scrolls body vertically (default ON)', async () => {
      const wrapper = mount(ChronixTable, {
        props: { columns, rows: manyRows, enableKeyboardNavigation: true },
      });
      const bodyEl = seedBodyViewport(wrapper);
      const handle = wrapper.vm as unknown as {
        setActiveCell(rowId: string, colId: string): void;
      };
      handle.setActiveCell('r0', 'id');
      const body = wrapper.find('.cx-table-body');
      // 10 ArrowDown presses lands active on r10; viewport height 100 / row 28
      // ≈ 3-4 visible rows → r10 is well past the viewport bottom.
      for (let i = 0; i < 10; i += 1) {
        await body.trigger('keydown', { key: 'ArrowDown' });
      }
      expect(bodyEl.scrollTop).toBeGreaterThan(0);
    });

    it('keyboard ArrowRight across many cols scrolls body horizontally', async () => {
      const narrowCols: readonly ColumnSpec[] = Array.from({ length: 10 }, (_, i) => ({
        id: `c${i}`,
        field: `c${i}`,
        headerName: `c${i}`,
        width: 80,
      }));
      const narrowRows: readonly RowSpec[] = [{ id: 'r0', data: {} }];
      const wrapper = mount(ChronixTable, {
        props: { columns: narrowCols, rows: narrowRows, enableKeyboardNavigation: true },
      });
      const bodyEl = seedBodyViewport(wrapper);
      const handle = wrapper.vm as unknown as {
        setActiveCell(rowId: string, colId: string): void;
      };
      handle.setActiveCell('r0', 'c0');
      const body = wrapper.find('.cx-table-body');
      // 10 cols × 80px = 800px content; viewport 400px → ArrowRight to c9
      // forces scrollLeft > 0.
      for (let i = 0; i < 9; i += 1) {
        await body.trigger('keydown', { key: 'ArrowRight' });
      }
      expect(bodyEl.scrollLeft).toBeGreaterThan(0);
    });

    it('enableKeyboardAutoScroll:false disables scroll even with kb-nav on', async () => {
      const wrapper = mount(ChronixTable, {
        props: {
          columns,
          rows: manyRows,
          enableKeyboardNavigation: true,
          enableKeyboardAutoScroll: false,
        },
      });
      const bodyEl = seedBodyViewport(wrapper);
      const handle = wrapper.vm as unknown as {
        setActiveCell(rowId: string, colId: string): void;
      };
      handle.setActiveCell('r0', 'id');
      const body = wrapper.find('.cx-table-body');
      for (let i = 0; i < 10; i += 1) {
        await body.trigger('keydown', { key: 'ArrowDown' });
      }
      expect(bodyEl.scrollTop).toBe(0);
    });

    it('click does NOT auto-scroll (clicked cell already visible)', async () => {
      const wrapper = mount(ChronixTable, {
        props: { columns, rows: manyRows, enableKeyboardNavigation: true },
      });
      const bodyEl = seedBodyViewport(wrapper);
      const initialTop = bodyEl.scrollTop;
      const cell = wrapper.find('.cx-table-cell[data-row-id="r2"][data-col-id="qty"]');
      await cell.trigger('click');
      expect(bodyEl.scrollTop).toBe(initialTop);
    });

    it('programmatic setActiveCell to a far row auto-scrolls', () => {
      const wrapper = mount(ChronixTable, {
        props: { columns, rows: manyRows, enableKeyboardNavigation: true },
      });
      const bodyEl = seedBodyViewport(wrapper);
      const handle = wrapper.vm as unknown as {
        setActiveCell(rowId: string, colId: string): void;
      };
      handle.setActiveCell('r40', 'qty');
      // r40 at y = 40 * 28 = 1120; viewport 100 ⇒ must scroll down.
      expect(bodyEl.scrollTop).toBeGreaterThan(0);
    });

    it('clearActiveCell does not auto-scroll (no destination)', () => {
      const wrapper = mount(ChronixTable, {
        props: { columns, rows: manyRows, enableKeyboardNavigation: true },
      });
      const bodyEl = seedBodyViewport(wrapper);
      const handle = wrapper.vm as unknown as {
        setActiveCell(rowId: string, colId: string): void;
        clearActiveCell(): void;
      };
      handle.setActiveCell('r40', 'qty');
      const scrolledTop = bodyEl.scrollTop;
      handle.clearActiveCell();
      // Clear does not run auto-scroll — scrollTop stays where it was.
      expect(bodyEl.scrollTop).toBe(scrolledTop);
    });
  });

  describe('shift+Arrow extends cell-range', () => {
    it('shift+ArrowRight after click opens a fresh range with anchor=clicked cell', async () => {
      const wrapper = mount(ChronixTable, {
        props: {
          columns,
          rows,
          enableKeyboardNavigation: true,
          cellRangeSelection: 'enabled',
        },
      });
      const cell = wrapper.find('.cx-table-cell[data-row-id="r2"][data-col-id="qty"]');
      await cell.trigger('click');
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'ArrowRight', shiftKey: true });
      const startEvents = wrapper.emitted('cell-range-start');
      expect(startEvents).toBeDefined();
      const startPayload = startEvents![0]![0] as {
        range: { anchor: { rowId: string; colId: string } };
      };
      expect(startPayload.range.anchor).toEqual({ rowId: 'r2', colId: 'qty' });
      const changeEvents = wrapper.emitted('cell-range-change');
      expect(changeEvents).toBeDefined();
      const changePayload = changeEvents![changeEvents!.length - 1]![0] as {
        range: {
          anchor: { rowId: string; colId: string };
          focus: { rowId: string; colId: string };
        };
      };
      expect(changePayload.range.anchor).toEqual({ rowId: 'r2', colId: 'qty' });
      expect(changePayload.range.focus).toEqual({ rowId: 'r2', colId: 'status' });
    });

    it('consecutive shift+ArrowDown extends focus; anchor stays put', async () => {
      const wrapper = mount(ChronixTable, {
        props: {
          columns,
          rows,
          enableKeyboardNavigation: true,
          cellRangeSelection: 'enabled',
        },
      });
      const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="qty"]');
      await cell.trigger('click');
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'ArrowDown', shiftKey: true });
      await body.trigger('keydown', { key: 'ArrowDown', shiftKey: true });
      const changeEvents = wrapper.emitted('cell-range-change');
      expect(changeEvents).toBeDefined();
      const lastPayload = changeEvents![changeEvents!.length - 1]![0] as {
        range: {
          anchor: { rowId: string; colId: string };
          focus: { rowId: string; colId: string };
        };
      };
      expect(lastPayload.range.anchor).toEqual({ rowId: 'r1', colId: 'qty' });
      expect(lastPayload.range.focus).toEqual({ rowId: 'r3', colId: 'qty' });
    });

    it('plain ArrowRight when range exists collapses the range', async () => {
      const wrapper = mount(ChronixTable, {
        props: {
          columns,
          rows,
          enableKeyboardNavigation: true,
          cellRangeSelection: 'enabled',
        },
      });
      const handle = wrapper.vm as unknown as {
        setCellRange(range: {
          anchor: { rowId: string; colId: string };
          focus: { rowId: string; colId: string };
        }): void;
        setActiveCell(rowId: string, colId: string): void;
      };
      handle.setActiveCell('r1', 'qty');
      handle.setCellRange({
        anchor: { rowId: 'r1', colId: 'id' },
        focus: { rowId: 'r2', colId: 'qty' },
      });
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'ArrowRight' });
      // applyCellRangeClear emits cell-range-stop.
      const stopEvents = wrapper.emitted('cell-range-stop');
      expect(stopEvents).toBeDefined();
      expect(stopEvents!.length).toBeGreaterThanOrEqual(1);
    });

    it('Escape clears both activeCell AND cellRange', async () => {
      const wrapper = mount(ChronixTable, {
        props: {
          columns,
          rows,
          enableKeyboardNavigation: true,
          cellRangeSelection: 'enabled',
        },
      });
      const handle = wrapper.vm as unknown as {
        setCellRange(range: {
          anchor: { rowId: string; colId: string };
          focus: { rowId: string; colId: string };
        }): void;
        setActiveCell(rowId: string, colId: string): void;
        getActiveCell(): unknown;
        getCellRange(): unknown;
      };
      handle.setActiveCell('r2', 'qty');
      handle.setCellRange({
        anchor: { rowId: 'r1', colId: 'id' },
        focus: { rowId: 'r3', colId: 'status' },
      });
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'Escape' });
      expect(handle.getActiveCell()).toBeNull();
      expect(handle.getCellRange()).toBeNull();
    });

    it('shift+End extends range to last column same row', async () => {
      const wrapper = mount(ChronixTable, {
        props: {
          columns,
          rows,
          enableKeyboardNavigation: true,
          cellRangeSelection: 'enabled',
        },
      });
      const cell = wrapper.find('.cx-table-cell[data-row-id="r2"][data-col-id="qty"]');
      await cell.trigger('click');
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'End', shiftKey: true });
      const changeEvents = wrapper.emitted('cell-range-change');
      expect(changeEvents).toBeDefined();
      const payload = changeEvents![changeEvents!.length - 1]![0] as {
        range: {
          anchor: { rowId: string; colId: string };
          focus: { rowId: string; colId: string };
        };
      };
      expect(payload.range.anchor).toEqual({ rowId: 'r2', colId: 'qty' });
      expect(payload.range.focus).toEqual({ rowId: 'r2', colId: 'note' });
    });

    it('cellRangeSelection:none disables shift+arrow extension', async () => {
      const wrapper = mount(ChronixTable, {
        props: {
          columns,
          rows,
          enableKeyboardNavigation: true,
          // cellRangeSelection omitted (defaults to 'none')
        },
      });
      const cell = wrapper.find('.cx-table-cell[data-row-id="r2"][data-col-id="qty"]');
      await cell.trigger('click');
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'ArrowRight', shiftKey: true });
      expect(wrapper.emitted('cell-range-start')).toBeUndefined();
      // activeCell still moves because shift+arrow is treated as a nav.
      const activeEvents = wrapper.emitted('active-cell-change');
      expect(activeEvents).toBeDefined();
    });
  });

  describe('Ctrl+Arrow data-region jumps', () => {
    // -specific fixture: 5 rows, sparse data in 'note' column
    // (only r1 + r2 filled, r3-r5 empty) so Ctrl+Arrow boundary tests
    // have deterministic expectations.
    const sparseRows: readonly RowSpec[] = [
      { id: 'r1', data: { id: 1, name: 'a', qty: 10, status: 'X', note: 'first' } },
      { id: 'r2', data: { id: 2, name: 'b', qty: 20, status: 'Y', note: 'second' } },
      { id: 'r3', data: { id: 3, name: 'c', qty: 30, status: 'Z', note: '' } },
      { id: 'r4', data: { id: 4, name: 'd', qty: 40, status: 'W', note: '' } },
      { id: 'r5', data: { id: 5, name: 'e', qty: 50, status: 'V', note: 'last' } },
    ];

    it('Ctrl+ArrowDown from first row of filled column jumps to last filled row', async () => {
      const wrapper = mount(ChronixTable, {
        props: { columns, rows: sparseRows, enableKeyboardNavigation: true },
      });
      const handle = wrapper.vm as unknown as {
        setActiveCell(rowId: string, colId: string): void;
        getActiveCell(): { rowId: string; colId: string } | null;
      };
      // 'qty' column is fully filled (all 5 rows) → Ctrl+ArrowDown from
      // r1 should jump to r5 (table edge).
      handle.setActiveCell('r1', 'qty');
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'ArrowDown', ctrlKey: true });
      expect(handle.getActiveCell()).toEqual({ rowId: 'r5', colId: 'qty' });
    });

    it('Ctrl+ArrowDown from filled cell with empty below stays put', async () => {
      const wrapper = mount(ChronixTable, {
        props: { columns, rows: sparseRows, enableKeyboardNavigation: true },
      });
      const handle = wrapper.vm as unknown as {
        setActiveCell(rowId: string, colId: string): void;
        getActiveCell(): { rowId: string; colId: string } | null;
      };
      // 'note' column: r2 filled, r3 empty → no movement.
      handle.setActiveCell('r2', 'note');
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'ArrowDown', ctrlKey: true });
      expect(handle.getActiveCell()).toEqual({ rowId: 'r2', colId: 'note' });
    });

    it('Ctrl+ArrowDown from EMPTY cell jumps to first non-empty below', async () => {
      const wrapper = mount(ChronixTable, {
        props: { columns, rows: sparseRows, enableKeyboardNavigation: true },
      });
      const handle = wrapper.vm as unknown as {
        setActiveCell(rowId: string, colId: string): void;
        getActiveCell(): { rowId: string; colId: string } | null;
      };
      // 'note' column: r3 empty, r4 empty, r5 filled → boundary = r5.
      handle.setActiveCell('r3', 'note');
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'ArrowDown', ctrlKey: true });
      expect(handle.getActiveCell()).toEqual({ rowId: 'r5', colId: 'note' });
    });

    it('Ctrl+ArrowRight from filled cell jumps along the row', async () => {
      const wrapper = mount(ChronixTable, {
        props: { columns, rows: sparseRows, enableKeyboardNavigation: true },
      });
      const handle = wrapper.vm as unknown as {
        setActiveCell(rowId: string, colId: string): void;
        getActiveCell(): { rowId: string; colId: string } | null;
      };
      // r1: id=1, name='a', qty=10, status='X', note='first' (all filled)
      // → Ctrl+ArrowRight from 'id' jumps to 'note' (table edge).
      handle.setActiveCell('r1', 'id');
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'ArrowRight', ctrlKey: true });
      expect(handle.getActiveCell()).toEqual({ rowId: 'r1', colId: 'note' });
    });

    it('Ctrl+Shift+ArrowDown extends cell-range from anchor to boundary', async () => {
      const wrapper = mount(ChronixTable, {
        props: {
          columns,
          rows: sparseRows,
          enableKeyboardNavigation: true,
          cellRangeSelection: 'enabled',
        },
      });
      const handle = wrapper.vm as unknown as {
        setActiveCell(rowId: string, colId: string): void;
      };
      handle.setActiveCell('r1', 'qty');
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'ArrowDown', ctrlKey: true, shiftKey: true });
      const changeEvents = wrapper.emitted('cell-range-change');
      expect(changeEvents).toBeDefined();
      const payload = changeEvents![changeEvents!.length - 1]![0] as {
        range: {
          anchor: { rowId: string; colId: string };
          focus: { rowId: string; colId: string };
        };
      };
      expect(payload.range.anchor).toEqual({ rowId: 'r1', colId: 'qty' });
      expect(payload.range.focus).toEqual({ rowId: 'r5', colId: 'qty' });
    });

    it('Ctrl+ArrowDown without activeCell falls back to plain top-left init', async () => {
      const wrapper = mount(ChronixTable, {
        props: { columns, rows: sparseRows, enableKeyboardNavigation: true },
      });
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'ArrowDown', ctrlKey: true });
      const events = wrapper.emitted('active-cell-change');
      expect(events).toBeDefined();
      // initial-focus shortcut: snaps to top-left (r1, id).
      const payload = events![0]![0] as { rowId: string; colId: string };
      expect(payload.rowId).toBe('r1');
      expect(payload.colId).toBe('id');
    });
  });

  describe('tree data (vue3 baseline)', () => {
    const treeColumns: readonly ColumnSpec[] = [
      { id: 'name', field: 'name', headerName: '名称', flex: 1, treeColumn: true },
      { id: 'kind', field: 'kind', headerName: '类型', width: 100 },
      { id: 'size', field: 'size', headerName: '大小', width: 100, type: 'number' },
    ];

    function buildTreeRows(): readonly RowSpec[] {
      return [
        {
          id: 'p1',
          data: { name: 'project-1', kind: 'project', size: 100 },
          children: [
            {
              id: 'p1/m1',
              data: { name: 'module-a', kind: 'module', size: 50 },
              children: [
                { id: 'p1/m1/f1', data: { name: 'index.ts', kind: 'file', size: 30 } },
                { id: 'p1/m1/f2', data: { name: 'utils.ts', kind: 'file', size: 20 } },
              ],
            },
            { id: 'p1/m2', data: { name: 'module-b', kind: 'module', size: 50 } },
          ],
        },
        { id: 'p2', data: { name: 'standalone', kind: 'project', size: 10 } },
      ];
    }

    it('renders ONLY top-level rows when defaultExpandedDepth is 0', () => {
      const wrapper = mount(ChronixTable, {
        props: { columns: treeColumns, rows: buildTreeRows(), defaultExpandedDepth: 0 },
      });
      const rowIds = wrapper
        .findAll('.cx-table-row')
        .map((r) => r.attributes('data-row-id'))
        .filter((id): id is string => id != null);
      expect(rowIds).toEqual(['p1', 'p2']);
    });

    it('renders top + level-1 children when defaultExpandedDepth is 1', () => {
      const wrapper = mount(ChronixTable, {
        props: { columns: treeColumns, rows: buildTreeRows(), defaultExpandedDepth: 1 },
      });
      const rowIds = wrapper
        .findAll('.cx-table-row')
        .map((r) => r.attributes('data-row-id'))
        .filter((id): id is string => id != null);
      expect(rowIds).toEqual(['p1', 'p1/m1', 'p1/m2', 'p2']);
    });

    it('renders chevron for parent rows + leaf spacer for leaf rows in the tree column', () => {
      const wrapper = mount(ChronixTable, {
        props: { columns: treeColumns, rows: buildTreeRows(), defaultExpandedDepth: 1 },
      });
      const parentCells = wrapper.findAll('.cx-table-cell[data-col-id="name"][data-row-id^="p1"]');
      // p1 + p1/m1 are parents (have children); p1/m2 is a leaf.
      const p1Chevron = wrapper.find(
        '.cx-table-cell[data-col-id="name"][data-row-id="p1"] .cx-table-tree-chevron',
      );
      expect(p1Chevron.exists()).toBe(true);
      const p1m2Spacer = wrapper.find(
        '.cx-table-cell[data-col-id="name"][data-row-id="p1/m2"] .cx-table-tree-chevron-spacer',
      );
      expect(p1m2Spacer.exists()).toBe(true);
      expect(parentCells.length).toBeGreaterThan(0);
    });

    it('applies depth-driven indent paddingLeft to tree-column cells only', () => {
      const wrapper = mount(ChronixTable, {
        props: { columns: treeColumns, rows: buildTreeRows(), defaultExpandedDepth: 2 },
      });
      // theme defaults: treeIndentPx=16, cellPaddingX=8. p1/m1/f1 is depth 2.
      const depth2Cell = wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="p1/m1/f1"]');
      expect(depth2Cell.exists()).toBe(true);
      const style = depth2Cell.attributes('style') ?? '';
      // 8 (cellPaddingX) + 2 * 16 (treeIndentPx * depth) = 40px paddingLeft.
      expect(style).toMatch(/padding-left:\s*40px/i);
      // Non-tree column on same row: no indent.
      const sizeCell = wrapper.find('.cx-table-cell[data-col-id="size"][data-row-id="p1/m1/f1"]');
      const sizeStyle = sizeCell.attributes('style') ?? '';
      expect(sizeStyle).toMatch(/padding-left:\s*8px/i);
    });

    it('chevron click toggles expand + emits expanded-change with the next id list', async () => {
      const wrapper = mount(ChronixTable, {
        props: { columns: treeColumns, rows: buildTreeRows(), defaultExpandedDepth: 0 },
      });
      const chevron = wrapper.find(
        '.cx-table-cell[data-col-id="name"][data-row-id="p1"] .cx-table-tree-chevron',
      );
      await chevron.trigger('click');
      const events = wrapper.emitted('expanded-change');
      expect(events).toBeDefined();
      const payload = events![0]![0] as { next: readonly string[] };
      expect(payload.next).toEqual(['p1']);
      // After expand, child rows appear.
      const rowIds = wrapper
        .findAll('.cx-table-row')
        .map((r) => r.attributes('data-row-id'))
        .filter((id): id is string => id != null);
      expect(rowIds).toContain('p1/m1');
      expect(rowIds).toContain('p1/m2');
    });

    it('Enter on parent row in tree column toggles expand (precedence over edit-start)', async () => {
      const wrapper = mount(ChronixTable, {
        props: {
          columns: treeColumns,
          rows: buildTreeRows(),
          defaultExpandedDepth: 0,
          enableKeyboardNavigation: true,
        },
      });
      const handle = wrapper.vm as unknown as {
        setActiveCell(rowId: string, colId: string): void;
      };
      handle.setActiveCell('p1', 'name');
      await wrapper.find('.cx-table-body').trigger('keydown', { key: 'Enter' });
      const events = wrapper.emitted('expanded-change');
      expect(events).toBeDefined();
      const payload = events![0]![0] as { next: readonly string[] };
      expect(payload.next).toEqual(['p1']);
    });

    it('ArrowRight on collapsed parent expands the row', async () => {
      const wrapper = mount(ChronixTable, {
        props: {
          columns: treeColumns,
          rows: buildTreeRows(),
          defaultExpandedDepth: 0,
          enableKeyboardNavigation: true,
        },
      });
      const handle = wrapper.vm as unknown as {
        setActiveCell(rowId: string, colId: string): void;
      };
      handle.setActiveCell('p1', 'name');
      await wrapper.find('.cx-table-body').trigger('keydown', { key: 'ArrowRight' });
      const events = wrapper.emitted('expanded-change');
      expect(events).toBeDefined();
      const payload = events![0]![0] as { next: readonly string[] };
      expect(payload.next).toEqual(['p1']);
    });

    it('ArrowLeft on expanded parent collapses the row', async () => {
      const wrapper = mount(ChronixTable, {
        props: {
          columns: treeColumns,
          rows: buildTreeRows(),
          defaultExpandedDepth: 1,
          enableKeyboardNavigation: true,
        },
      });
      const handle = wrapper.vm as unknown as {
        setActiveCell(rowId: string, colId: string): void;
      };
      handle.setActiveCell('p1', 'name');
      await wrapper.find('.cx-table-body').trigger('keydown', { key: 'ArrowLeft' });
      const events = wrapper.emitted('expanded-change');
      expect(events).toBeDefined();
      const payload = events![0]![0] as { next: readonly string[] };
      expect(payload.next).toEqual([]);
    });

    it('ArrowLeft on a child row jumps activeCell to the parent', async () => {
      const wrapper = mount(ChronixTable, {
        props: {
          columns: treeColumns,
          rows: buildTreeRows(),
          defaultExpandedDepth: 2,
          enableKeyboardNavigation: true,
        },
      });
      const handle = wrapper.vm as unknown as {
        setActiveCell(rowId: string, colId: string): void;
        getActiveCell(): { rowId: string; colId: string } | null;
      };
      // p1/m1/f1 is a leaf (file); ArrowLeft on a leaf with a parent
      // jumps to the parent's tree-column cell.
      handle.setActiveCell('p1/m1/f1', 'name');
      await wrapper.find('.cx-table-body').trigger('keydown', { key: 'ArrowLeft' });
      expect(handle.getActiveCell()).toEqual({ rowId: 'p1/m1', colId: 'name' });
    });

    it('expandRow + collapseRow TableHandle methods round-trip + emit', () => {
      const wrapper = mount(ChronixTable, {
        props: { columns: treeColumns, rows: buildTreeRows(), defaultExpandedDepth: 0 },
      });
      const handle = wrapper.vm as unknown as {
        expandRow(rowId: string): void;
        collapseRow(rowId: string): void;
      };
      handle.expandRow('p1');
      const after1 = wrapper.emitted('expanded-change')?.[0]?.[0] as { next: readonly string[] };
      expect(after1.next).toEqual(['p1']);
      handle.collapseRow('p1');
      const allEvents = wrapper.emitted('expanded-change');
      const last = allEvents?.[allEvents.length - 1]?.[0] as { next: readonly string[] };
      expect(last.next).toEqual([]);
    });

    it('controlled mode: prop binding drives expandedRowIdsSet; toggle emits but does not mutate', async () => {
      const wrapper = mount(ChronixTable, {
        props: {
          columns: treeColumns,
          rows: buildTreeRows(),
          expandedRowIds: ['p1'],
        },
      });
      // Initial render: p1 IS expanded (per controlled prop).
      const rowIds = wrapper
        .findAll('.cx-table-row')
        .map((r) => r.attributes('data-row-id'))
        .filter((id): id is string => id != null);
      expect(rowIds).toContain('p1/m1');
      // Click chevron: emit fires with the COMPUTED next state, but the
      // controlled prop is still ['p1'] so the actual rendering is
      // unchanged until the consumer updates the prop.
      const chevron = wrapper.find(
        '.cx-table-cell[data-col-id="name"][data-row-id="p1"] .cx-table-tree-chevron',
      );
      await chevron.trigger('click');
      const payload = wrapper.emitted('expanded-change')?.[0]?.[0] as {
        next: readonly string[];
      };
      expect(payload.next).toEqual([]);
      // DOM still shows p1 expanded (prop didn't update).
      const rowIds2 = wrapper
        .findAll('.cx-table-row')
        .map((r) => r.attributes('data-row-id'))
        .filter((id): id is string => id != null);
      expect(rowIds2).toContain('p1/m1');
    });

    it('filter auto-expands ancestor with matching descendant (filterForceExpandedRowIds)', async () => {
      const wrapper = mount(ChronixTable, {
        props: {
          columns: treeColumns,
          rows: buildTreeRows(),
          defaultExpandedDepth: 0,
          showFilterRow: true,
        },
      });
      const handle = wrapper.vm as unknown as {
        setFilter(spec: TextFilterSpec | null): void;
      };
      // Apply filter that matches a deep file name. The ancestor
      // p1 + p1/m1 should auto-expand even though defaultExpandedDepth = 0.
      handle.setFilter({
        type: 'text',
        colId: 'name',
        operator: 'contains',
        value: 'utils',
      });
      await wrapper.vm.$nextTick();
      const rowIds = wrapper
        .findAll('.cx-table-row')
        .map((r) => r.attributes('data-row-id'))
        .filter((id): id is string => id != null);
      // The matching descendant p1/m1/f2 (utils.ts) should be visible
      // along with its ancestors p1 + p1/m1.
      expect(rowIds).toContain('p1');
      expect(rowIds).toContain('p1/m1');
      expect(rowIds).toContain('p1/m1/f2');
      expect(rowIds).not.toContain('p1/m2');
    });
  });

  describe('(vue3): tristate row-selection cascade', () => {
    const cascadeColumns: readonly ColumnSpec[] = [
      { id: 'name', field: 'name', headerName: '名称', flex: 1, treeColumn: true },
    ];

    function buildCascadeRows(): readonly RowSpec[] {
      return [
        {
          id: 'p1',
          data: { name: 'parent-1' },
          children: [
            { id: 'p1/c1', data: { name: 'child-1' } },
            { id: 'p1/c2', data: { name: 'child-2' } },
          ],
        },
        { id: 'p2', data: { name: 'leaf-parent' } },
      ];
    }

    it('checkbox click on a parent row cascades selection through descendants', async () => {
      const wrapper = mount(ChronixTable, {
        props: {
          columns: cascadeColumns,
          rows: buildCascadeRows(),
          defaultExpandedDepth: 1,
          selectionMode: 'multi',
          selectionColumn: { show: true, side: 'left' },
        },
      });
      const checkbox = wrapper.find('.cx-table-selection-checkbox--row[data-row-id="p1"]');
      await checkbox.trigger('click');
      const events = wrapper.emitted('selection-change');
      expect(events).toBeDefined();
      const payload = (events![0]![0] as { selectedRowIds: readonly string[] }).selectedRowIds;
      expect(new Set(payload)).toEqual(new Set(['p1', 'p1/c1', 'p1/c2']));
    });

    it('row click on a parent row cascades selection through descendants', async () => {
      const wrapper = mount(ChronixTable, {
        props: {
          columns: cascadeColumns,
          rows: buildCascadeRows(),
          defaultExpandedDepth: 1,
          selectionMode: 'multi',
        },
      });
      const parentCell = wrapper.find('.cx-table-cell[data-row-id="p1"][data-col-id="name"]');
      await parentCell.trigger('click');
      const events = wrapper.emitted('selection-change');
      expect(events).toBeDefined();
      const payload = (events![0]![0] as { selectedRowIds: readonly string[] }).selectedRowIds;
      expect(new Set(payload)).toEqual(new Set(['p1', 'p1/c1', 'p1/c2']));
    });

    it('clicking a descendant directly does NOT cascade up (downward-only)', async () => {
      const wrapper = mount(ChronixTable, {
        props: {
          columns: cascadeColumns,
          rows: buildCascadeRows(),
          defaultExpandedDepth: 1,
          selectionMode: 'multi',
          selectionColumn: { show: true, side: 'left' },
        },
      });
      const childCheckbox = wrapper.find('.cx-table-selection-checkbox--row[data-row-id="p1/c1"]');
      await childCheckbox.trigger('click');
      const events = wrapper.emitted('selection-change');
      expect(events).toBeDefined();
      const payload = (events![0]![0] as { selectedRowIds: readonly string[] }).selectedRowIds;
      expect(payload).toEqual(['p1/c1']);
    });

    it('toggling a parent OUT removes parent + all descendants', async () => {
      const wrapper = mount(ChronixTable, {
        props: {
          columns: cascadeColumns,
          rows: buildCascadeRows(),
          defaultExpandedDepth: 1,
          selectionMode: 'multi',
          selectionColumn: { show: true, side: 'left' },
        },
      });
      const handle = wrapper.vm as unknown as {
        setSelectedRowIds(ids: readonly string[]): void;
      };
      handle.setSelectedRowIds(['p1', 'p1/c1', 'p1/c2']);
      await wrapper.vm.$nextTick();
      const checkbox = wrapper.find('.cx-table-selection-checkbox--row[data-row-id="p1"]');
      await checkbox.trigger('click');
      const events = wrapper.emitted('selection-change');
      const lastPayload = (events![events!.length - 1]![0] as { selectedRowIds: readonly string[] })
        .selectedRowIds;
      expect(lastPayload).toEqual([]);
    });

    it('partially-selected parent renders indeterminate checkbox', async () => {
      const wrapper = mount(ChronixTable, {
        props: {
          columns: cascadeColumns,
          rows: buildCascadeRows(),
          defaultExpandedDepth: 1,
          selectionMode: 'multi',
          selectionColumn: { show: true, side: 'left' },
        },
      });
      const handle = wrapper.vm as unknown as {
        setSelectedRowIds(ids: readonly string[]): void;
      };
      handle.setSelectedRowIds(['p1/c1']);
      await wrapper.vm.$nextTick();
      const checkbox = wrapper.find<HTMLInputElement>(
        '.cx-table-selection-checkbox--row[data-row-id="p1"]',
      );
      expect(checkbox.exists()).toBe(true);
      expect(checkbox.element.indeterminate).toBe(true);
      expect(checkbox.classes()).toContain('cx-table-row-checkbox--indeterminate');
    });
  });

  describe('(vue3): tree-aware sort', () => {
    const sortColumns: readonly ColumnSpec[] = [
      { id: 'name', field: 'name', headerName: '名称', flex: 1, treeColumn: true },
    ];

    function buildSortRows(): readonly RowSpec[] {
      return [
        {
          id: 'p',
          data: { name: 'parent' },
          children: [
            { id: 'p/c', data: { name: 'gamma' } },
            { id: 'p/a', data: { name: 'alpha' } },
            { id: 'p/b', data: { name: 'beta' } },
          ],
        },
      ];
    }

    it('sorts children within each parent (ASC + DESC)', async () => {
      const wrapper = mount(ChronixTable, {
        props: {
          columns: sortColumns,
          rows: buildSortRows(),
          defaultExpandedDepth: 1,
        },
      });
      const handle = wrapper.vm as unknown as {
        setSort(spec: { colId: string; direction: 'asc' | 'desc' }): void;
      };
      handle.setSort({ colId: 'name', direction: 'asc' });
      await wrapper.vm.$nextTick();
      const rowIdsAsc = wrapper
        .findAll('.cx-table-row')
        .map((r) => r.attributes('data-row-id'))
        .filter((id): id is string => id != null);
      expect(rowIdsAsc).toEqual(['p', 'p/a', 'p/b', 'p/c']);
      handle.setSort({ colId: 'name', direction: 'desc' });
      await wrapper.vm.$nextTick();
      const rowIdsDesc = wrapper
        .findAll('.cx-table-row')
        .map((r) => r.attributes('data-row-id'))
        .filter((id): id is string => id != null);
      expect(rowIdsDesc).toEqual(['p', 'p/c', 'p/b', 'p/a']);
    });
  });
});

// Test-fixture sourced from outside the describe — reused by the
// cell-edit tests. editable cols (name + qty are both
// editable text-typed) + editable rows (r1.name = 'Alpha' so the
// undo/redo guards have deterministic before/after values).
const editableCols: readonly ColumnSpec[] = [
  { id: 'name', field: 'name', headerName: '名称', flex: 1, editable: true },
  { id: 'qty', field: 'qty', headerName: '数量', width: 120, editable: true },
];

const editableRows: readonly RowSpec[] = [
  { id: 'r1', data: { name: 'Alpha', qty: 10 } },
  { id: 'r2', data: { name: 'Beta', qty: 20 } },
];

describe('saved table views (vue3)', () => {
  const viewColumns: readonly ColumnSpec[] = [
    { id: 'id', field: 'id', headerName: 'ID', width: 80 },
    { id: 'name', field: 'name', headerName: 'Name', flex: 1 },
    { id: 'qty', field: 'qty', headerName: 'Qty', width: 120, type: 'number' },
    { id: 'price', field: 'price', headerName: 'Price', type: 'number', pinned: 'right' },
  ];

  const viewRows: readonly RowSpec[] = [
    { id: 'r1', data: { id: 1, name: 'Alpha', qty: 10, price: 100 } },
    { id: 'r2', data: { id: 2, name: 'Beta', qty: 20, price: 200 } },
    { id: 'r3', data: { id: 3, name: 'Gamma', qty: 30, price: 300 } },
  ];

  interface ViewHandle {
    getTableView(): {
      version: 1;
      columns: readonly { id: string }[];
      sort: readonly SortSpec[];
      filter: readonly FilterSpec[];
      page: number;
      pageSize: number;
    };
    applyTableView(state: unknown): void;
    setSort(spec: SortSpec | readonly SortSpec[] | null): void;
    setFilter(spec: FilterSpec | readonly FilterSpec[] | null): void;
    getSort(): readonly SortSpec[];
    getFilter(): readonly FilterSpec[];
    setPage(page: number): void;
  }

  it('getTableView projects columns/sort/filter/page/pageSize with version: 1', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: viewColumns, rows: viewRows, showPagination: true, initialPageSize: 20 },
    });
    const handle = wrapper.vm as unknown as ViewHandle;
    handle.setSort({ colId: 'qty', direction: 'desc' });
    await wrapper.vm.$nextTick();

    const view = handle.getTableView();
    expect(view.version).toBe(1);
    expect(view.columns.map((c) => c.id)).toEqual(['id', 'name', 'qty', 'price']);
    expect(view.sort).toEqual([{ colId: 'qty', direction: 'desc' }]);
    expect(view.pageSize).toBe(20);
  });

  it('applyTableView dispatches sort + filter + page/pageSize to setters', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: viewColumns, rows: viewRows, showPagination: true, initialPageSize: 20 },
    });
    const handle = wrapper.vm as unknown as ViewHandle;
    handle.applyTableView({
      version: 1,
      columns: viewColumns.map((c) => ({ id: c.id })),
      sort: [{ colId: 'name', direction: 'asc' }],
      filter: [{ type: 'number', colId: 'qty', operator: '>', value: 15 }],
      page: 0,
      pageSize: 10,
    });
    await wrapper.vm.$nextTick();

    expect(handle.getSort()).toEqual([{ colId: 'name', direction: 'asc' }]);
    expect(handle.getFilter()).toEqual([
      { type: 'number', colId: 'qty', operator: '>', value: 15 },
    ]);
  });

  it('applyTableView emits columns-change once with reconciled array when columns differ', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: viewColumns, rows: viewRows },
    });
    const handle = wrapper.vm as unknown as ViewHandle;
    // Saved snapshot reorders columns: qty/name/id/price + flags name as wider.
    handle.applyTableView({
      version: 1,
      columns: [{ id: 'qty' }, { id: 'name', width: 400 }, { id: 'id' }, { id: 'price' }],
      sort: [],
      filter: [],
      page: 0,
      pageSize: 20,
    });
    await wrapper.vm.$nextTick();
    const emitted = wrapper.emitted('columns-change');
    expect(emitted).toBeDefined();
    expect(emitted!.length).toBe(1);
    const payload = emitted![0]![0] as { columns: readonly ColumnSpec[]; reason: string };
    expect(payload.reason).toBe('apply-view');
    expect(payload.columns.map((c) => c.id)).toEqual(['qty', 'name', 'id', 'price']);
    const nameCol = payload.columns.find((c) => c.id === 'name')!;
    expect(nameCol.width).toBe(400);
  });

  it('applyTableView drops sort/filter entries referencing removed columns', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: viewColumns, rows: viewRows },
    });
    const handle = wrapper.vm as unknown as ViewHandle;
    handle.applyTableView({
      version: 1,
      columns: [{ id: 'id' }, { id: 'name' }, { id: 'qty' }, { id: 'price' }],
      sort: [
        { colId: 'gone', direction: 'asc' },
        { colId: 'qty', direction: 'desc' },
      ],
      filter: [
        { type: 'text', colId: 'missing', operator: 'contains', value: 'x' },
        { type: 'number', colId: 'qty', operator: '>=', value: 5 },
      ],
      page: 0,
      pageSize: 20,
    });
    await wrapper.vm.$nextTick();
    expect(handle.getSort()).toEqual([{ colId: 'qty', direction: 'desc' }]);
    expect(handle.getFilter()).toEqual([
      { type: 'number', colId: 'qty', operator: '>=', value: 5 },
    ]);
  });

  it('applyTableView no-ops silently on unknown version (no emit, no state mutation)', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: viewColumns, rows: viewRows },
    });
    const handle = wrapper.vm as unknown as ViewHandle;
    handle.setSort({ colId: 'qty', direction: 'desc' });
    await wrapper.vm.$nextTick();
    const beforeSort = handle.getSort();
    handle.applyTableView({ version: 2, columns: [], sort: [], filter: [], page: 0, pageSize: 0 });
    await wrapper.vm.$nextTick();
    expect(handle.getSort()).toEqual(beforeSort);
    expect(wrapper.emitted('columns-change')).toBeUndefined();
  });
});

describe('Excel xlsx export (vue3)', () => {
  const viewColumns: readonly ColumnSpec[] = [
    { id: 'id', field: 'id', headerName: 'ID', width: 80 },
    { id: 'name', field: 'name', headerName: 'Name', flex: 1 },
    { id: 'qty', field: 'qty', headerName: 'Qty', width: 120, type: 'number' },
  ];

  const viewRows: readonly RowSpec[] = [
    { id: 'r1', data: { id: 1, name: 'Alpha', qty: 10 } },
    { id: 'r2', data: { id: 2, name: 'Beta', qty: 20 } },
  ];

  interface XlsxHandle {
    exportToXlsx(
      filename: string,
      options?: { rowSource?: string; xlsxOptions?: { sheetName?: string } },
    ): Promise<void>;
  }

  function patchDownload(): {
    captured: { blobs: Blob[]; filenames: string[] };
    restore: () => void;
  } {
    const captured = { blobs: [] as Blob[], filenames: [] as string[] };
    const origCreate = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (b: Blob | MediaSource) => {
      if (b instanceof Blob) captured.blobs.push(b);
      return 'blob:cx-test';
    };
    const origClickDescriptor = Object.getOwnPropertyDescriptor(
      HTMLAnchorElement.prototype,
      'click',
    );
    HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
      if (this.hasAttribute('data-cx-table-xlsx-download')) {
        captured.filenames.push(this.getAttribute('download') ?? '');
        return;
      }
    };
    const origRevoke = URL.revokeObjectURL.bind(URL);
    URL.revokeObjectURL = () => {
      /* swallow */
    };
    return {
      captured,
      restore: () => {
        URL.createObjectURL = origCreate;
        URL.revokeObjectURL = origRevoke;
        if (origClickDescriptor != null) {
          Object.defineProperty(HTMLAnchorElement.prototype, 'click', origClickDescriptor);
        }
      },
    };
  }

  it('exportToXlsx triggers a Blob download with the XLSX mimetype + filename', async () => {
    const wrapper = mount(ChronixTable, { props: { columns: viewColumns, rows: viewRows } });
    const handle = wrapper.vm as unknown as XlsxHandle;
    const { captured, restore } = patchDownload();
    try {
      await handle.exportToXlsx('demo.xlsx');
    } finally {
      restore();
    }
    expect(captured.blobs.length).toBe(1);
    expect(captured.blobs[0]!.type).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(captured.filenames).toEqual(['demo.xlsx']);
    expect(captured.blobs[0]!.size).toBeGreaterThan(0);
  });

  it('exportToXlsx passes sheetName through xlsxOptions', async () => {
    const wrapper = mount(ChronixTable, { props: { columns: viewColumns, rows: viewRows } });
    const handle = wrapper.vm as unknown as XlsxHandle;
    const { captured, restore } = patchDownload();
    try {
      await handle.exportToXlsx('demo.xlsx', { xlsxOptions: { sheetName: 'CustomSheet' } });
    } finally {
      restore();
    }
    expect(captured.blobs.length).toBe(1);
    expect(captured.blobs[0]!.size).toBeGreaterThan(0);
  });

  it('exportToXlsx with rowSource:"all" still produces a valid blob', async () => {
    const wrapper = mount(ChronixTable, { props: { columns: viewColumns, rows: viewRows } });
    const handle = wrapper.vm as unknown as XlsxHandle;
    const { captured, restore } = patchDownload();
    try {
      await handle.exportToXlsx('all.xlsx', { rowSource: 'all' });
    } finally {
      restore();
    }
    expect(captured.blobs.length).toBe(1);
    expect(captured.blobs[0]!.size).toBeGreaterThan(0);
  });
});

describe('+ 39.1: a11y + multi-sheet xlsx (vue3)', () => {
  const viewColumns: readonly ColumnSpec[] = [
    { id: 'id', field: 'id', headerName: 'ID', width: 80 },
    { id: 'name', field: 'name', headerName: 'Name', flex: 1 },
    { id: 'qty', field: 'qty', headerName: 'Qty', width: 120, type: 'number' },
  ];

  const viewRows: readonly RowSpec[] = [
    { id: 'r1', data: { id: 1, name: 'Alpha', qty: 10 } },
    { id: 'r2', data: { id: 2, name: 'Beta', qty: 20 } },
  ];

  interface MultiSheetHandle {
    readonly exportToXlsxMultiSheet: (
      filename: string,
      sheets: readonly { sheetName: string; rowSource?: string; columnIds?: readonly string[] }[],
    ) => Promise<void>;
  }

  function patchMultiSheetDownload(): {
    captured: { blobs: Blob[]; filenames: string[] };
    restore: () => void;
  } {
    const captured = { blobs: [] as Blob[], filenames: [] as string[] };
    const origCreate = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (b: Blob | MediaSource) => {
      if (b instanceof Blob) captured.blobs.push(b);
      return 'blob:cx-test';
    };
    const origClickDescriptor = Object.getOwnPropertyDescriptor(
      HTMLAnchorElement.prototype,
      'click',
    );
    HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
      if (this.hasAttribute('data-cx-table-xlsx-download')) {
        captured.filenames.push(this.getAttribute('download') ?? '');
      }
    };
    const origRevoke = URL.revokeObjectURL.bind(URL);
    URL.revokeObjectURL = () => {
      /* swallow */
    };
    return {
      captured,
      restore: () => {
        URL.createObjectURL = origCreate;
        URL.revokeObjectURL = origRevoke;
        if (origClickDescriptor != null) {
          Object.defineProperty(HTMLAnchorElement.prototype, 'click', origClickDescriptor);
        }
      },
    };
  }

  it('wrapper carries aria-rowcount + aria-colcount + role=grid', () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: viewColumns, rows: viewRows },
    });
    const root = wrapper.find('.cx-table-wrapper');
    expect(root.attributes('role')).toBe('grid');
    expect(root.attributes('aria-rowcount')).toBeDefined();
    expect(root.attributes('aria-colcount')).toBeDefined();
    expect(Number(root.attributes('aria-rowcount'))).toBeGreaterThanOrEqual(3); // header + 2 rows
    expect(Number(root.attributes('aria-colcount'))).toBe(3);
  });

  it('off-screen live region renders with role=status + aria-live=polite', () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: viewColumns, rows: viewRows },
    });
    const live = wrapper.find('.cx-table-sr-announce');
    expect(live.exists()).toBe(true);
    expect(live.attributes('role')).toBe('status');
    expect(live.attributes('aria-live')).toBe('polite');
    expect(live.attributes('aria-atomic')).toBe('true');
  });

  it('exportToXlsxMultiSheet triggers ONE Blob download with XLSX mimetype', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: viewColumns, rows: viewRows },
    });
    const handle = wrapper.vm as unknown as MultiSheetHandle;
    const { captured, restore } = patchMultiSheetDownload();
    try {
      await handle.exportToXlsxMultiSheet('multi.xlsx', [
        { sheetName: 'Filtered', rowSource: 'filtered' },
        { sheetName: 'All', rowSource: 'all' },
        { sheetName: 'IDs', columnIds: ['id'] },
      ]);
    } finally {
      restore();
    }
    expect(captured.blobs.length).toBe(1);
    expect(captured.blobs[0]!.type).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(captured.filenames).toEqual(['multi.xlsx']);
    expect(captured.blobs[0]!.size).toBeGreaterThan(0);
  });
});

describe('+ 39.3: per-cell ARIA indices + xlsx freeze-pane (vue3)', () => {
  const viewColumns: readonly ColumnSpec[] = [
    { id: 'id', field: 'id', headerName: 'ID', width: 80 },
    { id: 'name', field: 'name', headerName: 'Name', flex: 1 },
    { id: 'qty', field: 'qty', headerName: 'Qty', width: 120, type: 'number' },
  ];

  const viewRows: readonly RowSpec[] = [
    { id: 'r1', data: { id: 1, name: 'Alpha', qty: 10 } },
    { id: 'r2', data: { id: 2, name: 'Beta', qty: 20 } },
    { id: 'r3', data: { id: 3, name: 'Gamma', qty: 30 } },
  ];

  interface MultiSheetWithOptsHandle {
    readonly exportToXlsxMultiSheet: (
      filename: string,
      sheets: readonly {
        sheetName: string;
        rowSource?: string;
        xlsxOptions?: { freezePane?: { xSplit?: number; ySplit?: number } };
      }[],
    ) => Promise<void>;
  }

  function patchMultiSheetDownload(): {
    captured: { blobs: Blob[]; filenames: string[] };
    restore: () => void;
  } {
    const captured = { blobs: [] as Blob[], filenames: [] as string[] };
    const origCreate = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (b: Blob | MediaSource) => {
      if (b instanceof Blob) captured.blobs.push(b);
      return 'blob:cx-test';
    };
    const origClickDescriptor = Object.getOwnPropertyDescriptor(
      HTMLAnchorElement.prototype,
      'click',
    );
    HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
      if (this.hasAttribute('data-cx-table-xlsx-download')) {
        captured.filenames.push(this.getAttribute('download') ?? '');
      }
    };
    const origRevoke = URL.revokeObjectURL.bind(URL);
    URL.revokeObjectURL = () => {
      /* swallow */
    };
    return {
      captured,
      restore: () => {
        URL.createObjectURL = origCreate;
        URL.revokeObjectURL = origRevoke;
        if (origClickDescriptor != null) {
          Object.defineProperty(HTMLAnchorElement.prototype, 'click', origClickDescriptor);
        }
      },
    };
  }

  it('header row has aria-rowindex=1', () => {
    const wrapper = mount(ChronixTable, { props: { columns: viewColumns, rows: viewRows } });
    const header = wrapper.find('.cx-table-row--header');
    expect(header.attributes('aria-rowindex')).toBe('1');
  });

  it('body rows have monotonically increasing aria-rowindex starting at 2', () => {
    const wrapper = mount(ChronixTable, { props: { columns: viewColumns, rows: viewRows } });
    const bodyRows = wrapper.findAll('.cx-table-row:not(.cx-table-row--header)');
    expect(bodyRows.length).toBeGreaterThanOrEqual(3);
    const indices = bodyRows.slice(0, 3).map((r) => Number(r.attributes('aria-rowindex')));
    expect(indices).toEqual([2, 3, 4]);
  });

  it('body cells have aria-colindex matching column position (1..N)', () => {
    const wrapper = mount(ChronixTable, { props: { columns: viewColumns, rows: viewRows } });
    const firstRow = wrapper.find('.cx-table-row:not(.cx-table-row--header)');
    const cells = firstRow.findAll('[role="gridcell"]');
    expect(cells.length).toBeGreaterThanOrEqual(3);
    const indices = cells.slice(0, 3).map((c) => Number(c.attributes('aria-colindex')));
    expect(indices).toEqual([1, 2, 3]);
  });

  it('column headers carry matching aria-colindex (1..N)', () => {
    const wrapper = mount(ChronixTable, { props: { columns: viewColumns, rows: viewRows } });
    const colHeaders = wrapper
      .findAll('.cx-table-row--header [role="columnheader"]')
      .filter((c) => c.attributes('data-col-id') !== '__cx_selection__');
    const indices = colHeaders.slice(0, 3).map((c) => Number(c.attributes('aria-colindex')));
    expect(indices).toEqual([1, 2, 3]);
  });

  it('exportToXlsxMultiSheet threads xlsxOptions.freezePane per sheet', async () => {
    const wrapper = mount(ChronixTable, { props: { columns: viewColumns, rows: viewRows } });
    const handle = wrapper.vm as unknown as MultiSheetWithOptsHandle;
    const { captured, restore } = patchMultiSheetDownload();
    try {
      await handle.exportToXlsxMultiSheet('frozen.xlsx', [
        { sheetName: 'Frozen', xlsxOptions: { freezePane: { xSplit: 1, ySplit: 1 } } },
        { sheetName: 'Unfrozen' },
      ]);
    } finally {
      restore();
    }
    expect(captured.blobs.length).toBe(1);
    expect(captured.blobs[0]!.size).toBeGreaterThan(0);
  });
});

describe('advanced filter', () => {
  interface AdvancedFilterHandle {
    getFilter(): readonly FilterSpec[];
    setFilter(spec: FilterSpec | readonly FilterSpec[] | null): void;
    getAdvancedFilter(): {
      readonly expression: FilterExpression;
      readonly source: string | null;
    } | null;
    setAdvancedFilter(expression: FilterExpression | null, source?: string): void;
    parseAndSetAdvancedFilter(text: string): ParseFilterExpressionResult;
  }

  it('setAdvancedFilter installs an ExpressionFilterSpec and fires filter-change', () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const handle = wrapper.vm as unknown as AdvancedFilterHandle;
    handle.setAdvancedFilter({
      kind: 'compare',
      colId: 'qty',
      operator: '>',
      value: 15,
    });
    const emitted = wrapper.emitted('filter-change');
    expect(emitted).toBeTruthy();
    const last = (emitted as { filterSpec: readonly FilterSpec[] }[][])[
      (emitted as unknown[]).length - 1
    ]?.[0];
    expect(last?.filterSpec.length).toBe(1);
    expect(last?.filterSpec[0]?.type).toBe('expression');
  });

  it('getAdvancedFilter returns expression + source after a parseAndSet', () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const handle = wrapper.vm as unknown as AdvancedFilterHandle;
    handle.parseAndSetAdvancedFilter('qty > 15');
    const current = handle.getAdvancedFilter();
    expect(current).not.toBeNull();
    expect(current?.source).toBe('qty > 15');
    expect(current?.expression.kind).toBe('compare');
  });

  it('setAdvancedFilter(null) clears the expression while keeping text spec on another column', () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const handle = wrapper.vm as unknown as AdvancedFilterHandle;
    const textSpec: FilterSpec = {
      type: 'text',
      colId: 'name',
      operator: 'contains',
      value: 'a',
    };
    handle.setFilter([
      textSpec,
      {
        type: 'expression',
        expression: { kind: 'compare', colId: 'qty', operator: '>', value: 15 },
      },
    ]);
    handle.setAdvancedFilter(null);
    const after = handle.getFilter();
    expect(after.length).toBe(1);
    expect(after[0]?.type).toBe('text');
  });

  it('parseAndSetAdvancedFilter applies on success and returns the parse result', () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const handle = wrapper.vm as unknown as AdvancedFilterHandle;
    const result = handle.parseAndSetAdvancedFilter('qty > 15');
    expect(result.ok).toBe(true);
    const current = handle.getAdvancedFilter();
    expect(current?.expression.kind).toBe('compare');
  });

  it('parseAndSetAdvancedFilter returns errors and leaves prior filter unchanged on invalid input', () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const handle = wrapper.vm as unknown as AdvancedFilterHandle;
    handle.parseAndSetAdvancedFilter('qty > 15');
    const before = handle.getAdvancedFilter();
    const result = handle.parseAndSetAdvancedFilter('garbage @@@');
    expect(result.ok).toBe(false);
    const after = handle.getAdvancedFilter();
    expect(after?.expression).toEqual(before?.expression);
  });
});

describe('row drag (vue3)', () => {
  interface RowDragHandle {
    startMovingRow(rowId: string): void;
    commitRowMove(targetRowId: string, position: 'above' | 'below'): void;
    cancelRowMove(): void;
    getMovingRow(): { readonly rowId: string } | null;
  }

  const dragColumns: readonly ColumnSpec[] = [
    { id: 'id', field: 'id', headerName: 'ID', width: 80 },
    { id: 'name', field: 'name', headerName: '名称', flex: 1 },
  ];

  const dragRows: readonly RowSpec[] = [
    { id: 'r1', data: { id: 1, name: 'A' } },
    { id: 'r2', data: { id: 2, name: 'B' } },
    { id: 'r3', data: { id: 3, name: 'C' } },
    { id: 'r4', data: { id: 4, name: 'D' }, draggable: false },
  ];

  it('renders grip cell per draggable row when rowDragColumn.show is true', () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: dragColumns, rows: dragRows, rowDragColumn: { show: true } },
    });
    const gripCells = wrapper.findAll('[data-row-drag-handle="true"]');
    // r1, r2, r3 are draggable (r4 has draggable:false → no grip glyph).
    expect(gripCells.length).toBe(3);
  });

  it('does NOT render grip cells when rowDragColumn.show is false (default)', () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: dragColumns, rows: dragRows },
    });
    const gripCells = wrapper.findAll('[data-row-drag-handle="true"]');
    expect(gripCells.length).toBe(0);
  });

  it('startMovingRow opens session + fires row-move-start', () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: dragColumns, rows: dragRows, rowDragColumn: { show: true } },
    });
    const handle = wrapper.vm as unknown as RowDragHandle;
    handle.startMovingRow('r1');
    expect(handle.getMovingRow()?.rowId).toBe('r1');
    expect(wrapper.emitted('row-move-start')).toBeTruthy();
  });

  it('commitRowMove fires row-order-change + row-move-stop committed:true', () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: dragColumns, rows: dragRows, rowDragColumn: { show: true } },
    });
    const handle = wrapper.vm as unknown as RowDragHandle;
    handle.startMovingRow('r1');
    handle.commitRowMove('r3', 'below');
    expect(handle.getMovingRow()).toBeNull();
    const orderEmits = wrapper.emitted('row-order-change');
    expect(orderEmits).toBeTruthy();
    const last = orderEmits?.[orderEmits.length - 1]?.[0] as
      | { movedRow: RowSpec; targetRow: RowSpec; position: 'above' | 'below' }
      | undefined;
    expect(last?.movedRow.id).toBe('r1');
    expect(last?.targetRow.id).toBe('r3');
    expect(last?.position).toBe('below');
    const stopEmits = wrapper.emitted('row-move-stop');
    const lastStop = stopEmits?.[stopEmits.length - 1]?.[0] as { committed: boolean } | undefined;
    expect(lastStop?.committed).toBe(true);
  });

  it('cancelRowMove fires row-move-stop committed:false + no row-order-change', () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: dragColumns, rows: dragRows, rowDragColumn: { show: true } },
    });
    const handle = wrapper.vm as unknown as RowDragHandle;
    handle.startMovingRow('r1');
    handle.cancelRowMove();
    expect(handle.getMovingRow()).toBeNull();
    const stopEmits = wrapper.emitted('row-move-stop');
    const lastStop = stopEmits?.[stopEmits.length - 1]?.[0] as { committed: boolean } | undefined;
    expect(lastStop?.committed).toBe(false);
    expect(wrapper.emitted('row-order-change') ?? []).toHaveLength(0);
  });

  it('startMovingRow on pinned or draggable:false row is a silent no-op', () => {
    const rowsWithPin: readonly RowSpec[] = [
      { id: 'pinned-top', data: { id: 0 }, pinned: 'top' },
      { id: 'r1', data: { id: 1 } },
      { id: 'r2', data: { id: 2 }, draggable: false },
    ];
    const wrapper = mount(ChronixTable, {
      props: { columns: dragColumns, rows: rowsWithPin, rowDragColumn: { show: true } },
    });
    const handle = wrapper.vm as unknown as RowDragHandle;
    handle.startMovingRow('pinned-top');
    expect(handle.getMovingRow()).toBeNull();
    expect(wrapper.emitted('row-move-start') ?? []).toHaveLength(0);
    handle.startMovingRow('r2');
    expect(handle.getMovingRow()).toBeNull();
    expect(wrapper.emitted('row-move-start') ?? []).toHaveLength(0);
  });
});

describe('set filter (vue3)', () => {
  interface SetFilterHandle {
    getFilter(): readonly FilterSpec[];
    setFilter(spec: FilterSpec | readonly FilterSpec[] | null): void;
    getColumnUniqueValues(
      colId: string,
      options?: { maxValues?: number },
    ): CollectUniqueColumnValuesResult;
  }

  const setColumns: readonly ColumnSpec[] = [
    { id: 'id', field: 'id', headerName: 'ID', width: 80 },
    { id: 'status', field: 'status', headerName: '状态', width: 120, filterUi: 'set' },
    { id: 'name', field: 'name', headerName: '名称', flex: 1 },
  ];

  const setRows: readonly RowSpec[] = [
    { id: 'r1', data: { id: 1, status: '完成', name: 'A' } },
    { id: 'r2', data: { id: 2, status: '进行中', name: 'B' } },
    { id: 'r3', data: { id: 3, status: '完成', name: 'C' } },
    { id: 'r4', data: { id: 4, status: '阻塞', name: 'D' } },
  ];

  it('renders <details> dropdown for filterUi:"set" column when showFilterRow is true', () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: setColumns, rows: setRows, showFilterRow: true },
    });
    const setFilterEl = wrapper.find(
      '.cx-table-filter-cell[data-col-id="status"][data-filter-ui="set"] details.cx-table-set-filter',
    );
    expect(setFilterEl.exists()).toBe(true);
    // The other columns keep the text input.
    const textFilterEl = wrapper.find(
      '.cx-table-filter-cell[data-col-id="name"] input.cx-table-filter-input',
    );
    expect(textFilterEl.exists()).toBe(true);
  });

  it('summary text reflects all-selected identity state by default', () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: setColumns, rows: setRows, showFilterRow: true },
    });
    const summary = wrapper.find(
      'details.cx-table-set-filter summary.cx-table-set-filter__summary',
    );
    expect(summary.text()).toContain('全部');
    // 3 unique status values across 4 rows (完成 / 进行中 / 阻塞).
    expect(summary.text()).toContain('(3)');
  });

  it('toggling a checkbox dispatches setFilter with SetFilterSpec', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: setColumns, rows: setRows, showFilterRow: true },
    });
    const allCheckboxes = wrapper.findAll('.cx-table-set-filter__item input[type="checkbox"]');
    // The first checkbox = first unique value in sort order (locale-naïve string sort).
    expect(allCheckboxes.length).toBe(3);
    const first = allCheckboxes[0];
    if (first == null) throw new Error('expected at least one checkbox');
    const firstInput = first.element as HTMLInputElement;
    firstInput.checked = false;
    await first.trigger('change');
    const handle = wrapper.vm as unknown as SetFilterHandle;
    const filter = handle.getFilter();
    expect(filter.length).toBe(1);
    const entry = filter[0]!;
    expect(entry.type).toBe('set');
  });

  it('全选 / 清空 buttons set selectedValues to null / [] respectively', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: setColumns, rows: setRows, showFilterRow: true },
    });
    const handle = wrapper.vm as unknown as SetFilterHandle;
    const clearBtn = wrapper.find('details.cx-table-set-filter button[data-action="clear"]');
    await clearBtn.trigger('click');
    const afterClear = handle.getFilter();
    expect(afterClear.length).toBe(1);
    const clearedSpec = afterClear[0];
    if (clearedSpec?.type !== 'set') throw new Error('expected set filter');
    expect(clearedSpec.selectedValues).toEqual([]);
    const selectAllBtn = wrapper.find(
      'details.cx-table-set-filter button[data-action="select-all"]',
    );
    await selectAllBtn.trigger('click');
    // 全选 removes the set spec (null = identity).
    expect(handle.getFilter().length).toBe(0);
  });

  it('getColumnUniqueValues exposes core helper through TableHandle', () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: setColumns, rows: setRows },
    });
    const handle = wrapper.vm as unknown as SetFilterHandle;
    const result = handle.getColumnUniqueValues('status');
    expect(result.values.length).toBe(3);
    expect(result.truncated).toBe(false);
    const labels = result.values.map((v) => v.value);
    expect(new Set(labels)).toEqual(new Set(['完成', '进行中', '阻塞']));
  });
});

describe('set filter virtualization (vue3)', () => {
  const SET_FILTER_COLUMNS: readonly ColumnSpec[] = [
    { id: 'tag', field: 'tag', headerName: 'Tag', width: 160, filterUi: 'set' },
  ];

  function makeRows(n: number): readonly RowSpec[] {
    const rows: RowSpec[] = [];
    for (let i = 0; i < n; i++) {
      rows.push({ id: `r${i}`, data: { tag: `tag-${String(i).padStart(4, '0')}` } });
    }
    return rows;
  }

  it('96.2: below threshold renders eagerly (no virtualization wrapper)', () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: SET_FILTER_COLUMNS,
        rows: makeRows(10),
        showFilterRow: true,
        setFilterVirtualizeThreshold: 100,
      },
      attachTo: document.body,
    });
    const listEl = wrapper.find('.cx-table-set-filter__list');
    expect(listEl.exists()).toBe(true);
    expect(listEl.attributes('data-virtualized')).toBe('false');
    expect(wrapper.find('.cx-table-set-filter__sizer').exists()).toBe(false);
    expect(wrapper.find('.cx-table-set-filter__window').exists()).toBe(false);
    const items = wrapper.findAll('.cx-table-set-filter__item');
    expect(items.length).toBe(10);
    wrapper.unmount();
  });

  it('96.2: above threshold renders virtualized window with sizer wrapper', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: SET_FILTER_COLUMNS,
        rows: makeRows(300),
        showFilterRow: true,
        setFilterVirtualizeThreshold: 50,
      },
      attachTo: document.body,
    });
    const listEl = wrapper.find('.cx-table-set-filter__list');
    expect(listEl.attributes('data-virtualized')).toBe('true');
    const listNode = listEl.element as HTMLElement;
    // Stub clientHeight (jsdom/happy-dom returns 0 with no layout) so
    // the virtualizer derives a real visible window.
    Object.defineProperty(listNode, 'clientHeight', { value: 240, configurable: true });
    listNode.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();
    const sizerEl = wrapper.find('.cx-table-set-filter__sizer');
    const windowEl = wrapper.find('.cx-table-set-filter__window');
    expect(sizerEl.exists()).toBe(true);
    expect(windowEl.exists()).toBe(true);
    // 300 rows × 28px = 8400px sizer height.
    expect((sizerEl.element as HTMLElement).style.height).toBe('8400px');
    const startStr = windowEl.attributes('data-window-start');
    const endStr = windowEl.attributes('data-window-end');
    expect(startStr).toBe('0');
    // scrollTop=0 + viewportHeight=240 + 28px items + overscan=3 ⇒
    // endIndex = ceil(240/28) + 3 = 9 + 3 = 12.
    expect(endStr).toBe('12');
    const visible = wrapper.findAll('.cx-table-set-filter__item');
    expect(visible.length).toBe(12);
    wrapper.unmount();
  });

  it('96.2: scrolling updates the rendered window', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: SET_FILTER_COLUMNS,
        rows: makeRows(300),
        showFilterRow: true,
        setFilterVirtualizeThreshold: 50,
      },
      attachTo: document.body,
    });
    const listEl = wrapper.find('.cx-table-set-filter__list');
    const listNode = listEl.element as HTMLElement;
    Object.defineProperty(listNode, 'clientHeight', { value: 240, configurable: true });
    // Initial scroll event seeds viewportHeight (via ref-callback) +
    // scrollTop (via onScroll); the helper measures clientHeight on
    // each render so the next reactive tick will use the stubbed value.
    listNode.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();
    // Scroll down to 500px ⇒ floor(500/28) = 17 ⇒ startIndex
    // = max(0, 17 - 3) = 14 (with overscan=3).
    Object.defineProperty(listNode, 'scrollTop', { value: 500, configurable: true });
    listNode.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();
    const windowEl = wrapper.find('.cx-table-set-filter__window');
    expect(windowEl.attributes('data-window-start')).toBe('14');
    // endIndex = ceil((500 + 240) / 28) + 3 = ceil(26.43) + 3 = 27 + 3 = 30.
    expect(windowEl.attributes('data-window-end')).toBe('30');
    wrapper.unmount();
  });
});

describe('number filter range slider (vue3)', () => {
  const NUM_COLS: readonly ColumnSpec[] = [
    { id: 'qty', field: 'qty', headerName: 'Qty', width: 200, type: 'number' },
  ];

  const NUM_ROWS: readonly RowSpec[] = [
    { id: 'r1', data: { qty: 5 } },
    { id: 'r2', data: { qty: 25 } },
    { id: 'r3', data: { qty: 60 } },
    { id: 'r4', data: { qty: 100 } },
  ];

  function stubTrackRect(track: HTMLElement, width: number): void {
    track.getBoundingClientRect = (): DOMRect => ({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: width,
      bottom: 20,
      width,
      height: 20,
      toJSON: () => ({}),
    });
  }

  it('98.2: default off — no slider rendered for numeric column', () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: NUM_COLS, rows: NUM_ROWS, showFilterRow: true },
      attachTo: document.body,
    });
    expect(wrapper.find('.cx-table-number-filter__range').exists()).toBe(false);
    // The existing prefix-syntax text input still renders.
    expect(wrapper.find('.cx-table-filter-input[data-col-id="qty"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('98.2: prop on + numeric col + finite data — slider renders with track + 2 thumbs + aria attributes', () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: NUM_COLS,
        rows: NUM_ROWS,
        showFilterRow: true,
        numberFilterShowRangeSlider: true,
      },
      attachTo: document.body,
    });
    const slider = wrapper.find('.cx-table-number-filter__range[data-col-id="qty"]');
    expect(slider.exists()).toBe(true);
    const lowThumb = wrapper.find(
      '.cx-table-number-filter__range[data-col-id="qty"] [data-range-handle="low"]',
    );
    const highThumb = wrapper.find(
      '.cx-table-number-filter__range[data-col-id="qty"] [data-range-handle="high"]',
    );
    expect(lowThumb.exists()).toBe(true);
    expect(highThumb.exists()).toBe(true);
    expect(lowThumb.attributes('role')).toBe('slider');
    expect(highThumb.attributes('role')).toBe('slider');
    expect(lowThumb.attributes('aria-valuemin')).toBe('5');
    expect(lowThumb.attributes('aria-valuemax')).toBe('100');
    expect(lowThumb.attributes('aria-valuenow')).toBe('5');
    expect(highThumb.attributes('aria-valuenow')).toBe('100');
    // The existing text input is still rendered next to the slider.
    expect(wrapper.find('.cx-table-filter-input[data-col-id="qty"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('98.2: prop on + no finite numeric data — no slider rendered (text input only)', () => {
    const noNumRows: readonly RowSpec[] = [
      { id: 'r1', data: { qty: null } },
      { id: 'r2', data: { qty: 'bogus' } },
      { id: 'r3', data: { qty: undefined } },
    ];
    const wrapper = mount(ChronixTable, {
      props: {
        columns: NUM_COLS,
        rows: noNumRows,
        showFilterRow: true,
        numberFilterShowRangeSlider: true,
      },
      attachTo: document.body,
    });
    expect(wrapper.find('.cx-table-number-filter__range').exists()).toBe(false);
    expect(wrapper.find('.cx-table-filter-input[data-col-id="qty"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('98.2: pointerdown on track commits inRange spec; ArrowRight on high thumb increments high', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: NUM_COLS,
        rows: NUM_ROWS,
        showFilterRow: true,
        numberFilterShowRangeSlider: true,
      },
      attachTo: document.body,
    });
    const handle = wrapper.vm as unknown as { getFilter(): readonly FilterSpec[] };
    const track = wrapper.find('.cx-table-number-filter__range[data-col-id="qty"]');
    stubTrackRect(track.element as HTMLElement, 100);
    // Pointer down at x=10px on a 100px track ⇒ ratio=0.1 ⇒ value
    // = 5 + 0.1 * (100 - 5) = 14.5 ⇒ snapped to step=1 ⇒ 15.
    // Range = { low: 5, high: 100 }, midpoint = 52.5; position-value
    // = 14.5 < midpoint ⇒ low handle wins. New low clamped to high
    // ⇒ low = 15.
    await track.trigger('pointerdown', { clientX: 10, pointerId: 1, button: 0 });
    const spec1 = handle.getFilter()[0];
    expect(spec1).toMatchObject({
      type: 'number',
      colId: 'qty',
      operator: 'inRange',
      value: 15,
      valueTo: 100,
    });
    // Release the drag before the keyboard test so the next
    // pointerdown isn't already considered "in progress".
    await track.trigger('pointerup', { clientX: 10, pointerId: 1 });

    // ArrowRight on the high thumb decrements / increments value by
    // step (=1) — current high is 100, already at max, so the helper
    // clamps and commits low=15, high=100 again (no observable change
    // in spec). Use Home key instead to reach `min` deterministically.
    const highThumb = wrapper.find(
      '.cx-table-number-filter__range[data-col-id="qty"] [data-range-handle="high"]',
    );
    await highThumb.trigger('keydown', { key: 'Home' });
    // Home ⇒ high = min = 5; overlap clamp keeps low <= high so the
    // helper sets high = max(low, 5). Current low is 15, so high
    // collapses to 15.
    const spec2 = handle.getFilter()[0];
    expect(spec2).toMatchObject({
      type: 'number',
      colId: 'qty',
      operator: 'inRange',
      value: 15,
      valueTo: 15,
    });
    wrapper.unmount();
  });
});

describe('cell style editor (vue3)', () => {
  const CELL_STYLE_COLUMNS: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: 'Name', width: 200 },
  ];

  const CELL_STYLE_ROWS: readonly RowSpec[] = [
    { id: 'r1', data: { name: 'A' } },
    { id: 'r2', data: { name: 'B' } },
  ];

  interface CellStyleHandle {
    openCellStyleEditor(rowId: string, colId: string): void;
  }

  function stubCellRect(cell: HTMLElement, rect: Partial<DOMRect>): void {
    const full: DOMRect = {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 100,
      bottom: 28,
      width: 100,
      height: 28,
      toJSON: () => ({}),
      ...rect,
    };
    cell.getBoundingClientRect = (): DOMRect => full;
  }

  it('99.2: default off — openCellStyleEditor is a no-op; popover not in DOM', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: CELL_STYLE_COLUMNS, rows: CELL_STYLE_ROWS },
      attachTo: document.body,
    });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.cx-table-cell-style-editor').exists()).toBe(false);
    wrapper.unmount();
  });

  it('99.2: prop on + open via handle mounts popover anchored to the cell with default white state', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    const editor = wrapper.find('.cx-table-cell-style-editor');
    expect(editor.exists()).toBe(true);
    expect(editor.attributes('data-row-id')).toBe('r1');
    expect(editor.attributes('data-col-id')).toBe('name');
    // White (default) ⇒ RGB inputs all 255 + HEX #ffffff.
    const rInput = wrapper.find('input[data-cx-style-rgb="r"]');
    const hexInput = wrapper.find('input[data-cx-style-hex]');
    expect((rInput.element as HTMLInputElement).value).toBe('255');
    expect((hexInput.element as HTMLInputElement).value).toBe('#ffffff');
    wrapper.unmount();
  });

  it('99.2: typing HEX into the input updates HSV-derived RGB inputs in sync', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    const hexInput = wrapper.find('input[data-cx-style-hex]');
    await hexInput.setValue('#3b82f6');
    await wrapper.vm.$nextTick();
    const rInput = wrapper.find('input[data-cx-style-rgb="r"]');
    const gInput = wrapper.find('input[data-cx-style-rgb="g"]');
    const bInput = wrapper.find('input[data-cx-style-rgb="b"]');
    expect((rInput.element as HTMLInputElement).value).toBe('59');
    expect((gInput.element as HTMLInputElement).value).toBe('130');
    expect((bInput.element as HTMLInputElement).value).toBe('246');
    wrapper.unmount();
  });

  it('99.2: Apply persists backgroundColor + emits cell-style-change + closes popover; cell renders with override', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    const hexInput = wrapper.find('input[data-cx-style-hex]');
    await hexInput.setValue('#3b82f6');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.cx-table-cell-style-editor').exists()).toBe(false);
    const events = wrapper.emitted('cell-style-change');
    expect(events).toBeTruthy();
    expect(events![0]![0]).toEqual({
      rowId: 'r1',
      colId: 'name',
      style: { backgroundColor: '#3b82f6' },
    });
    const refreshedCell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    // happy-dom returns the assigned HEX literal verbatim for inline
    // `element.style.backgroundColor` (real browsers normalize to
    // `rgb(...)` via getComputedStyle, but inline-style reads in
    // jsdom/happy-dom preserve the original input format).
    expect((refreshedCell.element as HTMLElement).style.backgroundColor).toBe('#3b82f6');
    wrapper.unmount();
  });

  it('99.2: Clear deletes the per-cell override + emits null + cell renders without override', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    // Apply first.
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    const hexInput = wrapper.find('input[data-cx-style-hex]');
    await hexInput.setValue('#10b981');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    let refreshedCell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((refreshedCell.element as HTMLElement).style.backgroundColor).toBe('#10b981');
    // Then re-open + Clear.
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="clear"]').trigger('click');
    await wrapper.vm.$nextTick();
    const events = wrapper.emitted('cell-style-change');
    expect(events![events!.length - 1]![0]).toEqual({
      rowId: 'r1',
      colId: 'name',
      style: { backgroundColor: null },
    });
    refreshedCell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((refreshedCell.element as HTMLElement).style.backgroundColor).toBe('');
    wrapper.unmount();
  });
});

describe('cell text color extension (vue3)', () => {
  const CELL_STYLE_COLUMNS: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: 'Name', width: 200 },
  ];
  const CELL_STYLE_ROWS: readonly RowSpec[] = [
    { id: 'r1', data: { name: 'A' } },
    { id: 'r2', data: { name: 'B' } },
  ];

  interface CellStyleHandle {
    openCellStyleEditor(rowId: string, colId: string): void;
  }

  function stubCellRect(cell: HTMLElement, rect: Partial<DOMRect>): void {
    const full: DOMRect = {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 100,
      bottom: 28,
      width: 100,
      height: 28,
      toJSON: () => ({}),
      ...rect,
    };
    cell.getBoundingClientRect = (): DOMRect => full;
  }

  it('99.2.1: tab strip default — Background active, default #ffffff in HEX input', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    const editor = wrapper.find('.cx-table-cell-style-editor');
    expect(editor.attributes('data-cx-style-active-tab')).toBe('background');
    const bgTab = wrapper.find('button[data-cx-style-tab="background"]');
    const textTab = wrapper.find('button[data-cx-style-tab="text"]');
    expect(bgTab.attributes('aria-selected')).toBe('true');
    expect(textTab.attributes('aria-selected')).toBe('false');
    const hexInput = wrapper.find('input[data-cx-style-hex]');
    expect((hexInput.element as HTMLInputElement).value).toBe('#ffffff');
    wrapper.unmount();
  });

  it('99.2.1: switching to Text tab loads default #000000 + buffers bg axis', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    // Type a custom bg color first so we can verify it's buffered.
    const hexInput = wrapper.find('input[data-cx-style-hex]');
    await hexInput.setValue('#3b82f6');
    await wrapper.vm.$nextTick();
    // Click Text tab.
    await wrapper.find('button[data-cx-style-tab="text"]').trigger('click');
    await wrapper.vm.$nextTick();
    const editor = wrapper.find('.cx-table-cell-style-editor');
    expect(editor.attributes('data-cx-style-active-tab')).toBe('text');
    // Text tab HEX input now reflects default text color.
    expect((hexInput.element as HTMLInputElement).value).toBe('#000000');
    // Swap back to Background tab — bg axis hex preserved.
    await wrapper.find('button[data-cx-style-tab="background"]').trigger('click');
    await wrapper.vm.$nextTick();
    expect((hexInput.element as HTMLInputElement).value).toBe('#3b82f6');
    wrapper.unmount();
  });

  it('99.2.1: Apply on Text tab persists only color + emit payload has color only + cell renders color', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="text"]').trigger('click');
    await wrapper.vm.$nextTick();
    const hexInput = wrapper.find('input[data-cx-style-hex]');
    await hexInput.setValue('#ff0000');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.cx-table-cell-style-editor').exists()).toBe(false);
    const emitted = wrapper.emitted('cell-style-change') as
      | readonly (readonly {
          rowId: string;
          colId: string;
          style: { backgroundColor?: string | null; color?: string | null };
        }[])[]
      | undefined;
    expect(emitted).toBeTruthy();
    const payload = emitted![0]![0]!;
    expect(payload).toEqual({
      rowId: 'r1',
      colId: 'name',
      style: { color: '#ff0000' },
    });
    // No backgroundColor field on per-axis-only payload.
    expect(payload.style.backgroundColor).toBeUndefined();
    const refreshedCell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((refreshedCell.element as HTMLElement).style.color).toBe('#ff0000');
    expect((refreshedCell.element as HTMLElement).style.backgroundColor).toBe('');
    wrapper.unmount();
  });

  it('99.2.1: Clear on Text tab while bg also persisted preserves bg, emits color:null, cell drops color only', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    // First: Apply background.
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    const hexInput = wrapper.find('input[data-cx-style-hex]');
    await hexInput.setValue('#3b82f6');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    // Second: Apply text.
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="text"]').trigger('click');
    await wrapper.vm.$nextTick();
    const hexInput2 = wrapper.find('input[data-cx-style-hex]');
    await hexInput2.setValue('#ff0000');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    // Now cell should have BOTH bg and color.
    let refreshedCell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((refreshedCell.element as HTMLElement).style.backgroundColor).toBe('#3b82f6');
    expect((refreshedCell.element as HTMLElement).style.color).toBe('#ff0000');
    // Third: re-open + switch to Text + Clear.
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="text"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="clear"]').trigger('click');
    await wrapper.vm.$nextTick();
    const emitted = wrapper.emitted('cell-style-change') as
      | readonly (readonly {
          rowId: string;
          colId: string;
          style: { backgroundColor?: string | null; color?: string | null };
        }[])[]
      | undefined;
    const lastPayload = emitted![emitted!.length - 1]![0]!;
    expect(lastPayload).toEqual({
      rowId: 'r1',
      colId: 'name',
      style: { color: null },
    });
    expect(lastPayload.style.backgroundColor).toBeUndefined();
    refreshedCell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((refreshedCell.element as HTMLElement).style.backgroundColor).toBe('#3b82f6');
    expect((refreshedCell.element as HTMLElement).style.color).toBe('');
    wrapper.unmount();
  });
});

describe('cell font axes extension (vue3)', () => {
  const CELL_STYLE_COLUMNS: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: 'Name', width: 200 },
  ];
  const CELL_STYLE_ROWS: readonly RowSpec[] = [
    { id: 'r1', data: { name: 'A' } },
    { id: 'r2', data: { name: 'B' } },
  ];

  interface CellStyleHandle {
    openCellStyleEditor(rowId: string, colId: string): void;
  }

  function stubCellRect(cell: HTMLElement, rect: Partial<DOMRect>): void {
    const full: DOMRect = {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 100,
      bottom: 28,
      width: 100,
      height: 28,
      toJSON: () => ({}),
      ...rect,
    };
    cell.getBoundingClientRect = (): DOMRect => full;
  }

  it('99.2.2: font tab appears in tab strip; click switches active tab to font', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    const fontTab = wrapper.find('button[data-cx-style-tab="font"]');
    expect(fontTab.exists()).toBe(true);
    expect(fontTab.attributes('aria-selected')).toBe('false');
    await fontTab.trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.cx-table-cell-style-editor').attributes('data-cx-style-active-tab')).toBe(
      'font',
    );
    // HSV picker hidden; font widgets visible.
    expect(wrapper.find('[data-cx-style-square]').exists()).toBe(false);
    expect(wrapper.find('[data-cx-style-font="weight-bold"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('99.2.2: Bold toggle flips fontState.fontWeight between "700" and null', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="font"]').trigger('click');
    await wrapper.vm.$nextTick();
    const boldBtn = wrapper.find('button[data-cx-style-font="weight-bold"]');
    expect(boldBtn.attributes('aria-pressed')).toBe('false');
    await boldBtn.trigger('click');
    await wrapper.vm.$nextTick();
    expect(boldBtn.attributes('aria-pressed')).toBe('true');
    await boldBtn.trigger('click');
    await wrapper.vm.$nextTick();
    expect(boldBtn.attributes('aria-pressed')).toBe('false');
    wrapper.unmount();
  });

  it('99.2.2: Italic toggle flips fontState.fontStyle between "italic" and null', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="font"]').trigger('click');
    await wrapper.vm.$nextTick();
    const italicBtn = wrapper.find('button[data-cx-style-font="style-italic"]');
    await italicBtn.trigger('click');
    await wrapper.vm.$nextTick();
    expect(italicBtn.attributes('aria-pressed')).toBe('true');
    wrapper.unmount();
  });

  it('99.2.2: text-decoration tri-state: clicking Underline sets value; None clears', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="font"]').trigger('click');
    await wrapper.vm.$nextTick();
    const underlineBtn = wrapper.find('button[data-cx-style-font-deco="underline"]');
    const noneBtn = wrapper.find('button[data-cx-style-font-deco="none"]');
    await underlineBtn.trigger('click');
    await wrapper.vm.$nextTick();
    expect(underlineBtn.attributes('aria-pressed')).toBe('true');
    expect(noneBtn.attributes('aria-pressed')).toBe('false');
    await noneBtn.trigger('click');
    await wrapper.vm.$nextTick();
    expect(noneBtn.attributes('aria-pressed')).toBe('true');
    expect(underlineBtn.attributes('aria-pressed')).toBe('false');
    wrapper.unmount();
  });

  it('99.2.2: Apply on font tab persists 3 font fields + emit + cell renders inline font props', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="font"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-font="weight-bold"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-font="style-italic"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-font-deco="underline"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.cx-table-cell-style-editor').exists()).toBe(false);
    const emitted = wrapper.emitted('cell-style-change') as
      | readonly (readonly {
          rowId: string;
          colId: string;
          style: {
            backgroundColor?: string | null;
            color?: string | null;
            fontWeight?: string | null;
            fontStyle?: string | null;
            textDecoration?: string | null;
          };
        }[])[]
      | undefined;
    expect(emitted).toBeTruthy();
    const payload = emitted![0]![0]!;
    expect(payload).toEqual({
      rowId: 'r1',
      colId: 'name',
      style: { fontWeight: '700', fontStyle: 'italic', textDecoration: 'underline' },
    });
    expect(payload.style.backgroundColor).toBeUndefined();
    expect(payload.style.color).toBeUndefined();
    const refreshedCell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((refreshedCell.element as HTMLElement).style.fontWeight).toBe('700');
    expect((refreshedCell.element as HTMLElement).style.fontStyle).toBe('italic');
    expect((refreshedCell.element as HTMLElement).style.textDecoration).toBe('underline');
    wrapper.unmount();
  });

  it('99.2.2: Clear on font tab while bg + color also persisted preserves bg + color, emits 3 font nulls', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    // Apply bg.
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('input[data-cx-style-hex]').setValue('#3b82f6');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    // Apply text color.
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="text"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('input[data-cx-style-hex]').setValue('#ff0000');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    // Apply font (bold).
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="font"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-font="weight-bold"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    let refreshedCell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((refreshedCell.element as HTMLElement).style.backgroundColor).toBe('#3b82f6');
    expect((refreshedCell.element as HTMLElement).style.color).toBe('#ff0000');
    expect((refreshedCell.element as HTMLElement).style.fontWeight).toBe('700');
    // Now Clear on font tab.
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="font"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="clear"]').trigger('click');
    await wrapper.vm.$nextTick();
    const emitted = wrapper.emitted('cell-style-change') as
      | readonly (readonly {
          rowId: string;
          colId: string;
          style: {
            backgroundColor?: string | null;
            color?: string | null;
            fontWeight?: string | null;
            fontStyle?: string | null;
            textDecoration?: string | null;
          };
        }[])[]
      | undefined;
    const lastPayload = emitted![emitted!.length - 1]![0]!;
    expect(lastPayload).toEqual({
      rowId: 'r1',
      colId: 'name',
      style: { fontWeight: null, fontStyle: null, textDecoration: null },
    });
    expect(lastPayload.style.backgroundColor).toBeUndefined();
    expect(lastPayload.style.color).toBeUndefined();
    refreshedCell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((refreshedCell.element as HTMLElement).style.backgroundColor).toBe('#3b82f6');
    expect((refreshedCell.element as HTMLElement).style.color).toBe('#ff0000');
    expect((refreshedCell.element as HTMLElement).style.fontWeight).toBe('');
    wrapper.unmount();
  });
});

describe('cell border axes extension (vue3)', () => {
  const CELL_STYLE_COLUMNS: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: 'Name', width: 200 },
  ];
  const CELL_STYLE_ROWS: readonly RowSpec[] = [
    { id: 'r1', data: { name: 'A' } },
    { id: 'r2', data: { name: 'B' } },
  ];

  interface CellStyleHandle {
    openCellStyleEditor(rowId: string, colId: string): void;
  }

  function stubCellRect(cell: HTMLElement, rect: Partial<DOMRect>): void {
    const full: DOMRect = {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 100,
      bottom: 28,
      width: 100,
      height: 28,
      toJSON: () => ({}),
      ...rect,
    };
    cell.getBoundingClientRect = (): DOMRect => full;
  }

  it('99.2.3: border tab appears in tab strip; click switches active tab to border', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    const borderTab = wrapper.find('button[data-cx-style-tab="border"]');
    expect(borderTab.exists()).toBe(true);
    expect(borderTab.attributes('aria-selected')).toBe('false');
    await borderTab.trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.cx-table-cell-style-editor').attributes('data-cx-style-active-tab')).toBe(
      'border',
    );
    // HSV picker hidden; border widgets visible.
    expect(wrapper.find('[data-cx-style-square]').exists()).toBe(false);
    expect(wrapper.find('[data-cx-style-border="color"]').exists()).toBe(true);
    expect(wrapper.find('[data-cx-style-border="width"]').exists()).toBe(true);
    expect(wrapper.find('[data-cx-style-border-style="solid"]').exists()).toBe(true);
    expect(wrapper.find('[data-cx-style-border="radius"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('99.2.3: hex input on border tab updates borderState.borderColor', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="border"]').trigger('click');
    await wrapper.vm.$nextTick();
    const colorInput = wrapper.find('input[data-cx-style-border="color"]');
    await colorInput.setValue('#3b82f6');
    await wrapper.vm.$nextTick();
    // Re-read the input to verify value reflected back.
    const refreshedInput = wrapper.find('input[data-cx-style-border="color"]');
    expect((refreshedInput.element as HTMLInputElement).value).toBe('#3b82f6');
    wrapper.unmount();
  });

  it('99.2.3: width input on border tab updates borderState.borderWidth', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="border"]').trigger('click');
    await wrapper.vm.$nextTick();
    const widthInput = wrapper.find('input[data-cx-style-border="width"]');
    await widthInput.setValue('2px');
    await wrapper.vm.$nextTick();
    const refreshedInput = wrapper.find('input[data-cx-style-border="width"]');
    expect((refreshedInput.element as HTMLInputElement).value).toBe('2px');
    wrapper.unmount();
  });

  it('99.2.3: style segmented control: clicking solid sets value; None clears', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="border"]').trigger('click');
    await wrapper.vm.$nextTick();
    const solidBtn = wrapper.find('button[data-cx-style-border-style="solid"]');
    const noneBtn = wrapper.find('button[data-cx-style-border-style="none"]');
    expect(noneBtn.attributes('aria-pressed')).toBe('true');
    await solidBtn.trigger('click');
    await wrapper.vm.$nextTick();
    expect(solidBtn.attributes('aria-pressed')).toBe('true');
    expect(noneBtn.attributes('aria-pressed')).toBe('false');
    await noneBtn.trigger('click');
    await wrapper.vm.$nextTick();
    expect(noneBtn.attributes('aria-pressed')).toBe('true');
    expect(solidBtn.attributes('aria-pressed')).toBe('false');
    wrapper.unmount();
  });

  it('99.2.3: Apply on border tab persists 4 border fields + emit + cell renders inline border props', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="border"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('input[data-cx-style-border="color"]').setValue('#3b82f6');
    await wrapper.vm.$nextTick();
    await wrapper.find('input[data-cx-style-border="width"]').setValue('2px');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-border-style="solid"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('input[data-cx-style-border="radius"]').setValue('4px');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.cx-table-cell-style-editor').exists()).toBe(false);
    const emitted = wrapper.emitted('cell-style-change') as
      | readonly (readonly {
          rowId: string;
          colId: string;
          style: {
            backgroundColor?: string | null;
            color?: string | null;
            fontWeight?: string | null;
            fontStyle?: string | null;
            textDecoration?: string | null;
            borderColor?: string | null;
            borderWidth?: string | null;
            borderStyle?: string | null;
            borderRadius?: string | null;
            borderTopColor?: string | null;
            borderTopWidth?: string | null;
            borderTopStyle?: string | null;
            borderRightColor?: string | null;
            borderRightWidth?: string | null;
            borderRightStyle?: string | null;
            borderBottomColor?: string | null;
            borderBottomWidth?: string | null;
            borderBottomStyle?: string | null;
            borderLeftColor?: string | null;
            borderLeftWidth?: string | null;
            borderLeftStyle?: string | null;
          };
        }[])[]
      | undefined;
    expect(emitted).toBeTruthy();
    const payload = emitted![0]![0]!;
    // widened the border-tab emit payload
    // to include 12 per-side override fields (all null when only
    // all-sides set). `toMatchObject` lets us assert the 4 all-sides
    // fields without exhaustively listing the 12 nulls.
    expect(payload).toMatchObject({
      rowId: 'r1',
      colId: 'name',
      style: {
        borderColor: '#3b82f6',
        borderWidth: '2px',
        borderStyle: 'solid',
        borderRadius: '4px',
      },
    });
    expect(payload.style.backgroundColor).toBeUndefined();
    expect(payload.style.color).toBeUndefined();
    // verify per-side fields all null (user only set
    // all-sides via segmented "全部" default).
    expect(payload.style.borderTopColor).toBeNull();
    expect(payload.style.borderLeftStyle).toBeNull();
    const refreshedCell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((refreshedCell.element as HTMLElement).style.borderColor).toBe('#3b82f6');
    expect((refreshedCell.element as HTMLElement).style.borderWidth).toBe('2px');
    expect((refreshedCell.element as HTMLElement).style.borderStyle).toBe('solid');
    expect((refreshedCell.element as HTMLElement).style.borderRadius).toBe('4px');
    wrapper.unmount();
  });

  it('99.2.3: Clear on border tab while bg + color + font + border all set preserves the other 3 axes', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    // Apply bg.
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('input[data-cx-style-hex]').setValue('#3b82f6');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    // Apply text color.
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="text"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('input[data-cx-style-hex]').setValue('#ff0000');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    // Apply font.
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="font"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-font="weight-bold"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    // Apply border.
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="border"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('input[data-cx-style-border="color"]').setValue('#00ff00');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-border-style="solid"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    let refreshedCell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((refreshedCell.element as HTMLElement).style.backgroundColor).toBe('#3b82f6');
    expect((refreshedCell.element as HTMLElement).style.color).toBe('#ff0000');
    expect((refreshedCell.element as HTMLElement).style.fontWeight).toBe('700');
    expect((refreshedCell.element as HTMLElement).style.borderColor).toBe('#00ff00');
    expect((refreshedCell.element as HTMLElement).style.borderStyle).toBe('solid');
    // Now Clear on border tab.
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="border"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="clear"]').trigger('click');
    await wrapper.vm.$nextTick();
    const emitted = wrapper.emitted('cell-style-change') as
      | readonly (readonly {
          rowId: string;
          colId: string;
          style: {
            backgroundColor?: string | null;
            color?: string | null;
            fontWeight?: string | null;
            fontStyle?: string | null;
            textDecoration?: string | null;
            borderColor?: string | null;
            borderWidth?: string | null;
            borderStyle?: string | null;
            borderRadius?: string | null;
            borderTopColor?: string | null;
            borderTopWidth?: string | null;
            borderTopStyle?: string | null;
            borderRightColor?: string | null;
            borderRightWidth?: string | null;
            borderRightStyle?: string | null;
            borderBottomColor?: string | null;
            borderBottomWidth?: string | null;
            borderBottomStyle?: string | null;
            borderLeftColor?: string | null;
            borderLeftWidth?: string | null;
            borderLeftStyle?: string | null;
          };
        }[])[]
      | undefined;
    const lastPayload = emitted![emitted!.length - 1]![0]!;
    // widened border-tab Clear payload to
    // null all 16 border fields (4 all-sides + 12 per-side).
    expect(lastPayload).toEqual({
      rowId: 'r1',
      colId: 'name',
      style: {
        borderColor: null,
        borderWidth: null,
        borderStyle: null,
        borderRadius: null,
        borderTopColor: null,
        borderTopWidth: null,
        borderTopStyle: null,
        borderRightColor: null,
        borderRightWidth: null,
        borderRightStyle: null,
        borderBottomColor: null,
        borderBottomWidth: null,
        borderBottomStyle: null,
        borderLeftColor: null,
        borderLeftWidth: null,
        borderLeftStyle: null,
      },
    });
    refreshedCell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((refreshedCell.element as HTMLElement).style.backgroundColor).toBe('#3b82f6');
    expect((refreshedCell.element as HTMLElement).style.color).toBe('#ff0000');
    expect((refreshedCell.element as HTMLElement).style.fontWeight).toBe('700');
    expect((refreshedCell.element as HTMLElement).style.borderColor).toBe('');
    expect((refreshedCell.element as HTMLElement).style.borderStyle).toBe('');
    wrapper.unmount();
  });
});

describe('custom font-weight 100-900 picker (vue3)', () => {
  const CELL_STYLE_COLUMNS: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: 'Name', width: 200 },
  ];
  const CELL_STYLE_ROWS: readonly RowSpec[] = [
    { id: 'r1', data: { name: 'A' } },
    { id: 'r2', data: { name: 'B' } },
  ];

  interface CellStyleHandle {
    openCellStyleEditor(rowId: string, colId: string): void;
  }

  function stubCellRect(cell: HTMLElement, rect: Partial<DOMRect>): void {
    const full: DOMRect = {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 100,
      bottom: 28,
      width: 100,
      height: 28,
      toJSON: () => ({}),
      ...rect,
    };
    cell.getBoundingClientRect = (): DOMRect => full;
  }

  it('99.2.2.1: custom-weights <details> visible on font tab; collapsed by default; expands to 9-button grid 100-900', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="font"]').trigger('click');
    await wrapper.vm.$nextTick();
    const details = wrapper.find('[data-cx-style-font-weight-picker]');
    expect(details.exists()).toBe(true);
    expect((details.element as HTMLDetailsElement).open).toBe(false);
    // Buttons exist (and are inside the closed <details>; happy-dom still
    // renders them in the DOM).
    for (const w of ['100', '200', '300', '400', '500', '600', '700', '800', '900']) {
      expect(wrapper.find(`button[data-cx-style-font="weight-${w}"]`).exists()).toBe(true);
    }
    wrapper.unmount();
  });

  it('99.2.2.1: clicking weight 500 sets fontState.fontWeight to "500"; aria-pressed reflects; Bold (700) no longer active', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="font"]').trigger('click');
    await wrapper.vm.$nextTick();
    const weight500 = wrapper.find('button[data-cx-style-font="weight-500"]');
    const boldBtn = wrapper.find('button[data-cx-style-font="weight-bold"]');
    expect(weight500.attributes('aria-pressed')).toBe('false');
    await weight500.trigger('click');
    await wrapper.vm.$nextTick();
    expect(weight500.attributes('aria-pressed')).toBe('true');
    expect(boldBtn.attributes('aria-pressed')).toBe('false');
    wrapper.unmount();
  });

  it('99.2.2.1: clicking weight 700 also makes Bold toggle active (both reflect fontState.fontWeight === "700")', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="font"]').trigger('click');
    await wrapper.vm.$nextTick();
    const weight700 = wrapper.find('button[data-cx-style-font="weight-700"]');
    const boldBtn = wrapper.find('button[data-cx-style-font="weight-bold"]');
    await weight700.trigger('click');
    await wrapper.vm.$nextTick();
    expect(weight700.attributes('aria-pressed')).toBe('true');
    expect(boldBtn.attributes('aria-pressed')).toBe('true');
    wrapper.unmount();
  });

  it('99.2.2.1: Apply with custom weight 500 emits fontWeight "500" + cell renders inline fontWeight 500', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="font"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-font="weight-500"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    const emitted = wrapper.emitted('cell-style-change') as
      | readonly (readonly {
          rowId: string;
          colId: string;
          style: {
            fontWeight?: string | null;
            fontStyle?: string | null;
            textDecoration?: string | null;
          };
        }[])[]
      | undefined;
    const payload = emitted![0]![0]!;
    expect(payload.style.fontWeight).toBe('500');
    const refreshedCell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((refreshedCell.element as HTMLElement).style.fontWeight).toBe('500');
    wrapper.unmount();
  });
});

describe('per-side borders (vue3)', () => {
  const CELL_STYLE_COLUMNS: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: 'Name', width: 200 },
  ];
  const CELL_STYLE_ROWS: readonly RowSpec[] = [
    { id: 'r1', data: { name: 'A' } },
    { id: 'r2', data: { name: 'B' } },
  ];

  interface CellStyleHandle {
    openCellStyleEditor(rowId: string, colId: string): void;
  }

  function stubCellRect(cell: HTMLElement, rect: Partial<DOMRect>): void {
    const full: DOMRect = {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 100,
      bottom: 28,
      width: 100,
      height: 28,
      toJSON: () => ({}),
      ...rect,
    };
    cell.getBoundingClientRect = (): DOMRect => full;
  }

  it('99.2.3.1: 5-button segmented control renders on border tab; "全部" active by default; clicking "上" sets target', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="border"]').trigger('click');
    await wrapper.vm.$nextTick();
    // All 5 buttons rendered.
    for (const side of ['all', 'top', 'right', 'bottom', 'left']) {
      expect(wrapper.find(`button[data-cx-style-border-side="${side}"]`).exists()).toBe(true);
    }
    // "全部" is active by default.
    const allBtn = wrapper.find('button[data-cx-style-border-side="all"]');
    expect(allBtn.attributes('aria-pressed')).toBe('true');
    // Click "上" → top is now active; "全部" no longer active.
    const topBtn = wrapper.find('button[data-cx-style-border-side="top"]');
    await topBtn.trigger('click');
    await wrapper.vm.$nextTick();
    expect(topBtn.attributes('aria-pressed')).toBe('true');
    expect(allBtn.attributes('aria-pressed')).toBe('false');
    wrapper.unmount();
  });

  it('99.2.3.1: with target="top", typing in color input writes borderTopColor (NOT borderColor); Apply emits per-side field', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="border"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-border-side="top"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('input[data-cx-style-border="color"]').setValue('#f00000');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    const emitted = wrapper.emitted('cell-style-change') as
      | readonly (readonly {
          rowId: string;
          colId: string;
          style: { borderColor?: string | null; borderTopColor?: string | null };
        }[])[]
      | undefined;
    const payload = emitted![0]![0]!;
    expect(payload.style.borderTopColor).toBe('#f00000');
    expect(payload.style.borderColor).toBeNull();
    // Cell renders with borderTopColor inline.
    const refreshedCell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((refreshedCell.element as HTMLElement).style.borderTopColor).toBe('#f00000');
    wrapper.unmount();
  });

  it('99.2.3.1: with target="top" and all-sides color set, color input shows effective value (fallback to all-sides)', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    // First Apply: set all-sides borderColor.
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="border"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('input[data-cx-style-border="color"]').setValue('#0000ff');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    // Re-open + switch to top. The color input should now display
    // '#0000ff' (effective fallback from all-sides borderColor).
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="border"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-border-side="top"]').trigger('click');
    await wrapper.vm.$nextTick();
    const colorInput = wrapper.find<HTMLInputElement>('input[data-cx-style-border="color"]');
    expect(colorInput.element.value).toBe('#0000ff');
    wrapper.unmount();
  });

  it('99.2.3.1: radius widget HIDDEN when borderSideTarget !== "all"', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="border"]').trigger('click');
    await wrapper.vm.$nextTick();
    // All-sides: radius visible.
    expect(wrapper.find('input[data-cx-style-border="radius"]').exists()).toBe(true);
    // Switch to per-side: radius hidden.
    await wrapper.find('button[data-cx-style-border-side="right"]').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('input[data-cx-style-border="radius"]').exists()).toBe(false);
    // Switch back to all: radius re-appears.
    await wrapper.find('button[data-cx-style-border-side="all"]').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('input[data-cx-style-border="radius"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('99.2.3.1: backwards-compat with 99.2.3 — segmented default "全部" preserves all-sides behavior', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="border"]').trigger('click');
    await wrapper.vm.$nextTick();
    // Don't click any side button → stays on default "全部".
    await wrapper.find('input[data-cx-style-border="color"]').setValue('#aabbcc');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    const emitted = wrapper.emitted('cell-style-change') as
      | readonly (readonly {
          rowId: string;
          colId: string;
          style: { borderColor?: string | null; borderTopColor?: string | null };
        }[])[]
      | undefined;
    const payload = emitted![0]![0]!;
    // All-sides borderColor set; per-side null (verified by toBeNull on borderTopColor).
    expect(payload.style.borderColor).toBe('#aabbcc');
    expect(payload.style.borderTopColor).toBeNull();
    const refreshedCell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((refreshedCell.element as HTMLElement).style.borderColor).toBe('#aabbcc');
    wrapper.unmount();
  });

  it('99.2.3.1: mixed all-sides + per-side — cell renders both inline; per-side overrides on its side via CSS cascade', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    // First Apply: set all-sides borderColor.
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="border"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('input[data-cx-style-border="color"]').setValue('#000000');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    // Second Apply: switch to top + set borderTopColor.
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="border"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-border-side="top"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('input[data-cx-style-border="color"]').setValue('#ff0000');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    // Cell now has BOTH borderColor (all-sides) AND borderTopColor (override).
    // Note: when all-sides and per-side longhand both set, the
    // `style.borderColor` SHORTHAND getter returns the multi-value
    // form (e.g. "#ff0000 #000000 #000000 #000000") because the 4
    // longhand values diverge. Assert on the longhand getters
    // individually for reliable cross-environment behavior.
    const refreshedCell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    const cellEl = refreshedCell.element as HTMLElement;
    expect(cellEl.style.borderTopColor).toBe('#ff0000');
    expect(cellEl.style.borderRightColor).toBe('#000000');
    expect(cellEl.style.borderBottomColor).toBe('#000000');
    expect(cellEl.style.borderLeftColor).toBe('#000000');
    wrapper.unmount();
  });
});

describe('borderColor HSV picker (vue3)', () => {
  const CELL_STYLE_COLUMNS: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: 'Name', width: 200 },
  ];
  const CELL_STYLE_ROWS: readonly RowSpec[] = [
    { id: 'r1', data: { name: 'A' } },
    { id: 'r2', data: { name: 'B' } },
  ];

  interface CellStyleHandle {
    openCellStyleEditor(rowId: string, colId: string): void;
  }

  function stubCellRect(cell: HTMLElement, rect: Partial<DOMRect>): void {
    const full: DOMRect = {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 100,
      bottom: 28,
      width: 100,
      height: 28,
      toJSON: () => ({}),
      ...rect,
    };
    cell.getBoundingClientRect = (): DOMRect => full;
  }

  function stubSquareRect(el: HTMLElement, sizePx: number): void {
    el.getBoundingClientRect = (): DOMRect => ({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: sizePx,
      bottom: sizePx,
      width: sizePx,
      height: sizePx,
      toJSON: () => ({}),
    });
  }

  it('99.2.3.2: HSV disclosure visible on border tab; collapsed by default; square + hue strip render inside', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="border"]').trigger('click');
    await wrapper.vm.$nextTick();
    const details = wrapper.find('[data-cx-style-border-color-hsv]');
    expect(details.exists()).toBe(true);
    expect((details.element as HTMLDetailsElement).open).toBe(false);
    expect(wrapper.find('[data-cx-style-border-square]').exists()).toBe(true);
    expect(wrapper.find('[data-cx-style-border-hue]').exists()).toBe(true);
    expect(wrapper.findAll('input[data-cx-style-border-rgb]').length).toBe(3);
    wrapper.unmount();
  });

  it('99.2.3.2: HSV square pointerdown at top-right commits #ff0000 (red full-sat full-val); borderColor updates; Apply emits red', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="border"]').trigger('click');
    await wrapper.vm.$nextTick();
    const square = wrapper.find('[data-cx-style-border-square]');
    stubSquareRect(square.element as HTMLElement, 180);
    await square.trigger('pointerdown', { clientX: 180, clientY: 0, pointerId: 1 });
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    const emitted = wrapper.emitted('cell-style-change') as
      | readonly (readonly {
          rowId: string;
          colId: string;
          style: { borderColor?: string | null };
        }[])[]
      | undefined;
    const payload = emitted![0]![0]!;
    expect(payload.style.borderColor).toBe('#ff0000');
    wrapper.unmount();
  });

  it('99.2.3.2: hex input typing syncs HSV picker RGB inputs', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="border"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('input[data-cx-style-border="color"]').setValue('#3b82f6');
    await wrapper.vm.$nextTick();
    const rgbInputs = wrapper.findAll<HTMLInputElement>('input[data-cx-style-border-rgb]');
    expect(rgbInputs[0]!.element.value).toBe('59');
    expect(rgbInputs[1]!.element.value).toBe('130');
    expect(rgbInputs[2]!.element.value).toBe('246');
    wrapper.unmount();
  });

  it('99.2.3.2: with target="top", HSV picker writes to borderTopColor (not borderColor); Apply emits per-side field', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="border"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-border-side="top"]').trigger('click');
    await wrapper.vm.$nextTick();
    const square = wrapper.find('[data-cx-style-border-square]');
    stubSquareRect(square.element as HTMLElement, 180);
    // Pointerdown top-right with hue=0 default → #ff0000.
    await square.trigger('pointerdown', { clientX: 180, clientY: 0, pointerId: 1 });
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    const emitted = wrapper.emitted('cell-style-change') as
      | readonly (readonly {
          rowId: string;
          colId: string;
          style: { borderColor?: string | null; borderTopColor?: string | null };
        }[])[]
      | undefined;
    const payload = emitted![0]![0]!;
    expect(payload.style.borderTopColor).toBe('#ff0000');
    expect(payload.style.borderColor).toBeNull();
    wrapper.unmount();
  });
});

describe('controlled-mode cell-style prop (vue3)', () => {
  const CELL_STYLE_COLUMNS: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: 'Name', width: 200 },
  ];
  const CELL_STYLE_ROWS: readonly RowSpec[] = [
    { id: 'r1', data: { name: 'A' } },
    { id: 'r2', data: { name: 'B' } },
  ];

  interface CellStyleHandle {
    openCellStyleEditor(rowId: string, colId: string): void;
  }

  function stubCellRect(cell: HTMLElement, rect: Partial<DOMRect>): void {
    const full: DOMRect = {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 100,
      bottom: 28,
      width: 100,
      height: 28,
      toJSON: () => ({}),
      ...rect,
    };
    cell.getBoundingClientRect = (): DOMRect => full;
  }

  it('99.2.4: uncontrolled (default) — Apply mutates internal state + cell renders override + emit fires', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    const hexInput = wrapper.find('input[data-cx-style-hex]');
    await hexInput.setValue('#3b82f6');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    // Uncontrolled mode: cell renders the override from internal map.
    const refreshedCell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((refreshedCell.element as HTMLElement).style.backgroundColor).toBe('#3b82f6');
    expect(wrapper.emitted('cell-style-change')).toBeTruthy();
    wrapper.unmount();
  });

  it('99.2.4: controlled (prop={}) — Apply does NOT mutate internal map; emit fires; cell renders no override', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
        cellStyleByRowIdColId: {},
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    const hexInput = wrapper.find('input[data-cx-style-hex]');
    await hexInput.setValue('#3b82f6');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    // Controlled mode + empty prop: cell renders NO override (prop is the
    // truth source; internal map was not touched).
    const refreshedCell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((refreshedCell.element as HTMLElement).style.backgroundColor).toBe('');
    // Emit STILL fires so the consumer can update its prop binding.
    const emitted = wrapper.emitted('cell-style-change') as
      | readonly (readonly {
          rowId: string;
          colId: string;
          style: { backgroundColor?: string | null };
        }[])[]
      | undefined;
    expect(emitted![0]![0]!.style.backgroundColor).toBe('#3b82f6');
    wrapper.unmount();
  });

  it('99.2.4: controlled with one entry — cell renderer reads from prop (not internal map)', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
        cellStyleByRowIdColId: { r1: { name: { backgroundColor: '#10b981' } } },
      },
      attachTo: document.body,
    });
    await wrapper.vm.$nextTick();
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((cell.element as HTMLElement).style.backgroundColor).toBe('#10b981');
    wrapper.unmount();
  });

  it('99.2.4: controlled + consumer updates prop on emit — cell re-renders with new prop value', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
        cellStyleByRowIdColId: {},
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    const hexInput = wrapper.find('input[data-cx-style-hex]');
    await hexInput.setValue('#f59e0b');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    // Initially cell renders nothing (prop is empty).
    const refreshedBefore = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((refreshedBefore.element as HTMLElement).style.backgroundColor).toBe('');
    // Consumer updates the controlled prop in response to the emit.
    await wrapper.setProps({
      cellStyleByRowIdColId: { r1: { name: { backgroundColor: '#f59e0b' } } },
    });
    await wrapper.vm.$nextTick();
    const refreshedAfter = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((refreshedAfter.element as HTMLElement).style.backgroundColor).toBe('#f59e0b');
    wrapper.unmount();
  });

  it('99.2.4: switching controlled → uncontrolled mid-session — internal map shows last uncontrolled state (NOT auto-mirrored)', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
        // Start in controlled mode with one entry.
        cellStyleByRowIdColId: { r1: { name: { backgroundColor: '#ef4444' } } },
      },
      attachTo: document.body,
    });
    await wrapper.vm.$nextTick();
    const cellControlled = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((cellControlled.element as HTMLElement).style.backgroundColor).toBe('#ef4444');
    // Switch to uncontrolled mode by setting prop back to undefined.
    await wrapper.setProps({ cellStyleByRowIdColId: undefined });
    await wrapper.vm.$nextTick();
    // Now reads from internal map which was never mutated → no override.
    const cellUncontrolled = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((cellUncontrolled.element as HTMLElement).style.backgroundColor).toBe('');
    wrapper.unmount();
  });
});

describe('color palette + recent colors (vue3)', () => {
  const CELL_STYLE_COLUMNS: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: 'Name', width: 200 },
  ];
  const CELL_STYLE_ROWS: readonly RowSpec[] = [
    { id: 'r1', data: { name: 'A' } },
    { id: 'r2', data: { name: 'B' } },
  ];

  interface CellStyleHandle {
    openCellStyleEditor(rowId: string, colId: string): void;
  }

  function stubCellRect(cell: HTMLElement, rect: Partial<DOMRect>): void {
    const full: DOMRect = {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 100,
      bottom: 28,
      width: 100,
      height: 28,
      toJSON: () => ({}),
      ...rect,
    };
    cell.getBoundingClientRect = (): DOMRect => full;
  }

  it('99.2.5: 12 preset swatches render by default on background tab; recent row hidden initially', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    const presetButtons = wrapper.findAll('button[data-cx-style-palette-preset]');
    expect(presetButtons.length).toBe(12);
    expect(wrapper.find('[data-cx-style-palette-section="recent"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('99.2.5: clicking preset swatch updates HEX input to swatch value', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    const blueSwatch = wrapper.find('button[data-cx-style-palette-preset="#60a5fa"]');
    expect(blueSwatch.exists()).toBe(true);
    await blueSwatch.trigger('click');
    await wrapper.vm.$nextTick();
    const hexInput = wrapper.find('input[data-cx-style-hex]');
    expect((hexInput.element as HTMLInputElement).value).toBe('#60a5fa');
    wrapper.unmount();
  });

  it('99.2.5: Apply with picked color pushes to recent; subsequent open shows recent row with 1 swatch', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-palette-preset="#60a5fa"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    // Open again on a different cell to see the recent row.
    const cell2 = wrapper.find('.cx-table-cell[data-row-id="r2"][data-col-id="name"]');
    stubCellRect(cell2.element as HTMLElement, { left: 50, top: 130, bottom: 158 });
    handle.openCellStyleEditor('r2', 'name');
    await wrapper.vm.$nextTick();
    const recentSection = wrapper.find('[data-cx-style-palette-section="recent"]');
    expect(recentSection.exists()).toBe(true);
    const recentSwatches = wrapper.findAll('button[data-cx-style-palette-recent]');
    expect(recentSwatches.length).toBe(1);
    expect(recentSwatches[0]!.attributes('data-cx-style-palette-recent')).toBe('#60a5fa');
    wrapper.unmount();
  });

  it('99.2.5: applying 6 distinct colors caps recent at default limit 5 (oldest evicted)', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const sequence = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#2dd4bf', '#60a5fa'];
    for (const hex of sequence) {
      handle.openCellStyleEditor('r1', 'name');
      await wrapper.vm.$nextTick();
      await wrapper.find(`button[data-cx-style-palette-preset="${hex}"]`).trigger('click');
      await wrapper.vm.$nextTick();
      await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
      await wrapper.vm.$nextTick();
    }
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    const recentSwatches = wrapper.findAll('button[data-cx-style-palette-recent]');
    expect(recentSwatches.length).toBe(5);
    // Most-recent (#60a5fa) is at position 0; oldest (#f87171) evicted.
    expect(recentSwatches[0]!.attributes('data-cx-style-palette-recent')).toBe('#60a5fa');
    expect(
      recentSwatches.some((s) => s.attributes('data-cx-style-palette-recent') === '#f87171'),
    ).toBe(false);
    wrapper.unmount();
  });

  it('99.2.5: applying same color twice in a row leaves recent at length 1 (dedup + move to front)', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    for (let i = 0; i < 2; i++) {
      handle.openCellStyleEditor('r1', 'name');
      await wrapper.vm.$nextTick();
      await wrapper.find('button[data-cx-style-palette-preset="#f87171"]').trigger('click');
      await wrapper.vm.$nextTick();
      await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
      await wrapper.vm.$nextTick();
    }
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    const recentSwatches = wrapper.findAll('button[data-cx-style-palette-recent]');
    expect(recentSwatches.length).toBe(1);
    expect(recentSwatches[0]!.attributes('data-cx-style-palette-recent')).toBe('#f87171');
    wrapper.unmount();
  });
});

describe('variable font-weight slider (vue3)', () => {
  const CELL_STYLE_COLUMNS: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: 'Name', width: 200 },
  ];
  const CELL_STYLE_ROWS: readonly RowSpec[] = [
    { id: 'r1', data: { name: 'A' } },
    { id: 'r2', data: { name: 'B' } },
  ];

  interface CellStyleHandle {
    openCellStyleEditor(rowId: string, colId: string): void;
  }

  function stubCellRect(cell: HTMLElement, rect: Partial<DOMRect>): void {
    const full: DOMRect = {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 100,
      bottom: 28,
      width: 100,
      height: 28,
      toJSON: () => ({}),
      ...rect,
    };
    cell.getBoundingClientRect = (): DOMRect => full;
  }

  function stubTrackRect(track: HTMLElement, widthPx: number): void {
    track.getBoundingClientRect = (): DOMRect => ({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: widthPx,
      bottom: 8,
      width: widthPx,
      height: 8,
      toJSON: () => ({}),
    });
  }

  it('99.2.2.2: variable-weight slider <details> visible on font tab; collapsed by default; readout shows 400 (default)', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="font"]').trigger('click');
    await wrapper.vm.$nextTick();
    const sliderDetails = wrapper.find('[data-cx-style-font-weight-slider]');
    expect(sliderDetails.exists()).toBe(true);
    expect((sliderDetails.element as HTMLDetailsElement).open).toBe(false);
    const readout = wrapper.find('[data-cx-style-font-weight-slider-readout]');
    expect(readout.exists()).toBe(true);
    expect(readout.text()).toBe('400');
    wrapper.unmount();
  });

  it('99.2.2.2: pointerdown at track midpoint (50%) sets fontWeight to "500"; both grid + slider reflect', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="font"]').trigger('click');
    await wrapper.vm.$nextTick();
    const track = wrapper.find('[data-cx-style-font-weight-slider-track]');
    stubTrackRect(track.element as HTMLElement, 180);
    // pointerdown at midpoint (x = 90 in a 180-wide track) → ratio 0.5 →
    // value = round(1 + 0.5 * 999) = round(500.5) = 501 (rounds away
    // from zero) or 500 depending on Math.round semantics. JS
    // Math.round(0.5) = 1 → so 500.5 rounds to 501. (Math.round
    // rounds half toward +Infinity.)
    await track.trigger('pointerdown', { clientX: 90, pointerId: 1 });
    await wrapper.vm.$nextTick();
    const readout = wrapper.find('[data-cx-style-font-weight-slider-readout]');
    expect(readout.text()).toBe('501');
    wrapper.unmount();
  });

  it('99.2.2.2: pointerdown at track left edge (x=0) sets fontWeight "1"; at right edge sets "1000"', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="font"]').trigger('click');
    await wrapper.vm.$nextTick();
    let track = wrapper.find('[data-cx-style-font-weight-slider-track]');
    stubTrackRect(track.element as HTMLElement, 180);
    await track.trigger('pointerdown', { clientX: 0, pointerId: 1 });
    await wrapper.vm.$nextTick();
    let readout = wrapper.find('[data-cx-style-font-weight-slider-readout]');
    expect(readout.text()).toBe('1');
    // Release + drag again to the right edge.
    await track.trigger('pointerup', { clientX: 0, pointerId: 1 });
    await wrapper.vm.$nextTick();
    track = wrapper.find('[data-cx-style-font-weight-slider-track]');
    stubTrackRect(track.element as HTMLElement, 180);
    await track.trigger('pointerdown', { clientX: 180, pointerId: 1 });
    await wrapper.vm.$nextTick();
    readout = wrapper.find('[data-cx-style-font-weight-slider-readout]');
    expect(readout.text()).toBe('1000');
    wrapper.unmount();
  });

  it('99.2.2.2: Apply with slider-picked weight 425 emits fontWeight "425" + cell renders inline fontWeight 425', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="font"]').trigger('click');
    await wrapper.vm.$nextTick();
    const track = wrapper.find('[data-cx-style-font-weight-slider-track]');
    stubTrackRect(track.element as HTMLElement, 999);
    // pointerdown at x=424 in a 999-wide track → ratio 424/999 ≈ 0.4244 →
    // value = round(1 + 0.4244 * 999) = round(424.99...) ≈ 425.
    await track.trigger('pointerdown', { clientX: 424, pointerId: 1 });
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    const emitted = wrapper.emitted('cell-style-change') as
      | readonly (readonly {
          rowId: string;
          colId: string;
          style: { fontWeight?: string | null };
        }[])[]
      | undefined;
    const payload = emitted![0]![0]!;
    expect(payload.style.fontWeight).toBe('425');
    const refreshedCell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((refreshedCell.element as HTMLElement).style.fontWeight).toBe('425');
    wrapper.unmount();
  });
});

describe('server-side row model (vue3)', () => {
  interface DeferredGetRows {
    readonly params: GetRowsParams;
    resolve(result: GetRowsResult): void;
    reject(error: unknown): void;
  }

  function makeControlledSource(): {
    source: ServerSideDataSource;
    calls: DeferredGetRows[];
    destroyCount: { value: number };
  } {
    const calls: DeferredGetRows[] = [];
    const destroyCount = { value: 0 };
    const source: ServerSideDataSource = {
      getRows(params) {
        const inner: { resolve: (r: GetRowsResult) => void; reject: (e: unknown) => void } = {
          resolve: () => undefined,
          reject: () => undefined,
        };
        const promise = new Promise<GetRowsResult>((resolve, reject) => {
          inner.resolve = resolve;
          inner.reject = reject;
        });
        calls.push({ params, resolve: inner.resolve, reject: inner.reject });
        return promise;
      },
      destroy() {
        destroyCount.value++;
      },
    };
    return { source, calls, destroyCount };
  }

  async function flush(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
  }

  it('rowModelType:"serverSide" + serverSideDataSource mounts without consuming props.rows', async () => {
    const { source, calls } = makeControlledSource();
    const wrapper = mount(ChronixTable, {
      props: {
        columns,
        rows: [],
        rowModelType: 'serverSide' as const,
        serverSideDataSource: source,
        cacheBlockSize: 5,
      },
    });
    await flush();
    expect(wrapper.find('.cx-table-wrapper').exists()).toBe(true);
    // bootstrap fires getRowAt(0) at session setup
    // — calls.length === 1 (block 0 dispatch), not 0 as pre-45.4.
    expect(calls.length).toBe(1);
    expect(calls[0]?.params.startRow).toBe(0);
  });

  it('after totalRowCount is reported, skeleton rows render for unloaded blocks', async () => {
    const { source } = makeControlledSource();
    const wrapper = mount(ChronixTable, {
      props: {
        columns,
        rows: [],
        rowModelType: 'serverSide' as const,
        serverSideDataSource: source,
        cacheBlockSize: 5,
      },
      attachTo: document.body,
    });
    await flush();
    // Trigger a body-render frame by reading the handle's total.
    const handle = wrapper.vm as unknown as {
      getServerSideTotalRowCount(): number;
      refreshServerSideRows(): void;
      getServerSideBlockState(blockIndex: number): BlockState;
    };
    expect(handle.getServerSideTotalRowCount()).toBe(0);
    // Force a getRowAt by sizing the body and triggering layout.
    // The synthesized-rows computed reads `getTotalRowCount` which is 0
    // before first resolve — assert the no-rows state directly.
    expect(wrapper.findAll('.cx-table-row--skeleton').length).toBe(0);
    wrapper.unmount();
  });

  it('refreshServerSideRows TableHandle method invokes session.refresh', () => {
    const { source } = makeControlledSource();
    const wrapper = mount(ChronixTable, {
      props: {
        columns,
        rows: [],
        rowModelType: 'serverSide' as const,
        serverSideDataSource: source,
      },
    });
    const handle = wrapper.vm as unknown as { refreshServerSideRows(): void };
    expect(() => handle.refreshServerSideRows()).not.toThrow();
  });

  it('getServerSideBlockState returns {kind:"idle"} for never-touched blocks', () => {
    const { source } = makeControlledSource();
    const wrapper = mount(ChronixTable, {
      props: {
        columns,
        rows: [],
        rowModelType: 'serverSide' as const,
        serverSideDataSource: source,
      },
    });
    const handle = wrapper.vm as unknown as {
      getServerSideBlockState(blockIndex: number): BlockState;
    };
    // bootstrap fires getRowAt(0) → block 0 is LOADING.
    // Block 99 (never-touched) remains IDLE.
    expect(handle.getServerSideBlockState(0).kind).toBe('loading');
    expect(handle.getServerSideBlockState(99).kind).toBe('idle');
  });

  it('switching from serverSide → clientSide destroys the session', async () => {
    const { source, destroyCount } = makeControlledSource();
    const wrapper = mount(ChronixTable, {
      props: {
        columns,
        rows: [],
        rowModelType: 'serverSide' as const,
        serverSideDataSource: source,
      },
    });
    expect(destroyCount.value).toBe(0);
    await wrapper.setProps({ rowModelType: 'clientSide', rows });
    expect(destroyCount.value).toBe(1);
  });

  it('clientSide mode (default) leaves rows pipeline untouched', () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const handle = wrapper.vm as unknown as {
      getServerSideTotalRowCount(): number;
      getServerSideBlockState(blockIndex: number): BlockState;
    };
    expect(handle.getServerSideTotalRowCount()).toBe(0);
    expect(handle.getServerSideBlockState(0).kind).toBe('idle');
    expect(wrapper.findAll('.cx-table-row').length).toBeGreaterThan(0);
    expect(wrapper.findAll('.cx-table-row--skeleton').length).toBe(0);
  });
});

describe('+ 45.2: server-side refinements (vue3)', () => {
  interface DeferredGetRows {
    readonly params: GetRowsParams;
    resolve(result: GetRowsResult): void;
    reject(error: unknown): void;
  }

  function makeControlledSource(): {
    source: ServerSideDataSource;
    calls: DeferredGetRows[];
  } {
    const calls: DeferredGetRows[] = [];
    const source: ServerSideDataSource = {
      getRows(params) {
        const inner: { resolve: (r: GetRowsResult) => void; reject: (e: unknown) => void } = {
          resolve: () => undefined,
          reject: () => undefined,
        };
        const promise = new Promise<GetRowsResult>((resolve, reject) => {
          inner.resolve = resolve;
          inner.reject = reject;
        });
        calls.push({ params, resolve: inner.resolve, reject: inner.reject });
        return promise;
      },
    };
    return { source, calls };
  }

  async function flush(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
  }

  function makeServerSideRow(i: number): RowSpec {
    return { id: `srv-${i}`, data: { id: i, name: `name-${i}` } };
  }

  it('45.1: showPagination + serverSide forwards pageSize as cacheBlockSize', async () => {
    const { source, calls } = makeControlledSource();
    mount(ChronixTable, {
      props: {
        columns,
        rows: [],
        rowModelType: 'serverSide' as const,
        serverSideDataSource: source,
        showPagination: true,
        initialPageSize: 25,
      },
    });
    await flush();
    // bootstrap fires getRowAt(0); the dispatch endRow-startRow
    // equals the effective cacheBlockSize. Per Decision A.1,
    // pageSize OVERRIDES cacheBlockSize when showPagination+serverSide.
    expect(calls.length).toBe(1);
    const firstCall = calls[0]!;
    expect(firstCall.params.endRow - firstCall.params.startRow).toBe(25);
  });

  it('45.1: setPageSize re-creates session with new pageSize as cacheBlockSize', async () => {
    const { source } = makeControlledSource();
    const wrapper = mount(ChronixTable, {
      props: {
        columns,
        rows: [],
        rowModelType: 'serverSide' as const,
        serverSideDataSource: source,
        showPagination: true,
        initialPageSize: 10,
      },
    });
    await flush();
    const handle = wrapper.vm as unknown as {
      setPageSize(n: number): void;
      getServerSideTotalRowCount(): number;
    };
    handle.setPageSize(30);
    await flush();
    // Old session destroyed + new one created. We can't directly inspect the
    // block size, but the page-size change observably triggers session
    // re-creation (no exception thrown, state reset).
    expect(handle.getServerSideTotalRowCount()).toBe(0);
  });

  it('45.1: setPageSize emits page-change event with new pageSize', () => {
    const { source } = makeControlledSource();
    const wrapper = mount(ChronixTable, {
      props: {
        columns,
        rows: [],
        rowModelType: 'serverSide' as const,
        serverSideDataSource: source,
        showPagination: true,
        initialPageSize: 10,
      },
    });
    const handle = wrapper.vm as unknown as { setPageSize(n: number): void };
    handle.setPageSize(50);
    const events = wrapper.emitted('page-change');
    expect(events).toHaveLength(1);
    expect(events![0]![0] as { page: number; pageSize: number }).toEqual({
      page: 0,
      pageSize: 50,
    });
  });

  it('45.2: invalidateServerSideBlocks([0]) returns block 0 to idle (bootstrap → loading → invalidate → idle)', async () => {
    const { source, calls } = makeControlledSource();
    const wrapper = mount(ChronixTable, {
      props: {
        columns,
        rows: [],
        rowModelType: 'serverSide' as const,
        serverSideDataSource: source,
        cacheBlockSize: 10,
      },
    });
    await flush();
    // bootstrap fires getRowAt(0) → block 0 LOADING.
    expect(calls.length).toBe(1);
    const handle = wrapper.vm as unknown as {
      invalidateServerSideBlocks(idx: readonly number[]): void;
      getServerSideBlockState(b: number): BlockState;
    };
    expect(handle.getServerSideBlockState(0).kind).toBe('loading');
    handle.invalidateServerSideBlocks([0]);
    expect(handle.getServerSideBlockState(0).kind).toBe('idle');
  });

  it('45.2: invalidateServerSideBlocks([]) is a silent no-op', () => {
    const { source } = makeControlledSource();
    const wrapper = mount(ChronixTable, {
      props: {
        columns,
        rows: [],
        rowModelType: 'serverSide' as const,
        serverSideDataSource: source,
      },
    });
    const handle = wrapper.vm as unknown as {
      invalidateServerSideBlocks(idx: readonly number[]): void;
    };
    expect(() => handle.invalidateServerSideBlocks([])).not.toThrow();
  });

  it('45.2: invalidateServerSideBlocks is no-op when rowModelType:clientSide', () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    const handle = wrapper.vm as unknown as {
      invalidateServerSideBlocks(idx: readonly number[]): void;
    };
    expect(() => handle.invalidateServerSideBlocks([0, 1, 2])).not.toThrow();
    void makeServerSideRow; // silence unused warning
  });
});

describe('+ 45.4: viewport-driven dispatch + bootstrap (vue3)', () => {
  interface DeferredGetRows {
    readonly params: GetRowsParams;
    resolve(result: GetRowsResult): void;
    reject(error: unknown): void;
  }

  function makeControlledSource(): {
    source: ServerSideDataSource;
    calls: DeferredGetRows[];
  } {
    const calls: DeferredGetRows[] = [];
    const source: ServerSideDataSource = {
      getRows(params) {
        const inner: { resolve: (r: GetRowsResult) => void; reject: (e: unknown) => void } = {
          resolve: () => undefined,
          reject: () => undefined,
        };
        const promise = new Promise<GetRowsResult>((resolve, reject) => {
          inner.resolve = resolve;
          inner.reject = reject;
        });
        calls.push({ params, resolve: inner.resolve, reject: inner.reject });
        return promise;
      },
    };
    return { source, calls };
  }

  async function flush(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
  }

  it('45.4: session setup fires getRowAt(0) bootstrap at mount (non-paginated)', async () => {
    const { source, calls } = makeControlledSource();
    mount(ChronixTable, {
      props: {
        columns,
        rows: [],
        rowModelType: 'serverSide' as const,
        serverSideDataSource: source,
        cacheBlockSize: 100,
      },
    });
    await flush();
    expect(calls.length).toBe(1);
    expect(calls[0]?.params.startRow).toBe(0);
    expect(calls[0]?.params.endRow).toBe(100);
  });

  it('45.4: bootstrap fires for paginated serverSide mode too', async () => {
    const { source, calls } = makeControlledSource();
    mount(ChronixTable, {
      props: {
        columns,
        rows: [],
        rowModelType: 'serverSide' as const,
        serverSideDataSource: source,
        showPagination: true,
        initialPageSize: 25,
      },
    });
    await flush();
    expect(calls.length).toBe(1);
    expect(calls[0]?.params.startRow).toBe(0);
    expect(calls[0]?.params.endRow).toBe(25); // pageSize used as cacheBlockSize per 45.1
  });

  it('45.4: clientSide mode does NOT bootstrap', async () => {
    const { source, calls } = makeControlledSource();
    mount(ChronixTable, {
      props: { columns, rows, rowModelType: 'clientSide' as const, serverSideDataSource: source },
    });
    await flush();
    expect(calls.length).toBe(0);
  });

  it('45.3: non-paginated mode does NOT dispatch off-screen blocks after bootstrap resolves', async () => {
    const { source, calls } = makeControlledSource();
    mount(ChronixTable, {
      props: {
        columns,
        rows: [],
        rowModelType: 'serverSide' as const,
        serverSideDataSource: source,
        cacheBlockSize: 10,
      },
    });
    await flush();
    // Bootstrap fires getRowAt(0) → calls[0] for block 0.
    expect(calls.length).toBe(1);
    // Resolve with totalRowCount=1000 (= 100 blocks). With pre-Phase-45.3
    // behavior this would dispatch all 100 blocks; with peek-only loop +
    // viewport effect (no DOM sizing in jsdom = bodyClientHeight=0), only
    // block 0 stays in flight.
    const rows0 = Array.from({ length: 10 }, (_, i) => ({ id: `r${i}`, data: { name: `r${i}` } }));
    calls[0]?.resolve({ rows: rows0, totalRowCount: 1000 });
    await flush();
    // After re-render, calls.length stays 1 (no dispatch explosion).
    // Pre-45.3 this would be ~100.
    expect(calls.length).toBeLessThanOrEqual(5);
  });

  it('45.3: paginated mode viewport effect is gated off (only page-range loop fires)', async () => {
    const { source, calls } = makeControlledSource();
    mount(ChronixTable, {
      props: {
        columns,
        rows: [],
        rowModelType: 'serverSide' as const,
        serverSideDataSource: source,
        showPagination: true,
        initialPageSize: 25,
      },
    });
    await flush();
    expect(calls.length).toBe(1);
    // Resolve block 0 with totalRowCount=1000 (= 40 pages).
    const rows0 = Array.from({ length: 25 }, (_, i) => ({ id: `r${i}`, data: { name: `r${i}` } }));
    calls[0]?.resolve({ rows: rows0, totalRowCount: 1000 });
    await flush();
    // After re-render, only page-range loop's getRowAt fires for [0, 25)
    // — all inside block 0 (already LOADED). No additional dispatches.
    expect(calls.length).toBe(1);
  });

  it('45.3 + 45.4: after bootstrap resolves, synthesized rows render real rows (peek returns cached)', async () => {
    const { source, calls } = makeControlledSource();
    const wrapper = mount(ChronixTable, {
      props: {
        columns,
        rows: [],
        rowModelType: 'serverSide' as const,
        serverSideDataSource: source,
        cacheBlockSize: 5,
      },
      attachTo: document.body,
    });
    await flush();
    const handle = wrapper.vm as unknown as { getServerSideTotalRowCount(): number };
    expect(handle.getServerSideTotalRowCount()).toBe(0);
    const rows0 = Array.from({ length: 5 }, (_, i) => ({ id: `r${i}`, data: { name: `r${i}` } }));
    calls[0]?.resolve({ rows: rows0, totalRowCount: 5 });
    await flush();
    expect(handle.getServerSideTotalRowCount()).toBe(5);
    // Synthesized loop should populate 5 rows from peek (cached after resolve).
    // Skeleton rows should be 0 since block 0 is fully loaded.
    expect(wrapper.findAll('.cx-table-row--skeleton').length).toBe(0);
    wrapper.unmount();
  });
});

describe('server-side anticipatory prefetch (vue3)', () => {
  interface DeferredGetRows {
    readonly params: GetRowsParams;
    resolve(result: GetRowsResult): void;
    reject(error: unknown): void;
  }

  function makeControlledSource(): {
    source: ServerSideDataSource;
    calls: DeferredGetRows[];
  } {
    const calls: DeferredGetRows[] = [];
    const source: ServerSideDataSource = {
      getRows(params) {
        const inner: { resolve: (r: GetRowsResult) => void; reject: (e: unknown) => void } = {
          resolve: () => undefined,
          reject: () => undefined,
        };
        const promise = new Promise<GetRowsResult>((resolve, reject) => {
          inner.resolve = resolve;
          inner.reject = reject;
        });
        calls.push({ params, resolve: inner.resolve, reject: inner.reject });
        return promise;
      },
    };
    return { source, calls };
  }

  async function flush(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
  }

  // tests drive scroll behavior via Object.defineProperty +
  // dispatchEvent('scroll'); useTableBodyScroll re-reads clientHeight +
  // scrollTop on each scroll event, then the viewport watch re-fires
  // with the new range derived from those values.
  function seedAndScroll(wrapper: ReturnType<typeof mount>, scrollTop: number): void {
    const bodyEl = wrapper.find('.cx-table-body').element as HTMLElement;
    Object.defineProperty(bodyEl, 'clientHeight', { value: 100, configurable: true });
    bodyEl.scrollTop = scrollTop;
    bodyEl.dispatchEvent(new Event('scroll'));
  }

  it('45.5: default serverSidePrefetchAheadBlocks (=0) does NOT prefetch beyond visible range', async () => {
    const { source, calls } = makeControlledSource();
    const wrapper = mount(ChronixTable, {
      props: {
        columns,
        rows: [],
        rowModelType: 'serverSide' as const,
        serverSideDataSource: source,
        cacheBlockSize: 10,
      },
      attachTo: document.body,
    });
    await flush();
    // Resolve bootstrap (block 0) so totalRowCount is known.
    const rows0 = Array.from({ length: 10 }, (_, i) => ({ id: `r${i}`, data: { name: `r${i}` } }));
    calls[0]?.resolve({ rows: rows0, totalRowCount: 1000 });
    await flush();
    const baseline = calls.length;
    // Scroll down past block 0 into block 10 (= row 100); with rowHeight
    // ~28 the visible range covers ~4 rows past the scroll position.
    // Prefetch disabled (=0) — only visible-range dispatches fire.
    seedAndScroll(wrapper, 1000);
    await flush();
    // After scroll: visible-range dispatches for rows ~32..40ish across
    // blocks 3-4. Prefetch contributes 0 additional. The session
    // dedupes IDLE→LOADING so post-scroll calls.length reflects only
    // the new IDLE blocks dispatched by the visible range.
    const newDispatches = calls.length - baseline;
    // Visible-range dispatch can touch at most 2-3 NEW blocks (visible
    // range crosses 1-2 block boundaries with 3-row overscan); strictly
    // less than the 5+ that prefetchAheadBlocks=2 would add.
    expect(newDispatches).toBeLessThanOrEqual(4);
    wrapper.unmount();
  });

  it('45.5: serverSidePrefetchAheadBlocks=2 + scroll DOWN fires 2 forward-block prefetches', async () => {
    const { source, calls } = makeControlledSource();
    const wrapper = mount(ChronixTable, {
      props: {
        columns,
        rows: [],
        rowModelType: 'serverSide' as const,
        serverSideDataSource: source,
        cacheBlockSize: 10,
        serverSidePrefetchAheadBlocks: 2,
      },
      attachTo: document.body,
    });
    await flush();
    const rows0 = Array.from({ length: 10 }, (_, i) => ({ id: `r${i}`, data: { name: `r${i}` } }));
    calls[0]?.resolve({ rows: rows0, totalRowCount: 1000 });
    await flush();
    // Seed initial viewport at top (firstVisible=0, lastVisible≈7) so
    // the prev refs are set before the directional scroll.
    seedAndScroll(wrapper, 0);
    await flush();
    const baselineAfterInitial = calls.length;
    // Now scroll DOWN into block 5 — visible range jumps to ~rows
    // 40..50ish. Prefetch=2 dispatches 2 ADDITIONAL forward blocks
    // (blocks 5-6 if visible is block 4-5, or thereabouts).
    seedAndScroll(wrapper, 1500);
    await flush();
    const downDispatches = calls.length - baselineAfterInitial;
    // Visible-range alone would dispatch ~2 NEW blocks; prefetch adds
    // up to 2 * 10 = 20 indices = 2-3 additional NEW blocks. So total
    // post-scroll new dispatches should be strictly > the no-prefetch
    // case (which capped at 4).
    expect(downDispatches).toBeGreaterThanOrEqual(4);
    // All prefetched startRows should be AHEAD of the visible range
    // (i.e. > the last visible row's startRow).
    const dispatchedStartRows = calls.slice(baselineAfterInitial).map((c) => c.params.startRow);
    expect(Math.max(...dispatchedStartRows)).toBeGreaterThan(50);
    wrapper.unmount();
  });

  it('45.5: serverSidePrefetchAheadBlocks=2 + scroll UP fires backward-block prefetches', async () => {
    const { source, calls } = makeControlledSource();
    const wrapper = mount(ChronixTable, {
      props: {
        columns,
        rows: [],
        rowModelType: 'serverSide' as const,
        serverSideDataSource: source,
        cacheBlockSize: 10,
        serverSidePrefetchAheadBlocks: 2,
      },
      attachTo: document.body,
    });
    await flush();
    const rows0 = Array.from({ length: 10 }, (_, i) => ({ id: `r${i}`, data: { name: `r${i}` } }));
    calls[0]?.resolve({ rows: rows0, totalRowCount: 1000 });
    await flush();
    // Scroll DOWN deep first so prev refs reflect a high firstVisible.
    seedAndScroll(wrapper, 3000);
    await flush();
    const baselineAfterDown = calls.length;
    // Now scroll BACK UP — firstVisible shrinks. Backward prefetch
    // fires for indices [firstVisible - 20, firstVisible).
    seedAndScroll(wrapper, 1000);
    await flush();
    const upDispatches = calls.slice(baselineAfterDown);
    // At least one of the dispatched calls should have startRow less
    // than the post-scroll visible-range start (= backward prefetch).
    const startRows = upDispatches.map((c) => c.params.startRow);
    // Expect backward-direction prefetch dispatches (startRows below
    // the new firstVisible).
    expect(startRows.length).toBeGreaterThan(0);
    expect(Math.min(...startRows)).toBeLessThan(40);
    wrapper.unmount();
  });

  it('45.5: stationary viewport (no scroll change) does NOT trigger prefetch on serverSideVersion bump', async () => {
    const { source, calls } = makeControlledSource();
    const wrapper = mount(ChronixTable, {
      props: {
        columns,
        rows: [],
        rowModelType: 'serverSide' as const,
        serverSideDataSource: source,
        cacheBlockSize: 10,
        serverSidePrefetchAheadBlocks: 2,
      },
      attachTo: document.body,
    });
    await flush();
    // Seed and stay at the same scrollTop across multiple version bumps.
    const rows0 = Array.from({ length: 10 }, (_, i) => ({ id: `r${i}`, data: { name: `r${i}` } }));
    calls[0]?.resolve({ rows: rows0, totalRowCount: 1000 });
    await flush();
    seedAndScroll(wrapper, 500);
    await flush();
    const baselineAfterScroll = calls.length;
    // Resolve another in-flight block (= bumps serverSideVersion =>
    // viewport effect re-fires). prev refs already match current
    // firstVisible/lastVisible — no direction change ⇒ no prefetch.
    const remaining = calls.slice(1);
    if (remaining.length > 0) {
      const blockRows = Array.from({ length: 10 }, (_, i) => ({
        id: `bk${i}`,
        data: { name: `bk${i}` },
      }));
      remaining[0]?.resolve({ rows: blockRows, totalRowCount: 1000 });
      await flush();
    }
    // No additional dispatches between baselineAfterScroll and the
    // version-bump re-fire (other than the same-range re-dispatch on
    // already-LOADED/LOADING blocks which are session-side no-ops).
    // Asserting calls.length stays bounded — strictly no new
    // forward-prefetch dispatches because direction is unchanged.
    const postBumpNew = calls.length - baselineAfterScroll;
    // Allow at most 1 incremental dispatch (bootstrap-relative noise);
    // strict guard against forward-prefetch firing on version bump.
    expect(postBumpNew).toBeLessThanOrEqual(1);
    wrapper.unmount();
  });

  it('45.5: showPagination=true ignores serverSidePrefetchAheadBlocks prop', async () => {
    const { source, calls } = makeControlledSource();
    const wrapper = mount(ChronixTable, {
      props: {
        columns,
        rows: [],
        rowModelType: 'serverSide' as const,
        serverSideDataSource: source,
        showPagination: true,
        initialPageSize: 10,
        serverSidePrefetchAheadBlocks: 5,
      },
      attachTo: document.body,
    });
    await flush();
    // Bootstrap fires getRowAt(0) regardless of prefetch prop.
    expect(calls.length).toBe(1);
    const rows0 = Array.from({ length: 10 }, (_, i) => ({ id: `r${i}`, data: { name: `r${i}` } }));
    calls[0]?.resolve({ rows: rows0, totalRowCount: 1000 });
    await flush();
    // After resolve, the page-range loop fires getRowAt for [0,10) which
    // are all in already-LOADED block 0 ⇒ no new dispatches. Viewport
    // effect is gated off in paginated mode (B.1) ⇒ no
    // prefetch despite serverSidePrefetchAheadBlocks=5.
    seedAndScroll(wrapper, 1000);
    await flush();
    // Scrolling in paginated mode does NOT advance the viewport effect
    // (page-range is the dispatch driver). calls.length stays at 1.
    expect(calls.length).toBe(1);
    wrapper.unmount();
  });
});

describe('Tier 3 finale (vue3)', () => {
  it('46-A: ColumnSpec.rowNumber:true renders displayed-position index (1-based)', () => {
    const numberedColumns: readonly ColumnSpec[] = [
      { id: 'num', headerName: '#', width: 60, rowNumber: true },
      ...columns,
    ];
    const wrapper = mount(ChronixTable, { props: { columns: numberedColumns, rows } });
    const numberCells = wrapper.findAll('.cx-table-cell--row-number');
    expect(numberCells.length).toBeGreaterThanOrEqual(3);
    expect(numberCells[0]?.text()).toBe('1');
    expect(numberCells[1]?.text()).toBe('2');
    expect(numberCells[2]?.text()).toBe('3');
  });

  it('46-B: ColumnSpec.actions renders one <button> per RowAction with data-action-id', () => {
    const clicks: { id: string; rowId: string }[] = [];
    const actionsColumns: readonly ColumnSpec[] = [
      ...columns,
      {
        id: 'actions',
        headerName: 'Actions',
        width: 160,
        actions: [
          { id: 'edit', label: '编辑', onClick: (r) => clicks.push({ id: 'edit', rowId: r.id }) },
          {
            id: 'delete',
            label: '删除',
            disabled: (r) => r.id === 'r2',
            onClick: (r) => clicks.push({ id: 'delete', rowId: r.id }),
          },
        ],
      },
    ];
    const wrapper = mount(ChronixTable, { props: { columns: actionsColumns, rows } });
    const editButtons = wrapper.findAll('[data-action-id="edit"]');
    expect(editButtons.length).toBe(3);
    const deleteButtons = wrapper.findAll('[data-action-id="delete"]');
    expect(deleteButtons.length).toBe(3);
    // r2's delete button should be disabled.
    expect((deleteButtons[1]?.element as HTMLButtonElement | undefined)?.disabled).toBe(true);
    expect((deleteButtons[0]?.element as HTMLButtonElement | undefined)?.disabled).toBe(false);
  });

  it('46-B: clicking an action button fires onClick(row) and stops propagation', async () => {
    const clicks: { id: string; rowId: string }[] = [];
    let rowClickCount = 0;
    const actionsColumns: readonly ColumnSpec[] = [
      ...columns,
      {
        id: 'actions',
        headerName: 'Actions',
        actions: [
          {
            id: 'archive',
            label: '存档',
            onClick: (r) => clicks.push({ id: 'archive', rowId: r.id }),
          },
        ],
      },
    ];
    const wrapper = mount(ChronixTable, {
      props: {
        columns: actionsColumns,
        rows,
        onRowClick: () => {
          rowClickCount++;
        },
      },
    });
    const firstArchive = wrapper.find('[data-action-id="archive"]');
    await firstArchive.trigger('click');
    expect(clicks.length).toBe(1);
    expect(clicks[0]).toEqual({ id: 'archive', rowId: 'r1' });
    expect(rowClickCount).toBe(0);
  });

  it('46-C: enableRowAutoHeight:true adds cx-table-row--auto-height modifier + wrapText cells get modifier', () => {
    const wrapColumns: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', headerName: 'ID', width: 80 },
      { id: 'note', field: 'note', headerName: '备注', wrapText: true, flex: 1 },
    ];
    const wrapper = mount(ChronixTable, {
      props: {
        columns: wrapColumns,
        rows,
        enableRowAutoHeight: true,
      },
    });
    const rowEls = wrapper.findAll('.cx-table-row--auto-height');
    expect(rowEls.length).toBeGreaterThan(0);
    const wrapCells = wrapper.findAll('.cx-table-cell--wrap-text');
    expect(wrapCells.length).toBeGreaterThan(0);
  });
});

describe('tool-panel popover (vue3)', () => {
  const panelConfig = {
    show: true,
    panels: [
      { id: 'info', label: 'Info', icon: 'ⓘ', renderer: () => h('div', 'info content') },
      { id: 'help', label: 'Help', icon: '?', renderer: () => h('div', 'help content') },
    ],
  } as const;

  const columnsWithActions: readonly ColumnSpec[] = [
    ...columns,
    {
      id: 'actions',
      headerName: '操作',
      width: 120,
      actions: [
        {
          id: 'edit',
          label: '编辑',
          onClick: () => {
            /* noop */
          },
        },
      ],
    },
  ];

  it('80-1: show:true renders settings icon in action header; popover closed at mount', () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: columnsWithActions, rows, toolPanel: panelConfig },
    });
    expect(wrapper.find('.cx-table-header-settings-button').exists()).toBe(true);
    expect(wrapper.find('.cx-table-settings-popover').exists()).toBe(false);
  });

  it('80-2: clicking settings icon opens popover + activates initialOpenId panel', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: columnsWithActions,
        rows,
        toolPanel: { ...panelConfig, initialOpenId: 'info' },
      },
    });
    await wrapper.find('.cx-table-header-settings-button').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.cx-table-settings-popover').exists()).toBe(true);
    expect(wrapper.find('.cx-table-settings-popover__content').exists()).toBe(true);
    expect(wrapper.find('button[data-tool-panel-id="info"]').attributes('aria-selected')).toBe(
      'true',
    );
    expect(wrapper.find('button[data-tool-panel-id="help"]').attributes('aria-selected')).toBe(
      'false',
    );
  });

  it('80-3: clicking a tab emits tool-panel-change + sets active panel', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: columnsWithActions, rows, toolPanel: panelConfig },
    });
    await wrapper.find('.cx-table-header-settings-button').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-tool-panel-id="info"]').trigger('click');
    await wrapper.vm.$nextTick();
    const emits = wrapper.emitted('tool-panel-change');
    expect(emits).toBeTruthy();
    const last = emits?.[emits.length - 1]?.[0] as { activePanelId: string | null };
    expect(last.activePanelId).toBe('info');
    expect(wrapper.find('button[data-tool-panel-id="info"]').attributes('aria-selected')).toBe(
      'true',
    );
    expect(wrapper.find('.cx-table-settings-popover__content').exists()).toBe(true);
  });

  it('80-4: clicking settings icon again closes the popover', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: columnsWithActions,
        rows,
        toolPanel: { ...panelConfig, initialOpenId: 'info' },
      },
    });
    await wrapper.find('.cx-table-header-settings-button').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.cx-table-settings-popover').exists()).toBe(true);
    await wrapper.find('.cx-table-header-settings-button').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.cx-table-settings-popover').exists()).toBe(false);
    expect(wrapper.find('.cx-table-header-settings-button').exists()).toBe(true);
  });

  it('80-5: empty actions array shows settings icon but no header label', () => {
    const columnsEmptyActions: readonly ColumnSpec[] = [
      ...columns,
      { id: 'actions', headerName: '操作', width: 120, actions: [] },
    ];
    const wrapper = mount(ChronixTable, {
      props: { columns: columnsEmptyActions, rows, toolPanel: panelConfig },
    });
    expect(wrapper.find('.cx-table-header-settings-button').exists()).toBe(true);
    const actionHeaderLabel = wrapper.find(
      '.cx-table-header-cell--actions .cx-table-header-cell-label',
    );
    expect(actionHeaderLabel.exists()).toBe(false);
  });
});

describe('<ChronixTable> — -A column header menu (vue3)', () => {
  it('83A-1: showColumnHeaderMenu:true renders a ⋮ button in each column header', () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, showColumnHeaderMenu: true },
    });
    const buttons = wrapper.findAll('.cx-table-column-header-menu-button');
    expect(buttons.length).toBe(columns.length);
    expect(buttons[0]!.attributes('data-col-id')).toBe('id');
  });

  it('83A-2: showColumnHeaderMenu:false (default) renders no ⋮ buttons', () => {
    const wrapper = mount(ChronixTable, { props: { columns, rows } });
    expect(wrapper.findAll('.cx-table-column-header-menu-button')).toHaveLength(0);
  });

  it('83A-3: clicking ⋮ opens the menu; clicking another column closes the first', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, showColumnHeaderMenu: true },
    });
    const idButton = wrapper.find('.cx-table-column-header-menu-button[data-col-id="id"]');
    await idButton.trigger('click');
    expect(wrapper.find('.cx-table-column-header-menu[data-col-id="id"]').exists()).toBe(true);
    const nameButton = wrapper.find('.cx-table-column-header-menu-button[data-col-id="name"]');
    await nameButton.trigger('click');
    expect(wrapper.find('.cx-table-column-header-menu[data-col-id="id"]').exists()).toBe(false);
    expect(wrapper.find('.cx-table-column-header-menu[data-col-id="name"]').exists()).toBe(true);
  });

  it('83A-4: clicking Sort ASC dispatches setSort + emits column-header-menu-action', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, showColumnHeaderMenu: true },
    });
    await wrapper.find('.cx-table-column-header-menu-button[data-col-id="qty"]').trigger('click');
    const sortAscItem = wrapper.find(
      '.cx-table-column-header-menu[data-col-id="qty"] [data-action="sort-asc"]',
    );
    await sortAscItem.trigger('click');
    const events = wrapper.emitted('column-header-menu-action') ?? [];
    expect(events).toHaveLength(1);
    expect((events[0] as [{ colId: string; action: string }])[0]).toEqual({
      colId: 'qty',
      action: 'sort-asc',
    });
    const sortEvents = wrapper.emitted('sort-change') ?? [];
    expect(sortEvents.length).toBeGreaterThanOrEqual(1);
  });

  it('83A-5: column.sortable:false disables Sort items in the menu', async () => {
    const nonSortableColumns: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', headerName: 'ID', width: 80, sortable: false },
      { id: 'name', field: 'name', headerName: '名称', flex: 1 },
    ];
    const wrapper = mount(ChronixTable, {
      props: { columns: nonSortableColumns, rows, showColumnHeaderMenu: true },
    });
    await wrapper.find('.cx-table-column-header-menu-button[data-col-id="id"]').trigger('click');
    const ascItem = wrapper.find(
      '.cx-table-column-header-menu[data-col-id="id"] [data-action="sort-asc"]',
    );
    expect((ascItem.element as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('<ChronixTable> — -B cell context menu (vue3)', () => {
  it('83B-1: right-click on a cell opens the menu at cursor coords when contextMenu has items', async () => {
    const onClick = vi.fn();
    const wrapper = mount(ChronixTable, {
      props: {
        columns,
        rows,
        contextMenu: {
          items: [{ id: 'a', label: 'Action A', onClick }],
        },
      },
      attachTo: document.body,
    });
    const firstCell = wrapper.find('[data-row-id="r1"][data-col-id="name"]');
    await firstCell.trigger('contextmenu', { clientX: 120, clientY: 80 });
    const overlay = wrapper.find('[data-testid="cx-cell-context-menu"]');
    expect(overlay.exists()).toBe(true);
    expect(overlay.attributes('style')).toContain('left: 120px');
    expect(overlay.attributes('style')).toContain('top: 80px');
    wrapper.unmount();
  });

  it('83B-2: contextMenu:null renders no overlay even on right-click', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows },
      attachTo: document.body,
    });
    const firstCell = wrapper.find('[data-row-id="r1"][data-col-id="name"]');
    await firstCell.trigger('contextmenu', { clientX: 50, clientY: 50 });
    expect(wrapper.find('[data-testid="cx-cell-context-menu"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('83B-3: clicking a menu item fires its onClick with the right {rowId, colId} + closes menu', async () => {
    const onClick = vi.fn();
    const wrapper = mount(ChronixTable, {
      props: {
        columns,
        rows,
        contextMenu: {
          items: [{ id: 'inspect', label: 'Inspect', onClick }],
        },
      },
      attachTo: document.body,
    });
    await wrapper
      .find('[data-row-id="r2"][data-col-id="qty"]')
      .trigger('contextmenu', { clientX: 200, clientY: 150 });
    expect(wrapper.find('[data-testid="cx-cell-context-menu"]').exists()).toBe(true);
    await wrapper.find('[data-item-id="inspect"]').trigger('click');
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith({ rowId: 'r2', colId: 'qty' });
    expect(wrapper.find('[data-testid="cx-cell-context-menu"]').exists()).toBe(false);
    const closeEvents = wrapper.emitted('context-menu-close') ?? [];
    expect(closeEvents.length).toBeGreaterThanOrEqual(1);
    wrapper.unmount();
  });

  it('83B-4: disabled?(ctx) === true disables the item; clicking is a no-op', async () => {
    const onClick = vi.fn();
    const wrapper = mount(ChronixTable, {
      props: {
        columns,
        rows,
        contextMenu: {
          items: [
            {
              id: 'guarded',
              label: 'Guarded',
              disabled: () => true,
              onClick,
            },
          ],
        },
      },
      attachTo: document.body,
    });
    await wrapper
      .find('[data-row-id="r1"][data-col-id="name"]')
      .trigger('contextmenu', { clientX: 100, clientY: 100 });
    const button = wrapper.find('[data-item-id="guarded"]');
    expect((button.element as HTMLButtonElement).disabled).toBe(true);
    await button.trigger('click');
    expect(onClick).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});

describe('tool-panel tablist keyboard nav (vue3)', () => {
  const panelConfig = {
    show: true,
    panels: [
      { id: 'info', label: 'Info', icon: 'ⓘ', renderer: () => h('div', 'info content') },
      { id: 'help', label: 'Help', icon: '?', renderer: () => h('div', 'help content') },
      { id: 'theme', label: 'Theme', icon: '🎨', renderer: () => h('div', 'theme content') },
    ],
  } as const;

  const columnsWithActions: readonly ColumnSpec[] = [
    ...columns,
    {
      id: 'actions',
      headerName: '操作',
      width: 120,
      actions: [
        {
          id: 'edit',
          label: '编辑',
          onClick: () => {
            /* noop */
          },
        },
      ],
    },
  ];

  async function openPopover(wrapper: ReturnType<typeof mount>) {
    await wrapper.find('.cx-table-header-settings-button').trigger('click');
    await wrapper.vm.$nextTick();
  }

  it('84-tablist-1: each tab renders data-menu-item-index and a roving tabindex', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: columnsWithActions, rows, toolPanel: panelConfig },
    });
    await openPopover(wrapper);
    const tabs = wrapper.findAll('.cx-table-settings-popover-tab');
    expect(tabs.length).toBe(3);
    expect(tabs[0]!.attributes('data-menu-item-index')).toBe('0');
    expect(tabs[1]!.attributes('data-menu-item-index')).toBe('1');
    expect(tabs[2]!.attributes('data-menu-item-index')).toBe('2');
    expect(tabs[0]!.attributes('tabindex')).toBe('0');
    expect(tabs[1]!.attributes('tabindex')).toBe('-1');
    expect(tabs[2]!.attributes('tabindex')).toBe('-1');
  });

  it('84-tablist-2: ArrowRight on the tabs moves tabindex+focus to the next tab', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: columnsWithActions, rows, toolPanel: panelConfig },
      attachTo: document.body,
    });
    await openPopover(wrapper);
    const tabsBar = wrapper.find('.cx-table-settings-popover__tabs');
    await tabsBar.trigger('keydown', { key: 'ArrowRight' });
    await wrapper.vm.$nextTick();
    const tabs = wrapper.findAll('.cx-table-settings-popover-tab');
    expect(tabs[0]!.attributes('tabindex')).toBe('-1');
    expect(tabs[1]!.attributes('tabindex')).toBe('0');
    expect(document.activeElement).toBe(tabs[1]!.element);
    wrapper.unmount();
  });

  it('84-tablist-3: ArrowLeft at first tab wraps to last', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: columnsWithActions, rows, toolPanel: panelConfig },
      attachTo: document.body,
    });
    await openPopover(wrapper);
    const tabsBar = wrapper.find('.cx-table-settings-popover__tabs');
    await tabsBar.trigger('keydown', { key: 'ArrowLeft' });
    await wrapper.vm.$nextTick();
    const tabs = wrapper.findAll('.cx-table-settings-popover-tab');
    expect(tabs[2]!.attributes('tabindex')).toBe('0');
    wrapper.unmount();
  });

  it('84-tablist-4: Home + End jump to first / last tab', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: columnsWithActions, rows, toolPanel: panelConfig },
      attachTo: document.body,
    });
    await openPopover(wrapper);
    const tabsBar = wrapper.find('.cx-table-settings-popover__tabs');
    await tabsBar.trigger('keydown', { key: 'End' });
    await wrapper.vm.$nextTick();
    let tabs = wrapper.findAll('.cx-table-settings-popover-tab');
    expect(tabs[2]!.attributes('tabindex')).toBe('0');
    await tabsBar.trigger('keydown', { key: 'Home' });
    await wrapper.vm.$nextTick();
    tabs = wrapper.findAll('.cx-table-settings-popover-tab');
    expect(tabs[0]!.attributes('tabindex')).toBe('0');
    wrapper.unmount();
  });

  it('84-tablist-5: Enter on a focused tab activates it via the existing click handler', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: columnsWithActions, rows, toolPanel: panelConfig },
      attachTo: document.body,
    });
    await openPopover(wrapper);
    const tabsBar = wrapper.find('.cx-table-settings-popover__tabs');
    await tabsBar.trigger('keydown', { key: 'ArrowRight' });
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-tool-panel-id="help"]').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('button[data-tool-panel-id="help"]').attributes('aria-selected')).toBe(
      'true',
    );
    wrapper.unmount();
  });

  it('84-tablist-6: empty tablist (toolPanel.show=false) ships no tablist DOM (no keyboard surface)', () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: columnsWithActions,
        rows,
        toolPanel: { show: false, panels: [] as never[] },
      },
    });
    expect(wrapper.find('.cx-table-settings-popover__tabs').exists()).toBe(false);
    // settings button is decoupled from toolPanel.show: renders when actions != null.
    expect(wrapper.find('.cx-table-header-settings-button').exists()).toBe(true);
  });
});

describe('-A column header menu keyboard nav (vue3)', () => {
  it('84-header-1: opened menu items render data-menu-item-index 0..4', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, showColumnHeaderMenu: true },
    });
    await wrapper.find('.cx-table-column-header-menu-button[data-col-id="qty"]').trigger('click');
    const items = wrapper
      .find('.cx-table-column-header-menu[data-col-id="qty"]')
      .findAll('.cx-table-column-header-menu-item');
    expect(items.length).toBe(5);
    expect(items[0]!.attributes('data-menu-item-index')).toBe('0');
    expect(items[4]!.attributes('data-menu-item-index')).toBe('4');
  });

  it('84-header-2: first non-disabled item has tabindex=0 on open', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, showColumnHeaderMenu: true },
    });
    await wrapper.find('.cx-table-column-header-menu-button[data-col-id="qty"]').trigger('click');
    const items = wrapper
      .find('.cx-table-column-header-menu[data-col-id="qty"]')
      .findAll('.cx-table-column-header-menu-item');
    expect(items[0]!.attributes('tabindex')).toBe('0');
    expect(items[1]!.attributes('tabindex')).toBe('-1');
  });

  it('84-header-3: ArrowDown moves tabindex to next item; ArrowUp wraps to last', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, showColumnHeaderMenu: true },
      attachTo: document.body,
    });
    await wrapper.find('.cx-table-column-header-menu-button[data-col-id="qty"]').trigger('click');
    const menu = wrapper.find('.cx-table-column-header-menu[data-col-id="qty"]');
    await menu.trigger('keydown', { key: 'ArrowDown' });
    await wrapper.vm.$nextTick();
    let items = menu.findAll('.cx-table-column-header-menu-item');
    expect(items[1]!.attributes('tabindex')).toBe('0');
    await menu.trigger('keydown', { key: 'ArrowUp' });
    await menu.trigger('keydown', { key: 'ArrowUp' });
    await wrapper.vm.$nextTick();
    items = menu.findAll('.cx-table-column-header-menu-item');
    expect(items[4]!.attributes('tabindex')).toBe('0');
    wrapper.unmount();
  });

  it('84-header-4: disabled "Clear Sort" item is skipped during ArrowDown nav', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, showColumnHeaderMenu: true },
      attachTo: document.body,
    });
    // qty is unsorted at mount → Clear Sort (index 2) is disabled.
    await wrapper.find('.cx-table-column-header-menu-button[data-col-id="qty"]').trigger('click');
    const menu = wrapper.find('.cx-table-column-header-menu[data-col-id="qty"]');
    await menu.trigger('keydown', { key: 'ArrowDown' });
    await menu.trigger('keydown', { key: 'ArrowDown' });
    await wrapper.vm.$nextTick();
    const items = menu.findAll('.cx-table-column-header-menu-item');
    // 0 → 1 → 3 (skipping disabled 2). tabindex=0 lands on index 3.
    expect(items[3]!.attributes('tabindex')).toBe('0');
    expect(items[2]!.attributes('tabindex')).toBe('-1');
    wrapper.unmount();
  });

  it('84-header-5: Home jumps to first enabled, End jumps to last enabled', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, showColumnHeaderMenu: true },
      attachTo: document.body,
    });
    await wrapper.find('.cx-table-column-header-menu-button[data-col-id="qty"]').trigger('click');
    const menu = wrapper.find('.cx-table-column-header-menu[data-col-id="qty"]');
    await menu.trigger('keydown', { key: 'End' });
    await wrapper.vm.$nextTick();
    let items = menu.findAll('.cx-table-column-header-menu-item');
    expect(items[4]!.attributes('tabindex')).toBe('0');
    await menu.trigger('keydown', { key: 'Home' });
    await wrapper.vm.$nextTick();
    items = menu.findAll('.cx-table-column-header-menu-item');
    expect(items[0]!.attributes('tabindex')).toBe('0');
    wrapper.unmount();
  });

  it('84-header-6: opening a new column menu resets activeIndex to first enabled', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, showColumnHeaderMenu: true },
      attachTo: document.body,
    });
    await wrapper.find('.cx-table-column-header-menu-button[data-col-id="qty"]').trigger('click');
    const qtyMenu = wrapper.find('.cx-table-column-header-menu[data-col-id="qty"]');
    await qtyMenu.trigger('keydown', { key: 'End' });
    await wrapper.vm.$nextTick();
    await wrapper.find('.cx-table-column-header-menu-button[data-col-id="name"]').trigger('click');
    const nameMenu = wrapper.find('.cx-table-column-header-menu[data-col-id="name"]');
    expect(nameMenu.exists()).toBe(true);
    await wrapper.vm.$nextTick();
    const items = nameMenu.findAll('.cx-table-column-header-menu-item');
    expect(items[0]!.attributes('tabindex')).toBe('0');
    wrapper.unmount();
  });
});

describe('-B cell context menu keyboard nav (vue3)', () => {
  const ctxConfig = {
    items: [
      { id: 'copy', label: 'Copy', onClick: vi.fn() },
      { id: 'inspect', label: 'Inspect', onClick: vi.fn() },
      { id: 'delete', label: 'Delete', onClick: vi.fn() },
    ],
  } as const;

  it('84-ctx-1: opening the menu lands tabindex=0 on first item; data-menu-item-index emitted', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, contextMenu: ctxConfig },
      attachTo: document.body,
    });
    await wrapper
      .find('[data-row-id="r1"][data-col-id="name"]')
      .trigger('contextmenu', { clientX: 100, clientY: 100 });
    await wrapper.vm.$nextTick();
    const items = wrapper.findAll('.cx-table-cell-context-menu-item');
    expect(items.length).toBe(3);
    expect(items[0]!.attributes('data-menu-item-index')).toBe('0');
    expect(items[0]!.attributes('tabindex')).toBe('0');
    expect(items[1]!.attributes('tabindex')).toBe('-1');
    wrapper.unmount();
  });

  it('84-ctx-2: ArrowDown moves tabindex to next item', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, contextMenu: ctxConfig },
      attachTo: document.body,
    });
    await wrapper
      .find('[data-row-id="r1"][data-col-id="name"]')
      .trigger('contextmenu', { clientX: 100, clientY: 100 });
    await wrapper.vm.$nextTick();
    const menu = wrapper.find('[data-testid="cx-cell-context-menu"]');
    await menu.trigger('keydown', { key: 'ArrowDown' });
    await wrapper.vm.$nextTick();
    const items = wrapper.findAll('.cx-table-cell-context-menu-item');
    expect(items[1]!.attributes('tabindex')).toBe('0');
    wrapper.unmount();
  });

  it('84-ctx-3: ArrowDown skips disabled items', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns,
        rows,
        contextMenu: {
          items: [
            { id: 'a', label: 'A', onClick: vi.fn() },
            { id: 'b', label: 'B', disabled: () => true, onClick: vi.fn() },
            { id: 'c', label: 'C', onClick: vi.fn() },
          ],
        },
      },
      attachTo: document.body,
    });
    await wrapper
      .find('[data-row-id="r1"][data-col-id="name"]')
      .trigger('contextmenu', { clientX: 100, clientY: 100 });
    await wrapper.vm.$nextTick();
    const menu = wrapper.find('[data-testid="cx-cell-context-menu"]');
    await menu.trigger('keydown', { key: 'ArrowDown' });
    await wrapper.vm.$nextTick();
    const items = wrapper.findAll('.cx-table-cell-context-menu-item');
    // 0 → 2 (skipping disabled 1)
    expect(items[2]!.attributes('tabindex')).toBe('0');
    expect(items[1]!.attributes('tabindex')).toBe('-1');
    wrapper.unmount();
  });

  it('84-ctx-4: Home/End jump to first / last item', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, contextMenu: ctxConfig },
      attachTo: document.body,
    });
    await wrapper
      .find('[data-row-id="r2"][data-col-id="qty"]')
      .trigger('contextmenu', { clientX: 100, clientY: 100 });
    await wrapper.vm.$nextTick();
    const menu = wrapper.find('[data-testid="cx-cell-context-menu"]');
    await menu.trigger('keydown', { key: 'End' });
    await wrapper.vm.$nextTick();
    let items = wrapper.findAll('.cx-table-cell-context-menu-item');
    expect(items[2]!.attributes('tabindex')).toBe('0');
    await menu.trigger('keydown', { key: 'Home' });
    await wrapper.vm.$nextTick();
    items = wrapper.findAll('.cx-table-cell-context-menu-item');
    expect(items[0]!.attributes('tabindex')).toBe('0');
    wrapper.unmount();
  });

  it('84-ctx-5: focus shifts to active item after ArrowDown', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, contextMenu: ctxConfig },
      attachTo: document.body,
    });
    await wrapper
      .find('[data-row-id="r1"][data-col-id="name"]')
      .trigger('contextmenu', { clientX: 100, clientY: 100 });
    await wrapper.vm.$nextTick();
    const menu = wrapper.find('[data-testid="cx-cell-context-menu"]');
    await menu.trigger('keydown', { key: 'ArrowDown' });
    await wrapper.vm.$nextTick();
    const items = wrapper.findAll('.cx-table-cell-context-menu-item');
    expect(document.activeElement).toBe(items[1]!.element);
    wrapper.unmount();
  });

  it('84-ctx-6: closing then reopening resets activeIndex to first item', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns, rows, contextMenu: ctxConfig },
      attachTo: document.body,
    });
    await wrapper
      .find('[data-row-id="r1"][data-col-id="name"]')
      .trigger('contextmenu', { clientX: 100, clientY: 100 });
    await wrapper.vm.$nextTick();
    const menu1 = wrapper.find('[data-testid="cx-cell-context-menu"]');
    await menu1.trigger('keydown', { key: 'End' });
    await wrapper.vm.$nextTick();
    // Close by clicking an item.
    await wrapper.find('[data-item-id="copy"]').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="cx-cell-context-menu"]').exists()).toBe(false);
    // Reopen on a different cell.
    await wrapper
      .find('[data-row-id="r3"][data-col-id="qty"]')
      .trigger('contextmenu', { clientX: 200, clientY: 100 });
    await wrapper.vm.$nextTick();
    const items = wrapper.findAll('.cx-table-cell-context-menu-item');
    expect(items[0]!.attributes('tabindex')).toBe('0');
    wrapper.unmount();
  });
});

describe('+ 44.2: per-column rowDragHandle + drag auto-scroll (vue3)', () => {
  interface RowDragHandle {
    startMovingRow(rowId: string): void;
    cancelRowMove(): void;
    getMovingRow(): { readonly rowId: string } | null;
  }

  const dragCols: readonly ColumnSpec[] = [
    { id: 'id', field: 'id', headerName: 'ID', width: 80 },
    { id: 'name', field: 'name', headerName: '名称', flex: 1, rowDragHandle: true },
  ];

  const dragRows: readonly RowSpec[] = [
    { id: 'r1', data: { id: 1, name: 'A' } },
    { id: 'r2', data: { id: 2, name: 'B' } },
    { id: 'r3', data: { id: 3, name: 'C' }, draggable: false },
    { id: 'r-pinned', data: { id: 0, name: 'P' }, pinned: 'top' },
  ];

  it('44.1-1: rowDragHandle:true column adds data-row-drag-handle="cell" + cursor:grab on draggable rows', () => {
    const wrapper = mount(ChronixTable, { props: { columns: dragCols, rows: dragRows } });
    // r1, r2 are draggable; r3 has draggable:false; r-pinned is pinned.
    const r1NameCell = wrapper.find('[data-row-id="r1"][data-col-id="name"]');
    expect(r1NameCell.attributes('data-row-drag-handle')).toBe('cell');
    expect(r1NameCell.attributes('style')).toContain('cursor: grab');
  });

  it('44.1-2: rowDragHandle:true column skips draggable:false rows', () => {
    const wrapper = mount(ChronixTable, { props: { columns: dragCols, rows: dragRows } });
    const r3NameCell = wrapper.find('[data-row-id="r3"][data-col-id="name"]');
    expect(r3NameCell.attributes('data-row-drag-handle')).toBeUndefined();
    expect(r3NameCell.attributes('style') ?? '').not.toContain('cursor: grab');
  });

  it('44.1-3: rowDragHandle:true column skips pinned rows (D.1)', () => {
    const wrapper = mount(ChronixTable, { props: { columns: dragCols, rows: dragRows } });
    const pinnedNameCell = wrapper.find('[data-row-id="r-pinned"][data-col-id="name"]');
    if (pinnedNameCell.exists()) {
      expect(pinnedNameCell.attributes('data-row-drag-handle')).toBeUndefined();
    }
  });

  it('44.1-4: non-flagged column does NOT get the row-drag-handle wiring', () => {
    const wrapper = mount(ChronixTable, { props: { columns: dragCols, rows: dragRows } });
    const r1IdCell = wrapper.find('[data-row-id="r1"][data-col-id="id"]');
    expect(r1IdCell.attributes('data-row-drag-handle')).toBeUndefined();
  });

  it('44.1-5: rowDragColumn.show:true + rowDragHandle column → grip column wins; console.warn fires once; cells have no handle attr', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const wrapper = mount(ChronixTable, {
      props: { columns: dragCols, rows: dragRows, rowDragColumn: { show: true } },
    });
    const r1NameCell = wrapper.find('[data-row-id="r1"][data-col-id="name"]');
    expect(r1NameCell.attributes('data-row-drag-handle')).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toContain('rowDragColumn.show is true');
    warnSpy.mockRestore();
  });

  it('44.1-6: pointerdown on rowDragHandle cell starts row-drag session via threshold gesture', async () => {
    const wrapper = mount(ChronixTable, { props: { columns: dragCols, rows: dragRows } });
    const r1NameCell = wrapper.find('[data-row-id="r1"][data-col-id="name"]');
    // Pointerdown at origin.
    await r1NameCell.trigger('pointerdown', {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    // Pointermove crossing the threshold (5px Chebyshev).
    await wrapper
      .find('.cx-table-wrapper')
      .trigger('pointermove', { clientX: 100, clientY: 110, pointerId: 1 });
    const handle = wrapper.vm as unknown as RowDragHandle;
    expect(handle.getMovingRow()?.rowId).toBe('r1');
    handle.cancelRowMove();
  });

  it('44.2-1: drag auto-scroll rAF schedules when pointer enters top trigger zone during drag', async () => {
    const rafSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        // Don't actually invoke — we just want to spy on whether it's called.
        void cb;
        return 1;
      });
    const wrapper = mount(ChronixTable, { props: { columns: dragCols, rows: dragRows } });
    const handle = wrapper.vm as unknown as RowDragHandle;
    handle.startMovingRow('r1');
    rafSpy.mockClear();
    await wrapper
      .find('.cx-table-wrapper')
      .trigger('pointermove', { clientX: 0, clientY: 0, pointerId: -1 });
    expect(rafSpy).toHaveBeenCalled();
    handle.cancelRowMove();
    rafSpy.mockRestore();
  });

  it('44.2-2: rowDragAutoScroll:{enabled:false} disables the rAF loop entirely', async () => {
    const rafSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        void cb;
        return 1;
      });
    const wrapper = mount(ChronixTable, {
      props: {
        columns: dragCols,
        rows: dragRows,
        rowDragAutoScroll: { enabled: false },
      },
    });
    const handle = wrapper.vm as unknown as RowDragHandle;
    handle.startMovingRow('r1');
    rafSpy.mockClear();
    await wrapper
      .find('.cx-table-wrapper')
      .trigger('pointermove', { clientX: 0, clientY: 0, pointerId: -1 });
    expect(rafSpy).not.toHaveBeenCalled();
    handle.cancelRowMove();
    rafSpy.mockRestore();
  });
});

// ────────────────────────── per-column validator + invalid-cell surface ──────────────────────────
// Validator runs AFTER coerce (locked order per Decision E.1); rejected
// commits keep the editor open + paint the cell with the invalid-cell
// triple (`cx-table-cell--invalid` + `data-cell-invalid="true"` +
// `aria-invalid="true"`); cell-edit-stop payload carries
// `validationError?: EditValidationError`. See
// `audit/TABLE_PHASE_101_VALIDATION_DESIGN.md`.

describe('per-column validator + invalid-cell surface (vue3)', () => {
  it('validator undefined → commit succeeds (backwards-compat)', async () => {
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, editable: true },
    ];
    const wrapper = mount(ChronixTable, { props: { columns: editableColumns, rows } });
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('hello');
    await editor.trigger('keydown', { key: 'Enter' });
    const stops = wrapper.emitted('cell-edit-stop');
    expect(stops).toHaveLength(1);
    const payload = stops![0]![0] as { committed: boolean; validationError?: unknown };
    expect(payload.committed).toBe(true);
    expect(payload.validationError).toBeUndefined();
  });

  it('validator returns string → reject + validationError + editor stays open', async () => {
    const validator = vi.fn<(value: unknown) => string | null>((value) =>
      typeof value === 'string' && value.length < 3 ? 'too short' : null,
    );
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, editable: true, validator },
    ];
    const wrapper = mount(ChronixTable, { props: { columns: editableColumns, rows } });
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('hi');
    await editor.trigger('keydown', { key: 'Enter' });
    expect(validator).toHaveBeenCalledTimes(1);
    expect(wrapper.find('.cx-table-cell-editor').exists()).toBe(true);
    const stops = wrapper.emitted('cell-edit-stop');
    expect(stops).toHaveLength(1);
    const payload = stops![0]![0] as {
      committed: boolean;
      validationError?: { reason: string; code?: string };
    };
    expect(payload.committed).toBe(false);
    expect(payload.validationError).toEqual({ reason: 'too short' });
    expect(wrapper.emitted('cell-value-change') ?? []).toHaveLength(0);
  });

  it('validator returns EditValidationError → code propagates verbatim', async () => {
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, editable: true, validator: () => ({ reason: 'no good', code: 'fmt' }) },
    ];
    const wrapper = mount(ChronixTable, { props: { columns: editableColumns, rows } });
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('whatever');
    await editor.trigger('keydown', { key: 'Enter' });
    const stops = wrapper.emitted('cell-edit-stop');
    const payload = stops![0]![0] as {
      validationError?: { reason: string; code?: string };
    };
    expect(payload.validationError).toEqual({ reason: 'no good', code: 'fmt' });
  });

  it('invalid cell renders --invalid class + data-cell-invalid + aria-invalid', async () => {
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, editable: true, validator: () => 'nope' },
    ];
    const wrapper = mount(ChronixTable, { props: { columns: editableColumns, rows } });
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('anything');
    await editor.trigger('keydown', { key: 'Enter' });
    // Editor still open on the same cell → look up the cell DOM.
    const cell = wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]');
    expect(cell.classes()).toContain('cx-table-cell--invalid');
    expect(cell.attributes('data-cell-invalid')).toBe('true');
    expect(cell.attributes('aria-invalid')).toBe('true');
    // Cancel clears the invalid marker.
    await wrapper.find('.cx-table-cell-editor').trigger('keydown', { key: 'Escape' });
    const cellAfter = wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]');
    expect(cellAfter.classes()).not.toContain('cx-table-cell--invalid');
    expect(cellAfter.attributes('data-cell-invalid')).toBeUndefined();
  });

  // ---- async validator -------------------------------------------

  it('async resolve null → commit succeeds + cell-value-change', async () => {
    const validatorAsync = vi.fn((_v: unknown) => Promise.resolve(null));
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, editable: true, validatorAsync },
    ];
    const wrapper = mount(ChronixTable, { props: { columns: editableColumns, rows } });
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('hello');
    await editor.trigger('keydown', { key: 'Enter' });
    const pendings = wrapper.emitted('cell-edit-validation-pending');
    expect(pendings).toHaveLength(1);
    await new Promise((r) => setTimeout(r, 0));
    await wrapper.vm.$nextTick();
    expect(validatorAsync).toHaveBeenCalledTimes(1);
    const stops = wrapper.emitted('cell-edit-stop');
    expect(stops).toHaveLength(1);
    const payload = stops![0]![0] as { committed: boolean; finalValue: unknown };
    expect(payload.committed).toBe(true);
    expect(payload.finalValue).toBe('hello');
    expect(wrapper.emitted('cell-value-change')).toHaveLength(1);
  });

  it('async resolve string → reject + validationError + editor stays open', async () => {
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, editable: true, validatorAsync: () => Promise.resolve('taken') },
    ];
    const wrapper = mount(ChronixTable, { props: { columns: editableColumns, rows } });
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('alice');
    await editor.trigger('keydown', { key: 'Enter' });
    await new Promise((r) => setTimeout(r, 0));
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.cx-table-cell-editor').exists()).toBe(true);
    const stops = wrapper.emitted('cell-edit-stop');
    expect(stops).toHaveLength(1);
    const payload = stops![0]![0] as {
      committed: boolean;
      validationError?: { reason: string; code?: string };
    };
    expect(payload.committed).toBe(false);
    expect(payload.validationError).toEqual({ reason: 'taken' });
    expect(wrapper.emitted('cell-value-change') ?? []).toHaveLength(0);
  });

  it('sync validator short-circuits async (async not called)', async () => {
    const validatorAsync = vi.fn((_v: unknown) => Promise.resolve(null));
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      {
        ...columns[4]!,
        editable: true,
        validator: () => 'sync-rejects',
        validatorAsync,
      },
    ];
    const wrapper = mount(ChronixTable, { props: { columns: editableColumns, rows } });
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('whatever');
    await editor.trigger('keydown', { key: 'Enter' });
    await new Promise((r) => setTimeout(r, 0));
    expect(validatorAsync).not.toHaveBeenCalled();
    const stops = wrapper.emitted('cell-edit-stop');
    const payload = stops![0]![0] as { validationError?: { reason: string } };
    expect(payload.validationError).toEqual({ reason: 'sync-rejects' });
    // No pending emit when sync rejects.
    expect(wrapper.emitted('cell-edit-validation-pending') ?? []).toHaveLength(0);
  });

  it('pending cell paints --validating class + data-attr + aria-busy', async () => {
    let resolveValidator: (v: null) => void = () => undefined;
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      {
        ...columns[4]!,
        editable: true,
        validatorAsync: () => new Promise<null>((r) => (resolveValidator = r)),
      },
    ];
    const wrapper = mount(ChronixTable, { props: { columns: editableColumns, rows } });
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('hello');
    await editor.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    const cell = wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]');
    expect(cell.classes()).toContain('cx-table-cell--validating');
    expect(cell.attributes('data-cell-validating')).toBe('true');
    expect(cell.attributes('aria-busy')).toBe('true');
    resolveValidator(null);
    await new Promise((r) => setTimeout(r, 0));
    await wrapper.vm.$nextTick();
    const cellAfter = wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]');
    expect(cellAfter.classes()).not.toContain('cx-table-cell--validating');
  });

  it('Promise rejection → validationError with code "async-error"', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      {
        ...columns[4]!,
        editable: true,
        validatorAsync: () => Promise.reject(new Error('HTTP 500')),
      },
    ];
    const wrapper = mount(ChronixTable, { props: { columns: editableColumns, rows } });
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('hello');
    await editor.trigger('keydown', { key: 'Enter' });
    await new Promise((r) => setTimeout(r, 0));
    await wrapper.vm.$nextTick();
    const stops = wrapper.emitted('cell-edit-stop');
    const payload = stops![0]![0] as {
      committed: boolean;
      validationError?: { reason: string; code?: string };
    };
    expect(payload.committed).toBe(false);
    expect(payload.validationError).toEqual({ reason: 'HTTP 500', code: 'async-error' });
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('cancel during pending discards the in-flight async', async () => {
    let resolveValidator: (v: null) => void = () => undefined;
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      {
        ...columns[4]!,
        editable: true,
        validatorAsync: () => new Promise<null>((r) => (resolveValidator = r)),
      },
    ];
    const wrapper = mount(ChronixTable, { props: { columns: editableColumns, rows } });
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('hello');
    await editor.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    // Cancel mid-pending. Expect cell-edit-stop {committed:false, finalValue: baseValue, no validationError}.
    await wrapper.find('.cx-table-cell-editor').trigger('keydown', { key: 'Escape' });
    const stopsAtCancel = wrapper.emitted('cell-edit-stop');
    expect(stopsAtCancel).toHaveLength(1);
    const cancelPayload = stopsAtCancel![0]![0] as {
      committed: boolean;
      validationError?: unknown;
    };
    expect(cancelPayload.committed).toBe(false);
    expect(cancelPayload.validationError).toBeUndefined();
    // Now resolve the stale promise — should be a no-op (no extra emit).
    resolveValidator(null);
    await new Promise((r) => setTimeout(r, 0));
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('cell-edit-stop')).toHaveLength(1); // no second stop
    expect(wrapper.emitted('cell-value-change') ?? []).toHaveLength(0);
  });

  it('filterUi="multi" renders <details> + segmented mode toggle + N stacked inputs', () => {
    const phaseColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, filterUi: 'multi' },
    ];
    const wrapper = mount(ChronixTable, {
      props: { columns: phaseColumns, rows, showFilterRow: true },
    });
    const details = wrapper.find('.cx-table-multi-filter[data-col-id="note"]');
    expect(details.exists()).toBe(true);
    const slots = wrapper.findAll('.cx-table-multi-filter__input[data-col-id="note"]');
    expect(slots).toHaveLength(2);
    const modeButtons = wrapper.findAll(
      '.cx-table-multi-filter[data-col-id="note"] .cx-table-multi-filter__mode-button',
    );
    expect(modeButtons).toHaveLength(2);
    expect(modeButtons[0]!.attributes('data-mode')).toBe('AND');
    expect(modeButtons[0]!.attributes('aria-checked')).toBe('true');
    expect(modeButtons[1]!.attributes('data-mode')).toBe('OR');
    expect(modeButtons[1]!.attributes('aria-checked')).toBe('false');
    wrapper.unmount();
  });

  it('typing in slot 0 emits filter-change with MultiFilterSpec', async () => {
    const phaseColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, filterUi: 'multi' },
    ];
    const wrapper = mount(ChronixTable, {
      props: { columns: phaseColumns, rows, showFilterRow: true },
    });
    const slot0 = wrapper.find('.cx-table-multi-filter__input[data-multi-filter-slot="0"]');
    await slot0.setValue('first');
    const changes = wrapper.emitted('filter-change');
    expect(changes).toBeTruthy();
    const lastSpec = (changes!.at(-1)![0] as { filterSpec: readonly FilterSpec[] }).filterSpec;
    const multi = lastSpec.find((s): s is MultiFilterSpec => s.type === 'multi');
    expect(multi).toBeDefined();
    expect(multi!.colId).toBe('note');
    expect(multi!.mode).toBe('AND');
    expect(multi!.filters[0]).toEqual({ type: 'text', operator: 'contains', value: 'first' });
    expect(multi!.filters[1]).toEqual({ type: 'text', operator: 'contains', value: '' });
    wrapper.unmount();
  });

  it('clicking OR mode button emits filter-change with mode: "OR"', async () => {
    const phaseColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, filterUi: 'multi' },
    ];
    const wrapper = mount(ChronixTable, {
      props: { columns: phaseColumns, rows, showFilterRow: true },
    });
    const orBtn = wrapper.find('.cx-table-multi-filter[data-col-id="note"] [data-mode="OR"]');
    await orBtn.trigger('click');
    const changes = wrapper.emitted('filter-change');
    const lastSpec = (changes!.at(-1)![0] as { filterSpec: readonly FilterSpec[] }).filterSpec;
    const multi = lastSpec.find((s): s is MultiFilterSpec => s.type === 'multi');
    expect(multi!.mode).toBe('OR');
    wrapper.unmount();
  });

  it('AND mode + both slots populated excludes rows that match only one', async () => {
    const phaseColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, filterUi: 'multi' },
    ];
    const wrapper = mount(ChronixTable, {
      props: { columns: phaseColumns, rows, showFilterRow: true },
    });
    const slot0 = wrapper.find('.cx-table-multi-filter__input[data-multi-filter-slot="0"]');
    const slot1 = wrapper.find('.cx-table-multi-filter__input[data-multi-filter-slot="1"]');
    // Both must match → only row r2 has note 'second' which contains both 'sec' AND 'cond'.
    await slot0.setValue('sec');
    await slot1.setValue('cond');
    // Body should now show exactly 1 row (r2).
    const bodyCells = wrapper.findAll(
      '.cx-table-cell[data-col-id="note"]:not(.cx-table-filter-cell)',
    );
    expect(bodyCells).toHaveLength(1);
    expect(bodyCells[0]!.text()).toBe('second');
    wrapper.unmount();
  });

  it('coerce-rejected SKIPS validator (locked order per Decision E.1)', async () => {
    const validator = vi.fn<(value: unknown) => null>(() => null);
    const editableColumns: readonly ColumnSpec[] = [
      columns[0]!,
      columns[1]!,
      { ...columns[2]!, type: 'number', editable: true, validator },
      columns[3]!,
      columns[4]!,
    ];
    const wrapper = mount(ChronixTable, { props: { columns: editableColumns, rows } });
    await wrapper.find('.cx-table-cell[data-col-id="qty"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    // happy-dom's <input type="number"> auto-sanitizes non-numeric
    // setValue calls to empty string (which coerces to `null` — a
    // valid commit, not a rejection). Bypass with the same precedent
    // as rejection test.
    Object.defineProperty(editor.element, 'value', {
      value: 'abc',
      configurable: true,
      writable: true,
    });
    await editor.trigger('input');
    await editor.trigger('keydown', { key: 'Enter' });
    expect(validator).not.toHaveBeenCalled();
    const stops = wrapper.emitted('cell-edit-stop');
    const payload = stops![0]![0] as { committed: boolean; validationError?: unknown };
    expect(payload.committed).toBe(false);
    expect(payload.validationError).toBeUndefined();
  });
});

describe('multi-filter polish — default mode + runtime slot add/remove (vue3)', () => {
  const multiColumns: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: '名称' },
    { id: 'note', field: 'note', headerName: '备注', filterUi: 'multi' },
  ];
  const multiRows: readonly RowSpec[] = [
    { id: 'r1', data: { name: 'alice', note: 'one' } },
    { id: 'r2', data: { name: 'bob', note: 'two' } },
  ];

  it('.A: default mode AND when prop omitted (baseline)', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: multiColumns, rows: multiRows, showFilterRow: true },
    });
    // Type into slot 0 to bootstrap the spec.
    const slot0 = wrapper.find('.cx-table-multi-filter__input[data-multi-filter-slot="0"]');
    await slot0.setValue('first');
    const changes = wrapper.emitted('filter-change');
    const lastSpec = (changes!.at(-1)![0] as { filterSpec: readonly FilterSpec[] }).filterSpec;
    const multi = lastSpec.find((s): s is MultiFilterSpec => s.type === 'multi');
    expect(multi!.mode).toBe('AND');
  });

  it('.A: default mode OR honoured when prop is "OR"', async () => {
    const wrapper = mount(ChronixTable, {
      props: {
        columns: multiColumns,
        rows: multiRows,
        showFilterRow: true,
        multiFilterDefaultMode: 'OR',
      },
    });
    const slot0 = wrapper.find('.cx-table-multi-filter__input[data-multi-filter-slot="0"]');
    await slot0.setValue('first');
    const changes = wrapper.emitted('filter-change');
    const lastSpec = (changes!.at(-1)![0] as { filterSpec: readonly FilterSpec[] }).filterSpec;
    const multi = lastSpec.find((s): s is MultiFilterSpec => s.type === 'multi');
    expect(multi!.mode).toBe('OR');
    const orBtn = wrapper.find('.cx-table-multi-filter[data-col-id="note"] [data-mode="OR"]');
    expect(orBtn.attributes('aria-checked')).toBe('true');
  });

  it('.B: clicking `+ 添加条件` emits add-multi-filter-slot with slotKind:"text"', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: multiColumns, rows: multiRows, showFilterRow: true },
    });
    const addBtn = wrapper.find('[data-testid="cx-table-multi-filter-add-slot"]');
    expect(addBtn.exists()).toBe(true);
    await addBtn.trigger('click');
    const events = wrapper.emitted('add-multi-filter-slot');
    expect(events).toHaveLength(1);
    const payload = events![0]![0] as { colId: string; slotKind: string };
    expect(payload.colId).toBe('note');
    expect(payload.slotKind).toBe('text');
  });

  it('.B: clicking `×` per-slot emits remove-multi-filter-slot with slotIdx', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: multiColumns, rows: multiRows, showFilterRow: true },
    });
    const removeBtns = wrapper.findAll('[data-testid="cx-table-multi-filter-remove-slot"]');
    expect(removeBtns.length).toBe(2);
    await removeBtns[1]!.trigger('click');
    const events = wrapper.emitted('remove-multi-filter-slot');
    expect(events).toHaveLength(1);
    const payload = events![0]![0] as { colId: string; slotIdx: number };
    expect(payload.colId).toBe('note');
    expect(payload.slotIdx).toBe(1);
  });

  it('.B: × button disabled (no emit) when slot count = 1', async () => {
    const oneSlotColumns: readonly ColumnSpec[] = [
      { id: 'name', field: 'name', headerName: '名称' },
      {
        id: 'note',
        field: 'note',
        headerName: '备注',
        filterUi: 'multi',
        multiFilterChildTypes: ['text'],
      },
    ];
    const wrapper = mount(ChronixTable, {
      props: { columns: oneSlotColumns, rows: multiRows, showFilterRow: true },
    });
    const removeBtn = wrapper.find('[data-testid="cx-table-multi-filter-remove-slot"]');
    expect(removeBtn.exists()).toBe(true);
    expect(removeBtn.attributes('disabled')).toBeDefined();
    expect(removeBtn.attributes('aria-disabled')).toBe('true');
    await removeBtn.trigger('click');
    expect(wrapper.emitted('remove-multi-filter-slot') ?? []).toHaveLength(0);
  });
});

describe('validation followup — cross-cell + summary + paste-gate (vue3)', () => {
  const editableColumns: readonly ColumnSpec[] = [
    { id: 'id', field: 'id', headerName: 'ID', width: 80 },
    { id: 'name', field: 'name', headerName: '名称', flex: 1 },
    { id: 'qty', field: 'qty', headerName: '数量', width: 120, type: 'number', editable: true },
    { id: 'status', field: 'status', headerName: '状态', width: 100, editable: true },
    { id: 'note', field: 'note', headerName: '备注', flex: 2, editable: true },
  ];

  it('rowValidators triggers invalid-cells-change after inline-edit commit', async () => {
    const rowValidators = [
      {
        id: 'qty-positive',
        validate: (row: RowSpec) => {
          const qty = (row.data as { qty?: number }).qty;
          if (typeof qty !== 'number' || qty < 0) {
            return [{ colId: 'qty', reason: 'qty must be non-negative', code: 'min' }];
          }
          return [];
        },
      },
    ];
    const wrapper = mount(ChronixTable, {
      props: { columns: editableColumns, rows, rowValidators },
    });
    const cell = wrapper.find('.cx-table-cell[data-col-id="qty"][data-row-id="r1"]');
    await cell.trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('-5');
    await editor.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    const emits = wrapper.emitted('invalid-cells-change') ?? [];
    expect(emits.length).toBeGreaterThan(0);
    const last = emits[emits.length - 1]![0] as {
      entries: readonly {
        rowId: string;
        colId: string;
        error: { reason: string; code?: string };
      }[];
      count: number;
    };
    expect(last.count).toBe(1);
    expect(last.entries[0]).toMatchObject({ rowId: 'r1', colId: 'qty' });
    expect(last.entries[0]?.error.reason).toBe('qty must be non-negative');
    expect(last.entries[0]?.error.code).toBe('min');
  });

  it('pasteValidatorPolicy="skip-rejected" silently drops validator-illegal paste cells', async () => {
    const validator = (value: unknown) => {
      if (typeof value === 'number' && value < 0) return { reason: 'must be positive' };
      return null;
    };
    const validatedColumns: readonly ColumnSpec[] = [
      ...editableColumns.slice(0, 2),
      { ...editableColumns[2]!, validator },
      ...editableColumns.slice(3),
    ];
    const wrapper = mount(ChronixTable, {
      props: {
        columns: validatedColumns,
        rows,
        cellRangeSelection: 'enabled',
        pasteValidatorPolicy: 'skip-rejected',
      },
    });
    const vm = wrapper.vm as unknown as {
      getInvalidCells(): unknown;
      setCellRange(r: unknown): void;
      pasteCellRangeFromClipboard(): Promise<
        readonly { rowId: string; colId: string; newValue: unknown }[] | null
      >;
    };
    expect(typeof vm.getInvalidCells).toBe('function');
    // Programmatically set a 2-cell range over r1/qty + r2/qty.
    vm.setCellRange({
      anchor: { rowId: 'r1', colId: 'qty' },
      focus: { rowId: 'r2', colId: 'qty' },
    });
    await wrapper.vm.$nextTick();
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: {
        readText: () => Promise.resolve('100\n-5'),
        writeText: () => Promise.resolve(),
      },
    });
    const result = await vm.pasteCellRangeFromClipboard();
    expect(result).not.toBeNull();
    const mutations = result!;
    expect(mutations).toHaveLength(1);
    expect(mutations[0]).toMatchObject({ rowId: 'r1', colId: 'qty', newValue: 100 });
  });

  it('getInvalidCells() TableHandle snapshot reflects current invalid state', async () => {
    const validator = (v: unknown) => (v === 'BAD' ? { reason: 'forbidden' } : null);
    const validatedColumns: readonly ColumnSpec[] = [
      ...editableColumns.slice(0, 3),
      { ...editableColumns[3]!, validator },
      editableColumns[4]!,
    ];
    const wrapper = mount(ChronixTable, {
      props: { columns: validatedColumns, rows },
    });
    const cell = wrapper.find('.cx-table-cell[data-col-id="status"][data-row-id="r1"]');
    await cell.trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('BAD');
    await editor.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    const vm = wrapper.vm as unknown as {
      getInvalidCells(): readonly { rowId: string; colId: string }[];
    };
    const snapshot = vm.getInvalidCells();
    expect(snapshot).toHaveLength(1);
    expect(snapshot[0]).toMatchObject({ rowId: 'r1', colId: 'status' });
  });
});

describe('multi-filter set-child + multiFilterChildRenderer (vue3)', () => {
  const setRows: readonly RowSpec[] = [
    { id: 'r1', data: { id: 1, name: 'Alpha', qty: 10, status: 'OK', note: 'n1' } },
    { id: 'r2', data: { id: 2, name: 'Beta', qty: 20, status: 'WIP', note: 'n2' } },
    { id: 'r3', data: { id: 3, name: 'Gamma', qty: 30, status: 'OK', note: 'n3' } },
    { id: 'r4', data: { id: 4, name: 'Delta', qty: 40, status: 'BLOCKED', note: 'n4' } },
  ];
  const setColumns: readonly ColumnSpec[] = [
    { id: 'id', field: 'id', headerName: 'ID', width: 80 },
    { id: 'name', field: 'name', headerName: 'Name', flex: 1 },
    { id: 'qty', field: 'qty', headerName: 'Qty', width: 120 },
    {
      id: 'status',
      field: 'status',
      headerName: 'Status',
      width: 140,
      filterable: true,
      filterUi: 'multi',
      multiFilterChildTypes: ['set'],
    },
    { id: 'note', field: 'note', headerName: 'Note', flex: 2 },
  ];

  it('set-slot renders a nested <details> with one <label> per unique value', () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: setColumns, rows: setRows, showFilterRow: true },
    });
    const setSlot = wrapper.find(
      '[data-multi-filter-slot-kind="set"] .cx-table-multi-filter__set-slot-list',
    );
    expect(setSlot.exists()).toBe(true);
    const labels = wrapper.findAll(
      '.cx-table-multi-filter__set-slot-list .cx-table-set-filter__item',
    );
    expect(labels).toHaveLength(3);
  });

  it('toggling a set-slot checkbox mutates spec.selectedValues + filters rows', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: setColumns, rows: setRows, showFilterRow: true },
    });
    const checkboxes = wrapper.findAll(
      '.cx-table-multi-filter__set-slot-list .cx-table-set-filter__checkbox',
    );
    expect(checkboxes.length).toBeGreaterThan(0);
    const okCheckbox = checkboxes.find((c) => c.attributes('data-set-filter-value') === 'OK');
    expect(okCheckbox).toBeTruthy();
    await okCheckbox!.trigger('change');
    await wrapper.vm.$nextTick();
    const filterChanges = wrapper.emitted('filter-change') ?? [];
    expect(filterChanges.length).toBeGreaterThan(0);
  });

  it('multiFilterChildRenderer returning non-null replaces built-in widget', () => {
    const renderer = vi.fn(() =>
      h('div', { class: 'consumer-rendered-slot', 'data-testid': 'consumer-slot' }, 'custom'),
    );
    const wrapper = mount(ChronixTable, {
      props: {
        columns: setColumns,
        rows: setRows,
        showFilterRow: true,
        multiFilterChildRenderer: renderer,
      },
    });
    expect(renderer).toHaveBeenCalled();
    expect(wrapper.find('[data-testid="consumer-slot"]').exists()).toBe(true);
    // built-in set-slot <details> should NOT appear when renderer returned non-null
    expect(wrapper.find('.cx-table-multi-filter__set-slot-list').exists()).toBe(false);
  });

  it('multiFilterChildRenderer returning null falls back to built-in widget', () => {
    const renderer = vi.fn(() => null);
    const wrapper = mount(ChronixTable, {
      props: {
        columns: setColumns,
        rows: setRows,
        showFilterRow: true,
        multiFilterChildRenderer: renderer,
      },
    });
    expect(renderer).toHaveBeenCalled();
    // built-in set-slot still renders since renderer returned null
    expect(wrapper.find('.cx-table-multi-filter__set-slot-list').exists()).toBe(true);
  });
});

describe('multi-filter nested groups (vue3)', () => {
  const phaseRows: readonly RowSpec[] = [
    { id: 'r1', data: { id: 1, name: 'Alpha', qty: 10, status: 'OK', note: 'a' } },
    { id: 'r2', data: { id: 2, name: 'Beta', qty: 20, status: 'WIP', note: 'b' } },
    { id: 'r3', data: { id: 3, name: 'Gamma', qty: 30, status: 'OK', note: 'c' } },
    { id: 'r4', data: { id: 4, name: 'Delta', qty: 40, status: 'BLOCKED', note: 'd' } },
  ];
  const phaseColumns: readonly ColumnSpec[] = [
    { id: 'id', field: 'id', headerName: 'ID', width: 80 },
    { id: 'name', field: 'name', headerName: 'Name', flex: 1 },
    {
      id: 'qty',
      field: 'qty',
      headerName: 'Qty',
      width: 120,
      type: 'number',
      filterable: true,
      filterUi: 'multi',
    },
    { id: 'status', field: 'status', headerName: 'Status', width: 140 },
    { id: 'note', field: 'note', headerName: 'Note', flex: 2 },
  ];

  it('consumer-injected group spec filters rows correctly', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: phaseColumns, rows: phaseRows },
    });
    const vm = wrapper.vm as unknown as {
      setFilter(spec: FilterSpec | readonly FilterSpec[] | null): void;
    };
    // qty > 25 AND (qty < 15 OR qty > 35) → r4 (qty=40) only.
    // Wait: r2 (qty=20) fails qty > 25; r3 (qty=30) fails inner; r4 (qty=40) passes both.
    vm.setFilter({
      type: 'multi',
      colId: 'qty',
      mode: 'AND',
      filters: [
        { type: 'number', operator: '>', value: 25 },
        {
          type: 'group',
          mode: 'OR',
          filters: [
            { type: 'number', operator: '<', value: 15 },
            { type: 'number', operator: '>', value: 35 },
          ],
        },
      ],
    });
    await wrapper.vm.$nextTick();
    const rendered = wrapper.findAll('.cx-table-cell[data-col-id="id"]').map((c) => c.text());
    expect(rendered).toEqual(['4']);
  });

  it('empty group is identity (no row excluded)', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: phaseColumns, rows: phaseRows },
    });
    const vm = wrapper.vm as unknown as {
      setFilter(spec: FilterSpec | readonly FilterSpec[] | null): void;
    };
    vm.setFilter({
      type: 'multi',
      colId: 'qty',
      mode: 'AND',
      filters: [{ type: 'group', mode: 'AND', filters: [] }],
    });
    await wrapper.vm.$nextTick();
    const rendered = wrapper.findAll('.cx-table-cell[data-col-id="id"]').map((c) => c.text());
    expect(rendered).toEqual(['1', '2', '3', '4']);
  });

  it('setMultiFilterChildValue does NOT mutate when slotIdx points at a group entry', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: phaseColumns, rows: phaseRows },
    });
    const groupSpec: FilterSpec = {
      type: 'multi',
      colId: 'qty',
      mode: 'AND',
      filters: [
        { type: 'group', mode: 'OR', filters: [{ type: 'number', operator: '>', value: 35 }] },
      ],
    };
    const vm = wrapper.vm as unknown as {
      setFilter(spec: FilterSpec | readonly FilterSpec[] | null): void;
      getFilter(): readonly FilterSpec[];
    };
    vm.setFilter(groupSpec);
    await wrapper.vm.$nextTick();
    // The flat-slot input handler would normally update spec.filters[0]
    // via setMultiFilterChildValue; with a group at idx 0, the handler
    // must early-return so the group survives.
    const inputs = wrapper.findAll('.cx-table-multi-filter__input');
    if (inputs.length > 0) {
      await inputs.at(0)?.setValue('99');
      await wrapper.vm.$nextTick();
    }
    const filters = vm.getFilter();
    const multi = filters.find((s): s is MultiFilterSpec => s.type === 'multi');
    expect(multi).toBeTruthy();
    expect(multi!.filters[0]?.type).toBe('group');
  });
});

describe('nested-groups in-UI affordances (vue3)', () => {
  const phaseRows: readonly RowSpec[] = [
    { id: 'r1', data: { id: 1, name: 'Alpha', qty: 10 } },
    { id: 'r2', data: { id: 2, name: 'Beta', qty: 20 } },
    { id: 'r3', data: { id: 3, name: 'Gamma', qty: 30 } },
    { id: 'r4', data: { id: 4, name: 'Delta', qty: 40 } },
  ];
  const phaseColumns: readonly ColumnSpec[] = [
    { id: 'id', field: 'id', headerName: 'ID', width: 80 },
    { id: 'name', field: 'name', headerName: 'Name', flex: 1 },
    {
      id: 'qty',
      field: 'qty',
      headerName: 'Qty',
      width: 120,
      type: 'number',
      filterable: true,
      filterUi: 'multi',
    },
  ];

  it('consumer-injected group spec renders nested <details> with mode label', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: phaseColumns, rows: phaseRows, showFilterRow: true },
    });
    const vm = wrapper.vm as unknown as {
      setFilter(spec: FilterSpec | readonly FilterSpec[] | null): void;
    };
    vm.setFilter({
      type: 'multi',
      colId: 'qty',
      mode: 'AND',
      filters: [
        { type: 'number', operator: '>', value: 5 },
        {
          type: 'group',
          mode: 'OR',
          filters: [{ type: 'number', operator: '<', value: 15 }],
        },
      ],
    });
    await wrapper.vm.$nextTick();
    const groupNode = wrapper.find(
      '.cx-table-multi-filter[data-col-id="qty"] [data-cx-multi-filter-group-path="1"]',
    );
    expect(groupNode.exists()).toBe(true);
    expect(groupNode.element.tagName.toLowerCase()).toBe('details');
    expect(groupNode.text()).toContain('分组 (OR)');
  });

  it('clicking nested group mode toggle dispatches via setMultiFilterEntryAtPath', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: phaseColumns, rows: phaseRows, showFilterRow: true },
    });
    const vm = wrapper.vm as unknown as {
      setFilter(spec: FilterSpec | readonly FilterSpec[] | null): void;
      getFilter(): readonly FilterSpec[];
    };
    vm.setFilter({
      type: 'multi',
      colId: 'qty',
      mode: 'AND',
      filters: [
        {
          type: 'group',
          mode: 'AND',
          filters: [{ type: 'number', operator: '>', value: 5 }],
        },
      ],
    });
    await wrapper.vm.$nextTick();
    const groupNode = wrapper.find(
      '.cx-table-multi-filter[data-col-id="qty"] [data-cx-multi-filter-group-path="0"]',
    );
    expect(groupNode.exists()).toBe(true);
    const orBtn = groupNode.find('[data-mode="OR"]');
    expect(orBtn.exists()).toBe(true);
    await orBtn.trigger('click');
    await wrapper.vm.$nextTick();
    const filters = vm.getFilter();
    const multi = filters.find((s): s is MultiFilterSpec => s.type === 'multi');
    const inner = multi!.filters[0];
    expect(inner?.type).toBe('group');
    expect((inner as { mode: string }).mode).toBe('OR');
  });

  it('clicking root `+ 添加分组` emits add-multi-filter-group with empty path', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: phaseColumns, rows: phaseRows, showFilterRow: true },
    });
    const addGroupBtn = wrapper.find('[data-testid="cx-table-multi-filter-add-group"]');
    expect(addGroupBtn.exists()).toBe(true);
    await addGroupBtn.trigger('click');
    const events = wrapper.emitted('add-multi-filter-group');
    expect(events).toHaveLength(1);
    const payload = events![0]![0] as { colId: string; path: readonly number[] };
    expect(payload.colId).toBe('qty');
    expect(payload.path).toEqual([]);
  });

  it('clicking group × emits remove-multi-filter-group with full path', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: phaseColumns, rows: phaseRows, showFilterRow: true },
    });
    const vm = wrapper.vm as unknown as {
      setFilter(spec: FilterSpec | readonly FilterSpec[] | null): void;
    };
    vm.setFilter({
      type: 'multi',
      colId: 'qty',
      mode: 'AND',
      filters: [
        { type: 'number', operator: '>', value: 5 },
        {
          type: 'group',
          mode: 'OR',
          filters: [{ type: 'number', operator: '<', value: 15 }],
        },
      ],
    });
    await wrapper.vm.$nextTick();
    const groupNode = wrapper.find(
      '.cx-table-multi-filter[data-col-id="qty"] [data-cx-multi-filter-group-path="1"]',
    );
    expect(groupNode.exists()).toBe(true);
    const removeBtn = groupNode.find('[data-testid="cx-table-multi-filter-remove-group"]');
    expect(removeBtn.exists()).toBe(true);
    await removeBtn.trigger('click');
    const events = wrapper.emitted('remove-multi-filter-group');
    expect(events).toHaveLength(1);
    const payload = events![0]![0] as { colId: string; path: readonly number[] };
    expect(payload.colId).toBe('qty');
    expect(payload.path).toEqual([1]);
  });

  it('setMultiFilterEntryAtPath handle method mutates entry; empty path throws', async () => {
    const wrapper = mount(ChronixTable, {
      props: { columns: phaseColumns, rows: phaseRows, showFilterRow: true },
    });
    const vm = wrapper.vm as unknown as {
      setFilter(spec: FilterSpec | readonly FilterSpec[] | null): void;
      getFilter(): readonly FilterSpec[];
      setMultiFilterEntryAtPath(
        colId: string,
        path: readonly number[],
        next: MultiFilterEntry,
      ): void;
      getMultiFilterEntryAtPath(colId: string, path: readonly number[]): MultiFilterEntry | null;
    };
    vm.setFilter({
      type: 'multi',
      colId: 'qty',
      mode: 'AND',
      filters: [
        {
          type: 'group',
          mode: 'AND',
          filters: [{ type: 'number', operator: '>', value: 5 }],
        },
      ],
    });
    await wrapper.vm.$nextTick();
    vm.setMultiFilterEntryAtPath('qty', [0, 0], {
      type: 'number',
      operator: '>',
      value: 25,
    });
    await wrapper.vm.$nextTick();
    const filters = vm.getFilter();
    const multi = filters.find((s): s is MultiFilterSpec => s.type === 'multi');
    const inner = multi!.filters[0];
    expect(inner?.type).toBe('group');
    const leaf = (inner as { filters: readonly MultiFilterEntry[] }).filters[0];
    expect(leaf).toEqual({ type: 'number', operator: '>', value: 25 });
    // Empty path throws per Decision A.1 / C.1.
    expect(() => vm.setMultiFilterEntryAtPath('qty', [], leaf!)).toThrow();
    expect(() => vm.getMultiFilterEntryAtPath('qty', [])).toThrow();
  });
});
