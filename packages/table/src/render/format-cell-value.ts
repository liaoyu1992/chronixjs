import type { CellValueArgs } from './cell-args.js';

/**
 * Default value stringifier. — ports the
 * adapter-local `formatCellPrimitive` helper into the
 * core so all chronix-table consumers share the same fallback
 * formatting.
 *
 * Narrowing rules:
 *
 * - Nullish (null / undefined) → empty string.
 * - String passes through.
 * - Number / boolean / bigint → `String(value)`.
 * - Date → ISO string (toISOString).
 * - Anything else (plain objects, arrays, class instances without an
 *   overridden `toString`) → placeholder `'[object]'`. Surfaces
 *   missing-`valueFormatter` wiring in development; consumers see
 *   the placeholder + know to add a formatter.
 */
export function defaultFormatCellValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();
  return '[object]';
}

/**
 * Extract a cell's raw value from its row, applying `valueGetter` if
 * the column declares one. .
 *
 * **Pipeline**:
 *
 * 1. If `column.valueGetter` is set → call it with `{row, column}`,
 *    return the result.
 * 2. Otherwise → return `row.data[column.field ?? column.id]`. The
 *    `column.field` field is optional; when omitted, the column's
 *    `id` doubles as the row-data property name.
 *
 * Pure function; safe to call any number of times per cell render.
 * Callers that need both the value AND a formatted string can call
 * `getCellValue` once + reuse the result via `formatCellValue` (the
 * formatter accepts a pre-computed value via its args object).
 */
export function getCellValue(args: CellValueArgs): unknown {
  const { row, column } = args;
  if (column.valueGetter) return column.valueGetter({ row, column });
  const field = column.field ?? column.id;
  return row.data[field];
}

/**
 * Resolve a cell's display string. .
 *
 * **Pipeline**:
 *
 * 1. Extract value via `getCellValue({row, column})` (applies
 *    `valueGetter` or default field-based extraction).
 * 2. If `column.valueFormatter` is set → call it with `{value, row,
 *    column}`, return the formatted string.
 * 3. Otherwise → `defaultFormatCellValue(value)`.
 *
 * Pure function. Adapters call this per cell per render.
 */
export function formatCellValue(args: CellValueArgs): string {
  const value = getCellValue(args);
  const { row, column } = args;
  if (column.valueFormatter) return column.valueFormatter({ value, row, column });
  return defaultFormatCellValue(value);
}
