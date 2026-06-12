<script setup>
import SelectBasic from './demos/select/SelectBasic.vue';
import selectBasicCode from './demos/select/SelectBasic.vue?raw';
import selectBasicVue2 from './demos/select/SelectBasic.vue2?raw';
import selectBasicReact from './demos/select/SelectBasic.react?raw';
import SelectMultiple from './demos/select/SelectMultiple.vue';
import selectMultipleCode from './demos/select/SelectMultiple.vue?raw';
import selectMultipleVue2 from './demos/select/SelectMultiple.vue2?raw';
import selectMultipleReact from './demos/select/SelectMultiple.react?raw';
</script>

# Select 选择器

功能齐全的下拉选择器，支持单选/多选、筛选和虚拟滚动。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="单选下拉选择器。" :code="selectBasicCode" :code-vue2="selectBasicVue2" :code-react="selectBasicReact">
  <SelectBasic />
</DemoBox>

## 多选模式

<DemoBox title="多选模式" description="使用 multiple 属性允许选择多个值。" :code="selectMultipleCode" :code-vue2="selectMultipleVue2" :code-react="selectMultipleReact">
  <SelectMultiple />
</DemoBox>

## 可筛选

启用 `filterable` 属性允许用户搜索选项列表。

::: code-group

```vue [Vue 3]
<template>
  <CxSelect :options="options" v-model:value="selected" filterable placeholder="Search..." />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxSelect } from '@chronixjs/ui-vue3';

const selected = ref<string | undefined>(undefined);

const options = [
  { key: '1', label: 'Apple', value: 'apple' },
  { key: '2', label: 'Banana', value: 'banana' },
  { key: '3', label: 'Cherry', value: 'cherry' },
  { key: '4', label: 'Durian', value: 'durian' },
  { key: '5', label: 'Elderberry', value: 'elderberry' },
];
</script>
```

```vue [Vue 2]
<template>
  <CxSelect :options="options" :value.sync="selected" filterable placeholder="Search..." />
</template>

<script>
import { CxSelect } from '@chronixjs/ui-vue2';
export default {
  components: { CxSelect },
  data() {
    return {
      selected: undefined,
      options: [
        { key: '1', label: 'Apple', value: 'apple' },
        { key: '2', label: 'Banana', value: 'banana' },
        { key: '3', label: 'Cherry', value: 'cherry' },
        { key: '4', label: 'Durian', value: 'durian' },
        { key: '5', label: 'Elderberry', value: 'elderberry' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxSelect } from '@chronixjs/ui-react';

const OPTIONS = [
  { key: '1', label: 'Apple', value: 'apple' },
  { key: '2', label: 'Banana', value: 'banana' },
  { key: '3', label: 'Cherry', value: 'cherry' },
  { key: '4', label: 'Durian', value: 'durian' },
  { key: '5', label: 'Elderberry', value: 'elderberry' },
];

export function App() {
  const [selected, setSelected] = useState<string | undefined>(undefined);

  return (
    <CxSelect
      options={OPTIONS}
      value={selected}
      onUpdateValue={setSelected}
      filterable
      placeholder="Search..."
    />
  );
}
```

:::

## 可清除

添加 `clearable` 让用户通过清除图标重置选择。

::: code-group

```vue [Vue 3]
<template>
  <CxSelect
    :options="options"
    v-model:value="selected"
    clearable
    placeholder="Select and clear..."
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxSelect } from '@chronixjs/ui-vue3';

const selected = ref<string | undefined>(undefined);

const options = [
  { key: '1', label: 'Option A', value: 'a' },
  { key: '2', label: 'Option B', value: 'b' },
  { key: '3', label: 'Option C', value: 'c' },
];
</script>
```

```vue [Vue 2]
<template>
  <CxSelect :options="options" :value.sync="selected" clearable placeholder="Select and clear..." />
</template>

<script>
import { CxSelect } from '@chronixjs/ui-vue2';
export default {
  components: { CxSelect },
  data() {
    return {
      selected: undefined,
      options: [
        { key: '1', label: 'Option A', value: 'a' },
        { key: '2', label: 'Option B', value: 'b' },
        { key: '3', label: 'Option C', value: 'c' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxSelect } from '@chronixjs/ui-react';

const OPTIONS = [
  { key: '1', label: 'Option A', value: 'a' },
  { key: '2', label: 'Option B', value: 'b' },
  { key: '3', label: 'Option C', value: 'c' },
];

export function App() {
  const [selected, setSelected] = useState<string | undefined>(undefined);

  return (
    <CxSelect
      options={OPTIONS}
      value={selected}
      onUpdateValue={setSelected}
      clearable
      placeholder="Select and clear..."
    />
  );
}
```

:::

## 选项分组

在选项对象上使用 `children` 数组创建分组选项。

::: code-group

```vue [Vue 3]
<template>
  <CxSelect :options="options" v-model:value="selected" placeholder="Select a city..." />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxSelect } from '@chronixjs/ui-vue3';

const selected = ref<string | undefined>(undefined);

const options = [
  {
    key: 'east',
    label: 'East Coast',
    children: [
      { key: 'nyc', label: 'New York', value: 'nyc' },
      { key: 'bos', label: 'Boston', value: 'bos' },
      { key: 'mia', label: 'Miami', value: 'mia' },
    ],
  },
  {
    key: 'west',
    label: 'West Coast',
    children: [
      { key: 'sfo', label: 'San Francisco', value: 'sfo' },
      { key: 'lax', label: 'Los Angeles', value: 'lax' },
      { key: 'sea', label: 'Seattle', value: 'sea' },
    ],
  },
];
</script>
```

```vue [Vue 2]
<template>
  <CxSelect :options="options" :value.sync="selected" placeholder="Select a city..." />
</template>

<script>
import { CxSelect } from '@chronixjs/ui-vue2';
export default {
  components: { CxSelect },
  data() {
    return {
      selected: undefined,
      options: [
        {
          key: 'east',
          label: 'East Coast',
          children: [
            { key: 'nyc', label: 'New York', value: 'nyc' },
            { key: 'bos', label: 'Boston', value: 'bos' },
            { key: 'mia', label: 'Miami', value: 'mia' },
          ],
        },
        {
          key: 'west',
          label: 'West Coast',
          children: [
            { key: 'sfo', label: 'San Francisco', value: 'sfo' },
            { key: 'lax', label: 'Los Angeles', value: 'lax' },
            { key: 'sea', label: 'Seattle', value: 'sea' },
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
import { CxSelect } from '@chronixjs/ui-react';

const OPTIONS = [
  {
    key: 'east',
    label: 'East Coast',
    children: [
      { key: 'nyc', label: 'New York', value: 'nyc' },
      { key: 'bos', label: 'Boston', value: 'bos' },
      { key: 'mia', label: 'Miami', value: 'mia' },
    ],
  },
  {
    key: 'west',
    label: 'West Coast',
    children: [
      { key: 'sfo', label: 'San Francisco', value: 'sfo' },
      { key: 'lax', label: 'Los Angeles', value: 'lax' },
      { key: 'sea', label: 'Seattle', value: 'sea' },
    ],
  },
];

export function App() {
  const [selected, setSelected] = useState<string | undefined>(undefined);

  return (
    <CxSelect
      options={OPTIONS}
      value={selected}
      onUpdateValue={setSelected}
      placeholder="Select a city..."
    />
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性          | 类型                 | 默认值      | 说明              |
| ------------- | -------------------- | ----------- | ----------------- |
| `value`       | `string \| string[]` | `undefined` | 选中值（v-model） |
| `options`     | `SelectOption[]`     | `[]`        | 选项列表          |
| `multiple`    | `boolean`            | `false`     | 多选模式          |
| `placeholder` | `string`             | `''`        | 占位文本          |
| `disabled`    | `boolean`            | `false`     | 禁用选择器        |
| `filterable`  | `boolean`            | `false`     | 可搜索            |

### 事件 (Events)

| 事件           | 载荷  | 说明         |
| -------------- | ----- | ------------ |
| `update:value` | `any` | 值变化时触发 |
