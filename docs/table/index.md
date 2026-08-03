<script setup>
import TableBasic from './demos/TableBasic.vue';
import tableBasicCode from './demos/TableBasic.vue?raw';
import tableBasicVue2 from './demos/TableBasic.vue2?raw';
import tableBasicReact from './demos/TableBasic.react?raw';

import TableFeatureRich from './demos/TableFeatureRich.vue';
import tableFeatureRichCode from './demos/TableFeatureRich.vue?raw';
import tableFeatureRichVue2 from './demos/TableFeatureRich.vue2?raw';
import tableFeatureRichReact from './demos/TableFeatureRich.react?raw';
</script>

# 数据表格

高性能、框架无关的数据表格，支持虚拟滚动、树形数据、行内编辑、多列排序、高级筛选、单元格区域操作、撤销/重做、CSV/XLSX 导出和服务端数据源。

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

## 基本用法

<DemoBox title="基本数据表格" description="包含可排序的姓名和角色列的简单表格。" :code="tableBasicCode" :code-vue2="tableBasicVue2" :code-react="tableBasicReact">
  <TableBasic />
</DemoBox>

## 功能综合演示

<DemoBox title="功能综合演示" description="50 行数据，展示固定列、多列排序、筛选行、行内编辑、多选、分页、键盘导航。" :code="tableFeatureRichCode" :code-vue2="tableFeatureRichVue2" :code-react="tableFeatureRichReact">
  <TableFeatureRich />
</DemoBox>

## 接下来

- [快速开始](/table/getting-started) — 详细安装指南
- [列配置](/table/columns) — 列配置说明
- [排序](/table/sorting) — 多列排序
- [筛选](/table/filtering) — 内置与自定义筛选
- [编辑](/table/editing) — 单元格编辑
- [树形数据](/table/tree-data) — 层级数据
- [导出](/table/export) — CSV / XLSX 导出
- [主题](/table/theme) — 样式与主题
