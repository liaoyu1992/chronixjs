# Icon 图标

由中心图标注册表驱动的 SVG 图标组件。

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
  <CxIcon name="check" :size="20" />
</template>

<script setup lang="ts">
import { CxIcon } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxIcon name="check" :size="20" />
</template>

<script>
import { CxIcon } from '@chronixjs/ui-vue2';
export default { components: { CxIcon } };
</script>
```

```tsx [React]
import { CxIcon } from '@chronixjs/ui-react';

export function App() {
  return <CxIcon name="check" size={20} />;
}
```

:::

## 尺寸

使用 `size` 属性以不同尺寸渲染图标。默认尺寸为 `16`。

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; align-items: center; gap: 16px;">
    <CxIcon name="check" :size="16" />
    <span>16px (default)</span>

    <CxIcon name="check" :size="24" />
    <span>24px</span>

    <CxIcon name="check" :size="32" />
    <span>32px</span>
  </div>
</template>

<script setup lang="ts">
import { CxIcon } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; align-items: center; gap: 16px;">
    <CxIcon name="check" :size="16" />
    <span>16px (default)</span>

    <CxIcon name="check" :size="24" />
    <span>24px</span>

    <CxIcon name="check" :size="32" />
    <span>32px</span>
  </div>
</template>

<script>
import { CxIcon } from '@chronixjs/ui-vue2';
export default { components: { CxIcon } };
</script>
```

```tsx [React]
import { CxIcon } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <CxIcon name="check" size={16} />
      <span>16px (default)</span>

      <CxIcon name="check" size={24} />
      <span>24px</span>

      <CxIcon name="check" size={32} />
      <span>32px</span>
    </div>
  );
}
```

:::

## 自定义颜色

使用 `color` 属性或 CSS 自定义属性来更改图标颜色。

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; gap: 12px;">
    <CxIcon name="star" :size="24" color="#f5a623" />
    <CxIcon name="star" :size="24" color="#4caf50" />
    <CxIcon name="star" :size="24" color="#e53935" />
  </div>
</template>

<script setup lang="ts">
import { CxIcon } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; gap: 12px;">
    <CxIcon name="star" :size="24" color="#f5a623" />
    <CxIcon name="star" :size="24" color="#4caf50" />
    <CxIcon name="star" :size="24" color="#e53935" />
  </div>
</template>

<script>
import { CxIcon } from '@chronixjs/ui-vue2';
export default { components: { CxIcon } };
</script>
```

```tsx [React]
import { CxIcon } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <CxIcon name="star" size={24} color="#f5a623" />
      <CxIcon name="star" size={24} color="#4caf50" />
      <CxIcon name="star" size={24} color="#e53935" />
    </div>
  );
}
```

:::

## API 参考

### 属性 (Props)

| Prop    | 类型     | 默认值 | 描述               |
| ------- | -------- | ------ | ------------------ |
| `name`  | `string` | `''`   | 图标注册表名称     |
| `size`  | `number` | `16`   | 图标尺寸（像素）   |
| `color` | `string` | `''`   | 图标颜色（CSS 值） |
