# TreeSelect 树选择

带有嵌套树形结构的下拉选择器。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## 基础用法

带有嵌套选项的树形选择器，用于层级选择。

::: code-group

```vue [Vue 3]
<template>
  <CxTreeSelect :data="treeData" v-model:value="selected" placeholder="Select..." />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxTreeSelect } from '@chronixjs/ui-vue3';

const selected = ref<string | undefined>(undefined);

const treeData = [
  {
    key: 'node1',
    label: 'Node 1',
    children: [
      { key: 'node1-1', label: 'Node 1-1' },
      { key: 'node1-2', label: 'Node 1-2' },
    ],
  },
  {
    key: 'node2',
    label: 'Node 2',
    children: [{ key: 'node2-1', label: 'Node 2-1' }],
  },
];
</script>
```

```vue [Vue 2]
<template>
  <CxTreeSelect :data="treeData" :value.sync="selected" placeholder="Select..." />
</template>

<script>
import { CxTreeSelect } from '@chronixjs/ui-vue2';

export default {
  components: { CxTreeSelect },
  data() {
    return {
      selected: undefined,
      treeData: [
        {
          key: 'node1',
          label: 'Node 1',
          children: [
            { key: 'node1-1', label: 'Node 1-1' },
            { key: 'node1-2', label: 'Node 1-2' },
          ],
        },
        {
          key: 'node2',
          label: 'Node 2',
          children: [{ key: 'node2-1', label: 'Node 2-1' }],
        },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxTreeSelect } from '@chronixjs/ui-react';

const TREE_DATA = [
  {
    key: 'node1',
    label: 'Node 1',
    children: [
      { key: 'node1-1', label: 'Node 1-1' },
      { key: 'node1-2', label: 'Node 1-2' },
    ],
  },
  {
    key: 'node2',
    label: 'Node 2',
    children: [{ key: 'node2-1', label: 'Node 2-1' }],
  },
];

export function App() {
  const [selected, setSelected] = useState<string | undefined>(undefined);

  return (
    <CxTreeSelect
      data={TREE_DATA}
      value={selected}
      onUpdateValue={setSelected}
      placeholder="Select..."
    />
  );
}
```

:::

## 多选

使用 `multiple` 属性允许选择多个节点。

::: code-group

```vue [Vue 3]
<template>
  <CxTreeSelect
    :data="treeData"
    v-model:value="selected"
    multiple
    placeholder="Select multiple..."
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxTreeSelect } from '@chronixjs/ui-vue3';

const selected = ref<string[]>([]);

const treeData = [
  {
    key: 'frontend',
    label: 'Frontend',
    children: [
      { key: 'vue', label: 'Vue' },
      { key: 'react', label: 'React' },
      { key: 'angular', label: 'Angular' },
    ],
  },
  {
    key: 'backend',
    label: 'Backend',
    children: [
      { key: 'node', label: 'Node.js' },
      { key: 'python', label: 'Python' },
      { key: 'go', label: 'Go' },
    ],
  },
];
</script>
```

```vue [Vue 2]
<template>
  <CxTreeSelect :data="treeData" :value.sync="selected" multiple placeholder="Select multiple..." />
</template>

<script>
import { CxTreeSelect } from '@chronixjs/ui-vue2';

export default {
  components: { CxTreeSelect },
  data() {
    return {
      selected: [],
      treeData: [
        {
          key: 'frontend',
          label: 'Frontend',
          children: [
            { key: 'vue', label: 'Vue' },
            { key: 'react', label: 'React' },
            { key: 'angular', label: 'Angular' },
          ],
        },
        {
          key: 'backend',
          label: 'Backend',
          children: [
            { key: 'node', label: 'Node.js' },
            { key: 'python', label: 'Python' },
            { key: 'go', label: 'Go' },
          ],
        },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxTreeSelect } from '@chronixjs/ui-react';

const TREE_DATA = [
  {
    key: 'frontend',
    label: 'Frontend',
    children: [
      { key: 'vue', label: 'Vue' },
      { key: 'react', label: 'React' },
      { key: 'angular', label: 'Angular' },
    ],
  },
  {
    key: 'backend',
    label: 'Backend',
    children: [
      { key: 'node', label: 'Node.js' },
      { key: 'python', label: 'Python' },
      { key: 'go', label: 'Go' },
    ],
  },
];

export function App() {
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <CxTreeSelect
      data={TREE_DATA}
      value={selected}
      onUpdateValue={setSelected}
      multiple
      placeholder="Select multiple..."
    />
  );
}
```

:::

## 可清除

添加 `clearable` 属性让用户可以通过清除图标重置选择。

::: code-group

```vue [Vue 3]
<template>
  <CxTreeSelect
    :data="treeData"
    v-model:value="selected"
    clearable
    placeholder="Select and clear"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxTreeSelect } from '@chronixjs/ui-vue3';

const selected = ref<string | undefined>(undefined);

const treeData = [
  {
    key: 'fruits',
    label: 'Fruits',
    children: [
      { key: 'apple', label: 'Apple' },
      { key: 'banana', label: 'Banana' },
      { key: 'cherry', label: 'Cherry' },
    ],
  },
  {
    key: 'vegetables',
    label: 'Vegetables',
    children: [
      { key: 'carrot', label: 'Carrot' },
      { key: 'broccoli', label: 'Broccoli' },
    ],
  },
];
</script>
```

```vue [Vue 2]
<template>
  <CxTreeSelect :data="treeData" :value.sync="selected" clearable placeholder="Select and clear" />
</template>

<script>
import { CxTreeSelect } from '@chronixjs/ui-vue2';

export default {
  components: { CxTreeSelect },
  data() {
    return {
      selected: undefined,
      treeData: [
        {
          key: 'fruits',
          label: 'Fruits',
          children: [
            { key: 'apple', label: 'Apple' },
            { key: 'banana', label: 'Banana' },
            { key: 'cherry', label: 'Cherry' },
          ],
        },
        {
          key: 'vegetables',
          label: 'Vegetables',
          children: [
            { key: 'carrot', label: 'Carrot' },
            { key: 'broccoli', label: 'Broccoli' },
          ],
        },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxTreeSelect } from '@chronixjs/ui-react';

const TREE_DATA = [
  {
    key: 'fruits',
    label: 'Fruits',
    children: [
      { key: 'apple', label: 'Apple' },
      { key: 'banana', label: 'Banana' },
      { key: 'cherry', label: 'Cherry' },
    ],
  },
  {
    key: 'vegetables',
    label: 'Vegetables',
    children: [
      { key: 'carrot', label: 'Carrot' },
      { key: 'broccoli', label: 'Broccoli' },
    ],
  },
];

export function App() {
  const [selected, setSelected] = useState<string | undefined>(undefined);

  return (
    <CxTreeSelect
      data={TREE_DATA}
      value={selected}
      onUpdateValue={setSelected}
      clearable
      placeholder="Select and clear"
    />
  );
}
```

:::

## 搜索过滤

使用 `filter-tree` 启用树形选项的搜索过滤功能。

::: code-group

```vue [Vue 3]
<template>
  <CxTreeSelect
    :data="treeData"
    v-model:value="selected"
    filter-tree
    placeholder="Search and select..."
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxTreeSelect } from '@chronixjs/ui-vue3';

const selected = ref<string | undefined>(undefined);

const treeData = [
  {
    key: 'components',
    label: 'Components',
    children: [
      { key: 'button', label: 'Button' },
      { key: 'input', label: 'Input' },
      { key: 'select', label: 'Select' },
      { key: 'checkbox', label: 'Checkbox' },
    ],
  },
  {
    key: 'layouts',
    label: 'Layouts',
    children: [
      { key: 'grid', label: 'Grid' },
      { key: 'flex', label: 'Flex' },
    ],
  },
];
</script>
```

```vue [Vue 2]
<template>
  <CxTreeSelect
    :data="treeData"
    :value.sync="selected"
    filter-tree
    placeholder="Search and select..."
  />
</template>

<script>
import { CxTreeSelect } from '@chronixjs/ui-vue2';

export default {
  components: { CxTreeSelect },
  data() {
    return {
      selected: undefined,
      treeData: [
        {
          key: 'components',
          label: 'Components',
          children: [
            { key: 'button', label: 'Button' },
            { key: 'input', label: 'Input' },
            { key: 'select', label: 'Select' },
            { key: 'checkbox', label: 'Checkbox' },
          ],
        },
        {
          key: 'layouts',
          label: 'Layouts',
          children: [
            { key: 'grid', label: 'Grid' },
            { key: 'flex', label: 'Flex' },
          ],
        },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxTreeSelect } from '@chronixjs/ui-react';

const TREE_DATA = [
  {
    key: 'components',
    label: 'Components',
    children: [
      { key: 'button', label: 'Button' },
      { key: 'input', label: 'Input' },
      { key: 'select', label: 'Select' },
      { key: 'checkbox', label: 'Checkbox' },
    ],
  },
  {
    key: 'layouts',
    label: 'Layouts',
    children: [
      { key: 'grid', label: 'Grid' },
      { key: 'flex', label: 'Flex' },
    ],
  },
];

export function App() {
  const [selected, setSelected] = useState<string | undefined>(undefined);

  return (
    <CxTreeSelect
      data={TREE_DATA}
      value={selected}
      onUpdateValue={setSelected}
      filterTree
      placeholder="Search and select..."
    />
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性           | 类型                 | 默认值           | 说明           |
| -------------- | -------------------- | ---------------- | -------------- |
| `value`        | `string \| string[]` | `undefined`      | 选中的值       |
| `data`         | `TreeNodeSpec[]`     | `[]`             | 树形数据       |
| `multiple`     | `boolean`            | `false`          | 多选模式       |
| `clearable`    | `boolean`            | `false`          | 显示清除图标   |
| `placeholder`  | `string`             | `''`             | 占位文本       |
| `disabled`     | `boolean`            | `false`          | 禁用选择器     |
| `expandedKeys` | `string[]`           | `[]`             | 已展开的节点键 |
| `filterTree`   | `boolean`            | `false`          | 启用树形过滤   |
| `placement`    | `PopupPlacement`     | `'bottom-start'` | 下拉弹出位置   |

### 事件 (Events)

| 事件           | 载荷                 | 说明         |
| -------------- | -------------------- | ------------ |
| `update:value` | `string \| string[]` | 值变化时触发 |
