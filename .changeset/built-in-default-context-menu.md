---
"@chronixjs/table": minor
"@chronixjs/table-vue3": minor
"@chronixjs/table-vue2": minor
"@chronixjs/table-react": minor
---

# Built-in default cell context menu (复制 / 粘贴 / 清除选区)

When the `contextMenu` prop is `undefined` (not configured), the table
now ships with a built-in right-click menu out of the box:

- **复制 (📋)**: copies the active cell range (TSV) when one exists,
  otherwise copies the single right-clicked cell's value.
- **粘贴 (📥)**: pastes from the clipboard into the active range;
  disabled when no range is active.
- **清除选区 (✕)**: clears the active cell range; disabled when no
  range is active.

## API

- `contextMenu: undefined` → default menu (开箱即用).
- `contextMenu: null` → no menu (browser native).
- `contextMenu: { items: [...] }` → custom menu (overrides defaults).

## Implementation

- **Core**: new `createDefaultContextMenuItems(deps)` factory and
  `DefaultContextMenuDeps` interface in `@chronixjs/table`
  (`api/default-context-menu.ts`), exported from the package entry.
- **All three adapters** (vue3, vue2, react): an `effectiveContextMenu`
  computed resolves `undefined` → default, `null` → disabled,
  config → custom. A shared `resolveCellRangeForCtx` helper ensures
  every context-menu construction (disabled checks, overlay render,
  item click) carries the `cellRange` envelope when the right-clicked
  cell is inside an active range.
- **Demos**: the example apps no longer pass an explicit `contextMenu`
  prop so the default menu shows out of the box.

## Migration

No action required. Consumers who passed `contextMenu` explicitly are
unaffected. Consumers who relied on `contextMenu: undefined` rendering
no menu now get the built-in default — pass `contextMenu: null` to
keep the previous (browser-native) behavior.
