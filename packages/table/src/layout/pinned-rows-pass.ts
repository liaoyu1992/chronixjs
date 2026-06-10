import type { RowSpec } from '../ir/index.js';

/**
 * Input to `pinnedRowsPass` (Phase 31, 2026-05-28).
 *
 * `rows` is the tree-flattened or flat row list — the pass scans
 * shallowly, so callers that have already run `treeFlattenPass` should
 * pass that pass's `flatRows`. Callers with flat input can pass it
 * directly. The pass does NOT recurse into `children` — pinned rows
 * are leaves in v1 per Phase 31 Decision (out-of-scope).
 */
export interface PinnedRowsInput {
  /** Input rows in display order (post-`treeFlattenPass` or flat). */
  readonly rows: readonly RowSpec[];
}

/**
 * Output of `pinnedRowsPass`.
 *
 * The adapter renders `topPinnedRows` as a separate sticky region
 * anchored to `top: 0` inside the body content layer; the
 * `bottomPinnedRows` to `bottom: 0`. `regularRows` flow through the
 * downstream filter / sort / page pipeline.
 *
 * **Author order is preserved within each zone** — pinned rows declared
 * at indices [2, 5, 9] (all with `pinned: 'top'`) emit in that order,
 * regardless of input position.
 *
 * `hasPinnedRows` is the cheap predicate adapters use to short-circuit
 * the sticky-region render path entirely.
 */
export interface PinnedRowsResult {
  /** Top-pinned rows in author order. */
  readonly topPinnedRows: readonly RowSpec[];

  /** Non-pinned rows in author order — input to filter/sort/page. */
  readonly regularRows: readonly RowSpec[];

  /** Bottom-pinned rows in author order. */
  readonly bottomPinnedRows: readonly RowSpec[];

  /** `true` iff `topPinnedRows.length + bottomPinnedRows.length > 0`. */
  readonly hasPinnedRows: boolean;
}

/**
 * Shared empty result for the no-pinned-rows fast path so the per-render
 * code path doesn't need to allocate a fresh empty record each frame.
 * `regularRows` is overwritten with the input row reference when this
 * shape is returned — the adapter's identity-equality short-circuits stay
 * intact.
 */
const EMPTY_PINNED_ROWS_FROZEN: readonly RowSpec[] = Object.freeze([]);

/**
 * Phase 31 (2026-05-28): partition the input row list into top-pinned,
 * regular, and bottom-pinned subsets BEFORE the filter / sort / page
 * pipeline runs.
 *
 * Algorithm:
 *
 * 1. **Fast-path scan**: walk input rows once tracking whether any row
 *    has `pinned: 'top' | 'bottom'`. When none are pinned, return
 *    `{ topPinnedRows: [], regularRows: rows, bottomPinnedRows: [],
 *    hasPinnedRows: false }` with `regularRows` aliasing input (zero
 *    allocation for the common flat-table case).
 *
 * 2. **Partition pass**: walk input rows a second time, pushing each
 *    row into the appropriate output bucket based on `row.pinned`.
 *    Author order is preserved within each bucket.
 *
 * The pass is run twice (predicate + partition) intentionally — the
 * fast-path predicate must be allocation-free, and a single-pass
 * partition that returns input by reference is impossible when ANY row
 * is pinned (the regular set is a strict subset).
 *
 * **Pure function.** No mutation of input rows; the pass only
 * partitions references into 3 buckets. Identity preservation on the
 * common flat case (no rows pinned) is the cost-defining behavior:
 * tables without pinned rows pay ZERO allocation.
 *
 * **Sister to `pinnedColsPass`** — same flat-record-in /
 * readonly-record-out shape; same fast-path-on-no-pin / partition-
 * otherwise pattern.
 */
export function pinnedRowsPass(input: PinnedRowsInput): PinnedRowsResult {
  const { rows } = input;

  // Empty input → empty result with input alias.
  if (rows.length === 0) {
    return {
      topPinnedRows: EMPTY_PINNED_ROWS_FROZEN,
      regularRows: rows,
      bottomPinnedRows: EMPTY_PINNED_ROWS_FROZEN,
      hasPinnedRows: false,
    };
  }

  // Fast-path scan: detect any pinned row.
  let hasAnyPinned = false;
  for (const row of rows) {
    if (row.pinned === 'top' || row.pinned === 'bottom') {
      hasAnyPinned = true;
      break;
    }
  }

  // No pinned rows → return input by reference (identity preserved).
  if (!hasAnyPinned) {
    return {
      topPinnedRows: EMPTY_PINNED_ROWS_FROZEN,
      regularRows: rows,
      bottomPinnedRows: EMPTY_PINNED_ROWS_FROZEN,
      hasPinnedRows: false,
    };
  }

  // Partition: allocate three buckets and walk once.
  const topPinnedRows: RowSpec[] = [];
  const regularRows: RowSpec[] = [];
  const bottomPinnedRows: RowSpec[] = [];

  for (const row of rows) {
    if (row.pinned === 'top') {
      topPinnedRows.push(row);
    } else if (row.pinned === 'bottom') {
      bottomPinnedRows.push(row);
    } else {
      regularRows.push(row);
    }
  }

  return {
    topPinnedRows,
    regularRows,
    bottomPinnedRows,
    hasPinnedRows: true,
  };
}
