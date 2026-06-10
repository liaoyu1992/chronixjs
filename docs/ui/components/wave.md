# Wave 波浪

CSS 涟漪包裹器 -- pointerdown 事件在包裹的元素上触发短暂的关键帧动画。

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
  <CxWave>
    <button>Click me for a ripple</button>
  </CxWave>
</template>

<script setup lang="ts">
import { CxWave } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxWave>
    <button>Click me for a ripple</button>
  </CxWave>
</template>

<script>
import { CxWave } from '@chronixjs/ui-vue2';
export default { components: { CxWave } };
</script>
```

```tsx [React]
import { CxWave } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxWave>
      <button>Click me for a ripple</button>
    </CxWave>
  );
}
```

:::

## 自定义颜色

::: code-group

```vue [Vue 3]
<template>
  <CxWave color="rgba(59, 130, 246, 0.3)" :duration="400">
    <button>Blue ripple</button>
  </CxWave>
</template>

<script setup lang="ts">
import { CxWave } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxWave color="rgba(59, 130, 246, 0.3)" :duration="400">
    <button>Blue ripple</button>
  </CxWave>
</template>

<script>
import { CxWave } from '@chronixjs/ui-vue2';
export default { components: { CxWave } };
</script>
```

```tsx [React]
import { CxWave } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxWave color="rgba(59, 130, 246, 0.3)" duration={400}>
      <button>Blue ripple</button>
    </CxWave>
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性       | 类型                  | 默认值      | 说明                             |
| ---------- | --------------------- | ----------- | -------------------------------- |
| `color`    | `string \| undefined` | `undefined` | 涟漪颜色（CSS）；回退到 CSS 变量 |
| `duration` | `number`              | `600`       | 动画时长（毫秒）                 |
| `disabled` | `boolean`             | `false`     | 禁用涟漪效果                     |

### 插槽 (Slots)

| 插槽      | 说明             |
| --------- | ---------------- |
| `default` | 被涟漪包裹的元素 |
