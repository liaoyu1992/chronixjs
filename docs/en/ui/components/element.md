# Element

Generic Chronix-themed HTML element wrapper with configurable tag.

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
  <CxElement tag="section">
    <p>Content inside a themed section element.</p>
  </CxElement>
</template>

<script setup lang="ts">
import { CxElement } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxElement tag="section">
    <p>Content inside a themed section element.</p>
  </CxElement>
</template>

<script>
import { CxElement } from '@chronixjs/ui-vue2';
export default { components: { CxElement } };
</script>
```

```tsx [React]
import { CxElement } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxElement tag="section">
      <p>Content inside a themed section element.</p>
    </CxElement>
  );
}
```

:::

## API Reference

### Props

| Prop     | Type      | Default  | Description               |
| -------- | --------- | -------- | ------------------------- |
| `tag`    | `string`  | `'span'` | HTML tag to render        |
| `inline` | `boolean` | `false`  | Display as inline element |

### Slots

| Slot      | Description     |
| --------- | --------------- |
| `default` | Element content |
