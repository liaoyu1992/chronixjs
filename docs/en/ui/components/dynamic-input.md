<script setup>
import DynamicInputBasic from '../../../ui/components/demos/dynamic-input/DynamicInputBasic.vue';
import dynamicInputBasicCode from '../../../ui/components/demos/dynamic-input/DynamicInputBasic.vue?raw';
import dynamicInputBasicVue2 from '../../../ui/components/demos/dynamic-input/DynamicInputBasic.vue2?raw';
import dynamicInputBasicReact from '../../../ui/components/demos/dynamic-input/DynamicInputBasic.react?raw';
</script>

# Dynamic Input

Dynamic list of input values where the user can add or remove items.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Dynamic input with add and remove support." :code="dynamicInputBasicCode" :code-vue2="dynamicInputBasicVue2" :code-react="dynamicInputBasicReact">
  <DynamicInputBasic />
</DemoBox>

## API Reference

### Props

| Prop          | Type                  | Default     | Description                |
| ------------- | --------------------- | ----------- | -------------------------- |
| `value`       | `readonly unknown[]`  | `[]`        | Array of values            |
| `min`         | `number`              | `0`         | Minimum number of items    |
| `max`         | `number \| undefined` | `undefined` | Maximum number of items    |
| `disabled`    | `boolean`             | `false`     | Disable all inputs         |
| `placeholder` | `string`              | `''`        | Placeholder for each input |

### Events

| Event          | Payload     | Description             |
| -------------- | ----------- | ----------------------- |
| `update:value` | `unknown[]` | Fires when items change |
