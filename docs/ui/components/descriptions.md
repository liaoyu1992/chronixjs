<script setup>
import DescriptionsBasic from './demos/descriptions/DescriptionsBasic.vue';
import descriptionsBasicCode from './demos/descriptions/DescriptionsBasic.vue?raw';
import descriptionsBasicVue2 from './demos/descriptions/DescriptionsBasic.vue2?raw';
import descriptionsBasicReact from './demos/descriptions/DescriptionsBasic.react?raw';
</script>

# Descriptions 描述列表

多列键值对展示，用于在网格布局中呈现结构化数据。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## 基础用法

<DemoBox title="基础用法" description="通过 items 传入键值对数据，columns 设置为 1 列。" :code="descriptionsBasicCode" :code-vue2="descriptionsBasicVue2" :code-react="descriptionsBasicReact">
  <DescriptionsBasic />
</DemoBox>

## 带边框

::: code-group

```vue [Vue 3]
<template>
  <CxDescriptions :items="items" bordered title="User Info" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxDescriptions } from '@chronixjs/ui-vue3';

const items = ref([
  { key: 'user', label: 'Username', value: 'admin', span: 1 },
  { key: 'email', label: 'Email', value: 'admin@example.com', span: 2 },
  { key: 'role', label: 'Role', value: 'Administrator', span: 1 },
]);
</script>
```

```vue [Vue 2]
<template>
  <CxDescriptions :items="items" bordered title="User Info" />
</template>

<script>
import { CxDescriptions } from '@chronixjs/ui-vue2';
export default {
  components: { CxDescriptions },
  data() {
    return {
      items: [
        { key: 'user', label: 'Username', value: 'admin', span: 1 },
        { key: 'email', label: 'Email', value: 'admin@example.com', span: 2 },
        { key: 'role', label: 'Role', value: 'Administrator', span: 1 },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxDescriptions } from '@chronixjs/ui-react';

export function App() {
  const [items] = useState([
    { key: 'user', label: 'Username', value: 'admin', span: 1 },
    { key: 'email', label: 'Email', value: 'admin@example.com', span: 2 },
    { key: 'role', label: 'Role', value: 'Administrator', span: 1 },
  ]);

  return <CxDescriptions items={items} bordered title="User Info" />;
}
```

:::

## 标签置顶

::: code-group

```vue [Vue 3]
<template>
  <CxDescriptions :items="items" label-placement="top" :columns="2" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxDescriptions } from '@chronixjs/ui-vue3';

const items = ref([
  { key: 'a', label: 'Status', value: 'Running', span: 1 },
  { key: 'b', label: 'Uptime', value: '99.9%', span: 1 },
]);
</script>
```

```vue [Vue 2]
<template>
  <CxDescriptions :items="items" label-placement="top" :columns="2" />
</template>

<script>
import { CxDescriptions } from '@chronixjs/ui-vue2';
export default {
  components: { CxDescriptions },
  data() {
    return {
      items: [
        { key: 'a', label: 'Status', value: 'Running', span: 1 },
        { key: 'b', label: 'Uptime', value: '99.9%', span: 1 },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxDescriptions } from '@chronixjs/ui-react';

export function App() {
  const [items] = useState([
    { key: 'a', label: 'Status', value: 'Running', span: 1 },
    { key: 'b', label: 'Uptime', value: '99.9%', span: 1 },
  ]);

  return <CxDescriptions items={items} labelPlacement="top" columns={2} />;
}
```

:::

## API 参考

### 属性 (Props)

| 属性             | 类型                             | 默认值      | 说明             |
| ---------------- | -------------------------------- | ----------- | ---------------- |
| `items`          | `readonly DescriptionItem[]`     | `[]`        | 标签-值项数组    |
| `columns`        | `number`                         | `3`         | 网格列数         |
| `bordered`       | `boolean`                        | `false`     | 显示表格样式边框 |
| `labelPlacement` | `'left' \| 'top'`                | `'left'`    | 每项中标签的位置 |
| `size`           | `'small' \| 'medium' \| 'large'` | `'medium'`  | 内边距大小       |
| `title`          | `string \| undefined`            | `undefined` | 可选的标题       |

### DescriptionItem

| 属性    | 类型     | 默认值 | 说明           |
| ------- | -------- | ------ | -------------- |
| `key`   | `string` | —      | 渲染用的唯一键 |
| `label` | `string` | —      | 标签文本       |
| `value` | `string` | —      | 值文本         |
| `span`  | `number` | `1`    | 该项占据的列数 |

### 插槽 (Slots)

| 插槽    | 说明                               |
| ------- | ---------------------------------- |
| `title` | 自定义标题内容（覆盖 prop 属性值） |
