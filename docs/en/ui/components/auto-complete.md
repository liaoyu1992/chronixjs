<script setup>
import AutoCompleteBasic from '../../../ui/components/demos/auto-complete/AutoCompleteBasic.vue';
import autoCompleteBasicCode from '../../../ui/components/demos/auto-complete/AutoCompleteBasic.vue?raw';
import autoCompleteBasicVue2 from '../../../ui/components/demos/auto-complete/AutoCompleteBasic.vue2?raw';
import autoCompleteBasicReact from '../../../ui/components/demos/auto-complete/AutoCompleteBasic.react?raw';
</script>

# AutoComplete

An autocomplete input with type-ahead suggestions.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="A simple autocomplete with matching options shown as you type." :code="autoCompleteBasicCode" :code-vue2="autoCompleteBasicVue2" :code-react="autoCompleteBasicReact">
  <AutoCompleteBasic />
</DemoBox>

## API Reference

### Props

| Prop          | Type                             | Default    | Description               |
| ------------- | -------------------------------- | ---------- | ------------------------- |
| `value`       | `string`                         | `''`       | Input value               |
| `options`     | `AutoCompleteOption[]`           | `[]`       | Autocomplete options list |
| `placeholder` | `string`                         | `''`       | Placeholder text          |
| `disabled`    | `boolean`                        | `false`    | Disable the input         |
| `size`        | `'small' \| 'medium' \| 'large'` | `'medium'` | Input size                |
| `error`       | `boolean`                        | `false`    | Show error state          |

### Events

| Event          | Payload              | Description                |
| -------------- | -------------------- | -------------------------- |
| `update:value` | `string`             | Fires when value changes   |
| `select`       | `AutoCompleteOption` | Fires when option selected |
