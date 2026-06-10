# @chronixjs/table-vue2

Vue 2.7 component + composables built on [`@chronixjs/table`](https://www.npmjs.com/package/@chronixjs/table). Verbatim feature mirror of [`@chronixjs/table-vue3`](https://www.npmjs.com/package/@chronixjs/table-vue3); ship the same surface to legacy Vue 2.7 codebases.

> **Status.** Currently published under the `alpha` npm dist-tag (`@alpha`). After v0.1.0 GA lands, the `@alpha` suffix can be omitted (the default `latest` tag will point to v0.1.0). APIs may shift before `1.0.0`; SemVer stability commitment begins at `1.0`.

## Install

```bash
pnpm add @chronixjs/table-vue2@alpha vue@^2.7    # currently
pnpm add @chronixjs/table-vue2 vue@^2.7          # after v0.1.0 GA
```

The `@chronixjs/table` core is pulled transitively — you don't install it separately unless you also consume the framework-agnostic types / IR / pure helpers in non-Vue code.

`vue` is a peer dependency (`^2.7`). Vue 2.7 (the final 2.x release) ships the composition API; earlier 2.6.x is not supported.

## Quickstart

```vue
<script lang="ts">
import Vue from 'vue';
import type { ColumnSpec, RowSpec } from '@chronixjs/table';
import { ChronixTable } from '@chronixjs/table-vue2';
import type { CellValueChangePayload, TableHandle } from '@chronixjs/table-vue2';

export default Vue.extend({
  components: { ChronixTable },
  data() {
    return {
      columns: [
        { id: 'id', field: 'id', headerName: 'ID', width: 80 },
        { id: 'name', field: 'name', headerName: '名称', flex: 1, editable: true },
        { id: 'qty', field: 'qty', headerName: '数量', width: 120, type: 'number', editable: true },
        { id: 'price', field: 'price', headerName: '单价', type: 'number', pinned: 'right' },
      ] as readonly ColumnSpec[],
      rows: [
        { id: 'r1', data: { id: 1, name: 'Alpha', qty: 10, price: 100 } },
        { id: 'r2', data: { id: 2, name: 'Beta', qty: 20, price: 200 } },
        { id: 'r3', data: { id: 3, name: 'Gamma', qty: 30, price: 300 } },
      ] as readonly RowSpec[],
    };
  },
  methods: {
    onCellValueChange(payload: CellValueChangePayload) {
      this.rows = this.rows.map((r) =>
        r.id === payload.rowId
          ? { ...r, data: { ...r.data, [payload.colId]: payload.newValue } }
          : r,
      );
    },
  },
});
</script>

<template>
  <ChronixTable
    ref="table"
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

```ts
import { useTableLayout, useTableContainerSize } from '@chronixjs/table-vue2';
```

Identical shape to the Vue 3 composables — Vue 2.7's composition API is API-compatible with Vue 3 for everything this package uses.

## Imperative handle

Access the `TableHandle` via `this.$refs.table` (template ref):

```ts
const handle = this.$refs['table'] as unknown as TableHandle | undefined;
handle?.setActiveCell('r1', 'name');
handle?.exportToCsv('my-table.csv', { rowSource: 'filtered' });
```

Same 58-method surface as [`@chronixjs/table-vue3`](https://www.npmjs.com/package/@chronixjs/table-vue3) — column-table / row-data-source / resolved widths; sort / filter / selection / page; editing; column resize / move / autosize; cell-range; undo / redo; column visibility; active cell; tree expand / lazy children; CSV export; saved views (`getTableView` / `applyTableView`).

## Theme

```vue
<ChronixTable :theme="{ cellPaddingX: 12, defaultRowHeight: 36 }" ... />
```

29 theme tokens; partial merge. See `ChronixTableTheme` type for the full key list.

## Tree data, saved views, etc.

Behaviorally identical to the Vue 3 adapter. See [`@chronixjs/table-vue3`'s README](https://www.npmjs.com/package/@chronixjs/table-vue3) for tree-data + saved-views examples; the prop / emit / handle shapes are verbatim.

## Vue 2.7-specific notes

- Vue 2.7 vnode-data uses nested `attrs` / `domProps` / `on` keys rather than Vue 3's flat object — but you never write vnode data directly when using `<ChronixTable>` declaratively. The adapter handles the difference internally.
- `wrapper.emitted()` typing in `@vue/test-utils` v1 (Vue 2.7) requires an outer cast: `(wrapper.emitted('cell-value-change') as [CellValueChangePayload][] | undefined)` — not the inner-payload cast Vue 3 uses.

## v0.1.0 features

22 consumer-tunable extensions plus two B-class chronix-NEW IR variants land in v0.1.0:

- **Cell-style editor** (4 axes × per-side × HSV picker): background + text + font + border styling on every cell. Controllable via `cellStyleByRowIdColId?` prop + `cell-style-change` emit. Preset color palette + per-axis recent-color LRU ring. 3-tier font-weight precision (Bold toggle + 9-button grid + 1-1000 continuous slider).
- **Advanced filter typeahead** (4-slot type-aware, 14 sub-phases): column / operator / conjunction / value detection with histogram count badges, date-value formatter prop, custom column-type operator override, i18n labels, auto-trigger, auto-scroll, per-slot recent LRU rings, SSR-async value getter.
- **Validation** (Phase 101 sync + Phase 111 async + Phase 115 cross-cell): per-column `validator?` (sync) + `validatorAsync?` (async). Cross-cell row validators via `rowValidators?: readonly RowValidator[]` SFC prop. Invalid cells paint `cx-table-cell--invalid` + `data-cell-invalid="true"` + `aria-invalid="true"`. `cell-edit-stop` payload carries `validationError?: EditValidationError`. Snapshot via `tableRef.value!.getInvalidCells()`; subscribe via `invalid-cells-change`. Paste / drag-fill respects `pasteValidatorPolicy?: 'skip-rejected' | 'allow-all'`.
- **Multi-filter container** (Phase 102 + 114 + 116 + 117 + 117.1): `filterUi: 'multi'` opt-in + `multiFilterChildTypes?: readonly ('text' | 'number' | 'set')[]`. Stacked widgets with AND/OR segmented mode toggle inside a native `<details>` disclosure. Runtime add/remove slot via `+ 添加条件` / `×` (emit-only persistence via `add-multi-filter-slot` / `remove-multi-filter-slot`). Set-child slot variant + per-leaf consumer override via `multiFilterChildRenderer?: (args: MultiFilterChildRendererArgs) => VNode | null`. Recursive nested groups via `MultiFilterEntry = MultiFilterChild | MultiFilterGroup`; in-UI `+ 添加分组` / `× 移除分组` buttons emit `add-multi-filter-group` / `remove-multi-filter-group` with `path: readonly number[]`; 3 path-based handle methods `getMultiFilterEntryAtPath` / `setMultiFilterEntryAtPath` / `removeMultiFilterEntryAtPath`.
- **Per-column typeahead recent + AbortSignal** (Phase 118): `typeaheadRecentScope?: 'global' | 'per-column-value'` opt-in widens the value-slot LRU ring to per-`${slot}:${colId}` keys. `advancedFilterValueGetter?` signature gains optional 3rd-arg `signal?: AbortSignal`.

See [`audit/TABLE_API_SURFACE_v0.1.0.md`](https://github.com/liaoyu1992/chronixjs/blob/master/audit/TABLE_API_SURFACE_v0.1.0.md) for the full export inventory.

## Validation + Multi-filter Quick start

```vue
<script lang="ts">
import Vue from 'vue';
import type { ColumnSpec, RowSpec } from '@chronixjs/table';
import { ChronixTable } from '@chronixjs/table-vue2';
import type { CellEditStopPayload } from '@chronixjs/table-vue2';

export default Vue.extend({
  components: { ChronixTable },
  data() {
    return {
      columns: [
        { id: 'id', field: 'id', headerName: 'ID', width: 80 },
        {
          id: 'name',
          field: 'name',
          headerName: '名称',
          flex: 1,
          editable: true,
          // Phase 101 — validator returns null (valid) or a string / EditValidationError.
          validator: (value: unknown) =>
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
      ] as readonly ColumnSpec[],
      rows: [
        { id: 'r1', data: { id: 1, name: 'Alpha', qty: 10 } },
        { id: 'r2', data: { id: 2, name: 'Beta', qty: 50 } },
        { id: 'r3', data: { id: 3, name: 'Gamma', qty: 90 } },
      ] as readonly RowSpec[],
    };
  },
  methods: {
    onCellEditStop(payload: CellEditStopPayload) {
      if (payload.validationError != null) {
        // Rejected by validator — editor stays open + cell is painted invalid.
        console.warn('Invalid:', payload.validationError.reason);
      }
    },
  },
});
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

For full demos of cell-style editor + typeahead + all 22 extensions, see [`examples/table-vue2/src/App.vue`](https://github.com/liaoyu1992/chronixjs/tree/master/examples/table-vue2).

## See also

- Core types + IR + pure helpers: [`@chronixjs/table`](https://www.npmjs.com/package/@chronixjs/table)
- Headless UI primitives: [`@chronixjs/cx-kit`](https://www.npmjs.com/package/@chronixjs/cx-kit)
- Vue 3 sibling: [`@chronixjs/table-vue3`](https://www.npmjs.com/package/@chronixjs/table-vue3)
- React 18 sibling: [`@chronixjs/table-react`](https://www.npmjs.com/package/@chronixjs/table-react)
- Live example: [`examples/table-vue2`](https://github.com/liaoyu1992/chronixjs/tree/master/examples/table-vue2) in the monorepo
- 3-adapter parity verdict: [`audit/TABLE_PUBLISH_PARITY_SWEEP_v0.1.0.md`](https://github.com/liaoyu1992/chronixjs/blob/master/audit/TABLE_PUBLISH_PARITY_SWEEP_v0.1.0.md)

## License

[MIT](./LICENSE) © liaoyu1992
