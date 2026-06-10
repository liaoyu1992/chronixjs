# @chronixjs/table-react

React 18 component + hooks built on [`@chronixjs/table`](https://www.npmjs.com/package/@chronixjs/table). Feature-symmetric with [`@chronixjs/table-vue3`](https://www.npmjs.com/package/@chronixjs/table-vue3) and [`@chronixjs/table-vue2`](https://www.npmjs.com/package/@chronixjs/table-vue2).

> **Status.** Currently published under the `alpha` npm dist-tag (`@alpha`). After v0.1.0 GA lands, the `@alpha` suffix can be omitted (the default `latest` tag will point to v0.1.0). APIs may shift before `1.0.0`; SemVer stability commitment begins at `1.0`.

## Install

```bash
pnpm add @chronixjs/table-react@alpha react@^18 react-dom@^18    # currently
pnpm add @chronixjs/table-react react@^18 react-dom@^18          # after v0.1.0 GA
```

The `@chronixjs/table` core is pulled transitively — you don't install it separately unless you also consume the framework-agnostic types / IR / pure helpers in non-React code.

`react` and `react-dom` are peer dependencies (`^18`); bring your own.

## Quickstart

```tsx
import { useRef, useState } from 'react';
import type { ColumnSpec, RowSpec } from '@chronixjs/table';
import { ChronixTable } from '@chronixjs/table-react';
import type { CellValueChangePayload, TableHandle } from '@chronixjs/table-react';

export function MyTable() {
  const tableRef = useRef<TableHandle>(null);

  const [columns, setColumns] = useState<readonly ColumnSpec[]>([
    { id: 'id', field: 'id', headerName: 'ID', width: 80 },
    { id: 'name', field: 'name', headerName: '名称', flex: 1, editable: true },
    { id: 'qty', field: 'qty', headerName: '数量', width: 120, type: 'number', editable: true },
    { id: 'price', field: 'price', headerName: '单价', type: 'number', pinned: 'right' },
  ]);

  const [rows, setRows] = useState<readonly RowSpec[]>([
    { id: 'r1', data: { id: 1, name: 'Alpha', qty: 10, price: 100 } },
    { id: 'r2', data: { id: 2, name: 'Beta', qty: 20, price: 200 } },
    { id: 'r3', data: { id: 3, name: 'Gamma', qty: 30, price: 300 } },
  ]);

  function onCellValueChange(payload: CellValueChangePayload) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === payload.rowId
          ? { ...r, data: { ...r.data, [payload.colId]: payload.newValue } }
          : r,
      ),
    );
  }

  return (
    <ChronixTable
      ref={tableRef}
      columns={columns}
      rows={rows}
      showFilterRow
      showFooterRow
      showColumnVisibilityMenu
      enableKeyboardNavigation
      selectionMode="multi"
      paginationEnabled
      initialPageSize={20}
      cellRangeSelection="enabled"
      enableUndoHistory
      onCellValueChange={onCellValueChange}
    />
  );
}
```

## Hooks (advanced wiring)

When you need to drive the layout pipeline manually (custom renderer, headless test harness, or composing with another renderer):

```ts
import { useTableLayout, useTableContainerSize, useTableBodyScroll } from '@chronixjs/table-react';
```

- `useTableLayout({ columns, rows, theme, availableWidth, sortSpecs, filterSpecs, ... })` — returns memoized `widthByColId`, `displayedRowIds`, `rowYByRowId`, `pinnedZones`, `headerGroupRowsByZone`
- `useTableContainerSize(elRef)` — `clientWidth` of the wrapper element
- `useTableBodyScroll(bodyRef)` — `scrollTop` + `scrollLeft` + `clientHeight` of the scrolling body

## Imperative handle

```tsx
import { useRef } from 'react';
import type { TableHandle } from '@chronixjs/table-react';

const tableRef = useRef<TableHandle>(null);

function focusFirstCell() {
  tableRef.current?.setActiveCell('r1', 'name');
}

function exportFilteredCsv() {
  tableRef.current?.exportToCsv('my-table.csv', { rowSource: 'filtered' });
}
```

58 handle methods cover: column-table / row-data-source / resolved widths; sort / filter / selection / page; editing (start / commit / cancel / draft); column resize / move / autosize; cell-range (set / clear / get / copy / paste / fill); undo / redo / history; column visibility; active cell; tree expand / collapse / lazy children; CSV export; saved views (`getTableView` / `applyTableView`).

Both `ref={tableRef}` (forwarded ref) and `onTableReady={(handle) => ...}` (callback prop) routes deliver the same `TableHandle` object — pick whichever fits your component layering.

## Theme

```tsx
<ChronixTable theme={{ cellPaddingX: 12, defaultRowHeight: 36 }} ... />
```

29 theme tokens; partial merge — unset tokens fall back to `defaultChronixTableTheme`. See `ChronixTableTheme` type for the full key list.

## Tree data

Pass a row tree via `RowSpec.children` + flag one visible column as `treeColumn: true`:

```tsx
const columns: readonly ColumnSpec[] = [
  { id: 'name', field: 'name', headerName: 'Name', flex: 1, treeColumn: true },
  { id: 'size', field: 'size', headerName: 'Size', width: 120, type: 'number' },
];

const rows: readonly RowSpec[] = [
  {
    id: 'p1',
    data: { name: 'project-a', size: 0 },
    children: [
      { id: 'p1/m1', data: { name: 'module-a', size: 1024 } },
      { id: 'p1/m2', data: { name: 'module-b', size: 2048 } },
    ],
  },
];
```

For server-paginated trees, use `RowSpec.hasChildren: true` + the `childrenLoader: (parent) => Promise<readonly RowSpec[]>` prop for lazy load.

## Saved views

```tsx
// Capture the current (columns + sort + filter + page + pageSize) into a
// JSON-serializable snapshot, then restore later.
const view = tableRef.current!.getTableView();
localStorage.setItem('my-view', JSON.stringify(view));

// Restore — invokes onColumnsChange once with the reconciled columns array.
const raw = localStorage.getItem('my-view');
if (raw) tableRef.current!.applyTableView(JSON.parse(raw));
```

Wire the `onColumnsChange` callback to swap state atomically:

```tsx
<ChronixTable
  ...
  onColumnsChange={(p) => setColumns(p.columns)}
/>
```

## React-specific notes

- The default surface uses React 18's automatic batching — synchronous `setState` calls inside chronix-table emit handlers are batched as expected.
- Pointer-driven gestures (range select, drag-fill) pre-settle pointer position by ~50ms to give React state updates a chance to commit before the next frame's hit-test reads the new state — this is internal to the adapter; consumers don't need to mirror it.
- Callback props use camelCase (`onCellValueChange`) — equivalent to the kebab-case emits (`@cell-value-change`) on the Vue 3 / Vue 2.7 siblings.

## v0.1.0 features

22 consumer-tunable extensions plus two B-class chronix-NEW IR variants land in v0.1.0:

- **Cell-style editor** (4 axes × per-side × HSV picker): background + text + font + border styling on every cell. Controllable via `cellStyleByRowIdColId?` prop + `onCellStyleChange` callback. Preset color palette + per-axis recent-color LRU ring. 3-tier font-weight precision (Bold toggle + 9-button grid + 1-1000 continuous slider).
- **Advanced filter typeahead** (4-slot type-aware, 14 sub-phases): column / operator / conjunction / value detection with histogram count badges, date-value formatter prop, custom column-type operator override, i18n labels, auto-trigger, auto-scroll, per-slot recent LRU rings, SSR-async value getter.
- **Validation** (Phase 101 sync + Phase 111 async + Phase 115 cross-cell): per-column `validator?` (sync) + `validatorAsync?` (async). Cross-cell row validators via `rowValidators?: readonly RowValidator[]` prop. Invalid cells paint `cx-table-cell--invalid` + `data-cell-invalid="true"` + `aria-invalid="true"`. `onCellEditStop` callback receives `validationError?: EditValidationError`. Snapshot via `tableRef.current!.getInvalidCells()`; subscribe via `onInvalidCellsChange`. Paste / drag-fill respects `pasteValidatorPolicy?: 'skip-rejected' | 'allow-all'`.
- **Multi-filter container** (Phase 102 + 114 + 116 + 117 + 117.1): `filterUi: 'multi'` opt-in + `multiFilterChildTypes?: readonly ('text' | 'number' | 'set')[]`. Stacked widgets with AND/OR segmented mode toggle inside a native `<details>` disclosure. Runtime add/remove slot via `+ 添加条件` / `×` (emit-only persistence via `onAddMultiFilterSlot` / `onRemoveMultiFilterSlot`). Set-child slot variant + per-leaf consumer override via `multiFilterChildRenderer?: (args: MultiFilterChildRendererArgs) => ReactNode | null`. Recursive nested groups via `MultiFilterEntry = MultiFilterChild | MultiFilterGroup`; in-UI `+ 添加分组` / `× 移除分组` buttons fire `onAddMultiFilterGroup` / `onRemoveMultiFilterGroup` with `path: readonly number[]`; 3 path-based handle methods `getMultiFilterEntryAtPath` / `setMultiFilterEntryAtPath` / `removeMultiFilterEntryAtPath`.
- **Per-column typeahead recent + AbortSignal** (Phase 118): `typeaheadRecentScope?: 'global' | 'per-column-value'` opt-in widens the value-slot LRU ring to per-`${slot}:${colId}` keys. `advancedFilterValueGetter?` signature gains optional 3rd-arg `signal?: AbortSignal`.

See [`audit/TABLE_API_SURFACE_v0.1.0.md`](https://github.com/liaoyu1992/chronixjs/blob/master/audit/TABLE_API_SURFACE_v0.1.0.md) for the full export inventory.

## Validation + Multi-filter Quick start

```tsx
import { useState } from 'react';
import type { ColumnSpec, EditValidationError, RowSpec } from '@chronixjs/table';
import { ChronixTable } from '@chronixjs/table-react';
import type { CellEditStopPayload } from '@chronixjs/table-react';

export function MyTable() {
  const [columns] = useState<readonly ColumnSpec[]>([
    { id: 'id', field: 'id', headerName: 'ID', width: 80 },
    {
      id: 'name',
      field: 'name',
      headerName: '名称',
      flex: 1,
      editable: true,
      // Phase 101 — validator returns null (valid) or a string / EditValidationError.
      validator: (value) =>
        typeof value === 'string' && value.length < 2 ? 'must be ≥2 chars' : null,
    },
    {
      id: 'qty',
      field: 'qty',
      headerName: '数量',
      width: 200,
      type: 'number',
      // Phase 102 — multi-filter container with 2 stacked number inputs + AND/OR.
      filterUi: 'multi',
      multiFilterChildTypes: ['number', 'number'],
    },
  ]);

  const [rows] = useState<readonly RowSpec[]>([
    { id: 'r1', data: { id: 1, name: 'Alpha', qty: 10 } },
    { id: 'r2', data: { id: 2, name: 'Beta', qty: 50 } },
    { id: 'r3', data: { id: 3, name: 'Gamma', qty: 90 } },
  ]);

  function onCellEditStop(payload: CellEditStopPayload) {
    if (payload.validationError != null) {
      // Rejected by validator — editor stays open + cell is painted invalid.
      console.warn('Invalid:', payload.validationError.reason);
    }
  }

  return (
    <ChronixTable columns={columns} rows={rows} showFilterRow onCellEditStop={onCellEditStop} />
  );
}
```

For full demos of cell-style editor + typeahead + all 22 extensions, see [`examples/table-react/src/App.tsx`](https://github.com/liaoyu1992/chronixjs/tree/master/examples/table-react).

## See also

- Core types + IR + pure helpers: [`@chronixjs/table`](https://www.npmjs.com/package/@chronixjs/table)
- Headless UI primitives: [`@chronixjs/cx-kit`](https://www.npmjs.com/package/@chronixjs/cx-kit)
- Vue 3 sibling: [`@chronixjs/table-vue3`](https://www.npmjs.com/package/@chronixjs/table-vue3)
- Vue 2.7 sibling: [`@chronixjs/table-vue2`](https://www.npmjs.com/package/@chronixjs/table-vue2)
- Live example: [`examples/table-react`](https://github.com/liaoyu1992/chronixjs/tree/master/examples/table-react) in the monorepo
- 3-adapter parity verdict: [`audit/TABLE_PUBLISH_PARITY_SWEEP_v0.1.0.md`](https://github.com/liaoyu1992/chronixjs/blob/master/audit/TABLE_PUBLISH_PARITY_SWEEP_v0.1.0.md)

## License

[MIT](./LICENSE) © liaoyu1992
