# Tooltip

A text-only popup for brief hints on hover.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

Wrap any element with `CxTooltip` and set the `content` prop to the hint text. The tooltip appears on hover by default.

::: code-group

```vue [Vue 3]
<template>
  <CxTooltip content="This is a tooltip">
    <CxButton>Hover me</CxButton>
  </CxTooltip>
</template>

<script setup lang="ts">
import { CxTooltip, CxButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxTooltip content="This is a tooltip">
    <CxButton>Hover me</CxButton>
  </CxTooltip>
</template>

<script>
import { CxTooltip, CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxTooltip, CxButton },
};
</script>
```

```tsx [React]
import { CxTooltip, CxButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxTooltip content="This is a tooltip">
      <CxButton>Hover me</CxButton>
    </CxTooltip>
  );
}
```

:::

## Placements

The tooltip popup supports 12 placement positions. The default is `top`.

Available placements: `top`, `top-start`, `top-end`, `bottom`, `bottom-start`, `bottom-end`, `left`, `left-start`, `left-end`, `right`, `right-start`, `right-end`.

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; gap: 8px;">
    <CxTooltip content="Top tooltip" placement="top">
      <CxButton>Top</CxButton>
    </CxTooltip>
    <CxTooltip content="Bottom tooltip" placement="bottom">
      <CxButton>Bottom</CxButton>
    </CxTooltip>
    <CxTooltip content="Left tooltip" placement="left">
      <CxButton>Left</CxButton>
    </CxTooltip>
    <CxTooltip content="Right tooltip" placement="right">
      <CxButton>Right</CxButton>
    </CxTooltip>
  </div>
</template>

<script setup lang="ts">
import { CxTooltip, CxButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; gap: 8px;">
    <CxTooltip content="Top tooltip" placement="top">
      <CxButton>Top</CxButton>
    </CxTooltip>
    <CxTooltip content="Bottom tooltip" placement="bottom">
      <CxButton>Bottom</CxButton>
    </CxTooltip>
    <CxTooltip content="Left tooltip" placement="left">
      <CxButton>Left</CxButton>
    </CxTooltip>
    <CxTooltip content="Right tooltip" placement="right">
      <CxButton>Right</CxButton>
    </CxTooltip>
  </div>
</template>

<script>
import { CxTooltip, CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxTooltip, CxButton },
};
</script>
```

```tsx [React]
import { CxTooltip, CxButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <CxTooltip content="Top tooltip" placement="top">
        <CxButton>Top</CxButton>
      </CxTooltip>
      <CxTooltip content="Bottom tooltip" placement="bottom">
        <CxButton>Bottom</CxButton>
      </CxTooltip>
      <CxTooltip content="Left tooltip" placement="left">
        <CxButton>Left</CxButton>
      </CxTooltip>
      <CxTooltip content="Right tooltip" placement="right">
        <CxButton>Right</CxButton>
      </CxTooltip>
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
