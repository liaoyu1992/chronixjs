---
"@chronixjs/table": major
"@chronixjs/table-vue3": major
"@chronixjs/table-vue2": major
"@chronixjs/table-react": major
---

# Remove showColumnVisibilityMenu (legacy column-visibility button)

The legacy `showColumnVisibilityMenu` prop + its top-right "列" button +
popover have been removed. Column visibility is now controlled exclusively
via the per-column header menu (`showColumnHeaderMenu`), which offers
"hide this column" / "pin left" / "pin right" actions per column.

## Breaking changes

- `showColumnVisibilityMenu` prop removed (was `boolean`, default `false`).
- The `.cx-table-column-menu-button` ("列" button) + `.cx-table-column-menu-popover`
  no longer render.
- The `column-visibility-menu` keyboard-nav handlers removed.
- The document-level `pointerdown` outside-click listener for the popover removed.

## Preserved

- `onColumnVisibilityChange` event + `ColumnVisibilityChangePayload` (still fired
  by the column-header menu's "hide" action + `setColumnVisibility`/`toggleColumnVisibility`
  handle methods).
- `setColumnVisibility` / `toggleColumnVisibility` handle methods.

## Migration

Remove `showColumnVisibilityMenu` from your `<ChronixTable>` props. If you relied
on the popover's "全部显示 / 全部隐藏" batch actions, implement them in your own
UI by calling `toggleColumnVisibility` per column via the handle.