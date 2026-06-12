<script setup>
import InputNumberBasic from '../../../ui/components/demos/input-number/InputNumberBasic.vue';
import inputNumberBasicCode from '../../../ui/components/demos/input-number/InputNumberBasic.vue?raw';
import inputNumberBasicVue2 from '../../../ui/components/demos/input-number/InputNumberBasic.vue2?raw';
import inputNumberBasicReact from '../../../ui/components/demos/input-number/InputNumberBasic.react?raw';
import InputNumberDisabled from '../../../ui/components/demos/input-number/InputNumberDisabled.vue';
import inputNumberDisabledCode from '../../../ui/components/demos/input-number/InputNumberDisabled.vue?raw';
import inputNumberDisabledVue2 from '../../../ui/components/demos/input-number/InputNumberDisabled.vue2?raw';
import inputNumberDisabledReact from '../../../ui/components/demos/input-number/InputNumberDisabled.react?raw';
</script>

# Input Number

A numeric input with increment/decrement stepper buttons.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Use v-model:value to bind a numeric value with step=1." :code="inputNumberBasicCode" :code-vue2="inputNumberBasicVue2" :code-react="inputNumberBasicReact">
  <InputNumberBasic />
</DemoBox>

## Disabled

<DemoBox title="Disabled" description="Disable the input number with the disabled prop." :code="inputNumberDisabledCode" :code-vue2="inputNumberDisabledVue2" :code-react="inputNumberDisabledReact">
  <InputNumberDisabled />
</DemoBox>

## API Reference

### Props

| Prop       | Type                             | Default     | Description    |
| ---------- | -------------------------------- | ----------- | -------------- |
| `value`    | `number \| null`                 | `null`      | Current value  |
| `min`      | `number`                         | `undefined` | Minimum value  |
| `max`      | `number`                         | `undefined` | Maximum value  |
| `step`     | `number`                         | `1`         | Increment step |
| `disabled` | `boolean`                        | `false`     | Disable input  |
| `size`     | `'small' \| 'medium' \| 'large'` | `'medium'`  | Input size     |
| `error`    | `string`                         | `undefined` | Error message  |

### Events

| Event          | Payload          | Description             |
| -------------- | ---------------- | ----------------------- |
| `update:value` | `number \| null` | Value changed (v-model) |
