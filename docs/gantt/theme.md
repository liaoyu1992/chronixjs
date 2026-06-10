# 甘特图主题

使用 `ChronixTheme` 接口自定义甘特图外观。传入部分主题对象仅覆盖所需的令牌，其余令牌将使用默认值。

## 基本用法

::: code-group

```vue [Vue 3]
<template>
  <ChronixGantt :bars="bars" :rows="rows" :axis-input="axisInput" :theme="customTheme" />
</template>

<script setup lang="ts">
import { ChronixGantt } from '@chronixjs/gantt-vue3';
import type { ChronixTheme } from '@chronixjs/gantt';

const customTheme: Partial<ChronixTheme> = {
  barBackgroundColor: '#6366f1', // 靛蓝色条形
  barBorderColor: '#4f46e5',
  barTextColor: '#ffffff',
  chartBackground: '#f8fafc',
  headerCellFill: '#f1f5f9',
  linkDefaultColor: '#94a3b8',
};
</script>
```

```vue [Vue 2]
<template>
  <ChronixGantt :bars="bars" :rows="rows" :axis-input="axisInput" :theme="customTheme" />
</template>

<script>
import { ChronixGantt } from '@chronixjs/gantt-vue2';

export default {
  components: { ChronixGantt },
  data() {
    return {
      customTheme: {
        barBackgroundColor: '#6366f1',
        barBorderColor: '#4f46e5',
        barTextColor: '#ffffff',
        chartBackground: '#f8fafc',
      },
    };
  },
};
</script>
```

```tsx [React]
import { ChronixGantt } from '@chronixjs/gantt-react';
import type { ChronixTheme } from '@chronixjs/gantt';

const customTheme: Partial<ChronixTheme> = {
  barBackgroundColor: '#6366f1',
  barBorderColor: '#4f46e5',
  barTextColor: '#ffffff',
  chartBackground: '#f8fafc',
};

export function App() {
  return <ChronixGantt bars={bars} rows={rows} axisInput={axisInput} theme={customTheme} />;
}
```

:::

## 暗色模式示例

```typescript
const darkTheme: Partial<ChronixTheme> = {
  chartBackground: '#1e293b',
  headerBackground: '#1e293b',
  headerCellFill: '#334155',
  headerCellStroke: '#475569',
  headerCellLabel: '#e2e8f0',
  headerTickStroke: '#475569',
  headerTickLabel: '#94a3b8',
  headerDivider: '#64748b',
  barBackgroundColor: '#3b82f6',
  barBorderColor: '#60a5fa',
  barTextColor: '#f8fafc',
  gridLineColor: '#334155',
  gridLineWeekStartColor: '#475569',
  gridLineRowRuleColor: '#334155',
  linkDefaultColor: '#64748b',
  sidebarBackground: '#1e293b',
  sidebarHeaderCellLabel: '#e2e8f0',
  sidebarBodyCellLabel: '#cbd5e1',
  todayLineColor: '#f87171',
  toolbarBg: '#1e293b',
  toolbarButtonBg: '#334155',
  toolbarButtonColor: '#e2e8f0',
  toolbarTitleColor: '#f1f5f9',
};
```

## 完整主题令牌

### 图表

| 令牌              | 默认值      | 描述           |
| ----------------- | ----------- | -------------- |
| `chartBackground` | `'#ffffff'` | 主图表区域背景 |

### 头部区域

| 令牌               | 默认值      | 描述                |
| ------------------ | ----------- | ------------------- |
| `headerBackground` | `'#ffffff'` | 头部行背景          |
| `headerCellFill`   | `'#f9fafb'` | 单元格背景          |
| `headerCellStroke` | `'#d1d5db'` | 单元格边框颜色      |
| `headerCellLabel`  | `'#374151'` | 单元格文本颜色      |
| `headerTickStroke` | `'#d1d5db'` | 刻度线颜色          |
| `headerTickLabel`  | `'#6b7280'` | 刻度标签颜色        |
| `headerDivider`    | `'#9ca3af'` | 头部/主体分隔线颜色 |

### 条形样式

| 令牌                 | 默认值      | 描述              |
| -------------------- | ----------- | ----------------- |
| `barBackgroundColor` | `'#3b82f6'` | 默认条形填充颜色  |
| `barBorderColor`     | `'#1e40af'` | 默认条形边框颜色  |
| `barTextColor`       | `'#ffffff'` | 默认条形文本颜色  |
| `barFontSize`        | `12`        | 条形文本字号 (px) |
| `barFontWeight`      | `400`       | 条形文本字重      |

### 条形选择与调整大小

| 令牌                     | 默认值              | 描述                 |
| ------------------------ | ------------------- | -------------------- |
| `barSelectedBorderColor` | `'rgba(0,0,0,0.3)'` | 选中条形边框         |
| `barSelectedBorderWidth` | `2`                 | 选中条形边框宽度     |
| `barResizerThickness`    | `8`                 | 调整大小手柄厚度     |
| `barResizerDotSize`      | `8`                 | 调整大小手柄圆点大小 |

### 进度覆盖层

| 令牌                        | 默认值      | 描述              |
| --------------------------- | ----------- | ----------------- |
| `progressFill`              | `'#10b981'` | 进度条填充颜色    |
| `progressFillOpacity`       | `0.35`      | 进度填充不透明度  |
| `progressHandleFill`        | `'#059669'` | 拖拽手柄填充      |
| `progressHandleStroke`      | `'#ffffff'` | 拖拽手柄边框      |
| `progressHandleStrokeWidth` | `1`         | 拖拽手柄边框宽度  |
| `progressLabel`             | `'#064e3b'` | 进度文本颜色      |
| `progressLabelFontSize`     | `11`        | 进度文本字号 (px) |
| `progressLabelFontWeight`   | `600`       | 进度文本字重      |

### 网格线

| 令牌                     | 默认值   | 描述             |
| ------------------------ | -------- | ---------------- |
| `gridLineColor`          | `'#ddd'` | 垂直网格线颜色   |
| `gridLineWeekStartColor` | `'#bbb'` | 周起始网格线颜色 |
| `gridLineRowRuleColor`   | `'#ddd'` | 水平行分隔线颜色 |

### 侧边栏

| 令牌                      | 默认值      | 描述            |
| ------------------------- | ----------- | --------------- |
| `sidebarBackground`       | `'#ffffff'` | 侧边栏背景      |
| `sidebarHeaderCellLabel`  | `'#374151'` | 头部单元格文本  |
| `sidebarHeaderCellBorder` | `'#d1d5db'` | 头部单元格边框  |
| `sidebarHeaderDivider`    | `'#9ca3af'` | 头部/主体分隔线 |
| `sidebarBodyCellLabel`    | `'#1f2937'` | 主体单元格文本  |
| `sidebarBodyCellBorder`   | `'#e5e7eb'` | 主体单元格边框  |

### 连线

| 令牌               | 默认值      | 描述         |
| ------------------ | ----------- | ------------ |
| `linkDefaultColor` | `'#3788d8'` | 默认连线颜色 |
| `linkStrokeWidth`  | `1.5`       | 连线描边宽度 |

### 今日标记

| 令牌               | 默认值                   | 描述           |
| ------------------ | ------------------------ | -------------- |
| `todayLineColor`   | `'#ff6b6b'`              | 今日标记线颜色 |
| `todayCellBgColor` | `'rgba(255,220,40,.15)'` | 今日列背景色   |

### 工具栏

| 令牌                    | 默认值      | 描述          |
| ----------------------- | ----------- | ------------- |
| `toolbarBg`             | `'#ffffff'` | 工具栏背景    |
| `toolbarButtonBg`       | `'#f9fafb'` | 按钮背景      |
| `toolbarButtonBgActive` | `'#3b82f6'` | 激活/按下按钮 |
| `toolbarButtonBorder`   | `'#d1d5db'` | 按钮边框      |
| `toolbarButtonColor`    | `'#374151'` | 按钮文本颜色  |
| `toolbarTitleColor`     | `'#111827'` | 标题文本颜色  |

### 排版

| 令牌                      | 默认值 | 描述                    |
| ------------------------- | ------ | ----------------------- |
| `tickLabelFontSize`       | `10`   | 刻度标签字号 (px)       |
| `headerCellLabelFontSize` | `11`   | 头部单元格标签字号 (px) |
| `sidebarHeaderFontSize`   | `11`   | 侧边栏头部字号 (px)     |
| `sidebarHeaderFontWeight` | `600`  | 侧边栏头部字重          |
| `sidebarBodyFontSize`     | `12`   | 侧边栏主体字号 (px)     |
