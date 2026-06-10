# Collapse Transition

Height transition wrapper for expand/collapse animations. Used internally by Collapse and exposed for ad-hoc needs.

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
  <button @click="visible = !visible">Toggle</button>
  <CxCollapseTransition :show="visible">
    <div style="padding: 16px;">Collapsible content here.</div>
  </CxCollapseTransition>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxCollapseTransition } from '@chronixjs/ui-vue3';

const visible = ref(false);
</script>
```

```vue [Vue 2]
<template>
  <button @click="visible = !visible">Toggle</button>
  <CxCollapseTransition :show="visible">
    <div style="padding: 16px;">Collapsible content here.</div>
  </CxCollapseTransition>
</template>

<script>
import { CxCollapseTransition } from '@chronixjs/ui-vue2';
export default {
  components: { CxCollapseTransition },
  data() {
    return { visible: false };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxCollapseTransition } from '@chronixjs/ui-react';

export function App() {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <button onClick={() => setVisible(!visible)}>Toggle</button>
      <CxCollapseTransition show={visible}>
        <div style={{ padding: 16 }}>Collapsible content here.</div>
      </CxCollapseTransition>
    </div>
  );
}
```

:::

## API Reference

### Props

| Prop       | Type      | Default | Description                            |
| ---------- | --------- | ------- | -------------------------------------- |
| `show`     | `boolean` | `false` | `true` = expanded, `false` = collapsed |
| `duration` | `number`  | `200`   | Animation duration in ms               |

### Slots

| Slot      | Description           |
| --------- | --------------------- |
| `default` | Content to transition |
