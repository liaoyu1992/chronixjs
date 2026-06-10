# Breadcrumb

Hierarchical path navigation showing the user's current location within a page hierarchy.

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
  <CxBreadcrumb :items="items" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxBreadcrumb } from '@chronixjs/ui-vue3';

const items = ref([
  { key: 'home', label: 'Home', href: '/', clickable: false },
  { key: 'products', label: 'Products', href: '/products', clickable: true },
  { key: 'detail', label: 'Detail', href: undefined, clickable: false },
]);
</script>
```

```vue [Vue 2]
<template>
  <CxBreadcrumb :items="items" />
</template>

<script>
import { CxBreadcrumb } from '@chronixjs/ui-vue2';
export default {
  components: { CxBreadcrumb },
  data() {
    return {
      items: [
        { key: 'home', label: 'Home', href: '/', clickable: false },
        { key: 'products', label: 'Products', href: '/products', clickable: true },
        { key: 'detail', label: 'Detail', href: undefined, clickable: false },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxBreadcrumb } from '@chronixjs/ui-react';

export function App() {
  const [items] = useState([
    { key: 'home', label: 'Home', href: '/', clickable: false },
    { key: 'products', label: 'Products', href: '/products', clickable: true },
    { key: 'detail', label: 'Detail', href: undefined, clickable: false },
  ]);

  return <CxBreadcrumb items={items} />;
}
```

:::

## Custom Separator

::: code-group

```vue [Vue 3]
<template>
  <CxBreadcrumb :items="items" separator=">" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxBreadcrumb } from '@chronixjs/ui-vue3';

const items = ref([
  { key: 'home', label: 'Home', href: '/', clickable: true },
  { key: 'about', label: 'About', href: undefined, clickable: false },
]);
</script>
```

```vue [Vue 2]
<template>
  <CxBreadcrumb :items="items" separator=">" />
</template>

<script>
import { CxBreadcrumb } from '@chronixjs/ui-vue2';
export default {
  components: { CxBreadcrumb },
  data() {
    return {
      items: [
        { key: 'home', label: 'Home', href: '/', clickable: true },
        { key: 'about', label: 'About', href: undefined, clickable: false },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxBreadcrumb } from '@chronixjs/ui-react';

export function App() {
  const [items] = useState([
    { key: 'home', label: 'Home', href: '/', clickable: true },
    { key: 'about', label: 'About', href: undefined, clickable: false },
  ]);

  return <CxBreadcrumb items={items} separator=">" />;
}
```

:::

## Handling Item Click

::: code-group

```vue [Vue 3]
<template>
  <CxBreadcrumb :items="items" @item-click="onItemClick" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxBreadcrumb } from '@chronixjs/ui-vue3';

const items = ref([
  { key: 'home', label: 'Home', href: '/', clickable: true },
  { key: 'products', label: 'Products', href: '/products', clickable: true },
]);

function onItemClick(item) {
  console.log('Navigating to:', item.label);
}
</script>
```

```vue [Vue 2]
<template>
  <CxBreadcrumb :items="items" @item-click="onItemClick" />
</template>

<script>
import { CxBreadcrumb } from '@chronixjs/ui-vue2';
export default {
  components: { CxBreadcrumb },
  data() {
    return {
      items: [
        { key: 'home', label: 'Home', href: '/', clickable: true },
        { key: 'products', label: 'Products', href: '/products', clickable: true },
      ],
    };
  },
  methods: {
    onItemClick(item) {
      console.log('Navigating to:', item.label);
    },
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxBreadcrumb } from '@chronixjs/ui-react';

export function App() {
  const [items] = useState([
    { key: 'home', label: 'Home', href: '/', clickable: true },
    { key: 'products', label: 'Products', href: '/products', clickable: true },
  ]);

  function onItemClick(item) {
    console.log('Navigating to:', item.label);
  }

  return <CxBreadcrumb items={items} onItemClick={onItemClick} />;
}
```

:::

## API Reference

### Props

| Prop        | Type                        | Default | Description                      |
| ----------- | --------------------------- | ------- | -------------------------------- |
| `items`     | `readonly BreadcrumbItem[]` | `[]`    | Ordered list of breadcrumb items |
| `separator` | `string`                    | `'/'`   | Separator string between items   |

### BreadcrumbItem

| Property    | Type                  | Default     | Description                             |
| ----------- | --------------------- | ----------- | --------------------------------------- |
| `key`       | `string`              | —           | Unique key for rendering                |
| `label`     | `string`              | —           | Display text                            |
| `href`      | `string \| undefined` | `undefined` | When set, renders as `<a>` link         |
| `clickable` | `boolean`             | `false`     | Forces clickability even without `href` |

### Events

| Event        | Payload          | Description                            |
| ------------ | ---------------- | -------------------------------------- |
| `item-click` | `BreadcrumbItem` | Fired when a clickable item is clicked |

### Slots

| Slot        | Description                    |
| ----------- | ------------------------------ |
| `separator` | Custom separator between items |
