# @chronixjs/ui-vue2

Vue 2.7 adapter for [`@chronixjs/ui`](../../packages/ui/) — 85 Vue 2 components wrapping the framework-agnostic UI IR. Uses Vue 2.7 Composition API (`defineComponent` + `setup`).

## Install

```bash
pnpm add @chronixjs/ui-vue2 @chronixjs/ui vue
```

`vue` is a peer dependency (`^2.7.0`); `@chronixjs/ui` is a regular dependency.

## Quick start

```vue
<script>
import { ChronixUIProvider, ChronixButton, ChronixInput, ChronixTabs } from '@chronixjs/ui-vue2';

export default {
  components: {
    ChronixUIProvider,
    ChronixButton,
    ChronixInput,
    ChronixTabs,
  },
  data() {
    return {
      activeTab: 'tab1',
      tabs: [
        { key: 'tab1', label: 'Tab 1', content: 'Content 1', disabled: false },
        { key: 'tab2', label: 'Tab 2', content: 'Content 2', disabled: false },
      ],
    };
  },
};
</script>

<template>
  <ChronixUIProvider>
    <ChronixButton variant="primary">Click me</ChronixButton>
    <ChronixInput placeholder="Type here..." />
    <ChronixTabs v-model:value="activeTab" :items="tabs" />
  </ChronixUIProvider>
</template>
```

## Component catalog (85 components)

Same catalog as `@chronixjs/ui-vue3`. See the [Vue 3 README](../ui-vue3/README.md#component-catalog-85-components) for the full list.

## Vue 2 limitations (v0.1.0-alpha)

- **No `<Teleport>`**: Portal components (Modal, Drawer, Popover, Tooltip) render inline with `position: fixed`. This works for most layouts but ancestors with `transform` / `will-change` may clip. A proper portal solution is planned for v0.2.
- **`v-model:value`**: Uses Vue 2's `model` option for two-way binding. Some components use `:value` + `@input` / `@update:value` explicitly.

## Status

v0.1.0-alpha. APIs may shift before `1.0.0`. SemVer stability commitment begins at `1.0`.

## License

MIT
