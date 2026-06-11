<script setup>
import CascaderBasic from '../../../ui/components/demos/cascader/CascaderBasic.vue';
import cascaderBasicCode from '../../../ui/components/demos/cascader/CascaderBasic.vue?raw';
import cascaderBasicVue2 from '../../../ui/components/demos/cascader/CascaderBasic.vue2?raw';
import cascaderBasicReact from '../../../ui/components/demos/cascader/CascaderBasic.react?raw';
</script>

# Cascader

Multi-level cascading selection with nested panels.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="A cascader with nested options." :code="cascaderBasicCode" :code-vue2="cascaderBasicVue2" :code-react="cascaderBasicReact">
  <CascaderBasic />
</DemoBox>

## API Reference

### Props

| Prop          | Type               | Default     | Description              |
| ------------- | ------------------ | ----------- | ------------------------ |
| `value`       | `string`           | `undefined` | Selected value (v-model) |
| `options`     | `CascaderOption[]` | `[]`        | Cascader options         |
| `placeholder` | `string`           | `''`        | Placeholder text         |

### Events

| Event          | Payload  | Description     |
| -------------- | -------- | --------------- |
| `update:value` | `string` | Fired on change |
