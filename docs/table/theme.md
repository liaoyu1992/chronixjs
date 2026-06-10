# 主题

使用 `ChronixTableTheme` 接口自定义表格外观。传入部分主题对象即可仅覆盖你需要的令牌。

## 基本用法

::: code-group

```vue [Vue 3]
<template>
  <ChronixTable :columns="columns" :rows="rows" :theme="customTheme" />
</template>

<script setup lang="ts">
import { ChronixTable } from '@chronixjs/table-vue3';
import type { ChronixTableTheme } from '@chronixjs/table';

const customTheme: Partial<ChronixTableTheme> = {
  headerBg: '#1e40af',
  headerBorderColor: '#1e3a8a',
  rowDividerColor: '#dbeafe',
  evenRowBg: '#eff6ff',
  oddRowBg: '#ffffff',
};
</script>
```

```vue [Vue 2]
<template>
  <ChronixTable :columns="columns" :rows="rows" :theme="customTheme" />
</template>

<script>
import { ChronixTable } from '@chronixjs/table-vue2';

export default {
  components: { ChronixTable },
  data() {
    return {
      customTheme: {
        headerBg: '#1e40af',
        evenRowBg: '#eff6ff',
        oddRowBg: '#ffffff',
      },
    };
  },
};
</script>
```

```tsx [React]
import { ChronixTable } from '@chronixjs/table-react';
import type { ChronixTableTheme } from '@chronixjs/table';

const customTheme: Partial<ChronixTableTheme> = {
  headerBg: '#1e40af',
  evenRowBg: '#eff6ff',
  oddRowBg: '#ffffff',
};

export function App() {
  return <ChronixTable columns={columns} rows={rows} theme={customTheme} />;
}
```

:::

## 暗色模式示例

```typescript
const darkTheme: Partial<ChronixTableTheme> = {
  headerBg: '#1e293b',
  headerBorderColor: '#334155',
  rowDividerColor: '#334155',
  evenRowBg: '#1e293b',
  oddRowBg: '#0f172a',
  footerBg: '#1e293b',
  headerGroupBg: '#334155',
  overlayBg: 'rgba(0, 0, 0, 0.6)',
  tooltipBg: '#334155',
  tooltipColor: '#e2e8f0',
  statusBarBg: '#1e293b',
  treeChevronColor: '#94a3b8',
};
```

## 完整主题令牌

### 布局

| 令牌                    | 默认值 | 描述                   |
| ----------------------- | ------ | ---------------------- |
| `defaultColumnWidth`    | `200`  | 默认列宽（px）         |
| `defaultMinColumnWidth` | `50`   | 最小列宽（px）         |
| `headerHeight`          | `40`   | 表头行高（px）         |
| `rowHeight`             | `36`   | 默认行高（px）         |
| `cellPaddingX`          | `12`   | 单元格水平内边距（px） |
| `headerGroupHeight`     | `32`   | 表头分组行高（px）     |
| `footerHeight`          | `36`   | 底部行高（px）         |
| `statusBarHeight`       | `28`   | 状态栏高度（px）       |

### 表头

| 令牌                | 默认值      | 描述           |
| ------------------- | ----------- | -------------- |
| `headerBg`          | `'#f9fafb'` | 表头背景       |
| `headerBorderColor` | `'#e5e7eb'` | 表头单元格边框 |
| `headerGroupBg`     | `'#f3f4f6'` | 表头分组背景   |

### 行

| 令牌              | 默认值      | 描述         |
| ----------------- | ----------- | ------------ |
| `rowDividerColor` | `'#e5e7eb'` | 行分隔线颜色 |
| `evenRowBg`       | `'#ffffff'` | 偶数行背景   |
| `oddRowBg`        | `'#ffffff'` | 奇数行背景   |

### 固定列

| 令牌                | 默认值                | 描述           |
| ------------------- | --------------------- | -------------- |
| `pinnedShadowColor` | `rgba(0, 0, 0, 0.12)` | 分隔阴影颜色   |
| `pinnedZoneBg`      | `'inherit'`           | 固定区域背景   |
| `pinnedRowZIndex`   | `10`                  | 固定行 z-index |

### 选择

| 令牌                            | 默认值      | 描述             |
| ------------------------------- | ----------- | ---------------- |
| `selectionColumnWidth`          | `48`        | 复选框列宽（px） |
| `rowCheckboxIndeterminateColor` | `'#d1d5db'` | 半选复选框颜色   |

### 底部与状态栏

| 令牌          | 默认值      | 描述       |
| ------------- | ----------- | ---------- |
| `footerBg`    | `'#f9fafb'` | 底部行背景 |
| `statusBarBg` | `'#f9fafb'` | 状态栏背景 |

### 树形数据

| 令牌               | 默认值      | 描述              |
| ------------------ | ----------- | ----------------- |
| `treeIndentPx`     | `24`        | 每层缩进（px）    |
| `treeChevronColor` | `'#6b7280'` | 展开/折叠图标颜色 |
| `treeSpinnerColor` | `'#3b82f6'` | 加载动画颜色      |
| `treeErrorColor`   | `'#ef4444'` | 错误指示器颜色    |

### 工具提示与遮罩层

| 令牌             | 默认值                    | 描述                   |
| ---------------- | ------------------------- | ---------------------- |
| `tooltipDelayMs` | `500`                     | 工具提示显示延迟（ms） |
| `tooltipBg`      | `'#1f2937'`               | 工具提示背景           |
| `tooltipColor`   | `'#f9fafa'`               | 工具提示文本颜色       |
| `overlayBg`      | `'rgba(255,255,255,0.8)'` | 加载遮罩背景           |

### 拖拽填充

| 令牌                  | 默认值      | 描述             |
| --------------------- | ----------- | ---------------- |
| `dragFillHandleColor` | `'#3b82f6'` | 填充手柄圆点颜色 |
