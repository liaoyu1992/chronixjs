# Marquee

Auto-scrolling content strip for stock-tickers, sports scores, or promo announcements.

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
  <CxMarquee :speed="60" pause-on-hover>
    <span>🔥 New Release v0.1.0 — 85 components shipped!</span>
  </CxMarquee>
</template>

<script setup lang="ts">
import { CxMarquee } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxMarquee :speed="60" pause-on-hover>
    <span>🔥 New Release v0.1.0 — 85 components shipped!</span>
  </CxMarquee>
</template>

<script>
import { CxMarquee } from '@chronixjs/ui-vue2';
export default { components: { CxMarquee } };
</script>
```

```tsx [React]
import { CxMarquee } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxMarquee speed={60} pauseOnHover>
      <span>🔥 New Release v0.1.0 — 85 components shipped!</span>
    </CxMarquee>
  );
}
```

:::

## API Reference

### Props

| Prop           | Type                                  | Default  | Description                |
| -------------- | ------------------------------------- | -------- | -------------------------- |
| `direction`    | `'left' \| 'right' \| 'up' \| 'down'` | `'left'` | Scrolling direction        |
| `speed`        | `number`                              | `50`     | Speed in pixels per second |
| `pauseOnHover` | `boolean`                             | `false`  | Pause animation on hover   |

### Slots

| Slot      | Description       |
| --------- | ----------------- |
| `default` | Scrolling content |
