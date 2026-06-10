# Pinned Columns & Rows

Freeze columns and rows so they remain visible while scrolling. Pin columns to the left or right side, and pin rows to the top or bottom.

## Pinned Columns

Set `pinned: 'left'` or `pinned: 'right'` on column definitions:

::: code-group

```vue [Vue 3]
<template>
  <ChronixTable :columns="columns" :rows="rows" />
</template>

<script setup lang="ts">
import { ChronixTable } from '@chronixjs/table-vue3';
import type { ColumnSpec, RowSpec } from '@chronixjs/table';

const columns: ColumnSpec[] = [
  // Pinned left — always visible
  { id: 'id', field: 'id', headerName: 'ID', width: 80, pinned: 'left' },
  { id: 'name', field: 'name', headerName: 'Name', width: 150, pinned: 'left' },

  // Scrollable center columns
  { id: 'email', field: 'email', headerName: 'Email', width: 200 },
  { id: 'phone', field: 'phone', headerName: 'Phone', width: 150 },
  { id: 'address', field: 'address', headerName: 'Address', width: 250 },
  { id: 'notes', field: 'notes', headerName: 'Notes', width: 300 },

  // Pinned right — always visible
  { id: 'actions', headerName: 'Actions', width: 120, pinned: 'right' },
];

const rows: RowSpec[] = [
  {
    id: '1',
    data: {
      id: '001',
      name: 'Alice',
      email: 'alice@ex.com',
      phone: '555-0101',
      address: '123 Main St',
      notes: '',
    },
  },
  {
    id: '2',
    data: {
      id: '002',
      name: 'Bob',
      email: 'bob@ex.com',
      phone: '555-0102',
      address: '456 Oak Ave',
      notes: 'VIP',
    },
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
        { id: 'id', field: 'id', headerName: 'ID', width: 80, pinned: 'left' },
        { id: 'name', field: 'name', headerName: 'Name', width: 150, pinned: 'left' },
        { id: 'email', field: 'email', headerName: 'Email', width: 200 },
        { id: 'actions', headerName: 'Actions', width: 120, pinned: 'right' },
      ],
      rows: [
        { id: '1', data: { id: '001', name: 'Alice', email: 'alice@ex.com' } },
        { id: '2', data: { id: '002', name: 'Bob', email: 'bob@ex.com' } },
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
  { id: 'id', field: 'id', headerName: 'ID', width: 80, pinned: 'left' },
  { id: 'name', field: 'name', headerName: 'Name', width: 150, pinned: 'left' },
  { id: 'email', field: 'email', headerName: 'Email', width: 200 },
  { id: 'actions', headerName: 'Actions', width: 120, pinned: 'right' },
];

const rows: RowSpec[] = [{ id: '1', data: { id: '001', name: 'Alice', email: 'alice@ex.com' } }];

export function App() {
  return <ChronixTable columns={columns} rows={rows} />;
}
```

:::

### How It Works

- **Left-pinned** columns render in a separate zone on the left side
- **Right-pinned** columns render in a separate zone on the right side
- A subtle shadow separates pinned zones from the scrollable center
- Pinned columns stay fixed during horizontal scroll

## Pinned Rows

Pin rows to the top or bottom using the `pinned` field on `RowSpec`:

```typescript
const rows: RowSpec[] = [
  // Pinned to top — always visible above scrollable rows
  { id: 'summary', data: { name: 'Summary', value: 'Total: 3 items' }, pinned: 'top' },

  // Regular scrollable rows
  { id: '1', data: { name: 'Alice', value: 'Item A' } },
  { id: '2', data: { name: 'Bob', value: 'Item B' } },
  { id: '3', data: { name: 'Carol', value: 'Item C' } },

  // Pinned to bottom — always visible below scrollable rows
  { id: 'footer', data: { name: 'Footer', value: 'Grand Total' }, pinned: 'bottom' },
];
```

### Use Cases

- **Top-pinned rows**: Summary rows, group headers, custom toolbar rows
- **Bottom-pinned rows**: Totals, aggregates, action rows

## Theme Tokens

Customize pinned zone appearance:

```typescript
const theme: Partial<ChronixTableTheme> = {
  pinnedShadowColor: 'rgba(0, 0, 0, 0.12)', // Shadow between zones
  pinnedZoneBg: '#fafafa', // Pinned zone background
  pinnedRowZIndex: 10, // Z-index for pinned rows
};
```

| Token               | Default               | Description            |
| ------------------- | --------------------- | ---------------------- |
| `pinnedShadowColor` | `rgba(0, 0, 0, 0.12)` | Divider shadow color   |
| `pinnedZoneBg`      | `'inherit'`           | Pinned zone background |
| `pinnedRowZIndex`   | `10`                  | Pinned row z-index     |
