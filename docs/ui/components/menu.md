# Menu 菜单

层级式导航菜单，支持水平和垂直模式。

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
  <CxMenu :items="items" v-model:value="active" mode="vertical" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxMenu } from '@chronixjs/ui-vue3';

const active = ref('1');

const items = [
  { key: '1', label: 'Dashboard' },
  { key: '2', label: 'Settings' },
  { key: '3', label: 'About' },
];
</script>
```

```vue [Vue 2]
<template>
  <CxMenu :items="items" :value.sync="active" mode="vertical" />
</template>

<script>
import { CxMenu } from '@chronixjs/ui-vue2';
export default {
  components: { CxMenu },
  data() {
    return {
      active: '1',
      items: [
        { key: '1', label: 'Dashboard' },
        { key: '2', label: 'Settings' },
        { key: '3', label: 'About' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxMenu } from '@chronixjs/ui-react';

const menuItems = [
  { key: '1', label: 'Dashboard' },
  { key: '2', label: 'Settings' },
  { key: '3', label: 'About' },
];

export function App() {
  const [active, setActive] = useState('1');

  return <CxMenu items={menuItems} value={active} onUpdateValue={setActive} mode="vertical" />;
}
```

:::

## 水平模式

使用 `mode="horizontal"` 创建顶部导航栏。

::: code-group

```vue [Vue 3]
<template>
  <CxMenu :items="items" v-model:value="active" mode="horizontal" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxMenu } from '@chronixjs/ui-vue3';

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
  <CxMenu :items="items" :value.sync="active" mode="horizontal" />
</template>

<script>
import { CxMenu } from '@chronixjs/ui-vue2';
export default {
  components: { CxMenu },
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
import { CxMenu } from '@chronixjs/ui-react';

const menuItems = [
  { key: '1', label: 'Home' },
  { key: '2', label: 'Products' },
  { key: '3', label: 'Docs' },
  { key: '4', label: 'Contact' },
];

export function App() {
  const [active, setActive] = useState('1');

  return <CxMenu items={menuItems} value={active} onUpdateValue={setActive} mode="horizontal" />;
}
```

:::

## 嵌套菜单项

使用 `children` 数组创建子菜单。

::: code-group

```vue [Vue 3]
<template>
  <CxMenu :items="items" v-model:value="active" mode="vertical" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxMenu } from '@chronixjs/ui-vue3';

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
  <CxMenu :items="items" :value.sync="active" mode="vertical" />
</template>

<script>
import { CxMenu } from '@chronixjs/ui-vue2';
export default {
  components: { CxMenu },
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
import { CxMenu } from '@chronixjs/ui-react';

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

  return <CxMenu items={menuItems} value={active} onUpdateValue={setActive} mode="vertical" />;
}
```

:::

## 折叠模式

使用 `collapsed` 渲染为仅图标模式，适用于侧边栏布局。

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; gap: 16px;">
    <CxMenu :items="items" v-model:value="active" mode="vertical" collapsed />
    <span>Active: {{ active }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxMenu } from '@chronixjs/ui-vue3';

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
    <CxMenu :items="items" :value.sync="active" mode="vertical" collapsed />
    <span>Active: {{ active }}</span>
  </div>
</template>

<script>
import { CxMenu } from '@chronixjs/ui-vue2';
export default {
  components: { CxMenu },
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
import { CxMenu } from '@chronixjs/ui-react';

const menuItems = [
  { key: '1', label: 'Dashboard', icon: 'home' },
  { key: '2', label: 'Settings', icon: 'settings' },
  { key: '3', label: 'About', icon: 'info' },
];

export function App() {
  const [active, setActive] = useState('1');

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <CxMenu
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
  <CxMenu :items="items" v-model:value="active" mode="vertical" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxMenu } from '@chronixjs/ui-vue3';

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
  <CxMenu :items="items" :value.sync="active" mode="vertical" />
</template>

<script>
import { CxMenu } from '@chronixjs/ui-vue2';
export default {
  components: { CxMenu },
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
import { CxMenu } from '@chronixjs/ui-react';

const menuItems = [
  { key: '1', label: 'Dashboard' },
  { key: '2', label: 'Settings', disabled: true },
  { key: '3', label: 'About' },
];

export function App() {
  const [active, setActive] = useState('1');

  return <CxMenu items={menuItems} value={active} onUpdateValue={setActive} mode="vertical" />;
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
