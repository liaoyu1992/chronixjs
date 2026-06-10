# Anchor 锚点

垂直锚点导航，带有可选的轨道指示器和激活链接高亮。

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
  <CxAnchor :items="items" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxAnchor } from '@chronixjs/ui-vue3';

const items = ref([
  { key: 'sec-1', label: 'Section 1', href: '#section-1' },
  { key: 'sec-2', label: 'Section 2', href: '#section-2' },
  { key: 'sec-3', label: 'Section 3', href: '#section-3' },
]);
</script>
```

```vue [Vue 2]
<template>
  <CxAnchor :items="items" />
</template>

<script>
import { CxAnchor } from '@chronixjs/ui-vue2';
export default {
  components: { CxAnchor },
  data() {
    return {
      items: [
        { key: 'sec-1', label: 'Section 1', href: '#section-1' },
        { key: 'sec-2', label: 'Section 2', href: '#section-2' },
        { key: 'sec-3', label: 'Section 3', href: '#section-3' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxAnchor } from '@chronixjs/ui-react';

export function App() {
  const [items] = useState([
    { key: 'sec-1', label: 'Section 1', href: '#section-1' },
    { key: 'sec-2', label: 'Section 2', href: '#section-2' },
    { key: 'sec-3', label: 'Section 3', href: '#section-3' },
  ]);

  return <CxAnchor items={items} />;
}
```

:::

## 无轨道模式

::: code-group

```vue [Vue 3]
<template>
  <CxAnchor :items="items" :show-rail="false" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxAnchor } from '@chronixjs/ui-vue3';

const items = ref([
  { key: 'a', label: 'Overview', href: '#overview' },
  { key: 'b', label: 'Details', href: '#details' },
]);
</script>
```

```vue [Vue 2]
<template>
  <CxAnchor :items="items" :show-rail="false" />
</template>

<script>
import { CxAnchor } from '@chronixjs/ui-vue2';
export default {
  components: { CxAnchor },
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
import { CxAnchor } from '@chronixjs/ui-react';

export function App() {
  const [items] = useState([
    { key: 'a', label: 'Overview', href: '#overview' },
    { key: 'b', label: 'Details', href: '#details' },
  ]);

  return <CxAnchor items={items} showRail={false} />;
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
