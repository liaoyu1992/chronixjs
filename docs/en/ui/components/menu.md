# Menu

A hierarchical navigation menu with horizontal and vertical modes.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

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

## Horizontal Mode

Use `mode="horizontal"` for a top navigation bar.

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

## Nested Items

Use the `children` array to create sub-menus.

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

## Collapsed

Use `collapsed` to render icon-only mode, ideal for sidebar layouts.

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

## Disabled

Disable individual menu items or the entire menu.

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
