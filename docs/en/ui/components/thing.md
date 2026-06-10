# Thing

Composition card with avatar + header (title + extra) + description + content + action + footer slots.

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
  <CxThing title="Jane Doe" description="Frontend Engineer at Chronix">
    <template #avatar>
      <span style="font-size: 24px;">👤</span>
    </template>
    <template #action>
      <button>Follow</button>
    </template>
    <p>Building framework-agnostic component libraries for the modern web.</p>
  </CxThing>
</template>

<script setup lang="ts">
import { CxThing } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxThing title="Jane Doe" description="Frontend Engineer at Chronix">
    <template slot="avatar">
      <span style="font-size: 24px;">👤</span>
    </template>
    <template slot="action">
      <button>Follow</button>
    </template>
    <p>Building framework-agnostic component libraries for the modern web.</p>
  </CxThing>
</template>

<script>
import { CxThing } from '@chronixjs/ui-vue2';
export default { components: { CxThing } };
</script>
```

```tsx [React]
import { CxThing } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxThing
      title="Jane Doe"
      description="Frontend Engineer at Chronix"
      avatar={<span style={{ fontSize: 24 }}>👤</span>}
      action={<button>Follow</button>}
    >
      <p>Building framework-agnostic component libraries for the modern web.</p>
    </CxThing>
  );
}
```

:::

## API Reference

### Props

| Prop              | Type                  | Default     | Description                            |
| ----------------- | --------------------- | ----------- | -------------------------------------- |
| `title`           | `string \| undefined` | `undefined` | Header title text                      |
| `description`     | `string \| undefined` | `undefined` | Secondary description text             |
| `contentIndented` | `boolean`             | `false`     | Indent body content past avatar column |

### Slots

| Slot           | Description                         |
| -------------- | ----------------------------------- |
| `default`      | Body content                        |
| `avatar`       | Left-of-main avatar / icon          |
| `header`       | Custom header (overrides title)     |
| `header-extra` | Right-aligned header content        |
| `description`  | Custom description (overrides prop) |
| `action`       | Interaction row (buttons etc.)      |
| `footer`       | Footer area                         |
