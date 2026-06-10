/**
 * Menu component IR — Phase 27 (2026-06-03). Tier B inline-rendered
 * hierarchical menu (horizontal or vertical) with tree-aware keyboard
 * navigation.
 *
 * Renders inline (NO portal, NO popup) — sub-menu reveal is inline
 * expand/collapse in v0.1.0-alpha. Sub-menu hover popup deferred to
 * v0.2. Adapter manages `expandedKeys: Set<string>` reactively;
 * pure-data IR ships the tree shape + 3 helpers (flatten, find-path,
 * compose-keyboard-selection).
 *
 * Out-of-scope:
 * - Drag-to-reorder.
 * - Horizontal overflow `...more` indicator.
 * - Theme inversion (dark menu).
 * - `collapsed` icon-strip full layout polish (interface ships but
 *   layout is simplified).
 */

export interface MenuItem {
  readonly key: string;
  readonly label: string;
  /** Phase 9 IconRegistry name; `undefined` = no icon. */
  readonly icon: string | undefined;
  readonly disabled: boolean;
  /**
   * Nested children. `undefined` = leaf item (vs empty array `[]` =
   * "branch with no current children" — the distinction matters for
   * the expand-arrow rendering decision).
   */
  readonly children: readonly MenuItem[] | undefined;
}

export type MenuMode = 'horizontal' | 'vertical';

export interface MenuProps {
  /** Currently-active leaf key, or `undefined` when nothing active. */
  readonly value: string | undefined;
  readonly items: readonly MenuItem[];
  readonly mode: MenuMode;
  /** Vertical-only — when `true`, hides labels + renders icons only. */
  readonly collapsed: boolean;
  readonly disabled: boolean;
}

export const defaultMenuProps: MenuProps = {
  value: undefined,
  items: [],
  mode: 'vertical',
  collapsed: false,
  disabled: false,
};
