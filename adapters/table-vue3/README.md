# @chronixjs/table-vue3

Vue 3 component + composables built on [`@chronixjs/table`](https://www.npmjs.com/package/@chronixjs/table). The default surface most consumers want.

> **Status.** Currently published under the `alpha` npm dist-tag (`@alpha`). After v0.1.0 GA lands, the `@alpha` suffix can be omitted (the default `latest` tag will point to v0.1.0). APIs may shift before `1.0.0`; SemVer stability commitment begins at `1.0`.

## Install

```bash
pnpm add @chronixjs/table-vue3@alpha vue       # currently
pnpm add @chronixjs/table-vue3 vue             # after v0.1.0 GA
```

The `@chronixjs/table` core is pulled transitively — you don't install it separately unless you also consume the framework-agnostic types / IR / pure helpers in non-Vue code.

`vue` is a peer dependency (`^3.5.0`); bring your own.

## Quickstart

```vue
<script setup lang="ts">
import { ref } from 'vue';
import type { ColumnSpec, RowSpec } from '@chronixjs/table';
import { ChronixTable } from '@chronixjs/table-vue3';
import type { CellValueChangePayload, TableHandle } from '@chronixjs/table-vue3';

const tableRef = ref<TableHandle | null>(null);

const columns = ref<readonly ColumnSpec[]>([
  { id: 'id', field: 'id', headerName: 'ID', width: 80 },
  { id: 'name', field: 'name', headerName: '名称', flex: 1, editable: true },
  { id: 'qty', field: 'qty', headerName: '数量', width: 120, type: 'number', editable: true },
  { id: 'price', field: 'price', headerName: '单价', type: 'number', pinned: 'right' },
]);

const rows = ref<readonly RowSpec[]>([
  { id: 'r1', data: { id: 1, name: 'Alpha', qty: 10, price: 100 } },
  { id: 'r2', data: { id: 2, name: 'Beta', qty: 20, price: 200 } },
  { id: 'r3', data: { id: 3, name: 'Gamma', qty: 30, price: 300 } },
]);

function onCellValueChange(payload: CellValueChangePayload) {
  // chronix-table is emit-only; consumer rebuilds the rows array.
  rows.value = rows.value.map((r) =>
    r.id === payload.rowId ? { ...r, data: { ...r.data, [payload.colId]: payload.newValue } } : r,
  );
}
</script>

<template>
  <ChronixTable
    ref="tableRef"
    :columns="columns"
    :rows="rows"
    :show-filter-row="true"
    :show-footer-row="true"
    :show-column-visibility-menu="true"
    :enable-keyboard-navigation="true"
    selection-mode="multi"
    :pagination-enabled="true"
    :initial-page-size="20"
    cell-range-selection="enabled"
    :enable-undo-history="true"
    @cell-value-change="onCellValueChange"
  />
</template>
```

## Composables (advanced wiring)

When you need to drive the layout pipeline manually (custom renderer, headless test harness, or composing with another framework's reactivity):

```ts
import { useTableLayout, useTableContainerSize, useTableBodyScroll } from '@chronixjs/table-vue3';
```

- `useTableLayout({ columns, rows, theme, availableWidth, sortSpecs, filterSpecs, ... })` — reactive pipeline returning `widthByColId`, `displayedRowIds`, `rowYByRowId`, `pinnedZones`, `headerGroupRowsByZone` refs
- `useTableContainerSize(elRef)` — reactive `clientWidth` for the wrapper element
- `useTableBodyScroll(bodyRef)` — reactive `scrollTop` + `scrollLeft` + `clientHeight` for the scrolling body

## Imperative handle

```vue
<script setup lang="ts">
import { ref } from 'vue';
import type { TableHandle } from '@chronixjs/table-vue3';
import { ChronixTable } from '@chronixjs/table-vue3';

const tableRef = ref<TableHandle | null>(null);

function focusFirstCell() {
  tableRef.value?.setActiveCell('r1', 'name');
}

function exportFilteredCsv() {
  tableRef.value?.exportToCsv('my-table.csv', { rowSource: 'filtered' });
}
</script>

<template>
  <ChronixTable ref="tableRef" ... />
</template>
```

58 handle methods cover: column-table / row-data-source / resolved widths; sort / filter / selection / page / page-size; editing (start / commit / cancel / draft); column resize / move / autosize; cell-range (set / clear / get / copy / paste / fill); undo / redo / history; column visibility; active cell; tree expand / collapse / lazy children; CSV export; saved views (`getTableView` / `applyTableView`).

## Theme

```vue
<ChronixTable :theme="{ cellPaddingX: 12, defaultRowHeight: 36 }" ... />
```

29 theme tokens (cell padding, row heights, header heights, borders, scrollbar dims, drag-fill handle color, tooltip styling, overlay backgrounds, status-bar styling, tree spinner colors). Partial merge — unset tokens fall back to `defaultChronixTableTheme`. See `ChronixTableTheme` type for the full key list.

## Tree data

Pass a row tree via `RowSpec.children` + flag one visible column as `treeColumn: true`:

```ts
const columns = ref<readonly ColumnSpec[]>([
  { id: 'name', field: 'name', headerName: 'Name', flex: 1, treeColumn: true },
  { id: 'size', field: 'size', headerName: 'Size', width: 120, type: 'number' },
]);

const rows = ref<readonly RowSpec[]>([
  {
    id: 'p1',
    data: { name: 'project-a', size: 0 },
    children: [
      { id: 'p1/m1', data: { name: 'module-a', size: 1024 } },
      { id: 'p1/m2', data: { name: 'module-b', size: 2048 } },
    ],
  },
]);
```

Chevron click / Enter / Space / ArrowRight / ArrowLeft toggle expand. For server-paginated trees, use `RowSpec.hasChildren: true` + the `childrenLoader: (parent) => Promise<readonly RowSpec[]>` prop for lazy load — the adapter renders a spinner while loading.

## Saved views

```ts
// Capture the current (columns + sort + filter + page + pageSize) into a
// JSON-serializable snapshot, then restore later.
const view = tableRef.value!.getTableView();
localStorage.setItem('my-view', JSON.stringify(view));

// Restore — emits columns-change once with the reconciled columns array.
const raw = localStorage.getItem('my-view');
if (raw) tableRef.value!.applyTableView(JSON.parse(raw));
```

Wire the `columns-change` emit to swap `columns.value` atomically:

```vue
<ChronixTable ... @columns-change="(p) => (columns = p.columns)" />
```

## v0.1.0 features

22 consumer-tunable extensions plus two B-class chronix-NEW IR variants land in v0.1.0:

- **Cell-style editor** (4 axes × per-side × HSV picker): background + text + font + border styling on every cell. Controllable via `cellStyleByRowIdColId?` SFC prop + `cell-style-change` emit. Preset color palette + per-axis recent-color LRU ring. 3-tier font-weight precision (Bold toggle + 9-button grid + 1-1000 continuous slider). Opt in via `enable-cell-style-editor` prop and open programmatically with `tableRef.value!.openCellStyleEditor(rowId, colId)`.
- **Advanced filter typeahead** (4-slot type-aware, 14 sub-phases): column / operator / conjunction / value detection with histogram count badges, date-value formatter prop, custom column-type operator override, i18n labels, auto-trigger after non-value commits, auto-scroll active item, per-slot recent LRU rings, SSR-async value getter. Lives inside `<ChronixFiltersToolPanel>` advanced-filter textarea.
- **Validation** (Phase 101 sync + Phase 111 async + Phase 115 cross-cell): per-column `validator?` (sync) + `validatorAsync?` (async). Cross-cell row validators via `rowValidators?: readonly RowValidator[]` SFC prop. Invalid cells paint `cx-table-cell--invalid` + `data-cell-invalid="true"` + `aria-invalid="true"`. `cell-edit-stop` payload carries `validationError?: EditValidationError`. Snapshot via `tableRef.value!.getInvalidCells()`; subscribe via `invalid-cells-change`. Paste / drag-fill respects `pasteValidatorPolicy?: 'skip-rejected' | 'allow-all'`.
- **Multi-filter container** (Phase 102 + 114 + 116 + 117 + 117.1): `filterUi: 'multi'` opt-in + `multiFilterChildTypes?: readonly ('text' | 'number' | 'set')[]`. Stacked widgets with AND/OR segmented mode toggle inside a native `<details>` disclosure. Runtime add/remove slot via `+ 添加条件` / `×` (emit-only persistence via `add-multi-filter-slot` / `remove-multi-filter-slot`). Set-child slot variant (`MultiFilterChildSet`) + per-leaf consumer override via `multiFilterChildRenderer?: (args: MultiFilterChildRendererArgs) => VNode | null`. Recursive nested groups via `MultiFilterEntry = MultiFilterChild | MultiFilterGroup`; in-UI `+ 添加分组` / `× 移除分组` buttons emit `add-multi-filter-group` / `remove-multi-filter-group` with `path: readonly number[]`; consumers compose via 3 path-based handle methods `getMultiFilterEntryAtPath` / `setMultiFilterEntryAtPath` / `removeMultiFilterEntryAtPath` (empty path throws — root uses `setFilter` / `getFilter`).
- **Per-column typeahead recent + AbortSignal** (Phase 118): `typeaheadRecentScope?: 'global' | 'per-column-value'` opt-in widens the value-slot LRU ring to per-`${slot}:${colId}` keys. `advancedFilterValueGetter?` signature gains optional 3rd-arg `signal?: AbortSignal` for cancellation-aware fetches; race-discard token preserved as defense-in-depth for consumers that ignore the signal.

See [`audit/TABLE_API_SURFACE_v0.1.0.md`](https://github.com/liaoyu1992/chronixjs/blob/master/audit/TABLE_API_SURFACE_v0.1.0.md) for the full export inventory.

## Validation + Multi-filter Quick start

```vue
<script setup lang="ts">
import { ref } from 'vue';
import type { ColumnSpec, EditValidationError, RowSpec } from '@chronixjs/table';
import { ChronixTable } from '@chronixjs/table-vue3';
import type { CellEditStopPayload } from '@chronixjs/table-vue3';

const columns = ref<readonly ColumnSpec[]>([
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

const rows = ref<readonly RowSpec[]>([
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
</script>

<template>
  <ChronixTable
    :columns="columns"
    :rows="rows"
    :show-filter-row="true"
    @cell-edit-stop="onCellEditStop"
  />
</template>
```

For full demos of cell-style editor + typeahead + all 22 extensions, see [`examples/table-vue3/src/App.vue`](https://github.com/liaoyu1992/chronixjs/tree/master/examples/table-vue3).

## See also

- Core types + IR + pure helpers: [`@chronixjs/table`](https://www.npmjs.com/package/@chronixjs/table)
- Headless UI primitives: [`@chronixjs/cx-kit`](https://www.npmjs.com/package/@chronixjs/cx-kit)
- Vue 2.7 sibling: [`@chronixjs/table-vue2`](https://www.npmjs.com/package/@chronixjs/table-vue2)
- React 18 / 19 sibling: [`@chronixjs/table-react`](https://www.npmjs.com/package/@chronixjs/table-react)
- Live example: [`examples/table-vue3`](https://github.com/liaoyu1992/chronixjs/tree/master/examples/table-vue3) in the monorepo
- 3-adapter parity verdict: [`audit/TABLE_PUBLISH_PARITY_SWEEP_v0.1.0.md`](https://github.com/liaoyu1992/chronixjs/blob/master/audit/TABLE_PUBLISH_PARITY_SWEEP_v0.1.0.md)

## License

[MIT](./LICENSE) © liaoyu1992
