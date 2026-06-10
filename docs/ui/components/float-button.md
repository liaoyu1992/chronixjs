# Float Button 浮动按钮

固定在视口角落的浮动操作按钮，支持可选提示信息。

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
  <CxFloatButton icon="plus" tooltip="Add new" />
</template>

<script setup lang="ts">
import { CxFloatButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxFloatButton icon="plus" tooltip="Add new" />
</template>

<script>
import { CxFloatButton } from '@chronixjs/ui-vue2';
export default { components: { CxFloatButton } };
</script>
```

```tsx [React]
import { CxFloatButton } from '@chronixjs/ui-react';

export function App() {
  return <CxFloatButton icon="plus" tooltip="Add new" />;
}
```

:::

## 方形带描述

::: code-group

```vue [Vue 3]
<template>
  <CxFloatButton shape="square" type="primary" description="Help" :right="32" :bottom="80" />
</template>

<script setup lang="ts">
import { CxFloatButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxFloatButton shape="square" type="primary" description="Help" :right="32" :bottom="80" />
</template>

<script>
import { CxFloatButton } from '@chronixjs/ui-vue2';
export default { components: { CxFloatButton } };
</script>
```

```tsx [React]
import { CxFloatButton } from '@chronixjs/ui-react';

export function App() {
  return <CxFloatButton shape="square" type="primary" description="Help" right={32} bottom={80} />;
}
```

:::

## API 参考

### 属性 (Props)

| Prop          | 类型                     | 默认值      | 描述                    |
| ------------- | ------------------------ | ----------- | ----------------------- |
| `shape`       | `'circle' \| 'square'`   | `'circle'`  | 按钮形状                |
| `type`        | `'default' \| 'primary'` | `'default'` | 按钮样式类型            |
| `right`       | `number`                 | `24`        | 距视口右边缘的距离 (px) |
| `bottom`      | `number`                 | `24`        | 距视口底边缘的距离 (px) |
| `top`         | `number \| undefined`    | `undefined` | 设置后覆盖 bottom       |
| `left`        | `number \| undefined`    | `undefined` | 设置后覆盖 right        |
| `icon`        | `string \| undefined`    | `undefined` | 图标注册表名称          |
| `tooltip`     | `string \| undefined`    | `undefined` | 悬停提示文本            |
| `description` | `string \| undefined`    | `undefined` | 图标下方/旁边的简短文本 |

### 事件 (Events)

| Event   | Payload      | 描述             |
| ------- | ------------ | ---------------- |
| `click` | `MouseEvent` | 按钮被点击时触发 |

### 插槽 (Slots)

| Slot      | 描述           |
| --------- | -------------- |
| `default` | 自定义图标内容 |
