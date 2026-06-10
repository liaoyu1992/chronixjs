# 导出（CSV 与 XLSX）

将表格数据导出为 CSV 或 Excel (XLSX) 格式。导出完全在客户端运行 — 无需服务器请求。

## CSV 导出

### 编程式导出

使用 `TableHandle` 触发 CSV 导出：

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
    // 触发下载
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

| 选项             | 类型                | 默认值 | 描述         |
| ---------------- | ------------------- | ------ | ------------ |
| `separator`      | `string`            | `','`  | 列分隔符     |
| `eol`            | `string`            | `'\n'` | 行尾字符     |
| `includeHeaders` | `boolean`           | `true` | 包含表头行   |
| `columnIds`      | `readonly string[]` |        | 仅导出指定列 |

### 核心函数

直接使用核心函数导出（无需适配器）：

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

## XLSX 导出

### 编程式导出

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
    freezePane: { ySplit: 1 }, // 冻结表头行
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

| 选项             | 类型                   | 默认值     | 描述         |
| ---------------- | ---------------------- | ---------- | ------------ |
| `sheetName`      | `string`               | `'Sheet1'` | 工作表名称   |
| `includeHeaders` | `boolean`              | `true`     | 包含表头行   |
| `columnIds`      | `readonly string[]`    |            | 仅导出指定列 |
| `freezePane`     | `{ xSplit?, ySplit? }` |            | 冻结行/列    |

### 多工作表导出

将多个数据集导出到同一个工作簿的不同工作表中：

```typescript
const buffer = await handle.value?.exportToXlsx({
  sheets: [
    { name: 'Employees', rows: employeeRows, columns: employeeCols },
    { name: 'Departments', rows: deptRows, columns: deptCols },
  ],
});
```

## 按列定制导出样式

通过 `ColumnSpec` 上的 `exportStyle` 自定义导出中的单元格格式：

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

| 字段           | 类型                   | 描述                 |
| -------------- | ---------------------- | -------------------- |
| `font`         | `ExportStyleFont`      | 字体样式             |
| `fill`         | `ExportStyleFill`      | 单元格背景           |
| `alignment`    | `ExportStyleAlignment` | 文本对齐             |
| `border`       | `ExportStyleBorder`    | 单元格边框           |
| `numberFormat` | `string`               | Excel 数字格式字符串 |
