<script setup>
import TableBasic from './demos/TableBasic.vue';
import tableBasicCode from './demos/TableBasic.vue?raw';
import tableBasicVue2 from './demos/TableBasic.vue2?raw';
import tableBasicReact from './demos/TableBasic.react?raw';

import TableSorting from './demos/TableSorting.vue';
import tableSortingCode from './demos/TableSorting.vue?raw';
import tableSortingVue2 from './demos/TableSorting.vue2?raw';
import tableSortingReact from './demos/TableSorting.react?raw';

import TableFiltering from './demos/TableFiltering.vue';
import tableFilteringCode from './demos/TableFiltering.vue?raw';
import tableFilteringVue2 from './demos/TableFiltering.vue2?raw';
import tableFilteringReact from './demos/TableFiltering.react?raw';

import TableEditing from './demos/TableEditing.vue';
import tableEditingCode from './demos/TableEditing.vue?raw';
import tableEditingVue2 from './demos/TableEditing.vue2?raw';
import tableEditingReact from './demos/TableEditing.react?raw';

import TableTreeData from './demos/TableTreeData.vue';
import tableTreeDataCode from './demos/TableTreeData.vue?raw';
import tableTreeDataVue2 from './demos/TableTreeData.vue2?raw';
import tableTreeDataReact from './demos/TableTreeData.react?raw';

import TableFeatureRich from './demos/TableFeatureRich.vue';
import tableFeatureRichCode from './demos/TableFeatureRich.vue?raw';
import tableFeatureRichVue2 from './demos/TableFeatureRich.vue2?raw';
import tableFeatureRichReact from './demos/TableFeatureRich.react?raw';

const features = [
  {
    title: '基本数据表格',
    description: '支持列头排序的数据表格，点击列头切换升序/降序。20 行示例数据展示表格的基本渲染和交互能力。',
    code: tableBasicCode,
    codeVue2: tableBasicVue2,
    codeReact: tableBasicReact,
  },
  {
    title: '多列排序',
    description: '点击列头排序，Shift+点击追加排序列。支持文本和数字类型排序，键盘方向键导航。',
    code: tableSortingCode,
    codeVue2: tableSortingVue2,
    codeReact: tableSortingReact,
    badge: '交互',
  },
  {
    title: '数据筛选',
    description: '文本筛选和集合筛选两种模式。文本筛选支持模糊匹配，集合筛选支持多选过滤。',
    code: tableFilteringCode,
    codeVue2: tableFilteringVue2,
    codeReact: tableFilteringReact,
    badge: '核心',
  },
  {
    title: '行内编辑',
    description: '双击单元格进入编辑模式，支持文本和数字类型编辑。编辑后自动更新数据，支持校验。',
    code: tableEditingCode,
    codeVue2: tableEditingVue2,
    codeReact: tableEditingReact,
  },
  {
    title: '树形数据',
    description: '层级行展开/折叠，支持懒加载子节点。树形列缩进显示层级关系，默认展开第一层。',
    code: tableTreeDataCode,
    codeVue2: tableTreeDataVue2,
    codeReact: tableTreeDataReact,
    badge: '高级',
  },
  {
    title: '功能综合演示',
    description: '50 行数据，展示固定列、多列排序、筛选行、行内编辑、多选、分页、键盘导航等综合能力。',
    code: tableFeatureRichCode,
    codeVue2: tableFeatureRichVue2,
    codeReact: tableFeatureRichReact,
    badge: '综合',
  },
];
</script>

# 数据表格

高性能、框架无关的数据表格，支持虚拟滚动、树形数据、行内编辑、多列排序、高级筛选、单元格区域操作、撤销/重做、CSV/XLSX 导出和服务端数据源。

## 在线演示

<FeatureShowcase :features="features">
  <template #demo-0><TableBasic /></template>
  <template #demo-1><TableSorting /></template>
  <template #demo-2><TableFiltering /></template>
  <template #demo-3><TableEditing /></template>
  <template #demo-4><TableTreeData /></template>
  <template #demo-5><TableFeatureRich /></template>
</FeatureShowcase>

## 功能特性

- **虚拟滚动** — 流畅处理 10 万+ 行数据
- **树形数据** — 层级行展开，支持懒加载子节点
- **行内编辑** — 单元格级编辑，支持校验与类型 coercion
- **多列排序** — Shift+点击追加排序列，自定义比较函数
- **高级筛选** — 文本 / 数字 / 集合 / 多条件 AND-OR / DSL 表达式
- **固定列/行** — 冻结表头、关键列、顶端/底端汇总行
- **单元格区域** — 拖拽选区、Ctrl+C/V 复制粘贴、drag-fill 填充
- **撤销 / 重做** — 内置 MutationHistory，Ctrl+Z / Ctrl+Y
- **CSV / XLSX 导出** — 客户端导出，支持多 sheet + 冻结窗格
- **服务端数据源** — 分块加载、骨架屏、AbortSignal 取消
- **键盘导航** — 方向键 / Enter / Tab / Shift+Click 选区
- **工具面板** — 列显隐、筛选 DSL、信息面板浮层
- **上下文菜单** — 右键单元格自定义菜单
- **3 个框架适配器** — Vue 3、Vue 2.7、React 18 / 19

## 安装

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

## 接下来

- [快速开始](/table/getting-started) — 详细安装指南
- [列配置](/table/columns) — 列配置说明
- [排序](/table/sorting) — 多列排序
- [筛选](/table/filtering) — 内置与自定义筛选
- [编辑](/table/editing) — 单元格编辑
- [树形数据](/table/tree-data) — 层级数据
- [导出](/table/export) — CSV / XLSX 导出
- [主题](/table/theme) — 样式与主题
