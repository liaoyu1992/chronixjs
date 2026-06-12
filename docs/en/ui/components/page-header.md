<script setup>
import PageHeaderBasic from '../../../ui/components/demos/page-header/PageHeaderBasic.vue';
import pageHeaderBasicCode from '../../../ui/components/demos/page-header/PageHeaderBasic.vue?raw';
import pageHeaderBasicVue2 from '../../../ui/components/demos/page-header/PageHeaderBasic.vue2?raw';
import pageHeaderBasicReact from '../../../ui/components/demos/page-header/PageHeaderBasic.react?raw';
</script>

# Page Header

Standardized top-of-page heading block with optional back affordance, avatar, title, subtitle, extra actions, and footer.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Page header with title, subtitle, and back button." :code="pageHeaderBasicCode" :code-vue2="pageHeaderBasicVue2" :code-react="pageHeaderBasicReact">
  <PageHeaderBasic />
</DemoBox>

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
