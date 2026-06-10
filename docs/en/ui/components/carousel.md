# Carousel

A slide carousel with optional autoplay, indicator dots, prev/next arrows, and thumbnail strip.

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
  <CxCarousel v-model:value="current" :items="items" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxCarousel } from '@chronixjs/ui-vue3';

const current = ref(0);
const items = ref([
  { key: 's1', content: 'Slide 1 — Introduction' },
  { key: 's2', content: 'Slide 2 — Features' },
  { key: 's3', content: 'Slide 3 — Get Started' },
]);
</script>
```

```vue [Vue 2]
<template>
  <CxCarousel :value.sync="current" :items="items" />
</template>

<script>
import { CxCarousel } from '@chronixjs/ui-vue2';
export default {
  components: { CxCarousel },
  data() {
    return {
      current: 0,
      items: [
        { key: 's1', content: 'Slide 1 — Introduction' },
        { key: 's2', content: 'Slide 2 — Features' },
        { key: 's3', content: 'Slide 3 — Get Started' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxCarousel } from '@chronixjs/ui-react';

export function App() {
  const [current, setCurrent] = useState(0);
  const [items] = useState([
    { key: 's1', content: 'Slide 1 — Introduction' },
    { key: 's2', content: 'Slide 2 — Features' },
    { key: 's3', content: 'Slide 3 — Get Started' },
  ]);

  return <CxCarousel value={current} onUpdateValue={setCurrent} items={items} />;
}
```

:::

## Autoplay

::: code-group

```vue [Vue 3]
<template>
  <CxCarousel v-model:value="current" :items="items" autoplay :interval-ms="2000" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxCarousel } from '@chronixjs/ui-vue3';

const current = ref(0);
const items = ref([
  { key: 'a', content: 'Auto Slide A' },
  { key: 'b', content: 'Auto Slide B' },
  { key: 'c', content: 'Auto Slide C' },
]);
</script>
```

```vue [Vue 2]
<template>
  <CxCarousel :value.sync="current" :items="items" autoplay :interval-ms="2000" />
</template>

<script>
import { CxCarousel } from '@chronixjs/ui-vue2';
export default {
  components: { CxCarousel },
  data() {
    return {
      current: 0,
      items: [
        { key: 'a', content: 'Auto Slide A' },
        { key: 'b', content: 'Auto Slide B' },
        { key: 'c', content: 'Auto Slide C' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxCarousel } from '@chronixjs/ui-react';

export function App() {
  const [current, setCurrent] = useState(0);
  const [items] = useState([
    { key: 'a', content: 'Auto Slide A' },
    { key: 'b', content: 'Auto Slide B' },
    { key: 'c', content: 'Auto Slide C' },
  ]);

  return (
    <CxCarousel
      value={current}
      onUpdateValue={setCurrent}
      items={items}
      autoplay
      intervalMs={2000}
    />
  );
}
```

:::

## Vertical Direction

::: code-group

```vue [Vue 3]
<template>
  <CxCarousel v-model:value="current" :items="items" direction="vertical" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxCarousel } from '@chronixjs/ui-vue3';

const current = ref(0);
const items = ref([
  { key: 'v1', content: 'Vertical Slide 1' },
  { key: 'v2', content: 'Vertical Slide 2' },
]);
</script>
```

```vue [Vue 2]
<template>
  <CxCarousel :value.sync="current" :items="items" direction="vertical" />
</template>

<script>
import { CxCarousel } from '@chronixjs/ui-vue2';
export default {
  components: { CxCarousel },
  data() {
    return {
      current: 0,
      items: [
        { key: 'v1', content: 'Vertical Slide 1' },
        { key: 'v2', content: 'Vertical Slide 2' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxCarousel } from '@chronixjs/ui-react';

export function App() {
  const [current, setCurrent] = useState(0);
  const [items] = useState([
    { key: 'v1', content: 'Vertical Slide 1' },
    { key: 'v2', content: 'Vertical Slide 2' },
  ]);

  return (
    <CxCarousel value={current} onUpdateValue={setCurrent} items={items} direction="vertical" />
  );
}
```

:::

## With Thumbnails

::: code-group

```vue [Vue 3]
<template>
  <CxCarousel v-model:value="current" :items="items" thumbnails />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxCarousel } from '@chronixjs/ui-vue3';

const current = ref(0);
const items = ref([
  { key: 't1', content: 'Photo 1', thumbnailLabel: '1' },
  { key: 't2', content: 'Photo 2', thumbnailLabel: '2' },
  { key: 't3', content: 'Photo 3', thumbnailLabel: '3' },
]);
</script>
```

```vue [Vue 2]
<template>
  <CxCarousel :value.sync="current" :items="items" thumbnails />
</template>

<script>
import { CxCarousel } from '@chronixjs/ui-vue2';
export default {
  components: { CxCarousel },
  data() {
    return {
      current: 0,
      items: [
        { key: 't1', content: 'Photo 1', thumbnailLabel: '1' },
        { key: 't2', content: 'Photo 2', thumbnailLabel: '2' },
        { key: 't3', content: 'Photo 3', thumbnailLabel: '3' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxCarousel } from '@chronixjs/ui-react';

export function App() {
  const [current, setCurrent] = useState(0);
  const [items] = useState([
    { key: 't1', content: 'Photo 1', thumbnailLabel: '1' },
    { key: 't2', content: 'Photo 2', thumbnailLabel: '2' },
    { key: 't3', content: 'Photo 3', thumbnailLabel: '3' },
  ]);

  return <CxCarousel value={current} onUpdateValue={setCurrent} items={items} thumbnails />;
}
```

:::

## API Reference

### Props

| Prop         | Type                         | Default        | Description                             |
| ------------ | ---------------------------- | -------------- | --------------------------------------- |
| `value`      | `number`                     | `0`            | Currently active slide index (0-based)  |
| `items`      | `readonly CarouselItem[]`    | `[]`           | Array of slide items                    |
| `autoplay`   | `boolean`                    | `false`        | Enable automatic slide transition       |
| `intervalMs` | `number`                     | `3000`         | Autoplay interval in ms                 |
| `showDots`   | `boolean`                    | `true`         | Show indicator dots                     |
| `showArrows` | `boolean`                    | `true`         | Show prev/next arrows                   |
| `loop`       | `boolean`                    | `true`         | Wrap from last to first slide           |
| `direction`  | `'horizontal' \| 'vertical'` | `'horizontal'` | Slide direction                         |
| `lazy`       | `boolean`                    | `false`        | Render only active ± adjacent slides    |
| `thumbnails` | `boolean`                    | `false`        | Show thumbnail strip below the viewport |

### CarouselItem

| Property         | Type     | Description                            |
| ---------------- | -------- | -------------------------------------- |
| `key`            | `string` | Unique identifier                      |
| `content`        | `string` | Plain-text panel content               |
| `thumbnailLabel` | `string` | Optional label for the thumbnail strip |

### Events

| Event          | Payload                  | Description                       |
| -------------- | ------------------------ | --------------------------------- |
| `update:value` | `number`                 | Fires when active index changes   |
| `change`       | `(CarouselItem, number)` | Fires with the item and new index |
