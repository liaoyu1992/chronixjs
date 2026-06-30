import type { RowSpec } from '../ir/index.js';

/**
 * Row collection interface with id-keyed lookup.
 *
 * The shape every chronix-table row source implements.
 * ships the in-memory `ClientSide` variant; future phases add
 * `ServerSide` (lazy-load remote pages) at Phase ~82.
 *
 * **Immutability + identity:** like `ColumnTable`, `RowDataSource`
 * is treated as a value. Mutable row-graph models are a known
 * re-render-hazard source; chronix follows chronix-gantt's
 * `RowDataSource` precedent of immutable value collections. To
 * replace rows, construct a new source.
 */
export interface RowDataSource {
  /** Iteration order matches the data input. */
  readonly rows: readonly RowSpec[];

  /** O(1) lookup by `row.id`. Returns `undefined` when not found. */
  getById(id: string): RowSpec | undefined;
}

/**
 * Construct a `RowDataSource` over an in-memory `RowSpec[]`. The
 * "ClientSide" naming distinguishes this from future server-side
 * variants — every row materializes in memory, sorting / filtering
 * operates on the full set, no network round trips.
 *
 * Eagerly builds the id-keyed cache; subsequent `getById` is O(1).
 * Duplicate ids are last-write-wins in the cache; the adapter
 * SHOULD validate uniqueness at construction time.
 */
export function createClientSideRowSource(rows: readonly RowSpec[]): RowDataSource {
  const byId = new Map<string, RowSpec>();
  // recursively index `children` so getById
  // works for any row in a tree-data hierarchy, not just top-level
  // rows. The walk uses an explicit stack to avoid call-stack
  // overflow on pathologically deep trees. Pre-Phase-30 flat datasets
  // (no children anywhere) take exactly the same single-pass cost
  // they did before.
  const stack: RowSpec[] = [];
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    if (row != null) stack.push(row);
  }
  while (stack.length > 0) {
    const row = stack.pop();
    if (row == null) continue;
    byId.set(row.id, row);
    const children = row.children;
    if (children != null && children.length > 0) {
      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i];
        if (child != null) stack.push(child);
      }
    }
  }
  return {
    rows,
    getById(id: string): RowSpec | undefined {
      return byId.get(id);
    },
  };
}
