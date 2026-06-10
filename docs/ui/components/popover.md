# Popover 气泡卡片

用于富内容的弹出面板，通过悬停或点击触发。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## 基础用法

使用 `CxPopover` 包裹任意触发元素。使用 `content` 插槽（Vue）或 `content` 属性（React）提供气泡卡片内容。

::: code-group

```vue [Vue 3]
<template>
  <CxPopover>
    <template #default>
      <CxButton>Hover me</CxButton>
    </template>
    <template #content>
      <p>This is the popover content.</p>
    </template>
  </CxPopover>
</template>

<script setup lang="ts">
import { CxPopover, CxButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxPopover>
    <template slot="default">
      <CxButton>Hover me</CxButton>
    </template>
    <template slot="content">
      <p>This is the popover content.</p>
    </template>
  </CxPopover>
</template>

<script>
import { CxPopover, CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxPopover, CxButton },
};
</script>
```

```tsx [React]
import { CxPopover, CxButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxPopover content={<p>This is the popover content.</p>}>
      <CxButton>Hover me</CxButton>
    </CxPopover>
  );
}
```

:::

## 触发模式

使用 `trigger` 属性控制气泡卡片的打开方式。默认为 `hover`。

### 点击触发

::: code-group

```vue [Vue 3]
<template>
  <CxPopover trigger="click">
    <template #default>
      <CxButton>Click me</CxButton>
    </template>
    <template #content>
      <p>This popover opens on click.</p>
    </template>
  </CxPopover>
</template>

<script setup lang="ts">
import { CxPopover, CxButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxPopover trigger="click">
    <template slot="default">
      <CxButton>Click me</CxButton>
    </template>
    <template slot="content">
      <p>This popover opens on click.</p>
    </template>
  </CxPopover>
</template>

<script>
import { CxPopover, CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxPopover, CxButton },
};
</script>
```

```tsx [React]
import { CxPopover, CxButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxPopover trigger="click" content={<p>This popover opens on click.</p>}>
      <CxButton>Click me</CxButton>
    </CxPopover>
  );
}
```

:::

### 焦点触发

::: code-group

```vue [Vue 3]
<template>
  <CxPopover trigger="focus">
    <template #default>
      <CxButton>Focus me</CxButton>
    </template>
    <template #content>
      <p>This popover opens on focus.</p>
    </template>
  </CxPopover>
</template>

<script setup lang="ts">
import { CxPopover, CxButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxPopover trigger="focus">
    <template slot="default">
      <CxButton>Focus me</CxButton>
    </template>
    <template slot="content">
      <p>This popover opens on focus.</p>
    </template>
  </CxPopover>
</template>

<script>
import { CxPopover, CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxPopover, CxButton },
};
</script>
```

```tsx [React]
import { CxPopover, CxButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxPopover trigger="focus" content={<p>This popover opens on focus.</p>}>
      <CxButton>Focus me</CxButton>
    </CxPopover>
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
  <CxPopover placement="right">
    <template #default>
      <CxButton>Right Placement</CxButton>
    </template>
    <template #content>
      <p>Popover on the right side.</p>
    </template>
  </CxPopover>
</template>

<script setup lang="ts">
import { CxPopover, CxButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxPopover placement="right">
    <template slot="default">
      <CxButton>Right Placement</CxButton>
    </template>
    <template slot="content">
      <p>Popover on the right side.</p>
    </template>
  </CxPopover>
</template>

<script>
import { CxPopover, CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxPopover, CxButton },
};
</script>
```

```tsx [React]
import { CxPopover, CxButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxPopover placement="right" content={<p>Popover on the right side.</p>}>
      <CxButton>Right Placement</CxButton>
    </CxPopover>
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
