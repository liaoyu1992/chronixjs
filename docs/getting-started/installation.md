# 安装

Chronix 是一个框架无关的组件 monorepo，并为 **Vue 3**、**Vue 2.7** 和 **React 18** 提供了专用适配器。

## 前置条件

- Node.js >= 20
- pnpm >= 9（推荐）或 npm / yarn

## 包

| 包名                     | 描述                      |
| ------------------------ | ------------------------- |
| `@chronixjs/gantt`       | 甘特图核心（IR）          |
| `@chronixjs/table`       | 数据表格核心（IR）        |
| `@chronixjs/ui`          | UI 组件核心（IR）         |
| `@chronixjs/cx-kit`      | 无头原语                  |
| `@chronixjs/gantt-vue3`  | 甘特图适配器 — Vue 3      |
| `@chronixjs/gantt-vue2`  | 甘特图适配器 — Vue 2.7    |
| `@chronixjs/gantt-react` | 甘特图适配器 — React 18   |
| `@chronixjs/table-vue3`  | 数据表格适配器 — Vue 3    |
| `@chronixjs/table-vue2`  | 数据表格适配器 — Vue 2.7  |
| `@chronixjs/table-react` | 数据表格适配器 — React 18 |
| `@chronixjs/ui-vue3`     | UI 适配器 — Vue 3         |
| `@chronixjs/ui-vue2`     | UI 适配器 — Vue 2.7       |
| `@chronixjs/ui-react`    | UI 适配器 — React 18      |

## 按框架安装

::: code-group

```bash [Vue 3]
pnpm add @chronixjs/ui-vue3@alpha vue
```

```bash [Vue 2]
pnpm add @chronixjs/ui-vue2@alpha vue@^2.7
```

```bash [React]
pnpm add @chronixjs/ui-react@alpha react@^18 react-dom@^18
```

:::

## 验证安装

安装完成后，你可以验证包是否正确安装：

::: code-group

```ts [Vue 3]
import { CxButton } from '@chronixjs/ui-vue3';
console.log(CxButton); // should log the component
```

```ts [Vue 2]
import { CxButton } from '@chronixjs/ui-vue2';
console.log(CxButton); // should log the component
```

```ts [React]
import { CxButton } from '@chronixjs/ui-react';
console.log(CxButton); // should log the component
```

:::

## 下一步

- [快速开始](/getting-started/quick-start) — 构建你的第一个 Chronix 应用
- [甘特图](/gantt/) — 探索甘特图组件
- [数据表格](/table/) — 探索数据表格组件
- [UI 组件](/ui/) — 浏览全部 85 个 UI 组件
