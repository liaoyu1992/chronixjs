# Dynamic Input

Dynamic list of input values where the user can add or remove items.

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
  <CxDynamicInput v-model:value="items" placeholder="Enter value" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxDynamicInput } from '@chronixjs/ui-vue3';

const items = ref<string[]>(['Item 1', 'Item 2']);
</script>
```

```vue [Vue 2]
<template>
  <CxDynamicInput :value.sync="items" placeholder="Enter value" />
</template>

<script>
import { CxDynamicInput } from '@chronixjs/ui-vue2';
export default {
  components: { CxDynamicInput },
  data() {
    return { items: ['Item 1', 'Item 2'] };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxDynamicInput } from '@chronixjs/ui-react';

export function App() {
  const [items, setItems] = useState<string[]>(['Item 1', 'Item 2']);

  return <CxDynamicInput value={items} onUpdateValue={setItems} placeholder="Enter value" />;
}
```

:::

## API Reference

### Props

| Prop          | Type                  | Default     | Description                |
| ------------- | --------------------- | ----------- | -------------------------- |
| `value`       | `readonly unknown[]`  | `[]`        | Array of values            |
| `min`         | `number`              | `0`         | Minimum number of items    |
| `max`         | `number \| undefined` | `undefined` | Maximum number of items    |
| `disabled`    | `boolean`             | `false`     | Disable all inputs         |
| `placeholder` | `string`              | `''`        | Placeholder for each input |

### Events

| Event          | Payload     | Description             |
| -------------- | ----------- | ----------------------- |
| `update:value` | `unknown[]` | Fires when items change |
