# Countdown 倒计时

实时倒计时器，倒数至零，支持可配置的精度。

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
  <CxCountdown label="Time Remaining" :duration="60000" />
</template>

<script setup lang="ts">
import { CxCountdown } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxCountdown label="Time Remaining" :duration="60000" />
</template>

<script>
import { CxCountdown } from '@chronixjs/ui-vue2';
export default { components: { CxCountdown } };
</script>
```

```tsx [React]
import { CxCountdown } from '@chronixjs/ui-react';

export function App() {
  return <CxCountdown label="Time Remaining" duration={60000} />;
}
```

:::

## 带精度

::: code-group

```vue [Vue 3]
<template>
  <CxCountdown label="Lap Timer" :duration="30000" :precision="2" />
</template>

<script setup lang="ts">
import { CxCountdown } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxCountdown label="Lap Timer" :duration="30000" :precision="2" />
</template>

<script>
import { CxCountdown } from '@chronixjs/ui-vue2';
export default { components: { CxCountdown } };
</script>
```

```tsx [React]
import { CxCountdown } from '@chronixjs/ui-react';

export function App() {
  return <CxCountdown label="Lap Timer" duration={30000} precision={2} />;
}
```

:::

## API 参考

### 属性 (Props)

| 属性        | 类型                  | 默认值      | 说明                       |
| ----------- | --------------------- | ----------- | -------------------------- |
| `label`     | `string \| undefined` | `undefined` | 标题标签                   |
| `duration`  | `number`              | `0`         | 倒计时总时长（毫秒）       |
| `precision` | `0 \| 1 \| 2 \| 3`    | `0`         | 小数精度（用于显示小数秒） |
| `active`    | `boolean`             | `true`      | 计时器是否运行中           |

### 事件 (Events)

| 事件     | 载荷 | 说明             |
| -------- | ---- | ---------------- |
| `finish` | —    | 倒计时归零时触发 |

### 插槽 (Slots)

| 插槽     | 说明                 |
| -------- | -------------------- |
| `prefix` | 渲染在数值之前的内容 |
| `suffix` | 渲染在数值之后的内容 |
