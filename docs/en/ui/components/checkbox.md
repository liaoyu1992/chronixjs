# Checkbox

Checkbox component with support for indeterminate state, labels, and validation errors.

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
  <CxCheckbox v-model:checked="checked" label="Accept terms" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxCheckbox } from '@chronixjs/ui-vue3';

const checked = ref(false);
</script>
```

```vue [Vue 2]
<template>
  <CxCheckbox v-model:checked="checked" label="Accept terms" />
</template>

<script>
import { CxCheckbox } from '@chronixjs/ui-vue2';
export default {
  components: { CxCheckbox },
  data() {
    return { checked: false };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxCheckbox } from '@chronixjs/ui-react';

export function App() {
  const [checked, setChecked] = useState(false);
  return <CxCheckbox checked={checked} onUpdateChecked={setChecked} label="Accept terms" />;
}
```

:::

## Custom Label Slot

Use the default slot for rich label content:

::: code-group

```vue [Vue 3]
<template>
  <CxCheckbox v-model:checked="checked">
    <strong>Accept</strong> the <a href="/terms">terms and conditions</a>
  </CxCheckbox>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxCheckbox } from '@chronixjs/ui-vue3';

const checked = ref(false);
</script>
```

```tsx [React]
<CxCheckbox checked={checked} onUpdateChecked={setChecked}>
  <strong>Accept</strong> the <a href="/terms">terms</a>
</CxCheckbox>
```

:::

## Indeterminate State

The indeterminate state shows a horizontal bar, useful for "select all" scenarios:

::: code-group

```vue [Vue 3]
<template>
  <CxCheckbox :checked="allChecked" indeterminate label="Select all" />
</template>

<script setup lang="ts">
import { CxCheckbox } from '@chronixjs/ui-vue3';
</script>
```

```tsx [React]
<CxCheckbox checked={allChecked} indeterminate label="Select all" />
```

:::

## Disabled

::: code-group

```vue [Vue 3]
<template>
  <CxCheckbox checked disabled label="Locked option" />
</template>

<script setup lang="ts">
import { CxCheckbox } from '@chronixjs/ui-vue3';
</script>
```

```tsx [React]
<CxCheckbox checked disabled label="Locked option" />
```

:::

## Error State

::: code-group

```vue [Vue 3]
<template>
  <CxCheckbox v-model:checked="agreed" error="You must agree to continue" label="Terms" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxCheckbox } from '@chronixjs/ui-vue3';

const agreed = ref(false);
</script>
```

```tsx [React]
<CxCheckbox checked={agreed} onUpdateChecked={setAgreed} error="You must agree" label="Terms" />
```

:::

## API Reference

### Props

| Prop            | Type      | Default     | Description             |
| --------------- | --------- | ----------- | ----------------------- |
| `checked`       | `boolean` | `false`     | Checked state (v-model) |
| `indeterminate` | `boolean` | `false`     | Indeterminate (—) state |
| `disabled`      | `boolean` | `false`     | Disable the checkbox    |
| `label`         | `string`  | `undefined` | Label text              |
| `error`         | `string`  | `undefined` | Error message           |

### Events

| Event            | Payload   | Description             |
| ---------------- | --------- | ----------------------- |
| `update:checked` | `boolean` | State changed (v-model) |

### Slots

| Slot      | Description                                  |
| --------- | -------------------------------------------- |
| `default` | Custom label content (replaces `label` prop) |
