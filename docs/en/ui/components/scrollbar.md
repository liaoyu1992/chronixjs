<script setup>
import ScrollbarBasic from '../../../ui/components/demos/scrollbar/ScrollbarBasic.vue';
import scrollbarBasicCode from '../../../ui/components/demos/scrollbar/ScrollbarBasic.vue?raw';
import scrollbarBasicVue2 from '../../../ui/components/demos/scrollbar/ScrollbarBasic.vue2?raw';
import scrollbarBasicReact from '../../../ui/components/demos/scrollbar/ScrollbarBasic.react?raw';
</script>

# Scrollbar

Custom-styled scrollbar container with configurable trigger mode.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Vertical scrollbar with long content inside a fixed-height container." :code="scrollbarBasicCode" :code-vue2="scrollbarBasicVue2" :code-react="scrollbarBasicReact">
  <ScrollbarBasic />
</DemoBox>

## API Reference

### Props

| Prop          | Type                | Default   | Description                 |
| ------------- | ------------------- | --------- | --------------------------- |
| `trigger`     | `'hover' \| 'none'` | `'hover'` | When to show the scrollbar  |
| `xScrollable` | `boolean`           | `false`   | Enable horizontal scrolling |

### Slots

| Slot      | Description        |
| --------- | ------------------ |
| `default` | Scrollable content |
