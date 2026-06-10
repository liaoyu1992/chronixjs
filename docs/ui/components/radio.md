# Radio 单选

单选按钮组件，支持分组使用。使用 `CxRadioGroup` 从选项列表中进行互斥选择。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## 基础用法（使用 RadioGroup）

::: code-group

```vue [Vue 3]
<template>
  <CxRadioGroup v-model:value="selected" :options="options" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxRadioGroup } from '@chronixjs/ui-vue3';

const selected = ref('vue');
const options = [
  { key: 'vue', label: 'Vue', value: 'vue', disabled: false },
  { key: 'react', label: 'React', value: 'react', disabled: false },
  { key: 'angular', label: 'Angular', value: 'angular', disabled: false },
];
</script>
```

```vue [Vue 2]
<template>
  <CxRadioGroup v-model:value="selected" :options="options" />
</template>

<script>
import { CxRadioGroup } from '@chronixjs/ui-vue2';
export default {
  components: { CxRadioGroup },
  data() {
    return {
      selected: 'vue',
      options: [
        { key: 'vue', label: 'Vue', value: 'vue', disabled: false },
        { key: 'react', label: 'React', value: 'react', disabled: false },
        { key: 'angular', label: 'Angular', value: 'angular', disabled: false },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxRadioGroup } from '@chronixjs/ui-react';

const options = [
  { key: 'vue', label: 'Vue', value: 'vue', disabled: false },
  { key: 'react', label: 'React', value: 'react', disabled: false },
  { key: 'angular', label: 'Angular', value: 'angular', disabled: false },
];

export function App() {
  const [selected, setSelected] = useState('vue');
  return <CxRadioGroup value={selected} onUpdateValue={setSelected} options={options} />;
}
```

:::

## 禁用选项

可以禁用单个选项或整个分组：

::: code-group

```vue [Vue 3]
<template>
  <!-- 禁用整个分组 -->
  <CxRadioGroup v-model:value="val" :options="opts" disabled />

  <!-- 禁用单个选项 -->
  <CxRadioGroup v-model:value="val" :options="optionsWithDisabled" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxRadioGroup } from '@chronixjs/ui-vue3';

const val = ref('a');
const optionsWithDisabled = [
  { key: 'a', label: 'Option A', value: 'a', disabled: false },
  { key: 'b', label: 'Option B (disabled)', value: 'b', disabled: true },
  { key: 'c', label: 'Option C', value: 'c', disabled: false },
];
</script>
```

```tsx [React]
const options = [
  { key: 'a', label: 'Option A', value: 'a', disabled: false },
  { key: 'b', label: 'Option B (disabled)', value: 'b', disabled: true },
  { key: 'c', label: 'Option C', value: 'c', disabled: false },
];

<CxRadioGroup value={val} onUpdateValue={setVal} options={options} />;
```

:::

## 错误状态

::: code-group

```vue [Vue 3]
<template>
  <CxRadioGroup v-model:value="val" :options="opts" error="Please select an option" />
</template>

<script setup lang="ts">
import { CxRadioGroup } from '@chronixjs/ui-vue3';
</script>
```

```tsx [React]
<CxRadioGroup value={val} onUpdateValue={setVal} options={opts} error="Please select an option" />
```

:::

## RadioOption 类型

```typescript
interface RadioOption {
  readonly key: string; // 渲染用的唯一键
  readonly label: string; // 显示文本
  readonly value: string; // 选择值
  readonly disabled: boolean; // 禁用此选项
}
```

## API 参考

### CxRadioGroup 属性 (Props)

| 属性       | 类型                     | 默认值      | 说明                |
| ---------- | ------------------------ | ----------- | ------------------- |
| `value`    | `string`                 | `''`        | 选中的值（v-model） |
| `options`  | `readonly RadioOption[]` | `[]`        | 可用选项            |
| `disabled` | `boolean`                | `false`     | 禁用整个分组        |
| `error`    | `string`                 | `undefined` | 错误提示信息        |

### CxRadioGroup 事件 (Events)

| 事件           | 载荷     | 说明                  |
| -------------- | -------- | --------------------- |
| `update:value` | `string` | 选中值变化（v-model） |
