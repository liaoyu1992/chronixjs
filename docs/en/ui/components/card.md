<script setup>
import CardBasic from '../../../ui/components/demos/card/CardBasic.vue';
import cardBasicCode from '../../../ui/components/demos/card/CardBasic.vue?raw';
import cardBasicVue2 from '../../../ui/components/demos/card/CardBasic.vue2?raw';
import cardBasicReact from '../../../ui/components/demos/card/CardBasic.react?raw';
</script>

# Card

A flexible container with optional header, body, and footer areas.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Use the title prop for a card title and the footer slot for footer content." :code="cardBasicCode" :code-vue2="cardBasicVue2" :code-react="cardBasicReact">
  <CardBasic />
</DemoBox>

## Sizes

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; flex-direction: column; gap: 8px;">
    <CxCard size="small">Small card</CxCard>
    <CxCard size="medium">Medium card</CxCard>
    <CxCard size="large">Large card</CxCard>
  </div>
</template>

<script setup lang="ts">
import { CxCard } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; flex-direction: column; gap: 8px;">
    <CxCard size="small">Small card</CxCard>
    <CxCard size="medium">Medium card</CxCard>
    <CxCard size="large">Large card</CxCard>
  </div>
</template>

<script>
import { CxCard } from '@chronixjs/ui-vue2';
export default { components: { CxCard } };
</script>
```

```tsx [React]
import { CxCard } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <CxCard size="small">Small card</CxCard>
      <CxCard size="medium">Medium card</CxCard>
      <CxCard size="large">Large card</CxCard>
    </div>
  );
}
```

:::

## Hoverable

::: code-group

```vue [Vue 3]
<template>
  <CxCard hoverable>Hover over me</CxCard>
</template>

<script setup lang="ts">
import { CxCard } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxCard hoverable>Hover over me</CxCard>
</template>

<script>
import { CxCard } from '@chronixjs/ui-vue2';
export default { components: { CxCard } };
</script>
```

```tsx [React]
import { CxCard } from '@chronixjs/ui-react';

export function App() {
  return <CxCard hoverable>Hover over me</CxCard>;
}
```

:::

## API Reference

### Props

| Prop        | Type                             | Default     | Description          |
| ----------- | -------------------------------- | ----------- | -------------------- |
| `size`      | `'small' \| 'medium' \| 'large'` | `'medium'`  | Card size            |
| `title`     | `string`                         | `undefined` | Card title           |
| `bordered`  | `boolean`                        | `true`      | Show border          |
| `hoverable` | `boolean`                        | `false`     | Show shadow on hover |
| `embedded`  | `boolean`                        | `false`     | Flat embedded style  |

### Slots

| Slot      | Description       |
| --------- | ----------------- |
| `default` | Card body content |
| `footer`  | Card footer area  |
