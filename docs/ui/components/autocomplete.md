# Autocomplete

Text-entry with consumer-supplied options and built-in substring filtering.

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
  <CxAutocomplete v-model:value="query" :options="options" placeholder="Search..." />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxAutocomplete } from '@chronixjs/ui-vue3';

const query = ref('');
const options = ref([
  { key: 'js', label: 'JavaScript', value: 'javascript' },
  { key: 'ts', label: 'TypeScript', value: 'typescript' },
  { key: 'py', label: 'Python', value: 'python' },
]);
</script>
```

```vue [Vue 2]
<template>
  <CxAutocomplete :value.sync="query" :options="options" placeholder="Search..." />
</template>

<script>
import { CxAutocomplete } from '@chronixjs/ui-vue2';
export default {
  components: { CxAutocomplete },
  data() {
    return {
      query: '',
      options: [
        { key: 'js', label: 'JavaScript', value: 'javascript' },
        { key: 'ts', label: 'TypeScript', value: 'typescript' },
        { key: 'py', label: 'Python', value: 'python' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxAutocomplete } from '@chronixjs/ui-react';

export function App() {
  const [query, setQuery] = useState('');
  const [options] = useState([
    { key: 'js', label: 'JavaScript', value: 'javascript' },
    { key: 'ts', label: 'TypeScript', value: 'typescript' },
    { key: 'py', label: 'Python', value: 'python' },
  ]);

  return (
    <CxAutocomplete
      value={query}
      onUpdateValue={setQuery}
      options={options}
      placeholder="Search..."
    />
  );
}
```

:::

## API Reference

### Props

| Prop          | Type                             | Default     | Description         |
| ------------- | -------------------------------- | ----------- | ------------------- |
| `value`       | `string`                         | `''`        | Current input value |
| `options`     | `readonly AutoCompleteOption[]`  | `[]`        | Available options   |
| `placeholder` | `string \| undefined`            | `undefined` | Input placeholder   |
| `disabled`    | `boolean`                        | `false`     | Disable the input   |
| `size`        | `'small' \| 'medium' \| 'large'` | `'medium'`  | Input size          |
| `error`       | `string \| undefined`            | `undefined` | Error message       |

### AutoCompleteOption

| Property | Type     | Description       |
| -------- | -------- | ----------------- |
| `key`    | `string` | Unique identifier |
| `label`  | `string` | Display text      |
| `value`  | `string` | Option value      |

### Events

| Event          | Payload              | Description                      |
| -------------- | -------------------- | -------------------------------- |
| `update:value` | `string`             | Fires when input value changes   |
| `select`       | `AutoCompleteOption` | Fires when an option is selected |
