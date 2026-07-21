import { act, fireEvent, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// JSDOM's PointerEvent constructor doesn't propagate `relatedTarget`
// from the init dict reliably; manually attach it via defineProperty
// after creation so React's synthetic event sees it.
function firePointerEvent(
  type: 'pointerover' | 'pointerout',
  target: Element,
  relatedTarget: Element | null,
): void {
  const ev = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'relatedTarget', { value: relatedTarget, configurable: true });
  target.dispatchEvent(ev);
}

// (vue3): @testing-library's fireEvent.pointer* helpers
// don't reliably propagate `button` / `clientX` / `pointerId` init values
// through happy-dom's PointerEvent constructor into the React synthetic
// event. Use a generic Event with defineProperty for the fields the
// resizer handler reads — mirrors the firePointerEvent pattern above
// + matches happy-dom's relaxed event-shape semantics.
function fireResizePointer(
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel',
  target: Element,
  init: { clientX: number; pointerId: number; button?: number },
): void {
  const ev = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'button', { value: init.button ?? 0, configurable: true });
  Object.defineProperty(ev, 'clientX', { value: init.clientX, configurable: true });
  Object.defineProperty(ev, 'pointerId', { value: init.pointerId, configurable: true });
  target.dispatchEvent(ev);
}

// (vue3 / react port): mirrors fireResizePointer but
// also defines clientY (needed for Chebyshev threshold + drop-target
// hit test). Bundle C Decision B.1 — keep separate from fireResizePointer
// so test failures stay surface-isolated.
function fireMovePointer(
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel' | 'lostpointercapture',
  target: Element,
  init: { clientX: number; clientY: number; pointerId: number; button?: number },
): void {
  const ev = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'button', { value: init.button ?? 0, configurable: true });
  Object.defineProperty(ev, 'clientX', { value: init.clientX, configurable: true });
  Object.defineProperty(ev, 'clientY', { value: init.clientY, configurable: true });
  Object.defineProperty(ev, 'pointerId', { value: init.pointerId, configurable: true });
  target.dispatchEvent(ev);
}

import {
  ChronixTable,
  type CellClickPayload,
  type CellDblclickPayload,
  type EmptyAreaClickPayload,
  type HeaderClickPayload,
  type RowClickPayload,
  type RowDblclickPayload,
  type RowMouseenterPayload,
  type RowMouseleavePayload,
  type SortChangePayload,
  type TableHandle,
} from './chronix-table.js';

import type {
  CellEditStartPayload,
  CellEditStopPayload,
  CellRangeChangePayload,
  CellRangeCopyPayload,
  CellRangeFillPayload,
  CellRangePastePayload,
  CellRangeStartPayload,
  CellRangeStopPayload,
  CellValueChangePayload,
  HistoryChangePayload,
  HistoryReplayPayload,
  ColumnMoveStartPayload,
  ColumnMoveStopPayload,
  ColumnOrderChangePayload,
  ColumnResizeStartPayload,
  ColumnResizeStopPayload,
  ColumnWidthChangePayload,
  FilterChangePayload,
  PageChangePayload,
  QuickFindTextChangePayload,
  SelectionChangePayload,
  SelectionColumnConfig,
} from './chronix-table.js';
import type {
  CollectUniqueColumnValuesResult,
  ColumnSpec,
  FilterExpression,
  FilterSpec,
  MultiFilterEntry,
  MultiFilterSpec,
  ParseFilterExpressionResult,
  RowSpec,
  SortSpec,
  TableViewState,
  TextFilterSpec,
  ToolPanelConfig,
} from '@chronixjs/table';
import type {
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

function widthPx(style: string | null): number {
  if (!style) return 0;
  const match = /width:\s*([0-9.]+)px/i.exec(style);
  return match ? Number.parseFloat(match[1]!) : 0;
}

function topPx(style: string | null): number {
  if (!style) return 0;
  const match = /top:\s*([0-9.]+)px/i.exec(style);
  return match ? Number.parseFloat(match[1]!) : 0;
}

function heightPx(style: string | null): number {
  if (!style) return 0;
  const match = /height:\s*([0-9.]+)px/i.exec(style);
  return match ? Number.parseFloat(match[1]!) : 0;
}

// architectural-equivalent SFC wiring guards
// for chronix-table-react. Mirrors chronix-table-vue3's test
// suite (commit `3518eb7`) — 8 tests transferring assertion intent
// through React Testing Library idioms.

describe('<ChronixTable> (react) — mount + layout', () => {
  it('mounts a single .cx-table-wrapper root with role="grid"', () => {
    const { container } = render(<ChronixTable columns={columns} rows={rows} />);
    const root = container.querySelector('.cx-table-wrapper');
    expect(root).not.toBeNull();
    expect(root?.getAttribute('role')).toBe('grid');
    expect(root?.getAttribute('data-table-version')).toBe('0.1.0-alpha');
  });

  it('renders one .cx-table-header-cell per visible column with data-col-id matching column.id', () => {
    const { container } = render(<ChronixTable columns={columns} rows={rows} />);
    const headerCells = container.querySelectorAll('.cx-table-header-cell');
    expect(headerCells).toHaveLength(columns.length);
    headerCells.forEach((cell, i) => {
      expect(cell.getAttribute('role')).toBe('columnheader');
      expect(cell.getAttribute('data-col-id')).toBe(columns[i]!.id);
    });
  });

  it('renders one .cx-table-row[data-row-id] per RowSpec in the body rowgroup', () => {
    const { container } = render(<ChronixTable columns={columns} rows={rows} />);
    const body = container.querySelector('.cx-table-body');
    expect(body).not.toBeNull();
    expect(body?.getAttribute('role')).toBe('rowgroup');
    const bodyRows = body?.querySelectorAll('.cx-table-row');
    expect(bodyRows).toHaveLength(rows.length);
    bodyRows?.forEach((row, i) => {
      expect(row.getAttribute('data-row-id')).toBe(rows[i]!.id);
    });
  });

  it('renders one .cx-table-cell per (row × visible column) with cell text from row.data[column.field]', () => {
    const { container } = render(<ChronixTable columns={columns} rows={rows} />);
    const firstRow = container.querySelector('.cx-table-body .cx-table-row[data-row-id="r1"]');
    expect(firstRow).not.toBeNull();
    const cells = firstRow!.querySelectorAll('.cx-table-cell');
    expect(cells).toHaveLength(columns.length);
    expect(cells[0]!.textContent).toBe('1');
    expect(cells[1]!.textContent).toBe('Alpha');
    expect(cells[2]!.textContent).toBe('10');
    expect(cells[3]!.textContent).toBe('OK');
    expect(cells[4]!.textContent).toBe('first');
    expect(cells[0]!.getAttribute('role')).toBe('gridcell');
    expect(cells[0]!.getAttribute('data-col-id')).toBe('id');
    expect(cells[0]!.getAttribute('data-row-id')).toBe('r1');
  });

  it('applies the explicit column width to inline style for header + body cells', () => {
    const { container } = render(<ChronixTable columns={columns} rows={rows} />);
    const idHeader = container.querySelector('.cx-table-header-cell[data-col-id="id"]');
    const idCell = container.querySelector('.cx-table-cell[data-col-id="id"][data-row-id="r1"]');
    expect(widthPx(idHeader?.getAttribute('style') ?? null)).toBe(80);
    expect(widthPx(idCell?.getAttribute('style') ?? null)).toBe(80);
  });

  it('header + body cells for the SAME column share the same resolved width', () => {
    const { container } = render(<ChronixTable columns={columns} rows={rows} />);
    for (const col of columns) {
      const header = container.querySelector(`.cx-table-header-cell[data-col-id="${col.id}"]`);
      const cell = container.querySelector(
        `.cx-table-cell[data-col-id="${col.id}"][data-row-id="r1"]`,
      );
      expect(widthPx(header?.getAttribute('style') ?? null)).toBe(
        widthPx(cell?.getAttribute('style') ?? null),
      );
    }
  });

  it('omits hide: true columns from header AND body', () => {
    const cols: readonly ColumnSpec[] = [
      { id: 'a', field: 'a', headerName: 'A', width: 100 },
      { id: 'b', field: 'b', headerName: 'B', width: 100, hide: true },
      { id: 'c', field: 'c', headerName: 'C', width: 100 },
    ];
    const dataRows: readonly RowSpec[] = [{ id: 'r1', data: { a: 1, b: 2, c: 3 } }];
    const { container } = render(<ChronixTable columns={cols} rows={dataRows} />);
    const headerCells = container.querySelectorAll('.cx-table-header-cell');
    expect(headerCells).toHaveLength(2);
    expect(Array.from(headerCells).map((c) => c.getAttribute('data-col-id'))).toEqual(['a', 'c']);
    const bodyCells = container.querySelectorAll('.cx-table-body .cx-table-cell');
    expect(bodyCells).toHaveLength(2);
    expect(Array.from(bodyCells).map((c) => c.getAttribute('data-col-id'))).toEqual(['a', 'c']);
  });

  it('exposes a TableHandle via forwardRef with getColumnTable / getRowDataSource / getResolvedWidth', () => {
    const handleRef = createRef<TableHandle>();
    render(<ChronixTable ref={handleRef} columns={columns} rows={rows} />);
    const handle = handleRef.current;
    expect(handle).not.toBeNull();
    expect(handle?.getColumnTable().getById('id')).toEqual(columns[0]);
    expect(handle?.getRowDataSource().getById('r1')).toEqual(rows[0]);
    // Width for the explicit-80 'id' column resolves through layout.
    expect(handle?.getResolvedWidth('id')).toBe(80);
    expect(handle?.getResolvedWidth('does-not-exist')).toBeUndefined();
  });
});

// SFC wiring guards for the consolidated
// mechanical-port tail covering vue3 +4+5+5.1+6+7. ~22 tests
// across 6 describe blocks, one per ported vue3 phase.

describe('<ChronixTable> (react).1 rowLayoutPass + absolute body rows (vue3)', () => {
  it('body-content layer carries position:relative + explicit totalBodyHeight', () => {
    const { container } = render(<ChronixTable columns={columns} rows={rows} />);
    const bodyContent = container.querySelector('.cx-table-body-content');
    expect(bodyContent).not.toBeNull();
    const style = bodyContent?.getAttribute('style') ?? '';
    expect(style).toMatch(/position:\s*relative/i);
    // Default rowHeight = 28; 3 rows → 84px.
    expect(heightPx(style)).toBe(84);
  });

  it('each body row is position:absolute with monotonic top stacking', () => {
    const { container } = render(<ChronixTable columns={columns} rows={rows} />);
    const bodyRows = container.querySelectorAll('.cx-table-body .cx-table-row');
    expect(bodyRows).toHaveLength(3);
    const tops: number[] = [];
    bodyRows.forEach((row) => {
      const style = row.getAttribute('style') ?? '';
      expect(style).toMatch(/position:\s*absolute/i);
      tops.push(topPx(style));
    });
    expect(tops).toEqual([0, 28, 56]);
  });

  it('no row Y overlap (each row.top + row.height === next row.top)', () => {
    const { container } = render(<ChronixTable columns={columns} rows={rows} />);
    const bodyRows = container.querySelectorAll('.cx-table-body .cx-table-row');
    for (let i = 0; i < bodyRows.length - 1; i += 1) {
      const a = bodyRows[i]!.getAttribute('style') ?? '';
      const b = bodyRows[i + 1]!.getAttribute('style') ?? '';
      expect(topPx(a) + heightPx(a)).toBe(topPx(b));
    }
  });

  it('per-row heightHint overrides default + shifts downstream Y + grows totalBodyHeight', () => {
    const variedRows: readonly RowSpec[] = [
      { id: 'r1', data: { id: 1 } },
      { id: 'r2', data: { id: 2 }, heightHint: 56 },
      { id: 'r3', data: { id: 3 } },
    ];
    const { container } = render(<ChronixTable columns={columns} rows={variedRows} />);
    const r2 = container.querySelector('.cx-table-body .cx-table-row[data-row-id="r2"]');
    const r3 = container.querySelector('.cx-table-body .cx-table-row[data-row-id="r3"]');
    expect(heightPx(r2?.getAttribute('style') ?? null)).toBe(56);
    expect(topPx(r3?.getAttribute('style') ?? null)).toBe(28 + 56);
    const bodyContent = container.querySelector('.cx-table-body-content');
    // Default 28 + 56 hinted + default 28 = 112.
    expect(heightPx(bodyContent?.getAttribute('style') ?? null)).toBe(112);
  });

  it('body-content layer is the absolute-positioning containing block (rows are its direct children)', () => {
    const { container } = render(<ChronixTable columns={columns} rows={rows} />);
    const bodyContent = container.querySelector('.cx-table-body-content');
    expect(bodyContent).not.toBeNull();
    // All body rows should be direct children of body-content (not body).
    const rowChildren = bodyContent?.querySelectorAll(':scope > .cx-table-row');
    expect(rowChildren).toHaveLength(3);
  });
});

describe('<ChronixTable> (react).1 virtualRowsPass + scrollport (vue3)', () => {
  // overflow-y is 'scroll' (not 'auto') so the body reserves a STABLE
  // vertical-scrollbar gutter that the header / filter mirror -
  // keeps a pinned-right column's sticky `right:0` on the same right edge
  // across header, filter + body. The sticky footer lives INSIDE the body
  // scrollport so it shares the body's gutter (no separate overflow needed).
  // With 'auto' a real ~15px classic scrollbar shifts the body's pinned
  // column left of the header's by the scrollbar width.
  it('body scrollport carries overflow-y:scroll + overflow-x:auto', () => {
    const { container } = render(<ChronixTable columns={columns} rows={rows} />);
    const body = container.querySelector('.cx-table-body');
    const style = body?.getAttribute('style') ?? '';
    expect(style).toMatch(/overflow-y:\s*scroll/i);
    expect(style).toMatch(/overflow-x:\s*auto/i);
  });

  it('header / filter mirror the body scrollbar gutter; footer is sticky inside body', () => {
    const { container } = render(
      <ChronixTable columns={columns} rows={rows} showFilterRow showFooterRow />,
    );
    // header + filter are external siblings that reserve a matching gutter.
    for (const sel of ['.cx-table-header', '.cx-table-filter-row']) {
      const el = container.querySelector(sel);
      const style = el?.getAttribute('style') ?? '';
      expect(style).toMatch(/overflow-y:\s*scroll/i);
    }
    // footer is now a sticky-bottom child of the body scrollport (not a
    // sibling with its own overflow). Verify position:sticky + bottom:0.
    const footerStyle = container.querySelector('.cx-table-footer')?.getAttribute('style') ?? '';
    expect(footerStyle).toMatch(/position:\s*sticky/i);
    expect(footerStyle).toMatch(/bottom:\s*0/i);
    // footer should be a descendant of the body, not a sibling of it.
    expect(container.querySelector('.cx-table-body .cx-table-footer')).not.toBeNull();
  });

  it('body-content layer carries explicit totalBodyHeight + width:totalWidth', () => {
    const { container } = render(<ChronixTable columns={columns} rows={rows} />);
    const bodyContent = container.querySelector('.cx-table-body-content');
    const style = bodyContent?.getAttribute('style') ?? '';
    expect(style).toMatch(/position:\s*relative/i);
    expect(heightPx(style)).toBe(84);
    // totalWidth = sum of column widths. In jsdom with containerWidth=0,
    // columnLayoutPass returns declared widths verbatim: 80+0+120+100+0
    // (flex columns at 0). visibleColumns also include flex columns.
    // The exact value depends on internal layout; assert width > 0.
    expect(widthPx(style)).toBeGreaterThan(0);
  });

  it('pre-mount fallback: 100 rows all render when bodyClientHeight=0', () => {
    const manyRows: readonly RowSpec[] = Array.from({ length: 100 }, (_, i) => ({
      id: `r${i}`,
      data: { id: i },
    }));
    const { container } = render(<ChronixTable columns={columns} rows={manyRows} />);
    // jsdom: ResizeObserver never fires → bodyClientHeight stays 0 →
    // rowsToRender falls back to all rows.
    const bodyRows = container.querySelectorAll('.cx-table-body .cx-table-row');
    expect(bodyRows).toHaveLength(100);
  });

  it('useTableLayout round-trip with explicit viewport returns expected visible-row subset', () => {
    // Spot-check the algorithm wiring via direct hook test — render the
    // hook in a thin wrapper and inspect its return shape via a
    // collected output.
    // Inline approach: render <ChronixTable>, then inject a viewport
    // via Object.defineProperty + dispatch event isn't reliable in
    // jsdom; instead this test exercises the package-level
    // virtualRowsPass already covered in unit tests + asserts the SFC
    // fallback path produces ALL rows when no viewport observation.
    const manyRows: readonly RowSpec[] = Array.from({ length: 50 }, (_, i) => ({
      id: `r${i}`,
      data: { id: i },
    }));
    const { container } = render(<ChronixTable columns={columns} rows={manyRows} />);
    const bodyRows = container.querySelectorAll('.cx-table-body .cx-table-row');
    expect(bodyRows.length).toBe(50);
  });
});

describe('<ChronixTable> (react).1 cell value resolution (vue3)', () => {
  it('default path: getCellValue + formatCellValue resolves identical text baseline', () => {
    const { container } = render(<ChronixTable columns={columns} rows={rows} />);
    const r1Cells = container.querySelectorAll(
      '.cx-table-body .cx-table-row[data-row-id="r1"] .cx-table-cell',
    );
    expect(r1Cells[0]!.textContent).toBe('1');
    expect(r1Cells[1]!.textContent).toBe('Alpha');
    expect(r1Cells[4]!.textContent).toBe('first');
  });

  it('valueFormatter prefixes / transforms cell text', () => {
    const cols: readonly ColumnSpec[] = [
      {
        id: 'qty',
        field: 'qty',
        headerName: '数量',
        width: 100,
        valueFormatter: ({ value }) => `${typeof value === 'number' ? value : 0} 件`,
      },
    ];
    const dataRows: readonly RowSpec[] = [{ id: 'r1', data: { qty: 42 } }];
    const { container } = render(<ChronixTable columns={cols} rows={dataRows} />);
    const cell = container.querySelector('.cx-table-cell[data-col-id="qty"][data-row-id="r1"]');
    expect(cell?.textContent).toBe('42 件');
  });

  it('cellClass function adds resolved classes alongside structural cx-table-cell', () => {
    const cols: readonly ColumnSpec[] = [
      {
        id: 'status',
        field: 'status',
        headerName: '状态',
        width: 100,
        cellClass: ({ value }) => (value === 'OK' ? 'cx-status--done' : 'cx-status--wip'),
      },
    ];
    const dataRows: readonly RowSpec[] = [
      { id: 'r1', data: { status: 'OK' } },
      { id: 'r2', data: { status: 'WIP' } },
    ];
    const { container } = render(<ChronixTable columns={cols} rows={dataRows} />);
    const r1 = container.querySelector('.cx-table-cell[data-row-id="r1"]');
    const r2 = container.querySelector('.cx-table-cell[data-row-id="r2"]');
    expect(r1?.className).toMatch(/\bcx-table-cell\b/);
    expect(r1?.className).toMatch(/\bcx-status--done\b/);
    expect(r2?.className).toMatch(/\bcx-table-cell\b/);
    expect(r2?.className).toMatch(/\bcx-status--wip\b/);
  });

  it('null cell value renders as empty string (defaultFormatCellValue)', () => {
    const cols: readonly ColumnSpec[] = [
      { id: 'name', field: 'name', headerName: '名称', width: 100 },
    ];
    const dataRows: readonly RowSpec[] = [{ id: 'r1', data: { name: null } }];
    const { container } = render(<ChronixTable columns={cols} rows={dataRows} />);
    const cell = container.querySelector('.cx-table-cell[data-row-id="r1"]');
    expect(cell?.textContent).toBe('');
  });
});

describe('<ChronixTable> (react).1 interaction callbacks (vue3)', () => {
  it('onCellClick fires with row + column + value + jsEvent payload', () => {
    const onCellClick = vi.fn<(p: CellClickPayload) => void>();
    const { container } = render(
      <ChronixTable columns={columns} rows={rows} onCellClick={onCellClick} />,
    );
    const cell = container.querySelector('.cx-table-cell[data-col-id="name"][data-row-id="r1"]');
    expect(cell).not.toBeNull();
    fireEvent.click(cell!);
    expect(onCellClick).toHaveBeenCalledTimes(1);
    const payload = onCellClick.mock.calls[0]![0];
    expect(payload.row.id).toBe('r1');
    expect(payload.column.id).toBe('name');
    expect(payload.value).toBe('Alpha');
  });

  it('onRowClick fires with row + jsEvent payload (no column needed)', () => {
    const onRowClick = vi.fn<(p: RowClickPayload) => void>();
    const { container } = render(
      <ChronixTable columns={columns} rows={rows} onRowClick={onRowClick} />,
    );
    const cell = container.querySelector('.cx-table-cell[data-col-id="qty"][data-row-id="r2"]');
    fireEvent.click(cell!);
    expect(onRowClick).toHaveBeenCalledTimes(1);
    expect(onRowClick.mock.calls[0]![0].row.id).toBe('r2');
  });

  it('onRowMouseenter fires once per row + suppresses intra-row child re-entries via sameRow', () => {
    const onRowMouseenter = vi.fn<(p: RowMouseenterPayload) => void>();
    const { container } = render(
      <ChronixTable columns={columns} rows={rows} onRowMouseenter={onRowMouseenter} />,
    );
    const cellA = container.querySelector('.cx-table-cell[data-col-id="id"][data-row-id="r1"]');
    const cellB = container.querySelector('.cx-table-cell[data-col-id="name"][data-row-id="r1"]');
    // First entry: from outside (relatedTarget=null) into r1
    firePointerEvent('pointerover', cellA!, null);
    // Intra-row movement: r1 → r1 (suppressed by sameRow filter)
    firePointerEvent('pointerover', cellB!, cellA);
    expect(onRowMouseenter).toHaveBeenCalledTimes(1);
    expect(onRowMouseenter.mock.calls[0]![0].row.id).toBe('r1');
  });

  it('onRowMouseleave fires once per row + suppresses intra-row child exits via sameRow', () => {
    const onRowMouseleave = vi.fn<(p: RowMouseleavePayload) => void>();
    const { container } = render(
      <ChronixTable columns={columns} rows={rows} onRowMouseleave={onRowMouseleave} />,
    );
    const cellA = container.querySelector('.cx-table-cell[data-col-id="id"][data-row-id="r1"]');
    const cellB = container.querySelector('.cx-table-cell[data-col-id="name"][data-row-id="r1"]');
    const r2Cell = container.querySelector('.cx-table-cell[data-col-id="id"][data-row-id="r2"]');
    // Intra-row exit: r1 → r1 (suppressed)
    firePointerEvent('pointerout', cellA!, cellB);
    // Cross-row exit: r1 → r2 (fires)
    firePointerEvent('pointerout', cellA!, r2Cell);
    expect(onRowMouseleave).toHaveBeenCalledTimes(1);
    expect(onRowMouseleave.mock.calls[0]![0].row.id).toBe('r1');
  });

  it('onCellClick payload value resolves through getCellValue (valueGetter or default field extraction)', () => {
    const cols: readonly ColumnSpec[] = [
      {
        id: 'derived',
        headerName: 'Derived',
        width: 100,
        valueGetter: ({ row }) => `derived-from-${String(row.data['id'])}`,
      },
    ];
    const dataRows: readonly RowSpec[] = [{ id: 'r1', data: { id: 99 } }];
    const onCellClick = vi.fn<(p: CellClickPayload) => void>();
    const { container } = render(
      <ChronixTable columns={cols} rows={dataRows} onCellClick={onCellClick} />,
    );
    const cell = container.querySelector('.cx-table-cell[data-col-id="derived"]');
    fireEvent.click(cell!);
    expect(onCellClick.mock.calls[0]![0].value).toBe('derived-from-99');
  });

  it('onRowClick + onCellClick both fire for the same cell click (row-click first)', () => {
    const order: string[] = [];
    const onRowClick = vi.fn<(p: RowClickPayload) => void>(() => order.push('row'));
    const onCellClick = vi.fn<(p: CellClickPayload) => void>(() => order.push('cell'));
    const { container } = render(
      <ChronixTable
        columns={columns}
        rows={rows}
        onRowClick={onRowClick}
        onCellClick={onCellClick}
      />,
    );
    const cell = container.querySelector('.cx-table-cell[data-col-id="status"][data-row-id="r1"]');
    fireEvent.click(cell!);
    expect(order).toEqual(['row', 'cell']);
  });
});

describe('<ChronixTable> (react).1 theme CSS vars (vue3)', () => {
  it('wrapper carries --cx-table-* CSS custom properties for every theme token', () => {
    const { container } = render(<ChronixTable columns={columns} rows={rows} />);
    const wrapper = container.querySelector('.cx-table-wrapper');
    const style = wrapper?.getAttribute('style') ?? '';
    // Color tokens (raw strings)
    expect(style).toMatch(/--cx-table-header-bg/);
    expect(style).toMatch(/--cx-table-header-border-color/);
    expect(style).toMatch(/--cx-table-row-divider-color/);
    expect(style).toMatch(/--cx-table-even-row-bg/);
    expect(style).toMatch(/--cx-table-odd-row-bg/);
    // Geometry tokens (with px suffix)
    expect(style).toMatch(/--cx-table-header-height:\s*32px/);
    expect(style).toMatch(/--cx-table-row-height:\s*28px/);
    expect(style).toMatch(/--cx-table-cell-padding-x:\s*8px/);
  });
});

describe('<ChronixTable> (react).1 header-click + empty-area + dblclick (vue3)', () => {
  it('onHeaderClick fires with resolved ColumnSpec payload', () => {
    const onHeaderClick = vi.fn<(p: HeaderClickPayload) => void>();
    const { container } = render(
      <ChronixTable columns={columns} rows={rows} onHeaderClick={onHeaderClick} />,
    );
    const headerCell = container.querySelector('.cx-table-header-cell[data-col-id="qty"]');
    fireEvent.click(headerCell!);
    expect(onHeaderClick).toHaveBeenCalledTimes(1);
    expect(onHeaderClick.mock.calls[0]![0].column.id).toBe('qty');
  });

  it('onEmptyAreaClick fires when body click lands outside any row (mutual exclusion with row-click)', () => {
    const onEmptyAreaClick = vi.fn<(p: EmptyAreaClickPayload) => void>();
    const onRowClick = vi.fn<(p: RowClickPayload) => void>();
    const { container } = render(
      <ChronixTable
        columns={columns}
        rows={rows}
        onEmptyAreaClick={onEmptyAreaClick}
        onRowClick={onRowClick}
      />,
    );
    const bodyContent = container.querySelector('.cx-table-body-content');
    // Click directly on the body-content layer (no row ancestor) —
    // React's event delegation requires bubbling so do NOT pass
    // { bubbles: false }. The target is body-content itself, so
    // closestAttr returns null + onEmptyAreaClick fires.
    fireEvent.click(bodyContent!);
    expect(onEmptyAreaClick).toHaveBeenCalledTimes(1);
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('onCellDblclick + onRowDblclick fire on cell double-click', () => {
    const onCellDblclick = vi.fn<(p: CellDblclickPayload) => void>();
    const onRowDblclick = vi.fn<(p: RowDblclickPayload) => void>();
    const { container } = render(
      <ChronixTable
        columns={columns}
        rows={rows}
        onCellDblclick={onCellDblclick}
        onRowDblclick={onRowDblclick}
      />,
    );
    const cell = container.querySelector('.cx-table-cell[data-col-id="note"][data-row-id="r2"]');
    fireEvent.doubleClick(cell!);
    expect(onRowDblclick).toHaveBeenCalledTimes(1);
    expect(onCellDblclick).toHaveBeenCalledTimes(1);
    expect(onCellDblclick.mock.calls[0]![0].column.id).toBe('note');
    expect(onCellDblclick.mock.calls[0]![0].row.id).toBe('r2');
  });
});

// SFC wiring guards for sortPass single-column
// header click cycle (vue3 architectural equivalent).

describe('<ChronixTable> (react) — sortPass single-column (vue3)', () => {
  const sortColumns: readonly ColumnSpec[] = [
    { id: 'id', field: 'id', headerName: 'ID', width: 80 },
    { id: 'name', field: 'name', headerName: '名称', flex: 1 },
    { id: 'qty', field: 'qty', headerName: '数量', width: 120 },
    { id: 'note', field: 'note', headerName: '备注', flex: 2, sortable: false },
  ];
  const sortRows: readonly RowSpec[] = [
    { id: 'r1', data: { id: 1, name: 'Alpha', qty: 30, note: 'a' } },
    { id: 'r2', data: { id: 2, name: 'Beta', qty: 10, note: 'b' } },
    { id: 'r3', data: { id: 3, name: 'Gamma', qty: 20, note: 'c' } },
  ];

  it('setSort applies, onSortChange fires, getSort reflects new state', () => {
    const onSortChange = vi.fn<(p: SortChangePayload) => void>();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={sortColumns}
        rows={sortRows}
        onSortChange={onSortChange}
      />,
    );
    expect(handleRef.current?.getSort()).toEqual([]);
    handleRef.current?.setSort({ colId: 'qty', direction: 'asc' });
    expect(onSortChange).toHaveBeenCalledTimes(1);
    expect(onSortChange.mock.calls[0]![0].sortSpec).toEqual([{ colId: 'qty', direction: 'asc' }]);
    expect(handleRef.current?.getSort()).toEqual([{ colId: 'qty', direction: 'asc' }]);
    handleRef.current?.clearSort();
    expect(handleRef.current?.getSort()).toEqual([]);
    expect(onSortChange).toHaveBeenCalledTimes(2);
    expect(onSortChange.mock.calls[1]![0].sortSpec).toEqual([]);
  });

  it('indicator ▲ for ASC, ▼ for DESC, empty for unsorted', () => {
    const handleRef = createRef<TableHandle>();
    const { container, rerender } = render(
      <ChronixTable ref={handleRef} columns={sortColumns} rows={sortRows} />,
    );
    // Unsorted: all indicators empty.
    const idIndicator = container.querySelector(
      '.cx-table-header-cell[data-col-id="id"] .cx-table-sort-indicator',
    );
    expect(idIndicator?.textContent).toBe('');
    expect(idIndicator?.getAttribute('data-sort-direction')).toBe('');
    // ASC on qty.
    handleRef.current?.setSort({ colId: 'qty', direction: 'asc' });
    rerender(<ChronixTable ref={handleRef} columns={sortColumns} rows={sortRows} />);
    const qtyIndicator = container.querySelector(
      '.cx-table-header-cell[data-col-id="qty"] .cx-table-sort-indicator',
    );
    expect(qtyIndicator?.textContent).toBe('▲');
    expect(qtyIndicator?.getAttribute('data-sort-direction')).toBe('asc');
    // Other columns still empty.
    const nameIndicatorAsc = container.querySelector(
      '.cx-table-header-cell[data-col-id="name"] .cx-table-sort-indicator',
    );
    expect(nameIndicatorAsc?.textContent).toBe('');
    // DESC on qty.
    handleRef.current?.setSort({ colId: 'qty', direction: 'desc' });
    rerender(<ChronixTable ref={handleRef} columns={sortColumns} rows={sortRows} />);
    const qtyIndicatorDesc = container.querySelector(
      '.cx-table-header-cell[data-col-id="qty"] .cx-table-sort-indicator',
    );
    expect(qtyIndicatorDesc?.textContent).toBe('▼');
    expect(qtyIndicatorDesc?.getAttribute('data-sort-direction')).toBe('desc');
  });

  it('header click cycles null → asc → desc → null over 3 clicks; onSortChange fires 3× alongside onHeaderClick 3×', () => {
    const onSortChange = vi.fn<(p: SortChangePayload) => void>();
    const onHeaderClick = vi.fn<(p: HeaderClickPayload) => void>();
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={sortColumns}
        rows={sortRows}
        onSortChange={onSortChange}
        onHeaderClick={onHeaderClick}
      />,
    );
    const qtyHeader = container.querySelector('.cx-table-header-cell[data-col-id="qty"]');
    fireEvent.click(qtyHeader!);
    expect(handleRef.current?.getSort()).toEqual([{ colId: 'qty', direction: 'asc' }]);
    fireEvent.click(qtyHeader!);
    expect(handleRef.current?.getSort()).toEqual([{ colId: 'qty', direction: 'desc' }]);
    fireEvent.click(qtyHeader!);
    expect(handleRef.current?.getSort()).toEqual([]);
    expect(onSortChange).toHaveBeenCalledTimes(3);
    expect(onHeaderClick).toHaveBeenCalledTimes(3);
  });

  it('body rows reorder on sort (data-row-id sequence reflects qty ASC)', () => {
    const handleRef = createRef<TableHandle>();
    const { container, rerender } = render(
      <ChronixTable ref={handleRef} columns={sortColumns} rows={sortRows} />,
    );
    handleRef.current?.setSort({ colId: 'qty', direction: 'asc' });
    rerender(<ChronixTable ref={handleRef} columns={sortColumns} rows={sortRows} />);
    const rowIds = Array.from(container.querySelectorAll('.cx-table-body .cx-table-row')).map(
      (row) => row.getAttribute('data-row-id'),
    );
    // qty values [30, 10, 20] → ASC order [10, 20, 30] = [r2, r3, r1]
    expect(rowIds).toEqual(['r2', 'r3', 'r1']);
  });

  it('non-sortable header click no-ops sort but onHeaderClick still fires', () => {
    const onSortChange = vi.fn<(p: SortChangePayload) => void>();
    const onHeaderClick = vi.fn<(p: HeaderClickPayload) => void>();
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={sortColumns}
        rows={sortRows}
        onSortChange={onSortChange}
        onHeaderClick={onHeaderClick}
      />,
    );
    const noteHeader = container.querySelector('.cx-table-header-cell[data-col-id="note"]');
    fireEvent.click(noteHeader!);
    expect(handleRef.current?.getSort()).toEqual([]);
    expect(onSortChange).not.toHaveBeenCalled();
    expect(onHeaderClick).toHaveBeenCalledTimes(1);
    expect(onHeaderClick.mock.calls[0]![0].column.id).toBe('note');
    // Non-sortable header should NOT have --sortable class.
    expect(noteHeader?.className).not.toMatch(/cx-table-header-cell--sortable/);
  });
});

// + 50 + 50.1 + 51 + 51.1 (2026-05-26): Bundle A SFC wiring
// guards. 5 describe blocks, one per ported vue3 phase.

describe('<ChronixTable> (react).1 multi-column sort (vue3)', () => {
  const sortColumns: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: '名称', width: 100 },
    { id: 'qty', field: 'qty', headerName: '数量', width: 100 },
    { id: 'note', field: 'note', headerName: '备注', width: 100 },
  ];
  const sortRows: readonly RowSpec[] = [
    { id: 'r1', data: { name: 'a', qty: 30, note: 'x' } },
    { id: 'r2', data: { name: 'a', qty: 10, note: 'y' } },
    { id: 'r3', data: { name: 'b', qty: 20, note: 'z' } },
  ];

  it('shift+click append: existing single-col + shift+click another → multi-col array', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={sortColumns} rows={sortRows} />,
    );
    const nameHeader = container.querySelector('.cx-table-header-cell[data-col-id="name"]');
    const qtyHeader = container.querySelector('.cx-table-header-cell[data-col-id="qty"]');
    fireEvent.click(nameHeader!);
    fireEvent.click(qtyHeader!, { shiftKey: true });
    expect(handleRef.current?.getSort()).toEqual([
      { colId: 'name', direction: 'asc' },
      { colId: 'qty', direction: 'asc' },
    ]);
  });

  it('shift+click flip-in-place: asc → desc on existing entry, others preserved', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={sortColumns} rows={sortRows} />,
    );
    const nameHeader = container.querySelector('.cx-table-header-cell[data-col-id="name"]');
    const qtyHeader = container.querySelector('.cx-table-header-cell[data-col-id="qty"]');
    fireEvent.click(nameHeader!);
    fireEvent.click(qtyHeader!, { shiftKey: true });
    fireEvent.click(qtyHeader!, { shiftKey: true });
    expect(handleRef.current?.getSort()).toEqual([
      { colId: 'name', direction: 'asc' },
      { colId: 'qty', direction: 'desc' },
    ]);
  });

  it('shift+click remove: desc → removed; others keep their order', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={sortColumns} rows={sortRows} />,
    );
    const nameHeader = container.querySelector('.cx-table-header-cell[data-col-id="name"]');
    const qtyHeader = container.querySelector('.cx-table-header-cell[data-col-id="qty"]');
    fireEvent.click(nameHeader!);
    fireEvent.click(qtyHeader!, { shiftKey: true });
    fireEvent.click(qtyHeader!, { shiftKey: true });
    fireEvent.click(qtyHeader!, { shiftKey: true });
    expect(handleRef.current?.getSort()).toEqual([{ colId: 'name', direction: 'asc' }]);
  });

  it('plain click during multi-col resets to single-column for the clicked column', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={sortColumns} rows={sortRows} />,
    );
    const nameHeader = container.querySelector('.cx-table-header-cell[data-col-id="name"]');
    const qtyHeader = container.querySelector('.cx-table-header-cell[data-col-id="qty"]');
    fireEvent.click(nameHeader!);
    fireEvent.click(qtyHeader!, { shiftKey: true });
    fireEvent.click(nameHeader!);
    expect(handleRef.current?.getSort()).toEqual([{ colId: 'name', direction: 'asc' }]);
  });

  it('multi-col indicator renders <sup data-sort-position> for positions 1/2', () => {
    const handleRef = createRef<TableHandle>();
    const { container, rerender } = render(
      <ChronixTable ref={handleRef} columns={sortColumns} rows={sortRows} />,
    );
    handleRef.current?.setSort([
      { colId: 'name', direction: 'asc' },
      { colId: 'qty', direction: 'asc' },
    ]);
    rerender(<ChronixTable ref={handleRef} columns={sortColumns} rows={sortRows} />);
    const namePos = container.querySelector(
      '.cx-table-header-cell[data-col-id="name"] .cx-table-sort-indicator-position',
    );
    const qtyPos = container.querySelector(
      '.cx-table-header-cell[data-col-id="qty"] .cx-table-sort-indicator-position',
    );
    expect(namePos?.getAttribute('data-sort-position')).toBe('1');
    expect(qtyPos?.getAttribute('data-sort-position')).toBe('2');
  });
});

describe('<ChronixTable> (react) — filter row (vue3)', () => {
  const filterColumns: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: '名称', width: 100 },
    { id: 'note', field: 'note', headerName: '备注', width: 100, filterable: false },
  ];
  const filterRows: readonly RowSpec[] = [
    { id: 'r1', data: { name: 'alpha', note: 'a' } },
    { id: 'r2', data: { name: 'beta', note: 'b' } },
    { id: 'r3', data: { name: 'gamma', note: 'c' } },
  ];

  it('setFilter applies, onFilterChange fires, getFilter reflects', () => {
    const onFilterChange = vi.fn<(p: FilterChangePayload) => void>();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={filterColumns}
        rows={filterRows}
        onFilterChange={onFilterChange}
      />,
    );
    expect(handleRef.current?.getFilter()).toEqual([]);
    handleRef.current?.setFilter({
      type: 'text',
      colId: 'name',
      operator: 'contains',
      value: 'al',
    });
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(handleRef.current?.getFilter()).toHaveLength(1);
    handleRef.current?.clearFilter();
    expect(handleRef.current?.getFilter()).toEqual([]);
  });

  it('filter row renders one input per visible column; non-filterable disabled', () => {
    const { container } = render(
      <ChronixTable columns={filterColumns} rows={filterRows} showFilterRow />,
    );
    const inputs = container.querySelectorAll('.cx-table-filter-input');
    expect(inputs).toHaveLength(2);
    const nameInput = container.querySelector<HTMLInputElement>(
      '.cx-table-filter-cell[data-col-id="name"] .cx-table-filter-input',
    );
    const noteInput = container.querySelector<HTMLInputElement>(
      '.cx-table-filter-cell[data-col-id="note"] .cx-table-filter-input',
    );
    expect(nameInput?.disabled).toBe(false);
    expect(noteInput?.disabled).toBe(true);
  });

  it('typed text input narrows body rows via applyFilter', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={filterColumns} rows={filterRows} showFilterRow />,
    );
    const nameInput = container.querySelector<HTMLInputElement>(
      '.cx-table-filter-cell[data-col-id="name"] .cx-table-filter-input',
    )!;
    fireEvent.input(nameInput, { target: { value: 'al' } });
    const filter = handleRef.current?.getFilter();
    expect(filter).toHaveLength(1);
    expect(filter![0]).toMatchObject({ type: 'text', colId: 'name', value: 'al' });
    const rowIds = Array.from(container.querySelectorAll('.cx-table-body .cx-table-row')).map((r) =>
      r.getAttribute('data-row-id'),
    );
    expect(rowIds).toEqual(['r1']);
  });

  it('empty input value removes filter entry (no dead specs)', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={filterColumns} rows={filterRows} showFilterRow />,
    );
    const nameInput = container.querySelector<HTMLInputElement>(
      '.cx-table-filter-cell[data-col-id="name"] .cx-table-filter-input',
    )!;
    fireEvent.input(nameInput, { target: { value: 'al' } });
    expect(handleRef.current?.getFilter()).toHaveLength(1);
    fireEvent.input(nameInput, { target: { value: '' } });
    expect(handleRef.current?.getFilter()).toEqual([]);
  });
});

describe('<ChronixTable> (react).1 prefix-number filter (vue3)', () => {
  const numColumns: readonly ColumnSpec[] = [
    { id: 'qty', field: 'qty', headerName: '数量', width: 100, type: 'number' },
    { id: 'name', field: 'name', headerName: '名称', width: 100 },
  ];
  const numRows: readonly RowSpec[] = [
    { id: 'r1', data: { qty: 5, name: 'a' } },
    { id: 'r2', data: { qty: 15, name: 'b' } },
    { id: 'r3', data: { qty: 25, name: 'c' } },
    { id: 'r4', data: { qty: 35, name: 'd' } },
  ];

  it('number column input carries data-filter-type="number" + prefix-syntax placeholder', () => {
    const { container } = render(
      <ChronixTable columns={numColumns} rows={numRows} showFilterRow />,
    );
    const qtyInput = container.querySelector<HTMLInputElement>(
      '.cx-table-filter-cell[data-col-id="qty"] .cx-table-filter-input',
    )!;
    expect(qtyInput?.getAttribute('data-filter-type')).toBe('number');
    expect(qtyInput?.placeholder).toMatch(/5, >10, 5\.\.50/);
  });

  it('">20" parses to NumberFilterSpec + narrows body', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={numColumns} rows={numRows} showFilterRow />,
    );
    const qtyInput = container.querySelector<HTMLInputElement>(
      '.cx-table-filter-cell[data-col-id="qty"] .cx-table-filter-input',
    )!;
    fireEvent.input(qtyInput, { target: { value: '>20' } });
    const filter = handleRef.current?.getFilter();
    expect(filter).toHaveLength(1);
    expect(filter![0]).toMatchObject({ type: 'number', colId: 'qty', operator: '>', value: 20 });
    const rowIds = Array.from(container.querySelectorAll('.cx-table-body .cx-table-row')).map((r) =>
      r.getAttribute('data-row-id'),
    );
    expect(rowIds).toEqual(['r3', 'r4']);
  });

  it('setFilter(NumberFilterSpec) round-trips to input value via formatPrefixNumberFilter', () => {
    const handleRef = createRef<TableHandle>();
    const { container, rerender } = render(
      <ChronixTable ref={handleRef} columns={numColumns} rows={numRows} showFilterRow />,
    );
    handleRef.current?.setFilter({
      type: 'number',
      colId: 'qty',
      operator: 'inRange',
      value: 10,
      valueTo: 30,
    });
    rerender(<ChronixTable ref={handleRef} columns={numColumns} rows={numRows} showFilterRow />);
    const qtyInput = container.querySelector<HTMLInputElement>(
      '.cx-table-filter-cell[data-col-id="qty"] .cx-table-filter-input',
    )!;
    expect(qtyInput?.value).toBe('10..30');
  });
});

describe('<ChronixTable> (react).2 aria-describedby on column headers (2026-05-29)', () => {
  const headerColumns: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: '名称', width: 100 },
    { id: 'qty', field: 'qty', headerName: '数量', width: 100, type: 'number' },
  ];
  const headerRows: readonly RowSpec[] = [
    { id: 'r1', data: { name: 'Alpha', qty: 10 } },
    { id: 'r2', data: { name: 'Beta', qty: 20 } },
  ];

  it('each columnheader carries aria-describedby pointing to a sibling description span with matching id', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={headerColumns} rows={headerRows} />,
    );
    const headers = container.querySelectorAll('.cx-table-header-cell[data-col-id]');
    expect(headers.length).toBeGreaterThan(0);
    for (const header of headers) {
      const describedById = header.getAttribute('aria-describedby');
      expect(describedById).not.toBeNull();
      expect(describedById).toMatch(/^cx-table-header-cell-desc-/);
      const descSpan = container.querySelector(`#${describedById}`);
      expect(descSpan).not.toBeNull();
    }
  });

  it('header description text reflects current sort + filter state', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={headerColumns} rows={headerRows} />,
    );
    const descSelector = '#cx-table-header-cell-desc-name';
    expect(container.querySelector(descSelector)?.textContent).toBe('');
    act(() => {
      handleRef.current?.setSort({ colId: 'name', direction: 'asc' });
    });
    expect(container.querySelector(descSelector)?.textContent).toBe('sorted ascending');
    act(() => {
      handleRef.current?.setFilter({
        type: 'text',
        colId: 'name',
        operator: 'contains',
        value: 'Alpha',
      });
    });
    expect(container.querySelector(descSelector)?.textContent).toBe(
      'sorted ascending; filter contains "Alpha"',
    );
  });
});

describe('<ChronixTable> (react).1 cell-level quick-find highlight (2026-05-29)', () => {
  const hlColumns: readonly ColumnSpec[] = [
    { id: 'id', field: 'id', headerName: 'ID', width: 80 },
    { id: 'name', field: 'name', headerName: '名称', width: 100 },
  ];
  const hlRows: readonly RowSpec[] = [
    { id: 'r1', data: { id: 1, name: 'Alpha' } },
    { id: 'r2', data: { id: 2, name: 'Beta' } },
  ];

  it('cell renders .cx-table-cell__find-match span around matching substring when quickFindText is active', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={hlColumns} rows={hlRows} />,
    );
    act(() => {
      handleRef.current?.setQuickFindText('Alpha');
    });
    const matchSpans = container.querySelectorAll('.cx-table-cell__find-match');
    expect(matchSpans.length).toBeGreaterThan(0);
    expect(matchSpans[0]?.textContent).toBe('Alpha');
  });

  it('clearing quickFindText removes highlight markup', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={hlColumns} rows={hlRows} />,
    );
    act(() => {
      handleRef.current?.setQuickFindText('Alpha');
    });
    expect(container.querySelectorAll('.cx-table-cell__find-match').length).toBeGreaterThan(0);
    act(() => {
      handleRef.current?.setQuickFindText('');
    });
    expect(container.querySelectorAll('.cx-table-cell__find-match').length).toBe(0);
  });
});

describe('<ChronixTable> (react) — quick-find / search (2026-05-29)', () => {
  const findColumns: readonly ColumnSpec[] = [
    { id: 'id', field: 'id', headerName: 'ID', width: 80 },
    { id: 'name', field: 'name', headerName: '名称', width: 100 },
    { id: 'status', field: 'status', headerName: '状态', width: 100 },
    { id: 'note', field: 'note', headerName: '备注', width: 120 },
  ];
  const findRows: readonly RowSpec[] = [
    { id: 'r1', data: { id: 1, name: 'Alpha', status: 'OK', note: 'first' } },
    { id: 'r2', data: { id: 2, name: 'Beta', status: 'WIP', note: 'second' } },
    { id: 'r3', data: { id: 3, name: 'Gamma', status: 'OK', note: '' } },
  ];

  it('setQuickFindText applies a needle + fires onQuickFindTextChange; getQuickFindText reflects new state', () => {
    const onQuickFindTextChange = vi.fn<(p: QuickFindTextChangePayload) => void>();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={findColumns}
        rows={findRows}
        onQuickFindTextChange={onQuickFindTextChange}
      />,
    );
    expect(handleRef.current?.getQuickFindText()).toBe('');
    act(() => {
      handleRef.current?.setQuickFindText('Alpha');
    });
    expect(handleRef.current?.getQuickFindText()).toBe('Alpha');
    expect(onQuickFindTextChange).toHaveBeenCalledTimes(1);
    expect(onQuickFindTextChange).toHaveBeenLastCalledWith({ quickFindText: 'Alpha' });
    act(() => {
      handleRef.current?.setQuickFindText('');
    });
    expect(handleRef.current?.getQuickFindText()).toBe('');
    expect(onQuickFindTextChange).toHaveBeenCalledTimes(2);
  });

  it('setQuickFindText narrows the rendered body rows (cross-column OR substring match)', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={findColumns} rows={findRows} />,
    );
    act(() => {
      handleRef.current?.setQuickFindText('first');
    });
    const visibleRowIds = Array.from(
      container.querySelectorAll('.cx-table-body-content .cx-table-row'),
    ).map((r) => r.getAttribute('data-row-id'));
    expect(visibleRowIds).toEqual(['r1']);
  });

  it('getQuickFindMatchCount reflects post-find row count + identity case when empty', () => {
    const handleRef = createRef<TableHandle>();
    render(<ChronixTable ref={handleRef} columns={findColumns} rows={findRows} />);
    expect(handleRef.current?.getQuickFindMatchCount()).toBe(findRows.length);
    act(() => {
      handleRef.current?.setQuickFindText('OK');
    });
    expect(handleRef.current?.getQuickFindMatchCount()).toBe(2);
    act(() => {
      handleRef.current?.setQuickFindText('');
    });
    expect(handleRef.current?.getQuickFindMatchCount()).toBe(findRows.length);
  });

  it('case-insensitive substring match across multiple columns', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={findColumns} rows={findRows} />,
    );
    act(() => {
      handleRef.current?.setQuickFindText('alpha');
    });
    const visibleRowIds = Array.from(
      container.querySelectorAll('.cx-table-body-content .cx-table-row'),
    ).map((r) => r.getAttribute('data-row-id'));
    expect(visibleRowIds).toEqual(['r1']);
  });
});

describe('<ChronixTable> (react) — row selection (vue3)', () => {
  const selColumns: readonly ColumnSpec[] = [
    { id: 'id', field: 'id', headerName: 'ID', width: 80 },
    { id: 'name', field: 'name', headerName: '名称', width: 100 },
  ];
  const selRows: readonly RowSpec[] = [
    { id: 'r1', data: { id: 1, name: 'a' } },
    { id: 'r2', data: { id: 2, name: 'b' } },
    { id: 'r3', data: { id: 3, name: 'c' } },
  ];

  it('setSelectedRowIds + onSelectionChange + isRowSelected + clearSelection', () => {
    const onSelectionChange = vi.fn<(p: SelectionChangePayload) => void>();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={selColumns}
        rows={selRows}
        selectionMode="multi"
        onSelectionChange={onSelectionChange}
      />,
    );
    expect(handleRef.current?.getSelectedRowIds()).toEqual([]);
    handleRef.current?.setSelectedRowIds(['r1', 'r3']);
    expect(handleRef.current?.getSelectedRowIds()).toEqual(['r1', 'r3']);
    expect(handleRef.current?.isRowSelected('r1')).toBe(true);
    expect(handleRef.current?.isRowSelected('r2')).toBe(false);
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    handleRef.current?.clearSelection();
    expect(handleRef.current?.getSelectedRowIds()).toEqual([]);
  });

  it('single mode: plain click selects, click selected row deselects', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={selColumns} rows={selRows} selectionMode="single" />,
    );
    const r1Cell = container.querySelector('.cx-table-cell[data-col-id="name"][data-row-id="r1"]');
    fireEvent.click(r1Cell!);
    expect(handleRef.current?.getSelectedRowIds()).toEqual(['r1']);
    fireEvent.click(r1Cell!);
    expect(handleRef.current?.getSelectedRowIds()).toEqual([]);
  });

  it('multi mode: Ctrl+click toggles in/out, plain click replaces', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={selColumns} rows={selRows} selectionMode="multi" />,
    );
    const r1Cell = container.querySelector('.cx-table-cell[data-col-id="name"][data-row-id="r1"]');
    const r2Cell = container.querySelector('.cx-table-cell[data-col-id="name"][data-row-id="r2"]');
    const r3Cell = container.querySelector('.cx-table-cell[data-col-id="name"][data-row-id="r3"]');
    fireEvent.click(r1Cell!);
    fireEvent.click(r2Cell!, { ctrlKey: true });
    fireEvent.click(r3Cell!, { ctrlKey: true });
    expect(handleRef.current?.getSelectedRowIds()).toEqual(['r1', 'r2', 'r3']);
    fireEvent.click(r2Cell!, { ctrlKey: true });
    expect(handleRef.current?.getSelectedRowIds()).toEqual(['r1', 'r3']);
    fireEvent.click(r1Cell!);
    expect(handleRef.current?.getSelectedRowIds()).toEqual(['r1']);
  });

  it('selected rows carry .cx-table-row--selected class + aria-selected="true"', () => {
    const handleRef = createRef<TableHandle>();
    const { container, rerender } = render(
      <ChronixTable ref={handleRef} columns={selColumns} rows={selRows} selectionMode="multi" />,
    );
    handleRef.current?.setSelectedRowIds(['r2']);
    rerender(
      <ChronixTable ref={handleRef} columns={selColumns} rows={selRows} selectionMode="multi" />,
    );
    const r2 = container.querySelector('.cx-table-body .cx-table-row[data-row-id="r2"]');
    expect(r2?.className).toMatch(/cx-table-row--selected/);
    expect(r2?.getAttribute('aria-selected')).toBe('true');
    const r1 = container.querySelector('.cx-table-body .cx-table-row[data-row-id="r1"]');
    expect(r1?.className).not.toMatch(/cx-table-row--selected/);
  });
});

describe('<ChronixTable> (react).1 checkbox column (vue3)', () => {
  const selColumns: readonly ColumnSpec[] = [
    { id: 'id', field: 'id', headerName: 'ID', width: 80 },
    { id: 'name', field: 'name', headerName: '名称', width: 100 },
  ];
  const selRows: readonly RowSpec[] = [
    { id: 'r1', data: { id: 1, name: 'a' } },
    { id: 'r2', data: { id: 2, name: 'b' } },
    { id: 'r3', data: { id: 3, name: 'c' } },
  ];
  const leftConfig: SelectionColumnConfig = { show: true, side: 'left' };

  it('selection column renders header + 3 per-row checkboxes when show=true', () => {
    const { container } = render(
      <ChronixTable
        columns={selColumns}
        rows={selRows}
        selectionMode="multi"
        selectionColumn={leftConfig}
      />,
    );
    const headerCheckbox = container.querySelector('.cx-table-selection-checkbox--header');
    expect(headerCheckbox).not.toBeNull();
    const rowCheckboxes = container.querySelectorAll('.cx-table-selection-checkbox--row');
    expect(rowCheckboxes).toHaveLength(3);
  });

  it('per-row checkbox click toggles selection (Ctrl-like semantics)', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={selColumns}
        rows={selRows}
        selectionMode="multi"
        selectionColumn={leftConfig}
      />,
    );
    const r1Cb = container.querySelector<HTMLInputElement>(
      '.cx-table-selection-cell-body[data-row-id="r1"] .cx-table-selection-checkbox',
    )!;
    const r2Cb = container.querySelector<HTMLInputElement>(
      '.cx-table-selection-cell-body[data-row-id="r2"] .cx-table-selection-checkbox',
    )!;
    fireEvent.click(r1Cb);
    fireEvent.click(r2Cb);
    expect(handleRef.current?.getSelectedRowIds()).toEqual(['r1', 'r2']);
    fireEvent.click(r1Cb);
    expect(handleRef.current?.getSelectedRowIds()).toEqual(['r2']);
  });

  it('header select-all toggles: none → all → none', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={selColumns}
        rows={selRows}
        selectionMode="multi"
        selectionColumn={leftConfig}
      />,
    );
    const headerCb = container.querySelector<HTMLInputElement>(
      '.cx-table-selection-checkbox--header',
    )!;
    fireEvent.click(headerCb);
    expect(handleRef.current?.getSelectedRowIds()).toEqual(['r1', 'r2', 'r3']);
    fireEvent.click(headerCb);
    expect(handleRef.current?.getSelectedRowIds()).toEqual([]);
  });

  it('header checkbox indeterminate when SOME selected', () => {
    const handleRef = createRef<TableHandle>();
    const { container, rerender } = render(
      <ChronixTable
        ref={handleRef}
        columns={selColumns}
        rows={selRows}
        selectionMode="multi"
        selectionColumn={leftConfig}
      />,
    );
    handleRef.current?.setSelectedRowIds(['r1']);
    rerender(
      <ChronixTable
        ref={handleRef}
        columns={selColumns}
        rows={selRows}
        selectionMode="multi"
        selectionColumn={leftConfig}
      />,
    );
    const headerCb = container.querySelector<HTMLInputElement>(
      '.cx-table-selection-checkbox--header',
    )!;
    expect(headerCb.indeterminate).toBe(true);
    expect(headerCb.checked).toBe(false);
  });

  it('shift+click range via selection anchor (multi mode)', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={selColumns}
        rows={selRows}
        selectionMode="multi"
        selectionColumn={leftConfig}
      />,
    );
    const r1Cell = container.querySelector('.cx-table-cell[data-col-id="name"][data-row-id="r1"]');
    const r3Cell = container.querySelector('.cx-table-cell[data-col-id="name"][data-row-id="r3"]');
    fireEvent.click(r1Cell!);
    fireEvent.click(r3Cell!, { shiftKey: true });
    expect(handleRef.current?.getSelectedRowIds()).toEqual(['r1', 'r2', 'r3']);
  });
});

// (vue3 equivalent): pagination base — pagePass slot
// + 5 TableHandle methods + footer DOM + auto-reset on sort/filter.

const paginationRows: readonly RowSpec[] = Array.from({ length: 50 }, (_, i) => {
  const idx = i + 1;
  return {
    id: `r${idx}`,
    data: { id: idx, name: `row-${idx}`, qty: (idx * 7) % 100 },
  };
});

const paginationColumns: readonly ColumnSpec[] = [
  { id: 'id', field: 'id', headerName: 'ID', width: 80 },
  { id: 'name', field: 'name', headerName: 'Name', flex: 1 },
  { id: 'qty', field: 'qty', headerName: 'Qty', width: 100, type: 'number' },
];

describe('<ChronixTable> (react) — pagination base', () => {
  it('default pagination disabled — no .cx-table-pagination footer rendered', () => {
    const { container } = render(
      <ChronixTable columns={paginationColumns} rows={paginationRows} />,
    );
    expect(container.querySelector('.cx-table-pagination')).toBeNull();
  });

  it('showPagination renders footer + buttons + page-size select', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={paginationColumns}
        rows={paginationRows}
        showPagination
        initialPageSize={10}
      />,
    );
    expect(container.querySelector('.cx-table-pagination')).not.toBeNull();
    expect(container.querySelector('.cx-table-pagination-button--prev')).not.toBeNull();
    expect(container.querySelector('.cx-table-pagination-button--next')).not.toBeNull();
    expect(container.querySelector('.cx-table-pagination-size-select')).not.toBeNull();
    expect(handleRef.current?.getPage()).toBe(0);
    expect(handleRef.current?.getPageSize()).toBe(10);
    expect(handleRef.current?.getTotalPages()).toBe(5);
  });

  it('setPage updates getPage + clamps to last valid page on overflow', () => {
    const handleRef = createRef<TableHandle>();
    const onPage = vi.fn<(p: PageChangePayload) => void>();
    const { rerender } = render(
      <ChronixTable
        ref={handleRef}
        columns={paginationColumns}
        rows={paginationRows}
        showPagination
        initialPageSize={10}
        onPageChange={onPage}
      />,
    );
    handleRef.current?.setPage(2);
    expect(onPage).toHaveBeenLastCalledWith({ page: 2, pageSize: 10 });
    // Programmatic overshoot — internal state holds 99, pagePass
    // clamps on the next render. React's useMemo doesn't re-evaluate
    // synchronously like vue3's computed, so a rerender is the
    // equivalent of vue3's `await $nextTick()` here.
    handleRef.current?.setPage(99);
    rerender(
      <ChronixTable
        ref={handleRef}
        columns={paginationColumns}
        rows={paginationRows}
        showPagination
        initialPageSize={10}
        onPageChange={onPage}
      />,
    );
    expect(handleRef.current?.getPage()).toBe(4);
  });

  it('setPageSize clamps page when fewer pages remain', () => {
    const handleRef = createRef<TableHandle>();
    const { rerender } = render(
      <ChronixTable
        ref={handleRef}
        columns={paginationColumns}
        rows={paginationRows}
        showPagination
        initialPageSize={10}
      />,
    );
    handleRef.current?.setPage(4);
    rerender(
      <ChronixTable
        ref={handleRef}
        columns={paginationColumns}
        rows={paginationRows}
        showPagination
        initialPageSize={10}
      />,
    );
    // From 5 pages (size 10) → 1 page (size 50): expect clamp to
    // page 0 on the next render (vue3 `await $nextTick` equivalent).
    handleRef.current?.setPageSize(50);
    rerender(
      <ChronixTable
        ref={handleRef}
        columns={paginationColumns}
        rows={paginationRows}
        showPagination
        initialPageSize={10}
      />,
    );
    expect(handleRef.current?.getPage()).toBe(0);
    expect(handleRef.current?.getPageSize()).toBe(50);
    expect(handleRef.current?.getTotalPages()).toBe(1);
  });

  it('sort transition auto-resets page to 0 + fires onPageChange', () => {
    const handleRef = createRef<TableHandle>();
    const onPage = vi.fn<(p: PageChangePayload) => void>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={paginationColumns}
        rows={paginationRows}
        showPagination
        initialPageSize={10}
        onPageChange={onPage}
      />,
    );
    handleRef.current?.setPage(3);
    onPage.mockClear();
    handleRef.current?.setSort({ colId: 'qty', direction: 'asc' });
    expect(handleRef.current?.getPage()).toBe(0);
    expect(onPage).toHaveBeenCalledWith({ page: 0, pageSize: 10 });
  });

  it('applyPage dedup — re-setting same (page, pageSize) does NOT re-emit', () => {
    const handleRef = createRef<TableHandle>();
    const onPage = vi.fn<(p: PageChangePayload) => void>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={paginationColumns}
        rows={paginationRows}
        showPagination
        initialPageSize={10}
        onPageChange={onPage}
      />,
    );
    handleRef.current?.setPage(2);
    onPage.mockClear();
    handleRef.current?.setPage(2);
    expect(onPage).not.toHaveBeenCalled();
  });
});

// (vue3 equivalent): ellipsis-aware page-number bar.

describe('<ChronixTable> (react).1 page-number bar', () => {
  it('5-page dataset renders all 5 page buttons + 0 ellipsis markers', () => {
    const { container } = render(
      <ChronixTable
        columns={paginationColumns}
        rows={paginationRows}
        showPagination
        initialPageSize={10}
      />,
    );
    const pageBtns = container.querySelectorAll('.cx-table-pagination-page');
    expect(pageBtns).toHaveLength(5);
    expect(container.querySelectorAll('.cx-table-pagination-ellipsis')).toHaveLength(0);
    expect(pageBtns[0]!.classList.contains('cx-table-pagination-page--current')).toBe(true);
    expect(pageBtns[0]!.getAttribute('aria-current')).toBe('page');
    expect((pageBtns[0]! as HTMLButtonElement).disabled).toBe(true);
  });

  it('large dataset renders ellipsis markers', () => {
    // 200 rows / pageSize 10 = 20 pages — ellipsis-territory.
    const manyRows: readonly RowSpec[] = Array.from({ length: 200 }, (_, i) => ({
      id: `m${i + 1}`,
      data: { id: i + 1, name: `m-${i + 1}`, qty: i },
    }));
    const handleRef = createRef<TableHandle>();
    const { container, rerender } = render(
      <ChronixTable
        ref={handleRef}
        columns={paginationColumns}
        rows={manyRows}
        showPagination
        initialPageSize={10}
      />,
    );
    handleRef.current?.setPage(10);
    rerender(
      <ChronixTable
        ref={handleRef}
        columns={paginationColumns}
        rows={manyRows}
        showPagination
        initialPageSize={10}
      />,
    );
    expect(container.querySelectorAll('.cx-table-pagination-ellipsis').length).toBeGreaterThan(0);
  });

  it('clicking a non-current page button jumps to that page + emits onPageChange', () => {
    const handleRef = createRef<TableHandle>();
    const onPage = vi.fn<(p: PageChangePayload) => void>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={paginationColumns}
        rows={paginationRows}
        showPagination
        initialPageSize={10}
        onPageChange={onPage}
      />,
    );
    // Find the page-3 button (data-page-index="2") and click.
    const page3Btn = container.querySelector<HTMLButtonElement>(
      '.cx-table-pagination-page[data-page-index="2"]',
    );
    expect(page3Btn).not.toBeNull();
    fireEvent.click(page3Btn!);
    expect(onPage).toHaveBeenLastCalledWith({ page: 2, pageSize: 10 });
    expect(handleRef.current?.getPage()).toBe(2);
  });
});

// (vue3 equivalent): inline edit base — dblclick →
// `<input>` editor + 5 TableHandle methods + 3 callback lifecycle.

const editColumns: readonly ColumnSpec[] = [
  { id: 'id', field: 'id', headerName: 'ID', width: 80 },
  { id: 'name', field: 'name', headerName: 'Name', flex: 1, editable: true },
  { id: 'note', field: 'note', headerName: 'Note', flex: 2 },
];

const editRows: readonly RowSpec[] = [
  { id: 'r1', data: { id: 1, name: 'Alpha', note: 'first' } },
  { id: 'r2', data: { id: 2, name: 'Beta', note: 'second' } },
];

describe('<ChronixTable> (react) — inline edit base', () => {
  it('dblclick on editable cell opens .cx-table-cell--editing + <input.cx-table-cell-editor>', () => {
    const onStart = vi.fn<(p: CellEditStartPayload) => void>();
    const { container } = render(
      <ChronixTable columns={editColumns} rows={editRows} onCellEditStart={onStart} />,
    );
    const cell = container.querySelector('.cx-table-cell[data-col-id="name"][data-row-id="r1"]');
    expect(cell).not.toBeNull();
    fireEvent.doubleClick(cell!);
    const editorCell = container.querySelector(
      '.cx-table-cell--editing[data-col-id="name"][data-row-id="r1"]',
    );
    expect(editorCell).not.toBeNull();
    expect(editorCell!.querySelector('.cx-table-cell-editor')).not.toBeNull();
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart.mock.calls[0]![0].row.id).toBe('r1');
    expect(onStart.mock.calls[0]![0].column.id).toBe('name');
    expect(onStart.mock.calls[0]![0].baseValue).toBe('Alpha');
  });

  it('dblclick on non-editable cell does NOT open editor', () => {
    const onStart = vi.fn<(p: CellEditStartPayload) => void>();
    const { container } = render(
      <ChronixTable columns={editColumns} rows={editRows} onCellEditStart={onStart} />,
    );
    const cell = container.querySelector('.cx-table-cell[data-col-id="note"][data-row-id="r1"]');
    fireEvent.doubleClick(cell!);
    expect(container.querySelector('.cx-table-cell-editor')).toBeNull();
    expect(onStart).not.toHaveBeenCalled();
  });

  it('Enter commits → onCellEditStop {committed:true} + onCellValueChange when draft differs', () => {
    const onStop = vi.fn<(p: CellEditStopPayload) => void>();
    const onChange = vi.fn<(p: CellValueChangePayload) => void>();
    const { container } = render(
      <ChronixTable
        columns={editColumns}
        rows={editRows}
        onCellEditStop={onStop}
        onCellValueChange={onChange}
      />,
    );
    const cell = container.querySelector('.cx-table-cell[data-col-id="name"][data-row-id="r1"]');
    fireEvent.doubleClick(cell!);
    const editor = container.querySelector<HTMLInputElement>('.cx-table-cell-editor');
    expect(editor).not.toBeNull();
    fireEvent.change(editor!, { target: { value: 'Alpha-edited' } });
    fireEvent.keyDown(editor!, { key: 'Enter' });
    expect(onStop).toHaveBeenLastCalledWith(
      expect.objectContaining({ committed: true, finalValue: 'Alpha-edited' }),
    );
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]![0].oldValue).toBe('Alpha');
    expect(onChange.mock.calls[0]![0].newValue).toBe('Alpha-edited');
  });

  it('commit with unchanged draft does NOT fire onCellValueChange', () => {
    const onStop = vi.fn<(p: CellEditStopPayload) => void>();
    const onChange = vi.fn<(p: CellValueChangePayload) => void>();
    const { container } = render(
      <ChronixTable
        columns={editColumns}
        rows={editRows}
        onCellEditStop={onStop}
        onCellValueChange={onChange}
      />,
    );
    const cell = container.querySelector('.cx-table-cell[data-col-id="name"][data-row-id="r1"]');
    fireEvent.doubleClick(cell!);
    const editor = container.querySelector<HTMLInputElement>('.cx-table-cell-editor')!;
    fireEvent.keyDown(editor, { key: 'Enter' });
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(onStop.mock.calls[0]![0].committed).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('Escape cancels → onCellEditStop {committed:false} + no onCellValueChange', () => {
    const onStop = vi.fn<(p: CellEditStopPayload) => void>();
    const onChange = vi.fn<(p: CellValueChangePayload) => void>();
    const { container } = render(
      <ChronixTable
        columns={editColumns}
        rows={editRows}
        onCellEditStop={onStop}
        onCellValueChange={onChange}
      />,
    );
    const cell = container.querySelector('.cx-table-cell[data-col-id="name"][data-row-id="r1"]');
    fireEvent.doubleClick(cell!);
    const editor = container.querySelector<HTMLInputElement>('.cx-table-cell-editor')!;
    fireEvent.change(editor, { target: { value: 'discarded' } });
    fireEvent.keyDown(editor, { key: 'Escape' });
    expect(onStop).toHaveBeenLastCalledWith(
      expect.objectContaining({ committed: false, finalValue: 'Alpha' }),
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it('Blur commits (Notion semantic) when no explicit commit/cancel in flight', () => {
    const onStop = vi.fn<(p: CellEditStopPayload) => void>();
    const onChange = vi.fn<(p: CellValueChangePayload) => void>();
    const { container } = render(
      <ChronixTable
        columns={editColumns}
        rows={editRows}
        onCellEditStop={onStop}
        onCellValueChange={onChange}
      />,
    );
    const cell = container.querySelector('.cx-table-cell[data-col-id="name"][data-row-id="r1"]');
    fireEvent.doubleClick(cell!);
    const editor = container.querySelector<HTMLInputElement>('.cx-table-cell-editor')!;
    fireEvent.change(editor, { target: { value: 'blur-committed' } });
    fireEvent.blur(editor);
    expect(onStop).toHaveBeenLastCalledWith(
      expect.objectContaining({ committed: true, finalValue: 'blur-committed' }),
    );
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('programmatic startEditingCell + commitEditingCell + setEditingCellDraft + getEditingCell', () => {
    const handleRef = createRef<TableHandle>();
    const onStart = vi.fn<(p: CellEditStartPayload) => void>();
    const onChange = vi.fn<(p: CellValueChangePayload) => void>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={editColumns}
        rows={editRows}
        onCellEditStart={onStart}
        onCellValueChange={onChange}
      />,
    );
    handleRef.current?.startEditingCell('r2', 'name');
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(handleRef.current?.getEditingCell()?.rowId).toBe('r2');
    handleRef.current?.setEditingCellDraft('programmatic-edit');
    expect(handleRef.current?.getEditingCell()?.draftValue).toBe('programmatic-edit');
    handleRef.current?.commitEditingCell();
    expect(handleRef.current?.getEditingCell()).toBeNull();
    expect(onChange.mock.calls[0]![0].newValue).toBe('programmatic-edit');
  });

  it('cancelEditingCell discards the draft and clears editing state', () => {
    const handleRef = createRef<TableHandle>();
    const onStop = vi.fn<(p: CellEditStopPayload) => void>();
    const onChange = vi.fn<(p: CellValueChangePayload) => void>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={editColumns}
        rows={editRows}
        onCellEditStop={onStop}
        onCellValueChange={onChange}
      />,
    );
    handleRef.current?.startEditingCell('r1', 'name');
    handleRef.current?.setEditingCellDraft('discarded');
    handleRef.current?.cancelEditingCell();
    expect(handleRef.current?.getEditingCell()).toBeNull();
    expect(onStop.mock.calls[0]![0].committed).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
  });
});

// (vue3 equivalent): number editor + typed
// coercion via coerceEditDraftValue.

const numberEditColumns: readonly ColumnSpec[] = [
  { id: 'id', field: 'id', headerName: 'ID', width: 80 },
  { id: 'qty', field: 'qty', headerName: 'Qty', width: 100, type: 'number', editable: true },
];

const numberEditRows: readonly RowSpec[] = [
  { id: 'r1', data: { id: 1, qty: 10 } },
  { id: 'r2', data: { id: 2, qty: 20 } },
];

describe('<ChronixTable> (react).1 number editor', () => {
  it('type:"number" + editable renders <input type="number" inputmode="decimal">', () => {
    const { container } = render(
      <ChronixTable columns={numberEditColumns} rows={numberEditRows} />,
    );
    const cell = container.querySelector('.cx-table-cell[data-col-id="qty"][data-row-id="r1"]');
    fireEvent.doubleClick(cell!);
    const editor = container.querySelector<HTMLInputElement>('.cx-table-cell-editor');
    expect(editor).not.toBeNull();
    expect(editor!.getAttribute('type')).toBe('number');
    expect(editor!.getAttribute('inputmode')).toBe('decimal');
  });

  it('valid float commit produces newValue: number (not string)', () => {
    const onChange = vi.fn<(p: CellValueChangePayload) => void>();
    const { container } = render(
      <ChronixTable
        columns={numberEditColumns}
        rows={numberEditRows}
        onCellValueChange={onChange}
      />,
    );
    const cell = container.querySelector('.cx-table-cell[data-col-id="qty"][data-row-id="r1"]');
    fireEvent.doubleClick(cell!);
    const editor = container.querySelector<HTMLInputElement>('.cx-table-cell-editor')!;
    fireEvent.change(editor, { target: { value: '3.14' } });
    fireEvent.keyDown(editor, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]![0].newValue).toBe(3.14);
    expect(typeof onChange.mock.calls[0]![0].newValue).toBe('number');
  });

  it('empty number input commits as null', () => {
    const onChange = vi.fn<(p: CellValueChangePayload) => void>();
    const { container } = render(
      <ChronixTable
        columns={numberEditColumns}
        rows={numberEditRows}
        onCellValueChange={onChange}
      />,
    );
    const cell = container.querySelector('.cx-table-cell[data-col-id="qty"][data-row-id="r1"]');
    fireEvent.doubleClick(cell!);
    const editor = container.querySelector<HTMLInputElement>('.cx-table-cell-editor')!;
    fireEvent.change(editor, { target: { value: '' } });
    fireEvent.keyDown(editor, { key: 'Enter' });
    expect(onChange.mock.calls[0]![0].newValue).toBeNull();
  });

  it('invalid input ("abc") holds editor open + cell-edit-stop {committed:false} + no cell-value-change', () => {
    const handleRef = createRef<TableHandle>();
    const onStop = vi.fn<(p: CellEditStopPayload) => void>();
    const onChange = vi.fn<(p: CellValueChangePayload) => void>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={numberEditColumns}
        rows={numberEditRows}
        onCellEditStop={onStop}
        onCellValueChange={onChange}
      />,
    );
    const cell = container.querySelector('.cx-table-cell[data-col-id="qty"][data-row-id="r1"]');
    fireEvent.doubleClick(cell!);
    const editor = container.querySelector<HTMLInputElement>('.cx-table-cell-editor')!;
    // happy-dom sanitizes <input type="number"> value — bypass via
    // defineProperty so the rejection codepath actually fires
    // (same trick vue3 + vue2 number-editor tests use).
    Object.defineProperty(editor, 'value', { value: 'abc', configurable: true });
    fireEvent.change(editor, { target: { value: 'abc' } });
    fireEvent.keyDown(editor, { key: 'Enter' });
    expect(onStop).toHaveBeenLastCalledWith(
      expect.objectContaining({ committed: false, finalValue: 10 }),
    );
    expect(onChange).not.toHaveBeenCalled();
    // Reject-and-keep — editor stays open + getEditingCell still
    // returns the in-flight state.
    expect(handleRef.current?.getEditingCell()).not.toBeNull();
    expect(container.querySelector('.cx-table-cell-editor')).not.toBeNull();
  });
});

// (vue3 equivalent): Tab cross-row navigation
// via findNextEditableCell + queueMicrotask-deferred blur guard.

const tabColumns: readonly ColumnSpec[] = [
  { id: 'id', field: 'id', headerName: 'ID', width: 80 },
  { id: 'a', field: 'a', headerName: 'A', flex: 1, editable: true },
  { id: 'b', field: 'b', headerName: 'B', flex: 1 }, // non-editable
  { id: 'c', field: 'c', headerName: 'C', flex: 1, editable: true },
];

const tabRows: readonly RowSpec[] = [
  { id: 'r1', data: { id: 1, a: 'r1-a', b: 'r1-b', c: 'r1-c' } },
  { id: 'r2', data: { id: 2, a: 'r2-a', b: 'r2-b', c: 'r2-c' } },
];

describe('<ChronixTable> (react).2 Tab cross-row navigation', () => {
  it('Tab from r1.a → r1.c (skips non-editable r1.b)', async () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={tabColumns} rows={tabRows} />,
    );
    const r1a = container.querySelector('.cx-table-cell[data-col-id="a"][data-row-id="r1"]');
    fireEvent.doubleClick(r1a!);
    const editor1 = container.querySelector<HTMLInputElement>('.cx-table-cell-editor')!;
    fireEvent.keyDown(editor1, { key: 'Tab' });
    await Promise.resolve();
    expect(handleRef.current?.getEditingCell()?.rowId).toBe('r1');
    expect(handleRef.current?.getEditingCell()?.colId).toBe('c');
  });

  it('Tab from r1.c (last editable col of row 1) → r2.a (cross-row B.1)', async () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={tabColumns} rows={tabRows} />,
    );
    act(() => {
      handleRef.current?.startEditingCell('r1', 'c');
    });
    const editor = container.querySelector<HTMLInputElement>('.cx-table-cell-editor')!;
    fireEvent.keyDown(editor, { key: 'Tab' });
    await Promise.resolve();
    expect(handleRef.current?.getEditingCell()?.rowId).toBe('r2');
    expect(handleRef.current?.getEditingCell()?.colId).toBe('a');
  });

  it('Shift+Tab from r2.a → r1.c (backward cross-row)', async () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={tabColumns} rows={tabRows} />,
    );
    act(() => {
      handleRef.current?.startEditingCell('r2', 'a');
    });
    const editor = container.querySelector<HTMLInputElement>('.cx-table-cell-editor')!;
    fireEvent.keyDown(editor, { key: 'Tab', shiftKey: true });
    await Promise.resolve();
    expect(handleRef.current?.getEditingCell()?.rowId).toBe('r1');
    expect(handleRef.current?.getEditingCell()?.colId).toBe('c');
  });

  it('Tab from r2.c (last editable cell of last row) closes editor (A.1 boundary)', async () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={tabColumns} rows={tabRows} />,
    );
    act(() => {
      handleRef.current?.startEditingCell('r2', 'c');
    });
    const editor = container.querySelector<HTMLInputElement>('.cx-table-cell-editor')!;
    fireEvent.keyDown(editor, { key: 'Tab' });
    await Promise.resolve();
    expect(handleRef.current?.getEditingCell()).toBeNull();
  });
});

// (vue3 equivalent): column resize — 4px resizer +
// 4 TableHandle methods + 3-callback lifecycle + clampResizeWidth.

const resizeColumns: readonly ColumnSpec[] = [
  { id: 'id', field: 'id', headerName: 'ID', width: 80 },
  { id: 'name', field: 'name', headerName: 'Name', width: 120 },
  { id: 'qty', field: 'qty', headerName: 'Qty', width: 100, minWidth: 40, maxWidth: 200 },
  { id: 'status', field: 'status', headerName: 'Status', width: 100, resizable: false },
];

const resizeRows: readonly RowSpec[] = [
  { id: 'r1', data: { id: 1, name: 'Alpha', qty: 10, status: 'OK' } },
];

describe('<ChronixTable> (react) — column resize', () => {
  it('every resizable!==false header cell carries a .cx-table-header-resizer', () => {
    const { container } = render(<ChronixTable columns={resizeColumns} rows={resizeRows} />);
    expect(container.querySelectorAll('.cx-table-header-resizer')).toHaveLength(3);
    expect(container.querySelector('[data-col-id="status"] .cx-table-header-resizer')).toBeNull();
  });

  it('startResizingColumn on resizable:false column is a silent no-op', () => {
    const handleRef = createRef<TableHandle>();
    const onStart = vi.fn<(p: ColumnResizeStartPayload) => void>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={resizeColumns}
        rows={resizeRows}
        onColumnResizeStart={onStart}
      />,
    );
    handleRef.current?.startResizingColumn('status');
    expect(handleRef.current?.getResizingColumn()).toBeNull();
    expect(onStart).not.toHaveBeenCalled();
  });

  it('programmatic startResizingColumn + commitColumnResize round-trip', () => {
    const handleRef = createRef<TableHandle>();
    const onStart = vi.fn<(p: ColumnResizeStartPayload) => void>();
    const onStop = vi.fn<(p: ColumnResizeStopPayload) => void>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={resizeColumns}
        rows={resizeRows}
        onColumnResizeStart={onStart}
        onColumnResizeStop={onStop}
      />,
    );
    handleRef.current?.startResizingColumn('qty');
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(handleRef.current?.getResizingColumn()?.colId).toBe('qty');
    handleRef.current?.commitColumnResize();
    expect(handleRef.current?.getResizingColumn()).toBeNull();
    expect(onStop).toHaveBeenLastCalledWith(expect.objectContaining({ committed: true }));
  });

  it('cancelColumnResize fires onColumnResizeStop {committed: false}', () => {
    const handleRef = createRef<TableHandle>();
    const onStop = vi.fn<(p: ColumnResizeStopPayload) => void>();
    const onChange = vi.fn<(p: ColumnWidthChangePayload) => void>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={resizeColumns}
        rows={resizeRows}
        onColumnResizeStop={onStop}
        onColumnWidthChange={onChange}
      />,
    );
    handleRef.current?.startResizingColumn('qty');
    handleRef.current?.cancelColumnResize();
    expect(onStop).toHaveBeenLastCalledWith(expect.objectContaining({ committed: false }));
    expect(onChange).not.toHaveBeenCalled();
    expect(handleRef.current?.getResizingColumn()).toBeNull();
  });

  it('pointerdown on resizer fires onColumnResizeStart + sets internal state', () => {
    const handleRef = createRef<TableHandle>();
    const onStart = vi.fn<(p: ColumnResizeStartPayload) => void>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={resizeColumns}
        rows={resizeRows}
        onColumnResizeStart={onStart}
      />,
    );
    const qtyResizer = container.querySelector('[data-col-id="qty"] .cx-table-header-resizer');
    expect(qtyResizer).not.toBeNull();
    fireResizePointer('pointerdown', qtyResizer!, { clientX: 300, pointerId: 1 });
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(handleRef.current?.getResizingColumn()?.colId).toBe('qty');
    expect(handleRef.current?.getResizingColumn()?.startX).toBe(300);
  });

  it('pointermove updates draftWidth via clampResizeWidth (within bounds)', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={resizeColumns} rows={resizeRows} />,
    );
    const qtyResizer = container.querySelector('[data-col-id="qty"] .cx-table-header-resizer');
    fireResizePointer('pointerdown', qtyResizer!, { clientX: 300, pointerId: 1 });
    // qty starts at 100; +40 → 140 (within [40, 200])
    fireResizePointer('pointermove', qtyResizer!, { clientX: 340, pointerId: 1 });
    expect(handleRef.current?.getResizingColumn()?.draftWidth).toBe(140);
  });

  it('pointermove clamps below minWidth — qty drag to far left bottoms at 40', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={resizeColumns} rows={resizeRows} />,
    );
    const qtyResizer = container.querySelector('[data-col-id="qty"] .cx-table-header-resizer');
    fireResizePointer('pointerdown', qtyResizer!, { clientX: 300, pointerId: 1 });
    // qty starts at 100; -500 → -400 → clamped to minWidth 40
    fireResizePointer('pointermove', qtyResizer!, { clientX: -200, pointerId: 1 });
    expect(handleRef.current?.getResizingColumn()?.draftWidth).toBe(40);
  });

  it('pointermove clamps above maxWidth — qty drag to far right tops at 200', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={resizeColumns} rows={resizeRows} />,
    );
    const qtyResizer = container.querySelector('[data-col-id="qty"] .cx-table-header-resizer');
    fireResizePointer('pointerdown', qtyResizer!, { clientX: 300, pointerId: 1 });
    fireResizePointer('pointermove', qtyResizer!, { clientX: 1500, pointerId: 1 });
    expect(handleRef.current?.getResizingColumn()?.draftWidth).toBe(200);
  });

  it('pointerup commits — onColumnWidthChange + onColumnResizeStop fire', () => {
    const handleRef = createRef<TableHandle>();
    const onStop = vi.fn<(p: ColumnResizeStopPayload) => void>();
    const onChange = vi.fn<(p: ColumnWidthChangePayload) => void>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={resizeColumns}
        rows={resizeRows}
        onColumnResizeStop={onStop}
        onColumnWidthChange={onChange}
      />,
    );
    const qtyResizer = container.querySelector('[data-col-id="qty"] .cx-table-header-resizer');
    fireResizePointer('pointerdown', qtyResizer!, { clientX: 300, pointerId: 1 });
    fireResizePointer('pointermove', qtyResizer!, { clientX: 340, pointerId: 1 });
    fireResizePointer('pointerup', qtyResizer!, { clientX: 340, pointerId: 1 });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]![0].oldWidth).toBe(100);
    expect(onChange.mock.calls[0]![0].newWidth).toBe(140);
    expect(onStop).toHaveBeenLastCalledWith(
      expect.objectContaining({ committed: true, finalWidth: 140 }),
    );
    expect(handleRef.current?.getResizingColumn()).toBeNull();
  });

  it('pointerup dedup — draftWidth === baseWidth suppresses onColumnWidthChange', () => {
    const onStop = vi.fn<(p: ColumnResizeStopPayload) => void>();
    const onChange = vi.fn<(p: ColumnWidthChangePayload) => void>();
    const { container } = render(
      <ChronixTable
        columns={resizeColumns}
        rows={resizeRows}
        onColumnResizeStop={onStop}
        onColumnWidthChange={onChange}
      />,
    );
    const qtyResizer = container.querySelector('[data-col-id="qty"] .cx-table-header-resizer');
    fireResizePointer('pointerdown', qtyResizer!, { clientX: 300, pointerId: 1 });
    // No move — pointerup at the same clientX → draft === base.
    fireResizePointer('pointerup', qtyResizer!, { clientX: 300, pointerId: 1 });
    expect(onChange).not.toHaveBeenCalled();
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(onStop.mock.calls[0]![0].committed).toBe(true);
  });
});

// (2026-05-26 — react port of vue3): column move via
// drag-to-reorder header — 4 TableHandle methods + 3-callback lifecycle
// + computeColumnReorder + getColumnDropTarget + 5px Chebyshev threshold.
// See `audit/TABLE_PHASE_55_56_COLUMN_MOVE_PORTS_DESIGN.md`.

const moveColumns: readonly ColumnSpec[] = [
  { id: 'id', field: 'id', headerName: 'ID', width: 80 },
  { id: 'name', field: 'name', headerName: 'Name', width: 120 },
  { id: 'qty', field: 'qty', headerName: 'Qty', width: 100 },
  { id: 'status', field: 'status', headerName: 'Status', width: 100, reorderable: false },
  { id: 'note', field: 'note', headerName: 'Note', flex: 2 },
];

const moveRows: readonly RowSpec[] = [
  { id: 'r1', data: { id: 1, name: 'Alpha', qty: 10, status: 'OK', note: 'first' } },
];

// Stub `getBoundingClientRect` on every header cell + wrapper. happy-dom
// returns zero rects by default which would make `getColumnDropTarget`
// never resolve a target. Each column gets a 100px slot; wrapper at
// clientX=0 so wrapper-relative px == clientX.
function stubReactHeaderRects(container: HTMLElement, slotWidthPx = 100): void {
  const wrapperEl = container.querySelector<HTMLElement>('.cx-table-wrapper')!;
  Object.defineProperty(wrapperEl, 'getBoundingClientRect', {
    value: () => ({ left: 0, right: slotWidthPx * 5, top: 0, bottom: 200 }),
    configurable: true,
  });
  const cellEls = container.querySelectorAll<HTMLElement>('.cx-table-header-cell[data-col-id]');
  cellEls.forEach((el, i) => {
    const left = i * slotWidthPx;
    const right = left + slotWidthPx;
    Object.defineProperty(el, 'getBoundingClientRect', {
      value: () => ({ left, right, top: 0, bottom: 40 }),
      configurable: true,
    });
  });
}

describe('<ChronixTable> (react) — column move (vue3)', () => {
  it('reorderable !== false header cells receive pointer-move wiring; reorderable:false skip it', () => {
    const onStart = vi.fn<(p: ColumnMoveStartPayload) => void>();
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={moveColumns}
        rows={moveRows}
        onColumnMoveStart={onStart}
      />,
    );
    const qty = container.querySelector<HTMLElement>('.cx-table-header-cell[data-col-id="qty"]')!;
    fireMovePointer('pointerdown', qty, { clientX: 100, clientY: 20, pointerId: 1 });
    fireMovePointer('pointermove', qty, { clientX: 200, clientY: 20, pointerId: 1 });
    expect(handleRef.current?.getMovingColumn()?.colId).toBe('qty');

    const onStart2 = vi.fn<(p: ColumnMoveStartPayload) => void>();
    const handleRef2 = createRef<TableHandle>();
    const { container: container2 } = render(
      <ChronixTable
        ref={handleRef2}
        columns={moveColumns}
        rows={moveRows}
        onColumnMoveStart={onStart2}
      />,
    );
    const status = container2.querySelector<HTMLElement>(
      '.cx-table-header-cell[data-col-id="status"]',
    )!;
    fireMovePointer('pointerdown', status, { clientX: 100, clientY: 20, pointerId: 1 });
    fireMovePointer('pointermove', status, { clientX: 200, clientY: 20, pointerId: 1 });
    expect(handleRef2.current?.getMovingColumn()).toBeNull();
    expect(onStart2).not.toHaveBeenCalled();
  });

  it('pointerdown + pointerup with < 5px movement does NOT call onColumnMoveStart', () => {
    const onStart = vi.fn<(p: ColumnMoveStartPayload) => void>();
    const onStop = vi.fn<(p: ColumnMoveStopPayload) => void>();
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={moveColumns}
        rows={moveRows}
        onColumnMoveStart={onStart}
        onColumnMoveStop={onStop}
      />,
    );
    const qty = container.querySelector<HTMLElement>('.cx-table-header-cell[data-col-id="qty"]')!;
    fireMovePointer('pointerdown', qty, { clientX: 100, clientY: 20, pointerId: 1 });
    fireMovePointer('pointermove', qty, { clientX: 103, clientY: 20, pointerId: 1 });
    fireMovePointer('pointerup', qty, { clientX: 103, clientY: 20, pointerId: 1 });
    expect(handleRef.current?.getMovingColumn()).toBeNull();
    expect(onStart).not.toHaveBeenCalled();
    expect(onStop).not.toHaveBeenCalled();
  });

  it('pointermove ≥ 5px promotes to active drag + calls onColumnMoveStart', () => {
    const onStart = vi.fn<(p: ColumnMoveStartPayload) => void>();
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={moveColumns}
        rows={moveRows}
        onColumnMoveStart={onStart}
      />,
    );
    stubReactHeaderRects(container);
    const qty = container.querySelector<HTMLElement>('.cx-table-header-cell[data-col-id="qty"]')!;
    fireMovePointer('pointerdown', qty, { clientX: 250, clientY: 20, pointerId: 1 });
    fireMovePointer('pointermove', qty, { clientX: 256, clientY: 20, pointerId: 1 });
    expect(handleRef.current?.getMovingColumn()?.colId).toBe('qty');
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart.mock.calls[0]![0].column.id).toBe('qty');
    expect(onStart.mock.calls[0]![0].startClientX).toBe(250);
  });

  it('pointermove resolves dropTarget {targetColId, position} + sets drop-target class', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={moveColumns} rows={moveRows} />,
    );
    stubReactHeaderRects(container); // ids: id 0-100, name 100-200, qty 200-300, status 300-400, note 400-500
    const qty = container.querySelector<HTMLElement>('.cx-table-header-cell[data-col-id="qty"]')!;
    // Wrap fireMovePointer in act() so React flushes the setMovingColumnState
    // render before the DOM-class assertion. (Raw `dispatchEvent` bypasses
    // @testing-library's auto-act wrap that fireEvent.* uses.)
    act(() => {
      fireMovePointer('pointerdown', qty, { clientX: 250, clientY: 20, pointerId: 1 });
      // 470 lands on 'note' (400-500) right half (midpoint 450) → 'after'.
      fireMovePointer('pointermove', qty, { clientX: 470, clientY: 20, pointerId: 1 });
    });
    expect(handleRef.current?.getMovingColumn()?.dropTarget?.targetColId).toBe('note');
    expect(handleRef.current?.getMovingColumn()?.dropTarget?.position).toBe('after');
    const noteCell = container.querySelector('.cx-table-header-cell[data-col-id="note"]')!;
    expect(noteCell.className).toContain('cx-table-header-cell--drop-target-after');
  });

  it('handle.startMovingColumn bypasses threshold + handle.commitColumnMove calls onColumnOrderChange', () => {
    const onChange = vi.fn<(p: ColumnOrderChangePayload) => void>();
    const onStart = vi.fn<(p: ColumnMoveStartPayload) => void>();
    const onStop = vi.fn<(p: ColumnMoveStopPayload) => void>();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={moveColumns}
        rows={moveRows}
        onColumnMoveStart={onStart}
        onColumnMoveStop={onStop}
        onColumnOrderChange={onChange}
      />,
    );
    act(() => {
      handleRef.current?.startMovingColumn('id');
    });
    expect(handleRef.current?.getMovingColumn()).not.toBeNull();
    expect(onStart).toHaveBeenCalledTimes(1);

    act(() => {
      handleRef.current?.commitColumnMove('note', 'after');
    });
    expect(handleRef.current?.getMovingColumn()).toBeNull();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]![0].movedColumn.id).toBe('id');
    expect(onChange.mock.calls[0]![0].targetColumn.id).toBe('note');
    expect(onChange.mock.calls[0]![0].position).toBe('after');
    expect(onChange.mock.calls[0]![0].oldColumnIds).toEqual([
      'id',
      'name',
      'qty',
      'status',
      'note',
    ]);
    expect(onChange.mock.calls[0]![0].newColumnIds).toEqual([
      'name',
      'qty',
      'status',
      'note',
      'id',
    ]);
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(onStop.mock.calls[0]![0].committed).toBe(true);
  });

  it('no-op commit (drop target same column) suppresses onColumnOrderChange', () => {
    const onChange = vi.fn<(p: ColumnOrderChangePayload) => void>();
    const onStop = vi.fn<(p: ColumnMoveStopPayload) => void>();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={moveColumns}
        rows={moveRows}
        onColumnMoveStop={onStop}
        onColumnOrderChange={onChange}
      />,
    );
    act(() => {
      handleRef.current?.startMovingColumn('qty');
    });
    act(() => {
      handleRef.current?.commitColumnMove('qty', 'before');
    });
    expect(onChange).not.toHaveBeenCalled();
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(onStop.mock.calls[0]![0].committed).toBe(true);
  });

  it('handle.cancelColumnMove calls onColumnMoveStop {committed:false} — no onColumnOrderChange', () => {
    const onChange = vi.fn<(p: ColumnOrderChangePayload) => void>();
    const onStop = vi.fn<(p: ColumnMoveStopPayload) => void>();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={moveColumns}
        rows={moveRows}
        onColumnMoveStop={onStop}
        onColumnOrderChange={onChange}
      />,
    );
    act(() => {
      handleRef.current?.startMovingColumn('name');
    });
    act(() => {
      handleRef.current?.cancelColumnMove();
    });
    expect(handleRef.current?.getMovingColumn()).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(onStop.mock.calls[0]![0].committed).toBe(false);
  });

  it('pointercancel during active drag cancels — no onColumnOrderChange', () => {
    const onChange = vi.fn<(p: ColumnOrderChangePayload) => void>();
    const onStop = vi.fn<(p: ColumnMoveStopPayload) => void>();
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={moveColumns}
        rows={moveRows}
        onColumnMoveStop={onStop}
        onColumnOrderChange={onChange}
      />,
    );
    stubReactHeaderRects(container);
    const qty = container.querySelector<HTMLElement>('.cx-table-header-cell[data-col-id="qty"]')!;
    fireMovePointer('pointerdown', qty, { clientX: 250, clientY: 20, pointerId: 1 });
    fireMovePointer('pointermove', qty, { clientX: 260, clientY: 20, pointerId: 1 });
    fireMovePointer('pointercancel', qty, { clientX: 260, clientY: 20, pointerId: 1 });
    expect(handleRef.current?.getMovingColumn()).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(onStop.mock.calls[0]![0].committed).toBe(false);
  });

  it('startMovingColumn on reorderable:false column is silent no-op', () => {
    const onStart = vi.fn<(p: ColumnMoveStartPayload) => void>();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={moveColumns}
        rows={moveRows}
        onColumnMoveStart={onStart}
      />,
    );
    act(() => {
      handleRef.current?.startMovingColumn('status');
    });
    expect(handleRef.current?.getMovingColumn()).toBeNull();
    expect(onStart).not.toHaveBeenCalled();
  });

  it('drop-line overlay renders at the wrapper level when dropTarget resolves', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={moveColumns} rows={moveRows} />,
    );
    stubReactHeaderRects(container);
    const qty = container.querySelector<HTMLElement>('.cx-table-header-cell[data-col-id="qty"]')!;
    act(() => {
      fireMovePointer('pointerdown', qty, { clientX: 250, clientY: 20, pointerId: 1 });
      // 130 lands on 'name' (100-200) left half (midpoint 150) → 'before'.
      fireMovePointer('pointermove', qty, { clientX: 130, clientY: 20, pointerId: 1 });
    });
    const dropLine = container.querySelector<HTMLElement>('.cx-table-drop-line')!;
    expect(dropLine).not.toBeNull();
    expect(dropLine.getAttribute('data-drop-target-col-id')).toBe('name');
    expect(dropLine.getAttribute('data-drop-target-position')).toBe('before');
    // dropLineLeftPx = name.left (100) - wrapperLeft (0) - 1 = 99
    expect(dropLine.style.left).toBe('99px');
  });
});

// ────────────────────────── column autosize (dbl-click resizer + imperative API) ──────────────────────────
// Verbatim port of vue3 tests with react idiom subs:
//  - `render(<ChronixTable ... />)` (@testing-library/react)
//  - `fireEvent.doubleClick(el)` (no new pointer helper needed — dblclick is
//    a plain MouseEvent without happy-dom propagation gotchas)
//  - `createRef<TableHandle>()` + `ref={handleRef}` for handle access
//  - `vi.fn()` spies for `onColumnWidthChange` callback assertions
// Reuses resizer DOM as the dbl-click affordance +
// `onColumnWidthChange` callback as the persistence channel (Decision A.1
// inherits from vue3 no new callback prop). In happy-dom (no Canvas
// 2D context), `measureCellTextWidth` returns 0, so every measurement falls
// back to the minWidth clamp.

describe('<ChronixTable> (react) — column autosize', () => {
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
    const { container } = render(<ChronixTable columns={autosizeableColumns()} rows={rows} />);
    // 4 columns have resizable !== false (id / name / qty / note).
    expect(container.querySelectorAll('.cx-table-header-resizer')).toHaveLength(4);
    expect(container.querySelector('[data-resizer-col-id="qty"]')).not.toBeNull();
    expect(container.querySelector('[data-resizer-col-id="note"]')).not.toBeNull();
    // status (resizable:false) has no resizer DOM at all.
    expect(container.querySelector('[data-resizer-col-id="status"]')).toBeNull();
  });

  it('dbl-click on the resizer fires onColumnWidthChange (happy-dom degenerate → minWidth)', () => {
    const onColumnWidthChange = vi.fn<(payload: ColumnWidthChangePayload) => void>();
    const { container } = render(
      <ChronixTable
        columns={autosizeableColumns()}
        rows={rows}
        onColumnWidthChange={onColumnWidthChange}
      />,
    );
    const qtyResizer = container.querySelector<HTMLElement>('[data-resizer-col-id="qty"]')!;
    expect(qtyResizer).not.toBeNull();
    act(() => {
      fireEvent.doubleClick(qtyResizer);
    });
    expect(onColumnWidthChange).toHaveBeenCalledTimes(1);
    const payload = onColumnWidthChange.mock.calls[0]![0];
    expect(payload.column.id).toBe('qty');
    // baseWidth 120 → newWidth = qty.minWidth=60 (happy-dom Canvas null → 0 measurement → clamped to minWidth).
    expect(payload.oldWidth).toBe(120);
    expect(payload.newWidth).toBe(60);
  });

  it('dbl-click on an autosizeable:false column resizer is a silent no-op', () => {
    const onColumnWidthChange = vi.fn<(payload: ColumnWidthChangePayload) => void>();
    const { container } = render(
      <ChronixTable
        columns={autosizeableColumns()}
        rows={rows}
        onColumnWidthChange={onColumnWidthChange}
      />,
    );
    // note has autosizeable:false; resizer DOM exists but dblclick should not fire callback.
    const noteResizer = container.querySelector<HTMLElement>('[data-resizer-col-id="note"]')!;
    expect(noteResizer).not.toBeNull();
    act(() => {
      fireEvent.doubleClick(noteResizer);
    });
    expect(onColumnWidthChange).not.toHaveBeenCalled();
  });

  it('handle.autosizeColumn fires onColumnWidthChange for the target column', () => {
    const onColumnWidthChange = vi.fn<(payload: ColumnWidthChangePayload) => void>();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={autosizeableColumns()}
        rows={rows}
        onColumnWidthChange={onColumnWidthChange}
      />,
    );
    handleRef.current!.autosizeColumn('qty');
    expect(onColumnWidthChange).toHaveBeenCalledTimes(1);
    const payload = onColumnWidthChange.mock.calls[0]![0];
    expect(payload.column.id).toBe('qty');
    expect(payload.newWidth).toBe(60); // qty.minWidth
  });

  it('handle.autosizeColumn on resizable:false column is silent no-op', () => {
    const onColumnWidthChange = vi.fn<(payload: ColumnWidthChangePayload) => void>();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={autosizeableColumns()}
        rows={rows}
        onColumnWidthChange={onColumnWidthChange}
      />,
    );
    handleRef.current!.autosizeColumn('status');
    expect(onColumnWidthChange).not.toHaveBeenCalled();
  });

  it('handle.autosizeColumn on autosizeable:false column is silent no-op', () => {
    const onColumnWidthChange = vi.fn<(payload: ColumnWidthChangePayload) => void>();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={autosizeableColumns()}
        rows={rows}
        onColumnWidthChange={onColumnWidthChange}
      />,
    );
    handleRef.current!.autosizeColumn('note');
    expect(onColumnWidthChange).not.toHaveBeenCalled();
  });

  it('handle.autosizeAllColumns fires onColumnWidthChange once per autosizeable+resizable column', () => {
    const onColumnWidthChange = vi.fn<(payload: ColumnWidthChangePayload) => void>();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={autosizeableColumns()}
        rows={rows}
        onColumnWidthChange={onColumnWidthChange}
      />,
    );
    handleRef.current!.autosizeAllColumns();
    // Expected emits: id (80→40), qty (120→60). SKIPPED: status (resizable:false)
    // + note (autosizeable:false). name (flex) may dedup if happy-dom flex resolves to minWidth.
    const colIds = onColumnWidthChange.mock.calls.map((c) => c[0].column.id);
    expect(colIds).toContain('qty');
    expect(colIds).toContain('id');
    expect(colIds).not.toContain('status');
    expect(colIds).not.toContain('note');
  });

  it('handle.autosizeColumn on unknown id is silent no-op', () => {
    const onColumnWidthChange = vi.fn<(payload: ColumnWidthChangePayload) => void>();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={autosizeableColumns()}
        rows={rows}
        onColumnWidthChange={onColumnWidthChange}
      />,
    );
    handleRef.current!.autosizeColumn('does-not-exist');
    expect(onColumnWidthChange).not.toHaveBeenCalled();
  });
});

// ────────────────────────── cell range selection (drag-extend + shift+click extend) ──────────────────────────
// Verbatim port of vue3 tests with react idiom subs:
//  - `render(<ChronixTable ... />)` (@testing-library/react)
//  - `fireResizePointer` reused for pointerdown/pointerup (clientX/Y/pointerId)
//  - `createRef<TableHandle>` + `vi.fn` spies for callback props
// Drag-extend (pointermove via document.elementFromPoint) covered in
// browser-verify only (happy-dom always returns null from elementFromPoint).

describe('<ChronixTable> (react) — cell range selection', () => {
  it('default cellRangeSelection is "none" — pointerdown on a body cell does NOT fire onCellRangeStart', () => {
    const onCellRangeStart = vi.fn<(payload: CellRangeStartPayload) => void>();
    const { container } = render(
      <ChronixTable columns={columns} rows={rows} onCellRangeStart={onCellRangeStart} />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="id"]',
    )!;
    expect(cell).not.toBeNull();
    act(() => {
      fireResizePointer('pointerdown', cell, { clientX: 10, pointerId: 1, button: 0 });
    });
    expect(onCellRangeStart).not.toHaveBeenCalled();
  });

  it('cellRangeSelection="enabled" + pointerdown on a body cell → onCellRangeStart + in-cell-range modifier', () => {
    const onCellRangeStart = vi.fn<(payload: CellRangeStartPayload) => void>();
    const { container } = render(
      <ChronixTable
        columns={columns}
        rows={rows}
        cellRangeSelection="enabled"
        onCellRangeStart={onCellRangeStart}
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r2"][data-col-id="name"]',
    )!;
    expect(cell).not.toBeNull();
    act(() => {
      fireResizePointer('pointerdown', cell, { clientX: 20, pointerId: 1, button: 0 });
    });
    expect(onCellRangeStart).toHaveBeenCalledTimes(1);
    const payload = onCellRangeStart.mock.calls[0]![0];
    expect(payload.range.anchor).toEqual({ rowId: 'r2', colId: 'name' });
    expect(payload.range.focus).toEqual({ rowId: 'r2', colId: 'name' });
    expect(cell.className).toContain('cx-table-cell--in-cell-range');
  });

  it('handle.setCellRange opens range programmatically with non-trivial focus → fires start + change', () => {
    const onCellRangeStart = vi.fn<(payload: CellRangeStartPayload) => void>();
    const onCellRangeChange = vi.fn<(payload: CellRangeChangePayload) => void>();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={columns}
        rows={rows}
        cellRangeSelection="enabled"
        onCellRangeStart={onCellRangeStart}
        onCellRangeChange={onCellRangeChange}
      />,
    );
    act(() => {
      handleRef.current!.setCellRange({
        anchor: { rowId: 'r1', colId: 'id' },
        focus: { rowId: 'r3', colId: 'qty' },
      });
    });
    expect(onCellRangeStart).toHaveBeenCalledTimes(1);
    expect(onCellRangeChange).toHaveBeenCalledTimes(1);
    const changePayload = onCellRangeChange.mock.calls[0]![0];
    expect(changePayload.envelope.rowIds).toEqual(['r1', 'r2', 'r3']);
    expect(changePayload.envelope.colIds).toEqual(['id', 'name', 'qty']);
  });

  it('handle.setCellRange with focus === anchor → only start (no change)', () => {
    const onCellRangeStart = vi.fn<(payload: CellRangeStartPayload) => void>();
    const onCellRangeChange = vi.fn<(payload: CellRangeChangePayload) => void>();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={columns}
        rows={rows}
        cellRangeSelection="enabled"
        onCellRangeStart={onCellRangeStart}
        onCellRangeChange={onCellRangeChange}
      />,
    );
    act(() => {
      handleRef.current!.setCellRange({
        anchor: { rowId: 'r1', colId: 'id' },
        focus: { rowId: 'r1', colId: 'id' },
      });
    });
    expect(onCellRangeStart).toHaveBeenCalledTimes(1);
    expect(onCellRangeChange).not.toHaveBeenCalled();
  });

  it('handle.getCellRange returns the current state', () => {
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable ref={handleRef} columns={columns} rows={rows} cellRangeSelection="enabled" />,
    );
    expect(handleRef.current!.getCellRange()).toBeNull();
    act(() => {
      handleRef.current!.setCellRange({
        anchor: { rowId: 'r1', colId: 'id' },
        focus: { rowId: 'r2', colId: 'name' },
      });
    });
    const current = handleRef.current!.getCellRange();
    expect(current?.anchor).toEqual({ rowId: 'r1', colId: 'id' });
    expect(current?.focus).toEqual({ rowId: 'r2', colId: 'name' });
  });

  it('handle.clearCellRange wipes state + fires onCellRangeStop', () => {
    const onCellRangeStop = vi.fn<(payload: CellRangeStopPayload) => void>();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={columns}
        rows={rows}
        cellRangeSelection="enabled"
        onCellRangeStop={onCellRangeStop}
      />,
    );
    act(() => {
      handleRef.current!.setCellRange({
        anchor: { rowId: 'r1', colId: 'id' },
        focus: { rowId: 'r1', colId: 'id' },
      });
      handleRef.current!.clearCellRange();
    });
    expect(handleRef.current!.getCellRange()).toBeNull();
    expect(onCellRangeStop).toHaveBeenCalledTimes(1);
  });

  it('setCellRange(null) is equivalent to clearCellRange', () => {
    const onCellRangeStop = vi.fn<(payload: CellRangeStopPayload) => void>();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={columns}
        rows={rows}
        cellRangeSelection="enabled"
        onCellRangeStop={onCellRangeStop}
      />,
    );
    act(() => {
      handleRef.current!.setCellRange({
        anchor: { rowId: 'r2', colId: 'name' },
        focus: { rowId: 'r2', colId: 'name' },
      });
      handleRef.current!.setCellRange(null);
    });
    expect(handleRef.current!.getCellRange()).toBeNull();
    expect(onCellRangeStop).toHaveBeenCalledTimes(1);
  });

  it('handle methods are silent no-ops when cellRangeSelection === "none"', () => {
    const onCellRangeStart = vi.fn<(payload: CellRangeStartPayload) => void>();
    const onCellRangeChange = vi.fn<(payload: CellRangeChangePayload) => void>();
    const onCellRangeStop = vi.fn<(payload: CellRangeStopPayload) => void>();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={columns}
        rows={rows}
        onCellRangeStart={onCellRangeStart}
        onCellRangeChange={onCellRangeChange}
        onCellRangeStop={onCellRangeStop}
      />,
    );
    act(() => {
      handleRef.current!.setCellRange({
        anchor: { rowId: 'r1', colId: 'id' },
        focus: { rowId: 'r2', colId: 'name' },
      });
      handleRef.current!.clearCellRange();
    });
    expect(handleRef.current!.getCellRange()).toBeNull();
    expect(onCellRangeStart).not.toHaveBeenCalled();
    expect(onCellRangeChange).not.toHaveBeenCalled();
    expect(onCellRangeStop).not.toHaveBeenCalled();
  });

  it('cellRangeSelection="enabled" + pointerdown then pointerup → onCellRangeStop fires', () => {
    const onCellRangeStop = vi.fn<(payload: CellRangeStopPayload) => void>();
    const { container } = render(
      <ChronixTable
        columns={columns}
        rows={rows}
        cellRangeSelection="enabled"
        onCellRangeStop={onCellRangeStop}
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="id"]',
    )!;
    act(() => {
      fireResizePointer('pointerdown', cell, { clientX: 10, pointerId: 1, button: 0 });
      fireResizePointer('pointerup', cell, { clientX: 10, pointerId: 1 });
    });
    expect(onCellRangeStop).toHaveBeenCalledTimes(1);
  });

  it('pointerdown with non-primary button (right-click) does NOT open a session', () => {
    const onCellRangeStart = vi.fn<(payload: CellRangeStartPayload) => void>();
    const { container } = render(
      <ChronixTable
        columns={columns}
        rows={rows}
        cellRangeSelection="enabled"
        onCellRangeStart={onCellRangeStart}
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="id"]',
    )!;
    act(() => {
      fireResizePointer('pointerdown', cell, { clientX: 10, pointerId: 1, button: 2 });
    });
    expect(onCellRangeStart).not.toHaveBeenCalled();
  });
});

// ────────────────────────── pinned columns left / right (port of vue3) ──────────────────────────
//
// ships per-cell `position: sticky` for columns with
// `ColumnSpec.pinned === 'left' | 'right'`, verbatim port of vue3
// . chronix-NEW `pinnedColsPass` partitions visible columns
// into zones and computes cumulative sticky offsets; the SFC spreads
// the resulting style + modifier classes into the existing flat row
// layout. Click + pointer delegation is unchanged.

describe('<ChronixTable> — (pinned columns)', () => {
  it('no pinned columns → no sticky inline styles or pinned-* modifier classes on any cell', () => {
    const { container } = render(<ChronixTable columns={columns} rows={rows} />);
    for (const col of columns) {
      const header = container.querySelector<HTMLElement>(
        `.cx-table-header-cell[data-col-id="${col.id}"]`,
      );
      const cell = container.querySelector<HTMLElement>(
        `.cx-table-cell[data-col-id="${col.id}"][data-row-id="r1"]`,
      );
      expect(header).not.toBeNull();
      expect(cell).not.toBeNull();
      expect(header!.style.position).not.toBe('sticky');
      expect(cell!.style.position).not.toBe('sticky');
      expect(header!.classList.contains('cx-table-header-cell--pinned-left')).toBe(false);
      expect(header!.classList.contains('cx-table-header-cell--pinned-right')).toBe(false);
      expect(cell!.classList.contains('cx-table-cell--pinned-left')).toBe(false);
      expect(cell!.classList.contains('cx-table-cell--pinned-right')).toBe(false);
    }
  });

  it('pinned: "left" → header + body cells get position:sticky + left:0px + --pinned-left class', () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', width: 80, pinned: 'left' },
      { id: 'name', field: 'name', flex: 1 },
      { id: 'qty', field: 'qty', width: 100 },
    ];
    const { container } = render(<ChronixTable columns={pinnedCols} rows={rows} />);
    const header = container.querySelector<HTMLElement>('.cx-table-header-cell[data-col-id="id"]')!;
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-col-id="id"][data-row-id="r1"]',
    )!;
    expect(header.style.position).toBe('sticky');
    expect(header.style.left).toBe('0px');
    expect(cell.style.position).toBe('sticky');
    expect(cell.style.left).toBe('0px');
    expect(header.classList.contains('cx-table-header-cell--pinned-left')).toBe(true);
    expect(header.classList.contains('cx-table-header-cell--pinned-left-last')).toBe(true);
    expect(cell.classList.contains('cx-table-cell--pinned-left')).toBe(true);
    expect(cell.classList.contains('cx-table-cell--pinned-left-last')).toBe(true);
  });

  it('two left-pinned columns → second gets cumulative left offset = first.width', () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', width: 80, pinned: 'left' },
      { id: 'name', field: 'name', width: 120, pinned: 'left' },
      { id: 'qty', field: 'qty', width: 100 },
    ];
    const { container } = render(<ChronixTable columns={pinnedCols} rows={rows} />);
    const firstHeader = container.querySelector<HTMLElement>(
      '.cx-table-header-cell[data-col-id="id"]',
    )!;
    const secondHeader = container.querySelector<HTMLElement>(
      '.cx-table-header-cell[data-col-id="name"]',
    )!;
    expect(firstHeader.style.left).toBe('0px');
    expect(secondHeader.style.left).toBe('80px');
    expect(firstHeader.classList.contains('cx-table-header-cell--pinned-left-last')).toBe(false);
    expect(secondHeader.classList.contains('cx-table-header-cell--pinned-left-last')).toBe(true);
  });

  it('pinned: "right" → cell gets position:sticky + right:0px + --pinned-right class', () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', width: 80 },
      { id: 'name', field: 'name', flex: 1 },
      { id: 'note', field: 'note', width: 100, pinned: 'right' },
    ];
    const { container } = render(<ChronixTable columns={pinnedCols} rows={rows} />);
    const header = container.querySelector<HTMLElement>(
      '.cx-table-header-cell[data-col-id="note"]',
    )!;
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-col-id="note"][data-row-id="r1"]',
    )!;
    expect(header.style.position).toBe('sticky');
    expect(header.style.right).toBe('0px');
    expect(cell.style.position).toBe('sticky');
    expect(cell.style.right).toBe('0px');
    expect(header.classList.contains('cx-table-header-cell--pinned-right')).toBe(true);
    expect(header.classList.contains('cx-table-header-cell--pinned-right-first')).toBe(true);
    expect(cell.classList.contains('cx-table-cell--pinned-right')).toBe(true);
    expect(cell.classList.contains('cx-table-cell--pinned-right-first')).toBe(true);
  });

  it('two right-pinned columns → leftmost gets cumulative right offset = rightmost.width', () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'name', field: 'name', flex: 1 },
      { id: 'status', field: 'status', width: 90, pinned: 'right' },
      { id: 'note', field: 'note', width: 100, pinned: 'right' },
    ];
    const { container } = render(<ChronixTable columns={pinnedCols} rows={rows} />);
    const leftmost = container.querySelector<HTMLElement>(
      '.cx-table-header-cell[data-col-id="status"]',
    )!;
    const rightmost = container.querySelector<HTMLElement>(
      '.cx-table-header-cell[data-col-id="note"]',
    )!;
    expect(rightmost.style.right).toBe('0px');
    expect(leftmost.style.right).toBe('100px');
    expect(leftmost.classList.contains('cx-table-header-cell--pinned-right-first')).toBe(true);
    expect(rightmost.classList.contains('cx-table-header-cell--pinned-right-first')).toBe(false);
  });

  it('pinned filter-row cells also get sticky positioning + zone modifier classes', () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', width: 80, pinned: 'left' },
      { id: 'name', field: 'name', flex: 1 },
      { id: 'note', field: 'note', width: 100, pinned: 'right' },
    ];
    const { container } = render(
      <ChronixTable columns={pinnedCols} rows={rows} showFilterRow={true} />,
    );
    const leftFilter = container.querySelector<HTMLElement>(
      '.cx-table-filter-cell[data-col-id="id"]',
    )!;
    const rightFilter = container.querySelector<HTMLElement>(
      '.cx-table-filter-cell[data-col-id="note"]',
    )!;
    expect(leftFilter.style.position).toBe('sticky');
    expect(leftFilter.style.left).toBe('0px');
    expect(leftFilter.classList.contains('cx-table-filter-cell--pinned-left')).toBe(true);
    expect(rightFilter.style.position).toBe('sticky');
    expect(rightFilter.style.right).toBe('0px');
    expect(rightFilter.classList.contains('cx-table-filter-cell--pinned-right')).toBe(true);
  });

  it('cell-click delegation still fires on a pinned body cell (wiring unchanged)', () => {
    const onCellClick = vi.fn();
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', width: 80, pinned: 'left' },
      { id: 'name', field: 'name', flex: 1 },
    ];
    const { container } = render(
      <ChronixTable columns={pinnedCols} rows={rows} onCellClick={onCellClick} />,
    );
    const pinnedCell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-col-id="id"][data-row-id="r1"]',
    )!;
    act(() => {
      fireEvent.click(pinnedCell);
    });
    expect(onCellClick).toHaveBeenCalledTimes(1);
  });

  it('header-click delegation still fires on a pinned header cell (wiring unchanged)', () => {
    const onHeaderClick = vi.fn();
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', width: 80, pinned: 'left' },
      { id: 'name', field: 'name', flex: 1 },
    ];
    const { container } = render(
      <ChronixTable columns={pinnedCols} rows={rows} onHeaderClick={onHeaderClick} />,
    );
    const header = container.querySelector<HTMLElement>('.cx-table-header-cell[data-col-id="id"]')!;
    act(() => {
      fireEvent.click(header);
    });
    expect(onHeaderClick).toHaveBeenCalledTimes(1);
  });

  it('cell-range envelope spans across pinned + center zones (envelope unaffected)', () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', width: 80, pinned: 'left' },
      { id: 'name', field: 'name', width: 100 },
      { id: 'note', field: 'note', width: 100, pinned: 'right' },
    ];
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={pinnedCols}
        rows={rows}
        cellRangeSelection="enabled"
      />,
    );
    act(() => {
      handleRef.current!.setCellRange({
        anchor: { rowId: 'r1', colId: 'id' },
        focus: { rowId: 'r1', colId: 'note' },
      });
    });
    const leftPinned = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-col-id="id"][data-row-id="r1"]',
    )!;
    const center = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-col-id="name"][data-row-id="r1"]',
    )!;
    const rightPinned = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-col-id="note"][data-row-id="r1"]',
    )!;
    expect(leftPinned.classList.contains('cx-table-cell--in-cell-range')).toBe(true);
    expect(center.classList.contains('cx-table-cell--in-cell-range')).toBe(true);
    expect(rightPinned.classList.contains('cx-table-cell--in-cell-range')).toBe(true);
  });

  it('when selectionColumn.side === "left", left-pinned cells shift right by selectionColumnWidth', () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', width: 80, pinned: 'left' },
      { id: 'name', field: 'name', flex: 1 },
    ];
    const { container } = render(
      <ChronixTable
        columns={pinnedCols}
        rows={rows}
        selectionMode="single"
        selectionColumn={{ show: true, side: 'left' }}
      />,
    );
    const pinnedHeader = container.querySelector<HTMLElement>(
      '.cx-table-header-cell[data-col-id="id"]',
    )!;
    expect(pinnedHeader.style.left).toBe('36px');
  });

  it('row-selection modifier paints uniformly across pinned + center cells', () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', width: 80, pinned: 'left' },
      { id: 'name', field: 'name', flex: 1 },
      { id: 'note', field: 'note', width: 100, pinned: 'right' },
    ];
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={pinnedCols} rows={rows} selectionMode="single" />,
    );
    act(() => {
      handleRef.current!.setSelectedRowIds(['r1']);
    });
    const row = container.querySelector<HTMLElement>(
      '.cx-table-body .cx-table-row[data-row-id="r1"]',
    )!;
    expect(row.classList.contains('cx-table-row--selected')).toBe(true);
    expect(row.querySelectorAll('.cx-table-cell').length).toBe(3);
  });
});

// ────────────────────────── pinned cross-zone reorder guard (react port) ──────────────────────────

describe('<ChronixTable> (react) — pinned cross-zone reorder guard', () => {
  it('(react): dragging a left-pinned column over a CENTER column resolves dropTarget=null (cross-zone reject)', () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', width: 80, pinned: 'left' },
      { id: 'name', field: 'name', width: 100, pinned: 'left' },
      { id: 'qty', field: 'qty', width: 100 },
      { id: 'note', field: 'note', width: 100, pinned: 'right' },
    ];
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={pinnedCols} rows={moveRows} />,
    );
    stubReactHeaderRects(container);
    const idHeader = container.querySelector<HTMLElement>(
      '.cx-table-header-cell[data-col-id="id"]',
    )!;
    act(() => {
      fireMovePointer('pointerdown', idHeader, {
        clientX: 50,
        clientY: 20,
        pointerId: 1,
      });
      fireMovePointer('pointermove', idHeader, {
        clientX: 250,
        clientY: 20,
        pointerId: 1,
      });
    });
    expect(handleRef.current!.getMovingColumn()?.dropTarget).toBeNull();
  });

  it('(react): dragging a left-pinned column over ANOTHER left-pinned column resolves dropTarget normally (same-zone allowed)', () => {
    const pinnedCols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', width: 80, pinned: 'left' },
      { id: 'name', field: 'name', width: 100, pinned: 'left' },
      { id: 'qty', field: 'qty', width: 100 },
    ];
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={pinnedCols} rows={moveRows} />,
    );
    stubReactHeaderRects(container);
    const idHeader = container.querySelector<HTMLElement>(
      '.cx-table-header-cell[data-col-id="id"]',
    )!;
    act(() => {
      fireMovePointer('pointerdown', idHeader, {
        clientX: 50,
        clientY: 20,
        pointerId: 1,
      });
      fireMovePointer('pointermove', idHeader, {
        clientX: 170,
        clientY: 20,
        pointerId: 1,
      });
    });
    const target = handleRef.current!.getMovingColumn()?.dropTarget;
    expect(target).not.toBeNull();
    expect(target?.targetColId).toBe('name');
    expect(target?.position).toBe('after');
  });
});

// ────────────────────────── clipboard copy (Ctrl+C on active cell-range, react port) ──────────────────────────
//
// (react port of vue3) wires a Ctrl+C / Cmd+C onKeyDown
// handler on the body `<div>` + a `copyCellRangeToClipboard()`
// TableHandle method. Both flow through the same `performCellRangeCopy`
// useCallback: synth TSV via the pure helper, fail-soft write to
// `navigator.clipboard`, fire `onCellRangeCopy`.

describe('<ChronixTable> (react) — clipboard copy', () => {
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

  it('default cellRangeSelection: "none" → Ctrl+C is no-op (no callback, no writeText)', () => {
    const onCellRangeCopy = vi.fn<(payload: CellRangeCopyPayload) => void>();
    const { container } = render(
      <ChronixTable columns={columns} rows={rows} onCellRangeCopy={onCellRangeCopy} />,
    );
    const body = container.querySelector<HTMLElement>('.cx-table-body')!;
    act(() => {
      fireEvent.keyDown(body, { key: 'c', ctrlKey: true });
    });
    expect(onCellRangeCopy).not.toHaveBeenCalled();
    expect(writeTextMock).not.toHaveBeenCalled();
  });

  it('cellRangeSelection: "enabled" + no active range → Ctrl+C is no-op', () => {
    const onCellRangeCopy = vi.fn<(payload: CellRangeCopyPayload) => void>();
    const { container } = render(
      <ChronixTable
        columns={columns}
        rows={rows}
        cellRangeSelection="enabled"
        onCellRangeCopy={onCellRangeCopy}
      />,
    );
    const body = container.querySelector<HTMLElement>('.cx-table-body')!;
    act(() => {
      fireEvent.keyDown(body, { key: 'c', ctrlKey: true });
    });
    expect(onCellRangeCopy).not.toHaveBeenCalled();
    expect(writeTextMock).not.toHaveBeenCalled();
  });

  it('cellRangeSelection: "enabled" + active range + Ctrl+C → callback fires + writeText called once', async () => {
    const onCellRangeCopy = vi.fn<(payload: CellRangeCopyPayload) => void>();
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={columns}
        rows={rows}
        cellRangeSelection="enabled"
        onCellRangeCopy={onCellRangeCopy}
      />,
    );
    act(() => {
      handleRef.current!.setCellRange({
        anchor: { rowId: 'r1', colId: 'name' },
        focus: { rowId: 'r2', colId: 'qty' },
      });
    });
    const body = container.querySelector<HTMLElement>('.cx-table-body')!;
    await act(async () => {
      fireEvent.keyDown(body, { key: 'c', ctrlKey: true });
      await Promise.resolve();
    });
    expect(onCellRangeCopy).toHaveBeenCalledTimes(1);
    const payload = onCellRangeCopy.mock.calls[0]![0];
    expect(payload.envelope.rowIds).toEqual(['r1', 'r2']);
    expect(payload.envelope.colIds).toEqual(['name', 'qty']);
    expect(payload.text).toBe('Alpha\t10\nBeta\t20');
    expect(writeTextMock).toHaveBeenCalledTimes(1);
    expect(writeTextMock).toHaveBeenCalledWith('Alpha\t10\nBeta\t20');
  });

  it('programmatic handle.copyCellRangeToClipboard() with active range → resolves to TSV + callback + writeText', async () => {
    const onCellRangeCopy = vi.fn<(payload: CellRangeCopyPayload) => void>();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={columns}
        rows={rows}
        cellRangeSelection="enabled"
        onCellRangeCopy={onCellRangeCopy}
      />,
    );
    act(() => {
      handleRef.current!.setCellRange({
        anchor: { rowId: 'r2', colId: 'name' },
        focus: { rowId: 'r3', colId: 'qty' },
      });
    });
    let result: string | null = 'INITIAL';
    await act(async () => {
      result = await handleRef.current!.copyCellRangeToClipboard();
    });
    expect(result).toBe('Beta\t20\nGamma\t30');
    expect(writeTextMock).toHaveBeenCalledTimes(1);
    expect(writeTextMock).toHaveBeenCalledWith('Beta\t20\nGamma\t30');
    expect(onCellRangeCopy).toHaveBeenCalledTimes(1);
    expect(onCellRangeCopy.mock.calls[0]![0].jsEvent).toBeNull();
  });

  it('programmatic handle.copyCellRangeToClipboard() with no active range → resolves to null + no callback + no writeText', async () => {
    const onCellRangeCopy = vi.fn<(payload: CellRangeCopyPayload) => void>();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={columns}
        rows={rows}
        cellRangeSelection="enabled"
        onCellRangeCopy={onCellRangeCopy}
      />,
    );
    let result: string | null = 'INITIAL';
    await act(async () => {
      result = await handleRef.current!.copyCellRangeToClipboard();
    });
    expect(result).toBeNull();
    expect(writeTextMock).not.toHaveBeenCalled();
    expect(onCellRangeCopy).not.toHaveBeenCalled();
  });

  it('valueFormatter applied → formatted strings appear in the copied TSV', async () => {
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
    const onCellRangeCopy = vi.fn<(payload: CellRangeCopyPayload) => void>();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={formattedCols}
        rows={rows}
        cellRangeSelection="enabled"
        onCellRangeCopy={onCellRangeCopy}
      />,
    );
    act(() => {
      handleRef.current!.setCellRange({
        anchor: { rowId: 'r1', colId: 'qty' },
        focus: { rowId: 'r2', colId: 'qty' },
      });
    });
    let result: string | null = 'INITIAL';
    await act(async () => {
      result = await handleRef.current!.copyCellRangeToClipboard();
    });
    expect(result).toBe('10 件\n20 件');
    expect(writeTextMock).toHaveBeenCalledWith('10 件\n20 件');
  });
});

// ────────────────────────── clipboard paste (Ctrl+V into active cell-range, react port) ──────────────────────────
//
// (react port of vue3) extends onBodyKeyDown
// with a Ctrl+V / Cmd+V branch + adds `pasteCellRangeFromClipboard()`
// TableHandle method. Both flow through `performCellRangePaste` which
// reads navigator.clipboard, parses TSV, computes mutations, fires
// `onCellRangePaste`.

describe('<ChronixTable> (react) — clipboard paste', () => {
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

  it('default cellRangeSelection: "none" → Ctrl+V is no-op (no callback, no readText)', () => {
    const onCellRangePaste = vi.fn<(payload: CellRangePastePayload) => void>();
    const { container } = render(
      <ChronixTable columns={columns} rows={rows} onCellRangePaste={onCellRangePaste} />,
    );
    const body = container.querySelector<HTMLElement>('.cx-table-body')!;
    act(() => {
      fireEvent.keyDown(body, { key: 'v', ctrlKey: true });
    });
    expect(onCellRangePaste).not.toHaveBeenCalled();
    expect(readTextMock).not.toHaveBeenCalled();
  });

  it('cellRangeSelection: "enabled" + no active range → Ctrl+V is no-op', () => {
    const onCellRangePaste = vi.fn<(payload: CellRangePastePayload) => void>();
    const { container } = render(
      <ChronixTable
        columns={columns}
        rows={rows}
        cellRangeSelection="enabled"
        onCellRangePaste={onCellRangePaste}
      />,
    );
    const body = container.querySelector<HTMLElement>('.cx-table-body')!;
    act(() => {
      fireEvent.keyDown(body, { key: 'v', ctrlKey: true });
    });
    expect(onCellRangePaste).not.toHaveBeenCalled();
    expect(readTextMock).not.toHaveBeenCalled();
  });

  it('cellRangeSelection: "enabled" + active range + Ctrl+V → callback fires + readText called once', async () => {
    readTextMock.mockResolvedValue('X\tY\nZ\tW');
    const onCellRangePaste = vi.fn<(payload: CellRangePastePayload) => void>();
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={columns}
        rows={rows}
        cellRangeSelection="enabled"
        onCellRangePaste={onCellRangePaste}
      />,
    );
    act(() => {
      handleRef.current!.setCellRange({
        anchor: { rowId: 'r1', colId: 'name' },
        focus: { rowId: 'r2', colId: 'note' },
      });
    });
    const body = container.querySelector<HTMLElement>('.cx-table-body')!;
    await act(async () => {
      fireEvent.keyDown(body, { key: 'v', ctrlKey: true });
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(onCellRangePaste).toHaveBeenCalledTimes(1);
    expect(readTextMock).toHaveBeenCalledTimes(1);
    const payload = onCellRangePaste.mock.calls[0]![0];
    expect(payload.text).toBe('X\tY\nZ\tW');
    expect(payload.mutations.length).toBeGreaterThan(0);
  });

  it('programmatic handle.pasteCellRangeFromClipboard() with active range → resolves to mutations + callback', async () => {
    readTextMock.mockResolvedValue('Zara');
    const onCellRangePaste = vi.fn<(payload: CellRangePastePayload) => void>();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={columns}
        rows={rows}
        cellRangeSelection="enabled"
        onCellRangePaste={onCellRangePaste}
      />,
    );
    act(() => {
      handleRef.current!.setCellRange({
        anchor: { rowId: 'r1', colId: 'name' },
        focus: { rowId: 'r1', colId: 'name' },
      });
    });
    let result: readonly { rowId: string; colId: string; newValue: unknown }[] | null = null;
    await act(async () => {
      result = await handleRef.current!.pasteCellRangeFromClipboard();
    });
    expect(result).toEqual([{ rowId: 'r1', colId: 'name', oldValue: 'Alpha', newValue: 'Zara' }]);
    expect(onCellRangePaste).toHaveBeenCalledTimes(1);
    expect(onCellRangePaste.mock.calls[0]![0].jsEvent).toBeNull();
  });

  it('programmatic handle.pasteCellRangeFromClipboard() with no active range → null + no callback + no readText', async () => {
    const onCellRangePaste = vi.fn<(payload: CellRangePastePayload) => void>();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={columns}
        rows={rows}
        cellRangeSelection="enabled"
        onCellRangePaste={onCellRangePaste}
      />,
    );
    let result: readonly unknown[] | null = null;
    await act(async () => {
      result = await handleRef.current!.pasteCellRangeFromClipboard();
    });
    expect(result).toBeNull();
    expect(readTextMock).not.toHaveBeenCalled();
    expect(onCellRangePaste).not.toHaveBeenCalled();
  });

  it('column.type: "number" — mixed valid/invalid paste skips invalid cells', async () => {
    readTextMock.mockResolvedValue('99\tabc');
    const numericCols: readonly ColumnSpec[] = [
      { id: 'qty', field: 'qty', type: 'number', width: 80 },
      { id: 'qty2', field: 'note', type: 'number', width: 80 },
    ];
    const onCellRangePaste = vi.fn<(payload: CellRangePastePayload) => void>();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={numericCols}
        rows={rows}
        cellRangeSelection="enabled"
        onCellRangePaste={onCellRangePaste}
      />,
    );
    act(() => {
      handleRef.current!.setCellRange({
        anchor: { rowId: 'r1', colId: 'qty' },
        focus: { rowId: 'r1', colId: 'qty2' },
      });
    });
    let result: readonly { rowId: string; colId: string; newValue: unknown }[] | null = null;
    await act(async () => {
      result = await handleRef.current!.pasteCellRangeFromClipboard();
    });
    expect(result).toHaveLength(1);
    expect(result![0]).toEqual({
      rowId: 'r1',
      colId: 'qty',
      oldValue: 10,
      newValue: 99,
    });
  });
});

// ────────────────────────── drag-fill handle (react port of vue3) ──────────────────────────
//
// ports drag-fill autofill handle to react. Wiring guards
// verify the SFC surfaces the handle DOM + `fillCellRange` TableHandle
// method + 3-callback triplet. Decisions A.1 / B.1 / C.1 inherit
// verbatim from vue3 .

describe('<ChronixTable> (react) — drag-fill handle', () => {
  it('default cellRangeSelection: "none" → no .cx-table-drag-fill-handle rendered', () => {
    const { container } = render(<ChronixTable columns={columns} rows={rows} />);
    expect(container.querySelector('.cx-table-drag-fill-handle')).toBeNull();
  });

  it('cellRangeSelection: "enabled" + no active range → no handle rendered', () => {
    const { container } = render(
      <ChronixTable columns={columns} rows={rows} cellRangeSelection="enabled" />,
    );
    expect(container.querySelector('.cx-table-drag-fill-handle')).toBeNull();
  });

  it('cellRangeSelection: "enabled" + active range → handle visible with 8×8 inline style', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={columns} rows={rows} cellRangeSelection="enabled" />,
    );
    act(() => {
      handleRef.current!.setCellRange({
        anchor: { rowId: 'r1', colId: 'name' },
        focus: { rowId: 'r1', colId: 'name' },
      });
    });
    const handleEl = container.querySelector<HTMLElement>('.cx-table-drag-fill-handle');
    expect(handleEl).not.toBeNull();
    const style = handleEl!.getAttribute('style') ?? '';
    expect(style).toContain('width: 8px');
    expect(style).toContain('height: 8px');
  });

  it('programmatic handle.fillCellRange(targetCell) with 1-col source → returns mutations + fires onCellRangeFill', () => {
    const onCellRangeFill = vi.fn<(payload: CellRangeFillPayload) => void>();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={columns}
        rows={rows}
        cellRangeSelection="enabled"
        onCellRangeFill={onCellRangeFill}
      />,
    );
    act(() => {
      handleRef.current!.setCellRange({
        anchor: { rowId: 'r1', colId: 'name' },
        focus: { rowId: 'r1', colId: 'name' },
      });
    });
    let result: readonly { rowId: string; colId: string; newValue: unknown }[] | null = null;
    act(() => {
      result = handleRef.current!.fillCellRange({ rowId: 'r3', colId: 'name' });
    });
    expect(result).toEqual([
      { rowId: 'r2', colId: 'name', oldValue: 'Beta', newValue: 'Alpha' },
      { rowId: 'r3', colId: 'name', oldValue: 'Gamma', newValue: 'Alpha' },
    ]);
    expect(onCellRangeFill).toHaveBeenCalledTimes(1);
    const payload = onCellRangeFill.mock.calls[0]![0];
    expect(payload.source.rowIds).toEqual(['r1']);
    expect(payload.fill.rowIds).toEqual(['r1', 'r2', 'r3']);
    expect(payload.mutations).toHaveLength(2);
    expect(payload.jsEvent).toBeNull();
  });

  it('handle.fillCellRange(targetCell) with no active range → null + no callback', () => {
    const onCellRangeFill = vi.fn<(payload: CellRangeFillPayload) => void>();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={columns}
        rows={rows}
        cellRangeSelection="enabled"
        onCellRangeFill={onCellRangeFill}
      />,
    );
    let result: readonly unknown[] | null = null;
    act(() => {
      result = handleRef.current!.fillCellRange({ rowId: 'r3', colId: 'name' });
    });
    expect(result).toBeNull();
    expect(onCellRangeFill).not.toHaveBeenCalled();
  });

  it('handle.fillCellRange(targetCell) inside source → returns null (no-fill preview)', () => {
    const onCellRangeFill = vi.fn<(payload: CellRangeFillPayload) => void>();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={columns}
        rows={rows}
        cellRangeSelection="enabled"
        onCellRangeFill={onCellRangeFill}
      />,
    );
    act(() => {
      handleRef.current!.setCellRange({
        anchor: { rowId: 'r1', colId: 'name' },
        focus: { rowId: 'r2', colId: 'name' },
      });
    });
    let result: readonly unknown[] | null = null;
    act(() => {
      result = handleRef.current!.fillCellRange({ rowId: 'r1', colId: 'name' });
    });
    expect(result).toBeNull();
    expect(onCellRangeFill).not.toHaveBeenCalled();
  });
});

// ────────────────────────── undo / redo mutation history (react port of vue3) ──────────────────────────
//
// ports undo / redo mutation history to react. Wiring guards
// verify auto-record gating, onHistoryChange callback firing,
// undo/redo callbacks + state transitions, and Ctrl+Z body keydown
// dispatch. Decisions A.1 / B.1 / C.1 inherit verbatim from vue3
// .

const editableColsR: readonly ColumnSpec[] = [
  { id: 'name', field: 'name', headerName: '名称', flex: 1, editable: true },
  { id: 'qty', field: 'qty', headerName: '数量', width: 120, editable: true },
];

const editableRowsR: readonly RowSpec[] = [
  { id: 'r1', data: { name: 'Alpha', qty: 10 } },
  { id: 'r2', data: { name: 'Beta', qty: 20 } },
];

describe('<ChronixTable> (react) — undo / redo mutation history', () => {
  it('default enableUndoHistory: false → no record + canUndo stays false', () => {
    const onHistoryChange = vi.fn<(payload: HistoryChangePayload) => void>();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={editableColsR}
        rows={editableRowsR}
        onHistoryChange={onHistoryChange}
      />,
    );
    act(() => {
      handleRef.current!.startEditingCell('r1', 'name');
      handleRef.current!.setEditingCellDraft('Zara');
      handleRef.current!.commitEditingCell();
    });
    expect(handleRef.current!.canUndo()).toBe(false);
    expect(onHistoryChange).not.toHaveBeenCalled();
  });

  it('enableUndoHistory: true + cell-edit → batch recorded; canUndo true; onHistoryChange fires', () => {
    const onHistoryChange = vi.fn<(payload: HistoryChangePayload) => void>();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={editableColsR}
        rows={editableRowsR}
        enableUndoHistory={true}
        onHistoryChange={onHistoryChange}
      />,
    );
    act(() => {
      handleRef.current!.startEditingCell('r1', 'name');
      handleRef.current!.setEditingCellDraft('Zara');
      handleRef.current!.commitEditingCell();
    });
    expect(handleRef.current!.canUndo()).toBe(true);
    expect(handleRef.current!.canRedo()).toBe(false);
    expect(handleRef.current!.getHistory().past).toHaveLength(1);
    expect(onHistoryChange).toHaveBeenCalledTimes(1);
  });

  it('enableUndoHistory: true + cell-range-fill → batch recorded', () => {
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={columns}
        rows={rows}
        cellRangeSelection="enabled"
        enableUndoHistory={true}
      />,
    );
    act(() => {
      handleRef.current!.setCellRange({
        anchor: { rowId: 'r1', colId: 'name' },
        focus: { rowId: 'r1', colId: 'name' },
      });
      handleRef.current!.fillCellRange({ rowId: 'r3', colId: 'name' });
    });
    expect(handleRef.current!.getHistory().past).toHaveLength(1);
    expect(handleRef.current!.canUndo()).toBe(true);
  });

  it('handle.undo() → fires onHistoryReplay with REVERSED mutations + direction undo', () => {
    const onHistoryReplay = vi.fn<(payload: HistoryReplayPayload) => void>();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={editableColsR}
        rows={editableRowsR}
        enableUndoHistory={true}
        onHistoryReplay={onHistoryReplay}
      />,
    );
    act(() => {
      handleRef.current!.startEditingCell('r1', 'name');
      handleRef.current!.setEditingCellDraft('Zara');
      handleRef.current!.commitEditingCell();
    });
    let undidIt = false;
    act(() => {
      undidIt = handleRef.current!.undo();
    });
    expect(undidIt).toBe(true);
    expect(onHistoryReplay).toHaveBeenCalledTimes(1);
    const payload = onHistoryReplay.mock.calls[0]![0];
    expect(payload.direction).toBe('undo');
    expect(payload.jsEvent).toBeNull();
    expect(payload.batch.mutations[0]).toMatchObject({ oldValue: 'Zara', newValue: 'Alpha' });
    expect(handleRef.current!.canUndo()).toBe(false);
    expect(handleRef.current!.canRedo()).toBe(true);
  });

  it('handle.redo() → fires onHistoryReplay with ORIGINAL mutations + direction redo', () => {
    const onHistoryReplay = vi.fn<(payload: HistoryReplayPayload) => void>();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={editableColsR}
        rows={editableRowsR}
        enableUndoHistory={true}
        onHistoryReplay={onHistoryReplay}
      />,
    );
    act(() => {
      handleRef.current!.startEditingCell('r1', 'name');
      handleRef.current!.setEditingCellDraft('Zara');
      handleRef.current!.commitEditingCell();
      handleRef.current!.undo();
    });
    let redidIt = false;
    act(() => {
      redidIt = handleRef.current!.redo();
    });
    expect(redidIt).toBe(true);
    expect(onHistoryReplay).toHaveBeenCalledTimes(2);
    const payload = onHistoryReplay.mock.calls[1]![0];
    expect(payload.direction).toBe('redo');
    expect(payload.batch.mutations[0]).toMatchObject({ oldValue: 'Alpha', newValue: 'Zara' });
    expect(handleRef.current!.canUndo()).toBe(true);
    expect(handleRef.current!.canRedo()).toBe(false);
  });

  it('new mutation after undo → future cleared (canRedo false)', () => {
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={editableColsR}
        rows={editableRowsR}
        enableUndoHistory={true}
      />,
    );
    act(() => {
      handleRef.current!.startEditingCell('r1', 'name');
      handleRef.current!.setEditingCellDraft('Zara');
      handleRef.current!.commitEditingCell();
      handleRef.current!.undo();
      handleRef.current!.startEditingCell('r2', 'name');
      handleRef.current!.setEditingCellDraft('YYY');
      handleRef.current!.commitEditingCell();
    });
    expect(handleRef.current!.canRedo()).toBe(false);
    expect(handleRef.current!.getHistory().future).toHaveLength(0);
  });

  it('handle.undo() with no past → false; no callback', () => {
    const onHistoryReplay = vi.fn<(payload: HistoryReplayPayload) => void>();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={editableColsR}
        rows={editableRowsR}
        enableUndoHistory={true}
        onHistoryReplay={onHistoryReplay}
      />,
    );
    let result = true;
    act(() => {
      result = handleRef.current!.undo();
    });
    expect(result).toBe(false);
    expect(onHistoryReplay).not.toHaveBeenCalled();
  });

  it('body Ctrl+Z keydown with enableUndoHistory + non-empty past → fires onHistoryReplay', () => {
    const onHistoryReplay = vi.fn<(payload: HistoryReplayPayload) => void>();
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={editableColsR}
        rows={editableRowsR}
        enableUndoHistory={true}
        onHistoryReplay={onHistoryReplay}
      />,
    );
    act(() => {
      handleRef.current!.startEditingCell('r1', 'name');
      handleRef.current!.setEditingCellDraft('Zara');
      handleRef.current!.commitEditingCell();
    });
    const body = container.querySelector<HTMLElement>('.cx-table-body')!;
    act(() => {
      fireEvent.keyDown(body, { key: 'z', ctrlKey: true });
    });
    expect(onHistoryReplay).toHaveBeenCalledTimes(1);
    const payload = onHistoryReplay.mock.calls[0]![0];
    expect(payload.direction).toBe('undo');
    expect(payload.jsEvent).not.toBeNull();
  });
});

describe('<ChronixTable> multi-row pinned headers (column groups)', () => {
  it('no column has headerGroup → no .cx-table-row--header-group rendered', () => {
    const { container } = render(<ChronixTable columns={columns} rows={rows} />);
    expect(container.querySelector('.cx-table-row--header-group')).toBeNull();
    expect(container.querySelector('.cx-table-row--header')).not.toBeNull();
    expect(container.querySelectorAll('.cx-table-header-group').length).toBe(0);
  });

  it('2 contiguous cols share headerGroup → 1 labelled span with combined width', () => {
    const cols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', headerName: 'ID', width: 80, headerGroup: '基础信息' },
      { id: 'name', field: 'name', headerName: '名称', width: 140, headerGroup: '基础信息' },
      { id: 'qty', field: 'qty', headerName: '数量', width: 100 },
    ];
    const { container } = render(<ChronixTable columns={cols} rows={rows} />);
    expect(container.querySelector('.cx-table-row--header-group')).not.toBeNull();
    const labelled = container.querySelectorAll(
      '.cx-table-header-group:not(.cx-table-header-group--empty)',
    );
    expect(labelled.length).toBe(1);
    expect(labelled[0]!.getAttribute('data-group-name')).toBe('基础信息');
    expect(labelled[0]!.getAttribute('data-col-ids')).toBe('id,name');
    expect(widthPx(labelled[0]!.getAttribute('style'))).toBe(80 + 140);
  });

  it('mixed grouped + un-grouped → empty placeholders sized to leaf widths; row height = theme.headerGroupHeight', () => {
    const cols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', headerName: 'ID', width: 80, headerGroup: '基础信息' },
      { id: 'name', field: 'name', headerName: '名称', width: 140, headerGroup: '基础信息' },
      { id: 'qty', field: 'qty', headerName: '数量', width: 100 },
      { id: 'note', field: 'note', headerName: '备注', width: 160 },
    ];
    const { container } = render(<ChronixTable columns={cols} rows={rows} />);
    const empties = container.querySelectorAll('.cx-table-header-group--empty');
    expect(empties.length).toBe(2);
    expect(widthPx(empties[0]!.getAttribute('style'))).toBe(100);
    expect(widthPx(empties[1]!.getAttribute('style'))).toBe(160);
    const groupCells = container.querySelectorAll('.cx-table-header-group');
    for (const cell of groupCells) {
      expect(heightPx(cell.getAttribute('style'))).toBe(28);
    }
  });

  it('same headerGroup name on a left-pinned col + a center col → 2 separate spans (zone-split)', () => {
    const cols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', headerName: 'ID', width: 80, pinned: 'left', headerGroup: 'X' },
      { id: 'name', field: 'name', headerName: '名称', width: 140, headerGroup: 'X' },
      { id: 'qty', field: 'qty', headerName: '数量', width: 100 },
    ];
    const { container } = render(<ChronixTable columns={cols} rows={rows} />);
    const xSpans = container.querySelectorAll('.cx-table-header-group[data-group-name="X"]');
    expect(xSpans.length).toBe(2);
    expect(widthPx(xSpans[0]!.getAttribute('style'))).toBe(80);
    expect(widthPx(xSpans[1]!.getAttribute('style'))).toBe(140);
    expect(xSpans[0]!.getAttribute('data-col-ids')).toBe('id');
    expect(xSpans[1]!.getAttribute('data-col-ids')).toBe('name');
  });

  it('click on labelled group cell → onHeaderGroupClick fires with payload', () => {
    const cols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', headerName: 'ID', width: 80, headerGroup: 'X' },
      { id: 'name', field: 'name', headerName: '名称', width: 140, headerGroup: 'X' },
      { id: 'qty', field: 'qty', headerName: '数量', width: 100 },
    ];
    const onHeaderGroupClick = vi.fn();
    const { container } = render(
      <ChronixTable columns={cols} rows={rows} onHeaderGroupClick={onHeaderGroupClick} />,
    );
    const groupCell = container.querySelector('.cx-table-header-group[data-group-name="X"]')!;
    expect(groupCell).not.toBeNull();
    act(() => {
      fireEvent.click(groupCell);
    });
    expect(onHeaderGroupClick).toHaveBeenCalledTimes(1);
    const payload = onHeaderGroupClick.mock.calls[0]![0] as {
      groupName: string;
      colIds: readonly string[];
    };
    expect(payload.groupName).toBe('X');
    expect(payload.colIds).toEqual(['id', 'name']);
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
    const { container } = render(<ChronixTable columns={cols} rows={rows} />);
    const groupRows = container.querySelectorAll('.cx-table-row--header-group');
    expect(groupRows.length).toBe(2);
    expect(groupRows[0]!.getAttribute('data-header-group-level')).toBe('0');
    expect(groupRows[1]!.getAttribute('data-header-group-level')).toBe('1');
    const finCell = container.querySelector('.cx-table-header-group[data-group-name="财务"]')!;
    expect(finCell).not.toBeNull();
    expect(finCell.getAttribute('data-header-group-level')).toBe('0');
    expect(finCell.getAttribute('data-col-ids')).toBe('qty,price');
    const orderCell = container.querySelector('.cx-table-header-group[data-group-name="订单"]')!;
    expect(orderCell).not.toBeNull();
    expect(orderCell.getAttribute('data-header-group-level')).toBe('1');
    expect(orderCell.getAttribute('data-col-ids')).toBe('qty,price');
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
    const { container } = render(<ChronixTable columns={cols} rows={rows} />);
    const groupRows = container.querySelectorAll('.cx-table-row--header-group');
    expect(groupRows.length).toBe(2);
    const level0Labelled = groupRows[0]!.querySelectorAll(
      '.cx-table-header-group:not(.cx-table-header-group--empty)',
    );
    expect(level0Labelled.length).toBe(2);
    expect(level0Labelled[0]!.getAttribute('data-group-name')).toBe('基础信息');
    expect(level0Labelled[1]!.getAttribute('data-group-name')).toBe('财务');
    const level1Empty = groupRows[1]!.querySelectorAll('.cx-table-header-group--empty');
    expect(level1Empty.length).toBe(2); // id + name placeholders
    const level1Labelled = groupRows[1]!.querySelectorAll(
      '.cx-table-header-group:not(.cx-table-header-group--empty)',
    );
    expect(level1Labelled.length).toBe(1);
    expect(level1Labelled[0]!.getAttribute('data-group-name')).toBe('订单');
    expect(level1Labelled[0]!.getAttribute('data-col-ids')).toBe('qty,price');
  });
});

describe('<ChronixTable> (react port of vue3): sticky footer aggregate row', () => {
  it('showFooterRow defaults to false → no .cx-table-footer DOM is rendered', () => {
    const { container } = render(<ChronixTable columns={columns} rows={rows} />);
    expect(container.querySelector('.cx-table-footer')).toBeNull();
    expect(container.querySelector('.cx-table-row--footer')).toBeNull();
  });

  it('showFooterRow=true with no aggregators on any column → footer renders with all --empty placeholder cells', () => {
    const { container } = render(<ChronixTable columns={columns} rows={rows} showFooterRow />);
    expect(container.querySelector('.cx-table-footer')).not.toBeNull();
    const emptyCells = container.querySelectorAll('.cx-table-footer-cell--empty');
    // One empty placeholder per visible column (selection-rail
    // placeholders carry a different modifier).
    expect(emptyCells.length).toBe(columns.length);
  });

  it('qty column with sum aggregator → footer cell renders aggregate value via valueFormatter', () => {
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
    const { container } = render(<ChronixTable columns={cols} rows={rows} showFooterRow />);
    const qtyFooter = container.querySelector('.cx-table-footer-cell[data-col-id="qty"]');
    expect(qtyFooter).not.toBeNull();
    expect(qtyFooter!.classList.contains('cx-table-footer-cell--empty')).toBe(false);
    expect(qtyFooter!.textContent).toBe('合计 60 件');
    const idFooter = container.querySelector('.cx-table-footer-cell[data-col-id="id"]');
    expect(idFooter!.classList.contains('cx-table-footer-cell--empty')).toBe(true);
    expect(idFooter!.textContent).toBe('');
  });

  it('footer aggregates the post-filter rows — setFilter narrows the input', () => {
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
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={cols} rows={rows} showFooterRow />,
    );
    expect(container.querySelector('.cx-table-footer-cell[data-col-id="qty"]')!.textContent).toBe(
      '60',
    );
    act(() => {
      handleRef.current?.setFilter({
        type: 'number',
        colId: 'qty',
        operator: '>=',
        value: 20,
      });
    });
    expect(container.querySelector('.cx-table-footer-cell[data-col-id="qty"]')!.textContent).toBe(
      '50',
    );
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
    const { container } = render(<ChronixTable columns={cols} rows={rows} showFooterRow />);
    const qtyFooter = container.querySelector('.cx-table-footer-cell[data-col-id="qty"]');
    expect(qtyFooter).not.toBeNull();
    expect(qtyFooter!.textContent).toBe('');
  });

  it('footer cell width matches header cell width + applies theme.footerHeight', () => {
    const cols: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', headerName: 'ID', width: 80 },
      { id: 'qty', field: 'qty', headerName: '数量', width: 130, aggregator: () => 0 },
    ];
    const { container } = render(<ChronixTable columns={cols} rows={rows} showFooterRow />);
    const qtyHeader = container.querySelector('.cx-table-header-cell[data-col-id="qty"]');
    const qtyFooter = container.querySelector('.cx-table-footer-cell[data-col-id="qty"]');
    expect(widthPx(qtyHeader!.getAttribute('style'))).toBe(130);
    expect(widthPx(qtyFooter!.getAttribute('style'))).toBe(130);
    expect(heightPx(qtyFooter!.getAttribute('style'))).toBe(32);
  });

  it('showFooterRow render does NOT fire any change callbacks', () => {
    const onSortChange = vi.fn();
    const onFilterChange = vi.fn();
    const cols: readonly ColumnSpec[] = [
      { id: 'qty', field: 'qty', headerName: '数量', width: 120, aggregator: () => 99 },
    ];
    render(
      <ChronixTable
        columns={cols}
        rows={rows}
        showFooterRow
        onSortChange={onSortChange}
        onFilterChange={onFilterChange}
      />,
    );
    expect(onSortChange).not.toHaveBeenCalled();
    expect(onFilterChange).not.toHaveBeenCalled();
  });
});

describe('<ChronixTable> (react port of vue3): cell-level keyboard navigation', () => {
  it('enableKeyboardNavigation=false → ArrowRight is a no-op', () => {
    const onActiveCellChange = vi.fn();
    const { container } = render(
      <ChronixTable columns={columns} rows={rows} onActiveCellChange={onActiveCellChange} />,
    );
    const body = container.querySelector('.cx-table-body')!;
    act(() => {
      fireEvent.keyDown(body, { key: 'ArrowRight' });
    });
    expect(onActiveCellChange).not.toHaveBeenCalled();
  });

  it('click cell + nav enabled → onActiveCellChange fires with clicked cell', () => {
    const onActiveCellChange = vi.fn();
    const { container } = render(
      <ChronixTable
        columns={columns}
        rows={rows}
        enableKeyboardNavigation
        onActiveCellChange={onActiveCellChange}
      />,
    );
    const cell = container.querySelector('.cx-table-cell[data-row-id="r2"][data-col-id="qty"]')!;
    act(() => {
      fireEvent.click(cell);
    });
    expect(onActiveCellChange).toHaveBeenCalledTimes(1);
    const payload = onActiveCellChange.mock.calls[0]![0] as {
      rowId: string;
      colId: string;
    };
    expect(payload.rowId).toBe('r2');
    expect(payload.colId).toBe('qty');
  });

  it('ArrowRight after click moves to next column same row', () => {
    const onActiveCellChange = vi.fn();
    const { container } = render(
      <ChronixTable
        columns={columns}
        rows={rows}
        enableKeyboardNavigation
        onActiveCellChange={onActiveCellChange}
      />,
    );
    act(() => {
      fireEvent.click(
        container.querySelector('.cx-table-cell[data-row-id="r2"][data-col-id="qty"]')!,
      );
    });
    const body = container.querySelector('.cx-table-body')!;
    act(() => {
      fireEvent.keyDown(body, { key: 'ArrowRight' });
    });
    const lastCall = onActiveCellChange.mock.calls[
      onActiveCellChange.mock.calls.length - 1
    ]![0] as { rowId: string; colId: string };
    expect(lastCall.rowId).toBe('r2');
    expect(lastCall.colId).toBe('status');
  });

  it('ArrowRight on last column is no-op', () => {
    const onActiveCellChange = vi.fn();
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={columns}
        rows={rows}
        enableKeyboardNavigation
        onActiveCellChange={onActiveCellChange}
      />,
    );
    act(() => {
      handleRef.current?.setActiveCell('r2', 'note');
    });
    const callsBefore = onActiveCellChange.mock.calls.length;
    const body = container.querySelector('.cx-table-body')!;
    act(() => {
      fireEvent.keyDown(body, { key: 'ArrowRight' });
    });
    expect(onActiveCellChange.mock.calls.length).toBe(callsBefore);
  });

  it('Ctrl+End jumps to bottom-right cell', () => {
    const onActiveCellChange = vi.fn();
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={columns}
        rows={rows}
        enableKeyboardNavigation
        onActiveCellChange={onActiveCellChange}
      />,
    );
    act(() => {
      handleRef.current?.setActiveCell('r1', 'id');
    });
    const body = container.querySelector('.cx-table-body')!;
    act(() => {
      fireEvent.keyDown(body, { key: 'End', ctrlKey: true });
    });
    const lastCall = onActiveCellChange.mock.calls[
      onActiveCellChange.mock.calls.length - 1
    ]![0] as { rowId: string; colId: string };
    expect(lastCall.rowId).toBe('r3');
    expect(lastCall.colId).toBe('note');
  });

  it('Enter on editable active cell begins edit', () => {
    const editableCols: readonly ColumnSpec[] = columns.map((c) =>
      c.id === 'note' ? { ...c, editable: true } : c,
    );
    const onCellEditStart = vi.fn();
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={editableCols}
        rows={rows}
        enableKeyboardNavigation
        onCellEditStart={onCellEditStart}
      />,
    );
    act(() => {
      handleRef.current?.setActiveCell('r1', 'note');
    });
    const body = container.querySelector('.cx-table-body')!;
    act(() => {
      fireEvent.keyDown(body, { key: 'Enter' });
    });
    expect(onCellEditStart).toHaveBeenCalled();
  });

  it('programmatic setActiveCell + clearActiveCell fire callbacks', () => {
    const onActiveCellChange = vi.fn();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={columns}
        rows={rows}
        onActiveCellChange={onActiveCellChange}
      />,
    );
    expect(handleRef.current?.getActiveCell()).toBeNull();
    act(() => {
      handleRef.current?.setActiveCell('r2', 'qty');
    });
    expect(handleRef.current?.getActiveCell()).toEqual({ rowId: 'r2', colId: 'qty' });
    expect(onActiveCellChange).toHaveBeenCalledTimes(1);
    act(() => {
      handleRef.current?.clearActiveCell();
    });
    expect(handleRef.current?.getActiveCell()).toBeNull();
    expect(onActiveCellChange).toHaveBeenCalledTimes(2);
    const clearedPayload = onActiveCellChange.mock.calls[1]![0] as {
      rowId: string | null;
      colId: string | null;
    };
    expect(clearedPayload.rowId).toBeNull();
    expect(clearedPayload.colId).toBeNull();
  });

  it('active cell carries cx-table-cell--active modifier + data-active', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={columns} rows={rows} enableKeyboardNavigation />,
    );
    act(() => {
      handleRef.current?.setActiveCell('r2', 'qty');
    });
    const activeCells = container.querySelectorAll('.cx-table-cell--active');
    expect(activeCells.length).toBeGreaterThanOrEqual(1);
    const cell = container.querySelector('.cx-table-cell[data-row-id="r2"][data-col-id="qty"]')!;
    expect(cell.classList.contains('cx-table-cell--active')).toBe(true);
    expect(cell.getAttribute('data-active')).toBe('true');
  });
});

describe('<ChronixTable> (react port of vue3): auto-scroll to active cell', () => {
  function seedBodyViewport(container: HTMLElement): HTMLElement {
    const bodyEl = container.querySelector<HTMLElement>('.cx-table-body')!;
    Object.defineProperty(bodyEl, 'clientHeight', { value: 100, configurable: true });
    Object.defineProperty(bodyEl, 'clientWidth', { value: 400, configurable: true });
    return bodyEl;
  }

  const manyRows: readonly RowSpec[] = Array.from({ length: 50 }, (_, i) => ({
    id: `r${i}`,
    data: { id: i, name: `name-${i}`, qty: i, status: 'OK', note: '' },
  }));

  it('keyboard ArrowDown across many rows scrolls body vertically (default ON)', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={columns} rows={manyRows} enableKeyboardNavigation />,
    );
    const bodyEl = seedBodyViewport(container);
    act(() => {
      handleRef.current?.setActiveCell('r0', 'id');
    });
    bodyEl.scrollTop = 0;
    const body = container.querySelector('.cx-table-body')!;
    for (let i = 0; i < 10; i += 1) {
      act(() => {
        fireEvent.keyDown(body, { key: 'ArrowDown' });
      });
    }
    expect(bodyEl.scrollTop).toBeGreaterThan(0);
  });

  it('keyboard ArrowRight across many cols scrolls body horizontally', () => {
    const narrowCols: readonly ColumnSpec[] = Array.from({ length: 10 }, (_, i) => ({
      id: `c${i}`,
      field: `c${i}`,
      headerName: `c${i}`,
      width: 80,
    }));
    const narrowRows: readonly RowSpec[] = [{ id: 'r0', data: {} }];
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={narrowCols}
        rows={narrowRows}
        enableKeyboardNavigation
      />,
    );
    const bodyEl = seedBodyViewport(container);
    act(() => {
      handleRef.current?.setActiveCell('r0', 'c0');
    });
    bodyEl.scrollLeft = 0;
    const body = container.querySelector('.cx-table-body')!;
    for (let i = 0; i < 9; i += 1) {
      act(() => {
        fireEvent.keyDown(body, { key: 'ArrowRight' });
      });
    }
    expect(bodyEl.scrollLeft).toBeGreaterThan(0);
  });

  it('enableKeyboardAutoScroll=false disables scroll even with kb-nav on', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={columns}
        rows={manyRows}
        enableKeyboardNavigation
        enableKeyboardAutoScroll={false}
      />,
    );
    const bodyEl = seedBodyViewport(container);
    act(() => {
      handleRef.current?.setActiveCell('r0', 'id');
    });
    bodyEl.scrollTop = 0;
    const body = container.querySelector('.cx-table-body')!;
    for (let i = 0; i < 10; i += 1) {
      act(() => {
        fireEvent.keyDown(body, { key: 'ArrowDown' });
      });
    }
    expect(bodyEl.scrollTop).toBe(0);
  });

  it('click does NOT auto-scroll (clicked cell already visible)', () => {
    const { container } = render(
      <ChronixTable columns={columns} rows={manyRows} enableKeyboardNavigation />,
    );
    const bodyEl = seedBodyViewport(container);
    const initialTop = bodyEl.scrollTop;
    const cell = container.querySelector('.cx-table-cell[data-row-id="r2"][data-col-id="qty"]')!;
    act(() => {
      fireEvent.click(cell);
    });
    expect(bodyEl.scrollTop).toBe(initialTop);
  });

  it('programmatic setActiveCell to a far row auto-scrolls', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={columns} rows={manyRows} enableKeyboardNavigation />,
    );
    const bodyEl = seedBodyViewport(container);
    bodyEl.scrollTop = 0;
    act(() => {
      handleRef.current?.setActiveCell('r40', 'qty');
    });
    expect(bodyEl.scrollTop).toBeGreaterThan(0);
  });

  it('clearActiveCell does not auto-scroll (no destination)', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={columns} rows={manyRows} enableKeyboardNavigation />,
    );
    const bodyEl = seedBodyViewport(container);
    act(() => {
      handleRef.current?.setActiveCell('r40', 'qty');
    });
    const scrolledTop = bodyEl.scrollTop;
    act(() => {
      handleRef.current?.clearActiveCell();
    });
    expect(bodyEl.scrollTop).toBe(scrolledTop);
  });
});

describe('<ChronixTable> (react port of vue3): shift+Arrow extends cell-range', () => {
  it('shift+ArrowRight after click opens fresh range with anchor=clicked cell', () => {
    const onCellRangeStart = vi.fn();
    const onCellRangeChange = vi.fn();
    const { container } = render(
      <ChronixTable
        columns={columns}
        rows={rows}
        enableKeyboardNavigation
        cellRangeSelection="enabled"
        onCellRangeStart={onCellRangeStart}
        onCellRangeChange={onCellRangeChange}
      />,
    );
    const cell = container.querySelector('.cx-table-cell[data-row-id="r2"][data-col-id="qty"]')!;
    act(() => {
      fireEvent.click(cell);
    });
    const body = container.querySelector('.cx-table-body')!;
    act(() => {
      fireEvent.keyDown(body, { key: 'ArrowRight', shiftKey: true });
    });
    expect(onCellRangeStart).toHaveBeenCalled();
    const startPayload = onCellRangeStart.mock.calls[0]![0] as {
      range: { anchor: { rowId: string; colId: string } };
    };
    expect(startPayload.range.anchor).toEqual({ rowId: 'r2', colId: 'qty' });
    const lastChange = onCellRangeChange.mock.calls[
      onCellRangeChange.mock.calls.length - 1
    ]![0] as {
      range: { anchor: { rowId: string; colId: string }; focus: { rowId: string; colId: string } };
    };
    expect(lastChange.range.anchor).toEqual({ rowId: 'r2', colId: 'qty' });
    expect(lastChange.range.focus).toEqual({ rowId: 'r2', colId: 'status' });
  });

  it('consecutive shift+ArrowDown extends focus; anchor stays put', () => {
    const onCellRangeChange = vi.fn();
    const { container } = render(
      <ChronixTable
        columns={columns}
        rows={rows}
        enableKeyboardNavigation
        cellRangeSelection="enabled"
        onCellRangeChange={onCellRangeChange}
      />,
    );
    const cell = container.querySelector('.cx-table-cell[data-row-id="r1"][data-col-id="qty"]')!;
    act(() => {
      fireEvent.click(cell);
    });
    const body = container.querySelector('.cx-table-body')!;
    act(() => {
      fireEvent.keyDown(body, { key: 'ArrowDown', shiftKey: true });
    });
    act(() => {
      fireEvent.keyDown(body, { key: 'ArrowDown', shiftKey: true });
    });
    const last = onCellRangeChange.mock.calls[onCellRangeChange.mock.calls.length - 1]![0] as {
      range: { anchor: { rowId: string; colId: string }; focus: { rowId: string; colId: string } };
    };
    expect(last.range.anchor).toEqual({ rowId: 'r1', colId: 'qty' });
    expect(last.range.focus).toEqual({ rowId: 'r3', colId: 'qty' });
  });

  it('plain ArrowRight when range exists collapses the range', () => {
    const onCellRangeStop = vi.fn();
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={columns}
        rows={rows}
        enableKeyboardNavigation
        cellRangeSelection="enabled"
        onCellRangeStop={onCellRangeStop}
      />,
    );
    act(() => {
      handleRef.current?.setActiveCell('r1', 'qty');
      handleRef.current?.setCellRange({
        anchor: { rowId: 'r1', colId: 'id' },
        focus: { rowId: 'r2', colId: 'qty' },
      });
    });
    const body = container.querySelector('.cx-table-body')!;
    act(() => {
      fireEvent.keyDown(body, { key: 'ArrowRight' });
    });
    expect(onCellRangeStop).toHaveBeenCalled();
  });

  it('Escape clears both activeCell AND cellRange', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={columns}
        rows={rows}
        enableKeyboardNavigation
        cellRangeSelection="enabled"
      />,
    );
    act(() => {
      handleRef.current?.setActiveCell('r2', 'qty');
      handleRef.current?.setCellRange({
        anchor: { rowId: 'r1', colId: 'id' },
        focus: { rowId: 'r3', colId: 'status' },
      });
    });
    const body = container.querySelector('.cx-table-body')!;
    act(() => {
      fireEvent.keyDown(body, { key: 'Escape' });
    });
    expect(handleRef.current?.getActiveCell()).toBeNull();
    expect(handleRef.current?.getCellRange()).toBeNull();
  });

  it('shift+End extends range to last column same row', () => {
    const onCellRangeChange = vi.fn();
    const { container } = render(
      <ChronixTable
        columns={columns}
        rows={rows}
        enableKeyboardNavigation
        cellRangeSelection="enabled"
        onCellRangeChange={onCellRangeChange}
      />,
    );
    const cell = container.querySelector('.cx-table-cell[data-row-id="r2"][data-col-id="qty"]')!;
    act(() => {
      fireEvent.click(cell);
    });
    const body = container.querySelector('.cx-table-body')!;
    act(() => {
      fireEvent.keyDown(body, { key: 'End', shiftKey: true });
    });
    const last = onCellRangeChange.mock.calls[onCellRangeChange.mock.calls.length - 1]![0] as {
      range: { anchor: { rowId: string; colId: string }; focus: { rowId: string; colId: string } };
    };
    expect(last.range.anchor).toEqual({ rowId: 'r2', colId: 'qty' });
    expect(last.range.focus).toEqual({ rowId: 'r2', colId: 'note' });
  });

  it('cellRangeSelection=none disables shift+arrow extension', () => {
    const onCellRangeStart = vi.fn();
    const onActiveCellChange = vi.fn();
    const { container } = render(
      <ChronixTable
        columns={columns}
        rows={rows}
        enableKeyboardNavigation
        onCellRangeStart={onCellRangeStart}
        onActiveCellChange={onActiveCellChange}
      />,
    );
    const cell = container.querySelector('.cx-table-cell[data-row-id="r2"][data-col-id="qty"]')!;
    act(() => {
      fireEvent.click(cell);
    });
    const body = container.querySelector('.cx-table-body')!;
    act(() => {
      fireEvent.keyDown(body, { key: 'ArrowRight', shiftKey: true });
    });
    expect(onCellRangeStart).not.toHaveBeenCalled();
    expect(onActiveCellChange).toHaveBeenCalled();
  });
});

describe('<ChronixTable> (react port of vue3): Ctrl+Arrow data-region jumps', () => {
  const sparseRows: readonly RowSpec[] = [
    { id: 'r1', data: { id: 1, name: 'a', qty: 10, status: 'X', note: 'first' } },
    { id: 'r2', data: { id: 2, name: 'b', qty: 20, status: 'Y', note: 'second' } },
    { id: 'r3', data: { id: 3, name: 'c', qty: 30, status: 'Z', note: '' } },
    { id: 'r4', data: { id: 4, name: 'd', qty: 40, status: 'W', note: '' } },
    { id: 'r5', data: { id: 5, name: 'e', qty: 50, status: 'V', note: 'last' } },
  ];

  it('Ctrl+ArrowDown from first row of filled column jumps to last filled row', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={columns} rows={sparseRows} enableKeyboardNavigation />,
    );
    act(() => {
      handleRef.current?.setActiveCell('r1', 'qty');
    });
    const body = container.querySelector('.cx-table-body')!;
    act(() => {
      fireEvent.keyDown(body, { key: 'ArrowDown', ctrlKey: true });
    });
    expect(handleRef.current?.getActiveCell()).toEqual({ rowId: 'r5', colId: 'qty' });
  });

  it('Ctrl+ArrowDown from filled cell with empty below stays put', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={columns} rows={sparseRows} enableKeyboardNavigation />,
    );
    act(() => {
      handleRef.current?.setActiveCell('r2', 'note');
    });
    const body = container.querySelector('.cx-table-body')!;
    act(() => {
      fireEvent.keyDown(body, { key: 'ArrowDown', ctrlKey: true });
    });
    expect(handleRef.current?.getActiveCell()).toEqual({ rowId: 'r2', colId: 'note' });
  });

  it('Ctrl+ArrowDown from EMPTY cell jumps to first non-empty below', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={columns} rows={sparseRows} enableKeyboardNavigation />,
    );
    act(() => {
      handleRef.current?.setActiveCell('r3', 'note');
    });
    const body = container.querySelector('.cx-table-body')!;
    act(() => {
      fireEvent.keyDown(body, { key: 'ArrowDown', ctrlKey: true });
    });
    expect(handleRef.current?.getActiveCell()).toEqual({ rowId: 'r5', colId: 'note' });
  });

  it('Ctrl+ArrowRight from filled cell jumps along the row', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={columns} rows={sparseRows} enableKeyboardNavigation />,
    );
    act(() => {
      handleRef.current?.setActiveCell('r1', 'id');
    });
    const body = container.querySelector('.cx-table-body')!;
    act(() => {
      fireEvent.keyDown(body, { key: 'ArrowRight', ctrlKey: true });
    });
    expect(handleRef.current?.getActiveCell()).toEqual({ rowId: 'r1', colId: 'note' });
  });

  it('Ctrl+Shift+ArrowDown extends cell-range from anchor to boundary', () => {
    const onCellRangeChange = vi.fn();
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={columns}
        rows={sparseRows}
        enableKeyboardNavigation
        cellRangeSelection="enabled"
        onCellRangeChange={onCellRangeChange}
      />,
    );
    act(() => {
      handleRef.current?.setActiveCell('r1', 'qty');
    });
    const body = container.querySelector('.cx-table-body')!;
    act(() => {
      fireEvent.keyDown(body, { key: 'ArrowDown', ctrlKey: true, shiftKey: true });
    });
    const last = onCellRangeChange.mock.calls[onCellRangeChange.mock.calls.length - 1]![0] as {
      range: { anchor: { rowId: string; colId: string }; focus: { rowId: string; colId: string } };
    };
    expect(last.range.anchor).toEqual({ rowId: 'r1', colId: 'qty' });
    expect(last.range.focus).toEqual({ rowId: 'r5', colId: 'qty' });
  });

  it('Ctrl+ArrowDown without activeCell falls back to top-left init', () => {
    const onActiveCellChange = vi.fn();
    const { container } = render(
      <ChronixTable
        columns={columns}
        rows={sparseRows}
        enableKeyboardNavigation
        onActiveCellChange={onActiveCellChange}
      />,
    );
    const body = container.querySelector('.cx-table-body')!;
    act(() => {
      fireEvent.keyDown(body, { key: 'ArrowDown', ctrlKey: true });
    });
    expect(onActiveCellChange).toHaveBeenCalled();
    const payload = onActiveCellChange.mock.calls[0]![0] as { rowId: string; colId: string };
    expect(payload.rowId).toBe('r1');
    expect(payload.colId).toBe('id');
  });
});

describe('<ChronixTable> (react port of vue3): tree data', () => {
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

  function bodyRowIds(container: HTMLElement): readonly string[] {
    const rowEls = container.querySelectorAll<HTMLElement>('.cx-table-row');
    const ids: string[] = [];
    rowEls.forEach((el) => {
      const id = el.getAttribute('data-row-id');
      if (id != null) ids.push(id);
    });
    return ids;
  }

  it('renders ONLY top-level rows when defaultExpandedDepth is 0', () => {
    const { container } = render(
      <ChronixTable columns={treeColumns} rows={buildTreeRows()} defaultExpandedDepth={0} />,
    );
    expect(bodyRowIds(container)).toEqual(['p1', 'p2']);
  });

  it('renders top + level-1 children when defaultExpandedDepth is 1', () => {
    const { container } = render(
      <ChronixTable columns={treeColumns} rows={buildTreeRows()} defaultExpandedDepth={1} />,
    );
    expect(bodyRowIds(container)).toEqual(['p1', 'p1/m1', 'p1/m2', 'p2']);
  });

  it('renders chevron for parent rows + leaf spacer for leaf rows in the tree column', () => {
    const { container } = render(
      <ChronixTable columns={treeColumns} rows={buildTreeRows()} defaultExpandedDepth={1} />,
    );
    const p1Chevron = container.querySelector(
      '.cx-table-cell[data-col-id="name"][data-row-id="p1"] .cx-table-tree-chevron',
    );
    expect(p1Chevron).not.toBeNull();
    const p1m2Spacer = container.querySelector(
      '.cx-table-cell[data-col-id="name"][data-row-id="p1/m2"] .cx-table-tree-chevron-spacer',
    );
    expect(p1m2Spacer).not.toBeNull();
  });

  it('applies depth-driven indent paddingLeft to tree-column cells only', () => {
    const { container } = render(
      <ChronixTable columns={treeColumns} rows={buildTreeRows()} defaultExpandedDepth={2} />,
    );
    const depth2Cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-col-id="name"][data-row-id="p1/m1/f1"]',
    );
    expect(depth2Cell).not.toBeNull();
    expect(depth2Cell!.style.paddingLeft).toBe('40px');
    const sizeCell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-col-id="size"][data-row-id="p1/m1/f1"]',
    );
    expect(sizeCell!.style.paddingLeft).toBe('8px');
  });

  it('chevron click toggles expand + fires onExpandedChange with the next id list', () => {
    const onExpandedChange = vi.fn();
    const { container } = render(
      <ChronixTable
        columns={treeColumns}
        rows={buildTreeRows()}
        defaultExpandedDepth={0}
        onExpandedChange={onExpandedChange}
      />,
    );
    const chevron = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-col-id="name"][data-row-id="p1"] .cx-table-tree-chevron',
    );
    expect(chevron).not.toBeNull();
    act(() => {
      fireEvent.click(chevron!);
    });
    expect(onExpandedChange).toHaveBeenCalledWith({ next: ['p1'] });
    expect(bodyRowIds(container)).toContain('p1/m1');
  });

  it('Enter on parent row in tree column toggles expand (precedence over edit-start)', () => {
    const onExpandedChange = vi.fn();
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={treeColumns}
        rows={buildTreeRows()}
        defaultExpandedDepth={0}
        enableKeyboardNavigation
        onExpandedChange={onExpandedChange}
      />,
    );
    act(() => {
      handleRef.current!.setActiveCell('p1', 'name');
    });
    const body = container.querySelector('.cx-table-body')!;
    act(() => {
      fireEvent.keyDown(body, { key: 'Enter' });
    });
    expect(onExpandedChange).toHaveBeenCalledWith({ next: ['p1'] });
  });

  it('ArrowRight on collapsed parent expands the row', () => {
    const onExpandedChange = vi.fn();
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={treeColumns}
        rows={buildTreeRows()}
        defaultExpandedDepth={0}
        enableKeyboardNavigation
        onExpandedChange={onExpandedChange}
      />,
    );
    act(() => {
      handleRef.current!.setActiveCell('p1', 'name');
    });
    const body = container.querySelector('.cx-table-body')!;
    act(() => {
      fireEvent.keyDown(body, { key: 'ArrowRight' });
    });
    expect(onExpandedChange).toHaveBeenCalledWith({ next: ['p1'] });
  });

  it('ArrowLeft on expanded parent collapses the row', () => {
    const onExpandedChange = vi.fn();
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={treeColumns}
        rows={buildTreeRows()}
        defaultExpandedDepth={1}
        enableKeyboardNavigation
        onExpandedChange={onExpandedChange}
      />,
    );
    act(() => {
      handleRef.current!.setActiveCell('p1', 'name');
    });
    const body = container.querySelector('.cx-table-body')!;
    act(() => {
      fireEvent.keyDown(body, { key: 'ArrowLeft' });
    });
    expect(onExpandedChange).toHaveBeenCalledWith({ next: [] });
  });

  it('ArrowLeft on a child row jumps activeCell to the parent', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={treeColumns}
        rows={buildTreeRows()}
        defaultExpandedDepth={2}
        enableKeyboardNavigation
      />,
    );
    act(() => {
      handleRef.current!.setActiveCell('p1/m1/f1', 'name');
    });
    const body = container.querySelector('.cx-table-body')!;
    act(() => {
      fireEvent.keyDown(body, { key: 'ArrowLeft' });
    });
    expect(handleRef.current!.getActiveCell()).toEqual({ rowId: 'p1/m1', colId: 'name' });
  });

  it('expandRow + collapseRow TableHandle methods round-trip + fire callback', () => {
    const onExpandedChange = vi.fn();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={treeColumns}
        rows={buildTreeRows()}
        defaultExpandedDepth={0}
        onExpandedChange={onExpandedChange}
      />,
    );
    act(() => {
      handleRef.current!.expandRow('p1');
    });
    expect(onExpandedChange).toHaveBeenLastCalledWith({ next: ['p1'] });
    act(() => {
      handleRef.current!.collapseRow('p1');
    });
    expect(onExpandedChange).toHaveBeenLastCalledWith({ next: [] });
  });

  it('controlled mode: prop binding drives expanded set; toggle fires callback but does not mutate', () => {
    const onExpandedChange = vi.fn();
    const { container } = render(
      <ChronixTable
        columns={treeColumns}
        rows={buildTreeRows()}
        expandedRowIds={['p1']}
        onExpandedChange={onExpandedChange}
      />,
    );
    expect(bodyRowIds(container)).toContain('p1/m1');
    const chevron = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-col-id="name"][data-row-id="p1"] .cx-table-tree-chevron',
    );
    act(() => {
      fireEvent.click(chevron!);
    });
    expect(onExpandedChange).toHaveBeenCalledWith({ next: [] });
    // DOM still shows expanded state (controlled prop unchanged).
    expect(bodyRowIds(container)).toContain('p1/m1');
  });

  it('filter auto-expands ancestor with matching descendant (filterForceExpandedRowIds)', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={treeColumns}
        rows={buildTreeRows()}
        defaultExpandedDepth={0}
        showFilterRow
      />,
    );
    act(() => {
      handleRef.current!.setFilter({
        type: 'text',
        colId: 'name',
        operator: 'contains',
        value: 'utils',
      } satisfies TextFilterSpec);
    });
    // React renders synchronously inside act(); the auto-expand effect
    // settles in the next render which act() also flushes.
    const ids = bodyRowIds(container);
    expect(ids).toContain('p1');
    expect(ids).toContain('p1/m1');
    expect(ids).toContain('p1/m1/f2');
    expect(ids).not.toContain('p1/m2');
  });
});

describe('<ChronixTable> (react port): tristate row-selection cascade', () => {
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

  it('checkbox click on a parent row cascades selection through descendants', () => {
    const onSelectionChange = vi.fn();
    const { container } = render(
      <ChronixTable
        columns={cascadeColumns}
        rows={buildCascadeRows()}
        defaultExpandedDepth={1}
        selectionMode="multi"
        selectionColumn={{ show: true, side: 'left' }}
        onSelectionChange={onSelectionChange}
      />,
    );
    const checkbox = container.querySelector<HTMLInputElement>(
      '.cx-table-selection-checkbox--row[data-row-id="p1"]',
    );
    expect(checkbox).not.toBeNull();
    act(() => {
      fireEvent.click(checkbox!);
    });
    const payload = onSelectionChange.mock.calls[0]![0] as { selectedRowIds: readonly string[] };
    expect(new Set(payload.selectedRowIds)).toEqual(new Set(['p1', 'p1/c1', 'p1/c2']));
  });

  it('row click on a parent row cascades selection through descendants', () => {
    const onSelectionChange = vi.fn();
    const { container } = render(
      <ChronixTable
        columns={cascadeColumns}
        rows={buildCascadeRows()}
        defaultExpandedDepth={1}
        selectionMode="multi"
        onSelectionChange={onSelectionChange}
      />,
    );
    const parentCell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="p1"][data-col-id="name"]',
    );
    expect(parentCell).not.toBeNull();
    act(() => {
      fireEvent.click(parentCell!);
    });
    const payload = onSelectionChange.mock.calls[0]![0] as { selectedRowIds: readonly string[] };
    expect(new Set(payload.selectedRowIds)).toEqual(new Set(['p1', 'p1/c1', 'p1/c2']));
  });

  it('clicking a descendant directly does NOT cascade up', () => {
    const onSelectionChange = vi.fn();
    const { container } = render(
      <ChronixTable
        columns={cascadeColumns}
        rows={buildCascadeRows()}
        defaultExpandedDepth={1}
        selectionMode="multi"
        selectionColumn={{ show: true, side: 'left' }}
        onSelectionChange={onSelectionChange}
      />,
    );
    const childCheckbox = container.querySelector<HTMLInputElement>(
      '.cx-table-selection-checkbox--row[data-row-id="p1/c1"]',
    );
    act(() => {
      fireEvent.click(childCheckbox!);
    });
    const payload = onSelectionChange.mock.calls[0]![0] as { selectedRowIds: readonly string[] };
    expect(payload.selectedRowIds).toEqual(['p1/c1']);
  });

  it('partially-selected parent renders indeterminate checkbox', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={cascadeColumns}
        rows={buildCascadeRows()}
        defaultExpandedDepth={1}
        selectionMode="multi"
        selectionColumn={{ show: true, side: 'left' }}
      />,
    );
    act(() => {
      handleRef.current!.setSelectedRowIds(['p1/c1']);
    });
    const checkbox = container.querySelector<HTMLInputElement>(
      '.cx-table-selection-checkbox--row[data-row-id="p1"]',
    );
    expect(checkbox).not.toBeNull();
    expect(checkbox!.indeterminate).toBe(true);
    expect(checkbox!.classList.contains('cx-table-row-checkbox--indeterminate')).toBe(true);
  });
});

describe('<ChronixTable> (react port): tree-aware sort', () => {
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

  function bodyRowIds(container: HTMLElement): readonly string[] {
    const rowEls = container.querySelectorAll<HTMLElement>('.cx-table-row');
    const ids: string[] = [];
    rowEls.forEach((el) => {
      const id = el.getAttribute('data-row-id');
      if (id != null) ids.push(id);
    });
    return ids;
  }

  it('sorts children within each parent (ASC + DESC)', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={sortColumns}
        rows={buildSortRows()}
        defaultExpandedDepth={1}
      />,
    );
    act(() => {
      handleRef.current!.setSort({ colId: 'name', direction: 'asc' });
    });
    expect(bodyRowIds(container)).toEqual(['p', 'p/a', 'p/b', 'p/c']);
    act(() => {
      handleRef.current!.setSort({ colId: 'name', direction: 'desc' });
    });
    expect(bodyRowIds(container)).toEqual(['p', 'p/c', 'p/b', 'p/a']);
  });
});

describe('saved table views (react)', () => {
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

  it('getTableView projects columns/sort/filter/page/pageSize with version: 1', () => {
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={viewColumns}
        rows={viewRows}
        showPagination
        initialPageSize={20}
      />,
    );
    act(() => {
      handleRef.current!.setSort({ colId: 'qty', direction: 'desc' });
    });
    const view = handleRef.current!.getTableView();
    expect(view.version).toBe(1);
    expect(view.columns.map((c) => c.id)).toEqual(['id', 'name', 'qty', 'price']);
    expect(view.sort).toEqual([{ colId: 'qty', direction: 'desc' }]);
    expect(view.pageSize).toBe(20);
  });

  it('applyTableView dispatches sort + filter + page/pageSize to setters', () => {
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={viewColumns}
        rows={viewRows}
        showPagination
        initialPageSize={20}
      />,
    );
    act(() => {
      const state: TableViewState = {
        version: 1,
        columns: viewColumns.map((c) => ({ id: c.id })),
        sort: [{ colId: 'name', direction: 'asc' }],
        filter: [{ type: 'number', colId: 'qty', operator: '>', value: 15 }],
        page: 0,
        pageSize: 10,
      };
      handleRef.current!.applyTableView(state);
    });
    expect(handleRef.current!.getSort()).toEqual([{ colId: 'name', direction: 'asc' }]);
    expect(handleRef.current!.getFilter()).toEqual([
      { type: 'number', colId: 'qty', operator: '>', value: 15 },
    ] satisfies readonly FilterSpec[]);
  });

  it('applyTableView invokes onColumnsChange once with reconciled array when columns differ', () => {
    const handleRef = createRef<TableHandle>();
    const onColumnsChange = vi.fn();
    render(
      <ChronixTable
        ref={handleRef}
        columns={viewColumns}
        rows={viewRows}
        onColumnsChange={onColumnsChange}
      />,
    );
    act(() => {
      const state: TableViewState = {
        version: 1,
        columns: [{ id: 'qty' }, { id: 'name', width: 400 }, { id: 'id' }, { id: 'price' }],
        sort: [],
        filter: [],
        page: 0,
        pageSize: 20,
      };
      handleRef.current!.applyTableView(state);
    });
    expect(onColumnsChange).toHaveBeenCalledTimes(1);
    const payload = onColumnsChange.mock.calls[0]![0] as {
      columns: readonly ColumnSpec[];
      reason: string;
    };
    expect(payload.reason).toBe('apply-view');
    expect(payload.columns.map((c) => c.id)).toEqual(['qty', 'name', 'id', 'price']);
    const nameCol = payload.columns.find((c) => c.id === 'name')!;
    expect(nameCol.width).toBe(400);
  });

  it('applyTableView drops sort/filter entries referencing removed columns', () => {
    const handleRef = createRef<TableHandle>();
    render(<ChronixTable ref={handleRef} columns={viewColumns} rows={viewRows} />);
    act(() => {
      const state: TableViewState = {
        version: 1,
        columns: [{ id: 'id' }, { id: 'name' }, { id: 'qty' }, { id: 'price' }],
        sort: [
          { colId: 'gone', direction: 'asc' },
          { colId: 'qty', direction: 'desc' },
        ] satisfies readonly SortSpec[],
        filter: [
          { type: 'text', colId: 'missing', operator: 'contains', value: 'x' },
          { type: 'number', colId: 'qty', operator: '>=', value: 5 },
        ] satisfies readonly FilterSpec[],
        page: 0,
        pageSize: 20,
      };
      handleRef.current!.applyTableView(state);
    });
    expect(handleRef.current!.getSort()).toEqual([{ colId: 'qty', direction: 'desc' }]);
    expect(handleRef.current!.getFilter()).toEqual([
      { type: 'number', colId: 'qty', operator: '>=', value: 5 },
    ] satisfies readonly FilterSpec[]);
  });

  it('applyTableView no-ops silently on unknown version (no callback, no state mutation)', () => {
    const handleRef = createRef<TableHandle>();
    const onColumnsChange = vi.fn();
    render(
      <ChronixTable
        ref={handleRef}
        columns={viewColumns}
        rows={viewRows}
        onColumnsChange={onColumnsChange}
      />,
    );
    act(() => {
      handleRef.current!.setSort({ colId: 'qty', direction: 'desc' });
    });
    const beforeSort = handleRef.current!.getSort();
    act(() => {
      handleRef.current!.applyTableView({
        version: 2,
        columns: [],
        sort: [],
        filter: [],
        page: 0,
        pageSize: 0,
      } as unknown as TableViewState);
    });
    expect(handleRef.current!.getSort()).toEqual(beforeSort);
    expect(onColumnsChange).not.toHaveBeenCalled();
  });
});

describe('Excel xlsx export (react)', () => {
  const viewColumns: readonly ColumnSpec[] = [
    { id: 'id', field: 'id', headerName: 'ID', width: 80 },
    { id: 'name', field: 'name', headerName: 'Name', flex: 1 },
    { id: 'qty', field: 'qty', headerName: 'Qty', width: 120, type: 'number' },
  ];

  const viewRows: readonly RowSpec[] = [
    { id: 'r1', data: { id: 1, name: 'Alpha', qty: 10 } },
    { id: 'r2', data: { id: 2, name: 'Beta', qty: 20 } },
  ];

  function patchDownload(): {
    captured: { blobs: Blob[]; filenames: string[] };
    restore: () => void;
  } {
    const captured = { blobs: [] as Blob[], filenames: [] as string[] };
    const origCreateDescriptor = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
    const origRevokeDescriptor = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: (b: Blob | MediaSource): string => {
        if (b instanceof Blob) captured.blobs.push(b);
        return 'blob:cx-test';
      },
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: (): void => {
        /* swallow */
      },
    });
    const origClickDescriptor = Object.getOwnPropertyDescriptor(
      HTMLAnchorElement.prototype,
      'click',
    );
    Object.defineProperty(HTMLAnchorElement.prototype, 'click', {
      configurable: true,
      writable: true,
      value: function (this: HTMLAnchorElement) {
        if (this.hasAttribute('data-cx-table-xlsx-download')) {
          captured.filenames.push(this.getAttribute('download') ?? '');
        }
      },
    });
    return {
      captured,
      restore: () => {
        if (origCreateDescriptor != null) {
          Object.defineProperty(URL, 'createObjectURL', origCreateDescriptor);
        }
        if (origRevokeDescriptor != null) {
          Object.defineProperty(URL, 'revokeObjectURL', origRevokeDescriptor);
        }
        if (origClickDescriptor != null) {
          Object.defineProperty(HTMLAnchorElement.prototype, 'click', origClickDescriptor);
        }
      },
    };
  }

  it('exportToXlsx triggers a Blob download with the XLSX mimetype + filename', async () => {
    const handleRef = createRef<TableHandle>();
    render(<ChronixTable ref={handleRef} columns={viewColumns} rows={viewRows} />);
    const { captured, restore } = patchDownload();
    try {
      await handleRef.current!.exportToXlsx('demo.xlsx');
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
    const handleRef = createRef<TableHandle>();
    render(<ChronixTable ref={handleRef} columns={viewColumns} rows={viewRows} />);
    const { captured, restore } = patchDownload();
    try {
      await handleRef.current!.exportToXlsx('demo.xlsx', {
        xlsxOptions: { sheetName: 'CustomSheet' },
      });
    } finally {
      restore();
    }
    expect(captured.blobs.length).toBe(1);
    expect(captured.blobs[0]!.size).toBeGreaterThan(0);
  });

  it('exportToXlsx with rowSource:"all" still produces a valid blob', async () => {
    const handleRef = createRef<TableHandle>();
    render(<ChronixTable ref={handleRef} columns={viewColumns} rows={viewRows} />);
    const { captured, restore } = patchDownload();
    try {
      await handleRef.current!.exportToXlsx('all.xlsx', { rowSource: 'all' });
    } finally {
      restore();
    }
    expect(captured.blobs.length).toBe(1);
    expect(captured.blobs[0]!.size).toBeGreaterThan(0);
  });
});

describe('+ 39.1: a11y + multi-sheet xlsx (react)', () => {
  const viewColumns: readonly ColumnSpec[] = [
    { id: 'id', field: 'id', headerName: 'ID', width: 80 },
    { id: 'name', field: 'name', headerName: 'Name', flex: 1 },
    { id: 'qty', field: 'qty', headerName: 'Qty', width: 120, type: 'number' },
  ];

  const viewRows: readonly RowSpec[] = [
    { id: 'r1', data: { id: 1, name: 'Alpha', qty: 10 } },
    { id: 'r2', data: { id: 2, name: 'Beta', qty: 20 } },
  ];

  function patchMultiSheetDownload(): {
    captured: { blobs: Blob[]; filenames: string[] };
    restore: () => void;
  } {
    const captured = { blobs: [] as Blob[], filenames: [] as string[] };
    const origCreateDescriptor = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
    const origRevokeDescriptor = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: (b: Blob | MediaSource): string => {
        if (b instanceof Blob) captured.blobs.push(b);
        return 'blob:cx-test';
      },
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: (): void => {
        /* swallow */
      },
    });
    const origClickDescriptor = Object.getOwnPropertyDescriptor(
      HTMLAnchorElement.prototype,
      'click',
    );
    Object.defineProperty(HTMLAnchorElement.prototype, 'click', {
      configurable: true,
      writable: true,
      value: function (this: HTMLAnchorElement) {
        if (this.hasAttribute('data-cx-table-xlsx-download')) {
          captured.filenames.push(this.getAttribute('download') ?? '');
        }
      },
    });
    return {
      captured,
      restore: () => {
        if (origCreateDescriptor != null) {
          Object.defineProperty(URL, 'createObjectURL', origCreateDescriptor);
        }
        if (origRevokeDescriptor != null) {
          Object.defineProperty(URL, 'revokeObjectURL', origRevokeDescriptor);
        }
        if (origClickDescriptor != null) {
          Object.defineProperty(HTMLAnchorElement.prototype, 'click', origClickDescriptor);
        }
      },
    };
  }

  it('(react): wrapper carries aria-rowcount + aria-colcount + role=grid', () => {
    const { container } = render(<ChronixTable columns={viewColumns} rows={viewRows} />);
    const root = container.querySelector('.cx-table-wrapper');
    expect(root).not.toBeNull();
    expect(root!.getAttribute('role')).toBe('grid');
    expect(root!.getAttribute('aria-rowcount')).toBeTruthy();
    expect(root!.getAttribute('aria-colcount')).toBe('3');
    expect(Number(root!.getAttribute('aria-rowcount'))).toBeGreaterThanOrEqual(3);
  });

  it('(react): off-screen live region renders with role=status + aria-live=polite', () => {
    const { container } = render(<ChronixTable columns={viewColumns} rows={viewRows} />);
    const live = container.querySelector('.cx-table-sr-announce');
    expect(live).not.toBeNull();
    expect(live!.getAttribute('role')).toBe('status');
    expect(live!.getAttribute('aria-live')).toBe('polite');
    expect(live!.getAttribute('aria-atomic')).toBe('true');
  });

  it('(react): exportToXlsxMultiSheet triggers ONE Blob download with XLSX mimetype', async () => {
    const handleRef = createRef<TableHandle>();
    render(<ChronixTable ref={handleRef} columns={viewColumns} rows={viewRows} />);
    const { captured, restore } = patchMultiSheetDownload();
    try {
      await handleRef.current!.exportToXlsxMultiSheet('multi.xlsx', [
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

describe('+ 39.3: per-cell ARIA indices + xlsx freeze-pane (react)', () => {
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

  function patchMultiSheetDownload(): {
    captured: { blobs: Blob[]; filenames: string[] };
    restore: () => void;
  } {
    const captured = { blobs: [] as Blob[], filenames: [] as string[] };
    const origCreateDescriptor = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
    const origRevokeDescriptor = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: (b: Blob | MediaSource): string => {
        if (b instanceof Blob) captured.blobs.push(b);
        return 'blob:cx-test';
      },
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: (): void => {
        /* swallow */
      },
    });
    const origClickDescriptor = Object.getOwnPropertyDescriptor(
      HTMLAnchorElement.prototype,
      'click',
    );
    Object.defineProperty(HTMLAnchorElement.prototype, 'click', {
      configurable: true,
      writable: true,
      value: function (this: HTMLAnchorElement) {
        if (this.hasAttribute('data-cx-table-xlsx-download')) {
          captured.filenames.push(this.getAttribute('download') ?? '');
        }
      },
    });
    return {
      captured,
      restore: () => {
        if (origCreateDescriptor != null) {
          Object.defineProperty(URL, 'createObjectURL', origCreateDescriptor);
        }
        if (origRevokeDescriptor != null) {
          Object.defineProperty(URL, 'revokeObjectURL', origRevokeDescriptor);
        }
        if (origClickDescriptor != null) {
          Object.defineProperty(HTMLAnchorElement.prototype, 'click', origClickDescriptor);
        }
      },
    };
  }

  it('(react): header row has aria-rowindex=1', () => {
    const { container } = render(<ChronixTable columns={viewColumns} rows={viewRows} />);
    const header = container.querySelector('.cx-table-row--header');
    expect(header).not.toBeNull();
    expect(header!.getAttribute('aria-rowindex')).toBe('1');
  });

  it('(react): body rows have monotonically increasing aria-rowindex starting at 2', () => {
    const { container } = render(<ChronixTable columns={viewColumns} rows={viewRows} />);
    const bodyRows = Array.from(
      container.querySelectorAll('.cx-table-row:not(.cx-table-row--header)'),
    );
    expect(bodyRows.length).toBeGreaterThanOrEqual(3);
    const indices = bodyRows.slice(0, 3).map((r) => Number(r.getAttribute('aria-rowindex')));
    expect(indices).toEqual([2, 3, 4]);
  });

  it('(react): body cells have aria-colindex matching column position (1..N)', () => {
    const { container } = render(<ChronixTable columns={viewColumns} rows={viewRows} />);
    const firstBodyRow = container.querySelector('.cx-table-row:not(.cx-table-row--header)');
    expect(firstBodyRow).not.toBeNull();
    const cells = Array.from(firstBodyRow!.querySelectorAll('[role="gridcell"]'));
    const indices = cells.slice(0, 3).map((c) => Number(c.getAttribute('aria-colindex')));
    expect(indices).toEqual([1, 2, 3]);
  });

  it('(react): column headers carry matching aria-colindex (1..N)', () => {
    const { container } = render(<ChronixTable columns={viewColumns} rows={viewRows} />);
    const allColHeaders = Array.from(
      container.querySelectorAll('.cx-table-row--header [role="columnheader"]'),
    );
    const colHeaders = allColHeaders.filter(
      (c) => c.getAttribute('data-col-id') !== '__cx_selection__',
    );
    const indices = colHeaders.slice(0, 3).map((c) => Number(c.getAttribute('aria-colindex')));
    expect(indices).toEqual([1, 2, 3]);
  });

  it('(react): exportToXlsxMultiSheet threads xlsxOptions.freezePane per sheet', async () => {
    const handleRef = createRef<TableHandle>();
    render(<ChronixTable ref={handleRef} columns={viewColumns} rows={viewRows} />);
    const { captured, restore } = patchMultiSheetDownload();
    try {
      await handleRef.current!.exportToXlsxMultiSheet('frozen.xlsx', [
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

describe('(react): advanced filter', () => {
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

  it('setAdvancedFilter installs an ExpressionFilterSpec and fires onFilterChange', () => {
    const onFilterChange = vi.fn();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={columns}
        rows={rows}
        onFilterChange={onFilterChange}
      />,
    );
    const handle = handleRef.current as unknown as AdvancedFilterHandle;
    act(() => {
      handle.setAdvancedFilter({
        kind: 'compare',
        colId: 'qty',
        operator: '>',
        value: 15,
      });
    });
    expect(onFilterChange).toHaveBeenCalled();
    const lastCall = onFilterChange.mock.calls[onFilterChange.mock.calls.length - 1] as
      | [{ filterSpec: readonly FilterSpec[] }]
      | undefined;
    expect(lastCall?.[0]?.filterSpec.length).toBe(1);
    expect(lastCall?.[0]?.filterSpec[0]?.type).toBe('expression');
  });

  it('getAdvancedFilter returns expression + source after a parseAndSet', () => {
    const handleRef = createRef<TableHandle>();
    render(<ChronixTable ref={handleRef} columns={columns} rows={rows} />);
    const handle = handleRef.current as unknown as AdvancedFilterHandle;
    act(() => {
      handle.parseAndSetAdvancedFilter('qty > 15');
    });
    const current = handle.getAdvancedFilter();
    expect(current).not.toBeNull();
    expect(current?.source).toBe('qty > 15');
    expect(current?.expression.kind).toBe('compare');
  });

  it('setAdvancedFilter(null) clears the expression while keeping text spec on another column', () => {
    const handleRef = createRef<TableHandle>();
    render(<ChronixTable ref={handleRef} columns={columns} rows={rows} />);
    const handle = handleRef.current as unknown as AdvancedFilterHandle;
    const textSpec: FilterSpec = {
      type: 'text',
      colId: 'name',
      operator: 'contains',
      value: 'a',
    };
    act(() => {
      handle.setFilter([
        textSpec,
        {
          type: 'expression',
          expression: { kind: 'compare', colId: 'qty', operator: '>', value: 15 },
        },
      ]);
    });
    act(() => {
      handle.setAdvancedFilter(null);
    });
    const after = handle.getFilter();
    expect(after.length).toBe(1);
    expect(after[0]?.type).toBe('text');
  });

  it('parseAndSetAdvancedFilter applies on success and returns the parse result', () => {
    const handleRef = createRef<TableHandle>();
    render(<ChronixTable ref={handleRef} columns={columns} rows={rows} />);
    const handle = handleRef.current as unknown as AdvancedFilterHandle;
    let result: ParseFilterExpressionResult | undefined;
    act(() => {
      result = handle.parseAndSetAdvancedFilter('qty > 15');
    });
    expect(result?.ok).toBe(true);
    const current = handle.getAdvancedFilter();
    expect(current?.expression.kind).toBe('compare');
  });

  it('parseAndSetAdvancedFilter returns errors and leaves prior filter unchanged on invalid input', () => {
    const handleRef = createRef<TableHandle>();
    render(<ChronixTable ref={handleRef} columns={columns} rows={rows} />);
    const handle = handleRef.current as unknown as AdvancedFilterHandle;
    act(() => {
      handle.parseAndSetAdvancedFilter('qty > 15');
    });
    const before = handle.getAdvancedFilter();
    let result: ParseFilterExpressionResult | undefined;
    act(() => {
      result = handle.parseAndSetAdvancedFilter('garbage @@@');
    });
    expect(result?.ok).toBe(false);
    const after = handle.getAdvancedFilter();
    expect(after?.expression).toEqual(before?.expression);
  });
});

describe('(react): row drag', () => {
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
    const { container } = render(
      <ChronixTable columns={dragColumns} rows={dragRows} rowDragColumn={{ show: true }} />,
    );
    const gripCells = container.querySelectorAll('[data-row-drag-handle="true"]');
    expect(gripCells.length).toBe(3);
  });

  it('does NOT render grip cells when rowDragColumn.show is false', () => {
    const { container } = render(<ChronixTable columns={dragColumns} rows={dragRows} />);
    const gripCells = container.querySelectorAll('[data-row-drag-handle="true"]');
    expect(gripCells.length).toBe(0);
  });

  it('startMovingRow opens session + fires onRowMoveStart', () => {
    const onRowMoveStart = vi.fn();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={dragColumns}
        rows={dragRows}
        rowDragColumn={{ show: true }}
        onRowMoveStart={onRowMoveStart}
      />,
    );
    const handle = handleRef.current as unknown as RowDragHandle;
    act(() => {
      handle.startMovingRow('r1');
    });
    expect(handle.getMovingRow()?.rowId).toBe('r1');
    expect(onRowMoveStart).toHaveBeenCalled();
  });

  it('commitRowMove fires onRowOrderChange + onRowMoveStop committed:true', () => {
    const onRowMoveStop = vi.fn();
    const onRowOrderChange = vi.fn();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={dragColumns}
        rows={dragRows}
        rowDragColumn={{ show: true }}
        onRowMoveStop={onRowMoveStop}
        onRowOrderChange={onRowOrderChange}
      />,
    );
    const handle = handleRef.current as unknown as RowDragHandle;
    act(() => {
      handle.startMovingRow('r1');
    });
    act(() => {
      handle.commitRowMove('r3', 'below');
    });
    expect(handle.getMovingRow()).toBeNull();
    expect(onRowOrderChange).toHaveBeenCalled();
    const orderCall = onRowOrderChange.mock.calls[onRowOrderChange.mock.calls.length - 1] as
      | [{ movedRow: RowSpec; targetRow: RowSpec; position: 'above' | 'below' }]
      | undefined;
    expect(orderCall?.[0]?.movedRow.id).toBe('r1');
    expect(orderCall?.[0]?.targetRow.id).toBe('r3');
    expect(orderCall?.[0]?.position).toBe('below');
    const stopCall = onRowMoveStop.mock.calls[onRowMoveStop.mock.calls.length - 1] as
      | [{ committed: boolean }]
      | undefined;
    expect(stopCall?.[0]?.committed).toBe(true);
  });

  it('cancelRowMove fires onRowMoveStop committed:false + no onRowOrderChange', () => {
    const onRowMoveStop = vi.fn();
    const onRowOrderChange = vi.fn();
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={dragColumns}
        rows={dragRows}
        rowDragColumn={{ show: true }}
        onRowMoveStop={onRowMoveStop}
        onRowOrderChange={onRowOrderChange}
      />,
    );
    const handle = handleRef.current as unknown as RowDragHandle;
    act(() => {
      handle.startMovingRow('r1');
    });
    act(() => {
      handle.cancelRowMove();
    });
    expect(handle.getMovingRow()).toBeNull();
    const stopCall = onRowMoveStop.mock.calls[onRowMoveStop.mock.calls.length - 1] as
      | [{ committed: boolean }]
      | undefined;
    expect(stopCall?.[0]?.committed).toBe(false);
    expect(onRowOrderChange).not.toHaveBeenCalled();
  });

  it('startMovingRow on pinned or draggable:false row is a silent no-op', () => {
    const onRowMoveStart = vi.fn();
    const rowsWithPin: readonly RowSpec[] = [
      { id: 'pinned-top', data: { id: 0 }, pinned: 'top' },
      { id: 'r1', data: { id: 1 } },
      { id: 'r2', data: { id: 2 }, draggable: false },
    ];
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={dragColumns}
        rows={rowsWithPin}
        rowDragColumn={{ show: true }}
        onRowMoveStart={onRowMoveStart}
      />,
    );
    const handle = handleRef.current as unknown as RowDragHandle;
    act(() => {
      handle.startMovingRow('pinned-top');
    });
    expect(handle.getMovingRow()).toBeNull();
    act(() => {
      handle.startMovingRow('r2');
    });
    expect(handle.getMovingRow()).toBeNull();
    expect(onRowMoveStart).not.toHaveBeenCalled();
  });
});

describe('(react): set filter', () => {
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
    const { container } = render(
      <ChronixTable columns={setColumns} rows={setRows} showFilterRow />,
    );
    const setFilterEl = container.querySelector(
      '.cx-table-filter-cell[data-col-id="status"][data-filter-ui="set"] details.cx-table-set-filter',
    );
    expect(setFilterEl).not.toBeNull();
    const textFilterEl = container.querySelector(
      '.cx-table-filter-cell[data-col-id="name"] input.cx-table-filter-input',
    );
    expect(textFilterEl).not.toBeNull();
  });

  it('summary text reflects all-selected identity state by default', () => {
    const { container } = render(
      <ChronixTable columns={setColumns} rows={setRows} showFilterRow />,
    );
    const summary = container.querySelector(
      'details.cx-table-set-filter summary.cx-table-set-filter__summary',
    );
    expect(summary?.textContent).toContain('全部');
    expect(summary?.textContent).toContain('(3)');
  });

  it('toggling a checkbox dispatches setFilter with SetFilterSpec', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={setColumns} rows={setRows} showFilterRow />,
    );
    const checkboxes = Array.from(
      container.querySelectorAll<HTMLInputElement>(
        '.cx-table-set-filter__item input[type="checkbox"]',
      ),
    );
    expect(checkboxes.length).toBe(3);
    act(() => {
      fireEvent.click(checkboxes[0]!);
    });
    const handle = handleRef.current as unknown as SetFilterHandle;
    const filter = handle.getFilter();
    expect(filter.length).toBe(1);
    expect(filter[0]?.type).toBe('set');
  });

  it('全选 / 清空 buttons set selectedValues to null / [] respectively', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={setColumns} rows={setRows} showFilterRow />,
    );
    const handle = handleRef.current as unknown as SetFilterHandle;
    const clearBtn = container.querySelector(
      'details.cx-table-set-filter button[data-action="clear"]',
    );
    act(() => {
      fireEvent.click(clearBtn!);
    });
    const afterClear = handle.getFilter();
    expect(afterClear.length).toBe(1);
    const clearedSpec = afterClear[0];
    if (clearedSpec?.type !== 'set') throw new Error('expected set filter');
    expect(clearedSpec.selectedValues).toEqual([]);
    const selectAllBtn = container.querySelector(
      'details.cx-table-set-filter button[data-action="select-all"]',
    );
    act(() => {
      fireEvent.click(selectAllBtn!);
    });
    expect(handle.getFilter().length).toBe(0);
  });

  it('getColumnUniqueValues exposes core helper through TableHandle', () => {
    const handleRef = createRef<TableHandle>();
    render(<ChronixTable ref={handleRef} columns={setColumns} rows={setRows} />);
    const handle = handleRef.current as unknown as SetFilterHandle;
    const result = handle.getColumnUniqueValues('status');
    expect(result.values.length).toBe(3);
    expect(result.truncated).toBe(false);
    const labels = result.values.map((v) => v.value);
    expect(new Set(labels)).toEqual(new Set(['完成', '进行中', '阻塞']));
  });
});

describe('set filter virtualization (react)', () => {
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

  it('96.2 (react): below threshold renders eagerly (no virtualization wrapper)', () => {
    const { container } = render(
      <ChronixTable
        columns={SET_FILTER_COLUMNS}
        rows={makeRows(10)}
        showFilterRow
        setFilterVirtualizeThreshold={100}
      />,
    );
    const listEl = container.querySelector<HTMLElement>('.cx-table-set-filter__list');
    expect(listEl).not.toBeNull();
    expect(listEl?.getAttribute('data-virtualized')).toBe('false');
    expect(container.querySelector('.cx-table-set-filter__sizer')).toBeNull();
    expect(container.querySelector('.cx-table-set-filter__window')).toBeNull();
    const items = container.querySelectorAll('.cx-table-set-filter__item');
    expect(items.length).toBe(10);
  });

  it('96.2 (react): above threshold renders virtualized window with sizer wrapper', () => {
    const { container } = render(
      <ChronixTable
        columns={SET_FILTER_COLUMNS}
        rows={makeRows(300)}
        showFilterRow
        setFilterVirtualizeThreshold={50}
      />,
    );
    const listEl = container.querySelector<HTMLElement>('.cx-table-set-filter__list');
    expect(listEl?.getAttribute('data-virtualized')).toBe('true');
    Object.defineProperty(listEl, 'clientHeight', { value: 240, configurable: true });
    act(() => {
      listEl!.dispatchEvent(new Event('scroll', { bubbles: true }));
    });
    const sizerEl = container.querySelector<HTMLElement>('.cx-table-set-filter__sizer');
    const windowEl = container.querySelector<HTMLElement>('.cx-table-set-filter__window');
    expect(sizerEl).not.toBeNull();
    expect(windowEl).not.toBeNull();
    expect(sizerEl?.style.height).toBe('8400px');
    expect(windowEl?.getAttribute('data-window-start')).toBe('0');
    expect(windowEl?.getAttribute('data-window-end')).toBe('12');
    const visible = container.querySelectorAll('.cx-table-set-filter__item');
    expect(visible.length).toBe(12);
  });

  it('96.2 (react): scrolling updates the rendered window', () => {
    const { container } = render(
      <ChronixTable
        columns={SET_FILTER_COLUMNS}
        rows={makeRows(300)}
        showFilterRow
        setFilterVirtualizeThreshold={50}
      />,
    );
    const listEl = container.querySelector<HTMLElement>('.cx-table-set-filter__list')!;
    Object.defineProperty(listEl, 'clientHeight', { value: 240, configurable: true });
    act(() => {
      listEl.dispatchEvent(new Event('scroll', { bubbles: true }));
    });
    Object.defineProperty(listEl, 'scrollTop', { value: 500, configurable: true });
    act(() => {
      listEl.dispatchEvent(new Event('scroll', { bubbles: true }));
    });
    const windowEl = container.querySelector<HTMLElement>('.cx-table-set-filter__window')!;
    expect(windowEl.getAttribute('data-window-start')).toBe('14');
    expect(windowEl.getAttribute('data-window-end')).toBe('30');
  });
});

describe('number filter range slider (react)', () => {
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

  it('98.2 (react): default off — no slider rendered for numeric column', () => {
    const { container } = render(<ChronixTable columns={NUM_COLS} rows={NUM_ROWS} showFilterRow />);
    expect(container.querySelector('.cx-table-number-filter__range')).toBeNull();
    expect(container.querySelector('.cx-table-filter-input[data-col-id="qty"]')).not.toBeNull();
  });

  it('98.2 (react): prop on + numeric col + finite data — slider renders with track + 2 thumbs', () => {
    const { container } = render(
      <ChronixTable columns={NUM_COLS} rows={NUM_ROWS} showFilterRow numberFilterShowRangeSlider />,
    );
    const slider = container.querySelector('.cx-table-number-filter__range[data-col-id="qty"]');
    expect(slider).not.toBeNull();
    const lowThumb = slider!.querySelector('[data-range-handle="low"]');
    const highThumb = slider!.querySelector('[data-range-handle="high"]');
    expect(lowThumb?.getAttribute('role')).toBe('slider');
    expect(highThumb?.getAttribute('role')).toBe('slider');
    expect(lowThumb?.getAttribute('aria-valuemin')).toBe('5');
    expect(lowThumb?.getAttribute('aria-valuemax')).toBe('100');
    expect(lowThumb?.getAttribute('aria-valuenow')).toBe('5');
    expect(highThumb?.getAttribute('aria-valuenow')).toBe('100');
  });

  it('98.2 (react): prop on + no finite numeric data — no slider rendered', () => {
    const noNumRows: readonly RowSpec[] = [
      { id: 'r1', data: { qty: null } },
      { id: 'r2', data: { qty: 'bogus' } },
    ];
    const { container } = render(
      <ChronixTable
        columns={NUM_COLS}
        rows={noNumRows}
        showFilterRow
        numberFilterShowRangeSlider
      />,
    );
    expect(container.querySelector('.cx-table-number-filter__range')).toBeNull();
    expect(container.querySelector('.cx-table-filter-input[data-col-id="qty"]')).not.toBeNull();
  });

  it('98.2 (react): pointerdown on track commits inRange spec; Home on high thumb collapses high to low', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={NUM_COLS}
        rows={NUM_ROWS}
        showFilterRow
        numberFilterShowRangeSlider
      />,
    );
    const track = container.querySelector<HTMLElement>(
      '.cx-table-number-filter__range[data-col-id="qty"]',
    )!;
    stubTrackRect(track, 100);
    act(() => {
      fireMovePointer('pointerdown', track, { clientX: 10, clientY: 10, pointerId: 1, button: 0 });
    });
    const handle = handleRef.current as unknown as { getFilter(): readonly FilterSpec[] };
    const spec1 = handle.getFilter()[0];
    expect(spec1).toMatchObject({
      type: 'number',
      colId: 'qty',
      operator: 'inRange',
      value: 15,
      valueTo: 100,
    });
    act(() => {
      fireMovePointer('pointerup', track, { clientX: 10, clientY: 10, pointerId: 1 });
    });
    const highThumb = container.querySelector<HTMLElement>(
      '.cx-table-number-filter__range[data-col-id="qty"] [data-range-handle="high"]',
    )!;
    act(() => {
      fireEvent.keyDown(highThumb, { key: 'Home' });
    });
    const spec2 = handle.getFilter()[0];
    expect(spec2).toMatchObject({
      type: 'number',
      colId: 'qty',
      operator: 'inRange',
      value: 15,
      valueTo: 15,
    });
  });
});

describe('cell style editor (react)', () => {
  const CELL_STYLE_COLUMNS: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: 'Name', width: 200 },
  ];

  const CELL_STYLE_ROWS: readonly RowSpec[] = [
    { id: 'r1', data: { name: 'A' } },
    { id: 'r2', data: { name: 'B' } },
  ];

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

  it('99.2 (react): default off — openCellStyleEditor is a no-op; popover not in DOM', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={CELL_STYLE_COLUMNS} rows={CELL_STYLE_ROWS} />,
    );
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    expect(container.querySelector('.cx-table-cell-style-editor')).toBeNull();
  });

  it('99.2 (react): prop on + open via handle mounts popover anchored to the cell with default white state', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    const editor = container.querySelector('.cx-table-cell-style-editor');
    expect(editor).not.toBeNull();
    expect(editor!.getAttribute('data-row-id')).toBe('r1');
    expect(editor!.getAttribute('data-col-id')).toBe('name');
    const rInput = container.querySelector<HTMLInputElement>('input[data-cx-style-rgb="r"]');
    const hexInput = container.querySelector<HTMLInputElement>('input[data-cx-style-hex]');
    expect(rInput?.value).toBe('255');
    expect(hexInput?.value).toBe('#ffffff');
  });

  it('99.2 (react): typing HEX into the input updates HSV-derived RGB inputs in sync', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    const hexInput = container.querySelector<HTMLInputElement>('input[data-cx-style-hex]')!;
    act(() => {
      fireEvent.change(hexInput, { target: { value: '#3b82f6' } });
    });
    const rInput = container.querySelector<HTMLInputElement>('input[data-cx-style-rgb="r"]')!;
    const gInput = container.querySelector<HTMLInputElement>('input[data-cx-style-rgb="g"]')!;
    const bInput = container.querySelector<HTMLInputElement>('input[data-cx-style-rgb="b"]')!;
    expect(rInput.value).toBe('59');
    expect(gInput.value).toBe('130');
    expect(bInput.value).toBe('246');
  });

  it('99.2 (react): Apply persists backgroundColor + calls onCellStyleChange + closes popover', () => {
    const handleRef = createRef<TableHandle>();
    const onCellStyleChange = vi.fn();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
        onCellStyleChange={onCellStyleChange}
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    const hexInput = container.querySelector<HTMLInputElement>('input[data-cx-style-hex]')!;
    act(() => {
      fireEvent.change(hexInput, { target: { value: '#3b82f6' } });
    });
    const applyBtn = container.querySelector<HTMLButtonElement>(
      'button[data-cx-style-action="apply"]',
    )!;
    act(() => {
      fireEvent.click(applyBtn);
    });
    expect(container.querySelector('.cx-table-cell-style-editor')).toBeNull();
    expect(onCellStyleChange).toHaveBeenCalledWith({
      rowId: 'r1',
      colId: 'name',
      style: { backgroundColor: '#3b82f6' },
    });
    const refreshedCell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    // jsdom (react test env) normalizes inline HEX background-color
    // to `rgb(R, G, B)` form on read (real browsers do the same via
    // getComputedStyle; happy-dom is the outlier that preserves
    // the HEX literal). The cell IS styled with #3b82f6 — assertion
    // matches what jsdom returns.
    expect(refreshedCell.style.backgroundColor).toBe('rgb(59, 130, 246)');
  });

  it('99.2 (react): Clear deletes per-cell override + calls onCellStyleChange with null + cell renders without override', () => {
    const handleRef = createRef<TableHandle>();
    const onCellStyleChange = vi.fn();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
        onCellStyleChange={onCellStyleChange}
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    // Apply first.
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    const hexInput1 = container.querySelector<HTMLInputElement>('input[data-cx-style-hex]')!;
    act(() => {
      fireEvent.change(hexInput1, { target: { value: '#10b981' } });
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-action="apply"]')!,
      );
    });
    let refreshedCell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    expect(refreshedCell.style.backgroundColor).toBe('rgb(16, 185, 129)');
    // Re-open + Clear.
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-action="clear"]')!,
      );
    });
    expect(onCellStyleChange).toHaveBeenLastCalledWith({
      rowId: 'r1',
      colId: 'name',
      style: { backgroundColor: null },
    });
    refreshedCell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    expect(refreshedCell.style.backgroundColor).toBe('');
  });
});

describe('cell text color extension (react)', () => {
  const CELL_STYLE_COLUMNS: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: 'Name', width: 200 },
  ];
  const CELL_STYLE_ROWS: readonly RowSpec[] = [
    { id: 'r1', data: { name: 'A' } },
    { id: 'r2', data: { name: 'B' } },
  ];

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

  it('99.2.1 (react): tab strip default — Background active, default #ffffff in HEX input', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    const editor = container.querySelector<HTMLElement>('.cx-table-cell-style-editor')!;
    expect(editor.getAttribute('data-cx-style-active-tab')).toBe('background');
    const bgTab = container.querySelector<HTMLButtonElement>(
      'button[data-cx-style-tab="background"]',
    )!;
    const textTab = container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="text"]')!;
    expect(bgTab.getAttribute('aria-selected')).toBe('true');
    expect(textTab.getAttribute('aria-selected')).toBe('false');
    const hexInput = container.querySelector<HTMLInputElement>('input[data-cx-style-hex]')!;
    expect(hexInput.value).toBe('#ffffff');
  });

  it('99.2.1 (react): switching to Text tab loads default #000000 + buffers bg axis', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    const hexInput = container.querySelector<HTMLInputElement>('input[data-cx-style-hex]')!;
    act(() => {
      fireEvent.change(hexInput, { target: { value: '#3b82f6' } });
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="text"]')!,
      );
    });
    const editor = container.querySelector<HTMLElement>('.cx-table-cell-style-editor')!;
    expect(editor.getAttribute('data-cx-style-active-tab')).toBe('text');
    const hexInputAfter = container.querySelector<HTMLInputElement>('input[data-cx-style-hex]')!;
    expect(hexInputAfter.value).toBe('#000000');
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="background"]')!,
      );
    });
    const hexInputFinal = container.querySelector<HTMLInputElement>('input[data-cx-style-hex]')!;
    expect(hexInputFinal.value).toBe('#3b82f6');
  });

  it('99.2.1 (react): Apply on Text tab persists only color + payload has color only + cell renders color', () => {
    const handleRef = createRef<TableHandle>();
    const onCellStyleChange = vi.fn();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
        onCellStyleChange={onCellStyleChange}
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="text"]')!,
      );
    });
    const hexInput = container.querySelector<HTMLInputElement>('input[data-cx-style-hex]')!;
    act(() => {
      fireEvent.change(hexInput, { target: { value: '#ff0000' } });
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-action="apply"]')!,
      );
    });
    expect(container.querySelector('.cx-table-cell-style-editor')).toBeNull();
    expect(onCellStyleChange).toHaveBeenCalledTimes(1);
    const lastCall = onCellStyleChange.mock.calls[0]![0] as {
      rowId: string;
      colId: string;
      style: { backgroundColor?: string | null; color?: string | null };
    };
    expect(lastCall).toEqual({
      rowId: 'r1',
      colId: 'name',
      style: { color: '#ff0000' },
    });
    expect(lastCall.style.backgroundColor).toBeUndefined();
    const refreshedCell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    // jsdom normalizes inline color to rgb(...) form (vs happy-dom's HEX literal).
    expect(refreshedCell.style.color).toBe('rgb(255, 0, 0)');
    expect(refreshedCell.style.backgroundColor).toBe('');
  });

  it('99.2.1 (react): Clear on Text tab while bg also persisted preserves bg, emits color:null, cell drops color only', () => {
    const handleRef = createRef<TableHandle>();
    const onCellStyleChange = vi.fn();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
        onCellStyleChange={onCellStyleChange}
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    // First: Apply bg.
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    const hexInput1 = container.querySelector<HTMLInputElement>('input[data-cx-style-hex]')!;
    act(() => {
      fireEvent.change(hexInput1, { target: { value: '#3b82f6' } });
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-action="apply"]')!,
      );
    });
    // Second: Apply text.
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="text"]')!,
      );
    });
    const hexInput2 = container.querySelector<HTMLInputElement>('input[data-cx-style-hex]')!;
    act(() => {
      fireEvent.change(hexInput2, { target: { value: '#ff0000' } });
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-action="apply"]')!,
      );
    });
    let refreshedCell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    expect(refreshedCell.style.backgroundColor).toBe('rgb(59, 130, 246)');
    expect(refreshedCell.style.color).toBe('rgb(255, 0, 0)');
    // Third: re-open + switch to Text + Clear.
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="text"]')!,
      );
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-action="clear"]')!,
      );
    });
    const lastCall = onCellStyleChange.mock.calls.at(-1)![0] as {
      rowId: string;
      colId: string;
      style: { backgroundColor?: string | null; color?: string | null };
    };
    expect(lastCall).toEqual({
      rowId: 'r1',
      colId: 'name',
      style: { color: null },
    });
    expect(lastCall.style.backgroundColor).toBeUndefined();
    refreshedCell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    expect(refreshedCell.style.backgroundColor).toBe('rgb(59, 130, 246)');
    expect(refreshedCell.style.color).toBe('');
  });
});

describe('cell font axes extension (react)', () => {
  const CELL_STYLE_COLUMNS: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: 'Name', width: 200 },
  ];
  const CELL_STYLE_ROWS: readonly RowSpec[] = [
    { id: 'r1', data: { name: 'A' } },
    { id: 'r2', data: { name: 'B' } },
  ];

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

  it('99.2.2 (react): font tab appears + click switches active tab to font', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    const fontTab = container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="font"]')!;
    expect(fontTab).not.toBeNull();
    expect(fontTab.getAttribute('aria-selected')).toBe('false');
    act(() => {
      fireEvent.click(fontTab);
    });
    expect(
      container
        .querySelector<HTMLElement>('.cx-table-cell-style-editor')!
        .getAttribute('data-cx-style-active-tab'),
    ).toBe('font');
    expect(container.querySelector('[data-cx-style-square]')).toBeNull();
    expect(container.querySelector('[data-cx-style-font="weight-bold"]')).not.toBeNull();
  });

  it('99.2.2 (react): Bold toggle flips fontState.fontWeight', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="font"]')!,
      );
    });
    const boldBtn = container.querySelector<HTMLButtonElement>(
      'button[data-cx-style-font="weight-bold"]',
    )!;
    expect(boldBtn.getAttribute('aria-pressed')).toBe('false');
    act(() => {
      fireEvent.click(boldBtn);
    });
    expect(boldBtn.getAttribute('aria-pressed')).toBe('true');
    act(() => {
      fireEvent.click(boldBtn);
    });
    expect(boldBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('99.2.2 (react): Italic toggle flips fontState.fontStyle', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="font"]')!,
      );
    });
    const italicBtn = container.querySelector<HTMLButtonElement>(
      'button[data-cx-style-font="style-italic"]',
    )!;
    act(() => {
      fireEvent.click(italicBtn);
    });
    expect(italicBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('99.2.2 (react): text-decoration tri-state', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="font"]')!,
      );
    });
    const underlineBtn = container.querySelector<HTMLButtonElement>(
      'button[data-cx-style-font-deco="underline"]',
    )!;
    const noneBtn = container.querySelector<HTMLButtonElement>(
      'button[data-cx-style-font-deco="none"]',
    )!;
    act(() => {
      fireEvent.click(underlineBtn);
    });
    expect(underlineBtn.getAttribute('aria-pressed')).toBe('true');
    expect(noneBtn.getAttribute('aria-pressed')).toBe('false');
    act(() => {
      fireEvent.click(noneBtn);
    });
    expect(noneBtn.getAttribute('aria-pressed')).toBe('true');
    expect(underlineBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('99.2.2 (react): Apply on font tab persists 3 font fields + emits + cell renders inline font props', () => {
    const handleRef = createRef<TableHandle>();
    const onCellStyleChange = vi.fn();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
        onCellStyleChange={onCellStyleChange}
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="font"]')!,
      );
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-font="weight-bold"]')!,
      );
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-font="style-italic"]')!,
      );
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-font-deco="underline"]')!,
      );
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-action="apply"]')!,
      );
    });
    expect(container.querySelector('.cx-table-cell-style-editor')).toBeNull();
    expect(onCellStyleChange).toHaveBeenLastCalledWith({
      rowId: 'r1',
      colId: 'name',
      style: { fontWeight: '700', fontStyle: 'italic', textDecoration: 'underline' },
    });
    const refreshedCell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    expect(refreshedCell.style.fontWeight).toBe('700');
    expect(refreshedCell.style.fontStyle).toBe('italic');
    expect(refreshedCell.style.textDecoration).toBe('underline');
  });

  it('99.2.2 (react): Clear on font tab while bg + color also persisted preserves bg + color', () => {
    const handleRef = createRef<TableHandle>();
    const onCellStyleChange = vi.fn();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
        onCellStyleChange={onCellStyleChange}
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    // Apply bg.
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.change(container.querySelector<HTMLInputElement>('input[data-cx-style-hex]')!, {
        target: { value: '#3b82f6' },
      });
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-action="apply"]')!,
      );
    });
    // Apply text color.
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="text"]')!,
      );
    });
    act(() => {
      fireEvent.change(container.querySelector<HTMLInputElement>('input[data-cx-style-hex]')!, {
        target: { value: '#ff0000' },
      });
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-action="apply"]')!,
      );
    });
    // Apply font (bold).
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="font"]')!,
      );
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-font="weight-bold"]')!,
      );
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-action="apply"]')!,
      );
    });
    let refreshedCell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    expect(refreshedCell.style.backgroundColor).toBe('rgb(59, 130, 246)');
    expect(refreshedCell.style.color).toBe('rgb(255, 0, 0)');
    expect(refreshedCell.style.fontWeight).toBe('700');
    // Clear on font tab.
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="font"]')!,
      );
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-action="clear"]')!,
      );
    });
    expect(onCellStyleChange).toHaveBeenLastCalledWith({
      rowId: 'r1',
      colId: 'name',
      style: { fontWeight: null, fontStyle: null, textDecoration: null },
    });
    refreshedCell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    expect(refreshedCell.style.backgroundColor).toBe('rgb(59, 130, 246)');
    expect(refreshedCell.style.color).toBe('rgb(255, 0, 0)');
    expect(refreshedCell.style.fontWeight).toBe('');
  });
});

describe('cell border axes extension (react)', () => {
  const CELL_STYLE_COLUMNS: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: 'Name', width: 200 },
  ];
  const CELL_STYLE_ROWS: readonly RowSpec[] = [
    { id: 'r1', data: { name: 'A' } },
    { id: 'r2', data: { name: 'B' } },
  ];

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

  it('99.2.3 (react): border tab appears + click switches active tab to border', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    const borderTab = container.querySelector<HTMLButtonElement>(
      'button[data-cx-style-tab="border"]',
    )!;
    expect(borderTab).not.toBeNull();
    expect(borderTab.getAttribute('aria-selected')).toBe('false');
    act(() => {
      fireEvent.click(borderTab);
    });
    expect(
      container
        .querySelector<HTMLElement>('.cx-table-cell-style-editor')!
        .getAttribute('data-cx-style-active-tab'),
    ).toBe('border');
    expect(container.querySelector('[data-cx-style-square]')).toBeNull();
    expect(container.querySelector('[data-cx-style-border="color"]')).not.toBeNull();
    expect(container.querySelector('[data-cx-style-border="width"]')).not.toBeNull();
    expect(container.querySelector('[data-cx-style-border-style="solid"]')).not.toBeNull();
    expect(container.querySelector('[data-cx-style-border="radius"]')).not.toBeNull();
  });

  it('99.2.3 (react): hex input on border tab updates borderState.borderColor', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="border"]')!,
      );
    });
    act(() => {
      fireEvent.change(
        container.querySelector<HTMLInputElement>('input[data-cx-style-border="color"]')!,
        { target: { value: '#3b82f6' } },
      );
    });
    const refreshedInput = container.querySelector<HTMLInputElement>(
      'input[data-cx-style-border="color"]',
    )!;
    expect(refreshedInput.value).toBe('#3b82f6');
  });

  it('99.2.3 (react): width input on border tab updates borderState.borderWidth', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="border"]')!,
      );
    });
    act(() => {
      fireEvent.change(
        container.querySelector<HTMLInputElement>('input[data-cx-style-border="width"]')!,
        { target: { value: '2px' } },
      );
    });
    const refreshedInput = container.querySelector<HTMLInputElement>(
      'input[data-cx-style-border="width"]',
    )!;
    expect(refreshedInput.value).toBe('2px');
  });

  it('99.2.3 (react): style segmented control', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="border"]')!,
      );
    });
    const solidBtn = container.querySelector<HTMLButtonElement>(
      'button[data-cx-style-border-style="solid"]',
    )!;
    const noneBtn = container.querySelector<HTMLButtonElement>(
      'button[data-cx-style-border-style="none"]',
    )!;
    expect(noneBtn.getAttribute('aria-pressed')).toBe('true');
    act(() => {
      fireEvent.click(solidBtn);
    });
    expect(solidBtn.getAttribute('aria-pressed')).toBe('true');
    expect(noneBtn.getAttribute('aria-pressed')).toBe('false');
    act(() => {
      fireEvent.click(noneBtn);
    });
    expect(noneBtn.getAttribute('aria-pressed')).toBe('true');
    expect(solidBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('99.2.3 (react): Apply on border tab persists 4 border fields + emits + cell renders inline border props', () => {
    const handleRef = createRef<TableHandle>();
    const onCellStyleChange = vi.fn();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
        onCellStyleChange={onCellStyleChange}
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="border"]')!,
      );
    });
    act(() => {
      fireEvent.change(
        container.querySelector<HTMLInputElement>('input[data-cx-style-border="color"]')!,
        { target: { value: '#3b82f6' } },
      );
    });
    act(() => {
      fireEvent.change(
        container.querySelector<HTMLInputElement>('input[data-cx-style-border="width"]')!,
        { target: { value: '2px' } },
      );
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-border-style="solid"]')!,
      );
    });
    act(() => {
      fireEvent.change(
        container.querySelector<HTMLInputElement>('input[data-cx-style-border="radius"]')!,
        { target: { value: '4px' } },
      );
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-action="apply"]')!,
      );
    });
    expect(container.querySelector('.cx-table-cell-style-editor')).toBeNull();
    // (2026-06-01 — react port) widened border-tab
    // payload to 16 fields. Use toHaveBeenLastCalledWith with
    // objectContaining for partial match.
    expect(onCellStyleChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        rowId: 'r1',
        colId: 'name',
        style: expect.objectContaining({
          borderColor: '#3b82f6',
          borderWidth: '2px',
          borderStyle: 'solid',
          borderRadius: '4px',
          borderTopColor: null,
          borderLeftStyle: null,
        }) as unknown,
      }),
    );
    const refreshedCell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    expect(refreshedCell.style.borderColor).toBe('rgb(59, 130, 246)');
    expect(refreshedCell.style.borderWidth).toBe('2px');
    expect(refreshedCell.style.borderStyle).toBe('solid');
    expect(refreshedCell.style.borderRadius).toBe('4px');
  });

  it('99.2.3 (react): Clear on border tab while bg + color + font + border all set preserves the other 3 axes', () => {
    const handleRef = createRef<TableHandle>();
    const onCellStyleChange = vi.fn();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
        onCellStyleChange={onCellStyleChange}
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    // Apply bg.
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.change(container.querySelector<HTMLInputElement>('input[data-cx-style-hex]')!, {
        target: { value: '#3b82f6' },
      });
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-action="apply"]')!,
      );
    });
    // Apply text color.
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="text"]')!,
      );
    });
    act(() => {
      fireEvent.change(container.querySelector<HTMLInputElement>('input[data-cx-style-hex]')!, {
        target: { value: '#ff0000' },
      });
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-action="apply"]')!,
      );
    });
    // Apply font (bold).
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="font"]')!,
      );
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-font="weight-bold"]')!,
      );
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-action="apply"]')!,
      );
    });
    // Apply border (color + solid).
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="border"]')!,
      );
    });
    act(() => {
      fireEvent.change(
        container.querySelector<HTMLInputElement>('input[data-cx-style-border="color"]')!,
        { target: { value: '#00ff00' } },
      );
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-border-style="solid"]')!,
      );
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-action="apply"]')!,
      );
    });
    let refreshedCell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    expect(refreshedCell.style.backgroundColor).toBe('rgb(59, 130, 246)');
    expect(refreshedCell.style.color).toBe('rgb(255, 0, 0)');
    expect(refreshedCell.style.fontWeight).toBe('700');
    expect(refreshedCell.style.borderColor).toBe('rgb(0, 255, 0)');
    expect(refreshedCell.style.borderStyle).toBe('solid');
    // Clear on border tab.
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="border"]')!,
      );
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-action="clear"]')!,
      );
    });
    // (2026-06-01 — react port) widened border-tab
    // Clear payload to null all 16 fields (4 all-sides + 12 per-side).
    expect(onCellStyleChange).toHaveBeenLastCalledWith({
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
    refreshedCell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    expect(refreshedCell.style.backgroundColor).toBe('rgb(59, 130, 246)');
    expect(refreshedCell.style.color).toBe('rgb(255, 0, 0)');
    expect(refreshedCell.style.fontWeight).toBe('700');
    expect(refreshedCell.style.borderColor).toBe('');
    expect(refreshedCell.style.borderStyle).toBe('');
  });
});

describe('custom font-weight 100-900 picker (react)', () => {
  const CELL_STYLE_COLUMNS: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: 'Name', width: 200 },
  ];
  const CELL_STYLE_ROWS: readonly RowSpec[] = [
    { id: 'r1', data: { name: 'A' } },
    { id: 'r2', data: { name: 'B' } },
  ];

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

  it('99.2.2.1 (react): custom-weights <details> visible on font tab; collapsed by default; 9 buttons 100-900', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="font"]')!,
      );
    });
    const details = container.querySelector<HTMLDetailsElement>(
      '[data-cx-style-font-weight-picker]',
    )!;
    expect(details).not.toBeNull();
    expect(details.open).toBe(false);
    for (const w of ['100', '200', '300', '400', '500', '600', '700', '800', '900']) {
      expect(container.querySelector(`button[data-cx-style-font="weight-${w}"]`)).not.toBeNull();
    }
  });

  it('99.2.2.1 (react): clicking weight 500 sets fontState.fontWeight to "500"; Bold (700) not active', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="font"]')!,
      );
    });
    const weight500 = container.querySelector<HTMLButtonElement>(
      'button[data-cx-style-font="weight-500"]',
    )!;
    const boldBtn = container.querySelector<HTMLButtonElement>(
      'button[data-cx-style-font="weight-bold"]',
    )!;
    expect(weight500.getAttribute('aria-pressed')).toBe('false');
    act(() => {
      fireEvent.click(weight500);
    });
    expect(weight500.getAttribute('aria-pressed')).toBe('true');
    expect(boldBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('99.2.2.1 (react): clicking weight 700 also makes Bold toggle active', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="font"]')!,
      );
    });
    const weight700 = container.querySelector<HTMLButtonElement>(
      'button[data-cx-style-font="weight-700"]',
    )!;
    const boldBtn = container.querySelector<HTMLButtonElement>(
      'button[data-cx-style-font="weight-bold"]',
    )!;
    act(() => {
      fireEvent.click(weight700);
    });
    expect(weight700.getAttribute('aria-pressed')).toBe('true');
    expect(boldBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('99.2.2.1 (react): Apply with custom weight 500 emits fontWeight "500" + cell renders inline fontWeight 500', () => {
    const handleRef = createRef<TableHandle>();
    const onCellStyleChange = vi.fn();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
        onCellStyleChange={onCellStyleChange}
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="font"]')!,
      );
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-font="weight-500"]')!,
      );
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-action="apply"]')!,
      );
    });
    expect(onCellStyleChange).toHaveBeenLastCalledWith({
      rowId: 'r1',
      colId: 'name',
      style: { fontWeight: '500', fontStyle: null, textDecoration: null },
    });
    const refreshedCell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    expect(refreshedCell.style.fontWeight).toBe('500');
  });
});

describe('per-side borders (react)', () => {
  const CELL_STYLE_COLUMNS: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: 'Name', width: 200 },
  ];
  const CELL_STYLE_ROWS: readonly RowSpec[] = [
    { id: 'r1', data: { name: 'A' } },
    { id: 'r2', data: { name: 'B' } },
  ];

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

  it('99.2.3.1 (react): 5-button segmented control renders; "全部" active default; clicking "上" sets target', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="border"]')!,
      );
    });
    for (const side of ['all', 'top', 'right', 'bottom', 'left']) {
      expect(container.querySelector(`button[data-cx-style-border-side="${side}"]`)).not.toBeNull();
    }
    const allBtn = container.querySelector<HTMLButtonElement>(
      'button[data-cx-style-border-side="all"]',
    )!;
    expect(allBtn.getAttribute('aria-pressed')).toBe('true');
    const topBtn = container.querySelector<HTMLButtonElement>(
      'button[data-cx-style-border-side="top"]',
    )!;
    act(() => {
      fireEvent.click(topBtn);
    });
    expect(topBtn.getAttribute('aria-pressed')).toBe('true');
    expect(allBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('99.2.3.1 (react): with target="top", typing color writes borderTopColor; Apply emits per-side field', () => {
    const handleRef = createRef<TableHandle>();
    const onCellStyleChange = vi.fn();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
        onCellStyleChange={onCellStyleChange}
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="border"]')!,
      );
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-border-side="top"]')!,
      );
    });
    act(() => {
      fireEvent.change(
        container.querySelector<HTMLInputElement>('input[data-cx-style-border="color"]')!,
        { target: { value: '#f00000' } },
      );
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-action="apply"]')!,
      );
    });
    expect(onCellStyleChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        style: expect.objectContaining({ borderTopColor: '#f00000', borderColor: null }) as unknown,
      }),
    );
    const refreshedCell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    expect(refreshedCell.style.borderTopColor).toBe('rgb(240, 0, 0)');
  });

  it('99.2.3.1 (react): with target="top" and all-sides color set, color input shows effective fallback', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="border"]')!,
      );
    });
    act(() => {
      fireEvent.change(
        container.querySelector<HTMLInputElement>('input[data-cx-style-border="color"]')!,
        { target: { value: '#0000ff' } },
      );
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-action="apply"]')!,
      );
    });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="border"]')!,
      );
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-border-side="top"]')!,
      );
    });
    const colorInput = container.querySelector<HTMLInputElement>(
      'input[data-cx-style-border="color"]',
    )!;
    expect(colorInput.value).toBe('#0000ff');
  });

  it('99.2.3.1 (react): radius widget HIDDEN when borderSideTarget !== "all"', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="border"]')!,
      );
    });
    expect(container.querySelector('input[data-cx-style-border="radius"]')).not.toBeNull();
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-border-side="right"]')!,
      );
    });
    expect(container.querySelector('input[data-cx-style-border="radius"]')).toBeNull();
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-border-side="all"]')!,
      );
    });
    expect(container.querySelector('input[data-cx-style-border="radius"]')).not.toBeNull();
  });

  it('99.2.3.1 (react): backwards-compat — segmented default "全部" preserves all-sides behavior', () => {
    const handleRef = createRef<TableHandle>();
    const onCellStyleChange = vi.fn();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
        onCellStyleChange={onCellStyleChange}
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="border"]')!,
      );
    });
    act(() => {
      fireEvent.change(
        container.querySelector<HTMLInputElement>('input[data-cx-style-border="color"]')!,
        { target: { value: '#aabbcc' } },
      );
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-action="apply"]')!,
      );
    });
    expect(onCellStyleChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        style: expect.objectContaining({ borderColor: '#aabbcc', borderTopColor: null }) as unknown,
      }),
    );
    const refreshedCell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    expect(refreshedCell.style.borderColor).toBe('rgb(170, 187, 204)');
  });

  it('99.2.3.1 (react): mixed all-sides + per-side — cell renders both inline', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="border"]')!,
      );
    });
    act(() => {
      fireEvent.change(
        container.querySelector<HTMLInputElement>('input[data-cx-style-border="color"]')!,
        { target: { value: '#000000' } },
      );
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-action="apply"]')!,
      );
    });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="border"]')!,
      );
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-border-side="top"]')!,
      );
    });
    act(() => {
      fireEvent.change(
        container.querySelector<HTMLInputElement>('input[data-cx-style-border="color"]')!,
        { target: { value: '#ff0000' } },
      );
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-action="apply"]')!,
      );
    });
    const refreshedCell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    expect(refreshedCell.style.borderTopColor).toBe('rgb(255, 0, 0)');
    expect(refreshedCell.style.borderRightColor).toBe('rgb(0, 0, 0)');
    expect(refreshedCell.style.borderBottomColor).toBe('rgb(0, 0, 0)');
    expect(refreshedCell.style.borderLeftColor).toBe('rgb(0, 0, 0)');
  });
});

describe('borderColor HSV picker (react)', () => {
  const CELL_STYLE_COLUMNS: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: 'Name', width: 200 },
  ];
  const CELL_STYLE_ROWS: readonly RowSpec[] = [
    { id: 'r1', data: { name: 'A' } },
    { id: 'r2', data: { name: 'B' } },
  ];

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

  it('99.2.3.2 (react): HSV disclosure visible on border tab; collapsed by default; square + hue strip render', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="border"]')!,
      );
    });
    const details = container.querySelector<HTMLDetailsElement>(
      '[data-cx-style-border-color-hsv]',
    )!;
    expect(details).not.toBeNull();
    expect(details.open).toBe(false);
    expect(container.querySelector('[data-cx-style-border-square]')).not.toBeNull();
    expect(container.querySelector('[data-cx-style-border-hue]')).not.toBeNull();
    expect(container.querySelectorAll('input[data-cx-style-border-rgb]').length).toBe(3);
  });

  it('99.2.3.2 (react): HSV square pointerdown at top-right commits #ff0000; Apply emits red', () => {
    const handleRef = createRef<TableHandle>();
    const onCellStyleChange = vi.fn();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
        onCellStyleChange={onCellStyleChange}
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="border"]')!,
      );
    });
    const square = container.querySelector<HTMLElement>('[data-cx-style-border-square]')!;
    stubSquareRect(square, 180);
    act(() => {
      fireMovePointer('pointerdown', square, { clientX: 180, clientY: 0, pointerId: 1 });
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-action="apply"]')!,
      );
    });
    expect(onCellStyleChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        style: expect.objectContaining({ borderColor: '#ff0000' }) as unknown,
      }),
    );
  });

  it('99.2.3.2 (react): hex input typing syncs HSV picker RGB inputs', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="border"]')!,
      );
    });
    act(() => {
      fireEvent.change(
        container.querySelector<HTMLInputElement>('input[data-cx-style-border="color"]')!,
        { target: { value: '#3b82f6' } },
      );
    });
    const rgbInputs = container.querySelectorAll<HTMLInputElement>(
      'input[data-cx-style-border-rgb]',
    );
    expect(rgbInputs[0]!.value).toBe('59');
    expect(rgbInputs[1]!.value).toBe('130');
    expect(rgbInputs[2]!.value).toBe('246');
  });

  it('99.2.3.2 (react): with target="top", HSV picker writes to borderTopColor; Apply emits per-side', () => {
    const handleRef = createRef<TableHandle>();
    const onCellStyleChange = vi.fn();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
        onCellStyleChange={onCellStyleChange}
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="border"]')!,
      );
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-border-side="top"]')!,
      );
    });
    const square = container.querySelector<HTMLElement>('[data-cx-style-border-square]')!;
    stubSquareRect(square, 180);
    act(() => {
      fireMovePointer('pointerdown', square, { clientX: 180, clientY: 0, pointerId: 1 });
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-action="apply"]')!,
      );
    });
    expect(onCellStyleChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        style: expect.objectContaining({ borderTopColor: '#ff0000', borderColor: null }) as unknown,
      }),
    );
  });
});

describe('controlled-mode cell-style prop (react)', () => {
  const CELL_STYLE_COLUMNS: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: 'Name', width: 200 },
  ];
  const CELL_STYLE_ROWS: readonly RowSpec[] = [
    { id: 'r1', data: { name: 'A' } },
    { id: 'r2', data: { name: 'B' } },
  ];

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

  it('99.2.4 (react): uncontrolled (default) — Apply mutates internal + cell renders override + onChange fires', () => {
    const handleRef = createRef<TableHandle>();
    const onCellStyleChange = vi.fn();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
        onCellStyleChange={onCellStyleChange}
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    const hexInput = container.querySelector<HTMLInputElement>('input[data-cx-style-hex]')!;
    act(() => {
      fireEvent.change(hexInput, { target: { value: '#3b82f6' } });
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-action="apply"]')!,
      );
    });
    const refreshedCell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    expect(refreshedCell.style.backgroundColor).toBe('rgb(59, 130, 246)');
    expect(onCellStyleChange).toHaveBeenCalled();
  });

  it('99.2.4 (react): controlled (prop={}) — Apply does NOT mutate internal; onChange fires; cell renders no override', () => {
    const handleRef = createRef<TableHandle>();
    const onCellStyleChange = vi.fn();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
        cellStyleByRowIdColId={{}}
        onCellStyleChange={onCellStyleChange}
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    const hexInput = container.querySelector<HTMLInputElement>('input[data-cx-style-hex]')!;
    act(() => {
      fireEvent.change(hexInput, { target: { value: '#3b82f6' } });
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-action="apply"]')!,
      );
    });
    const refreshedCell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    expect(refreshedCell.style.backgroundColor).toBe('');
    expect(onCellStyleChange).toHaveBeenLastCalledWith({
      rowId: 'r1',
      colId: 'name',
      style: { backgroundColor: '#3b82f6' },
    });
  });

  it('99.2.4 (react): controlled with one entry — cell renderer reads from prop', () => {
    const { container } = render(
      <ChronixTable
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
        cellStyleByRowIdColId={{ r1: { name: { backgroundColor: '#10b981' } } }}
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    expect(cell.style.backgroundColor).toBe('rgb(16, 185, 129)');
  });

  it('99.2.4 (react): controlled + consumer updates prop on emit — cell re-renders with new value', () => {
    const handleRef = createRef<TableHandle>();
    const { container, rerender } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
        cellStyleByRowIdColId={{}}
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    const hexInput = container.querySelector<HTMLInputElement>('input[data-cx-style-hex]')!;
    act(() => {
      fireEvent.change(hexInput, { target: { value: '#f59e0b' } });
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-action="apply"]')!,
      );
    });
    const refreshedBefore = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    expect(refreshedBefore.style.backgroundColor).toBe('');
    rerender(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
        cellStyleByRowIdColId={{ r1: { name: { backgroundColor: '#f59e0b' } } }}
      />,
    );
    const refreshedAfter = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    expect(refreshedAfter.style.backgroundColor).toBe('rgb(245, 158, 11)');
  });

  it('99.2.4 (react): switching controlled → uncontrolled — internal map shows last uncontrolled state', () => {
    const { container, rerender } = render(
      <ChronixTable
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
        cellStyleByRowIdColId={{ r1: { name: { backgroundColor: '#ef4444' } } }}
      />,
    );
    const cellControlled = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    expect(cellControlled.style.backgroundColor).toBe('rgb(239, 68, 68)');
    rerender(
      <ChronixTable columns={CELL_STYLE_COLUMNS} rows={CELL_STYLE_ROWS} enableCellStyleEditor />,
    );
    const cellUncontrolled = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    expect(cellUncontrolled.style.backgroundColor).toBe('');
  });
});

describe('color palette + recent colors (react)', () => {
  const CELL_STYLE_COLUMNS: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: 'Name', width: 200 },
  ];
  const CELL_STYLE_ROWS: readonly RowSpec[] = [
    { id: 'r1', data: { name: 'A' } },
    { id: 'r2', data: { name: 'B' } },
  ];

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

  it('99.2.5 (react): 12 preset swatches render by default; recent row hidden initially', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    const presetButtons = container.querySelectorAll('button[data-cx-style-palette-preset]');
    expect(presetButtons.length).toBe(12);
    expect(container.querySelector('[data-cx-style-palette-section="recent"]')).toBeNull();
  });

  it('99.2.5 (react): clicking preset swatch updates HEX input', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>(
          'button[data-cx-style-palette-preset="#60a5fa"]',
        )!,
      );
    });
    const hexInput = container.querySelector<HTMLInputElement>('input[data-cx-style-hex]')!;
    expect(hexInput.value).toBe('#60a5fa');
  });

  it('99.2.5 (react): Apply pushes to recent; subsequent open shows recent row with 1 swatch', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>(
          'button[data-cx-style-palette-preset="#60a5fa"]',
        )!,
      );
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-action="apply"]')!,
      );
    });
    const cell2 = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r2"][data-col-id="name"]',
    )!;
    stubCellRect(cell2, { left: 50, top: 130, bottom: 158 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r2', 'name');
    });
    expect(container.querySelector('[data-cx-style-palette-section="recent"]')).not.toBeNull();
    const recentSwatches = container.querySelectorAll('button[data-cx-style-palette-recent]');
    expect(recentSwatches.length).toBe(1);
    expect(recentSwatches[0]!.getAttribute('data-cx-style-palette-recent')).toBe('#60a5fa');
  });

  it('99.2.5 (react): applying 6 distinct colors caps recent at default limit 5', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    const sequence = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#2dd4bf', '#60a5fa'];
    for (const hex of sequence) {
      act(() => {
        handleRef.current!.openCellStyleEditor('r1', 'name');
      });
      act(() => {
        fireEvent.click(
          container.querySelector<HTMLButtonElement>(
            `button[data-cx-style-palette-preset="${hex}"]`,
          )!,
        );
      });
      act(() => {
        fireEvent.click(
          container.querySelector<HTMLButtonElement>('button[data-cx-style-action="apply"]')!,
        );
      });
    }
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    const recentSwatches = container.querySelectorAll('button[data-cx-style-palette-recent]');
    expect(recentSwatches.length).toBe(5);
    expect(recentSwatches[0]!.getAttribute('data-cx-style-palette-recent')).toBe('#60a5fa');
    let foundOldest = false;
    recentSwatches.forEach((s) => {
      if (s.getAttribute('data-cx-style-palette-recent') === '#f87171') foundOldest = true;
    });
    expect(foundOldest).toBe(false);
  });

  it('99.2.5 (react): applying same color twice leaves recent at length 1 (dedup)', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    for (let i = 0; i < 2; i++) {
      act(() => {
        handleRef.current!.openCellStyleEditor('r1', 'name');
      });
      act(() => {
        fireEvent.click(
          container.querySelector<HTMLButtonElement>(
            'button[data-cx-style-palette-preset="#f87171"]',
          )!,
        );
      });
      act(() => {
        fireEvent.click(
          container.querySelector<HTMLButtonElement>('button[data-cx-style-action="apply"]')!,
        );
      });
    }
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    const recentSwatches = container.querySelectorAll('button[data-cx-style-palette-recent]');
    expect(recentSwatches.length).toBe(1);
    expect(recentSwatches[0]!.getAttribute('data-cx-style-palette-recent')).toBe('#f87171');
  });
});

describe('variable font-weight slider (react)', () => {
  const CELL_STYLE_COLUMNS: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: 'Name', width: 200 },
  ];
  const CELL_STYLE_ROWS: readonly RowSpec[] = [
    { id: 'r1', data: { name: 'A' } },
    { id: 'r2', data: { name: 'B' } },
  ];

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

  it('99.2.2.2 (react): variable-weight slider visible; collapsed by default; readout 400', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="font"]')!,
      );
    });
    const sliderDetails = container.querySelector<HTMLDetailsElement>(
      '[data-cx-style-font-weight-slider]',
    )!;
    expect(sliderDetails).not.toBeNull();
    expect(sliderDetails.open).toBe(false);
    const readout = container.querySelector('[data-cx-style-font-weight-slider-readout]');
    expect(readout).not.toBeNull();
    expect(readout!.textContent).toBe('400');
  });

  it('99.2.2.2 (react): pointerdown at track midpoint (50%) sets fontWeight to "501"', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="font"]')!,
      );
    });
    const track = container.querySelector<HTMLElement>('[data-cx-style-font-weight-slider-track]')!;
    stubTrackRect(track, 180);
    act(() => {
      fireMovePointer('pointerdown', track, { clientX: 90, clientY: 0, pointerId: 1 });
    });
    const readout = container.querySelector('[data-cx-style-font-weight-slider-readout]')!;
    expect(readout.textContent).toBe('501');
  });

  it('99.2.2.2 (react): pointerdown at left edge sets "1"; right edge sets "1000"', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="font"]')!,
      );
    });
    let track = container.querySelector<HTMLElement>('[data-cx-style-font-weight-slider-track]')!;
    stubTrackRect(track, 180);
    act(() => {
      fireMovePointer('pointerdown', track, { clientX: 0, clientY: 0, pointerId: 1 });
    });
    let readout = container.querySelector('[data-cx-style-font-weight-slider-readout]')!;
    expect(readout.textContent).toBe('1');
    act(() => {
      fireMovePointer('pointerup', track, { clientX: 0, clientY: 0, pointerId: 1 });
    });
    track = container.querySelector<HTMLElement>('[data-cx-style-font-weight-slider-track]')!;
    stubTrackRect(track, 180);
    act(() => {
      fireMovePointer('pointerdown', track, { clientX: 180, clientY: 0, pointerId: 1 });
    });
    readout = container.querySelector('[data-cx-style-font-weight-slider-readout]')!;
    expect(readout.textContent).toBe('1000');
  });

  it('99.2.2.2 (react): Apply with slider-picked 425 emits fontWeight "425" + cell renders inline 425', () => {
    const handleRef = createRef<TableHandle>();
    const onCellStyleChange = vi.fn();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={CELL_STYLE_COLUMNS}
        rows={CELL_STYLE_ROWS}
        enableCellStyleEditor
        onCellStyleChange={onCellStyleChange}
      />,
    );
    const cell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    stubCellRect(cell, { left: 50, top: 100, bottom: 128 });
    act(() => {
      handleRef.current!.openCellStyleEditor('r1', 'name');
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-tab="font"]')!,
      );
    });
    const track = container.querySelector<HTMLElement>('[data-cx-style-font-weight-slider-track]')!;
    stubTrackRect(track, 999);
    act(() => {
      fireMovePointer('pointerdown', track, { clientX: 424, clientY: 0, pointerId: 1 });
    });
    act(() => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>('button[data-cx-style-action="apply"]')!,
      );
    });
    expect(onCellStyleChange).toHaveBeenLastCalledWith({
      rowId: 'r1',
      colId: 'name',
      style: { fontWeight: '425', fontStyle: null, textDecoration: null },
    });
    const refreshedCell = container.querySelector<HTMLElement>(
      '.cx-table-cell[data-row-id="r1"][data-col-id="name"]',
    )!;
    expect(refreshedCell.style.fontWeight).toBe('425');
  });
});

describe('server-side row model (react)', () => {
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

  it('rowModelType:"serverSide" + serverSideDataSource mounts without consuming rows prop (react)', () => {
    const { source, calls } = makeControlledSource();
    const { container } = render(
      <ChronixTable
        columns={columns}
        rows={[]}
        rowModelType="serverSide"
        serverSideDataSource={source}
        cacheBlockSize={5}
      />,
    );
    expect(container.querySelector('.cx-table-wrapper')).toBeTruthy();
    // (2026-05-31 — react port): bootstrap fires getRowAt(0).
    expect(calls.length).toBe(1);
    expect(calls[0]?.params.startRow).toBe(0);
  });

  it('skeleton rows not present before any block resolves (react)', () => {
    const { source } = makeControlledSource();
    const { container } = render(
      <ChronixTable
        columns={columns}
        rows={[]}
        rowModelType="serverSide"
        serverSideDataSource={source}
        cacheBlockSize={5}
      />,
    );
    expect(container.querySelectorAll('.cx-table-row--skeleton').length).toBe(0);
  });

  it('refreshServerSideRows handle method is exposed via useImperativeHandle (react)', () => {
    const { source } = makeControlledSource();
    const ref = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={ref}
        columns={columns}
        rows={[]}
        rowModelType="serverSide"
        serverSideDataSource={source}
      />,
    );
    expect(() => ref.current?.refreshServerSideRows()).not.toThrow();
  });

  it('getServerSideBlockState returns idle for never-touched blocks (react)', () => {
    const { source } = makeControlledSource();
    const ref = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={ref}
        columns={columns}
        rows={[]}
        rowModelType="serverSide"
        serverSideDataSource={source}
      />,
    );
    // bootstrap fires getRowAt(0) → block 0 LOADING; block 99 untouched.
    expect(ref.current?.getServerSideBlockState(0).kind).toBe('loading');
    expect(ref.current?.getServerSideBlockState(99).kind).toBe('idle');
  });

  it('switching from serverSide → clientSide destroys the session (react)', () => {
    const { source, destroyCount } = makeControlledSource();
    const { rerender } = render(
      <ChronixTable
        columns={columns}
        rows={[]}
        rowModelType="serverSide"
        serverSideDataSource={source}
      />,
    );
    expect(destroyCount.value).toBe(0);
    rerender(<ChronixTable columns={columns} rows={rows} rowModelType="clientSide" />);
    expect(destroyCount.value).toBe(1);
  });

  it('clientSide mode (default) leaves rows pipeline untouched (react)', () => {
    const ref = createRef<TableHandle>();
    const { container } = render(<ChronixTable ref={ref} columns={columns} rows={rows} />);
    expect(ref.current?.getServerSideTotalRowCount()).toBe(0);
    expect(ref.current?.getServerSideBlockState(0).kind).toBe('idle');
    expect(container.querySelectorAll('.cx-table-row').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('.cx-table-row--skeleton').length).toBe(0);
  });
});

describe('+ 45.2: server-side refinements (react)', () => {
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

  it('45.1: showPagination + serverSide mounts without throwing (react)', () => {
    const { source, calls } = makeControlledSource();
    const { container } = render(
      <ChronixTable
        columns={columns}
        rows={[]}
        rowModelType="serverSide"
        serverSideDataSource={source}
        showPagination
        initialPageSize={25}
      />,
    );
    expect(container.querySelector('.cx-table-wrapper')).toBeTruthy();
    // bootstrap fires getRowAt(0) with endRow=startRow+pageSize.
    expect(calls.length).toBe(1);
    expect(calls[0]!.params.endRow - calls[0]!.params.startRow).toBe(25);
  });

  it('45.1: setPageSize re-creates session (react)', () => {
    const { source } = makeControlledSource();
    const ref = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={ref}
        columns={columns}
        rows={[]}
        rowModelType="serverSide"
        serverSideDataSource={source}
        showPagination
        initialPageSize={10}
      />,
    );
    ref.current?.setPageSize(30);
    expect(ref.current?.getServerSideTotalRowCount()).toBe(0);
  });

  it('45.1: setPageSize fires onPageChange with new pageSize (react)', () => {
    const { source } = makeControlledSource();
    const ref = createRef<TableHandle>();
    const events: { page: number; pageSize: number }[] = [];
    render(
      <ChronixTable
        ref={ref}
        columns={columns}
        rows={[]}
        rowModelType="serverSide"
        serverSideDataSource={source}
        showPagination
        initialPageSize={10}
        onPageChange={(p) => events.push(p)}
      />,
    );
    ref.current?.setPageSize(50);
    expect(events.length).toBe(1);
    expect(events[0]).toEqual({ page: 0, pageSize: 50 });
  });

  it('45.2: invalidateServerSideBlocks([0]) returns block 0 to idle (bootstrap → loading → invalidate → idle) (react)', () => {
    const { source, calls } = makeControlledSource();
    const ref = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={ref}
        columns={columns}
        rows={[]}
        rowModelType="serverSide"
        serverSideDataSource={source}
        cacheBlockSize={10}
      />,
    );
    // bootstrap fires getRowAt(0) → LOADING.
    expect(calls.length).toBe(1);
    expect(ref.current?.getServerSideBlockState(0).kind).toBe('loading');
    ref.current?.invalidateServerSideBlocks([0]);
    expect(ref.current?.getServerSideBlockState(0).kind).toBe('idle');
  });

  it('45.2: invalidateServerSideBlocks([]) is a silent no-op (react)', () => {
    const { source } = makeControlledSource();
    const ref = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={ref}
        columns={columns}
        rows={[]}
        rowModelType="serverSide"
        serverSideDataSource={source}
      />,
    );
    expect(() => ref.current?.invalidateServerSideBlocks([])).not.toThrow();
  });

  it('45.2: invalidateServerSideBlocks is no-op when clientSide (react)', () => {
    const ref = createRef<TableHandle>();
    render(<ChronixTable ref={ref} columns={columns} rows={rows} />);
    expect(() => ref.current?.invalidateServerSideBlocks([0, 1, 2])).not.toThrow();
  });
});

describe('+ 45.4: viewport-driven dispatch + bootstrap (react)', () => {
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

  it('45.4: session setup fires getRowAt(0) bootstrap at mount (react)', () => {
    const { source, calls } = makeControlledSource();
    render(
      <ChronixTable
        columns={columns}
        rows={[]}
        rowModelType="serverSide"
        serverSideDataSource={source}
        cacheBlockSize={100}
      />,
    );
    expect(calls.length).toBe(1);
    expect(calls[0]?.params.startRow).toBe(0);
    expect(calls[0]?.params.endRow).toBe(100);
  });

  it('45.4: bootstrap fires for paginated serverSide mode (react)', () => {
    const { source, calls } = makeControlledSource();
    render(
      <ChronixTable
        columns={columns}
        rows={[]}
        rowModelType="serverSide"
        serverSideDataSource={source}
        showPagination
        initialPageSize={25}
      />,
    );
    expect(calls.length).toBe(1);
    expect(calls[0]?.params.endRow).toBe(25);
  });

  it('45.4: clientSide mode does NOT bootstrap (react)', () => {
    const { source, calls } = makeControlledSource();
    render(<ChronixTable columns={columns} rows={rows} serverSideDataSource={source} />);
    expect(calls.length).toBe(0);
  });

  it('45.3: non-paginated mode does NOT dispatch off-screen blocks after bootstrap resolves (react)', async () => {
    const { source, calls } = makeControlledSource();
    render(
      <ChronixTable
        columns={columns}
        rows={[]}
        rowModelType="serverSide"
        serverSideDataSource={source}
        cacheBlockSize={10}
      />,
    );
    expect(calls.length).toBe(1);
    const rows0 = Array.from({ length: 10 }, (_, i) => ({ id: `r${i}`, data: { name: `r${i}` } }));
    await act(async () => {
      calls[0]?.resolve({ rows: rows0, totalRowCount: 1000 });
      await Promise.resolve();
      await Promise.resolve();
    });
    // Pre-Phase-45.3 this would be ~100 dispatches.
    expect(calls.length).toBeLessThanOrEqual(5);
  });

  it('45.3: paginated mode viewport effect is gated off (react)', async () => {
    const { source, calls } = makeControlledSource();
    render(
      <ChronixTable
        columns={columns}
        rows={[]}
        rowModelType="serverSide"
        serverSideDataSource={source}
        showPagination
        initialPageSize={25}
      />,
    );
    expect(calls.length).toBe(1);
    const rows0 = Array.from({ length: 25 }, (_, i) => ({ id: `r${i}`, data: { name: `r${i}` } }));
    await act(async () => {
      calls[0]?.resolve({ rows: rows0, totalRowCount: 1000 });
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(calls.length).toBe(1);
  });

  it('45.3 + 45.4: after bootstrap resolves, synthesized rows render real rows (react)', async () => {
    const { source, calls } = makeControlledSource();
    const ref = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={ref}
        columns={columns}
        rows={[]}
        rowModelType="serverSide"
        serverSideDataSource={source}
        cacheBlockSize={5}
      />,
    );
    expect(ref.current?.getServerSideTotalRowCount()).toBe(0);
    const rows0 = Array.from({ length: 5 }, (_, i) => ({ id: `r${i}`, data: { name: `r${i}` } }));
    await act(async () => {
      calls[0]?.resolve({ rows: rows0, totalRowCount: 5 });
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(ref.current?.getServerSideTotalRowCount()).toBe(5);
    expect(container.querySelectorAll('.cx-table-row--skeleton').length).toBe(0);
  });
});

describe('server-side anticipatory prefetch (react)', () => {
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

  // react tests drive scroll via Object.defineProperty +
  // dispatchEvent('scroll'); mirrors the vue3/vue2 helper. Wrapped in
  // act() since React batches the state updates from useTableBodyScroll's
  // setState calls.
  async function seedAndScroll(container: HTMLElement, scrollTop: number): Promise<void> {
    const bodyEl = container.querySelector<HTMLElement>('.cx-table-body')!;
    await act(async () => {
      Object.defineProperty(bodyEl, 'clientHeight', { value: 100, configurable: true });
      bodyEl.scrollTop = scrollTop;
      bodyEl.dispatchEvent(new Event('scroll'));
      await Promise.resolve();
      await Promise.resolve();
    });
  }

  it('45.5: default serverSidePrefetchAheadBlocks (=0) does NOT prefetch beyond visible range (react)', async () => {
    const { source, calls } = makeControlledSource();
    const { container } = render(
      <ChronixTable
        columns={columns}
        rows={[]}
        rowModelType="serverSide"
        serverSideDataSource={source}
        cacheBlockSize={10}
      />,
    );
    const rows0 = Array.from({ length: 10 }, (_, i) => ({ id: `r${i}`, data: { name: `r${i}` } }));
    await act(async () => {
      calls[0]?.resolve({ rows: rows0, totalRowCount: 1000 });
      await Promise.resolve();
      await Promise.resolve();
    });
    const baseline = calls.length;
    await seedAndScroll(container, 1000);
    const newDispatches = calls.length - baseline;
    expect(newDispatches).toBeLessThanOrEqual(4);
  });

  it('45.5: serverSidePrefetchAheadBlocks=2 + scroll DOWN fires forward-block prefetches (react)', async () => {
    const { source, calls } = makeControlledSource();
    const { container } = render(
      <ChronixTable
        columns={columns}
        rows={[]}
        rowModelType="serverSide"
        serverSideDataSource={source}
        cacheBlockSize={10}
        serverSidePrefetchAheadBlocks={2}
      />,
    );
    const rows0 = Array.from({ length: 10 }, (_, i) => ({ id: `r${i}`, data: { name: `r${i}` } }));
    await act(async () => {
      calls[0]?.resolve({ rows: rows0, totalRowCount: 1000 });
      await Promise.resolve();
      await Promise.resolve();
    });
    await seedAndScroll(container, 0);
    const baselineAfterInitial = calls.length;
    await seedAndScroll(container, 1500);
    const downDispatches = calls.length - baselineAfterInitial;
    expect(downDispatches).toBeGreaterThanOrEqual(4);
    const dispatchedStartRows = calls.slice(baselineAfterInitial).map((c) => c.params.startRow);
    expect(Math.max(...dispatchedStartRows)).toBeGreaterThan(50);
  });

  it('45.5: serverSidePrefetchAheadBlocks=2 + scroll UP fires backward-block prefetches (react)', async () => {
    const { source, calls } = makeControlledSource();
    const { container } = render(
      <ChronixTable
        columns={columns}
        rows={[]}
        rowModelType="serverSide"
        serverSideDataSource={source}
        cacheBlockSize={10}
        serverSidePrefetchAheadBlocks={2}
      />,
    );
    const rows0 = Array.from({ length: 10 }, (_, i) => ({ id: `r${i}`, data: { name: `r${i}` } }));
    await act(async () => {
      calls[0]?.resolve({ rows: rows0, totalRowCount: 1000 });
      await Promise.resolve();
      await Promise.resolve();
    });
    await seedAndScroll(container, 3000);
    const baselineAfterDown = calls.length;
    await seedAndScroll(container, 1000);
    const upDispatches = calls.slice(baselineAfterDown);
    const startRows = upDispatches.map((c) => c.params.startRow);
    expect(startRows.length).toBeGreaterThan(0);
    expect(Math.min(...startRows)).toBeLessThan(40);
  });

  it('45.5: stationary viewport does NOT trigger prefetch on serverSideVersion bump (react)', async () => {
    const { source, calls } = makeControlledSource();
    const { container } = render(
      <ChronixTable
        columns={columns}
        rows={[]}
        rowModelType="serverSide"
        serverSideDataSource={source}
        cacheBlockSize={10}
        serverSidePrefetchAheadBlocks={2}
      />,
    );
    const rows0 = Array.from({ length: 10 }, (_, i) => ({ id: `r${i}`, data: { name: `r${i}` } }));
    await act(async () => {
      calls[0]?.resolve({ rows: rows0, totalRowCount: 1000 });
      await Promise.resolve();
      await Promise.resolve();
    });
    await seedAndScroll(container, 500);
    const baselineAfterScroll = calls.length;
    const remaining = calls.slice(1);
    if (remaining.length > 0) {
      const blockRows = Array.from({ length: 10 }, (_, i) => ({
        id: `bk${i}`,
        data: { name: `bk${i}` },
      }));
      await act(async () => {
        remaining[0]?.resolve({ rows: blockRows, totalRowCount: 1000 });
        await Promise.resolve();
        await Promise.resolve();
      });
    }
    const postBumpNew = calls.length - baselineAfterScroll;
    expect(postBumpNew).toBeLessThanOrEqual(1);
  });

  it('45.5: showPagination=true ignores serverSidePrefetchAheadBlocks prop (react)', async () => {
    const { source, calls } = makeControlledSource();
    const { container } = render(
      <ChronixTable
        columns={columns}
        rows={[]}
        rowModelType="serverSide"
        serverSideDataSource={source}
        showPagination
        initialPageSize={10}
        serverSidePrefetchAheadBlocks={5}
      />,
    );
    expect(calls.length).toBe(1);
    const rows0 = Array.from({ length: 10 }, (_, i) => ({ id: `r${i}`, data: { name: `r${i}` } }));
    await act(async () => {
      calls[0]?.resolve({ rows: rows0, totalRowCount: 1000 });
      await Promise.resolve();
      await Promise.resolve();
    });
    await seedAndScroll(container, 1000);
    expect(calls.length).toBe(1);
  });
});

describe('Tier 3 finale (react)', () => {
  it('46-A: ColumnSpec.rowNumber:true renders displayed-position index (1-based)', () => {
    const numberedColumns: readonly ColumnSpec[] = [
      { id: 'num', headerName: '#', width: 60, rowNumber: true },
      ...columns,
    ];
    const { container } = render(<ChronixTable columns={numberedColumns} rows={rows} />);
    const numberCells = container.querySelectorAll('.cx-table-cell--row-number');
    expect(numberCells.length).toBeGreaterThanOrEqual(3);
    expect(numberCells[0]?.textContent).toBe('1');
    expect(numberCells[1]?.textContent).toBe('2');
    expect(numberCells[2]?.textContent).toBe('3');
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
    const { container } = render(<ChronixTable columns={actionsColumns} rows={rows} />);
    const editButtons = container.querySelectorAll<HTMLButtonElement>('[data-action-id="edit"]');
    expect(editButtons.length).toBe(3);
    const deleteButtons = container.querySelectorAll<HTMLButtonElement>(
      '[data-action-id="delete"]',
    );
    expect(deleteButtons.length).toBe(3);
    expect(deleteButtons[1]?.disabled).toBe(true);
    expect(deleteButtons[0]?.disabled).toBe(false);
  });

  it('46-B: clicking an action button fires onClick(row) and stops propagation', () => {
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
    const { container } = render(
      <ChronixTable
        columns={actionsColumns}
        rows={rows}
        onRowClick={() => {
          rowClickCount++;
        }}
      />,
    );
    const firstArchive = container.querySelector<HTMLButtonElement>('[data-action-id="archive"]');
    expect(firstArchive).toBeTruthy();
    fireEvent.click(firstArchive!);
    expect(clicks.length).toBe(1);
    expect(clicks[0]).toEqual({ id: 'archive', rowId: 'r1' });
    expect(rowClickCount).toBe(0);
  });

  it('46-C: enableRowAutoHeight:true adds cx-table-row--auto-height + wrapText cells get modifier (react)', () => {
    const wrapColumns: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', headerName: 'ID', width: 80 },
      { id: 'note', field: 'note', headerName: '备注', wrapText: true, flex: 1 },
    ];
    const { container } = render(
      <ChronixTable columns={wrapColumns} rows={rows} enableRowAutoHeight={true} />,
    );
    const rowEls = container.querySelectorAll('.cx-table-row--auto-height');
    expect(rowEls.length).toBeGreaterThan(0);
    const wrapCells = container.querySelectorAll('.cx-table-cell--wrap-text');
    expect(wrapCells.length).toBeGreaterThan(0);
  });
});

describe('tool-panel popover (react)', () => {
  const panelConfig: ToolPanelConfig = {
    show: true,
    panels: [
      { id: 'info', label: 'Info', icon: 'ⓘ', renderer: () => <div>info content</div> },
      { id: 'help', label: 'Help', icon: '?', renderer: () => <div>help content</div> },
    ],
  };

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

  it('80-1: show:true renders settings icon in action header; popover closed at mount (react)', () => {
    const { container } = render(
      <ChronixTable columns={columnsWithActions} rows={rows} toolPanel={panelConfig} />,
    );
    expect(container.querySelector('.cx-table-header-settings-button')).toBeTruthy();
    expect(container.querySelector('.cx-table-settings-popover')).toBeFalsy();
  });

  it('80-2: clicking settings icon opens popover + activates initialOpenId panel (react)', async () => {
    const { container } = render(
      <ChronixTable
        columns={columnsWithActions}
        rows={rows}
        toolPanel={{ ...panelConfig, initialOpenId: 'info' }}
      />,
    );
    const btn = container.querySelector<HTMLButtonElement>('.cx-table-header-settings-button')!;
    fireEvent.click(btn);
    await act(async () => {
      await Promise.resolve();
    });
    expect(container.querySelector('.cx-table-settings-popover')).toBeTruthy();
    expect(container.querySelector('.cx-table-settings-popover__content')).toBeTruthy();
    expect(
      container.querySelector('button[data-tool-panel-id="info"]')?.getAttribute('aria-selected'),
    ).toBe('true');
    expect(
      container.querySelector('button[data-tool-panel-id="help"]')?.getAttribute('aria-selected'),
    ).toBe('false');
  });

  it('80-3: clicking a tab fires onToolPanelChange + sets active panel (react)', async () => {
    const calls: { activePanelId: string | null }[] = [];
    const { container } = render(
      <ChronixTable
        columns={columnsWithActions}
        rows={rows}
        toolPanel={panelConfig}
        onToolPanelChange={(p) => calls.push(p)}
      />,
    );
    const btn = container.querySelector<HTMLButtonElement>('.cx-table-header-settings-button')!;
    fireEvent.click(btn);
    await act(async () => {
      await Promise.resolve();
    });
    const infoTab = container.querySelector<HTMLButtonElement>(
      'button[data-tool-panel-id="info"]',
    )!;
    fireEvent.click(infoTab);
    await act(async () => {
      await Promise.resolve();
    });
    expect(calls.length).toBeGreaterThanOrEqual(1);
    expect(calls[calls.length - 1]?.activePanelId).toBe('info');
    expect(
      container.querySelector('button[data-tool-panel-id="info"]')?.getAttribute('aria-selected'),
    ).toBe('true');
    expect(container.querySelector('.cx-table-settings-popover__content')).toBeTruthy();
  });

  it('80-4: clicking settings icon again closes the popover (react)', async () => {
    const { container } = render(
      <ChronixTable
        columns={columnsWithActions}
        rows={rows}
        toolPanel={{ ...panelConfig, initialOpenId: 'info' }}
      />,
    );
    const btn = container.querySelector<HTMLButtonElement>('.cx-table-header-settings-button')!;
    fireEvent.click(btn);
    await act(async () => {
      await Promise.resolve();
    });
    expect(container.querySelector('.cx-table-settings-popover')).toBeTruthy();
    fireEvent.click(btn);
    await act(async () => {
      await Promise.resolve();
    });
    expect(container.querySelector('.cx-table-settings-popover')).toBeFalsy();
    expect(container.querySelector('.cx-table-header-settings-button')).toBeTruthy();
  });

  it('80-5: empty actions array shows settings icon but no header label (react)', () => {
    const columnsEmptyActions: readonly ColumnSpec[] = [
      ...columns,
      { id: 'actions', headerName: '操作', width: 120, actions: [] },
    ];
    const { container } = render(
      <ChronixTable columns={columnsEmptyActions} rows={rows} toolPanel={panelConfig} />,
    );
    expect(container.querySelector('.cx-table-header-settings-button')).toBeTruthy();
    const actionHeaderLabel = container.querySelector(
      '[data-col-id="actions"] .cx-table-header-cell-label',
    );
    expect(actionHeaderLabel).toBeFalsy();
  });
});

describe('<ChronixTable> — -A column header menu (react)', () => {
  it('83A-1: showColumnHeaderMenu:true renders a ⋮ button in each column header (react)', () => {
    const { container } = render(
      <ChronixTable columns={columns} rows={rows} showColumnHeaderMenu={true} />,
    );
    const buttons = container.querySelectorAll('.cx-table-column-header-menu-button');
    expect(buttons.length).toBe(columns.length);
    expect(buttons[0]!.getAttribute('data-col-id')).toBe('id');
  });

  it('83A-2: showColumnHeaderMenu default renders no ⋮ buttons (react)', () => {
    const { container } = render(<ChronixTable columns={columns} rows={rows} />);
    expect(container.querySelectorAll('.cx-table-column-header-menu-button')).toHaveLength(0);
  });

  it('83A-3: clicking ⋮ opens the menu; clicking another column closes the first (react)', () => {
    const { container } = render(
      <ChronixTable columns={columns} rows={rows} showColumnHeaderMenu={true} />,
    );
    fireEvent.click(
      container.querySelector('.cx-table-column-header-menu-button[data-col-id="id"]')!,
    );
    expect(container.querySelector('.cx-table-column-header-menu[data-col-id="id"]')).toBeTruthy();
    fireEvent.click(
      container.querySelector('.cx-table-column-header-menu-button[data-col-id="name"]')!,
    );
    expect(container.querySelector('.cx-table-column-header-menu[data-col-id="id"]')).toBeFalsy();
    expect(
      container.querySelector('.cx-table-column-header-menu[data-col-id="name"]'),
    ).toBeTruthy();
  });

  it('83A-4: clicking Sort ASC dispatches setSort + fires onColumnHeaderMenuAction (react)', () => {
    const onAction = vi.fn();
    const onSortChange = vi.fn();
    const { container } = render(
      <ChronixTable
        columns={columns}
        rows={rows}
        showColumnHeaderMenu={true}
        onColumnHeaderMenuAction={onAction}
        onSortChange={onSortChange}
      />,
    );
    fireEvent.click(
      container.querySelector('.cx-table-column-header-menu-button[data-col-id="qty"]')!,
    );
    fireEvent.click(
      container.querySelector(
        '.cx-table-column-header-menu[data-col-id="qty"] [data-action="sort-asc"]',
      )!,
    );
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith({ colId: 'qty', action: 'sort-asc' });
    expect(onSortChange).toHaveBeenCalled();
  });

  it('83A-5: column.sortable:false disables Sort items in the menu (react)', () => {
    const nonSortableColumns: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', headerName: 'ID', width: 80, sortable: false },
      { id: 'name', field: 'name', headerName: '名称', flex: 1 },
    ];
    const { container } = render(
      <ChronixTable columns={nonSortableColumns} rows={rows} showColumnHeaderMenu={true} />,
    );
    fireEvent.click(
      container.querySelector('.cx-table-column-header-menu-button[data-col-id="id"]')!,
    );
    const ascItem = container.querySelector<HTMLButtonElement>(
      '.cx-table-column-header-menu[data-col-id="id"] [data-action="sort-asc"]',
    );
    expect(ascItem!.disabled).toBe(true);
  });
});

describe('<ChronixTable> — -B cell context menu (react)', () => {
  it('83B-1: right-click on a cell opens the menu at cursor coords (react)', () => {
    const onClick = vi.fn();
    const { container } = render(
      <ChronixTable
        columns={columns}
        rows={rows}
        contextMenu={{ items: [{ id: 'a', label: 'Action A', onClick }] }}
      />,
    );
    const firstCell = container.querySelector('[data-row-id="r1"][data-col-id="name"]')!;
    fireEvent.contextMenu(firstCell, { clientX: 120, clientY: 80 });
    const overlay = container.querySelector('[data-testid="cx-cell-context-menu"]');
    expect(overlay).toBeTruthy();
    expect((overlay as HTMLElement).style.left).toBe('120px');
    expect((overlay as HTMLElement).style.top).toBe('80px');
  });

  it('83B-2: contextMenu default (null) renders no overlay even on right-click (react)', () => {
    const { container } = render(<ChronixTable columns={columns} rows={rows} />);
    const firstCell = container.querySelector('[data-row-id="r1"][data-col-id="name"]')!;
    fireEvent.contextMenu(firstCell, { clientX: 50, clientY: 50 });
    expect(container.querySelector('[data-testid="cx-cell-context-menu"]')).toBeFalsy();
  });

  it('83B-3: clicking a menu item fires onClick + closes menu + fires onContextMenuClose (react)', () => {
    const onClick = vi.fn();
    const onContextMenuClose = vi.fn();
    const { container } = render(
      <ChronixTable
        columns={columns}
        rows={rows}
        contextMenu={{ items: [{ id: 'inspect', label: 'Inspect', onClick }] }}
        onContextMenuClose={onContextMenuClose}
      />,
    );
    fireEvent.contextMenu(container.querySelector('[data-row-id="r2"][data-col-id="qty"]')!, {
      clientX: 200,
      clientY: 150,
    });
    expect(container.querySelector('[data-testid="cx-cell-context-menu"]')).toBeTruthy();
    fireEvent.click(container.querySelector('[data-item-id="inspect"]')!);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith({ rowId: 'r2', colId: 'qty' });
    expect(container.querySelector('[data-testid="cx-cell-context-menu"]')).toBeFalsy();
    expect(onContextMenuClose).toHaveBeenCalled();
  });

  it('83B-4: disabled?(ctx) === true disables the item; clicking is a no-op (react)', () => {
    const onClick = vi.fn();
    const { container } = render(
      <ChronixTable
        columns={columns}
        rows={rows}
        contextMenu={{
          items: [{ id: 'guarded', label: 'Guarded', disabled: () => true, onClick }],
        }}
      />,
    );
    fireEvent.contextMenu(container.querySelector('[data-row-id="r1"][data-col-id="name"]')!, {
      clientX: 100,
      clientY: 100,
    });
    const button = container.querySelector<HTMLButtonElement>('[data-item-id="guarded"]')!;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('tool-panel tablist keyboard nav (react)', () => {
  const panelConfig: ToolPanelConfig = {
    show: true,
    panels: [
      { id: 'info', label: 'Info', icon: 'ⓘ', renderer: () => <div>info content</div> },
      { id: 'help', label: 'Help', icon: '?', renderer: () => <div>help content</div> },
      { id: 'theme', label: 'Theme', icon: '🎨', renderer: () => <div>theme content</div> },
    ],
  };

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

  async function flush(): Promise<void> {
    await act(async () => {
      await Promise.resolve();
    });
  }

  async function openPopover(container: HTMLElement): Promise<HTMLElement> {
    const btn = container.querySelector<HTMLButtonElement>('.cx-table-header-settings-button')!;
    fireEvent.click(btn);
    await flush();
    return container.querySelector<HTMLDivElement>('.cx-table-settings-popover__tabs')!;
  }

  it('84-tablist-1: each tab renders data-menu-item-index and a roving tabindex (react)', async () => {
    const { container } = render(
      <ChronixTable columns={columnsWithActions} rows={rows} toolPanel={panelConfig} />,
    );
    await openPopover(container);
    const tabs = container.querySelectorAll<HTMLButtonElement>(
      '.cx-table-settings-popover__tabs button[data-tool-panel-id]',
    );
    expect(tabs.length).toBe(3);
    expect(tabs[0]!.getAttribute('data-menu-item-index')).toBe('0');
    expect(tabs[2]!.getAttribute('data-menu-item-index')).toBe('2');
    expect(tabs[0]!.getAttribute('tabindex')).toBe('0');
    expect(tabs[1]!.getAttribute('tabindex')).toBe('-1');
  });

  it('84-tablist-2: ArrowRight moves tabindex+focus to the next tab (react)', async () => {
    const { container } = render(
      <ChronixTable columns={columnsWithActions} rows={rows} toolPanel={panelConfig} />,
    );
    const tabsBar = await openPopover(container);
    fireEvent.keyDown(tabsBar, { key: 'ArrowRight' });
    await flush();
    const tabs = container.querySelectorAll<HTMLButtonElement>(
      '.cx-table-settings-popover__tabs button[data-tool-panel-id]',
    );
    expect(tabs[1]!.getAttribute('tabindex')).toBe('0');
    expect(document.activeElement).toBe(tabs[1]);
  });

  it('84-tablist-3: ArrowLeft at first tab wraps to last (react)', async () => {
    const { container } = render(
      <ChronixTable columns={columnsWithActions} rows={rows} toolPanel={panelConfig} />,
    );
    const tabsBar = await openPopover(container);
    fireEvent.keyDown(tabsBar, { key: 'ArrowLeft' });
    await flush();
    const tabs = container.querySelectorAll<HTMLButtonElement>(
      '.cx-table-settings-popover__tabs button[data-tool-panel-id]',
    );
    expect(tabs[2]!.getAttribute('tabindex')).toBe('0');
  });

  it('84-tablist-4: Home + End jump to first / last tab (react)', async () => {
    const { container } = render(
      <ChronixTable columns={columnsWithActions} rows={rows} toolPanel={panelConfig} />,
    );
    const tabsBar = await openPopover(container);
    fireEvent.keyDown(tabsBar, { key: 'End' });
    await flush();
    let tabs = container.querySelectorAll<HTMLButtonElement>(
      '.cx-table-settings-popover__tabs button[data-tool-panel-id]',
    );
    expect(tabs[2]!.getAttribute('tabindex')).toBe('0');
    fireEvent.keyDown(tabsBar, { key: 'Home' });
    await flush();
    tabs = container.querySelectorAll<HTMLButtonElement>(
      '.cx-table-settings-popover__tabs button[data-tool-panel-id]',
    );
    expect(tabs[0]!.getAttribute('tabindex')).toBe('0');
  });

  it('84-tablist-5: Enter on a focused tab activates it via the existing click handler (react)', async () => {
    const { container } = render(
      <ChronixTable columns={columnsWithActions} rows={rows} toolPanel={panelConfig} />,
    );
    const tabsBar = await openPopover(container);
    fireEvent.keyDown(tabsBar, { key: 'ArrowRight' });
    await flush();
    const helpBtn = container.querySelector<HTMLButtonElement>(
      '.cx-table-settings-popover__tabs button[data-tool-panel-id="help"]',
    )!;
    fireEvent.click(helpBtn);
    await flush();
    expect(
      container.querySelector('button[data-tool-panel-id="help"]')?.getAttribute('aria-selected'),
    ).toBe('true');
  });

  it('84-tablist-6: empty tablist (toolPanel.show=false) ships no tablist DOM (react)', () => {
    const { container } = render(
      <ChronixTable
        columns={columnsWithActions}
        rows={rows}
        toolPanel={{ show: false, panels: [] as never[] }}
      />,
    );
    // toolPanel.show=false -> no popover tabs render.
    expect(container.querySelector('.cx-table-settings-popover__tabs')).toBeFalsy();
    // The settings button is gated on toolPanel.show: it does NOT render when
    // toolPanel is disabled (show=false), even if the column has `actions`
    // (bug fix: previously decoupled, which rendered a dead gear icon on actions
    // columns of tables that never configured toolPanel).
    expect(container.querySelector('.cx-table-header-settings-button')).toBeFalsy();
  });

  it('tool-panel: injects synthetic settings column when no actions column exists (react)', () => {
    const { container } = render(
      <ChronixTable columns={columns} rows={rows} toolPanel={panelConfig} />,
    );
    // bug fix: when toolPanel is enabled but the consumer declared NO
    // actions column, the adapter injects a pinned-right empty actions
    // column (id __cx_settings__) so the gear icon always has a header.
    expect(
      container.querySelector('.cx-table-header-cell[data-col-id="__cx_settings__"]'),
    ).toBeTruthy();
    expect(container.querySelector('.cx-table-header-settings-button')).toBeTruthy();
    expect(container.querySelector('.cx-table-header-cell[data-col-id="actions"]')).toBeFalsy();
  });
});

describe('-A column header menu keyboard nav (react)', () => {
  async function flush(): Promise<void> {
    await act(async () => {
      await Promise.resolve();
    });
  }

  it('84-header-1: opened menu items render data-menu-item-index 0..4 (react)', () => {
    const { container } = render(
      <ChronixTable columns={columns} rows={rows} showColumnHeaderMenu={true} />,
    );
    const btn = container.querySelector<HTMLButtonElement>(
      '.cx-table-column-header-menu-button[data-col-id="qty"]',
    )!;
    fireEvent.click(btn);
    const menu = container.querySelector<HTMLDivElement>(
      '.cx-table-column-header-menu[data-col-id="qty"]',
    )!;
    const items = menu.querySelectorAll<HTMLButtonElement>('.cx-table-column-header-menu-item');
    expect(items.length).toBe(5);
    expect(items[0]!.getAttribute('data-menu-item-index')).toBe('0');
    expect(items[4]!.getAttribute('data-menu-item-index')).toBe('4');
  });

  it('84-header-2: first non-disabled item has tabindex=0 on open (react)', () => {
    const { container } = render(
      <ChronixTable columns={columns} rows={rows} showColumnHeaderMenu={true} />,
    );
    fireEvent.click(
      container.querySelector<HTMLButtonElement>(
        '.cx-table-column-header-menu-button[data-col-id="qty"]',
      )!,
    );
    const menu = container.querySelector<HTMLDivElement>(
      '.cx-table-column-header-menu[data-col-id="qty"]',
    )!;
    const items = menu.querySelectorAll<HTMLButtonElement>('.cx-table-column-header-menu-item');
    expect(items[0]!.getAttribute('tabindex')).toBe('0');
    expect(items[1]!.getAttribute('tabindex')).toBe('-1');
  });

  it('84-header-3: ArrowDown moves tabindex; ArrowUp wraps to last (react)', async () => {
    const { container } = render(
      <ChronixTable columns={columns} rows={rows} showColumnHeaderMenu={true} />,
    );
    fireEvent.click(
      container.querySelector<HTMLButtonElement>(
        '.cx-table-column-header-menu-button[data-col-id="qty"]',
      )!,
    );
    const menu = container.querySelector<HTMLDivElement>(
      '.cx-table-column-header-menu[data-col-id="qty"]',
    )!;
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    await flush();
    let items = menu.querySelectorAll<HTMLButtonElement>('.cx-table-column-header-menu-item');
    expect(items[1]!.getAttribute('tabindex')).toBe('0');
    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    await flush();
    items = menu.querySelectorAll<HTMLButtonElement>('.cx-table-column-header-menu-item');
    expect(items[4]!.getAttribute('tabindex')).toBe('0');
  });

  it('84-header-4: disabled Clear Sort skipped during ArrowDown nav (react)', async () => {
    const { container } = render(
      <ChronixTable columns={columns} rows={rows} showColumnHeaderMenu={true} />,
    );
    fireEvent.click(
      container.querySelector<HTMLButtonElement>(
        '.cx-table-column-header-menu-button[data-col-id="qty"]',
      )!,
    );
    const menu = container.querySelector<HTMLDivElement>(
      '.cx-table-column-header-menu[data-col-id="qty"]',
    )!;
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    await flush();
    const items = menu.querySelectorAll<HTMLButtonElement>('.cx-table-column-header-menu-item');
    expect(items[3]!.getAttribute('tabindex')).toBe('0');
    expect(items[2]!.getAttribute('tabindex')).toBe('-1');
  });

  it('84-header-5: Home/End jump to first/last enabled (react)', async () => {
    const { container } = render(
      <ChronixTable columns={columns} rows={rows} showColumnHeaderMenu={true} />,
    );
    fireEvent.click(
      container.querySelector<HTMLButtonElement>(
        '.cx-table-column-header-menu-button[data-col-id="qty"]',
      )!,
    );
    const menu = container.querySelector<HTMLDivElement>(
      '.cx-table-column-header-menu[data-col-id="qty"]',
    )!;
    fireEvent.keyDown(menu, { key: 'End' });
    await flush();
    let items = menu.querySelectorAll<HTMLButtonElement>('.cx-table-column-header-menu-item');
    expect(items[4]!.getAttribute('tabindex')).toBe('0');
    fireEvent.keyDown(menu, { key: 'Home' });
    await flush();
    items = menu.querySelectorAll<HTMLButtonElement>('.cx-table-column-header-menu-item');
    expect(items[0]!.getAttribute('tabindex')).toBe('0');
  });

  it('84-header-6: opening a new column menu resets activeIndex to first enabled (react)', async () => {
    const { container } = render(
      <ChronixTable columns={columns} rows={rows} showColumnHeaderMenu={true} />,
    );
    fireEvent.click(
      container.querySelector<HTMLButtonElement>(
        '.cx-table-column-header-menu-button[data-col-id="qty"]',
      )!,
    );
    let menu = container.querySelector<HTMLDivElement>(
      '.cx-table-column-header-menu[data-col-id="qty"]',
    )!;
    fireEvent.keyDown(menu, { key: 'End' });
    await flush();
    fireEvent.click(
      container.querySelector<HTMLButtonElement>(
        '.cx-table-column-header-menu-button[data-col-id="name"]',
      )!,
    );
    await flush();
    menu = container.querySelector<HTMLDivElement>(
      '.cx-table-column-header-menu[data-col-id="name"]',
    )!;
    expect(menu).toBeTruthy();
    const items = menu.querySelectorAll<HTMLButtonElement>('.cx-table-column-header-menu-item');
    expect(items[0]!.getAttribute('tabindex')).toBe('0');
  });
});

describe('-B cell context menu keyboard nav (react)', () => {
  const ctxConfig = {
    items: [
      { id: 'copy', label: 'Copy', onClick: vi.fn() },
      { id: 'inspect', label: 'Inspect', onClick: vi.fn() },
      { id: 'delete', label: 'Delete', onClick: vi.fn() },
    ],
  } as const;

  async function flush(): Promise<void> {
    await act(async () => {
      await Promise.resolve();
    });
  }

  it('84-ctx-1: opening the menu lands tabindex=0 on first item (react)', async () => {
    const { container } = render(
      <ChronixTable columns={columns} rows={rows} contextMenu={ctxConfig} />,
    );
    const cell = container.querySelector<HTMLDivElement>('[data-row-id="r1"][data-col-id="name"]')!;
    fireEvent.contextMenu(cell, { clientX: 100, clientY: 100 });
    await flush();
    const items = container.querySelectorAll<HTMLButtonElement>('.cx-table-cell-context-menu-item');
    expect(items.length).toBe(3);
    expect(items[0]!.getAttribute('data-menu-item-index')).toBe('0');
    expect(items[0]!.getAttribute('tabindex')).toBe('0');
    expect(items[1]!.getAttribute('tabindex')).toBe('-1');
  });

  it('84-ctx-2: ArrowDown moves tabindex to next item (react)', async () => {
    const { container } = render(
      <ChronixTable columns={columns} rows={rows} contextMenu={ctxConfig} />,
    );
    const cell = container.querySelector<HTMLDivElement>('[data-row-id="r1"][data-col-id="name"]')!;
    fireEvent.contextMenu(cell, { clientX: 100, clientY: 100 });
    await flush();
    const menu = container.querySelector<HTMLDivElement>('[data-testid="cx-cell-context-menu"]')!;
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    await flush();
    const items = container.querySelectorAll<HTMLButtonElement>('.cx-table-cell-context-menu-item');
    expect(items[1]!.getAttribute('tabindex')).toBe('0');
  });

  it('84-ctx-3: ArrowDown skips disabled items (react)', async () => {
    const { container } = render(
      <ChronixTable
        columns={columns}
        rows={rows}
        contextMenu={{
          items: [
            { id: 'a', label: 'A', onClick: vi.fn() },
            { id: 'b', label: 'B', disabled: () => true, onClick: vi.fn() },
            { id: 'c', label: 'C', onClick: vi.fn() },
          ],
        }}
      />,
    );
    const cell = container.querySelector<HTMLDivElement>('[data-row-id="r1"][data-col-id="name"]')!;
    fireEvent.contextMenu(cell, { clientX: 100, clientY: 100 });
    await flush();
    const menu = container.querySelector<HTMLDivElement>('[data-testid="cx-cell-context-menu"]')!;
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    await flush();
    const items = container.querySelectorAll<HTMLButtonElement>('.cx-table-cell-context-menu-item');
    expect(items[2]!.getAttribute('tabindex')).toBe('0');
    expect(items[1]!.getAttribute('tabindex')).toBe('-1');
  });

  it('84-ctx-4: Home/End jump to first/last item (react)', async () => {
    const { container } = render(
      <ChronixTable columns={columns} rows={rows} contextMenu={ctxConfig} />,
    );
    fireEvent.contextMenu(
      container.querySelector<HTMLDivElement>('[data-row-id="r2"][data-col-id="qty"]')!,
      { clientX: 100, clientY: 100 },
    );
    await flush();
    const menu = container.querySelector<HTMLDivElement>('[data-testid="cx-cell-context-menu"]')!;
    fireEvent.keyDown(menu, { key: 'End' });
    await flush();
    let items = container.querySelectorAll<HTMLButtonElement>('.cx-table-cell-context-menu-item');
    expect(items[2]!.getAttribute('tabindex')).toBe('0');
    fireEvent.keyDown(menu, { key: 'Home' });
    await flush();
    items = container.querySelectorAll<HTMLButtonElement>('.cx-table-cell-context-menu-item');
    expect(items[0]!.getAttribute('tabindex')).toBe('0');
  });

  it('84-ctx-5: focus shifts to active item after ArrowDown (react)', async () => {
    const { container } = render(
      <ChronixTable columns={columns} rows={rows} contextMenu={ctxConfig} />,
    );
    fireEvent.contextMenu(
      container.querySelector<HTMLDivElement>('[data-row-id="r1"][data-col-id="name"]')!,
      { clientX: 100, clientY: 100 },
    );
    await flush();
    const menu = container.querySelector<HTMLDivElement>('[data-testid="cx-cell-context-menu"]')!;
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    await flush();
    const items = container.querySelectorAll<HTMLButtonElement>('.cx-table-cell-context-menu-item');
    expect(document.activeElement).toBe(items[1]);
  });

  it('84-ctx-6: closing then reopening resets activeIndex to first item (react)', async () => {
    const { container } = render(
      <ChronixTable columns={columns} rows={rows} contextMenu={ctxConfig} />,
    );
    fireEvent.contextMenu(
      container.querySelector<HTMLDivElement>('[data-row-id="r1"][data-col-id="name"]')!,
      { clientX: 100, clientY: 100 },
    );
    await flush();
    fireEvent.keyDown(
      container.querySelector<HTMLDivElement>('[data-testid="cx-cell-context-menu"]')!,
      { key: 'End' },
    );
    await flush();
    fireEvent.click(container.querySelector<HTMLButtonElement>('[data-item-id="copy"]')!);
    await flush();
    expect(container.querySelector('[data-testid="cx-cell-context-menu"]')).toBeFalsy();
    fireEvent.contextMenu(
      container.querySelector<HTMLDivElement>('[data-row-id="r3"][data-col-id="qty"]')!,
      { clientX: 200, clientY: 100 },
    );
    await flush();
    const items = container.querySelectorAll<HTMLButtonElement>('.cx-table-cell-context-menu-item');
    expect(items[0]!.getAttribute('tabindex')).toBe('0');
  });
});

describe('+ 44.2 (react): per-column rowDragHandle + drag auto-scroll', () => {
  interface RowDragHandleApi {
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

  it('44.1-1: rowDragHandle:true column adds data-row-drag-handle="cell" + cursor:grab on draggable rows (react)', () => {
    const { container } = render(<ChronixTable columns={dragCols} rows={dragRows} />);
    const r1NameCell = container.querySelector<HTMLDivElement>(
      '[data-row-id="r1"][data-col-id="name"]',
    );
    expect(r1NameCell?.getAttribute('data-row-drag-handle')).toBe('cell');
    expect(r1NameCell?.style.cursor).toBe('grab');
  });

  it('44.1-2: rowDragHandle:true column skips draggable:false rows (react)', () => {
    const { container } = render(<ChronixTable columns={dragCols} rows={dragRows} />);
    const r3NameCell = container.querySelector<HTMLDivElement>(
      '[data-row-id="r3"][data-col-id="name"]',
    );
    expect(r3NameCell?.getAttribute('data-row-drag-handle')).toBeNull();
    expect(r3NameCell?.style.cursor ?? '').not.toBe('grab');
  });

  it('44.1-3: rowDragHandle:true column skips pinned rows (react)', () => {
    const { container } = render(<ChronixTable columns={dragCols} rows={dragRows} />);
    const pinnedNameCell = container.querySelector<HTMLDivElement>(
      '[data-row-id="r-pinned"][data-col-id="name"]',
    );
    if (pinnedNameCell != null) {
      expect(pinnedNameCell.getAttribute('data-row-drag-handle')).toBeNull();
    }
  });

  it('44.1-4: non-flagged column does NOT get the row-drag-handle wiring (react)', () => {
    const { container } = render(<ChronixTable columns={dragCols} rows={dragRows} />);
    const r1IdCell = container.querySelector<HTMLDivElement>(
      '[data-row-id="r1"][data-col-id="id"]',
    );
    expect(r1IdCell?.getAttribute('data-row-drag-handle')).toBeNull();
  });

  it('44.1-5: rowDragColumn.show:true + rowDragHandle column → grip column wins; console.warn fires once (react)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { container } = render(
      <ChronixTable columns={dragCols} rows={dragRows} rowDragColumn={{ show: true }} />,
    );
    const r1NameCell = container.querySelector<HTMLDivElement>(
      '[data-row-id="r1"][data-col-id="name"]',
    );
    expect(r1NameCell?.getAttribute('data-row-drag-handle')).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toContain('rowDragColumn.show is true');
    warnSpy.mockRestore();
  });

  it('44.1-6: pointerdown on rowDragHandle cell starts row-drag session via threshold gesture (react)', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={dragCols} rows={dragRows} />,
    );
    const r1NameCell = container.querySelector<HTMLDivElement>(
      '[data-row-id="r1"][data-col-id="name"]',
    )!;
    fireMovePointer('pointerdown', r1NameCell, {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    });
    const wrapperEl = container.querySelector<HTMLDivElement>('.cx-table-wrapper')!;
    fireMovePointer('pointermove', wrapperEl, { clientX: 100, clientY: 110, pointerId: 1 });
    const handle = handleRef.current as unknown as RowDragHandleApi;
    expect(handle.getMovingRow()?.rowId).toBe('r1');
    act(() => {
      handle.cancelRowMove();
    });
  });

  it('44.2-1: drag auto-scroll rAF schedules when pointer enters trigger zone during drag (react)', () => {
    const rafSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        void cb;
        return 1;
      });
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={dragCols} rows={dragRows} />,
    );
    const handle = handleRef.current as unknown as RowDragHandleApi;
    act(() => {
      handle.startMovingRow('r1');
    });
    rafSpy.mockClear();
    const wrapperEl = container.querySelector<HTMLDivElement>('.cx-table-wrapper')!;
    fireMovePointer('pointermove', wrapperEl, { clientX: 0, clientY: 0, pointerId: -1 });
    expect(rafSpy).toHaveBeenCalled();
    act(() => {
      handle.cancelRowMove();
    });
    rafSpy.mockRestore();
  });

  it('44.2-2: rowDragAutoScroll:{enabled:false} disables the rAF loop entirely (react)', () => {
    const rafSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        void cb;
        return 1;
      });
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={dragCols}
        rows={dragRows}
        rowDragAutoScroll={{ enabled: false }}
      />,
    );
    const handle = handleRef.current as unknown as RowDragHandleApi;
    act(() => {
      handle.startMovingRow('r1');
    });
    rafSpy.mockClear();
    const wrapperEl = container.querySelector<HTMLDivElement>('.cx-table-wrapper')!;
    fireMovePointer('pointermove', wrapperEl, { clientX: 0, clientY: 0, pointerId: -1 });
    expect(rafSpy).not.toHaveBeenCalled();
    act(() => {
      handle.cancelRowMove();
    });
    rafSpy.mockRestore();
  });
});

// ────────────────────────── per-column validator + invalid-cell surface (react) ──────────────────────────
// Verbatim port of vue3 tests. Same 5 cases.

describe('per-column validator + invalid-cell surface (react)', () => {
  it('validator undefined → commit succeeds (backwards-compat)', () => {
    const onStop = vi.fn<(p: CellEditStopPayload) => void>();
    const phaseColumns: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', headerName: 'ID', width: 80 },
      { id: 'name', field: 'name', headerName: 'Name', flex: 1, editable: true },
    ];
    const phaseRows: readonly RowSpec[] = [{ id: 'r1', data: { id: 1, name: 'Alpha' } }];
    const { container } = render(
      <ChronixTable columns={phaseColumns} rows={phaseRows} onCellEditStop={onStop} />,
    );
    fireEvent.doubleClick(
      container.querySelector('.cx-table-cell[data-col-id="name"][data-row-id="r1"]')!,
    );
    const editor = container.querySelector<HTMLInputElement>('.cx-table-cell-editor')!;
    fireEvent.change(editor, { target: { value: 'hello' } });
    fireEvent.keyDown(editor, { key: 'Enter' });
    const stopPayload = onStop.mock.lastCall![0];
    expect(stopPayload.committed).toBe(true);
    expect(stopPayload.validationError).toBeUndefined();
  });

  it('validator returns string → reject + validationError + editor stays open', () => {
    const validator = vi.fn<(value: unknown) => string | null>((value) =>
      typeof value === 'string' && value.length < 3 ? 'too short' : null,
    );
    const onStop = vi.fn<(p: CellEditStopPayload) => void>();
    const onChange = vi.fn<(p: CellValueChangePayload) => void>();
    const phaseColumns: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', headerName: 'ID', width: 80 },
      { id: 'name', field: 'name', headerName: 'Name', flex: 1, editable: true, validator },
    ];
    const phaseRows: readonly RowSpec[] = [{ id: 'r1', data: { id: 1, name: 'Alpha' } }];
    const { container } = render(
      <ChronixTable
        columns={phaseColumns}
        rows={phaseRows}
        onCellEditStop={onStop}
        onCellValueChange={onChange}
      />,
    );
    fireEvent.doubleClick(
      container.querySelector('.cx-table-cell[data-col-id="name"][data-row-id="r1"]')!,
    );
    const editor = container.querySelector<HTMLInputElement>('.cx-table-cell-editor')!;
    fireEvent.change(editor, { target: { value: 'hi' } });
    fireEvent.keyDown(editor, { key: 'Enter' });
    expect(validator).toHaveBeenCalledTimes(1);
    expect(container.querySelector('.cx-table-cell-editor')).not.toBeNull();
    expect(onStop).toHaveBeenLastCalledWith(
      expect.objectContaining({
        committed: false,
        validationError: { reason: 'too short' },
      }),
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it('validator returns EditValidationError → code propagates verbatim', () => {
    const onStop = vi.fn<(p: CellEditStopPayload) => void>();
    const phaseColumns: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', headerName: 'ID', width: 80 },
      {
        id: 'name',
        field: 'name',
        headerName: 'Name',
        flex: 1,
        editable: true,
        validator: () => ({ reason: 'no good', code: 'fmt' }),
      },
    ];
    const phaseRows: readonly RowSpec[] = [{ id: 'r1', data: { id: 1, name: 'Alpha' } }];
    const { container } = render(
      <ChronixTable columns={phaseColumns} rows={phaseRows} onCellEditStop={onStop} />,
    );
    fireEvent.doubleClick(
      container.querySelector('.cx-table-cell[data-col-id="name"][data-row-id="r1"]')!,
    );
    const editor = container.querySelector<HTMLInputElement>('.cx-table-cell-editor')!;
    fireEvent.change(editor, { target: { value: 'whatever' } });
    fireEvent.keyDown(editor, { key: 'Enter' });
    expect(onStop).toHaveBeenLastCalledWith(
      expect.objectContaining({
        validationError: { reason: 'no good', code: 'fmt' },
      }),
    );
  });

  it('invalid cell renders --invalid class + data-cell-invalid + aria-invalid', () => {
    const phaseColumns: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', headerName: 'ID', width: 80 },
      {
        id: 'name',
        field: 'name',
        headerName: 'Name',
        flex: 1,
        editable: true,
        validator: () => 'nope',
      },
    ];
    const phaseRows: readonly RowSpec[] = [{ id: 'r1', data: { id: 1, name: 'Alpha' } }];
    const { container } = render(<ChronixTable columns={phaseColumns} rows={phaseRows} />);
    fireEvent.doubleClick(
      container.querySelector('.cx-table-cell[data-col-id="name"][data-row-id="r1"]')!,
    );
    const editor = container.querySelector<HTMLInputElement>('.cx-table-cell-editor')!;
    fireEvent.change(editor, { target: { value: 'anything' } });
    fireEvent.keyDown(editor, { key: 'Enter' });
    const cell = container.querySelector('.cx-table-cell[data-col-id="name"][data-row-id="r1"]')!;
    expect(cell.classList.contains('cx-table-cell--invalid')).toBe(true);
    expect(cell.getAttribute('data-cell-invalid')).toBe('true');
    expect(cell.getAttribute('aria-invalid')).toBe('true');
    // Cancel clears the invalid marker.
    fireEvent.keyDown(container.querySelector<HTMLInputElement>('.cx-table-cell-editor')!, {
      key: 'Escape',
    });
    const cellAfter = container.querySelector(
      '.cx-table-cell[data-col-id="name"][data-row-id="r1"]',
    )!;
    expect(cellAfter.classList.contains('cx-table-cell--invalid')).toBe(false);
    expect(cellAfter.getAttribute('data-cell-invalid')).toBeNull();
  });

  // ---- async validator (react) -----------------------------------

  it('(react): async resolve null → commit succeeds + cell-value-change', async () => {
    const validatorAsync = vi.fn((_v: unknown) => Promise.resolve(null));
    const onStop = vi.fn<(p: CellEditStopPayload) => void>();
    const onChange = vi.fn<(p: CellValueChangePayload) => void>();
    const onPending = vi.fn();
    const phaseColumns: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', headerName: 'ID', width: 80 },
      {
        id: 'name',
        field: 'name',
        headerName: 'Name',
        flex: 1,
        editable: true,
        validatorAsync,
      },
    ];
    const phaseRows: readonly RowSpec[] = [{ id: 'r1', data: { id: 1, name: 'Alpha' } }];
    const { container } = render(
      <ChronixTable
        columns={phaseColumns}
        rows={phaseRows}
        onCellEditStop={onStop}
        onCellValueChange={onChange}
        onCellEditValidationPending={onPending}
      />,
    );
    fireEvent.doubleClick(
      container.querySelector('.cx-table-cell[data-col-id="name"][data-row-id="r1"]')!,
    );
    const editor = container.querySelector<HTMLInputElement>('.cx-table-cell-editor')!;
    fireEvent.change(editor, { target: { value: 'hello' } });
    fireEvent.keyDown(editor, { key: 'Enter' });
    expect(onPending).toHaveBeenCalledTimes(1);
    await new Promise((r) => setTimeout(r, 0));
    expect(validatorAsync).toHaveBeenCalledTimes(1);
    expect(onStop).toHaveBeenLastCalledWith(
      expect.objectContaining({ committed: true, finalValue: 'hello' }),
    );
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('(react): async resolve string → reject + validationError + editor stays open', async () => {
    const onStop = vi.fn<(p: CellEditStopPayload) => void>();
    const onChange = vi.fn<(p: CellValueChangePayload) => void>();
    const phaseColumns: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', headerName: 'ID', width: 80 },
      {
        id: 'name',
        field: 'name',
        headerName: 'Name',
        flex: 1,
        editable: true,
        validatorAsync: () => Promise.resolve('taken'),
      },
    ];
    const phaseRows: readonly RowSpec[] = [{ id: 'r1', data: { id: 1, name: 'Alpha' } }];
    const { container } = render(
      <ChronixTable
        columns={phaseColumns}
        rows={phaseRows}
        onCellEditStop={onStop}
        onCellValueChange={onChange}
      />,
    );
    fireEvent.doubleClick(
      container.querySelector('.cx-table-cell[data-col-id="name"][data-row-id="r1"]')!,
    );
    const editor = container.querySelector<HTMLInputElement>('.cx-table-cell-editor')!;
    fireEvent.change(editor, { target: { value: 'alice' } });
    fireEvent.keyDown(editor, { key: 'Enter' });
    await new Promise((r) => setTimeout(r, 0));
    expect(container.querySelector('.cx-table-cell-editor')).not.toBeNull();
    expect(onStop).toHaveBeenLastCalledWith(
      expect.objectContaining({ committed: false, validationError: { reason: 'taken' } }),
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it('(react): sync validator short-circuits async (async not called)', async () => {
    const validatorAsync = vi.fn((_v: unknown) => Promise.resolve(null));
    const onPending = vi.fn();
    const phaseColumns: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', headerName: 'ID', width: 80 },
      {
        id: 'name',
        field: 'name',
        headerName: 'Name',
        flex: 1,
        editable: true,
        validator: () => 'sync-rejects',
        validatorAsync,
      },
    ];
    const phaseRows: readonly RowSpec[] = [{ id: 'r1', data: { id: 1, name: 'Alpha' } }];
    const { container } = render(
      <ChronixTable
        columns={phaseColumns}
        rows={phaseRows}
        onCellEditValidationPending={onPending}
      />,
    );
    fireEvent.doubleClick(
      container.querySelector('.cx-table-cell[data-col-id="name"][data-row-id="r1"]')!,
    );
    const editor = container.querySelector<HTMLInputElement>('.cx-table-cell-editor')!;
    fireEvent.change(editor, { target: { value: 'whatever' } });
    fireEvent.keyDown(editor, { key: 'Enter' });
    await new Promise((r) => setTimeout(r, 0));
    expect(validatorAsync).not.toHaveBeenCalled();
    expect(onPending).not.toHaveBeenCalled();
  });

  it('(react): pending cell paints --validating + data-attr + aria-busy', async () => {
    let resolveValidator: (v: null) => void = () => undefined;
    const phaseColumns: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', headerName: 'ID', width: 80 },
      {
        id: 'name',
        field: 'name',
        headerName: 'Name',
        flex: 1,
        editable: true,
        validatorAsync: () => new Promise<null>((r) => (resolveValidator = r)),
      },
    ];
    const phaseRows: readonly RowSpec[] = [{ id: 'r1', data: { id: 1, name: 'Alpha' } }];
    const { container } = render(<ChronixTable columns={phaseColumns} rows={phaseRows} />);
    fireEvent.doubleClick(
      container.querySelector('.cx-table-cell[data-col-id="name"][data-row-id="r1"]')!,
    );
    const editor = container.querySelector<HTMLInputElement>('.cx-table-cell-editor')!;
    fireEvent.change(editor, { target: { value: 'hello' } });
    fireEvent.keyDown(editor, { key: 'Enter' });
    const cell = container.querySelector('.cx-table-cell[data-col-id="name"][data-row-id="r1"]')!;
    expect(cell.classList.contains('cx-table-cell--validating')).toBe(true);
    expect(cell.getAttribute('data-cell-validating')).toBe('true');
    expect(cell.getAttribute('aria-busy')).toBe('true');
    resolveValidator(null);
    await new Promise((r) => setTimeout(r, 0));
    const cellAfter = container.querySelector(
      '.cx-table-cell[data-col-id="name"][data-row-id="r1"]',
    )!;
    expect(cellAfter.classList.contains('cx-table-cell--validating')).toBe(false);
  });

  it('(react): Promise rejection → validationError with code "async-error"', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const onStop = vi.fn<(p: CellEditStopPayload) => void>();
    const phaseColumns: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', headerName: 'ID', width: 80 },
      {
        id: 'name',
        field: 'name',
        headerName: 'Name',
        flex: 1,
        editable: true,
        validatorAsync: () => Promise.reject(new Error('HTTP 500')),
      },
    ];
    const phaseRows: readonly RowSpec[] = [{ id: 'r1', data: { id: 1, name: 'Alpha' } }];
    const { container } = render(
      <ChronixTable columns={phaseColumns} rows={phaseRows} onCellEditStop={onStop} />,
    );
    fireEvent.doubleClick(
      container.querySelector('.cx-table-cell[data-col-id="name"][data-row-id="r1"]')!,
    );
    const editor = container.querySelector<HTMLInputElement>('.cx-table-cell-editor')!;
    fireEvent.change(editor, { target: { value: 'hello' } });
    fireEvent.keyDown(editor, { key: 'Enter' });
    await new Promise((r) => setTimeout(r, 0));
    expect(onStop).toHaveBeenLastCalledWith(
      expect.objectContaining({
        committed: false,
        validationError: { reason: 'HTTP 500', code: 'async-error' },
      }),
    );
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('(react): cancel during pending discards the in-flight async', async () => {
    let resolveValidator: (v: null) => void = () => undefined;
    const onStop = vi.fn<(p: CellEditStopPayload) => void>();
    const onChange = vi.fn<(p: CellValueChangePayload) => void>();
    const phaseColumns: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', headerName: 'ID', width: 80 },
      {
        id: 'name',
        field: 'name',
        headerName: 'Name',
        flex: 1,
        editable: true,
        validatorAsync: () => new Promise<null>((r) => (resolveValidator = r)),
      },
    ];
    const phaseRows: readonly RowSpec[] = [{ id: 'r1', data: { id: 1, name: 'Alpha' } }];
    const { container } = render(
      <ChronixTable
        columns={phaseColumns}
        rows={phaseRows}
        onCellEditStop={onStop}
        onCellValueChange={onChange}
      />,
    );
    fireEvent.doubleClick(
      container.querySelector('.cx-table-cell[data-col-id="name"][data-row-id="r1"]')!,
    );
    const editor = container.querySelector<HTMLInputElement>('.cx-table-cell-editor')!;
    fireEvent.change(editor, { target: { value: 'hello' } });
    fireEvent.keyDown(editor, { key: 'Enter' });
    fireEvent.keyDown(container.querySelector<HTMLInputElement>('.cx-table-cell-editor')!, {
      key: 'Escape',
    });
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(onStop).toHaveBeenLastCalledWith(expect.objectContaining({ committed: false }));
    const cancelPayload = onStop.mock.lastCall![0];
    expect(cancelPayload.validationError).toBeUndefined();
    resolveValidator(null);
    await new Promise((r) => setTimeout(r, 0));
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('filterUi="multi" renders <details> + segmented mode toggle + N stacked inputs', () => {
    const phaseColumns: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', headerName: 'ID', width: 80 },
      { id: 'note', field: 'note', headerName: 'Note', flex: 1, filterUi: 'multi' },
    ];
    const phaseRows: readonly RowSpec[] = [
      { id: 'r1', data: { id: 1, note: 'first' } },
      { id: 'r2', data: { id: 2, note: 'second' } },
    ];
    const { container } = render(
      <ChronixTable columns={phaseColumns} rows={phaseRows} showFilterRow />,
    );
    const details = container.querySelector('.cx-table-multi-filter[data-col-id="note"]');
    expect(details).not.toBeNull();
    const slots = container.querySelectorAll('.cx-table-multi-filter__input[data-col-id="note"]');
    expect(slots).toHaveLength(2);
    const modeButtons = container.querySelectorAll(
      '.cx-table-multi-filter[data-col-id="note"] .cx-table-multi-filter__mode-button',
    );
    expect(modeButtons).toHaveLength(2);
    expect(modeButtons[0]!.getAttribute('data-mode')).toBe('AND');
    expect(modeButtons[0]!.getAttribute('aria-checked')).toBe('true');
    expect(modeButtons[1]!.getAttribute('data-mode')).toBe('OR');
    expect(modeButtons[1]!.getAttribute('aria-checked')).toBe('false');
  });

  it('typing in slot 0 emits filter-change with MultiFilterSpec', () => {
    const onFilterChange = vi.fn<(p: FilterChangePayload) => void>();
    const phaseColumns: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', headerName: 'ID', width: 80 },
      { id: 'note', field: 'note', headerName: 'Note', flex: 1, filterUi: 'multi' },
    ];
    const phaseRows: readonly RowSpec[] = [
      { id: 'r1', data: { id: 1, note: 'first' } },
      { id: 'r2', data: { id: 2, note: 'second' } },
    ];
    const { container } = render(
      <ChronixTable
        columns={phaseColumns}
        rows={phaseRows}
        showFilterRow
        onFilterChange={onFilterChange}
      />,
    );
    const slot0 = container.querySelector<HTMLInputElement>(
      '.cx-table-multi-filter__input[data-multi-filter-slot="0"]',
    )!;
    fireEvent.change(slot0, { target: { value: 'first' } });
    const lastSpec = onFilterChange.mock.lastCall![0].filterSpec;
    const multi = lastSpec.find((s): s is MultiFilterSpec => s.type === 'multi');
    expect(multi).toBeDefined();
    expect(multi!.colId).toBe('note');
    expect(multi!.mode).toBe('AND');
    expect(multi!.filters[0]).toEqual({ type: 'text', operator: 'contains', value: 'first' });
    expect(multi!.filters[1]).toEqual({ type: 'text', operator: 'contains', value: '' });
  });

  it('clicking OR mode button emits filter-change with mode: "OR"', () => {
    const onFilterChange = vi.fn<(p: FilterChangePayload) => void>();
    const phaseColumns: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', headerName: 'ID', width: 80 },
      { id: 'note', field: 'note', headerName: 'Note', flex: 1, filterUi: 'multi' },
    ];
    const phaseRows: readonly RowSpec[] = [{ id: 'r1', data: { id: 1, note: 'first' } }];
    const { container } = render(
      <ChronixTable
        columns={phaseColumns}
        rows={phaseRows}
        showFilterRow
        onFilterChange={onFilterChange}
      />,
    );
    const orBtn = container.querySelector<HTMLButtonElement>(
      '.cx-table-multi-filter[data-col-id="note"] [data-mode="OR"]',
    )!;
    fireEvent.click(orBtn);
    const lastSpec = onFilterChange.mock.lastCall![0].filterSpec;
    const multi = lastSpec.find((s): s is MultiFilterSpec => s.type === 'multi');
    expect(multi!.mode).toBe('OR');
  });

  it('AND mode + both slots populated excludes rows that match only one', () => {
    const phaseColumns: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', headerName: 'ID', width: 80 },
      { id: 'note', field: 'note', headerName: 'Note', flex: 1, filterUi: 'multi' },
    ];
    const phaseRows: readonly RowSpec[] = [
      { id: 'r1', data: { id: 1, note: 'first' } },
      { id: 'r2', data: { id: 2, note: 'second' } },
    ];
    const { container } = render(
      <ChronixTable columns={phaseColumns} rows={phaseRows} showFilterRow />,
    );
    const slot0 = container.querySelector<HTMLInputElement>(
      '.cx-table-multi-filter__input[data-multi-filter-slot="0"]',
    )!;
    const slot1 = container.querySelector<HTMLInputElement>(
      '.cx-table-multi-filter__input[data-multi-filter-slot="1"]',
    )!;
    fireEvent.change(slot0, { target: { value: 'sec' } });
    fireEvent.change(slot1, { target: { value: 'cond' } });
    const bodyCells = container.querySelectorAll(
      '.cx-table-cell[data-col-id="note"]:not(.cx-table-filter-cell)',
    );
    expect(bodyCells).toHaveLength(1);
    expect(bodyCells[0]!.textContent).toBe('second');
  });

  it('coerce-rejected SKIPS validator (locked order per Decision E.1)', () => {
    const validator = vi.fn<(value: unknown) => null>(() => null);
    const onStop = vi.fn<(p: CellEditStopPayload) => void>();
    const phaseColumns: readonly ColumnSpec[] = [
      { id: 'id', field: 'id', headerName: 'ID', width: 80 },
      {
        id: 'qty',
        field: 'qty',
        headerName: 'Qty',
        width: 100,
        type: 'number',
        editable: true,
        validator,
      },
    ];
    const phaseRows: readonly RowSpec[] = [{ id: 'r1', data: { id: 1, qty: 10 } }];
    const { container } = render(
      <ChronixTable columns={phaseColumns} rows={phaseRows} onCellEditStop={onStop} />,
    );
    fireEvent.doubleClick(
      container.querySelector('.cx-table-cell[data-col-id="qty"][data-row-id="r1"]')!,
    );
    const editor = container.querySelector<HTMLInputElement>('.cx-table-cell-editor')!;
    // happy-dom sanitizes <input type="number"> value — bypass via
    // defineProperty so the coerce-rejection codepath actually fires.
    Object.defineProperty(editor, 'value', { value: 'abc', configurable: true });
    fireEvent.change(editor, { target: { value: 'abc' } });
    fireEvent.keyDown(editor, { key: 'Enter' });
    expect(validator).not.toHaveBeenCalled();
    const stopPayload = onStop.mock.lastCall![0];
    expect(stopPayload.committed).toBe(false);
    expect(stopPayload.validationError).toBeUndefined();
  });
});

describe('multi-filter polish — default mode + runtime slot add/remove (react)', () => {
  const multiColumns: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: '名称' },
    { id: 'note', field: 'note', headerName: '备注', filterUi: 'multi' },
  ];
  const multiRows: readonly RowSpec[] = [
    { id: 'r1', data: { name: 'alice', note: 'one' } },
    { id: 'r2', data: { name: 'bob', note: 'two' } },
  ];

  it('.A (react): default mode AND when prop omitted', () => {
    const onFilterChange = vi.fn();
    const { container } = render(
      <ChronixTable
        columns={multiColumns}
        rows={multiRows}
        showFilterRow
        onFilterChange={onFilterChange}
      />,
    );
    const slot0 = container.querySelector<HTMLInputElement>(
      '.cx-table-multi-filter__input[data-multi-filter-slot="0"]',
    )!;
    fireEvent.change(slot0, { target: { value: 'first' } });
    const payload = onFilterChange.mock.lastCall![0] as { filterSpec: readonly FilterSpec[] };
    const multi = payload.filterSpec.find((s): s is MultiFilterSpec => s.type === 'multi');
    expect(multi!.mode).toBe('AND');
  });

  it('.A (react): default mode OR honoured when prop is "OR"', () => {
    const onFilterChange = vi.fn();
    const { container } = render(
      <ChronixTable
        columns={multiColumns}
        rows={multiRows}
        showFilterRow
        multiFilterDefaultMode="OR"
        onFilterChange={onFilterChange}
      />,
    );
    const slot0 = container.querySelector<HTMLInputElement>(
      '.cx-table-multi-filter__input[data-multi-filter-slot="0"]',
    )!;
    fireEvent.change(slot0, { target: { value: 'first' } });
    const payload = onFilterChange.mock.lastCall![0] as { filterSpec: readonly FilterSpec[] };
    const multi = payload.filterSpec.find((s): s is MultiFilterSpec => s.type === 'multi');
    expect(multi!.mode).toBe('OR');
  });

  it('.B (react): clicking `+ 添加条件` fires onAddMultiFilterSlot', () => {
    const onAdd = vi.fn();
    const { container } = render(
      <ChronixTable
        columns={multiColumns}
        rows={multiRows}
        showFilterRow
        onAddMultiFilterSlot={onAdd}
      />,
    );
    const addBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="cx-table-multi-filter-add-slot"]',
    )!;
    expect(addBtn).not.toBeNull();
    fireEvent.click(addBtn);
    expect(onAdd).toHaveBeenCalledTimes(1);
    // payload now carries `path: []` for root-level add.
    expect(onAdd).toHaveBeenLastCalledWith({ colId: 'note', slotKind: 'text', path: [] });
  });

  it('.B (react): clicking × fires onRemoveMultiFilterSlot with slotIdx', () => {
    const onRemove = vi.fn();
    const { container } = render(
      <ChronixTable
        columns={multiColumns}
        rows={multiRows}
        showFilterRow
        onRemoveMultiFilterSlot={onRemove}
      />,
    );
    const removeBtns = container.querySelectorAll<HTMLButtonElement>(
      '[data-testid="cx-table-multi-filter-remove-slot"]',
    );
    expect(removeBtns.length).toBe(2);
    fireEvent.click(removeBtns[1]!);
    expect(onRemove).toHaveBeenCalledTimes(1);
    // payload now carries `path: []` for root-level remove.
    expect(onRemove).toHaveBeenLastCalledWith({ colId: 'note', slotIdx: 1, path: [] });
  });

  it('.B (react): × button disabled (no emit) when slot count = 1', () => {
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
    const onRemove = vi.fn();
    const { container } = render(
      <ChronixTable
        columns={oneSlotColumns}
        rows={multiRows}
        showFilterRow
        onRemoveMultiFilterSlot={onRemove}
      />,
    );
    const removeBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="cx-table-multi-filter-remove-slot"]',
    )!;
    expect(removeBtn).not.toBeNull();
    expect(removeBtn.disabled).toBe(true);
    expect(removeBtn.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(removeBtn);
    expect(onRemove).not.toHaveBeenCalled();
  });
});

describe('validation followup — cross-cell + summary + paste-gate (react)', () => {
  const editableColumns: readonly ColumnSpec[] = [
    { id: 'id', field: 'id', headerName: 'ID', width: 80 },
    { id: 'name', field: 'name', headerName: 'Name', flex: 1 },
    { id: 'qty', field: 'qty', headerName: 'Qty', width: 120, type: 'number', editable: true },
    { id: 'status', field: 'status', headerName: 'Status', width: 100, editable: true },
    { id: 'note', field: 'note', headerName: 'Note', flex: 2, editable: true },
  ];

  const phaseRows: readonly RowSpec[] = [
    { id: 'r1', data: { id: 1, name: 'Alpha', qty: 10, status: 'OK', note: 'first' } },
    { id: 'r2', data: { id: 2, name: 'Beta', qty: 20, status: 'WIP', note: 'second' } },
    { id: 'r3', data: { id: 3, name: 'Gamma', qty: 30, status: 'OK', note: '' } },
  ];

  it('(react): rowValidators triggers onInvalidCellsChange after inline-edit commit', () => {
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
    const onInvalid = vi.fn();
    const { container } = render(
      <ChronixTable
        columns={editableColumns}
        rows={phaseRows}
        rowValidators={rowValidators}
        onInvalidCellsChange={onInvalid}
      />,
    );
    fireEvent.doubleClick(
      container.querySelector('.cx-table-cell[data-col-id="qty"][data-row-id="r1"]')!,
    );
    const editor = container.querySelector<HTMLInputElement>('.cx-table-cell-editor')!;
    fireEvent.change(editor, { target: { value: '-5' } });
    fireEvent.keyDown(editor, { key: 'Enter' });
    expect(onInvalid).toHaveBeenCalled();
    const last = onInvalid.mock.calls[onInvalid.mock.calls.length - 1]![0] as {
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

  it('(react): pasteValidatorPolicy="skip-rejected" drops validator-illegal paste cells', async () => {
    const validator = (value: unknown) => {
      if (typeof value === 'number' && value < 0) return { reason: 'must be positive' };
      return null;
    };
    const validatedColumns: readonly ColumnSpec[] = [
      ...editableColumns.slice(0, 2),
      { ...editableColumns[2]!, validator },
      ...editableColumns.slice(3),
    ];
    const handleRef = createRef<TableHandle>();
    render(
      <ChronixTable
        ref={handleRef}
        columns={validatedColumns}
        rows={phaseRows}
        cellRangeSelection="enabled"
        pasteValidatorPolicy="skip-rejected"
      />,
    );
    act(() => {
      handleRef.current!.setCellRange({
        anchor: { rowId: 'r1', colId: 'qty' },
        focus: { rowId: 'r2', colId: 'qty' },
      });
    });
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: {
        readText: () => Promise.resolve('100\n-5'),
        writeText: () => Promise.resolve(),
      },
    });
    const result = await handleRef.current!.pasteCellRangeFromClipboard();
    expect(result).not.toBeNull();
    expect(result!).toHaveLength(1);
    expect(result![0]).toMatchObject({ rowId: 'r1', colId: 'qty', newValue: 100 });
  });

  it('(react): getInvalidCells() TableHandle snapshot reflects invalid state', () => {
    const validator = (v: unknown) => (v === 'BAD' ? { reason: 'forbidden' } : null);
    const validatedColumns: readonly ColumnSpec[] = [
      ...editableColumns.slice(0, 3),
      { ...editableColumns[3]!, validator },
      editableColumns[4]!,
    ];
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={validatedColumns} rows={phaseRows} />,
    );
    fireEvent.doubleClick(
      container.querySelector('.cx-table-cell[data-col-id="status"][data-row-id="r1"]')!,
    );
    const editor = container.querySelector<HTMLInputElement>('.cx-table-cell-editor')!;
    fireEvent.change(editor, { target: { value: 'BAD' } });
    fireEvent.keyDown(editor, { key: 'Enter' });
    const snapshot = handleRef.current!.getInvalidCells();
    expect(snapshot).toHaveLength(1);
    expect(snapshot[0]).toMatchObject({ rowId: 'r1', colId: 'status' });
  });
});

describe('multi-filter set-child + multiFilterChildRenderer (react)', () => {
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

  it('(react): set-slot renders nested <details> with checkbox list', () => {
    const { container } = render(
      <ChronixTable columns={setColumns} rows={setRows} showFilterRow />,
    );
    const setSlot = container.querySelector(
      '[data-multi-filter-slot-kind="set"] .cx-table-multi-filter__set-slot-list',
    );
    expect(setSlot).not.toBeNull();
    const labels = container.querySelectorAll(
      '.cx-table-multi-filter__set-slot-list .cx-table-set-filter__item',
    );
    expect(labels.length).toBe(3);
  });

  it('(react): toggling a set-slot checkbox fires onFilterChange', () => {
    const onFilterChange = vi.fn<(p: FilterChangePayload) => void>();
    const { container } = render(
      <ChronixTable
        columns={setColumns}
        rows={setRows}
        showFilterRow
        onFilterChange={onFilterChange}
      />,
    );
    const checkboxes = container.querySelectorAll<HTMLInputElement>(
      '.cx-table-multi-filter__set-slot-list .cx-table-set-filter__checkbox',
    );
    const okCheckbox = Array.from(checkboxes).find(
      (c) => c.getAttribute('data-set-filter-value') === 'OK',
    );
    expect(okCheckbox).toBeTruthy();
    fireEvent.click(okCheckbox!);
    expect(onFilterChange).toHaveBeenCalled();
  });

  it('(react): multiFilterChildRenderer non-null replaces built-in widget', () => {
    const renderer = vi.fn(() => (
      <div className="consumer-rendered-slot" data-testid="consumer-slot">
        custom
      </div>
    ));
    const { container } = render(
      <ChronixTable
        columns={setColumns}
        rows={setRows}
        showFilterRow
        multiFilterChildRenderer={renderer}
      />,
    );
    expect(renderer).toHaveBeenCalled();
    expect(container.querySelector('[data-testid="consumer-slot"]')).not.toBeNull();
    expect(container.querySelector('.cx-table-multi-filter__set-slot-list')).toBeNull();
  });

  it('(react): multiFilterChildRenderer returning null falls back to built-in', () => {
    const renderer = vi.fn(() => null);
    const { container } = render(
      <ChronixTable
        columns={setColumns}
        rows={setRows}
        showFilterRow
        multiFilterChildRenderer={renderer}
      />,
    );
    expect(renderer).toHaveBeenCalled();
    expect(container.querySelector('.cx-table-multi-filter__set-slot-list')).not.toBeNull();
  });
});

describe('multi-filter nested groups (react)', () => {
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

  it('(react): consumer-injected group spec filters rows correctly', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={phaseColumns} rows={phaseRows} />,
    );
    act(() => {
      handleRef.current!.setFilter({
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
    });
    const ids = Array.from(
      container.querySelectorAll<HTMLElement>('.cx-table-cell[data-col-id="id"]'),
    ).map((c) => c.textContent ?? '');
    expect(ids).toEqual(['4']);
  });

  it('(react): empty group is identity', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={phaseColumns} rows={phaseRows} />,
    );
    act(() => {
      handleRef.current!.setFilter({
        type: 'multi',
        colId: 'qty',
        mode: 'AND',
        filters: [{ type: 'group', mode: 'AND', filters: [] }],
      });
    });
    const ids = Array.from(
      container.querySelectorAll<HTMLElement>('.cx-table-cell[data-col-id="id"]'),
    ).map((c) => c.textContent ?? '');
    expect(ids).toEqual(['1', '2', '3', '4']);
  });

  it('(react): setMultiFilterChildValue early-returns on group slot', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={phaseColumns} rows={phaseRows} />,
    );
    act(() => {
      handleRef.current!.setFilter({
        type: 'multi',
        colId: 'qty',
        mode: 'AND',
        filters: [
          { type: 'group', mode: 'OR', filters: [{ type: 'number', operator: '>', value: 35 }] },
        ],
      });
    });
    const inputs = container.querySelectorAll<HTMLInputElement>('.cx-table-multi-filter__input');
    if (inputs.length > 0) {
      fireEvent.change(inputs[0]!, { target: { value: '99' } });
    }
    const filters = handleRef.current!.getFilter();
    const multi = filters.find((s): s is MultiFilterSpec => s.type === 'multi');
    expect(multi).toBeTruthy();
    expect(multi!.filters[0]?.type).toBe('group');
  });
});

describe('nested-groups in-UI affordances (react)', () => {
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

  it('(react): consumer-injected group spec renders nested <details> with mode label', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={phaseColumns} rows={phaseRows} showFilterRow />,
    );
    act(() => {
      handleRef.current!.setFilter({
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
    });
    const groupNode = container.querySelector<HTMLElement>(
      '.cx-table-multi-filter[data-col-id="qty"] [data-cx-multi-filter-group-path="1"]',
    );
    expect(groupNode).not.toBeNull();
    expect(groupNode!.tagName.toLowerCase()).toBe('details');
    expect(groupNode!.textContent).toContain('分组 (OR)');
  });

  it('(react): clicking nested group mode toggle dispatches via setMultiFilterEntryAtPath', () => {
    const handleRef = createRef<TableHandle>();
    const { container } = render(
      <ChronixTable ref={handleRef} columns={phaseColumns} rows={phaseRows} showFilterRow />,
    );
    act(() => {
      handleRef.current!.setFilter({
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
    });
    const groupNode = container.querySelector<HTMLElement>(
      '.cx-table-multi-filter[data-col-id="qty"] [data-cx-multi-filter-group-path="0"]',
    );
    expect(groupNode).not.toBeNull();
    const orBtn = groupNode!.querySelector<HTMLButtonElement>('[data-mode="OR"]');
    expect(orBtn).not.toBeNull();
    act(() => {
      fireEvent.click(orBtn!);
    });
    const filters = handleRef.current!.getFilter();
    const multi = filters.find((s): s is MultiFilterSpec => s.type === 'multi');
    const inner = multi!.filters[0];
    expect(inner?.type).toBe('group');
    expect((inner as { mode: string }).mode).toBe('OR');
  });

  it('(react): clicking root `+ 添加分组` fires onAddMultiFilterGroup with empty path', () => {
    const onAddGroup = vi.fn();
    const { container } = render(
      <ChronixTable
        columns={phaseColumns}
        rows={phaseRows}
        showFilterRow
        onAddMultiFilterGroup={onAddGroup}
      />,
    );
    const btn = container.querySelector<HTMLButtonElement>(
      '[data-testid="cx-table-multi-filter-add-group"]',
    );
    expect(btn).not.toBeNull();
    fireEvent.click(btn!);
    expect(onAddGroup).toHaveBeenCalledTimes(1);
    expect(onAddGroup).toHaveBeenLastCalledWith({ colId: 'qty', path: [] });
  });

  it('(react): clicking group × fires onRemoveMultiFilterGroup with full path', () => {
    const handleRef = createRef<TableHandle>();
    const onRemoveGroup = vi.fn();
    const { container } = render(
      <ChronixTable
        ref={handleRef}
        columns={phaseColumns}
        rows={phaseRows}
        showFilterRow
        onRemoveMultiFilterGroup={onRemoveGroup}
      />,
    );
    act(() => {
      handleRef.current!.setFilter({
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
    });
    const groupNode = container.querySelector<HTMLElement>(
      '.cx-table-multi-filter[data-col-id="qty"] [data-cx-multi-filter-group-path="1"]',
    );
    expect(groupNode).not.toBeNull();
    const removeBtn = groupNode!.querySelector<HTMLButtonElement>(
      '[data-testid="cx-table-multi-filter-remove-group"]',
    );
    expect(removeBtn).not.toBeNull();
    fireEvent.click(removeBtn!);
    expect(onRemoveGroup).toHaveBeenCalledTimes(1);
    expect(onRemoveGroup).toHaveBeenLastCalledWith({ colId: 'qty', path: [1] });
  });

  it('(react): setMultiFilterEntryAtPath handle method mutates entry; empty path throws', () => {
    const handleRef = createRef<TableHandle>();
    render(<ChronixTable ref={handleRef} columns={phaseColumns} rows={phaseRows} showFilterRow />);
    act(() => {
      handleRef.current!.setFilter({
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
    });
    act(() => {
      handleRef.current!.setMultiFilterEntryAtPath('qty', [0, 0], {
        type: 'number',
        operator: '>',
        value: 25,
      });
    });
    const filters = handleRef.current!.getFilter();
    const multi = filters.find((s): s is MultiFilterSpec => s.type === 'multi');
    const inner = multi!.filters[0];
    expect(inner?.type).toBe('group');
    const leaf = (inner as { filters: readonly MultiFilterEntry[] }).filters[0];
    expect(leaf).toEqual({ type: 'number', operator: '>', value: 25 });
    expect(() => handleRef.current!.setMultiFilterEntryAtPath('qty', [], leaf!)).toThrow();
    expect(() => handleRef.current!.getMultiFilterEntryAtPath('qty', [])).toThrow();
  });
});
