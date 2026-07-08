# Rows & Data

Rows contain the data displayed in the table. Each row is defined by a `RowSpec` object.

## RowSpec

```typescript
interface RowSpec {
  readonly id: string;
  readonly data: Readonly<Record<string, unknown>>;
  readonly heightHint?: number;
  readonly children?: readonly RowSpec[];
  readonly hasChildren?: boolean;
  readonly depth?: number;
  readonly groupKey?: string | null;
  readonly pinned?: 'top' | 'bottom';
  readonly draggable?: boolean;
}
```

| Field        | Type                      | Required | Description              |
| ------------ | ------------------------- | -------- | ------------------------ |
| `id`         | `string`                  | ✅       | Unique row identifier    |
| `data`       | `Record<string, unknown>` | ✅       | Column field values      |
| `heightHint` | `number`                  |          | Custom row height (px)   |
| `pinned`     | `'top' \| 'bottom'`       |          | Pin row to top or bottom |
| `draggable`  | `boolean`                 |          | Allow row drag reorder   |

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
  { id: 'name', field: 'name', headerName: 'Name' },
  { id: 'role', field: 'role', headerName: 'Role' },
];

const rows: RowSpec[] = [
  { id: '1', data: { name: 'Alice Johnson', role: 'Engineer' } },
  { id: '2', data: { name: 'Bob Smith', role: 'Designer' } },
  { id: '3', data: { name: 'Carol White', role: 'Manager' } },
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
        { id: 'name', field: 'name', headerName: 'Name' },
        { id: 'role', field: 'role', headerName: 'Role' },
      ],
      rows: [
        { id: '1', data: { name: 'Alice Johnson', role: 'Engineer' } },
        { id: '2', data: { name: 'Bob Smith', role: 'Designer' } },
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
  { id: 'name', field: 'name', headerName: 'Name' },
  { id: 'role', field: 'role', headerName: 'Role' },
];

const rows: RowSpec[] = [
  { id: '1', data: { name: 'Alice Johnson', role: 'Engineer' } },
  { id: '2', data: { name: 'Bob Smith', role: 'Designer' } },
];

export function App() {
  return <ChronixTable columns={columns} rows={rows} />;
}
```

:::

## Pinned Rows

Pin summary or header rows to the top or bottom:

```typescript
const rows: RowSpec[] = [
  // Pinned to top — always visible
  { id: 'header-row', data: { name: 'Department A', role: 'Summary' }, pinned: 'top' },

  // Regular scrollable rows
  { id: '1', data: { name: 'Alice', role: 'Engineer' } },
  { id: '2', data: { name: 'Bob', role: 'Designer' } },

  // Pinned to bottom
  { id: 'totals-row', data: { name: 'Total: 2', role: '' }, pinned: 'bottom' },
];
```

## Row Events

Listen for row-level interactions:

::: code-group

```vue [Vue 3]
<template>
  <ChronixTable :columns="columns" :rows="rows" @row-click="onRowClick" @cell-click="onCellClick" />
</template>

<script setup lang="ts">
import { ChronixTable } from '@chronixjs/table-vue3';
import type { RowClickPayload, CellClickPayload } from '@chronixjs/table-vue3';

function onRowClick(payload: RowClickPayload) {
  console.log('Row clicked:', payload.row.id);
}

function onCellClick(payload: CellClickPayload) {
  console.log(`Cell [${payload.column.id}]:`, payload.value);
}
</script>
```

```tsx [React]
import { ChronixTable } from '@chronixjs/table-react';

export function App() {
  return (
    <ChronixTable
      columns={columns}
      rows={rows}
      onRowClick={(payload) => console.log('Row:', payload.row.id)}
      onCellClick={(payload) => console.log('Cell:', payload.value)}
    />
  );
}
```

:::

### Row Event Payloads

| Event           | Payload Fields                      |
| --------------- | ----------------------------------- |
| `row-click`     | `row`, `jsEvent`                    |
| `cell-click`    | `row`, `column`, `value`, `jsEvent` |
| `cell-dblclick` | `row`, `column`, `value`, `jsEvent` |

## Row Selection

Enable row selection with `selectionMode`:

::: code-group

```vue [Vue 3]
<template>
  <ChronixTable
    :columns="columns"
    :rows="rows"
    selection-mode="multi"
    @selection-change="onSelectionChange"
  />
</template>

<script setup lang="ts">
import { ChronixTable } from '@chronixjs/table-vue3';

function onSelectionChange(payload: { selectedRowIds: readonly string[] }) {
  console.log('Selected rows:', payload.selectedRowIds);
}
</script>
```

:::

| `selectionMode` | Description                         |
| --------------- | ----------------------------------- |
| `'none'`        | No selection (default)              |
| `'single'`      | Single row selection                |
| `'multi'`       | Multi-row selection with checkboxes |

## Row Drag Reorder

Enable drag-to-reorder with a drag handle column:

```typescript
const columns: ColumnSpec[] = [
  { id: 'drag', rowDragHandle: true, width: 50 },
  { id: 'name', field: 'name', headerName: 'Name' },
];
```

Enable with props:

::: code-group

```vue [Vue 3]
<template>
  <ChronixTable
    :columns="columns"
    :rows="rows"
    row-drag-column="{ enabled: true }"
    @row-order-change="onReorder"
  />
</template>

<script setup lang="ts">
function onReorder(payload) {
  console.log(`Row ${payload.rowId}: ${payload.oldIndex} → ${payload.newIndex}`);
}
</script>
```

:::

## Server-Side Data

For large datasets, use server-side row model:

::: code-group

```vue [Vue 3]
<template>
  <ChronixTable
    :columns="columns"
    row-model-type="serverSide"
    :server-side-data-source="dataSource"
    :cache-block-size="50"
  />
</template>

<script setup lang="ts">
import { ChronixTable } from '@chronixjs/table-vue3';
import type { ServerSideDataSource } from '@chronixjs/table-server-side';

const dataSource: ServerSideDataSource = {
  async getRows(params) {
    const response = await fetch(`/api/data?page=${params.request.page}`);
    const data = await response.json();
    params.success({ rows: data.rows, totalCount: data.total });
  },
};
</script>
```

:::

## Loading & Empty States

::: code-group

```vue [Vue 3]
<template>
  <ChronixTable
    :columns="columns"
    :rows="rows"
    :loading="isLoading"
    loading-overlay="Loading data..."
    no-rows-overlay="No records found"
  />
</template>
```

:::
