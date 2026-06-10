# Sorting

Enable single and multi-column sorting on your data table. Sorting is configured per-column via `ColumnSpec`.

## Basic Sorting

Set `sortable: true` on columns to enable click-to-sort:

::: code-group

```vue [Vue 3]
<template>
  <ChronixTable :columns="columns" :rows="rows" @sort-change="onSortChange" />
</template>

<script setup lang="ts">
import { ChronixTable } from '@chronixjs/table-vue3';
import type { ColumnSpec, RowSpec } from '@chronixjs/table';

const columns: ColumnSpec[] = [
  { id: 'name', field: 'name', headerName: 'Name', sortable: true },
  { id: 'age', field: 'age', headerName: 'Age', sortable: true },
  { id: 'email', field: 'email', headerName: 'Email' },
];

const rows: RowSpec[] = [
  { id: '1', data: { name: 'Charlie', age: 35, email: 'charlie@example.com' } },
  { id: '2', data: { name: 'Alice', age: 28, email: 'alice@example.com' } },
  { id: '3', data: { name: 'Bob', age: 32, email: 'bob@example.com' } },
];

function onSortChange(payload) {
  console.log('Sort:', payload.sortSpec);
}
</script>
```

```vue [Vue 2]
<template>
  <ChronixTable :columns="columns" :rows="rows" @sort-change="onSortChange" />
</template>

<script>
import { ChronixTable } from '@chronixjs/table-vue2';

export default {
  components: { ChronixTable },
  data() {
    return {
      columns: [
        { id: 'name', field: 'name', headerName: 'Name', sortable: true },
        { id: 'age', field: 'age', headerName: 'Age', sortable: true },
      ],
      rows: [
        { id: '1', data: { name: 'Charlie', age: 35 } },
        { id: '2', data: { name: 'Alice', age: 28 } },
      ],
    };
  },
  methods: {
    onSortChange(payload) {
      console.log('Sort:', payload.sortSpec);
    },
  },
};
</script>
```

```tsx [React]
import { ChronixTable } from '@chronixjs/table-react';
import type { ColumnSpec, RowSpec } from '@chronixjs/table';

const columns: ColumnSpec[] = [
  { id: 'name', field: 'name', headerName: 'Name', sortable: true },
  { id: 'age', field: 'age', headerName: 'Age', sortable: true },
];

const rows: RowSpec[] = [
  { id: '1', data: { name: 'Charlie', age: 35 } },
  { id: '2', data: { name: 'Alice', age: 28 } },
];

export function App() {
  return (
    <ChronixTable
      columns={columns}
      rows={rows}
      onSortChange={(payload) => console.log('Sort:', payload.sortSpec)}
    />
  );
}
```

:::

## SortSpec

The sort state is an array of `SortSpec` objects:

```typescript
interface SortSpec {
  readonly colId: string;
  readonly direction: 'asc' | 'desc';
}
```

Clicking a sortable column header cycles through: `asc` → `desc` → unsorted.

## Custom Comparator

Override the default sort behavior with a `comparator` function:

```typescript
const columns: ColumnSpec[] = [
  {
    id: 'name',
    field: 'name',
    headerName: 'Name',
    sortable: true,
    comparator: (a, b, args) => {
      // Case-insensitive sort
      const aStr = String(a).toLowerCase();
      const bStr = String(b).toLowerCase();
      return aStr.localeCompare(bStr);
    },
  },
  {
    id: 'priority',
    field: 'priority',
    headerName: 'Priority',
    sortable: true,
    comparator: (a, b) => {
      // Custom priority order: High > Medium > Low
      const order = { High: 3, Medium: 2, Low: 1 };
      return (order[b] || 0) - (order[a] || 0);
    },
  },
];
```

The comparator receives `(valueA, valueB, args)` where `args` contains `rowA`, `rowB`, and `column`.

## Programmatic Sort

Control sorting via the `TableHandle`:

::: code-group

```vue [Vue 3]
<template>
  <div>
    <button @click="sortByAge">Sort by Age</button>
    <button @click="clearSort">Clear Sort</button>
    <ChronixTable :columns="columns" :rows="rows" @table-ready="onReady" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ChronixTable } from '@chronixjs/table-vue3';
import type { TableHandle } from '@chronixjs/table-vue3';

const handle = ref<TableHandle | null>(null);

function onReady(h: TableHandle) {
  handle.value = h;
}

function sortByAge() {
  handle.value?.setSort({ colId: 'age', direction: 'desc' });
}

function clearSort() {
  handle.value?.clearSort();
}
</script>
```

:::

### TableHandle Sort Methods

| Method      | Signature                                        | Description        |
| ----------- | ------------------------------------------------ | ------------------ |
| `getSort`   | `() => readonly SortSpec[]`                      | Current sort state |
| `setSort`   | `(spec: SortSpec \| SortSpec[] \| null) => void` | Apply sort         |
| `clearSort` | `() => void`                                     | Remove all sorting |

## Sort Change Event

Listen for sort changes:

| Event         | Payload                             |
| ------------- | ----------------------------------- |
| `sort-change` | `{ sortSpec: readonly SortSpec[] }` |

Multi-column sort is supported — `sortSpec` is an array where the first entry has highest priority.
