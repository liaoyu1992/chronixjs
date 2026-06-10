# Alert

Displays important messages with semantic types (info, success, warning, error).

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
  <CxAlert>Here is an info message.</CxAlert>
</template>

<script setup lang="ts">
import { CxAlert } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxAlert>Here is an info message.</CxAlert>
</template>

<script>
import { CxAlert } from '@chronixjs/ui-vue2';
export default { components: { CxAlert } };
</script>
```

```tsx [React]
import { CxAlert } from '@chronixjs/ui-react';

export function App() {
  return <CxAlert>Here is an info message.</CxAlert>;
}
```

:::

## Alert Types

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; flex-direction: column; gap: 8px;">
    <CxAlert>Default message</CxAlert>
    <CxAlert type="info">Info message</CxAlert>
    <CxAlert type="success">Success message</CxAlert>
    <CxAlert type="warning">Warning message</CxAlert>
    <CxAlert type="error">Error message</CxAlert>
  </div>
</template>

<script setup lang="ts">
import { CxAlert } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; flex-direction: column; gap: 8px;">
    <CxAlert>Default message</CxAlert>
    <CxAlert type="info">Info message</CxAlert>
    <CxAlert type="success">Success message</CxAlert>
    <CxAlert type="warning">Warning message</CxAlert>
    <CxAlert type="error">Error message</CxAlert>
  </div>
</template>

<script>
import { CxAlert } from '@chronixjs/ui-vue2';
export default { components: { CxAlert } };
</script>
```

```tsx [React]
import { CxAlert } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <CxAlert>Default message</CxAlert>
      <CxAlert type="info">Info message</CxAlert>
      <CxAlert type="success">Success message</CxAlert>
      <CxAlert type="warning">Warning message</CxAlert>
      <CxAlert type="error">Error message</CxAlert>
    </div>
  );
}
```

:::

## With Title

::: code-group

```vue [Vue 3]
<template>
  <CxAlert type="success" title="Success"> Your operation was successful. </CxAlert>
</template>

<script setup lang="ts">
import { CxAlert } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxAlert type="success" title="Success"> Your operation was successful. </CxAlert>
</template>

<script>
import { CxAlert } from '@chronixjs/ui-vue2';
export default { components: { CxAlert } };
</script>
```

```tsx [React]
import { CxAlert } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxAlert type="success" title="Success">
      Your operation was successful.
    </CxAlert>
  );
}
```

:::

## Closable

::: code-group

```vue [Vue 3]
<template>
  <CxAlert type="warning" closable> This alert can be closed by the user. </CxAlert>
</template>

<script setup lang="ts">
import { CxAlert } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxAlert type="warning" closable> This alert can be closed by the user. </CxAlert>
</template>

<script>
import { CxAlert } from '@chronixjs/ui-vue2';
export default { components: { CxAlert } };
</script>
```

```tsx [React]
import { CxAlert } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxAlert type="warning" closable>
      This alert can be closed by the user.
    </CxAlert>
  );
}
```

:::

## API Reference

### Props

| Prop       | Type                                                       | Default     | Description         |
| ---------- | ---------------------------------------------------------- | ----------- | ------------------- |
| `type`     | `'default' \| 'info' \| 'success' \| 'warning' \| 'error'` | `'default'` | Alert semantic type |
| `title`    | `string`                                                   | `undefined` | Optional title text |
| `closable` | `boolean`                                                  | `false`     | Show close button   |
| `bordered` | `boolean`                                                  | `true`      | Show border         |

### Events

| Event   | Payload      | Description                     |
| ------- | ------------ | ------------------------------- |
| `close` | `MouseEvent` | Fired when close button clicked |

### Slots

| Slot      | Description        |
| --------- | ------------------ |
| `default` | Alert body content |
