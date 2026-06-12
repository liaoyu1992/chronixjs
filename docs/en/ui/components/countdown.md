<script setup>
import CountdownBasic from '../../../ui/components/demos/countdown/CountdownBasic.vue';
import countdownBasicCode from '../../../ui/components/demos/countdown/CountdownBasic.vue?raw';
import countdownBasicVue2 from '../../../ui/components/demos/countdown/CountdownBasic.vue2?raw';
import countdownBasicReact from '../../../ui/components/demos/countdown/CountdownBasic.react?raw';
</script>

# Countdown

Live countdown timer that ticks down to zero, with configurable precision.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Set duration to 60000 ms (1 minute) with active countdown." :code="countdownBasicCode" :code-vue2="countdownBasicVue2" :code-react="countdownBasicReact">
  <CountdownBasic />
</DemoBox>

## With Precision

::: code-group

```vue [Vue 3]
<template>
  <CxCountdown label="Lap Timer" :duration="30000" :precision="2" />
</template>

<script setup lang="ts">
import { CxCountdown } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxCountdown label="Lap Timer" :duration="30000" :precision="2" />
</template>

<script>
import { CxCountdown } from '@chronixjs/ui-vue2';
export default { components: { CxCountdown } };
</script>
```

```tsx [React]
import { CxCountdown } from '@chronixjs/ui-react';

export function App() {
  return <CxCountdown label="Lap Timer" duration={30000} precision={2} />;
}
```

:::

## API Reference

### Props

| Prop        | Type                  | Default     | Description                              |
| ----------- | --------------------- | ----------- | ---------------------------------------- |
| `label`     | `string \| undefined` | `undefined` | Heading label                            |
| `duration`  | `number`              | `0`         | Total countdown duration in ms           |
| `precision` | `0 \| 1 \| 2 \| 3`    | `0`         | Decimal precision for fractional seconds |
| `active`    | `boolean`             | `true`      | Whether the timer is running             |

### Events

| Event    | Payload | Description                       |
| -------- | ------- | --------------------------------- |
| `finish` | —       | Fires when countdown reaches zero |

### Slots

| Slot     | Description                       |
| -------- | --------------------------------- |
| `prefix` | Content rendered before the value |
| `suffix` | Content rendered after the value  |
