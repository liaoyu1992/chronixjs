<script setup>
import MenuBasic from '../../../ui/components/demos/menu/MenuBasic.vue';
import menuBasicCode from '../../../ui/components/demos/menu/MenuBasic.vue?raw';
import menuBasicVue2 from '../../../ui/components/demos/menu/MenuBasic.vue2?raw';
import menuBasicReact from '../../../ui/components/demos/menu/MenuBasic.react?raw';
</script>

# Menu

A hierarchical navigation menu with horizontal and vertical modes.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Horizontal menu with four navigation items." :code="menuBasicCode" :code-vue2="menuBasicVue2" :code-react="menuBasicReact">
  <MenuBasic />
</DemoBox>

## Horizontal Mode

Use `mode="horizontal"` for a top navigation bar.

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

## Nested Items

Use the `children` array to create sub-menus.

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

## Collapsed

Use `collapsed` to render icon-only mode, ideal for sidebar layouts.

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

## Disabled

Disable individual menu items or the entire menu.

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

## API Reference

### Props

| Prop        | Type                         | Default      | Description         |
| ----------- | ---------------------------- | ------------ | ------------------- |
| `value`     | `string`                     | `undefined`  | Active item key     |
| `items`     | `MenuItem[]`                 | `[]`         | Menu tree items     |
| `mode`      | `'horizontal' \| 'vertical'` | `'vertical'` | Layout mode         |
| `collapsed` | `boolean`                    | `false`      | Icon-only mode      |
| `disabled`  | `boolean`                    | `false`      | Disable entire menu |

### Events

| Event          | Payload    | Description         |
| -------------- | ---------- | ------------------- |
| `update:value` | `string`   | Active item changed |
| `select`       | `MenuItem` | Item selected       |

### MenuItem

| Property   | Type         | Default     | Description           |
| ---------- | ------------ | ----------- | --------------------- |
| `key`      | `string`     | (required)  | Unique item key       |
| `label`    | `string`     | `''`        | Display label         |
| `icon`     | `string`     | `undefined` | Icon registry name    |
| `disabled` | `boolean`    | `false`     | Disable this item     |
| `children` | `MenuItem[]` | `undefined` | Nested sub-menu items |
