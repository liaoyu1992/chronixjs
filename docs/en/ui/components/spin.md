# Spin

Loading-state indicator with an indeterminate rotating spinner and optional description.

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
  <CxSpin size="medium" description="Loading..." />
</template>

<script setup lang="ts">
import { CxSpin } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxSpin size="medium" description="Loading..." />
</template>

<script>
import { CxSpin } from '@chronixjs/ui-vue2';
export default { components: { CxSpin } };
</script>
```

```tsx [React]
import { CxSpin } from '@chronixjs/ui-react';

export function App() {
  return <CxSpin size="medium" description="Loading..." />;
}
```

:::

## Sizes

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; gap: 24px; align-items: center;">
    <CxSpin size="small" />
    <CxSpin size="medium" />
    <CxSpin size="large" />
  </div>
</template>

<script setup lang="ts">
import { CxSpin } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; gap: 24px; align-items: center;">
    <CxSpin size="small" />
    <CxSpin size="medium" />
    <CxSpin size="large" />
  </div>
</template>

<script>
import { CxSpin } from '@chronixjs/ui-vue2';
export default { components: { CxSpin } };
</script>
```

```tsx [React]
import { CxSpin } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      <CxSpin size="small" />
      <CxSpin size="medium" />
      <CxSpin size="large" />
    </div>
  );
}
```

:::

## API Reference

### Props

| Prop          | Type                             | Default     | Description                       |
| ------------- | -------------------------------- | ----------- | --------------------------------- |
| `size`        | `'small' \| 'medium' \| 'large'` | `'medium'`  | Spinner size                      |
| `show`        | `boolean`                        | `true`      | Toggle visibility without unmount |
| `description` | `string \| undefined`            | `undefined` | Text below the spinner            |
