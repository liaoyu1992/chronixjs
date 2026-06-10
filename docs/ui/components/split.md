# Split 分割面板

双面板可调整大小的分割器。拖动面板间的分隔条来重新分配空间。

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
  <CxSplit default-size="50%">
    <template #first>
      <div style="padding: 16px;">Left Pane</div>
    </template>
    <template #second>
      <div style="padding: 16px;">Right Pane</div>
    </template>
  </CxSplit>
</template>

<script setup lang="ts">
import { CxSplit } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxSplit default-size="50%">
    <template slot="first">
      <div style="padding: 16px;">Left Pane</div>
    </template>
    <template slot="second">
      <div style="padding: 16px;">Right Pane</div>
    </template>
  </CxSplit>
</template>

<script>
import { CxSplit } from '@chronixjs/ui-vue2';
export default { components: { CxSplit } };
</script>
```

```tsx [React]
import { CxSplit } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxSplit
      defaultSize="50%"
      first={<div style={{ padding: 16 }}>Left Pane</div>}
      second={<div style={{ padding: 16 }}>Right Pane</div>}
    />
  );
}
```

:::

## 垂直分割

::: code-group

```vue [Vue 3]
<template>
  <CxSplit direction="vertical" default-size="200px" min-size="100" max-size="400">
    <template #first>
      <div style="padding: 16px;">Top Pane</div>
    </template>
    <template #second>
      <div style="padding: 16px;">Bottom Pane</div>
    </template>
  </CxSplit>
</template>

<script setup lang="ts">
import { CxSplit } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxSplit direction="vertical" default-size="200px" min-size="100" max-size="400">
    <template slot="first">
      <div style="padding: 16px;">Top Pane</div>
    </template>
    <template slot="second">
      <div style="padding: 16px;">Bottom Pane</div>
    </template>
  </CxSplit>
</template>

<script>
import { CxSplit } from '@chronixjs/ui-vue2';
export default { components: { CxSplit } };
</script>
```

```tsx [React]
import { CxSplit } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxSplit
      direction="vertical"
      defaultSize="200px"
      minSize={100}
      maxSize={400}
      first={<div style={{ padding: 16 }}>Top Pane</div>}
      second={<div style={{ padding: 16 }}>Bottom Pane</div>}
    />
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性          | 类型                            | 默认值         | 说明                     |
| ------------- | ------------------------------- | -------------- | ------------------------ |
| `direction`   | `'horizontal' \| 'vertical'`    | `'horizontal'` | 分割方向                 |
| `defaultSize` | `number \| string`              | `'50%'`        | 第一个面板的初始大小     |
| `size`        | `number \| string \| undefined` | `undefined`    | 受控的第一个面板大小覆盖 |
| `minSize`     | `number \| string`              | `0`            | 第一个面板最小大小       |
| `maxSize`     | `number \| string`              | `'100%'`       | 第一个面板最大大小       |
| `disabled`    | `boolean`                       | `false`        | 禁用拖拽调整大小         |

### 事件 (Events)

| 事件           | 载荷               | 说明                     |
| -------------- | ------------------ | ------------------------ |
| `update:size`  | `number \| string` | 第一个面板大小变化时触发 |
| `resize-start` | —                  | 拖拽开始时触发           |
| `resize-end`   | —                  | 拖拽结束时触发           |

### 插槽 (Slots)

| 插槽     | 说明           |
| -------- | -------------- |
| `first`  | 第一个面板内容 |
| `second` | 第二个面板内容 |
