# Icon Wrapper

Sizing and coloring wrapper for arbitrary icon content.

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
  <CxIconWrapper :size="24" color="#3b82f6">
    <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" /></svg>
  </CxIconWrapper>
</template>

<script setup lang="ts">
import { CxIconWrapper } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxIconWrapper :size="24" color="#3b82f6">
    <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" /></svg>
  </CxIconWrapper>
</template>

<script>
import { CxIconWrapper } from '@chronixjs/ui-vue2';
export default { components: { CxIconWrapper } };
</script>
```

```tsx [React]
import { CxIconWrapper } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxIconWrapper size={24} color="#3b82f6">
      <svg viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" />
      </svg>
    </CxIconWrapper>
  );
}
```

:::

## API Reference

### Props

| Prop    | Type                  | Default     | Description                   |
| ------- | --------------------- | ----------- | ----------------------------- |
| `size`  | `number`              | `24`        | Width + height in px          |
| `color` | `string \| undefined` | `undefined` | CSS color; undefined inherits |

### Slots

| Slot      | Description  |
| --------- | ------------ |
| `default` | Icon content |
