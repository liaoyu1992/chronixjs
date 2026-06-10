# Card 卡片

灵活的容器组件，支持可选的头部、主体和底部区域。

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
  <CxCard>Card content</CxCard>
</template>

<script setup lang="ts">
import { CxCard } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxCard>Card content</CxCard>
</template>

<script>
import { CxCard } from '@chronixjs/ui-vue2';
export default { components: { CxCard } };
</script>
```

```tsx [React]
import { CxCard } from '@chronixjs/ui-react';

export function App() {
  return <CxCard>Card content</CxCard>;
}
```

:::

## 带标题和底部

::: code-group

```vue [Vue 3]
<template>
  <CxCard title="Card Title">
    Content goes here.
    <template #footer>Footer content</template>
  </CxCard>
</template>

<script setup lang="ts">
import { CxCard } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxCard title="Card Title">
    Content goes here.
    <template slot="footer">Footer content</template>
  </CxCard>
</template>

<script>
import { CxCard } from '@chronixjs/ui-vue2';
export default { components: { CxCard } };
</script>
```

```tsx [React]
import { CxCard } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxCard title="Card Title" footer={<span>Footer content</span>}>
      Content goes here.
    </CxCard>
  );
}
```

:::

## 尺寸

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; flex-direction: column; gap: 8px;">
    <CxCard size="small">Small card</CxCard>
    <CxCard size="medium">Medium card</CxCard>
    <CxCard size="large">Large card</CxCard>
  </div>
</template>

<script setup lang="ts">
import { CxCard } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; flex-direction: column; gap: 8px;">
    <CxCard size="small">Small card</CxCard>
    <CxCard size="medium">Medium card</CxCard>
    <CxCard size="large">Large card</CxCard>
  </div>
</template>

<script>
import { CxCard } from '@chronixjs/ui-vue2';
export default { components: { CxCard } };
</script>
```

```tsx [React]
import { CxCard } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <CxCard size="small">Small card</CxCard>
      <CxCard size="medium">Medium card</CxCard>
      <CxCard size="large">Large card</CxCard>
    </div>
  );
}
```

:::

## 悬浮效果

::: code-group

```vue [Vue 3]
<template>
  <CxCard hoverable>Hover over me</CxCard>
</template>

<script setup lang="ts">
import { CxCard } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxCard hoverable>Hover over me</CxCard>
</template>

<script>
import { CxCard } from '@chronixjs/ui-vue2';
export default { components: { CxCard } };
</script>
```

```tsx [React]
import { CxCard } from '@chronixjs/ui-react';

export function App() {
  return <CxCard hoverable>Hover over me</CxCard>;
}
```

:::

## API 参考

### 属性 (Props)

| 属性        | 类型                             | 默认值      | 说明               |
| ----------- | -------------------------------- | ----------- | ------------------ |
| `size`      | `'small' \| 'medium' \| 'large'` | `'medium'`  | 卡片尺寸           |
| `title`     | `string`                         | `undefined` | 卡片标题           |
| `bordered`  | `boolean`                        | `true`      | 显示边框           |
| `hoverable` | `boolean`                        | `false`     | 鼠标悬浮时显示阴影 |
| `embedded`  | `boolean`                        | `false`     | 扁平嵌入式样式     |

### 插槽 (Slots)

| 插槽      | 说明         |
| --------- | ------------ |
| `default` | 卡片主体内容 |
| `footer`  | 卡片底部区域 |
