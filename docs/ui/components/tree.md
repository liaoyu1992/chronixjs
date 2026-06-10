# Tree 树

层级树形视图，支持展开/收起、选择、拖拽排序、虚拟滚动和异步加载。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## 基础用法

::: code-group

```vue [Vue 3]
<template>
  <CxTree v-model:value="selected" :items="items" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxTree } from '@chronixjs/ui-vue3';
import type { TreeNodeSpec } from '@chronixjs/ui';

interface NodeData {
  label: string;
}

const selected = ref<string | undefined>(undefined);
const items = ref<TreeNodeSpec<NodeData>[]>([
  {
    key: 'root-1',
    data: { label: 'Root 1' },
    children: [
      { key: 'child-1-1', data: { label: 'Child 1-1' } },
      { key: 'child-1-2', data: { label: 'Child 1-2' } },
    ],
  },
  {
    key: 'root-2',
    data: { label: 'Root 2' },
    children: [{ key: 'child-2-1', data: { label: 'Child 2-1' } }],
  },
]);
</script>
```

```vue [Vue 2]
<template>
  <CxTree :value.sync="selected" :items="items" />
</template>

<script>
import { CxTree } from '@chronixjs/ui-vue2';
export default {
  components: { CxTree },
  data() {
    return {
      selected: undefined,
      items: [
        {
          key: 'root-1',
          data: { label: 'Root 1' },
          children: [
            { key: 'child-1-1', data: { label: 'Child 1-1' } },
            { key: 'child-1-2', data: { label: 'Child 1-2' } },
          ],
        },
        {
          key: 'root-2',
          data: { label: 'Root 2' },
          children: [{ key: 'child-2-1', data: { label: 'Child 2-1' } }],
        },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxTree } from '@chronixjs/ui-react';
import type { TreeNodeSpec } from '@chronixjs/ui';

interface NodeData {
  label: string;
}

export function App() {
  const [selected, setSelected] = useState<string | undefined>(undefined);
  const [items] = useState<TreeNodeSpec<NodeData>[]>([
    {
      key: 'root-1',
      data: { label: 'Root 1' },
      children: [
        { key: 'child-1-1', data: { label: 'Child 1-1' } },
        { key: 'child-1-2', data: { label: 'Child 1-2' } },
      ],
    },
    {
      key: 'root-2',
      data: { label: 'Root 2' },
      children: [{ key: 'child-2-1', data: { label: 'Child 2-1' } }],
    },
  ]);

  return <CxTree value={selected} onUpdateValue={setSelected} items={items} />;
}
```

:::

## API 参考

### 属性 (Props)

| 属性                | 类型                                                    | 默认值      | 说明               |
| ------------------- | ------------------------------------------------------- | ----------- | ------------------ |
| `value`             | `string \| undefined`                                   | `undefined` | 选中的节点键       |
| `items`             | `readonly TreeNodeSpec<TreeNodeData>[]`                 | `[]`        | 树形数据           |
| `expandedKeys`      | `ReadonlySet<string> \| readonly string[] \| undefined` | `undefined` | 受控的已展开键     |
| `selectable`        | `boolean`                                               | `true`      | 允许节点选择       |
| `defaultExpandAll`  | `boolean`                                               | `false`     | 挂载时展开所有节点 |
| `draggable`         | `boolean`                                               | `false`     | 启用拖拽排序       |
| `virtual`           | `boolean`                                               | `false`     | 启用虚拟滚动       |
| `virtualItemHeight` | `number`                                                | `28`        | 虚拟模式下的行高   |
| `height`            | `number \| string \| undefined`                         | `undefined` | 容器高度           |
| `loadChildren`      | `(node) => Promise<...>`                                | `undefined` | 异步子节点加载器   |
| `filter`            | `string \| undefined`                                   | `undefined` | 过滤字符串         |
| `disabled`          | `boolean`                                               | `false`     | 禁用整棵树         |

### TreeNodeData

| 属性       | 类型                   | 说明         |
| ---------- | ---------------------- | ------------ |
| `label`    | `string`               | 显示文本     |
| `icon`     | `string \| undefined`  | 可选图标名称 |
| `disabled` | `boolean \| undefined` | 禁用特定节点 |
| `isLeaf`   | `boolean \| undefined` | 强制为叶节点 |

### 事件 (Events)

| 事件                  | 载荷                                | 说明                |
| --------------------- | ----------------------------------- | ------------------- |
| `update:value`        | `string`                            | 选择变化时触发      |
| `update:expandedKeys` | `ReadonlySet<string>`               | 展开/收起变化时触发 |
| `select`              | `(key: string, node: TreeNodeSpec)` | 节点被选中时触发    |
| `reorder`             | `readonly TreeNodeSpec[]`           | 拖拽排序后触发      |

### TreeNodeSpec

| 属性       | 类型                         | 说明         |
| ---------- | ---------------------------- | ------------ |
| `key`      | `string \| number`           | 唯一标识符   |
| `data`     | `T`                          | 用户数据载荷 |
| `children` | `readonly TreeNodeSpec<T>[]` | 可选的子节点 |
