import type { RowSpec } from '../ir/index.js';

/**
 * Input to `synthesizeLazyChildren` (Phase 34, 2026-05-28).
 *
 * `rows` is the consumer's tree-shaped row list (each row may carry
 * `children?: readonly RowSpec[]` OR `hasChildren?: boolean`).
 * `loadedChildrenByRowId` is the adapter SFC's session-scoped cache of
 * children loaded via `childrenLoader`. Empty Map = no lazy children
 * loaded yet (fast-path returns input by reference).
 */
export interface SynthesizeLazyChildrenInput {
  /** Tree-shaped input rows in display order. */
  readonly rows: readonly RowSpec[];

  /**
   * Map keyed by `rowId` → cached lazy children. Entries are present
   * iff the row's lazy state is `'loaded'`. Adapters populate this
   * after a successful `childrenLoader` resolution.
   */
  readonly loadedChildrenByRowId: ReadonlyMap<string, readonly RowSpec[]>;
}

/**
 * Output of `synthesizeLazyChildren`.
 *
 * `rows` is the tree-shaped row list with loaded lazy children
 * substituted into the `children` field of each lazy parent. For sync
 * parents (`children !== undefined` on input) the row is passed through
 * unchanged. For leaf rows (`children === undefined && hasChildren !==
 * true`) the row is passed through unchanged. For lazy parents whose
 * children haven't been loaded yet, the row is passed through unchanged
 * (chevron still renders thanks to `hasChildren`, but `treeFlattenPass`
 * sees no children to recurse into).
 *
 * **Identity preservation**: when `loadedChildrenByRowId.size === 0`,
 * the output is identity-equal to the input (`rows: input.rows`).
 * Downstream memos / computeds short-circuit; the consumer pays zero
 * cost when no lazy children are loaded yet.
 */
export interface SynthesizeLazyChildrenResult {
  readonly rows: readonly RowSpec[];
}

/**
 * Phase 34 (2026-05-28): walk a tree-shaped row list once + substitute
 * `row.children = loadedChildrenByRowId.get(row.id)` for every lazy
 * parent that has loaded children cached. Output flows into
 * `treeFlattenPass` (or any other tree-aware pass) unchanged.
 *
 * Algorithm (explicit-stack DFS, identity-preserving):
 *
 * 1. Empty map → return input by reference (fast-path).
 * 2. Walk every row in `rows` recursively. For each row:
 *    - If `loadedChildrenByRowId.has(row.id)`: emit a new RowSpec with
 *      `children` overridden to the cached array. Recursively walk the
 *      cached array (its children may themselves be lazy parents).
 *    - Else if `row.children !== undefined`: recursively walk the
 *      sync children. If any descendant was rebuilt, emit a new RowSpec
 *      with the rebuilt children array; otherwise pass through.
 *    - Else: leaf row OR unloaded lazy parent — pass through.
 * 3. If no row at the top level needed rebuilding, return input by
 *    reference. Otherwise return the rebuilt array.
 *
 * **Pure function.** No mutation of input rows. New RowSpec objects
 * are constructed only when `children` needs to be substituted or when
 * a descendant subtree changed.
 *
 * **Composition with `treeFlattenPass`**: this helper runs BEFORE
 * `treeFlattenPass`. The flatten pass reads `row.children` directly +
 * doesn't know (or care) whether they were declared sync or loaded
 * lazily. Adapter pipeline order:
 *
 * ```
 * props.rows
 *   → pinnedRowsPass         (Phase 31)
 *   → filterPass + sortPass + ...
 *   → synthesizeLazyChildren (Phase 34, this helper)
 *   → treeFlattenPass        (Phase 30)
 *   → ...
 * ```
 *
 * **Why a separate helper instead of folding into `treeFlattenPass`**:
 * treeFlattenPass owns expand/collapse + depth/groupKey assignment.
 * Lazy synthesis is a tree-shape transform that's orthogonal to
 * flattening; keeping them separate preserves single-responsibility +
 * lets future phases insert other tree-shape transforms (drag-drop
 * reparenting, optimistic insert) at the same slot.
 */
export function synthesizeLazyChildren(
  input: SynthesizeLazyChildrenInput,
): SynthesizeLazyChildrenResult {
  const { rows, loadedChildrenByRowId } = input;

  // Fast-path: empty map → no synthesis needed.
  if (loadedChildrenByRowId.size === 0) {
    return { rows };
  }

  const out = walk(rows, loadedChildrenByRowId);
  return { rows: out };
}

/**
 * Recursive walker. Returns input array by reference when nothing
 * changed, else returns a new array with rebuilt rows substituted in.
 */
function walk(
  rows: readonly RowSpec[],
  loaded: ReadonlyMap<string, readonly RowSpec[]>,
): readonly RowSpec[] {
  let rebuilt: RowSpec[] | null = null;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row == null) continue;
    const next = rewriteRow(row, loaded);
    if (next !== row) {
      rebuilt ??= rows.slice(0, i);
      rebuilt.push(next);
    } else if (rebuilt != null) {
      rebuilt.push(row);
    }
  }

  return rebuilt ?? rows;
}

/**
 * Per-row rewriter. Returns the input row by reference when nothing
 * changed, else returns a new RowSpec with `children` substituted.
 *
 * Priority:
 *
 * 1. Loaded-children Map hit → substitute. Recursively walk the cached
 *    children (they may themselves be lazy parents).
 * 2. Sync children → recursively walk; rebuild only if descendant
 *    changed.
 * 3. Leaf / unloaded lazy → return input by reference.
 */
function rewriteRow(row: RowSpec, loaded: ReadonlyMap<string, readonly RowSpec[]>): RowSpec {
  const cached = loaded.get(row.id);
  if (cached != null) {
    // Lazy children loaded. Substitute + recursively walk the cache
    // (cached children may themselves carry hasChildren / sync
    // children).
    const walkedCache = walk(cached, loaded);
    return { ...row, children: walkedCache };
  }

  const syncChildren = row.children;
  if (syncChildren != null && syncChildren.length > 0) {
    const walked = walk(syncChildren, loaded);
    if (walked !== syncChildren) {
      return { ...row, children: walked };
    }
    return row;
  }

  // Leaf row OR unloaded lazy parent — pass through.
  return row;
}
