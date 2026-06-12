<script setup>
import PopconfirmBasic from '../../../ui/components/demos/popconfirm/PopconfirmBasic.vue';
import popconfirmBasicCode from '../../../ui/components/demos/popconfirm/PopconfirmBasic.vue?raw';
import popconfirmBasicVue2 from '../../../ui/components/demos/popconfirm/PopconfirmBasic.vue2?raw';
import popconfirmBasicReact from '../../../ui/components/demos/popconfirm/PopconfirmBasic.react?raw';
</script>

# Popconfirm

A confirmation popup before executing an action, triggered by click.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Click-triggered confirmation popup with a title." :code="popconfirmBasicCode" :code-vue2="popconfirmBasicVue2" :code-react="popconfirmBasicReact">
  <PopconfirmBasic />
</DemoBox>

## Custom Button Text

Use `positive-text` and `negative-text` to customise the confirmation and cancel button labels.

::: code-group

```vue [Vue 3]
<template>
  <ChronixPopconfirm
    title="This action cannot be undone."
    positive-text="Yes, delete"
    negative-text="No, keep"
    @positive-click="onDelete"
  >
    <ChronixButton type="danger">Delete Item</ChronixButton>
  </ChronixPopconfirm>
</template>

<script setup lang="ts">
import { ChronixPopconfirm, ChronixButton } from '@chronixjs/ui-vue3';

function onDelete() {
  console.log('Item deleted!');
}
</script>
```

```vue [Vue 2]
<template>
  <ChronixPopconfirm
    title="This action cannot be undone."
    positive-text="Yes, delete"
    negative-text="No, keep"
    @positive-click="onDelete"
  >
    <ChronixButton type="danger">Delete Item</ChronixButton>
  </ChronixPopconfirm>
</template>

<script>
import { ChronixPopconfirm, ChronixButton } from '@chronixjs/ui-vue2';
export default {
  components: { ChronixPopconfirm, ChronixButton },
  methods: {
    onDelete() {
      console.log('Item deleted!');
    },
  },
};
</script>
```

```tsx [React]
import { ChronixPopconfirm, ChronixButton } from '@chronixjs/ui-react';

export function App() {
  function onDelete() {
    console.log('Item deleted!');
  }

  return (
    <ChronixPopconfirm
      title="This action cannot be undone."
      positiveText="Yes, delete"
      negativeText="No, keep"
      onPositiveClick={onDelete}
    >
      <ChronixButton type="danger">Delete Item</ChronixButton>
    </ChronixPopconfirm>
  );
}
```

:::

## Placements

The popconfirm popup supports 12 placement positions. The default is `top`.

Available placements: `top`, `top-start`, `top-end`, `bottom`, `bottom-start`, `bottom-end`, `left`, `left-start`, `left-end`, `right`, `right-start`, `right-end`.

::: code-group

```vue [Vue 3]
<template>
  <ChronixPopconfirm title="Confirm this action?" placement="bottom" @positive-click="onConfirm">
    <ChronixButton>Bottom Placement</ChronixButton>
  </ChronixPopconfirm>
</template>

<script setup lang="ts">
import { ChronixPopconfirm, ChronixButton } from '@chronixjs/ui-vue3';

function onConfirm() {
  console.log('Confirmed!');
}
</script>
```

```vue [Vue 2]
<template>
  <ChronixPopconfirm title="Confirm this action?" placement="bottom" @positive-click="onConfirm">
    <ChronixButton>Bottom Placement</ChronixButton>
  </ChronixPopconfirm>
</template>

<script>
import { ChronixPopconfirm, ChronixButton } from '@chronixjs/ui-vue2';
export default {
  components: { ChronixPopconfirm, ChronixButton },
  methods: {
    onConfirm() {
      console.log('Confirmed!');
    },
  },
};
</script>
```

```tsx [React]
import { ChronixPopconfirm, ChronixButton } from '@chronixjs/ui-react';

export function App() {
  function onConfirm() {
    console.log('Confirmed!');
  }

  return (
    <ChronixPopconfirm title="Confirm this action?" placement="bottom" onPositiveClick={onConfirm}>
      <ChronixButton>Bottom Placement</ChronixButton>
    </ChronixPopconfirm>
  );
}
```

:::

## API Reference

### Props

| Prop           | Type                                        | Default     | Description           |
| -------------- | ------------------------------------------- | ----------- | --------------------- |
| `title`        | `string`                                    | `''`        | Confirmation text     |
| `positiveText` | `string`                                    | `'OK'`      | Confirm button label  |
| `negativeText` | `string`                                    | `'Cancel'`  | Cancel button label   |
| `show`         | `boolean`                                   | `undefined` | Controlled visibility |
| `trigger`      | `'hover' \| 'click' \| 'focus' \| 'manual'` | `'click'`   | Trigger mode          |
| `placement`    | `PopupPlacement`                            | `'top'`     | Popup position        |
| `offset`       | `number`                                    | `4`         | Gap in px             |
| `flip`         | `boolean`                                   | `true`      | Auto-flip placement   |
| `disabled`     | `boolean`                                   | `false`     | Disable popconfirm    |

### Events

| Event            | Payload      | Description        |
| ---------------- | ------------ | ------------------ |
| `update:show`    | `boolean`    | Visibility changed |
| `positive-click` | `MouseEvent` | Confirm clicked    |
| `negative-click` | `MouseEvent` | Cancel clicked     |

### Slots

| Slot      | Description     |
| --------- | --------------- |
| `default` | Trigger element |
