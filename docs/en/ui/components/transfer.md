<script setup>
import TransferBasic from '../../../ui/components/demos/transfer/TransferBasic.vue';
import transferBasicCode from '../../../ui/components/demos/transfer/TransferBasic.vue?raw';
import transferBasicVue2 from '../../../ui/components/demos/transfer/TransferBasic.vue2?raw';
import transferBasicReact from '../../../ui/components/demos/transfer/TransferBasic.react?raw';
</script>

# Transfer

A dual-panel transfer component for moving items between source and target lists.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Move options between source and target panels." :code="transferBasicCode" :code-vue2="transferBasicVue2" :code-react="transferBasicReact">
  <TransferBasic />
</DemoBox>

## API Reference

### Props

| Prop      | Type                   | Default | Description           |
| --------- | ---------------------- | ------- | --------------------- |
| `value`   | `(string \| number)[]` | `[]`    | Target list values    |
| `options` | `TransferOption[]`     | `[]`    | All available options |

### Events

| Event          | Payload | Description              |
| -------------- | ------- | ------------------------ |
| `update:value` | `any[]` | Fired when value changes |
