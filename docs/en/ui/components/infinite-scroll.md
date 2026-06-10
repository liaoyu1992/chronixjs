# Infinite Scroll

Container that emits a load-more event when the user scrolls near the bottom.

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
  <CxInfiniteScroll :distance="100" :loading="loading" @load="onLoad">
    <div v-for="item in items" :key="item">{{ item }}</div>
  </CxInfiniteScroll>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxInfiniteScroll } from '@chronixjs/ui-vue3';

const items = ref(Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`));
const loading = ref(false);

async function onLoad() {
  loading.value = true;
  const start = items.value.length;
  const newItems = Array.from({ length: 10 }, (_, i) => `Item ${start + i + 1}`);
  items.value.push(...newItems);
  loading.value = false;
}
</script>
```

```vue [Vue 2]
<template>
  <CxInfiniteScroll :distance="100" :loading="loading" @load="onLoad">
    <div v-for="item in items" :key="item">{{ item }}</div>
  </CxInfiniteScroll>
</template>

<script>
import { CxInfiniteScroll } from '@chronixjs/ui-vue2';
export default {
  components: { CxInfiniteScroll },
  data() {
    return {
      items: Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`),
      loading: false,
    };
  },
  methods: {
    async onLoad() {
      this.loading = true;
      const start = this.items.length;
      const newItems = Array.from({ length: 10 }, (_, i) => `Item ${start + i + 1}`);
      this.items.push(...newItems);
      this.loading = false;
    },
  },
};
</script>
```

```tsx [React]
import { useState, useCallback } from 'react';
import { CxInfiniteScroll } from '@chronixjs/ui-react';

export function App() {
  const [items, setItems] = useState(() => Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`));
  const [loading, setLoading] = useState(false);

  const onLoad = useCallback(async () => {
    setLoading(true);
    const start = items.length;
    const newItems = Array.from({ length: 10 }, (_, i) => `Item ${start + i + 1}`);
    setItems((prev) => [...prev, ...newItems]);
    setLoading(false);
  }, [items.length]);

  return (
    <CxInfiniteScroll distance={100} loading={loading} onLoad={onLoad}>
      {items.map((item) => (
        <div key={item}>{item}</div>
      ))}
    </CxInfiniteScroll>
  );
}
```

:::

## API Reference

### Props

| Prop       | Type      | Default | Description                           |
| ---------- | --------- | ------- | ------------------------------------- |
| `distance` | `number`  | `0`     | Distance in px from bottom to trigger |
| `loading`  | `boolean` | `false` | Whether more content is loading       |

### Events

| Event  | Payload | Description                         |
| ------ | ------- | ----------------------------------- |
| `load` | —       | Fires when user scrolls near bottom |

### Slots

| Slot      | Description        |
| --------- | ------------------ |
| `default` | Scrollable content |
