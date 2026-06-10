# Slider

Single or range slider with optional marks and tooltips.

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
  <CxSlider v-model:value="val" :min="0" :max="100" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxSlider } from '@chronixjs/ui-vue3';

const val = ref(50);
</script>
```

```vue [Vue 2]
<template>
  <CxSlider :value.sync="val" :min="0" :max="100" />
</template>

<script>
import { CxSlider } from '@chronixjs/ui-vue2';
export default {
  components: { CxSlider },
  data() {
    return { val: 50 };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxSlider } from '@chronixjs/ui-react';

export function App() {
  const [val, setVal] = useState(50);

  return <CxSlider value={val} onUpdateValue={setVal} min={0} max={100} />;
}
```

:::

## Range Mode

::: code-group

```vue [Vue 3]
<template>
  <CxSlider v-model:value="range" range :min="0" :max="100" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxSlider } from '@chronixjs/ui-vue3';

const range = ref<[number, number]>([20, 80]);
</script>
```

```vue [Vue 2]
<template>
  <CxSlider :value.sync="range" range :min="0" :max="100" />
</template>

<script>
import { CxSlider } from '@chronixjs/ui-vue2';
export default {
  components: { CxSlider },
  data() {
    return { range: [20, 80] };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxSlider } from '@chronixjs/ui-react';

export function App() {
  const [range, setRange] = useState<[number, number]>([20, 80]);

  return <CxSlider value={range} onUpdateValue={setRange} range min={0} max={100} />;
}
```

:::

## API Reference

### Props

| Prop       | Type                         | Default | Description                      |
| ---------- | ---------------------------- | ------- | -------------------------------- |
| `value`    | `number \| [number, number]` | `0`     | Current value (single or range)  |
| `range`    | `boolean`                    | `false` | Enable dual-handle range mode    |
| `min`      | `number`                     | `0`     | Minimum value                    |
| `max`      | `number`                     | `100`   | Maximum value                    |
| `step`     | `number`                     | `1`     | Step between values              |
| `marks`    | `Record<number, SliderMark>` | `{}`    | Labeled marks at specific values |
| `disabled` | `boolean`                    | `false` | Disable the slider               |
| `tooltip`  | `boolean`                    | `true`  | Show tooltip on hover            |
| `vertical` | `boolean`                    | `false` | Vertical orientation             |

### Events

| Event          | Payload                      | Description              |
| -------------- | ---------------------------- | ------------------------ |
| `update:value` | `number \| [number, number]` | Fires when value changes |
