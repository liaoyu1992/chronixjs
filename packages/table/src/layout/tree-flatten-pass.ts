import type { RowSpec } from '../ir/index.js';

/**
 * Input to `treeFlattenPass` (2026-05-28).
 *
 * `rows` is the tree-shaped row list straight from the consumer (each
 * row may carry `children?: readonly RowSpec[]` to declare descendants).
 * `expandedRowIds` is the set of row IDs whose children are visible —
 * adapters typically union the user's expand state with any forced-
 * expand IDs from `filterPass` (decision F.1) before passing.
 */
export interface TreeFlattenInput {
  /** Tree-shaped input rows in display order. */
  readonly rows: readonly RowSpec[];

  /** Set of row IDs whose children should be visible. */
  readonly expandedRowIds: ReadonlySet<string>;
}

/**
 * Output of `treeFlattenPass`.
 *
 * `flatRows` is the visible-only flat row list — every row whose
 * ancestor chain is fully expanded contributes a row; rows inside a
 * collapsed subtree are omitted. Each emitted row carries chronix-
 * populated `depth` (0 = top level) + `groupKey` (parent's `id`, or
 * `null` for top level).
 *
 * `maxDepth` is the deepest `depth` value seen in `flatRows`, or `0`
 * when no row has children. Adapters use this to skip indent / tree-
 * column logic entirely when the dataset is flat.
 */
export interface TreeFlattenResult {
  /** Flat visible-only rows; each tagged with `depth` + `groupKey`. */
  readonly flatRows: readonly RowSpec[];

  /** Deepest depth in `flatRows`; `0` for purely flat input. */
  readonly maxDepth: number;
}

/**
 * flatten a tree-shaped row list to a visible-
 * only flat list, tagging each output row with `depth` + `groupKey`.
 *
 * Algorithm (explicit-stack DFS in display order):
 *
 * 1. Push top-level input rows onto a stack in REVERSE order — DFS
 *    pops the last entry first, so reverse-push restores declared
 *    order.
 * 2. Pop a frame `{row, depth, groupKey}`. Emit the row (with depth +
 *    groupKey populated, allocating a new object only when those
 *    fields need to change vs the input). Track `maxDepth`.
 * 3. If the row has children AND `expandedRowIds.has(row.id)`, push
 *    its children in reverse order with `depth + 1` + `parentId =
 *    row.id`. Otherwise the subtree is collapsed (or it's a leaf) and
 *    no children are pushed.
 * 4. Repeat until the stack is empty.
 *
 * **Pure function.** No mutation of input rows; new RowSpec objects
 * are constructed when `depth` / `groupKey` differ from input.
 *
 * **Identity preservation:** when the input is already flat (no row
 * has children) AND every row's `depth` / `groupKey` already match
 * what the pass would write (depth=0, groupKey=null), the same row
 * references are emitted. The fast-path early-out at step 1 avoids
 * the stack walk entirely for the flat case — `rows` is returned by
 * reference. This keeps the cost of the pass at ZERO for flat tables.
 *
 * **Explicit-stack DFS (not direct recursion):** guards against call-
 * stack overflow on pathologically deep trees (10k+ levels). chronix-
 * table has no real-world consumer at that depth, but the cost of an
 * explicit stack is negligible + future-proofs the helper.
 *
 * **`Set<string>` membership = O(1):** the `expandedRowIds` set
 * permits constant-time lookup per row. A 100k-row tree with the top
 * 30 rows expanded = ~30 visible rows + ~10 boundary lookups; well
 * under a millisecond.
 */
export function treeFlattenPass(input: TreeFlattenInput): TreeFlattenResult {
  const { rows, expandedRowIds } = input;

  // Fast-path: empty input → empty result by reference.
  if (rows.length === 0) {
    return { flatRows: rows, maxDepth: 0 };
  }

  // Fast-path: detect "no row anywhere has children" by scanning the
  // top level. If every top-level row has no children AND its existing
  // depth + groupKey already match what we would write, return input
  // by reference. This is the common flat-table case.
  if (isAlreadyFlatPure(rows)) {
    return { flatRows: rows, maxDepth: 0 };
  }

  const out: RowSpec[] = [];
  let maxDepth = 0;

  // Frame shape: tuple to avoid object allocation per stack entry.
  // [row, depth, groupKey]
  type Frame = readonly [RowSpec, number, string | null];
  const stack: Frame[] = [];

  // Push top-level rows in reverse order so DFS visits them in
  // declared order.
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    if (row != null) {
      stack.push([row, 0, null]);
    }
  }

  while (stack.length > 0) {
    const frame = stack.pop();
    if (frame == null) break;
    const [row, depth, groupKey] = frame;

    // Emit the row with chronix-populated depth + groupKey. When the
    // input row already has matching values, reuse the reference.
    const needsNewObject = row.depth !== depth || (row.groupKey ?? null) !== groupKey;
    const emitted: RowSpec = needsNewObject ? { ...row, depth, groupKey } : row;
    out.push(emitted);

    if (depth > maxDepth) maxDepth = depth;

    // Recurse only when expanded AND has children.
    const children = row.children;
    if (children != null && children.length > 0 && expandedRowIds.has(row.id)) {
      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i];
        if (child != null) {
          stack.push([child, depth + 1, row.id]);
        }
      }
    }
  }

  return { flatRows: out, maxDepth };
}

/**
 * Fast-path detector: returns `true` when the top-level row list has
 * NO children anywhere AND every row's existing `depth` is either
 * undefined or 0 AND every row's existing `groupKey` is either
 * undefined or null. In that case the pass would emit input rows
 * unchanged + we can return input by reference.
 */
function isAlreadyFlatPure(rows: readonly RowSpec[]): boolean {
  for (const row of rows) {
    if (row.children != null && row.children.length > 0) return false;
    if (row.depth != null && row.depth !== 0) return false;
    if (row.groupKey != null) return false;
  }
  return true;
}
