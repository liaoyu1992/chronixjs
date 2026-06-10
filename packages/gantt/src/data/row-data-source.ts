import type { RowSpec } from '../ir/index.js';

/**
 * Mutable runtime collection of `RowSpec`s with tree expand/collapse state.
 *
 * `rows` reflects the currently-visible set after applying collapse rules —
 * collapsed parents hide their descendants. Implementations resolve the
 * parent/child graph from `RowSpec.parentId`.
 */
export interface RowDataSource {
  /** Currently-visible row set after expand/collapse rules. */
  readonly rows: readonly RowSpec[];

  /** Look up by stable row id. */
  getById(id: string): RowSpec | undefined;

  /** Direct children of `parentId`; pass `null` for top-level rows. */
  listChildren(parentId: string | null): readonly RowSpec[];

  /** Whether a row is currently expanded (children visible). */
  isExpanded(rowId: string): boolean;
}
