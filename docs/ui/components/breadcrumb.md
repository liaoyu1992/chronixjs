<script setup>
import BreadcrumbBasic from './demos/breadcrumb/BreadcrumbBasic.vue';
import breadcrumbBasicCode from './demos/breadcrumb/BreadcrumbBasic.vue?raw';
import breadcrumbBasicVue2 from './demos/breadcrumb/BreadcrumbBasic.vue2?raw';
import breadcrumbBasicReact from './demos/breadcrumb/BreadcrumbBasic.react?raw';
</script>

# Breadcrumb 面包屑

层级路径导航，显示用户在页面层级中的当前位置。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## 基础用法

<DemoBox title="基础用法" description="通过 items 属性设置面包屑导航项。" :code="breadcrumbBasicCode" :code-vue2="breadcrumbBasicVue2" :code-react="breadcrumbBasicReact">
  <BreadcrumbBasic />
</DemoBox>

## 自定义分隔符

::: code-group

```vue [Vue 3]
<template>
  <CxBreadcrumb :items="items" separator=">" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxBreadcrumb } from '@chronixjs/ui-vue3';

const items = ref([
  { key: 'home', label: 'Home', href: '/', clickable: true },
  { key: 'about', label: 'About', href: undefined, clickable: false },
]);
</script>
```

```vue [Vue 2]
<template>
  <CxBreadcrumb :items="items" separator=">" />
</template>

<script>
import { CxBreadcrumb } from '@chronixjs/ui-vue2';
export default {
  components: { CxBreadcrumb },
  data() {
    return {
      items: [
        { key: 'home', label: 'Home', href: '/', clickable: true },
        { key: 'about', label: 'About', href: undefined, clickable: false },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxBreadcrumb } from '@chronixjs/ui-react';

export function App() {
  const [items] = useState([
    { key: 'home', label: 'Home', href: '/', clickable: true },
    { key: 'about', label: 'About', href: undefined, clickable: false },
  ]);

  return <CxBreadcrumb items={items} separator=">" />;
}
```

:::

## 处理项点击

::: code-group

```vue [Vue 3]
<template>
  <CxBreadcrumb :items="items" @item-click="onItemClick" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxBreadcrumb } from '@chronixjs/ui-vue3';

const items = ref([
  { key: 'home', label: 'Home', href: '/', clickable: true },
  { key: 'products', label: 'Products', href: '/products', clickable: true },
]);

function onItemClick(item) {
  console.log('Navigating to:', item.label);
}
</script>
```

```vue [Vue 2]
<template>
  <CxBreadcrumb :items="items" @item-click="onItemClick" />
</template>

<script>
import { CxBreadcrumb } from '@chronixjs/ui-vue2';
export default {
  components: { CxBreadcrumb },
  data() {
    return {
      items: [
        { key: 'home', label: 'Home', href: '/', clickable: true },
        { key: 'products', label: 'Products', href: '/products', clickable: true },
      ],
    };
  },
  methods: {
    onItemClick(item) {
      console.log('Navigating to:', item.label);
    },
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxBreadcrumb } from '@chronixjs/ui-react';

export function App() {
  const [items] = useState([
    { key: 'home', label: 'Home', href: '/', clickable: true },
    { key: 'products', label: 'Products', href: '/products', clickable: true },
  ]);

  function onItemClick(item) {
    console.log('Navigating to:', item.label);
  }

  return <CxBreadcrumb items={items} onItemClick={onItemClick} />;
}
```

:::

## API 参考

### 属性 (Props)

| 属性        | 类型                        | 默认值 | 说明                 |
| ----------- | --------------------------- | ------ | -------------------- |
| `items`     | `readonly BreadcrumbItem[]` | `[]`   | 有序的面包屑项列表   |
| `separator` | `string`                    | `'/'`  | 项之间的分隔符字符串 |

### BreadcrumbItem

| 属性        | 类型                  | 默认值      | 说明                         |
| ----------- | --------------------- | ----------- | ---------------------------- |
| `key`       | `string`              | —           | 渲染用的唯一标识             |
| `label`     | `string`              | —           | 显示文本                     |
| `href`      | `string \| undefined` | `undefined` | 设置后渲染为 `<a>` 链接      |
| `clickable` | `boolean`             | `false`     | 即使没有 `href` 也强制可点击 |

### 事件 (Events)

| 事件         | 载荷             | 说明                 |
| ------------ | ---------------- | -------------------- |
| `item-click` | `BreadcrumbItem` | 可点击项被点击时触发 |

### 插槽 (Slots)

| 插槽        | 说明                 |
| ----------- | -------------------- |
| `separator` | 项之间的自定义分隔符 |
