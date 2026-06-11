<script setup>
import SplitBasic from '../../../ui/components/demos/split/SplitBasic.vue';
import splitBasicCode from '../../../ui/components/demos/split/SplitBasic.vue?raw';
import splitBasicVue2 from '../../../ui/components/demos/split/SplitBasic.vue2?raw';
import splitBasicReact from '../../../ui/components/demos/split/SplitBasic.react?raw';
</script>

# Split

Two-pane resizable splitter. Drag the bar between panes to redistribute space.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Horizontal split with two resizable panels." :code="splitBasicCode" :code-vue2="splitBasicVue2" :code-react="splitBasicReact">
  <SplitBasic />
</DemoBox>

## API Reference

### Props

| Prop          | Type                            | Default        | Description                         |
| ------------- | ------------------------------- | -------------- | ----------------------------------- |
| `direction`   | `'horizontal' \| 'vertical'`    | `'horizontal'` | Split orientation                   |
| `defaultSize` | `number \| string`              | `'50%'`        | Initial first pane size             |
| `size`        | `number \| string \| undefined` | `undefined`    | Controlled first pane size override |
| `minSize`     | `number \| string`              | `0`            | Minimum first pane size             |
| `maxSize`     | `number \| string`              | `'100%'`       | Maximum first pane size             |
| `disabled`    | `boolean`                       | `false`        | Disable drag resizing               |

### Events

| Event          | Payload            | Description                   |
| -------------- | ------------------ | ----------------------------- |
| `update:size`  | `number \| string` | Fires when first pane resizes |
| `resize-start` | —                  | Fires when drag begins        |
| `resize-end`   | —                  | Fires when drag ends          |

### Slots

| Slot     | Description         |
| -------- | ------------------- |
| `first`  | First pane content  |
| `second` | Second pane content |
