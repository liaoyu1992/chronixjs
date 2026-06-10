# Avatar Group 头像组

水平排列的重叠头像组，带有溢出 +N 指示器。

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
  <CxAvatarGroup :items="items" :max="4" :size="32" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxAvatarGroup } from '@chronixjs/ui-vue3';

const items = ref([
  { key: 'a', src: 'https://i.pravatar.cc/32?img=1', text: undefined },
  { key: 'b', src: 'https://i.pravatar.cc/32?img=2', text: undefined },
  { key: 'c', src: undefined, text: 'JD' },
  { key: 'd', src: 'https://i.pravatar.cc/32?img=4', text: undefined },
  { key: 'e', src: 'https://i.pravatar.cc/32?img=5', text: undefined },
]);
</script>
```

```vue [Vue 2]
<template>
  <CxAvatarGroup :items="items" :max="4" :size="32" />
</template>

<script>
import { CxAvatarGroup } from '@chronixjs/ui-vue2';
export default {
  components: { CxAvatarGroup },
  data() {
    return {
      items: [
        { key: 'a', src: 'https://i.pravatar.cc/32?img=1', text: undefined },
        { key: 'b', src: 'https://i.pravatar.cc/32?img=2', text: undefined },
        { key: 'c', src: undefined, text: 'JD' },
        { key: 'd', src: 'https://i.pravatar.cc/32?img=4', text: undefined },
        { key: 'e', src: 'https://i.pravatar.cc/32?img=5', text: undefined },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxAvatarGroup } from '@chronixjs/ui-react';

export function App() {
  const [items] = useState([
    { key: 'a', src: 'https://i.pravatar.cc/32?img=1', text: undefined },
    { key: 'b', src: 'https://i.pravatar.cc/32?img=2', text: undefined },
    { key: 'c', src: undefined, text: 'JD' },
    { key: 'd', src: 'https://i.pravatar.cc/32?img=4', text: undefined },
    { key: 'e', src: 'https://i.pravatar.cc/32?img=5', text: undefined },
  ]);

  return <CxAvatarGroup items={items} max={4} size={32} />;
}
```

:::

## API 参考

### 属性 (Props)

| 属性    | 类型                    | 默认值     | 说明                            |
| ------- | ----------------------- | ---------- | ------------------------------- |
| `items` | `readonly AvatarItem[]` | `[]`       | 头像项数组                      |
| `max`   | `number`                | `5`        | 最大可见数量；超出部分显示为 +N |
| `size`  | `number`                | `32`       | 头像大小（像素）                |
| `shape` | `'circle' \| 'square'`  | `'circle'` | 头像形状                        |

### AvatarItem

| 属性   | 类型                  | 说明               |
| ------ | --------------------- | ------------------ |
| `key`  | `string`              | 唯一标识符         |
| `src`  | `string \| undefined` | 图片 URL           |
| `text` | `string \| undefined` | 回退文本首字母缩写 |
