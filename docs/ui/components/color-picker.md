# Color Picker 颜色选择器

带有十六进制输入、色相条和可选色板的颜色选择器。

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
  <CxColorPicker v-model:value="color" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxColorPicker } from '@chronixjs/ui-vue3';

const color = ref<string | null>('#3b82f6');
</script>
```

```vue [Vue 2]
<template>
  <CxColorPicker :value.sync="color" />
</template>

<script>
import { CxColorPicker } from '@chronixjs/ui-vue2';
export default {
  components: { CxColorPicker },
  data() {
    return { color: '#3b82f6' };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxColorPicker } from '@chronixjs/ui-react';

export function App() {
  const [color, setColor] = useState<string | null>('#3b82f6');

  return <CxColorPicker value={color} onUpdateValue={setColor} />;
}
```

:::

## 带色板

::: code-group

```vue [Vue 3]
<template>
  <CxColorPicker v-model:value="color" :swatches="swatches" clearable />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxColorPicker } from '@chronixjs/ui-vue3';

const color = ref<string | null>('#000000');
const swatches = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#8b5cf6'];
</script>
```

```vue [Vue 2]
<template>
  <CxColorPicker :value.sync="color" :swatches="swatches" clearable />
</template>

<script>
import { CxColorPicker } from '@chronixjs/ui-vue2';
export default {
  components: { CxColorPicker },
  data() {
    return {
      color: '#000000',
      swatches: ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#8b5cf6'],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxColorPicker } from '@chronixjs/ui-react';

export function App() {
  const [color, setColor] = useState<string | null>('#000000');
  const swatches = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#8b5cf6'];

  return <CxColorPicker value={color} onUpdateValue={setColor} swatches={swatches} clearable />;
}
```

:::

## API 参考

### 属性 (Props)

| 属性        | 类型                | 默认值  | 说明                                     |
| ----------- | ------------------- | ------- | ---------------------------------------- |
| `value`     | `string \| null`    | `null`  | 当前颜色，`#rrggbb` 十六进制格式         |
| `swatches`  | `readonly string[]` | `[]`    | 预设色板颜色                             |
| `showAlpha` | `boolean`           | `false` | 显示透明度滑块                           |
| `alpha`     | `number`            | `1`     | 透明度值 (0-1)，showAlpha 为 true 时使用 |
| `disabled`  | `boolean`           | `false` | 禁用选择器                               |
| `clearable` | `boolean`           | `false` | 显示清除按钮以重置值                     |

### 事件 (Events)

| 事件           | 载荷             | 说明           |
| -------------- | ---------------- | -------------- |
| `update:value` | `string \| null` | 颜色变化时触发 |
