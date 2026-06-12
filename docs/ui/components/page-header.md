<script setup>
import PageHeaderBasic from './demos/page-header/PageHeaderBasic.vue';
import pageHeaderBasicCode from './demos/page-header/PageHeaderBasic.vue?raw';
import pageHeaderBasicVue2 from './demos/page-header/PageHeaderBasic.vue2?raw';
import pageHeaderBasicReact from './demos/page-header/PageHeaderBasic.react?raw';
</script>

# Page Header 页头

标准化的页面顶部标题块，支持可选的返回按钮、头像、标题、副标题、额外操作区域和页脚。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="带标题、副标题和返回按钮的页头。" :code="pageHeaderBasicCode" :code-vue2="pageHeaderBasicVue2" :code-react="pageHeaderBasicReact">
  <PageHeaderBasic />
</DemoBox>

## 带返回按钮和额外区域

::: code-group

```vue [Vue 3]
<template>
  <CxPageHeader title="User Profile" subtitle="Edit your settings" back @back="onBack">
    <template #extra>
      <button>Save</button>
    </template>
  </CxPageHeader>
</template>

<script setup lang="ts">
import { CxPageHeader } from '@chronixjs/ui-vue3';

function onBack() {
  console.log('Navigate back');
}
</script>
```

```vue [Vue 2]
<template>
  <CxPageHeader title="User Profile" subtitle="Edit your settings" back @back="onBack">
    <template slot="extra">
      <button>Save</button>
    </template>
  </CxPageHeader>
</template>

<script>
import { CxPageHeader } from '@chronixjs/ui-vue2';
export default {
  components: { CxPageHeader },
  methods: {
    onBack() {
      console.log('Navigate back');
    },
  },
};
</script>
```

```tsx [React]
import { CxPageHeader } from '@chronixjs/ui-react';

export function App() {
  function onBack() {
    console.log('Navigate back');
  }

  return (
    <CxPageHeader
      title="User Profile"
      subtitle="Edit your settings"
      back
      onBack={onBack}
      extra={<button>Save</button>}
    />
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性       | 类型                  | 默认值      | 说明                 |
| ---------- | --------------------- | ----------- | -------------------- |
| `title`    | `string \| undefined` | `undefined` | 标题文本             |
| `subtitle` | `string \| undefined` | `undefined` | 副标题文本           |
| `back`     | `boolean`             | `false`     | 显示返回按钮         |
| `inverted` | `boolean`             | `false`     | 使用深色表面主题令牌 |

### 事件 (Events)

| 事件   | 载荷 | 说明               |
| ------ | ---- | ------------------ |
| `back` | —    | 点击返回按钮时触发 |

### 插槽 (Slots)

| 插槽       | 说明                     |
| ---------- | ------------------------ |
| `default`  | 主内容区域               |
| `back`     | 自定义返回按钮内容       |
| `avatar`   | 头像区域                 |
| `title`    | 自定义标题（覆盖属性）   |
| `subtitle` | 自定义副标题（覆盖属性） |
| `extra`    | 右对齐的操作区域         |
| `footer`   | 页脚区域                 |
