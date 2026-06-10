# 固定列与行

冻结列和行，使其在滚动时保持可见。将列固定到左侧或右侧，将行固定到顶部或底部。

## 固定列

在列定义上设置 `pinned: 'left'` 或 `pinned: 'right'`：

::: code-group

```vue [Vue 3]
<template>
  <ChronixTable :columns="columns" :rows="rows" />
</template>

<script setup lang="ts">
import { ChronixTable } from '@chronixjs/table-vue3';
import type { ColumnSpec, RowSpec } from '@chronixjs/table';

const columns: ColumnSpec[] = [
  // 固定到左侧 — 始终可见
  { id: 'id', field: 'id', headerName: 'ID', width: 80, pinned: 'left' },
  { id: 'name', field: 'name', headerName: 'Name', width: 150, pinned: 'left' },

  // 可滚动的中间列
  { id: 'email', field: 'email', headerName: 'Email', width: 200 },
  { id: 'phone', field: 'phone', headerName: 'Phone', width: 150 },
  { id: 'address', field: 'address', headerName: 'Address', width: 250 },
  { id: 'notes', field: 'notes', headerName: 'Notes', width: 300 },

  // 固定到右侧 — 始终可见
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

### 工作原理

- **左侧固定**列在左侧单独的区域中渲染
- **右侧固定**列在右侧单独的区域中渲染
- 微妙的阴影将固定区域与可滚动的中间区域分隔
- 水平滚动时固定列保持不动

## 固定行

使用 `RowSpec` 上的 `pinned` 字段将行固定到顶部或底部：

```typescript
const rows: RowSpec[] = [
  // 固定到顶部 — 始终显示在可滚动行上方
  { id: 'summary', data: { name: 'Summary', value: 'Total: 3 items' }, pinned: 'top' },

  // 普通可滚动行
  { id: '1', data: { name: 'Alice', value: 'Item A' } },
  { id: '2', data: { name: 'Bob', value: 'Item B' } },
  { id: '3', data: { name: 'Carol', value: 'Item C' } },

  // 固定到底部 — 始终显示在可滚动行下方
  { id: 'footer', data: { name: 'Footer', value: 'Grand Total' }, pinned: 'bottom' },
];
```

### 使用场景

- **顶部固定行**：汇总行、分组表头、自定义工具栏行
- **底部固定行**：合计、聚合、操作行

## 主题令牌

自定义固定区域外观：

```typescript
const theme: Partial<ChronixTableTheme> = {
  pinnedShadowColor: 'rgba(0, 0, 0, 0.12)', // 区域间的阴影
  pinnedZoneBg: '#fafafa', // 固定区域背景
  pinnedRowZIndex: 10, // 固定行的 z-index
};
```

| 令牌                | 默认值                | 描述           |
| ------------------- | --------------------- | -------------- |
| `pinnedShadowColor` | `rgba(0, 0, 0, 0.12)` | 分隔阴影颜色   |
| `pinnedZoneBg`      | `'inherit'`           | 固定区域背景   |
| `pinnedRowZIndex`   | `10`                  | 固定行 z-index |
