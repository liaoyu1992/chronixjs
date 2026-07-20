# Table Theme

Customize the table appearance using the `ChronixTableTheme` interface. Pass a partial theme to override only the tokens you need.

## Basic Usage

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

## Dark Mode Example

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

## Complete Theme Tokens

### Layout

| Token                   | Default | Description                  |
| ----------------------- | ------- | ---------------------------- |
| `defaultColumnWidth`    | `200`   | Default column width (px)    |
| `defaultMinColumnWidth` | `50`    | Min column width (px)        |
| `headerHeight`          | `40`    | Header row height (px)       |
| `rowHeight`             | `36`    | Default row height (px)      |
| `cellPaddingX`          | `12`    | Horizontal cell padding (px) |
| `headerGroupHeight`     | `32`    | Header group row height (px) |
| `footerHeight`          | `36`    | Footer row height (px)       |
| statusBarHeight         | 36      | 底部行高度（px）             |

### Header

| Token               | Default     | Description             |
| ------------------- | ----------- | ----------------------- |
| `headerBg`          | `'#f9fafb'` | Header background       |
| `headerBorderColor` | `'#e5e7eb'` | Header cell border      |
| `headerGroupBg`     | `'#f3f4f6'` | Header group background |

### Rows

| Token             | Default     | Description            |
| ----------------- | ----------- | ---------------------- |
| `rowDividerColor` | `'#e5e7eb'` | Row divider line color |
| `evenRowBg`       | `'#ffffff'` | Even row background    |
| `oddRowBg`        | `'#ffffff'` | Odd row background     |

### Pinned Columns

| Token               | Default               | Description            |
| ------------------- | --------------------- | ---------------------- |
| `pinnedShadowColor` | `rgba(0, 0, 0, 0.12)` | Divider shadow color   |
| `pinnedZoneBg`      | `'inherit'`           | Pinned zone background |
| `pinnedRowZIndex`   | `10`                  | Pinned row z-index     |

### Selection

| Token                           | Default     | Description                  |
| ------------------------------- | ----------- | ---------------------------- |
| `selectionColumnWidth`          | `48`        | Checkbox column width (px)   |
| `rowCheckboxIndeterminateColor` | `'#d1d5db'` | Indeterminate checkbox color |

### Footer & Status

| Token              | Default     | Description                            |
| ------------------ | ----------- | -------------------------------------- |
| `footerBg`         | `'#f9fafb'` | Footer row background                  |
| statusBarBg        | '#fafbfc'   | 底部行背景（合并 status + pagination） |
| statusBarTextColor | '#3a414a'   | 状态栏文案色                           |

### Tree Data

| Token              | Default     | Description                 |
| ------------------ | ----------- | --------------------------- |
| `treeIndentPx`     | `24`        | Indent per depth level (px) |
| `treeChevronColor` | `'#6b7280'` | Expand/collapse icon color  |
| `treeSpinnerColor` | `'#3b82f6'` | Loading spinner color       |
| `treeErrorColor`   | `'#ef4444'` | Error indicator color       |

### Tooltips & Overlays

| Token            | Default                   | Description                |
| ---------------- | ------------------------- | -------------------------- |
| `tooltipDelayMs` | `500`                     | Tooltip show delay (ms)    |
| `tooltipBg`      | `'#1f2937'`               | Tooltip background         |
| `tooltipColor`   | `'#f9fafb'`               | Tooltip text color         |
| `overlayBg`      | `'rgba(255,255,255,0.8)'` | Loading overlay background |

### Drag & Fill

| Token                 | Default     | Description           |
| --------------------- | ----------- | --------------------- |
| `dragFillHandleColor` | `'#3b82f6'` | Fill handle dot color |
