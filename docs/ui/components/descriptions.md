# Descriptions

Multi-column key-value display for presenting structured data in a grid layout.

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
  <CxDescriptions :items="items" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxDescriptions } from '@chronixjs/ui-vue3';

const items = ref([
  { key: 'name', label: 'Name', value: 'Chronix UI', span: 1 },
  { key: 'version', label: 'Version', value: '0.1.0', span: 1 },
  { key: 'license', label: 'License', value: 'MIT', span: 1 },
]);
</script>
```

```vue [Vue 2]
<template>
  <CxDescriptions :items="items" />
</template>

<script>
import { CxDescriptions } from '@chronixjs/ui-vue2';
export default {
  components: { CxDescriptions },
  data() {
    return {
      items: [
        { key: 'name', label: 'Name', value: 'Chronix UI', span: 1 },
        { key: 'version', label: 'Version', value: '0.1.0', span: 1 },
        { key: 'license', label: 'License', value: 'MIT', span: 1 },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxDescriptions } from '@chronixjs/ui-react';

export function App() {
  const [items] = useState([
    { key: 'name', label: 'Name', value: 'Chronix UI', span: 1 },
    { key: 'version', label: 'Version', value: '0.1.0', span: 1 },
    { key: 'license', label: 'License', value: 'MIT', span: 1 },
  ]);

  return <CxDescriptions items={items} />;
}
```

:::

## Bordered

::: code-group

```vue [Vue 3]
<template>
  <CxDescriptions :items="items" bordered title="User Info" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxDescriptions } from '@chronixjs/ui-vue3';

const items = ref([
  { key: 'user', label: 'Username', value: 'admin', span: 1 },
  { key: 'email', label: 'Email', value: 'admin@example.com', span: 2 },
  { key: 'role', label: 'Role', value: 'Administrator', span: 1 },
]);
</script>
```

```vue [Vue 2]
<template>
  <CxDescriptions :items="items" bordered title="User Info" />
</template>

<script>
import { CxDescriptions } from '@chronixjs/ui-vue2';
export default {
  components: { CxDescriptions },
  data() {
    return {
      items: [
        { key: 'user', label: 'Username', value: 'admin', span: 1 },
        { key: 'email', label: 'Email', value: 'admin@example.com', span: 2 },
        { key: 'role', label: 'Role', value: 'Administrator', span: 1 },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxDescriptions } from '@chronixjs/ui-react';

export function App() {
  const [items] = useState([
    { key: 'user', label: 'Username', value: 'admin', span: 1 },
    { key: 'email', label: 'Email', value: 'admin@example.com', span: 2 },
    { key: 'role', label: 'Role', value: 'Administrator', span: 1 },
  ]);

  return <CxDescriptions items={items} bordered title="User Info" />;
}
```

:::

## Label Placement Top

::: code-group

```vue [Vue 3]
<template>
  <CxDescriptions :items="items" label-placement="top" :columns="2" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxDescriptions } from '@chronixjs/ui-vue3';

const items = ref([
  { key: 'a', label: 'Status', value: 'Running', span: 1 },
  { key: 'b', label: 'Uptime', value: '99.9%', span: 1 },
]);
</script>
```

```vue [Vue 2]
<template>
  <CxDescriptions :items="items" label-placement="top" :columns="2" />
</template>

<script>
import { CxDescriptions } from '@chronixjs/ui-vue2';
export default {
  components: { CxDescriptions },
  data() {
    return {
      items: [
        { key: 'a', label: 'Status', value: 'Running', span: 1 },
        { key: 'b', label: 'Uptime', value: '99.9%', span: 1 },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxDescriptions } from '@chronixjs/ui-react';

export function App() {
  const [items] = useState([
    { key: 'a', label: 'Status', value: 'Running', span: 1 },
    { key: 'b', label: 'Uptime', value: '99.9%', span: 1 },
  ]);

  return <CxDescriptions items={items} labelPlacement="top" columns={2} />;
}
```

:::

## API Reference

### Props

| Prop             | Type                             | Default     | Description                        |
| ---------------- | -------------------------------- | ----------- | ---------------------------------- |
| `items`          | `readonly DescriptionItem[]`     | `[]`        | Array of label-value items         |
| `columns`        | `number`                         | `3`         | Number of grid columns             |
| `bordered`       | `boolean`                        | `false`     | Show table-like borders            |
| `labelPlacement` | `'left' \| 'top'`                | `'left'`    | Position of label within each item |
| `size`           | `'small' \| 'medium' \| 'large'` | `'medium'`  | Padding scale                      |
| `title`          | `string \| undefined`            | `undefined` | Optional header title              |

### DescriptionItem

| Property | Type     | Default | Description                       |
| -------- | -------- | ------- | --------------------------------- |
| `key`    | `string` | —       | Unique key for rendering          |
| `label`  | `string` | —       | Label text                        |
| `value`  | `string` | —       | Value text                        |
| `span`   | `number` | `1`     | Number of columns this item spans |

### Slots

| Slot    | Description                           |
| ------- | ------------------------------------- |
| `title` | Custom title content (overrides prop) |
