# Avatar 头像

用于展示用户头像图片、首字母缩写或回退内容的头像组件。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## 基础用法

### 图片头像

::: code-group

```vue [Vue 3]
<template>
  <CxAvatar src="/photo.jpg" alt="User avatar" />
</template>

<script setup lang="ts">
import { CxAvatar } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxAvatar src="/photo.jpg" alt="User avatar" />
</template>

<script>
import { CxAvatar } from '@chronixjs/ui-vue2';
export default { components: { CxAvatar } };
</script>
```

```tsx [React]
import { CxAvatar } from '@chronixjs/ui-react';

export function App() {
  return <CxAvatar src="/photo.jpg" alt="User avatar" />;
}
```

:::

### 文字头像

当未提供 `src` 或图片加载失败时，头像会显示 `text` 属性作为首字母缩写：

::: code-group

```vue [Vue 3]
<template>
  <CxAvatar text="JD" />
</template>

<script setup lang="ts">
import { CxAvatar } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxAvatar text="JD" />
</template>

<script>
import { CxAvatar } from '@chronixjs/ui-vue2';
export default { components: { CxAvatar } };
</script>
```

```tsx [React]
import { CxAvatar } from '@chronixjs/ui-react';

export function App() {
  return <CxAvatar text="JD" />;
}
```

:::

### 回退插槽

当 `src` 和 `text` 均未提供时，将渲染默认插槽内容：

::: code-group

```vue [Vue 3]
<template>
  <CxAvatar>
    <span>👤</span>
  </CxAvatar>
</template>

<script setup lang="ts">
import { CxAvatar } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxAvatar>
    <span>👤</span>
  </CxAvatar>
</template>

<script>
import { CxAvatar } from '@chronixjs/ui-vue2';
export default { components: { CxAvatar } };
</script>
```

```tsx [React]
import { CxAvatar } from '@chronixjs/ui-react';

export function App() {
  return <CxAvatar>👤</CxAvatar>;
}
```

:::

## 尺寸

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; gap: 12px; align-items: center;">
    <CxAvatar text="S" :size="32" />
    <CxAvatar text="M" :size="40" />
    <CxAvatar text="L" :size="56" />
  </div>
</template>

<script setup lang="ts">
import { CxAvatar } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; gap: 12px; align-items: center;">
    <CxAvatar text="S" :size="32" />
    <CxAvatar text="M" :size="40" />
    <CxAvatar text="L" :size="56" />
  </div>
</template>

<script>
import { CxAvatar } from '@chronixjs/ui-vue2';
export default { components: { CxAvatar } };
</script>
```

```tsx [React]
import { CxAvatar } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <CxAvatar text="S" size={32} />
      <CxAvatar text="M" size={40} />
      <CxAvatar text="L" size={56} />
    </div>
  );
}
```

:::

## 形状

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; gap: 12px;">
    <CxAvatar text="C" shape="circle" />
    <CxAvatar text="R" shape="round" />
    <CxAvatar text="S" shape="square" />
  </div>
</template>

<script setup lang="ts">
import { CxAvatar } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; gap: 12px;">
    <CxAvatar text="C" shape="circle" />
    <CxAvatar text="R" shape="round" />
    <CxAvatar text="S" shape="square" />
  </div>
</template>

<script>
import { CxAvatar } from '@chronixjs/ui-vue2';
export default { components: { CxAvatar } };
</script>
```

```tsx [React]
import { CxAvatar } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <CxAvatar text="C" shape="circle" />
      <CxAvatar text="R" shape="round" />
      <CxAvatar text="S" shape="square" />
    </div>
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性    | 类型                              | 默认值      | 说明                                   |
| ------- | --------------------------------- | ----------- | -------------------------------------- |
| `src`   | `string`                          | `undefined` | 图片 URL                               |
| `text`  | `string`                          | `undefined` | 回退文本（如首字母缩写），无图片时显示 |
| `size`  | `number`                          | `40`        | 头像大小（像素）                       |
| `shape` | `'circle' \| 'square' \| 'round'` | `'circle'`  | 头像形状 — 圆形、方形或圆角            |

### 插槽 (Slots)

| 插槽      | 说明                                |
| --------- | ----------------------------------- |
| `default` | 未提供 `src` 或 `text` 时的回退内容 |

### 渲染逻辑

头像的显示遵循以下优先级：

1. **图片** — 如果提供了 `src` 且图片加载成功，渲染 `<img>`
2. **文字** — 如果提供了 `text`（或图片加载失败），渲染文字字符串
3. **插槽** — 如果 `src` 和 `text` 均不可用，渲染默认插槽
