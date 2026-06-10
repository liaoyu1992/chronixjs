# Page Header

Standardized top-of-page heading block with optional back affordance, avatar, title, subtitle, extra actions, and footer.

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
  <CxPageHeader title="Dashboard" subtitle="Overview of your account" />
</template>

<script setup lang="ts">
import { CxPageHeader } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxPageHeader title="Dashboard" subtitle="Overview of your account" />
</template>

<script>
import { CxPageHeader } from '@chronixjs/ui-vue2';
export default { components: { CxPageHeader } };
</script>
```

```tsx [React]
import { CxPageHeader } from '@chronixjs/ui-react';

export function App() {
  return <CxPageHeader title="Dashboard" subtitle="Overview of your account" />;
}
```

:::

## With Back Button and Extra

::: code-group

```vue [Vue 3]
<template>
  <CxPageHeader title="User Profile" subtitle="Edit your settings" back @back="onBack">
    <template #extra>
      <button>Save</button>
    </template>
  </CxPageHeader>
</template>

<script setup lang="ts">
import { CxPageHeader } from '@chronixjs/ui-vue3';

function onBack() {
  console.log('Navigate back');
}
</script>
```

```vue [Vue 2]
<template>
  <CxPageHeader title="User Profile" subtitle="Edit your settings" back @back="onBack">
    <template slot="extra">
      <button>Save</button>
    </template>
  </CxPageHeader>
</template>

<script>
import { CxPageHeader } from '@chronixjs/ui-vue2';
export default {
  components: { CxPageHeader },
  methods: {
    onBack() {
      console.log('Navigate back');
    },
  },
};
</script>
```

```tsx [React]
import { CxPageHeader } from '@chronixjs/ui-react';

export function App() {
  function onBack() {
    console.log('Navigate back');
  }

  return (
    <CxPageHeader
      title="User Profile"
      subtitle="Edit your settings"
      back
      onBack={onBack}
      extra={<button>Save</button>}
    />
  );
}
```

:::

## API Reference

### Props

| Prop       | Type                  | Default     | Description                   |
| ---------- | --------------------- | ----------- | ----------------------------- |
| `title`    | `string \| undefined` | `undefined` | Heading text                  |
| `subtitle` | `string \| undefined` | `undefined` | Sub-heading text              |
| `back`     | `boolean`             | `false`     | Show back button              |
| `inverted` | `boolean`             | `false`     | Use dark-surface theme tokens |

### Events

| Event  | Payload | Description             |
| ------ | ------- | ----------------------- |
| `back` | —       | Fires when back clicked |

### Slots

| Slot       | Description                      |
| ---------- | -------------------------------- |
| `default`  | Main content area                |
| `back`     | Custom back button content       |
| `avatar`   | Avatar area                      |
| `title`    | Custom title (overrides prop)    |
| `subtitle` | Custom subtitle (overrides prop) |
| `extra`    | Right-aligned action area        |
| `footer`   | Footer area                      |
