<script setup>
import NotificationBasic from '../../../ui/components/demos/notification/NotificationBasic.vue';
import notificationBasicCode from '../../../ui/components/demos/notification/NotificationBasic.vue?raw';
import notificationBasicVue2 from '../../../ui/components/demos/notification/NotificationBasic.vue2?raw';
import notificationBasicReact from '../../../ui/components/demos/notification/NotificationBasic.react?raw';
</script>

# Notification

Rich card-like notifications with title and description, using an imperative API.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Click buttons to trigger different types of notifications." :code="notificationBasicCode" :code-vue2="notificationBasicVue2" :code-react="notificationBasicReact">
  <NotificationBasic />
</DemoBox>

## API Reference

### useNotification() Methods

| Method       | Payload                                  | Description          |
| ------------ | ---------------------------------------- | -------------------- |
| `.info()`    | `{ title: string, description: string }` | Info notification    |
| `.success()` | `{ title: string, description: string }` | Success notification |
| `.warning()` | `{ title: string, description: string }` | Warning notification |
| `.error()`   | `{ title: string, description: string }` | Error notification   |
