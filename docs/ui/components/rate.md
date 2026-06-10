# Rate

Star rating input with optional half-star precision.

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
  <CxRate v-model:value="rating" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxRate } from '@chronixjs/ui-vue3';

const rating = ref(3);
</script>
```

```vue [Vue 2]
<template>
  <CxRate :value.sync="rating" />
</template>

<script>
import { CxRate } from '@chronixjs/ui-vue2';
export default {
  components: { CxRate },
  data() {
    return { rating: 3 };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxRate } from '@chronixjs/ui-react';

export function App() {
  const [rating, setRating] = useState(3);
  return <CxRate value={rating} onUpdateValue={setRating} />;
}
```

:::

## Half Star

Enable half-star precision with the `allow-half` prop. Users can select values like 3.5.

::: code-group

```vue [Vue 3]
<template>
  <CxRate v-model:value="rating" allow-half />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxRate } from '@chronixjs/ui-vue3';

const rating = ref(3.5);
</script>
```

```vue [Vue 2]
<template>
  <CxRate :value.sync="rating" allow-half />
</template>

<script>
import { CxRate } from '@chronixjs/ui-vue2';
export default {
  components: { CxRate },
  data() {
    return { rating: 3.5 };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxRate } from '@chronixjs/ui-react';

export function App() {
  const [rating, setRating] = useState(3.5);
  return <CxRate value={rating} onUpdateValue={setRating} allowHalf />;
}
```

:::

## Custom Count

Use the `count` prop to display more (or fewer) stars. Default is 5.

::: code-group

```vue [Vue 3]
<template>
  <CxRate v-model:value="rating" :count="10" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxRate } from '@chronixjs/ui-vue3';

const rating = ref(7);
</script>
```

```vue [Vue 2]
<template>
  <CxRate :value.sync="rating" :count="10" />
</template>

<script>
import { CxRate } from '@chronixjs/ui-vue2';
export default {
  components: { CxRate },
  data() {
    return { rating: 7 };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxRate } from '@chronixjs/ui-react';

export function App() {
  const [rating, setRating] = useState(7);
  return <CxRate value={rating} onUpdateValue={setRating} count={10} />;
}
```

:::

## Read Only

Use the `readonly` prop for display-only ratings (e.g. showing an average score).

::: code-group

```vue [Vue 3]
<template>
  <CxRate :value="4.5" readonly allow-half />
</template>

<script setup lang="ts">
import { CxRate } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxRate :value="4.5" readonly allow-half />
</template>

<script>
import { CxRate } from '@chronixjs/ui-vue2';
export default {
  components: { CxRate },
};
</script>
```

```tsx [React]
import { CxRate } from '@chronixjs/ui-react';

export function App() {
  return <CxRate value={4.5} readonly allowHalf />;
}
```

:::

## API Reference

### Props

| Prop        | Type      | Default     | Description         |
| ----------- | --------- | ----------- | ------------------- |
| `value`     | `number`  | `0`         | Current rating      |
| `count`     | `number`  | `5`         | Number of stars     |
| `allowHalf` | `boolean` | `false`     | Half-star precision |
| `disabled`  | `boolean` | `false`     | Disable interaction |
| `readonly`  | `boolean` | `false`     | Read-only display   |
| `error`     | `string`  | `undefined` | Error message       |

### Events

| Event          | Payload  | Description    |
| -------------- | -------- | -------------- |
| `update:value` | `number` | Rating changed |
