# Icon Wrapper 图标包装器

为任意图标内容提供尺寸和颜色包装。

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
  <CxIconWrapper :size="24" color="#3b82f6">
    <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" /></svg>
  </CxIconWrapper>
</template>

<script setup lang="ts">
import { CxIconWrapper } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxIconWrapper :size="24" color="#3b82f6">
    <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" /></svg>
  </CxIconWrapper>
</template>

<script>
import { CxIconWrapper } from '@chronixjs/ui-vue2';
export default { components: { CxIconWrapper } };
</script>
```

```tsx [React]
import { CxIconWrapper } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxIconWrapper size={24} color="#3b82f6">
      <svg viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" />
      </svg>
    </CxIconWrapper>
  );
}
```

:::

## API 参考

### 属性 (Props)

| Prop    | 类型                  | 默认值      | 描述                           |
| ------- | --------------------- | ----------- | ------------------------------ |
| `size`  | `number`              | `24`        | 宽高（像素）                   |
| `color` | `string \| undefined` | `undefined` | CSS 颜色；未定义时继承父级颜色 |

### 插槽 (Slots)

| Slot      | 描述     |
| --------- | -------- |
| `default` | 图标内容 |
