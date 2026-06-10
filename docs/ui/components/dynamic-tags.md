# Dynamic Tags 动态标签

内联标签编辑器，用户可以通过输入添加标签，并通过关闭图标移除标签。

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
  <CxDynamicTags v-model:value="tags" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxDynamicTags } from '@chronixjs/ui-vue3';

const tags = ref<string[]>(['Vue', 'React', 'Angular']);
</script>
```

```vue [Vue 2]
<template>
  <CxDynamicTags :value.sync="tags" />
</template>

<script>
import { CxDynamicTags } from '@chronixjs/ui-vue2';
export default {
  components: { CxDynamicTags },
  data() {
    return { tags: ['Vue', 'React', 'Angular'] };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxDynamicTags } from '@chronixjs/ui-react';

export function App() {
  const [tags, setTags] = useState<string[]>(['Vue', 'React', 'Angular']);

  return <CxDynamicTags value={tags} onUpdateValue={setTags} />;
}
```

:::

## API 参考

### 属性 (Props)

| Prop       | 类型                  | 默认值      | 描述                       |
| ---------- | --------------------- | ----------- | -------------------------- |
| `value`    | `readonly string[]`   | `[]`        | 当前标签列表               |
| `max`      | `number \| undefined` | `undefined` | 最大标签数量               |
| `closable` | `boolean`             | `true`      | 是否显示每个标签的关闭图标 |
| `disabled` | `boolean`             | `false`     | 是否禁用编辑器             |

### 事件 (Events)

| Event          | Payload    | 描述           |
| -------------- | ---------- | -------------- |
| `update:value` | `string[]` | 标签变化时触发 |
