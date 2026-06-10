# List 列表

垂直列表展示组件，适用于设置项、联系人或文件行，支持可选前缀/后缀。

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
  <CxList :items="items" bordered />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxList } from '@chronixjs/ui-vue3';

const items = ref([
  { key: 'a', title: 'Settings', description: 'App configuration', prefix: '⚙', suffix: '>' },
  { key: 'b', title: 'Profile', description: 'User account', prefix: '👤', suffix: '>' },
  { key: 'c', title: 'Help', prefix: '❓' },
]);
</script>
```

```vue [Vue 2]
<template>
  <CxList :items="items" bordered />
</template>

<script>
import { CxList } from '@chronixjs/ui-vue2';
export default {
  components: { CxList },
  data() {
    return {
      items: [
        { key: 'a', title: 'Settings', description: 'App configuration', prefix: '⚙', suffix: '>' },
        { key: 'b', title: 'Profile', description: 'User account', prefix: '👤', suffix: '>' },
        { key: 'c', title: 'Help', prefix: '❓' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxList } from '@chronixjs/ui-react';

export function App() {
  const [items] = useState([
    { key: 'a', title: 'Settings', description: 'App configuration', prefix: '⚙', suffix: '>' },
    { key: 'b', title: 'Profile', description: 'User account', prefix: '👤', suffix: '>' },
    { key: 'c', title: 'Help', prefix: '❓' },
  ]);

  return <CxList items={items} bordered />;
}
```

:::

## 悬停高亮

::: code-group

```vue [Vue 3]
<template>
  <CxList :items="items" hoverable />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxList } from '@chronixjs/ui-vue3';

const items = ref([
  { key: '1', title: 'Inbox', suffix: '12' },
  { key: '2', title: 'Sent', suffix: '0' },
  { key: '3', title: 'Drafts', suffix: '3' },
]);
</script>
```

```vue [Vue 2]
<template>
  <CxList :items="items" hoverable />
</template>

<script>
import { CxList } from '@chronixjs/ui-vue2';
export default {
  components: { CxList },
  data() {
    return {
      items: [
        { key: '1', title: 'Inbox', suffix: '12' },
        { key: '2', title: 'Sent', suffix: '0' },
        { key: '3', title: 'Drafts', suffix: '3' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxList } from '@chronixjs/ui-react';

export function App() {
  const [items] = useState([
    { key: '1', title: 'Inbox', suffix: '12' },
    { key: '2', title: 'Sent', suffix: '0' },
    { key: '3', title: 'Drafts', suffix: '3' },
  ]);

  return <CxList items={items} hoverable />;
}
```

:::

## API 参考

### 属性 (Props)

| Prop          | 类型                             | 默认值     | 描述                   |
| ------------- | -------------------------------- | ---------- | ---------------------- |
| `items`       | `readonly ListItem[]`            | `[]`       | 列表项数组             |
| `bordered`    | `boolean`                        | `false`    | 是否显示外边框         |
| `hoverable`   | `boolean`                        | `false`    | 悬停时是否高亮项目     |
| `showDivider` | `boolean`                        | `true`     | 是否在项目间显示分隔线 |
| `size`        | `'small' \| 'medium' \| 'large'` | `'medium'` | 内边距比例             |

### ListItem

| Property      | 类型                  | 描述           |
| ------------- | --------------------- | -------------- |
| `key`         | `string`              | 唯一标识       |
| `title`       | `string`              | 主标题文本     |
| `description` | `string \| undefined` | 可选的副文本   |
| `prefix`      | `string \| undefined` | 前置图标/符号  |
| `suffix`      | `string \| undefined` | 后置元数据文本 |
