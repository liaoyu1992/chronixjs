# Tabs 标签页

支持线条、卡片和分段变体的标签页界面。

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
  <CxTabs v-model:value="activeTab" :items="items" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxTabs } from '@chronixjs/ui-vue3';

const activeTab = ref('tab1');
const items = [
  { key: 'tab1', label: 'Tab 1', content: 'Content of Tab 1' },
  { key: 'tab2', label: 'Tab 2', content: 'Content of Tab 2' },
  { key: 'tab3', label: 'Tab 3', content: 'Content of Tab 3' },
];
</script>
```

```vue [Vue 2]
<template>
  <CxTabs :value.sync="activeTab" :items="items" />
</template>

<script>
import { CxTabs } from '@chronixjs/ui-vue2';

export default {
  components: { CxTabs },
  data() {
    return {
      activeTab: 'tab1',
      items: [
        { key: 'tab1', label: 'Tab 1', content: 'Content of Tab 1' },
        { key: 'tab2', label: 'Tab 2', content: 'Content of Tab 2' },
        { key: 'tab3', label: 'Tab 3', content: 'Content of Tab 3' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxTabs } from '@chronixjs/ui-react';

const items = [
  { key: 'tab1', label: 'Tab 1', content: 'Content of Tab 1' },
  { key: 'tab2', label: 'Tab 2', content: 'Content of Tab 2' },
  { key: 'tab3', label: 'Tab 3', content: 'Content of Tab 3' },
];

export function App() {
  const [activeTab, setActiveTab] = useState('tab1');

  return <CxTabs value={activeTab} onUpdateValue={setActiveTab} items={items} />;
}
```

:::

## 卡片类型

使用 `type="card"` 实现卡片风格的标签栏。

::: code-group

```vue [Vue 3]
<template>
  <CxTabs v-model:value="activeTab" :items="items" type="card" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxTabs } from '@chronixjs/ui-vue3';

const activeTab = ref('tab1');
const items = [
  { key: 'tab1', label: 'Tab 1', content: 'Content of Tab 1' },
  { key: 'tab2', label: 'Tab 2', content: 'Content of Tab 2' },
  { key: 'tab3', label: 'Tab 3', content: 'Content of Tab 3' },
];
</script>
```

```vue [Vue 2]
<template>
  <CxTabs :value.sync="activeTab" :items="items" type="card" />
</template>

<script>
import { CxTabs } from '@chronixjs/ui-vue2';

export default {
  components: { CxTabs },
  data() {
    return {
      activeTab: 'tab1',
      items: [
        { key: 'tab1', label: 'Tab 1', content: 'Content of Tab 1' },
        { key: 'tab2', label: 'Tab 2', content: 'Content of Tab 2' },
        { key: 'tab3', label: 'Tab 3', content: 'Content of Tab 3' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxTabs } from '@chronixjs/ui-react';

const items = [
  { key: 'tab1', label: 'Tab 1', content: 'Content of Tab 1' },
  { key: 'tab2', label: 'Tab 2', content: 'Content of Tab 2' },
  { key: 'tab3', label: 'Tab 3', content: 'Content of Tab 3' },
];

export function App() {
  const [activeTab, setActiveTab] = useState('tab1');

  return <CxTabs value={activeTab} onUpdateValue={setActiveTab} items={items} type="card" />;
}
```

:::

## 分段类型

使用 `type="segment"` 实现分段控制器风格。

::: code-group

```vue [Vue 3]
<template>
  <CxTabs v-model:value="activeTab" :items="items" type="segment" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxTabs } from '@chronixjs/ui-vue3';

const activeTab = ref('tab1');
const items = [
  { key: 'tab1', label: 'Tab 1', content: 'Content of Tab 1' },
  { key: 'tab2', label: 'Tab 2', content: 'Content of Tab 2' },
  { key: 'tab3', label: 'Tab 3', content: 'Content of Tab 3' },
];
</script>
```

```vue [Vue 2]
<template>
  <CxTabs :value.sync="activeTab" :items="items" type="segment" />
</template>

<script>
import { CxTabs } from '@chronixjs/ui-vue2';

export default {
  components: { CxTabs },
  data() {
    return {
      activeTab: 'tab1',
      items: [
        { key: 'tab1', label: 'Tab 1', content: 'Content of Tab 1' },
        { key: 'tab2', label: 'Tab 2', content: 'Content of Tab 2' },
        { key: 'tab3', label: 'Tab 3', content: 'Content of Tab 3' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxTabs } from '@chronixjs/ui-react';

const items = [
  { key: 'tab1', label: 'Tab 1', content: 'Content of Tab 1' },
  { key: 'tab2', label: 'Tab 2', content: 'Content of Tab 2' },
  { key: 'tab3', label: 'Tab 3', content: 'Content of Tab 3' },
];

export function App() {
  const [activeTab, setActiveTab] = useState('tab1');

  return <CxTabs value={activeTab} onUpdateValue={setActiveTab} items={items} type="segment" />;
}
```

:::

## 标签栏位置

使用 `placement` 控制标签栏出现的位置。支持 `top`、`right`、`bottom` 和 `left`。

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; flex-direction: column; gap: 24px;">
    <CxTabs v-model:value="activeTab" :items="items" placement="left" />
    <CxTabs v-model:value="activeTab" :items="items" placement="bottom" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxTabs } from '@chronixjs/ui-vue3';

const activeTab = ref('tab1');
const items = [
  { key: 'tab1', label: 'Tab 1', content: 'Content of Tab 1' },
  { key: 'tab2', label: 'Tab 2', content: 'Content of Tab 2' },
  { key: 'tab3', label: 'Tab 3', content: 'Content of Tab 3' },
];
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; flex-direction: column; gap: 24px;">
    <CxTabs :value.sync="activeTab" :items="items" placement="left" />
    <CxTabs :value.sync="activeTab" :items="items" placement="bottom" />
  </div>
</template>

<script>
import { CxTabs } from '@chronixjs/ui-vue2';

export default {
  components: { CxTabs },
  data() {
    return {
      activeTab: 'tab1',
      items: [
        { key: 'tab1', label: 'Tab 1', content: 'Content of Tab 1' },
        { key: 'tab2', label: 'Tab 2', content: 'Content of Tab 2' },
        { key: 'tab3', label: 'Tab 3', content: 'Content of Tab 3' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxTabs } from '@chronixjs/ui-react';

const items = [
  { key: 'tab1', label: 'Tab 1', content: 'Content of Tab 1' },
  { key: 'tab2', label: 'Tab 2', content: 'Content of Tab 2' },
  { key: 'tab3', label: 'Tab 3', content: 'Content of Tab 3' },
];

export function App() {
  const [activeTab, setActiveTab] = useState('tab1');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <CxTabs value={activeTab} onUpdateValue={setActiveTab} items={items} placement="left" />
      <CxTabs value={activeTab} onUpdateValue={setActiveTab} items={items} placement="bottom" />
    </div>
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性        | 类型                                     | 默认值      | 说明             |
| ----------- | ---------------------------------------- | ----------- | ---------------- |
| `value`     | `string`                                 | `undefined` | 激活的标签页键值 |
| `items`     | `TabItem[]`                              | `[]`        | 标签页项         |
| `type`      | `'line' \| 'card' \| 'segment'`          | `'line'`    | 视觉变体         |
| `placement` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'top'`     | 标签栏位置       |
| `size`      | `'small' \| 'medium' \| 'large'`         | `'medium'`  | 标签页尺寸       |
| `disabled`  | `boolean`                                | `false`     | 禁用标签页       |
| `addable`   | `boolean`                                | `false`     | 显示添加按钮     |
| `draggable` | `boolean`                                | `false`     | 启用拖拽排序     |

### 事件 (Events)

| 事件           | 载荷     | 说明           |
| -------------- | -------- | -------------- |
| `update:value` | `string` | 激活标签页变化 |
