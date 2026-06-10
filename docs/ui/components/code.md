# Code 代码

使用 `<pre><code>` 渲染的代码块组件。v0.1.0 版本暂不支持语法高亮。

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
  <CxCode :value="codeStr" />
</template>

<script setup lang="ts">
import { CxCode } from '@chronixjs/ui-vue3';

const codeStr = 'const greeting = "Hello, Chronix!";\nconsole.log(greeting);';
</script>
```

```vue [Vue 2]
<template>
  <CxCode :value="codeStr" />
</template>

<script>
import { CxCode } from '@chronixjs/ui-vue2';
export default {
  components: { CxCode },
  data() {
    return {
      codeStr: 'const greeting = "Hello, Chronix!";\nconsole.log(greeting);',
    };
  },
};
</script>
```

```tsx [React]
import { CxCode } from '@chronixjs/ui-react';

export function App() {
  const codeStr = 'const greeting = "Hello, Chronix!";\nconsole.log(greeting);';

  return <CxCode value={codeStr} />;
}
```

:::

## 行内代码

::: code-group

```vue [Vue 3]
<template>
  <p>Use <CxCode value="npm install" inline /> to add dependencies.</p>
</template>

<script setup lang="ts">
import { CxCode } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <p>Use <CxCode value="npm install" inline /> to add dependencies.</p>
</template>

<script>
import { CxCode } from '@chronixjs/ui-vue2';
export default { components: { CxCode } };
</script>
```

```tsx [React]
import { CxCode } from '@chronixjs/ui-react';

export function App() {
  return (
    <p>
      Use <CxCode value="npm install" inline /> to add dependencies.
    </p>
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性     | 类型      | 默认值  | 说明                                |
| -------- | --------- | ------- | ----------------------------------- |
| `value`  | `string`  | `''`    | 代码文本内容                        |
| `inline` | `boolean` | `false` | 渲染为行内 `<code>`（不带 `<pre>`） |
