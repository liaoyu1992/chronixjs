<script setup>
import TreeSelectBasic from '../../../ui/components/demos/tree-select/TreeSelectBasic.vue';
import treeSelectBasicCode from '../../../ui/components/demos/tree-select/TreeSelectBasic.vue?raw';
import treeSelectBasicVue2 from '../../../ui/components/demos/tree-select/TreeSelectBasic.vue2?raw';
import treeSelectBasicReact from '../../../ui/components/demos/tree-select/TreeSelectBasic.react?raw';
</script>

# Tree Select

A dropdown selector with a nested tree structure.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="A tree-select with nested options for hierarchical selection." :code="treeSelectBasicCode" :code-vue2="treeSelectBasicVue2" :code-react="treeSelectBasicReact">
  <TreeSelectBasic />
</DemoBox>

## API Reference

### Props

| Prop          | Type         | Default     | Description              |
| ------------- | ------------ | ----------- | ------------------------ |
| `value`       | `string`     | `undefined` | Selected value (v-model) |
| `data`        | `TreeNode[]` | `[]`        | Tree data                |
| `placeholder` | `string`     | `''`        | Placeholder text         |

### Events

| Event          | Payload  | Description     |
| -------------- | -------- | --------------- |
| `update:value` | `string` | Fired on change |
