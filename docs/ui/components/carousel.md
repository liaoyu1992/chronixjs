# Carousel 走马灯

幻灯片轮播组件，支持自动播放、指示点、前进/后退箭头和缩略图条。

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

## 自动播放

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

## 垂直方向

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

## 带缩略图

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

## API 参考

### 属性 (Props)

| 属性         | 类型                         | 默认值         | 说明                              |
| ------------ | ---------------------------- | -------------- | --------------------------------- |
| `value`      | `number`                     | `0`            | 当前激活的幻灯片索引（从 0 开始） |
| `items`      | `readonly CarouselItem[]`    | `[]`           | 幻灯片项数组                      |
| `autoplay`   | `boolean`                    | `false`        | 启用自动切换                      |
| `intervalMs` | `number`                     | `3000`         | 自动播放间隔（毫秒）              |
| `showDots`   | `boolean`                    | `true`         | 显示指示点                        |
| `showArrows` | `boolean`                    | `true`         | 显示前进/后退箭头                 |
| `loop`       | `boolean`                    | `true`         | 从最后一张循环到第一张            |
| `direction`  | `'horizontal' \| 'vertical'` | `'horizontal'` | 滑动方向                          |
| `lazy`       | `boolean`                    | `false`        | 仅渲染当前及相邻的幻灯片          |
| `thumbnails` | `boolean`                    | `false`        | 在视口下方显示缩略图条            |

### CarouselItem

| 属性             | 类型     | 说明               |
| ---------------- | -------- | ------------------ |
| `key`            | `string` | 唯一标识符         |
| `content`        | `string` | 纯文本面板内容     |
| `thumbnailLabel` | `string` | 缩略图条的可选标签 |

### 事件 (Events)

| 事件           | 载荷                     | 说明                         |
| -------------- | ------------------------ | ---------------------------- |
| `update:value` | `number`                 | 激活索引变化时触发           |
| `change`       | `(CarouselItem, number)` | 幻灯片项和新的索引变化时触发 |
