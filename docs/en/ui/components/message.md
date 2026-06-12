<script setup>
import MessageBasic from '../../../ui/components/demos/message/MessageBasic.vue';
import messageBasicCode from '../../../ui/components/demos/message/MessageBasic.vue?raw';
import messageBasicVue2 from '../../../ui/components/demos/message/MessageBasic.vue2?raw';
import messageBasicReact from '../../../ui/components/demos/message/MessageBasic.react?raw';
</script>

# Message

Lightweight inline notifications with auto-dismiss and imperative API.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Click buttons to trigger different types of messages." :code="messageBasicCode" :code-vue2="messageBasicVue2" :code-react="messageBasicReact">
  <MessageBasic />
</DemoBox>

## API Reference

### useMessage() Methods

| Method       | Payload  | Description     |
| ------------ | -------- | --------------- |
| `.info()`    | `string` | Info message    |
| `.success()` | `string` | Success message |
| `.warning()` | `string` | Warning message |
| `.error()`   | `string` | Error message   |
