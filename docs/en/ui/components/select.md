# Select

A full-featured dropdown selector with single/multi, filtering, and virtual scrolling.

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
  <CxSelect :options="options" v-model:value="selected" placeholder="Select..." />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxSelect } from '@chronixjs/ui-vue3';

const selected = ref<string | undefined>(undefined);

const options = [
  { key: '1', label: 'Option A', value: 'a' },
  { key: '2', label: 'Option B', value: 'b' },
  { key: '3', label: 'Option C', value: 'c' },
];
</script>
```

```vue [Vue 2]
<template>
  <CxSelect :options="options" :value.sync="selected" placeholder="Select..." />
</template>

<script>
import { CxSelect } from '@chronixjs/ui-vue2';
export default {
  components: { CxSelect },
  data() {
    return {
      selected: undefined,
      options: [
        { key: '1', label: 'Option A', value: 'a' },
        { key: '2', label: 'Option B', value: 'b' },
        { key: '3', label: 'Option C', value: 'c' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxSelect } from '@chronixjs/ui-react';

const OPTIONS = [
  { key: '1', label: 'Option A', value: 'a' },
  { key: '2', label: 'Option B', value: 'b' },
  { key: '3', label: 'Option C', value: 'c' },
];

export function App() {
  const [selected, setSelected] = useState<string | undefined>(undefined);

  return (
    <CxSelect
      options={OPTIONS}
      value={selected}
      onUpdateValue={setSelected}
      placeholder="Select..."
    />
  );
}
```

:::

## Multiple Selection

Use the `multiple` prop to allow selecting more than one value. The bound value becomes a string array.

::: code-group

```vue [Vue 3]
<template>
  <CxSelect :options="options" v-model:value="selected" multiple placeholder="Pick several..." />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxSelect } from '@chronixjs/ui-vue3';

const selected = ref<string[]>([]);

const options = [
  { key: '1', label: 'Red', value: 'red' },
  { key: '2', label: 'Green', value: 'green' },
  { key: '3', label: 'Blue', value: 'blue' },
  { key: '4', label: 'Yellow', value: 'yellow' },
];
</script>
```

```vue [Vue 2]
<template>
  <CxSelect :options="options" :value.sync="selected" multiple placeholder="Pick several..." />
</template>

<script>
import { CxSelect } from '@chronixjs/ui-vue2';
export default {
  components: { CxSelect },
  data() {
    return {
      selected: [],
      options: [
        { key: '1', label: 'Red', value: 'red' },
        { key: '2', label: 'Green', value: 'green' },
        { key: '3', label: 'Blue', value: 'blue' },
        { key: '4', label: 'Yellow', value: 'yellow' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxSelect } from '@chronixjs/ui-react';

const OPTIONS = [
  { key: '1', label: 'Red', value: 'red' },
  { key: '2', label: 'Green', value: 'green' },
  { key: '3', label: 'Blue', value: 'blue' },
  { key: '4', label: 'Yellow', value: 'yellow' },
];

export function App() {
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <CxSelect
      options={OPTIONS}
      value={selected}
      onUpdateValue={setSelected}
      multiple
      placeholder="Pick several..."
    />
  );
}
```

:::

## Filterable

Enable the `filterable` prop to allow users to search through the option list.

::: code-group

```vue [Vue 3]
<template>
  <CxSelect :options="options" v-model:value="selected" filterable placeholder="Search..." />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxSelect } from '@chronixjs/ui-vue3';

const selected = ref<string | undefined>(undefined);

const options = [
  { key: '1', label: 'Apple', value: 'apple' },
  { key: '2', label: 'Banana', value: 'banana' },
  { key: '3', label: 'Cherry', value: 'cherry' },
  { key: '4', label: 'Durian', value: 'durian' },
  { key: '5', label: 'Elderberry', value: 'elderberry' },
];
</script>
```

```vue [Vue 2]
<template>
  <CxSelect :options="options" :value.sync="selected" filterable placeholder="Search..." />
</template>

<script>
import { CxSelect } from '@chronixjs/ui-vue2';
export default {
  components: { CxSelect },
  data() {
    return {
      selected: undefined,
      options: [
        { key: '1', label: 'Apple', value: 'apple' },
        { key: '2', label: 'Banana', value: 'banana' },
        { key: '3', label: 'Cherry', value: 'cherry' },
        { key: '4', label: 'Durian', value: 'durian' },
        { key: '5', label: 'Elderberry', value: 'elderberry' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxSelect } from '@chronixjs/ui-react';

const OPTIONS = [
  { key: '1', label: 'Apple', value: 'apple' },
  { key: '2', label: 'Banana', value: 'banana' },
  { key: '3', label: 'Cherry', value: 'cherry' },
  { key: '4', label: 'Durian', value: 'durian' },
  { key: '5', label: 'Elderberry', value: 'elderberry' },
];

export function App() {
  const [selected, setSelected] = useState<string | undefined>(undefined);

  return (
    <CxSelect
      options={OPTIONS}
      value={selected}
      onUpdateValue={setSelected}
      filterable
      placeholder="Search..."
    />
  );
}
```

:::

## Clearable

Add `clearable` to let users reset the selection with a clear icon.

::: code-group

```vue [Vue 3]
<template>
  <CxSelect
    :options="options"
    v-model:value="selected"
    clearable
    placeholder="Select and clear..."
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxSelect } from '@chronixjs/ui-vue3';

const selected = ref<string | undefined>(undefined);

const options = [
  { key: '1', label: 'Option A', value: 'a' },
  { key: '2', label: 'Option B', value: 'b' },
  { key: '3', label: 'Option C', value: 'c' },
];
</script>
```

```vue [Vue 2]
<template>
  <CxSelect :options="options" :value.sync="selected" clearable placeholder="Select and clear..." />
</template>

<script>
import { CxSelect } from '@chronixjs/ui-vue2';
export default {
  components: { CxSelect },
  data() {
    return {
      selected: undefined,
      options: [
        { key: '1', label: 'Option A', value: 'a' },
        { key: '2', label: 'Option B', value: 'b' },
        { key: '3', label: 'Option C', value: 'c' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxSelect } from '@chronixjs/ui-react';

const OPTIONS = [
  { key: '1', label: 'Option A', value: 'a' },
  { key: '2', label: 'Option B', value: 'b' },
  { key: '3', label: 'Option C', value: 'c' },
];

export function App() {
  const [selected, setSelected] = useState<string | undefined>(undefined);

  return (
    <CxSelect
      options={OPTIONS}
      value={selected}
      onUpdateValue={setSelected}
      clearable
      placeholder="Select and clear..."
    />
  );
}
```

:::

## Option Groups

Use a `children` array on option objects to create grouped options.

::: code-group

```vue [Vue 3]
<template>
  <CxSelect :options="options" v-model:value="selected" placeholder="Select a city..." />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxSelect } from '@chronixjs/ui-vue3';

const selected = ref<string | undefined>(undefined);

const options = [
  {
    key: 'east',
    label: 'East Coast',
    children: [
      { key: 'nyc', label: 'New York', value: 'nyc' },
      { key: 'bos', label: 'Boston', value: 'bos' },
      { key: 'mia', label: 'Miami', value: 'mia' },
    ],
  },
  {
    key: 'west',
    label: 'West Coast',
    children: [
      { key: 'sfo', label: 'San Francisco', value: 'sfo' },
      { key: 'lax', label: 'Los Angeles', value: 'lax' },
      { key: 'sea', label: 'Seattle', value: 'sea' },
    ],
  },
];
</script>
```

```vue [Vue 2]
<template>
  <CxSelect :options="options" :value.sync="selected" placeholder="Select a city..." />
</template>

<script>
import { CxSelect } from '@chronixjs/ui-vue2';
export default {
  components: { CxSelect },
  data() {
    return {
      selected: undefined,
      options: [
        {
          key: 'east',
          label: 'East Coast',
          children: [
            { key: 'nyc', label: 'New York', value: 'nyc' },
            { key: 'bos', label: 'Boston', value: 'bos' },
            { key: 'mia', label: 'Miami', value: 'mia' },
          ],
        },
        {
          key: 'west',
          label: 'West Coast',
          children: [
            { key: 'sfo', label: 'San Francisco', value: 'sfo' },
            { key: 'lax', label: 'Los Angeles', value: 'lax' },
            { key: 'sea', label: 'Seattle', value: 'sea' },
          ],
        },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxSelect } from '@chronixjs/ui-react';

const OPTIONS = [
  {
    key: 'east',
    label: 'East Coast',
    children: [
      { key: 'nyc', label: 'New York', value: 'nyc' },
      { key: 'bos', label: 'Boston', value: 'bos' },
      { key: 'mia', label: 'Miami', value: 'mia' },
    ],
  },
  {
    key: 'west',
    label: 'West Coast',
    children: [
      { key: 'sfo', label: 'San Francisco', value: 'sfo' },
      { key: 'lax', label: 'Los Angeles', value: 'lax' },
      { key: 'sea', label: 'Seattle', value: 'sea' },
    ],
  },
];

export function App() {
  const [selected, setSelected] = useState<string | undefined>(undefined);

  return (
    <CxSelect
      options={OPTIONS}
      value={selected}
      onUpdateValue={setSelected}
      placeholder="Select a city..."
    />
  );
}
```

:::

## API Reference

### Props

| Prop                | Type                 | Default          | Description             |
| ------------------- | -------------------- | ---------------- | ----------------------- |
| `value`             | `string \| string[]` | `undefined`      | Selected value(s)       |
| `options`           | `SelectOption[]`     | `[]`             | Option list             |
| `multiple`          | `boolean`            | `false`          | Multi-select mode       |
| `filterable`        | `boolean`            | `false`          | Enable search           |
| `clearable`         | `boolean`            | `false`          | Show clear icon         |
| `placeholder`       | `string`             | `''`             | Placeholder text        |
| `disabled`          | `boolean`            | `false`          | Disable select          |
| `loading`           | `boolean`            | `false`          | Loading state           |
| `virtual`           | `boolean`            | `false`          | Virtual scrolling       |
| `virtualItemHeight` | `number`             | `32`             | Item height for virtual |
| `placement`         | `PopupPlacement`     | `'bottom-start'` | Dropdown position       |

### Events

| Event          | Payload              | Description   |
| -------------- | -------------------- | ------------- |
| `update:value` | `string \| string[]` | Value changed |
