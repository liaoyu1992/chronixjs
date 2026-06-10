import type { ColumnSpec } from '../ir/index.js';

/**
 * Column collection with id-keyed lookup.
 *
 * Wraps a `readonly ColumnSpec[]` with a cached `Map<id, spec>` so
 * consumers (layout passes, interaction handlers, focus service)
 * can look up columns by id in O(1) without materializing their
 * own maps. The wrapper preserves the input order — iteration over
 * `columns` matches the order columns appear in the table.
 *
 * **Immutability:** `ColumnTable` is treated as a value. To replace
 * a column, callers must construct a new `ColumnTable` from a new
 * array. There is no `update()` API — this is intentional, the
 * original table's mutable column model is a known
 * source of subtle re-render bugs; chronix-table follows
 * chronix-gantt's `BarTable` precedent of immutable value
 * collections.
 *
 * **`getById` returns `undefined`** (never throws) for missing
 * ids — this matches the convention of `Map.get`. Callers must
 * handle the `undefined` case at the call site.
 */
export interface ColumnTable {
  /** Iteration order matches the input array. */
  readonly columns: readonly ColumnSpec[];

  /** O(1) lookup by `column.id`. Returns `undefined` when not found. */
  getById(id: string): ColumnSpec | undefined;
}

/**
 * Construct a `ColumnTable` over an input array. Eagerly builds
 * the id-keyed cache; subsequent `getById` calls are O(1).
 *
 * Two columns with the same `id` is undefined behavior — the cache
 * keeps the *last* occurrence, but downstream layout / interaction
 * code may misbehave on duplicate ids. The adapter SHOULD validate
 * uniqueness at construction time.
 */
export function createColumnTable(columns: readonly ColumnSpec[]): ColumnTable {
  const byId = new Map<string, ColumnSpec>();
  for (const col of columns) {
    byId.set(col.id, col);
  }
  return {
    columns,
    getById(id: string): ColumnSpec | undefined {
      return byId.get(id);
    },
  };
}
