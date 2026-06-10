# Collapse

An accordion/multi-expand panel list for toggling content visibility.

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
  <CxCollapse :items="items" v-model:value="active" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxCollapse } from '@chronixjs/ui-vue3';

const active = ref<string[]>([]);
const items = [
  { key: '1', title: 'Panel 1', content: 'Content of panel 1' },
  { key: '2', title: 'Panel 2', content: 'Content of panel 2' },
  { key: '3', title: 'Panel 3', content: 'Content of panel 3' },
];
</script>
```

```vue [Vue 2]
<template>
  <CxCollapse :items="items" v-model:value="active" />
</template>

<script>
import { CxCollapse } from '@chronixjs/ui-vue2';

export default {
  components: { CxCollapse },
  data() {
    return {
      active: [],
      items: [
        { key: '1', title: 'Panel 1', content: 'Content of panel 1' },
        { key: '2', title: 'Panel 2', content: 'Content of panel 2' },
        { key: '3', title: 'Panel 3', content: 'Content of panel 3' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxCollapse } from '@chronixjs/ui-react';

const items = [
  { key: '1', title: 'Panel 1', content: 'Content of panel 1' },
  { key: '2', title: 'Panel 2', content: 'Content of panel 2' },
  { key: '3', title: 'Panel 3', content: 'Content of panel 3' },
];

export function App() {
  const [active, setActive] = useState<string[]>([]);

  return <CxCollapse items={items} value={active} onUpdateValue={setActive} />;
}
```

:::

## Accordion Mode

::: code-group

```vue [Vue 3]
<template>
  <CxCollapse :items="items" v-model:value="active" accordion />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxCollapse } from '@chronixjs/ui-vue3';

const active = ref<string>('');
const items = [
  { key: '1', title: 'Panel 1', content: 'Content of panel 1' },
  { key: '2', title: 'Panel 2', content: 'Content of panel 2' },
  { key: '3', title: 'Panel 3', content: 'Content of panel 3' },
];
</script>
```

```vue [Vue 2]
<template>
  <CxCollapse :items="items" v-model:value="active" accordion />
</template>

<script>
import { CxCollapse } from '@chronixjs/ui-vue2';

export default {
  components: { CxCollapse },
  data() {
    return {
      active: '',
      items: [
        { key: '1', title: 'Panel 1', content: 'Content of panel 1' },
        { key: '2', title: 'Panel 2', content: 'Content of panel 2' },
        { key: '3', title: 'Panel 3', content: 'Content of panel 3' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxCollapse } from '@chronixjs/ui-react';

const items = [
  { key: '1', title: 'Panel 1', content: 'Content of panel 1' },
  { key: '2', title: 'Panel 2', content: 'Content of panel 2' },
  { key: '3', title: 'Panel 3', content: 'Content of panel 3' },
];

export function App() {
  const [active, setActive] = useState<string>('');

  return <CxCollapse items={items} value={active} onUpdateValue={setActive} accordion />;
}
```

:::

## Arrow Placement

::: code-group

```vue [Vue 3]
<template>
  <CxCollapse :items="items" v-model:value="active" arrow-placement="right" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxCollapse } from '@chronixjs/ui-vue3';

const active = ref<string[]>([]);
const items = [
  { key: '1', title: 'Panel 1', content: 'Content of panel 1' },
  { key: '2', title: 'Panel 2', content: 'Content of panel 2' },
];
</script>
```

```vue [Vue 2]
<template>
  <CxCollapse :items="items" v-model:value="active" arrow-placement="right" />
</template>

<script>
import { CxCollapse } from '@chronixjs/ui-vue2';

export default {
  components: { CxCollapse },
  data() {
    return {
      active: [],
      items: [
        { key: '1', title: 'Panel 1', content: 'Content of panel 1' },
        { key: '2', title: 'Panel 2', content: 'Content of panel 2' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxCollapse } from '@chronixjs/ui-react';

const items = [
  { key: '1', title: 'Panel 1', content: 'Content of panel 1' },
  { key: '2', title: 'Panel 2', content: 'Content of panel 2' },
];

export function App() {
  const [active, setActive] = useState<string[]>([]);

  return (
    <CxCollapse items={items} value={active} onUpdateValue={setActive} arrowPlacement="right" />
  );
}
```

:::

## API Reference

### Props

| Prop             | Type                 | Default     | Description        |
| ---------------- | -------------------- | ----------- | ------------------ |
| `value`          | `string \| string[]` | `undefined` | Expanded key(s)    |
| `items`          | `CollapseItem[]`     | `[]`        | Panel items        |
| `accordion`      | `boolean`            | `false`     | Single expand mode |
| `arrowPlacement` | `'left' \| 'right'`  | `'left'`    | Arrow side         |

### Events

| Event          | Payload                            | Description             |
| -------------- | ---------------------------------- | ----------------------- |
| `update:value` | `string \| string[]`               | Expanded keys changed   |
| `item-change`  | `(key: string, expanded: boolean)` | Individual item toggled |
