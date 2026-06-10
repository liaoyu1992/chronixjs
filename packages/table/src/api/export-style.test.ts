import { describe, expect, it } from 'vitest';

import { mapExportStyleToExcelJs, type ExportStyle } from './export-style.js';

describe('mapExportStyleToExcelJs', () => {
  it('returns empty object for empty input', () => {
    const out = mapExportStyleToExcelJs({});
    expect(out).toEqual({});
  });

  it('maps font fields verbatim with ARGB normalization', () => {
    const input: ExportStyle = {
      font: { color: '#FF0000', bold: true, italic: true, size: 14, name: 'Calibri' },
    };
    const out = mapExportStyleToExcelJs(input);
    expect(out.font).toEqual({
      color: { argb: 'FFFF0000' },
      bold: true,
      italic: true,
      size: 14,
      name: 'Calibri',
    });
  });

  it('preserves 8-hex ARGB color as-is (alpha first)', () => {
    const out = mapExportStyleToExcelJs({ font: { color: '#80FF0000' } });
    expect(out.font?.color).toEqual({ argb: '80FF0000' });
  });

  it('accepts bare hex (no leading #) for color fields', () => {
    const out = mapExportStyleToExcelJs({
      font: { color: 'ff0000' },
      fill: { bgColor: 'ffff00' },
    });
    expect(out.font?.color?.argb).toBe('FFFF0000');
    expect(out.fill?.fgColor.argb).toBe('FFFFFF00');
  });

  it('maps fill bgColor to exceljs solid-pattern fgColor', () => {
    const out = mapExportStyleToExcelJs({ fill: { bgColor: '#FFFF00' } });
    expect(out.fill).toEqual({
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF00' },
    });
  });

  it('maps alignment fields verbatim', () => {
    const out = mapExportStyleToExcelJs({
      alignment: { horizontal: 'right', vertical: 'middle', wrapText: true },
    });
    expect(out.alignment).toEqual({ horizontal: 'right', vertical: 'middle', wrapText: true });
  });

  it('only sets border edges that are explicitly true (skip false / omitted)', () => {
    const out = mapExportStyleToExcelJs({
      border: { top: true, bottom: false, left: true },
    });
    expect(out.border?.top).toEqual({ style: 'thin', color: { argb: 'FF000000' } });
    expect(out.border?.left).toEqual({ style: 'thin', color: { argb: 'FF000000' } });
    expect(out.border?.bottom).toBeUndefined();
    expect(out.border?.right).toBeUndefined();
  });

  it('passes numberFormat through to numFmt verbatim', () => {
    const out = mapExportStyleToExcelJs({ numberFormat: '#,##0.00' });
    expect(out.numFmt).toBe('#,##0.00');
  });

  it('does not set unspecified top-level fields (no false-y defaults)', () => {
    const out = mapExportStyleToExcelJs({ font: { bold: true } });
    expect(out.fill).toBeUndefined();
    expect(out.alignment).toBeUndefined();
    expect(out.border).toBeUndefined();
    expect(out.numFmt).toBeUndefined();
  });

  it('does not include false-y font sub-fields when input only sets some', () => {
    const out = mapExportStyleToExcelJs({ font: { color: '#FF0000' } });
    expect(out.font).toEqual({ color: { argb: 'FFFF0000' } });
    expect(out.font?.bold).toBeUndefined();
    expect(out.font?.size).toBeUndefined();
  });
});
