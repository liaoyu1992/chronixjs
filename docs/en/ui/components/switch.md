# Switch

Toggle switch component for binary on/off states. Renders a native `<button role="switch">` with ARIA attributes for accessibility.

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
  <CxSwitch v-model:checked="enabled" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxSwitch } from '@chronixjs/ui-vue3';

const enabled = ref(false);
</script>
```

```vue [Vue 2]
<template>
  <CxSwitch v-model:checked="enabled" />
</template>

<script>
import { CxSwitch } from '@chronixjs/ui-vue2';
export default {
  components: { CxSwitch },
  data() {
    return { enabled: false };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxSwitch } from '@chronixjs/ui-react';

export function App() {
  const [enabled, setEnabled] = useState(false);
  return <CxSwitch checked={enabled} onUpdateChecked={setEnabled} />;
}
```

:::

## Sizes

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; gap: 16px; align-items: center;">
    <CxSwitch size="small" />
    <CxSwitch size="medium" />
    <CxSwitch size="large" />
  </div>
</template>

<script setup lang="ts">
import { CxSwitch } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; gap: 16px; align-items: center;">
    <CxSwitch size="small" />
    <CxSwitch size="medium" />
    <CxSwitch size="large" />
  </div>
</template>

<script>
import { CxSwitch } from '@chronixjs/ui-vue2';
export default { components: { CxSwitch } };
</script>
```

```tsx [React]
import { CxSwitch } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <CxSwitch size="small" />
      <CxSwitch size="medium" />
      <CxSwitch size="large" />
    </div>
  );
}
```

:::

## Disabled

::: code-group

```vue [Vue 3]
<template>
  <CxSwitch checked disabled />
</template>

<script setup lang="ts">
import { CxSwitch } from '@chronixjs/ui-vue3';
</script>
```

```tsx [React]
<CxSwitch checked disabled />
```

:::

## Error State

::: code-group

```vue [Vue 3]
<template>
  <CxSwitch v-model:checked="agreed" error="You must enable this to continue" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxSwitch } from '@chronixjs/ui-vue3';

const agreed = ref(false);
</script>
```

```tsx [React]
<CxSwitch checked={agreed} onUpdateChecked={setAgreed} error="You must enable this" />
```

:::

## With Labels

Combine with text for descriptive toggles:

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; align-items: center; gap: 8px;">
    <CxSwitch v-model:checked="darkMode" />
    <span>Dark Mode</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxSwitch } from '@chronixjs/ui-vue3';

const darkMode = ref(false);
</script>
```

```tsx [React]
<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
  <CxSwitch checked={darkMode} onUpdateChecked={setDarkMode} />
  <span>Dark Mode</span>
</div>
```

:::

## Accessibility

The switch renders as `<button type="button" role="switch">` with:

- `aria-checked` reflecting the checked state
- `aria-disabled` when disabled
- Keyboard toggle with Space/Enter

## API Reference

### Props

| Prop       | Type                             | Default     | Description            |
| ---------- | -------------------------------- | ----------- | ---------------------- |
| `checked`  | `boolean`                        | `false`     | On/off state (v-model) |
| `disabled` | `boolean`                        | `false`     | Disable the switch     |
| `size`     | `'small' \| 'medium' \| 'large'` | `'medium'`  | Switch size            |
| `error`    | `string`                         | `undefined` | Error message          |

### Events

| Event            | Payload   | Description             |
| ---------------- | --------- | ----------------------- |
| `update:checked` | `boolean` | State changed (v-model) |
