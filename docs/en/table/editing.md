# Inline Editing

Enable cell-level editing with validation support. Double-click a cell or use keyboard navigation to start editing.

## Basic Editing

Set `editable: true` on columns to enable editing:

::: code-group

```vue [Vue 3]
<template>
  <ChronixTable
    :columns="columns"
    :rows="rows"
    @cell-value-change="onCellChange"
    @cell-edit-start="onEditStart"
    @cell-edit-stop="onEditStop"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ChronixTable } from '@chronixjs/table-vue3';
import type { ColumnSpec, RowSpec } from '@chronixjs/table';

const columns: ColumnSpec[] = [
  { id: 'name', field: 'name', headerName: 'Name', editable: true },
  { id: 'email', field: 'email', headerName: 'Email', editable: true },
  { id: 'role', field: 'role', headerName: 'Role' },
];

const rows = ref<RowSpec[]>([
  { id: '1', data: { name: 'Alice', email: 'alice@example.com', role: 'Engineer' } },
  { id: '2', data: { name: 'Bob', email: 'bob@example.com', role: 'Designer' } },
]);

function onCellChange(payload) {
  console.log(`Changed [${payload.column.id}]: ${payload.oldValue} → ${payload.newValue}`);
  // Update your data source
}

function onEditStart(payload) {
  console.log(`Editing [${payload.column.id}] in row ${payload.row.id}`);
}

function onEditStop(payload) {
  if (payload.committed) {
    console.log(`Committed: ${payload.finalValue}`);
  }
}
</script>
```

```vue [Vue 2]
<template>
  <ChronixTable :columns="columns" :rows="rows" @cell-value-change="onCellChange" />
</template>

<script>
import { ChronixTable } from '@chronixjs/table-vue2';

export default {
  components: { ChronixTable },
  data() {
    return {
      columns: [
        { id: 'name', field: 'name', headerName: 'Name', editable: true },
        { id: 'email', field: 'email', headerName: 'Email', editable: true },
      ],
      rows: [
        { id: '1', data: { name: 'Alice', email: 'alice@example.com' } },
        { id: '2', data: { name: 'Bob', email: 'bob@example.com' } },
      ],
    };
  },
  methods: {
    onCellChange(payload) {
      console.log('Changed:', payload.oldValue, '→', payload.newValue);
    },
  },
};
</script>
```

```tsx [React]
import { ChronixTable } from '@chronixjs/table-react';
import type { ColumnSpec, RowSpec } from '@chronixjs/table';

const columns: ColumnSpec[] = [
  { id: 'name', field: 'name', headerName: 'Name', editable: true },
  { id: 'email', field: 'email', headerName: 'Email', editable: true },
];

const rows: RowSpec[] = [{ id: '1', data: { name: 'Alice', email: 'alice@example.com' } }];

export function App() {
  return (
    <ChronixTable
      columns={columns}
      rows={rows}
      onCellValueChange={(payload) => {
        console.log(`Changed: ${payload.oldValue} → ${payload.newValue}`);
      }}
    />
  );
}
```

:::

## Cell Validation

Add validators to columns to enforce data integrity:

```typescript
import type { ColumnSpec, EditValidationError } from '@chronixjs/table';

const columns: ColumnSpec[] = [
  {
    id: 'email',
    field: 'email',
    headerName: 'Email',
    editable: true,
    validator: (value, _row): string | EditValidationError | null => {
      const str = String(value);
      if (!str.includes('@')) {
        return { reason: 'Invalid email address', code: 'INVALID_EMAIL' };
      }
      return null; // Valid
    },
  },
  {
    id: 'age',
    field: 'age',
    headerName: 'Age',
    editable: true,
    validator: (value, _row) => {
      const num = Number(value);
      if (isNaN(num) || num < 0 || num > 150) {
        return 'Age must be between 0 and 150';
      }
      return null;
    },
  },
];
```

### Async Validation

Use `validatorAsync` for server-side validation:

```typescript
const columns: ColumnSpec[] = [
  {
    id: 'username',
    field: 'username',
    headerName: 'Username',
    editable: true,
    validatorAsync: async (value, _row) => {
      const response = await fetch(`/api/check-username?name=${value}`);
      const { available } = await response.json();
      if (!available) {
        return { reason: 'Username already taken', code: 'DUPLICATE' };
      }
      return null;
    },
  },
];
```

### EditValidationError

```typescript
interface EditValidationError {
  readonly reason: string; // Human-readable error message
  readonly code?: string; // Optional machine-readable error code
}
```

## Row Validation

Validate entire rows with `rowValidators`:

::: code-group

```vue [Vue 3]
<template>
  <ChronixTable :columns="columns" :rows="rows" :row-validators="rowValidators" />
</template>

<script setup lang="ts">
import { ChronixTable } from '@chronixjs/table-vue3';
import type { RowValidator } from '@chronixjs/table';

const rowValidators: RowValidator[] = [
  {
    id: 'required-fields',
    validate: (row) => {
      const violations = [];
      if (!row.data.name) {
        violations.push({ colId: 'name', reason: 'Name is required' });
      }
      if (!row.data.email) {
        violations.push({ colId: 'email', reason: 'Email is required' });
      }
      return violations;
    },
  },
];
</script>
```

:::

## Editing Events

| Event               | Payload Fields                                                | Description     |
| ------------------- | ------------------------------------------------------------- | --------------- |
| `cell-edit-start`   | `row`, `column`, `baseValue`, `draftValue`                    | Editing started |
| `cell-edit-stop`    | `row`, `column`, `committed`, `finalValue`, `validationError` | Editing stopped |
| `cell-value-change` | `row`, `column`, `oldValue`, `newValue`                       | Value committed |

## Programmatic Editing

Control editing via `TableHandle`:

| Method                           | Description                   |
| -------------------------------- | ----------------------------- |
| `startEditingCell(rowId, colId)` | Start editing a specific cell |
| `commitEditingCell()`            | Commit the current edit       |
| `cancelEditingCell()`            | Cancel the current edit       |
| `getEditingCell()`               | Get current editing state     |
| `setEditingCellDraft(value)`     | Set draft value               |

## Undo / Redo

Enable undo/redo for edit operations:

::: code-group

```vue [Vue 3]
<template>
  <div>
    <button @click="handle?.undo()" :disabled="!handle?.canUndo()">Undo</button>
    <button @click="handle?.redo()" :disabled="!handle?.canRedo()">Redo</button>
    <ChronixTable
      :columns="columns"
      :rows="rows"
      enable-undo-history
      :undo-history-max-depth="50"
      @table-ready="onReady"
    />
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
</script>
```

:::
