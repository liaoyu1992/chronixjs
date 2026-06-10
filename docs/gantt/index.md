# 甘特图

高性能、框架无关的甘特图组件，支持拖拽/调整大小、依赖连线以及 6 种时间线视图。

## 功能特性

- **6 种时间线视图** — 小时、天、周、月、季度、年
- **拖拽与调整大小** — 支持吸附网格的交互式条形操作
- **依赖连线** — 完成-开始、开始-开始、完成-完成、开始-完成
- **主题令牌** — 通过 CSS 自定义属性完全可定制
- **插槽注册** — 可扩展的渲染插槽，用于自定义条形内容
- **3 个框架适配器** — Vue 3、Vue 2.7、React 18

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

## 基本用法

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

## 下一步

- [快速开始](/gantt/getting-started) — 详细安装指南
- [条形图](/gantt/bars) — 条形图配置与自定义
- [依赖](/gantt/links) — 连接任务
- [时间线视图](/gantt/views) — 切换视图
- [主题](/gantt/theme) — 样式与主题
