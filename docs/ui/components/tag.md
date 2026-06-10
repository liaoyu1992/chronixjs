# Tag

Tags are used for labeling, categorization, and small inline markers. They support semantic colors, sizes, closability, and pill-shaped rounding.

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
  <CxTag>Default</CxTag>
  <CxTag type="primary">Primary</CxTag>
  <CxTag type="success">Success</CxTag>
</template>

<script setup lang="ts">
import { CxTag } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div>
    <CxTag>Default</CxTag>
    <CxTag type="primary">Primary</CxTag>
    <CxTag type="success">Success</CxTag>
  </div>
</template>

<script>
import { CxTag } from '@chronixjs/ui-vue2';
export default { components: { CxTag } };
</script>
```

```tsx [React]
import { CxTag } from '@chronixjs/ui-react';

export function App() {
  return (
    <>
      <CxTag>Default</CxTag>
      <CxTag type="primary">Primary</CxTag>
      <CxTag type="success">Success</CxTag>
    </>
  );
}
```

:::

## Tag Types

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; gap: 8px;">
    <CxTag type="default">Default</CxTag>
    <CxTag type="primary">Primary</CxTag>
    <CxTag type="info">Info</CxTag>
    <CxTag type="success">Success</CxTag>
    <CxTag type="warning">Warning</CxTag>
    <CxTag type="error">Error</CxTag>
  </div>
</template>

<script setup lang="ts">
import { CxTag } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; gap: 8px;">
    <CxTag type="default">Default</CxTag>
    <CxTag type="primary">Primary</CxTag>
    <CxTag type="info">Info</CxTag>
    <CxTag type="success">Success</CxTag>
    <CxTag type="warning">Warning</CxTag>
    <CxTag type="error">Error</CxTag>
  </div>
</template>

<script>
import { CxTag } from '@chronixjs/ui-vue2';
export default { components: { CxTag } };
</script>
```

```tsx [React]
import { CxTag } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <CxTag type="default">Default</CxTag>
      <CxTag type="primary">Primary</CxTag>
      <CxTag type="info">Info</CxTag>
      <CxTag type="success">Success</CxTag>
      <CxTag type="warning">Warning</CxTag>
      <CxTag type="error">Error</CxTag>
    </div>
  );
}
```

:::

## Sizes

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; gap: 8px; align-items: center;">
    <CxTag size="small">Small</CxTag>
    <CxTag size="medium">Medium</CxTag>
    <CxTag size="large">Large</CxTag>
  </div>
</template>

<script setup lang="ts">
import { CxTag } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; gap: 8px; align-items: center;">
    <CxTag size="small">Small</CxTag>
    <CxTag size="medium">Medium</CxTag>
    <CxTag size="large">Large</CxTag>
  </div>
</template>

<script>
import { CxTag } from '@chronixjs/ui-vue2';
export default { components: { CxTag } };
</script>
```

```tsx [React]
import { CxTag } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <CxTag size="small">Small</CxTag>
      <CxTag size="medium">Medium</CxTag>
      <CxTag size="large">Large</CxTag>
    </div>
  );
}
```

:::

## Closable

Tags can show a close button. Listen for the `close` event to remove them:

::: code-group

```vue [Vue 3]
<template>
  <CxTag type="primary" closable @close="onClose">Removable</CxTag>
</template>

<script setup lang="ts">
import { CxTag } from '@chronixjs/ui-vue3';

function onClose(event: MouseEvent) {
  console.log('Tag closed');
}
</script>
```

```vue [Vue 2]
<template>
  <CxTag type="primary" closable @close="onClose">Removable</CxTag>
</template>

<script>
import { CxTag } from '@chronixjs/ui-vue2';
export default {
  components: { CxTag },
  methods: {
    onClose(event) {
      console.log('Tag closed');
    },
  },
};
</script>
```

```tsx [React]
import { CxTag } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxTag type="primary" closable onClose={(e) => console.log('Tag closed')}>
      Removable
    </CxTag>
  );
}
```

:::

## Round (Pill)

::: code-group

```vue [Vue 3]
<template>
  <CxTag type="info" round>Pill Tag</CxTag>
</template>

<script setup lang="ts">
import { CxTag } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxTag type="info" round>Pill Tag</CxTag>
</template>

<script>
import { CxTag } from '@chronixjs/ui-vue2';
export default { components: { CxTag } };
</script>
```

```tsx [React]
import { CxTag } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxTag type="info" round>
      Pill Tag
    </CxTag>
  );
}
```

:::

## Disabled

::: code-group

```vue [Vue 3]
<template>
  <CxTag type="primary" disabled>Disabled Tag</CxTag>
</template>

<script setup lang="ts">
import { CxTag } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxTag type="primary" disabled>Disabled Tag</CxTag>
</template>

<script>
import { CxTag } from '@chronixjs/ui-vue2';
export default { components: { CxTag } };
</script>
```

```tsx [React]
import { CxTag } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxTag type="primary" disabled>
      Disabled Tag
    </CxTag>
  );
}
```

:::

## API Reference

### Props

| Prop       | Type                                                                    | Default     | Description             |
| ---------- | ----------------------------------------------------------------------- | ----------- | ----------------------- |
| `type`     | `'default' \| 'primary' \| 'info' \| 'success' \| 'warning' \| 'error'` | `'default'` | Tag style type          |
| `size`     | `'small' \| 'medium' \| 'large'`                                        | `'medium'`  | Tag size                |
| `bordered` | `boolean`                                                               | `true`      | Show border             |
| `round`    | `boolean`                                                               | `false`     | Pill-shaped corners     |
| `closable` | `boolean`                                                               | `false`     | Show close button       |
| `disabled` | `boolean`                                                               | `false`     | Non-interactive + muted |

### Events

| Event   | Payload      | Description          |
| ------- | ------------ | -------------------- |
| `close` | `MouseEvent` | Close button clicked |
