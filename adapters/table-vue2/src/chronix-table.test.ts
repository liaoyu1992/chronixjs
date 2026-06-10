import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { h } from 'vue';

import { ChronixTable } from './chronix-table.js';

import type {
  BlockState,
  CollectUniqueColumnValuesResult,
  ColumnSpec,
  FilterExpression,
  FilterSpec,
  GetRowsParams,
  GetRowsResult,
  MultiFilterEntry,
  MultiFilterSpec,
  NumberFilterSpec,
  ParseFilterExpressionResult,
  RowSpec,
  ServerSideDataSource,
  SortSpec,
  TextFilterSpec,
} from '@chronixjs/table';
import type { VueConstructor } from 'vue';

/**
 * Vue 2.7's `defineComponent` returns a Vue 3 `DefineComponent` type for
 * IDE prop-inference, but `@vue/test-utils@1.x`'s `mount` is typed for
 * Vue 2's `VueConstructor`. Runtime is identical — Vue 2.7's
 * `defineComponent` IS `Vue.extend` under the hood — but the type
 * bridge is missing. Cast through `VueConstructor` to satisfy the
 * call-site signature without changing runtime shape. Matches the
 * chronix-gantt-vue2 test cast at `adapters/gantt-vue2/src/chronix-gantt.test.ts:25`.
 */
const TableForTest = ChronixTable as unknown as VueConstructor;

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

// vue-test-utils v1's `attributes(name)` is typed `string | void` (not
// `string | undefined`) so widthPx accepts the union explicitly to
// avoid call-site casts.
function widthPx(style: string | void): number {
  if (!style) return 0;
  const match = /width:\s*([0-9.]+)px/i.exec(style);
  return match ? Number.parseFloat(match[1]!) : 0;
}

// Verbatim port of chronix-table-vue3's SFC wiring guards. All 8 tests
// use the same assertions; only the import source for `mount` differs
// (vue-test-utils v1 vs v2).

describe('<ChronixTable> (vue2)', () => {
  it('mounts a single .cx-table-wrapper root with role="grid"', () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const root = wrapper.find('.cx-table-wrapper');
    expect(root.exists()).toBe(true);
    expect(root.attributes('role')).toBe('grid');
    expect(root.attributes('data-table-version')).toBe('0.1.0-alpha');
  });

  it('renders one .cx-table-header-cell per visible column with data-col-id matching column.id', () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const headerCells = wrapper.findAll('.cx-table-header-cell');
    expect(headerCells).toHaveLength(columns.length);
    for (let i = 0; i < headerCells.length; i++) {
      const cell = headerCells.at(i);
      expect(cell.attributes('role') ?? '').toBe('columnheader');
      expect(cell.attributes('data-col-id') ?? '').toBe(columns[i]!.id);
    }
  });

  it('renders one .cx-table-row[data-row-id] per RowSpec in the body rowgroup', () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const body = wrapper.find('.cx-table-body');
    expect(body.exists()).toBe(true);
    expect(body.attributes('role') ?? '').toBe('rowgroup');
    const bodyRows = body.findAll('.cx-table-row');
    expect(bodyRows).toHaveLength(rows.length);
    for (let i = 0; i < bodyRows.length; i++) {
      expect(bodyRows.at(i).attributes('data-row-id') ?? '').toBe(rows[i]!.id);
    }
  });

  it('renders one .cx-table-cell per (row × visible column) with cell text from row.data[column.field]', () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const firstRow = wrapper.find('.cx-table-body .cx-table-row[data-row-id="r1"]');
    expect(firstRow.exists()).toBe(true);
    const cells = firstRow.findAll('.cx-table-cell');
    expect(cells).toHaveLength(columns.length);
    expect(cells.at(0).text()).toBe('1');
    expect(cells.at(1).text()).toBe('Alpha');
    expect(cells.at(2).text()).toBe('10');
    expect(cells.at(3).text()).toBe('OK');
    expect(cells.at(4).text()).toBe('first');
    expect(cells.at(0).attributes('role') ?? '').toBe('gridcell');
    expect(cells.at(0).attributes('data-col-id') ?? '').toBe('id');
    expect(cells.at(0).attributes('data-row-id') ?? '').toBe('r1');
  });

  it('applies the explicit column width to inline style for header + body cells', () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const idHeader = wrapper.find('.cx-table-header-cell[data-col-id="id"]');
    const idCell = wrapper.find('.cx-table-cell[data-col-id="id"][data-row-id="r1"]');
    expect(widthPx(idHeader.attributes('style'))).toBe(80);
    expect(widthPx(idCell.attributes('style'))).toBe(80);
  });

  it('header + body cells for the SAME column share the same resolved width', () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    for (const col of columns) {
      const header = wrapper.find(`.cx-table-header-cell[data-col-id="${col.id}"]`);
      const cell = wrapper.find(`.cx-table-cell[data-col-id="${col.id}"][data-row-id="r1"]`);
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
    const wrapper = mount(TableForTest, { propsData: { columns: cols, rows: dataRows } });
    const headerCells = wrapper.findAll('.cx-table-header-cell');
    expect(headerCells).toHaveLength(2);
    const headerIds: string[] = [];
    for (let i = 0; i < headerCells.length; i++) {
      const id = headerCells.at(i).attributes('data-col-id');
      headerIds.push(typeof id === 'string' ? id : '');
    }
    expect(headerIds).toEqual(['a', 'c']);
    const bodyCells = wrapper.findAll('.cx-table-body .cx-table-cell');
    expect(bodyCells).toHaveLength(2);
    const bodyIds: string[] = [];
    for (let i = 0; i < bodyCells.length; i++) {
      const id = bodyCells.at(i).attributes('data-col-id');
      bodyIds.push(typeof id === 'string' ? id : '');
    }
    expect(bodyIds).toEqual(['a', 'c']);
  });

  it('exposes a TableHandle via ctx.expose() with getColumnTable / getRowDataSource / getResolvedWidth', () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    // vue-test-utils v1 exposes the component instance via `wrapper.vm`;
    // composition-API `ctx.expose(handle)` surfaces the methods on it
    // (matches the Vue 3 `expose()` round-trip).
    const handle = wrapper.vm as unknown as {
      getColumnTable(): { getById(id: string): ColumnSpec | undefined };
      getRowDataSource(): { getById(id: string): RowSpec | undefined };
      getResolvedWidth(colId: string): number | undefined;
    };
    expect(handle.getColumnTable().getById('id')).toEqual(columns[0]);
    expect(handle.getRowDataSource().getById('r1')).toEqual(rows[0]);
    expect(handle.getResolvedWidth('id')).toBe(80);
    expect(handle.getResolvedWidth('does-not-exist')).toBeUndefined();
  });

  // ────────────────────────── Phase 41.1: rowLayoutPass + absolute-positioned body rows ──────────────────────────
  // Verbatim port of vue3 Phase 3 SFC wiring guards (commit `153fca2`).
  // Three assertions: body container position + height contract / per-row
  // absolute positioning + monotonic top stacking / heightHint override
  // shifts downstream rows AND grows totalBodyHeight.

  it('Phase 41.1: content layer has position:relative + explicit height = sum of row heights', () => {
    // Phase 41.2 moved the position:relative + totalBodyHeight contract
    // from `.cx-table-body` to the inner `.cx-table-body-content`
    // virtual-content layer (matching vue3 Phase 4). Body is now the
    // scrollport (overflow-y:auto); content layer carries the height.
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const content = wrapper.find('.cx-table-body-content');
    const style = content.attributes('style') ?? '';
    // 3 rows × default 28px (theme.rowHeight) = 84px total content height.
    expect(style).toMatch(/position:\s*relative/i);
    expect(style).toMatch(/height:\s*84px/i);
  });

  it('Phase 41.1: body rows are position:absolute + top stacks monotonically (no overlap)', () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const bodyRows = wrapper.findAll('.cx-table-body .cx-table-row');
    expect(bodyRows).toHaveLength(3);
    function topPx(style: string | void): number {
      if (!style) return -1;
      const match = /(?:^|;\s*)top:\s*([0-9.]+)px/i.exec(style);
      return match ? Number.parseFloat(match[1]!) : -1;
    }
    const tops: number[] = [];
    for (let i = 0; i < bodyRows.length; i++) {
      const row = bodyRows.at(i);
      const style = row.attributes('style') ?? '';
      expect(style).toMatch(/position:\s*absolute/i);
      tops.push(topPx(row.attributes('style')));
    }
    // Monotonic stacking at 28px row height: 0, 28, 56.
    expect(tops).toEqual([0, 28, 56]);
  });

  it('Phase 41.1: heightHint override shifts downstream row tops AND grows totalBodyHeight', () => {
    const hintedRows: readonly RowSpec[] = [
      { id: 'r1', data: { id: 1, name: 'A', qty: 10, status: 'OK', note: '' } },
      // r2 is 48px tall (20 taller than default 28).
      { id: 'r2', data: { id: 2, name: 'B', qty: 20, status: 'OK', note: '' }, heightHint: 48 },
      { id: 'r3', data: { id: 3, name: 'C', qty: 30, status: 'OK', note: '' } },
    ];
    const wrapper = mount(TableForTest, { propsData: { columns, rows: hintedRows } });
    function topPx(style: string | void): number {
      if (!style) return -1;
      const match = /(?:^|;\s*)top:\s*([0-9.]+)px/i.exec(style);
      return match ? Number.parseFloat(match[1]!) : -1;
    }
    function heightPx(style: string | void): number {
      if (!style) return -1;
      const match = /(?:^|;\s*)height:\s*([0-9.]+)px/i.exec(style);
      return match ? Number.parseFloat(match[1]!) : -1;
    }
    const r1 = wrapper.find('.cx-table-row[data-row-id="r1"]');
    const r2 = wrapper.find('.cx-table-row[data-row-id="r2"]');
    const r3 = wrapper.find('.cx-table-row[data-row-id="r3"]');
    expect(topPx(r1.attributes('style'))).toBe(0);
    expect(heightPx(r1.attributes('style'))).toBe(28);
    expect(topPx(r2.attributes('style'))).toBe(28);
    expect(heightPx(r2.attributes('style'))).toBe(48); // heightHint
    // r3 starts AFTER the 48px row.
    expect(topPx(r3.attributes('style'))).toBe(76); // 28 + 48
    expect(heightPx(r3.attributes('style'))).toBe(28);
    // Phase 41.2: body height moved to the inner content layer.
    const content = wrapper.find('.cx-table-body-content');
    expect(heightPx(content.attributes('style'))).toBe(104); // 28 + 48 + 28
  });

  // ────────────────────────── Phase 41.2: virtualRowsPass + scrollport + content layer ──────────────────────────
  // Verbatim ports of vue3 Phase 4 SFC wiring guards (commit `50ce0e6`).
  // Four assertions: body scrollport contract / content layer contract /
  // pre-mount fallback renders all rows / direct composable round-trip
  // with explicit viewport restricts visibleRows.

  it('Phase 41.2: .cx-table-body is the scrollport with overflow-y:auto', () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const body = wrapper.find('.cx-table-body');
    const style = body.attributes('style') ?? '';
    expect(style).toMatch(/overflow-y:\s*auto/i);
  });

  it('Phase 41.2: .cx-table-body-content is the virtual content layer with position:relative + totalBodyHeight', () => {
    // 3 rows × default rowHeight 28 = 84px content height.
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const content = wrapper.find('.cx-table-body-content');
    expect(content.exists()).toBe(true);
    const style = content.attributes('style') ?? '';
    expect(style).toMatch(/position:\s*relative/i);
    expect(style).toMatch(/height:\s*84px/i);
  });

  it('Phase 41.2: pre-mount fallback — body clientHeight=0 (happy-dom default) renders all rows directly', () => {
    // happy-dom default: body clientHeight = 0 since no CSS height +
    // no parent height. Per chronix-table.ts: when bodyClientHeight
    // is 0 we fall back to props.rows so the table is never blank
    // pre-measure. Smoke test for both small (3 rows) + large (100
    // rows) datasets.
    const manyRows: readonly RowSpec[] = Array.from({ length: 100 }, (_, i) => ({
      id: `r${i}`,
      data: { id: i, name: `name-${i}`, qty: i, status: 'OK', note: '' },
    }));
    const wrapper = mount(TableForTest, { propsData: { columns, rows: manyRows } });
    const bodyRows = wrapper.findAll('.cx-table-body-content .cx-table-row');
    expect(bodyRows.length).toBe(100);
    function heightPx(style: string | void): number {
      if (!style) return -1;
      const match = /(?:^|;\s*)height:\s*([0-9.]+)px/i.exec(style);
      return match ? Number.parseFloat(match[1]!) : -1;
    }
    // Content layer carries the full virtual height (100 × 28 = 2800).
    const content = wrapper.find('.cx-table-body-content');
    expect(heightPx(content.attributes('style'))).toBe(100 * 28);
  });

  it('Phase 41.2: useTableLayout virtualRowsPass round-trip — explicit viewport restricts visibleRows', async () => {
    // Direct composable test (decoupled from happy-dom's missing
    // clientHeight) — verifies the pass wiring without mocking the
    // ResizeObserver-driven scrollTop ref. Mirrors vue3 Phase 4's
    // assertion at chronix-table.test.ts:230-255 verbatim.
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

  // ────────────────────────── Phase 41.3: cell value resolution + cell class names ──────────────────────────
  // Verbatim ports of vue3 Phase 5 SFC wiring guards (commit `34660d5`).
  // Three assertions: default cell text regression after swapping
  // formatCellPrimitive → formatCellValue / valueFormatter overrides
  // default stringification / cellClass function adds resolved classes
  // AND preserves the structural cx-table-cell class.

  it('Phase 41.3: default cell text matches String(row.data[field]) after formatCellPrimitive → formatCellValue swap (regression)', () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    // First row's id cell: row.data.id = 1; default formatter → '1'.
    const idCell = wrapper.find('.cx-table-cell[data-col-id="id"][data-row-id="r1"]');
    expect(idCell.text()).toBe('1');
    // First row's name cell: row.data.name = 'Alpha'.
    const nameCell = wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="r1"]');
    expect(nameCell.text()).toBe('Alpha');
  });

  it('Phase 41.3: valueFormatter overrides default stringification in the rendered cell text', () => {
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
    const wrapper = mount(TableForTest, { propsData: { columns: formattedColumns, rows } });
    const qtyCell = wrapper.find('.cx-table-cell[data-col-id="qty"][data-row-id="r1"]');
    expect(qtyCell.text()).toBe('Q-10');
  });

  it('Phase 41.3: cellClass function adds resolved classes AND preserves the structural cx-table-cell class', () => {
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
    const wrapper = mount(TableForTest, { propsData: { columns: classedColumns, rows } });
    const statusCellR1 = wrapper.find('.cx-table-cell[data-col-id="status"][data-row-id="r1"]');
    const r1ClassAttr = statusCellR1.attributes('class') ?? '';
    // Structural class preserved.
    expect(r1ClassAttr).toMatch(/\bcx-table-cell\b/);
    // Dynamic class for r1's status='OK' → 'status-ok'.
    expect(r1ClassAttr).toMatch(/\bstatus-ok\b/);
  });

  // ────────────────────────── Phase 41.4: cell + row interaction emits ──────────────────────────
  // Verbatim ports of vue3 Phase 5.1 SFC wiring guards (commit `3804764`).
  // Four assertions: cell-click payload shape + value resolution / row-click
  // payload / row-mouseenter once-per-row + intra-row child re-entry
  // suppressed / row-mouseleave once-per-row + intra-row exit suppressed.

  it('Phase 41.4: cell-click emits {row, column, value, jsEvent} when a body cell is clicked', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const cell = wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="r2"]');
    await cell.trigger('click');
    // vue-test-utils v1's `emitted(name)` is typed as `Object | undefined`
    // (loose Vue 2 shape). Cast to the typed payload form first so per-
    // index access doesn't trip @typescript-eslint/no-unsafe-member-access.
    // Same idiom as chronix-gantt-vue2's adapters/gantt-vue2/src/chronix-gantt.test.ts.
    const emits = wrapper.emitted('cell-click') as
      | [{ row: RowSpec; column: ColumnSpec; value: unknown; jsEvent: MouseEvent }][]
      | undefined;
    expect(emits).toBeTruthy();
    expect(emits!.length).toBe(1);
    const payload = emits![0]![0];
    expect(payload.row.id).toBe('r2');
    expect(payload.column.id).toBe('name');
    expect(payload.value).toBe('Beta');
    expect(payload.jsEvent).toBeInstanceOf(MouseEvent);
  });

  it('Phase 41.4: row-click emits {row, jsEvent} when a body row receives a click', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const cell = wrapper.find('.cx-table-cell[data-col-id="id"][data-row-id="r3"]');
    await cell.trigger('click');
    const emits = wrapper.emitted('row-click') as
      | [{ row: RowSpec; jsEvent: MouseEvent }][]
      | undefined;
    expect(emits).toBeTruthy();
    expect(emits!.length).toBe(1);
    const payload = emits![0]![0];
    expect(payload.row.id).toBe('r3');
  });

  it('Phase 41.4: row-mouseenter fires once when pointer enters a row from outside; intra-row child re-entry suppressed', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const cell = wrapper.find('.cx-table-cell[data-col-id="id"][data-row-id="r1"]');
    // First entry from outside any row (relatedTarget = null → not same-row).
    await cell.trigger('pointerover', { relatedTarget: null });
    let emits = wrapper.emitted('row-mouseenter') as
      | [{ row: RowSpec; jsEvent: PointerEvent }][]
      | undefined;
    expect(emits).toBeTruthy();
    expect(emits!.length).toBe(1);
    expect(emits![0]![0].row.id).toBe('r1');
    // Pointer moves to a sibling cell on the SAME row (id → name) —
    // relatedTarget is a sibling cell with the same data-row-id, so
    // the handler should suppress re-emit.
    const siblingCell = wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="r1"]');
    await siblingCell.trigger('pointerover', { relatedTarget: cell.element });
    emits = wrapper.emitted('row-mouseenter') as
      | [{ row: RowSpec; jsEvent: PointerEvent }][]
      | undefined;
    expect(emits!.length).toBe(1);
  });

  it('Phase 41.4: row-mouseleave fires once when pointer leaves the row to outside; intra-row exits suppressed', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const cellA = wrapper.find('.cx-table-cell[data-col-id="id"][data-row-id="r1"]');
    const cellB = wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="r1"]');
    // Pointerout from cellA to cellB (same row) — suppressed.
    await cellA.trigger('pointerout', { relatedTarget: cellB.element });
    let emits = wrapper.emitted('row-mouseleave') as
      | [{ row: RowSpec; jsEvent: PointerEvent }][]
      | undefined;
    expect(emits ?? []).toHaveLength(0);
    // Pointerout from cellA to outside any row (relatedTarget=null) — fires.
    await cellA.trigger('pointerout', { relatedTarget: null });
    emits = wrapper.emitted('row-mouseleave') as
      | [{ row: RowSpec; jsEvent: PointerEvent }][]
      | undefined;
    expect(emits).toBeTruthy();
    expect(emits!.length).toBe(1);
    expect(emits![0]![0].row.id).toBe('r1');
  });

  // ────────────────────────── Phase 41.5: theme tokens + CSS-var injection ──────────────────────────
  // Verbatim ports of vue3 Phase 6 SFC wiring guards (commit `3c14fdd`).
  // Three assertions: wrapper carries all 10 --cx-table-* declarations from
  // default theme / consumer theme override propagates / geometry vars use
  // px units (regression — no unitless emission).

  it('Phase 41.5: .cx-table-wrapper carries all 10 --cx-table-* CSS var declarations from the default theme', () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
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

  it('Phase 41.5: consumer theme override propagates to the CSS var output', () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, theme: { headerBg: 'tomato', rowHeight: 40 } },
    });
    const root = wrapper.find('.cx-table-wrapper');
    const style = root.attributes('style') ?? '';
    expect(style).toMatch(/--cx-table-header-bg:\s*tomato/);
    expect(style).toMatch(/--cx-table-row-height:\s*40px/);
    // Untouched default still present.
    expect(style).toMatch(/--cx-table-even-row-bg:\s*#fafbfc/i);
  });

  it('Phase 41.5: geometry CSS vars all use px units (no unitless emission)', () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const root = wrapper.find('.cx-table-wrapper');
    const style = root.attributes('style') ?? '';
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

  // ────────────────────────── Phase 41.6: header-click + empty-area-click + dblclick emits ──────────────────────────
  // Verbatim ports of vue3 Phase 7 SFC wiring guards (commit `5a3000a`).
  // Six assertions: header-click payload + region isolation, empty-area-
  // click + mutual exclusion with row-click, row+cell click on row hit +
  // mutual exclusion with empty-area, cell-dblclick payload + value
  // resolution, row-dblclick alongside cell-dblclick.

  it('Phase 41.6: header-click emits {column, jsEvent} when a header cell is clicked', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const headerCell = wrapper.find('.cx-table-header-cell[data-col-id="status"]');
    await headerCell.trigger('click');
    const emits = wrapper.emitted('header-click') as
      | [{ column: ColumnSpec; jsEvent: MouseEvent }][]
      | undefined;
    expect(emits).toBeTruthy();
    expect(emits!.length).toBe(1);
    const payload = emits![0]![0];
    expect(payload.column.id).toBe('status');
    expect(payload.jsEvent).toBeInstanceOf(MouseEvent);
  });

  it('Phase 41.6: empty-area-click fires when body click lands outside any row; mutual exclusion with row-click', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const bodyContent = wrapper.find('.cx-table-body-content');
    await bodyContent.trigger('click');
    const emits = wrapper.emitted('empty-area-click') as [{ jsEvent: MouseEvent }][] | undefined;
    expect(emits).toBeTruthy();
    expect(emits!.length).toBe(1);
    expect(emits![0]![0].jsEvent).toBeInstanceOf(MouseEvent);
    // row-click NOT emitted by an empty-area click.
    expect(wrapper.emitted('row-click') ?? []).toHaveLength(0);
  });

  it('Phase 41.6: row-click + cell-click fire when body click lands on a row; empty-area-click NOT emitted (mutual exclusion)', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const cell = wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="r2"]');
    await cell.trigger('click');
    expect(wrapper.emitted('row-click')).toHaveLength(1);
    expect(wrapper.emitted('cell-click')).toHaveLength(1);
    // Mutual exclusion: empty-area-click NOT fired when click hit a row.
    expect(wrapper.emitted('empty-area-click') ?? []).toHaveLength(0);
  });

  it('Phase 41.6: cell-dblclick emits {row, column, value, jsEvent} on body cell double-click', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const cell = wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="r2"]');
    await cell.trigger('dblclick');
    const emits = wrapper.emitted('cell-dblclick') as
      | [{ row: RowSpec; column: ColumnSpec; value: unknown; jsEvent: MouseEvent }][]
      | undefined;
    expect(emits).toBeTruthy();
    expect(emits!.length).toBe(1);
    const payload = emits![0]![0];
    expect(payload.row.id).toBe('r2');
    expect(payload.column.id).toBe('name');
    expect(payload.value).toBe('Beta');
  });

  it('Phase 41.6: row-dblclick fires whenever a body double-click hits any row (alongside cell-dblclick)', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const cell = wrapper.find('.cx-table-cell[data-col-id="id"][data-row-id="r3"]');
    await cell.trigger('dblclick');
    expect(wrapper.emitted('row-dblclick')).toHaveLength(1);
    expect(wrapper.emitted('cell-dblclick')).toHaveLength(1);
    const emits = wrapper.emitted('row-dblclick') as
      | [{ row: RowSpec; jsEvent: MouseEvent }][]
      | undefined;
    expect(emits![0]![0].row.id).toBe('r3');
  });

  it('Phase 41.6: header-click does NOT trigger from body clicks (event delegation isolated by region)', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const cell = wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="r1"]');
    await cell.trigger('click');
    // header-click handler attaches to .cx-table-header — body clicks
    // shouldn't bubble through it. Verifies region isolation.
    expect(wrapper.emitted('header-click') ?? []).toHaveLength(0);
  });

  // ────────────────────────── Phase 42: sortPass single-column header click cycle ──────────────────────────
  // Verbatim ports of vue3 Phase 8 SFC wiring guards (commit `78171a5`).
  // Five assertions: setSort applies + sort-change emit / indicator
  // renders correctly / 3-state click cycle / body rows reorder /
  // non-sortable header no-op.

  it('Phase 42: setSort applies a SortSpec + fires sort-change emit; getSort reflects the new state', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const handle = wrapper.vm as unknown as {
      getSort(): readonly SortSpec[];
      setSort(spec: SortSpec | readonly SortSpec[] | null): void;
      clearSort(): void;
    };
    expect(handle.getSort()).toEqual([]);
    handle.setSort({ colId: 'name', direction: 'asc' });
    await wrapper.vm.$nextTick();
    expect(handle.getSort()).toEqual([{ colId: 'name', direction: 'asc' }]);
    const emits = wrapper.emitted('sort-change') as
      | [{ sortSpec: readonly SortSpec[] }][]
      | undefined;
    expect(emits).toBeTruthy();
    expect(emits!.length).toBe(1);
    expect(emits![0]![0].sortSpec).toEqual([{ colId: 'name', direction: 'asc' }]);
    handle.clearSort();
    await wrapper.vm.$nextTick();
    expect(handle.getSort()).toEqual([]);
    expect(wrapper.emitted('sort-change')).toHaveLength(2);
  });

  it('Phase 42: header sort indicator renders ▲ for ASC, ▼ for DESC, empty for unsorted', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const handle = wrapper.vm as unknown as {
      setSort(spec: SortSpec | readonly SortSpec[] | null): void;
    };
    const nameIndicator = wrapper.find(
      '.cx-table-header-cell[data-col-id="name"] .cx-table-sort-indicator',
    );
    expect(nameIndicator.exists()).toBe(true);
    expect(nameIndicator.text()).toBe('');
    handle.setSort({ colId: 'name', direction: 'asc' });
    await wrapper.vm.$nextTick();
    expect(
      wrapper.find('.cx-table-header-cell[data-col-id="name"] .cx-table-sort-indicator').text(),
    ).toBe('▲');
    handle.setSort({ colId: 'name', direction: 'desc' });
    await wrapper.vm.$nextTick();
    expect(
      wrapper.find('.cx-table-header-cell[data-col-id="name"] .cx-table-sort-indicator').text(),
    ).toBe('▼');
    // Switch column: name clears, qty shows ▲.
    handle.setSort({ colId: 'qty', direction: 'asc' });
    await wrapper.vm.$nextTick();
    expect(
      wrapper.find('.cx-table-header-cell[data-col-id="name"] .cx-table-sort-indicator').text(),
    ).toBe('');
    expect(
      wrapper.find('.cx-table-header-cell[data-col-id="qty"] .cx-table-sort-indicator').text(),
    ).toBe('▲');
  });

  it('Phase 42: clicking a sortable header cycles [] → [asc] → [desc] → [] (single-column mode)', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const handle = wrapper.vm as unknown as { getSort(): readonly SortSpec[] };
    const qtyHeader = wrapper.find('.cx-table-header-cell[data-col-id="qty"]');
    expect(handle.getSort()).toEqual([]);
    await qtyHeader.trigger('click');
    expect(handle.getSort()).toEqual([{ colId: 'qty', direction: 'asc' }]);
    await qtyHeader.trigger('click');
    expect(handle.getSort()).toEqual([{ colId: 'qty', direction: 'desc' }]);
    await qtyHeader.trigger('click');
    expect(handle.getSort()).toEqual([]);
    expect(wrapper.emitted('sort-change')).toHaveLength(3);
    expect(wrapper.emitted('header-click')).toHaveLength(3);
  });

  it('Phase 42: clicking a sortable header reorders body rows (data-row-id sequence reflects sort)', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const handle = wrapper.vm as unknown as {
      setSort(spec: SortSpec | readonly SortSpec[] | null): void;
    };
    handle.setSort({ colId: 'qty', direction: 'asc' });
    await wrapper.vm.$nextTick();
    const sortedIds: string[] = [];
    const sortedRowEls = wrapper.findAll('.cx-table-body-content .cx-table-row');
    for (let i = 0; i < sortedRowEls.length; i++) {
      const id = sortedRowEls.at(i).attributes('data-row-id');
      sortedIds.push(typeof id === 'string' ? id : '');
    }
    // qty values: r1=10, r2=20, r3=30 → ASC = r1, r2, r3 (already source order).
    expect(sortedIds).toEqual(['r1', 'r2', 'r3']);
    handle.setSort({ colId: 'qty', direction: 'desc' });
    await wrapper.vm.$nextTick();
    const descIds: string[] = [];
    const descRowEls = wrapper.findAll('.cx-table-body-content .cx-table-row');
    for (let i = 0; i < descRowEls.length; i++) {
      const id = descRowEls.at(i).attributes('data-row-id');
      descIds.push(typeof id === 'string' ? id : '');
    }
    expect(descIds).toEqual(['r3', 'r2', 'r1']);
  });

  it('Phase 42: clicking a non-sortable header does NOT change sort state (header-click still emits)', async () => {
    const cols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', headerName: 'ID', width: 80 },
      // Phase 55 (2026-05-26 — vue2 port of vue3 Phase 14): set
      // reorderable:false alongside sortable:false so the column is
      // truly non-interactive — without it the cursor would be 'grab'
      // from the move-drag affordance (reorderable defaults to true),
      // masking the sortable:false intent of this test.
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
    const wrapper = mount(TableForTest, { propsData: { columns: cols, rows: rs } });
    const handle = wrapper.vm as unknown as { getSort(): readonly SortSpec[] };
    const frozenHeader = wrapper.find('.cx-table-header-cell[data-col-id="frozen"]');
    await frozenHeader.trigger('click');
    expect(handle.getSort()).toEqual([]);
    expect(wrapper.emitted('sort-change') ?? []).toHaveLength(0);
    // header-click still fires.
    expect(wrapper.emitted('header-click')).toHaveLength(1);
    // Non-sortable header: cursor:default + aria-sort='none'.
    const style = frozenHeader.attributes('style') ?? '';
    expect(style).toMatch(/cursor:\s*default/i);
    expect(frozenHeader.attributes('aria-sort')).toBe('none');
  });

  // ────────────────────────── Phase 42.1: multi-column sort (shift+click) ──────────────────────────
  // Verbatim ports of vue3 Phase 8.1 SFC wiring guards (commit `aad05db`).
  // Four assertions: shift+click append / shift+click flip in place /
  // shift+click third time remove / plain click during multi-col resets.

  it('Phase 42.1: shift+click on a sortable header appends asc to the sort array', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const handle = wrapper.vm as unknown as { getSort(): readonly SortSpec[] };
    // First, plain click 名称 → single-column ASC.
    const nameHeader = wrapper.find('.cx-table-header-cell[data-col-id="name"]');
    await nameHeader.trigger('click');
    expect(handle.getSort()).toEqual([{ colId: 'name', direction: 'asc' }]);
    // Now shift+click 数量 → appends to array.
    const qtyHeader = wrapper.find('.cx-table-header-cell[data-col-id="qty"]');
    await qtyHeader.trigger('click', { shiftKey: true });
    expect(handle.getSort()).toEqual([
      { colId: 'name', direction: 'asc' },
      { colId: 'qty', direction: 'asc' },
    ]);
  });

  it('Phase 42.1: shift+click on a column already in the sort array flips ASC to DESC in place', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const handle = wrapper.vm as unknown as {
      getSort(): readonly SortSpec[];
      setSort(spec: SortSpec | readonly SortSpec[] | null): void;
    };
    // Seed multi-col [name asc, qty asc].
    handle.setSort([
      { colId: 'name', direction: 'asc' },
      { colId: 'qty', direction: 'asc' },
    ]);
    await wrapper.vm.$nextTick();
    // Shift+click qty → flip to desc IN PLACE (position preserved).
    const qtyHeader = wrapper.find('.cx-table-header-cell[data-col-id="qty"]');
    await qtyHeader.trigger('click', { shiftKey: true });
    expect(handle.getSort()).toEqual([
      { colId: 'name', direction: 'asc' },
      { colId: 'qty', direction: 'desc' },
    ]);
  });

  it('Phase 42.1: shift+click on a DESC column removes it from the array (other columns keep priority)', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const handle = wrapper.vm as unknown as {
      getSort(): readonly SortSpec[];
      setSort(spec: SortSpec | readonly SortSpec[] | null): void;
    };
    handle.setSort([
      { colId: 'name', direction: 'asc' },
      { colId: 'qty', direction: 'desc' },
    ]);
    await wrapper.vm.$nextTick();
    const qtyHeader = wrapper.find('.cx-table-header-cell[data-col-id="qty"]');
    await qtyHeader.trigger('click', { shiftKey: true });
    expect(handle.getSort()).toEqual([{ colId: 'name', direction: 'asc' }]);
  });

  it('Phase 42.1: plain (non-shift) click during multi-column sort resets to single-column mode', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const handle = wrapper.vm as unknown as {
      getSort(): readonly SortSpec[];
      setSort(spec: SortSpec | readonly SortSpec[] | null): void;
    };
    handle.setSort([
      { colId: 'name', direction: 'asc' },
      { colId: 'qty', direction: 'asc' },
    ]);
    await wrapper.vm.$nextTick();
    // Plain click on status → resets to single-col [status asc].
    const statusHeader = wrapper.find('.cx-table-header-cell[data-col-id="status"]');
    await statusHeader.trigger('click');
    expect(handle.getSort()).toEqual([{ colId: 'status', direction: 'asc' }]);
    // Verify the multi-column position superscript NOT shown for
    // single-column sort.
    const statusPos = wrapper.find(
      '.cx-table-header-cell[data-col-id="status"] .cx-table-sort-indicator-position',
    );
    expect(statusPos.exists()).toBe(false);
  });

  // ────────────────────────── Phase 43: filterPass + showFilterRow + 3 handle methods ──────────────────────────
  // Verbatim ports of vue3 Phase 9 SFC wiring guards (commit `89b1a3e`).
  // Six assertions: setFilter + filter-change emit + getFilter round-trip;
  // setFilter narrows body rows (filter pipeline wired); filter row
  // conditional render on showFilterRow; typing fires filter-change +
  // narrows; clearing input removes spec entry; filterable:false renders
  // disabled.

  it('Phase 43: setFilter applies a FilterSpec + fires filter-change emit; getFilter reflects new state', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
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
    const emits = wrapper.emitted('filter-change') as
      | [{ filterSpec: readonly FilterSpec[] }][]
      | undefined;
    expect(emits).toBeTruthy();
    expect(emits!.length).toBe(1);
    expect(emits![0]![0].filterSpec).toEqual([spec]);
    handle.clearFilter();
    await wrapper.vm.$nextTick();
    expect(handle.getFilter()).toEqual([]);
    expect(wrapper.emitted('filter-change')).toHaveLength(2);
  });

  it('Phase 43: setFilter narrows the rendered body rows (filter pipeline wired)', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const handle = wrapper.vm as unknown as {
      setFilter(spec: FilterSpec | readonly FilterSpec[] | null): void;
    };
    // Filter for rows whose name contains "Alpha" — only r1 matches.
    handle.setFilter({ type: 'text', colId: 'name', operator: 'contains', value: 'Alpha' });
    await wrapper.vm.$nextTick();
    const bodyRows = wrapper.findAll('.cx-table-body-content .cx-table-row');
    const visibleRowIds: string[] = [];
    for (let i = 0; i < bodyRows.length; i++) {
      const id = bodyRows.at(i).attributes('data-row-id');
      visibleRowIds.push(typeof id === 'string' ? id : '');
    }
    expect(visibleRowIds).toEqual(['r1']);
  });

  it('Phase 43: filter row renders when showFilterRow=true; absent by default', () => {
    // Default (showFilterRow omitted) → filter row absent.
    const noFilter = mount(TableForTest, { propsData: { columns, rows } });
    expect(noFilter.find('.cx-table-filter-row').exists()).toBe(false);
    // showFilterRow=true → filter row renders one input per visible column.
    const withFilter = mount(TableForTest, {
      propsData: { columns, rows, showFilterRow: true },
    });
    const row = withFilter.find('.cx-table-filter-row');
    expect(row.exists()).toBe(true);
    const inputs = withFilter.findAll('.cx-table-filter-input');
    expect(inputs).toHaveLength(columns.length);
  });

  it('Phase 43: typing into a filter input fires filter-change + narrows body rows', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, showFilterRow: true },
    });
    const handle = wrapper.vm as unknown as { getFilter(): readonly FilterSpec[] };
    const nameInput = wrapper.find('.cx-table-filter-input[data-col-id="name"]');
    expect(nameInput.exists()).toBe(true);
    await nameInput.setValue('Alpha');
    expect(handle.getFilter()).toEqual([
      { type: 'text', colId: 'name', operator: 'contains', value: 'Alpha' },
    ]);
    const bodyRows = wrapper.findAll('.cx-table-body-content .cx-table-row');
    const visibleRowIds: string[] = [];
    for (let i = 0; i < bodyRows.length; i++) {
      const id = bodyRows.at(i).attributes('data-row-id');
      visibleRowIds.push(typeof id === 'string' ? id : '');
    }
    expect(visibleRowIds).toEqual(['r1']);
    expect(wrapper.emitted('filter-change')).toHaveLength(1);
  });

  it('Phase 43: clearing the filter input removes the spec entry (does not leave a value="" entry)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, showFilterRow: true },
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

  it('Phase 43: filter input on a column with filterable=false renders disabled', () => {
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
    const wrapper = mount(TableForTest, {
      propsData: { columns: cols, rows: rs, showFilterRow: true },
    });
    const frozenInput = wrapper.find('.cx-table-filter-input[data-col-id="frozen"]');
    expect(frozenInput.exists()).toBe(true);
    expect(frozenInput.attributes('disabled')).toBeDefined();
    const idInput = wrapper.find('.cx-table-filter-input[data-col-id="id"]');
    expect(idInput.attributes('disabled')).toBeUndefined();
  });

  // ────────────────────────── Phase 43.1: number filter (prefix syntax) ──────────────────────────
  // Verbatim ports of vue3 Phase 9.1 SFC wiring guards (commit `4c4c696`).
  // Four assertions: `>20` produces NumberFilterSpec + narrows body /
  // `10..30` inRange / invalid syntax = no-op / programmatic setFilter
  // round-trips into input value via formatPrefixNumberFilter.

  it('Phase 43.1: typing ">20" into a number column produces NumberFilterSpec {operator:">",value:20}', async () => {
    const numCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', headerName: 'ID', width: 80 },
      { id: 'qty', field: 'qty', headerName: 'Qty', width: 120, type: 'number' },
    ];
    const numRows: readonly RowSpec[] = [
      { id: 'r1', data: { id: 1, qty: 10 } },
      { id: 'r2', data: { id: 2, qty: 30 } },
      { id: 'r3', data: { id: 3, qty: 50 } },
    ];
    const wrapper = mount(TableForTest, {
      propsData: { columns: numCols, rows: numRows, showFilterRow: true },
    });
    const handle = wrapper.vm as unknown as { getFilter(): readonly FilterSpec[] };
    const qtyInput = wrapper.find('.cx-table-filter-input[data-col-id="qty"]');
    expect(qtyInput.attributes('data-filter-type')).toBe('number');
    await qtyInput.setValue('>20');
    const spec = handle.getFilter()[0] as NumberFilterSpec | undefined;
    expect(spec).toMatchObject({ type: 'number', colId: 'qty', operator: '>', value: 20 });
    // Body rows narrow: only qty=30 and qty=50 pass.
    const bodyRows = wrapper.findAll('.cx-table-body-content .cx-table-row');
    const visible: string[] = [];
    for (let i = 0; i < bodyRows.length; i++) {
      const id = bodyRows.at(i).attributes('data-row-id');
      visible.push(typeof id === 'string' ? id : '');
    }
    expect(visible).toEqual(['r2', 'r3']);
  });

  it('Phase 43.1: typing "10..30" produces inRange NumberFilterSpec; body rows narrow to in-range subset', async () => {
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
    const wrapper = mount(TableForTest, {
      propsData: { columns: numCols, rows: numRows, showFilterRow: true },
    });
    const handle = wrapper.vm as unknown as { getFilter(): readonly FilterSpec[] };
    const qtyInput = wrapper.find('.cx-table-filter-input[data-col-id="qty"]');
    await qtyInput.setValue('10..30');
    expect(handle.getFilter()).toEqual([
      { type: 'number', colId: 'qty', operator: 'inRange', value: 10, valueTo: 30 },
    ]);
    const bodyRows = wrapper.findAll('.cx-table-body-content .cx-table-row');
    const visible: string[] = [];
    for (let i = 0; i < bodyRows.length; i++) {
      const id = bodyRows.at(i).attributes('data-row-id');
      visible.push(typeof id === 'string' ? id : '');
    }
    expect(visible).toEqual(['r2', 'r3', 'r4']);
  });

  it('Phase 43.1: invalid syntax in number filter input does NOT produce a spec entry (no rows hidden)', async () => {
    const numCols: readonly ColumnSpec[] = [
      { id: 'qty', field: 'qty', headerName: 'Qty', width: 120, type: 'number' },
    ];
    const numRows: readonly RowSpec[] = [
      { id: 'r1', data: { qty: 10 } },
      { id: 'r2', data: { qty: 20 } },
    ];
    const wrapper = mount(TableForTest, {
      propsData: { columns: numCols, rows: numRows, showFilterRow: true },
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
    const bodyRows = wrapper.findAll('.cx-table-body-content .cx-table-row');
    const visible: string[] = [];
    for (let i = 0; i < bodyRows.length; i++) {
      const id = bodyRows.at(i).attributes('data-row-id');
      visible.push(typeof id === 'string' ? id : '');
    }
    expect(visible).toEqual(['r1', 'r2']);
  });

  it('Phase 43.1: setFilter with programmatic NumberFilterSpec round-trips into the input value via formatPrefixNumberFilter', async () => {
    const numCols: readonly ColumnSpec[] = [
      { id: 'qty', field: 'qty', headerName: 'Qty', width: 120, type: 'number' },
    ];
    const wrapper = mount(TableForTest, {
      propsData: { columns: numCols, rows: [], showFilterRow: true },
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

  // ────────────────────────── Phase 40.2 (2026-05-29 — vue2 port): aria-describedby on column headers ──────────────────────────

  it('Phase 40.2: each columnheader carries aria-describedby pointing to a sibling description span with matching id', () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const headers = wrapper.findAll('.cx-table-header-cell[data-col-id]');
    expect(headers.length).toBeGreaterThan(0);
    for (let i = 0; i < headers.length; i += 1) {
      const header = headers.at(i);
      const describedById = header.attributes('aria-describedby');
      expect(describedById).toBeDefined();
      if (describedById == null) continue;
      expect(describedById).toMatch(/^cx-table-header-cell-desc-/);
      const descSpan = wrapper.find(`#${describedById}`);
      expect(descSpan.exists()).toBe(true);
    }
  });

  it('Phase 40.2: header description text reflects current sort + filter state', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const handle = wrapper.vm as unknown as {
      setSort(spec: SortSpec | readonly SortSpec[] | null): void;
      setFilter(spec: FilterSpec | readonly FilterSpec[] | null): void;
    };
    expect(wrapper.find('#cx-table-header-cell-desc-name').text()).toBe('');
    handle.setSort({ colId: 'name', direction: 'asc' });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('#cx-table-header-cell-desc-name').text()).toBe('sorted ascending');
    handle.setFilter({ type: 'text', colId: 'name', operator: 'contains', value: 'Alpha' });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('#cx-table-header-cell-desc-name').text()).toBe(
      'sorted ascending; filter contains "Alpha"',
    );
  });

  // ────────────────────────── Phase 41.1 (2026-05-29 — vue2 port): cell-level quick-find highlight ──────────────────────────

  it('Phase 41.1: cell renders .cx-table-cell__find-match span around matching substring', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const handle = wrapper.vm as unknown as {
      setQuickFindText(text: string): void;
    };
    handle.setQuickFindText('Alpha');
    await wrapper.vm.$nextTick();
    const matchSpans = wrapper.findAll('.cx-table-cell__find-match');
    expect(matchSpans.length).toBeGreaterThan(0);
    expect(matchSpans.at(0).text()).toBe('Alpha');
  });

  it('Phase 41.1: clearing quickFindText removes highlight markup', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
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

  // ────────────────────────── Phase 41 (2026-05-29 — vue2 port): quick-find / search ──────────────────────────

  it('Phase 41: setQuickFindText applies a needle + fires quick-find-text-change emit; getQuickFindText reflects new state', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const handle = wrapper.vm as unknown as {
      getQuickFindText(): string;
      setQuickFindText(text: string | null | undefined): void;
    };
    expect(handle.getQuickFindText()).toBe('');
    handle.setQuickFindText('Alpha');
    await wrapper.vm.$nextTick();
    expect(handle.getQuickFindText()).toBe('Alpha');
    const emits = wrapper.emitted('quick-find-text-change') as
      | [{ quickFindText: string }][]
      | undefined;
    expect(emits).toHaveLength(1);
    expect(emits?.[0]?.[0]).toEqual({ quickFindText: 'Alpha' });
    handle.setQuickFindText('');
    await wrapper.vm.$nextTick();
    expect(handle.getQuickFindText()).toBe('');
    expect(wrapper.emitted('quick-find-text-change')).toHaveLength(2);
  });

  it('Phase 41: setQuickFindText narrows the rendered body rows (cross-column OR substring match)', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const handle = wrapper.vm as unknown as {
      setQuickFindText(text: string): void;
    };
    handle.setQuickFindText('first');
    await wrapper.vm.$nextTick();
    const visibleRowIds = wrapper
      .findAll('.cx-table-body-content .cx-table-row')
      .wrappers.map((r) => r.attributes('data-row-id'));
    expect(visibleRowIds).toEqual(['r1']);
  });

  it('Phase 41: getQuickFindMatchCount reflects post-find row count + identity case when empty', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const handle = wrapper.vm as unknown as {
      getQuickFindMatchCount(): number;
      setQuickFindText(text: string): void;
    };
    expect(handle.getQuickFindMatchCount()).toBe(rows.length);
    handle.setQuickFindText('OK');
    await wrapper.vm.$nextTick();
    expect(handle.getQuickFindMatchCount()).toBe(2);
    handle.setQuickFindText('');
    await wrapper.vm.$nextTick();
    expect(handle.getQuickFindMatchCount()).toBe(rows.length);
  });

  it('Phase 41: case-insensitive substring match across multiple columns', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const handle = wrapper.vm as unknown as {
      setQuickFindText(text: string): void;
    };
    handle.setQuickFindText('alpha');
    await wrapper.vm.$nextTick();
    expect(
      wrapper
        .findAll('.cx-table-body-content .cx-table-row')
        .wrappers.map((r) => r.attributes('data-row-id')),
    ).toEqual(['r1']);
  });

  // ────────────────────────── Phase 44: row selection (single + multi) ──────────────────────────
  // Verbatim ports of vue3 Phase 10 SFC wiring guards (commit `02b1225`).
  // Eleven assertions: default 'none' no-op / single mode select+deselect /
  // single mode replace / multi mode plain click replaces / multi Ctrl
  // toggle / multi Meta toggle (Mac) / selection-change payload / DOM
  // modifier + aria-selected / setSelectedRowIds([])===clearSelection /
  // isRowSelected boolean / applySelection dedup.

  it('Phase 44: default selectionMode is "none"; row click does NOT change selection or emit', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const handle = wrapper.vm as unknown as { getSelectedRowIds(): readonly string[] };
    expect(handle.getSelectedRowIds()).toEqual([]);
    const cell = wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="r1"]');
    await cell.trigger('click');
    expect(handle.getSelectedRowIds()).toEqual([]);
    expect(wrapper.emitted('selection-change') ?? []).toHaveLength(0);
  });

  it('Phase 44: single mode — plain click selects that row; second click on same row deselects', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, selectionMode: 'single' },
    });
    const handle = wrapper.vm as unknown as { getSelectedRowIds(): readonly string[] };
    const cell = wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="r1"]');
    await cell.trigger('click');
    expect(handle.getSelectedRowIds()).toEqual(['r1']);
    await cell.trigger('click');
    expect(handle.getSelectedRowIds()).toEqual([]);
    expect(wrapper.emitted('selection-change')).toHaveLength(2);
  });

  it('Phase 44: single mode — clicking a different row replaces previous selection', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, selectionMode: 'single' },
    });
    const handle = wrapper.vm as unknown as { getSelectedRowIds(): readonly string[] };
    const cellR1 = wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="r1"]');
    const cellR2 = wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="r2"]');
    await cellR1.trigger('click');
    expect(handle.getSelectedRowIds()).toEqual(['r1']);
    await cellR2.trigger('click');
    expect(handle.getSelectedRowIds()).toEqual(['r2']);
  });

  it('Phase 44: multi mode — plain click REPLACES the entire selection (single-select within multi)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, selectionMode: 'multi' },
    });
    const handle = wrapper.vm as unknown as {
      getSelectedRowIds(): readonly string[];
      setSelectedRowIds(ids: readonly string[] | null): void;
    };
    handle.setSelectedRowIds(['r1', 'r2', 'r3']);
    await wrapper.vm.$nextTick();
    const cellR2 = wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="r2"]');
    // Plain click (no modifier) → replaces with [r2].
    await cellR2.trigger('click');
    expect(handle.getSelectedRowIds()).toEqual(['r2']);
  });

  it('Phase 44: multi mode — Ctrl+click toggles a row in/out of the selection', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, selectionMode: 'multi' },
    });
    const handle = wrapper.vm as unknown as { getSelectedRowIds(): readonly string[] };
    const cellR1 = wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="r1"]');
    const cellR2 = wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="r2"]');
    const cellR3 = wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="r3"]');
    await cellR1.trigger('click');
    expect(handle.getSelectedRowIds()).toEqual(['r1']);
    await cellR2.trigger('click', { ctrlKey: true });
    expect(handle.getSelectedRowIds()).toEqual(['r1', 'r2']);
    await cellR3.trigger('click', { ctrlKey: true });
    expect(handle.getSelectedRowIds()).toEqual(['r1', 'r2', 'r3']);
    // Toggle r2 off — preserves r1, r3 order.
    await cellR2.trigger('click', { ctrlKey: true });
    expect(handle.getSelectedRowIds()).toEqual(['r1', 'r3']);
  });

  it('Phase 44: multi mode — Meta+click (Cmd) toggles symmetrically with Ctrl+click', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, selectionMode: 'multi' },
    });
    const handle = wrapper.vm as unknown as { getSelectedRowIds(): readonly string[] };
    const cellR1 = wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="r1"]');
    const cellR2 = wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="r2"]');
    await cellR1.trigger('click', { metaKey: true });
    expect(handle.getSelectedRowIds()).toEqual(['r1']);
    await cellR2.trigger('click', { metaKey: true });
    expect(handle.getSelectedRowIds()).toEqual(['r1', 'r2']);
    // Mac convention: metaKey toggle symmetric.
    await cellR1.trigger('click', { metaKey: true });
    expect(handle.getSelectedRowIds()).toEqual(['r2']);
  });

  it('Phase 44: selection-change emit payload contains the new readonly string[]', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, selectionMode: 'multi' },
    });
    const cellR1 = wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="r1"]');
    await cellR1.trigger('click');
    const emits = wrapper.emitted('selection-change') as
      | [{ selectedRowIds: readonly string[] }][]
      | undefined;
    expect(emits).toBeTruthy();
    expect(emits!.length).toBe(1);
    expect(emits![0]![0].selectedRowIds).toEqual(['r1']);
  });

  it('Phase 44: selected rows render .cx-table-row--selected class + aria-selected="true"', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, selectionMode: 'multi' },
    });
    const handle = wrapper.vm as unknown as {
      setSelectedRowIds(ids: readonly string[] | null): void;
    };
    handle.setSelectedRowIds(['r2']);
    await wrapper.vm.$nextTick();
    const r1 = wrapper.find('.cx-table-row[data-row-id="r1"]');
    const r2 = wrapper.find('.cx-table-row[data-row-id="r2"]');
    expect(r1.classes('cx-table-row--selected')).toBe(false);
    expect(r1.attributes('aria-selected')).toBeUndefined();
    expect(r2.classes('cx-table-row--selected')).toBe(true);
    expect(r2.attributes('aria-selected')).toBe('true');
  });

  it('Phase 44: setSelectedRowIds([]) and clearSelection() are equivalent + both fire selection-change', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, selectionMode: 'multi' },
    });
    const handle = wrapper.vm as unknown as {
      getSelectedRowIds(): readonly string[];
      setSelectedRowIds(ids: readonly string[] | null): void;
      clearSelection(): void;
    };
    handle.setSelectedRowIds(['r1']);
    await wrapper.vm.$nextTick();
    expect(handle.getSelectedRowIds()).toEqual(['r1']);
    handle.setSelectedRowIds([]);
    await wrapper.vm.$nextTick();
    expect(handle.getSelectedRowIds()).toEqual([]);
    // Re-select then clearSelection() — should also fire emit + clear.
    handle.setSelectedRowIds(['r2', 'r3']);
    await wrapper.vm.$nextTick();
    handle.clearSelection();
    await wrapper.vm.$nextTick();
    expect(handle.getSelectedRowIds()).toEqual([]);
    // Four emits: set [r1] / set [] / set [r2,r3] / clear → [].
    expect(wrapper.emitted('selection-change')).toHaveLength(4);
  });

  it('Phase 44: isRowSelected(rowId) returns correct boolean for selected / unselected rows', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, selectionMode: 'multi' },
    });
    const handle = wrapper.vm as unknown as {
      setSelectedRowIds(ids: readonly string[] | null): void;
      isRowSelected(rowId: string): boolean;
    };
    expect(handle.isRowSelected('r1')).toBe(false);
    handle.setSelectedRowIds(['r1', 'r3']);
    await wrapper.vm.$nextTick();
    expect(handle.isRowSelected('r1')).toBe(true);
    expect(handle.isRowSelected('r2')).toBe(false);
    expect(handle.isRowSelected('r3')).toBe(true);
    // Non-existent rowId → false (no row-existence validation per Phase 44 design).
    expect(handle.isRowSelected('does-not-exist')).toBe(false);
  });

  it('Phase 44: applySelection dedups no-op transitions (no emit when set unchanged)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, selectionMode: 'multi' },
    });
    const handle = wrapper.vm as unknown as {
      setSelectedRowIds(ids: readonly string[] | null): void;
    };
    handle.setSelectedRowIds(['r1', 'r2']);
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('selection-change')).toHaveLength(1);
    // Same array contents in same order → no emit.
    handle.setSelectedRowIds(['r1', 'r2']);
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('selection-change')).toHaveLength(1);
    // Different order → DOES emit (insertion order is meaningful).
    handle.setSelectedRowIds(['r2', 'r1']);
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('selection-change')).toHaveLength(2);
  });

  // ────────────────────────── Phase 44.1: checkbox column + select-all + shift+click range ──────────────────────────
  // Verbatim ports of vue3 Phase 10.1 SFC wiring guards (commit `f5aa509`).
  // Nine assertions: default off / left-prepend / right-append / per-row
  // checked reflects state / per-row toggle (always toggle, independent of
  // selectionMode) / header 3-state via DOM indeterminate property /
  // select-all click selects-all / shift+click range with anchor /
  // shift+click degen (no anchor → plain).

  it('Phase 44.1: default selectionColumn.show=false → no selection rail rendered', () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, selectionMode: 'multi' },
    });
    expect(wrapper.find('.cx-table-selection-cell').exists()).toBe(false);
    expect(wrapper.find('.cx-table-selection-checkbox').exists()).toBe(false);
  });

  it('Phase 44.1: selectionColumn.show=true, side="left" → header + per-row checkboxes render with column prepended', () => {
    const wrapper = mount(TableForTest, {
      propsData: {
        columns,
        rows,
        selectionMode: 'multi',
        selectionColumn: { show: true, side: 'left' },
      },
    });
    expect(wrapper.find('.cx-table-selection-cell').exists()).toBe(true);
    expect(wrapper.find('.cx-table-selection-checkbox--header').exists()).toBe(true);
    const bodyCheckboxes = wrapper.findAll('.cx-table-selection-checkbox--row');
    expect(bodyCheckboxes).toHaveLength(rows.length);
    // First child of header row is the selection cell (side='left').
    const firstHeaderCell = wrapper.find('.cx-table-row--header > div:first-child');
    expect(firstHeaderCell.classes()).toContain('cx-table-selection-cell');
  });

  it('Phase 44.1: selectionColumn.side="right" → selection cell APPENDED to header + body row', () => {
    const wrapper = mount(TableForTest, {
      propsData: {
        columns,
        rows,
        selectionMode: 'multi',
        selectionColumn: { show: true, side: 'right' },
      },
    });
    const lastHeaderCell = wrapper.find('.cx-table-row--header > div:last-child');
    expect(lastHeaderCell.classes()).toContain('cx-table-selection-cell');
  });

  it('Phase 44.1: per-row checkbox checked reflects isRowSelected(rowId)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
        columns,
        rows,
        selectionMode: 'multi',
        selectionColumn: { show: true, side: 'left' },
      },
    });
    const handle = wrapper.vm as unknown as {
      setSelectedRowIds(ids: readonly string[]): void;
    };
    handle.setSelectedRowIds(['r1', 'r3']);
    await wrapper.vm.$nextTick();
    const r1Box = wrapper.find('.cx-table-row[data-row-id="r1"] .cx-table-selection-checkbox--row');
    const r2Box = wrapper.find('.cx-table-row[data-row-id="r2"] .cx-table-selection-checkbox--row');
    const r3Box = wrapper.find('.cx-table-row[data-row-id="r3"] .cx-table-selection-checkbox--row');
    expect((r1Box.element as HTMLInputElement).checked).toBe(true);
    expect((r2Box.element as HTMLInputElement).checked).toBe(false);
    expect((r3Box.element as HTMLInputElement).checked).toBe(true);
  });

  it('Phase 44.1: clicking a per-row checkbox toggles selection (always toggle, independent of selectionMode)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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

  it('Phase 44.1: header three-state checkbox — checked / unchecked / indeterminate via DOM property', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
        columns,
        rows,
        selectionMode: 'multi',
        selectionColumn: { show: true, side: 'left' },
      },
    });
    const handle = wrapper.vm as unknown as {
      setSelectedRowIds(ids: readonly string[]): void;
    };
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

  it('Phase 44.1: clicking the header checkbox when not-all-selected → selects all displayed rows', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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

  it('Phase 44.1: shift+click on a body row with established anchor → selection becomes the inclusive range in display order', async () => {
    const manyRows: readonly RowSpec[] = Array.from({ length: 6 }, (_, i) => ({
      id: `r${i + 1}`,
      data: { id: i + 1, name: `Row ${i + 1}`, qty: i, status: 'OK', note: '' },
    }));
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows: manyRows, selectionMode: 'multi' },
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

  it('Phase 44.1: shift+click on a row with NO anchor → degenerate plain-click (sets anchor + replaces with [clicked])', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, selectionMode: 'multi' },
    });
    const handle = wrapper.vm as unknown as { getSelectedRowIds(): readonly string[] };
    // No prior clicks → no anchor; shift+click r2 → behaves as plain click.
    await wrapper
      .find('.cx-table-cell[data-col-id="name"][data-row-id="r2"]')
      .trigger('click', { shiftKey: true });
    expect(handle.getSelectedRowIds()).toEqual(['r2']);
  });

  // ────────────────────────── Phase 45: pagination (pagePass + footer bar) ──────────────────────────
  // Verbatim ports of vue3 Phase 11 SFC wiring guards (commit `6915934`).
  // Seven assertions: default disabled / paginated render + footer +
  // getTotalPages / setPage(1) advances + page-change emit / setPageSize
  // recomputes + oversize page clamps / filter auto-resets (Decision C.1) /
  // sort auto-resets (Decision C.1) / applyPage dedup.

  it('Phase 45: default paginationEnabled=false renders no footer; getTotalPages returns 1', () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const handle = wrapper.vm as unknown as { getTotalPages(): number };
    expect(wrapper.find('.cx-table-pagination').exists()).toBe(false);
    expect(handle.getTotalPages()).toBe(1);
  });

  it('Phase 45: paginationEnabled + 50 rows + initialPageSize=20 → 20 rendered rows + footer present + getTotalPages=3', () => {
    const manyRows: readonly RowSpec[] = Array.from({ length: 50 }, (_, i) => ({
      id: `r${i + 1}`,
      data: { id: i + 1, name: `Row ${i + 1}`, qty: i, status: 'OK', note: '' },
    }));
    const wrapper = mount(TableForTest, {
      propsData: {
        columns,
        rows: manyRows,
        paginationEnabled: true,
        initialPageSize: 20,
      },
    });
    const handle = wrapper.vm as unknown as { getTotalPages(): number; getPage(): number };
    // Footer present.
    expect(wrapper.find('.cx-table-pagination').exists()).toBe(true);
    // 3 pages total: ceil(50/20) = 3.
    expect(handle.getTotalPages()).toBe(3);
    expect(handle.getPage()).toBe(0);
    // Body renders only the first 20 rows (r1..r20).
    const bodyRows = wrapper.findAll('.cx-table-body-content .cx-table-row');
    expect(bodyRows).toHaveLength(20);
    const firstId = bodyRows.at(0).attributes('data-row-id');
    const lastId = bodyRows.at(19).attributes('data-row-id');
    expect(firstId).toBe('r1');
    expect(lastId).toBe('r20');
  });

  it('Phase 45: setPage(1) advances to next page; body re-renders rows 21-40; page-change emit fires', async () => {
    const manyRows: readonly RowSpec[] = Array.from({ length: 50 }, (_, i) => ({
      id: `r${i + 1}`,
      data: { id: i + 1, name: `Row ${i + 1}`, qty: i, status: 'OK', note: '' },
    }));
    const wrapper = mount(TableForTest, {
      propsData: {
        columns,
        rows: manyRows,
        paginationEnabled: true,
        initialPageSize: 20,
      },
    });
    const handle = wrapper.vm as unknown as {
      setPage(page: number): void;
      getPage(): number;
    };
    handle.setPage(1);
    await wrapper.vm.$nextTick();
    expect(handle.getPage()).toBe(1);
    const bodyRows = wrapper.findAll('.cx-table-body-content .cx-table-row');
    expect(bodyRows).toHaveLength(20);
    const firstId = bodyRows.at(0).attributes('data-row-id');
    const lastId = bodyRows.at(19).attributes('data-row-id');
    expect(firstId).toBe('r21');
    expect(lastId).toBe('r40');
    const emits = wrapper.emitted('page-change') as
      | [{ page: number; pageSize: number }][]
      | undefined;
    expect(emits).toBeTruthy();
    expect(emits!.length).toBe(1);
    expect(emits![0]![0]).toEqual({ page: 1, pageSize: 20 });
  });

  it('Phase 45: setPageSize(50) recomputes totalPages; oversize page index clamps on next read', async () => {
    const manyRows: readonly RowSpec[] = Array.from({ length: 50 }, (_, i) => ({
      id: `r${i + 1}`,
      data: { id: i + 1, name: `Row ${i + 1}`, qty: i, status: 'OK', note: '' },
    }));
    const wrapper = mount(TableForTest, {
      propsData: {
        columns,
        rows: manyRows,
        paginationEnabled: true,
        initialPageSize: 20,
      },
    });
    const handle = wrapper.vm as unknown as {
      setPage(page: number): void;
      setPageSize(pageSize: number): void;
      getPage(): number;
      getTotalPages(): number;
    };
    // Start on page 2 (last page with pageSize=20).
    handle.setPage(2);
    await wrapper.vm.$nextTick();
    expect(handle.getPage()).toBe(2);
    // Bump pageSize to 50 → only 1 page now. Internal currentPageRef
    // still says 2 but pagePass clamps to last valid page (0).
    handle.setPageSize(50);
    await wrapper.vm.$nextTick();
    expect(handle.getTotalPages()).toBe(1);
    // getPage reads from pass output (post-clamp).
    expect(handle.getPage()).toBe(0);
  });

  it('Phase 45: filter transition auto-resets currentPage to 0 (Decision C.1)', async () => {
    const manyRows: readonly RowSpec[] = Array.from({ length: 50 }, (_, i) => ({
      id: `r${i + 1}`,
      data: { id: i + 1, name: i < 5 ? 'ALPHA' : `Row ${i + 1}`, qty: i, status: 'OK', note: '' },
    }));
    const wrapper = mount(TableForTest, {
      propsData: {
        columns,
        rows: manyRows,
        paginationEnabled: true,
        initialPageSize: 20,
      },
    });
    const handle = wrapper.vm as unknown as {
      setPage(page: number): void;
      getPage(): number;
      setFilter(spec: FilterSpec | readonly FilterSpec[] | null): void;
    };
    handle.setPage(2);
    await wrapper.vm.$nextTick();
    expect(handle.getPage()).toBe(2);
    // Apply a filter → auto-reset to page 0.
    handle.setFilter({ type: 'text', colId: 'name', operator: 'contains', value: 'ALPHA' });
    await wrapper.vm.$nextTick();
    expect(handle.getPage()).toBe(0);
    // page-change fired once for setPage(2) then once for the reset to 0.
    const emits = wrapper.emitted('page-change') as
      | [{ page: number; pageSize: number }][]
      | undefined;
    expect(emits).toHaveLength(2);
    expect(emits![1]![0]).toEqual({ page: 0, pageSize: 20 });
  });

  it('Phase 45: sort transition auto-resets currentPage to 0 (Decision C.1)', async () => {
    const manyRows: readonly RowSpec[] = Array.from({ length: 50 }, (_, i) => ({
      id: `r${i + 1}`,
      data: { id: i + 1, name: `Row ${i + 1}`, qty: i, status: 'OK', note: '' },
    }));
    const wrapper = mount(TableForTest, {
      propsData: {
        columns,
        rows: manyRows,
        paginationEnabled: true,
        initialPageSize: 20,
      },
    });
    const handle = wrapper.vm as unknown as {
      setPage(page: number): void;
      getPage(): number;
      setSort(spec: SortSpec | readonly SortSpec[] | null): void;
    };
    handle.setPage(2);
    await wrapper.vm.$nextTick();
    expect(handle.getPage()).toBe(2);
    handle.setSort({ colId: 'qty', direction: 'asc' });
    await wrapper.vm.$nextTick();
    expect(handle.getPage()).toBe(0);
  });

  it('Phase 45: applyPage dedups no-op transitions (same page+pageSize → no second emit)', async () => {
    const manyRows: readonly RowSpec[] = Array.from({ length: 50 }, (_, i) => ({
      id: `r${i + 1}`,
      data: { id: i + 1, name: `Row ${i + 1}`, qty: i, status: 'OK', note: '' },
    }));
    const wrapper = mount(TableForTest, {
      propsData: {
        columns,
        rows: manyRows,
        paginationEnabled: true,
        initialPageSize: 20,
      },
    });
    const handle = wrapper.vm as unknown as { setPage(page: number): void };
    handle.setPage(1);
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('page-change')).toHaveLength(1);
    // Re-setting same value → no-op, no emit.
    handle.setPage(1);
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('page-change')).toHaveLength(1);
    // Different value → emits.
    handle.setPage(2);
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('page-change')).toHaveLength(2);
  });

  // ────────────────────────── Phase 45.1: page-number bar (ellipsis-aware list) ──────────────────────────
  // Verbatim ports of vue3 Phase 11.1 SFC wiring guards (commit `18f403b`).
  // Four assertions: 5 pages no-ellipsis (under threshold) / 20 pages with
  // ellipsis (1, …, 20 all present) / clicking a page button jumps + emit /
  // current-page button --current modifier + aria-current + disabled.

  it('Phase 45.1: page-number bar renders one button per page when totalPages <= threshold (5 pages, no ellipsis)', () => {
    const manyRows: readonly RowSpec[] = Array.from({ length: 50 }, (_, i) => ({
      id: `r${i + 1}`,
      data: { id: i + 1, name: `Row ${i + 1}`, qty: i, status: 'OK', note: '' },
    }));
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows: manyRows, paginationEnabled: true, initialPageSize: 10 },
    });
    // 50 / 10 = 5 pages → under default threshold (7) → all pages render, no ellipsis.
    const pageButtons = wrapper.findAll('.cx-table-pagination-page');
    expect(pageButtons).toHaveLength(5);
    expect(wrapper.find('.cx-table-pagination-ellipsis').exists()).toBe(false);
    // Labels are 1-based (the user-facing display).
    const labels: string[] = [];
    for (let i = 0; i < pageButtons.length; i++) {
      labels.push(pageButtons.at(i).text());
    }
    expect(labels).toEqual(['1', '2', '3', '4', '5']);
  });

  it('Phase 45.1: ellipsis appears with large totalPages (200 rows / pageSize 10 = 20 pages)', () => {
    const lotsOfRows: readonly RowSpec[] = Array.from({ length: 200 }, (_, i) => ({
      id: `r${i + 1}`,
      data: { id: i + 1, name: `Row ${i + 1}`, qty: i, status: 'OK', note: '' },
    }));
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows: lotsOfRows, paginationEnabled: true, initialPageSize: 10 },
    });
    // Initial page = 0 → near-start mode → [1, 2, 3, ellipsis, 20].
    expect(wrapper.find('.cx-table-pagination-ellipsis').exists()).toBe(true);
    const items = wrapper.findAll('.cx-table-pagination-pages > *');
    const labels: string[] = [];
    for (let i = 0; i < items.length; i++) {
      labels.push(items.at(i).text());
    }
    expect(labels).toContain('1');
    expect(labels).toContain('20');
    expect(labels).toContain('…');
  });

  it('Phase 45.1: clicking a page-number button jumps to that page + fires page-change emit', async () => {
    const manyRows: readonly RowSpec[] = Array.from({ length: 50 }, (_, i) => ({
      id: `r${i + 1}`,
      data: { id: i + 1, name: `Row ${i + 1}`, qty: i, status: 'OK', note: '' },
    }));
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows: manyRows, paginationEnabled: true, initialPageSize: 10 },
    });
    const handle = wrapper.vm as unknown as { getPage(): number };
    // Click the "page 3" button (index 2).
    const page3 = wrapper.find('.cx-table-pagination-page[data-page-index="2"]');
    expect(page3.exists()).toBe(true);
    await page3.trigger('click');
    expect(handle.getPage()).toBe(2);
    const emits = wrapper.emitted('page-change') as
      | [{ page: number; pageSize: number }][]
      | undefined;
    expect(emits).toBeTruthy();
    expect(emits!.length).toBe(1);
    expect(emits![0]![0].page).toBe(2);
  });

  it('Phase 45.1: current page button carries --current modifier + aria-current="page" + disabled', async () => {
    const manyRows: readonly RowSpec[] = Array.from({ length: 50 }, (_, i) => ({
      id: `r${i + 1}`,
      data: { id: i + 1, name: `Row ${i + 1}`, qty: i, status: 'OK', note: '' },
    }));
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows: manyRows, paginationEnabled: true, initialPageSize: 10 },
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

  // -----------------------------------------------------------------
  // Phase 46 (2026-05-25): inline edit base — verbatim port of vue3
  // Phase 12 tests (commit `d16dfda`, lines 1596-1817). All emit reads
  // use the vue-test-utils v1 cast pattern (typed-array | undefined)
  // per memory gotcha #10 + B41.4.1.
  // -----------------------------------------------------------------

  it('Phase 46: dblclick on a non-editable cell does NOT enter edit mode (no input, no cell-edit-start)', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    await wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="r1"]').trigger('dblclick');
    expect(wrapper.find('.cx-table-cell-editor').exists()).toBe(false);
    const startEmits = wrapper.emitted('cell-edit-start') as
      | [{ row: RowSpec; column: ColumnSpec; baseValue: unknown; draftValue: unknown }][]
      | undefined;
    expect(startEmits ?? []).toHaveLength(0);
  });

  it('Phase 46: dblclick on an editable cell opens the editor + fires cell-edit-start', async () => {
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, editable: true },
    ];
    const wrapper = mount(TableForTest, { propsData: { columns: editableColumns, rows } });
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    expect(wrapper.find('.cx-table-cell-editor').exists()).toBe(true);
    const startEmits = wrapper.emitted('cell-edit-start') as
      | [{ row: RowSpec; column: ColumnSpec; baseValue: unknown; draftValue: unknown }][]
      | undefined;
    expect(startEmits).toBeTruthy();
    expect(startEmits!.length).toBe(1);
    const startPayload = startEmits![0]![0];
    expect(startPayload.row.id).toBe('r1');
    expect(startPayload.column.id).toBe('note');
    expect(startPayload.baseValue).toBe('first');
    expect(startPayload.draftValue).toBe('first');
  });

  it('Phase 46: editor input value reflects valueFormatter when present', async () => {
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      {
        ...columns[4]!,
        editable: true,
        valueFormatter: ({ value }) => `[${String(value)}]`,
      },
    ];
    const wrapper = mount(TableForTest, { propsData: { columns: editableColumns, rows } });
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    const input = wrapper.find('.cx-table-cell-editor').element as HTMLInputElement;
    expect(input.value).toBe('[first]');
  });

  it('Phase 46: typing in the editor updates draftValue but does NOT mutate row.data', async () => {
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, editable: true },
    ];
    const wrapper = mount(TableForTest, { propsData: { columns: editableColumns, rows } });
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

  it('Phase 46: pressing Enter commits + fires cell-value-change + cell-edit-stop {committed: true}', async () => {
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, editable: true },
    ];
    const wrapper = mount(TableForTest, { propsData: { columns: editableColumns, rows } });
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('committed value');
    await editor.trigger('keydown', { key: 'Enter' });
    expect(wrapper.find('.cx-table-cell-editor').exists()).toBe(false);
    const changes = wrapper.emitted('cell-value-change') as
      | [{ row: RowSpec; column: ColumnSpec; oldValue: unknown; newValue: unknown }][]
      | undefined;
    expect(changes).toBeTruthy();
    expect(changes!.length).toBe(1);
    const changePayload = changes![0]![0];
    expect(changePayload.oldValue).toBe('first');
    expect(changePayload.newValue).toBe('committed value');
    const stops = wrapper.emitted('cell-edit-stop') as
      | [{ row: RowSpec; column: ColumnSpec; committed: boolean; finalValue: unknown }][]
      | undefined;
    expect(stops).toBeTruthy();
    expect(stops!.length).toBe(1);
    expect(stops![0]![0].committed).toBe(true);
  });

  it('Phase 46: pressing Esc cancels (no cell-value-change; cell-edit-stop {committed: false})', async () => {
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, editable: true },
    ];
    const wrapper = mount(TableForTest, { propsData: { columns: editableColumns, rows } });
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('discarded');
    await editor.trigger('keydown', { key: 'Escape' });
    expect(wrapper.find('.cx-table-cell-editor').exists()).toBe(false);
    expect(wrapper.emitted('cell-value-change') ?? []).toHaveLength(0);
    const stops = wrapper.emitted('cell-edit-stop') as
      | [{ row: RowSpec; column: ColumnSpec; committed: boolean; finalValue: unknown }][]
      | undefined;
    expect(stops).toBeTruthy();
    expect(stops!.length).toBe(1);
    expect(stops![0]![0].committed).toBe(false);
  });

  it('Phase 46: blur commits (Notion semantic) — same effect as Enter', async () => {
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, editable: true },
    ];
    const wrapper = mount(TableForTest, { propsData: { columns: editableColumns, rows } });
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('blur committed');
    await editor.trigger('blur');
    const changes = wrapper.emitted('cell-value-change') as
      | [{ row: RowSpec; column: ColumnSpec; oldValue: unknown; newValue: unknown }][]
      | undefined;
    expect(changes).toBeTruthy();
    expect(changes!.length).toBe(1);
    expect(changes![0]![0].newValue).toBe('blur committed');
  });

  it('Phase 46: committing with draftValue === baseValue suppresses cell-value-change (still fires cell-edit-stop)', async () => {
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, editable: true },
    ];
    const wrapper = mount(TableForTest, { propsData: { columns: editableColumns, rows } });
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    // No typing — draft === base ('first').
    await wrapper.find('.cx-table-cell-editor').trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('cell-value-change') ?? []).toHaveLength(0);
    const stops = wrapper.emitted('cell-edit-stop') as
      | [{ row: RowSpec; column: ColumnSpec; committed: boolean; finalValue: unknown }][]
      | undefined;
    expect(stops).toBeTruthy();
    expect(stops!.length).toBe(1);
  });

  it('Phase 46: pressing Tab commits (Phase 46.2 also auto-advances to next editable cell — see Phase 46.2 tests below)', async () => {
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, editable: true },
    ];
    const wrapper = mount(TableForTest, { propsData: { columns: editableColumns, rows } });
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('tab committed');
    await editor.trigger('keydown', { key: 'Tab' });
    // The commit MUST fire regardless of Phase 46.2 auto-advance.
    const changes = wrapper.emitted('cell-value-change') as
      | [{ row: RowSpec; column: ColumnSpec; oldValue: unknown; newValue: unknown }][]
      | undefined;
    expect(changes).toBeTruthy();
    expect(changes!.length).toBe(1);
    expect(changes![0]![0].newValue).toBe('tab committed');
    // Phase 46.2: single editable column → Tab from r1.note jumps to r2.note
    // (next row's only editable col). Dedicated tests below cover the
    // auto-advance + boundary behavior in detail.
  });

  it('Phase 46: handle.startEditingCell / setEditingCellDraft / commitEditingCell programmatic round-trip', async () => {
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, editable: true },
    ];
    const wrapper = mount(TableForTest, { propsData: { columns: editableColumns, rows } });
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
    const changes = wrapper.emitted('cell-value-change') as
      | [{ row: RowSpec; column: ColumnSpec; oldValue: unknown; newValue: unknown }][]
      | undefined;
    expect(changes).toBeTruthy();
    expect(changes!.length).toBe(1);
    expect(changes![0]![0].newValue).toBe('programmatic');
  });

  it('Phase 46: startEditingCell on non-editable column is a silent no-op', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const handle = wrapper.vm as unknown as {
      startEditingCell(rowId: string, colId: string): void;
      getEditingCell(): { rowId: string } | null;
    };
    handle.startEditingCell('r1', 'name');
    await wrapper.vm.$nextTick();
    expect(handle.getEditingCell()).toBeNull();
    expect(wrapper.emitted('cell-edit-start') ?? []).toHaveLength(0);
  });

  it('Phase 46: opening edit on a different cell commits the previous one first', async () => {
    const editableColumns: readonly ColumnSpec[] = [
      { ...columns[0]!, editable: true },
      ...columns.slice(1, 4),
      { ...columns[4]!, editable: true },
    ];
    const wrapper = mount(TableForTest, { propsData: { columns: editableColumns, rows } });
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
    const changes = wrapper.emitted('cell-value-change') as
      | [{ row: RowSpec; column: ColumnSpec; oldValue: unknown; newValue: unknown }][]
      | undefined;
    expect(changes).toBeTruthy();
    expect(changes!.length).toBe(1);
    expect(changes![0]![0].newValue).toBe('was about to commit');
    expect(wrapper.emitted('cell-edit-start') ?? []).toHaveLength(2);
  });

  // -----------------------------------------------------------------
  // Phase 46.1 (2026-05-25): number editor + typed draft coercion —
  // verbatim port of vue3 Phase 12.1 tests (commit `cda2dff`, lines
  // 1818-1928). The number editor branch in `buildCellEditorInput`
  // renders `<input type="number">` for columns whose
  // `type === 'number'`, and `applyEditCommit` runs the raw draft
  // through `coerceEditDraftValue` before emitting. Invalid input
  // rejects the commit (editor stays open, `cell-edit-stop
  // {committed: false}` fires, no `cell-value-change`).
  // -----------------------------------------------------------------

  function numberEditableColumns(): readonly ColumnSpec[] {
    return [
      columns[0]!,
      columns[1]!,
      { ...columns[2]!, type: 'number', editable: true },
      columns[3]!,
      { ...columns[4]!, editable: true },
    ];
  }

  it('Phase 46.1: number-typed editable column renders `<input type="number">` + inputmode="decimal"', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns: numberEditableColumns(), rows } });
    await wrapper.find('.cx-table-cell[data-col-id="qty"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor').element as HTMLInputElement;
    expect(editor.type).toBe('number');
    expect(editor.getAttribute('inputmode')).toBe('decimal');
    // text editor branch remains for non-numeric columns.
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r2"]').trigger('dblclick');
    const textEditor = wrapper.find('.cx-table-cell-editor').element as HTMLInputElement;
    expect(textEditor.type).toBe('text');
  });

  it('Phase 46.1: valid numeric commit fires cell-value-change with `newValue: number` (not string)', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns: numberEditableColumns(), rows } });
    await wrapper.find('.cx-table-cell[data-col-id="qty"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('42');
    await editor.trigger('keydown', { key: 'Enter' });
    const changes = wrapper.emitted('cell-value-change') as
      | [{ row: RowSpec; column: ColumnSpec; oldValue: unknown; newValue: unknown }][]
      | undefined;
    expect(changes).toBeTruthy();
    expect(changes!.length).toBe(1);
    const payload = changes![0]![0];
    expect(payload.oldValue).toBe(10);
    expect(payload.newValue).toBe(42);
    expect(typeof payload.newValue).toBe('number');
    const stops = wrapper.emitted('cell-edit-stop') as
      | [{ row: RowSpec; column: ColumnSpec; committed: boolean; finalValue: unknown }][]
      | undefined;
    expect(stops).toBeTruthy();
    expect(stops!.length).toBe(1);
    expect(stops![0]![0].committed).toBe(true);
    expect(stops![0]![0].finalValue).toBe(42);
  });

  it('Phase 46.1: empty-string commit on number column produces `newValue: null`', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns: numberEditableColumns(), rows } });
    await wrapper.find('.cx-table-cell[data-col-id="qty"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('');
    await editor.trigger('keydown', { key: 'Enter' });
    const changes = wrapper.emitted('cell-value-change') as
      | [{ row: RowSpec; column: ColumnSpec; oldValue: unknown; newValue: unknown }][]
      | undefined;
    expect(changes).toBeTruthy();
    expect(changes!.length).toBe(1);
    const payload = changes![0]![0];
    expect(payload.oldValue).toBe(10);
    expect(payload.newValue).toBeNull();
    expect(wrapper.find('.cx-table-cell-editor').exists()).toBe(false);
  });

  it('Phase 46.1: invalid input rejects commit — editor stays open, no cell-value-change, cell-edit-stop {committed:false} fires (reject-and-keep)', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns: numberEditableColumns(), rows } });
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
    // sanitization and exercise the actual rejection codepath. Matches the
    // vue3 Phase 12.1 test bypass verbatim.
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
    const stops = wrapper.emitted('cell-edit-stop') as
      | [{ row: RowSpec; column: ColumnSpec; committed: boolean; finalValue: unknown }][]
      | undefined;
    expect(stops).toBeTruthy();
    expect(stops!.length).toBe(1);
    expect(stops![0]![0].committed).toBe(false);
    expect(stops![0]![0].finalValue).toBe(10);
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
    const changes = wrapper.emitted('cell-value-change') as
      | [{ row: RowSpec; column: ColumnSpec; oldValue: unknown; newValue: unknown }][]
      | undefined;
    expect(changes).toBeTruthy();
    expect(changes!.length).toBe(1);
    expect(changes![0]![0].newValue).toBe(99);
  });

  // -----------------------------------------------------------------
  // Phase 46.2 (2026-05-25): Tab-to-next-editable-cell auto-advance —
  // verbatim port of vue3 Phase 12.2 tests (commit `40dfe33`, lines
  // 1881-1984). Tab now commits AND auto-opens the next editable cell
  // in display order (Decision B.1 cross-row jump on row exhaustion;
  // Decision A.1 close at table boundary). Shift+Tab navigates
  // backward. Phase 46.1's rejection path is preserved — rejected
  // commit skips the auto-advance.
  // -----------------------------------------------------------------

  function twoEditableColumns(): readonly ColumnSpec[] {
    return [
      columns[0]!,
      columns[1]!,
      { ...columns[2]!, editable: true }, // qty: 2nd editable, in-row neighbor
      columns[3]!,
      { ...columns[4]!, editable: true }, // note: 3rd editable, in-row neighbor
    ];
  }

  it('Phase 46.2: Tab forward commits then auto-opens next editable cell in same row', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns: twoEditableColumns(), rows } });
    const handle = wrapper.vm as unknown as {
      getEditingCell(): {
        rowId: string;
        colId: string;
        baseValue: unknown;
        draftValue: unknown;
      } | null;
    };
    await wrapper.find('.cx-table-cell[data-col-id="qty"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('77');
    await editor.trigger('keydown', { key: 'Tab' });
    // First cell committed. qty in twoEditableColumns has no `type:'number'`,
    // so coerce is passthrough and newValue retains the editor's string draft.
    const changes = wrapper.emitted('cell-value-change') as
      | [{ row: RowSpec; column: ColumnSpec; oldValue: unknown; newValue: unknown }][]
      | undefined;
    expect(changes).toBeTruthy();
    expect(changes!.length).toBe(1);
    expect(changes![0]![0].newValue).toBe('77');
    // Editor is now on the next editable cell of the same row (note column).
    // Phase 46 applyEditStart initialises draftValue via formatCellValue, so
    // numeric source values render as their string text in the editor.
    expect(handle.getEditingCell()).toEqual({
      rowId: 'r1',
      colId: 'note',
      baseValue: 'first',
      draftValue: 'first',
    });
    const starts = wrapper.emitted('cell-edit-start') as
      | [{ row: RowSpec; column: ColumnSpec; baseValue: unknown; draftValue: unknown }][]
      | undefined;
    expect(starts).toBeTruthy();
    expect(starts!.length).toBe(2); // initial dblclick + auto-advance start
    const secondStart = starts![1]![0];
    expect(secondStart.row.id).toBe('r1');
    expect(secondStart.column.id).toBe('note');
  });

  it('Phase 46.2: Tab forward at row-end skips to next row first editable cell (Decision B.1)', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns: twoEditableColumns(), rows } });
    const handle = wrapper.vm as unknown as {
      getEditingCell(): {
        rowId: string;
        colId: string;
        baseValue: unknown;
        draftValue: unknown;
      } | null;
    };
    // Start on the LAST editable column of r1 (note). Tab should jump to r2's FIRST editable column (qty).
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('updated note');
    await editor.trigger('keydown', { key: 'Tab' });
    // baseValue is the raw row.data.qty (number 20); draftValue is the
    // formatted string ('20') per Phase 46 applyEditStart initialisation.
    expect(handle.getEditingCell()).toEqual({
      rowId: 'r2',
      colId: 'qty',
      baseValue: 20,
      draftValue: '20',
    });
  });

  it('Phase 46.2: Shift+Tab navigates backward + Tab at table-end closes editor (Decision A.1)', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns: twoEditableColumns(), rows } });
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

  it('Phase 46.2: rejected commit (Phase 46.1 path) does NOT auto-advance — editor stays on original cell', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns: numberEditableColumns(), rows } });
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

  it('Phase 46.2: spurious-blur guard — Enter commit + native blur post-unmount does NOT double-fire (deferred from Phase 46)', async () => {
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, editable: true },
    ];
    const wrapper = mount(TableForTest, { propsData: { columns: editableColumns, rows } });
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('committed once');
    await editor.trigger('keydown', { key: 'Enter' });
    // Immediately fire a blur (simulates the native blur post-unmount). If
    // editCommitInProgressRef were already cleared by the time blur fires, a
    // second `cell-value-change` / `cell-edit-stop` pair would emit. With the
    // guard, the blur handler must short-circuit + only the Enter-commit
    // pair stands.
    await editor.trigger('blur');
    const changes = wrapper.emitted('cell-value-change') as
      | [{ row: RowSpec; column: ColumnSpec; oldValue: unknown; newValue: unknown }][]
      | undefined;
    expect(changes).toBeTruthy();
    expect(changes!.length).toBe(1); // NOT 2
    const stops = wrapper.emitted('cell-edit-stop') as
      | [{ row: RowSpec; column: ColumnSpec; committed: boolean; finalValue: unknown }][]
      | undefined;
    expect(stops).toBeTruthy();
    expect(stops!.length).toBe(1); // NOT 2
    expect(stops![0]![0].committed).toBe(true);
    expect(stops![0]![0].finalValue).toBe('committed once');
  });

  // -----------------------------------------------------------------
  // Phase 47 (2026-05-25): column resize (drag-resize boundary) —
  // verbatim port of vue3 Phase 13 tests (commit `c9e0f29`, lines
  // 2035-2212). Resizer renders inside each `resizable !== false`
  // header cell. Pointer capture keeps pointermove + pointerup on the
  // resizer regardless of cursor position. Drag updates draftWidth in
  // real-time (the SFC's columnsForLayout computed substitutes the
  // resizing column's width + clears its flex); pointerup commits via
  // `column-width-change` emit per Decision A.1. Other flex columns
  // continue to share the remaining space — Decision B.1 ("拖谁谁变").
  // -----------------------------------------------------------------

  function resizableColumns(): readonly ColumnSpec[] {
    // 5 cols total: id (default), name (flex:1), qty (width 120),
    // status (width 100, resizable:false), note (flex:2).
    // The mix exercises explicit-width + flex + resizable:false + opt-out.
    return [
      { ...columns[0]!, minWidth: 40 }, // id (default width 80)
      columns[1]!, // name flex:1
      { ...columns[2]!, minWidth: 60, maxWidth: 240 }, // qty width=120 + bounded
      { ...columns[3]!, resizable: false }, // status resizable:false → no resizer
      columns[4]!, // note flex:2
    ];
  }

  it('Phase 47: resizable !== false columns render `.cx-table-header-resizer`; resizable:false columns omit it', () => {
    const wrapper = mount(TableForTest, { propsData: { columns: resizableColumns(), rows } });
    // id, name, qty, note → 4 resizers; status (resizable:false) → no resizer.
    expect(wrapper.findAll('.cx-table-header-resizer')).toHaveLength(4);
    expect(
      wrapper.find('.cx-table-header-cell[data-col-id="status"] .cx-table-header-resizer').exists(),
    ).toBe(false);
    // The resizer carries data-resizer-col-id for hit-test identification.
    const qtyResizer = wrapper.find('[data-resizer-col-id="qty"]');
    expect(qtyResizer.exists()).toBe(true);
  });

  it('Phase 47: pointerdown on resizer fires column-resize-start + sets getResizingColumn()', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns: resizableColumns(), rows } });
    const handle = wrapper.vm as unknown as {
      getResizingColumn(): { colId: string; baseWidth: number; draftWidth: number } | null;
    };
    const resizer = wrapper.find('[data-resizer-col-id="qty"]');
    await resizer.trigger('pointerdown', { button: 0, clientX: 500, pointerId: 1 });
    expect(handle.getResizingColumn()?.colId).toBe('qty');
    expect(handle.getResizingColumn()?.baseWidth).toBe(120);
    expect(handle.getResizingColumn()?.draftWidth).toBe(120); // === base at start
    const starts = wrapper.emitted('column-resize-start') as
      | [{ column: ColumnSpec; baseWidth: number; draftWidth: number }][]
      | undefined;
    expect(starts).toBeTruthy();
    expect(starts!.length).toBe(1);
    const payload = starts![0]![0];
    expect(payload.column.id).toBe('qty');
    expect(payload.baseWidth).toBe(120);
    expect(payload.draftWidth).toBe(120);
  });

  it('Phase 47: pointermove updates draftWidth + the header cell width re-renders live', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns: resizableColumns(), rows } });
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

  it('Phase 47: pointerup commits — fires column-width-change + column-resize-stop {committed:true} + clears state', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns: resizableColumns(), rows } });
    const handle = wrapper.vm as unknown as {
      getResizingColumn(): unknown;
    };
    const resizer = wrapper.find('[data-resizer-col-id="qty"]');
    await resizer.trigger('pointerdown', { button: 0, clientX: 500, pointerId: 1 });
    await resizer.trigger('pointermove', { clientX: 580, pointerId: 1 });
    await resizer.trigger('pointerup', { pointerId: 1 });
    expect(handle.getResizingColumn()).toBeNull();
    const changes = wrapper.emitted('column-width-change') as
      | [{ column: ColumnSpec; oldWidth: number; newWidth: number }][]
      | undefined;
    expect(changes).toBeTruthy();
    expect(changes!.length).toBe(1);
    const change = changes![0]![0];
    expect(change.column.id).toBe('qty');
    expect(change.oldWidth).toBe(120);
    expect(change.newWidth).toBe(200);
    const stops = wrapper.emitted('column-resize-stop') as
      | [{ column: ColumnSpec; committed: boolean; finalWidth: number }][]
      | undefined;
    expect(stops).toBeTruthy();
    expect(stops!.length).toBe(1);
    expect(stops![0]![0].committed).toBe(true);
    expect(stops![0]![0].finalWidth).toBe(200);
  });

  it('Phase 47: pointerup with no draftWidth change (draft === base) suppresses column-width-change (no-op dedup)', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns: resizableColumns(), rows } });
    const resizer = wrapper.find('[data-resizer-col-id="qty"]');
    await resizer.trigger('pointerdown', { button: 0, clientX: 500, pointerId: 1 });
    // No pointermove → draftWidth === baseWidth.
    await resizer.trigger('pointerup', { pointerId: 1 });
    expect(wrapper.emitted('column-width-change') ?? []).toHaveLength(0);
    const stops = wrapper.emitted('column-resize-stop') as [{ committed: boolean }][] | undefined;
    expect(stops).toBeTruthy();
    expect(stops!.length).toBe(1);
    expect(stops![0]![0].committed).toBe(true);
  });

  it('Phase 47: handle.cancelColumnResize fires column-resize-stop {committed:false} only — no column-width-change', () => {
    const wrapper = mount(TableForTest, { propsData: { columns: resizableColumns(), rows } });
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
    const stops = wrapper.emitted('column-resize-stop') as
      | [{ committed: boolean; finalWidth: number }][]
      | undefined;
    expect(stops).toBeTruthy();
    expect(stops!.length).toBe(1);
    const payload = stops![0]![0];
    expect(payload.committed).toBe(false);
    expect(payload.finalWidth).toBe(120); // baseWidth restored
  });

  it('Phase 47: minWidth clamp — dragging far left clamps draftWidth to column.minWidth', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns: resizableColumns(), rows } });
    const handle = wrapper.vm as unknown as {
      getResizingColumn(): { draftWidth: number } | null;
    };
    const resizer = wrapper.find('[data-resizer-col-id="qty"]');
    await resizer.trigger('pointerdown', { button: 0, clientX: 500, pointerId: 1 });
    // Drag far left — raw would be 120 + (-500) = -380 → clamped up to minWidth 60.
    await resizer.trigger('pointermove', { clientX: 0, pointerId: 1 });
    expect(handle.getResizingColumn()?.draftWidth).toBe(60);
  });

  it('Phase 47: maxWidth clamp — dragging far right clamps draftWidth to column.maxWidth', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns: resizableColumns(), rows } });
    const handle = wrapper.vm as unknown as {
      getResizingColumn(): { draftWidth: number } | null;
    };
    const resizer = wrapper.find('[data-resizer-col-id="qty"]');
    await resizer.trigger('pointerdown', { button: 0, clientX: 500, pointerId: 1 });
    // Drag far right — raw would be 120 + 500 = 620 → clamped down to maxWidth 240.
    await resizer.trigger('pointermove', { clientX: 1000, pointerId: 1 });
    expect(handle.getResizingColumn()?.draftWidth).toBe(240);
  });

  it('Phase 47: handle.startResizingColumn programmatic round-trip (start → commit)', () => {
    const wrapper = mount(TableForTest, { propsData: { columns: resizableColumns(), rows } });
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
    expect(wrapper.emitted('column-resize-start') ?? []).toHaveLength(1);
    // No draft change → commit suppresses column-width-change (dedup).
    handle.commitColumnResize();
    expect(handle.getResizingColumn()).toBeNull();
    expect(wrapper.emitted('column-width-change') ?? []).toHaveLength(0);
    expect(wrapper.emitted('column-resize-stop') ?? []).toHaveLength(1);
  });

  it('Phase 47: startResizingColumn on resizable:false column is a silent no-op', () => {
    const wrapper = mount(TableForTest, { propsData: { columns: resizableColumns(), rows } });
    const handle = wrapper.vm as unknown as {
      startResizingColumn(colId: string): void;
      getResizingColumn(): unknown;
    };
    handle.startResizingColumn('status');
    expect(handle.getResizingColumn()).toBeNull();
    expect(wrapper.emitted('column-resize-start') ?? []).toHaveLength(0);
  });

  // ────────────────────────── Phase 55: column move (drag-to-reorder header) ──────────────────────────
  // Verbatim port of vue3 Phase 14 SFC wiring tests with vue2 vnode-data deltas.
  // Whole-header-cell drag handler with 5px Chebyshev threshold + emit-only
  // `column-order-change`. See `audit/TABLE_PHASE_55_56_COLUMN_MOVE_PORTS_DESIGN.md`.

  function reorderableColumns(): readonly ColumnSpec[] {
    // 5 cols. status carries reorderable:false to exercise opt-out.
    return [
      columns[0]!, // id width:80
      columns[1]!, // name flex:1
      columns[2]!, // qty width:120
      { ...columns[3]!, reorderable: false }, // status reorderable:false
      columns[4]!, // note flex:2
    ];
  }

  function stubVue2HeaderRects(
    wrapper: ReturnType<typeof mount>,
    slotWidthPx = 100,
  ): readonly { colId: string; left: number; right: number }[] {
    const wrapperEl = wrapper.find('.cx-table-wrapper').element as HTMLElement;
    Object.defineProperty(wrapperEl, 'getBoundingClientRect', {
      value: () => ({ left: 0, right: slotWidthPx * 5, top: 0, bottom: 200 }),
      configurable: true,
    });
    const stubs: { colId: string; left: number; right: number }[] = [];
    const cellEls = wrapper.findAll('.cx-table-header-cell[data-col-id]');
    for (let i = 0; i < cellEls.length; i++) {
      const domWrapper = cellEls.at(i);
      const colId = domWrapper.attributes('data-col-id') ?? '';
      const left = i * slotWidthPx;
      const right = left + slotWidthPx;
      stubs.push({ colId, left, right });
      Object.defineProperty(domWrapper.element, 'getBoundingClientRect', {
        value: () => ({ left, right, top: 0, bottom: 40 }),
        configurable: true,
      });
    }
    return stubs;
  }

  it('Phase 55: reorderable !== false columns wire pointer-move handlers; reorderable:false columns do not', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns: reorderableColumns(), rows } });
    const handle = wrapper.vm as unknown as {
      getMovingColumn(): { colId: string } | null;
    };
    const qty = wrapper.find('.cx-table-header-cell[data-col-id="qty"]');
    await qty.trigger('pointerdown', { button: 0, clientX: 100, clientY: 20, pointerId: 1 });
    await qty.trigger('pointermove', { clientX: 200, clientY: 20, pointerId: 1 });
    expect(handle.getMovingColumn()?.colId).toBe('qty');

    const wrapper2 = mount(TableForTest, { propsData: { columns: reorderableColumns(), rows } });
    const handle2 = wrapper2.vm as unknown as { getMovingColumn(): unknown };
    const status = wrapper2.find('.cx-table-header-cell[data-col-id="status"]');
    await status.trigger('pointerdown', { button: 0, clientX: 100, clientY: 20, pointerId: 1 });
    await status.trigger('pointermove', { clientX: 200, clientY: 20, pointerId: 1 });
    expect(handle2.getMovingColumn()).toBeNull();
    expect(wrapper2.emitted('column-move-start') ?? []).toHaveLength(0);
  });

  it('Phase 55: pointerdown + pointerup with < 5px movement does NOT emit column-move-start', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns: reorderableColumns(), rows } });
    const handle = wrapper.vm as unknown as { getMovingColumn(): unknown };
    const qty = wrapper.find('.cx-table-header-cell[data-col-id="qty"]');
    await qty.trigger('pointerdown', { button: 0, clientX: 100, clientY: 20, pointerId: 1 });
    await qty.trigger('pointermove', { clientX: 103, clientY: 20, pointerId: 1 });
    await qty.trigger('pointerup', { clientX: 103, clientY: 20, pointerId: 1 });
    expect(handle.getMovingColumn()).toBeNull();
    expect(wrapper.emitted('column-move-start') ?? []).toHaveLength(0);
    expect(wrapper.emitted('column-move-stop') ?? []).toHaveLength(0);
  });

  it('Phase 55: pointermove ≥ 5px promotes to active drag + fires column-move-start', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns: reorderableColumns(), rows } });
    stubVue2HeaderRects(wrapper);
    const handle = wrapper.vm as unknown as { getMovingColumn(): { colId: string } | null };
    const qty = wrapper.find('.cx-table-header-cell[data-col-id="qty"]');
    await qty.trigger('pointerdown', { button: 0, clientX: 250, clientY: 20, pointerId: 1 });
    await qty.trigger('pointermove', { clientX: 256, clientY: 20, pointerId: 1 });
    expect(handle.getMovingColumn()?.colId).toBe('qty');
    const starts = wrapper.emitted('column-move-start') as
      | [{ column: ColumnSpec; startClientX: number }][]
      | undefined;
    expect(starts).toBeTruthy();
    expect(starts!.length).toBe(1);
    const payload = starts![0]![0];
    expect(payload.column.id).toBe('qty');
    expect(payload.startClientX).toBe(250);
  });

  it('Phase 55: pointermove resolves dropTarget {targetColId, position} + sets drop-target class', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns: reorderableColumns(), rows } });
    stubVue2HeaderRects(wrapper); // ids: id 0-100, name 100-200, qty 200-300, status 300-400, note 400-500
    const handle = wrapper.vm as unknown as {
      getMovingColumn(): { dropTarget: { targetColId: string; position: string } | null } | null;
    };
    const qty = wrapper.find('.cx-table-header-cell[data-col-id="qty"]');
    await qty.trigger('pointerdown', { button: 0, clientX: 250, clientY: 20, pointerId: 1 });
    // 470 lands on 'note' (400-500) right half (midpoint 450) → 'after'.
    await qty.trigger('pointermove', { clientX: 470, clientY: 20, pointerId: 1 });
    expect(handle.getMovingColumn()?.dropTarget?.targetColId).toBe('note');
    expect(handle.getMovingColumn()?.dropTarget?.position).toBe('after');
    expect(
      wrapper
        .find('.cx-table-header-cell[data-col-id="note"]')
        .classes()
        .includes('cx-table-header-cell--drop-target-after'),
    ).toBe(true);
  });

  it('Phase 55: handle.startMovingColumn + handle.commitColumnMove emits column-order-change', () => {
    const wrapper = mount(TableForTest, { propsData: { columns: reorderableColumns(), rows } });
    const handle = wrapper.vm as unknown as {
      startMovingColumn(colId: string): void;
      commitColumnMove(targetColId: string, position: 'before' | 'after'): void;
      getMovingColumn(): unknown;
    };
    handle.startMovingColumn('id');
    expect(handle.getMovingColumn()).not.toBeNull();
    expect(wrapper.emitted('column-move-start')).toHaveLength(1);

    handle.commitColumnMove('note', 'after');
    expect(handle.getMovingColumn()).toBeNull();
    const changes = wrapper.emitted('column-order-change') as
      | [
          {
            movedColumn: ColumnSpec;
            targetColumn: ColumnSpec;
            position: 'before' | 'after';
            oldColumnIds: readonly string[];
            newColumnIds: readonly string[];
          },
        ][]
      | undefined;
    expect(changes).toBeTruthy();
    expect(changes!.length).toBe(1);
    const payload = changes![0]![0];
    expect(payload.movedColumn.id).toBe('id');
    expect(payload.targetColumn.id).toBe('note');
    expect(payload.position).toBe('after');
    expect(payload.oldColumnIds).toEqual(['id', 'name', 'qty', 'status', 'note']);
    expect(payload.newColumnIds).toEqual(['name', 'qty', 'status', 'note', 'id']);
    const stops = wrapper.emitted('column-move-stop') as [{ committed: boolean }][] | undefined;
    expect(stops).toBeTruthy();
    expect(stops!.length).toBe(1);
    expect(stops![0]![0].committed).toBe(true);
  });

  it('Phase 55: no-op commit (drop target same column) suppresses column-order-change', () => {
    const wrapper = mount(TableForTest, { propsData: { columns: reorderableColumns(), rows } });
    const handle = wrapper.vm as unknown as {
      startMovingColumn(colId: string): void;
      commitColumnMove(targetColId: string, position: 'before' | 'after'): void;
    };
    handle.startMovingColumn('qty');
    handle.commitColumnMove('qty', 'before');
    expect(wrapper.emitted('column-order-change') ?? []).toHaveLength(0);
    const stops = wrapper.emitted('column-move-stop') as [{ committed: boolean }][] | undefined;
    expect(stops).toBeTruthy();
    expect(stops!.length).toBe(1);
    expect(stops![0]![0].committed).toBe(true);
  });

  it('Phase 55: handle.cancelColumnMove fires column-move-stop {committed:false} — no column-order-change', () => {
    const wrapper = mount(TableForTest, { propsData: { columns: reorderableColumns(), rows } });
    const handle = wrapper.vm as unknown as {
      startMovingColumn(colId: string): void;
      cancelColumnMove(): void;
      getMovingColumn(): unknown;
    };
    handle.startMovingColumn('name');
    handle.cancelColumnMove();
    expect(handle.getMovingColumn()).toBeNull();
    expect(wrapper.emitted('column-order-change') ?? []).toHaveLength(0);
    const stops = wrapper.emitted('column-move-stop') as [{ committed: boolean }][] | undefined;
    expect(stops).toBeTruthy();
    expect(stops!.length).toBe(1);
    expect(stops![0]![0].committed).toBe(false);
  });

  it('Phase 55: pointercancel during active drag cancels — no column-order-change emit', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns: reorderableColumns(), rows } });
    stubVue2HeaderRects(wrapper);
    const handle = wrapper.vm as unknown as { getMovingColumn(): unknown };
    const qty = wrapper.find('.cx-table-header-cell[data-col-id="qty"]');
    await qty.trigger('pointerdown', { button: 0, clientX: 250, clientY: 20, pointerId: 1 });
    await qty.trigger('pointermove', { clientX: 260, clientY: 20, pointerId: 1 });
    await qty.trigger('pointercancel', { pointerId: 1 });
    expect(handle.getMovingColumn()).toBeNull();
    expect(wrapper.emitted('column-order-change') ?? []).toHaveLength(0);
    const stops = wrapper.emitted('column-move-stop') as [{ committed: boolean }][] | undefined;
    expect(stops).toBeTruthy();
    expect(stops!.length).toBe(1);
    expect(stops![0]![0].committed).toBe(false);
  });

  it('Phase 55: startMovingColumn on reorderable:false column is silent no-op', () => {
    const wrapper = mount(TableForTest, { propsData: { columns: reorderableColumns(), rows } });
    const handle = wrapper.vm as unknown as {
      startMovingColumn(colId: string): void;
      getMovingColumn(): unknown;
    };
    handle.startMovingColumn('status');
    expect(handle.getMovingColumn()).toBeNull();
    expect(wrapper.emitted('column-move-start') ?? []).toHaveLength(0);
  });

  it('Phase 55: drop-line overlay renders at the wrapper level when dropTarget resolves', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns: reorderableColumns(), rows } });
    stubVue2HeaderRects(wrapper);
    const qty = wrapper.find('.cx-table-header-cell[data-col-id="qty"]');
    await qty.trigger('pointerdown', { button: 0, clientX: 250, clientY: 20, pointerId: 1 });
    // 130 lands on 'name' (100-200) left half (midpoint 150) → 'before'.
    await qty.trigger('pointermove', { clientX: 130, clientY: 20, pointerId: 1 });
    const dropLine = wrapper.find('.cx-table-drop-line');
    expect(dropLine.exists()).toBe(true);
    expect(dropLine.attributes('data-drop-target-col-id')).toBe('name');
    expect(dropLine.attributes('data-drop-target-position')).toBe('before');
    // dropLineLeftPx = name.left (100) - wrapperLeft (0) - 1 = 99
    expect(dropLine.attributes('style')).toContain('left: 99px');
  });

  // ────────────────────────── Phase 57: column autosize (dbl-click resizer + imperative API) ──────────────────────────
  // Verbatim port of vue3 Phase 15 tests with vue2 idiom subs:
  //  - `mount(TableForTest, { propsData })` (vue-test-utils@1)
  //  - `wrapper.emitted()` returns `unknown[][]` → pre-cast pattern (BC.2)
  //  - `wrapper.vm as unknown as { autosizeColumn(...) }` for handle access
  // Reuses Phase 47's resizer DOM as the dbl-click affordance + Phase 47's
  // `column-width-change` emit as the persistence channel (Decision A.1 inherits
  // from vue3 Phase 15 — no new emit). In happy-dom (no Canvas 2D context),
  // `measureCellTextWidth` returns 0, so every measurement falls back to the
  // minWidth clamp.

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

  it('Phase 57: resizable:true columns carry the resizer DOM that hosts the autosize dblclick handler', () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns: autosizeableColumns(), rows },
    });
    // 4 columns have resizable !== false (id / name / qty / note).
    expect(wrapper.findAll('.cx-table-header-resizer')).toHaveLength(4);
    expect(wrapper.find('[data-resizer-col-id="qty"]').exists()).toBe(true);
    expect(wrapper.find('[data-resizer-col-id="note"]').exists()).toBe(true);
    // status (resizable:false) has no resizer DOM at all.
    expect(wrapper.find('[data-resizer-col-id="status"]').exists()).toBe(false);
  });

  it('Phase 57: dbl-click on the resizer fires column-width-change (happy-dom degenerate → minWidth)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns: autosizeableColumns(), rows },
    });
    const qtyResizer = wrapper.find('[data-resizer-col-id="qty"]');
    await qtyResizer.trigger('dblclick');
    const changes = wrapper.emitted('column-width-change') as
      | [{ column: ColumnSpec; oldWidth: number; newWidth: number }][]
      | undefined;
    expect(changes).toBeTruthy();
    expect(changes!.length).toBe(1);
    const payload = changes![0]![0];
    expect(payload.column.id).toBe('qty');
    // baseWidth 120 → newWidth = qty.minWidth=60 (happy-dom Canvas null → 0 measurement → clamped to minWidth).
    expect(payload.oldWidth).toBe(120);
    expect(payload.newWidth).toBe(60);
  });

  it('Phase 57: dbl-click on an autosizeable:false column resizer is a silent no-op', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns: autosizeableColumns(), rows },
    });
    // note has autosizeable:false; resizer DOM exists but dblclick should not emit.
    const noteResizer = wrapper.find('[data-resizer-col-id="note"]');
    expect(noteResizer.exists()).toBe(true);
    await noteResizer.trigger('dblclick');
    expect(wrapper.emitted('column-width-change') ?? []).toHaveLength(0);
  });

  it('Phase 57: handle.autosizeColumn fires column-width-change for the target column', () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns: autosizeableColumns(), rows },
    });
    const handle = wrapper.vm as unknown as { autosizeColumn(colId: string): void };
    handle.autosizeColumn('qty');
    const changes = wrapper.emitted('column-width-change') as
      | [{ column: ColumnSpec; oldWidth: number; newWidth: number }][]
      | undefined;
    expect(changes).toBeTruthy();
    expect(changes!.length).toBe(1);
    const payload = changes![0]![0];
    expect(payload.column.id).toBe('qty');
    expect(payload.newWidth).toBe(60); // qty.minWidth
  });

  it('Phase 57: handle.autosizeColumn on resizable:false column is silent no-op (cannot mutate width)', () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns: autosizeableColumns(), rows },
    });
    const handle = wrapper.vm as unknown as { autosizeColumn(colId: string): void };
    handle.autosizeColumn('status');
    expect(wrapper.emitted('column-width-change') ?? []).toHaveLength(0);
  });

  it('Phase 57: handle.autosizeColumn on autosizeable:false column is silent no-op', () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns: autosizeableColumns(), rows },
    });
    const handle = wrapper.vm as unknown as { autosizeColumn(colId: string): void };
    handle.autosizeColumn('note');
    expect(wrapper.emitted('column-width-change') ?? []).toHaveLength(0);
  });

  it('Phase 57: handle.autosizeAllColumns fires column-width-change once per autosizeable+resizable column', () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns: autosizeableColumns(), rows },
    });
    const handle = wrapper.vm as unknown as { autosizeAllColumns(): void };
    handle.autosizeAllColumns();
    const changes = wrapper.emitted('column-width-change') as
      | [{ column: ColumnSpec; oldWidth: number; newWidth: number }][]
      | undefined;
    expect(changes).toBeTruthy();
    // Expected emits: id (80→40), qty (120→60). SKIPPED: status (resizable:false)
    // + note (autosizeable:false). name (flex) may dedup if happy-dom flex resolves to minWidth.
    // Assert id + qty fire, status + note don't.
    const colIds = changes!.map((c) => c[0].column.id);
    expect(colIds).toContain('qty');
    expect(colIds).toContain('id');
    expect(colIds).not.toContain('status');
    expect(colIds).not.toContain('note');
  });

  it('Phase 57: handle.autosizeColumn on unknown id is silent no-op', () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns: autosizeableColumns(), rows },
    });
    const handle = wrapper.vm as unknown as { autosizeColumn(colId: string): void };
    handle.autosizeColumn('does-not-exist');
    expect(wrapper.emitted('column-width-change') ?? []).toHaveLength(0);
  });

  // ────────────────────────── Phase 59: cell range selection (drag-extend + shift+click extend) ──────────────────────────
  // Verbatim port of vue3 Phase 16 tests with vue2 idiom subs:
  //  - `mount(TableForTest, { propsData })` (vue-test-utils@1)
  //  - `wrapper.emitted()` returns `unknown[][]` → BC.2 pre-cast pattern
  //  - `wrapper.vm as unknown as CellRangeHandle` for handle access
  // Drag-extend (pointermove via document.elementFromPoint) is covered in
  // browser-verify only (happy-dom always returns null from elementFromPoint).

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

  it('Phase 59: default cellRangeSelection is "none" — pointerdown on a body cell does NOT emit cell-range-start', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="id"]');
    expect(cell.exists()).toBe(true);
    await cell.trigger('pointerdown', { clientX: 10, clientY: 10, pointerId: 1, button: 0 });
    expect(wrapper.emitted('cell-range-start') ?? []).toHaveLength(0);
  });

  it('Phase 59: cellRangeSelection="enabled" + pointerdown on a body cell → cell-range-start + in-cell-range modifier', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, cellRangeSelection: 'enabled' },
    });
    const r2c2 = wrapper.find('.cx-table-cell[data-row-id="r2"][data-col-id="name"]');
    expect(r2c2.exists()).toBe(true);
    await r2c2.trigger('pointerdown', { clientX: 20, clientY: 30, pointerId: 1, button: 0 });
    const starts = wrapper.emitted('cell-range-start') as
      | [
          {
            range: {
              anchor: { rowId: string; colId: string };
              focus: { rowId: string; colId: string };
            };
          },
        ][]
      | undefined;
    expect(starts).toBeTruthy();
    expect(starts!.length).toBe(1);
    expect(starts![0]![0].range.anchor).toEqual({ rowId: 'r2', colId: 'name' });
    expect(starts![0]![0].range.focus).toEqual({ rowId: 'r2', colId: 'name' });
    expect(r2c2.classes()).toContain('cx-table-cell--in-cell-range');
  });

  it('Phase 59: handle.setCellRange opens range programmatically with non-trivial focus → emits start + change', () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, cellRangeSelection: 'enabled' },
    });
    const handle = wrapper.vm as unknown as CellRangeHandle;
    handle.setCellRange({
      anchor: { rowId: 'r1', colId: 'id' },
      focus: { rowId: 'r3', colId: 'qty' },
    });
    const starts = wrapper.emitted('cell-range-start');
    const changes = wrapper.emitted('cell-range-change') as
      | [{ envelope: { rowIds: readonly string[]; colIds: readonly string[] } }][]
      | undefined;
    expect(starts).toBeTruthy();
    expect(starts!.length).toBe(1);
    expect(changes).toBeTruthy();
    expect(changes!.length).toBe(1);
    expect(changes![0]![0].envelope.rowIds).toEqual(['r1', 'r2', 'r3']);
    expect(changes![0]![0].envelope.colIds).toEqual(['id', 'name', 'qty']);
  });

  it('Phase 59: handle.setCellRange with focus === anchor → only start emit (no change)', () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, cellRangeSelection: 'enabled' },
    });
    const handle = wrapper.vm as unknown as CellRangeHandle;
    handle.setCellRange({
      anchor: { rowId: 'r1', colId: 'id' },
      focus: { rowId: 'r1', colId: 'id' },
    });
    expect(wrapper.emitted('cell-range-start')!.length).toBe(1);
    expect(wrapper.emitted('cell-range-change') ?? []).toHaveLength(0);
  });

  it('Phase 59: handle.getCellRange returns the current state', () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, cellRangeSelection: 'enabled' },
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

  it('Phase 59: handle.clearCellRange wipes state + emits cell-range-stop', () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, cellRangeSelection: 'enabled' },
    });
    const handle = wrapper.vm as unknown as CellRangeHandle;
    handle.setCellRange({
      anchor: { rowId: 'r1', colId: 'id' },
      focus: { rowId: 'r1', colId: 'id' },
    });
    handle.clearCellRange();
    expect(handle.getCellRange()).toBeNull();
    expect(wrapper.emitted('cell-range-stop')!.length).toBe(1);
  });

  it('Phase 59: setCellRange(null) is equivalent to clearCellRange', () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, cellRangeSelection: 'enabled' },
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

  it('Phase 59: handle methods are silent no-ops when cellRangeSelection === "none"', () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
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

  it('Phase 59: cellRangeSelection="enabled" + pointerdown then pointerup → cell-range-stop emit', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, cellRangeSelection: 'enabled' },
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="id"]');
    await cell.trigger('pointerdown', { clientX: 10, clientY: 10, pointerId: 1, button: 0 });
    await cell.trigger('pointerup', { clientX: 10, clientY: 10, pointerId: 1 });
    expect(wrapper.emitted('cell-range-stop')!.length).toBe(1);
  });

  it('Phase 59: pointerdown with non-primary button (right-click) does NOT open a session', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, cellRangeSelection: 'enabled' },
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="id"]');
    await cell.trigger('pointerdown', { clientX: 10, clientY: 10, pointerId: 1, button: 2 });
    expect(wrapper.emitted('cell-range-start') ?? []).toHaveLength(0);
  });

  // ────────────────────────── Phase 61: pinned columns left / right (port of vue3 Phase 17) ──────────────────────────
  //
  // Phase 61 ships per-cell `position: sticky` for columns with
  // `ColumnSpec.pinned === 'left' | 'right'`, verbatim port of vue3
  // Phase 17. chronix-NEW `pinnedColsPass` partitions visible columns
  // into zones and computes cumulative sticky offsets; the SFC spreads
  // the resulting style + modifier classes into the existing flat row
  // layout. Click + pointer delegation is unchanged.

  it('Phase 61: no pinned columns → no sticky inline styles or pinned-* modifier classes on any cell', () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
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

  it('Phase 61: pinned: "left" → header + body cells get position:sticky, left:0px, and --pinned-left class', () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', width: 80, pinned: 'left' },
      { id: 'name', field: 'name', flex: 1 },
      { id: 'qty', field: 'qty', width: 100 },
    ];
    const wrapper = mount(TableForTest, { propsData: { columns: pinnedCols, rows } });
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

  it('Phase 61: two left-pinned columns → second gets cumulative left offset = first.width', () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', width: 80, pinned: 'left' },
      { id: 'name', field: 'name', width: 120, pinned: 'left' },
      { id: 'qty', field: 'qty', width: 100 },
    ];
    const wrapper = mount(TableForTest, { propsData: { columns: pinnedCols, rows } });
    const firstHeader = wrapper.find('.cx-table-header-cell[data-col-id="id"]');
    const secondHeader = wrapper.find('.cx-table-header-cell[data-col-id="name"]');
    expect(firstHeader.attributes('style')).toContain('left: 0px');
    expect(secondHeader.attributes('style')).toContain('left: 80px');
    expect(firstHeader.classes()).not.toContain('cx-table-header-cell--pinned-left-last');
    expect(secondHeader.classes()).toContain('cx-table-header-cell--pinned-left-last');
  });

  it('Phase 61: pinned: "right" → cell gets position:sticky, right:0px, and --pinned-right class', () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', width: 80 },
      { id: 'name', field: 'name', flex: 1 },
      { id: 'note', field: 'note', width: 100, pinned: 'right' },
    ];
    const wrapper = mount(TableForTest, { propsData: { columns: pinnedCols, rows } });
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

  it('Phase 61: two right-pinned columns → leftmost gets cumulative right offset = rightmost.width', () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'name', field: 'name', flex: 1 },
      { id: 'status', field: 'status', width: 90, pinned: 'right' },
      { id: 'note', field: 'note', width: 100, pinned: 'right' },
    ];
    const wrapper = mount(TableForTest, { propsData: { columns: pinnedCols, rows } });
    const leftmost = wrapper.find('.cx-table-header-cell[data-col-id="status"]');
    const rightmost = wrapper.find('.cx-table-header-cell[data-col-id="note"]');
    expect(rightmost.attributes('style')).toContain('right: 0px');
    expect(leftmost.attributes('style')).toContain('right: 100px');
    expect(leftmost.classes()).toContain('cx-table-header-cell--pinned-right-first');
    expect(rightmost.classes()).not.toContain('cx-table-header-cell--pinned-right-first');
  });

  it('Phase 61: pinned filter-row cells also get sticky positioning + zone modifier classes', () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', width: 80, pinned: 'left' },
      { id: 'name', field: 'name', flex: 1 },
      { id: 'note', field: 'note', width: 100, pinned: 'right' },
    ];
    const wrapper = mount(TableForTest, {
      propsData: { columns: pinnedCols, rows, showFilterRow: true },
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

  it('Phase 61: cell-click delegation still fires on a pinned body cell (Phase 41.4 wiring unchanged)', async () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', width: 80, pinned: 'left' },
      { id: 'name', field: 'name', flex: 1 },
    ];
    const wrapper = mount(TableForTest, { propsData: { columns: pinnedCols, rows } });
    const pinnedCell = wrapper.find('.cx-table-cell[data-col-id="id"][data-row-id="r1"]');
    await pinnedCell.trigger('click');
    const clicks = wrapper.emitted('cell-click');
    expect(clicks).toBeTruthy();
    expect(clicks!.length).toBe(1);
  });

  it('Phase 61: header-click delegation still fires on a pinned header cell (Phase 41.6 wiring unchanged)', async () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', width: 80, pinned: 'left' },
      { id: 'name', field: 'name', flex: 1 },
    ];
    const wrapper = mount(TableForTest, { propsData: { columns: pinnedCols, rows } });
    const header = wrapper.find('.cx-table-header-cell[data-col-id="id"]');
    await header.trigger('click');
    const headerClicks = wrapper.emitted('header-click');
    expect(headerClicks).toBeTruthy();
    expect(headerClicks!.length).toBe(1);
  });

  it('Phase 61: cell-range envelope spans across pinned + center zones (Phase 59 envelope unaffected)', async () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', width: 80, pinned: 'left' },
      { id: 'name', field: 'name', width: 100 },
      { id: 'note', field: 'note', width: 100, pinned: 'right' },
    ];
    const wrapper = mount(TableForTest, {
      propsData: { columns: pinnedCols, rows, cellRangeSelection: 'enabled' },
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

  it('Phase 61: when selectionColumn.side === "left", left-pinned cells shift right by selectionColumnWidth', () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', width: 80, pinned: 'left' },
      { id: 'name', field: 'name', flex: 1 },
    ];
    const wrapper = mount(TableForTest, {
      propsData: {
        columns: pinnedCols,
        rows,
        selectionMode: 'single',
        selectionColumn: { show: true, side: 'left' },
      },
    });
    const pinnedHeader = wrapper.find('.cx-table-header-cell[data-col-id="id"]');
    expect(pinnedHeader.attributes('style')).toContain('left: 36px');
  });

  it('Phase 61: row-selection modifier paints uniformly across pinned + center cells', async () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', width: 80, pinned: 'left' },
      { id: 'name', field: 'name', flex: 1 },
      { id: 'note', field: 'note', width: 100, pinned: 'right' },
    ];
    const wrapper = mount(TableForTest, {
      propsData: { columns: pinnedCols, rows, selectionMode: 'single' },
    });
    const handle = wrapper.vm as unknown as {
      setSelectedRowIds(ids: readonly string[]): void;
    };
    handle.setSelectedRowIds(['r1']);
    await wrapper.vm.$nextTick();
    const row = wrapper.find('.cx-table-body .cx-table-row[data-row-id="r1"]');
    expect(row.classes()).toContain('cx-table-row--selected');
    expect(row.findAll('.cx-table-cell')).toHaveLength(3);
  });

  // ────────────────────────── Phase 18: pinned cross-zone reorder guard (vue2 port) ──────────────────────────

  it('Phase 18 (vue2): dragging a left-pinned column over a CENTER column resolves dropTarget=null (cross-zone reject)', async () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', width: 80, pinned: 'left' },
      { id: 'name', field: 'name', width: 100, pinned: 'left' },
      { id: 'qty', field: 'qty', width: 100 },
      { id: 'note', field: 'note', width: 100, pinned: 'right' },
    ];
    const wrapper = mount(TableForTest, { propsData: { columns: pinnedCols, rows } });
    stubVue2HeaderRects(wrapper);
    const handle = wrapper.vm as unknown as {
      getMovingColumn(): { dropTarget: { targetColId: string; position: string } | null } | null;
    };
    const idHeader = wrapper.find('.cx-table-header-cell[data-col-id="id"]');
    await idHeader.trigger('pointerdown', { button: 0, clientX: 50, clientY: 20, pointerId: 1 });
    await idHeader.trigger('pointermove', { clientX: 250, clientY: 20, pointerId: 1 });
    expect(handle.getMovingColumn()?.dropTarget).toBeNull();
  });

  it('Phase 18 (vue2): dragging a left-pinned column over ANOTHER left-pinned column resolves dropTarget normally (same-zone allowed)', async () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', width: 80, pinned: 'left' },
      { id: 'name', field: 'name', width: 100, pinned: 'left' },
      { id: 'qty', field: 'qty', width: 100 },
    ];
    const wrapper = mount(TableForTest, { propsData: { columns: pinnedCols, rows } });
    stubVue2HeaderRects(wrapper);
    const handle = wrapper.vm as unknown as {
      getMovingColumn(): { dropTarget: { targetColId: string; position: string } | null } | null;
    };
    const idHeader = wrapper.find('.cx-table-header-cell[data-col-id="id"]');
    await idHeader.trigger('pointerdown', { button: 0, clientX: 50, clientY: 20, pointerId: 1 });
    await idHeader.trigger('pointermove', { clientX: 170, clientY: 20, pointerId: 1 });
    const target = handle.getMovingColumn()?.dropTarget;
    expect(target).not.toBeNull();
    expect(target?.targetColId).toBe('name');
    expect(target?.position).toBe('after');
  });

  // ────────────────────────── Phase 63: clipboard copy (Ctrl+C on active cell-range) ──────────────────────────
  //
  // Phase 63 (vue2 port of vue3 Phase 19) wires a Ctrl+C / Cmd+C keydown
  // handler on the body element + a `copyCellRangeToClipboard()`
  // TableHandle method. Both flow through the same `performCellRangeCopy`
  // path: synth TSV via the pure helper, fail-soft write to
  // `navigator.clipboard`, emit `cell-range-copy`.

  interface CopyCellRangeHandleVue2 {
    setCellRange(
      range: {
        anchor: { rowId: string; colId: string };
        focus: { rowId: string; colId: string };
      } | null,
    ): void;
    clearCellRange(): void;
    copyCellRangeToClipboard(): Promise<string | null>;
  }

  describe('Phase 63: clipboard copy', () => {
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
        const nav = navigator as unknown as Record<string, unknown>;
        Reflect.deleteProperty(nav, 'clipboard');
      }
    });

    it('Phase 63: default cellRangeSelection: "none" → Ctrl+C is no-op (no emit, no writeText)', async () => {
      const wrapper = mount(TableForTest, { propsData: { columns, rows } });
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'c', ctrlKey: true });
      expect(wrapper.emitted('cell-range-copy') ?? []).toHaveLength(0);
      expect(writeTextMock).not.toHaveBeenCalled();
    });

    it('Phase 63: cellRangeSelection: "enabled" + no active range → Ctrl+C is no-op', async () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns, rows, cellRangeSelection: 'enabled' },
      });
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'c', ctrlKey: true });
      expect(wrapper.emitted('cell-range-copy') ?? []).toHaveLength(0);
      expect(writeTextMock).not.toHaveBeenCalled();
    });

    it('Phase 63: cellRangeSelection: "enabled" + active range + Ctrl+C → emit fires + writeText called once', async () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns, rows, cellRangeSelection: 'enabled' },
      });
      const handle = wrapper.vm as unknown as CopyCellRangeHandleVue2;
      handle.setCellRange({
        anchor: { rowId: 'r1', colId: 'name' },
        focus: { rowId: 'r2', colId: 'qty' },
      });
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'c', ctrlKey: true });
      await Promise.resolve();
      const copies = wrapper.emitted('cell-range-copy') as
        | [
            {
              envelope: { rowIds: readonly string[]; colIds: readonly string[] };
              text: string;
            },
          ][]
        | undefined;
      expect(copies).toBeTruthy();
      expect(copies!.length).toBe(1);
      const payload = copies![0]![0];
      expect(payload.envelope.rowIds).toEqual(['r1', 'r2']);
      expect(payload.envelope.colIds).toEqual(['name', 'qty']);
      expect(payload.text).toBe('Alpha\t10\nBeta\t20');
      expect(writeTextMock).toHaveBeenCalledTimes(1);
      expect(writeTextMock).toHaveBeenCalledWith('Alpha\t10\nBeta\t20');
    });

    it('Phase 63: programmatic handle.copyCellRangeToClipboard() with active range → resolves to TSV + emit + writeText', async () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns, rows, cellRangeSelection: 'enabled' },
      });
      const handle = wrapper.vm as unknown as CopyCellRangeHandleVue2;
      handle.setCellRange({
        anchor: { rowId: 'r2', colId: 'name' },
        focus: { rowId: 'r3', colId: 'qty' },
      });
      const result = await handle.copyCellRangeToClipboard();
      expect(result).toBe('Beta\t20\nGamma\t30');
      expect(writeTextMock).toHaveBeenCalledTimes(1);
      expect(writeTextMock).toHaveBeenCalledWith('Beta\t20\nGamma\t30');
      const copies = wrapper.emitted('cell-range-copy') as
        | [{ jsEvent: KeyboardEvent | null }][]
        | undefined;
      expect(copies).toBeTruthy();
      expect(copies!.length).toBe(1);
      const payload = copies![0]![0];
      expect(payload.jsEvent).toBeNull();
    });

    it('Phase 63: programmatic handle.copyCellRangeToClipboard() with no active range → resolves to null + no emit + no writeText', async () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns, rows, cellRangeSelection: 'enabled' },
      });
      const handle = wrapper.vm as unknown as CopyCellRangeHandleVue2;
      const result = await handle.copyCellRangeToClipboard();
      expect(result).toBeNull();
      expect(writeTextMock).not.toHaveBeenCalled();
      expect(wrapper.emitted('cell-range-copy') ?? []).toHaveLength(0);
    });

    it('Phase 63: valueFormatter applied → formatted strings appear in the copied TSV', async () => {
      const formattedCols: readonly ColumnSpec[] = [
        { id: 'name', field: 'name', flex: 1 },
        {
          id: 'qty',
          field: 'qty',
          width: 100,
          valueFormatter: ({ value }) => {
            if (typeof value === 'number') return `${value} 件`;
            return '? 件';
          },
        },
      ];
      const wrapper = mount(TableForTest, {
        propsData: { columns: formattedCols, rows, cellRangeSelection: 'enabled' },
      });
      const handle = wrapper.vm as unknown as CopyCellRangeHandleVue2;
      handle.setCellRange({
        anchor: { rowId: 'r1', colId: 'qty' },
        focus: { rowId: 'r2', colId: 'qty' },
      });
      const result = await handle.copyCellRangeToClipboard();
      expect(result).toBe('10 件\n20 件');
      expect(writeTextMock).toHaveBeenCalledWith('10 件\n20 件');
    });
  });

  // ────────────────────────── Phase 65: clipboard paste (Ctrl+V into active cell-range) ──────────────────────────
  //
  // Phase 65 (vue2 port of vue3 Phase 20) extends Phase 63's onBodyKeydown
  // with a Ctrl+V / Cmd+V branch + adds `pasteCellRangeFromClipboard()`
  // TableHandle method. Both flow through `performCellRangePaste` which
  // reads navigator.clipboard, parses TSV, computes mutations, emits
  // `cell-range-paste`.

  interface PasteCellRangeHandleVue2 {
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

  describe('Phase 65: clipboard paste', () => {
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

    it('Phase 65: default cellRangeSelection: "none" → Ctrl+V is no-op (no emit, no readText)', async () => {
      const wrapper = mount(TableForTest, { propsData: { columns, rows } });
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'v', ctrlKey: true });
      expect(wrapper.emitted('cell-range-paste') ?? []).toHaveLength(0);
      expect(readTextMock).not.toHaveBeenCalled();
    });

    it('Phase 65: cellRangeSelection: "enabled" + no active range → Ctrl+V is no-op', async () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns, rows, cellRangeSelection: 'enabled' },
      });
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'v', ctrlKey: true });
      expect(wrapper.emitted('cell-range-paste') ?? []).toHaveLength(0);
      expect(readTextMock).not.toHaveBeenCalled();
    });

    it('Phase 65: cellRangeSelection: "enabled" + active range + Ctrl+V → emit fires + readText called once', async () => {
      readTextMock.mockResolvedValue('X\tY\nZ\tW');
      const wrapper = mount(TableForTest, {
        propsData: { columns, rows, cellRangeSelection: 'enabled' },
      });
      const handle = wrapper.vm as unknown as PasteCellRangeHandleVue2;
      handle.setCellRange({
        anchor: { rowId: 'r1', colId: 'name' },
        focus: { rowId: 'r2', colId: 'note' },
      });
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'v', ctrlKey: true });
      await Promise.resolve();
      await Promise.resolve();
      const pastes = wrapper.emitted('cell-range-paste') as
        | [
            {
              envelope: { rowIds: readonly string[]; colIds: readonly string[] };
              mutations: readonly { rowId: string; colId: string; newValue: unknown }[];
              text: string;
            },
          ][]
        | undefined;
      expect(pastes).toBeTruthy();
      expect(pastes!.length).toBe(1);
      expect(readTextMock).toHaveBeenCalledTimes(1);
      const payload = pastes![0]![0];
      expect(payload.text).toBe('X\tY\nZ\tW');
      expect(payload.mutations.length).toBeGreaterThan(0);
    });

    it('Phase 65: programmatic handle.pasteCellRangeFromClipboard() with active range → resolves to mutations + emit', async () => {
      readTextMock.mockResolvedValue('Zara');
      const wrapper = mount(TableForTest, {
        propsData: { columns, rows, cellRangeSelection: 'enabled' },
      });
      const handle = wrapper.vm as unknown as PasteCellRangeHandleVue2;
      handle.setCellRange({
        anchor: { rowId: 'r1', colId: 'name' },
        focus: { rowId: 'r1', colId: 'name' },
      });
      const result = await handle.pasteCellRangeFromClipboard();
      expect(result).toEqual([{ rowId: 'r1', colId: 'name', oldValue: 'Alpha', newValue: 'Zara' }]);
      expect(readTextMock).toHaveBeenCalledTimes(1);
      const pastes = wrapper.emitted('cell-range-paste') as
        | [{ jsEvent: KeyboardEvent | null }][]
        | undefined;
      expect(pastes).toBeTruthy();
      expect(pastes!.length).toBe(1);
      expect(pastes![0]![0].jsEvent).toBeNull();
    });

    it('Phase 65: programmatic handle.pasteCellRangeFromClipboard() with no active range → null + no emit + no readText', async () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns, rows, cellRangeSelection: 'enabled' },
      });
      const handle = wrapper.vm as unknown as PasteCellRangeHandleVue2;
      const result = await handle.pasteCellRangeFromClipboard();
      expect(result).toBeNull();
      expect(readTextMock).not.toHaveBeenCalled();
      expect(wrapper.emitted('cell-range-paste') ?? []).toHaveLength(0);
    });

    it('Phase 65: column.type: "number" — mixed valid/invalid paste skips invalid cells', async () => {
      readTextMock.mockResolvedValue('99\tabc');
      const numericCols: readonly ColumnSpec[] = [
        { id: 'qty', field: 'qty', type: 'number', width: 80 },
        { id: 'qty2', field: 'note', type: 'number', width: 80 },
      ];
      const wrapper = mount(TableForTest, {
        propsData: { columns: numericCols, rows, cellRangeSelection: 'enabled' },
      });
      const handle = wrapper.vm as unknown as PasteCellRangeHandleVue2;
      handle.setCellRange({
        anchor: { rowId: 'r1', colId: 'qty' },
        focus: { rowId: 'r1', colId: 'qty2' },
      });
      const result = await handle.pasteCellRangeFromClipboard();
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
  // Phase 67 — drag-fill autofill handle (vue2 port of vue3 Phase 21)
  // ---------------------------------------------------------------------
  // Per `audit/TABLE_PHASE_67_68_DRAG_FILL_PORTS_DESIGN.md`. Wiring
  // guards verify the SFC surfaces the handle DOM + `fillCellRange`
  // TableHandle method + 3-emit triplet. Decisions A.1 / B.1 / C.1
  // inherit verbatim from vue3 Phase 21.

  interface FillCellRangeHandleVue2 {
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

  describe('Phase 67: drag-fill handle', () => {
    it('Phase 67: default cellRangeSelection: "none" → no .cx-table-drag-fill-handle rendered', () => {
      const wrapper = mount(TableForTest, { propsData: { columns, rows } });
      expect(wrapper.find('.cx-table-drag-fill-handle').exists()).toBe(false);
    });

    it('Phase 67: cellRangeSelection: "enabled" + no active range → no handle rendered', () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns, rows, cellRangeSelection: 'enabled' },
      });
      expect(wrapper.find('.cx-table-drag-fill-handle').exists()).toBe(false);
    });

    it('Phase 67: cellRangeSelection: "enabled" + active range → handle visible with 8×8 inline style', async () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns, rows, cellRangeSelection: 'enabled' },
      });
      const handle = wrapper.vm as unknown as FillCellRangeHandleVue2;
      handle.setCellRange({
        anchor: { rowId: 'r1', colId: 'name' },
        focus: { rowId: 'r1', colId: 'name' },
      });
      await wrapper.vm.$nextTick();
      const handleEl = wrapper.find('.cx-table-drag-fill-handle');
      expect(handleEl.exists()).toBe(true);
      const style = handleEl.attributes('style') ?? '';
      expect(style).toContain('width: 8px');
      expect(style).toContain('height: 8px');
    });

    it('Phase 67: programmatic handle.fillCellRange(targetCell) with 1-col source → returns mutations + emits cell-range-fill', () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns, rows, cellRangeSelection: 'enabled' },
      });
      const vmHandle = wrapper.vm as unknown as FillCellRangeHandleVue2;
      vmHandle.setCellRange({
        anchor: { rowId: 'r1', colId: 'name' },
        focus: { rowId: 'r1', colId: 'name' },
      });
      const result = vmHandle.fillCellRange({ rowId: 'r3', colId: 'name' });
      expect(result).toEqual([
        { rowId: 'r2', colId: 'name', oldValue: 'Beta', newValue: 'Alpha' },
        { rowId: 'r3', colId: 'name', oldValue: 'Gamma', newValue: 'Alpha' },
      ]);
      const fills = wrapper.emitted('cell-range-fill') as
        | [
            {
              source: { rowIds: readonly string[]; colIds: readonly string[] };
              fill: { rowIds: readonly string[]; colIds: readonly string[] };
              mutations: readonly { rowId: string; colId: string }[];
              jsEvent: PointerEvent | null;
            },
          ][]
        | undefined;
      expect(fills).toBeTruthy();
      expect(fills!.length).toBe(1);
      const payload = fills![0]![0];
      expect(payload.source.rowIds).toEqual(['r1']);
      expect(payload.fill.rowIds).toEqual(['r1', 'r2', 'r3']);
      expect(payload.mutations).toHaveLength(2);
      expect(payload.jsEvent).toBeNull();
    });

    it('Phase 67: handle.fillCellRange(targetCell) with no active range → null + no emit', () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns, rows, cellRangeSelection: 'enabled' },
      });
      const vmHandle = wrapper.vm as unknown as FillCellRangeHandleVue2;
      const result = vmHandle.fillCellRange({ rowId: 'r3', colId: 'name' });
      expect(result).toBeNull();
      expect(wrapper.emitted('cell-range-fill') ?? []).toHaveLength(0);
    });

    it('Phase 67: handle.fillCellRange(targetCell) inside source → returns null (no-fill preview)', () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns, rows, cellRangeSelection: 'enabled' },
      });
      const vmHandle = wrapper.vm as unknown as FillCellRangeHandleVue2;
      vmHandle.setCellRange({
        anchor: { rowId: 'r1', colId: 'name' },
        focus: { rowId: 'r2', colId: 'name' },
      });
      const result = vmHandle.fillCellRange({ rowId: 'r1', colId: 'name' });
      expect(result).toBeNull();
      expect(wrapper.emitted('cell-range-fill') ?? []).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------
  // Phase 69 — undo / redo mutation history (vue2 port of vue3 Phase 22)
  // ---------------------------------------------------------------------

  interface UndoRedoHandleVue2 {
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

  const editableCols: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: '名称', flex: 1, editable: true },
    { id: 'qty', field: 'qty', headerName: '数量', width: 120, editable: true },
  ];

  const editableRows: readonly RowSpec[] = [
    { id: 'r1', data: { name: 'Alpha', qty: 10 } },
    { id: 'r2', data: { name: 'Beta', qty: 20 } },
  ];

  describe('Phase 69: undo / redo mutation history', () => {
    it('Phase 69: default enableUndoHistory: false → no record + canUndo stays false', () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns: editableCols, rows: editableRows },
      });
      const handle = wrapper.vm as unknown as UndoRedoHandleVue2;
      handle.startEditingCell('r1', 'name');
      handle.setEditingCellDraft('Zara');
      handle.commitEditingCell();
      expect(handle.canUndo()).toBe(false);
      expect(wrapper.emitted('history-change') ?? []).toHaveLength(0);
    });

    it('Phase 69: enableUndoHistory: true + cell-edit → batch recorded; canUndo true', () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns: editableCols, rows: editableRows, enableUndoHistory: true },
      });
      const handle = wrapper.vm as unknown as UndoRedoHandleVue2;
      handle.startEditingCell('r1', 'name');
      handle.setEditingCellDraft('Zara');
      handle.commitEditingCell();
      expect(handle.canUndo()).toBe(true);
      expect(handle.getHistory().past).toHaveLength(1);
      expect(wrapper.emitted('history-change')).toHaveLength(1);
    });

    it('Phase 69: enableUndoHistory: true + cell-range-fill → batch recorded', () => {
      const wrapper = mount(TableForTest, {
        propsData: {
          columns,
          rows,
          cellRangeSelection: 'enabled',
          enableUndoHistory: true,
        },
      });
      const handle = wrapper.vm as unknown as UndoRedoHandleVue2;
      handle.setCellRange({
        anchor: { rowId: 'r1', colId: 'name' },
        focus: { rowId: 'r1', colId: 'name' },
      });
      handle.fillCellRange({ rowId: 'r3', colId: 'name' });
      expect(handle.getHistory().past).toHaveLength(1);
      expect(handle.canUndo()).toBe(true);
    });

    it('Phase 69: handle.undo() → fires history-replay with REVERSED mutations + direction undo', () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns: editableCols, rows: editableRows, enableUndoHistory: true },
      });
      const handle = wrapper.vm as unknown as UndoRedoHandleVue2;
      handle.startEditingCell('r1', 'name');
      handle.setEditingCellDraft('Zara');
      handle.commitEditingCell();
      const undidIt = handle.undo();
      expect(undidIt).toBe(true);
      const replays = wrapper.emitted('history-replay') as
        | [
            {
              direction: 'undo' | 'redo';
              batch: { mutations: readonly { oldValue: unknown; newValue: unknown }[] };
              jsEvent: KeyboardEvent | null;
            },
          ][]
        | undefined;
      expect(replays).toBeTruthy();
      expect(replays!.length).toBe(1);
      const payload = replays![0]![0];
      expect(payload.direction).toBe('undo');
      expect(payload.jsEvent).toBeNull();
      expect(payload.batch.mutations[0]).toMatchObject({ oldValue: 'Zara', newValue: 'Alpha' });
      expect(handle.canUndo()).toBe(false);
      expect(handle.canRedo()).toBe(true);
    });

    it('Phase 69: handle.redo() → fires history-replay with ORIGINAL mutations + direction redo', () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns: editableCols, rows: editableRows, enableUndoHistory: true },
      });
      const handle = wrapper.vm as unknown as UndoRedoHandleVue2;
      handle.startEditingCell('r1', 'name');
      handle.setEditingCellDraft('Zara');
      handle.commitEditingCell();
      handle.undo();
      const redidIt = handle.redo();
      expect(redidIt).toBe(true);
      const replays = wrapper.emitted('history-replay') as
        | [
            {
              direction: 'undo' | 'redo';
              batch: { mutations: readonly { oldValue: unknown; newValue: unknown }[] };
            },
          ][]
        | undefined;
      expect(replays).toBeTruthy();
      expect(replays!.length).toBe(2);
      const payload = replays![1]![0];
      expect(payload.direction).toBe('redo');
      expect(payload.batch.mutations[0]).toMatchObject({ oldValue: 'Alpha', newValue: 'Zara' });
      expect(handle.canUndo()).toBe(true);
      expect(handle.canRedo()).toBe(false);
    });

    it('Phase 69: new mutation after undo → future cleared (canRedo false)', () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns: editableCols, rows: editableRows, enableUndoHistory: true },
      });
      const handle = wrapper.vm as unknown as UndoRedoHandleVue2;
      handle.startEditingCell('r1', 'name');
      handle.setEditingCellDraft('Zara');
      handle.commitEditingCell();
      handle.undo();
      handle.startEditingCell('r2', 'name');
      handle.setEditingCellDraft('YYY');
      handle.commitEditingCell();
      expect(handle.canRedo()).toBe(false);
      expect(handle.getHistory().future).toHaveLength(0);
    });

    it('Phase 69: handle.undo() with no past → false; no emit', () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns: editableCols, rows: editableRows, enableUndoHistory: true },
      });
      const handle = wrapper.vm as unknown as UndoRedoHandleVue2;
      expect(handle.undo()).toBe(false);
      expect(wrapper.emitted('history-replay') ?? []).toHaveLength(0);
    });

    it('Phase 69: body Ctrl+Z keydown + non-empty past → fires history-replay', async () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns: editableCols, rows: editableRows, enableUndoHistory: true },
      });
      const handle = wrapper.vm as unknown as UndoRedoHandleVue2;
      handle.startEditingCell('r1', 'name');
      handle.setEditingCellDraft('Zara');
      handle.commitEditingCell();
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'z', ctrlKey: true });
      const replays = wrapper.emitted('history-replay') as
        | [{ direction: 'undo' | 'redo'; jsEvent: KeyboardEvent | null }][]
        | undefined;
      expect(replays).toBeTruthy();
      expect(replays!.length).toBe(1);
      const payload = replays![0]![0];
      expect(payload.direction).toBe('undo');
      expect(payload.jsEvent).not.toBeNull();
    });
  });

  describe('Phase 71: multi-row pinned headers (column groups)', () => {
    function heightPx(style: string | void): number {
      if (!style) return 0;
      const match = /height:\s*([0-9.]+)px/i.exec(style);
      return match ? Number.parseFloat(match[1]!) : 0;
    }

    it('Phase 71: no column has headerGroup → no .cx-table-row--header-group rendered', () => {
      const wrapper = mount(TableForTest, { propsData: { columns, rows } });
      expect(wrapper.find('.cx-table-row--header-group').exists()).toBe(false);
      expect(wrapper.find('.cx-table-row--header').exists()).toBe(true);
      expect(wrapper.findAll('.cx-table-header-group').length).toBe(0);
    });

    it('Phase 71: 2 contiguous cols share headerGroup → 1 labelled span with combined width', () => {
      const cols: readonly ColumnSpec[] = [
        { id: 'id', field: 'id', headerName: 'ID', width: 80, headerGroup: '基础信息' },
        { id: 'name', field: 'name', headerName: '名称', width: 140, headerGroup: '基础信息' },
        { id: 'qty', field: 'qty', headerName: '数量', width: 100 },
      ];
      const wrapper = mount(TableForTest, { propsData: { columns: cols, rows } });
      expect(wrapper.find('.cx-table-row--header-group').exists()).toBe(true);
      const labelled = wrapper.findAll('.cx-table-header-group:not(.cx-table-header-group--empty)');
      expect(labelled.length).toBe(1);
      expect(labelled.at(0).attributes('data-group-name')).toBe('基础信息');
      expect(labelled.at(0).attributes('data-col-ids')).toBe('id,name');
      expect(widthPx(labelled.at(0).attributes('style'))).toBe(80 + 140);
    });

    it('Phase 71: mixed grouped + un-grouped → empty placeholders sized to leaf widths; row height = theme.headerGroupHeight', () => {
      const cols: readonly ColumnSpec[] = [
        { id: 'id', field: 'id', headerName: 'ID', width: 80, headerGroup: '基础信息' },
        { id: 'name', field: 'name', headerName: '名称', width: 140, headerGroup: '基础信息' },
        { id: 'qty', field: 'qty', headerName: '数量', width: 100 },
        { id: 'note', field: 'note', headerName: '备注', width: 160 },
      ];
      const wrapper = mount(TableForTest, { propsData: { columns: cols, rows } });
      const empties = wrapper.findAll('.cx-table-header-group--empty');
      expect(empties.length).toBe(2);
      expect(widthPx(empties.at(0).attributes('style'))).toBe(100);
      expect(widthPx(empties.at(1).attributes('style'))).toBe(160);
      const groupRow = wrapper.find('.cx-table-row--header-group');
      const groupCells = groupRow.findAll('.cx-table-header-group');
      for (let i = 0; i < groupCells.length; i++) {
        expect(heightPx(groupCells.at(i).attributes('style'))).toBe(28);
      }
    });

    it('Phase 71: same headerGroup name on a left-pinned col + a center col → 2 separate spans (zone-split)', () => {
      const cols: readonly ColumnSpec[] = [
        { id: 'id', field: 'id', headerName: 'ID', width: 80, pinned: 'left', headerGroup: 'X' },
        { id: 'name', field: 'name', headerName: '名称', width: 140, headerGroup: 'X' },
        { id: 'qty', field: 'qty', headerName: '数量', width: 100 },
      ];
      const wrapper = mount(TableForTest, { propsData: { columns: cols, rows } });
      const xSpans = wrapper.findAll('.cx-table-header-group[data-group-name="X"]');
      expect(xSpans.length).toBe(2);
      expect(widthPx(xSpans.at(0).attributes('style'))).toBe(80);
      expect(widthPx(xSpans.at(1).attributes('style'))).toBe(140);
      expect(xSpans.at(0).attributes('data-col-ids')).toBe('id');
      expect(xSpans.at(1).attributes('data-col-ids')).toBe('name');
    });

    it('Phase 71: click on labelled group cell → header-group-click emit fires with payload', async () => {
      const cols: readonly ColumnSpec[] = [
        { id: 'id', field: 'id', headerName: 'ID', width: 80, headerGroup: 'X' },
        { id: 'name', field: 'name', headerName: '名称', width: 140, headerGroup: 'X' },
        { id: 'qty', field: 'qty', headerName: '数量', width: 100 },
      ];
      const wrapper = mount(TableForTest, { propsData: { columns: cols, rows } });
      const groupCell = wrapper.find('.cx-table-header-group[data-group-name="X"]');
      expect(groupCell.exists()).toBe(true);
      await groupCell.trigger('click');
      const emits = wrapper.emitted('header-group-click') as
        | [{ groupName: string; colIds: readonly string[]; jsEvent: MouseEvent }][]
        | undefined;
      expect(emits).toBeTruthy();
      expect(emits!.length).toBe(1);
      const payload = emits![0]![0];
      expect(payload.groupName).toBe('X');
      expect(payload.colIds).toEqual(['id', 'name']);
      expect(payload.jsEvent).toBeInstanceOf(MouseEvent);
    });

    it('Phase 23.1: nested headerGroup path → 2 group rows + per-level data-header-group-level attr', () => {
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
      const wrapper = mount(TableForTest, { propsData: { columns: cols, rows } });
      const groupRows = wrapper.findAll('.cx-table-row--header-group');
      expect(groupRows.length).toBe(2);
      expect(groupRows.at(0).attributes('data-header-group-level')).toBe('0');
      expect(groupRows.at(1).attributes('data-header-group-level')).toBe('1');
      const finCell = wrapper.find('.cx-table-header-group[data-group-name="财务"]');
      expect(finCell.exists()).toBe(true);
      expect(finCell.attributes('data-header-group-level')).toBe('0');
      expect(finCell.attributes('data-col-ids')).toBe('qty,price');
      const orderCell = wrapper.find('.cx-table-header-group[data-group-name="订单"]');
      expect(orderCell.exists()).toBe(true);
      expect(orderCell.attributes('data-header-group-level')).toBe('1');
      expect(orderCell.attributes('data-col-ids')).toBe('qty,price');
    });

    it('Phase 23.1: mixed string + array headerGroup → un-nested cols get level-1 empty placeholders', () => {
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
      const wrapper = mount(TableForTest, { propsData: { columns: cols, rows } });
      const groupRows = wrapper.findAll('.cx-table-row--header-group');
      expect(groupRows.length).toBe(2);
      const level0Labelled = groupRows
        .at(0)
        .findAll('.cx-table-header-group:not(.cx-table-header-group--empty)');
      expect(level0Labelled.length).toBe(2);
      expect(level0Labelled.at(0).attributes('data-group-name')).toBe('基础信息');
      expect(level0Labelled.at(1).attributes('data-group-name')).toBe('财务');
      const level1Empty = groupRows.at(1).findAll('.cx-table-header-group--empty');
      expect(level1Empty.length).toBe(2); // id + name placeholders at level 1
      const level1Labelled = groupRows
        .at(1)
        .findAll('.cx-table-header-group:not(.cx-table-header-group--empty)');
      expect(level1Labelled.length).toBe(1);
      expect(level1Labelled.at(0).attributes('data-group-name')).toBe('订单');
      expect(level1Labelled.at(0).attributes('data-col-ids')).toBe('qty,price');
    });
  });

  describe('Phase 73 (vue2 port of vue3 Phase 24): sticky footer aggregate row', () => {
    function heightPxLocal(style: string | void): number {
      if (!style) return -1;
      const match = /(?:^|;\s*)height:\s*([0-9.]+)px/i.exec(style);
      return match ? Number.parseFloat(match[1]!) : -1;
    }

    it('Phase 73: showFooterRow defaults to false → no .cx-table-footer DOM is rendered', () => {
      const wrapper = mount(TableForTest, { propsData: { columns, rows } });
      expect(wrapper.find('.cx-table-footer').exists()).toBe(false);
      expect(wrapper.find('.cx-table-row--footer').exists()).toBe(false);
    });

    it('Phase 73: showFooterRow=true with no aggregators on any column → every column footer cell carries the --empty modifier', () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns, rows, showFooterRow: true },
      });
      expect(wrapper.find('.cx-table-footer').exists()).toBe(true);
      const emptyCells = wrapper.findAll('.cx-table-footer-cell--empty');
      // One empty placeholder per visible column (selection-rail
      // placeholders carry a different modifier so they do NOT match
      // this selector).
      expect(emptyCells.length).toBe(columns.length);
    });

    it('Phase 73: qty column with sum aggregator → footer cell renders aggregate value', () => {
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
      const wrapper = mount(TableForTest, {
        propsData: { columns: cols, rows, showFooterRow: true },
      });
      const qtyFooter = wrapper.find('.cx-table-footer-cell[data-col-id="qty"]');
      expect(qtyFooter.exists()).toBe(true);
      expect(qtyFooter.classes().includes('cx-table-footer-cell--empty')).toBe(false);
      expect(qtyFooter.text()).toBe('合计 60 件');
      const idFooter = wrapper.find('.cx-table-footer-cell[data-col-id="id"]');
      expect(idFooter.classes().includes('cx-table-footer-cell--empty')).toBe(true);
      expect(idFooter.text()).toBe('');
    });

    it('Phase 73: footer aggregates the post-filter rows — setFilter narrows the input', async () => {
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
      const wrapper = mount(TableForTest, {
        propsData: { columns: cols, rows, showFooterRow: true },
      });
      expect(wrapper.find('.cx-table-footer-cell[data-col-id="qty"]').text()).toBe('60');
      const handle = wrapper.vm as unknown as {
        setFilter(spec: FilterSpec | readonly FilterSpec[] | null): void;
      };
      handle.setFilter({ type: 'number', colId: 'qty', operator: '>=', value: 20 });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.cx-table-footer-cell[data-col-id="qty"]').text()).toBe('50');
    });

    it('Phase 73: aggregator throws → footer cell is rendered without crashing (empty text)', () => {
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
      const wrapper = mount(TableForTest, {
        propsData: { columns: cols, rows, showFooterRow: true },
      });
      const qtyFooter = wrapper.find('.cx-table-footer-cell[data-col-id="qty"]');
      expect(qtyFooter.exists()).toBe(true);
      expect(qtyFooter.text()).toBe('');
    });

    it('Phase 73: footer cell width matches header cell width + applies theme.footerHeight', () => {
      const cols: readonly ColumnSpec[] = [
        { id: 'id', field: 'id', headerName: 'ID', width: 80 },
        { id: 'qty', field: 'qty', headerName: '数量', width: 130, aggregator: () => 0 },
      ];
      const wrapper = mount(TableForTest, {
        propsData: { columns: cols, rows, showFooterRow: true },
      });
      const qtyHeader = wrapper.find('.cx-table-header-cell[data-col-id="qty"]');
      const qtyFooter = wrapper.find('.cx-table-footer-cell[data-col-id="qty"]');
      expect(widthPx(qtyHeader.attributes('style'))).toBe(130);
      expect(widthPx(qtyFooter.attributes('style'))).toBe(130);
      expect(heightPxLocal(qtyFooter.attributes('style'))).toBe(32);
    });

    it('Phase 73: showFooterRow render does NOT trigger sort-change / filter-change emits', () => {
      const cols: readonly ColumnSpec[] = [
        { id: 'qty', field: 'qty', headerName: '数量', width: 120, aggregator: () => 99 },
      ];
      const wrapper = mount(TableForTest, {
        propsData: { columns: cols, rows, showFooterRow: true },
      });
      expect(wrapper.emitted('sort-change')).toBeUndefined();
      expect(wrapper.emitted('filter-change')).toBeUndefined();
      expect(wrapper.emitted('footer-render')).toBeUndefined();
    });
  });

  describe('Phase 75 (vue2 port of vue3 Phase 25): column visibility menu', () => {
    it('Phase 75: showColumnVisibilityMenu defaults to false → no menu DOM', () => {
      const wrapper = mount(TableForTest, { propsData: { columns, rows } });
      expect(wrapper.find('.cx-table-column-menu-button').exists()).toBe(false);
      expect(wrapper.find('.cx-table-column-menu-popover').exists()).toBe(false);
    });

    it('Phase 75: showColumnVisibilityMenu=true → button visible; popover initially closed', () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns, rows, showColumnVisibilityMenu: true },
      });
      expect(wrapper.find('.cx-table-column-menu-button').exists()).toBe(true);
      expect(wrapper.find('.cx-table-column-menu-popover').exists()).toBe(false);
    });

    it('Phase 75: click button → popover opens with one checkbox per column + action buttons', async () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns, rows, showColumnVisibilityMenu: true },
      });
      await wrapper.find('.cx-table-column-menu-button').trigger('click');
      expect(wrapper.find('.cx-table-column-menu-popover').exists()).toBe(true);
      expect(wrapper.findAll('.cx-table-column-menu-item').length).toBe(columns.length);
      expect(wrapper.find('.cx-table-column-menu-action--show-all').exists()).toBe(true);
      expect(wrapper.find('.cx-table-column-menu-action--hide-all').exists()).toBe(true);
    });

    it('Phase 75: uncheck a checkbox → column-visibility-change emit fires with hidden:true', async () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns, rows, showColumnVisibilityMenu: true },
      });
      await wrapper.find('.cx-table-column-menu-button').trigger('click');
      const qtyCheckbox = wrapper.find('.cx-table-column-menu-checkbox[data-col-id="qty"]');
      (qtyCheckbox.element as HTMLInputElement).checked = false;
      await qtyCheckbox.trigger('change');
      const events = wrapper.emitted('column-visibility-change') as
        | [{ column: ColumnSpec; hidden: boolean; jsEvent: Event | null }][]
        | undefined;
      expect(events).toBeDefined();
      expect(events).toHaveLength(1);
      expect(events![0]![0].column.id).toBe('qty');
      expect(events![0]![0].hidden).toBe(true);
    });

    it('Phase 75: programmatic setColumnVisibility fires the emit', () => {
      const wrapper = mount(TableForTest, { propsData: { columns, rows } });
      const handle = wrapper.vm as unknown as {
        setColumnVisibility(colId: string, hidden: boolean): void;
      };
      handle.setColumnVisibility('qty', true);
      const events = wrapper.emitted('column-visibility-change') as
        | [{ column: ColumnSpec; hidden: boolean }][]
        | undefined;
      expect(events).toBeDefined();
      expect(events).toHaveLength(1);
      expect(events![0]![0].column.id).toBe('qty');
      expect(events![0]![0].hidden).toBe(true);
    });

    it('Phase 75: hide-all guard — first column stays visible; emits per other previously-visible column', async () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns, rows, showColumnVisibilityMenu: true },
      });
      await wrapper.find('.cx-table-column-menu-button').trigger('click');
      await wrapper.find('.cx-table-column-menu-action--hide-all').trigger('click');
      const events = wrapper.emitted('column-visibility-change') as
        | [{ column: ColumnSpec; hidden: boolean }][]
        | undefined;
      expect(events).toBeDefined();
      expect(events).toHaveLength(columns.length - 1);
      const colIds = events!.map((e) => e[0].column.id);
      expect(colIds).not.toContain(columns[0]!.id);
    });

    it('Phase 75: show-all action emits per previously-hidden column only', async () => {
      const cols: readonly ColumnSpec[] = columns.map((c) =>
        c.id === 'qty' ? { ...c, hide: true } : c,
      );
      const wrapper = mount(TableForTest, {
        propsData: { columns: cols, rows, showColumnVisibilityMenu: true },
      });
      await wrapper.find('.cx-table-column-menu-button').trigger('click');
      await wrapper.find('.cx-table-column-menu-action--show-all').trigger('click');
      const events = wrapper.emitted('column-visibility-change') as
        | [{ column: ColumnSpec; hidden: boolean }][]
        | undefined;
      expect(events).toBeDefined();
      expect(events).toHaveLength(1);
      expect(events![0]![0].column.id).toBe('qty');
      expect(events![0]![0].hidden).toBe(false);
    });

    it('Phase 75: refuses to hide the last visible column (C.1 guard) — no emit', () => {
      const cols: readonly ColumnSpec[] = columns.map((c) =>
        c.id === 'qty' ? c : { ...c, hide: true },
      );
      const wrapper = mount(TableForTest, { propsData: { columns: cols, rows } });
      const handle = wrapper.vm as unknown as {
        setColumnVisibility(colId: string, hidden: boolean): void;
      };
      handle.setColumnVisibility('qty', true);
      expect(wrapper.emitted('column-visibility-change')).toBeUndefined();
    });

    it('Phase 75: toggleColumnVisibility flips the current `hide` value', () => {
      const cols: readonly ColumnSpec[] = columns.map((c) =>
        c.id === 'qty' ? { ...c, hide: true } : c,
      );
      const wrapper = mount(TableForTest, { propsData: { columns: cols, rows } });
      const handle = wrapper.vm as unknown as {
        toggleColumnVisibility(colId: string): void;
      };
      handle.toggleColumnVisibility('qty');
      const events = wrapper.emitted('column-visibility-change') as
        | [{ column: ColumnSpec; hidden: boolean }][]
        | undefined;
      expect(events).toBeDefined();
      expect(events).toHaveLength(1);
      expect(events![0]![0].column.id).toBe('qty');
      expect(events![0]![0].hidden).toBe(false);
    });
  });

  describe('Phase 76 (vue2 port of vue3 Phase 26): cell-level keyboard navigation', () => {
    it('Phase 76: enableKeyboardNavigation:false → ArrowRight is a no-op', async () => {
      const wrapper = mount(TableForTest, { propsData: { columns, rows } });
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'ArrowRight' });
      expect(wrapper.emitted('active-cell-change')).toBeUndefined();
    });

    it('Phase 76: click cell + nav enabled → active-cell-change fires', async () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns, rows, enableKeyboardNavigation: true },
      });
      const cell = wrapper.find('.cx-table-cell[data-row-id="r2"][data-col-id="qty"]');
      await cell.trigger('click');
      const events = wrapper.emitted('active-cell-change') as
        | [{ rowId: string; colId: string }][]
        | undefined;
      expect(events).toBeDefined();
      expect(events![0]![0].rowId).toBe('r2');
      expect(events![0]![0].colId).toBe('qty');
    });

    it('Phase 76: ArrowRight after click moves to next column same row', async () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns, rows, enableKeyboardNavigation: true },
      });
      const cell = wrapper.find('.cx-table-cell[data-row-id="r2"][data-col-id="qty"]');
      await cell.trigger('click');
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'ArrowRight' });
      const events = wrapper.emitted('active-cell-change') as
        | [{ rowId: string; colId: string }][]
        | undefined;
      expect(events).toBeDefined();
      const last = events![events!.length - 1]![0];
      expect(last.rowId).toBe('r2');
      expect(last.colId).toBe('status');
    });

    it('Phase 76: ArrowRight on last column is no-op (no further emit)', async () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns, rows, enableKeyboardNavigation: true },
      });
      const handle = wrapper.vm as unknown as {
        setActiveCell(rowId: string, colId: string): void;
      };
      handle.setActiveCell('r2', 'note');
      const count1 = (wrapper.emitted('active-cell-change') ?? []).length;
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'ArrowRight' });
      const count2 = (wrapper.emitted('active-cell-change') ?? []).length;
      expect(count2).toBe(count1);
    });

    it('Phase 76: Ctrl+End jumps to bottom-right cell', async () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns, rows, enableKeyboardNavigation: true },
      });
      const handle = wrapper.vm as unknown as {
        setActiveCell(rowId: string, colId: string): void;
      };
      handle.setActiveCell('r1', 'id');
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'End', ctrlKey: true });
      const events = wrapper.emitted('active-cell-change') as
        | [{ rowId: string; colId: string }][]
        | undefined;
      const last = events![events!.length - 1]![0];
      expect(last.rowId).toBe('r3');
      expect(last.colId).toBe('note');
    });

    it('Phase 76: Enter on editable active cell begins edit', async () => {
      const editableCols: readonly ColumnSpec[] = columns.map((c) =>
        c.id === 'note' ? { ...c, editable: true } : c,
      );
      const wrapper = mount(TableForTest, {
        propsData: { columns: editableCols, rows, enableKeyboardNavigation: true },
      });
      const handle = wrapper.vm as unknown as {
        setActiveCell(rowId: string, colId: string): void;
      };
      handle.setActiveCell('r1', 'note');
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'Enter' });
      expect(wrapper.emitted('cell-edit-start')).toBeDefined();
    });

    it('Phase 76: programmatic setActiveCell + clearActiveCell fire emit', () => {
      const wrapper = mount(TableForTest, { propsData: { columns, rows } });
      const handle = wrapper.vm as unknown as {
        getActiveCell(): { rowId: string; colId: string } | null;
        setActiveCell(rowId: string, colId: string): void;
        clearActiveCell(): void;
      };
      expect(handle.getActiveCell()).toBeNull();
      handle.setActiveCell('r2', 'qty');
      expect(handle.getActiveCell()).toEqual({ rowId: 'r2', colId: 'qty' });
      handle.clearActiveCell();
      expect(handle.getActiveCell()).toBeNull();
      const events = wrapper.emitted('active-cell-change') as
        | [{ rowId: string | null; colId: string | null }][]
        | undefined;
      expect(events).toHaveLength(2);
    });

    it('Phase 76: active cell carries cx-table-cell--active modifier + data-active', async () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns, rows, enableKeyboardNavigation: true },
      });
      const handle = wrapper.vm as unknown as {
        setActiveCell(rowId: string, colId: string): void;
      };
      handle.setActiveCell('r2', 'qty');
      await wrapper.vm.$nextTick();
      const activeCells = wrapper.findAll('.cx-table-cell--active');
      expect(activeCells.length).toBeGreaterThanOrEqual(1);
      const cell = wrapper.find('.cx-table-cell[data-row-id="r2"][data-col-id="qty"]');
      expect(cell.classes().includes('cx-table-cell--active')).toBe(true);
      expect(cell.attributes('data-active')).toBe('true');
    });
  });

  describe('Phase 77 (vue2 port of vue3 Phase 27): auto-scroll to active cell', () => {
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

    it('Phase 77: keyboard ArrowDown across many rows scrolls body vertically (default ON)', async () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns, rows: manyRows, enableKeyboardNavigation: true },
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
      expect(bodyEl.scrollTop).toBeGreaterThan(0);
    });

    it('Phase 77: keyboard ArrowRight across many cols scrolls body horizontally', async () => {
      const narrowCols: readonly ColumnSpec[] = Array.from({ length: 10 }, (_, i) => ({
        id: `c${i}`,
        field: `c${i}`,
        headerName: `c${i}`,
        width: 80,
      }));
      const narrowRows: readonly RowSpec[] = [{ id: 'r0', data: {} }];
      const wrapper = mount(TableForTest, {
        propsData: { columns: narrowCols, rows: narrowRows, enableKeyboardNavigation: true },
      });
      const bodyEl = seedBodyViewport(wrapper);
      const handle = wrapper.vm as unknown as {
        setActiveCell(rowId: string, colId: string): void;
      };
      handle.setActiveCell('r0', 'c0');
      const body = wrapper.find('.cx-table-body');
      for (let i = 0; i < 9; i += 1) {
        await body.trigger('keydown', { key: 'ArrowRight' });
      }
      expect(bodyEl.scrollLeft).toBeGreaterThan(0);
    });

    it('Phase 77: enableKeyboardAutoScroll:false disables scroll even with kb-nav on', async () => {
      const wrapper = mount(TableForTest, {
        propsData: {
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

    it('Phase 77: click does NOT auto-scroll (clicked cell already visible)', async () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns, rows: manyRows, enableKeyboardNavigation: true },
      });
      const bodyEl = seedBodyViewport(wrapper);
      const initialTop = bodyEl.scrollTop;
      const cell = wrapper.find('.cx-table-cell[data-row-id="r2"][data-col-id="qty"]');
      await cell.trigger('click');
      expect(bodyEl.scrollTop).toBe(initialTop);
    });

    it('Phase 77: programmatic setActiveCell to a far row auto-scrolls', () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns, rows: manyRows, enableKeyboardNavigation: true },
      });
      const bodyEl = seedBodyViewport(wrapper);
      const handle = wrapper.vm as unknown as {
        setActiveCell(rowId: string, colId: string): void;
      };
      handle.setActiveCell('r40', 'qty');
      expect(bodyEl.scrollTop).toBeGreaterThan(0);
    });

    it('Phase 77: clearActiveCell does not auto-scroll (no destination)', () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns, rows: manyRows, enableKeyboardNavigation: true },
      });
      const bodyEl = seedBodyViewport(wrapper);
      const handle = wrapper.vm as unknown as {
        setActiveCell(rowId: string, colId: string): void;
        clearActiveCell(): void;
      };
      handle.setActiveCell('r40', 'qty');
      const scrolledTop = bodyEl.scrollTop;
      handle.clearActiveCell();
      expect(bodyEl.scrollTop).toBe(scrolledTop);
    });
  });

  describe('Phase 78 (vue2 port of vue3 Phase 28): shift+Arrow extends cell-range', () => {
    it('Phase 78: shift+ArrowRight after click opens a fresh range with anchor=clicked cell', async () => {
      const wrapper = mount(TableForTest, {
        propsData: {
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
      const startEvents = wrapper.emitted('cell-range-start') as
        | [{ range: { anchor: { rowId: string; colId: string } } }][]
        | undefined;
      expect(startEvents).toBeDefined();
      expect(startEvents![0]![0].range.anchor).toEqual({ rowId: 'r2', colId: 'qty' });
      const changeEvents = wrapper.emitted('cell-range-change') as
        | [
            {
              range: {
                anchor: { rowId: string; colId: string };
                focus: { rowId: string; colId: string };
              };
            },
          ][]
        | undefined;
      expect(changeEvents).toBeDefined();
      const last = changeEvents![changeEvents!.length - 1]![0].range;
      expect(last.anchor).toEqual({ rowId: 'r2', colId: 'qty' });
      expect(last.focus).toEqual({ rowId: 'r2', colId: 'status' });
    });

    it('Phase 78: consecutive shift+ArrowDown extends focus; anchor stays put', async () => {
      const wrapper = mount(TableForTest, {
        propsData: {
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
      const changeEvents = wrapper.emitted('cell-range-change') as
        | [
            {
              range: {
                anchor: { rowId: string; colId: string };
                focus: { rowId: string; colId: string };
              };
            },
          ][]
        | undefined;
      expect(changeEvents).toBeDefined();
      const last = changeEvents![changeEvents!.length - 1]![0].range;
      expect(last.anchor).toEqual({ rowId: 'r1', colId: 'qty' });
      expect(last.focus).toEqual({ rowId: 'r3', colId: 'qty' });
    });

    it('Phase 78: plain ArrowRight when range exists collapses the range', async () => {
      const wrapper = mount(TableForTest, {
        propsData: {
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
      const stopEvents = wrapper.emitted('cell-range-stop');
      expect(stopEvents).toBeDefined();
      expect(stopEvents!.length).toBeGreaterThanOrEqual(1);
    });

    it('Phase 78: Escape clears both activeCell AND cellRange', async () => {
      const wrapper = mount(TableForTest, {
        propsData: {
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

    it('Phase 78: shift+End extends range to last column same row', async () => {
      const wrapper = mount(TableForTest, {
        propsData: {
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
      const changeEvents = wrapper.emitted('cell-range-change') as
        | [
            {
              range: {
                anchor: { rowId: string; colId: string };
                focus: { rowId: string; colId: string };
              };
            },
          ][]
        | undefined;
      expect(changeEvents).toBeDefined();
      const last = changeEvents![changeEvents!.length - 1]![0].range;
      expect(last.anchor).toEqual({ rowId: 'r2', colId: 'qty' });
      expect(last.focus).toEqual({ rowId: 'r2', colId: 'note' });
    });

    it('Phase 78: cellRangeSelection:none disables shift+arrow extension', async () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns, rows, enableKeyboardNavigation: true },
      });
      const cell = wrapper.find('.cx-table-cell[data-row-id="r2"][data-col-id="qty"]');
      await cell.trigger('click');
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'ArrowRight', shiftKey: true });
      expect(wrapper.emitted('cell-range-start')).toBeUndefined();
      expect(wrapper.emitted('active-cell-change')).toBeDefined();
    });
  });

  describe('Phase 79 (vue2 port of vue3 Phase 29): Ctrl+Arrow data-region jumps', () => {
    const sparseRows: readonly RowSpec[] = [
      { id: 'r1', data: { id: 1, name: 'a', qty: 10, status: 'X', note: 'first' } },
      { id: 'r2', data: { id: 2, name: 'b', qty: 20, status: 'Y', note: 'second' } },
      { id: 'r3', data: { id: 3, name: 'c', qty: 30, status: 'Z', note: '' } },
      { id: 'r4', data: { id: 4, name: 'd', qty: 40, status: 'W', note: '' } },
      { id: 'r5', data: { id: 5, name: 'e', qty: 50, status: 'V', note: 'last' } },
    ];

    it('Phase 79: Ctrl+ArrowDown from first row of filled column jumps to last filled row', async () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns, rows: sparseRows, enableKeyboardNavigation: true },
      });
      const handle = wrapper.vm as unknown as {
        setActiveCell(rowId: string, colId: string): void;
        getActiveCell(): { rowId: string; colId: string } | null;
      };
      handle.setActiveCell('r1', 'qty');
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'ArrowDown', ctrlKey: true });
      expect(handle.getActiveCell()).toEqual({ rowId: 'r5', colId: 'qty' });
    });

    it('Phase 79: Ctrl+ArrowDown from filled cell with empty below stays put', async () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns, rows: sparseRows, enableKeyboardNavigation: true },
      });
      const handle = wrapper.vm as unknown as {
        setActiveCell(rowId: string, colId: string): void;
        getActiveCell(): { rowId: string; colId: string } | null;
      };
      handle.setActiveCell('r2', 'note');
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'ArrowDown', ctrlKey: true });
      expect(handle.getActiveCell()).toEqual({ rowId: 'r2', colId: 'note' });
    });

    it('Phase 79: Ctrl+ArrowDown from EMPTY cell jumps to first non-empty below', async () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns, rows: sparseRows, enableKeyboardNavigation: true },
      });
      const handle = wrapper.vm as unknown as {
        setActiveCell(rowId: string, colId: string): void;
        getActiveCell(): { rowId: string; colId: string } | null;
      };
      handle.setActiveCell('r3', 'note');
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'ArrowDown', ctrlKey: true });
      expect(handle.getActiveCell()).toEqual({ rowId: 'r5', colId: 'note' });
    });

    it('Phase 79: Ctrl+ArrowRight from filled cell jumps along the row', async () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns, rows: sparseRows, enableKeyboardNavigation: true },
      });
      const handle = wrapper.vm as unknown as {
        setActiveCell(rowId: string, colId: string): void;
        getActiveCell(): { rowId: string; colId: string } | null;
      };
      handle.setActiveCell('r1', 'id');
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'ArrowRight', ctrlKey: true });
      expect(handle.getActiveCell()).toEqual({ rowId: 'r1', colId: 'note' });
    });

    it('Phase 79: Ctrl+Shift+ArrowDown extends cell-range from anchor to boundary', async () => {
      const wrapper = mount(TableForTest, {
        propsData: {
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
      const changeEvents = wrapper.emitted('cell-range-change') as
        | [
            {
              range: {
                anchor: { rowId: string; colId: string };
                focus: { rowId: string; colId: string };
              };
            },
          ][]
        | undefined;
      expect(changeEvents).toBeDefined();
      const last = changeEvents![changeEvents!.length - 1]![0].range;
      expect(last.anchor).toEqual({ rowId: 'r1', colId: 'qty' });
      expect(last.focus).toEqual({ rowId: 'r5', colId: 'qty' });
    });

    it('Phase 79: Ctrl+ArrowDown without activeCell falls back to top-left init', async () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns, rows: sparseRows, enableKeyboardNavigation: true },
      });
      const body = wrapper.find('.cx-table-body');
      await body.trigger('keydown', { key: 'ArrowDown', ctrlKey: true });
      const events = wrapper.emitted('active-cell-change') as
        | [{ rowId: string; colId: string }][]
        | undefined;
      expect(events).toBeDefined();
      const payload = events![0]![0];
      expect(payload.rowId).toBe('r1');
      expect(payload.colId).toBe('id');
    });
  });

  describe('Phase 30.2 (vue2 port of vue3 Phase 30.1): tree data', () => {
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
      const wrapper = mount(TableForTest, {
        propsData: { columns: treeColumns, rows: buildTreeRows(), defaultExpandedDepth: 0 },
      });
      const rowIds = wrapper
        .findAll('.cx-table-row')
        .wrappers.map((r) => r.attributes('data-row-id'))
        .filter((id): id is string => id != null);
      expect(rowIds).toEqual(['p1', 'p2']);
    });

    it('renders top + level-1 children when defaultExpandedDepth is 1', () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns: treeColumns, rows: buildTreeRows(), defaultExpandedDepth: 1 },
      });
      const rowIds = wrapper
        .findAll('.cx-table-row')
        .wrappers.map((r) => r.attributes('data-row-id'))
        .filter((id): id is string => id != null);
      expect(rowIds).toEqual(['p1', 'p1/m1', 'p1/m2', 'p2']);
    });

    it('renders chevron for parent rows + leaf spacer for leaf rows in the tree column', () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns: treeColumns, rows: buildTreeRows(), defaultExpandedDepth: 1 },
      });
      const p1Chevron = wrapper.find(
        '.cx-table-cell[data-col-id="name"][data-row-id="p1"] .cx-table-tree-chevron',
      );
      expect(p1Chevron.exists()).toBe(true);
      const p1m2Spacer = wrapper.find(
        '.cx-table-cell[data-col-id="name"][data-row-id="p1/m2"] .cx-table-tree-chevron-spacer',
      );
      expect(p1m2Spacer.exists()).toBe(true);
    });

    it('applies depth-driven indent paddingLeft to tree-column cells only', () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns: treeColumns, rows: buildTreeRows(), defaultExpandedDepth: 2 },
      });
      const depth2Cell = wrapper.find('.cx-table-cell[data-col-id="name"][data-row-id="p1/m1/f1"]');
      expect(depth2Cell.exists()).toBe(true);
      const style = depth2Cell.attributes('style') ?? '';
      expect(style).toMatch(/padding-left:\s*40px/i);
      const sizeCell = wrapper.find('.cx-table-cell[data-col-id="size"][data-row-id="p1/m1/f1"]');
      const sizeStyle = sizeCell.attributes('style') ?? '';
      expect(sizeStyle).toMatch(/padding-left:\s*8px/i);
    });

    it('chevron click toggles expand + emits expanded-change with the next id list', async () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns: treeColumns, rows: buildTreeRows(), defaultExpandedDepth: 0 },
      });
      const chevron = wrapper.find(
        '.cx-table-cell[data-col-id="name"][data-row-id="p1"] .cx-table-tree-chevron',
      );
      await chevron.trigger('click');
      const events = wrapper.emitted('expanded-change') as
        | [{ next: readonly string[] }][]
        | undefined;
      expect(events).toBeDefined();
      const payload = events![0]![0];
      expect(payload.next).toEqual(['p1']);
      const rowIds = wrapper
        .findAll('.cx-table-row')
        .wrappers.map((r) => r.attributes('data-row-id'))
        .filter((id): id is string => id != null);
      expect(rowIds).toContain('p1/m1');
      expect(rowIds).toContain('p1/m2');
    });

    it('Enter on parent row in tree column toggles expand (precedence over edit-start)', async () => {
      const wrapper = mount(TableForTest, {
        propsData: {
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
      const events = wrapper.emitted('expanded-change') as
        | [{ next: readonly string[] }][]
        | undefined;
      expect(events).toBeDefined();
      const payload = events![0]![0];
      expect(payload.next).toEqual(['p1']);
    });

    it('ArrowRight on collapsed parent expands the row', async () => {
      const wrapper = mount(TableForTest, {
        propsData: {
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
      const events = wrapper.emitted('expanded-change') as
        | [{ next: readonly string[] }][]
        | undefined;
      expect(events).toBeDefined();
      const payload = events![0]![0];
      expect(payload.next).toEqual(['p1']);
    });

    it('ArrowLeft on expanded parent collapses the row', async () => {
      const wrapper = mount(TableForTest, {
        propsData: {
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
      const events = wrapper.emitted('expanded-change') as
        | [{ next: readonly string[] }][]
        | undefined;
      expect(events).toBeDefined();
      const payload = events![0]![0];
      expect(payload.next).toEqual([]);
    });

    it('ArrowLeft on a child row jumps activeCell to the parent', async () => {
      const wrapper = mount(TableForTest, {
        propsData: {
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
      handle.setActiveCell('p1/m1/f1', 'name');
      await wrapper.find('.cx-table-body').trigger('keydown', { key: 'ArrowLeft' });
      expect(handle.getActiveCell()).toEqual({ rowId: 'p1/m1', colId: 'name' });
    });

    it('expandRow + collapseRow TableHandle methods round-trip + emit', () => {
      const wrapper = mount(TableForTest, {
        propsData: { columns: treeColumns, rows: buildTreeRows(), defaultExpandedDepth: 0 },
      });
      const handle = wrapper.vm as unknown as {
        expandRow(rowId: string): void;
        collapseRow(rowId: string): void;
      };
      handle.expandRow('p1');
      const after1 = wrapper.emitted('expanded-change') as
        | [{ next: readonly string[] }][]
        | undefined;
      expect(after1).toBeDefined();
      expect(after1![0]![0].next).toEqual(['p1']);
      handle.collapseRow('p1');
      const allEvents = wrapper.emitted('expanded-change') as [{ next: readonly string[] }][];
      const last = allEvents[allEvents.length - 1]![0];
      expect(last.next).toEqual([]);
    });

    it('controlled mode: prop binding drives expanded set; toggle emits but does not mutate', async () => {
      const wrapper = mount(TableForTest, {
        propsData: {
          columns: treeColumns,
          rows: buildTreeRows(),
          expandedRowIds: ['p1'],
        },
      });
      const rowIds = wrapper
        .findAll('.cx-table-row')
        .wrappers.map((r) => r.attributes('data-row-id'))
        .filter((id): id is string => id != null);
      expect(rowIds).toContain('p1/m1');
      const chevron = wrapper.find(
        '.cx-table-cell[data-col-id="name"][data-row-id="p1"] .cx-table-tree-chevron',
      );
      await chevron.trigger('click');
      const events = wrapper.emitted('expanded-change') as
        | [{ next: readonly string[] }][]
        | undefined;
      expect(events).toBeDefined();
      expect(events![0]![0].next).toEqual([]);
      const rowIds2 = wrapper
        .findAll('.cx-table-row')
        .wrappers.map((r) => r.attributes('data-row-id'))
        .filter((id): id is string => id != null);
      expect(rowIds2).toContain('p1/m1');
    });

    it('filter auto-expands ancestor with matching descendant (filterForceExpandedRowIds)', async () => {
      const wrapper = mount(TableForTest, {
        propsData: {
          columns: treeColumns,
          rows: buildTreeRows(),
          defaultExpandedDepth: 0,
          showFilterRow: true,
        },
      });
      const handle = wrapper.vm as unknown as {
        setFilter(spec: TextFilterSpec | null): void;
      };
      handle.setFilter({
        type: 'text',
        colId: 'name',
        operator: 'contains',
        value: 'utils',
      });
      await wrapper.vm.$nextTick();
      const rowIds = wrapper
        .findAll('.cx-table-row')
        .wrappers.map((r) => r.attributes('data-row-id'))
        .filter((id): id is string => id != null);
      expect(rowIds).toContain('p1');
      expect(rowIds).toContain('p1/m1');
      expect(rowIds).toContain('p1/m1/f2');
      expect(rowIds).not.toContain('p1/m2');
    });
  });

  describe('Phase 30.1.1 (vue2 port): tristate row-selection cascade', () => {
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
      const wrapper = mount(TableForTest, {
        propsData: {
          columns: cascadeColumns,
          rows: buildCascadeRows(),
          defaultExpandedDepth: 1,
          selectionMode: 'multi',
          selectionColumn: { show: true, side: 'left' },
        },
      });
      const checkbox = wrapper.find('.cx-table-selection-checkbox--row[data-row-id="p1"]');
      await checkbox.trigger('click');
      const events = wrapper.emitted('selection-change') as
        | [{ selectedRowIds: readonly string[] }][]
        | undefined;
      expect(events).toBeDefined();
      const payload = events![0]![0].selectedRowIds;
      expect(new Set(payload)).toEqual(new Set(['p1', 'p1/c1', 'p1/c2']));
    });

    it('row click on a parent row cascades selection through descendants', async () => {
      const wrapper = mount(TableForTest, {
        propsData: {
          columns: cascadeColumns,
          rows: buildCascadeRows(),
          defaultExpandedDepth: 1,
          selectionMode: 'multi',
        },
      });
      const parentCell = wrapper.find('.cx-table-cell[data-row-id="p1"][data-col-id="name"]');
      await parentCell.trigger('click');
      const events = wrapper.emitted('selection-change') as
        | [{ selectedRowIds: readonly string[] }][]
        | undefined;
      expect(events).toBeDefined();
      const payload = events![0]![0].selectedRowIds;
      expect(new Set(payload)).toEqual(new Set(['p1', 'p1/c1', 'p1/c2']));
    });

    it('clicking a descendant directly does NOT cascade up', async () => {
      const wrapper = mount(TableForTest, {
        propsData: {
          columns: cascadeColumns,
          rows: buildCascadeRows(),
          defaultExpandedDepth: 1,
          selectionMode: 'multi',
          selectionColumn: { show: true, side: 'left' },
        },
      });
      const childCheckbox = wrapper.find('.cx-table-selection-checkbox--row[data-row-id="p1/c1"]');
      await childCheckbox.trigger('click');
      const events = wrapper.emitted('selection-change') as
        | [{ selectedRowIds: readonly string[] }][]
        | undefined;
      expect(events).toBeDefined();
      const payload = events![0]![0].selectedRowIds;
      expect(payload).toEqual(['p1/c1']);
    });

    it('partially-selected parent renders indeterminate checkbox', async () => {
      const wrapper = mount(TableForTest, {
        propsData: {
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
      const checkboxWrapper = wrapper.find('.cx-table-selection-checkbox--row[data-row-id="p1"]');
      expect(checkboxWrapper.exists()).toBe(true);
      const el = checkboxWrapper.element as HTMLInputElement;
      expect(el.indeterminate).toBe(true);
      expect(checkboxWrapper.classes()).toContain('cx-table-row-checkbox--indeterminate');
    });
  });

  describe('Phase 30.1.2 (vue2 port): tree-aware sort', () => {
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
      const wrapper = mount(TableForTest, {
        propsData: {
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
        .wrappers.map((r) => r.attributes('data-row-id'))
        .filter((id): id is string => id != null);
      expect(rowIdsAsc).toEqual(['p', 'p/a', 'p/b', 'p/c']);
      handle.setSort({ colId: 'name', direction: 'desc' });
      await wrapper.vm.$nextTick();
      const rowIdsDesc = wrapper
        .findAll('.cx-table-row')
        .wrappers.map((r) => r.attributes('data-row-id'))
        .filter((id): id is string => id != null);
      expect(rowIdsDesc).toEqual(['p', 'p/c', 'p/b', 'p/a']);
    });
  });
});

describe('Phase 38: saved table views (vue2)', () => {
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
    setColumnVisibility(colId: string, hidden: boolean): void;
  }

  it('Phase 38: getTableView projects columns/sort/filter/page/pageSize with version: 1', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
        columns: viewColumns,
        rows: viewRows,
        paginationEnabled: true,
        initialPageSize: 20,
      },
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

  it('Phase 38: applyTableView dispatches sort + filter + page/pageSize to setters', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
        columns: viewColumns,
        rows: viewRows,
        paginationEnabled: true,
        initialPageSize: 20,
      },
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

  it('Phase 38: applyTableView emits columns-change once with reconciled array', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns: viewColumns, rows: viewRows } });
    const handle = wrapper.vm as unknown as ViewHandle;
    handle.applyTableView({
      version: 1,
      columns: [{ id: 'qty' }, { id: 'name', width: 400 }, { id: 'id' }, { id: 'price' }],
      sort: [],
      filter: [],
      page: 0,
      pageSize: 20,
    });
    await wrapper.vm.$nextTick();
    const events = wrapper.emitted('columns-change') as
      | [{ columns: readonly ColumnSpec[]; reason: string }][]
      | undefined;
    expect(events).toBeDefined();
    expect(events).toHaveLength(1);
    const payload = events![0]![0];
    expect(payload.reason).toBe('apply-view');
    expect(payload.columns.map((c) => c.id)).toEqual(['qty', 'name', 'id', 'price']);
    const nameCol = payload.columns.find((c) => c.id === 'name')!;
    expect(nameCol.width).toBe(400);
  });

  it('Phase 38: applyTableView drops sort/filter entries referencing removed columns', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns: viewColumns, rows: viewRows } });
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

  it('Phase 38: applyTableView no-ops silently on unknown version', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns: viewColumns, rows: viewRows } });
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

describe('Phase 39: Excel xlsx export (vue2)', () => {
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
    readonly exportToXlsx: (
      filename: string,
      options?: { rowSource?: string; xlsxOptions?: { sheetName?: string } },
    ) => Promise<void>;
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
      // For non-download anchors, swallow — test environment shouldn't
      // need real anchor navigation. Restored on restore().
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

  it('Phase 39: exportToXlsx triggers a Blob download with XLSX mimetype + filename', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns: viewColumns, rows: viewRows } });
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

  it('Phase 39: exportToXlsx passes sheetName through xlsxOptions', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns: viewColumns, rows: viewRows } });
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

  it('Phase 39: exportToXlsx with rowSource:"all" still produces a valid blob', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns: viewColumns, rows: viewRows } });
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

describe('Phase 40 + 39.1: a11y + multi-sheet xlsx (vue2)', () => {
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

  it('Phase 40 (vue2): wrapper carries aria-rowcount + aria-colcount + role=grid', () => {
    const wrapper = mount(TableForTest, { propsData: { columns: viewColumns, rows: viewRows } });
    const root = wrapper.find('.cx-table-wrapper');
    expect(root.attributes('role')).toBe('grid');
    expect(root.attributes('aria-rowcount')).toBeDefined();
    expect(root.attributes('aria-colcount')).toBeDefined();
    expect(Number(root.attributes('aria-rowcount'))).toBeGreaterThanOrEqual(3);
    expect(Number(root.attributes('aria-colcount'))).toBe(3);
  });

  it('Phase 40 (vue2): off-screen live region renders with role=status + aria-live=polite', () => {
    const wrapper = mount(TableForTest, { propsData: { columns: viewColumns, rows: viewRows } });
    const live = wrapper.find('.cx-table-sr-announce');
    expect(live.exists()).toBe(true);
    expect(live.attributes('role')).toBe('status');
    expect(live.attributes('aria-live')).toBe('polite');
    expect(live.attributes('aria-atomic')).toBe('true');
  });

  it('Phase 39.1 (vue2): exportToXlsxMultiSheet triggers ONE Blob download with XLSX mimetype', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns: viewColumns, rows: viewRows } });
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

describe('Phase 40.1 + 39.3: per-cell ARIA indices + xlsx freeze-pane (vue2)', () => {
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

  it('Phase 40.1 (vue2): header row has aria-rowindex=1', () => {
    const wrapper = mount(TableForTest, { propsData: { columns: viewColumns, rows: viewRows } });
    const header = wrapper.find('.cx-table-row--header');
    expect(header.attributes('aria-rowindex')).toBe('1');
  });

  it('Phase 40.1 (vue2): body rows have monotonically increasing aria-rowindex starting at 2', () => {
    const wrapper = mount(TableForTest, { propsData: { columns: viewColumns, rows: viewRows } });
    const bodyRows = wrapper
      .findAll('.cx-table-row')
      .wrappers.filter((r) => !r.classes('cx-table-row--header'));
    expect(bodyRows.length).toBeGreaterThanOrEqual(3);
    const indices = bodyRows.slice(0, 3).map((r) => Number(r.attributes('aria-rowindex')));
    expect(indices).toEqual([2, 3, 4]);
  });

  it('Phase 40.1 (vue2): body cells have aria-colindex matching column position (1..N)', () => {
    const wrapper = mount(TableForTest, { propsData: { columns: viewColumns, rows: viewRows } });
    const firstBodyRow = wrapper
      .findAll('.cx-table-row')
      .wrappers.find((r) => !r.classes('cx-table-row--header'))!;
    const cells = firstBodyRow.findAll('[role="gridcell"]').wrappers;
    const indices = cells.slice(0, 3).map((c) => Number(c.attributes('aria-colindex')));
    expect(indices).toEqual([1, 2, 3]);
  });

  it('Phase 40.1 (vue2): column headers carry matching aria-colindex (1..N)', () => {
    const wrapper = mount(TableForTest, { propsData: { columns: viewColumns, rows: viewRows } });
    const colHeaders = wrapper
      .findAll('.cx-table-row--header [role="columnheader"]')
      .wrappers.filter((c) => c.attributes('data-col-id') !== '__cx_selection__');
    const indices = colHeaders.slice(0, 3).map((c) => Number(c.attributes('aria-colindex')));
    expect(indices).toEqual([1, 2, 3]);
  });

  it('Phase 39.3 (vue2): exportToXlsxMultiSheet threads xlsxOptions.freezePane per sheet', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns: viewColumns, rows: viewRows } });
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

describe('Phase 42 (vue2): advanced filter', () => {
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
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const handle = wrapper.vm as unknown as AdvancedFilterHandle;
    handle.setAdvancedFilter({
      kind: 'compare',
      colId: 'qty',
      operator: '>',
      value: 15,
    });
    const emits = wrapper.emitted('filter-change') as
      | [{ filterSpec: readonly FilterSpec[] }][]
      | undefined;
    expect(emits).toBeTruthy();
    const last = emits?.[emits.length - 1]?.[0];
    expect(last?.filterSpec.length).toBe(1);
    expect(last?.filterSpec[0]?.type).toBe('expression');
  });

  it('getAdvancedFilter returns expression + source after a parseAndSet', () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const handle = wrapper.vm as unknown as AdvancedFilterHandle;
    handle.parseAndSetAdvancedFilter('qty > 15');
    const current = handle.getAdvancedFilter();
    expect(current).not.toBeNull();
    expect(current?.source).toBe('qty > 15');
    expect(current?.expression.kind).toBe('compare');
  });

  it('setAdvancedFilter(null) clears the expression while keeping text spec on another column', () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
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
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const handle = wrapper.vm as unknown as AdvancedFilterHandle;
    const result = handle.parseAndSetAdvancedFilter('qty > 15');
    expect(result.ok).toBe(true);
    const current = handle.getAdvancedFilter();
    expect(current?.expression.kind).toBe('compare');
  });

  it('parseAndSetAdvancedFilter returns errors and leaves prior filter unchanged on invalid input', () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const handle = wrapper.vm as unknown as AdvancedFilterHandle;
    handle.parseAndSetAdvancedFilter('qty > 15');
    const before = handle.getAdvancedFilter();
    const result = handle.parseAndSetAdvancedFilter('garbage @@@');
    expect(result.ok).toBe(false);
    const after = handle.getAdvancedFilter();
    expect(after?.expression).toEqual(before?.expression);
  });
});

describe('Phase 44 (vue2): row drag', () => {
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
    const wrapper = mount(TableForTest, {
      propsData: { columns: dragColumns, rows: dragRows, rowDragColumn: { show: true } },
    });
    const gripCells = wrapper.findAll('[data-row-drag-handle="true"]');
    expect(gripCells.length).toBe(3);
  });

  it('does NOT render grip cells when rowDragColumn.show is false', () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns: dragColumns, rows: dragRows },
    });
    const gripCells = wrapper.findAll('[data-row-drag-handle="true"]');
    expect(gripCells.length).toBe(0);
  });

  it('startMovingRow opens session + fires row-move-start', () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns: dragColumns, rows: dragRows, rowDragColumn: { show: true } },
    });
    const handle = wrapper.vm as unknown as RowDragHandle;
    handle.startMovingRow('r1');
    expect(handle.getMovingRow()?.rowId).toBe('r1');
    expect(wrapper.emitted('row-move-start')).toBeTruthy();
  });

  it('commitRowMove fires row-order-change + row-move-stop committed:true', () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns: dragColumns, rows: dragRows, rowDragColumn: { show: true } },
    });
    const handle = wrapper.vm as unknown as RowDragHandle;
    handle.startMovingRow('r1');
    handle.commitRowMove('r3', 'below');
    expect(handle.getMovingRow()).toBeNull();
    const orderEmits = wrapper.emitted('row-order-change') as
      | [{ movedRow: RowSpec; targetRow: RowSpec; position: 'above' | 'below' }][]
      | undefined;
    expect(orderEmits).toBeTruthy();
    const last = orderEmits?.[orderEmits.length - 1]?.[0];
    expect(last?.movedRow.id).toBe('r1');
    expect(last?.targetRow.id).toBe('r3');
    expect(last?.position).toBe('below');
  });

  it('cancelRowMove fires row-move-stop committed:false + no row-order-change', () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns: dragColumns, rows: dragRows, rowDragColumn: { show: true } },
    });
    const handle = wrapper.vm as unknown as RowDragHandle;
    handle.startMovingRow('r1');
    handle.cancelRowMove();
    expect(handle.getMovingRow()).toBeNull();
    const stopEmits = wrapper.emitted('row-move-stop') as [{ committed: boolean }][] | undefined;
    expect(stopEmits?.[stopEmits.length - 1]?.[0]?.committed).toBe(false);
    expect(wrapper.emitted('row-order-change') ?? []).toHaveLength(0);
  });

  it('startMovingRow on pinned or draggable:false row is a silent no-op', () => {
    const rowsWithPin: readonly RowSpec[] = [
      { id: 'pinned-top', data: { id: 0 }, pinned: 'top' },
      { id: 'r1', data: { id: 1 } },
      { id: 'r2', data: { id: 2 }, draggable: false },
    ];
    const wrapper = mount(TableForTest, {
      propsData: { columns: dragColumns, rows: rowsWithPin, rowDragColumn: { show: true } },
    });
    const handle = wrapper.vm as unknown as RowDragHandle;
    handle.startMovingRow('pinned-top');
    expect(handle.getMovingRow()).toBeNull();
    handle.startMovingRow('r2');
    expect(handle.getMovingRow()).toBeNull();
    expect(wrapper.emitted('row-move-start') ?? []).toHaveLength(0);
  });
});

describe('Phase 43 (vue2): set filter', () => {
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
    const wrapper = mount(TableForTest, {
      propsData: { columns: setColumns, rows: setRows, showFilterRow: true },
    });
    const setFilterEl = wrapper.find(
      '.cx-table-filter-cell[data-col-id="status"][data-filter-ui="set"] details.cx-table-set-filter',
    );
    expect(setFilterEl.exists()).toBe(true);
    const textFilterEl = wrapper.find(
      '.cx-table-filter-cell[data-col-id="name"] input.cx-table-filter-input',
    );
    expect(textFilterEl.exists()).toBe(true);
  });

  it('summary text reflects all-selected identity state by default', () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns: setColumns, rows: setRows, showFilterRow: true },
    });
    const summary = wrapper.find(
      'details.cx-table-set-filter summary.cx-table-set-filter__summary',
    );
    expect(summary.text()).toContain('全部');
    expect(summary.text()).toContain('(3)');
  });

  it('toggling a checkbox dispatches setFilter with SetFilterSpec', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns: setColumns, rows: setRows, showFilterRow: true },
    });
    const checkboxes = wrapper.findAll(
      '.cx-table-set-filter__item input[type="checkbox"]',
    ).wrappers;
    expect(checkboxes.length).toBe(3);
    await checkboxes[0]!.setChecked(false);
    const handle = wrapper.vm as unknown as SetFilterHandle;
    const filter = handle.getFilter();
    expect(filter.length).toBe(1);
    expect(filter[0]?.type).toBe('set');
  });

  it('全选 / 清空 buttons set selectedValues to null / [] respectively', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns: setColumns, rows: setRows, showFilterRow: true },
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
    expect(handle.getFilter().length).toBe(0);
  });

  it('getColumnUniqueValues exposes core helper through TableHandle', () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns: setColumns, rows: setRows },
    });
    const handle = wrapper.vm as unknown as SetFilterHandle;
    const result = handle.getColumnUniqueValues('status');
    expect(result.values.length).toBe(3);
    expect(result.truncated).toBe(false);
    const labels = result.values.map((v) => v.value);
    expect(new Set(labels)).toEqual(new Set(['完成', '进行中', '阻塞']));
  });
});

describe('Phase 96.2: set filter virtualization (vue2)', () => {
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

  it('96.2 (vue2): below threshold renders eagerly (no virtualization wrapper)', () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    wrapper.destroy();
  });

  it('96.2 (vue2): above threshold renders virtualized window with sizer wrapper', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    Object.defineProperty(listNode, 'clientHeight', { value: 240, configurable: true });
    listNode.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();
    const sizerEl = wrapper.find('.cx-table-set-filter__sizer');
    const windowEl = wrapper.find('.cx-table-set-filter__window');
    expect(sizerEl.exists()).toBe(true);
    expect(windowEl.exists()).toBe(true);
    expect((sizerEl.element as HTMLElement).style.height).toBe('8400px');
    expect(windowEl.attributes('data-window-start')).toBe('0');
    expect(windowEl.attributes('data-window-end')).toBe('12');
    const visible = wrapper.findAll('.cx-table-set-filter__item');
    expect(visible.length).toBe(12);
    wrapper.destroy();
  });

  it('96.2 (vue2): scrolling updates the rendered window', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    listNode.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();
    Object.defineProperty(listNode, 'scrollTop', { value: 500, configurable: true });
    listNode.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();
    const windowEl = wrapper.find('.cx-table-set-filter__window');
    expect(windowEl.attributes('data-window-start')).toBe('14');
    expect(windowEl.attributes('data-window-end')).toBe('30');
    wrapper.destroy();
  });
});

describe('Phase 98.2: number filter range slider (vue2)', () => {
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

  it('98.2 (vue2): default off — no slider rendered for numeric column', () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns: NUM_COLS, rows: NUM_ROWS, showFilterRow: true },
      attachTo: document.body,
    });
    expect(wrapper.find('.cx-table-number-filter__range').exists()).toBe(false);
    expect(wrapper.find('.cx-table-filter-input[data-col-id="qty"]').exists()).toBe(true);
    wrapper.destroy();
  });

  it('98.2 (vue2): prop on + numeric col + finite data — slider renders with track + 2 thumbs', () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    expect(lowThumb.attributes('aria-valuemin')).toBe('5');
    expect(lowThumb.attributes('aria-valuemax')).toBe('100');
    expect(lowThumb.attributes('aria-valuenow')).toBe('5');
    expect(highThumb.attributes('aria-valuenow')).toBe('100');
    wrapper.destroy();
  });

  it('98.2 (vue2): prop on + no finite numeric data — no slider rendered', () => {
    const noNumRows: readonly RowSpec[] = [
      { id: 'r1', data: { qty: null } },
      { id: 'r2', data: { qty: 'bogus' } },
    ];
    const wrapper = mount(TableForTest, {
      propsData: {
        columns: NUM_COLS,
        rows: noNumRows,
        showFilterRow: true,
        numberFilterShowRangeSlider: true,
      },
      attachTo: document.body,
    });
    expect(wrapper.find('.cx-table-number-filter__range').exists()).toBe(false);
    expect(wrapper.find('.cx-table-filter-input[data-col-id="qty"]').exists()).toBe(true);
    wrapper.destroy();
  });

  it('98.2 (vue2): pointerdown on track commits inRange spec; Home on high thumb collapses high to low', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    await track.trigger('pointerdown', { clientX: 10, pointerId: 1, button: 0 });
    const spec1 = handle.getFilter()[0];
    expect(spec1).toMatchObject({
      type: 'number',
      colId: 'qty',
      operator: 'inRange',
      value: 15,
      valueTo: 100,
    });
    await track.trigger('pointerup', { clientX: 10, pointerId: 1 });
    const highThumb = wrapper.find(
      '.cx-table-number-filter__range[data-col-id="qty"] [data-range-handle="high"]',
    );
    await highThumb.trigger('keydown', { key: 'Home' });
    const spec2 = handle.getFilter()[0];
    expect(spec2).toMatchObject({
      type: 'number',
      colId: 'qty',
      operator: 'inRange',
      value: 15,
      valueTo: 15,
    });
    wrapper.destroy();
  });
});

describe('Phase 99.2: cell style editor (vue2)', () => {
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

  it('99.2 (vue2): default off — openCellStyleEditor is a no-op; popover not in DOM', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns: CELL_STYLE_COLUMNS, rows: CELL_STYLE_ROWS },
      attachTo: document.body,
    });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.cx-table-cell-style-editor').exists()).toBe(false);
    wrapper.destroy();
  });

  it('99.2 (vue2): prop on + open via handle mounts popover anchored to the cell with default white state', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    const rInput = wrapper.find('input[data-cx-style-rgb="r"]');
    const hexInput = wrapper.find('input[data-cx-style-hex]');
    expect((rInput.element as HTMLInputElement).value).toBe('255');
    expect((hexInput.element as HTMLInputElement).value).toBe('#ffffff');
    wrapper.destroy();
  });

  it('99.2 (vue2): typing HEX into the input updates HSV-derived RGB inputs in sync', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    wrapper.destroy();
  });

  it('99.2 (vue2): Apply persists backgroundColor + emits cell-style-change + closes popover', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    const events = wrapper.emitted('cell-style-change') as
      | [{ rowId: string; colId: string; style: { backgroundColor: string | null } }][]
      | undefined;
    expect(events).toBeTruthy();
    expect(events![0]![0]).toEqual({
      rowId: 'r1',
      colId: 'name',
      style: { backgroundColor: '#3b82f6' },
    });
    const refreshedCell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((refreshedCell.element as HTMLElement).style.backgroundColor).toBe('#3b82f6');
    wrapper.destroy();
  });

  it('99.2 (vue2): Clear deletes per-cell override + emits null + cell renders without override', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    await hexInput.setValue('#10b981');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    let refreshedCell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((refreshedCell.element as HTMLElement).style.backgroundColor).toBe('#10b981');
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="clear"]').trigger('click');
    await wrapper.vm.$nextTick();
    const events = wrapper.emitted('cell-style-change') as
      | [{ rowId: string; colId: string; style: { backgroundColor: string | null } }][]
      | undefined;
    expect(events![events!.length - 1]![0]).toEqual({
      rowId: 'r1',
      colId: 'name',
      style: { backgroundColor: null },
    });
    refreshedCell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((refreshedCell.element as HTMLElement).style.backgroundColor).toBe('');
    wrapper.destroy();
  });
});

describe('Phase 99.2.1: cell text color extension (vue2)', () => {
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

  it('99.2.1 (vue2): tab strip default — Background active, default #ffffff in HEX input', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    wrapper.destroy();
  });

  it('99.2.1 (vue2): switching to Text tab loads default #000000 + buffers bg axis', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    await wrapper.find('button[data-cx-style-tab="text"]').trigger('click');
    await wrapper.vm.$nextTick();
    const editor = wrapper.find('.cx-table-cell-style-editor');
    expect(editor.attributes('data-cx-style-active-tab')).toBe('text');
    expect((hexInput.element as HTMLInputElement).value).toBe('#000000');
    await wrapper.find('button[data-cx-style-tab="background"]').trigger('click');
    await wrapper.vm.$nextTick();
    expect((hexInput.element as HTMLInputElement).value).toBe('#3b82f6');
    wrapper.destroy();
  });

  it('99.2.1 (vue2): Apply on Text tab persists only color + emit payload has color only + cell renders color', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
      | [
          {
            rowId: string;
            colId: string;
            style: { backgroundColor?: string | null; color?: string | null };
          },
        ][]
      | undefined;
    expect(emitted).toBeTruthy();
    const payload = emitted![0]![0];
    expect(payload).toEqual({
      rowId: 'r1',
      colId: 'name',
      style: { color: '#ff0000' },
    });
    expect(payload.style.backgroundColor).toBeUndefined();
    const refreshedCell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((refreshedCell.element as HTMLElement).style.color).toBe('#ff0000');
    expect((refreshedCell.element as HTMLElement).style.backgroundColor).toBe('');
    wrapper.destroy();
  });

  it('99.2.1 (vue2): Clear on Text tab while bg also persisted preserves bg, emits color:null, cell drops color only', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
      },
      attachTo: document.body,
    });
    const cell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    stubCellRect(cell.element as HTMLElement, { left: 50, top: 100, bottom: 128 });
    const handle = wrapper.vm as unknown as CellStyleHandle;
    // First: Apply bg.
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
      | [
          {
            rowId: string;
            colId: string;
            style: { backgroundColor?: string | null; color?: string | null };
          },
        ][]
      | undefined;
    const lastPayload = emitted![emitted!.length - 1]![0];
    expect(lastPayload).toEqual({
      rowId: 'r1',
      colId: 'name',
      style: { color: null },
    });
    expect(lastPayload.style.backgroundColor).toBeUndefined();
    refreshedCell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((refreshedCell.element as HTMLElement).style.backgroundColor).toBe('#3b82f6');
    expect((refreshedCell.element as HTMLElement).style.color).toBe('');
    wrapper.destroy();
  });
});

describe('Phase 99.2.2: cell font axes extension (vue2)', () => {
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

  it('99.2.2 (vue2): font tab appears in tab strip; click switches active tab to font', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    expect(wrapper.find('[data-cx-style-square]').exists()).toBe(false);
    expect(wrapper.find('[data-cx-style-font="weight-bold"]').exists()).toBe(true);
    wrapper.destroy();
  });

  it('99.2.2 (vue2): Bold toggle flips fontState.fontWeight', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    wrapper.destroy();
  });

  it('99.2.2 (vue2): Italic toggle flips fontState.fontStyle', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    wrapper.destroy();
  });

  it('99.2.2 (vue2): text-decoration tri-state: clicking Underline sets value; None clears', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    wrapper.destroy();
  });

  it('99.2.2 (vue2): Apply on font tab persists 3 font fields + emit + cell renders inline font props', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    const refreshedCell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((refreshedCell.element as HTMLElement).style.fontWeight).toBe('700');
    expect((refreshedCell.element as HTMLElement).style.fontStyle).toBe('italic');
    expect((refreshedCell.element as HTMLElement).style.textDecoration).toBe('underline');
    wrapper.destroy();
  });

  it('99.2.2 (vue2): Clear on font tab while bg + color also persisted preserves bg + color', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    await wrapper.find('input[data-cx-style-hex]').setValue('#3b82f6');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="text"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('input[data-cx-style-hex]').setValue('#ff0000');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
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
    refreshedCell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((refreshedCell.element as HTMLElement).style.backgroundColor).toBe('#3b82f6');
    expect((refreshedCell.element as HTMLElement).style.color).toBe('#ff0000');
    expect((refreshedCell.element as HTMLElement).style.fontWeight).toBe('');
    wrapper.destroy();
  });
});

describe('Phase 99.2.3: cell border axes extension (vue2)', () => {
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

  it('99.2.3 (vue2): border tab appears in tab strip; click switches active tab to border', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    expect(wrapper.find('[data-cx-style-square]').exists()).toBe(false);
    expect(wrapper.find('[data-cx-style-border="color"]').exists()).toBe(true);
    expect(wrapper.find('[data-cx-style-border="width"]').exists()).toBe(true);
    expect(wrapper.find('[data-cx-style-border-style="solid"]').exists()).toBe(true);
    expect(wrapper.find('[data-cx-style-border="radius"]').exists()).toBe(true);
    wrapper.destroy();
  });

  it('99.2.3 (vue2): hex input on border tab updates borderState.borderColor', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    const refreshedInput = wrapper.find('input[data-cx-style-border="color"]');
    expect((refreshedInput.element as HTMLInputElement).value).toBe('#3b82f6');
    wrapper.destroy();
  });

  it('99.2.3 (vue2): width input on border tab updates borderState.borderWidth', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    wrapper.destroy();
  });

  it('99.2.3 (vue2): style segmented control: clicking solid sets value; None clears', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    wrapper.destroy();
  });

  it('99.2.3 (vue2): Apply on border tab persists 4 border fields + emit + cell renders inline border props', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    // Phase 99.2.3.1 (2026-06-01 — vue2 port) widened border-tab emit
    // payload to 16 fields. Use toMatchObject for partial match.
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
    expect(payload.style.borderTopColor).toBeNull();
    expect(payload.style.borderLeftStyle).toBeNull();
    const refreshedCell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((refreshedCell.element as HTMLElement).style.borderColor).toBe('#3b82f6');
    expect((refreshedCell.element as HTMLElement).style.borderWidth).toBe('2px');
    expect((refreshedCell.element as HTMLElement).style.borderStyle).toBe('solid');
    expect((refreshedCell.element as HTMLElement).style.borderRadius).toBe('4px');
    wrapper.destroy();
  });

  it('99.2.3 (vue2): Clear on border tab while bg + color + font + border all set preserves the other 3 axes', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    await wrapper.find('input[data-cx-style-hex]').setValue('#3b82f6');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="text"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('input[data-cx-style-hex]').setValue('#ff0000');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="font"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-font="weight-bold"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
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
    wrapper.destroy();
  });
});

describe('Phase 99.2.2.1: custom font-weight 100-900 picker (vue2)', () => {
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

  it('99.2.2.1 (vue2): custom-weights <details> visible on font tab; collapsed by default; 9 buttons 100-900 rendered', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    for (const w of ['100', '200', '300', '400', '500', '600', '700', '800', '900']) {
      expect(wrapper.find(`button[data-cx-style-font="weight-${w}"]`).exists()).toBe(true);
    }
    wrapper.destroy();
  });

  it('99.2.2.1 (vue2): clicking weight 500 sets fontState.fontWeight to "500"; Bold (700) not active', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    wrapper.destroy();
  });

  it('99.2.2.1 (vue2): clicking weight 700 also makes Bold toggle active', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    wrapper.destroy();
  });

  it('99.2.2.1 (vue2): Apply with custom weight 500 emits fontWeight "500" + cell renders inline fontWeight 500', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
          style: { fontWeight?: string | null };
        }[])[]
      | undefined;
    const payload = emitted![0]![0]!;
    expect(payload.style.fontWeight).toBe('500');
    const refreshedCell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((refreshedCell.element as HTMLElement).style.fontWeight).toBe('500');
    wrapper.destroy();
  });
});

describe('Phase 99.2.3.1: per-side borders (vue2)', () => {
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

  it('99.2.3.1 (vue2): 5-button segmented control renders on border tab; "全部" active by default; clicking "上" sets target', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    for (const side of ['all', 'top', 'right', 'bottom', 'left']) {
      expect(wrapper.find(`button[data-cx-style-border-side="${side}"]`).exists()).toBe(true);
    }
    const allBtn = wrapper.find('button[data-cx-style-border-side="all"]');
    expect(allBtn.attributes('aria-pressed')).toBe('true');
    const topBtn = wrapper.find('button[data-cx-style-border-side="top"]');
    await topBtn.trigger('click');
    await wrapper.vm.$nextTick();
    expect(topBtn.attributes('aria-pressed')).toBe('true');
    expect(allBtn.attributes('aria-pressed')).toBe('false');
    wrapper.destroy();
  });

  it('99.2.3.1 (vue2): with target="top", typing in color input writes borderTopColor; Apply emits per-side field', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    const colorInput = wrapper.find<HTMLInputElement>('input[data-cx-style-border="color"]');
    colorInput.element.value = '#f00000';
    await colorInput.trigger('input');
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
    const refreshedCell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((refreshedCell.element as HTMLElement).style.borderTopColor).toBe('#f00000');
    wrapper.destroy();
  });

  it('99.2.3.1 (vue2): with target="top" and all-sides color set, color input shows effective fallback value', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    const colorInput0 = wrapper.find<HTMLInputElement>('input[data-cx-style-border="color"]');
    colorInput0.element.value = '#0000ff';
    await colorInput0.trigger('input');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="border"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-border-side="top"]').trigger('click');
    await wrapper.vm.$nextTick();
    const colorInput = wrapper.find<HTMLInputElement>('input[data-cx-style-border="color"]');
    expect(colorInput.element.value).toBe('#0000ff');
    wrapper.destroy();
  });

  it('99.2.3.1 (vue2): radius widget HIDDEN when borderSideTarget !== "all"', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    expect(wrapper.find('input[data-cx-style-border="radius"]').exists()).toBe(true);
    await wrapper.find('button[data-cx-style-border-side="right"]').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('input[data-cx-style-border="radius"]').exists()).toBe(false);
    await wrapper.find('button[data-cx-style-border-side="all"]').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('input[data-cx-style-border="radius"]').exists()).toBe(true);
    wrapper.destroy();
  });

  it('99.2.3.1 (vue2): backwards-compat — segmented default "全部" preserves all-sides behavior', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    const colorInput = wrapper.find<HTMLInputElement>('input[data-cx-style-border="color"]');
    colorInput.element.value = '#aabbcc';
    await colorInput.trigger('input');
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
    expect(payload.style.borderColor).toBe('#aabbcc');
    expect(payload.style.borderTopColor).toBeNull();
    const refreshedCell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((refreshedCell.element as HTMLElement).style.borderColor).toBe('#aabbcc');
    wrapper.destroy();
  });

  it('99.2.3.1 (vue2): mixed all-sides + per-side — cell renders both inline', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    const allColor = wrapper.find<HTMLInputElement>('input[data-cx-style-border="color"]');
    allColor.element.value = '#000000';
    await allColor.trigger('input');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    handle.openCellStyleEditor('r1', 'name');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-tab="border"]').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-border-side="top"]').trigger('click');
    await wrapper.vm.$nextTick();
    const topColor = wrapper.find<HTMLInputElement>('input[data-cx-style-border="color"]');
    topColor.element.value = '#ff0000';
    await topColor.trigger('input');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    const refreshedCell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    const cellEl = refreshedCell.element as HTMLElement;
    expect(cellEl.style.borderTopColor).toBe('#ff0000');
    expect(cellEl.style.borderRightColor).toBe('#000000');
    expect(cellEl.style.borderBottomColor).toBe('#000000');
    expect(cellEl.style.borderLeftColor).toBe('#000000');
    wrapper.destroy();
  });
});

describe('Phase 99.2.3.2: borderColor HSV picker (vue2)', () => {
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

  it('99.2.3.2 (vue2): HSV disclosure visible on border tab; collapsed by default; square + hue strip render', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    wrapper.destroy();
  });

  it('99.2.3.2 (vue2): HSV square pointerdown at top-right commits #ff0000; Apply emits red', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    wrapper.destroy();
  });

  it('99.2.3.2 (vue2): hex input typing syncs HSV picker RGB inputs', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    const colorInput = wrapper.find<HTMLInputElement>('input[data-cx-style-border="color"]');
    colorInput.element.value = '#3b82f6';
    await colorInput.trigger('input');
    await wrapper.vm.$nextTick();
    const rgbInputs = wrapper.findAll('input[data-cx-style-border-rgb]');
    expect((rgbInputs.at(0).element as HTMLInputElement).value).toBe('59');
    expect((rgbInputs.at(1).element as HTMLInputElement).value).toBe('130');
    expect((rgbInputs.at(2).element as HTMLInputElement).value).toBe('246');
    wrapper.destroy();
  });

  it('99.2.3.2 (vue2): with target="top", HSV picker writes to borderTopColor; Apply emits per-side', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    wrapper.destroy();
  });
});

describe('Phase 99.2.4: controlled-mode cell-style prop (vue2)', () => {
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

  it('99.2.4 (vue2): uncontrolled (default) — Apply mutates internal + cell renders override + emit fires', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    const hexInput = wrapper.find<HTMLInputElement>('input[data-cx-style-hex]');
    hexInput.element.value = '#3b82f6';
    await hexInput.trigger('input');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    const refreshedCell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((refreshedCell.element as HTMLElement).style.backgroundColor).toBe('#3b82f6');
    expect(wrapper.emitted('cell-style-change')).toBeTruthy();
    wrapper.destroy();
  });

  it('99.2.4 (vue2): controlled (prop={}) — Apply does NOT mutate internal; emit fires; cell renders no override', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    const hexInput = wrapper.find<HTMLInputElement>('input[data-cx-style-hex]');
    hexInput.element.value = '#3b82f6';
    await hexInput.trigger('input');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    const refreshedCell = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((refreshedCell.element as HTMLElement).style.backgroundColor).toBe('');
    const emitted = wrapper.emitted('cell-style-change') as
      | readonly (readonly {
          rowId: string;
          colId: string;
          style: { backgroundColor?: string | null };
        }[])[]
      | undefined;
    expect(emitted![0]![0]!.style.backgroundColor).toBe('#3b82f6');
    wrapper.destroy();
  });

  it('99.2.4 (vue2): controlled with one entry — cell renderer reads from prop', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    wrapper.destroy();
  });

  it('99.2.4 (vue2): controlled + consumer updates prop on emit — cell re-renders with new value', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    const hexInput = wrapper.find<HTMLInputElement>('input[data-cx-style-hex]');
    hexInput.element.value = '#f59e0b';
    await hexInput.trigger('input');
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-cx-style-action="apply"]').trigger('click');
    await wrapper.vm.$nextTick();
    const refreshedBefore = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((refreshedBefore.element as HTMLElement).style.backgroundColor).toBe('');
    await wrapper.setProps({
      cellStyleByRowIdColId: { r1: { name: { backgroundColor: '#f59e0b' } } },
    });
    await wrapper.vm.$nextTick();
    const refreshedAfter = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((refreshedAfter.element as HTMLElement).style.backgroundColor).toBe('#f59e0b');
    wrapper.destroy();
  });

  it('99.2.4 (vue2): switching controlled → uncontrolled — internal map shows last uncontrolled state', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
        columns: CELL_STYLE_COLUMNS,
        rows: CELL_STYLE_ROWS,
        enableCellStyleEditor: true,
        cellStyleByRowIdColId: { r1: { name: { backgroundColor: '#ef4444' } } },
      },
      attachTo: document.body,
    });
    await wrapper.vm.$nextTick();
    const cellControlled = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((cellControlled.element as HTMLElement).style.backgroundColor).toBe('#ef4444');
    await wrapper.setProps({ cellStyleByRowIdColId: undefined });
    await wrapper.vm.$nextTick();
    const cellUncontrolled = wrapper.find('.cx-table-cell[data-row-id="r1"][data-col-id="name"]');
    expect((cellUncontrolled.element as HTMLElement).style.backgroundColor).toBe('');
    wrapper.destroy();
  });
});

describe('Phase 99.2.5: color palette + recent colors (vue2)', () => {
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

  it('99.2.5 (vue2): 12 preset swatches render by default; recent row hidden initially', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    wrapper.destroy();
  });

  it('99.2.5 (vue2): clicking preset swatch updates HEX input', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    const hexInput = wrapper.find<HTMLInputElement>('input[data-cx-style-hex]');
    expect(hexInput.element.value).toBe('#60a5fa');
    wrapper.destroy();
  });

  it('99.2.5 (vue2): Apply pushes to recent; subsequent open shows recent row with 1 swatch', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    const cell2 = wrapper.find('.cx-table-cell[data-row-id="r2"][data-col-id="name"]');
    stubCellRect(cell2.element as HTMLElement, { left: 50, top: 130, bottom: 158 });
    handle.openCellStyleEditor('r2', 'name');
    await wrapper.vm.$nextTick();
    const recentSection = wrapper.find('[data-cx-style-palette-section="recent"]');
    expect(recentSection.exists()).toBe(true);
    const recentSwatches = wrapper.findAll('button[data-cx-style-palette-recent]');
    expect(recentSwatches.length).toBe(1);
    expect(recentSwatches.at(0).attributes('data-cx-style-palette-recent')).toBe('#60a5fa');
    wrapper.destroy();
  });

  it('99.2.5 (vue2): applying 6 distinct colors caps recent at default limit 5', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    expect(recentSwatches.at(0).attributes('data-cx-style-palette-recent')).toBe('#60a5fa');
    let foundOldest = false;
    for (let i = 0; i < recentSwatches.length; i++) {
      if (recentSwatches.at(i).attributes('data-cx-style-palette-recent') === '#f87171') {
        foundOldest = true;
        break;
      }
    }
    expect(foundOldest).toBe(false);
    wrapper.destroy();
  });

  it('99.2.5 (vue2): applying same color twice leaves recent at length 1 (dedup)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    expect(recentSwatches.at(0).attributes('data-cx-style-palette-recent')).toBe('#f87171');
    wrapper.destroy();
  });
});

describe('Phase 99.2.2.2: variable font-weight slider (vue2)', () => {
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

  it('99.2.2.2 (vue2): variable-weight slider visible; collapsed by default; readout 400 (default)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    wrapper.destroy();
  });

  it('99.2.2.2 (vue2): pointerdown at track midpoint (50%) sets fontWeight to "501" (Math.round half-up)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    await track.trigger('pointerdown', { clientX: 90, pointerId: 1 });
    await wrapper.vm.$nextTick();
    const readout = wrapper.find('[data-cx-style-font-weight-slider-readout]');
    expect(readout.text()).toBe('501');
    wrapper.destroy();
  });

  it('99.2.2.2 (vue2): pointerdown at left edge sets "1"; at right edge sets "1000"', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    await track.trigger('pointerup', { clientX: 0, pointerId: 1 });
    await wrapper.vm.$nextTick();
    track = wrapper.find('[data-cx-style-font-weight-slider-track]');
    stubTrackRect(track.element as HTMLElement, 180);
    await track.trigger('pointerdown', { clientX: 180, pointerId: 1 });
    await wrapper.vm.$nextTick();
    readout = wrapper.find('[data-cx-style-font-weight-slider-readout]');
    expect(readout.text()).toBe('1000');
    wrapper.destroy();
  });

  it('99.2.2.2 (vue2): Apply with slider-picked 425 emits fontWeight "425" + cell renders inline 425', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    wrapper.destroy();
  });
});

describe('Phase 45: server-side row model (vue2)', () => {
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

  it('rowModelType:"serverSide" + serverSideDataSource mounts without consuming props.rows (vue2)', async () => {
    const { source, calls } = makeControlledSource();
    const wrapper = mount(TableForTest, {
      propsData: {
        columns,
        rows: [],
        rowModelType: 'serverSide',
        serverSideDataSource: source,
        cacheBlockSize: 5,
      },
    });
    await flush();
    expect(wrapper.find('.cx-table-wrapper').exists()).toBe(true);
    // Phase 45.4 (2026-05-31 — vue2 port): bootstrap fires getRowAt(0).
    expect(calls.length).toBe(1);
    expect(calls[0]?.params.startRow).toBe(0);
  });

  it('skeleton rows not present before any block resolves (vue2)', async () => {
    const { source } = makeControlledSource();
    const wrapper = mount(TableForTest, {
      propsData: {
        columns,
        rows: [],
        rowModelType: 'serverSide',
        serverSideDataSource: source,
        cacheBlockSize: 5,
      },
    });
    await flush();
    expect(wrapper.findAll('.cx-table-row--skeleton').length).toBe(0);
  });

  it('refreshServerSideRows TableHandle method is exposed (vue2)', () => {
    const { source } = makeControlledSource();
    const wrapper = mount(TableForTest, {
      propsData: {
        columns,
        rows: [],
        rowModelType: 'serverSide',
        serverSideDataSource: source,
      },
    });
    const handle = wrapper.vm as unknown as { refreshServerSideRows(): void };
    expect(() => handle.refreshServerSideRows()).not.toThrow();
  });

  it('getServerSideBlockState returns idle for never-touched blocks (vue2)', () => {
    const { source } = makeControlledSource();
    const wrapper = mount(TableForTest, {
      propsData: {
        columns,
        rows: [],
        rowModelType: 'serverSide',
        serverSideDataSource: source,
      },
    });
    const handle = wrapper.vm as unknown as {
      getServerSideBlockState(blockIndex: number): BlockState;
    };
    // Phase 45.4: block 0 LOADING (bootstrap); block 99 untouched.
    expect(handle.getServerSideBlockState(0).kind).toBe('loading');
    expect(handle.getServerSideBlockState(99).kind).toBe('idle');
  });

  it('switching from serverSide → clientSide destroys the session (vue2)', async () => {
    const { source, destroyCount } = makeControlledSource();
    const wrapper = mount(TableForTest, {
      propsData: {
        columns,
        rows: [],
        rowModelType: 'serverSide',
        serverSideDataSource: source,
      },
    });
    expect(destroyCount.value).toBe(0);
    void wrapper.setProps({ rowModelType: 'clientSide', rows });
    await flush();
    expect(destroyCount.value).toBe(1);
  });

  it('clientSide mode (default) leaves rows pipeline untouched (vue2)', () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
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

describe('Phase 45.1 + 45.2: server-side refinements (vue2)', () => {
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

  it('45.1: paginationEnabled + serverSide mounts without throwing (vue2)', async () => {
    const { source, calls } = makeControlledSource();
    const wrapper = mount(TableForTest, {
      propsData: {
        columns,
        rows: [],
        rowModelType: 'serverSide',
        serverSideDataSource: source,
        paginationEnabled: true,
        initialPageSize: 25,
      },
    });
    await flush();
    expect(wrapper.find('.cx-table-wrapper').exists()).toBe(true);
    // Phase 45.4 bootstrap fires getRowAt(0) → block 0 dispatch with
    // endRow=startRow+pageSize (per Phase 45.1 Decision A.1).
    expect(calls.length).toBe(1);
    const firstCall = calls[0]!;
    expect(firstCall.params.endRow - firstCall.params.startRow).toBe(25);
  });

  it('45.1: setPageSize re-creates session with new pageSize (vue2)', async () => {
    const { source } = makeControlledSource();
    const wrapper = mount(TableForTest, {
      propsData: {
        columns,
        rows: [],
        rowModelType: 'serverSide',
        serverSideDataSource: source,
        paginationEnabled: true,
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
    expect(handle.getServerSideTotalRowCount()).toBe(0);
  });

  it('45.1: setPageSize emits page-change with new pageSize (vue2)', async () => {
    const { source } = makeControlledSource();
    const wrapper = mount(TableForTest, {
      propsData: {
        columns,
        rows: [],
        rowModelType: 'serverSide',
        serverSideDataSource: source,
        paginationEnabled: true,
        initialPageSize: 10,
      },
    });
    await flush();
    const handle = wrapper.vm as unknown as { setPageSize(n: number): void };
    handle.setPageSize(50);
    const events = wrapper.emitted('page-change') as
      | [{ page: number; pageSize: number }][]
      | undefined;
    expect(events).toBeTruthy();
    expect(events!.length).toBe(1);
    expect(events![0]![0]).toEqual({ page: 0, pageSize: 50 });
  });

  it('45.2: invalidateServerSideBlocks([0]) returns block 0 to idle (Phase 45.4 bootstrap → loading → invalidate → idle) (vue2)', async () => {
    const { source, calls } = makeControlledSource();
    const wrapper = mount(TableForTest, {
      propsData: {
        columns,
        rows: [],
        rowModelType: 'serverSide',
        serverSideDataSource: source,
        cacheBlockSize: 10,
      },
    });
    await flush();
    // Phase 45.4 bootstrap fires getRowAt(0) → LOADING.
    expect(calls.length).toBe(1);
    const handle = wrapper.vm as unknown as {
      invalidateServerSideBlocks(idx: readonly number[]): void;
      getServerSideBlockState(b: number): BlockState;
    };
    expect(handle.getServerSideBlockState(0).kind).toBe('loading');
    handle.invalidateServerSideBlocks([0]);
    expect(handle.getServerSideBlockState(0).kind).toBe('idle');
  });

  it('45.2: invalidateServerSideBlocks([]) is a silent no-op (vue2)', () => {
    const { source } = makeControlledSource();
    const wrapper = mount(TableForTest, {
      propsData: {
        columns,
        rows: [],
        rowModelType: 'serverSide',
        serverSideDataSource: source,
      },
    });
    const handle = wrapper.vm as unknown as {
      invalidateServerSideBlocks(idx: readonly number[]): void;
    };
    expect(() => handle.invalidateServerSideBlocks([])).not.toThrow();
  });

  it('45.2: invalidateServerSideBlocks is no-op when clientSide (vue2)', () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    const handle = wrapper.vm as unknown as {
      invalidateServerSideBlocks(idx: readonly number[]): void;
    };
    expect(() => handle.invalidateServerSideBlocks([0, 1, 2])).not.toThrow();
  });
});

describe('Phase 45.3 + 45.4: viewport-driven dispatch + bootstrap (vue2)', () => {
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

  it('45.4: session setup fires getRowAt(0) bootstrap at mount (vue2)', async () => {
    const { source, calls } = makeControlledSource();
    mount(TableForTest, {
      propsData: {
        columns,
        rows: [],
        rowModelType: 'serverSide',
        serverSideDataSource: source,
        cacheBlockSize: 100,
      },
    });
    await flush();
    expect(calls.length).toBe(1);
    expect(calls[0]?.params.startRow).toBe(0);
    expect(calls[0]?.params.endRow).toBe(100);
  });

  it('45.4: bootstrap fires for paginated serverSide mode (vue2)', async () => {
    const { source, calls } = makeControlledSource();
    mount(TableForTest, {
      propsData: {
        columns,
        rows: [],
        rowModelType: 'serverSide',
        serverSideDataSource: source,
        paginationEnabled: true,
        initialPageSize: 25,
      },
    });
    await flush();
    expect(calls.length).toBe(1);
    expect(calls[0]?.params.endRow).toBe(25);
  });

  it('45.4: clientSide mode does NOT bootstrap (vue2)', async () => {
    const { source, calls } = makeControlledSource();
    mount(TableForTest, {
      propsData: { columns, rows, rowModelType: 'clientSide', serverSideDataSource: source },
    });
    await flush();
    expect(calls.length).toBe(0);
  });

  it('45.3: non-paginated mode does NOT dispatch off-screen blocks after bootstrap resolves (vue2)', async () => {
    const { source, calls } = makeControlledSource();
    mount(TableForTest, {
      propsData: {
        columns,
        rows: [],
        rowModelType: 'serverSide',
        serverSideDataSource: source,
        cacheBlockSize: 10,
      },
    });
    await flush();
    expect(calls.length).toBe(1);
    const rows0 = Array.from({ length: 10 }, (_, i) => ({ id: `r${i}`, data: { name: `r${i}` } }));
    calls[0]?.resolve({ rows: rows0, totalRowCount: 1000 });
    await flush();
    // Pre-Phase-45.3 this would be ~100 dispatches.
    expect(calls.length).toBeLessThanOrEqual(5);
  });

  it('45.3: paginated mode viewport effect is gated off (vue2)', async () => {
    const { source, calls } = makeControlledSource();
    mount(TableForTest, {
      propsData: {
        columns,
        rows: [],
        rowModelType: 'serverSide',
        serverSideDataSource: source,
        paginationEnabled: true,
        initialPageSize: 25,
      },
    });
    await flush();
    expect(calls.length).toBe(1);
    const rows0 = Array.from({ length: 25 }, (_, i) => ({ id: `r${i}`, data: { name: `r${i}` } }));
    calls[0]?.resolve({ rows: rows0, totalRowCount: 1000 });
    await flush();
    expect(calls.length).toBe(1);
  });

  it('45.3 + 45.4: after bootstrap resolves, synthesized rows render real rows (vue2)', async () => {
    const { source, calls } = makeControlledSource();
    const wrapper = mount(TableForTest, {
      propsData: {
        columns,
        rows: [],
        rowModelType: 'serverSide',
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
    expect(wrapper.findAll('.cx-table-row--skeleton').length).toBe(0);
    wrapper.destroy();
  });
});

describe('Phase 45.5: server-side anticipatory prefetch (vue2)', () => {
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

  // Phase 45.5 vue2 tests drive scroll via Object.defineProperty +
  // dispatchEvent('scroll'); verbatim mirror of vue3 helper.
  function seedAndScroll(wrapper: ReturnType<typeof mount>, scrollTop: number): void {
    const bodyEl = wrapper.find('.cx-table-body').element as HTMLElement;
    Object.defineProperty(bodyEl, 'clientHeight', { value: 100, configurable: true });
    bodyEl.scrollTop = scrollTop;
    bodyEl.dispatchEvent(new Event('scroll'));
  }

  it('45.5: default serverSidePrefetchAheadBlocks (=0) does NOT prefetch beyond visible range (vue2)', async () => {
    const { source, calls } = makeControlledSource();
    const wrapper = mount(TableForTest, {
      propsData: {
        columns,
        rows: [],
        rowModelType: 'serverSide',
        serverSideDataSource: source,
        cacheBlockSize: 10,
      },
      attachTo: document.body,
    });
    await flush();
    const rows0 = Array.from({ length: 10 }, (_, i) => ({ id: `r${i}`, data: { name: `r${i}` } }));
    calls[0]?.resolve({ rows: rows0, totalRowCount: 1000 });
    await flush();
    const baseline = calls.length;
    seedAndScroll(wrapper, 1000);
    await flush();
    const newDispatches = calls.length - baseline;
    expect(newDispatches).toBeLessThanOrEqual(4);
    wrapper.destroy();
  });

  it('45.5: serverSidePrefetchAheadBlocks=2 + scroll DOWN fires forward-block prefetches (vue2)', async () => {
    const { source, calls } = makeControlledSource();
    const wrapper = mount(TableForTest, {
      propsData: {
        columns,
        rows: [],
        rowModelType: 'serverSide',
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
    seedAndScroll(wrapper, 0);
    await flush();
    const baselineAfterInitial = calls.length;
    seedAndScroll(wrapper, 1500);
    await flush();
    const downDispatches = calls.length - baselineAfterInitial;
    expect(downDispatches).toBeGreaterThanOrEqual(4);
    const dispatchedStartRows = calls.slice(baselineAfterInitial).map((c) => c.params.startRow);
    expect(Math.max(...dispatchedStartRows)).toBeGreaterThan(50);
    wrapper.destroy();
  });

  it('45.5: serverSidePrefetchAheadBlocks=2 + scroll UP fires backward-block prefetches (vue2)', async () => {
    const { source, calls } = makeControlledSource();
    const wrapper = mount(TableForTest, {
      propsData: {
        columns,
        rows: [],
        rowModelType: 'serverSide',
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
    seedAndScroll(wrapper, 3000);
    await flush();
    const baselineAfterDown = calls.length;
    seedAndScroll(wrapper, 1000);
    await flush();
    const upDispatches = calls.slice(baselineAfterDown);
    const startRows = upDispatches.map((c) => c.params.startRow);
    expect(startRows.length).toBeGreaterThan(0);
    expect(Math.min(...startRows)).toBeLessThan(40);
    wrapper.destroy();
  });

  it('45.5: stationary viewport does NOT trigger prefetch on serverSideVersion bump (vue2)', async () => {
    const { source, calls } = makeControlledSource();
    const wrapper = mount(TableForTest, {
      propsData: {
        columns,
        rows: [],
        rowModelType: 'serverSide',
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
    seedAndScroll(wrapper, 500);
    await flush();
    const baselineAfterScroll = calls.length;
    const remaining = calls.slice(1);
    if (remaining.length > 0) {
      const blockRows = Array.from({ length: 10 }, (_, i) => ({
        id: `bk${i}`,
        data: { name: `bk${i}` },
      }));
      remaining[0]?.resolve({ rows: blockRows, totalRowCount: 1000 });
      await flush();
    }
    const postBumpNew = calls.length - baselineAfterScroll;
    expect(postBumpNew).toBeLessThanOrEqual(1);
    wrapper.destroy();
  });

  it('45.5: paginationEnabled=true ignores serverSidePrefetchAheadBlocks prop (vue2)', async () => {
    const { source, calls } = makeControlledSource();
    const wrapper = mount(TableForTest, {
      propsData: {
        columns,
        rows: [],
        rowModelType: 'serverSide',
        serverSideDataSource: source,
        paginationEnabled: true,
        initialPageSize: 10,
        serverSidePrefetchAheadBlocks: 5,
      },
      attachTo: document.body,
    });
    await flush();
    expect(calls.length).toBe(1);
    const rows0 = Array.from({ length: 10 }, (_, i) => ({ id: `r${i}`, data: { name: `r${i}` } }));
    calls[0]?.resolve({ rows: rows0, totalRowCount: 1000 });
    await flush();
    seedAndScroll(wrapper, 1000);
    await flush();
    expect(calls.length).toBe(1);
    wrapper.destroy();
  });
});

describe('Phase 46: Tier 3 finale (vue2)', () => {
  it('46-A: ColumnSpec.rowNumber:true renders displayed-position index (1-based)', () => {
    const numberedColumns: readonly ColumnSpec[] = [
      { id: 'num', headerName: '#', width: 60, rowNumber: true },
      ...columns,
    ];
    const wrapper = mount(TableForTest, { propsData: { columns: numberedColumns, rows } });
    const numberCells = wrapper.findAll('.cx-table-cell--row-number');
    expect(numberCells.length).toBeGreaterThanOrEqual(3);
    expect(numberCells.at(0)?.text()).toBe('1');
    expect(numberCells.at(1)?.text()).toBe('2');
    expect(numberCells.at(2)?.text()).toBe('3');
  });

  it('46-B: ColumnSpec.actions renders one <button> per RowAction with data-action-id', () => {
    const actionsColumns: readonly ColumnSpec[] = [
      ...columns,
      {
        id: 'actions',
        headerName: 'Actions',
        width: 160,
        actions: [
          { id: 'edit', label: '编辑', onClick: () => undefined },
          {
            id: 'delete',
            label: '删除',
            disabled: (r) => r.id === 'r2',
            onClick: () => undefined,
          },
        ],
      },
    ];
    const wrapper = mount(TableForTest, { propsData: { columns: actionsColumns, rows } });
    const editButtons = wrapper.findAll('[data-action-id="edit"]');
    expect(editButtons.length).toBe(3);
    const deleteButtons = wrapper.findAll('[data-action-id="delete"]');
    expect(deleteButtons.length).toBe(3);
    expect((deleteButtons.at(1)?.element as HTMLButtonElement | undefined)?.disabled).toBe(true);
    expect((deleteButtons.at(0)?.element as HTMLButtonElement | undefined)?.disabled).toBe(false);
  });

  it('46-B: clicking an action button fires onClick(row)', async () => {
    const clicks: { id: string; rowId: string }[] = [];
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
    const wrapper = mount(TableForTest, { propsData: { columns: actionsColumns, rows } });
    const firstArchive = wrapper.find('[data-action-id="archive"]');
    await firstArchive.trigger('click');
    expect(clicks.length).toBe(1);
    expect(clicks[0]).toEqual({ id: 'archive', rowId: 'r1' });
  });

  it('46-C: enableRowAutoHeight:true adds cx-table-row--auto-height + wrapText cells get modifier (vue2)', () => {
    const wrapColumns: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', headerName: 'ID', width: 80 },
      { id: 'note', field: 'note', headerName: '备注', wrapText: true, flex: 1 },
    ];
    const wrapper = mount(TableForTest, {
      propsData: {
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

describe('Phase 80: tool-panel container (vue2)', () => {
  const panelConfig = {
    show: true,
    panels: [
      { id: 'info', label: 'Info', icon: 'ⓘ', renderer: () => h('div', 'info content') },
      { id: 'help', label: 'Help', icon: '?', renderer: () => h('div', 'help content') },
    ],
  } as const;

  it('80-1: show:true + non-empty panels renders the container with icon rail (vue2)', () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, toolPanel: panelConfig },
    });
    expect(wrapper.find('.cx-table-with-tool-panel').exists()).toBe(true);
    expect(wrapper.find('.cx-table-tool-panel-container').exists()).toBe(true);
    expect(wrapper.find('.cx-table-tool-panel-rail').exists()).toBe(true);
    const icons = wrapper.findAll('button[data-tool-panel-id]');
    expect(icons.length).toBe(2);
  });

  it('80-2: initialOpenId:info opens the info panel at mount + sets aria-selected=true (vue2)', () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, toolPanel: { ...panelConfig, initialOpenId: 'info' } },
    });
    expect(wrapper.find('.cx-table-tool-panel-content').exists()).toBe(true);
    const infoBtn = wrapper.find('button[data-tool-panel-id="info"]');
    expect(infoBtn.attributes('aria-selected')).toBe('true');
    const helpBtn = wrapper.find('button[data-tool-panel-id="help"]');
    expect(helpBtn.attributes('aria-selected')).toBe('false');
  });

  it('80-3: clicking an icon emits tool-panel-change + toggles the active panel (vue2)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, toolPanel: panelConfig },
    });
    await wrapper.find('button[data-tool-panel-id="info"]').trigger('click');
    const emits = wrapper.emitted('tool-panel-change');
    expect(emits).toBeTruthy();
    const last = (emits as [{ activePanelId: string | null }][] | undefined)?.[0]?.[0];
    expect(last?.activePanelId).toBe('info');
    expect(wrapper.find('button[data-tool-panel-id="info"]').attributes('aria-selected')).toBe(
      'true',
    );
    expect(wrapper.find('.cx-table-tool-panel-content').exists()).toBe(true);
  });

  it('80-4: clicking the active icon again closes the content area (vue2)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, toolPanel: { ...panelConfig, initialOpenId: 'info' } },
    });
    await wrapper.find('button[data-tool-panel-id="info"]').trigger('click');
    expect(wrapper.find('.cx-table-tool-panel-content').exists()).toBe(false);
    expect(wrapper.find('.cx-table-tool-panel-rail').exists()).toBe(true);
    expect(wrapper.find('button[data-tool-panel-id="info"]').attributes('aria-selected')).toBe(
      'false',
    );
  });

  it('80-5: toolPanel.side:left dock renders the rail on the left side (vue2)', () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, toolPanel: { ...panelConfig, side: 'left' } },
    });
    const root = wrapper.find('.cx-table-with-tool-panel');
    expect(root.attributes('data-tool-panel-side')).toBe('left');
    const container = wrapper.find('.cx-table-tool-panel-container');
    expect(container.attributes('data-tool-panel-side')).toBe('left');
  });
});

describe('<ChronixTable> — Phase 83-A column header menu (vue2)', () => {
  it('83A-1: showColumnHeaderMenu:true renders a ▾ button in each column header (vue2)', () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, showColumnHeaderMenu: true },
    });
    const buttons = wrapper.findAll('.cx-table-column-header-menu-button');
    expect(buttons.length).toBe(columns.length);
    expect(buttons.at(0).attributes('data-col-id')).toBe('id');
  });

  it('83A-2: showColumnHeaderMenu:false (default) renders no ▾ buttons (vue2)', () => {
    const wrapper = mount(TableForTest, { propsData: { columns, rows } });
    expect(wrapper.findAll('.cx-table-column-header-menu-button')).toHaveLength(0);
  });

  it('83A-3: clicking ▾ opens the menu; clicking another column closes the first (vue2)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, showColumnHeaderMenu: true },
    });
    await wrapper.find('.cx-table-column-header-menu-button[data-col-id="id"]').trigger('click');
    expect(wrapper.find('.cx-table-column-header-menu[data-col-id="id"]').exists()).toBe(true);
    await wrapper.find('.cx-table-column-header-menu-button[data-col-id="name"]').trigger('click');
    expect(wrapper.find('.cx-table-column-header-menu[data-col-id="id"]').exists()).toBe(false);
    expect(wrapper.find('.cx-table-column-header-menu[data-col-id="name"]').exists()).toBe(true);
  });

  it('83A-4: clicking Sort ASC dispatches setSort + emits column-header-menu-action (vue2)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, showColumnHeaderMenu: true },
    });
    await wrapper.find('.cx-table-column-header-menu-button[data-col-id="qty"]').trigger('click');
    await wrapper
      .find('.cx-table-column-header-menu[data-col-id="qty"] [data-action="sort-asc"]')
      .trigger('click');
    const events = wrapper.emitted('column-header-menu-action') ?? [];
    expect(events).toHaveLength(1);
    expect((events[0] as unknown as [{ colId: string; action: string }])[0]).toEqual({
      colId: 'qty',
      action: 'sort-asc',
    });
    const sortEvents = wrapper.emitted('sort-change') ?? [];
    expect(sortEvents.length).toBeGreaterThanOrEqual(1);
  });

  it('83A-5: column.sortable:false disables Sort items in the menu (vue2)', async () => {
    const nonSortableColumns: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', headerName: 'ID', width: 80, sortable: false },
      { id: 'name', field: 'name', headerName: '名称', flex: 1 },
    ];
    const wrapper = mount(TableForTest, {
      propsData: { columns: nonSortableColumns, rows, showColumnHeaderMenu: true },
    });
    await wrapper.find('.cx-table-column-header-menu-button[data-col-id="id"]').trigger('click');
    const ascItem = wrapper.find(
      '.cx-table-column-header-menu[data-col-id="id"] [data-action="sort-asc"]',
    );
    expect((ascItem.element as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('<ChronixTable> — Phase 83-B cell context menu (vue2)', () => {
  it('83B-1: right-click on a cell opens the menu at cursor coords (vue2)', async () => {
    const onClick = vi.fn();
    const wrapper = mount(TableForTest, {
      propsData: {
        columns,
        rows,
        contextMenu: { items: [{ id: 'a', label: 'Action A', onClick }] },
      },
      attachToDocument: true,
    });
    const firstCell = wrapper.find('[data-row-id="r1"][data-col-id="name"]');
    await firstCell.trigger('contextmenu', { clientX: 120, clientY: 80 });
    const overlay = wrapper.find('[data-testid="cx-cell-context-menu"]');
    expect(overlay.exists()).toBe(true);
    expect(overlay.attributes('style')).toContain('left: 120px');
    expect(overlay.attributes('style')).toContain('top: 80px');
    wrapper.destroy();
  });

  it('83B-2: contextMenu:null renders no overlay even on right-click (vue2)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows },
      attachToDocument: true,
    });
    await wrapper
      .find('[data-row-id="r1"][data-col-id="name"]')
      .trigger('contextmenu', { clientX: 50, clientY: 50 });
    expect(wrapper.find('[data-testid="cx-cell-context-menu"]').exists()).toBe(false);
    wrapper.destroy();
  });

  it('83B-3: clicking a menu item fires onClick + closes the menu (vue2)', async () => {
    const onClick = vi.fn();
    const wrapper = mount(TableForTest, {
      propsData: {
        columns,
        rows,
        contextMenu: { items: [{ id: 'inspect', label: 'Inspect', onClick }] },
      },
      attachToDocument: true,
    });
    await wrapper
      .find('[data-row-id="r2"][data-col-id="qty"]')
      .trigger('contextmenu', { clientX: 200, clientY: 150 });
    expect(wrapper.find('[data-testid="cx-cell-context-menu"]').exists()).toBe(true);
    await wrapper.find('[data-item-id="inspect"]').trigger('click');
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith({ rowId: 'r2', colId: 'qty' });
    expect(wrapper.find('[data-testid="cx-cell-context-menu"]').exists()).toBe(false);
    wrapper.destroy();
  });

  it('83B-4: disabled?(ctx) === true disables the item; clicking is a no-op (vue2)', async () => {
    const onClick = vi.fn();
    const wrapper = mount(TableForTest, {
      propsData: {
        columns,
        rows,
        contextMenu: {
          items: [{ id: 'guarded', label: 'Guarded', disabled: () => true, onClick }],
        },
      },
      attachToDocument: true,
    });
    await wrapper
      .find('[data-row-id="r1"][data-col-id="name"]')
      .trigger('contextmenu', { clientX: 100, clientY: 100 });
    const button = wrapper.find('[data-item-id="guarded"]');
    expect((button.element as HTMLButtonElement).disabled).toBe(true);
    await button.trigger('click');
    expect(onClick).not.toHaveBeenCalled();
    wrapper.destroy();
  });
});

describe('Phase 84: Phase 80 tool-panel tablist keyboard nav (vue2)', () => {
  const panelConfig = {
    show: true,
    panels: [
      { id: 'info', label: 'Info', icon: 'ⓘ', renderer: () => h('div', 'info content') },
      { id: 'help', label: 'Help', icon: '?', renderer: () => h('div', 'help content') },
      { id: 'theme', label: 'Theme', icon: '🎨', renderer: () => h('div', 'theme content') },
    ],
  } as const;

  it('84-tablist-1: each tab renders data-menu-item-index and a roving tabindex (vue2)', () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, toolPanel: panelConfig },
    });
    const tabs = wrapper.findAll('button[data-tool-panel-id]');
    expect(tabs.length).toBe(3);
    expect(tabs.at(0).attributes('data-menu-item-index')).toBe('0');
    expect(tabs.at(2).attributes('data-menu-item-index')).toBe('2');
    expect(tabs.at(0).attributes('tabindex')).toBe('0');
    expect(tabs.at(1).attributes('tabindex')).toBe('-1');
    wrapper.destroy();
  });

  it('84-tablist-2: ArrowDown moves tabindex+focus to the next tab (vue2)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, toolPanel: panelConfig },
      attachTo: document.body,
    });
    const rail = wrapper.find('.cx-table-tool-panel-rail');
    await rail.trigger('keydown', { key: 'ArrowDown' });
    await wrapper.vm.$nextTick();
    const tabs = wrapper.findAll('button[data-tool-panel-id]');
    expect(tabs.at(1).attributes('tabindex')).toBe('0');
    expect(document.activeElement).toBe(tabs.at(1).element);
    wrapper.destroy();
  });

  it('84-tablist-3: ArrowUp at first tab wraps to last (vue2)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, toolPanel: panelConfig },
      attachTo: document.body,
    });
    const rail = wrapper.find('.cx-table-tool-panel-rail');
    await rail.trigger('keydown', { key: 'ArrowUp' });
    await wrapper.vm.$nextTick();
    const tabs = wrapper.findAll('button[data-tool-panel-id]');
    expect(tabs.at(2).attributes('tabindex')).toBe('0');
    wrapper.destroy();
  });

  it('84-tablist-4: Home + End jump to first / last tab (vue2)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, toolPanel: panelConfig },
      attachTo: document.body,
    });
    const rail = wrapper.find('.cx-table-tool-panel-rail');
    await rail.trigger('keydown', { key: 'End' });
    await wrapper.vm.$nextTick();
    let tabs = wrapper.findAll('button[data-tool-panel-id]');
    expect(tabs.at(2).attributes('tabindex')).toBe('0');
    await rail.trigger('keydown', { key: 'Home' });
    await wrapper.vm.$nextTick();
    tabs = wrapper.findAll('button[data-tool-panel-id]');
    expect(tabs.at(0).attributes('tabindex')).toBe('0');
    wrapper.destroy();
  });

  it('84-tablist-5: Enter on a focused tab activates it via the existing click handler (vue2)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, toolPanel: panelConfig },
      attachTo: document.body,
    });
    const rail = wrapper.find('.cx-table-tool-panel-rail');
    await rail.trigger('keydown', { key: 'ArrowDown' });
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-tool-panel-id="help"]').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('button[data-tool-panel-id="help"]').attributes('aria-selected')).toBe(
      'true',
    );
    wrapper.destroy();
  });

  it('84-tablist-6: empty tablist (toolPanel.show=false) ships no tablist DOM (vue2)', () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, toolPanel: { show: false, panels: [] as never[] } },
    });
    expect(wrapper.find('.cx-table-tool-panel-rail').exists()).toBe(false);
    wrapper.destroy();
  });
});

describe('Phase 84: Phase 83-A column header menu keyboard nav (vue2)', () => {
  it('84-header-1: opened menu items render data-menu-item-index 0..4 (vue2)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, showColumnHeaderMenu: true },
    });
    await wrapper.find('.cx-table-column-header-menu-button[data-col-id="qty"]').trigger('click');
    const items = wrapper
      .find('.cx-table-column-header-menu[data-col-id="qty"]')
      .findAll('.cx-table-column-header-menu-item');
    expect(items.length).toBe(5);
    expect(items.at(0).attributes('data-menu-item-index')).toBe('0');
    expect(items.at(4).attributes('data-menu-item-index')).toBe('4');
    wrapper.destroy();
  });

  it('84-header-2: first non-disabled item has tabindex=0 on open (vue2)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, showColumnHeaderMenu: true },
    });
    await wrapper.find('.cx-table-column-header-menu-button[data-col-id="qty"]').trigger('click');
    const items = wrapper
      .find('.cx-table-column-header-menu[data-col-id="qty"]')
      .findAll('.cx-table-column-header-menu-item');
    expect(items.at(0).attributes('tabindex')).toBe('0');
    expect(items.at(1).attributes('tabindex')).toBe('-1');
    wrapper.destroy();
  });

  it('84-header-3: ArrowDown moves tabindex to next item; ArrowUp wraps to last (vue2)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, showColumnHeaderMenu: true },
      attachTo: document.body,
    });
    await wrapper.find('.cx-table-column-header-menu-button[data-col-id="qty"]').trigger('click');
    const menu = wrapper.find('.cx-table-column-header-menu[data-col-id="qty"]');
    await menu.trigger('keydown', { key: 'ArrowDown' });
    await wrapper.vm.$nextTick();
    let items = menu.findAll('.cx-table-column-header-menu-item');
    expect(items.at(1).attributes('tabindex')).toBe('0');
    await menu.trigger('keydown', { key: 'ArrowUp' });
    await menu.trigger('keydown', { key: 'ArrowUp' });
    await wrapper.vm.$nextTick();
    items = menu.findAll('.cx-table-column-header-menu-item');
    expect(items.at(4).attributes('tabindex')).toBe('0');
    wrapper.destroy();
  });

  it('84-header-4: disabled Clear Sort skipped during ArrowDown nav (vue2)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, showColumnHeaderMenu: true },
      attachTo: document.body,
    });
    await wrapper.find('.cx-table-column-header-menu-button[data-col-id="qty"]').trigger('click');
    const menu = wrapper.find('.cx-table-column-header-menu[data-col-id="qty"]');
    await menu.trigger('keydown', { key: 'ArrowDown' });
    await menu.trigger('keydown', { key: 'ArrowDown' });
    await wrapper.vm.$nextTick();
    const items = menu.findAll('.cx-table-column-header-menu-item');
    expect(items.at(3).attributes('tabindex')).toBe('0');
    expect(items.at(2).attributes('tabindex')).toBe('-1');
    wrapper.destroy();
  });

  it('84-header-5: Home jumps to first enabled, End jumps to last enabled (vue2)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, showColumnHeaderMenu: true },
      attachTo: document.body,
    });
    await wrapper.find('.cx-table-column-header-menu-button[data-col-id="qty"]').trigger('click');
    const menu = wrapper.find('.cx-table-column-header-menu[data-col-id="qty"]');
    await menu.trigger('keydown', { key: 'End' });
    await wrapper.vm.$nextTick();
    let items = menu.findAll('.cx-table-column-header-menu-item');
    expect(items.at(4).attributes('tabindex')).toBe('0');
    await menu.trigger('keydown', { key: 'Home' });
    await wrapper.vm.$nextTick();
    items = menu.findAll('.cx-table-column-header-menu-item');
    expect(items.at(0).attributes('tabindex')).toBe('0');
    wrapper.destroy();
  });

  it('84-header-6: opening a new column menu resets activeIndex to first enabled (vue2)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, showColumnHeaderMenu: true },
      attachTo: document.body,
    });
    await wrapper.find('.cx-table-column-header-menu-button[data-col-id="qty"]').trigger('click');
    const qtyMenu = wrapper.find('.cx-table-column-header-menu[data-col-id="qty"]');
    await qtyMenu.trigger('keydown', { key: 'End' });
    await wrapper.vm.$nextTick();
    await wrapper.find('.cx-table-column-header-menu-button[data-col-id="name"]').trigger('click');
    await wrapper.vm.$nextTick();
    const nameMenu = wrapper.find('.cx-table-column-header-menu[data-col-id="name"]');
    expect(nameMenu.exists()).toBe(true);
    const items = nameMenu.findAll('.cx-table-column-header-menu-item');
    expect(items.at(0).attributes('tabindex')).toBe('0');
    wrapper.destroy();
  });
});

describe('Phase 84: Phase 83-B cell context menu keyboard nav (vue2)', () => {
  const ctxConfig = {
    items: [
      { id: 'copy', label: 'Copy', onClick: vi.fn() },
      { id: 'inspect', label: 'Inspect', onClick: vi.fn() },
      { id: 'delete', label: 'Delete', onClick: vi.fn() },
    ],
  } as const;

  it('84-ctx-1: opening the menu lands tabindex=0 on first item (vue2)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, contextMenu: ctxConfig },
      attachTo: document.body,
    });
    await wrapper
      .find('[data-row-id="r1"][data-col-id="name"]')
      .trigger('contextmenu', { clientX: 100, clientY: 100 });
    await wrapper.vm.$nextTick();
    const items = wrapper.findAll('.cx-table-cell-context-menu-item');
    expect(items.length).toBe(3);
    expect(items.at(0).attributes('data-menu-item-index')).toBe('0');
    expect(items.at(0).attributes('tabindex')).toBe('0');
    expect(items.at(1).attributes('tabindex')).toBe('-1');
    wrapper.destroy();
  });

  it('84-ctx-2: ArrowDown moves tabindex to next item (vue2)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, contextMenu: ctxConfig },
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
    expect(items.at(1).attributes('tabindex')).toBe('0');
    wrapper.destroy();
  });

  it('84-ctx-3: ArrowDown skips disabled items (vue2)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
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
    expect(items.at(2).attributes('tabindex')).toBe('0');
    expect(items.at(1).attributes('tabindex')).toBe('-1');
    wrapper.destroy();
  });

  it('84-ctx-4: Home/End jump to first / last item (vue2)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, contextMenu: ctxConfig },
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
    expect(items.at(2).attributes('tabindex')).toBe('0');
    await menu.trigger('keydown', { key: 'Home' });
    await wrapper.vm.$nextTick();
    items = wrapper.findAll('.cx-table-cell-context-menu-item');
    expect(items.at(0).attributes('tabindex')).toBe('0');
    wrapper.destroy();
  });

  it('84-ctx-5: focus shifts to active item after ArrowDown (vue2)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, contextMenu: ctxConfig },
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
    expect(document.activeElement).toBe(items.at(1).element);
    wrapper.destroy();
  });

  it('84-ctx-6: closing then reopening resets activeIndex to first item (vue2)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, contextMenu: ctxConfig },
      attachTo: document.body,
    });
    await wrapper
      .find('[data-row-id="r1"][data-col-id="name"]')
      .trigger('contextmenu', { clientX: 100, clientY: 100 });
    await wrapper.vm.$nextTick();
    const menu1 = wrapper.find('[data-testid="cx-cell-context-menu"]');
    await menu1.trigger('keydown', { key: 'End' });
    await wrapper.vm.$nextTick();
    await wrapper.find('[data-item-id="copy"]').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="cx-cell-context-menu"]').exists()).toBe(false);
    await wrapper
      .find('[data-row-id="r3"][data-col-id="qty"]')
      .trigger('contextmenu', { clientX: 200, clientY: 100 });
    await wrapper.vm.$nextTick();
    const items = wrapper.findAll('.cx-table-cell-context-menu-item');
    expect(items.at(0).attributes('tabindex')).toBe('0');
    wrapper.destroy();
  });
});

describe('Phase 84: Phase 25 column-visibility menu keyboard nav (vue2)', () => {
  it('84-colvis-1: each checkbox gets data-menu-item-index 0..N-1 (vue2)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, showColumnVisibilityMenu: true },
    });
    await wrapper.find('.cx-table-column-menu-button').trigger('click');
    const checkboxes = wrapper.findAll('.cx-table-column-menu-checkbox');
    expect(checkboxes.length).toBe(columns.length);
    expect(checkboxes.at(0).attributes('data-menu-item-index')).toBe('0');
    expect(checkboxes.at(columns.length - 1).attributes('data-menu-item-index')).toBe(
      String(columns.length - 1),
    );
    wrapper.destroy();
  });

  it('84-colvis-2: first checkbox has tabindex=0 on popover open (vue2)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, showColumnVisibilityMenu: true },
    });
    await wrapper.find('.cx-table-column-menu-button').trigger('click');
    const checkboxes = wrapper.findAll('.cx-table-column-menu-checkbox');
    expect(checkboxes.at(0).attributes('tabindex')).toBe('0');
    expect(checkboxes.at(1).attributes('tabindex')).toBe('-1');
    wrapper.destroy();
  });

  it('84-colvis-3: ArrowDown advances tabindex+focus to the next checkbox (vue2)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, showColumnVisibilityMenu: true },
      attachTo: document.body,
    });
    await wrapper.find('.cx-table-column-menu-button').trigger('click');
    await wrapper.vm.$nextTick();
    const popover = wrapper.find('.cx-table-column-menu-popover');
    await popover.trigger('keydown', { key: 'ArrowDown' });
    await wrapper.vm.$nextTick();
    const checkboxes = wrapper.findAll('.cx-table-column-menu-checkbox');
    expect(checkboxes.at(1).attributes('tabindex')).toBe('0');
    expect(document.activeElement).toBe(checkboxes.at(1).element);
    wrapper.destroy();
  });

  it('84-colvis-4: ArrowUp at first wraps to last; Home jumps to first (vue2)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, showColumnVisibilityMenu: true },
      attachTo: document.body,
    });
    await wrapper.find('.cx-table-column-menu-button').trigger('click');
    await wrapper.vm.$nextTick();
    const popover = wrapper.find('.cx-table-column-menu-popover');
    await popover.trigger('keydown', { key: 'ArrowUp' });
    await wrapper.vm.$nextTick();
    let checkboxes = wrapper.findAll('.cx-table-column-menu-checkbox');
    expect(checkboxes.at(columns.length - 1).attributes('tabindex')).toBe('0');
    await popover.trigger('keydown', { key: 'Home' });
    await wrapper.vm.$nextTick();
    checkboxes = wrapper.findAll('.cx-table-column-menu-checkbox');
    expect(checkboxes.at(0).attributes('tabindex')).toBe('0');
    wrapper.destroy();
  });

  it('84-colvis-5: Escape still closes the popover (chained handler does not eat it) (vue2)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, showColumnVisibilityMenu: true },
      attachTo: document.body,
    });
    await wrapper.find('.cx-table-column-menu-button').trigger('click');
    expect(wrapper.find('.cx-table-column-menu-popover').exists()).toBe(true);
    await wrapper.find('.cx-table-column-menu-popover').trigger('keydown', { key: 'Escape' });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.cx-table-column-menu-popover').exists()).toBe(false);
    wrapper.destroy();
  });

  it('84-colvis-6: reopening the popover after close resets activeIndex to first (vue2)', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns, rows, showColumnVisibilityMenu: true },
      attachTo: document.body,
    });
    await wrapper.find('.cx-table-column-menu-button').trigger('click');
    await wrapper.vm.$nextTick();
    const popover = wrapper.find('.cx-table-column-menu-popover');
    await popover.trigger('keydown', { key: 'End' });
    await wrapper.vm.$nextTick();
    await wrapper.find('.cx-table-column-menu-button').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.find('.cx-table-column-menu-button').trigger('click');
    await wrapper.vm.$nextTick();
    const checkboxes = wrapper.findAll('.cx-table-column-menu-checkbox');
    expect(checkboxes.at(0).attributes('tabindex')).toBe('0');
    wrapper.destroy();
  });
});

describe('Phase 44.1 + 44.2: per-column rowDragHandle + drag auto-scroll (vue2)', () => {
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

  it('44.1-1: rowDragHandle:true column adds data-row-drag-handle="cell" + cursor:grab on draggable rows (vue2)', () => {
    const wrapper = mount(TableForTest, { propsData: { columns: dragCols, rows: dragRows } });
    const r1NameCell = wrapper.find('[data-row-id="r1"][data-col-id="name"]');
    expect(r1NameCell.attributes('data-row-drag-handle')).toBe('cell');
    expect(r1NameCell.attributes('style')).toContain('cursor: grab');
    wrapper.destroy();
  });

  it('44.1-2: rowDragHandle:true column skips draggable:false rows (vue2)', () => {
    const wrapper = mount(TableForTest, { propsData: { columns: dragCols, rows: dragRows } });
    const r3NameCell = wrapper.find('[data-row-id="r3"][data-col-id="name"]');
    expect(r3NameCell.attributes('data-row-drag-handle')).toBeUndefined();
    expect(r3NameCell.attributes('style') ?? '').not.toContain('cursor: grab');
    wrapper.destroy();
  });

  it('44.1-3: rowDragHandle:true column skips pinned rows (vue2)', () => {
    const wrapper = mount(TableForTest, { propsData: { columns: dragCols, rows: dragRows } });
    const pinnedNameCell = wrapper.find('[data-row-id="r-pinned"][data-col-id="name"]');
    if (pinnedNameCell.exists()) {
      expect(pinnedNameCell.attributes('data-row-drag-handle')).toBeUndefined();
    }
    wrapper.destroy();
  });

  it('44.1-4: non-flagged column does NOT get the row-drag-handle wiring (vue2)', () => {
    const wrapper = mount(TableForTest, { propsData: { columns: dragCols, rows: dragRows } });
    const r1IdCell = wrapper.find('[data-row-id="r1"][data-col-id="id"]');
    expect(r1IdCell.attributes('data-row-drag-handle')).toBeUndefined();
    wrapper.destroy();
  });

  it('44.1-5: rowDragColumn.show:true + rowDragHandle column → grip column wins; console.warn fires once (vue2)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const wrapper = mount(TableForTest, {
      propsData: { columns: dragCols, rows: dragRows, rowDragColumn: { show: true } },
    });
    const r1NameCell = wrapper.find('[data-row-id="r1"][data-col-id="name"]');
    expect(r1NameCell.attributes('data-row-drag-handle')).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toContain('rowDragColumn.show is true');
    warnSpy.mockRestore();
    wrapper.destroy();
  });

  it('44.1-6: pointerdown on rowDragHandle cell starts row-drag session via threshold gesture (vue2)', async () => {
    const wrapper = mount(TableForTest, { propsData: { columns: dragCols, rows: dragRows } });
    const r1NameCell = wrapper.find('[data-row-id="r1"][data-col-id="name"]');
    await r1NameCell.trigger('pointerdown', {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    await wrapper
      .find('.cx-table-wrapper')
      .trigger('pointermove', { clientX: 100, clientY: 110, pointerId: 1 });
    const handle = wrapper.vm as unknown as RowDragHandle;
    expect(handle.getMovingRow()?.rowId).toBe('r1');
    handle.cancelRowMove();
    wrapper.destroy();
  });

  it('44.2-1: drag auto-scroll rAF schedules when pointer enters trigger zone during drag (vue2)', async () => {
    const rafSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        void cb;
        return 1;
      });
    const wrapper = mount(TableForTest, { propsData: { columns: dragCols, rows: dragRows } });
    const handle = wrapper.vm as unknown as RowDragHandle;
    handle.startMovingRow('r1');
    rafSpy.mockClear();
    await wrapper
      .find('.cx-table-wrapper')
      .trigger('pointermove', { clientX: 0, clientY: 0, pointerId: -1 });
    expect(rafSpy).toHaveBeenCalled();
    handle.cancelRowMove();
    rafSpy.mockRestore();
    wrapper.destroy();
  });

  it('44.2-2: rowDragAutoScroll:{enabled:false} disables the rAF loop entirely (vue2)', async () => {
    const rafSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        void cb;
        return 1;
      });
    const wrapper = mount(TableForTest, {
      propsData: {
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
    wrapper.destroy();
  });
});

// ────────────────────────── Phase 101: per-column validator + invalid-cell surface (vue2) ──────────────────────────
// Verbatim port of vue3 Phase 101 tests. Same 5 cases: backwards-
// compat, string-return, EditValidationError-return, invalid-cell DOM
// triple, coerce-rejected SKIPS validator.

describe('Phase 101: per-column validator + invalid-cell surface (vue2)', () => {
  it('Phase 101: validator undefined → commit succeeds (backwards-compat)', async () => {
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, editable: true },
    ];
    const wrapper = mount(TableForTest, {
      propsData: { columns: editableColumns, rows },
    });
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('hello');
    await editor.trigger('keydown', { key: 'Enter' });
    const stops = wrapper.emitted('cell-edit-stop') as
      | [{ committed: boolean; validationError?: unknown }][]
      | undefined;
    expect(stops).toBeDefined();
    expect(stops).toHaveLength(1);
    expect(stops![0]![0].committed).toBe(true);
    expect(stops![0]![0].validationError).toBeUndefined();
    wrapper.destroy();
  });

  it('Phase 101: validator returns string → reject + validationError + editor stays open', async () => {
    const validator = vi.fn<(value: unknown) => string | null>((value) =>
      typeof value === 'string' && value.length < 3 ? 'too short' : null,
    );
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, editable: true, validator },
    ];
    const wrapper = mount(TableForTest, {
      propsData: { columns: editableColumns, rows },
    });
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('hi');
    await editor.trigger('keydown', { key: 'Enter' });
    expect(validator).toHaveBeenCalledTimes(1);
    expect(wrapper.find('.cx-table-cell-editor').exists()).toBe(true);
    const stops = wrapper.emitted('cell-edit-stop') as
      | [{ committed: boolean; validationError?: { reason: string; code?: string } }][]
      | undefined;
    expect(stops).toHaveLength(1);
    expect(stops![0]![0].committed).toBe(false);
    expect(stops![0]![0].validationError).toEqual({ reason: 'too short' });
    expect(wrapper.emitted('cell-value-change') ?? []).toHaveLength(0);
    wrapper.destroy();
  });

  it('Phase 101: validator returns EditValidationError → code propagates verbatim', async () => {
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, editable: true, validator: () => ({ reason: 'no good', code: 'fmt' }) },
    ];
    const wrapper = mount(TableForTest, {
      propsData: { columns: editableColumns, rows },
    });
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('whatever');
    await editor.trigger('keydown', { key: 'Enter' });
    const stops = wrapper.emitted('cell-edit-stop') as
      | [{ validationError?: { reason: string; code?: string } }][]
      | undefined;
    expect(stops![0]![0].validationError).toEqual({ reason: 'no good', code: 'fmt' });
    wrapper.destroy();
  });

  it('Phase 101: invalid cell renders --invalid class + data-cell-invalid + aria-invalid', async () => {
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, editable: true, validator: () => 'nope' },
    ];
    const wrapper = mount(TableForTest, {
      propsData: { columns: editableColumns, rows },
    });
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('anything');
    await editor.trigger('keydown', { key: 'Enter' });
    const cell = wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]');
    expect(cell.classes()).toContain('cx-table-cell--invalid');
    expect(cell.attributes('data-cell-invalid')).toBe('true');
    expect(cell.attributes('aria-invalid')).toBe('true');
    await wrapper.find('.cx-table-cell-editor').trigger('keydown', { key: 'Escape' });
    const cellAfter = wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]');
    expect(cellAfter.classes()).not.toContain('cx-table-cell--invalid');
    expect(cellAfter.attributes('data-cell-invalid')).toBeUndefined();
    wrapper.destroy();
  });

  // ---- Phase 111: async validator (vue2) ------------------------------------

  it('Phase 111 (vue2): async resolve null → commit succeeds + cell-value-change', async () => {
    const validatorAsync = vi.fn((_v: unknown) => Promise.resolve(null));
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, editable: true, validatorAsync },
    ];
    const wrapper = mount(TableForTest, { propsData: { columns: editableColumns, rows } });
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('hello');
    await editor.trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('cell-edit-validation-pending') ?? []).toHaveLength(1);
    await new Promise((r) => setTimeout(r, 0));
    await wrapper.vm.$nextTick();
    expect(validatorAsync).toHaveBeenCalledTimes(1);
    const stops = wrapper.emitted('cell-edit-stop') as
      | [{ committed: boolean; finalValue: unknown }][]
      | undefined;
    expect(stops).toHaveLength(1);
    expect(stops![0]![0].committed).toBe(true);
    expect(stops![0]![0].finalValue).toBe('hello');
    expect(wrapper.emitted('cell-value-change') ?? []).toHaveLength(1);
    wrapper.destroy();
  });

  it('Phase 111 (vue2): async resolve string → reject + validationError + editor stays open', async () => {
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, editable: true, validatorAsync: () => Promise.resolve('taken') },
    ];
    const wrapper = mount(TableForTest, { propsData: { columns: editableColumns, rows } });
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('alice');
    await editor.trigger('keydown', { key: 'Enter' });
    await new Promise((r) => setTimeout(r, 0));
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.cx-table-cell-editor').exists()).toBe(true);
    const stops = wrapper.emitted('cell-edit-stop') as
      | [{ committed: boolean; validationError?: { reason: string; code?: string } }][]
      | undefined;
    expect(stops).toHaveLength(1);
    expect(stops![0]![0].committed).toBe(false);
    expect(stops![0]![0].validationError).toEqual({ reason: 'taken' });
    expect(wrapper.emitted('cell-value-change') ?? []).toHaveLength(0);
    wrapper.destroy();
  });

  it('Phase 111 (vue2): sync validator short-circuits async (async not called)', async () => {
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
    const wrapper = mount(TableForTest, { propsData: { columns: editableColumns, rows } });
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('whatever');
    await editor.trigger('keydown', { key: 'Enter' });
    await new Promise((r) => setTimeout(r, 0));
    expect(validatorAsync).not.toHaveBeenCalled();
    expect(wrapper.emitted('cell-edit-validation-pending') ?? []).toHaveLength(0);
    wrapper.destroy();
  });

  it('Phase 111 (vue2): pending cell paints --validating + data-attr + aria-busy', async () => {
    let resolveValidator: (v: null) => void = () => undefined;
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      {
        ...columns[4]!,
        editable: true,
        validatorAsync: () => new Promise<null>((r) => (resolveValidator = r)),
      },
    ];
    const wrapper = mount(TableForTest, { propsData: { columns: editableColumns, rows } });
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
    wrapper.destroy();
  });

  it('Phase 111 (vue2): Promise rejection → validationError with code "async-error"', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      {
        ...columns[4]!,
        editable: true,
        validatorAsync: () => Promise.reject(new Error('HTTP 500')),
      },
    ];
    const wrapper = mount(TableForTest, { propsData: { columns: editableColumns, rows } });
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('hello');
    await editor.trigger('keydown', { key: 'Enter' });
    await new Promise((r) => setTimeout(r, 0));
    await wrapper.vm.$nextTick();
    const stops = wrapper.emitted('cell-edit-stop') as
      | [{ committed: boolean; validationError?: { reason: string; code?: string } }][]
      | undefined;
    expect(stops![0]![0].committed).toBe(false);
    expect(stops![0]![0].validationError).toEqual({
      reason: 'HTTP 500',
      code: 'async-error',
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
    wrapper.destroy();
  });

  it('Phase 111 (vue2): cancel during pending discards the in-flight async', async () => {
    let resolveValidator: (v: null) => void = () => undefined;
    const editableColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      {
        ...columns[4]!,
        editable: true,
        validatorAsync: () => new Promise<null>((r) => (resolveValidator = r)),
      },
    ];
    const wrapper = mount(TableForTest, { propsData: { columns: editableColumns, rows } });
    await wrapper.find('.cx-table-cell[data-col-id="note"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('hello');
    await editor.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    await wrapper.find('.cx-table-cell-editor').trigger('keydown', { key: 'Escape' });
    const stopsAtCancel = wrapper.emitted('cell-edit-stop') as
      | [{ committed: boolean; validationError?: unknown }][]
      | undefined;
    expect(stopsAtCancel).toHaveLength(1);
    expect(stopsAtCancel![0]![0].committed).toBe(false);
    expect(stopsAtCancel![0]![0].validationError).toBeUndefined();
    resolveValidator(null);
    await new Promise((r) => setTimeout(r, 0));
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('cell-edit-stop') ?? []).toHaveLength(1);
    expect(wrapper.emitted('cell-value-change') ?? []).toHaveLength(0);
    wrapper.destroy();
  });

  it('Phase 102: filterUi="multi" renders <details> + segmented mode toggle + N stacked inputs', () => {
    const phaseColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, filterUi: 'multi' },
    ];
    const wrapper = mount(TableForTest, {
      propsData: { columns: phaseColumns, rows, showFilterRow: true },
    });
    const details = wrapper.find('.cx-table-multi-filter[data-col-id="note"]');
    expect(details.exists()).toBe(true);
    const slots = wrapper.findAll('.cx-table-multi-filter__input[data-col-id="note"]');
    expect(slots.length).toBe(2);
    const modeButtons = wrapper.findAll(
      '.cx-table-multi-filter[data-col-id="note"] .cx-table-multi-filter__mode-button',
    );
    expect(modeButtons.length).toBe(2);
    expect(modeButtons.at(0).attributes('data-mode')).toBe('AND');
    expect(modeButtons.at(0).attributes('aria-checked')).toBe('true');
    expect(modeButtons.at(1).attributes('data-mode')).toBe('OR');
    expect(modeButtons.at(1).attributes('aria-checked')).toBe('false');
    wrapper.destroy();
  });

  it('Phase 102: typing in slot 0 emits filter-change with MultiFilterSpec', async () => {
    const phaseColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, filterUi: 'multi' },
    ];
    const wrapper = mount(TableForTest, {
      propsData: { columns: phaseColumns, rows, showFilterRow: true },
    });
    const slot0 = wrapper.find('.cx-table-multi-filter__input[data-multi-filter-slot="0"]');
    await slot0.setValue('first');
    const changes = wrapper.emitted('filter-change') as
      | [{ filterSpec: readonly FilterSpec[] }][]
      | undefined;
    expect(changes).toBeTruthy();
    const lastSpec = changes![changes!.length - 1]![0].filterSpec;
    const multi = lastSpec.find((s): s is MultiFilterSpec => s.type === 'multi');
    expect(multi).toBeDefined();
    expect(multi!.colId).toBe('note');
    expect(multi!.mode).toBe('AND');
    expect(multi!.filters[0]).toEqual({ type: 'text', operator: 'contains', value: 'first' });
    expect(multi!.filters[1]).toEqual({ type: 'text', operator: 'contains', value: '' });
    wrapper.destroy();
  });

  it('Phase 102: clicking OR mode button emits filter-change with mode: "OR"', async () => {
    const phaseColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, filterUi: 'multi' },
    ];
    const wrapper = mount(TableForTest, {
      propsData: { columns: phaseColumns, rows, showFilterRow: true },
    });
    const orBtn = wrapper.find('.cx-table-multi-filter[data-col-id="note"] [data-mode="OR"]');
    await orBtn.trigger('click');
    const changes = wrapper.emitted('filter-change') as
      | [{ filterSpec: readonly FilterSpec[] }][]
      | undefined;
    const lastSpec = changes![changes!.length - 1]![0].filterSpec;
    const multi = lastSpec.find((s): s is MultiFilterSpec => s.type === 'multi');
    expect(multi!.mode).toBe('OR');
    wrapper.destroy();
  });

  it('Phase 102: AND mode + both slots populated excludes rows that match only one', async () => {
    const phaseColumns: readonly ColumnSpec[] = [
      ...columns.slice(0, 4),
      { ...columns[4]!, filterUi: 'multi' },
    ];
    const wrapper = mount(TableForTest, {
      propsData: { columns: phaseColumns, rows, showFilterRow: true },
    });
    const slot0 = wrapper.find('.cx-table-multi-filter__input[data-multi-filter-slot="0"]');
    const slot1 = wrapper.find('.cx-table-multi-filter__input[data-multi-filter-slot="1"]');
    await slot0.setValue('sec');
    await slot1.setValue('cond');
    const bodyCells = wrapper.findAll(
      '.cx-table-cell[data-col-id="note"]:not(.cx-table-filter-cell)',
    );
    expect(bodyCells.length).toBe(1);
    expect(bodyCells.at(0).text()).toBe('second');
    wrapper.destroy();
  });

  it('Phase 101: coerce-rejected SKIPS validator (locked order per Decision E.1)', async () => {
    const validator = vi.fn<(value: unknown) => null>(() => null);
    const editableColumns: readonly ColumnSpec[] = [
      columns[0]!,
      columns[1]!,
      { ...columns[2]!, type: 'number', editable: true, validator },
      columns[3]!,
      columns[4]!,
    ];
    const wrapper = mount(TableForTest, {
      propsData: { columns: editableColumns, rows },
    });
    await wrapper.find('.cx-table-cell[data-col-id="qty"][data-row-id="r1"]').trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    Object.defineProperty(editor.element, 'value', {
      value: 'abc',
      configurable: true,
      writable: true,
    });
    await editor.trigger('input');
    await editor.trigger('keydown', { key: 'Enter' });
    expect(validator).not.toHaveBeenCalled();
    const stops = wrapper.emitted('cell-edit-stop') as
      | [{ committed: boolean; validationError?: unknown }][]
      | undefined;
    expect(stops![0]![0].committed).toBe(false);
    expect(stops![0]![0].validationError).toBeUndefined();
    wrapper.destroy();
  });
});

describe('Phase 114: multi-filter polish — default mode + runtime slot add/remove (vue2)', () => {
  const multiColumns: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: '名称' },
    { id: 'note', field: 'note', headerName: '备注', filterUi: 'multi' },
  ];
  const multiRows: readonly RowSpec[] = [
    { id: 'r1', data: { name: 'alice', note: 'one' } },
    { id: 'r2', data: { name: 'bob', note: 'two' } },
  ];

  it('Phase 114.A (vue2): default mode AND when prop omitted', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns: multiColumns, rows: multiRows, showFilterRow: true },
    });
    const slot0 = wrapper.find('.cx-table-multi-filter__input[data-multi-filter-slot="0"]');
    await slot0.setValue('first');
    const changes = wrapper.emitted('filter-change') as
      | [{ filterSpec: readonly FilterSpec[] }][]
      | undefined;
    const lastSpec = changes!.at(-1)![0].filterSpec;
    const multi = lastSpec.find((s): s is MultiFilterSpec => s.type === 'multi');
    expect(multi!.mode).toBe('AND');
    wrapper.destroy();
  });

  it('Phase 114.A (vue2): default mode OR honoured when prop is "OR"', async () => {
    const wrapper = mount(TableForTest, {
      propsData: {
        columns: multiColumns,
        rows: multiRows,
        showFilterRow: true,
        multiFilterDefaultMode: 'OR',
      },
    });
    const slot0 = wrapper.find('.cx-table-multi-filter__input[data-multi-filter-slot="0"]');
    await slot0.setValue('first');
    const changes = wrapper.emitted('filter-change') as
      | [{ filterSpec: readonly FilterSpec[] }][]
      | undefined;
    const lastSpec = changes!.at(-1)![0].filterSpec;
    const multi = lastSpec.find((s): s is MultiFilterSpec => s.type === 'multi');
    expect(multi!.mode).toBe('OR');
    wrapper.destroy();
  });

  it('Phase 114.B (vue2): clicking `+ 添加条件` emits add-multi-filter-slot', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns: multiColumns, rows: multiRows, showFilterRow: true },
    });
    const addBtn = wrapper.find('[data-testid="cx-table-multi-filter-add-slot"]');
    expect(addBtn.exists()).toBe(true);
    await addBtn.trigger('click');
    const events = wrapper.emitted('add-multi-filter-slot') as
      | [{ colId: string; slotKind: string }][]
      | undefined;
    expect(events).toHaveLength(1);
    expect(events![0]![0].colId).toBe('note');
    expect(events![0]![0].slotKind).toBe('text');
    wrapper.destroy();
  });

  it('Phase 114.B (vue2): clicking × emits remove-multi-filter-slot with slotIdx', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns: multiColumns, rows: multiRows, showFilterRow: true },
    });
    const removeBtns = wrapper.findAll('[data-testid="cx-table-multi-filter-remove-slot"]');
    expect(removeBtns.length).toBe(2);
    await removeBtns.at(1).trigger('click');
    const events = wrapper.emitted('remove-multi-filter-slot') as
      | [{ colId: string; slotIdx: number }][]
      | undefined;
    expect(events).toHaveLength(1);
    expect(events![0]![0].colId).toBe('note');
    expect(events![0]![0].slotIdx).toBe(1);
    wrapper.destroy();
  });

  it('Phase 114.B (vue2): × button disabled (no emit) when slot count = 1', async () => {
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
    const wrapper = mount(TableForTest, {
      propsData: { columns: oneSlotColumns, rows: multiRows, showFilterRow: true },
    });
    const removeBtn = wrapper.find('[data-testid="cx-table-multi-filter-remove-slot"]');
    expect(removeBtn.exists()).toBe(true);
    expect(removeBtn.attributes('disabled')).toBeDefined();
    expect(removeBtn.attributes('aria-disabled')).toBe('true');
    await removeBtn.trigger('click');
    expect(wrapper.emitted('remove-multi-filter-slot') ?? []).toHaveLength(0);
    wrapper.destroy();
  });
});

describe('Phase 115: validation followup — cross-cell + summary + paste-gate (vue2)', () => {
  const editableColumns: readonly ColumnSpec[] = [
    { id: 'id', field: 'id', headerName: 'ID', width: 80 },
    { id: 'name', field: 'name', headerName: '名称', flex: 1 },
    { id: 'qty', field: 'qty', headerName: '数量', width: 120, type: 'number', editable: true },
    { id: 'status', field: 'status', headerName: '状态', width: 100, editable: true },
    { id: 'note', field: 'note', headerName: '备注', flex: 2, editable: true },
  ];

  it('Phase 115: rowValidators triggers invalid-cells-change after inline-edit commit (vue2)', async () => {
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
    const wrapper = mount(TableForTest, {
      propsData: { columns: editableColumns, rows, rowValidators },
    });
    const cell = wrapper.find('.cx-table-cell[data-col-id="qty"][data-row-id="r1"]');
    await cell.trigger('dblclick');
    const editor = wrapper.find('.cx-table-cell-editor');
    await editor.setValue('-5');
    await editor.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    const emits = (wrapper.emitted('invalid-cells-change') ?? []) as unknown[][];
    expect(emits.length).toBeGreaterThan(0);
    const last = emits[emits.length - 1]?.[0] as {
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
    wrapper.destroy();
  });

  it('Phase 115: pasteValidatorPolicy="skip-rejected" drops validator-illegal paste cells (vue2)', async () => {
    const validator = (value: unknown) => {
      if (typeof value === 'number' && value < 0) return { reason: 'must be positive' };
      return null;
    };
    const validatedColumns: readonly ColumnSpec[] = [
      ...editableColumns.slice(0, 2),
      { ...editableColumns[2]!, validator },
      ...editableColumns.slice(3),
    ];
    const wrapper = mount(TableForTest, {
      propsData: {
        columns: validatedColumns,
        rows,
        cellRangeSelection: 'enabled',
        pasteValidatorPolicy: 'skip-rejected',
      },
    });
    const vm = wrapper.vm as unknown as {
      setCellRange(r: unknown): void;
      pasteCellRangeFromClipboard(): Promise<
        readonly { rowId: string; colId: string; newValue: unknown }[] | null
      >;
    };
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
    expect(result!).toHaveLength(1);
    expect(result![0]).toMatchObject({ rowId: 'r1', colId: 'qty', newValue: 100 });
    wrapper.destroy();
  });

  it('Phase 115: getInvalidCells() TableHandle snapshot reflects invalid state (vue2)', async () => {
    const validator = (v: unknown) => (v === 'BAD' ? { reason: 'forbidden' } : null);
    const validatedColumns: readonly ColumnSpec[] = [
      ...editableColumns.slice(0, 3),
      { ...editableColumns[3]!, validator },
      editableColumns[4]!,
    ];
    const wrapper = mount(TableForTest, {
      propsData: { columns: validatedColumns, rows },
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
    wrapper.destroy();
  });
});

describe('Phase 116: multi-filter set-child + multiFilterChildRenderer (vue2)', () => {
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

  it('Phase 116 (vue2): set-slot renders nested <details> with checkbox list', () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns: setColumns, rows: setRows, showFilterRow: true },
    });
    const setSlot = wrapper.find(
      '[data-multi-filter-slot-kind="set"] .cx-table-multi-filter__set-slot-list',
    );
    expect(setSlot.exists()).toBe(true);
    const labels = wrapper.findAll(
      '.cx-table-multi-filter__set-slot-list .cx-table-set-filter__item',
    );
    expect(labels.length).toBe(3);
    wrapper.destroy();
  });

  it('Phase 116 (vue2): toggling a set-slot checkbox fires filter-change', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns: setColumns, rows: setRows, showFilterRow: true },
    });
    const checkboxes = wrapper.findAll(
      '.cx-table-multi-filter__set-slot-list .cx-table-set-filter__checkbox',
    );
    expect(checkboxes.length).toBeGreaterThan(0);
    const okCheckbox = checkboxes
      .filter((c) => c.attributes('data-set-filter-value') === 'OK')
      .at(0);
    expect(okCheckbox).toBeTruthy();
    await okCheckbox?.trigger('change');
    await wrapper.vm.$nextTick();
    const filterChanges = wrapper.emitted('filter-change') ?? [];
    expect(filterChanges.length).toBeGreaterThan(0);
    wrapper.destroy();
  });

  it('Phase 116 (vue2): multiFilterChildRenderer non-null replaces built-in', () => {
    const renderer = vi.fn(() =>
      h(
        'div',
        { class: 'consumer-rendered-slot', attrs: { 'data-testid': 'consumer-slot' } },
        'custom',
      ),
    );
    const wrapper = mount(TableForTest, {
      propsData: {
        columns: setColumns,
        rows: setRows,
        showFilterRow: true,
        multiFilterChildRenderer: renderer,
      },
    });
    expect(renderer).toHaveBeenCalled();
    expect(wrapper.find('[data-testid="consumer-slot"]').exists()).toBe(true);
    expect(wrapper.find('.cx-table-multi-filter__set-slot-list').exists()).toBe(false);
    wrapper.destroy();
  });

  it('Phase 116 (vue2): multiFilterChildRenderer returning null falls back to built-in', () => {
    const renderer = vi.fn(() => null);
    const wrapper = mount(TableForTest, {
      propsData: {
        columns: setColumns,
        rows: setRows,
        showFilterRow: true,
        multiFilterChildRenderer: renderer,
      },
    });
    expect(renderer).toHaveBeenCalled();
    expect(wrapper.find('.cx-table-multi-filter__set-slot-list').exists()).toBe(true);
    wrapper.destroy();
  });
});

describe('Phase 117: multi-filter nested groups (vue2)', () => {
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

  it('Phase 117 (vue2): consumer-injected group spec filters rows correctly', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns: phaseColumns, rows: phaseRows },
    });
    const vm = wrapper.vm as unknown as {
      setFilter(spec: FilterSpec | readonly FilterSpec[] | null): void;
    };
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
    const rendered = wrapper
      .findAll('.cx-table-cell[data-col-id="id"]')
      .wrappers.map((c) => c.text());
    expect(rendered).toEqual(['4']);
    wrapper.destroy();
  });

  it('Phase 117 (vue2): empty group is identity', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns: phaseColumns, rows: phaseRows },
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
    const rendered = wrapper
      .findAll('.cx-table-cell[data-col-id="id"]')
      .wrappers.map((c) => c.text());
    expect(rendered).toEqual(['1', '2', '3', '4']);
    wrapper.destroy();
  });

  it('Phase 117 (vue2): setMultiFilterChildValue early-returns on group slot', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns: phaseColumns, rows: phaseRows },
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
        { type: 'group', mode: 'OR', filters: [{ type: 'number', operator: '>', value: 35 }] },
      ],
    });
    await wrapper.vm.$nextTick();
    const inputs = wrapper.findAll('.cx-table-multi-filter__input');
    if (inputs.length > 0) {
      await inputs.at(0)?.setValue('99');
      await wrapper.vm.$nextTick();
    }
    const filters = vm.getFilter();
    const multi = filters.find((s): s is MultiFilterSpec => s.type === 'multi');
    expect(multi).toBeTruthy();
    expect(multi!.filters[0]?.type).toBe('group');
    wrapper.destroy();
  });
});

describe('Phase 117.1: nested-groups in-UI affordances (vue2)', () => {
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

  it('Phase 117.1 (vue2): consumer-injected group spec renders nested <details> with mode label', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns: phaseColumns, rows: phaseRows, showFilterRow: true },
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
    wrapper.destroy();
  });

  it('Phase 117.1 (vue2): clicking nested group mode toggle dispatches via setMultiFilterEntryAtPath', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns: phaseColumns, rows: phaseRows, showFilterRow: true },
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
    wrapper.destroy();
  });

  it('Phase 117.1 (vue2): clicking root `+ 添加分组` emits add-multi-filter-group with empty path', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns: phaseColumns, rows: phaseRows, showFilterRow: true },
    });
    const addGroupBtn = wrapper.find('[data-testid="cx-table-multi-filter-add-group"]');
    expect(addGroupBtn.exists()).toBe(true);
    await addGroupBtn.trigger('click');
    const events = wrapper.emitted('add-multi-filter-group') as
      | [{ colId: string; path: readonly number[] }][]
      | undefined;
    expect(events).toHaveLength(1);
    const payload = events![0]![0];
    expect(payload.colId).toBe('qty');
    expect(payload.path).toEqual([]);
    wrapper.destroy();
  });

  it('Phase 117.1 (vue2): clicking group × emits remove-multi-filter-group with full path', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns: phaseColumns, rows: phaseRows, showFilterRow: true },
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
    const events = wrapper.emitted('remove-multi-filter-group') as
      | [{ colId: string; path: readonly number[] }][]
      | undefined;
    expect(events).toHaveLength(1);
    const payload = events![0]![0];
    expect(payload.colId).toBe('qty');
    expect(payload.path).toEqual([1]);
    wrapper.destroy();
  });

  it('Phase 117.1 (vue2): setMultiFilterEntryAtPath handle method mutates entry; empty path throws', async () => {
    const wrapper = mount(TableForTest, {
      propsData: { columns: phaseColumns, rows: phaseRows, showFilterRow: true },
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
    expect(() => vm.setMultiFilterEntryAtPath('qty', [], leaf!)).toThrow();
    expect(() => vm.getMultiFilterEntryAtPath('qty', [])).toThrow();
    wrapper.destroy();
  });
});
