# Number Animation 数字动画

动画数字显示组件，可在配置的持续时间内从一个值平滑过渡到另一个值。

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
  <CxNumberAnimation :from="0" :to="9999" :duration="2000" />
</template>

<script setup lang="ts">
import { CxNumberAnimation } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxNumberAnimation :from="0" :to="9999" :duration="2000" />
</template>

<script>
import { CxNumberAnimation } from '@chronixjs/ui-vue2';
export default { components: { CxNumberAnimation } };
</script>
```

```tsx [React]
import { CxNumberAnimation } from '@chronixjs/ui-react';

export function App() {
  return <CxNumberAnimation from={0} to={9999} duration={2000} />;
}
```

:::

## 精度与分隔符

::: code-group

```vue [Vue 3]
<template>
  <CxNumberAnimation :from="0" :to="1234567.89" :duration="3000" :precision="2" show-separator />
</template>

<script setup lang="ts">
import { CxNumberAnimation } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxNumberAnimation :from="0" :to="1234567.89" :duration="3000" :precision="2" show-separator />
</template>

<script>
import { CxNumberAnimation } from '@chronixjs/ui-vue2';
export default { components: { CxNumberAnimation } };
</script>
```

```tsx [React]
import { CxNumberAnimation } from '@chronixjs/ui-react';

export function App() {
  return <CxNumberAnimation from={0} to={1234567.89} duration={3000} precision={2} showSeparator />;
}
```

:::

## API 参考

### 属性 (Props)

| 属性            | 类型      | 默认值  | 说明                 |
| --------------- | --------- | ------- | -------------------- |
| `from`          | `number`  | `0`     | 起始值               |
| `to`            | `number`  | `0`     | 目标值               |
| `duration`      | `number`  | `2000`  | 动画持续时间（毫秒） |
| `precision`     | `number`  | `0`     | 小数精度             |
| `active`        | `boolean` | `true`  | 动画是否正在运行     |
| `showSeparator` | `boolean` | `false` | 显示千位分隔符       |
| `locale`        | `string`  | —       | 数字格式化的区域设置 |
