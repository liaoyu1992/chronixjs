import { getCellValue } from '../render/format-cell-value.js';

import type { CellComparatorArgs, ColumnSpec, RowSpec, SortSpec } from '../ir/index.js';

/**
 * Input to `sortPass`.
 *
 * shipped single-column sort;
 * (2026-05-24) widens `sortSpec` to `readonly SortSpec[]` for
 * lex-order multi-column sort. An empty array (or null / undefined)
 * is the identity case.
 *
 * The pass needs the `columns` array (not just the active columns)
 * so it can look up each entry's column by `colId` + honor each
 * column's `sortable` / `comparator` / `valueGetter`.
 */
export interface SortPassInput {
  readonly rows: readonly RowSpec[];
  readonly sortSpec: readonly SortSpec[] | null | undefined;
  readonly columns: readonly ColumnSpec[];
}

/**
 * Output of `sortPass`.
 *
 * `sortedRows` is a NEW array when the pass actually re-orders; when
 * the spec is empty / nullish OR the spec rejects, the input array
 * is returned by reference (consumers can identity-check the result
 * to skip downstream work).
 *
 * `rejected` is `true` when ANY entry in the spec referenced a
 * non-existent `colId` OR a column with `sortable: false`. Atomic
 * rejection.1 doesn't surface per-entry rejection because
 * the calling SFC's click handler always normalizes the spec first
 * (a column with `sortable: false` cannot be added to the array via
 * the SFC). The flag protects against consumers wiring a
 * programmatic `setSort` that contains an invalid colId.
 */
export interface SortPassResult {
  readonly sortedRows: readonly RowSpec[];
  readonly rejected: boolean;
}

/**
 * Reorder rows by an ordered list of sort keys (lex-order).
 *
 * Algorithm:
 *
 * 1. **Empty / null spec** → identity. Returns
 *    `{sortedRows: rows, rejected: false}`.
 * 2. **Column lookup phase**. Walk the spec array; for each entry
 *    resolve the matching column. When ANY entry's `colId` is
 *    unknown OR the column has `sortable === false`, return
 *    `{sortedRows: rows, rejected: true}` (atomic rejection — keeps
 *    the pass's contract simple and matches "either the
 *    whole sort applies or nothing does" rule).
 * 3. **Indexed sort**. Wrap each row in `{row, idx}` so the secondary
 *    comparator key (original index) keeps the sort stable for
 *    equal-key pairs.
 * 4. **Per-pair comparison**. For each row pair walk the resolved
 *    sort-entry list in order. For each entry:
 *    - Resolve `va` + `vb` via `getCellValue` (honors `valueGetter`).
 *    - **Null-last is direction-independent**. Nulls always sort
 *      AFTER non-nulls regardless of `direction`. The sign-flip
 *      applies only when both values are non-null.
 *    - If `column.comparator` is set: call it with `(va, vb, args)`;
 *      apply the direction sign-flip on top.
 *    - Otherwise: `defaultCompare(va, vb)` (auto-detect by runtime
 *      type: Date → number → bigint → boolean → string locale-aware
 *      → mixed-type fallback); apply the sign-flip.
 *    - If the result is non-zero, return it (later entries are not
 *      consulted — lex-order).
 *    Tie-break across all entries via original-index ascending.
 * 5. Return `{sortedRows: indexed.map(x => x.row), rejected: false}`.
 *
 * **Pure function.** No mutation of inputs; the returned array is
 * always a new allocation when the sort actually runs (steps 3-5).
 */
export function sortPass(input: SortPassInput): SortPassResult {
  const { rows, sortSpec, columns } = input;
  if (sortSpec == null || sortSpec.length === 0) {
    return { sortedRows: rows, rejected: false };
  }

  // Resolve every entry's column up front; reject atomically on the
  // first invalid colId / non-sortable column. Avoids per-comparison
  // re-lookup (n log n × spec.length lookups would be wasteful).
  const resolved: { column: ColumnSpec; sign: number }[] = [];
  for (const entry of sortSpec) {
    const column = columns.find((c) => c.id === entry.colId);
    if (column == null || column.sortable === false) {
      return { sortedRows: rows, rejected: true };
    }
    resolved.push({ column, sign: entry.direction === 'asc' ? 1 : -1 });
  }

  // tree-aware sort. When ANY row has
  // `children`, recurse so siblings at each level are sorted with the
  // SAME spec — matches Decision E.1 + reference-grid default. Flat
  // datasets short-circuit through the standard top-level sort below.
  if (hasAnyChildrenTopLevel(rows)) {
    const sortedRows = sortTreeRows(rows, resolved);
    return { sortedRows, rejected: false };
  }

  return { sortedRows: sortRowsFlat(rows, resolved), rejected: false };
}

/**
 * tree-aware sort recurses into `children`.
 * Sorts the top-level row list, then for each emitted row with
 * children recursively sorts that subtree using the same resolved
 * spec. Pure: rebuilds RowSpec entries only when their `children`
 * array changes (identity-preserving for leaf rows + parents whose
 * children were already in sorted order). Decision E.1.
 */
function sortTreeRows(
  rows: readonly RowSpec[],
  resolved: readonly { column: ColumnSpec; sign: number }[],
): readonly RowSpec[] {
  const sortedTop = sortRowsFlat(rows, resolved);
  // Recurse into each row's children. Track whether ANY row in
  // sortedTop produced a NEW reference; if not (every child subtree
  // was already in sort order at every depth), AND sortedTop itself
  // is the input by reference (no top-level swap), return input by
  // reference for end-to-end identity preservation.
  let anyRowReplaced = false;
  const out: RowSpec[] = new Array<RowSpec>(sortedTop.length);
  for (let i = 0; i < sortedTop.length; i++) {
    const row = sortedTop[i]!;
    const children = row.children;
    if (children == null || children.length === 0) {
      out[i] = row;
      continue;
    }
    const sortedChildren = sortTreeRows(children, resolved);
    if (sortedChildren === children) {
      out[i] = row;
      continue;
    }
    out[i] = { ...row, children: sortedChildren };
    anyRowReplaced = true;
  }
  if (!anyRowReplaced && sortedTop === rows) return rows;
  return out;
}

/**
 * Flat-list sort kernel extracted — same algorithm
 * (indexed-stable lex-order with null-last + direction sign + custom
 * comparator support); just lifted into a reusable function so
 * recursive walker can share it. Identity-preserves
 * the input array reference when the resulting order matches the
 * input order (relevant for the tree-recursive case where sibling
 * subtrees may already be sorted at deeper levels).
 */
function sortRowsFlat(
  rows: readonly RowSpec[],
  resolved: readonly { column: ColumnSpec; sign: number }[],
): readonly RowSpec[] {
  const indexed = rows.map((row, idx) => ({ row, idx }));
  indexed.sort((a, b) => {
    for (const { column, sign } of resolved) {
      const va = getCellValue({ row: a.row, column });
      const vb = getCellValue({ row: b.row, column });

      const aNull = va == null;
      const bNull = vb == null;
      if (aNull && bNull) continue;
      if (aNull) return 1;
      if (bNull) return -1;

      const args: CellComparatorArgs = { rowA: a.row, rowB: b.row, column };
      const raw = column.comparator ? column.comparator(va, vb, args) : defaultCompare(va, vb);
      if (raw !== 0) return raw * sign;
    }
    // All sort keys equal — tie-break by original index for stability.
    return a.idx - b.idx;
  });
  // Identity-preserve when the sort did not actually reorder rows
  // (each indexed entry stayed at its original position). Returns
  // the input array reference for the no-op case so the tree-recursive
  // walker can short-circuit at higher levels.
  let isUnchanged = true;
  for (let i = 0; i < indexed.length; i++) {
    if (indexed[i]!.idx !== i) {
      isUnchanged = false;
      break;
    }
  }
  if (isUnchanged) return rows;
  return indexed.map((x) => x.row);
}

/** Cheap top-level check: does ANY row carry children? */
function hasAnyChildrenTopLevel(rows: readonly RowSpec[]): boolean {
  for (const row of rows) {
    if (row.children != null && row.children.length > 0) return true;
  }
  return false;
}

/**
 * generic comparator used when a column omits
 * its own `comparator`. Auto-detects the runtime type of the two
 * non-null values + dispatches to the matching ordering:
 *
 * - `Date` × `Date` → epoch-millisecond compare.
 * - `number` × `number` → numeric subtract.
 * - `bigint` × `bigint` → three-way compare (subtract doesn't fit
 *   the `number` return type).
 * - `boolean` × `boolean` → `false < true`.
 * - `string` × `string` → `localeCompare` (Intl.Collator default).
 * - Mixed types → `String()` + `localeCompare`. Stable but lossy;
 *   consumers should supply `column.comparator` for mixed columns.
 *
 * Caller (`sortPass`) handles null-last + direction sign + stability
 * tie-break — this function only encodes ASC ordering for the
 * value-pair itself.
 */
function defaultCompare(a: unknown, b: unknown): number {
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  if (typeof a === 'bigint' && typeof b === 'bigint') {
    return a < b ? -1 : a > b ? 1 : 0;
  }
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return (a ? 1 : 0) - (b ? 1 : 0);
  }
  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b);
  }
  return String(a).localeCompare(String(b));
}
