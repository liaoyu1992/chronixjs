<script setup>
import GanttBasic from '../../gantt/demos/GanttBasic.vue';
import ganttBasicCode from '../../gantt/demos/GanttBasic.vue?raw';
import ganttBasicVue2 from '../../gantt/demos/GanttBasic.vue2?raw';
import ganttBasicReact from '../../gantt/demos/GanttBasic.react?raw';
</script>

# Gantt Chart

A high-performance, framework-agnostic Gantt chart component with drag/resize, dependency links, and 6 timeline views.

## Features

- **6 Timeline Views** — hour, day, week, month, quarter, year
- **Drag & Resize** — interactive bar manipulation with snap-to-grid
- **Dependency Lines** — finish-to-start, start-to-start, finish-to-finish, start-to-finish
- **Theme Tokens** — fully customizable via CSS custom properties
- **Slot Registry** — extendable rendering slots for custom bar content
- **3 Framework Adapters** — Vue 3, Vue 2.7, React 18 / 19

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

## Basic Usage

<DemoBox title="Basic Gantt Chart" description="A minimal gantt chart with 3 tasks in week view." :code="ganttBasicCode" :code-vue2="ganttBasicVue2" :code-react="ganttBasicReact">
  <GanttBasic />
</DemoBox>

## Next Steps

- [Getting Started](/en/gantt/getting-started) — detailed setup guide
- [Bars](/en/gantt/bars) — bar configuration and customization
- [Links & Dependencies](/en/gantt/links) — connecting tasks
- [Timeline Views](/en/gantt/views) — switching between views
- [Theme](/en/gantt/theme) — styling and theming
