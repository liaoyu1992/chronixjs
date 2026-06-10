# Color Picker

Color picker with hex input, hue strip, and optional swatches.

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
  <CxColorPicker v-model:value="color" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxColorPicker } from '@chronixjs/ui-vue3';

const color = ref<string | null>('#3b82f6');
</script>
```

```vue [Vue 2]
<template>
  <CxColorPicker :value.sync="color" />
</template>

<script>
import { CxColorPicker } from '@chronixjs/ui-vue2';
export default {
  components: { CxColorPicker },
  data() {
    return { color: '#3b82f6' };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxColorPicker } from '@chronixjs/ui-react';

export function App() {
  const [color, setColor] = useState<string | null>('#3b82f6');

  return <CxColorPicker value={color} onUpdateValue={setColor} />;
}
```

:::

## With Swatches

::: code-group

```vue [Vue 3]
<template>
  <CxColorPicker v-model:value="color" :swatches="swatches" clearable />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxColorPicker } from '@chronixjs/ui-vue3';

const color = ref<string | null>('#000000');
const swatches = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#8b5cf6'];
</script>
```

```vue [Vue 2]
<template>
  <CxColorPicker :value.sync="color" :swatches="swatches" clearable />
</template>

<script>
import { CxColorPicker } from '@chronixjs/ui-vue2';
export default {
  components: { CxColorPicker },
  data() {
    return {
      color: '#000000',
      swatches: ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#8b5cf6'],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxColorPicker } from '@chronixjs/ui-react';

export function App() {
  const [color, setColor] = useState<string | null>('#000000');
  const swatches = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#8b5cf6'];

  return <CxColorPicker value={color} onUpdateValue={setColor} swatches={swatches} clearable />;
}
```

:::

## API Reference

### Props

| Prop        | Type                | Default | Description                                    |
| ----------- | ------------------- | ------- | ---------------------------------------------- |
| `value`     | `string \| null`    | `null`  | Current color in `#rrggbb` hex format          |
| `swatches`  | `readonly string[]` | `[]`    | Predefined swatch colors                       |
| `showAlpha` | `boolean`           | `false` | Show alpha slider                              |
| `alpha`     | `number`            | `1`     | Alpha value (0-1), used when showAlpha is true |
| `disabled`  | `boolean`           | `false` | Disable the picker                             |
| `clearable` | `boolean`           | `false` | Show clear button to reset value               |

### Events

| Event          | Payload          | Description              |
| -------------- | ---------------- | ------------------------ |
| `update:value` | `string \| null` | Fires when color changes |
