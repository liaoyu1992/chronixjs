# Number Animation

Animated number display that tweens from one value to another over a configurable duration.

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
  <CxNumberAnimation :from="0" :to="9999" :duration="2000" />
</template>

<script setup lang="ts">
import { CxNumberAnimation } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxNumberAnimation :from="0" :to="9999" :duration="2000" />
</template>

<script>
import { CxNumberAnimation } from '@chronixjs/ui-vue2';
export default { components: { CxNumberAnimation } };
</script>
```

```tsx [React]
import { CxNumberAnimation } from '@chronixjs/ui-react';

export function App() {
  return <CxNumberAnimation from={0} to={9999} duration={2000} />;
}
```

:::

## With Precision and Separator

::: code-group

```vue [Vue 3]
<template>
  <CxNumberAnimation :from="0" :to="1234567.89" :duration="3000" :precision="2" show-separator />
</template>

<script setup lang="ts">
import { CxNumberAnimation } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxNumberAnimation :from="0" :to="1234567.89" :duration="3000" :precision="2" show-separator />
</template>

<script>
import { CxNumberAnimation } from '@chronixjs/ui-vue2';
export default { components: { CxNumberAnimation } };
</script>
```

```tsx [React]
import { CxNumberAnimation } from '@chronixjs/ui-react';

export function App() {
  return <CxNumberAnimation from={0} to={1234567.89} duration={3000} precision={2} showSeparator />;
}
```

:::

## API Reference

### Props

| Prop            | Type      | Default | Description                  |
| --------------- | --------- | ------- | ---------------------------- |
| `from`          | `number`  | `0`     | Start value                  |
| `to`            | `number`  | `0`     | End value                    |
| `duration`      | `number`  | `2000`  | Animation duration in ms     |
| `precision`     | `number`  | `0`     | Decimal precision            |
| `active`        | `boolean` | `true`  | Whether animation is running |
| `showSeparator` | `boolean` | `false` | Show thousands separator     |
| `locale`        | `string`  | —       | Locale for number formatting |
