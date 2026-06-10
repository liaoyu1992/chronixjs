# Export (CSV & XLSX)

Export table data to CSV or Excel (XLSX) format. Exports run entirely client-side — no server round-trip required.

## CSV Export

### Programmatic Export

Use `TableHandle` to trigger CSV export:

::: code-group

```vue [Vue 3]
<template>
  <div>
    <button @click="exportCsv">Export CSV</button>
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

async function exportCsv() {
  const csvString = await handle.value?.exportToCsv({
    separator: ',',
    includeHeaders: true,
  });
  if (csvString) {
    // Trigger download
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
</script>
```

```tsx [React]
import { useRef } from 'react';
import { ChronixTable } from '@chronixjs/table-react';
import type { TableHandle } from '@chronixjs/table-react';

export function App() {
  const handleRef = useRef<TableHandle | null>(null);

  async function exportCsv() {
    const csv = await handleRef.current?.exportToCsv();
    if (csv) {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'data.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  return (
    <div>
      <button onClick={exportCsv}>Export CSV</button>
      <ChronixTable
        columns={columns}
        rows={rows}
        onTableReady={(h) => {
          handleRef.current = h;
        }}
      />
    </div>
  );
}
```

:::

### ExportToCsvOptions

| Option           | Type                | Default | Description                  |
| ---------------- | ------------------- | ------- | ---------------------------- |
| `separator`      | `string`            | `','`   | Column separator             |
| `eol`            | `string`            | `'\n'`  | End-of-line character        |
| `includeHeaders` | `boolean`           | `true`  | Include header row           |
| `columnIds`      | `readonly string[]` |         | Export specific columns only |

### Core Function

Export directly using the core function (no adapter needed):

```typescript
import { exportToCsv } from '@chronixjs/table';
import type { ExportToCsvInput } from '@chronixjs/table';

const input: ExportToCsvInput = {
  rows,
  columns,
  options: { separator: ',', includeHeaders: true },
};

const csvString = exportToCsv(input);
```

## XLSX Export

### Programmatic Export

::: code-group

```vue [Vue 3]
<template>
  <div>
    <button @click="exportXlsx">Export Excel</button>
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

async function exportXlsx() {
  const buffer = await handle.value?.exportToXlsx({
    sheetName: 'Sheet1',
    includeHeaders: true,
    freezePane: { ySplit: 1 }, // Freeze header row
  });
  if (buffer) {
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  }
}
</script>
```

:::

### ExportToXlsxOptions

| Option           | Type                   | Default    | Description                  |
| ---------------- | ---------------------- | ---------- | ---------------------------- |
| `sheetName`      | `string`               | `'Sheet1'` | Worksheet name               |
| `includeHeaders` | `boolean`              | `true`     | Include header row           |
| `columnIds`      | `readonly string[]`    |            | Export specific columns only |
| `freezePane`     | `{ xSplit?, ySplit? }` |            | Freeze rows/columns          |

### Multi-Sheet Export

Export multiple data sets into separate sheets of one workbook:

```typescript
const buffer = await handle.value?.exportToXlsx({
  sheets: [
    { name: 'Employees', rows: employeeRows, columns: employeeCols },
    { name: 'Departments', rows: deptRows, columns: deptCols },
  ],
});
```

## Per-Column Export Styling

Customize cell formatting in exports via `exportStyle` on `ColumnSpec`:

```typescript
const columns: ColumnSpec[] = [
  {
    id: 'salary',
    field: 'salary',
    headerName: 'Salary',
    exportStyle: {
      numberFormat: '$#,##0.00',
      font: { bold: true },
      alignment: { horizontal: 'right' },
      border: { top: true, bottom: true, left: true, right: true },
    },
  },
  {
    id: 'date',
    field: 'date',
    headerName: 'Date',
    exportStyle: {
      numberFormat: 'yyyy-mm-dd',
      alignment: { horizontal: 'center' },
    },
  },
];
```

### ExportStyle

| Field          | Type                   | Description                |
| -------------- | ---------------------- | -------------------------- |
| `font`         | `ExportStyleFont`      | Font styling               |
| `fill`         | `ExportStyleFill`      | Cell background            |
| `alignment`    | `ExportStyleAlignment` | Text alignment             |
| `border`       | `ExportStyleBorder`    | Cell borders               |
| `numberFormat` | `string`               | Excel number format string |
