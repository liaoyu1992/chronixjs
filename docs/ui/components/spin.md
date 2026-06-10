# Spin 加载

带不确定旋转动画和可选描述文本的加载状态指示器。

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
  <CxSpin size="medium" description="Loading..." />
</template>

<script setup lang="ts">
import { CxSpin } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxSpin size="medium" description="Loading..." />
</template>

<script>
import { CxSpin } from '@chronixjs/ui-vue2';
export default { components: { CxSpin } };
</script>
```

```tsx [React]
import { CxSpin } from '@chronixjs/ui-react';

export function App() {
  return <CxSpin size="medium" description="Loading..." />;
}
```

:::

## 尺寸

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; gap: 24px; align-items: center;">
    <CxSpin size="small" />
    <CxSpin size="medium" />
    <CxSpin size="large" />
  </div>
</template>

<script setup lang="ts">
import { CxSpin } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; gap: 24px; align-items: center;">
    <CxSpin size="small" />
    <CxSpin size="medium" />
    <CxSpin size="large" />
  </div>
</template>

<script>
import { CxSpin } from '@chronixjs/ui-vue2';
export default { components: { CxSpin } };
</script>
```

```tsx [React]
import { CxSpin } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      <CxSpin size="small" />
      <CxSpin size="medium" />
      <CxSpin size="large" />
    </div>
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性          | 类型                             | 默认值      | 说明                 |
| ------------- | -------------------------------- | ----------- | -------------------- |
| `size`        | `'small' \| 'medium' \| 'large'` | `'medium'`  | 加载指示器大小       |
| `show`        | `boolean`                        | `true`      | 切换可见性（不卸载） |
| `description` | `string \| undefined`            | `undefined` | 加载指示器下方文字   |
