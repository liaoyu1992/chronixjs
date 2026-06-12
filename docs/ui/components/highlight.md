<script setup>
import HighlightBasic from './demos/highlight/HighlightBasic.vue';
import highlightBasicCode from './demos/highlight/HighlightBasic.vue?raw';
import highlightBasicVue2 from './demos/highlight/HighlightBasic.vue2?raw';
import highlightBasicReact from './demos/highlight/HighlightBasic.react?raw';
</script>

# Highlight 高亮

将匹配的子字符串用 `<mark>` 元素包裹的文本高亮组件。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## 基础用法

<DemoBox title="基础用法" description="高亮文本中所有匹配的子字符串（默认不区分大小写）。" :code="highlightBasicCode" :code-vue2="highlightBasicVue2" :code-react="highlightBasicReact">
  <HighlightBasic />
</DemoBox>

## 区分大小写

::: code-group

```vue [Vue 3]
<template>
  <CxHighlight value="Vue vue VUE" pattern="Vue" :case-sensitive="true" />
</template>

<script setup lang="ts">
import { CxHighlight } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxHighlight value="Vue vue VUE" pattern="Vue" :case-sensitive="true" />
</template>

<script>
import { CxHighlight } from '@chronixjs/ui-vue2';
export default { components: { CxHighlight } };
</script>
```

```tsx [React]
import { CxHighlight } from '@chronixjs/ui-react';

export function App() {
  return <CxHighlight value="Vue vue VUE" pattern="Vue" caseSensitive={true} />;
}
```

:::

## API 参考

### 属性 (Props)

| Prop            | 类型      | 默认值  | 描述               |
| --------------- | --------- | ------- | ------------------ |
| `value`         | `string`  | `''`    | 完整文本内容       |
| `pattern`       | `string`  | `''`    | 要高亮的子字符串   |
| `caseSensitive` | `boolean` | `false` | 启用区分大小写匹配 |
