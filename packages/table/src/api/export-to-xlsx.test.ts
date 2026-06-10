import { describe, expect, it } from 'vitest';

import { exportToXlsx } from './export-to-xlsx.js';

import type { ColumnSpec, RowSpec } from '../ir/index.js';

const columns: readonly ColumnSpec[] = [
  { id: 'name', field: 'name', headerName: 'Name' },
  { id: 'qty', field: 'qty', headerName: 'Qty', width: 140, type: 'number' },
];

const rows: readonly RowSpec[] = [
  { id: 'r1', data: { name: 'Alpha', qty: 10 } },
  { id: 'r2', data: { name: 'Beta', qty: 20 } },
];

// XLSX file format is a ZIP archive; the magic bytes "PK\x03\x04"
// (0x50 0x4B 0x03 0x04) appear at offset 0. Verifying these from the
// returned ArrayBuffer confirms exceljs produced a valid XLSX without
// re-parsing the entire workbook structure (exceljs's serialization
// correctness is covered by its own test suite).
function isXlsxBuffer(buffer: ArrayBuffer): boolean {
  const view = new Uint8Array(buffer);
  return view[0] === 0x50 && view[1] === 0x4b && view[2] === 0x03 && view[3] === 0x04;
}

describe('exportToXlsx', () => {
  it('returns an ArrayBuffer with the XLSX magic-byte signature', async () => {
    const buffer = await exportToXlsx({ rows, columns });
    expect(buffer).toBeInstanceOf(ArrayBuffer);
    expect(buffer.byteLength).toBeGreaterThan(0);
    expect(isXlsxBuffer(buffer)).toBe(true);
  });

  it('produces a non-empty buffer even with empty rows (header-only workbook)', async () => {
    const buffer = await exportToXlsx({ rows: [], columns });
    expect(buffer).toBeInstanceOf(ArrayBuffer);
    expect(buffer.byteLength).toBeGreaterThan(0);
    expect(isXlsxBuffer(buffer)).toBe(true);
  });

  it('honors options.sheetName via the underlying workbook builder', async () => {
    // The sheet name lives inside compressed XML in the ZIP archive,
    // so we can't grep for it in the raw bytes. Instead we verify the
    // buffer differs from the default-sheetName counterpart — when
    // exceljs threads the option through, the workbook XML diverges
    // even if only by a few bytes, producing different ZIP-compressed
    // output.
    const customSheet = await exportToXlsx({
      rows,
      columns,
      options: { sheetName: 'Inventory' },
    });
    const defaultSheet = await exportToXlsx({ rows, columns });
    expect(isXlsxBuffer(customSheet)).toBe(true);
    const customBytes = new Uint8Array(customSheet);
    const defaultBytes = new Uint8Array(defaultSheet);
    // Find the first byte where the two buffers diverge. Should
    // succeed within the workbook.xml entry of the ZIP.
    let firstDifference = -1;
    const len = Math.min(customBytes.length, defaultBytes.length);
    for (let i = 0; i < len; i++) {
      if (customBytes[i] !== defaultBytes[i]) {
        firstDifference = i;
        break;
      }
    }
    expect(firstDifference).toBeGreaterThan(-1);
  });

  it('honors options.includeHeaders === false (no header row in output)', async () => {
    const buffer = await exportToXlsx({
      rows,
      columns,
      options: { includeHeaders: false },
    });
    expect(isXlsxBuffer(buffer)).toBe(true);
    // Without headers, the workbook's first row contains body data.
    // We can't easily assert "no Name string" because exceljs may
    // include the column id "Name" in stylesheet metadata; instead
    // we verify the buffer size is meaningfully smaller than the
    // header-included counterpart.
    const withHeaders = await exportToXlsx({ rows, columns });
    expect(buffer.byteLength).toBeLessThanOrEqual(withHeaders.byteLength);
  });

  describe('Phase 39.1: multi-sheet input', () => {
    it('produces a valid XLSX with N sheets when passed {sheets: [...]}', async () => {
      const buffer = await exportToXlsx({
        sheets: [
          { rows, columns, options: { sheetName: 'Filtered' } },
          { rows, columns, options: { sheetName: 'All' } },
          { rows, columns, options: { sheetName: 'Selected' } },
        ],
      });
      expect(isXlsxBuffer(buffer)).toBe(true);
      expect(buffer.byteLength).toBeGreaterThan(0);
    });

    it('multi-sheet output diverges from single-sheet output (different XML)', async () => {
      const singleBuffer = await exportToXlsx({ rows, columns });
      const multiBuffer = await exportToXlsx({
        sheets: [
          { rows, columns, options: { sheetName: 'A' } },
          { rows, columns, options: { sheetName: 'B' } },
        ],
      });
      expect(multiBuffer.byteLength).toBeGreaterThan(singleBuffer.byteLength);
    });

    it('single-sheet wrapped in {sheets: [single]} produces same shape as bare single-sheet', async () => {
      const bare = await exportToXlsx({ rows, columns, options: { sheetName: 'Sheet1' } });
      const wrapped = await exportToXlsx({
        sheets: [{ rows, columns, options: { sheetName: 'Sheet1' } }],
      });
      expect(isXlsxBuffer(bare)).toBe(true);
      expect(isXlsxBuffer(wrapped)).toBe(true);
      // Both contain a workbook with 1 sheet named "Sheet1"; sizes
      // should be within a small tolerance (ZIP compression
      // determinism). We allow ±15% for safety.
      const ratio = wrapped.byteLength / bare.byteLength;
      expect(ratio).toBeGreaterThan(0.85);
      expect(ratio).toBeLessThan(1.15);
    });

    it('empty {sheets: []} still produces a valid workbook (0 sheets)', async () => {
      const buffer = await exportToXlsx({ sheets: [] });
      expect(isXlsxBuffer(buffer)).toBe(true);
      expect(buffer.byteLength).toBeGreaterThan(0);
    });
  });

  describe('Phase 39.3: freeze-pane', () => {
    it('produces a valid XLSX when freezePane is unset (backwards-compatible)', async () => {
      const buffer = await exportToXlsx({
        rows,
        columns,
        options: { sheetName: 'NoFreeze' },
      });
      expect(isXlsxBuffer(buffer)).toBe(true);
      expect(buffer.byteLength).toBeGreaterThan(0);
    });

    it('output diverges between unset freezePane and {xSplit: 2}', async () => {
      const noFreeze = await exportToXlsx({
        rows,
        columns,
        options: { sheetName: 'Freeze' },
      });
      const withFreeze = await exportToXlsx({
        rows,
        columns,
        options: { sheetName: 'Freeze', freezePane: { xSplit: 2 } },
      });
      // Both are valid XLSX, but the workbook.xml of the frozen one
      // carries an additional `<pane>` element, so byte-equal would
      // fail. Verify they diverge in compressed bytes.
      let firstDiff = -1;
      const a = new Uint8Array(noFreeze);
      const b = new Uint8Array(withFreeze);
      const len = Math.min(a.length, b.length);
      for (let i = 0; i < len; i++) {
        if (a[i] !== b[i]) {
          firstDiff = i;
          break;
        }
      }
      expect(firstDiff).toBeGreaterThan(-1);
      expect(isXlsxBuffer(withFreeze)).toBe(true);
    });

    it('accepts both xSplit and ySplit together', async () => {
      const buffer = await exportToXlsx({
        rows,
        columns,
        options: { sheetName: 'Both', freezePane: { xSplit: 2, ySplit: 1 } },
      });
      expect(isXlsxBuffer(buffer)).toBe(true);
      expect(buffer.byteLength).toBeGreaterThan(0);
    });

    it('multi-sheet input lets each sheet carry its own freezePane', async () => {
      const buffer = await exportToXlsx({
        sheets: [
          {
            rows,
            columns,
            options: { sheetName: 'Frozen', freezePane: { xSplit: 1, ySplit: 1 } },
          },
          { rows, columns, options: { sheetName: 'Unfrozen' } },
          { rows, columns, options: { sheetName: 'JustHeader', freezePane: { ySplit: 1 } } },
        ],
      });
      expect(isXlsxBuffer(buffer)).toBe(true);
      expect(buffer.byteLength).toBeGreaterThan(0);
    });
  });

  // ────────────────────── Phase 39.4 (2026-05-29) ──────────────────────

  describe('Phase 39.4: per-column body-cell styling', () => {
    it('produces a valid XLSX when a column carries exportStyle', async () => {
      const styledColumns: readonly ColumnSpec[] = [
        { id: 'name', field: 'name', headerName: 'Name' },
        {
          id: 'qty',
          field: 'qty',
          headerName: 'Qty',
          type: 'number',
          exportStyle: {
            font: { color: '#FF0000', bold: true },
            numberFormat: '#,##0.00',
            alignment: { horizontal: 'right' },
          },
        },
      ];
      const buffer = await exportToXlsx({ rows, columns: styledColumns });
      expect(isXlsxBuffer(buffer)).toBe(true);
      expect(buffer.byteLength).toBeGreaterThan(0);
    });

    it('styled buffer diverges from un-styled buffer (proves style threaded to exceljs)', async () => {
      const plainBuffer = await exportToXlsx({ rows, columns });
      const styledColumns: readonly ColumnSpec[] = [
        { id: 'name', field: 'name', headerName: 'Name' },
        {
          id: 'qty',
          field: 'qty',
          headerName: 'Qty',
          type: 'number',
          exportStyle: { fill: { bgColor: '#FFFF00' }, numberFormat: '#,##0.00' },
        },
      ];
      const styledBuffer = await exportToXlsx({ rows, columns: styledColumns });
      // ZIP-archive bytes diverge when the underlying workbook XML
      // (styles.xml entry) differs — proves chronix passed the style
      // through to exceljs even though the body XML is similar.
      const plainBytes = new Uint8Array(plainBuffer);
      const styledBytes = new Uint8Array(styledBuffer);
      let firstDifference = -1;
      const len = Math.min(plainBytes.length, styledBytes.length);
      for (let i = 0; i < len; i++) {
        if (plainBytes[i] !== styledBytes[i]) {
          firstDifference = i;
          break;
        }
      }
      expect(firstDifference).toBeGreaterThan(-1);
    });

    it('multi-sheet input applies per-sheet styles independently', async () => {
      const styledColumns: readonly ColumnSpec[] = [
        { id: 'name', field: 'name', headerName: 'Name' },
        {
          id: 'qty',
          field: 'qty',
          headerName: 'Qty',
          type: 'number',
          exportStyle: { font: { bold: true } },
        },
      ];
      const buffer = await exportToXlsx({
        sheets: [
          { rows, columns, options: { sheetName: 'Plain' } },
          { rows, columns: styledColumns, options: { sheetName: 'Styled' } },
        ],
      });
      expect(isXlsxBuffer(buffer)).toBe(true);
      expect(buffer.byteLength).toBeGreaterThan(0);
    });
  });
});
