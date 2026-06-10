# Tag 标签

标签用于标记、分类和小型行内标记。支持语义颜色、尺寸、可关闭和胶囊形圆角。

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
  <CxTag>Default</CxTag>
  <CxTag type="primary">Primary</CxTag>
  <CxTag type="success">Success</CxTag>
</template>

<script setup lang="ts">
import { CxTag } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div>
    <CxTag>Default</CxTag>
    <CxTag type="primary">Primary</CxTag>
    <CxTag type="success">Success</CxTag>
  </div>
</template>

<script>
import { CxTag } from '@chronixjs/ui-vue2';
export default { components: { CxTag } };
</script>
```

```tsx [React]
import { CxTag } from '@chronixjs/ui-react';

export function App() {
  return (
    <>
      <CxTag>Default</CxTag>
      <CxTag type="primary">Primary</CxTag>
      <CxTag type="success">Success</CxTag>
    </>
  );
}
```

:::

## 标签类型

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; gap: 8px;">
    <CxTag type="default">Default</CxTag>
    <CxTag type="primary">Primary</CxTag>
    <CxTag type="info">Info</CxTag>
    <CxTag type="success">Success</CxTag>
    <CxTag type="warning">Warning</CxTag>
    <CxTag type="error">Error</CxTag>
  </div>
</template>

<script setup lang="ts">
import { CxTag } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; gap: 8px;">
    <CxTag type="default">Default</CxTag>
    <CxTag type="primary">Primary</CxTag>
    <CxTag type="info">Info</CxTag>
    <CxTag type="success">Success</CxTag>
    <CxTag type="warning">Warning</CxTag>
    <CxTag type="error">Error</CxTag>
  </div>
</template>

<script>
import { CxTag } from '@chronixjs/ui-vue2';
export default { components: { CxTag } };
</script>
```

```tsx [React]
import { CxTag } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <CxTag type="default">Default</CxTag>
      <CxTag type="primary">Primary</CxTag>
      <CxTag type="info">Info</CxTag>
      <CxTag type="success">Success</CxTag>
      <CxTag type="warning">Warning</CxTag>
      <CxTag type="error">Error</CxTag>
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
    <CxTag size="small">Small</CxTag>
    <CxTag size="medium">Medium</CxTag>
    <CxTag size="large">Large</CxTag>
  </div>
</template>

<script setup lang="ts">
import { CxTag } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; gap: 8px; align-items: center;">
    <CxTag size="small">Small</CxTag>
    <CxTag size="medium">Medium</CxTag>
    <CxTag size="large">Large</CxTag>
  </div>
</template>

<script>
import { CxTag } from '@chronixjs/ui-vue2';
export default { components: { CxTag } };
</script>
```

```tsx [React]
import { CxTag } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <CxTag size="small">Small</CxTag>
      <CxTag size="medium">Medium</CxTag>
      <CxTag size="large">Large</CxTag>
    </div>
  );
}
```

:::

## 可关闭

标签可以显示关闭按钮。监听 `close` 事件来移除标签：

::: code-group

```vue [Vue 3]
<template>
  <CxTag type="primary" closable @close="onClose">Removable</CxTag>
</template>

<script setup lang="ts">
import { CxTag } from '@chronixjs/ui-vue3';

function onClose(event: MouseEvent) {
  console.log('Tag closed');
}
</script>
```

```vue [Vue 2]
<template>
  <CxTag type="primary" closable @close="onClose">Removable</CxTag>
</template>

<script>
import { CxTag } from '@chronixjs/ui-vue2';
export default {
  components: { CxTag },
  methods: {
    onClose(event) {
      console.log('Tag closed');
    },
  },
};
</script>
```

```tsx [React]
import { CxTag } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxTag type="primary" closable onClose={(e) => console.log('Tag closed')}>
      Removable
    </CxTag>
  );
}
```

:::

## 胶囊形

::: code-group

```vue [Vue 3]
<template>
  <CxTag type="info" round>Pill Tag</CxTag>
</template>

<script setup lang="ts">
import { CxTag } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxTag type="info" round>Pill Tag</CxTag>
</template>

<script>
import { CxTag } from '@chronixjs/ui-vue2';
export default { components: { CxTag } };
</script>
```

```tsx [React]
import { CxTag } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxTag type="info" round>
      Pill Tag
    </CxTag>
  );
}
```

:::

## 禁用状态

::: code-group

```vue [Vue 3]
<template>
  <CxTag type="primary" disabled>Disabled Tag</CxTag>
</template>

<script setup lang="ts">
import { CxTag } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxTag type="primary" disabled>Disabled Tag</CxTag>
</template>

<script>
import { CxTag } from '@chronixjs/ui-vue2';
export default { components: { CxTag } };
</script>
```

```tsx [React]
import { CxTag } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxTag type="primary" disabled>
      Disabled Tag
    </CxTag>
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性       | 类型                                                                    | 默认值      | 说明            |
| ---------- | ----------------------------------------------------------------------- | ----------- | --------------- |
| `type`     | `'default' \| 'primary' \| 'info' \| 'success' \| 'warning' \| 'error'` | `'default'` | 标签样式类型    |
| `size`     | `'small' \| 'medium' \| 'large'`                                        | `'medium'`  | 标签尺寸        |
| `bordered` | `boolean`                                                               | `true`      | 显示边框        |
| `round`    | `boolean`                                                               | `false`     | 胶囊形圆角      |
| `closable` | `boolean`                                                               | `false`     | 显示关闭按钮    |
| `disabled` | `boolean`                                                               | `false`     | 不可交互 + 变淡 |

### 事件 (Events)

| 事件    | 载荷         | 说明         |
| ------- | ------------ | ------------ |
| `close` | `MouseEvent` | 点击关闭按钮 |
