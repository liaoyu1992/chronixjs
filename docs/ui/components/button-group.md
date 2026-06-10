# Button Group 按钮组

弹性容器，将 `CxButton` 子元素分组并合并边框。

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
  <CxButtonGroup>
    <CxButton>Left</CxButton>
    <CxButton>Middle</CxButton>
    <CxButton>Right</CxButton>
  </CxButtonGroup>
</template>

<script setup lang="ts">
import { CxButton, CxButtonGroup } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxButtonGroup>
    <CxButton>Left</CxButton>
    <CxButton>Middle</CxButton>
    <CxButton>Right</CxButton>
  </CxButtonGroup>
</template>

<script>
import { CxButton, CxButtonGroup } from '@chronixjs/ui-vue2';
export default { components: { CxButton, CxButtonGroup } };
</script>
```

```tsx [React]
import { CxButton, CxButtonGroup } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxButtonGroup>
      <CxButton>Left</CxButton>
      <CxButton>Middle</CxButton>
      <CxButton>Right</CxButton>
    </CxButtonGroup>
  );
}
```

:::

## 垂直排列

::: code-group

```vue [Vue 3]
<template>
  <CxButtonGroup vertical size="small">
    <CxButton type="primary">Top</CxButton>
    <CxButton type="primary">Middle</CxButton>
    <CxButton type="primary">Bottom</CxButton>
  </CxButtonGroup>
</template>

<script setup lang="ts">
import { CxButton, CxButtonGroup } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxButtonGroup vertical size="small">
    <CxButton type="primary">Top</CxButton>
    <CxButton type="primary">Middle</CxButton>
    <CxButton type="primary">Bottom</CxButton>
  </CxButtonGroup>
</template>

<script>
import { CxButton, CxButtonGroup } from '@chronixjs/ui-vue2';
export default { components: { CxButton, CxButtonGroup } };
</script>
```

```tsx [React]
import { CxButton, CxButtonGroup } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxButtonGroup vertical size="small">
      <CxButton type="primary">Top</CxButton>
      <CxButton type="primary">Middle</CxButton>
      <CxButton type="primary">Bottom</CxButton>
    </CxButtonGroup>
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性       | 类型                                          | 默认值      | 说明             |
| ---------- | --------------------------------------------- | ----------- | ---------------- |
| `vertical` | `boolean`                                     | `false`     | 垂直排列子按钮   |
| `size`     | `'small' \| 'medium' \| 'large' \| undefined` | `undefined` | 覆盖子按钮的尺寸 |

### 插槽 (Slots)

| 插槽      | 说明       |
| --------- | ---------- |
| `default` | 按钮子元素 |
