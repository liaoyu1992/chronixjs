# 树形数据

以可展开的树形行展示层级数据。树形数据支持本地和异步子节点加载。

## 基本树形数据

使用嵌套的 `children` 数组定义行：

::: code-group

```vue [Vue 3]
<template>
  <ChronixTable :columns="columns" :rows="rows" />
</template>

<script setup lang="ts">
import { ChronixTable } from '@chronixjs/table-vue3';
import type { ColumnSpec, RowSpec } from '@chronixjs/table';

const columns: ColumnSpec[] = [
  { id: 'name', field: 'name', headerName: 'Name', treeColumn: true },
  { id: 'type', field: 'type', headerName: 'Type' },
  { id: 'size', field: 'size', headerName: 'Size' },
];

const rows: RowSpec[] = [
  {
    id: '1',
    data: { name: 'src', type: 'folder', size: '-' },
    hasChildren: true,
    children: [
      { id: '1-1', data: { name: 'index.ts', type: 'file', size: '2 KB' }, depth: 1 },
      { id: '1-2', data: { name: 'utils.ts', type: 'file', size: '5 KB' }, depth: 1 },
    ],
  },
  {
    id: '2',
    data: { name: 'package.json', type: 'file', size: '1 KB' },
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
        { id: 'name', field: 'name', headerName: 'Name', treeColumn: true },
        { id: 'type', field: 'type', headerName: 'Type' },
      ],
      rows: [
        {
          id: '1',
          data: { name: 'src', type: 'folder' },
          hasChildren: true,
          children: [{ id: '1-1', data: { name: 'index.ts', type: 'file' }, depth: 1 }],
        },
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
  { id: 'name', field: 'name', headerName: 'Name', treeColumn: true },
  { id: 'type', field: 'type', headerName: 'Type' },
];

const rows: RowSpec[] = [
  {
    id: '1',
    data: { name: 'src', type: 'folder' },
    hasChildren: true,
    children: [{ id: '1-1', data: { name: 'index.ts', type: 'file' }, depth: 1 }],
  },
];

export function App() {
  return <ChronixTable columns={columns} rows={rows} />;
}
```

:::

## 树形列

在应显示展开/折叠箭头的列上设置 `treeColumn: true`：

```typescript
{ id: 'name', field: 'name', headerName: 'Name', treeColumn: true }
```

箭头和缩进会自动在此列中渲染。

## RowSpec 树形字段

| 字段          | 类型                 | 描述                           |
| ------------- | -------------------- | ------------------------------ |
| `children`    | `readonly RowSpec[]` | 嵌套子行                       |
| `hasChildren` | `boolean`            | 即使未加载子节点也显示展开箭头 |
| `depth`       | `number`             | 嵌套层级（0 = 根节点）         |
| `groupKey`    | `string \| null`     | 分组键                         |

## 受控展开

控制哪些行被展开：

::: code-group

```vue [Vue 3]
<template>
  <ChronixTable
    :columns="columns"
    :rows="rows"
    :expanded-row-ids="expandedIds"
    @expanded-row-ids-change="expandedIds = $event"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ChronixTable } from '@chronixjs/table-vue3';

const expandedIds = ref<string[]>(['1', '2']); // 预展开的行
</script>
```

:::

### 展开属性

| 属性                    | 类型                | 默认值 | 描述              |
| ----------------------- | ------------------- | ------ | ----------------- |
| `expandedRowIds`        | `readonly string[]` |        | 受控的展开行      |
| `defaultExpandedRowIds` | `readonly string[]` | `[]`   | 初始展开行        |
| `defaultExpandedDepth`  | `number`            |        | 自动展开到第 N 层 |

## 异步子节点加载

从服务器按需加载子节点：

::: code-group

```vue [Vue 3]
<template>
  <ChronixTable :columns="columns" :rows="rows" :children-loader="loadChildren" />
</template>

<script setup lang="ts">
import { ChronixTable } from '@chronixjs/table-vue3';
import type { RowSpec } from '@chronixjs/table';

async function loadChildren({
  parent,
  signal,
}: {
  parent: RowSpec;
  signal: AbortSignal;
}): Promise<readonly RowSpec[]> {
  const response = await fetch(`/api/children/${parent.id}`, { signal });
  const data = await response.json();
  return data.map((item) => ({
    id: item.id,
    data: item,
    hasChildren: item.hasChildren,
  }));
}

// 将根行标记为拥有子节点
const rows: RowSpec[] = [{ id: '1', data: { name: 'Root Folder' }, hasChildren: true }];
</script>
```

:::

`signal` 参数允许在加载完成前用户折叠行时中止请求。

## 主题定制

定制树形相关的主题令牌：

```typescript
const theme: Partial<ChronixTableTheme> = {
  treeIndentPx: 24, // 每级缩进
  treeChevronColor: '#6b7280', // 展开/折叠图标颜色
  treeSpinnerColor: '#3b82f6', // 加载动画颜色
  treeErrorColor: '#ef4444', // 错误图标颜色
};
```
