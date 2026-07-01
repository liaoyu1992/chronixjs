# Gantt — Getting Started

This guide walks you through setting up the Chronix Gantt chart in your project.

## Install

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

## Register the Component

::: code-group

```ts [Vue 3]
// main.ts
import { createApp } from 'vue';
import App from './App.vue';

// Styles are auto-injected by the adapter — no manual CSS import needed
createApp(App).mount('#app');
```

```ts [Vue 2]
// main.ts
import Vue from 'vue';
import App from './App.vue';

// Styles are auto-injected by the adapter
new Vue({ render: (h) => h(App) }).$mount('#app');
```

```tsx [React]
// main.tsx
import { createRoot } from 'react-dom/client';
import { App } from './App';

// Styles are auto-injected by the adapter
createRoot(document.getElementById('root')!).render(<App />);
```

:::

## Task Data Model

Each task in the Gantt chart follows this interface:

```ts
interface GanttTask {
  id: number | string;
  name: string;
  start: string; // ISO date string, e.g. '2024-01-15'
  end: string; // ISO date string
  progress?: number; // 0-100
  color?: string; // bar color override
  children?: GanttTask[];
}
```

## Full Example

::: code-group

```vue [Vue 3]
<template>
  <div>
    <h2>Project Timeline</h2>
    <CxGantt
      :tasks="tasks"
      :options="ganttOptions"
      style="height: 600px;"
      @bar-click="onBarClick"
      @bar-drag-end="onBarDragEnd"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxGantt } from '@chronixjs/gantt-vue3';

const tasks = ref([
  { id: 1, name: 'Planning', start: '2024-01-01', end: '2024-01-10', progress: 100 },
  { id: 2, name: 'Design', start: '2024-01-08', end: '2024-01-20', progress: 70 },
  { id: 3, name: 'Development', start: '2024-01-15', end: '2024-02-15', progress: 30 },
  { id: 4, name: 'Testing', start: '2024-02-10', end: '2024-02-28', progress: 0 },
]);

const ganttOptions = {
  viewMode: 'week',
  editable: true,
  showProgress: true,
};

function onBarClick(task: any) {
  console.log('Clicked:', task.name);
}

function onBarDragEnd(task: any) {
  console.log('Dragged:', task.name, 'new dates:', task.start, task.end);
}
</script>
```

```vue [Vue 2]
<template>
  <div>
    <h2>Project Timeline</h2>
    <CxGantt
      :tasks="tasks"
      :options="ganttOptions"
      style="height: 600px;"
      @bar-click="onBarClick"
      @bar-drag-end="onBarDragEnd"
    />
  </div>
</template>

<script>
import { CxGantt } from '@chronixjs/gantt-vue2';

export default {
  components: { CxGantt },
  data() {
    return {
      tasks: [
        { id: 1, name: 'Planning', start: '2024-01-01', end: '2024-01-10', progress: 100 },
        { id: 2, name: 'Design', start: '2024-01-08', end: '2024-01-20', progress: 70 },
        { id: 3, name: 'Development', start: '2024-01-15', end: '2024-02-15', progress: 30 },
        { id: 4, name: 'Testing', start: '2024-02-10', end: '2024-02-28', progress: 0 },
      ],
      ganttOptions: {
        viewMode: 'week',
        editable: true,
        showProgress: true,
      },
    };
  },
  methods: {
    onBarClick(task) {
      console.log('Clicked:', task.name);
    },
    onBarDragEnd(task) {
      console.log('Dragged:', task.name, 'new dates:', task.start, task.end);
    },
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxGantt } from '@chronixjs/gantt-react';

const initialTasks = [
  { id: 1, name: 'Planning', start: '2024-01-01', end: '2024-01-10', progress: 100 },
  { id: 2, name: 'Design', start: '2024-01-08', end: '2024-01-20', progress: 70 },
  { id: 3, name: 'Development', start: '2024-01-15', end: '2024-02-15', progress: 30 },
  { id: 4, name: 'Testing', start: '2024-02-10', end: '2024-02-28', progress: 0 },
];

export function App() {
  const [tasks, setTasks] = useState(initialTasks);

  const ganttOptions = {
    viewMode: 'week' as const,
    editable: true,
    showProgress: true,
  };

  return (
    <div>
      <h2>Project Timeline</h2>
      <CxGantt
        tasks={tasks}
        options={ganttOptions}
        style={{ height: 600 }}
        onBarClick={(task: any) => console.log('Clicked:', task.name)}
        onBarDragEnd={(task: any) => console.log('Dragged:', task.name)}
      />
    </div>
  );
}
```

:::

## Next Steps

- [Bars](/en/gantt/bars) — configure bar appearance and behavior
- [Links & Dependencies](/en/gantt/links) — connect tasks with dependency lines
- [Timeline Views](/en/gantt/views) — switch between zoom levels
- [Theme](/en/gantt/theme) — customize colors and sizing
