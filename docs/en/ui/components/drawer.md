<script setup>
import DrawerBasic from '../../../ui/components/demos/drawer/DrawerBasic.vue';
import drawerBasicCode from '../../../ui/components/demos/drawer/DrawerBasic.vue?raw';
import drawerBasicVue2 from '../../../ui/components/demos/drawer/DrawerBasic.vue2?raw';
import drawerBasicReact from '../../../ui/components/demos/drawer/DrawerBasic.react?raw';
</script>

# Drawer

A slide-in panel from the viewport edge with overlay.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Click the button to open the drawer panel." :code="drawerBasicCode" :code-vue2="drawerBasicVue2" :code-react="drawerBasicReact">
  <DrawerBasic />
</DemoBox>

## API Reference

### Props

| Prop        | Type                | Default   | Description                |
| ----------- | ------------------- | --------- | -------------------------- |
| `show`      | `boolean`           | `false`   | Visibility (v-model)       |
| `title`     | `string`            | `''`      | Title text                 |
| `placement` | `'left' \| 'right'` | `'right'` | Drawer placement direction |

### Events

| Event         | Payload   | Description        |
| ------------- | --------- | ------------------ |
| `update:show` | `boolean` | Visibility changed |

### Slots

| Slot      | Description         |
| --------- | ------------------- |
| `default` | Drawer body content |
