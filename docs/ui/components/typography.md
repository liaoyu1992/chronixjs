# Typography 排版

用于渲染标题、段落、引用和文本的排版组件，带有样式控制。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## 基础用法

### 纯文本

默认渲染为 `<span>`：

::: code-group

```vue [Vue 3]
<template>
  <CxTypography>Hello, world!</CxTypography>
</template>

<script setup lang="ts">
import { CxTypography } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxTypography>Hello, world!</CxTypography>
</template>

<script>
import { CxTypography } from '@chronixjs/ui-vue2';
export default { components: { CxTypography } };
</script>
```

```tsx [React]
import { CxTypography } from '@chronixjs/ui-react';

export function App() {
  return <CxTypography>Hello, world!</CxTypography>;
}
```

:::

### 标题

设置 `variant="title"` 和 `level`（1-6）来渲染 `<h1>` 到 `<h6>`：

::: code-group

```vue [Vue 3]
<template>
  <CxTypography variant="title" :level="1">Heading 1</CxTypography>
  <CxTypography variant="title" :level="2">Heading 2</CxTypography>
  <CxTypography variant="title" :level="3">Heading 3</CxTypography>
</template>

<script setup lang="ts">
import { CxTypography } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxTypography variant="title" :level="1">Heading 1</CxTypography>
  <CxTypography variant="title" :level="2">Heading 2</CxTypography>
  <CxTypography variant="title" :level="3">Heading 3</CxTypography>
</template>

<script>
import { CxTypography } from '@chronixjs/ui-vue2';
export default { components: { CxTypography } };
</script>
```

```tsx [React]
import { CxTypography } from '@chronixjs/ui-react';

export function App() {
  return (
    <>
      <CxTypography variant="title" level={1}>
        Heading 1
      </CxTypography>
      <CxTypography variant="title" level={2}>
        Heading 2
      </CxTypography>
      <CxTypography variant="title" level={3}>
        Heading 3
      </CxTypography>
    </>
  );
}
```

:::

### 段落

::: code-group

```vue [Vue 3]
<template>
  <CxTypography variant="p">
    This is a paragraph of text that can wrap across multiple lines.
  </CxTypography>
</template>

<script setup lang="ts">
import { CxTypography } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxTypography variant="p">
    This is a paragraph of text that can wrap across multiple lines.
  </CxTypography>
</template>

<script>
import { CxTypography } from '@chronixjs/ui-vue2';
export default { components: { CxTypography } };
</script>
```

```tsx [React]
import { CxTypography } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxTypography variant="p">
      This is a paragraph of text that can wrap across multiple lines.
    </CxTypography>
  );
}
```

:::

## 引用

::: code-group

```vue [Vue 3]
<template>
  <CxTypography variant="blockquote">
    The only way to do great work is to love what you do.
  </CxTypography>
</template>

<script setup lang="ts">
import { CxTypography } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxTypography variant="blockquote">
    The only way to do great work is to love what you do.
  </CxTypography>
</template>

<script>
import { CxTypography } from '@chronixjs/ui-vue2';
export default { components: { CxTypography } };
</script>
```

```tsx [React]
import { CxTypography } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxTypography variant="blockquote">
      The only way to do great work is to love what you do.
    </CxTypography>
  );
}
```

:::

## 分割线

渲染为 `<hr>` 分隔符：

::: code-group

```vue [Vue 3]
<template>
  <CxTypography variant="hr" />
</template>

<script setup lang="ts">
import { CxTypography } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxTypography variant="hr" />
</template>

<script>
import { CxTypography } from '@chronixjs/ui-vue2';
export default { components: { CxTypography } };
</script>
```

```tsx [React]
import { CxTypography } from '@chronixjs/ui-react';

export function App() {
  return <CxTypography variant="hr" />;
}
```

:::

## 样式修饰

对任意变体应用斜体和下划线样式：

::: code-group

```vue [Vue 3]
<template>
  <CxTypography italic>Italic text</CxTypography>
  <CxTypography underline>Underlined text</CxTypography>
  <CxTypography italic underline>Italic & underlined</CxTypography>
</template>

<script setup lang="ts">
import { CxTypography } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxTypography italic>Italic text</CxTypography>
  <CxTypography underline>Underlined text</CxTypography>
  <CxTypography italic underline>Italic & underlined</CxTypography>
</template>

<script>
import { CxTypography } from '@chronixjs/ui-vue2';
export default { components: { CxTypography } };
</script>
```

```tsx [React]
import { CxTypography } from '@chronixjs/ui-react';

export function App() {
  return (
    <>
      <CxTypography italic>Italic text</CxTypography>
      <CxTypography underline>Underlined text</CxTypography>
      <CxTypography italic underline>
        Italic &amp; underlined
      </CxTypography>
    </>
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性        | 类型                                               | 默认值   | 说明                            |
| ----------- | -------------------------------------------------- | -------- | ------------------------------- |
| `variant`   | `'text' \| 'title' \| 'p' \| 'blockquote' \| 'hr'` | `'text'` | 渲染的 HTML 元素                |
| `level`     | `1 \| 2 \| 3 \| 4 \| 5 \| 6`                       | `1`      | 标题级别（仅 `title` 变体可用） |
| `italic`    | `boolean`                                          | `false`  | 应用斜体样式                    |
| `underline` | `boolean`                                          | `false`  | 应用下划线样式                  |

### 插槽 (Slots)

| 插槽      | 说明                            |
| --------- | ------------------------------- |
| `default` | 要显示的内容（`hr` 变体时忽略） |

### 元素映射

| `variant`    | HTML 元素      |
| ------------ | -------------- |
| `text`       | `<span>`       |
| `title`      | `<h{level}>`   |
| `p`          | `<p>`          |
| `blockquote` | `<blockquote>` |
| `hr`         | `<hr>`         |
