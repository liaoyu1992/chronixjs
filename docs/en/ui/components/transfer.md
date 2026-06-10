# Transfer

A dual-panel transfer component for moving items between source and target lists.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

A transfer with selectable options that can be moved between source and target panels.

::: code-group

```vue [Vue 3]
<template>
  <CxTransfer :options="options" v-model:value="targetValues" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxTransfer } from '@chronixjs/ui-vue3';

const targetValues = ref<(string | number)[]>([]);

const options = [
  { label: 'Option 1', value: '1' },
  { label: 'Option 2', value: '2' },
  { label: 'Option 3', value: '3' },
  { label: 'Option 4', value: '4' },
  { label: 'Option 5', value: '5' },
];
</script>
```

```vue [Vue 2]
<template>
  <CxTransfer :options="options" :value.sync="targetValues" />
</template>

<script>
import { CxTransfer } from '@chronixjs/ui-vue2';

export default {
  components: { CxTransfer },
  data() {
    return {
      targetValues: [],
      options: [
        { label: 'Option 1', value: '1' },
        { label: 'Option 2', value: '2' },
        { label: 'Option 3', value: '3' },
        { label: 'Option 4', value: '4' },
        { label: 'Option 5', value: '5' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxTransfer } from '@chronixjs/ui-react';

const OPTIONS = [
  { label: 'Option 1', value: '1' },
  { label: 'Option 2', value: '2' },
  { label: 'Option 3', value: '3' },
  { label: 'Option 4', value: '4' },
  { label: 'Option 5', value: '5' },
];

export function App() {
  const [targetValues, setTargetValues] = useState<(string | number)[]>([]);

  return <CxTransfer options={OPTIONS} value={targetValues} onUpdateValue={setTargetValues} />;
}
```

:::

## Filterable

Enable search filters on both panels with `filterable` and customize placeholders with `source-filter-placeholder` and `target-filter-placeholder`.

::: code-group

```vue [Vue 3]
<template>
  <CxTransfer
    :options="options"
    v-model:value="targetValues"
    filterable
    source-filter-placeholder="Search source"
    target-filter-placeholder="Search target"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxTransfer } from '@chronixjs/ui-vue3';

const targetValues = ref<(string | number)[]>([]);

const options = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry' },
  { label: 'Date', value: 'date' },
  { label: 'Elderberry', value: 'elderberry' },
  { label: 'Fig', value: 'fig' },
  { label: 'Grape', value: 'grape' },
];
</script>
```

```vue [Vue 2]
<template>
  <CxTransfer
    :options="options"
    :value.sync="targetValues"
    filterable
    source-filter-placeholder="Search source"
    target-filter-placeholder="Search target"
  />
</template>

<script>
import { CxTransfer } from '@chronixjs/ui-vue2';

export default {
  components: { CxTransfer },
  data() {
    return {
      targetValues: [],
      options: [
        { label: 'Apple', value: 'apple' },
        { label: 'Banana', value: 'banana' },
        { label: 'Cherry', value: 'cherry' },
        { label: 'Date', value: 'date' },
        { label: 'Elderberry', value: 'elderberry' },
        { label: 'Fig', value: 'fig' },
        { label: 'Grape', value: 'grape' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxTransfer } from '@chronixjs/ui-react';

const OPTIONS = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry' },
  { label: 'Date', value: 'date' },
  { label: 'Elderberry', value: 'elderberry' },
  { label: 'Fig', value: 'fig' },
  { label: 'Grape', value: 'grape' },
];

export function App() {
  const [targetValues, setTargetValues] = useState<(string | number)[]>([]);

  return (
    <CxTransfer
      options={OPTIONS}
      value={targetValues}
      onUpdateValue={setTargetValues}
      filterable
      sourceFilterPlaceholder="Search source"
      targetFilterPlaceholder="Search target"
    />
  );
}
```

:::

## Custom Titles

Customize the panel titles with `source-title` and `target-title`.

::: code-group

```vue [Vue 3]
<template>
  <CxTransfer
    :options="options"
    v-model:value="targetValues"
    source-title="Available"
    target-title="Selected"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxTransfer } from '@chronixjs/ui-vue3';

const targetValues = ref<(string | number)[]>([]);

const options = [
  { label: 'React', value: 'react' },
  { label: 'Vue', value: 'vue' },
  { label: 'Angular', value: 'angular' },
  { label: 'Svelte', value: 'svelte' },
  { label: 'Solid', value: 'solid' },
];
</script>
```

```vue [Vue 2]
<template>
  <CxTransfer
    :options="options"
    :value.sync="targetValues"
    source-title="Available"
    target-title="Selected"
  />
</template>

<script>
import { CxTransfer } from '@chronixjs/ui-vue2';

export default {
  components: { CxTransfer },
  data() {
    return {
      targetValues: [],
      options: [
        { label: 'React', value: 'react' },
        { label: 'Vue', value: 'vue' },
        { label: 'Angular', value: 'angular' },
        { label: 'Svelte', value: 'svelte' },
        { label: 'Solid', value: 'solid' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxTransfer } from '@chronixjs/ui-react';

const OPTIONS = [
  { label: 'React', value: 'react' },
  { label: 'Vue', value: 'vue' },
  { label: 'Angular', value: 'angular' },
  { label: 'Svelte', value: 'svelte' },
  { label: 'Solid', value: 'solid' },
];

export function App() {
  const [targetValues, setTargetValues] = useState<(string | number)[]>([]);

  return (
    <CxTransfer
      options={OPTIONS}
      value={targetValues}
      onUpdateValue={setTargetValues}
      sourceTitle="Available"
      targetTitle="Selected"
    />
  );
}
```

:::

## API Reference

### Props

| Prop                      | Type                   | Default    | Description               |
| ------------------------- | ---------------------- | ---------- | ------------------------- |
| `value`                   | `(string \| number)[]` | `[]`       | Selected (target) values  |
| `options`                 | `TransferOption[]`     | `[]`       | All available options     |
| `disabled`                | `boolean`              | `false`    | Disable transfer          |
| `filterable`              | `boolean`              | `false`    | Enable search filter      |
| `sourceTitle`             | `string`               | `'Source'` | Source panel title        |
| `targetTitle`             | `string`               | `'Target'` | Target panel title        |
| `sourceFilterPlaceholder` | `string`               | `''`       | Source filter placeholder |
| `targetFilterPlaceholder` | `string`               | `''`       | Target filter placeholder |

### Events

| Event          | Payload                | Description       |
| -------------- | ---------------------- | ----------------- |
| `update:value` | `(string \| number)[]` | Selection changed |
