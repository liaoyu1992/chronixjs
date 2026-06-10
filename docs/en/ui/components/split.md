# Split

Two-pane resizable splitter. Drag the bar between panes to redistribute space.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

::: code-group

```vue [Vue 3]
<template>
  <CxSplit default-size="50%">
    <template #first>
      <div style="padding: 16px;">Left Pane</div>
    </template>
    <template #second>
      <div style="padding: 16px;">Right Pane</div>
    </template>
  </CxSplit>
</template>

<script setup lang="ts">
import { CxSplit } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxSplit default-size="50%">
    <template slot="first">
      <div style="padding: 16px;">Left Pane</div>
    </template>
    <template slot="second">
      <div style="padding: 16px;">Right Pane</div>
    </template>
  </CxSplit>
</template>

<script>
import { CxSplit } from '@chronixjs/ui-vue2';
export default { components: { CxSplit } };
</script>
```

```tsx [React]
import { CxSplit } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxSplit
      defaultSize="50%"
      first={<div style={{ padding: 16 }}>Left Pane</div>}
      second={<div style={{ padding: 16 }}>Right Pane</div>}
    />
  );
}
```

:::

## Vertical Split

::: code-group

```vue [Vue 3]
<template>
  <CxSplit direction="vertical" default-size="200px" min-size="100" max-size="400">
    <template #first>
      <div style="padding: 16px;">Top Pane</div>
    </template>
    <template #second>
      <div style="padding: 16px;">Bottom Pane</div>
    </template>
  </CxSplit>
</template>

<script setup lang="ts">
import { CxSplit } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxSplit direction="vertical" default-size="200px" min-size="100" max-size="400">
    <template slot="first">
      <div style="padding: 16px;">Top Pane</div>
    </template>
    <template slot="second">
      <div style="padding: 16px;">Bottom Pane</div>
    </template>
  </CxSplit>
</template>

<script>
import { CxSplit } from '@chronixjs/ui-vue2';
export default { components: { CxSplit } };
</script>
```

```tsx [React]
import { CxSplit } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxSplit
      direction="vertical"
      defaultSize="200px"
      minSize={100}
      maxSize={400}
      first={<div style={{ padding: 16 }}>Top Pane</div>}
      second={<div style={{ padding: 16 }}>Bottom Pane</div>}
    />
  );
}
```

:::

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
