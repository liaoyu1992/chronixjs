# Card

A flexible container with optional header, body, and footer areas.

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
  <CxCard>Card content</CxCard>
</template>

<script setup lang="ts">
import { CxCard } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxCard>Card content</CxCard>
</template>

<script>
import { CxCard } from '@chronixjs/ui-vue2';
export default { components: { CxCard } };
</script>
```

```tsx [React]
import { CxCard } from '@chronixjs/ui-react';

export function App() {
  return <CxCard>Card content</CxCard>;
}
```

:::

## With Title and Footer

::: code-group

```vue [Vue 3]
<template>
  <CxCard title="Card Title">
    Content goes here.
    <template #footer>Footer content</template>
  </CxCard>
</template>

<script setup lang="ts">
import { CxCard } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxCard title="Card Title">
    Content goes here.
    <template slot="footer">Footer content</template>
  </CxCard>
</template>

<script>
import { CxCard } from '@chronixjs/ui-vue2';
export default { components: { CxCard } };
</script>
```

```tsx [React]
import { CxCard } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxCard title="Card Title" footer={<span>Footer content</span>}>
      Content goes here.
    </CxCard>
  );
}
```

:::

## Sizes

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; flex-direction: column; gap: 8px;">
    <CxCard size="small">Small card</CxCard>
    <CxCard size="medium">Medium card</CxCard>
    <CxCard size="large">Large card</CxCard>
  </div>
</template>

<script setup lang="ts">
import { CxCard } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; flex-direction: column; gap: 8px;">
    <CxCard size="small">Small card</CxCard>
    <CxCard size="medium">Medium card</CxCard>
    <CxCard size="large">Large card</CxCard>
  </div>
</template>

<script>
import { CxCard } from '@chronixjs/ui-vue2';
export default { components: { CxCard } };
</script>
```

```tsx [React]
import { CxCard } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <CxCard size="small">Small card</CxCard>
      <CxCard size="medium">Medium card</CxCard>
      <CxCard size="large">Large card</CxCard>
    </div>
  );
}
```

:::

## Hoverable

::: code-group

```vue [Vue 3]
<template>
  <CxCard hoverable>Hover over me</CxCard>
</template>

<script setup lang="ts">
import { CxCard } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxCard hoverable>Hover over me</CxCard>
</template>

<script>
import { CxCard } from '@chronixjs/ui-vue2';
export default { components: { CxCard } };
</script>
```

```tsx [React]
import { CxCard } from '@chronixjs/ui-react';

export function App() {
  return <CxCard hoverable>Hover over me</CxCard>;
}
```

:::

## API Reference

### Props

| Prop        | Type                             | Default     | Description          |
| ----------- | -------------------------------- | ----------- | -------------------- |
| `size`      | `'small' \| 'medium' \| 'large'` | `'medium'`  | Card size            |
| `title`     | `string`                         | `undefined` | Card title           |
| `bordered`  | `boolean`                        | `true`      | Show border          |
| `hoverable` | `boolean`                        | `false`     | Show shadow on hover |
| `embedded`  | `boolean`                        | `false`     | Flat embedded style  |

### Slots

| Slot      | Description       |
| --------- | ----------------- |
| `default` | Card body content |
| `footer`  | Card footer area  |
