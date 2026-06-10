# List

Vertical list display for settings, contacts, or file rows with optional prefix/suffix.

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
  <CxList :items="items" bordered />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxList } from '@chronixjs/ui-vue3';

const items = ref([
  { key: 'a', title: 'Settings', description: 'App configuration', prefix: '⚙', suffix: '>' },
  { key: 'b', title: 'Profile', description: 'User account', prefix: '👤', suffix: '>' },
  { key: 'c', title: 'Help', prefix: '❓' },
]);
</script>
```

```vue [Vue 2]
<template>
  <CxList :items="items" bordered />
</template>

<script>
import { CxList } from '@chronixjs/ui-vue2';
export default {
  components: { CxList },
  data() {
    return {
      items: [
        { key: 'a', title: 'Settings', description: 'App configuration', prefix: '⚙', suffix: '>' },
        { key: 'b', title: 'Profile', description: 'User account', prefix: '👤', suffix: '>' },
        { key: 'c', title: 'Help', prefix: '❓' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxList } from '@chronixjs/ui-react';

export function App() {
  const [items] = useState([
    { key: 'a', title: 'Settings', description: 'App configuration', prefix: '⚙', suffix: '>' },
    { key: 'b', title: 'Profile', description: 'User account', prefix: '👤', suffix: '>' },
    { key: 'c', title: 'Help', prefix: '❓' },
  ]);

  return <CxList items={items} bordered />;
}
```

:::

## Hoverable

::: code-group

```vue [Vue 3]
<template>
  <CxList :items="items" hoverable />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxList } from '@chronixjs/ui-vue3';

const items = ref([
  { key: '1', title: 'Inbox', suffix: '12' },
  { key: '2', title: 'Sent', suffix: '0' },
  { key: '3', title: 'Drafts', suffix: '3' },
]);
</script>
```

```vue [Vue 2]
<template>
  <CxList :items="items" hoverable />
</template>

<script>
import { CxList } from '@chronixjs/ui-vue2';
export default {
  components: { CxList },
  data() {
    return {
      items: [
        { key: '1', title: 'Inbox', suffix: '12' },
        { key: '2', title: 'Sent', suffix: '0' },
        { key: '3', title: 'Drafts', suffix: '3' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxList } from '@chronixjs/ui-react';

export function App() {
  const [items] = useState([
    { key: '1', title: 'Inbox', suffix: '12' },
    { key: '2', title: 'Sent', suffix: '0' },
    { key: '3', title: 'Drafts', suffix: '3' },
  ]);

  return <CxList items={items} hoverable />;
}
```

:::

## API Reference

### Props

| Prop          | Type                             | Default    | Description                |
| ------------- | -------------------------------- | ---------- | -------------------------- |
| `items`       | `readonly ListItem[]`            | `[]`       | Array of list items        |
| `bordered`    | `boolean`                        | `false`    | Show outer border          |
| `hoverable`   | `boolean`                        | `false`    | Highlight items on hover   |
| `showDivider` | `boolean`                        | `true`     | Show divider between items |
| `size`        | `'small' \| 'medium' \| 'large'` | `'medium'` | Padding scale              |

### ListItem

| Property      | Type                  | Description            |
| ------------- | --------------------- | ---------------------- |
| `key`         | `string`              | Unique key             |
| `title`       | `string`              | Primary title text     |
| `description` | `string \| undefined` | Optional sub-text      |
| `prefix`      | `string \| undefined` | Leading icon/glyph     |
| `suffix`      | `string \| undefined` | Trailing metadata text |
