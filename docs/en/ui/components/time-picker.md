<script setup>
import TimePickerBasic from '../../../ui/components/demos/time-picker/TimePickerBasic.vue';
import timePickerBasicCode from '../../../ui/components/demos/time-picker/TimePickerBasic.vue?raw';
import timePickerBasicVue2 from '../../../ui/components/demos/time-picker/TimePickerBasic.vue2?raw';
import timePickerBasicReact from '../../../ui/components/demos/time-picker/TimePickerBasic.react?raw';
</script>

# Time Picker

A time selection picker with scrollable hour/minute/second columns.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Pick a time." :code="timePickerBasicCode" :code-vue2="timePickerBasicVue2" :code-react="timePickerBasicReact">
  <TimePickerBasic />
</DemoBox>

## API Reference

### Props

| Prop          | Type                | Default     | Description             |
| ------------- | ------------------- | ----------- | ----------------------- |
| `value`       | `Date \| undefined` | `undefined` | Selected time (v-model) |
| `placeholder` | `string`            | `''`        | Placeholder text        |
| `disabled`    | `boolean`           | `false`     | Disable the picker      |

### Events

| Event          | Payload | Description             |
| -------------- | ------- | ----------------------- |
| `update:value` | `Date`  | Fired when time changes |
