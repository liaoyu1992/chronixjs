<script setup>
import MenuBasic from './demos/menu/MenuBasic.vue';
import menuBasicCode from './demos/menu/MenuBasic.vue?raw';
import menuBasicVue2 from './demos/menu/MenuBasic.vue2?raw';
import menuBasicReact from './demos/menu/MenuBasic.react?raw';
</script>

# Menu 菜单

层级式导航菜单，支持水平和垂直模式。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="水平菜单，包含四个导航项。" :code="menuBasicCode" :code-vue2="menuBasicVue2" :code-react="menuBasicReact">
  <MenuBasic />
</DemoBox>

## 水平模式

使用 `mode="horizontal"` 创建顶部导航栏。

::: code-group

```vue [Vue 3]
<template>
  <ChronixMenu :items="items" v-model:value="active" mode="horizontal" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ChronixMenu } from '@chronixjs/ui-vue3';

const active = ref('1');

const items = [
  { key: '1', label: 'Home' },
  { key: '2', label: 'Products' },
  { key: '3', label: 'Docs' },
  { key: '4', label: 'Contact' },
];
</script>
```

```vue [Vue 2]
<template>
  <ChronixMenu :items="items" :value.sync="active" mode="horizontal" />
</template>

<script>
import { ChronixMenu } from '@chronixjs/ui-vue2';
export default {
  components: { ChronixMenu },
  data() {
    return {
      active: '1',
      items: [
        { key: '1', label: 'Home' },
        { key: '2', label: 'Products' },
        { key: '3', label: 'Docs' },
        { key: '4', label: 'Contact' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { ChronixMenu } from '@chronixjs/ui-react';

const menuItems = [
  { key: '1', label: 'Home' },
  { key: '2', label: 'Products' },
  { key: '3', label: 'Docs' },
  { key: '4', label: 'Contact' },
];

export function App() {
  const [active, setActive] = useState('1');

  return (
    <ChronixMenu items={menuItems} value={active} onUpdateValue={setActive} mode="horizontal" />
  );
}
```

:::

## 嵌套菜单项

使用 `children` 数组创建子菜单。

::: code-group

```vue [Vue 3]
<template>
  <ChronixMenu :items="items" v-model:value="active" mode="vertical" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ChronixMenu } from '@chronixjs/ui-vue3';

const active = ref('1');

const items = [
  { key: '1', label: 'Dashboard' },
  {
    key: '2',
    label: 'Settings',
    children: [
      { key: '2-1', label: 'Profile' },
      { key: '2-2', label: 'Security' },
      { key: '2-3', label: 'Notifications' },
    ],
  },
  {
    key: '3',
    label: 'Admin',
    children: [
      { key: '3-1', label: 'Users' },
      { key: '3-2', label: 'Roles' },
    ],
  },
  { key: '4', label: 'About' },
];
</script>
```

```vue [Vue 2]
<template>
  <ChronixMenu :items="items" :value.sync="active" mode="vertical" />
</template>

<script>
import { ChronixMenu } from '@chronixjs/ui-vue2';
export default {
  components: { ChronixMenu },
  data() {
    return {
      active: '1',
      items: [
        { key: '1', label: 'Dashboard' },
        {
          key: '2',
          label: 'Settings',
          children: [
            { key: '2-1', label: 'Profile' },
            { key: '2-2', label: 'Security' },
            { key: '2-3', label: 'Notifications' },
          ],
        },
        {
          key: '3',
          label: 'Admin',
          children: [
            { key: '3-1', label: 'Users' },
            { key: '3-2', label: 'Roles' },
          ],
        },
        { key: '4', label: 'About' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { ChronixMenu } from '@chronixjs/ui-react';

const menuItems = [
  { key: '1', label: 'Dashboard' },
  {
    key: '2',
    label: 'Settings',
    children: [
      { key: '2-1', label: 'Profile' },
      { key: '2-2', label: 'Security' },
      { key: '2-3', label: 'Notifications' },
    ],
  },
  {
    key: '3',
    label: 'Admin',
    children: [
      { key: '3-1', label: 'Users' },
      { key: '3-2', label: 'Roles' },
    ],
  },
  { key: '4', label: 'About' },
];

export function App() {
  const [active, setActive] = useState('1');

  return <ChronixMenu items={menuItems} value={active} onUpdateValue={setActive} mode="vertical" />;
}
```

:::

## 折叠模式

使用 `collapsed` 渲染为仅图标模式，适用于侧边栏布局。

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; gap: 16px;">
    <ChronixMenu :items="items" v-model:value="active" mode="vertical" collapsed />
    <span>Active: {{ active }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ChronixMenu } from '@chronixjs/ui-vue3';

const active = ref('1');

const items = [
  { key: '1', label: 'Dashboard', icon: 'home' },
  { key: '2', label: 'Settings', icon: 'settings' },
  { key: '3', label: 'About', icon: 'info' },
];
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; gap: 16px;">
    <ChronixMenu :items="items" :value.sync="active" mode="vertical" collapsed />
    <span>Active: {{ active }}</span>
  </div>
</template>

<script>
import { ChronixMenu } from '@chronixjs/ui-vue2';
export default {
  components: { ChronixMenu },
  data() {
    return {
      active: '1',
      items: [
        { key: '1', label: 'Dashboard', icon: 'home' },
        { key: '2', label: 'Settings', icon: 'settings' },
        { key: '3', label: 'About', icon: 'info' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { ChronixMenu } from '@chronixjs/ui-react';

const menuItems = [
  { key: '1', label: 'Dashboard', icon: 'home' },
  { key: '2', label: 'Settings', icon: 'settings' },
  { key: '3', label: 'About', icon: 'info' },
];

export function App() {
  const [active, setActive] = useState('1');

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <ChronixMenu
        items={menuItems}
        value={active}
        onUpdateValue={setActive}
        mode="vertical"
        collapsed
      />
      <span>Active: {active}</span>
    </div>
  );
}
```

:::

## 禁用状态

禁用单个菜单项或整个菜单。

::: code-group

```vue [Vue 3]
<template>
  <ChronixMenu :items="items" v-model:value="active" mode="vertical" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ChronixMenu } from '@chronixjs/ui-vue3';

const active = ref('1');

const items = [
  { key: '1', label: 'Dashboard' },
  { key: '2', label: 'Settings', disabled: true },
  { key: '3', label: 'About' },
];
</script>
```

```vue [Vue 2]
<template>
  <ChronixMenu :items="items" :value.sync="active" mode="vertical" />
</template>

<script>
import { ChronixMenu } from '@chronixjs/ui-vue2';
export default {
  components: { ChronixMenu },
  data() {
    return {
      active: '1',
      items: [
        { key: '1', label: 'Dashboard' },
        { key: '2', label: 'Settings', disabled: true },
        { key: '3', label: 'About' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { ChronixMenu } from '@chronixjs/ui-react';

const menuItems = [
  { key: '1', label: 'Dashboard' },
  { key: '2', label: 'Settings', disabled: true },
  { key: '3', label: 'About' },
];

export function App() {
  const [active, setActive] = useState('1');

  return <ChronixMenu items={menuItems} value={active} onUpdateValue={setActive} mode="vertical" />;
}
```

:::

## API 参考

### 属性 (Props)

| Prop        | 类型                         | 默认值       | 描述             |
| ----------- | ---------------------------- | ------------ | ---------------- |
| `value`     | `string`                     | `undefined`  | 当前激活项的 key |
| `items`     | `MenuItem[]`                 | `[]`         | 菜单树形数据     |
| `mode`      | `'horizontal' \| 'vertical'` | `'vertical'` | 布局模式         |
| `collapsed` | `boolean`                    | `false`      | 仅图标模式       |
| `disabled`  | `boolean`                    | `false`      | 禁用整个菜单     |

### 事件 (Events)

| Event          | Payload    | 描述             |
| -------------- | ---------- | ---------------- |
| `update:value` | `string`   | 激活项变化时触发 |
| `select`       | `MenuItem` | 选中菜单项时触发 |

### MenuItem

| Property   | 类型         | 默认值      | 描述           |
| ---------- | ------------ | ----------- | -------------- |
| `key`      | `string`     | (必需)      | 唯一标识       |
| `label`    | `string`     | `''`        | 显示标签       |
| `icon`     | `string`     | `undefined` | 图标注册表名称 |
| `disabled` | `boolean`    | `false`     | 是否禁用该项   |
| `children` | `MenuItem[]` | `undefined` | 嵌套子菜单项   |
