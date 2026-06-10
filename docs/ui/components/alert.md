# Alert 警告

展示带有语义类型（info、success、warning、error）的重要消息。

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
  <CxAlert>Here is an info message.</CxAlert>
</template>

<script setup lang="ts">
import { CxAlert } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxAlert>Here is an info message.</CxAlert>
</template>

<script>
import { CxAlert } from '@chronixjs/ui-vue2';
export default { components: { CxAlert } };
</script>
```

```tsx [React]
import { CxAlert } from '@chronixjs/ui-react';

export function App() {
  return <CxAlert>Here is an info message.</CxAlert>;
}
```

:::

## 警告类型

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; flex-direction: column; gap: 8px;">
    <CxAlert>Default message</CxAlert>
    <CxAlert type="info">Info message</CxAlert>
    <CxAlert type="success">Success message</CxAlert>
    <CxAlert type="warning">Warning message</CxAlert>
    <CxAlert type="error">Error message</CxAlert>
  </div>
</template>

<script setup lang="ts">
import { CxAlert } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; flex-direction: column; gap: 8px;">
    <CxAlert>Default message</CxAlert>
    <CxAlert type="info">Info message</CxAlert>
    <CxAlert type="success">Success message</CxAlert>
    <CxAlert type="warning">Warning message</CxAlert>
    <CxAlert type="error">Error message</CxAlert>
  </div>
</template>

<script>
import { CxAlert } from '@chronixjs/ui-vue2';
export default { components: { CxAlert } };
</script>
```

```tsx [React]
import { CxAlert } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <CxAlert>Default message</CxAlert>
      <CxAlert type="info">Info message</CxAlert>
      <CxAlert type="success">Success message</CxAlert>
      <CxAlert type="warning">Warning message</CxAlert>
      <CxAlert type="error">Error message</CxAlert>
    </div>
  );
}
```

:::

## 带标题

::: code-group

```vue [Vue 3]
<template>
  <CxAlert type="success" title="Success"> Your operation was successful. </CxAlert>
</template>

<script setup lang="ts">
import { CxAlert } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxAlert type="success" title="Success"> Your operation was successful. </CxAlert>
</template>

<script>
import { CxAlert } from '@chronixjs/ui-vue2';
export default { components: { CxAlert } };
</script>
```

```tsx [React]
import { CxAlert } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxAlert type="success" title="Success">
      Your operation was successful.
    </CxAlert>
  );
}
```

:::

## 可关闭

::: code-group

```vue [Vue 3]
<template>
  <CxAlert type="warning" closable> This alert can be closed by the user. </CxAlert>
</template>

<script setup lang="ts">
import { CxAlert } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxAlert type="warning" closable> This alert can be closed by the user. </CxAlert>
</template>

<script>
import { CxAlert } from '@chronixjs/ui-vue2';
export default { components: { CxAlert } };
</script>
```

```tsx [React]
import { CxAlert } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxAlert type="warning" closable>
      This alert can be closed by the user.
    </CxAlert>
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性       | 类型                                                       | 默认值      | 说明           |
| ---------- | ---------------------------------------------------------- | ----------- | -------------- |
| `type`     | `'default' \| 'info' \| 'success' \| 'warning' \| 'error'` | `'default'` | 警告的语义类型 |
| `title`    | `string`                                                   | `undefined` | 可选标题文本   |
| `closable` | `boolean`                                                  | `false`     | 显示关闭按钮   |
| `bordered` | `boolean`                                                  | `true`      | 显示边框       |

### 事件 (Events)

| 事件    | 载荷         | 说明               |
| ------- | ------------ | ------------------ |
| `close` | `MouseEvent` | 点击关闭按钮时触发 |

### 插槽 (Slots)

| 插槽      | 说明         |
| --------- | ------------ |
| `default` | 警告正文内容 |
