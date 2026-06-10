# Popover

A popup surface for rich content, triggered by hover or click.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

Wrap any trigger element with `CxPopover`. Use the `content` slot (Vue) or `content` prop (React) to provide the popover body.

::: code-group

```vue [Vue 3]
<template>
  <CxPopover>
    <template #default>
      <CxButton>Hover me</CxButton>
    </template>
    <template #content>
      <p>This is the popover content.</p>
    </template>
  </CxPopover>
</template>

<script setup lang="ts">
import { CxPopover, CxButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxPopover>
    <template slot="default">
      <CxButton>Hover me</CxButton>
    </template>
    <template slot="content">
      <p>This is the popover content.</p>
    </template>
  </CxPopover>
</template>

<script>
import { CxPopover, CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxPopover, CxButton },
};
</script>
```

```tsx [React]
import { CxPopover, CxButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxPopover content={<p>This is the popover content.</p>}>
      <CxButton>Hover me</CxButton>
    </CxPopover>
  );
}
```

:::

## Trigger Modes

Use the `trigger` prop to control how the popover opens. The default is `hover`.

### Click Trigger

::: code-group

```vue [Vue 3]
<template>
  <CxPopover trigger="click">
    <template #default>
      <CxButton>Click me</CxButton>
    </template>
    <template #content>
      <p>This popover opens on click.</p>
    </template>
  </CxPopover>
</template>

<script setup lang="ts">
import { CxPopover, CxButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxPopover trigger="click">
    <template slot="default">
      <CxButton>Click me</CxButton>
    </template>
    <template slot="content">
      <p>This popover opens on click.</p>
    </template>
  </CxPopover>
</template>

<script>
import { CxPopover, CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxPopover, CxButton },
};
</script>
```

```tsx [React]
import { CxPopover, CxButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxPopover trigger="click" content={<p>This popover opens on click.</p>}>
      <CxButton>Click me</CxButton>
    </CxPopover>
  );
}
```

:::

### Focus Trigger

::: code-group

```vue [Vue 3]
<template>
  <CxPopover trigger="focus">
    <template #default>
      <CxButton>Focus me</CxButton>
    </template>
    <template #content>
      <p>This popover opens on focus.</p>
    </template>
  </CxPopover>
</template>

<script setup lang="ts">
import { CxPopover, CxButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxPopover trigger="focus">
    <template slot="default">
      <CxButton>Focus me</CxButton>
    </template>
    <template slot="content">
      <p>This popover opens on focus.</p>
    </template>
  </CxPopover>
</template>

<script>
import { CxPopover, CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxPopover, CxButton },
};
</script>
```

```tsx [React]
import { CxPopover, CxButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxPopover trigger="focus" content={<p>This popover opens on focus.</p>}>
      <CxButton>Focus me</CxButton>
    </CxPopover>
  );
}
```

:::

## Placements

The popover popup supports 12 placement positions. The default is `bottom`.

Available placements: `top`, `top-start`, `top-end`, `bottom`, `bottom-start`, `bottom-end`, `left`, `left-start`, `left-end`, `right`, `right-start`, `right-end`.

::: code-group

```vue [Vue 3]
<template>
  <CxPopover placement="right">
    <template #default>
      <CxButton>Right Placement</CxButton>
    </template>
    <template #content>
      <p>Popover on the right side.</p>
    </template>
  </CxPopover>
</template>

<script setup lang="ts">
import { CxPopover, CxButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxPopover placement="right">
    <template slot="default">
      <CxButton>Right Placement</CxButton>
    </template>
    <template slot="content">
      <p>Popover on the right side.</p>
    </template>
  </CxPopover>
</template>

<script>
import { CxPopover, CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxPopover, CxButton },
};
</script>
```

```tsx [React]
import { CxPopover, CxButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxPopover placement="right" content={<p>Popover on the right side.</p>}>
      <CxButton>Right Placement</CxButton>
    </CxPopover>
  );
}
```

:::

## API Reference

### Props

| Prop         | Type                                        | Default     | Description           |
| ------------ | ------------------------------------------- | ----------- | --------------------- |
| `show`       | `boolean`                                   | `undefined` | Controlled visibility |
| `trigger`    | `'hover' \| 'click' \| 'focus' \| 'manual'` | `'hover'`   | Trigger mode          |
| `placement`  | `PopupPlacement`                            | `'bottom'`  | Popup position        |
| `offset`     | `number`                                    | `4`         | Gap in px             |
| `flip`       | `boolean`                                   | `true`      | Auto-flip placement   |
| `widthMatch` | `boolean`                                   | `false`     | Match anchor width    |
| `disabled`   | `boolean`                                   | `false`     | Disable popover       |

### Events

| Event         | Payload   | Description        |
| ------------- | --------- | ------------------ |
| `update:show` | `boolean` | Visibility changed |

### Slots

| Slot      | Description          |
| --------- | -------------------- |
| `default` | Trigger element      |
| `content` | Popover body content |
