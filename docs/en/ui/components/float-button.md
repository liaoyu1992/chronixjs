# Float Button

Floating action button anchored to a viewport corner with optional tooltip.

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
  <CxFloatButton icon="plus" tooltip="Add new" />
</template>

<script setup lang="ts">
import { CxFloatButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxFloatButton icon="plus" tooltip="Add new" />
</template>

<script>
import { CxFloatButton } from '@chronixjs/ui-vue2';
export default { components: { CxFloatButton } };
</script>
```

```tsx [React]
import { CxFloatButton } from '@chronixjs/ui-react';

export function App() {
  return <CxFloatButton icon="plus" tooltip="Add new" />;
}
```

:::

## Square Shape with Description

::: code-group

```vue [Vue 3]
<template>
  <CxFloatButton shape="square" type="primary" description="Help" :right="32" :bottom="80" />
</template>

<script setup lang="ts">
import { CxFloatButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxFloatButton shape="square" type="primary" description="Help" :right="32" :bottom="80" />
</template>

<script>
import { CxFloatButton } from '@chronixjs/ui-vue2';
export default { components: { CxFloatButton } };
</script>
```

```tsx [React]
import { CxFloatButton } from '@chronixjs/ui-react';

export function App() {
  return <CxFloatButton shape="square" type="primary" description="Help" right={32} bottom={80} />;
}
```

:::

## API Reference

### Props

| Prop          | Type                     | Default     | Description                             |
| ------------- | ------------------------ | ----------- | --------------------------------------- |
| `shape`       | `'circle' \| 'square'`   | `'circle'`  | Button shape                            |
| `type`        | `'default' \| 'primary'` | `'default'` | Button style type                       |
| `right`       | `number`                 | `24`        | Distance from viewport right edge (px)  |
| `bottom`      | `number`                 | `24`        | Distance from viewport bottom edge (px) |
| `top`         | `number \| undefined`    | `undefined` | Override bottom when set                |
| `left`        | `number \| undefined`    | `undefined` | Override right when set                 |
| `icon`        | `string \| undefined`    | `undefined` | Icon registry name                      |
| `tooltip`     | `string \| undefined`    | `undefined` | Hover tooltip text                      |
| `description` | `string \| undefined`    | `undefined` | Short text beneath/next to icon         |

### Events

| Event   | Payload      | Description               |
| ------- | ------------ | ------------------------- |
| `click` | `MouseEvent` | Fires when button clicked |

### Slots

| Slot      | Description         |
| --------- | ------------------- |
| `default` | Custom icon content |
