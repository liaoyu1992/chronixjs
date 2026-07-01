<script setup>
import GanttBasic from './demos/GanttBasic.vue';
import ganttBasicCode from './demos/GanttBasic.vue?raw';
import ganttBasicVue2 from './demos/GanttBasic.vue2?raw';
import ganttBasicReact from './demos/GanttBasic.react?raw';
</script>

# 甘特图

高性能、框架无关的甘特图组件，支持拖拽/调整大小、依赖连线以及 6 种时间线视图。

## 功能特性

- **6 种时间线视图** — 小时、天、周、月、季度、年
- **拖拽与调整大小** — 支持吸附网格的交互式条形操作
- **依赖连线** — 完成-开始、开始-开始、完成-完成、开始-完成
- **主题令牌** — 通过 CSS 自定义属性完全可定制
- **插槽注册** — 可扩展的渲染插槽，用于自定义条形内容
- **3 个框架适配器** — Vue 3、Vue 2.7、React 18 / 19

## 安装

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

## 基本用法

<DemoBox title="基本甘特图" description="包含 3 个任务的周视图甘特图。" :code="ganttBasicCode" :code-vue2="ganttBasicVue2" :code-react="ganttBasicReact">
  <GanttBasic />
</DemoBox>

## 下一步

- [快速开始](/gantt/getting-started) — 详细安装指南
- [条形图](/gantt/bars) — 条形图配置与自定义
- [依赖](/gantt/links) — 连接任务
- [时间线视图](/gantt/views) — 切换视图
- [主题](/gantt/theme) — 样式与主题
