# Empty 空状态

空状态占位组件，包含图标和描述文本。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## 基础用法

使用默认描述的简单空状态：

::: code-group

```vue [Vue 3]
<template>
  <CxEmpty />
</template>

<script setup lang="ts">
import { CxEmpty } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxEmpty />
</template>

<script>
import { CxEmpty } from '@chronixjs/ui-vue2';
export default {
  components: { CxEmpty },
};
</script>
```

```tsx [React]
import { CxEmpty } from '@chronixjs/ui-react';

export function App() {
  return <CxEmpty />;
}
```

:::

## 自定义描述

为空状态设置自定义描述文本：

::: code-group

```vue [Vue 3]
<template>
  <CxEmpty description="No results found" />
</template>

<script setup lang="ts">
import { CxEmpty } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxEmpty description="No results found" />
</template>

<script>
import { CxEmpty } from '@chronixjs/ui-vue2';
export default {
  components: { CxEmpty },
};
</script>
```

```tsx [React]
import { CxEmpty } from '@chronixjs/ui-react';

export function App() {
  return <CxEmpty description="No results found" />;
}
```

:::

## 尺寸

使用 `size` 属性控制空状态的大小：

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; flex-direction: column; gap: 24px;">
    <CxEmpty size="small" description="Small empty" />
    <CxEmpty size="medium" description="Medium empty" />
    <CxEmpty size="large" description="Large empty" />
  </div>
</template>

<script setup lang="ts">
import { CxEmpty } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; flex-direction: column; gap: 24px;">
    <CxEmpty size="small" description="Small empty" />
    <CxEmpty size="medium" description="Medium empty" />
    <CxEmpty size="large" description="Large empty" />
  </div>
</template>

<script>
import { CxEmpty } from '@chronixjs/ui-vue2';
export default {
  components: { CxEmpty },
};
</script>
```

```tsx [React]
import { CxEmpty } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <CxEmpty size="small" description="Small empty" />
      <CxEmpty size="medium" description="Medium empty" />
      <CxEmpty size="large" description="Large empty" />
    </div>
  );
}
```

:::

## API 参考

### 属性 (Props)

| Prop          | 类型                             | 默认值      | 描述       |
| ------------- | -------------------------------- | ----------- | ---------- |
| `size`        | `'small' \| 'medium' \| 'large'` | `'medium'`  | 空状态大小 |
| `description` | `string`                         | `'No data'` | 描述文本   |
