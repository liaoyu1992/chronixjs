# Input OTP

One-time-password entry surface with N independent cells sharing a single controlled value.

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
  <CxInputOtp v-model:value="otp" :length="6" @complete="onComplete" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxInputOtp } from '@chronixjs/ui-vue3';

const otp = ref('');

function onComplete(value: string) {
  console.log('OTP complete:', value);
}
</script>
```

```vue [Vue 2]
<template>
  <CxInputOtp :value.sync="otp" :length="6" @complete="onComplete" />
</template>

<script>
import { CxInputOtp } from '@chronixjs/ui-vue2';
export default {
  components: { CxInputOtp },
  data() {
    return { otp: '' };
  },
  methods: {
    onComplete(value) {
      console.log('OTP complete:', value);
    },
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxInputOtp } from '@chronixjs/ui-react';

export function App() {
  const [otp, setOtp] = useState('');

  function onComplete(value: string) {
    console.log('OTP complete:', value);
  }

  return <CxInputOtp value={otp} onUpdateValue={setOtp} length={6} onComplete={onComplete} />;
}
```

:::

## API Reference

### Props

| Prop       | Type                  | Default     | Description           |
| ---------- | --------------------- | ----------- | --------------------- |
| `value`    | `string`              | `''`        | Current OTP value     |
| `length`   | `number`              | `6`         | Number of input cells |
| `disabled` | `boolean`             | `false`     | Disable all cells     |
| `error`    | `string \| undefined` | `undefined` | Error message         |

### Events

| Event          | Payload  | Description                             |
| -------------- | -------- | --------------------------------------- |
| `update:value` | `string` | Fires when value changes                |
| `complete`     | `string` | Fires when value length equals `length` |
