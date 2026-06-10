# Slider 滑块

单滑块或范围滑块，支持可选的刻度标记和工具提示。

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
  <CxSlider v-model:value="val" :min="0" :max="100" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxSlider } from '@chronixjs/ui-vue3';

const val = ref(50);
</script>
```

```vue [Vue 2]
<template>
  <CxSlider :value.sync="val" :min="0" :max="100" />
</template>

<script>
import { CxSlider } from '@chronixjs/ui-vue2';
export default {
  components: { CxSlider },
  data() {
    return { val: 50 };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxSlider } from '@chronixjs/ui-react';

export function App() {
  const [val, setVal] = useState(50);

  return <CxSlider value={val} onUpdateValue={setVal} min={0} max={100} />;
}
```

:::

## 范围模式

::: code-group

```vue [Vue 3]
<template>
  <CxSlider v-model:value="range" range :min="0" :max="100" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxSlider } from '@chronixjs/ui-vue3';

const range = ref<[number, number]>([20, 80]);
</script>
```

```vue [Vue 2]
<template>
  <CxSlider :value.sync="range" range :min="0" :max="100" />
</template>

<script>
import { CxSlider } from '@chronixjs/ui-vue2';
export default {
  components: { CxSlider },
  data() {
    return { range: [20, 80] };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxSlider } from '@chronixjs/ui-react';

export function App() {
  const [range, setRange] = useState<[number, number]>([20, 80]);

  return <CxSlider value={range} onUpdateValue={setRange} range min={0} max={100} />;
}
```

:::

## API 参考

### 属性 (Props)

| 属性       | 类型                         | 默认值  | 说明                 |
| ---------- | ---------------------------- | ------- | -------------------- |
| `value`    | `number \| [number, number]` | `0`     | 当前值（单个或范围） |
| `range`    | `boolean`                    | `false` | 启用双滑块范围模式   |
| `min`      | `number`                     | `0`     | 最小值               |
| `max`      | `number`                     | `100`   | 最大值               |
| `step`     | `number`                     | `1`     | 步长                 |
| `marks`    | `Record<number, SliderMark>` | `{}`    | 特定值的标签标记     |
| `disabled` | `boolean`                    | `false` | 禁用滑块             |
| `tooltip`  | `boolean`                    | `true`  | 悬停时显示工具提示   |
| `vertical` | `boolean`                    | `false` | 垂直方向             |

### 事件 (Events)

| 事件           | 载荷                         | 说明         |
| -------------- | ---------------------------- | ------------ |
| `update:value` | `number \| [number, number]` | 值变化时触发 |
