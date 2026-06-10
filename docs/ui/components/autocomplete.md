# Autocomplete 自动补全

带有用户自定义选项和内置子串过滤的文本输入组件。

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
  <CxAutocomplete v-model:value="query" :options="options" placeholder="Search..." />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxAutocomplete } from '@chronixjs/ui-vue3';

const query = ref('');
const options = ref([
  { key: 'js', label: 'JavaScript', value: 'javascript' },
  { key: 'ts', label: 'TypeScript', value: 'typescript' },
  { key: 'py', label: 'Python', value: 'python' },
]);
</script>
```

```vue [Vue 2]
<template>
  <CxAutocomplete :value.sync="query" :options="options" placeholder="Search..." />
</template>

<script>
import { CxAutocomplete } from '@chronixjs/ui-vue2';
export default {
  components: { CxAutocomplete },
  data() {
    return {
      query: '',
      options: [
        { key: 'js', label: 'JavaScript', value: 'javascript' },
        { key: 'ts', label: 'TypeScript', value: 'typescript' },
        { key: 'py', label: 'Python', value: 'python' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxAutocomplete } from '@chronixjs/ui-react';

export function App() {
  const [query, setQuery] = useState('');
  const [options] = useState([
    { key: 'js', label: 'JavaScript', value: 'javascript' },
    { key: 'ts', label: 'TypeScript', value: 'typescript' },
    { key: 'py', label: 'Python', value: 'python' },
  ]);

  return (
    <CxAutocomplete
      value={query}
      onUpdateValue={setQuery}
      options={options}
      placeholder="Search..."
    />
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性          | 类型                             | 默认值      | 说明         |
| ------------- | -------------------------------- | ----------- | ------------ |
| `value`       | `string`                         | `''`        | 当前输入值   |
| `options`     | `readonly AutoCompleteOption[]`  | `[]`        | 可用选项列表 |
| `placeholder` | `string \| undefined`            | `undefined` | 输入占位文本 |
| `disabled`    | `boolean`                        | `false`     | 禁用输入框   |
| `size`        | `'small' \| 'medium' \| 'large'` | `'medium'`  | 输入框尺寸   |
| `error`       | `string \| undefined`            | `undefined` | 错误提示信息 |

### AutoCompleteOption

| 属性    | 类型     | 说明       |
| ------- | -------- | ---------- |
| `key`   | `string` | 唯一标识符 |
| `label` | `string` | 显示文本   |
| `value` | `string` | 选项值     |

### 事件 (Events)

| 事件           | 载荷                 | 说明               |
| -------------- | -------------------- | ------------------ |
| `update:value` | `string`             | 输入值变化时触发   |
| `select`       | `AutoCompleteOption` | 选择某个选项时触发 |
