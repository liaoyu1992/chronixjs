/**
 * chronix-curated subset of exceljs's per-cell
 * style fields. Consumers attach this to a `ColumnSpec.exportStyle?`
 * field; `exportToXlsx` threads it through to exceljs's `Cell.style`
 * for body cells (header row preserves Decision C.1 bold-row
 * default).
 *
 * Field selection optimizes for the most common consumer styling
 * needs (color / bold / number format / alignment) while keeping the
 * public surface small. Fields not listed here can be added in
 * follow-up phases; the type shape is intentionally additive (every
 * field is optional).
 */
export interface ExportStyle {
  readonly font?: ExportStyleFont;
  readonly fill?: ExportStyleFill;
  readonly alignment?: ExportStyleAlignment;
  readonly border?: ExportStyleBorder;
  /**
   * Excel number-format string. Examples:
   * - `'#,##0.00'` — two-decimal number with thousands separator
   * - `'0.00%'` — percent with two decimals
   * - `'yyyy-mm-dd'` — ISO date
   * - `'[Red]-#,##0;[Black]#,##0'` — conditional color by sign
   *
   * Passed through to exceljs verbatim; invalid Excel format strings
   * render as-is (Excel handles the error). chronix doesn't validate.
   */
  readonly numberFormat?: string;
}

export interface ExportStyleFont {
  /** ARGB hex like `'#FF0000'` or `'#FFFF0000'`. Excel internal: `'FFFF0000'`. */
  readonly color?: string;
  readonly bold?: boolean;
  readonly italic?: boolean;
  /** Font point size, e.g., 11 / 12 / 14. */
  readonly size?: number;
  /** Font family name, e.g., `'Calibri'` / `'Arial'`. */
  readonly name?: string;
}

export interface ExportStyleFill {
  /** ARGB hex like `'#FFFF00'` or `'#FFFFFF00'`. Excel internal: `'FFFFFF00'`. */
  readonly bgColor?: string;
}

export interface ExportStyleAlignment {
  readonly horizontal?: 'left' | 'center' | 'right';
  readonly vertical?: 'top' | 'middle' | 'bottom';
  readonly wrapText?: boolean;
}

export interface ExportStyleBorder {
  /** When true, draws a thin black border on that edge. */
  readonly top?: boolean;
  readonly right?: boolean;
  readonly bottom?: boolean;
  readonly left?: boolean;
}

/**
 * Internal exceljs `Cell.style` shape (subset). Mirrors exceljs's
 * runtime structure for the fields we actually translate. Kept in
 * sync with `mapExportStyleToExcelJs` below.
 */
export interface ExcelJsCellStyle {
  font?: {
    color?: { argb: string };
    bold?: boolean;
    italic?: boolean;
    size?: number;
    name?: string;
  };
  fill?: {
    type: 'pattern';
    pattern: 'solid';
    fgColor: { argb: string };
  };
  alignment?: {
    horizontal?: 'left' | 'center' | 'right';
    vertical?: 'top' | 'middle' | 'bottom';
    wrapText?: boolean;
  };
  border?: {
    top?: { style: 'thin'; color: { argb: string } };
    right?: { style: 'thin'; color: { argb: string } };
    bottom?: { style: 'thin'; color: { argb: string } };
    left?: { style: 'thin'; color: { argb: string } };
  };
  numFmt?: string;
}

const DEFAULT_BORDER_ARGB = 'FF000000';

/**
 * translate a chronix `ExportStyle` into the
 * exceljs `Cell.style` shape. Pure function; only sets fields present
 * in the input (the result has no false-y defaults that would
 * accidentally override exceljs's column-default styles).
 *
 * Color normalization: chronix accepts `'#RRGGBB'` (6-hex) /
 * `'#AARRGGBB'` (8-hex) / bare `'RRGGBB'` / bare `'AARRGGBB'`.
 * exceljs expects bare `'AARRGGBB'` (alpha first). 6-hex inputs are
 * padded with `FF` alpha prefix (fully opaque).
 */
export function mapExportStyleToExcelJs(style: ExportStyle): ExcelJsCellStyle {
  const out: ExcelJsCellStyle = {};

  if (style.font != null) {
    const font: NonNullable<ExcelJsCellStyle['font']> = {};
    if (style.font.color != null) font.color = { argb: normalizeArgb(style.font.color) };
    if (style.font.bold != null) font.bold = style.font.bold;
    if (style.font.italic != null) font.italic = style.font.italic;
    if (style.font.size != null) font.size = style.font.size;
    if (style.font.name != null) font.name = style.font.name;
    out.font = font;
  }

  if (style.fill?.bgColor != null) {
    out.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: normalizeArgb(style.fill.bgColor) },
    };
  }

  if (style.alignment != null) {
    const alignment: NonNullable<ExcelJsCellStyle['alignment']> = {};
    if (style.alignment.horizontal != null) alignment.horizontal = style.alignment.horizontal;
    if (style.alignment.vertical != null) alignment.vertical = style.alignment.vertical;
    if (style.alignment.wrapText != null) alignment.wrapText = style.alignment.wrapText;
    out.alignment = alignment;
  }

  if (style.border != null) {
    const border: NonNullable<ExcelJsCellStyle['border']> = {};
    if (style.border.top === true) border.top = thinBorder();
    if (style.border.right === true) border.right = thinBorder();
    if (style.border.bottom === true) border.bottom = thinBorder();
    if (style.border.left === true) border.left = thinBorder();
    out.border = border;
  }

  if (style.numberFormat != null) out.numFmt = style.numberFormat;

  return out;
}

function thinBorder(): { style: 'thin'; color: { argb: string } } {
  return { style: 'thin', color: { argb: DEFAULT_BORDER_ARGB } };
}

/**
 * Normalize a CSS-style hex color into exceljs's bare-ARGB form.
 *
 * Accepted inputs:
 * - `'#RRGGBB'` → `'FFRRGGBB'` (full opacity prefix)
 * - `'#AARRGGBB'` → `'AARRGGBB'`
 * - `'RRGGBB'` → `'FFRRGGBB'`
 * - `'AARRGGBB'` → `'AARRGGBB'`
 *
 * Other forms (named colors, `rgb()`, 3-hex shorthand) are returned
 * upper-cased unchanged — exceljs will fail at render time. chronix
 * doesn't validate beyond stripping the leading `#`.
 */
function normalizeArgb(input: string): string {
  const hex = input.startsWith('#') ? input.slice(1) : input;
  const upper = hex.toUpperCase();
  if (upper.length === 6) return `FF${upper}`;
  return upper;
}
