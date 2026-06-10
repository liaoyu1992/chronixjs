# Tooltip 文字提示

鼠标悬停时显示的纯文本弹出提示。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## 基础用法

使用 `CxTooltip` 包裹任意元素，并通过 `content` 属性设置提示文本。默认在鼠标悬停时显示。

::: code-group

```vue [Vue 3]
<template>
  <CxTooltip content="This is a tooltip">
    <CxButton>Hover me</CxButton>
  </CxTooltip>
</template>

<script setup lang="ts">
import { CxTooltip, CxButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxTooltip content="This is a tooltip">
    <CxButton>Hover me</CxButton>
  </CxTooltip>
</template>

<script>
import { CxTooltip, CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxTooltip, CxButton },
};
</script>
```

```tsx [React]
import { CxTooltip, CxButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxTooltip content="This is a tooltip">
      <CxButton>Hover me</CxButton>
    </CxTooltip>
  );
}
```

:::

## 弹出位置

提示框支持 12 个弹出位置。默认为 `top`（顶部）。

可用位置：`top`、`top-start`、`top-end`、`bottom`、`bottom-start`、`bottom-end`、`left`、`left-start`、`left-end`、`right`、`right-start`、`right-end`。

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; gap: 8px;">
    <CxTooltip content="Top tooltip" placement="top">
      <CxButton>Top</CxButton>
    </CxTooltip>
    <CxTooltip content="Bottom tooltip" placement="bottom">
      <CxButton>Bottom</CxButton>
    </CxTooltip>
    <CxTooltip content="Left tooltip" placement="left">
      <CxButton>Left</CxButton>
    </CxTooltip>
    <CxTooltip content="Right tooltip" placement="right">
      <CxButton>Right</CxButton>
    </CxTooltip>
  </div>
</template>

<script setup lang="ts">
import { CxTooltip, CxButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; gap: 8px;">
    <CxTooltip content="Top tooltip" placement="top">
      <CxButton>Top</CxButton>
    </CxTooltip>
    <CxTooltip content="Bottom tooltip" placement="bottom">
      <CxButton>Bottom</CxButton>
    </CxTooltip>
    <CxTooltip content="Left tooltip" placement="left">
      <CxButton>Left</CxButton>
    </CxTooltip>
    <CxTooltip content="Right tooltip" placement="right">
      <CxButton>Right</CxButton>
    </CxTooltip>
  </div>
</template>

<script>
import { CxTooltip, CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxTooltip, CxButton },
};
</script>
```

```tsx [React]
import { CxTooltip, CxButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <CxTooltip content="Top tooltip" placement="top">
        <CxButton>Top</CxButton>
      </CxTooltip>
      <CxTooltip content="Bottom tooltip" placement="bottom">
        <CxButton>Bottom</CxButton>
      </CxTooltip>
      <CxTooltip content="Left tooltip" placement="left">
        <CxButton>Left</CxButton>
      </CxTooltip>
      <CxTooltip content="Right tooltip" placement="right">
        <CxButton>Right</CxButton>
      </CxTooltip>
    </div>
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性        | 类型                                        | 默认值      | 说明             |
| ----------- | ------------------------------------------- | ----------- | ---------------- |
| `content`   | `string`                                    | `''`        | 提示文本         |
| `show`      | `boolean`                                   | `undefined` | 受控的可见性     |
| `trigger`   | `'hover' \| 'click' \| 'focus' \| 'manual'` | `'hover'`   | 触发方式         |
| `placement` | `PopupPlacement`                            | `'top'`     | 弹出位置         |
| `offset`    | `number`                                    | `6`         | 间距（像素）     |
| `flip`      | `boolean`                                   | `true`      | 自动翻转弹出位置 |
| `disabled`  | `boolean`                                   | `false`     | 禁用提示         |

### 事件 (Events)

| 事件          | 载荷      | 说明             |
| ------------- | --------- | ---------------- |
| `update:show` | `boolean` | 可见性变化时触发 |

### 插槽 (Slots)

| 插槽      | 说明     |
| --------- | -------- |
| `default` | 触发元素 |
