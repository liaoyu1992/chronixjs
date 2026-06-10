# Space

A 1D layout primitive for consistent spacing between elements.

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
  <CxSpace>
    <CxButton>Button 1</CxButton>
    <CxButton>Button 2</CxButton>
    <CxButton>Button 3</CxButton>
  </CxSpace>
</template>

<script setup lang="ts">
import { CxSpace, CxButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxSpace>
    <CxButton>Button 1</CxButton>
    <CxButton>Button 2</CxButton>
    <CxButton>Button 3</CxButton>
  </CxSpace>
</template>

<script>
import { CxSpace, CxButton } from '@chronixjs/ui-vue2';
export default {
  components: { CxSpace, CxButton },
};
</script>
```

```tsx [React]
import { CxSpace, CxButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxSpace>
      <CxButton>Button 1</CxButton>
      <CxButton>Button 2</CxButton>
      <CxButton>Button 3</CxButton>
    </CxSpace>
  );
}
```

:::

## Vertical

Use the `vertical` prop to stack children vertically.

::: code-group

```vue [Vue 3]
<template>
  <CxSpace vertical>
    <CxButton>Button 1</CxButton>
    <CxButton>Button 2</CxButton>
    <CxButton>Button 3</CxButton>
  </CxSpace>
</template>

<script setup lang="ts">
import { CxSpace, CxButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxSpace vertical>
    <CxButton>Button 1</CxButton>
    <CxButton>Button 2</CxButton>
    <CxButton>Button 3</CxButton>
  </CxSpace>
</template>

<script>
import { CxSpace, CxButton } from '@chronixjs/ui-vue2';
export default {
  components: { CxSpace, CxButton },
};
</script>
```

```tsx [React]
import { CxSpace, CxButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxSpace vertical>
      <CxButton>Button 1</CxButton>
      <CxButton>Button 2</CxButton>
      <CxButton>Button 3</CxButton>
    </CxSpace>
  );
}
```

:::

## Sizes

Use the `size` prop with preset sizes: `small`, `medium` (default), and `large`.

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; flex-direction: column; gap: 16px;">
    <CxSpace size="small">
      <CxButton>Small</CxButton>
      <CxButton>Small</CxButton>
    </CxSpace>
    <CxSpace size="medium">
      <CxButton>Medium</CxButton>
      <CxButton>Medium</CxButton>
    </CxSpace>
    <CxSpace size="large">
      <CxButton>Large</CxButton>
      <CxButton>Large</CxButton>
    </CxSpace>
  </div>
</template>

<script setup lang="ts">
import { CxSpace, CxButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; flex-direction: column; gap: 16px;">
    <CxSpace size="small">
      <CxButton>Small</CxButton>
      <CxButton>Small</CxButton>
    </CxSpace>
    <CxSpace size="medium">
      <CxButton>Medium</CxButton>
      <CxButton>Medium</CxButton>
    </CxSpace>
    <CxSpace size="large">
      <CxButton>Large</CxButton>
      <CxButton>Large</CxButton>
    </CxSpace>
  </div>
</template>

<script>
import { CxSpace, CxButton } from '@chronixjs/ui-vue2';
export default {
  components: { CxSpace, CxButton },
};
</script>
```

```tsx [React]
import { CxSpace, CxButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <CxSpace size="small">
        <CxButton>Small</CxButton>
        <CxButton>Small</CxButton>
      </CxSpace>
      <CxSpace size="medium">
        <CxButton>Medium</CxButton>
        <CxButton>Medium</CxButton>
      </CxSpace>
      <CxSpace size="large">
        <CxButton>Large</CxButton>
        <CxButton>Large</CxButton>
      </CxSpace>
    </div>
  );
}
```

:::

## Custom Gap

Pass a number to `size` for a custom pixel gap.

::: code-group

```vue [Vue 3]
<template>
  <CxSpace :size="24">
    <CxButton>Button 1</CxButton>
    <CxButton>Button 2</CxButton>
    <CxButton>Button 3</CxButton>
  </CxSpace>
</template>

<script setup lang="ts">
import { CxSpace, CxButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxSpace :size="24">
    <CxButton>Button 1</CxButton>
    <CxButton>Button 2</CxButton>
    <CxButton>Button 3</CxButton>
  </CxSpace>
</template>

<script>
import { CxSpace, CxButton } from '@chronixjs/ui-vue2';
export default {
  components: { CxSpace, CxButton },
};
</script>
```

```tsx [React]
import { CxSpace, CxButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxSpace size={24}>
      <CxButton>Button 1</CxButton>
      <CxButton>Button 2</CxButton>
      <CxButton>Button 3</CxButton>
    </CxSpace>
  );
}
```

:::

## API Reference

### Props

| Prop       | Type                                                                                  | Default     | Description          |
| ---------- | ------------------------------------------------------------------------------------- | ----------- | -------------------- |
| `size`     | `'small' \| 'medium' \| 'large' \| number`                                            | `'medium'`  | Gap size             |
| `vertical` | `boolean`                                                                             | `false`     | Vertical layout      |
| `wrap`     | `boolean`                                                                             | `true`      | Wrap children        |
| `align`    | `'start' \| 'center' \| 'end' \| 'baseline' \| 'stretch'`                             | `undefined` | Cross-axis alignment |
| `justify`  | `'start' \| 'center' \| 'end' \| 'space-around' \| 'space-between' \| 'space-evenly'` | `undefined` | Main-axis justify    |
| `inline`   | `boolean`                                                                             | `false`     | Inline-flex mode     |
