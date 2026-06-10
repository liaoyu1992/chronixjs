# Radio

Radio button component with group support. Use `CxRadioGroup` for mutually exclusive selections from a list of options.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage with RadioGroup

::: code-group

```vue [Vue 3]
<template>
  <CxRadioGroup v-model:value="selected" :options="options" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxRadioGroup } from '@chronixjs/ui-vue3';

const selected = ref('vue');
const options = [
  { key: 'vue', label: 'Vue', value: 'vue', disabled: false },
  { key: 'react', label: 'React', value: 'react', disabled: false },
  { key: 'angular', label: 'Angular', value: 'angular', disabled: false },
];
</script>
```

```vue [Vue 2]
<template>
  <CxRadioGroup v-model:value="selected" :options="options" />
</template>

<script>
import { CxRadioGroup } from '@chronixjs/ui-vue2';
export default {
  components: { CxRadioGroup },
  data() {
    return {
      selected: 'vue',
      options: [
        { key: 'vue', label: 'Vue', value: 'vue', disabled: false },
        { key: 'react', label: 'React', value: 'react', disabled: false },
        { key: 'angular', label: 'Angular', value: 'angular', disabled: false },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxRadioGroup } from '@chronixjs/ui-react';

const options = [
  { key: 'vue', label: 'Vue', value: 'vue', disabled: false },
  { key: 'react', label: 'React', value: 'react', disabled: false },
  { key: 'angular', label: 'Angular', value: 'angular', disabled: false },
];

export function App() {
  const [selected, setSelected] = useState('vue');
  return <CxRadioGroup value={selected} onUpdateValue={setSelected} options={options} />;
}
```

:::

## Disabled Options

Disable individual options or the entire group:

::: code-group

```vue [Vue 3]
<template>
  <!-- Disabled group -->
  <CxRadioGroup v-model:value="val" :options="opts" disabled />

  <!-- Disabled option -->
  <CxRadioGroup v-model:value="val" :options="optionsWithDisabled" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxRadioGroup } from '@chronixjs/ui-vue3';

const val = ref('a');
const optionsWithDisabled = [
  { key: 'a', label: 'Option A', value: 'a', disabled: false },
  { key: 'b', label: 'Option B (disabled)', value: 'b', disabled: true },
  { key: 'c', label: 'Option C', value: 'c', disabled: false },
];
</script>
```

```tsx [React]
const options = [
  { key: 'a', label: 'Option A', value: 'a', disabled: false },
  { key: 'b', label: 'Option B (disabled)', value: 'b', disabled: true },
  { key: 'c', label: 'Option C', value: 'c', disabled: false },
];

<CxRadioGroup value={val} onUpdateValue={setVal} options={options} />;
```

:::

## Error State

::: code-group

```vue [Vue 3]
<template>
  <CxRadioGroup v-model:value="val" :options="opts" error="Please select an option" />
</template>

<script setup lang="ts">
import { CxRadioGroup } from '@chronixjs/ui-vue3';
</script>
```

```tsx [React]
<CxRadioGroup value={val} onUpdateValue={setVal} options={opts} error="Please select an option" />
```

:::

## RadioOption Type

```typescript
interface RadioOption {
  readonly key: string; // Unique key for rendering
  readonly label: string; // Display text
  readonly value: string; // Selection value
  readonly disabled: boolean; // Disable this option
}
```

## API Reference

### CxRadioGroup Props

| Prop       | Type                     | Default     | Description              |
| ---------- | ------------------------ | ----------- | ------------------------ |
| `value`    | `string`                 | `''`        | Selected value (v-model) |
| `options`  | `readonly RadioOption[]` | `[]`        | Available options        |
| `disabled` | `boolean`                | `false`     | Disable entire group     |
| `error`    | `string`                 | `undefined` | Error message            |

### CxRadioGroup Events

| Event          | Payload  | Description                 |
| -------------- | -------- | --------------------------- |
| `update:value` | `string` | Selection changed (v-model) |
