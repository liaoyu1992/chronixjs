# Layout

A page layout system with Header, Sider, Content, and Footer areas.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

A classic page layout with header, sider, content, and footer:

::: code-group

```vue [Vue 3]
<template>
  <CxLayout>
    <CxLayoutHeader>Header</CxLayoutHeader>
    <CxLayout>
      <CxLayoutSider>Sider</CxLayoutSider>
      <CxLayoutContent>Content</CxLayoutContent>
    </CxLayout>
    <CxLayoutFooter>Footer</CxLayoutFooter>
  </CxLayout>
</template>

<script setup lang="ts">
import {
  CxLayout,
  CxLayoutHeader,
  CxLayoutSider,
  CxLayoutContent,
  CxLayoutFooter,
} from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxLayout>
    <CxLayoutHeader>Header</CxLayoutHeader>
    <CxLayout>
      <CxLayoutSider>Sider</CxLayoutSider>
      <CxLayoutContent>Content</CxLayoutContent>
    </CxLayout>
    <CxLayoutFooter>Footer</CxLayoutFooter>
  </CxLayout>
</template>

<script>
import {
  CxLayout,
  CxLayoutHeader,
  CxLayoutSider,
  CxLayoutContent,
  CxLayoutFooter,
} from '@chronixjs/ui-vue2';
export default {
  components: {
    CxLayout,
    CxLayoutHeader,
    CxLayoutSider,
    CxLayoutContent,
    CxLayoutFooter,
  },
};
</script>
```

```tsx [React]
import {
  CxLayout,
  CxLayoutHeader,
  CxLayoutSider,
  CxLayoutContent,
  CxLayoutFooter,
} from '@chronixjs/ui-react';

export function App() {
  return (
    <CxLayout>
      <CxLayoutHeader>Header</CxLayoutHeader>
      <CxLayout>
        <CxLayoutSider>Sider</CxLayoutSider>
        <CxLayoutContent>Content</CxLayoutContent>
      </CxLayout>
      <CxLayoutFooter>Footer</CxLayoutFooter>
    </CxLayout>
  );
}
```

:::

## Collapsible Sider

Use the `collapsible` and `collapsed` props to create a sider that can be toggled:

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

## API Reference

### Layout Props

| Prop       | Type                     | Default    | Description     |
| ---------- | ------------------------ | ---------- | --------------- |
| `hasSider` | `boolean`                | `false`    | Has sider child |
| `position` | `'static' \| 'absolute'` | `'static'` | Position mode   |

### LayoutSider Props

| Prop             | Type                | Default  | Description     |
| ---------------- | ------------------- | -------- | --------------- |
| `width`          | `number \| string`  | `200`    | Expanded width  |
| `collapsedWidth` | `number \| string`  | `48`     | Collapsed width |
| `collapsed`      | `boolean`           | `false`  | Collapsed state |
| `collapsible`    | `boolean`           | `false`  | Show trigger    |
| `placement`      | `'left' \| 'right'` | `'left'` | Sider side      |
