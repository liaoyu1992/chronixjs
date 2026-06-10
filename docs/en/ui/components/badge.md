# Badge

Badges display status indicators, counts, or notifications. They can wrap child elements or render standalone.

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
  <CxBadge :value="5">
    <CxButton>Messages</CxButton>
  </CxBadge>
</template>

<script setup lang="ts">
import { CxBadge, CxButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxBadge :value="5">
    <CxButton>Messages</CxButton>
  </CxBadge>
</template>

<script>
import { CxBadge, CxButton } from '@chronixjs/ui-vue2';
export default { components: { CxBadge, CxButton } };
</script>
```

```tsx [React]
import { CxBadge, CxButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxBadge value={5}>
      <CxButton>Messages</CxButton>
    </CxBadge>
  );
}
```

:::

## Standalone Badge

Without a default slot, the badge renders as a standalone element:

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; gap: 8px;">
    <CxBadge :value="12" />
    <CxBadge value="new" type="success" />
    <CxBadge :value="99" type="error" />
  </div>
</template>

<script setup lang="ts">
import { CxBadge } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; gap: 8px;">
    <CxBadge :value="12" />
    <CxBadge value="new" type="success" />
    <CxBadge :value="99" type="error" />
  </div>
</template>

<script>
import { CxBadge } from '@chronixjs/ui-vue2';
export default { components: { CxBadge } };
</script>
```

```tsx [React]
import { CxBadge } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <CxBadge value={12} />
      <CxBadge value="new" type="success" />
      <CxBadge value={99} type="error" />
    </div>
  );
}
```

:::

## Max Value

Truncate large numbers with `max`. Displays as `max+` when exceeded:

::: code-group

```vue [Vue 3]
<template>
  <CxBadge :value="150" :max="99">
    <CxButton>Notifications</CxButton>
  </CxBadge>
  <!-- Displays: 99+ -->
</template>

<script setup lang="ts">
import { CxBadge, CxButton } from '@chronixjs/ui-vue3';
</script>
```

```tsx [React]
import { CxBadge, CxButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxBadge value={150} max={99}>
      <CxButton>Notifications</CxButton>
    </CxBadge>
  );
}
```

:::

## Dot Mode

Show a small dot indicator instead of a count:

::: code-group

```vue [Vue 3]
<template>
  <CxBadge dot>
    <CxButton>Updates</CxButton>
  </CxBadge>
</template>

<script setup lang="ts">
import { CxBadge, CxButton } from '@chronixjs/ui-vue3';
</script>
```

```tsx [React]
import { CxBadge, CxButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxBadge dot>
      <CxButton>Updates</CxButton>
    </CxBadge>
  );
}
```

:::

## Processing (Pulse)

Animate the badge with a pulse effect:

::: code-group

```vue [Vue 3]
<template>
  <CxBadge dot processing type="error">
    <CxButton>Live</CxButton>
  </CxBadge>
</template>

<script setup lang="ts">
import { CxBadge, CxButton } from '@chronixjs/ui-vue3';
</script>
```

```tsx [React]
import { CxBadge, CxButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxBadge dot processing type="error">
      <CxButton>Live</CxButton>
    </CxBadge>
  );
}
```

:::

## Badge Types

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; gap: 8px;">
    <CxBadge :value="5" type="default" />
    <CxBadge :value="5" type="success" />
    <CxBadge :value="5" type="warning" />
    <CxBadge :value="5" type="error" />
    <CxBadge :value="5" type="info" />
  </div>
</template>

<script setup lang="ts">
import { CxBadge } from '@chronixjs/ui-vue3';
</script>
```

```tsx [React]
import { CxBadge } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <CxBadge value={5} type="default" />
      <CxBadge value={5} type="success" />
      <CxBadge value={5} type="warning" />
      <CxBadge value={5} type="error" />
      <CxBadge value={5} type="info" />
    </div>
  );
}
```

:::

## API Reference

### Props

| Prop         | Type                                                       | Default     | Description          |
| ------------ | ---------------------------------------------------------- | ----------- | -------------------- |
| `value`      | `number \| string \| undefined`                            | `undefined` | Badge content        |
| `max`        | `number \| undefined`                                      | `undefined` | Truncation threshold |
| `dot`        | `boolean`                                                  | `false`     | Dot indicator mode   |
| `type`       | `'default' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'default'` | Semantic color       |
| `processing` | `boolean`                                                  | `false`     | Pulse animation      |
| `show`       | `boolean`                                                  | `true`      | Toggle visibility    |

### Slots

| Slot      | Description                               |
| --------- | ----------------------------------------- |
| `default` | Wrapped element; omit for standalone mode |
