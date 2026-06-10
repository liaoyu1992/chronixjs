# Avatar Group

Horizontal stack of overlapping avatars with overflow +N indicator.

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
  <CxAvatarGroup :items="items" :max="4" :size="32" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxAvatarGroup } from '@chronixjs/ui-vue3';

const items = ref([
  { key: 'a', src: 'https://i.pravatar.cc/32?img=1', text: undefined },
  { key: 'b', src: 'https://i.pravatar.cc/32?img=2', text: undefined },
  { key: 'c', src: undefined, text: 'JD' },
  { key: 'd', src: 'https://i.pravatar.cc/32?img=4', text: undefined },
  { key: 'e', src: 'https://i.pravatar.cc/32?img=5', text: undefined },
]);
</script>
```

```vue [Vue 2]
<template>
  <CxAvatarGroup :items="items" :max="4" :size="32" />
</template>

<script>
import { CxAvatarGroup } from '@chronixjs/ui-vue2';
export default {
  components: { CxAvatarGroup },
  data() {
    return {
      items: [
        { key: 'a', src: 'https://i.pravatar.cc/32?img=1', text: undefined },
        { key: 'b', src: 'https://i.pravatar.cc/32?img=2', text: undefined },
        { key: 'c', src: undefined, text: 'JD' },
        { key: 'd', src: 'https://i.pravatar.cc/32?img=4', text: undefined },
        { key: 'e', src: 'https://i.pravatar.cc/32?img=5', text: undefined },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxAvatarGroup } from '@chronixjs/ui-react';

export function App() {
  const [items] = useState([
    { key: 'a', src: 'https://i.pravatar.cc/32?img=1', text: undefined },
    { key: 'b', src: 'https://i.pravatar.cc/32?img=2', text: undefined },
    { key: 'c', src: undefined, text: 'JD' },
    { key: 'd', src: 'https://i.pravatar.cc/32?img=4', text: undefined },
    { key: 'e', src: 'https://i.pravatar.cc/32?img=5', text: undefined },
  ]);

  return <CxAvatarGroup items={items} max={4} size={32} />;
}
```

:::

## API Reference

### Props

| Prop    | Type                    | Default    | Description                           |
| ------- | ----------------------- | ---------- | ------------------------------------- |
| `items` | `readonly AvatarItem[]` | `[]`       | Array of avatar items                 |
| `max`   | `number`                | `5`        | Max visible items; excess shown as +N |
| `size`  | `number`                | `32`       | Avatar size in px                     |
| `shape` | `'circle' \| 'square'`  | `'circle'` | Avatar shape                          |

### AvatarItem

| Property | Type                  | Description            |
| -------- | --------------------- | ---------------------- |
| `key`    | `string`              | Unique identifier      |
| `src`    | `string \| undefined` | Image URL              |
| `text`   | `string \| undefined` | Fallback text initials |
