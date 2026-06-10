# Button Group

Flex container that groups `CxButton` children with merged borders.

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
  <CxButtonGroup>
    <CxButton>Left</CxButton>
    <CxButton>Middle</CxButton>
    <CxButton>Right</CxButton>
  </CxButtonGroup>
</template>

<script setup lang="ts">
import { CxButton, CxButtonGroup } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxButtonGroup>
    <CxButton>Left</CxButton>
    <CxButton>Middle</CxButton>
    <CxButton>Right</CxButton>
  </CxButtonGroup>
</template>

<script>
import { CxButton, CxButtonGroup } from '@chronixjs/ui-vue2';
export default { components: { CxButton, CxButtonGroup } };
</script>
```

```tsx [React]
import { CxButton, CxButtonGroup } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxButtonGroup>
      <CxButton>Left</CxButton>
      <CxButton>Middle</CxButton>
      <CxButton>Right</CxButton>
    </CxButtonGroup>
  );
}
```

:::

## Vertical

::: code-group

```vue [Vue 3]
<template>
  <CxButtonGroup vertical size="small">
    <CxButton type="primary">Top</CxButton>
    <CxButton type="primary">Middle</CxButton>
    <CxButton type="primary">Bottom</CxButton>
  </CxButtonGroup>
</template>

<script setup lang="ts">
import { CxButton, CxButtonGroup } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxButtonGroup vertical size="small">
    <CxButton type="primary">Top</CxButton>
    <CxButton type="primary">Middle</CxButton>
    <CxButton type="primary">Bottom</CxButton>
  </CxButtonGroup>
</template>

<script>
import { CxButton, CxButtonGroup } from '@chronixjs/ui-vue2';
export default { components: { CxButton, CxButtonGroup } };
</script>
```

```tsx [React]
import { CxButton, CxButtonGroup } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxButtonGroup vertical size="small">
      <CxButton type="primary">Top</CxButton>
      <CxButton type="primary">Middle</CxButton>
      <CxButton type="primary">Bottom</CxButton>
    </CxButtonGroup>
  );
}
```

:::

## API Reference

### Props

| Prop       | Type                                          | Default     | Description                 |
| ---------- | --------------------------------------------- | ----------- | --------------------------- |
| `vertical` | `boolean`                                     | `false`     | Lay out children vertically |
| `size`     | `'small' \| 'medium' \| 'large' \| undefined` | `undefined` | Override child button sizes |

### Slots

| Slot      | Description     |
| --------- | --------------- |
| `default` | Button children |
