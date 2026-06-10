# Dynamic Tags

Inline tag editor where the user can add tags by typing and remove them via a close icon.

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
  <CxDynamicTags v-model:value="tags" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxDynamicTags } from '@chronixjs/ui-vue3';

const tags = ref<string[]>(['Vue', 'React', 'Angular']);
</script>
```

```vue [Vue 2]
<template>
  <CxDynamicTags :value.sync="tags" />
</template>

<script>
import { CxDynamicTags } from '@chronixjs/ui-vue2';
export default {
  components: { CxDynamicTags },
  data() {
    return { tags: ['Vue', 'React', 'Angular'] };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxDynamicTags } from '@chronixjs/ui-react';

export function App() {
  const [tags, setTags] = useState<string[]>(['Vue', 'React', 'Angular']);

  return <CxDynamicTags value={tags} onUpdateValue={setTags} />;
}
```

:::

## API Reference

### Props

| Prop       | Type                  | Default     | Description                 |
| ---------- | --------------------- | ----------- | --------------------------- |
| `value`    | `readonly string[]`   | `[]`        | Current tags                |
| `max`      | `number \| undefined` | `undefined` | Maximum number of tags      |
| `closable` | `boolean`             | `true`      | Show close icon on each tag |
| `disabled` | `boolean`             | `false`     | Disable the editor          |

### Events

| Event          | Payload    | Description            |
| -------------- | ---------- | ---------------------- |
| `update:value` | `string[]` | Fires when tags change |
