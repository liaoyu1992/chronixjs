<script setup>
import CardBasic from './demos/card/CardBasic.vue';
import cardBasicCode from './demos/card/CardBasic.vue?raw';
import cardBasicVue2 from './demos/card/CardBasic.vue2?raw';
import cardBasicReact from './demos/card/CardBasic.react?raw';
</script>

# Card 卡片

灵活的容器组件，支持可选的头部、主体和底部区域。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## 基础用法

<DemoBox title="基础用法" description="通过 title 设置卡片标题，footer 插槽设置底部内容。" :code="cardBasicCode" :code-vue2="cardBasicVue2" :code-react="cardBasicReact">
  <CardBasic />
</DemoBox>

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
