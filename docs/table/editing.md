# 编辑

启用单元格级编辑，支持校验。双击单元格或使用键盘导航开始编辑。

## 基本编辑

在列上设置 `editable: true` 以启用编辑：

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
  // 更新你的数据源
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

## 单元格校验

为列添加校验器以确保数据完整性：

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
      return null; // 有效
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

### 异步校验

使用 `validatorAsync` 进行服务端校验：

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
  readonly reason: string; // 人类可读的错误信息
  readonly code?: string; // 可选的机器可读错误代码
}
```

## 行校验

使用 `rowValidators` 校验整行数据：

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

## 编辑事件

| 事件                | 载荷字段                                                      | 描述     |
| ------------------- | ------------------------------------------------------------- | -------- |
| `cell-edit-start`   | `row`, `column`, `baseValue`, `draftValue`                    | 开始编辑 |
| `cell-edit-stop`    | `row`, `column`, `committed`, `finalValue`, `validationError` | 停止编辑 |
| `cell-value-change` | `row`, `column`, `oldValue`, `newValue`                       | 值已提交 |

## 编程式编辑

通过 `TableHandle` 控制编辑：

| 方法                             | 描述               |
| -------------------------------- | ------------------ |
| `startEditingCell(rowId, colId)` | 开始编辑指定单元格 |
| `commitEditingCell()`            | 提交当前编辑       |
| `cancelEditingCell()`            | 取消当前编辑       |
| `getEditingCell()`               | 获取当前编辑状态   |
| `setEditingCellDraft(value)`     | 设置草稿值         |

## 撤销 / 重做

为编辑操作启用撤销/重做：

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
