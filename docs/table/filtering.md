# Filtering

The table supports multiple filter types including text, number, set, and advanced expression-based filtering.

## Quick Start

Enable the filter row with `showFilterRow`:

::: code-group

```vue [Vue 3]
<template>
  <ChronixTable :columns="columns" :rows="rows" show-filter-row @filter-change="onFilterChange" />
</template>

<script setup lang="ts">
import { ChronixTable } from '@chronixjs/table-vue3';
import type { ColumnSpec, RowSpec } from '@chronixjs/table';

const columns: ColumnSpec[] = [
  { id: 'name', field: 'name', headerName: 'Name', filterable: true, filterUi: 'text' },
  { id: 'status', field: 'status', headerName: 'Status', filterable: true, filterUi: 'set' },
  { id: 'score', field: 'score', headerName: 'Score', filterable: true, filterUi: 'text' },
];

const rows: RowSpec[] = [
  { id: '1', data: { name: 'Alice', status: 'Active', score: 92 } },
  { id: '2', data: { name: 'Bob', status: 'Inactive', score: 78 } },
  { id: '3', data: { name: 'Carol', status: 'Active', score: 85 } },
];

function onFilterChange(payload) {
  console.log('Active filters:', payload.filterSpec);
}
</script>
```

```vue [Vue 2]
<template>
  <ChronixTable :columns="columns" :rows="rows" show-filter-row @filter-change="onFilterChange" />
</template>

<script>
import { ChronixTable } from '@chronixjs/table-vue2';

export default {
  components: { ChronixTable },
  data() {
    return {
      columns: [
        { id: 'name', field: 'name', headerName: 'Name', filterable: true, filterUi: 'text' },
        { id: 'status', field: 'status', headerName: 'Status', filterable: true, filterUi: 'set' },
      ],
      rows: [
        { id: '1', data: { name: 'Alice', status: 'Active' } },
        { id: '2', data: { name: 'Bob', status: 'Inactive' } },
      ],
    };
  },
  methods: {
    onFilterChange(payload) {
      console.log('Filters:', payload.filterSpec);
    },
  },
};
</script>
```

```tsx [React]
import { ChronixTable } from '@chronixjs/table-react';
import type { ColumnSpec, RowSpec } from '@chronixjs/table';

const columns: ColumnSpec[] = [
  { id: 'name', field: 'name', headerName: 'Name', filterable: true, filterUi: 'text' },
  { id: 'status', field: 'status', headerName: 'Status', filterable: true, filterUi: 'set' },
];

const rows: RowSpec[] = [
  { id: '1', data: { name: 'Alice', status: 'Active' } },
  { id: '2', data: { name: 'Bob', status: 'Inactive' } },
];

export function App() {
  return (
    <ChronixTable
      columns={columns}
      rows={rows}
      showFilterRow
      onFilterChange={(payload) => console.log('Filters:', payload.filterSpec)}
    />
  );
}
```

:::

## Filter Types

### Text Filter

Filter by string matching with multiple operators:

```typescript
{ filterable: true, filterUi: 'text' }
```

| Operator     | Description              |
| ------------ | ------------------------ |
| `contains`   | Value contains the query |
| `equals`     | Exact match              |
| `startsWith` | Value starts with query  |
| `endsWith`   | Value ends with query    |

### Set Filter

Select from a list of unique values with checkboxes:

```typescript
{ filterable: true, filterUi: 'set' }
```

Shows all unique values in the column with a search box and select-all toggle.

### Multi Filter

Combine multiple filter conditions with AND/OR logic:

```typescript
{
  filterable: true,
  filterUi: 'multi',
  multiFilterChildTypes: ['text', 'number', 'set'],
}
```

### Number Filter

Numeric comparisons:

| Operator  | Description                         |
| --------- | ----------------------------------- |
| `=`       | Equal to                            |
| `!=`      | Not equal to                        |
| `>`       | Greater than                        |
| `<`       | Less than                           |
| `>=`      | Greater than or equal               |
| `<=`      | Less than or equal                  |
| `inRange` | Between two values (uses `valueTo`) |

## FilterSpec Types

```typescript
// Text filter
interface TextFilterSpec {
  readonly type: 'text';
  readonly colId: string;
  readonly operator: 'contains' | 'equals' | 'startsWith' | 'endsWith';
  readonly value: string;
  readonly caseSensitive?: boolean;
}

// Number filter
interface NumberFilterSpec {
  readonly type: 'number';
  readonly colId: string;
  readonly operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'inRange';
  readonly value: number;
  readonly valueTo?: number;
}

// Set filter
interface SetFilterSpec {
  readonly type: 'set';
  readonly colId: string;
  readonly selectedValues: readonly (string | number | boolean | null)[] | null;
}

// Multi filter
interface MultiFilterSpec {
  readonly type: 'multi';
  readonly colId: string;
  readonly mode: 'AND' | 'OR';
  readonly filters: readonly MultiFilterEntry[];
}
```

## Advanced Expression Filter

Build complex filter expressions with AND/OR/NOT logic:

::: code-group

```vue [Vue 3]
<template>
  <ChronixTable :columns="columns" :rows="rows" @table-ready="onReady" />
</template>

<script setup lang="ts">
import { ChronixTable } from '@chronixjs/table-vue3';
import type { TableHandle, FilterExpression } from '@chronixjs/table';

let handle: TableHandle;

function onReady(h: TableHandle) {
  handle = h;
}

// Build complex filter: (status = 'Active' AND score > 80) OR name contains 'Alice'
function applyAdvancedFilter() {
  const expression: FilterExpression = {
    kind: 'or',
    children: [
      {
        kind: 'and',
        children: [
          { kind: 'compare', colId: 'status', operator: '=', value: 'Active' },
          { kind: 'compare', colId: 'score', operator: '>', value: 80 },
        ],
      },
      { kind: 'compare', colId: 'name', operator: 'contains', value: 'Alice' },
    ],
  };

  handle.setAdvancedFilter(expression);
}
</script>
```

:::

### Expression Operators

| Operator     | Description           |
| ------------ | --------------------- |
| `=`          | Equal                 |
| `!=`         | Not equal             |
| `>`          | Greater than          |
| `<`          | Less than             |
| `>=`         | Greater than or equal |
| `<=`         | Less than or equal    |
| `contains`   | Contains substring    |
| `startsWith` | Starts with           |
| `endsWith`   | Ends with             |
| `in`         | Value in list         |
| `isNull`     | Value is null         |
| `isNotNull`  | Value is not null     |

### Parse Filter from Text

Parse a text-based filter expression and apply it:

```typescript
handle.parseAndSetAdvancedFilter('status = "Active" AND score > 80');
```

## Programmatic Filter Control

Use `TableHandle` to control filters programmatically:

| Method                            | Description                      |
| --------------------------------- | -------------------------------- |
| `getFilter()`                     | Get current filter specs         |
| `setFilter(spec)`                 | Apply filter spec(s)             |
| `clearFilter()`                   | Remove all filters               |
| `getAdvancedFilter()`             | Get current expression filter    |
| `setAdvancedFilter(expr)`         | Apply expression filter          |
| `parseAndSetAdvancedFilter(text)` | Parse and apply text filter      |
| `getColumnUniqueValues(colId)`    | Get unique values for set filter |
