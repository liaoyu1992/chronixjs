# Flex

Flexbox layout container with idiomatic CSS-aligned prop names.

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
  <CxFlex gap="medium" align="center">
    <div>Item 1</div>
    <div>Item 2</div>
    <div>Item 3</div>
  </CxFlex>
</template>

<script setup lang="ts">
import { CxFlex } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxFlex gap="medium" align="center">
    <div>Item 1</div>
    <div>Item 2</div>
    <div>Item 3</div>
  </CxFlex>
</template>

<script>
import { CxFlex } from '@chronixjs/ui-vue2';
export default { components: { CxFlex } };
</script>
```

```tsx [React]
import { CxFlex } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxFlex gap="medium" align="center">
      <div>Item 1</div>
      <div>Item 2</div>
      <div>Item 3</div>
    </CxFlex>
  );
}
```

:::

## Column Direction with Wrap

::: code-group

```vue [Vue 3]
<template>
  <CxFlex direction="column" :gap="12" justify="start" wrap="wrap">
    <div>Row 1</div>
    <div>Row 2</div>
    <div>Row 3</div>
  </CxFlex>
</template>

<script setup lang="ts">
import { CxFlex } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxFlex direction="column" :gap="12" justify="start" wrap="wrap">
    <div>Row 1</div>
    <div>Row 2</div>
    <div>Row 3</div>
  </CxFlex>
</template>

<script>
import { CxFlex } from '@chronixjs/ui-vue2';
export default { components: { CxFlex } };
</script>
```

```tsx [React]
import { CxFlex } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxFlex direction="column" gap={12} justify="start" wrap="wrap">
      <div>Row 1</div>
      <div>Row 2</div>
      <div>Row 3</div>
    </CxFlex>
  );
}
```

:::

## API Reference

### Props

| Prop        | Type                                                                                               | Default     | Description                         |
| ----------- | -------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------- |
| `direction` | `'row' \| 'column' \| 'row-reverse' \| 'column-reverse'`                                           | `'row'`     | Flexbox direction                   |
| `wrap`      | `'nowrap' \| 'wrap' \| 'wrap-reverse'`                                                             | `'nowrap'`  | Flexbox wrap                        |
| `align`     | `'start' \| 'center' \| 'end' \| 'baseline' \| 'stretch' \| undefined`                             | `undefined` | Cross-axis alignment                |
| `justify`   | `'start' \| 'center' \| 'end' \| 'space-around' \| 'space-between' \| 'space-evenly' \| undefined` | `undefined` | Main-axis justification             |
| `gap`       | `'small' \| 'medium' \| 'large' \| number \| undefined`                                            | `undefined` | Gap between children                |
| `inline`    | `boolean`                                                                                          | `false`     | Use `inline-flex` instead of `flex` |

### Slots

| Slot      | Description   |
| --------- | ------------- |
| `default` | Flex children |
