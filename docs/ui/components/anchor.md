<script setup>
import AnchorBasic from './demos/anchor/AnchorBasic.vue';
import anchorBasicCode from './demos/anchor/AnchorBasic.vue?raw';
import anchorBasicVue2 from './demos/anchor/AnchorBasic.vue2?raw';
import anchorBasicReact from './demos/anchor/AnchorBasic.react?raw';
</script>

# Anchor 锚点

垂直锚点导航，带有可选的轨道指示器和激活链接高亮。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="锚点的基础用法，展示三个锚点链接。" :code="anchorBasicCode" :code-vue2="anchorBasicVue2" :code-react="anchorBasicReact">
  <AnchorBasic />
</DemoBox>

## 无轨道模式

::: code-group

```vue [Vue 3]
<template>
  <ChronixAnchor :items="items" :show-rail="false" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ChronixAnchor } from '@chronixjs/ui-vue3';

const items = ref([
  { key: 'a', label: 'Overview', href: '#overview' },
  { key: 'b', label: 'Details', href: '#details' },
]);
</script>
```

```vue [Vue 2]
<template>
  <ChronixAnchor :items="items" :show-rail="false" />
</template>

<script>
import { ChronixAnchor } from '@chronixjs/ui-vue2';
export default {
  components: { ChronixAnchor },
  data() {
    return {
      items: [
        { key: 'a', label: 'Overview', href: '#overview' },
        { key: 'b', label: 'Details', href: '#details' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { ChronixAnchor } from '@chronixjs/ui-react';

export function App() {
  const [items] = useState([
    { key: 'a', label: 'Overview', href: '#overview' },
    { key: 'b', label: 'Details', href: '#details' },
  ]);

  return <ChronixAnchor items={items} showRail={false} />;
}
```

:::

## API 参考

### 属性 (Props)

| 属性             | 类型                    | 默认值 | 说明                       |
| ---------------- | ----------------------- | ------ | -------------------------- |
| `items`          | `readonly AnchorItem[]` | `[]`   | 锚点链接项数组             |
| `showRail`       | `boolean`               | `true` | 显示垂直轨道指示器         |
| `showBackground` | `boolean`               | `true` | 激活链接显示背景高亮       |
| `bound`          | `number`                | `12`   | 滚动检测的偏移边界（像素） |

### AnchorItem

| 属性    | 类型     | 说明                        |
| ------- | -------- | --------------------------- |
| `key`   | `string` | 唯一标识符                  |
| `label` | `string` | 锚点链接的显示文本          |
| `href`  | `string` | 目标元素选择器（如 `#foo`） |
