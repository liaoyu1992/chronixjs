<script setup>
import TableBasic from '../../table/demos/TableBasic.vue';
import tableBasicCode from '../../table/demos/TableBasic.vue?raw';
import tableBasicVue2 from '../../table/demos/TableBasic.vue2?raw';
import tableBasicReact from '../../table/demos/TableBasic.react?raw';
</script>

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
- **3 Framework Adapters** — Vue 3, Vue 2.7, React 18 / 19

## Install

::: code-group

```bash [Vue 3]
pnpm add @chronixjs/table-vue3@alpha vue
```

```bash [Vue 2]
pnpm add @chronixjs/table-vue2@alpha vue@^2.7
```

```bash [React]
pnpm add @chronixjs/table-react@alpha react react-dom
```

:::

## Basic Usage

<DemoBox title="Basic Data Table" description="A simple table with sortable Name and Role columns." :code="tableBasicCode" :code-vue2="tableBasicVue2" :code-react="tableBasicReact">
  <TableBasic />
</DemoBox>

## Next Steps

- [Getting Started](/en/table/getting-started) — detailed setup guide
- [Columns](/en/table/columns) — column configuration
- [Sorting](/en/table/sorting) — multi-column sorting
- [Filtering](/en/table/filtering) — built-in and custom filters
- [Inline Editing](/en/table/editing) — cell editing
- [Tree Data](/en/table/tree-data) — hierarchical data
- [Export](/en/table/export) — CSV export
- [Theme](/en/table/theme) — styling and theming
