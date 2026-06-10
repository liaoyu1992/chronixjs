# Tree

Hierarchical tree view with expand/collapse, selection, drag-and-drop reorder, virtual scrolling, and async loading.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

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

## API Reference

### Props

| Prop                | Type                                                    | Default     | Description                  |
| ------------------- | ------------------------------------------------------- | ----------- | ---------------------------- |
| `value`             | `string \| undefined`                                   | `undefined` | Selected node key            |
| `items`             | `readonly TreeNodeSpec<TreeNodeData>[]`                 | `[]`        | Tree data                    |
| `expandedKeys`      | `ReadonlySet<string> \| readonly string[] \| undefined` | `undefined` | Controlled expanded keys     |
| `selectable`        | `boolean`                                               | `true`      | Allow node selection         |
| `defaultExpandAll`  | `boolean`                                               | `false`     | Expand all nodes on mount    |
| `draggable`         | `boolean`                                               | `false`     | Enable drag-and-drop reorder |
| `virtual`           | `boolean`                                               | `false`     | Enable virtual scrolling     |
| `virtualItemHeight` | `number`                                                | `28`        | Row height for virtual mode  |
| `height`            | `number \| string \| undefined`                         | `undefined` | Container height             |
| `loadChildren`      | `(node) => Promise<...>`                                | `undefined` | Async children loader        |
| `filter`            | `string \| undefined`                                   | `undefined` | Filter string                |
| `disabled`          | `boolean`                                               | `false`     | Disable the entire tree      |

### TreeNodeData

| Property   | Type                   | Description           |
| ---------- | ---------------------- | --------------------- |
| `label`    | `string`               | Display text          |
| `icon`     | `string \| undefined`  | Optional icon name    |
| `disabled` | `boolean \| undefined` | Disable specific node |
| `isLeaf`   | `boolean \| undefined` | Force leaf node       |

### Events

| Event                 | Payload                             | Description                       |
| --------------------- | ----------------------------------- | --------------------------------- |
| `update:value`        | `string`                            | Fires when selection changes      |
| `update:expandedKeys` | `ReadonlySet<string>`               | Fires when expansion changes      |
| `select`              | `(key: string, node: TreeNodeSpec)` | Fires when a node is selected     |
| `reorder`             | `readonly TreeNodeSpec[]`           | Fires after drag-and-drop reorder |

### TreeNodeSpec

| Property   | Type                         | Description          |
| ---------- | ---------------------------- | -------------------- |
| `key`      | `string \| number`           | Unique identifier    |
| `data`     | `T`                          | User payload         |
| `children` | `readonly TreeNodeSpec<T>[]` | Optional child nodes |
