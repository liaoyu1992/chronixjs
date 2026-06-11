<script setup>
import PopoverBasic from '../../../ui/components/demos/popover/PopoverBasic.vue';
import popoverBasicCode from '../../../ui/components/demos/popover/PopoverBasic.vue?raw';
import popoverBasicVue2 from '../../../ui/components/demos/popover/PopoverBasic.vue2?raw';
import popoverBasicReact from '../../../ui/components/demos/popover/PopoverBasic.react?raw';
</script>

# Popover

A popup surface for rich content, triggered by hover or click.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Click-triggered popover with content slot." :code="popoverBasicCode" :code-vue2="popoverBasicVue2" :code-react="popoverBasicReact">
  <PopoverBasic />
</DemoBox>

## Trigger Modes

Use the `trigger` prop to control how the popover opens. The default is `hover`.

### Click Trigger

::: code-group

```vue [Vue 3]
<template>
  <ChronixPopover trigger="click">
    <template #default>
      <ChronixButton>Click me</ChronixButton>
    </template>
    <template #content>
      <p>This popover opens on click.</p>
    </template>
  </ChronixPopover>
</template>

<script setup lang="ts">
import { ChronixPopover, ChronixButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <ChronixPopover trigger="click">
    <template slot="default">
      <ChronixButton>Click me</ChronixButton>
    </template>
    <template slot="content">
      <p>This popover opens on click.</p>
    </template>
  </ChronixPopover>
</template>

<script>
import { ChronixPopover, ChronixButton } from '@chronixjs/ui-vue2';

export default {
  components: { ChronixPopover, ChronixButton },
};
</script>
```

```tsx [React]
import { ChronixPopover, ChronixButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <ChronixPopover trigger="click" content={<p>This popover opens on click.</p>}>
      <ChronixButton>Click me</ChronixButton>
    </ChronixPopover>
  );
}
```

:::

### Focus Trigger

::: code-group

```vue [Vue 3]
<template>
  <ChronixPopover trigger="focus">
    <template #default>
      <ChronixButton>Focus me</ChronixButton>
    </template>
    <template #content>
      <p>This popover opens on focus.</p>
    </template>
  </ChronixPopover>
</template>

<script setup lang="ts">
import { ChronixPopover, ChronixButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <ChronixPopover trigger="focus">
    <template slot="default">
      <ChronixButton>Focus me</ChronixButton>
    </template>
    <template slot="content">
      <p>This popover opens on focus.</p>
    </template>
  </ChronixPopover>
</template>

<script>
import { ChronixPopover, ChronixButton } from '@chronixjs/ui-vue2';

export default {
  components: { ChronixPopover, ChronixButton },
};
</script>
```

```tsx [React]
import { ChronixPopover, ChronixButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <ChronixPopover trigger="focus" content={<p>This popover opens on focus.</p>}>
      <ChronixButton>Focus me</ChronixButton>
    </ChronixPopover>
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
  <ChronixPopover placement="right">
    <template #default>
      <ChronixButton>Right Placement</ChronixButton>
    </template>
    <template #content>
      <p>Popover on the right side.</p>
    </template>
  </ChronixPopover>
</template>

<script setup lang="ts">
import { ChronixPopover, ChronixButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <ChronixPopover placement="right">
    <template slot="default">
      <ChronixButton>Right Placement</ChronixButton>
    </template>
    <template slot="content">
      <p>Popover on the right side.</p>
    </template>
  </ChronixPopover>
</template>

<script>
import { ChronixPopover, ChronixButton } from '@chronixjs/ui-vue2';

export default {
  components: { ChronixPopover, ChronixButton },
};
</script>
```

```tsx [React]
import { ChronixPopover, ChronixButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <ChronixPopover placement="right" content={<p>Popover on the right side.</p>}>
      <ChronixButton>Right Placement</ChronixButton>
    </ChronixPopover>
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
