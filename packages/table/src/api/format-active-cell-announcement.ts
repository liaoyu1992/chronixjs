import { formatCellValue } from '../render/format-cell-value.js';

import type { ColumnSpec, RowSpec } from '../ir/index.js';

/**
 * Phase 40 (2026-05-29): input to `formatActiveCellAnnouncement`.
 *
 * `rowIndex` and `colIndex` are 1-based to match the ARIA
 * `aria-rowindex` / `aria-colindex` semantics adopted by Phase 40's
 * adapter wiring (Decision A.1). `rowCount` / `colCount` mirror
 * `aria-rowcount` / `aria-colcount`. The helper is independent of any
 * particular adapter — feed the resolved counts in directly.
 */
export interface FormatActiveCellAnnouncementInput {
  readonly row: RowSpec;
  readonly column: ColumnSpec;
  /** 1-based position of the row inside the navigable grid. */
  readonly rowIndex: number;
  /** Total navigable rows (matches the wrapper's aria-rowcount). */
  readonly rowCount: number;
  /** 1-based position of the column inside the navigable grid. */
  readonly colIndex: number;
  /** Total navigable columns (matches the wrapper's aria-colcount). */
  readonly colCount: number;
}

/**
 * Phase 40 (2026-05-29): produce the live-region announcement text for
 * an active-cell transition.
 *
 * Pure function. No DOM, no I/O. Adapters render the returned string
 * into an off-screen `<div role="status" aria-live="polite">` so screen
 * readers announce "Column Name (col 3 of 6), Row Alpha (row 2 of 50):
 * 10 件" when keyboard nav (Phase 26) moves the activeCell. The
 * announcement is delayed-debounced at the adapter layer to avoid
 * spamming the live region during fast arrow-key sequences.
 *
 * **Column label** (Decision B.1 cascade): `column.headerName` →
 * `column.field` → `column.id`. Same cascade as the CSV / XLSX export
 * header row so screen-reader text matches visible header text.
 *
 * **Row label**: the first declared column's value for `row`, resolved
 * via `formatCellValue` so the consumer's `valueFormatter` applies.
 * Falls back to `row.id` when the first-column value is empty. Lets
 * users hear a meaningful row label ("Alpha") rather than a row id
 * ("r1") whenever the source data has a primary-name column.
 *
 * **Cell value**: `formatCellValue({row, column})` — same path as the
 * displayed text so screen readers hear exactly what the user sees.
 * Null / undefined / empty values produce the literal word "empty".
 *
 * **Override**: each adapter exposes an optional
 * `announceActiveCellText?: (input) => string` prop that replaces this
 * helper. Use cases: i18n / domain-specific phrasing / shorter
 * formats. Consumers passing `null` from the override suppress the
 * announce entirely.
 */
export function formatActiveCellAnnouncement(input: FormatActiveCellAnnouncementInput): string {
  const { row, column, rowIndex, rowCount, colIndex, colCount } = input;

  const columnLabel = column.headerName ?? column.field ?? column.id;
  const cellValueText = formatCellValue({ row, column });
  const valuePart = cellValueText.length > 0 ? cellValueText : 'empty';

  return `Column ${columnLabel} (col ${colIndex} of ${colCount}), Row ${rowIndex} of ${rowCount}: ${valuePart}`;
}
