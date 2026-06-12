<script setup>
import AnchorBasic from '../../../ui/components/demos/anchor/AnchorBasic.vue';
import anchorBasicCode from '../../../ui/components/demos/anchor/AnchorBasic.vue?raw';
import anchorBasicVue2 from '../../../ui/components/demos/anchor/AnchorBasic.vue2?raw';
import anchorBasicReact from '../../../ui/components/demos/anchor/AnchorBasic.react?raw';
</script>

# Anchor

Vertical anchor navigation with optional rail indicator and active link highlighting.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Basic anchor usage with three anchor links." :code="anchorBasicCode" :code-vue2="anchorBasicVue2" :code-react="anchorBasicReact">
  <AnchorBasic />
</DemoBox>

## Without Rail

::: code-group

```vue [Vue 3]
<template>
  <ChronixAnchor :items="items" :show-rail="false" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ChronixAnchor } from '@chronixjs/ui-vue3';

const items = ref([
  { key: 'a', label: 'Overview', href: '#overview' },
  { key: 'b', label: 'Details', href: '#details' },
]);
</script>
```

```vue [Vue 2]
<template>
  <ChronixAnchor :items="items" :show-rail="false" />
</template>

<script>
import { ChronixAnchor } from '@chronixjs/ui-vue2';
export default {
  components: { ChronixAnchor },
  data() {
    return {
      items: [
        { key: 'a', label: 'Overview', href: '#overview' },
        { key: 'b', label: 'Details', href: '#details' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { ChronixAnchor } from '@chronixjs/ui-react';

export function App() {
  const [items] = useState([
    { key: 'a', label: 'Overview', href: '#overview' },
    { key: 'b', label: 'Details', href: '#details' },
  ]);

  return <ChronixAnchor items={items} showRail={false} />;
}
```

:::

## API Reference

### Props

| Prop             | Type                    | Default | Description                              |
| ---------------- | ----------------------- | ------- | ---------------------------------------- |
| `items`          | `readonly AnchorItem[]` | `[]`    | Array of anchor link items               |
| `showRail`       | `boolean`               | `true`  | Show the vertical rail indicator         |
| `showBackground` | `boolean`               | `true`  | Show background highlight on active link |
| `bound`          | `number`                | `12`    | Offset bound in px for scroll detection  |

### AnchorItem

| Property | Type     | Description                           |
| -------- | -------- | ------------------------------------- |
| `key`    | `string` | Unique identifier                     |
| `label`  | `string` | Display text of the anchor link       |
| `href`   | `string` | Target element selector (e.g. `#foo`) |
