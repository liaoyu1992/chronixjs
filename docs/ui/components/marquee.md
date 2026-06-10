# Marquee 跑马灯

自动滚动内容条，适用于股票行情、体育比分或促销公告。

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

## API 参考

### 属性 (Props)

| Prop           | 类型                                  | 默认值   | 描述               |
| -------------- | ------------------------------------- | -------- | ------------------ |
| `direction`    | `'left' \| 'right' \| 'up' \| 'down'` | `'left'` | 滚动方向           |
| `speed`        | `number`                              | `50`     | 速度（像素/秒）    |
| `pauseOnHover` | `boolean`                             | `false`  | 鼠标悬停时暂停动画 |

### 插槽 (Slots)

| Slot      | 描述     |
| --------- | -------- |
| `default` | 滚动内容 |
