<script setup>
import InputBasic from '../../../ui/components/demos/input/InputBasic.vue';
import inputBasicCode from '../../../ui/components/demos/input/InputBasic.vue?raw';
import inputBasicVue2 from '../../../ui/components/demos/input/InputBasic.vue2?raw';
import inputBasicReact from '../../../ui/components/demos/input/InputBasic.react?raw';
import InputSizes from '../../../ui/components/demos/input/InputSizes.vue';
import inputSizesCode from '../../../ui/components/demos/input/InputSizes.vue?raw';
import inputSizesVue2 from '../../../ui/components/demos/input/InputSizes.vue2?raw';
import inputSizesReact from '../../../ui/components/demos/input/InputSizes.react?raw';
import InputClearable from '../../../ui/components/demos/input/InputClearable.vue';
import inputClearableCode from '../../../ui/components/demos/input/InputClearable.vue?raw';
import inputClearableVue2 from '../../../ui/components/demos/input/InputClearable.vue2?raw';
import inputClearableReact from '../../../ui/components/demos/input/InputClearable.react?raw';
import InputTextarea from '../../../ui/components/demos/input/InputTextarea.vue';
import inputTextareaCode from '../../../ui/components/demos/input/InputTextarea.vue?raw';
import inputTextareaVue2 from '../../../ui/components/demos/input/InputTextarea.vue2?raw';
import inputTextareaReact from '../../../ui/components/demos/input/InputTextarea.react?raw';
import InputDisabled from '../../../ui/components/demos/input/InputDisabled.vue';
import inputDisabledCode from '../../../ui/components/demos/input/InputDisabled.vue?raw';
import inputDisabledVue2 from '../../../ui/components/demos/input/InputDisabled.vue2?raw';
import inputDisabledReact from '../../../ui/components/demos/input/InputDisabled.react?raw';
import InputError from '../../../ui/components/demos/input/InputError.vue';
import inputErrorCode from '../../../ui/components/demos/input/InputError.vue?raw';
import inputErrorVue2 from '../../../ui/components/demos/input/InputError.vue2?raw';
import inputErrorReact from '../../../ui/components/demos/input/InputError.react?raw';
</script>

# Input

Text input component with clearable support, textarea mode, validation, and IME composition handling.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Basic text input usage." :code="inputBasicCode" :code-vue2="inputBasicVue2" :code-react="inputBasicReact">
  <InputBasic />
</DemoBox>

## Sizes

<DemoBox title="Sizes" description="Set input size with the size prop." :code="inputSizesCode" :code-vue2="inputSizesVue2" :code-react="inputSizesReact">
  <InputSizes />
</DemoBox>

## Textarea

<DemoBox title="Textarea" description="Set type=&quot;textarea&quot; for multi-line input. Use rows to set line count." :code="inputTextareaCode" :code-vue2="inputTextareaVue2" :code-react="inputTextareaReact">
  <InputTextarea />
</DemoBox>

## Clearable

<DemoBox title="Clearable" description="Show a clear button when the input has a value." :code="inputClearableCode" :code-vue2="inputClearableVue2" :code-react="inputClearableReact">
  <InputClearable />
</DemoBox>

## Disabled

<DemoBox title="Disabled" description="Disable the input with the disabled prop." :code="inputDisabledCode" :code-vue2="inputDisabledVue2" :code-react="inputDisabledReact">
  <InputDisabled />
</DemoBox>

## Error State

<DemoBox title="Error State" description="Display validation error messages with the error prop." :code="inputErrorCode" :code-vue2="inputErrorVue2" :code-react="inputErrorReact">
  <InputError />
</DemoBox>

## API Reference

### Props

| Prop          | Type                             | Default     | Description           |
| ------------- | -------------------------------- | ----------- | --------------------- |
| `value`       | `string`                         | `''`        | Input value (v-model) |
| `type`        | `'text' \| 'textarea'`           | `'text'`    | Input type            |
| `placeholder` | `string`                         | `undefined` | Placeholder text      |
| `disabled`    | `boolean`                        | `false`     | Disable the input     |
| `clearable`   | `boolean`                        | `false`     | Show clear button     |
| `size`        | `'small' \| 'medium' \| 'large'` | `'medium'`  | Input size            |
| `rows`        | `number`                         | `3`         | Textarea rows         |
| `error`       | `string`                         | `undefined` | Error message         |

### Events

| Event          | Payload      | Description             |
| -------------- | ------------ | ----------------------- |
| `update:value` | `string`     | Value changed (v-model) |
| `focus`        | `FocusEvent` | Input focused           |
| `blur`         | `FocusEvent` | Input blurred           |
| `clear`        | —            | Clear button clicked    |
