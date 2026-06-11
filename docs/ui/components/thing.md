<script setup>
import ThingBasic from './demos/thing/ThingBasic.vue';
import thingBasicCode from './demos/thing/ThingBasic.vue?raw';
import thingBasicVue2 from './demos/thing/ThingBasic.vue2?raw';
import thingBasicReact from './demos/thing/ThingBasic.react?raw';
</script>

# Thing 事物卡片

组合式卡片，包含头像 + 头部（标题 + 额外内容）+ 描述 + 内容 + 操作 + 页脚插槽。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="带标题和描述的事物卡片。" :code="thingBasicCode" :code-vue2="thingBasicVue2" :code-react="thingBasicReact">
  <ThingBasic />
</DemoBox>

## 带头像和操作

::: code-group

```vue [Vue 3]
<template>
  <CxThing title="Jane Doe" description="Frontend Engineer at Chronix">
    <template #avatar>
      <span style="font-size: 24px;">👤</span>
    </template>
    <template #action>
      <button>Follow</button>
    </template>
    <p>Building framework-agnostic component libraries for the modern web.</p>
  </CxThing>
</template>

<script setup lang="ts">
import { CxThing } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxThing title="Jane Doe" description="Frontend Engineer at Chronix">
    <template slot="avatar">
      <span style="font-size: 24px;">👤</span>
    </template>
    <template slot="action">
      <button>Follow</button>
    </template>
    <p>Building framework-agnostic component libraries for the modern web.</p>
  </CxThing>
</template>

<script>
import { CxThing } from '@chronixjs/ui-vue2';
export default { components: { CxThing } };
</script>
```

```tsx [React]
import { CxThing } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxThing
      title="Jane Doe"
      description="Frontend Engineer at Chronix"
      avatar={<span style={{ fontSize: 24 }}>👤</span>}
      action={<button>Follow</button>}
    >
      <p>Building framework-agnostic component libraries for the modern web.</p>
    </CxThing>
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性              | 类型                  | 默认值      | 说明                     |
| ----------------- | --------------------- | ----------- | ------------------------ |
| `title`           | `string \| undefined` | `undefined` | 头部标题文本             |
| `description`     | `string \| undefined` | `undefined` | 次要描述文本             |
| `contentIndented` | `boolean`             | `false`     | 主体内容缩进至头像列之后 |

### 插槽 (Slots)

| 插槽           | 说明                   |
| -------------- | ---------------------- |
| `default`      | 主体内容               |
| `avatar`       | 左侧头像 / 图标        |
| `header`       | 自定义头部（覆盖标题） |
| `header-extra` | 右对齐的头部内容       |
| `description`  | 自定义描述（覆盖属性） |
| `action`       | 交互操作行（按钮等）   |
| `footer`       | 页脚区域               |
