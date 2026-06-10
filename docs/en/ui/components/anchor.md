# Anchor

Vertical anchor navigation with optional rail indicator and active link highlighting.

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
  <CxAnchor :items="items" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxAnchor } from '@chronixjs/ui-vue3';

const items = ref([
  { key: 'sec-1', label: 'Section 1', href: '#section-1' },
  { key: 'sec-2', label: 'Section 2', href: '#section-2' },
  { key: 'sec-3', label: 'Section 3', href: '#section-3' },
]);
</script>
```

```vue [Vue 2]
<template>
  <CxAnchor :items="items" />
</template>

<script>
import { CxAnchor } from '@chronixjs/ui-vue2';
export default {
  components: { CxAnchor },
  data() {
    return {
      items: [
        { key: 'sec-1', label: 'Section 1', href: '#section-1' },
        { key: 'sec-2', label: 'Section 2', href: '#section-2' },
        { key: 'sec-3', label: 'Section 3', href: '#section-3' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxAnchor } from '@chronixjs/ui-react';

export function App() {
  const [items] = useState([
    { key: 'sec-1', label: 'Section 1', href: '#section-1' },
    { key: 'sec-2', label: 'Section 2', href: '#section-2' },
    { key: 'sec-3', label: 'Section 3', href: '#section-3' },
  ]);

  return <CxAnchor items={items} />;
}
```

:::

## Without Rail

::: code-group

```vue [Vue 3]
<template>
  <CxAnchor :items="items" :show-rail="false" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxAnchor } from '@chronixjs/ui-vue3';

const items = ref([
  { key: 'a', label: 'Overview', href: '#overview' },
  { key: 'b', label: 'Details', href: '#details' },
]);
</script>
```

```vue [Vue 2]
<template>
  <CxAnchor :items="items" :show-rail="false" />
</template>

<script>
import { CxAnchor } from '@chronixjs/ui-vue2';
export default {
  components: { CxAnchor },
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
import { CxAnchor } from '@chronixjs/ui-react';

export function App() {
  const [items] = useState([
    { key: 'a', label: 'Overview', href: '#overview' },
    { key: 'b', label: 'Details', href: '#details' },
  ]);

  return <CxAnchor items={items} showRail={false} />;
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
