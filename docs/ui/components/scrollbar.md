# Scrollbar 滚动条

自定义样式的滚动条容器，支持可配置的触发模式。

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
  <CxScrollbar style="height: 200px;">
    <p v-for="i in 20" :key="i">Scrollable content line {{ i }}</p>
  </CxScrollbar>
</template>

<script setup lang="ts">
import { CxScrollbar } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxScrollbar style="height: 200px;">
    <p v-for="i in 20" :key="i">Scrollable content line {{ i }}</p>
  </CxScrollbar>
</template>

<script>
import { CxScrollbar } from '@chronixjs/ui-vue2';
export default { components: { CxScrollbar } };
</script>
```

```tsx [React]
import { CxScrollbar } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxScrollbar style={{ height: 200 }}>
      {Array.from({ length: 20 }, (_, i) => (
        <p key={i}>Scrollable content line {i + 1}</p>
      ))}
    </CxScrollbar>
  );
}
```

:::

## 横向滚动

::: code-group

```vue [Vue 3]
<template>
  <CxScrollbar x-scrollable style="height: 100px;">
    <div style="display: flex; width: 2000px;">
      <div v-for="i in 10" :key="i" style="min-width: 200px;">Panel {{ i }}</div>
    </div>
  </CxScrollbar>
</template>

<script setup lang="ts">
import { CxScrollbar } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxScrollbar x-scrollable style="height: 100px;">
    <div style="display: flex; width: 2000px;">
      <div v-for="i in 10" :key="i" style="min-width: 200px;">Panel {{ i }}</div>
    </div>
  </CxScrollbar>
</template>

<script>
import { CxScrollbar } from '@chronixjs/ui-vue2';
export default { components: { CxScrollbar } };
</script>
```

```tsx [React]
import { CxScrollbar } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxScrollbar xScrollable style={{ height: 100 }}>
      <div style={{ display: 'flex', width: 2000 }}>
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} style={{ minWidth: 200 }}>
            Panel {i + 1}
          </div>
        ))}
      </div>
    </CxScrollbar>
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性          | 类型                | 默认值    | 说明           |
| ------------- | ------------------- | --------- | -------------- |
| `trigger`     | `'hover' \| 'none'` | `'hover'` | 何时显示滚动条 |
| `xScrollable` | `boolean`           | `false`   | 启用横向滚动   |

### 插槽 (Slots)

| 插槽      | 说明       |
| --------- | ---------- |
| `default` | 可滚动内容 |
