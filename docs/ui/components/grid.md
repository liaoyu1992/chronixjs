# Grid 栅格布局

CSS Grid 二维布局容器，提供简化的列和间距配置。

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
  <CxGrid :cols="3" :x-gap="16" :y-gap="12">
    <div>Cell 1</div>
    <div>Cell 2</div>
    <div>Cell 3</div>
    <div>Cell 4</div>
    <div>Cell 5</div>
    <div>Cell 6</div>
  </CxGrid>
</template>

<script setup lang="ts">
import { CxGrid } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxGrid :cols="3" :x-gap="16" :y-gap="12">
    <div>Cell 1</div>
    <div>Cell 2</div>
    <div>Cell 3</div>
    <div>Cell 4</div>
    <div>Cell 5</div>
    <div>Cell 6</div>
  </CxGrid>
</template>

<script>
import { CxGrid } from '@chronixjs/ui-vue2';
export default { components: { CxGrid } };
</script>
```

```tsx [React]
import { CxGrid } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxGrid cols={3} xGap={16} yGap={12}>
      <div>Cell 1</div>
      <div>Cell 2</div>
      <div>Cell 3</div>
      <div>Cell 4</div>
      <div>Cell 5</div>
      <div>Cell 6</div>
    </CxGrid>
  );
}
```

:::

## 自定义轨道模板

::: code-group

```vue [Vue 3]
<template>
  <CxGrid cols="120px 1fr 120px" :x-gap="8">
    <div>Sidebar</div>
    <div>Main Content</div>
    <div>Aside</div>
  </CxGrid>
</template>

<script setup lang="ts">
import { CxGrid } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxGrid cols="120px 1fr 120px" :x-gap="8">
    <div>Sidebar</div>
    <div>Main Content</div>
    <div>Aside</div>
  </CxGrid>
</template>

<script>
import { CxGrid } from '@chronixjs/ui-vue2';
export default { components: { CxGrid } };
</script>
```

```tsx [React]
import { CxGrid } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxGrid cols="120px 1fr 120px" xGap={8}>
      <div>Sidebar</div>
      <div>Main Content</div>
      <div>Aside</div>
    </CxGrid>
  );
}
```

:::

## 行内栅格

::: code-group

```vue [Vue 3]
<template>
  <CxGrid :cols="2" :x-gap="12" inline>
    <span>A</span>
    <span>B</span>
  </CxGrid>
</template>

<script setup lang="ts">
import { CxGrid } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxGrid :cols="2" :x-gap="12" inline>
    <span>A</span>
    <span>B</span>
  </CxGrid>
</template>

<script>
import { CxGrid } from '@chronixjs/ui-vue2';
export default { components: { CxGrid } };
</script>
```

```tsx [React]
import { CxGrid } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxGrid cols={2} xGap={12} inline>
      <span>A</span>
      <span>B</span>
    </CxGrid>
  );
}
```

:::

## API 参考

### 属性 (Props)

| Prop     | 类型                            | 默认值      | 描述                                               |
| -------- | ------------------------------- | ----------- | -------------------------------------------------- |
| `cols`   | `number \| string \| undefined` | `undefined` | 列轨道：数字 → `repeat(N, 1fr)`，字符串 → 原样使用 |
| `xGap`   | `number \| undefined`           | `undefined` | 列间距（像素）                                     |
| `yGap`   | `number \| undefined`           | `undefined` | 行间距（像素）                                     |
| `inline` | `boolean`                       | `false`     | 使用 `inline-grid` 代替 `grid`                     |

### 插槽 (Slots)

| Slot      | 描述           |
| --------- | -------------- |
| `default` | 栅格单元格内容 |
