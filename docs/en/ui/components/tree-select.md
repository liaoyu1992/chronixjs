# Tree Select

A dropdown selector with a nested tree structure.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

A tree-select with nested options for hierarchical selection.

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

## Multiple Selection

Use the `multiple` prop to allow selecting more than one node.

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

## Clearable

Add `clearable` to let users reset the selection with a clear icon.

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

## Filter Tree

Enable search filtering on the tree options with `filter-tree`.

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

## API Reference

### Props

| Prop           | Type                 | Default          | Description        |
| -------------- | -------------------- | ---------------- | ------------------ |
| `value`        | `string \| string[]` | `undefined`      | Selected value(s)  |
| `data`         | `TreeNodeSpec[]`     | `[]`             | Tree data          |
| `multiple`     | `boolean`            | `false`          | Multi-select mode  |
| `clearable`    | `boolean`            | `false`          | Show clear icon    |
| `placeholder`  | `string`             | `''`             | Placeholder text   |
| `disabled`     | `boolean`            | `false`          | Disable select     |
| `expandedKeys` | `string[]`           | `[]`             | Expanded keys      |
| `filterTree`   | `boolean`            | `false`          | Enable tree filter |
| `placement`    | `PopupPlacement`     | `'bottom-start'` | Dropdown position  |

### Events

| Event          | Payload              | Description   |
| -------------- | -------------------- | ------------- |
| `update:value` | `string \| string[]` | Value changed |
