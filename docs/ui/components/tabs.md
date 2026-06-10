# Tabs

A tabbed interface with line, card, and segment variants.

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
  <CxTabs v-model:value="activeTab" :items="items" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxTabs } from '@chronixjs/ui-vue3';

const activeTab = ref('tab1');
const items = [
  { key: 'tab1', label: 'Tab 1', content: 'Content of Tab 1' },
  { key: 'tab2', label: 'Tab 2', content: 'Content of Tab 2' },
  { key: 'tab3', label: 'Tab 3', content: 'Content of Tab 3' },
];
</script>
```

```vue [Vue 2]
<template>
  <CxTabs :value.sync="activeTab" :items="items" />
</template>

<script>
import { CxTabs } from '@chronixjs/ui-vue2';

export default {
  components: { CxTabs },
  data() {
    return {
      activeTab: 'tab1',
      items: [
        { key: 'tab1', label: 'Tab 1', content: 'Content of Tab 1' },
        { key: 'tab2', label: 'Tab 2', content: 'Content of Tab 2' },
        { key: 'tab3', label: 'Tab 3', content: 'Content of Tab 3' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxTabs } from '@chronixjs/ui-react';

const items = [
  { key: 'tab1', label: 'Tab 1', content: 'Content of Tab 1' },
  { key: 'tab2', label: 'Tab 2', content: 'Content of Tab 2' },
  { key: 'tab3', label: 'Tab 3', content: 'Content of Tab 3' },
];

export function App() {
  const [activeTab, setActiveTab] = useState('tab1');

  return <CxTabs value={activeTab} onUpdateValue={setActiveTab} items={items} />;
}
```

:::

## Card Type

Use `type="card"` for a card-style tab bar.

::: code-group

```vue [Vue 3]
<template>
  <CxTabs v-model:value="activeTab" :items="items" type="card" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxTabs } from '@chronixjs/ui-vue3';

const activeTab = ref('tab1');
const items = [
  { key: 'tab1', label: 'Tab 1', content: 'Content of Tab 1' },
  { key: 'tab2', label: 'Tab 2', content: 'Content of Tab 2' },
  { key: 'tab3', label: 'Tab 3', content: 'Content of Tab 3' },
];
</script>
```

```vue [Vue 2]
<template>
  <CxTabs :value.sync="activeTab" :items="items" type="card" />
</template>

<script>
import { CxTabs } from '@chronixjs/ui-vue2';

export default {
  components: { CxTabs },
  data() {
    return {
      activeTab: 'tab1',
      items: [
        { key: 'tab1', label: 'Tab 1', content: 'Content of Tab 1' },
        { key: 'tab2', label: 'Tab 2', content: 'Content of Tab 2' },
        { key: 'tab3', label: 'Tab 3', content: 'Content of Tab 3' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxTabs } from '@chronixjs/ui-react';

const items = [
  { key: 'tab1', label: 'Tab 1', content: 'Content of Tab 1' },
  { key: 'tab2', label: 'Tab 2', content: 'Content of Tab 2' },
  { key: 'tab3', label: 'Tab 3', content: 'Content of Tab 3' },
];

export function App() {
  const [activeTab, setActiveTab] = useState('tab1');

  return <CxTabs value={activeTab} onUpdateValue={setActiveTab} items={items} type="card" />;
}
```

:::

## Segment Type

Use `type="segment"` for a segmented control style.

::: code-group

```vue [Vue 3]
<template>
  <CxTabs v-model:value="activeTab" :items="items" type="segment" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxTabs } from '@chronixjs/ui-vue3';

const activeTab = ref('tab1');
const items = [
  { key: 'tab1', label: 'Tab 1', content: 'Content of Tab 1' },
  { key: 'tab2', label: 'Tab 2', content: 'Content of Tab 2' },
  { key: 'tab3', label: 'Tab 3', content: 'Content of Tab 3' },
];
</script>
```

```vue [Vue 2]
<template>
  <CxTabs :value.sync="activeTab" :items="items" type="segment" />
</template>

<script>
import { CxTabs } from '@chronixjs/ui-vue2';

export default {
  components: { CxTabs },
  data() {
    return {
      activeTab: 'tab1',
      items: [
        { key: 'tab1', label: 'Tab 1', content: 'Content of Tab 1' },
        { key: 'tab2', label: 'Tab 2', content: 'Content of Tab 2' },
        { key: 'tab3', label: 'Tab 3', content: 'Content of Tab 3' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxTabs } from '@chronixjs/ui-react';

const items = [
  { key: 'tab1', label: 'Tab 1', content: 'Content of Tab 1' },
  { key: 'tab2', label: 'Tab 2', content: 'Content of Tab 2' },
  { key: 'tab3', label: 'Tab 3', content: 'Content of Tab 3' },
];

export function App() {
  const [activeTab, setActiveTab] = useState('tab1');

  return <CxTabs value={activeTab} onUpdateValue={setActiveTab} items={items} type="segment" />;
}
```

:::

## Placements

Control where the tab bar appears using `placement`. Supported values are `top`, `right`, `bottom`, and `left`.

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; flex-direction: column; gap: 24px;">
    <CxTabs v-model:value="activeTab" :items="items" placement="left" />
    <CxTabs v-model:value="activeTab" :items="items" placement="bottom" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxTabs } from '@chronixjs/ui-vue3';

const activeTab = ref('tab1');
const items = [
  { key: 'tab1', label: 'Tab 1', content: 'Content of Tab 1' },
  { key: 'tab2', label: 'Tab 2', content: 'Content of Tab 2' },
  { key: 'tab3', label: 'Tab 3', content: 'Content of Tab 3' },
];
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; flex-direction: column; gap: 24px;">
    <CxTabs :value.sync="activeTab" :items="items" placement="left" />
    <CxTabs :value.sync="activeTab" :items="items" placement="bottom" />
  </div>
</template>

<script>
import { CxTabs } from '@chronixjs/ui-vue2';

export default {
  components: { CxTabs },
  data() {
    return {
      activeTab: 'tab1',
      items: [
        { key: 'tab1', label: 'Tab 1', content: 'Content of Tab 1' },
        { key: 'tab2', label: 'Tab 2', content: 'Content of Tab 2' },
        { key: 'tab3', label: 'Tab 3', content: 'Content of Tab 3' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxTabs } from '@chronixjs/ui-react';

const items = [
  { key: 'tab1', label: 'Tab 1', content: 'Content of Tab 1' },
  { key: 'tab2', label: 'Tab 2', content: 'Content of Tab 2' },
  { key: 'tab3', label: 'Tab 3', content: 'Content of Tab 3' },
];

export function App() {
  const [activeTab, setActiveTab] = useState('tab1');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <CxTabs value={activeTab} onUpdateValue={setActiveTab} items={items} placement="left" />
      <CxTabs value={activeTab} onUpdateValue={setActiveTab} items={items} placement="bottom" />
    </div>
  );
}
```

:::

## API Reference

### Props

| Prop        | Type                                     | Default     | Description         |
| ----------- | ---------------------------------------- | ----------- | ------------------- |
| `value`     | `string`                                 | `undefined` | Active tab key      |
| `items`     | `TabItem[]`                              | `[]`        | Tab items           |
| `type`      | `'line' \| 'card' \| 'segment'`          | `'line'`    | Visual variant      |
| `placement` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'top'`     | Tab bar position    |
| `size`      | `'small' \| 'medium' \| 'large'`         | `'medium'`  | Tab size            |
| `disabled`  | `boolean`                                | `false`     | Disable tabs        |
| `addable`   | `boolean`                                | `false`     | Show add button     |
| `draggable` | `boolean`                                | `false`     | Enable drag reorder |

### Events

| Event          | Payload  | Description        |
| -------------- | -------- | ------------------ |
| `update:value` | `string` | Active tab changed |
