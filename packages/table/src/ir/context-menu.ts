/**
 * IR primitive: cell context-menu descriptor.
 *
 * Phase 83 (2026-05-30): the chronix-NEW shape for the
 * right-click cell context menu. The `contextMenu` SFC prop
 * accepts a `ContextMenuConfig` carrying a flat array of
 * `ContextMenuItem` action descriptors; each item describes
 * one action surfaced when the user right-clicks a body cell.
 *
 * Cursor-positioned overlay: chronix intercepts the cell's
 * `contextmenu` event, captures `clientX/clientY` + the cell's
 * `rowId/colId`, and renders a `<menu role="menu">` at the
 * cursor coords via `position: fixed`. Each item's `onClick`
 * callback receives the `ContextMenuContext` so consumers can
 * branch per-row / per-cell from a single SFC-level prop.
 *
 * Disabled state is a per-render predicate: `disabled?(ctx)` is
 * evaluated every time the menu renders, so consumers wiring
 * `(ctx) => row.locked` get per-row disable for free without
 * extra bookkeeping.
 */

/**
 * Top-level configuration for the cell context menu. Passed as
 * the `contextMenu` SFC prop. `null` (or omitting the prop) is
 * the identity case — the SFC ships no overlay; right-click
 * bubbles to the browser's native context menu.
 *
 * Phase 83 (2026-05-30).
 */
export interface ContextMenuConfig {
  /**
   * Ordered array of menu-item descriptors. The overlay renders
   * one button per descriptor in this order. Empty array is
   * treated identically to `contextMenu: null` (no overlay
   * renders; browser native menu allowed to surface).
   */
  readonly items: readonly ContextMenuItem[];
}

/**
 * Descriptor for a single context-menu item. The `id` is the
 * stable key chronix uses to identify the item in emits +
 * TableHandle methods; `label` is the display text in the menu
 * button; `icon` is an optional glyph string prefixing the
 * label; `disabled` is a per-render predicate; `onClick` is the
 * consumer-supplied action callback invoked when the user picks
 * this item.
 *
 * Phase 83 (2026-05-30).
 */
export interface ContextMenuItem {
  /**
   * Stable identifier. Required. Used as the key for the
   * menu-button's `data-item-id` attribute + as the key in
   * future emits. Must be unique within the same
   * `ContextMenuConfig.items` array.
   */
  readonly id: string;

  /**
   * Display label for the menu item. Used as the button's text
   * content + `aria-label` fallback.
   */
  readonly label: string;

  /**
   * Optional icon glyph rendered as a prefix to the label.
   * Accepts any string — emoji (`'📋'`), icon-font character,
   * or SVG-as-text. Defaults to `undefined` (no icon prefix).
   */
  readonly icon?: string;

  /**
   * Per-render predicate. Evaluated every time the menu
   * renders. When `true`, the menu button renders with the
   * `disabled` attribute + `cx-table-cell-context-menu-item--disabled`
   * modifier class; clicking is a no-op (`onClick` is not
   * invoked).
   *
   * Defaults to `undefined` (always enabled). Returning `false`
   * is equivalent to not supplying the predicate at all.
   */
  readonly disabled?: (ctx: ContextMenuContext) => boolean;

  /**
   * Consumer-supplied action callback. Invoked with the
   * right-clicked cell's `{ rowId, colId }` when the user
   * picks this item from the open menu. Chronix closes the
   * menu before invoking the callback so consumer-side
   * dispatches (e.g., modal open) compose cleanly with the
   * menu-close transition.
   */
  readonly onClick: (ctx: ContextMenuContext) => void;
}

/**
 * Context passed to `ContextMenuItem.disabled` + `onClick`
 * callbacks. Carries the right-clicked cell's identifiers so
 * consumers can branch behavior per-row / per-cell from a
 * single SFC-level `items` array.
 *
 * Phase 83 (2026-05-30).
 */
export interface ContextMenuContext {
  /**
   * Row id of the right-clicked cell. `null` only when the
   * context menu was opened programmatically via
   * `TableHandle.openContextMenuAt` with a `null` rowId
   * argument (e.g., menu opened from a wrapper-background
   * right-click in a future polish phase).
   */
  readonly rowId: string | null;

  /**
   * Column id of the right-clicked cell. `null` only when the
   * context menu was opened programmatically via
   * `TableHandle.openContextMenuAt` with a `null` colId
   * argument.
   */
  readonly colId: string | null;
}

/**
 * Emit payload for `context-menu-open` — fires when the
 * context menu opens (either via right-click or via
 * programmatic `openContextMenuAt`). Carries the cell
 * coordinates + viewport pixel position so consumers can mirror
 * the open state externally (e.g., persist last-opened-cell to
 * analytics).
 *
 * Phase 83 (2026-05-30).
 */
export interface ContextMenuOpenPayload {
  /** Row id of the right-clicked cell. `null` when opened programmatically with `null` rowId. */
  readonly rowId: string | null;

  /** Column id of the right-clicked cell. `null` when opened programmatically with `null` colId. */
  readonly colId: string | null;

  /** Viewport-X (`clientX`) in pixels where the menu is positioned. */
  readonly x: number;

  /** Viewport-Y (`clientY`) in pixels where the menu is positioned. */
  readonly y: number;
}
