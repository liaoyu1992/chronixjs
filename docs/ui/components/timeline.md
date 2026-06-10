# Timeline

A chronological event display with colored indicators and connecting lines.

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
  <CxTimeline :items="items" />
</template>

<script setup lang="ts">
import { CxTimeline } from '@chronixjs/ui-vue3';

const items = [
  {
    key: '1',
    title: 'Event 1',
    description: 'First event happened',
    timestamp: '2024-01-01',
    color: 'success',
  },
  {
    key: '2',
    title: 'Event 2',
    description: 'Second event happened',
    timestamp: '2024-01-15',
    color: 'info',
  },
  {
    key: '3',
    title: 'Event 3',
    description: 'Third event happened',
    timestamp: '2024-02-01',
    color: 'default',
  },
];
</script>
```

```vue [Vue 2]
<template>
  <CxTimeline :items="items" />
</template>

<script>
import { CxTimeline } from '@chronixjs/ui-vue2';

export default {
  components: { CxTimeline },
  data() {
    return {
      items: [
        {
          key: '1',
          title: 'Event 1',
          description: 'First event happened',
          timestamp: '2024-01-01',
          color: 'success',
        },
        {
          key: '2',
          title: 'Event 2',
          description: 'Second event happened',
          timestamp: '2024-01-15',
          color: 'info',
        },
        {
          key: '3',
          title: 'Event 3',
          description: 'Third event happened',
          timestamp: '2024-02-01',
          color: 'default',
        },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { CxTimeline } from '@chronixjs/ui-react';

const items = [
  {
    key: '1',
    title: 'Event 1',
    description: 'First event happened',
    timestamp: '2024-01-01',
    color: 'success',
  },
  {
    key: '2',
    title: 'Event 2',
    description: 'Second event happened',
    timestamp: '2024-01-15',
    color: 'info',
  },
  {
    key: '3',
    title: 'Event 3',
    description: 'Third event happened',
    timestamp: '2024-02-01',
    color: 'default',
  },
];

export function App() {
  return <CxTimeline items={items} />;
}
```

:::

## Custom Colors

Use the `color` field on each item to set the indicator color. Available colors are `default`, `success`, `warning`, `error`, and `info`.

::: code-group

```vue [Vue 3]
<template>
  <CxTimeline :items="items" />
</template>

<script setup lang="ts">
import { CxTimeline } from '@chronixjs/ui-vue3';

const items = [
  {
    key: '1',
    title: 'Default',
    description: 'Default color indicator',
    timestamp: '2024-01-01',
    color: 'default',
  },
  {
    key: '2',
    title: 'Success',
    description: 'Success color indicator',
    timestamp: '2024-01-05',
    color: 'success',
  },
  {
    key: '3',
    title: 'Warning',
    description: 'Warning color indicator',
    timestamp: '2024-01-10',
    color: 'warning',
  },
  {
    key: '4',
    title: 'Error',
    description: 'Error color indicator',
    timestamp: '2024-01-15',
    color: 'error',
  },
  {
    key: '5',
    title: 'Info',
    description: 'Info color indicator',
    timestamp: '2024-01-20',
    color: 'info',
  },
];
</script>
```

```vue [Vue 2]
<template>
  <CxTimeline :items="items" />
</template>

<script>
import { CxTimeline } from '@chronixjs/ui-vue2';

export default {
  components: { CxTimeline },
  data() {
    return {
      items: [
        {
          key: '1',
          title: 'Default',
          description: 'Default color indicator',
          timestamp: '2024-01-01',
          color: 'default',
        },
        {
          key: '2',
          title: 'Success',
          description: 'Success color indicator',
          timestamp: '2024-01-05',
          color: 'success',
        },
        {
          key: '3',
          title: 'Warning',
          description: 'Warning color indicator',
          timestamp: '2024-01-10',
          color: 'warning',
        },
        {
          key: '4',
          title: 'Error',
          description: 'Error color indicator',
          timestamp: '2024-01-15',
          color: 'error',
        },
        {
          key: '5',
          title: 'Info',
          description: 'Info color indicator',
          timestamp: '2024-01-20',
          color: 'info',
        },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { CxTimeline } from '@chronixjs/ui-react';

const items = [
  {
    key: '1',
    title: 'Default',
    description: 'Default color indicator',
    timestamp: '2024-01-01',
    color: 'default',
  },
  {
    key: '2',
    title: 'Success',
    description: 'Success color indicator',
    timestamp: '2024-01-05',
    color: 'success',
  },
  {
    key: '3',
    title: 'Warning',
    description: 'Warning color indicator',
    timestamp: '2024-01-10',
    color: 'warning',
  },
  {
    key: '4',
    title: 'Error',
    description: 'Error color indicator',
    timestamp: '2024-01-15',
    color: 'error',
  },
  {
    key: '5',
    title: 'Info',
    description: 'Info color indicator',
    timestamp: '2024-01-20',
    color: 'info',
  },
];

export function App() {
  return <CxTimeline items={items} />;
}
```

:::

## Dashed Line

Use `lineType: 'dashed'` on a timeline item to render a dashed connecting line instead of the default solid line.

::: code-group

```vue [Vue 3]
<template>
  <CxTimeline :items="items" />
</template>

<script setup lang="ts">
import { CxTimeline } from '@chronixjs/ui-vue3';

const items = [
  {
    key: '1',
    title: 'Step 1',
    description: 'First event happened',
    timestamp: '2024-01-01',
    color: 'success',
  },
  {
    key: '2',
    title: 'Step 2',
    description: 'Second event happened',
    timestamp: '2024-01-15',
    color: 'info',
    lineType: 'dashed',
  },
  {
    key: '3',
    title: 'Step 3',
    description: 'Third event happened',
    timestamp: '2024-02-01',
    color: 'default',
  },
];
</script>
```

```vue [Vue 2]
<template>
  <CxTimeline :items="items" />
</template>

<script>
import { CxTimeline } from '@chronixjs/ui-vue2';

export default {
  components: { CxTimeline },
  data() {
    return {
      items: [
        {
          key: '1',
          title: 'Step 1',
          description: 'First event happened',
          timestamp: '2024-01-01',
          color: 'success',
        },
        {
          key: '2',
          title: 'Step 2',
          description: 'Second event happened',
          timestamp: '2024-01-15',
          color: 'info',
          lineType: 'dashed',
        },
        {
          key: '3',
          title: 'Step 3',
          description: 'Third event happened',
          timestamp: '2024-02-01',
          color: 'default',
        },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { CxTimeline } from '@chronixjs/ui-react';

const items = [
  {
    key: '1',
    title: 'Step 1',
    description: 'First event happened',
    timestamp: '2024-01-01',
    color: 'success',
  },
  {
    key: '2',
    title: 'Step 2',
    description: 'Second event happened',
    timestamp: '2024-01-15',
    color: 'info',
    lineType: 'dashed',
  },
  {
    key: '3',
    title: 'Step 3',
    description: 'Third event happened',
    timestamp: '2024-02-01',
    color: 'default',
  },
];

export function App() {
  return <CxTimeline items={items} />;
}
```

:::

## API Reference

### Props

| Prop    | Type             | Default | Description      |
| ------- | ---------------- | ------- | ---------------- |
| `items` | `TimelineItem[]` | `[]`    | Timeline entries |

### TimelineItem Interface

| Field         | Type                                                       | Default     | Description       |
| ------------- | ---------------------------------------------------------- | ----------- | ----------------- |
| `key`         | `string`                                                   | --          | Unique key        |
| `title`       | `string`                                                   | --          | Event title       |
| `description` | `string`                                                   | `undefined` | Event description |
| `timestamp`   | `string`                                                   | `undefined` | Timestamp text    |
| `color`       | `'default' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'default'` | Indicator color   |
| `lineType`    | `'default' \| 'dashed'`                                    | `'default'` | Line style        |
