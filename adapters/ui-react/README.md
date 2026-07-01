# @chronixjs/ui-react

React 18 / 19 adapter for [`@chronixjs/ui`](../../packages/ui/) — 85 React components wrapping the framework-agnostic UI IR.

## Install

```bash
pnpm add @chronixjs/ui-react @chronixjs/ui react react-dom
```

`react` and `react-dom` are peer dependencies (`^18.0.0 || ^19.0.0`); `@chronixjs/ui` is a regular dependency.

## Quick start

```tsx
import { ChronixUIProvider, ChronixButton, ChronixInput, ChronixTabs } from '@chronixjs/ui-react';
import { useState } from 'react';

const tabs = [
  { key: 'tab1', label: 'Tab 1', content: 'Content 1', disabled: false },
  { key: 'tab2', label: 'Tab 2', content: 'Content 2', disabled: false },
];

function App() {
  const [activeTab, setActiveTab] = useState('tab1');

  return (
    <ChronixUIProvider>
      <ChronixButton variant="primary">Click me</ChronixButton>
      <ChronixInput placeholder="Type here..." />
      <ChronixTabs value={activeTab} onUpdateValue={setActiveTab} items={tabs} />
    </ChronixUIProvider>
  );
}
```

## Component catalog (85 components)

Same catalog as `@chronixjs/ui-vue3`. See the [Vue 3 README](../ui-vue3/README.md#component-catalog-85-components) for the full list.

## React conventions

- **Controlled props**: `value` + `onUpdateValue` (not `onChange`). This matches the Vue `v-model:value` idiom for cross-adapter consistency.
- **Event handlers**: `onClick`, `onSelect`, `onClose`, etc. follow React naming conventions.
- **Portals**: Modal, Drawer, Popover, Tooltip use `createPortal` for portal rendering.
- **Refs**: Some imperative components (Message, Notification) use function-call API via static methods.

## Status

v0.1.0-alpha. APIs may shift before `1.0.0`. SemVer stability commitment begins at `1.0`.

## License

MIT
