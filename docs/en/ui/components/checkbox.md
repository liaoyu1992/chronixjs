<script setup>
import CheckboxBasic from '../../../ui/components/demos/checkbox/CheckboxBasic.vue';
import checkboxBasicCode from '../../../ui/components/demos/checkbox/CheckboxBasic.vue?raw';
import checkboxBasicVue2 from '../../../ui/components/demos/checkbox/CheckboxBasic.vue2?raw';
import checkboxBasicReact from '../../../ui/components/demos/checkbox/CheckboxBasic.react?raw';
import CheckboxIndeterminate from '../../../ui/components/demos/checkbox/CheckboxIndeterminate.vue';
import checkboxIndeterminateCode from '../../../ui/components/demos/checkbox/CheckboxIndeterminate.vue?raw';
import checkboxIndeterminateVue2 from '../../../ui/components/demos/checkbox/CheckboxIndeterminate.vue2?raw';
import checkboxIndeterminateReact from '../../../ui/components/demos/checkbox/CheckboxIndeterminate.react?raw';
import CheckboxDisabled from '../../../ui/components/demos/checkbox/CheckboxDisabled.vue';
import checkboxDisabledCode from '../../../ui/components/demos/checkbox/CheckboxDisabled.vue?raw';
import checkboxDisabledVue2 from '../../../ui/components/demos/checkbox/CheckboxDisabled.vue2?raw';
import checkboxDisabledReact from '../../../ui/components/demos/checkbox/CheckboxDisabled.react?raw';
import CheckboxError from '../../../ui/components/demos/checkbox/CheckboxError.vue';
import checkboxErrorCode from '../../../ui/components/demos/checkbox/CheckboxError.vue?raw';
import checkboxErrorVue2 from '../../../ui/components/demos/checkbox/CheckboxError.vue2?raw';
import checkboxErrorReact from '../../../ui/components/demos/checkbox/CheckboxError.react?raw';
</script>

# Checkbox

Checkbox component with support for indeterminate state, labels, and validation errors.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Basic checkbox usage." :code="checkboxBasicCode" :code-vue2="checkboxBasicVue2" :code-react="checkboxBasicReact">
  <CheckboxBasic />
</DemoBox>

## Indeterminate State

<DemoBox title="Indeterminate State" description="The indeterminate state shows a horizontal bar, useful for select-all scenarios." :code="checkboxIndeterminateCode" :code-vue2="checkboxIndeterminateVue2" :code-react="checkboxIndeterminateReact">
  <CheckboxIndeterminate />
</DemoBox>

## Disabled

<DemoBox title="Disabled" description="Disabled checkboxes cannot be clicked." :code="checkboxDisabledCode" :code-vue2="checkboxDisabledVue2" :code-react="checkboxDisabledReact">
  <CheckboxDisabled />
</DemoBox>

## Error State

<DemoBox title="Error State" description="Display an error message using the error prop." :code="checkboxErrorCode" :code-vue2="checkboxErrorVue2" :code-react="checkboxErrorReact">
  <CheckboxError />
</DemoBox>

## API Reference

### Props

| Prop            | Type      | Default     | Description             |
| --------------- | --------- | ----------- | ----------------------- |
| `checked`       | `boolean` | `false`     | Checked state (v-model) |
| `indeterminate` | `boolean` | `false`     | Indeterminate state     |
| `disabled`      | `boolean` | `false`     | Disable the checkbox    |
| `label`         | `string`  | `undefined` | Label text              |
| `error`         | `string`  | `undefined` | Error message           |

### Events

| Event            | Payload   | Description             |
| ---------------- | --------- | ----------------------- |
| `update:checked` | `boolean` | State changed (v-model) |

### Slots

| Slot      | Description                                |
| --------- | ------------------------------------------ |
| `default` | Custom label content (replaces label prop) |
