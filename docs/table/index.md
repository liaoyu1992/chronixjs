<script setup>
import TableBasic from './demos/TableBasic.vue';
import tableBasicCode from './demos/TableBasic.vue?raw';
import tableBasicVue2 from './demos/TableBasic.vue2?raw';
import tableBasicReact from './demos/TableBasic.react?raw';
</script>

# 数据表格

高性能、框架无关的数据表格，支持虚拟滚动、树形数据、行内编辑和 CSV 导出。

## 功能特性

- **虚拟滚动** — 流畅处理 10 万+ 行数据
- **树形数据** — 层级行展开
- **行内编辑** — 单元格级编辑，支持校验
- **排序与筛选** — 多列排序，内置筛选类型
- **固定列/行** — 冻结表头和关键列
- **CSV 导出** — 客户端数据导出
- **58 个命令式方法** — 完整的编程控制
- **3 个框架适配器** — Vue 3、Vue 2.7、React 18

## 安装

::: code-group

```bash [Vue 3]
pnpm add @chronixjs/table-vue3@alpha vue
```

```bash [Vue 2]
pnpm add @chronixjs/table-vue2@alpha vue@^2.7
```

```bash [React]
pnpm add @chronixjs/table-react@alpha react@^18 react-dom@^18
```

:::

## 基本用法

<DemoBox title="基本数据表格" description="包含可排序的姓名和角色列的简单表格。" :code="tableBasicCode" :code-vue2="tableBasicVue2" :code-react="tableBasicReact">
  <TableBasic />
</DemoBox>

## 接下来

- [快速开始](/table/getting-started) — 详细安装指南
- [列配置](/table/columns) — 列配置说明
- [排序](/table/sorting) — 多列排序
- [筛选](/table/filtering) — 内置与自定义筛选
- [编辑](/table/editing) — 单元格编辑
- [树形数据](/table/tree-data) — 层级数据
- [导出](/table/export) — CSV 导出
- [主题](/table/theme) — 样式与主题
