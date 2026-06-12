<script setup>
import InputOTPBasic from '../../../ui/components/demos/input-otp/InputOTPBasic.vue';
import inputOTPBasicCode from '../../../ui/components/demos/input-otp/InputOTPBasic.vue?raw';
import inputOTPBasicVue2 from '../../../ui/components/demos/input-otp/InputOTPBasic.vue2?raw';
import inputOTPBasicReact from '../../../ui/components/demos/input-otp/InputOTPBasic.react?raw';
</script>

# Input OTP

One-time-password entry surface with N independent cells sharing a single controlled value.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="OTP input with 6 cells." :code="inputOTPBasicCode" :code-vue2="inputOTPBasicVue2" :code-react="inputOTPBasicReact">
  <InputOTPBasic />
</DemoBox>

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
