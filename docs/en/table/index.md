# Data Table

A high-performance, framework-agnostic data table with virtual scrolling, tree data, inline editing, and CSV export.

## Features

- **Virtual Scrolling** — handles 100k+ rows smoothly
- **Tree Data** — hierarchical row expansion
- **Inline Editing** — cell-level editing with validation
- **Sorting & Filtering** — multi-column sort, built-in filter types
- **Pinned Columns/Rows** — freeze headers and key columns
- **CSV Export** — client-side data export
- **58 Imperative Methods** — full programmatic control
- **3 Framework Adapters** — Vue 3, Vue 2.7, React 18

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

## Basic Usage

::: code-group

```vue [Vue 3]
<template>
  <CxTable :columns="columns" :rows="rows" style="height: 400px;" />
</template>

<script setup lang="ts">
import { CxTable } from '@chronixjs/table-vue3';

const columns = [
  { key: 'name', title: 'Name', width: 200, sortable: true },
  { key: 'email', title: 'Email', width: 300 },
  { key: 'role', title: 'Role', width: 150, sortable: true },
];

const rows = [
  { name: 'Alice', email: 'alice@example.com', role: 'Engineer' },
  { name: 'Bob', email: 'bob@example.com', role: 'Designer' },
  { name: 'Carol', email: 'carol@example.com', role: 'Manager' },
];
</script>
```

```vue [Vue 2]
<template>
  <CxTable :columns="columns" :rows="rows" style="height: 400px;" />
</template>

<script>
import { CxTable } from '@chronixjs/table-vue2';

export default {
  components: { CxTable },
  data() {
    return {
      columns: [
        { key: 'name', title: 'Name', width: 200, sortable: true },
        { key: 'email', title: 'Email', width: 300 },
        { key: 'role', title: 'Role', width: 150, sortable: true },
      ],
      rows: [
        { name: 'Alice', email: 'alice@example.com', role: 'Engineer' },
        { name: 'Bob', email: 'bob@example.com', role: 'Designer' },
        { name: 'Carol', email: 'carol@example.com', role: 'Manager' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { CxTable } from '@chronixjs/table-react';

const columns = [
  { key: 'name', title: 'Name', width: 200, sortable: true },
  { key: 'email', title: 'Email', width: 300 },
  { key: 'role', title: 'Role', width: 150, sortable: true },
];

const rows = [
  { name: 'Alice', email: 'alice@example.com', role: 'Engineer' },
  { name: 'Bob', email: 'bob@example.com', role: 'Designer' },
  { name: 'Carol', email: 'carol@example.com', role: 'Manager' },
];

export function App() {
  return <CxTable columns={columns} rows={rows} style={{ height: 400 }} />;
}
```

:::

## Next Steps

- [Getting Started](/en/table/getting-started) — detailed setup guide
- [Columns](/en/table/columns) — column configuration
- [Sorting](/en/table/sorting) — multi-column sorting
- [Filtering](/en/table/filtering) — built-in and custom filters
- [Inline Editing](/en/table/editing) — cell editing
- [Tree Data](/en/table/tree-data) — hierarchical data
- [Export](/en/table/export) — CSV export
- [Theme](/en/table/theme) — styling and theming
