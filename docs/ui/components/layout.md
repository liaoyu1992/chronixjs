<script setup>
import LayoutBasic from './demos/layout/LayoutBasic.vue';
import layoutBasicCode from './demos/layout/LayoutBasic.vue?raw';
import layoutBasicVue2 from './demos/layout/LayoutBasic.vue2?raw';
import layoutBasicReact from './demos/layout/LayoutBasic.react?raw';
</script>

# Layout 布局

包含 Header、Sider、Content 和 Footer 区域的页面布局系统。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## 基础用法

<DemoBox title="基础用法" description="包含头部、内容和底部的简单页面布局。" :code="layoutBasicCode" :code-vue2="layoutBasicVue2" :code-react="layoutBasicReact">
  <LayoutBasic />
</DemoBox>

## 可折叠侧边栏

使用 `collapsible` 和 `collapsed` 属性创建可切换的侧边栏：

::: code-group

```vue [Vue 3]
<template>
  <CxLayout>
    <CxLayoutHeader>Header</CxLayoutHeader>
    <CxLayout>
      <CxLayoutSider collapsible :collapsed="collapsed" @update:collapsed="collapsed = $event">
        <p v-if="!collapsed">Sider Content</p>
      </CxLayoutSider>
      <CxLayoutContent>
        <button @click="collapsed = !collapsed">Toggle Sider</button>
        <p>Main Content</p>
      </CxLayoutContent>
    </CxLayout>
  </CxLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxLayout, CxLayoutHeader, CxLayoutSider, CxLayoutContent } from '@chronixjs/ui-vue3';

const collapsed = ref(false);
</script>
```

```vue [Vue 2]
<template>
  <CxLayout>
    <CxLayoutHeader>Header</CxLayoutHeader>
    <CxLayout>
      <CxLayoutSider collapsible :collapsed="collapsed" @update:collapsed="collapsed = $event">
        <p v-if="!collapsed">Sider Content</p>
      </CxLayoutSider>
      <CxLayoutContent>
        <button @click="collapsed = !collapsed">Toggle Sider</button>
        <p>Main Content</p>
      </CxLayoutContent>
    </CxLayout>
  </CxLayout>
</template>

<script>
import { CxLayout, CxLayoutHeader, CxLayoutSider, CxLayoutContent } from '@chronixjs/ui-vue2';
export default {
  components: {
    CxLayout,
    CxLayoutHeader,
    CxLayoutSider,
    CxLayoutContent,
  },
  data() {
    return { collapsed: false };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxLayout, CxLayoutHeader, CxLayoutSider, CxLayoutContent } from '@chronixjs/ui-react';

export function App() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <CxLayout>
      <CxLayoutHeader>Header</CxLayoutHeader>
      <CxLayout>
        <CxLayoutSider collapsible collapsed={collapsed} onUpdateCollapsed={setCollapsed}>
          {!collapsed && <p>Sider Content</p>}
        </CxLayoutSider>
        <CxLayoutContent>
          <button onClick={() => setCollapsed(!collapsed)}>Toggle Sider</button>
          <p>Main Content</p>
        </CxLayoutContent>
      </CxLayout>
    </CxLayout>
  );
}
```

:::

## API 参考

### Layout 属性 (Props)

| Prop       | 类型                     | 默认值     | 描述               |
| ---------- | ------------------------ | ---------- | ------------------ |
| `hasSider` | `boolean`                | `false`    | 是否有侧边栏子元素 |
| `position` | `'static' \| 'absolute'` | `'static'` | 定位模式           |

### LayoutSider 属性 (Props)

| Prop             | 类型                | 默认值   | 描述               |
| ---------------- | ------------------- | -------- | ------------------ |
| `width`          | `number \| string`  | `200`    | 展开时的宽度       |
| `collapsedWidth` | `number \| string`  | `48`     | 折叠时的宽度       |
| `collapsed`      | `boolean`           | `false`  | 折叠状态           |
| `collapsible`    | `boolean`           | `false`  | 是否显示折叠触发器 |
| `placement`      | `'left' \| 'right'` | `'left'` | 侧边栏位置         |
