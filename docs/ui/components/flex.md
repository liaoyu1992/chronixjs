# Flex 弹性布局

Flexbox 布局容器，使用符合 CSS 习惯的属性名称。

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
  <CxFlex gap="medium" align="center">
    <div>Item 1</div>
    <div>Item 2</div>
    <div>Item 3</div>
  </CxFlex>
</template>

<script setup lang="ts">
import { CxFlex } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxFlex gap="medium" align="center">
    <div>Item 1</div>
    <div>Item 2</div>
    <div>Item 3</div>
  </CxFlex>
</template>

<script>
import { CxFlex } from '@chronixjs/ui-vue2';
export default { components: { CxFlex } };
</script>
```

```tsx [React]
import { CxFlex } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxFlex gap="medium" align="center">
      <div>Item 1</div>
      <div>Item 2</div>
      <div>Item 3</div>
    </CxFlex>
  );
}
```

:::

## 列方向与换行

::: code-group

```vue [Vue 3]
<template>
  <CxFlex direction="column" :gap="12" justify="start" wrap="wrap">
    <div>Row 1</div>
    <div>Row 2</div>
    <div>Row 3</div>
  </CxFlex>
</template>

<script setup lang="ts">
import { CxFlex } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxFlex direction="column" :gap="12" justify="start" wrap="wrap">
    <div>Row 1</div>
    <div>Row 2</div>
    <div>Row 3</div>
  </CxFlex>
</template>

<script>
import { CxFlex } from '@chronixjs/ui-vue2';
export default { components: { CxFlex } };
</script>
```

```tsx [React]
import { CxFlex } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxFlex direction="column" gap={12} justify="start" wrap="wrap">
      <div>Row 1</div>
      <div>Row 2</div>
      <div>Row 3</div>
    </CxFlex>
  );
}
```

:::

## API 参考

### 属性 (Props)

| Prop        | 类型                                                                                               | 默认值      | 描述                           |
| ----------- | -------------------------------------------------------------------------------------------------- | ----------- | ------------------------------ |
| `direction` | `'row' \| 'column' \| 'row-reverse' \| 'column-reverse'`                                           | `'row'`     | Flexbox 方向                   |
| `wrap`      | `'nowrap' \| 'wrap' \| 'wrap-reverse'`                                                             | `'nowrap'`  | Flexbox 换行                   |
| `align`     | `'start' \| 'center' \| 'end' \| 'baseline' \| 'stretch' \| undefined`                             | `undefined` | 交叉轴对齐                     |
| `justify`   | `'start' \| 'center' \| 'end' \| 'space-around' \| 'space-between' \| 'space-evenly' \| undefined` | `undefined` | 主轴对齐                       |
| `gap`       | `'small' \| 'medium' \| 'large' \| number \| undefined`                                            | `undefined` | 子元素间距                     |
| `inline`    | `boolean`                                                                                          | `false`     | 使用 `inline-flex` 代替 `flex` |

### 插槽 (Slots)

| Slot      | 描述        |
| --------- | ----------- |
| `default` | Flex 子元素 |
