# Button

A versatile button component with multiple types, sizes, and states.

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

## Button Types

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

## Sizes

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

## States

### Disabled

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

### Loading

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

## API Reference

### Props

| Prop       | Type                                                                     | Default     | Description           |
| ---------- | ------------------------------------------------------------------------ | ----------- | --------------------- |
| `type`     | `'default' \| 'primary' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'default'` | Button style type     |
| `size`     | `'small' \| 'medium' \| 'large'`                                         | `'medium'`  | Button size           |
| `disabled` | `boolean`                                                                | `false`     | Disable the button    |
| `loading`  | `boolean`                                                                | `false`     | Show loading spinner  |
| `block`    | `boolean`                                                                | `false`     | Full-width button     |
| `plain`    | `boolean`                                                                | `false`     | Outlined style        |
| `round`    | `boolean`                                                                | `false`     | Fully rounded corners |

### Events

| Event   | Payload | Description        |
| ------- | ------- | ------------------ |
| `click` | `Event` | Fired when clicked |
