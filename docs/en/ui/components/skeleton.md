# Skeleton

A shimmering placeholder for content loading states.

## Install

::: code-group
<<< @/snippets/vue3/install-ui.md
<<< @/snippets/vue2/install-ui.md
<<< @/snippets/react/install-ui.md
:::

## Basic Usage

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

## Shapes

Three built-in shapes: `text` (default) renders a line, `rect` renders a rectangle, and `circle` renders a circle.

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

## Custom Dimensions

Set explicit `width` and `height` values. You can pass numbers (pixels) or strings (e.g. `"50%"`).

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

## Without Animation

Disable the shimmer effect by setting `animated` to `false`.

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

## API Reference

### Props

| Prop       | Type                           | Default     | Description       |
| ---------- | ------------------------------ | ----------- | ----------------- |
| `shape`    | `'text' \| 'rect' \| 'circle'` | `'text'`    | Skeleton shape    |
| `width`    | `string \| number`             | `undefined` | Custom width      |
| `height`   | `string \| number`             | `undefined` | Custom height     |
| `animated` | `boolean`                      | `true`      | Shimmer animation |
| `round`    | `boolean`                      | `false`     | Pill-shaped ends  |
