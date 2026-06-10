# 筛选

表格支持多种筛选类型，包括文本、数字、集合和高级表达式筛选。

## 快速开始

通过 `showFilterRow` 启用筛选行：

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

## 筛选类型

### 文本筛选

通过字符串匹配进行筛选，支持多种运算符：

```typescript
{ filterable: true, filterUi: 'text' }
```

| 运算符       | 描述             |
| ------------ | ---------------- |
| `contains`   | 值包含查询文本   |
| `equals`     | 精确匹配         |
| `startsWith` | 值以查询文本开头 |
| `endsWith`   | 值以查询文本结尾 |

### 集合筛选

通过复选框从唯一值列表中选择：

```typescript
{ filterable: true, filterUi: 'set' }
```

显示列中所有唯一值，带搜索框和全选切换。

### 多条件筛选

使用 AND/OR 逻辑组合多个筛选条件：

```typescript
{
  filterable: true,
  filterUi: 'multi',
  multiFilterChildTypes: ['text', 'number', 'set'],
}
```

### 数字筛选

数值比较：

| 运算符    | 描述                           |
| --------- | ------------------------------ |
| `=`       | 等于                           |
| `!=`      | 不等于                         |
| `>`       | 大于                           |
| `<`       | 小于                           |
| `>=`      | 大于或等于                     |
| `<=`      | 小于或等于                     |
| `inRange` | 在两个值之间（使用 `valueTo`） |

## FilterSpec 类型

```typescript
// 文本筛选
interface TextFilterSpec {
  readonly type: 'text';
  readonly colId: string;
  readonly operator: 'contains' | 'equals' | 'startsWith' | 'endsWith';
  readonly value: string;
  readonly caseSensitive?: boolean;
}

// 数字筛选
interface NumberFilterSpec {
  readonly type: 'number';
  readonly colId: string;
  readonly operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'inRange';
  readonly value: number;
  readonly valueTo?: number;
}

// 集合筛选
interface SetFilterSpec {
  readonly type: 'set';
  readonly colId: string;
  readonly selectedValues: readonly (string | number | boolean | null)[] | null;
}

// 多条件筛选
interface MultiFilterSpec {
  readonly type: 'multi';
  readonly colId: string;
  readonly mode: 'AND' | 'OR';
  readonly filters: readonly MultiFilterEntry[];
}
```

## 高级表达式筛选

使用 AND/OR/NOT 逻辑构建复杂的筛选表达式：

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

// 构建复杂筛选：(status = 'Active' AND score > 80) OR name contains 'Alice'
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

### 表达式运算符

| 运算符       | 描述         |
| ------------ | ------------ |
| `=`          | 等于         |
| `!=`         | 不等于       |
| `>`          | 大于         |
| `<`          | 小于         |
| `>=`         | 大于或等于   |
| `<=`         | 小于或等于   |
| `contains`   | 包含子串     |
| `startsWith` | 以指定值开头 |
| `endsWith`   | 以指定值结尾 |
| `in`         | 值在列表中   |
| `isNull`     | 值为 null    |
| `isNotNull`  | 值不为 null  |

### 从文本解析筛选

解析基于文本的筛选表达式并应用：

```typescript
handle.parseAndSetAdvancedFilter('status = "Active" AND score > 80');
```

## 编程式筛选控制

使用 `TableHandle` 通过编程方式控制筛选：

| 方法                              | 描述                 |
| --------------------------------- | -------------------- |
| `getFilter()`                     | 获取当前筛选规格     |
| `setFilter(spec)`                 | 应用筛选规格         |
| `clearFilter()`                   | 移除所有筛选         |
| `getAdvancedFilter()`             | 获取当前表达式筛选   |
| `setAdvancedFilter(expr)`         | 应用表达式筛选       |
| `parseAndSetAdvancedFilter(text)` | 解析并应用文本筛选   |
| `getColumnUniqueValues(colId)`    | 获取集合筛选的唯一值 |
