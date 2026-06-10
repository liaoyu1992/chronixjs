# Divider 分割线

带有可选标题的可视分割线。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## 基础用法

内容块之间的简单水平分割线。

::: code-group

```vue [Vue 3]
<template>
  <div>
    <p>Content above the divider.</p>
    <CxDivider />
    <p>Content below the divider.</p>
  </div>
</template>

<script setup lang="ts">
import { CxDivider } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div>
    <p>Content above the divider.</p>
    <CxDivider />
    <p>Content below the divider.</p>
  </div>
</template>

<script>
import { CxDivider } from '@chronixjs/ui-vue2';

export default {
  components: { CxDivider },
};
</script>
```

```tsx [React]
import { CxDivider } from '@chronixjs/ui-react';

export function App() {
  return (
    <div>
      <p>Content above the divider.</p>
      <CxDivider />
      <p>Content below the divider.</p>
    </div>
  );
}
```

:::

## 带标题

通过默认插槽在分割线中放置文本。使用 `title-placement` 控制对齐方式。

### 左对齐

::: code-group

```vue [Vue 3]
<template>
  <div>
    <p>Section A content.</p>
    <CxDivider title-placement="left">Section B</CxDivider>
    <p>Section B content.</p>
  </div>
</template>

<script setup lang="ts">
import { CxDivider } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div>
    <p>Section A content.</p>
    <CxDivider title-placement="left">Section B</CxDivider>
    <p>Section B content.</p>
  </div>
</template>

<script>
import { CxDivider } from '@chronixjs/ui-vue2';

export default {
  components: { CxDivider },
};
</script>
```

```tsx [React]
import { CxDivider } from '@chronixjs/ui-react';

export function App() {
  return (
    <div>
      <p>Section A content.</p>
      <CxDivider titlePlacement="left">Section B</CxDivider>
      <p>Section B content.</p>
    </div>
  );
}
```

:::

### 居中

::: code-group

```vue [Vue 3]
<template>
  <div>
    <p>Section A content.</p>
    <CxDivider title-placement="center">Details</CxDivider>
    <p>Details content.</p>
  </div>
</template>

<script setup lang="ts">
import { CxDivider } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div>
    <p>Section A content.</p>
    <CxDivider title-placement="center">Details</CxDivider>
    <p>Details content.</p>
  </div>
</template>

<script>
import { CxDivider } from '@chronixjs/ui-vue2';

export default {
  components: { CxDivider },
};
</script>
```

```tsx [React]
import { CxDivider } from '@chronixjs/ui-react';

export function App() {
  return (
    <div>
      <p>Section A content.</p>
      <CxDivider titlePlacement="center">Details</CxDivider>
      <p>Details content.</p>
    </div>
  );
}
```

:::

### 右对齐

::: code-group

```vue [Vue 3]
<template>
  <div>
    <p>Main content.</p>
    <CxDivider title-placement="right">Extras</CxDivider>
    <p>Extra content.</p>
  </div>
</template>

<script setup lang="ts">
import { CxDivider } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div>
    <p>Main content.</p>
    <CxDivider title-placement="right">Extras</CxDivider>
    <p>Extra content.</p>
  </div>
</template>

<script>
import { CxDivider } from '@chronixjs/ui-vue2';

export default {
  components: { CxDivider },
};
</script>
```

```tsx [React]
import { CxDivider } from '@chronixjs/ui-react';

export function App() {
  return (
    <div>
      <p>Main content.</p>
      <CxDivider titlePlacement="right">Extras</CxDivider>
      <p>Extra content.</p>
    </div>
  );
}
```

:::

## 垂直分割

使用 `vertical` 属性在行内元素之间渲染垂直分割线。

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; align-items: center; gap: 8px;">
    <span>Link A</span>
    <CxDivider vertical />
    <span>Link B</span>
    <CxDivider vertical />
    <span>Link C</span>
  </div>
</template>

<script setup lang="ts">
import { CxDivider } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; align-items: center; gap: 8px;">
    <span>Link A</span>
    <CxDivider vertical />
    <span>Link B</span>
    <CxDivider vertical />
    <span>Link C</span>
  </div>
</template>

<script>
import { CxDivider } from '@chronixjs/ui-vue2';

export default {
  components: { CxDivider },
};
</script>
```

```tsx [React]
import { CxDivider } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span>Link A</span>
      <CxDivider vertical />
      <span>Link B</span>
      <CxDivider vertical />
      <span>Link C</span>
    </div>
  );
}
```

:::

## 虚线

使用 `dashed` 属性渲染虚线而非实线。

::: code-group

```vue [Vue 3]
<template>
  <div>
    <p>Content above.</p>
    <CxDivider dashed />
    <p>Content below.</p>
  </div>
</template>

<script setup lang="ts">
import { CxDivider } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div>
    <p>Content above.</p>
    <CxDivider dashed />
    <p>Content below.</p>
  </div>
</template>

<script>
import { CxDivider } from '@chronixjs/ui-vue2';

export default {
  components: { CxDivider },
};
</script>
```

```tsx [React]
import { CxDivider } from '@chronixjs/ui-react';

export function App() {
  return (
    <div>
      <p>Content above.</p>
      <CxDivider dashed />
      <p>Content below.</p>
    </div>
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性             | 类型                            | 默认值     | 说明       |
| ---------------- | ------------------------------- | ---------- | ---------- |
| `vertical`       | `boolean`                       | `false`    | 垂直分割线 |
| `titlePlacement` | `'left' \| 'center' \| 'right'` | `'center'` | 标题位置   |
| `dashed`         | `boolean`                       | `false`    | 虚线样式   |

### 插槽 (Slots)

| 插槽      | 说明           |
| --------- | -------------- |
| `default` | 分割线标题内容 |
