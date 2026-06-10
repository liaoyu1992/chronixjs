# 甘特图 — 快速开始

本指南将带你完成 Chronix 甘特图在项目中的安装与配置。

## 安装

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

## 注册组件

::: code-group

```ts [Vue 3]
// main.ts
import { createApp } from 'vue';
import App from './App.vue';

// 样式由适配器自动注入 — 无需手动导入 CSS
createApp(App).mount('#app');
```

```ts [Vue 2]
// main.ts
import Vue from 'vue';
import App from './App.vue';

// 样式由适配器自动注入
new Vue({ render: (h) => h(App) }).$mount('#app');
```

```tsx [React]
// main.tsx
import { createRoot } from 'react-dom/client';
import { App } from './App';

// 样式由适配器自动注入
createRoot(document.getElementById('root')!).render(<App />);
```

:::

## 任务数据模型

甘特图中的每个任务遵循以下接口：

```ts
interface GanttTask {
  id: number | string;
  name: string;
  start: string; // ISO 日期字符串，例如 '2024-01-15'
  end: string; // ISO 日期字符串
  progress?: number; // 0-100
  color?: string; // 条形颜色覆盖
  children?: GanttTask[];
}
```

## 完整示例

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

## 下一步

- [条形图](/gantt/bars) — 配置条形图外观与行为
- [依赖](/gantt/links) — 使用依赖连线连接任务
- [时间线视图](/gantt/views) — 切换缩放级别
- [主题](/gantt/theme) — 自定义颜色与尺寸
