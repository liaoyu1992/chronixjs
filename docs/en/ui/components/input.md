# Input

Text input component with clearable support, textarea mode, validation, and IME composition handling.

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
  <CxInput v-model:value="text" placeholder="Enter text..." />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxInput } from '@chronixjs/ui-vue3';

const text = ref('');
</script>
```

```vue [Vue 2]
<template>
  <CxInput v-model:value="text" placeholder="Enter text..." />
</template>

<script>
import { CxInput } from '@chronixjs/ui-vue2';
export default {
  components: { CxInput },
  data() {
    return { text: '' };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxInput } from '@chronixjs/ui-react';

export function App() {
  const [text, setText] = useState('');
  return <CxInput value={text} onUpdateValue={setText} placeholder="Enter text..." />;
}
```

:::

## Input Types

### Text Input (default)

::: code-group

```vue [Vue 3]
<template>
  <CxInput v-model:value="name" placeholder="Your name" />
</template>
```

```tsx [React]
<CxInput value={name} onUpdateValue={setName} placeholder="Your name" />
```

:::

### Textarea

Set `type="textarea"` for multi-line input:

::: code-group

```vue [Vue 3]
<template>
  <CxInput v-model:value="bio" type="textarea" :rows="4" placeholder="Bio..." />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxInput } from '@chronixjs/ui-vue3';

const bio = ref('');
</script>
```

```tsx [React]
<CxInput value={bio} onUpdateValue={setBio} type="textarea" rows={4} placeholder="Bio..." />
```

:::

## Sizes

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; flex-direction: column; gap: 8px;">
    <CxInput size="small" placeholder="Small" />
    <CxInput size="medium" placeholder="Medium" />
    <CxInput size="large" placeholder="Large" />
  </div>
</template>

<script setup lang="ts">
import { CxInput } from '@chronixjs/ui-vue3';
</script>
```

```tsx [React]
<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
  <CxInput size="small" placeholder="Small" />
  <CxInput size="medium" placeholder="Medium" />
  <CxInput size="large" placeholder="Large" />
</div>
```

:::

## Clearable

Show a clear button when the input has a value:

::: code-group

```vue [Vue 3]
<template>
  <CxInput v-model:value="text" clearable placeholder="Type to see clear button" @clear="onClear" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxInput } from '@chronixjs/ui-vue3';

const text = ref('Hello');
function onClear() {
  console.log('Cleared');
}
</script>
```

```tsx [React]
<CxInput value={text} onUpdateValue={setText} clearable onClear={() => console.log('Cleared')} />
```

:::

## Error State

Display validation error messages:

::: code-group

```vue [Vue 3]
<template>
  <CxInput v-model:value="email" error="Please enter a valid email" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxInput } from '@chronixjs/ui-vue3';

const email = ref('invalid');
</script>
```

```tsx [React]
<CxInput value={email} onUpdateValue={setEmail} error="Please enter a valid email" />
```

:::

## Disabled

::: code-group

```vue [Vue 3]
<template>
  <CxInput value="Read only" disabled />
</template>

<script setup lang="ts">
import { CxInput } from '@chronixjs/ui-vue3';
</script>
```

```tsx [React]
<CxInput value="Read only" disabled />
```

:::

## Events

::: code-group

```vue [Vue 3]
<template>
  <CxInput v-model:value="text" @focus="onFocus" @blur="onBlur" @clear="onClear" />
</template>

<script setup lang="ts">
import { CxInput } from '@chronixjs/ui-vue3';

function onFocus(e: FocusEvent) {
  console.log('Focused');
}
function onBlur(e: FocusEvent) {
  console.log('Blurred');
}
function onClear() {
  console.log('Cleared');
}
</script>
```

:::

## API Reference

### Props

| Prop          | Type                             | Default     | Description           |
| ------------- | -------------------------------- | ----------- | --------------------- |
| `value`       | `string`                         | `''`        | Input value (v-model) |
| `type`        | `'text' \| 'textarea'`           | `'text'`    | Input type            |
| `placeholder` | `string`                         | `undefined` | Placeholder text      |
| `disabled`    | `boolean`                        | `false`     | Disable the input     |
| `clearable`   | `boolean`                        | `false`     | Show clear button     |
| `size`        | `'small' \| 'medium' \| 'large'` | `'medium'`  | Input size            |
| `rows`        | `number`                         | `3`         | Textarea rows         |
| `error`       | `string`                         | `undefined` | Error message         |

### Events

| Event          | Payload      | Description             |
| -------------- | ------------ | ----------------------- |
| `update:value` | `string`     | Value changed (v-model) |
| `focus`        | `FocusEvent` | Input focused           |
| `blur`         | `FocusEvent` | Input blurred           |
| `clear`        | —            | Clear button clicked    |
