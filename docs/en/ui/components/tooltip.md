<script setup>
import TooltipBasic from '../../../ui/components/demos/tooltip/TooltipBasic.vue';
import tooltipBasicCode from '../../../ui/components/demos/tooltip/TooltipBasic.vue?raw';
import tooltipBasicVue2 from '../../../ui/components/demos/tooltip/TooltipBasic.vue2?raw';
import tooltipBasicReact from '../../../ui/components/demos/tooltip/TooltipBasic.react?raw';
</script>

# Tooltip

A text-only popup for brief hints on hover.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Tooltip shown on hover with content text." :code="tooltipBasicCode" :code-vue2="tooltipBasicVue2" :code-react="tooltipBasicReact">
  <TooltipBasic />
</DemoBox>

## Placements

The tooltip popup supports 12 placement positions. The default is `top`.

Available placements: `top`, `top-start`, `top-end`, `bottom`, `bottom-start`, `bottom-end`, `left`, `left-start`, `left-end`, `right`, `right-start`, `right-end`.

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; gap: 8px;">
    <ChronixTooltip content="Top tooltip" placement="top">
      <ChronixButton>Top</ChronixButton>
    </ChronixTooltip>
    <ChronixTooltip content="Bottom tooltip" placement="bottom">
      <ChronixButton>Bottom</ChronixButton>
    </ChronixTooltip>
    <ChronixTooltip content="Left tooltip" placement="left">
      <ChronixButton>Left</ChronixButton>
    </ChronixTooltip>
    <ChronixTooltip content="Right tooltip" placement="right">
      <ChronixButton>Right</ChronixButton>
    </ChronixTooltip>
  </div>
</template>

<script setup lang="ts">
import { ChronixTooltip, ChronixButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; gap: 8px;">
    <ChronixTooltip content="Top tooltip" placement="top">
      <ChronixButton>Top</ChronixButton>
    </ChronixTooltip>
    <ChronixTooltip content="Bottom tooltip" placement="bottom">
      <ChronixButton>Bottom</ChronixButton>
    </ChronixTooltip>
    <ChronixTooltip content="Left tooltip" placement="left">
      <ChronixButton>Left</ChronixButton>
    </ChronixTooltip>
    <ChronixTooltip content="Right tooltip" placement="right">
      <ChronixButton>Right</ChronixButton>
    </ChronixTooltip>
  </div>
</template>

<script>
import { ChronixTooltip, ChronixButton } from '@chronixjs/ui-vue2';
export default {
  components: { ChronixTooltip, ChronixButton },
};
</script>
```

```tsx [React]
import { ChronixTooltip, ChronixButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <ChronixTooltip content="Top tooltip" placement="top">
        <ChronixButton>Top</ChronixButton>
      </ChronixTooltip>
      <ChronixTooltip content="Bottom tooltip" placement="bottom">
        <ChronixButton>Bottom</ChronixButton>
      </ChronixTooltip>
      <ChronixTooltip content="Left tooltip" placement="left">
        <ChronixButton>Left</ChronixButton>
      </ChronixTooltip>
      <ChronixTooltip content="Right tooltip" placement="right">
        <ChronixButton>Right</ChronixButton>
      </ChronixTooltip>
    </div>
  );
}
```

:::

## API Reference

### Props

| Prop        | Type                                        | Default     | Description           |
| ----------- | ------------------------------------------- | ----------- | --------------------- |
| `content`   | `string`                                    | `''`        | Tooltip text          |
| `show`      | `boolean`                                   | `undefined` | Controlled visibility |
| `trigger`   | `'hover' \| 'click' \| 'focus' \| 'manual'` | `'hover'`   | Trigger mode          |
| `placement` | `PopupPlacement`                            | `'top'`     | Popup position        |
| `offset`    | `number`                                    | `6`         | Gap in px             |
| `flip`      | `boolean`                                   | `true`      | Auto-flip placement   |
| `disabled`  | `boolean`                                   | `false`     | Disable tooltip       |

### Events

| Event         | Payload   | Description        |
| ------------- | --------- | ------------------ |
| `update:show` | `boolean` | Visibility changed |

### Slots

| Slot      | Description     |
| --------- | --------------- |
| `default` | Trigger element |
