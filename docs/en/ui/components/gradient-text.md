<script setup>
import GradientTextBasic from '../../../ui/components/demos/gradient-text/GradientTextBasic.vue';
import gradientTextBasicCode from '../../../ui/components/demos/gradient-text/GradientTextBasic.vue?raw';
import gradientTextBasicVue2 from '../../../ui/components/demos/gradient-text/GradientTextBasic.vue2?raw';
import gradientTextBasicReact from '../../../ui/components/demos/gradient-text/GradientTextBasic.react?raw';
</script>

# Gradient Text

Text with CSS linear-gradient applied via `background-clip: text`.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Create gradient text with two colors." :code="gradientTextBasicCode" :code-vue2="gradientTextBasicVue2" :code-react="gradientTextBasicReact">
  <GradientTextBasic />
</DemoBox>

## Custom Direction

::: code-group

```vue [Vue 3]
<template>
  <CxGradientText value="Hello World" :colors="['#ef4444', '#f59e0b']" :direction="45" />
</template>

<script setup lang="ts">
import { CxGradientText } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxGradientText value="Hello World" :colors="['#ef4444', '#f59e0b']" :direction="45" />
</template>

<script>
import { CxGradientText } from '@chronixjs/ui-vue2';
export default { components: { CxGradientText } };
</script>
```

```tsx [React]
import { CxGradientText } from '@chronixjs/ui-react';

export function App() {
  return <CxGradientText value="Hello World" colors={['#ef4444', '#f59e0b']} direction={45} />;
}
```

:::

## API Reference

### Props

| Prop        | Type                        | Default                  | Description                   |
| ----------- | --------------------------- | ------------------------ | ----------------------------- |
| `value`     | `string`                    | `''`                     | Text content                  |
| `colors`    | `readonly [string, string]` | `['#3b82f6', '#a855f7']` | Gradient start and end colors |
| `direction` | `number`                    | `90`                     | Gradient direction in degrees |
