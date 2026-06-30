/**
 * Tree-data IR — .
 *
 * Pure-data types + traversal helpers used by Tree, Cascader,
 * TreeSelect, Menu, Dropdown, and any future hierarchical component.
 * chronix-NEW surface focused on what chronix-ui components actually
 * need.
 *
 * Conventions:
 *
 * - Every tree node has a `key: string | number` field. Keys MUST be
 *   unique within a tree (helpers don't validate; behavior with
 *   duplicate keys is "first match wins" in pre-order traversal).
 * - `children` is optional; a leaf is a node with `children: undefined`
 *   or `children: []`. Helpers treat both as leaves.
 * - The optional `data: T` field carries arbitrary user payload. Generic
 *   `TreeNodeSpec<T = unknown>` lets consumers type-narrow when they
 *   know the payload shape, while helpers work uniformly over any T.
 * - All operations are **pure**: helpers return new trees / new arrays
 *   and never mutate the input.
 */

/**
 * A single node in a chronix-ui tree. Generic over the user's payload
 * type `T`; consumers may use `TreeNodeSpec` (= `TreeNodeSpec<unknown>`)
 * for fully-opaque trees.
 */
export interface TreeNodeSpec<T = unknown> {
  /** Unique identifier within the tree. Keys must be unique. */
  readonly key: string | number;
  /**
   * Optional user payload. The tree helpers treat this as opaque — they
   * never inspect or mutate it. Consumers typically attach things like
   * the display label, icon name, disabled state, etc.
   */
  readonly data?: T;
  /**
   * Optional child nodes. Missing or empty children means leaf node.
   */
  readonly children?: readonly TreeNodeSpec<T>[];
}

/**
 * An ordered list of keys from a tree's root toward a specific node.
 * Used by every helper that exposes ancestry information.
 *
 * - `[]` represents the path to a root node (no ancestors).
 * - `['a']` represents the path to a child of the root with key 'a'.
 * - `['a', 'b']` represents the path through 'a' then 'b'.
 *
 * The path EXCLUDES the current node — `[...parentKeyPath, node.key]`
 * gives the full path including current.
 *
 * Convention: a node's "depth" equals `parentKeyPath.length` — roots
 * are at depth 0, their children at depth 1, etc.
 */
export type TreeKeyPath = readonly (string | number)[];
