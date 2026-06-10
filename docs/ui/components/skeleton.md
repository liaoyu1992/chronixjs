# Skeleton 骨架屏

用于内容加载状态的闪烁占位符。

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
  <div style="display: flex; flex-direction: column; gap: 8px;">
    <CxSkeleton shape="text" />
    <CxSkeleton shape="text" width="80%" />
    <CxSkeleton shape="text" width="60%" />
  </div>
</template>

<script setup lang="ts">
import { CxSkeleton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; flex-direction: column; gap: 8px;">
    <CxSkeleton shape="text" />
    <CxSkeleton shape="text" width="80%" />
    <CxSkeleton shape="text" width="60%" />
  </div>
</template>

<script>
import { CxSkeleton } from '@chronixjs/ui-vue2';

export default {
  components: { CxSkeleton },
};
</script>
```

```tsx [React]
import { CxSkeleton } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <CxSkeleton shape="text" />
      <CxSkeleton shape="text" width="80%" />
      <CxSkeleton shape="text" width="60%" />
    </div>
  );
}
```

:::

## 形状

三种内置形状：`text`（默认）渲染一行文本，`rect` 渲染矩形，`circle` 渲染圆形。

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <CxSkeleton shape="text" width="60%" />
    <CxSkeleton shape="rect" :width="200" :height="120" />
    <CxSkeleton shape="circle" :width="64" :height="64" />
  </div>
</template>

<script setup lang="ts">
import { CxSkeleton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <CxSkeleton shape="text" width="60%" />
    <CxSkeleton shape="rect" :width="200" :height="120" />
    <CxSkeleton shape="circle" :width="64" :height="64" />
  </div>
</template>

<script>
import { CxSkeleton } from '@chronixjs/ui-vue2';

export default {
  components: { CxSkeleton },
};
</script>
```

```tsx [React]
import { CxSkeleton } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <CxSkeleton shape="text" width="60%" />
      <CxSkeleton shape="rect" width={200} height={120} />
      <CxSkeleton shape="circle" width={64} height={64} />
    </div>
  );
}
```

:::

## 自定义尺寸

设置显式的 `width` 和 `height` 值。可以传入数字（像素）或字符串（例如 `"50%"`）。

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <CxSkeleton shape="rect" :width="320" :height="20" />
    <CxSkeleton shape="rect" width="100%" :height="16" />
    <CxSkeleton shape="rect" :width="160" :height="160" round />
  </div>
</template>

<script setup lang="ts">
import { CxSkeleton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <CxSkeleton shape="rect" :width="320" :height="20" />
    <CxSkeleton shape="rect" width="100%" :height="16" />
    <CxSkeleton shape="rect" :width="160" :height="160" round />
  </div>
</template>

<script>
import { CxSkeleton } from '@chronixjs/ui-vue2';

export default {
  components: { CxSkeleton },
};
</script>
```

```tsx [React]
import { CxSkeleton } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <CxSkeleton shape="rect" width={320} height={20} />
      <CxSkeleton shape="rect" width="100%" height={16} />
      <CxSkeleton shape="rect" width={160} height={160} round />
    </div>
  );
}
```

:::

## 无动画

设置 `animated` 为 `false` 可禁用闪烁效果。

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; flex-direction: column; gap: 8px;">
    <CxSkeleton shape="text" width="70%" :animated="false" />
    <CxSkeleton shape="text" width="50%" :animated="false" />
    <CxSkeleton shape="rect" :width="200" :height="100" :animated="false" />
  </div>
</template>

<script setup lang="ts">
import { CxSkeleton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; flex-direction: column; gap: 8px;">
    <CxSkeleton shape="text" width="70%" :animated="false" />
    <CxSkeleton shape="text" width="50%" :animated="false" />
    <CxSkeleton shape="rect" :width="200" :height="100" :animated="false" />
  </div>
</template>

<script>
import { CxSkeleton } from '@chronixjs/ui-vue2';

export default {
  components: { CxSkeleton },
};
</script>
```

```tsx [React]
import { CxSkeleton } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <CxSkeleton shape="text" width="70%" animated={false} />
      <CxSkeleton shape="text" width="50%" animated={false} />
      <CxSkeleton shape="rect" width={200} height={100} animated={false} />
    </div>
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性       | 类型                           | 默认值      | 说明       |
| ---------- | ------------------------------ | ----------- | ---------- |
| `shape`    | `'text' \| 'rect' \| 'circle'` | `'text'`    | 骨架屏形状 |
| `width`    | `string \| number`             | `undefined` | 自定义宽度 |
| `height`   | `string \| number`             | `undefined` | 自定义高度 |
| `animated` | `boolean`                      | `true`      | 闪烁动画   |
| `round`    | `boolean`                      | `false`     | 胶囊形两端 |
