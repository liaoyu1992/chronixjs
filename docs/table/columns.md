# Columns

Column definitions control how data is displayed, formatted, and interacted with in the table. Each column is described by a `ColumnSpec` object.

## Basic Usage

::: code-group

```vue [Vue 3]
<template>
  <ChronixTable :columns="columns" :rows="rows" />
</template>

<script setup lang="ts">
import { ChronixTable } from '@chronixjs/table-vue3';
import type { ColumnSpec, RowSpec } from '@chronixjs/table';

const columns: ColumnSpec[] = [
  { id: 'name', field: 'name', headerName: 'Name', width: 200, sortable: true },
  { id: 'age', field: 'age', headerName: 'Age', width: 100, sortable: true },
  { id: 'email', field: 'email', headerName: 'Email', flex: 1 },
];

const rows: RowSpec[] = [
  { id: '1', data: { name: 'Alice', age: 30, email: 'alice@example.com' } },
  { id: '2', data: { name: 'Bob', age: 25, email: 'bob@example.com' } },
];
</script>
```

```vue [Vue 2]
<template>
  <ChronixTable :columns="columns" :rows="rows" />
</template>

<script>
import { ChronixTable } from '@chronixjs/table-vue2';

export default {
  components: { ChronixTable },
  data() {
    return {
      columns: [
        { id: 'name', field: 'name', headerName: 'Name', width: 200 },
        { id: 'age', field: 'age', headerName: 'Age', width: 100 },
        { id: 'email', field: 'email', headerName: 'Email', flex: 1 },
      ],
      rows: [
        { id: '1', data: { name: 'Alice', age: 30, email: 'alice@example.com' } },
        { id: '2', data: { name: 'Bob', age: 25, email: 'bob@example.com' } },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { ChronixTable } from '@chronixjs/table-react';
import type { ColumnSpec, RowSpec } from '@chronixjs/table';

const columns: ColumnSpec[] = [
  { id: 'name', field: 'name', headerName: 'Name', width: 200, sortable: true },
  { id: 'age', field: 'age', headerName: 'Age', width: 100 },
  { id: 'email', field: 'email', headerName: 'Email', flex: 1 },
];

const rows: RowSpec[] = [
  { id: '1', data: { name: 'Alice', age: 30, email: 'alice@example.com' } },
  { id: '2', data: { name: 'Bob', age: 25, email: 'bob@example.com' } },
];

export function App() {
  return <ChronixTable columns={columns} rows={rows} />;
}
```

:::

## ColumnSpec Reference

### Identity & Display

| Prop         | Type      | Default | Description                         |
| ------------ | --------- | ------- | ----------------------------------- |
| `id`         | `string`  | —       | **Required.** Unique column ID      |
| `field`      | `string`  |         | Data field key from `RowSpec.data`  |
| `headerName` | `string`  |         | Header cell display text            |
| `type`       | `string`  |         | Column type hint (e.g. `'numeric'`) |
| `hide`       | `boolean` | `false` | Hide the column                     |

### Sizing

| Prop       | Type     | Default | Description                      |
| ---------- | -------- | ------- | -------------------------------- |
| `width`    | `number` |         | Fixed width in pixels            |
| `minWidth` | `number` |         | Minimum column width             |
| `maxWidth` | `number` |         | Maximum column width             |
| `flex`     | `number` |         | Flex grow factor for auto-sizing |

### Sorting & Filtering

| Prop         | Type                         | Default | Description                 |
| ------------ | ---------------------------- | ------- | --------------------------- |
| `sortable`   | `boolean`                    | `false` | Enable column sorting       |
| `comparator` | `(a, b, args) => number`     |         | Custom sort comparator      |
| `filterable` | `boolean`                    | `false` | Show filter for this column |
| `filterUi`   | `'text' \| 'set' \| 'multi'` |         | Filter UI type              |

### Value Transforms

| Prop             | Type                | Description               |
| ---------------- | ------------------- | ------------------------- |
| `valueGetter`    | `(args) => unknown` | Custom value accessor     |
| `valueFormatter` | `(args) => string`  | Format cell display value |

### Editing

| Prop             | Type                                                    | Description         |
| ---------------- | ------------------------------------------------------- | ------------------- |
| `editable`       | `boolean`                                               | Enable cell editing |
| `validator`      | `(value, row) => string \| EditValidationError \| null` | Sync validation     |
| `validatorAsync` | `(value, row) => Promise<...>`                          | Async validation    |

### Layout

| Prop           | Type                        | Default | Description        |
| -------------- | --------------------------- | ------- | ------------------ |
| `pinned`       | `'left' \| 'right' \| null` |         | Pin column to side |
| `resizable`    | `boolean`                   |         | Allow user resize  |
| `reorderable`  | `boolean`                   |         | Allow drag reorder |
| `autosizeable` | `boolean`                   |         | Allow auto-sizing  |
| `wrapText`     | `boolean`                   |         | Wrap long text     |

### Special Columns

| Prop            | Type      | Description                         |
| --------------- | --------- | ----------------------------------- |
| `rowDragHandle` | `boolean` | Show drag handle for row reordering |
| `rowNumber`     | `boolean` | Show row index                      |
| `treeColumn`    | `boolean` | Show tree expand/collapse chevron   |

### Header Groups

| Prop          | Type                          | Description                       |
| ------------- | ----------------------------- | --------------------------------- |
| `headerGroup` | `string \| readonly string[]` | Group columns under shared header |

### Styling

| Prop        | Type                                                   | Description         |
| ----------- | ------------------------------------------------------ | ------------------- |
| `cellClass` | `string \| string[] \| ((args) => string \| string[])` | Custom cell classes |

### Export

| Prop          | Type          | Description                  |
| ------------- | ------------- | ---------------------------- |
| `exportStyle` | `ExportStyle` | Per-column export formatting |

## Custom Value Formatting

Use `valueFormatter` to transform raw data for display:

```typescript
const columns: ColumnSpec[] = [
  {
    id: 'salary',
    field: 'salary',
    headerName: 'Salary',
    valueFormatter: (args) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(args.value as number),
  },
  {
    id: 'status',
    field: 'active',
    headerName: 'Status',
    valueFormatter: (args) => (args.value ? 'Active' : 'Inactive'),
  },
];
```

## Custom Value Accessor

Use `valueGetter` when the displayed value isn't a direct field mapping:

```typescript
const columns: ColumnSpec[] = [
  {
    id: 'fullName',
    headerName: 'Full Name',
    valueGetter: (args) => {
      const d = args.row.data;
      return `${d.firstName} ${d.lastName}`;
    },
  },
];
```

## Header Groups

Group multiple columns under a shared header:

```typescript
const columns: ColumnSpec[] = [
  { id: 'q1', field: 'q1', headerName: 'Q1', headerGroup: 'Revenue' },
  { id: 'q2', field: 'q2', headerName: 'Q2', headerGroup: 'Revenue' },
  { id: 'q3', field: 'q3', headerName: 'Q3', headerGroup: 'Revenue' },
  { id: 'q4', field: 'q4', headerName: 'Q4', headerGroup: 'Revenue' },
];
```

Multi-level groups use an array:

```typescript
{
  headerGroup: ['Financials', 'Revenue'];
}
```

## Column Visibility

Hide columns from display:

```typescript
const columns: ColumnSpec[] = [
  { id: 'id', field: 'id', headerName: 'ID', hide: true },
  { id: 'name', field: 'name', headerName: 'Name' },
];
```

Use `showColumnVisibilityMenu` prop or `TableHandle` to toggle visibility at runtime:

::: code-group

```vue [Vue 3]
<template>
  <ChronixTable
    ref="tableRef"
    :columns="columns"
    :rows="rows"
    show-column-visibility-menu
    @table-ready="onTableReady"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ChronixTable } from '@chronixjs/table-vue3';
import type { TableHandle } from '@chronixjs/table-vue3';

const tableHandle = ref<TableHandle | null>(null);

function onTableReady(handle: TableHandle) {
  tableHandle.value = handle;
}

// Toggle column visibility programmatically
function toggleColumn(colId: string) {
  tableHandle.value?.toggleColumnVisibility(colId);
}
</script>
```

:::
