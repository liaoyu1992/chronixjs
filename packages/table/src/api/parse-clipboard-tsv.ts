/**
 * Phase 20 (2026-05-27): pure TSV parser — Ctrl+V counterpart to
 * Phase 19's `formatCellRangeForClipboard`.
 *
 * Splits a tab-separated-values string into a 2D `string[][]` grid:
 *
 * - Line separator: `\n` OR `\r\n` (both normalized; matches Excel /
 *   Sheets / Notepad-on-Windows TSV output).
 * - Cell separator: `\t` (single tab character).
 * - Trailing newline trim: `"a\tb\n"` parses as `[['a', 'b']]` (one
 *   row, not one row + an empty row). Matches the universal TSV
 *   convention where copy-from-spreadsheet appends a trailing newline.
 * - Empty string: `[]` (zero rows; callers treat as no-op paste).
 *
 * **Pure function.** No DOM, no clipboard I/O — that is the adapter's
 * job (read `navigator.clipboard.readText()` then pass to this
 * parser). No coercion — every cell stays a raw string; type coercion
 * happens downstream in `computePasteMutations` via Phase 12's
 * `coerceEditDraftValue` per column type.
 */
export function parseClipboardTsv(text: string): readonly (readonly string[])[] {
  if (text === '') return [];
  // Drop EXACTLY one trailing newline (LF or CRLF) — TSV convention.
  // Subsequent trailing newlines stay, producing empty rows.
  let normalized = text;
  if (normalized.endsWith('\r\n')) {
    normalized = normalized.slice(0, -2);
  } else if (normalized.endsWith('\n')) {
    normalized = normalized.slice(0, -1);
  }
  if (normalized === '') return [];
  const lines = normalized.split(/\r\n|\n/);
  return lines.map((line) => line.split('\t'));
}
