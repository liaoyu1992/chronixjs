# 表格 — 快速开始

本指南将带你完成 Chronix 数据表格在项目中的安装与配置。

## 安装

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

## 列配置

列定义了表格的数据结构：

```ts
interface TableColumn {
  key: string; // 数据字段键
  title: string; // 表头显示文本
  width?: number; // 列宽（px）
  sortable?: boolean; // 启用排序
  filterable?: boolean; // 启用筛选
  editable?: boolean; // 启用行内编辑
  pinned?: 'left' | 'right'; // 固定列
  render?: (value: any, row: any) => string; // 自定义单元格渲染
}
```

## 完整示例

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
      <!-- 自定义工具栏 -->
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

## 接下来

- [列配置](/table/columns) — 高级列配置
- [排序](/table/sorting) — 多列排序
- [筛选](/table/filtering) — 内置与自定义筛选
- [编辑](/table/editing) — 单元格级编辑
- [树形数据](/table/tree-data) — 层级行数据
- [导出](/table/export) — CSV 导出
- [主题](/table/theme) — 自定义外观
