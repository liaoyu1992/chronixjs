/**
 * Default context-menu item factory.
 *
 * When the `contextMenu` prop is `undefined` (not configured), the
 * adapter uses these built-in items so the table ships with a
 * sensible right-click menu out of the box. Passing an explicit
 * `contextMenu: { items: [...] }` config overrides the defaults;
 * passing `contextMenu: null` disables the menu entirely.
 *
 * The items are context-aware:
 * - **复制** – copies the active cell range (TSV) when one exists,
 *   otherwise copies the single right-clicked cell's value.
 * - **粘贴** – pastes from clipboard into the active range. Disabled
 *   when no range is active or `cellRangeSelection` is not enabled.
 * - **清除选区** – clears the active cell range. Disabled when no
 *   range is active.
 */

import type { ContextMenuItem } from '../ir/context-menu';

/**
 * Dependency callbacks the default items call. The adapter wires these
 * to its own internal methods (clipboard copy/paste, range clear,
 * single-cell value resolution).
 */
export interface DefaultContextMenuDeps {
  /** Copy the active cell range to clipboard (TSV). No-op if no range. */
  readonly copyRange: () => void;
  /** Copy a single cell's formatted value to clipboard. */
  readonly copyCell: (rowId: string, colId: string) => void;
  /** Paste from clipboard into the active range. No-op if no range. */
  readonly paste: () => void;
  /** Clear the active cell range. No-op if no range. */
  readonly clearRange: () => void;
}

/**
 * Create the built-in default context-menu items. Returns a frozen
 * array so adapters can safely share a single instance across renders.
 */
export function createDefaultContextMenuItems(
  deps: DefaultContextMenuDeps,
): readonly ContextMenuItem[] {
  return Object.freeze([
    {
      id: 'copy',
      label: '复制',
      icon: '📋',
      onClick: (ctx) => {
        if (ctx.cellRange != null) {
          deps.copyRange();
        } else if (ctx.rowId != null && ctx.colId != null) {
          deps.copyCell(ctx.rowId, ctx.colId);
        }
      },
    },
    {
      id: 'paste',
      label: '粘贴',
      icon: '📥',
      disabled: (ctx) => ctx.cellRange == null,
      onClick: () => {
        deps.paste();
      },
    },
    {
      id: 'clear-range',
      label: '清除选区',
      icon: '✕',
      disabled: (ctx) => ctx.cellRange == null,
      onClick: () => {
        deps.clearRange();
      },
    },
  ]);
}
