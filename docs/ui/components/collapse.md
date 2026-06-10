# Collapse 折叠面板

手风琴/多展开面板列表，用于切换内容可见性。

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
  <CxCollapse :items="items" v-model:value="active" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxCollapse } from '@chronixjs/ui-vue3';

const active = ref<string[]>([]);
const items = [
  { key: '1', title: 'Panel 1', content: 'Content of panel 1' },
  { key: '2', title: 'Panel 2', content: 'Content of panel 2' },
  { key: '3', title: 'Panel 3', content: 'Content of panel 3' },
];
</script>
```

```vue [Vue 2]
<template>
  <CxCollapse :items="items" v-model:value="active" />
</template>

<script>
import { CxCollapse } from '@chronixjs/ui-vue2';

export default {
  components: { CxCollapse },
  data() {
    return {
      active: [],
      items: [
        { key: '1', title: 'Panel 1', content: 'Content of panel 1' },
        { key: '2', title: 'Panel 2', content: 'Content of panel 2' },
        { key: '3', title: 'Panel 3', content: 'Content of panel 3' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxCollapse } from '@chronixjs/ui-react';

const items = [
  { key: '1', title: 'Panel 1', content: 'Content of panel 1' },
  { key: '2', title: 'Panel 2', content: 'Content of panel 2' },
  { key: '3', title: 'Panel 3', content: 'Content of panel 3' },
];

export function App() {
  const [active, setActive] = useState<string[]>([]);

  return <CxCollapse items={items} value={active} onUpdateValue={setActive} />;
}
```

:::

## 手风琴模式

::: code-group

```vue [Vue 3]
<template>
  <CxCollapse :items="items" v-model:value="active" accordion />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxCollapse } from '@chronixjs/ui-vue3';

const active = ref<string>('');
const items = [
  { key: '1', title: 'Panel 1', content: 'Content of panel 1' },
  { key: '2', title: 'Panel 2', content: 'Content of panel 2' },
  { key: '3', title: 'Panel 3', content: 'Content of panel 3' },
];
</script>
```

```vue [Vue 2]
<template>
  <CxCollapse :items="items" v-model:value="active" accordion />
</template>

<script>
import { CxCollapse } from '@chronixjs/ui-vue2';

export default {
  components: { CxCollapse },
  data() {
    return {
      active: '',
      items: [
        { key: '1', title: 'Panel 1', content: 'Content of panel 1' },
        { key: '2', title: 'Panel 2', content: 'Content of panel 2' },
        { key: '3', title: 'Panel 3', content: 'Content of panel 3' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxCollapse } from '@chronixjs/ui-react';

const items = [
  { key: '1', title: 'Panel 1', content: 'Content of panel 1' },
  { key: '2', title: 'Panel 2', content: 'Content of panel 2' },
  { key: '3', title: 'Panel 3', content: 'Content of panel 3' },
];

export function App() {
  const [active, setActive] = useState<string>('');

  return <CxCollapse items={items} value={active} onUpdateValue={setActive} accordion />;
}
```

:::

## 箭头位置

::: code-group

```vue [Vue 3]
<template>
  <CxCollapse :items="items" v-model:value="active" arrow-placement="right" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxCollapse } from '@chronixjs/ui-vue3';

const active = ref<string[]>([]);
const items = [
  { key: '1', title: 'Panel 1', content: 'Content of panel 1' },
  { key: '2', title: 'Panel 2', content: 'Content of panel 2' },
];
</script>
```

```vue [Vue 2]
<template>
  <CxCollapse :items="items" v-model:value="active" arrow-placement="right" />
</template>

<script>
import { CxCollapse } from '@chronixjs/ui-vue2';

export default {
  components: { CxCollapse },
  data() {
    return {
      active: [],
      items: [
        { key: '1', title: 'Panel 1', content: 'Content of panel 1' },
        { key: '2', title: 'Panel 2', content: 'Content of panel 2' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxCollapse } from '@chronixjs/ui-react';

const items = [
  { key: '1', title: 'Panel 1', content: 'Content of panel 1' },
  { key: '2', title: 'Panel 2', content: 'Content of panel 2' },
];

export function App() {
  const [active, setActive] = useState<string[]>([]);

  return (
    <CxCollapse items={items} value={active} onUpdateValue={setActive} arrowPlacement="right" />
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性             | 类型                 | 默认值      | 说明         |
| ---------------- | -------------------- | ----------- | ------------ |
| `value`          | `string \| string[]` | `undefined` | 展开的键值   |
| `items`          | `CollapseItem[]`     | `[]`        | 面板项       |
| `accordion`      | `boolean`            | `false`     | 单选展开模式 |
| `arrowPlacement` | `'left' \| 'right'`  | `'left'`    | 箭头位置     |

### 事件 (Events)

| 事件           | 载荷                               | 说明               |
| -------------- | ---------------------------------- | ------------------ |
| `update:value` | `string \| string[]`               | 展开键值变化时触发 |
| `item-change`  | `(key: string, expanded: boolean)` | 单个面板切换时触发 |
