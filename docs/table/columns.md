# 列配置

列定义控制表格中数据的展示、格式化和交互方式。每列由一个 `ColumnSpec` 对象描述。

## 基本用法

::: code-group

```vue [Vue 3]
<template>
  <ChronixTable :columns="columns" :rows="rows" />
</template>

<script setup lang="ts">
import { ChronixTable } from '@chronixjs/table-vue3';
import type { ColumnSpec, RowSpec } from '@chronixjs/table';

const columns: ColumnSpec[] = [
  { id: 'name', field: 'name', headerName: 'Name', width: 200, sortable: true },
  { id: 'age', field: 'age', headerName: 'Age', width: 100, sortable: true },
  { id: 'email', field: 'email', headerName: 'Email', flex: 1 },
];

const rows: RowSpec[] = [
  { id: '1', data: { name: 'Alice', age: 30, email: 'alice@example.com' } },
  { id: '2', data: { name: 'Bob', age: 25, email: 'bob@example.com' } },
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
        { id: 'name', field: 'name', headerName: 'Name', width: 200 },
        { id: 'age', field: 'age', headerName: 'Age', width: 100 },
        { id: 'email', field: 'email', headerName: 'Email', flex: 1 },
      ],
      rows: [
        { id: '1', data: { name: 'Alice', age: 30, email: 'alice@example.com' } },
        { id: '2', data: { name: 'Bob', age: 25, email: 'bob@example.com' } },
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
  { id: 'name', field: 'name', headerName: 'Name', width: 200, sortable: true },
  { id: 'age', field: 'age', headerName: 'Age', width: 100 },
  { id: 'email', field: 'email', headerName: 'Email', flex: 1 },
];

const rows: RowSpec[] = [
  { id: '1', data: { name: 'Alice', age: 30, email: 'alice@example.com' } },
  { id: '2', data: { name: 'Bob', age: 25, email: 'bob@example.com' } },
];

export function App() {
  return <ChronixTable columns={columns} rows={rows} />;
}
```

:::

## ColumnSpec 参考

### 标识与显示

| 属性         | 类型      | 默认值  | 描述                          |
| ------------ | --------- | ------- | ----------------------------- |
| `id`         | `string`  | —       | **必填。** 唯一的列标识       |
| `field`      | `string`  |         | `RowSpec.data` 中的数据字段键 |
| `headerName` | `string`  |         | 表头单元格显示文本            |
| `type`       | `string`  |         | 列类型提示（如 `'numeric'`）  |
| `hide`       | `boolean` | `false` | 隐藏该列                      |

### 尺寸

| 属性       | 类型     | 默认值 | 描述                 |
| ---------- | -------- | ------ | -------------------- |
| `width`    | `number` |        | 固定宽度（像素）     |
| `minWidth` | `number` |        | 最小列宽             |
| `maxWidth` | `number` |        | 最大列宽             |
| `flex`     | `number` |        | 自适应尺寸的弹性因子 |

### 排序与筛选

| 属性         | 类型                         | 默认值  | 描述               |
| ------------ | ---------------------------- | ------- | ------------------ |
| `sortable`   | `boolean`                    | `false` | 启用列排序         |
| `comparator` | `(a, b, args) => number`     |         | 自定义排序比较函数 |
| `filterable` | `boolean`                    | `false` | 为该列显示筛选     |
| `filterUi`   | `'text' \| 'set' \| 'multi'` |         | 筛选界面类型       |

### 值转换

| 属性             | 类型                | 描述               |
| ---------------- | ------------------- | ------------------ |
| `valueGetter`    | `(args) => unknown` | 自定义值获取器     |
| `valueFormatter` | `(args) => string`  | 格式化单元格显示值 |

### 编辑

| 属性             | 类型                                                    | 描述           |
| ---------------- | ------------------------------------------------------- | -------------- |
| `editable`       | `boolean`                                               | 启用单元格编辑 |
| `validator`      | `(value, row) => string \| EditValidationError \| null` | 同步校验       |
| `validatorAsync` | `(value, row) => Promise<...>`                          | 异步校验       |

### 布局

| 属性           | 类型                        | 默认值 | 描述             |
| -------------- | --------------------------- | ------ | ---------------- |
| `pinned`       | `'left' \| 'right' \| null` |        | 将列固定到侧边   |
| `resizable`    | `boolean`                   |        | 允许用户调整大小 |
| `reorderable`  | `boolean`                   |        | 允许拖拽排序     |
| `autosizeable` | `boolean`                   |        | 允许自适应大小   |
| `wrapText`     | `boolean`                   |        | 自动换行         |

### 特殊列

| 属性            | 类型      | 描述                         |
| --------------- | --------- | ---------------------------- |
| `rowDragHandle` | `boolean` | 显示用于行重新排序的拖拽手柄 |
| `rowNumber`     | `boolean` | 显示行号                     |
| `treeColumn`    | `boolean` | 显示树形展开/折叠箭头        |

### 表头分组

| 属性          | 类型                          | 描述                 |
| ------------- | ----------------------------- | -------------------- |
| `headerGroup` | `string \| readonly string[]` | 将列归组到共享表头下 |

### 样式

| 属性        | 类型                                                   | 描述             |
| ----------- | ------------------------------------------------------ | ---------------- |
| `cellClass` | `string \| string[] \| ((args) => string \| string[])` | 自定义单元格类名 |

### 导出

| 属性          | 类型          | 描述           |
| ------------- | ------------- | -------------- |
| `exportStyle` | `ExportStyle` | 单列导出格式化 |

## 自定义值格式化

使用 `valueFormatter` 转换原始数据用于显示：

```typescript
const columns: ColumnSpec[] = [
  {
    id: 'salary',
    field: 'salary',
    headerName: 'Salary',
    valueFormatter: (args) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(args.value as number),
  },
  {
    id: 'status',
    field: 'active',
    headerName: 'Status',
    valueFormatter: (args) => (args.value ? 'Active' : 'Inactive'),
  },
];
```

## 自定义值获取器

当显示值不是直接字段映射时，使用 `valueGetter`：

```typescript
const columns: ColumnSpec[] = [
  {
    id: 'fullName',
    headerName: 'Full Name',
    valueGetter: (args) => {
      const d = args.row.data;
      return `${d.firstName} ${d.lastName}`;
    },
  },
];
```

## 表头分组

将多个列归组到共享表头下：

```typescript
const columns: ColumnSpec[] = [
  { id: 'q1', field: 'q1', headerName: 'Q1', headerGroup: 'Revenue' },
  { id: 'q2', field: 'q2', headerName: 'Q2', headerGroup: 'Revenue' },
  { id: 'q3', field: 'q3', headerName: 'Q3', headerGroup: 'Revenue' },
  { id: 'q4', field: 'q4', headerName: 'Q4', headerGroup: 'Revenue' },
];
```

多层分组使用数组：

```typescript
{
  headerGroup: ['Financials', 'Revenue'];
}
```

## 列可见性

隐藏列：

```typescript
const columns: ColumnSpec[] = [
  { id: 'id', field: 'id', headerName: 'ID', hide: true },
  { id: 'name', field: 'name', headerName: 'Name' },
];
```

使用 `showColumnVisibilityMenu` 属性或 `TableHandle` 在运行时切换可见性：

::: code-group

```vue [Vue 3]
<template>
  <ChronixTable
    ref="tableRef"
    :columns="columns"
    :rows="rows"
    show-column-visibility-menu
    @table-ready="onTableReady"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ChronixTable } from '@chronixjs/table-vue3';
import type { TableHandle } from '@chronixjs/table-vue3';

const tableHandle = ref<TableHandle | null>(null);

function onTableReady(handle: TableHandle) {
  tableHandle.value = handle;
}

// 通过编程方式切换列可见性
function toggleColumn(colId: string) {
  tableHandle.value?.toggleColumnVisibility(colId);
}
</script>
```

:::
