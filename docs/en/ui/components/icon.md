# Icon

SVG icon component powered by a central icon registry.

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
  <CxIcon name="check" :size="20" />
</template>

<script setup lang="ts">
import { CxIcon } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxIcon name="check" :size="20" />
</template>

<script>
import { CxIcon } from '@chronixjs/ui-vue2';
export default { components: { CxIcon } };
</script>
```

```tsx [React]
import { CxIcon } from '@chronixjs/ui-react';

export function App() {
  return <CxIcon name="check" size={20} />;
}
```

:::

## Sizes

Icons can be rendered at different sizes using the `size` prop. The default size is `16`.

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; align-items: center; gap: 16px;">
    <CxIcon name="check" :size="16" />
    <span>16px (default)</span>

    <CxIcon name="check" :size="24" />
    <span>24px</span>

    <CxIcon name="check" :size="32" />
    <span>32px</span>
  </div>
</template>

<script setup lang="ts">
import { CxIcon } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; align-items: center; gap: 16px;">
    <CxIcon name="check" :size="16" />
    <span>16px (default)</span>

    <CxIcon name="check" :size="24" />
    <span>24px</span>

    <CxIcon name="check" :size="32" />
    <span>32px</span>
  </div>
</template>

<script>
import { CxIcon } from '@chronixjs/ui-vue2';
export default { components: { CxIcon } };
</script>
```

```tsx [React]
import { CxIcon } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <CxIcon name="check" size={16} />
      <span>16px (default)</span>

      <CxIcon name="check" size={24} />
      <span>24px</span>

      <CxIcon name="check" size={32} />
      <span>32px</span>
    </div>
  );
}
```

:::

## Custom Color

Use the `color` prop or CSS custom properties to change icon color.

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; gap: 12px;">
    <CxIcon name="star" :size="24" color="#f5a623" />
    <CxIcon name="star" :size="24" color="#4caf50" />
    <CxIcon name="star" :size="24" color="#e53935" />
  </div>
</template>

<script setup lang="ts">
import { CxIcon } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; gap: 12px;">
    <CxIcon name="star" :size="24" color="#f5a623" />
    <CxIcon name="star" :size="24" color="#4caf50" />
    <CxIcon name="star" :size="24" color="#e53935" />
  </div>
</template>

<script>
import { CxIcon } from '@chronixjs/ui-vue2';
export default { components: { CxIcon } };
</script>
```

```tsx [React]
import { CxIcon } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <CxIcon name="star" size={24} color="#f5a623" />
      <CxIcon name="star" size={24} color="#4caf50" />
      <CxIcon name="star" size={24} color="#e53935" />
    </div>
  );
}
```

:::

## API Reference

### Props

| Prop    | Type     | Default | Description            |
| ------- | -------- | ------- | ---------------------- |
| `name`  | `string` | `''`    | Icon registry name     |
| `size`  | `number` | `16`    | Icon size in pixels    |
| `color` | `string` | `''`    | Icon color (CSS value) |
