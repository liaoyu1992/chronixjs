# Back Top

A floating "back to top" button that appears when the page is scrolled past a threshold.

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
  <CxBackTop />
</template>

<script setup lang="ts">
import { CxBackTop } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxBackTop />
</template>

<script>
import { CxBackTop } from '@chronixjs/ui-vue2';
export default { components: { CxBackTop } };
</script>
```

```tsx [React]
import { CxBackTop } from '@chronixjs/ui-react';

export function App() {
  return <CxBackTop />;
}
```

:::

## Custom Position

::: code-group

```vue [Vue 3]
<template>
  <CxBackTop :right="60" :bottom="80" />
</template>

<script setup lang="ts">
import { CxBackTop } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxBackTop :right="60" :bottom="80" />
</template>

<script>
import { CxBackTop } from '@chronixjs/ui-vue2';
export default { components: { CxBackTop } };
</script>
```

```tsx [React]
import { CxBackTop } from '@chronixjs/ui-react';

export function App() {
  return <CxBackTop right={60} bottom={80} />;
}
```

:::

## Custom Visibility Threshold

::: code-group

```vue [Vue 3]
<template>
  <CxBackTop :visibility-threshold="300" behavior="smooth" />
</template>

<script setup lang="ts">
import { CxBackTop } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxBackTop :visibility-threshold="300" behavior="smooth" />
</template>

<script>
import { CxBackTop } from '@chronixjs/ui-vue2';
export default { components: { CxBackTop } };
</script>
```

```tsx [React]
import { CxBackTop } from '@chronixjs/ui-react';

export function App() {
  return <CxBackTop visibilityThreshold={300} behavior="smooth" />;
}
```

:::

## API Reference

### Props

| Prop                  | Type                 | Default    | Description                                 |
| --------------------- | -------------------- | ---------- | ------------------------------------------- |
| `visibilityThreshold` | `number`             | `100`      | Show button when `scrollY >=` this value    |
| `right`               | `number`             | `40`       | Right offset in pixels                      |
| `bottom`              | `number`             | `40`       | Bottom offset in pixels                     |
| `behavior`            | `'smooth' \| 'auto'` | `'smooth'` | Scroll behavior passed to `window.scrollTo` |

### Events

| Event   | Payload      | Description                  |
| ------- | ------------ | ---------------------------- |
| `click` | `MouseEvent` | Fired when button is clicked |

### Slots

| Slot      | Description                         |
| --------- | ----------------------------------- |
| `default` | Custom content (defaults to ↑ icon) |
