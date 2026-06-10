# 排序

为数据表格启用单列和多列排序。排序通过 `ColumnSpec` 逐列配置。

## 基本排序

在列上设置 `sortable: true` 以启用点击排序：

::: code-group

```vue [Vue 3]
<template>
  <ChronixTable :columns="columns" :rows="rows" @sort-change="onSortChange" />
</template>

<script setup lang="ts">
import { ChronixTable } from '@chronixjs/table-vue3';
import type { ColumnSpec, RowSpec } from '@chronixjs/table';

const columns: ColumnSpec[] = [
  { id: 'name', field: 'name', headerName: 'Name', sortable: true },
  { id: 'age', field: 'age', headerName: 'Age', sortable: true },
  { id: 'email', field: 'email', headerName: 'Email' },
];

const rows: RowSpec[] = [
  { id: '1', data: { name: 'Charlie', age: 35, email: 'charlie@example.com' } },
  { id: '2', data: { name: 'Alice', age: 28, email: 'alice@example.com' } },
  { id: '3', data: { name: 'Bob', age: 32, email: 'bob@example.com' } },
];

function onSortChange(payload) {
  console.log('Sort:', payload.sortSpec);
}
</script>
```

```vue [Vue 2]
<template>
  <ChronixTable :columns="columns" :rows="rows" @sort-change="onSortChange" />
</template>

<script>
import { ChronixTable } from '@chronixjs/table-vue2';

export default {
  components: { ChronixTable },
  data() {
    return {
      columns: [
        { id: 'name', field: 'name', headerName: 'Name', sortable: true },
        { id: 'age', field: 'age', headerName: 'Age', sortable: true },
      ],
      rows: [
        { id: '1', data: { name: 'Charlie', age: 35 } },
        { id: '2', data: { name: 'Alice', age: 28 } },
      ],
    };
  },
  methods: {
    onSortChange(payload) {
      console.log('Sort:', payload.sortSpec);
    },
  },
};
</script>
```

```tsx [React]
import { ChronixTable } from '@chronixjs/table-react';
import type { ColumnSpec, RowSpec } from '@chronixjs/table';

const columns: ColumnSpec[] = [
  { id: 'name', field: 'name', headerName: 'Name', sortable: true },
  { id: 'age', field: 'age', headerName: 'Age', sortable: true },
];

const rows: RowSpec[] = [
  { id: '1', data: { name: 'Charlie', age: 35 } },
  { id: '2', data: { name: 'Alice', age: 28 } },
];

export function App() {
  return (
    <ChronixTable
      columns={columns}
      rows={rows}
      onSortChange={(payload) => console.log('Sort:', payload.sortSpec)}
    />
  );
}
```

:::

## SortSpec

排序状态是一个 `SortSpec` 对象数组：

```typescript
interface SortSpec {
  readonly colId: string;
  readonly direction: 'asc' | 'desc';
}
```

点击可排序列的表头会循环切换：`asc` → `desc` → 未排序。

## 自定义比较函数

使用 `comparator` 函数覆盖默认排序行为：

```typescript
const columns: ColumnSpec[] = [
  {
    id: 'name',
    field: 'name',
    headerName: 'Name',
    sortable: true,
    comparator: (a, b, args) => {
      // 不区分大小写排序
      const aStr = String(a).toLowerCase();
      const bStr = String(b).toLowerCase();
      return aStr.localeCompare(bStr);
    },
  },
  {
    id: 'priority',
    field: 'priority',
    headerName: 'Priority',
    sortable: true,
    comparator: (a, b) => {
      // 自定义优先级顺序：High > Medium > Low
      const order = { High: 3, Medium: 2, Low: 1 };
      return (order[b] || 0) - (order[a] || 0);
    },
  },
];
```

比较函数接收 `(valueA, valueB, args)`，其中 `args` 包含 `rowA`、`rowB` 和 `column`。

## 编程式排序

通过 `TableHandle` 控制排序：

::: code-group

```vue [Vue 3]
<template>
  <div>
    <button @click="sortByAge">Sort by Age</button>
    <button @click="clearSort">Clear Sort</button>
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

function sortByAge() {
  handle.value?.setSort({ colId: 'age', direction: 'desc' });
}

function clearSort() {
  handle.value?.clearSort();
}
</script>
```

:::

### TableHandle 排序方法

| 方法        | 签名                                             | 描述         |
| ----------- | ------------------------------------------------ | ------------ |
| `getSort`   | `() => readonly SortSpec[]`                      | 当前排序状态 |
| `setSort`   | `(spec: SortSpec \| SortSpec[] \| null) => void` | 应用排序     |
| `clearSort` | `() => void`                                     | 清除所有排序 |

## 排序变更事件

监听排序变化：

| 事件          | 载荷                                |
| ------------- | ----------------------------------- |
| `sort-change` | `{ sortSpec: readonly SortSpec[] }` |

支持多列排序 — `sortSpec` 是一个数组，第一个条目优先级最高。
