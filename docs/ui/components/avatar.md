# Avatar

An avatar component for displaying user profile images, initials, or fallback content.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

### Image Avatar

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

### Text Avatar

When `src` is not provided or the image fails to load, the avatar displays the `text` prop as initials:

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

### Fallback Slot

When neither `src` nor `text` is provided, the default slot is rendered:

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

## Sizes

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

## Shapes

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

## API Reference

### Props

| Prop    | Type                              | Default     | Description                                       |
| ------- | --------------------------------- | ----------- | ------------------------------------------------- |
| `src`   | `string`                          | `undefined` | Image URL                                         |
| `text`  | `string`                          | `undefined` | Fallback text (e.g. initials) shown when no image |
| `size`  | `number`                          | `40`        | Avatar size in pixels                             |
| `shape` | `'circle' \| 'square' \| 'round'` | `'circle'`  | Avatar shape — circle, square, or rounded corners |

### Slots

| Slot      | Description                                          |
| --------- | ---------------------------------------------------- |
| `default` | Fallback content when no `src` or `text` is provided |

### Render Logic

The avatar follows this priority for display:

1. **Image** — if `src` is provided and the image loads successfully, renders an `<img>`
2. **Text** — if `text` is provided (or image fails), renders the text string
3. **Slot** — if neither `src` nor `text` is available, renders the default slot
