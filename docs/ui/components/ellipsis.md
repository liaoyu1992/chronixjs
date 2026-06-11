<script setup>
import EllipsisBasic from './demos/ellipsis/EllipsisBasic.vue';
import ellipsisBasicCode from './demos/ellipsis/EllipsisBasic.vue?raw';
import ellipsisBasicVue2 from './demos/ellipsis/EllipsisBasic.vue2?raw';
import ellipsisBasicReact from './demos/ellipsis/EllipsisBasic.react?raw';
</script>

# Ellipsis 文本省略

文本截断组件，支持原生 HTML `title` 提示和可配置的行数限制。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## 基础用法

<DemoBox title="基础用法" description="使用 lineClamp 限制文本显示行数。" :code="ellipsisBasicCode" :code-vue2="ellipsisBasicVue2" :code-react="ellipsisBasicReact">
  <EllipsisBasic />
</DemoBox>

## 多行省略

::: code-group

```vue [Vue 3]
<template>
  <CxEllipsis :content="longText" :line-clamp="3" />
</template>

<script setup lang="ts">
import { CxEllipsis } from '@chronixjs/ui-vue3';

const longText =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.';
</script>
```

```vue [Vue 2]
<template>
  <CxEllipsis :content="longText" :line-clamp="3" />
</template>

<script>
import { CxEllipsis } from '@chronixjs/ui-vue2';
export default {
  components: { CxEllipsis },
  data() {
    return {
      longText:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
    };
  },
};
</script>
```

```tsx [React]
import { CxEllipsis } from '@chronixjs/ui-react';

export function App() {
  const longText =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.';

  return <CxEllipsis content={longText} lineClamp={3} />;
}
```

:::

## API 参考

### 属性 (Props)

| Prop        | 类型      | 默认值 | 描述                                  |
| ----------- | --------- | ------ | ------------------------------------- |
| `content`   | `string`  | `''`   | 要显示的完整文本                      |
| `tooltip`   | `boolean` | `true` | 是否显示原生 `title` 提示（完整文本） |
| `lineClamp` | `number`  | `1`    | 截断前可见的行数                      |
