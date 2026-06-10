# Dynamic Input 动态输入

动态输入值列表，用户可以添加或删除项目。

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
  <CxDynamicInput v-model:value="items" placeholder="Enter value" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxDynamicInput } from '@chronixjs/ui-vue3';

const items = ref<string[]>(['Item 1', 'Item 2']);
</script>
```

```vue [Vue 2]
<template>
  <CxDynamicInput :value.sync="items" placeholder="Enter value" />
</template>

<script>
import { CxDynamicInput } from '@chronixjs/ui-vue2';
export default {
  components: { CxDynamicInput },
  data() {
    return { items: ['Item 1', 'Item 2'] };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxDynamicInput } from '@chronixjs/ui-react';

export function App() {
  const [items, setItems] = useState<string[]>(['Item 1', 'Item 2']);

  return <CxDynamicInput value={items} onUpdateValue={setItems} placeholder="Enter value" />;
}
```

:::

## API 参考

### 属性 (Props)

| Prop          | 类型                  | 默认值      | 描述                 |
| ------------- | --------------------- | ----------- | -------------------- |
| `value`       | `readonly unknown[]`  | `[]`        | 值数组               |
| `min`         | `number`              | `0`         | 最少项目数           |
| `max`         | `number \| undefined` | `undefined` | 最多项目数           |
| `disabled`    | `boolean`             | `false`     | 禁用所有输入框       |
| `placeholder` | `string`              | `''`        | 每个输入框的占位文本 |

### 事件 (Events)

| Event          | Payload     | 描述           |
| -------------- | ----------- | -------------- |
| `update:value` | `unknown[]` | 项目变化时触发 |
