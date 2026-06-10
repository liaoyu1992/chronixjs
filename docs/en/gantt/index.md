# Gantt Chart

A high-performance, framework-agnostic Gantt chart component with drag/resize, dependency links, and 6 timeline views.

## Features

- **6 Timeline Views** — hour, day, week, month, quarter, year
- **Drag & Resize** — interactive bar manipulation with snap-to-grid
- **Dependency Lines** — finish-to-start, start-to-start, finish-to-finish, start-to-finish
- **Theme Tokens** — fully customizable via CSS custom properties
- **Slot Registry** — extendable rendering slots for custom bar content
- **3 Framework Adapters** — Vue 3, Vue 2.7, React 18

## Install

::: code-group

```bash [Vue 3]
pnpm add @chronixjs/gantt-vue3@alpha vue
```

```bash [Vue 2]
pnpm add @chronixjs/gantt-vue2@alpha vue@^2.7
```

```bash [React]
pnpm add @chronixjs/gantt-react@alpha react@^18 react-dom@^18
```

:::

## Basic Usage

::: code-group

```vue [Vue 3]
<template>
  <CxGantt :tasks="tasks" style="height: 500px;" />
</template>

<script setup lang="ts">
import { CxGantt } from '@chronixjs/gantt-vue3';

const tasks = [
  { id: 1, name: 'Design', start: '2024-01-01', end: '2024-01-10', progress: 80 },
  { id: 2, name: 'Development', start: '2024-01-08', end: '2024-01-25', progress: 40 },
  { id: 3, name: 'Testing', start: '2024-01-20', end: '2024-02-01', progress: 0 },
];
</script>
```

```vue [Vue 2]
<template>
  <CxGantt :tasks="tasks" style="height: 500px;" />
</template>

<script>
import { CxGantt } from '@chronixjs/gantt-vue2';

export default {
  components: { CxGantt },
  data() {
    return {
      tasks: [
        { id: 1, name: 'Design', start: '2024-01-01', end: '2024-01-10', progress: 80 },
        { id: 2, name: 'Development', start: '2024-01-08', end: '2024-01-25', progress: 40 },
        { id: 3, name: 'Testing', start: '2024-01-20', end: '2024-02-01', progress: 0 },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { CxGantt } from '@chronixjs/gantt-react';

const tasks = [
  { id: 1, name: 'Design', start: '2024-01-01', end: '2024-01-10', progress: 80 },
  { id: 2, name: 'Development', start: '2024-01-08', end: '2024-01-25', progress: 40 },
  { id: 3, name: 'Testing', start: '2024-01-20', end: '2024-02-01', progress: 0 },
];

export function App() {
  return <CxGantt tasks={tasks} style={{ height: 500 }} />;
}
```

:::

## Next Steps

- [Getting Started](/en/gantt/getting-started) — detailed setup guide
- [Bars](/en/gantt/bars) — bar configuration and customization
- [Links & Dependencies](/en/gantt/links) — connecting tasks
- [Timeline Views](/en/gantt/views) — switching between views
- [Theme](/en/gantt/theme) — styling and theming
