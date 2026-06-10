# Tree Data

Display hierarchical data with expandable tree rows. Tree data supports both local and async children loading.

## Basic Tree Data

Define rows with nested `children` arrays:

::: code-group

```vue [Vue 3]
<template>
  <ChronixTable :columns="columns" :rows="rows" />
</template>

<script setup lang="ts">
import { ChronixTable } from '@chronixjs/table-vue3';
import type { ColumnSpec, RowSpec } from '@chronixjs/table';

const columns: ColumnSpec[] = [
  { id: 'name', field: 'name', headerName: 'Name', treeColumn: true },
  { id: 'type', field: 'type', headerName: 'Type' },
  { id: 'size', field: 'size', headerName: 'Size' },
];

const rows: RowSpec[] = [
  {
    id: '1',
    data: { name: 'src', type: 'folder', size: '-' },
    hasChildren: true,
    children: [
      { id: '1-1', data: { name: 'index.ts', type: 'file', size: '2 KB' }, depth: 1 },
      { id: '1-2', data: { name: 'utils.ts', type: 'file', size: '5 KB' }, depth: 1 },
    ],
  },
  {
    id: '2',
    data: { name: 'package.json', type: 'file', size: '1 KB' },
  },
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
        { id: 'name', field: 'name', headerName: 'Name', treeColumn: true },
        { id: 'type', field: 'type', headerName: 'Type' },
      ],
      rows: [
        {
          id: '1',
          data: { name: 'src', type: 'folder' },
          hasChildren: true,
          children: [{ id: '1-1', data: { name: 'index.ts', type: 'file' }, depth: 1 }],
        },
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
  { id: 'name', field: 'name', headerName: 'Name', treeColumn: true },
  { id: 'type', field: 'type', headerName: 'Type' },
];

const rows: RowSpec[] = [
  {
    id: '1',
    data: { name: 'src', type: 'folder' },
    hasChildren: true,
    children: [{ id: '1-1', data: { name: 'index.ts', type: 'file' }, depth: 1 }],
  },
];

export function App() {
  return <ChronixTable columns={columns} rows={rows} />;
}
```

:::

## Tree Column

Set `treeColumn: true` on the column that should display the expand/collapse chevron:

```typescript
{ id: 'name', field: 'name', headerName: 'Name', treeColumn: true }
```

The chevron and indentation are automatically rendered in this column.

## RowSpec Tree Fields

| Field         | Type                 | Description                                      |
| ------------- | -------------------- | ------------------------------------------------ |
| `children`    | `readonly RowSpec[]` | Nested child rows                                |
| `hasChildren` | `boolean`            | Show expand chevron even without children loaded |
| `depth`       | `number`             | Nesting level (0 = root)                         |
| `groupKey`    | `string \| null`     | Grouping key                                     |

## Controlled Expansion

Control which rows are expanded:

::: code-group

```vue [Vue 3]
<template>
  <ChronixTable
    :columns="columns"
    :rows="rows"
    :expanded-row-ids="expandedIds"
    @expanded-row-ids-change="expandedIds = $event"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ChronixTable } from '@chronixjs/table-vue3';

const expandedIds = ref<string[]>(['1', '2']); // Pre-expanded rows
</script>
```

:::

### Expansion Props

| Prop                    | Type                | Default | Description              |
| ----------------------- | ------------------- | ------- | ------------------------ |
| `expandedRowIds`        | `readonly string[]` |         | Controlled expanded rows |
| `defaultExpandedRowIds` | `readonly string[]` | `[]`    | Initial expanded rows    |
| `defaultExpandedDepth`  | `number`            |         | Auto-expand to depth N   |

## Async Children Loading

Load children on demand from a server:

::: code-group

```vue [Vue 3]
<template>
  <ChronixTable :columns="columns" :rows="rows" :children-loader="loadChildren" />
</template>

<script setup lang="ts">
import { ChronixTable } from '@chronixjs/table-vue3';
import type { RowSpec } from '@chronixjs/table';

async function loadChildren({
  parent,
  signal,
}: {
  parent: RowSpec;
  signal: AbortSignal;
}): Promise<readonly RowSpec[]> {
  const response = await fetch(`/api/children/${parent.id}`, { signal });
  const data = await response.json();
  return data.map((item) => ({
    id: item.id,
    data: item,
    hasChildren: item.hasChildren,
  }));
}

// Mark root rows as having children
const rows: RowSpec[] = [{ id: '1', data: { name: 'Root Folder' }, hasChildren: true }];
</script>
```

:::

The `signal` parameter allows aborting the request if the user collapses the row before loading completes.

## Theme Customization

Customize tree-specific theme tokens:

```typescript
const theme: Partial<ChronixTableTheme> = {
  treeIndentPx: 24, // Indentation per level
  treeChevronColor: '#6b7280', // Expand/collapse icon color
  treeSpinnerColor: '#3b82f6', // Loading spinner color
  treeErrorColor: '#ef4444', // Error icon color
};
```
