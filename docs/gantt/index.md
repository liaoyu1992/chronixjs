<script setup>
import GanttBasic from './demos/GanttBasic.vue';
import ganttBasicCode from './demos/GanttBasic.vue?raw';
import ganttBasicVue2 from './demos/GanttBasic.vue2?raw';
import ganttBasicReact from './demos/GanttBasic.react?raw';

import GanttViewsToolbar from './demos/GanttViewsToolbar.vue';
import ganttViewsToolbarCode from './demos/GanttViewsToolbar.vue?raw';
import ganttViewsToolbarVue2 from './demos/GanttViewsToolbar.vue2?raw';
import ganttViewsToolbarReact from './demos/GanttViewsToolbar.react?raw';

import GanttLinksBasic from './demos/GanttLinksBasic.vue';
import ganttLinksBasicCode from './demos/GanttLinksBasic.vue?raw';
import ganttLinksBasicVue2 from './demos/GanttLinksBasic.vue2?raw';
import ganttLinksBasicReact from './demos/GanttLinksBasic.react?raw';

import GanttBarProgress from './demos/GanttBarProgress.vue';
import ganttBarProgressCode from './demos/GanttBarProgress.vue?raw';
import ganttBarProgressVue2 from './demos/GanttBarProgress.vue2?raw';
import ganttBarProgressReact from './demos/GanttBarProgress.react?raw';

import GanttThemeCustom from './demos/GanttThemeCustom.vue';
import ganttThemeCustomCode from './demos/GanttThemeCustom.vue?raw';
import ganttThemeCustomVue2 from './demos/GanttThemeCustom.vue2?raw';
import ganttThemeCustomReact from './demos/GanttThemeCustom.react?raw';
</script>

# 甘特图

高性能、框架无关的甘特图组件，支持拖拽/调整大小、依赖连线以及 6 种时间线视图。

## 功能特性

- **6 种时间线视图** — 小时、天、周、月、季度、年
- **拖拽与调整大小** — 支持吸附网格的交互式条形操作
- **依赖连线** — 完成-开始、开始-开始、完成-完成、开始-完成
- **进度指示器** — 条形内嵌进度条，支持百分比文本
- **主题令牌** — 通过 CSS 自定义属性完全可定制
- **插槽注册** — 可扩展的渲染插槽，用于自定义条形内容
- **工具栏** — 内置导航 (prev/next/today) + 视图切换器
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

## 视图切换与工具栏

<DemoBox title="工具栏视图切换" description="通过内置工具栏在日/周/月/季/年视图间导航，支持 prev/next/today 导航。" :code="ganttViewsToolbarCode" :code-vue2="ganttViewsToolbarVue2" :code-react="ganttViewsToolbarReact">
  <GanttViewsToolbar />
</DemoBox>

## 依赖连线

<DemoBox title="依赖连线" description="方角和曲线路由的依赖连线，带箭头标记和自定义颜色覆盖。" :code="ganttLinksBasicCode" :code-vue2="ganttLinksBasicVue2" :code-react="ganttLinksBasicReact">
  <GanttLinksBasic />
</DemoBox>

## 进度与样式

<DemoBox title="带进度和样式的条形" description="自定义颜色和进度指示器的条形图。" :code="ganttBarProgressCode" :code-vue2="ganttBarProgressVue2" :code-react="ganttBarProgressReact">
  <GanttBarProgress />
</DemoBox>

## 自定义主题

<DemoBox title="主题定制" description="通过 ChronixTheme 对象自定义条形颜色、图表背景、表头样式等。" :code="ganttThemeCustomCode" :code-vue2="ganttThemeCustomVue2" :code-react="ganttThemeCustomReact">
  <GanttThemeCustom />
</DemoBox>

## 下一步

- [快速开始](/gantt/getting-started) — 详细安装指南
- [条形图](/gantt/bars) — 条形图配置与自定义
- [依赖](/gantt/links) — 连接任务
- [时间线视图](/gantt/views) — 切换视图
- [主题](/gantt/theme) — 样式与主题
