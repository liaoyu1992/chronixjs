# Button 按钮

功能丰富的按钮组件，支持多种类型、尺寸和状态。

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
  <CxButton type="primary">Primary Button</CxButton>
</template>

<script setup lang="ts">
import { CxButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxButton type="primary">Primary Button</CxButton>
</template>

<script>
import { CxButton } from '@chronixjs/ui-vue2';
export default { components: { CxButton } };
</script>
```

```tsx [React]
import { CxButton } from '@chronixjs/ui-react';

export function App() {
  return <CxButton type="primary">Primary Button</CxButton>;
}
```

:::

## 按钮类型

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; gap: 8px;">
    <CxButton>Default</CxButton>
    <CxButton type="primary">Primary</CxButton>
    <CxButton type="success">Success</CxButton>
    <CxButton type="warning">Warning</CxButton>
    <CxButton type="danger">Danger</CxButton>
    <CxButton type="info">Info</CxButton>
  </div>
</template>

<script setup lang="ts">
import { CxButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; gap: 8px;">
    <CxButton>Default</CxButton>
    <CxButton type="primary">Primary</CxButton>
    <CxButton type="success">Success</CxButton>
    <CxButton type="warning">Warning</CxButton>
    <CxButton type="danger">Danger</CxButton>
    <CxButton type="info">Info</CxButton>
  </div>
</template>

<script>
import { CxButton } from '@chronixjs/ui-vue2';
export default { components: { CxButton } };
</script>
```

```tsx [React]
import { CxButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <CxButton>Default</CxButton>
      <CxButton type="primary">Primary</CxButton>
      <CxButton type="success">Success</CxButton>
      <CxButton type="warning">Warning</CxButton>
      <CxButton type="danger">Danger</CxButton>
      <CxButton type="info">Info</CxButton>
    </div>
  );
}
```

:::

## 尺寸

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; gap: 8px; align-items: center;">
    <CxButton size="small">Small</CxButton>
    <CxButton size="medium">Medium</CxButton>
    <CxButton size="large">Large</CxButton>
  </div>
</template>

<script setup lang="ts">
import { CxButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; gap: 8px; align-items: center;">
    <CxButton size="small">Small</CxButton>
    <CxButton size="medium">Medium</CxButton>
    <CxButton size="large">Large</CxButton>
  </div>
</template>

<script>
import { CxButton } from '@chronixjs/ui-vue2';
export default { components: { CxButton } };
</script>
```

```tsx [React]
import { CxButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <CxButton size="small">Small</CxButton>
      <CxButton size="medium">Medium</CxButton>
      <CxButton size="large">Large</CxButton>
    </div>
  );
}
```

:::

## 状态

### 禁用状态

::: code-group

```vue [Vue 3]
<template>
  <CxButton type="primary" disabled>Disabled</CxButton>
</template>

<script setup lang="ts">
import { CxButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxButton type="primary" disabled>Disabled</CxButton>
</template>

<script>
import { CxButton } from '@chronixjs/ui-vue2';
export default { components: { CxButton } };
</script>
```

```tsx [React]
import { CxButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxButton type="primary" disabled>
      Disabled
    </CxButton>
  );
}
```

:::

### 加载中

::: code-group

```vue [Vue 3]
<template>
  <CxButton type="primary" loading>Loading...</CxButton>
</template>

<script setup lang="ts">
import { CxButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxButton type="primary" loading>Loading...</CxButton>
</template>

<script>
import { CxButton } from '@chronixjs/ui-vue2';
export default { components: { CxButton } };
</script>
```

```tsx [React]
import { CxButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxButton type="primary" loading>
      Loading...
    </CxButton>
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性       | 类型                                                                     | 默认值      | 说明           |
| ---------- | ------------------------------------------------------------------------ | ----------- | -------------- |
| `type`     | `'default' \| 'primary' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'default'` | 按钮样式类型   |
| `size`     | `'small' \| 'medium' \| 'large'`                                         | `'medium'`  | 按钮尺寸       |
| `disabled` | `boolean`                                                                | `false`     | 禁用按钮       |
| `loading`  | `boolean`                                                                | `false`     | 显示加载旋转器 |
| `block`    | `boolean`                                                                | `false`     | 撑满整行宽度   |
| `plain`    | `boolean`                                                                | `false`     | 描边样式       |
| `round`    | `boolean`                                                                | `false`     | 完全圆角       |

### 事件 (Events)

| 事件    | 载荷    | 说明       |
| ------- | ------- | ---------- |
| `click` | `Event` | 点击时触发 |
