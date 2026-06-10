# Gradient Text 渐变文字

通过 `background-clip: text` 实现 CSS 线性渐变文字效果。

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
  <CxGradientText value="Chronix UI" :colors="['#3b82f6', '#a855f7']" />
</template>

<script setup lang="ts">
import { CxGradientText } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxGradientText value="Chronix UI" :colors="['#3b82f6', '#a855f7']" />
</template>

<script>
import { CxGradientText } from '@chronixjs/ui-vue2';
export default { components: { CxGradientText } };
</script>
```

```tsx [React]
import { CxGradientText } from '@chronixjs/ui-react';

export function App() {
  return <CxGradientText value="Chronix UI" colors={['#3b82f6', '#a855f7']} />;
}
```

:::

## 自定义方向

::: code-group

```vue [Vue 3]
<template>
  <CxGradientText value="Hello World" :colors="['#ef4444', '#f59e0b']" :direction="45" />
</template>

<script setup lang="ts">
import { CxGradientText } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxGradientText value="Hello World" :colors="['#ef4444', '#f59e0b']" :direction="45" />
</template>

<script>
import { CxGradientText } from '@chronixjs/ui-vue2';
export default { components: { CxGradientText } };
</script>
```

```tsx [React]
import { CxGradientText } from '@chronixjs/ui-react';

export function App() {
  return <CxGradientText value="Hello World" colors={['#ef4444', '#f59e0b']} direction={45} />;
}
```

:::

## API 参考

### 属性 (Props)

| Prop        | 类型                        | 默认值                   | 描述               |
| ----------- | --------------------------- | ------------------------ | ------------------ |
| `value`     | `string`                    | `''`                     | 文本内容           |
| `colors`    | `readonly [string, string]` | `['#3b82f6', '#a855f7']` | 渐变起始和结束颜色 |
| `direction` | `number`                    | `90`                     | 渐变方向（角度）   |
