# Modal

Portal-mounted centered surface with translucent mask, focus trap, body scroll lock, and Escape close.

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
  <button @click="show = true">Open Modal</button>
  <CxModal v-model:show="show" title="Confirm">
    <p>Are you sure you want to proceed?</p>
    <template #footer>
      <button @click="show = false">Cancel</button>
      <button @click="show = false">Confirm</button>
    </template>
  </CxModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxModal } from '@chronixjs/ui-vue3';

const show = ref(false);
</script>
```

```vue [Vue 2]
<template>
  <button @click="show = true">Open Modal</button>
  <CxModal :show.sync="show" title="Confirm">
    <p>Are you sure you want to proceed?</p>
    <template #footer>
      <button @click="show = false">Cancel</button>
      <button @click="show = false">Confirm</button>
    </template>
  </CxModal>
</template>

<script>
import { CxModal } from '@chronixjs/ui-vue2';
export default {
  components: { CxModal },
  data() {
    return { show: false };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxModal } from '@chronixjs/ui-react';

export function App() {
  const [show, setShow] = useState(false);

  return (
    <div>
      <button onClick={() => setShow(true)}>Open Modal</button>
      <CxModal show={show} onUpdateShow={setShow} title="Confirm">
        <p>Are you sure you want to proceed?</p>
      </CxModal>
    </div>
  );
}
```

:::

## API Reference

### Props

| Prop           | Type                   | Default     | Description                               |
| -------------- | ---------------------- | ----------- | ----------------------------------------- |
| `show`         | `boolean \| undefined` | `undefined` | Controlled visibility                     |
| `title`        | `string \| undefined`  | `undefined` | Modal title                               |
| `mask`         | `boolean`              | `true`      | Show translucent mask backdrop            |
| `maskClosable` | `boolean`              | `true`      | Close on mask click                       |
| `escClosable`  | `boolean`              | `true`      | Close on Escape key                       |
| `width`        | `number \| string`     | `520`       | Panel width (number → px, string → as-is) |
| `disabled`     | `boolean`              | `false`     | Prevent opening                           |

### Events

| Event         | Payload                             | Description                   |
| ------------- | ----------------------------------- | ----------------------------- |
| `update:show` | `boolean`                           | Fires when visibility changes |
| `close`       | `'mask' \| 'esc' \| 'close-button'` | Fires with close reason       |

### Slots

| Slot      | Description                    |
| --------- | ------------------------------ |
| `default` | Modal body content             |
| `header`  | Custom header (replaces title) |
| `footer`  | Bottom action row              |
