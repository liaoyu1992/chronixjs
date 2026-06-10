# Transfer 穿梭框

双面板穿梭组件，用于在源列表和目标列表之间移动选项。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## 基础用法

带有可选择选项的穿梭框，可以在源面板和目标面板之间移动。

::: code-group

```vue [Vue 3]
<template>
  <CxTransfer :options="options" v-model:value="targetValues" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxTransfer } from '@chronixjs/ui-vue3';

const targetValues = ref<(string | number)[]>([]);

const options = [
  { label: 'Option 1', value: '1' },
  { label: 'Option 2', value: '2' },
  { label: 'Option 3', value: '3' },
  { label: 'Option 4', value: '4' },
  { label: 'Option 5', value: '5' },
];
</script>
```

```vue [Vue 2]
<template>
  <CxTransfer :options="options" :value.sync="targetValues" />
</template>

<script>
import { CxTransfer } from '@chronixjs/ui-vue2';

export default {
  components: { CxTransfer },
  data() {
    return {
      targetValues: [],
      options: [
        { label: 'Option 1', value: '1' },
        { label: 'Option 2', value: '2' },
        { label: 'Option 3', value: '3' },
        { label: 'Option 4', value: '4' },
        { label: 'Option 5', value: '5' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxTransfer } from '@chronixjs/ui-react';

const OPTIONS = [
  { label: 'Option 1', value: '1' },
  { label: 'Option 2', value: '2' },
  { label: 'Option 3', value: '3' },
  { label: 'Option 4', value: '4' },
  { label: 'Option 5', value: '5' },
];

export function App() {
  const [targetValues, setTargetValues] = useState<(string | number)[]>([]);

  return <CxTransfer options={OPTIONS} value={targetValues} onUpdateValue={setTargetValues} />;
}
```

:::

## 可搜索

使用 `filterable` 在两个面板上启用搜索过滤，并通过 `source-filter-placeholder` 和 `target-filter-placeholder` 自定义占位文本。

::: code-group

```vue [Vue 3]
<template>
  <CxTransfer
    :options="options"
    v-model:value="targetValues"
    filterable
    source-filter-placeholder="Search source"
    target-filter-placeholder="Search target"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxTransfer } from '@chronixjs/ui-vue3';

const targetValues = ref<(string | number)[]>([]);

const options = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry' },
  { label: 'Date', value: 'date' },
  { label: 'Elderberry', value: 'elderberry' },
  { label: 'Fig', value: 'fig' },
  { label: 'Grape', value: 'grape' },
];
</script>
```

```vue [Vue 2]
<template>
  <CxTransfer
    :options="options"
    :value.sync="targetValues"
    filterable
    source-filter-placeholder="Search source"
    target-filter-placeholder="Search target"
  />
</template>

<script>
import { CxTransfer } from '@chronixjs/ui-vue2';

export default {
  components: { CxTransfer },
  data() {
    return {
      targetValues: [],
      options: [
        { label: 'Apple', value: 'apple' },
        { label: 'Banana', value: 'banana' },
        { label: 'Cherry', value: 'cherry' },
        { label: 'Date', value: 'date' },
        { label: 'Elderberry', value: 'elderberry' },
        { label: 'Fig', value: 'fig' },
        { label: 'Grape', value: 'grape' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxTransfer } from '@chronixjs/ui-react';

const OPTIONS = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry' },
  { label: 'Date', value: 'date' },
  { label: 'Elderberry', value: 'elderberry' },
  { label: 'Fig', value: 'fig' },
  { label: 'Grape', value: 'grape' },
];

export function App() {
  const [targetValues, setTargetValues] = useState<(string | number)[]>([]);

  return (
    <CxTransfer
      options={OPTIONS}
      value={targetValues}
      onUpdateValue={setTargetValues}
      filterable
      sourceFilterPlaceholder="Search source"
      targetFilterPlaceholder="Search target"
    />
  );
}
```

:::

## 自定义标题

使用 `source-title` 和 `target-title` 自定义面板标题。

::: code-group

```vue [Vue 3]
<template>
  <CxTransfer
    :options="options"
    v-model:value="targetValues"
    source-title="Available"
    target-title="Selected"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxTransfer } from '@chronixjs/ui-vue3';

const targetValues = ref<(string | number)[]>([]);

const options = [
  { label: 'React', value: 'react' },
  { label: 'Vue', value: 'vue' },
  { label: 'Angular', value: 'angular' },
  { label: 'Svelte', value: 'svelte' },
  { label: 'Solid', value: 'solid' },
];
</script>
```

```vue [Vue 2]
<template>
  <CxTransfer
    :options="options"
    :value.sync="targetValues"
    source-title="Available"
    target-title="Selected"
  />
</template>

<script>
import { CxTransfer } from '@chronixjs/ui-vue2';

export default {
  components: { CxTransfer },
  data() {
    return {
      targetValues: [],
      options: [
        { label: 'React', value: 'react' },
        { label: 'Vue', value: 'vue' },
        { label: 'Angular', value: 'angular' },
        { label: 'Svelte', value: 'svelte' },
        { label: 'Solid', value: 'solid' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxTransfer } from '@chronixjs/ui-react';

const OPTIONS = [
  { label: 'React', value: 'react' },
  { label: 'Vue', value: 'vue' },
  { label: 'Angular', value: 'angular' },
  { label: 'Svelte', value: 'svelte' },
  { label: 'Solid', value: 'solid' },
];

export function App() {
  const [targetValues, setTargetValues] = useState<(string | number)[]>([]);

  return (
    <CxTransfer
      options={OPTIONS}
      value={targetValues}
      onUpdateValue={setTargetValues}
      sourceTitle="Available"
      targetTitle="Selected"
    />
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性                      | 类型                   | 默认值     | 说明                   |
| ------------------------- | ---------------------- | ---------- | ---------------------- |
| `value`                   | `(string \| number)[]` | `[]`       | 已选（目标）值数组     |
| `options`                 | `TransferOption[]`     | `[]`       | 所有可选项             |
| `disabled`                | `boolean`              | `false`    | 禁用穿梭框             |
| `filterable`              | `boolean`              | `false`    | 启用搜索过滤           |
| `sourceTitle`             | `string`               | `'Source'` | 源面板标题             |
| `targetTitle`             | `string`               | `'Target'` | 目标面板标题           |
| `sourceFilterPlaceholder` | `string`               | `''`       | 源面板搜索框占位文本   |
| `targetFilterPlaceholder` | `string`               | `''`       | 目标面板搜索框占位文本 |

### 事件 (Events)

| 事件           | 载荷                   | 说明           |
| -------------- | ---------------------- | -------------- |
| `update:value` | `(string \| number)[]` | 选项变化时触发 |
