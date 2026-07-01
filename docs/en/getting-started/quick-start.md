# Quick Start

Get up and running with Chronix in minutes. This guide walks you through using the most common components.

## Choose Your Framework

All Chronix adapters share the same API surface. Pick the adapter that matches your framework:

| Framework     | Adapter Package      |
| ------------- | -------------------- |
| Vue 3         | `@chronixjs/*-vue3`  |
| Vue 2.7       | `@chronixjs/*-vue2`  |
| React 18 / 19 | `@chronixjs/*-react` |

## UI Components

The fastest way to get started is with the UI component library.

::: code-group

```bash [Vue 3]
pnpm add @chronixjs/ui-vue3@alpha vue
```

```bash [Vue 2]
pnpm add @chronixjs/ui-vue2@alpha vue@^2.7
```

```bash [React]
pnpm add @chronixjs/ui-react@alpha react react-dom
```

:::

Now use a component:

::: code-group

```vue [Vue 3]
<template>
  <div style="padding: 24px;">
    <CxButton type="primary" @click="count++"> Clicked {{ count }} times </CxButton>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxButton } from '@chronixjs/ui-vue3';

const count = ref(0);
</script>
```

```vue [Vue 2]
<template>
  <div style="padding: 24px;">
    <CxButton type="primary" @click="count++"> Clicked {{ count }} times </CxButton>
  </div>
</template>

<script>
import { CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxButton },
  data() {
    return { count: 0 };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxButton } from '@chronixjs/ui-react';

export function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: 24 }}>
      <CxButton type="primary" onClick={() => setCount((c) => c + 1)}>
        Clicked {count} times
      </CxButton>
    </div>
  );
}
```

:::

## Gantt Chart

::: code-group

```bash [Vue 3]
pnpm add @chronixjs/gantt-vue3@alpha vue
```

```bash [Vue 2]
pnpm add @chronixjs/gantt-vue2@alpha vue@^2.7
```

```bash [React]
pnpm add @chronixjs/gantt-react@alpha react react-dom
```

:::

::: code-group

```vue [Vue 3]
<template>
  <CxGantt :tasks="tasks" :options="options" style="height: 500px;" />
</template>

<script setup lang="ts">
import { CxGantt } from '@chronixjs/gantt-vue3';

const tasks = [
  { id: 1, name: 'Task A', start: '2024-01-01', end: '2024-01-15' },
  { id: 2, name: 'Task B', start: '2024-01-10', end: '2024-01-25' },
];

const options = {
  viewMode: 'day',
  editable: true,
};
</script>
```

```vue [Vue 2]
<template>
  <CxGantt :tasks="tasks" :options="options" style="height: 500px;" />
</template>

<script>
import { CxGantt } from '@chronixjs/gantt-vue2';

export default {
  components: { CxGantt },
  data() {
    return {
      tasks: [
        { id: 1, name: 'Task A', start: '2024-01-01', end: '2024-01-15' },
        { id: 2, name: 'Task B', start: '2024-01-10', end: '2024-01-25' },
      ],
      options: {
        viewMode: 'day',
        editable: true,
      },
    };
  },
};
</script>
```

```tsx [React]
import { CxGantt } from '@chronixjs/gantt-react';

const tasks = [
  { id: 1, name: 'Task A', start: '2024-01-01', end: '2024-01-15' },
  { id: 2, name: 'Task B', start: '2024-01-10', end: '2024-01-25' },
];

const options = {
  viewMode: 'day',
  editable: true,
};

export function App() {
  return <CxGantt tasks={tasks} options={options} style={{ height: 500 }} />;
}
```

:::

## Data Table

::: code-group

```bash [Vue 3]
pnpm add @chronixjs/table-vue3@alpha vue
```

```bash [Vue 2]
pnpm add @chronixjs/table-vue2@alpha vue@^2.7
```

```bash [React]
pnpm add @chronixjs/table-react@alpha react react-dom
```

:::

::: code-group

```vue [Vue 3]
<template>
  <CxTable :columns="columns" :rows="rows" style="height: 400px;" />
</template>

<script setup lang="ts">
import { CxTable } from '@chronixjs/table-vue3';

const columns = [
  { key: 'name', title: 'Name', width: 200 },
  { key: 'age', title: 'Age', width: 100 },
  { key: 'role', title: 'Role', width: 200 },
];

const rows = [
  { name: 'Alice', age: 28, role: 'Engineer' },
  { name: 'Bob', age: 34, role: 'Designer' },
];
</script>
```

```vue [Vue 2]
<template>
  <CxTable :columns="columns" :rows="rows" style="height: 400px;" />
</template>

<script>
import { CxTable } from '@chronixjs/table-vue2';

export default {
  components: { CxTable },
  data() {
    return {
      columns: [
        { key: 'name', title: 'Name', width: 200 },
        { key: 'age', title: 'Age', width: 100 },
        { key: 'role', title: 'Role', width: 200 },
      ],
      rows: [
        { name: 'Alice', age: 28, role: 'Engineer' },
        { name: 'Bob', age: 34, role: 'Designer' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { CxTable } from '@chronixjs/table-react';

const columns = [
  { key: 'name', title: 'Name', width: 200 },
  { key: 'age', title: 'Age', width: 100 },
  { key: 'role', title: 'Role', width: 200 },
];

const rows = [
  { name: 'Alice', age: 28, role: 'Engineer' },
  { name: 'Bob', age: 34, role: 'Designer' },
];

export function App() {
  return <CxTable columns={columns} rows={rows} style={{ height: 400 }} />;
}
```

:::

## Next Steps

- [Gantt Docs](/en/gantt/) — full Gantt chart documentation
- [Table Docs](/en/table/) — full data table documentation
- [UI Components](/en/ui/) — browse all 85 components
- [CX Kit](/en/cx-kit/) — headless primitives
