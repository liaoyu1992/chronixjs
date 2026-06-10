# Gantt Theme

Customize the Gantt chart appearance using the `ChronixTheme` interface. Pass a partial theme object to override only the tokens you need — all others fall back to defaults.

## Basic Usage

::: code-group

```vue [Vue 3]
<template>
  <ChronixGantt :bars="bars" :rows="rows" :axis-input="axisInput" :theme="customTheme" />
</template>

<script setup lang="ts">
import { ChronixGantt } from '@chronixjs/gantt-vue3';
import type { ChronixTheme } from '@chronixjs/gantt';

const customTheme: Partial<ChronixTheme> = {
  barBackgroundColor: '#6366f1', // Indigo bars
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

## Dark Mode Example

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

## Complete Theme Tokens

### Chart

| Token             | Default     | Description                |
| ----------------- | ----------- | -------------------------- |
| `chartBackground` | `'#ffffff'` | Main chart area background |

### Header Band

| Token              | Default     | Description                |
| ------------------ | ----------- | -------------------------- |
| `headerBackground` | `'#ffffff'` | Header row background      |
| `headerCellFill`   | `'#f9fafb'` | Individual cell background |
| `headerCellStroke` | `'#d1d5db'` | Cell border color          |
| `headerCellLabel`  | `'#374151'` | Cell text color            |
| `headerTickStroke` | `'#d1d5db'` | Tick mark stroke color     |
| `headerTickLabel`  | `'#6b7280'` | Tick mark label color      |
| `headerDivider`    | `'#9ca3af'` | Header/body divider color  |

### Bar Styling

| Token                | Default     | Description              |
| -------------------- | ----------- | ------------------------ |
| `barBackgroundColor` | `'#3b82f6'` | Default bar fill color   |
| `barBorderColor`     | `'#1e40af'` | Default bar border color |
| `barTextColor`       | `'#ffffff'` | Default bar text color   |
| `barFontSize`        | `12`        | Bar text font size (px)  |
| `barFontWeight`      | `400`       | Bar text font weight     |

### Bar Selection & Resize

| Token                    | Default             | Description               |
| ------------------------ | ------------------- | ------------------------- |
| `barSelectedBorderColor` | `'rgba(0,0,0,0.3)'` | Selected bar border       |
| `barSelectedBorderWidth` | `2`                 | Selected bar border width |
| `barResizerThickness`    | `8`                 | Resize handle thickness   |
| `barResizerDotSize`      | `8`                 | Resize handle dot size    |

### Progress Overlay

| Token                       | Default     | Description              |
| --------------------------- | ----------- | ------------------------ |
| `progressFill`              | `'#10b981'` | Progress bar fill color  |
| `progressFillOpacity`       | `0.35`      | Progress fill opacity    |
| `progressHandleFill`        | `'#059669'` | Drag handle fill         |
| `progressHandleStroke`      | `'#ffffff'` | Drag handle border       |
| `progressHandleStrokeWidth` | `1`         | Drag handle stroke width |
| `progressLabel`             | `'#064e3b'` | Progress text color      |
| `progressLabelFontSize`     | `11`        | Progress text size (px)  |
| `progressLabelFontWeight`   | `600`       | Progress text weight     |

### Grid Lines

| Token                    | Default  | Description                  |
| ------------------------ | -------- | ---------------------------- |
| `gridLineColor`          | `'#ddd'` | Vertical grid line color     |
| `gridLineWeekStartColor` | `'#bbb'` | Week-start grid line color   |
| `gridLineRowRuleColor`   | `'#ddd'` | Horizontal row divider color |

### Sidebar

| Token                     | Default     | Description         |
| ------------------------- | ----------- | ------------------- |
| `sidebarBackground`       | `'#ffffff'` | Sidebar background  |
| `sidebarHeaderCellLabel`  | `'#374151'` | Header cell text    |
| `sidebarHeaderCellBorder` | `'#d1d5db'` | Header cell border  |
| `sidebarHeaderDivider`    | `'#9ca3af'` | Header/body divider |
| `sidebarBodyCellLabel`    | `'#1f2937'` | Body cell text      |
| `sidebarBodyCellBorder`   | `'#e5e7eb'` | Body cell border    |

### Links

| Token              | Default     | Description        |
| ------------------ | ----------- | ------------------ |
| `linkDefaultColor` | `'#3788d8'` | Default link color |
| `linkStrokeWidth`  | `1.5`       | Link stroke width  |

### Today Indicators

| Token              | Default                  | Description             |
| ------------------ | ------------------------ | ----------------------- |
| `todayLineColor`   | `'#ff6b6b'`              | Today marker line color |
| `todayCellBgColor` | `'rgba(255,220,40,.15)'` | Today column background |

### Toolbar

| Token                   | Default     | Description           |
| ----------------------- | ----------- | --------------------- |
| `toolbarBg`             | `'#ffffff'` | Toolbar background    |
| `toolbarButtonBg`       | `'#f9fafb'` | Button background     |
| `toolbarButtonBgActive` | `'#3b82f6'` | Active/pressed button |
| `toolbarButtonBorder`   | `'#d1d5db'` | Button border         |
| `toolbarButtonColor`    | `'#374151'` | Button text color     |
| `toolbarTitleColor`     | `'#111827'` | Title text color      |

### Typography

| Token                     | Default | Description                 |
| ------------------------- | ------- | --------------------------- |
| `tickLabelFontSize`       | `10`    | Tick label size (px)        |
| `headerCellLabelFontSize` | `11`    | Header cell label size (px) |
| `sidebarHeaderFontSize`   | `11`    | Sidebar header size (px)    |
| `sidebarHeaderFontWeight` | `600`   | Sidebar header weight       |
| `sidebarBodyFontSize`     | `12`    | Sidebar body size (px)      |
