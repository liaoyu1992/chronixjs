<script setup>
import PopoverBasic from './demos/popover/PopoverBasic.vue';
import popoverBasicCode from './demos/popover/PopoverBasic.vue?raw';
import popoverBasicVue2 from './demos/popover/PopoverBasic.vue2?raw';
import popoverBasicReact from './demos/popover/PopoverBasic.react?raw';
</script>

# Popover 气泡卡片

用于富内容的弹出面板，通过悬停或点击触发。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="点击触发气泡卡片，使用 content 插槽提供内容。" :code="popoverBasicCode" :code-vue2="popoverBasicVue2" :code-react="popoverBasicReact">
  <PopoverBasic />
</DemoBox>

## 触发模式

使用 `trigger` 属性控制气泡卡片的打开方式。默认为 `hover`。

### 点击触发

::: code-group

```vue [Vue 3]
<template>
  <ChronixPopover trigger="click">
    <template #default>
      <ChronixButton>Click me</ChronixButton>
    </template>
    <template #content>
      <p>This popover opens on click.</p>
    </template>
  </ChronixPopover>
</template>

<script setup lang="ts">
import { ChronixPopover, ChronixButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <ChronixPopover trigger="click">
    <template slot="default">
      <ChronixButton>Click me</ChronixButton>
    </template>
    <template slot="content">
      <p>This popover opens on click.</p>
    </template>
  </ChronixPopover>
</template>

<script>
import { ChronixPopover, ChronixButton } from '@chronixjs/ui-vue2';

export default {
  components: { ChronixPopover, ChronixButton },
};
</script>
```

```tsx [React]
import { ChronixPopover, ChronixButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <ChronixPopover trigger="click" content={<p>This popover opens on click.</p>}>
      <ChronixButton>Click me</ChronixButton>
    </ChronixPopover>
  );
}
```

:::

### 焦点触发

::: code-group

```vue [Vue 3]
<template>
  <ChronixPopover trigger="focus">
    <template #default>
      <ChronixButton>Focus me</ChronixButton>
    </template>
    <template #content>
      <p>This popover opens on focus.</p>
    </template>
  </ChronixPopover>
</template>

<script setup lang="ts">
import { ChronixPopover, ChronixButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <ChronixPopover trigger="focus">
    <template slot="default">
      <ChronixButton>Focus me</ChronixButton>
    </template>
    <template slot="content">
      <p>This popover opens on focus.</p>
    </template>
  </ChronixPopover>
</template>

<script>
import { ChronixPopover, ChronixButton } from '@chronixjs/ui-vue2';

export default {
  components: { ChronixPopover, ChronixButton },
};
</script>
```

```tsx [React]
import { ChronixPopover, ChronixButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <ChronixPopover trigger="focus" content={<p>This popover opens on focus.</p>}>
      <ChronixButton>Focus me</ChronixButton>
    </ChronixPopover>
  );
}
```

:::

## 弹出位置

气泡卡片支持 12 个弹出位置。默认为 `bottom`。

可用位置：`top`、`top-start`、`top-end`、`bottom`、`bottom-start`、`bottom-end`、`left`、`left-start`、`left-end`、`right`、`right-start`、`right-end`。

::: code-group

```vue [Vue 3]
<template>
  <ChronixPopover placement="right">
    <template #default>
      <ChronixButton>Right Placement</ChronixButton>
    </template>
    <template #content>
      <p>Popover on the right side.</p>
    </template>
  </ChronixPopover>
</template>

<script setup lang="ts">
import { ChronixPopover, ChronixButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <ChronixPopover placement="right">
    <template slot="default">
      <ChronixButton>Right Placement</ChronixButton>
    </template>
    <template slot="content">
      <p>Popover on the right side.</p>
    </template>
  </ChronixPopover>
</template>

<script>
import { ChronixPopover, ChronixButton } from '@chronixjs/ui-vue2';

export default {
  components: { ChronixPopover, ChronixButton },
};
</script>
```

```tsx [React]
import { ChronixPopover, ChronixButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <ChronixPopover placement="right" content={<p>Popover on the right side.</p>}>
      <ChronixButton>Right Placement</ChronixButton>
    </ChronixPopover>
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性         | 类型                                        | 默认值      | 说明           |
| ------------ | ------------------------------------------- | ----------- | -------------- |
| `show`       | `boolean`                                   | `undefined` | 受控的显示状态 |
| `trigger`    | `'hover' \| 'click' \| 'focus' \| 'manual'` | `'hover'`   | 触发模式       |
| `placement`  | `PopupPlacement`                            | `'bottom'`  | 弹出位置       |
| `offset`     | `number`                                    | `4`         | 间距（px）     |
| `flip`       | `boolean`                                   | `true`      | 自动翻转位置   |
| `widthMatch` | `boolean`                                   | `false`     | 匹配锚点宽度   |
| `disabled`   | `boolean`                                   | `false`     | 禁用气泡卡片   |

### 事件 (Events)

| 事件          | 载荷      | 说明         |
| ------------- | --------- | ------------ |
| `update:show` | `boolean` | 显示状态变化 |

### 插槽 (Slots)

| 插槽      | 说明         |
| --------- | ------------ |
| `default` | 触发元素     |
| `content` | 气泡卡片内容 |
