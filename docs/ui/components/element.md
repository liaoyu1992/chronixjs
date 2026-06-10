# Element 元素

通用的 Chronix 主题 HTML 元素包装器，支持自定义标签名。

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
  <CxElement tag="section">
    <p>Content inside a themed section element.</p>
  </CxElement>
</template>

<script setup lang="ts">
import { CxElement } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxElement tag="section">
    <p>Content inside a themed section element.</p>
  </CxElement>
</template>

<script>
import { CxElement } from '@chronixjs/ui-vue2';
export default { components: { CxElement } };
</script>
```

```tsx [React]
import { CxElement } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxElement tag="section">
      <p>Content inside a themed section element.</p>
    </CxElement>
  );
}
```

:::

## API 参考

### 属性 (Props)

| Prop     | 类型      | 默认值   | 描述                 |
| -------- | --------- | -------- | -------------------- |
| `tag`    | `string`  | `'span'` | 要渲染的 HTML 标签名 |
| `inline` | `boolean` | `false`  | 是否以内联元素显示   |

### 插槽 (Slots)

| Slot      | 描述     |
| --------- | -------- |
| `default` | 元素内容 |
