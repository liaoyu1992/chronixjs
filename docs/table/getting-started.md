# Table — Getting Started

This guide walks you through setting up the Chronix Data Table in your project.

## Install

::: code-group

```bash [Vue 3]
pnpm add @chronixjs/table-vue3@alpha vue
```

```bash [Vue 2]
pnpm add @chronixjs/table-vue2@alpha vue@^2.7
```

```bash [React]
pnpm add @chronixjs/table-react@alpha react@^18 react-dom@^18
```

:::

## Column Configuration

Columns define the structure of your table:

```ts
interface TableColumn {
  key: string; // data field key
  title: string; // header display text
  width?: number; // column width in px
  sortable?: boolean; // enable sorting
  filterable?: boolean; // enable filtering
  editable?: boolean; // enable inline editing
  pinned?: 'left' | 'right'; // freeze column
  render?: (value: any, row: any) => string; // custom cell renderer
}
```

## Full Example

::: code-group

```vue [Vue 3]
<template>
  <div>
    <h2>Employee Directory</h2>
    <CxTable
      ref="tableRef"
      :columns="columns"
      :rows="rows"
      :options="tableOptions"
      style="height: 500px;"
    >
      <!-- Custom toolbar -->
      <template #toolbar>
        <CxButton type="primary" @click="exportCSV">Export CSV</CxButton>
      </template>
    </CxTable>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxTable } from '@chronixjs/table-vue3';
import { CxButton } from '@chronixjs/ui-vue3';

const tableRef = ref();

const columns = [
  { key: 'id', title: 'ID', width: 80, sortable: true },
  { key: 'name', title: 'Name', width: 200, sortable: true, editable: true },
  { key: 'email', title: 'Email', width: 300, editable: true },
  { key: 'department', title: 'Dept', width: 150, sortable: true },
  { key: 'salary', title: 'Salary', width: 120, sortable: true },
];

const rows = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `Employee ${i + 1}`,
  email: `emp${i + 1}@company.com`,
  department: ['Engineering', 'Design', 'Marketing', 'Sales'][i % 4],
  salary: 50000 + Math.floor(Math.random() * 50000),
}));

const tableOptions = {
  rowHeight: 40,
  headerHeight: 48,
  striped: true,
};

function exportCSV() {
  tableRef.value?.exportCSV?.();
}
</script>
```

```vue [Vue 2]
<template>
  <CxTable
    ref="tableRef"
    :columns="columns"
    :rows="rows"
    :options="tableOptions"
    style="height: 500px;"
  />
</template>

<script>
import { CxTable } from '@chronixjs/table-vue2';

export default {
  components: { CxTable },
  data() {
    return {
      columns: [
        { key: 'id', title: 'ID', width: 80, sortable: true },
        { key: 'name', title: 'Name', width: 200, sortable: true },
        { key: 'email', title: 'Email', width: 300 },
        { key: 'department', title: 'Dept', width: 150, sortable: true },
      ],
      rows: Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `Employee ${i + 1}`,
        email: `emp${i + 1}@company.com`,
        department: ['Engineering', 'Design', 'Marketing', 'Sales'][i % 4],
      })),
      tableOptions: {
        rowHeight: 40,
        headerHeight: 48,
        striped: true,
      },
    };
  },
};
</script>
```

```tsx [React]
import { useRef } from 'react';
import { CxTable, type CxTableHandle } from '@chronixjs/table-react';

const columns = [
  { key: 'id', title: 'ID', width: 80, sortable: true },
  { key: 'name', title: 'Name', width: 200, sortable: true },
  { key: 'email', title: 'Email', width: 300 },
  { key: 'department', title: 'Dept', width: 150, sortable: true },
];

const rows = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `Employee ${i + 1}`,
  email: `emp${i + 1}@company.com`,
  department: ['Engineering', 'Design', 'Marketing', 'Sales'][i % 4],
}));

export function App() {
  const tableRef = useRef<CxTableHandle>(null);

  return (
    <CxTable
      ref={tableRef}
      columns={columns}
      rows={rows}
      options={{
        rowHeight: 40,
        headerHeight: 48,
        striped: true,
      }}
      style={{ height: 500 }}
    />
  );
}
```

:::

## Next Steps

- [Columns](/table/columns) — advanced column configuration
- [Sorting](/table/sorting) — multi-column sorting
- [Filtering](/table/filtering) — built-in and custom filters
- [Inline Editing](/table/editing) — cell-level editing
- [Tree Data](/table/tree-data) — hierarchical rows
- [Export](/table/export) — CSV export
- [Theme](/table/theme) — customize appearance
