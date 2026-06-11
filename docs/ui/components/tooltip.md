<script setup>
import TooltipBasic from './demos/tooltip/TooltipBasic.vue';
import tooltipBasicCode from './demos/tooltip/TooltipBasic.vue?raw';
import tooltipBasicVue2 from './demos/tooltip/TooltipBasic.vue2?raw';
import tooltipBasicReact from './demos/tooltip/TooltipBasic.react?raw';
</script>

# Tooltip 文字提示

鼠标悬停时显示的纯文本弹出提示。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="鼠标悬停时显示提示文本。" :code="tooltipBasicCode" :code-vue2="tooltipBasicVue2" :code-react="tooltipBasicReact">
  <TooltipBasic />
</DemoBox>

## 弹出位置

提示框支持 12 个弹出位置。默认为 `top`（顶部）。

可用位置：`top`、`top-start`、`top-end`、`bottom`、`bottom-start`、`bottom-end`、`left`、`left-start`、`left-end`、`right`、`right-start`、`right-end`。

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; gap: 8px;">
    <ChronixTooltip content="Top tooltip" placement="top">
      <ChronixButton>Top</ChronixButton>
    </ChronixTooltip>
    <ChronixTooltip content="Bottom tooltip" placement="bottom">
      <ChronixButton>Bottom</ChronixButton>
    </ChronixTooltip>
    <ChronixTooltip content="Left tooltip" placement="left">
      <ChronixButton>Left</ChronixButton>
    </ChronixTooltip>
    <ChronixTooltip content="Right tooltip" placement="right">
      <ChronixButton>Right</ChronixButton>
    </ChronixTooltip>
  </div>
</template>

<script setup lang="ts">
import { ChronixTooltip, ChronixButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; gap: 8px;">
    <ChronixTooltip content="Top tooltip" placement="top">
      <ChronixButton>Top</ChronixButton>
    </ChronixTooltip>
    <ChronixTooltip content="Bottom tooltip" placement="bottom">
      <ChronixButton>Bottom</ChronixButton>
    </ChronixTooltip>
    <ChronixTooltip content="Left tooltip" placement="left">
      <ChronixButton>Left</ChronixButton>
    </ChronixTooltip>
    <ChronixTooltip content="Right tooltip" placement="right">
      <ChronixButton>Right</ChronixButton>
    </ChronixTooltip>
  </div>
</template>

<script>
import { ChronixTooltip, ChronixButton } from '@chronixjs/ui-vue2';
export default {
  components: { ChronixTooltip, ChronixButton },
};
</script>
```

```tsx [React]
import { ChronixTooltip, ChronixButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <ChronixTooltip content="Top tooltip" placement="top">
        <ChronixButton>Top</ChronixButton>
      </ChronixTooltip>
      <ChronixTooltip content="Bottom tooltip" placement="bottom">
        <ChronixButton>Bottom</ChronixButton>
      </ChronixTooltip>
      <ChronixTooltip content="Left tooltip" placement="left">
        <ChronixButton>Left</ChronixButton>
      </ChronixTooltip>
      <ChronixTooltip content="Right tooltip" placement="right">
        <ChronixButton>Right</ChronixButton>
      </ChronixTooltip>
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
