# Input Number

A numeric input with increment/decrement stepper buttons.

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
  <CxInputNumber v-model:value="count" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxInputNumber } from '@chronixjs/ui-vue3';

const count = ref<number | null>(0);
</script>
```

```vue [Vue 2]
<template>
  <CxInputNumber :value.sync="count" />
</template>

<script>
import { CxInputNumber } from '@chronixjs/ui-vue2';
export default {
  components: { CxInputNumber },
  data() {
    return { count: 0 };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxInputNumber } from '@chronixjs/ui-react';

export function App() {
  const [count, setCount] = useState<number | null>(0);
  return <CxInputNumber value={count} onUpdateValue={setCount} />;
}
```

:::

## Min / Max / Step

Constrain the value range and control the increment step:

::: code-group

```vue [Vue 3]
<template>
  <CxInputNumber v-model:value="quantity" :min="0" :max="100" :step="5" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxInputNumber } from '@chronixjs/ui-vue3';

const quantity = ref<number | null>(0);
</script>
```

```vue [Vue 2]
<template>
  <CxInputNumber :value.sync="quantity" :min="0" :max="100" :step="5" />
</template>

<script>
import { CxInputNumber } from '@chronixjs/ui-vue2';
export default {
  components: { CxInputNumber },
  data() {
    return { quantity: 0 };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxInputNumber } from '@chronixjs/ui-react';

export function App() {
  const [quantity, setQuantity] = useState<number | null>(0);
  return <CxInputNumber value={quantity} onUpdateValue={setQuantity} min={0} max={100} step={5} />;
}
```

:::

## Sizes

Use the `size` prop to change the input number size:

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; flex-direction: column; gap: 8px;">
    <CxInputNumber v-model:value="val" size="small" />
    <CxInputNumber v-model:value="val" size="medium" />
    <CxInputNumber v-model:value="val" size="large" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxInputNumber } from '@chronixjs/ui-vue3';

const val = ref<number | null>(0);
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; flex-direction: column; gap: 8px;">
    <CxInputNumber :value.sync="val" size="small" />
    <CxInputNumber :value.sync="val" size="medium" />
    <CxInputNumber :value.sync="val" size="large" />
  </div>
</template>

<script>
import { CxInputNumber } from '@chronixjs/ui-vue2';
export default {
  components: { CxInputNumber },
  data() {
    return { val: 0 };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxInputNumber } from '@chronixjs/ui-react';

export function App() {
  const [val, setVal] = useState<number | null>(0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <CxInputNumber value={val} onUpdateValue={setVal} size="small" />
      <CxInputNumber value={val} onUpdateValue={setVal} size="medium" />
      <CxInputNumber value={val} onUpdateValue={setVal} size="large" />
    </div>
  );
}
```

:::

## Disabled

Disable the input number to prevent user interaction:

::: code-group

```vue [Vue 3]
<template>
  <CxInputNumber v-model:value="count" disabled />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxInputNumber } from '@chronixjs/ui-vue3';

const count = ref<number | null>(0);
</script>
```

```vue [Vue 2]
<template>
  <CxInputNumber :value.sync="count" disabled />
</template>

<script>
import { CxInputNumber } from '@chronixjs/ui-vue2';
export default {
  components: { CxInputNumber },
  data() {
    return { count: 0 };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxInputNumber } from '@chronixjs/ui-react';

export function App() {
  const [count, setCount] = useState<number | null>(0);
  return <CxInputNumber value={count} onUpdateValue={setCount} disabled />;
}
```

:::

## API Reference

### Props

| Prop       | Type                             | Default     | Description    |
| ---------- | -------------------------------- | ----------- | -------------- |
| `value`    | `number \| null`                 | `null`      | Current value  |
| `min`      | `number`                         | `undefined` | Minimum value  |
| `max`      | `number`                         | `undefined` | Maximum value  |
| `step`     | `number`                         | `1`         | Increment step |
| `disabled` | `boolean`                        | `false`     | Disable input  |
| `size`     | `'small' \| 'medium' \| 'large'` | `'medium'`  | Input size     |
| `error`    | `string`                         | `undefined` | Error message  |

### Events

| Event          | Payload          | Description             |
| -------------- | ---------------- | ----------------------- |
| `update:value` | `number \| null` | Value changed (v-model) |
