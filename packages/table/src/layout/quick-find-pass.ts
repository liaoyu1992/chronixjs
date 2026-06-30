import { getCellValue } from '../render/format-cell-value.js';

import type { ColumnSpec, RowSpec } from '../ir/index.js';

/**
 * Input to `quickFindPass` (2026-05-29).
 *
 * `quickFindText` is the user's search input. Empty / null / undefined /
 * whitespace-only text is the identity case (no rows excluded). Other
 * values are lowercased once + matched as a substring against every
 * `filterable !== false` column's stringified cell value (cross-column
 * OR — a row is retained when ANY column contains the needle).
 *
 * The pass needs the `columns` array so it can honor each column's
 * `filterable` flag + `valueGetter` and stay consistent with `filterPass`
 * . Cell-value coercion mirrors `filterPass.coerceToText`:
 * string / number / boolean / bigint / `Date.toISOString()` → string;
 * object / function / symbol / null / undefined → contributes nothing to
 * the OR (those columns can't match).
 */
export interface QuickFindPassInput {
  readonly rows: readonly RowSpec[];
  readonly quickFindText: string | null | undefined;
  readonly columns: readonly ColumnSpec[];
}

/**
 * Output of `quickFindPass`.
 *
 * `filteredRows` is a NEW array when the pass actually filters; when
 * the needle is empty / nullish / blank, the input array is returned
 * by reference (consumers can identity-check the result to skip
 * downstream work).
 *
 * `quickFindForceExpandedRowIds` (mirrors `filterPass.filterForceExpandedRowIds`):
 * row IDs of ancestors whose descendants matched the needle while the
 * ancestor itself did NOT match. Empty when no needle is active or
 * when no row carries `children`. Adapters union this set with the
 * user's `expandedRowIds` AND `filterForceExpandedRowIds` before
 * calling `treeFlattenPass`, so matched descendants are visible
 * regardless of manual collapse state.
 *
 * `matchCount` is the top-level retained row count after filter +
 * tree pruning. Adapters surface it as the "X of Y matches" indicator.
 * Counts ancestors retained only because of a descendant match (those
 * ancestors are present in `filteredRows`) so the count matches what
 * the user sees on screen.
 */
export interface QuickFindPassResult {
  readonly filteredRows: readonly RowSpec[];
  readonly quickFindForceExpandedRowIds: readonly string[];
  readonly matchCount: number;
}

/**
 * Filter rows by a single case-insensitive substring needle matched
 * across every `filterable !== false` column (cross-column OR).
 *
 * Algorithm:
 *
 * 1. **Empty / null / blank needle** → identity. Returns
 *    `{filteredRows: rows, quickFindForceExpandedRowIds: [], matchCount: rows.length}`.
 *    The match count for the identity case is the input row count so
 *    consumers can render "X of Y" without a special case.
 * 2. **Column resolution**. Filter `columns` to those with
 *    `filterable !== false`. When zero columns qualify (every column
 *    opted out), return `{filteredRows: [], ..., matchCount: 0}` —
 *    no column can contribute a match.
 * 3. **Per-row OR walk**. A row matches when ANY contributing column's
 *    stringified value contains the lowercased needle. Tree-aware:
 *    when any row has `children`, recurse via `filterTreeRows`
 *    (mirrors filter-pass).
 * 4. Return `{filteredRows, quickFindForceExpandedRowIds, matchCount}`.
 *
 * **Pure function.** No mutation of inputs.
 */
export function quickFindPass(input: QuickFindPassInput): QuickFindPassResult {
  const { rows, quickFindText, columns } = input;

  // Identity: empty / null / blank needle → no filtering.
  if (quickFindText == null) {
    return { filteredRows: rows, quickFindForceExpandedRowIds: [], matchCount: rows.length };
  }
  const trimmed = quickFindText.trim();
  if (trimmed === '') {
    return { filteredRows: rows, quickFindForceExpandedRowIds: [], matchCount: rows.length };
  }

  const needle = trimmed.toLowerCase();

  // Resolve contributing columns once. When none qualify, every row
  // is excluded (no column can contribute a match).
  const contributingColumns = columns.filter((c) => c.filterable !== false);
  if (contributingColumns.length === 0) {
    return { filteredRows: [], quickFindForceExpandedRowIds: [], matchCount: 0 };
  }

  const rowMatches = (row: RowSpec): boolean => {
    for (const column of contributingColumns) {
      const raw = getCellValue({ row, column });
      const text = coerceToText(raw);
      if (text == null) continue;
      if (text.toLowerCase().includes(needle)) return true;
    }
    return false;
  };

  // Tree-aware path: when any row has children, walk recursively so
  // ancestors of matching descendants are preserved + force-expanded.
  if (hasAnyChildren(rows)) {
    const forceExpanded: string[] = [];
    const filteredRows = filterTreeRows(rows, rowMatches, forceExpanded);
    return {
      filteredRows,
      quickFindForceExpandedRowIds: forceExpanded,
      matchCount: filteredRows.length,
    };
  }

  const filteredRows = rows.filter(rowMatches);
  return { filteredRows, quickFindForceExpandedRowIds: [], matchCount: filteredRows.length };
}

/**
 * Tree-aware filter walk. Returns the pruned tree where every retained
 * ancestor either matches the needle OR has at least one matching
 * descendant. Ancestors retained ONLY because of a descendant match
 * are pushed into `forceExpanded` (the caller unions this with the
 * user's expandedRowIds so the matching descendants are visible
 * regardless of manual collapse state).
 *
 * Pure-recursive — depth is bounded by tree depth. Mirrors
 * `filter-pass.ts`'s `filterTreeRows` shape so the two passes compose
 * predictably when both are active.
 */
function filterTreeRows(
  rows: readonly RowSpec[],
  rowMatches: (row: RowSpec) => boolean,
  forceExpanded: string[],
): readonly RowSpec[] {
  const out: RowSpec[] = [];
  for (const row of rows) {
    const selfMatches = rowMatches(row);
    const children = row.children;
    if (children != null && children.length > 0) {
      const prunedChildren = filterTreeRows(children, rowMatches, forceExpanded);
      if (prunedChildren.length > 0) {
        if (!selfMatches) forceExpanded.push(row.id);
        out.push({ ...row, children: prunedChildren });
        continue;
      }
      if (selfMatches) {
        out.push({ ...row, children: [] });
      }
    } else if (selfMatches) {
      out.push(row);
    }
  }
  return out;
}

/** Cheap top-level check: does ANY row carry children? */
function hasAnyChildren(rows: readonly RowSpec[]): boolean {
  for (const row of rows) {
    if (row.children != null && row.children.length > 0) return true;
  }
  return false;
}

/**
 * Narrow a cell value into a string for substring matching. Returns
 * `null` for values that can't be cleanly stringified — objects,
 * functions, symbols. Mirrors `filter-pass.ts`'s `coerceToText` so
 * quick-find + column filter agree on what each cell's "text" is.
 */
function coerceToText(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number' || typeof raw === 'boolean' || typeof raw === 'bigint') {
    return String(raw);
  }
  if (raw instanceof Date) return raw.toISOString();
  return null;
}
