# Infinite Scroll 无限滚动

当用户滚动到底部附近时发出加载更多事件的容器组件。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## 基础用法

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

## API 参考

### 属性 (Props)

| Prop       | 类型      | 默认值  | 描述                     |
| ---------- | --------- | ------- | ------------------------ |
| `distance` | `number`  | `0`     | 距底部多少像素时触发加载 |
| `loading`  | `boolean` | `false` | 是否正在加载更多内容     |

### 事件 (Events)

| Event  | Payload | 描述                     |
| ------ | ------- | ------------------------ |
| `load` | —       | 用户滚动到底部附近时触发 |

### 插槽 (Slots)

| Slot      | 描述         |
| --------- | ------------ |
| `default` | 可滚动的内容 |
