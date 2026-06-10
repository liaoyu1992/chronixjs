# Badge 徽标

徽标用于显示状态指示器、计数或通知。可以包裹子元素或独立渲染。

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
  <CxBadge :value="5">
    <CxButton>Messages</CxButton>
  </CxBadge>
</template>

<script setup lang="ts">
import { CxBadge, CxButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxBadge :value="5">
    <CxButton>Messages</CxButton>
  </CxBadge>
</template>

<script>
import { CxBadge, CxButton } from '@chronixjs/ui-vue2';
export default { components: { CxBadge, CxButton } };
</script>
```

```tsx [React]
import { CxBadge, CxButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxBadge value={5}>
      <CxButton>Messages</CxButton>
    </CxBadge>
  );
}
```

:::

## 独立徽标

不使用默认插槽时，徽标作为独立元素渲染：

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; gap: 8px;">
    <CxBadge :value="12" />
    <CxBadge value="new" type="success" />
    <CxBadge :value="99" type="error" />
  </div>
</template>

<script setup lang="ts">
import { CxBadge } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; gap: 8px;">
    <CxBadge :value="12" />
    <CxBadge value="new" type="success" />
    <CxBadge :value="99" type="error" />
  </div>
</template>

<script>
import { CxBadge } from '@chronixjs/ui-vue2';
export default { components: { CxBadge } };
</script>
```

```tsx [React]
import { CxBadge } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <CxBadge value={12} />
      <CxBadge value="new" type="success" />
      <CxBadge value={99} type="error" />
    </div>
  );
}
```

:::

## 最大值

使用 `max` 截断大数字。超出时显示为 `max+`：

::: code-group

```vue [Vue 3]
<template>
  <CxBadge :value="150" :max="99">
    <CxButton>Notifications</CxButton>
  </CxBadge>
  <!-- 显示为: 99+ -->
</template>

<script setup lang="ts">
import { CxBadge, CxButton } from '@chronixjs/ui-vue3';
</script>
```

```tsx [React]
import { CxBadge, CxButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxBadge value={150} max={99}>
      <CxButton>Notifications</CxButton>
    </CxBadge>
  );
}
```

:::

## 圆点模式

显示小圆点指示器代替数字：

::: code-group

```vue [Vue 3]
<template>
  <CxBadge dot>
    <CxButton>Updates</CxButton>
  </CxBadge>
</template>

<script setup lang="ts">
import { CxBadge, CxButton } from '@chronixjs/ui-vue3';
</script>
```

```tsx [React]
import { CxBadge, CxButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxBadge dot>
      <CxButton>Updates</CxButton>
    </CxBadge>
  );
}
```

:::

## 脉冲动画

为徽标添加脉冲动画效果：

::: code-group

```vue [Vue 3]
<template>
  <CxBadge dot processing type="error">
    <CxButton>Live</CxButton>
  </CxBadge>
</template>

<script setup lang="ts">
import { CxBadge, CxButton } from '@chronixjs/ui-vue3';
</script>
```

```tsx [React]
import { CxBadge, CxButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxBadge dot processing type="error">
      <CxButton>Live</CxButton>
    </CxBadge>
  );
}
```

:::

## 徽标类型

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; gap: 8px;">
    <CxBadge :value="5" type="default" />
    <CxBadge :value="5" type="success" />
    <CxBadge :value="5" type="warning" />
    <CxBadge :value="5" type="error" />
    <CxBadge :value="5" type="info" />
  </div>
</template>

<script setup lang="ts">
import { CxBadge } from '@chronixjs/ui-vue3';
</script>
```

```tsx [React]
import { CxBadge } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <CxBadge value={5} type="default" />
      <CxBadge value={5} type="success" />
      <CxBadge value={5} type="warning" />
      <CxBadge value={5} type="error" />
      <CxBadge value={5} type="info" />
    </div>
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性         | 类型                                                       | 默认值      | 说明           |
| ------------ | ---------------------------------------------------------- | ----------- | -------------- |
| `value`      | `number \| string \| undefined`                            | `undefined` | 徽标内容       |
| `max`        | `number \| undefined`                                      | `undefined` | 数字截断阈值   |
| `dot`        | `boolean`                                                  | `false`     | 圆点指示器模式 |
| `type`       | `'default' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'default'` | 语义颜色       |
| `processing` | `boolean`                                                  | `false`     | 脉冲动画       |
| `show`       | `boolean`                                                  | `true`      | 切换可见性     |

### 插槽 (Slots)

| 插槽      | 说明                         |
| --------- | ---------------------------- |
| `default` | 包裹的元素；省略则为独立模式 |
