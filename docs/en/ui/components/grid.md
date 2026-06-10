# Grid

CSS Grid 2D layout container with simplified column and gap configuration.

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
  <CxGrid :cols="3" :x-gap="16" :y-gap="12">
    <div>Cell 1</div>
    <div>Cell 2</div>
    <div>Cell 3</div>
    <div>Cell 4</div>
    <div>Cell 5</div>
    <div>Cell 6</div>
  </CxGrid>
</template>

<script setup lang="ts">
import { CxGrid } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxGrid :cols="3" :x-gap="16" :y-gap="12">
    <div>Cell 1</div>
    <div>Cell 2</div>
    <div>Cell 3</div>
    <div>Cell 4</div>
    <div>Cell 5</div>
    <div>Cell 6</div>
  </CxGrid>
</template>

<script>
import { CxGrid } from '@chronixjs/ui-vue2';
export default { components: { CxGrid } };
</script>
```

```tsx [React]
import { CxGrid } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxGrid cols={3} xGap={16} yGap={12}>
      <div>Cell 1</div>
      <div>Cell 2</div>
      <div>Cell 3</div>
      <div>Cell 4</div>
      <div>Cell 5</div>
      <div>Cell 6</div>
    </CxGrid>
  );
}
```

:::

## Custom Track Template

::: code-group

```vue [Vue 3]
<template>
  <CxGrid cols="120px 1fr 120px" :x-gap="8">
    <div>Sidebar</div>
    <div>Main Content</div>
    <div>Aside</div>
  </CxGrid>
</template>

<script setup lang="ts">
import { CxGrid } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxGrid cols="120px 1fr 120px" :x-gap="8">
    <div>Sidebar</div>
    <div>Main Content</div>
    <div>Aside</div>
  </CxGrid>
</template>

<script>
import { CxGrid } from '@chronixjs/ui-vue2';
export default { components: { CxGrid } };
</script>
```

```tsx [React]
import { CxGrid } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxGrid cols="120px 1fr 120px" xGap={8}>
      <div>Sidebar</div>
      <div>Main Content</div>
      <div>Aside</div>
    </CxGrid>
  );
}
```

:::

## Inline Grid

::: code-group

```vue [Vue 3]
<template>
  <CxGrid :cols="2" :x-gap="12" inline>
    <span>A</span>
    <span>B</span>
  </CxGrid>
</template>

<script setup lang="ts">
import { CxGrid } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxGrid :cols="2" :x-gap="12" inline>
    <span>A</span>
    <span>B</span>
  </CxGrid>
</template>

<script>
import { CxGrid } from '@chronixjs/ui-vue2';
export default { components: { CxGrid } };
</script>
```

```tsx [React]
import { CxGrid } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxGrid cols={2} xGap={12} inline>
      <span>A</span>
      <span>B</span>
    </CxGrid>
  );
}
```

:::

## API Reference

### Props

| Prop     | Type                            | Default     | Description                                                 |
| -------- | ------------------------------- | ----------- | ----------------------------------------------------------- |
| `cols`   | `number \| string \| undefined` | `undefined` | Column tracks: number → `repeat(N, 1fr)`, string → verbatim |
| `xGap`   | `number \| undefined`           | `undefined` | Column gap in pixels                                        |
| `yGap`   | `number \| undefined`           | `undefined` | Row gap in pixels                                           |
| `inline` | `boolean`                       | `false`     | Use `inline-grid` instead of `grid`                         |

### Slots

| Slot      | Description       |
| --------- | ----------------- |
| `default` | Grid cell content |
