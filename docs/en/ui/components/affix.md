<script setup>
import AffixBasic from '../../../ui/components/demos/affix/AffixBasic.vue';
import affixBasicCode from '../../../ui/components/demos/affix/AffixBasic.vue?raw';
import affixBasicVue2 from '../../../ui/components/demos/affix/AffixBasic.vue2?raw';
import affixBasicReact from '../../../ui/components/demos/affix/AffixBasic.react?raw';
</script>

# Affix

Fixes a child element to the viewport when its natural scroll position passes a top or bottom threshold.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Affix a element to the top of the viewport with the top prop." :code="affixBasicCode" :code-vue2="affixBasicVue2" :code-react="affixBasicReact">
  <AffixBasic />
</DemoBox>

## Bottom Affix

::: code-group

```vue [Vue 3]
<template>
  <CxAffix :bottom="20">
    <div style="background: #fff; padding: 8px 16px;">Bottom Sticky</div>
  </CxAffix>
</template>

<script setup lang="ts">
import { CxAffix } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxAffix :bottom="20">
    <div style="background: #fff; padding: 8px 16px;">Bottom Sticky</div>
  </CxAffix>
</template>

<script>
import { CxAffix } from '@chronixjs/ui-vue2';
export default { components: { CxAffix } };
</script>
```

```tsx [React]
import { CxAffix } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxAffix bottom={20}>
      <div style={{ background: '#fff', padding: '8px 16px' }}>Bottom Sticky</div>
    </CxAffix>
  );
}
```

:::

## API Reference

### Props

| Prop     | Type                  | Default     | Description                                |
| -------- | --------------------- | ----------- | ------------------------------------------ |
| `top`    | `number \| undefined` | `undefined` | Distance from viewport top when affixed    |
| `bottom` | `number \| undefined` | `undefined` | Distance from viewport bottom when affixed |

### Events

| Event    | Payload   | Description                      |
| -------- | --------- | -------------------------------- |
| `change` | `boolean` | Fired when affixed state changes |

### Slots

| Slot      | Description      |
| --------- | ---------------- |
| `default` | Content to affix |
