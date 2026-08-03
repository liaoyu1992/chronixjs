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

const features = [
  {
    title: '基本甘特图',
    description: '包含 3 个任务的周视图甘特图，展示任务条、行标签和时间轴的基本渲染。支持横向滚动浏览完整时间线。',
    code: ganttBasicCode,
    codeVue2: ganttBasicVue2,
    codeReact: ganttBasicReact,
  },
  {
    title: '视图切换与工具栏',
    description: '通过内置工具栏在日/周/月/季/年视图间导航，支持 prev/next/today 导航按钮，动态切换时间轴密度。',
    code: ganttViewsToolbarCode,
    codeVue2: ganttViewsToolbarVue2,
    codeReact: ganttViewsToolbarReact,
    badge: '交互',
  },
  {
    title: '依赖连线',
    description: '方角和曲线路由的依赖连线，带箭头标记和自定义颜色覆盖。支持完成-开始 (FS)、开始-开始 (SS)、完成-完成 (FF)、开始-完成 (SF) 四种依赖类型。',
    code: ganttLinksBasicCode,
    codeVue2: ganttLinksBasicVue2,
    codeReact: ganttLinksBasicReact,
    badge: '核心',
  },
  {
    title: '进度与样式',
    description: '自定义颜色和进度指示器的条形图。每个条形可独立设置填充色、边框色、进度百分比，进度以深色条嵌入条形内部。',
    code: ganttBarProgressCode,
    codeVue2: ganttBarProgressVue2,
    codeReact: ganttBarProgressReact,
  },
  {
    title: '自定义主题',
    description: '通过 ChronixTheme 对象自定义条形颜色、图表背景、表头样式等。支持浅色/深色模式切换和 CSS 变量覆盖。',
    code: ganttThemeCustomCode,
    codeVue2: ganttThemeCustomVue2,
    codeReact: ganttThemeCustomReact,
    badge: '主题',
  },
];
</script>

# 甘特图

高性能、框架无关的甘特图组件，支持拖拽/调整大小、依赖连线以及 6 种时间线视图。支持 Vue 3、Vue 2.7、React 18/19 三个框架适配器。

## 在线演示

<FeatureShowcase :features="features">
  <template #demo-0><GanttBasic /></template>
  <template #demo-1><GanttViewsToolbar /></template>
  <template #demo-2><GanttLinksBasic /></template>
  <template #demo-3><GanttBarProgress /></template>
  <template #demo-4><GanttThemeCustom /></template>
</FeatureShowcase>

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

## 下一步

- [快速开始](/gantt/getting-started) — 详细安装指南
- [条形图](/gantt/bars) — 条形图配置与自定义
- [依赖](/gantt/links) — 连接任务
- [时间线视图](/gantt/views) — 切换视图
- [主题](/gantt/theme) — 样式与主题
