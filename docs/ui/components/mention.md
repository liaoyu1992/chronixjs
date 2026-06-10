# Mention 提及

带有 `@trigger` 检测的文本域，打开 Select 风格的下拉菜单。

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
  <CxMention v-model:value="text" :options="users" trigger="@" placeholder="Type @ to mention..." />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxMention } from '@chronixjs/ui-vue3';

const text = ref('');
const users = ref([
  { key: 'alice', label: 'Alice', value: 'alice' },
  { key: 'bob', label: 'Bob', value: 'bob' },
  { key: 'charlie', label: 'Charlie', value: 'charlie' },
]);
</script>
```

```vue [Vue 2]
<template>
  <CxMention :value.sync="text" :options="users" trigger="@" placeholder="Type @ to mention..." />
</template>

<script>
import { CxMention } from '@chronixjs/ui-vue2';
export default {
  components: { CxMention },
  data() {
    return {
      text: '',
      users: [
        { key: 'alice', label: 'Alice', value: 'alice' },
        { key: 'bob', label: 'Bob', value: 'bob' },
        { key: 'charlie', label: 'Charlie', value: 'charlie' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxMention } from '@chronixjs/ui-react';

export function App() {
  const [text, setText] = useState('');
  const [users] = useState([
    { key: 'alice', label: 'Alice', value: 'alice' },
    { key: 'bob', label: 'Bob', value: 'bob' },
    { key: 'charlie', label: 'Charlie', value: 'charlie' },
  ]);

  return (
    <CxMention
      value={text}
      onUpdateValue={setText}
      options={users}
      trigger="@"
      placeholder="Type @ to mention..."
    />
  );
}
```

:::

## API 参考

### 属性 (Props)

| Prop          | 类型                           | 默认值           | 描述             |
| ------------- | ------------------------------ | ---------------- | ---------------- |
| `value`       | `string`                       | `''`             | 文本域内容       |
| `options`     | `readonly SelectOption[]`      | `[]`             | 可提及的选项列表 |
| `trigger`     | `string`                       | `'@'`            | 触发字符         |
| `placement`   | `PopupPlacement`               | `'bottom-start'` | 下拉菜单位置     |
| `disabled`    | `boolean`                      | `false`          | 是否禁用文本域   |
| `placeholder` | `string`                       | `''`             | 文本域占位文本   |
| `sources`     | `readonly MentionSource[]`     | `[]`             | 多源触发映射     |
| `filter`      | `MentionFilterFn \| undefined` | `undefined`      | 自定义过滤函数   |

### 事件 (Events)

| Event          | Payload  | 描述               |
| -------------- | -------- | ------------------ |
| `update:value` | `string` | 文本域值变化时触发 |
