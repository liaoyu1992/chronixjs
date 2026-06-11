<script setup>
import DialogBasic from '../../../ui/components/demos/dialog/DialogBasic.vue';
import dialogBasicCode from '../../../ui/components/demos/dialog/DialogBasic.vue?raw';
import dialogBasicVue2 from '../../../ui/components/demos/dialog/DialogBasic.vue2?raw';
import dialogBasicReact from '../../../ui/components/demos/dialog/DialogBasic.react?raw';
</script>

# Dialog

Modal dialog with imperative API for confirmations and alerts.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Open a confirmation dialog via imperative API." :code="dialogBasicCode" :code-vue2="dialogBasicVue2" :code-react="dialogBasicReact">
  <DialogBasic />
</DemoBox>

## API Reference

### useDiscreteDialog() Methods

| Method       | Payload         | Description    |
| ------------ | --------------- | -------------- |
| `.info()`    | `DialogOptions` | Info dialog    |
| `.success()` | `DialogOptions` | Success dialog |
| `.warning()` | `DialogOptions` | Warning dialog |
| `.error()`   | `DialogOptions` | Error dialog   |

### DialogOptions

| Prop           | Type     | Description         |
| -------------- | -------- | ------------------- |
| `title`        | `string` | Dialog title        |
| `content`      | `string` | Dialog content      |
| `positiveText` | `string` | Confirm button text |
| `negativeText` | `string` | Cancel button text  |
