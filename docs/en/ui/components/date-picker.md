<script setup>
import DatePickerBasic from '../../../ui/components/demos/date-picker/DatePickerBasic.vue';
import datePickerBasicCode from '../../../ui/components/demos/date-picker/DatePickerBasic.vue?raw';
import datePickerBasicVue2 from '../../../ui/components/demos/date-picker/DatePickerBasic.vue2?raw';
import datePickerBasicReact from '../../../ui/components/demos/date-picker/DatePickerBasic.react?raw';
</script>

# Date Picker

A date selection calendar with format control and date disabling.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Pick a date." :code="datePickerBasicCode" :code-vue2="datePickerBasicVue2" :code-react="datePickerBasicReact">
  <DatePickerBasic />
</DemoBox>

## API Reference

### Props

| Prop          | Type                | Default     | Description             |
| ------------- | ------------------- | ----------- | ----------------------- |
| `value`       | `Date \| undefined` | `undefined` | Selected date (v-model) |
| `placeholder` | `string`            | `''`        | Placeholder text        |
| `disabled`    | `boolean`           | `false`     | Disable the picker      |

### Events

| Event          | Payload | Description          |
| -------------- | ------- | -------------------- |
| `update:value` | `Date`  | Fired on date change |
