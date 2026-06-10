# Mention

Textarea with `@trigger` detection that opens a Select-style dropdown.

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
  <CxMention v-model:value="text" :options="users" trigger="@" placeholder="Type @ to mention..." />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxMention } from '@chronixjs/ui-vue3';

const text = ref('');
const users = ref([
  { key: 'alice', label: 'Alice', value: 'alice' },
  { key: 'bob', label: 'Bob', value: 'bob' },
  { key: 'charlie', label: 'Charlie', value: 'charlie' },
]);
</script>
```

```vue [Vue 2]
<template>
  <CxMention :value.sync="text" :options="users" trigger="@" placeholder="Type @ to mention..." />
</template>

<script>
import { CxMention } from '@chronixjs/ui-vue2';
export default {
  components: { CxMention },
  data() {
    return {
      text: '',
      users: [
        { key: 'alice', label: 'Alice', value: 'alice' },
        { key: 'bob', label: 'Bob', value: 'bob' },
        { key: 'charlie', label: 'Charlie', value: 'charlie' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxMention } from '@chronixjs/ui-react';

export function App() {
  const [text, setText] = useState('');
  const [users] = useState([
    { key: 'alice', label: 'Alice', value: 'alice' },
    { key: 'bob', label: 'Bob', value: 'bob' },
    { key: 'charlie', label: 'Charlie', value: 'charlie' },
  ]);

  return (
    <CxMention
      value={text}
      onUpdateValue={setText}
      options={users}
      trigger="@"
      placeholder="Type @ to mention..."
    />
  );
}
```

:::

## API Reference

### Props

| Prop          | Type                           | Default          | Description                   |
| ------------- | ------------------------------ | ---------------- | ----------------------------- |
| `value`       | `string`                       | `''`             | Textarea content              |
| `options`     | `readonly SelectOption[]`      | `[]`             | Mentionable options           |
| `trigger`     | `string`                       | `'@'`            | Trigger character             |
| `placement`   | `PopupPlacement`               | `'bottom-start'` | Dropdown placement            |
| `disabled`    | `boolean`                      | `false`          | Disable the textarea          |
| `placeholder` | `string`                       | `''`             | Textarea placeholder          |
| `sources`     | `readonly MentionSource[]`     | `[]`             | Multi-source trigger mappings |
| `filter`      | `MentionFilterFn \| undefined` | `undefined`      | Custom filter function        |

### Events

| Event          | Payload  | Description                       |
| -------------- | -------- | --------------------------------- |
| `update:value` | `string` | Fires when textarea value changes |
