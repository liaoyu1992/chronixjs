<script setup>
import ButtonGroupBasic from '../../../ui/components/demos/button-group/ButtonGroupBasic.vue';
import buttonGroupBasicCode from '../../../ui/components/demos/button-group/ButtonGroupBasic.vue?raw';
import buttonGroupBasicVue2 from '../../../ui/components/demos/button-group/ButtonGroupBasic.vue2?raw';
import buttonGroupBasicReact from '../../../ui/components/demos/button-group/ButtonGroupBasic.react?raw';
</script>

# Button Group

Flex container that groups `CxButton` children with merged borders.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Group multiple buttons together in a button group." :code="buttonGroupBasicCode" :code-vue2="buttonGroupBasicVue2" :code-react="buttonGroupBasicReact">
  <ButtonGroupBasic />
</DemoBox>

## Vertical

::: code-group

```vue [Vue 3]
<template>
  <CxButtonGroup vertical size="small">
    <CxButton type="primary">Top</CxButton>
    <CxButton type="primary">Middle</CxButton>
    <CxButton type="primary">Bottom</CxButton>
  </CxButtonGroup>
</template>

<script setup lang="ts">
import { CxButton, CxButtonGroup } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxButtonGroup vertical size="small">
    <CxButton type="primary">Top</CxButton>
    <CxButton type="primary">Middle</CxButton>
    <CxButton type="primary">Bottom</CxButton>
  </CxButtonGroup>
</template>

<script>
import { CxButton, CxButtonGroup } from '@chronixjs/ui-vue2';
export default { components: { CxButton, CxButtonGroup } };
</script>
```

```tsx [React]
import { CxButton, CxButtonGroup } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxButtonGroup vertical size="small">
      <CxButton type="primary">Top</CxButton>
      <CxButton type="primary">Middle</CxButton>
      <CxButton type="primary">Bottom</CxButton>
    </CxButtonGroup>
  );
}
```

:::

## API Reference

### Props

| Prop       | Type                                          | Default     | Description                 |
| ---------- | --------------------------------------------- | ----------- | --------------------------- |
| `vertical` | `boolean`                                     | `false`     | Lay out children vertically |
| `size`     | `'small' \| 'medium' \| 'large' \| undefined` | `undefined` | Override child button sizes |

### Slots

| Slot      | Description     |
| --------- | --------------- |
| `default` | Button children |
