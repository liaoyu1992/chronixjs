# Popconfirm

A confirmation popup before executing an action, triggered by click.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

Wrap any trigger element with `CxPopconfirm`. When the user clicks the trigger, a small confirmation popup appears with **OK** and **Cancel** buttons.

::: code-group

```vue [Vue 3]
<template>
  <CxPopconfirm title="Are you sure?" @positive-click="onConfirm">
    <CxButton type="danger">Delete</CxButton>
  </CxPopconfirm>
</template>

<script setup lang="ts">
import { CxPopconfirm, CxButton } from '@chronixjs/ui-vue3';

function onConfirm() {
  console.log('Confirmed!');
}
</script>
```

```vue [Vue 2]
<template>
  <CxPopconfirm title="Are you sure?" @positive-click="onConfirm">
    <CxButton type="danger">Delete</CxButton>
  </CxPopconfirm>
</template>

<script>
import { CxPopconfirm, CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxPopconfirm, CxButton },
  methods: {
    onConfirm() {
      console.log('Confirmed!');
    },
  },
};
</script>
```

```tsx [React]
import { CxPopconfirm, CxButton } from '@chronixjs/ui-react';

export function App() {
  function onConfirm() {
    console.log('Confirmed!');
  }

  return (
    <CxPopconfirm title="Are you sure?" onPositiveClick={onConfirm}>
      <CxButton type="danger">Delete</CxButton>
    </CxPopconfirm>
  );
}
```

:::

## Custom Button Text

Use `positive-text` and `negative-text` to customise the confirmation and cancel button labels.

::: code-group

```vue [Vue 3]
<template>
  <CxPopconfirm
    title="This action cannot be undone."
    positive-text="Yes, delete"
    negative-text="No, keep"
    @positive-click="onDelete"
  >
    <CxButton type="danger">Delete Item</CxButton>
  </CxPopconfirm>
</template>

<script setup lang="ts">
import { CxPopconfirm, CxButton } from '@chronixjs/ui-vue3';

function onDelete() {
  console.log('Item deleted!');
}
</script>
```

```vue [Vue 2]
<template>
  <CxPopconfirm
    title="This action cannot be undone."
    positive-text="Yes, delete"
    negative-text="No, keep"
    @positive-click="onDelete"
  >
    <CxButton type="danger">Delete Item</CxButton>
  </CxPopconfirm>
</template>

<script>
import { CxPopconfirm, CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxPopconfirm, CxButton },
  methods: {
    onDelete() {
      console.log('Item deleted!');
    },
  },
};
</script>
```

```tsx [React]
import { CxPopconfirm, CxButton } from '@chronixjs/ui-react';

export function App() {
  function onDelete() {
    console.log('Item deleted!');
  }

  return (
    <CxPopconfirm
      title="This action cannot be undone."
      positiveText="Yes, delete"
      negativeText="No, keep"
      onPositiveClick={onDelete}
    >
      <CxButton type="danger">Delete Item</CxButton>
    </CxPopconfirm>
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
  <CxPopconfirm title="Confirm this action?" placement="bottom" @positive-click="onConfirm">
    <CxButton>Bottom Placement</CxButton>
  </CxPopconfirm>
</template>

<script setup lang="ts">
import { CxPopconfirm, CxButton } from '@chronixjs/ui-vue3';

function onConfirm() {
  console.log('Confirmed!');
}
</script>
```

```vue [Vue 2]
<template>
  <CxPopconfirm title="Confirm this action?" placement="bottom" @positive-click="onConfirm">
    <CxButton>Bottom Placement</CxButton>
  </CxPopconfirm>
</template>

<script>
import { CxPopconfirm, CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxPopconfirm, CxButton },
  methods: {
    onConfirm() {
      console.log('Confirmed!');
    },
  },
};
</script>
```

```tsx [React]
import { CxPopconfirm, CxButton } from '@chronixjs/ui-react';

export function App() {
  function onConfirm() {
    console.log('Confirmed!');
  }

  return (
    <CxPopconfirm title="Confirm this action?" placement="bottom" onPositiveClick={onConfirm}>
      <CxButton>Bottom Placement</CxButton>
    </CxPopconfirm>
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
