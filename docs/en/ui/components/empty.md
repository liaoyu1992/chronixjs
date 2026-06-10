# Empty

A placeholder component for empty states with an icon and description.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

Simple empty state with default description:

::: code-group

```vue [Vue 3]
<template>
  <CxEmpty />
</template>

<script setup lang="ts">
import { CxEmpty } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxEmpty />
</template>

<script>
import { CxEmpty } from '@chronixjs/ui-vue2';
export default {
  components: { CxEmpty },
};
</script>
```

```tsx [React]
import { CxEmpty } from '@chronixjs/ui-react';

export function App() {
  return <CxEmpty />;
}
```

:::

## Custom Description

Set a custom description text for the empty state:

::: code-group

```vue [Vue 3]
<template>
  <CxEmpty description="No results found" />
</template>

<script setup lang="ts">
import { CxEmpty } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxEmpty description="No results found" />
</template>

<script>
import { CxEmpty } from '@chronixjs/ui-vue2';
export default {
  components: { CxEmpty },
};
</script>
```

```tsx [React]
import { CxEmpty } from '@chronixjs/ui-react';

export function App() {
  return <CxEmpty description="No results found" />;
}
```

:::

## Sizes

Use the `size` prop to control the empty state size:

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; flex-direction: column; gap: 24px;">
    <CxEmpty size="small" description="Small empty" />
    <CxEmpty size="medium" description="Medium empty" />
    <CxEmpty size="large" description="Large empty" />
  </div>
</template>

<script setup lang="ts">
import { CxEmpty } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; flex-direction: column; gap: 24px;">
    <CxEmpty size="small" description="Small empty" />
    <CxEmpty size="medium" description="Medium empty" />
    <CxEmpty size="large" description="Large empty" />
  </div>
</template>

<script>
import { CxEmpty } from '@chronixjs/ui-vue2';
export default {
  components: { CxEmpty },
};
</script>
```

```tsx [React]
import { CxEmpty } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <CxEmpty size="small" description="Small empty" />
      <CxEmpty size="medium" description="Medium empty" />
      <CxEmpty size="large" description="Large empty" />
    </div>
  );
}
```

:::

## API Reference

### Props

| Prop          | Type                             | Default     | Description      |
| ------------- | -------------------------------- | ----------- | ---------------- |
| `size`        | `'small' \| 'medium' \| 'large'` | `'medium'`  | Empty size       |
| `description` | `string`                         | `'No data'` | Description text |
