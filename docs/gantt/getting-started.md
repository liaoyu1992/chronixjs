# 甘特图 — 快速开始

本指南将带你完成 Chronix 甘特图在项目中的安装与配置。

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

## 注册组件

::: code-group

```ts [Vue 3]
// main.ts
import { createApp } from 'vue';
import App from './App.vue';

// 样式由适配器自动注入 — 无需手动导入 CSS
createApp(App).mount('#app');
```

```ts [Vue 2]
// main.ts
import Vue from 'vue';
import App from './App.vue';

// 样式由适配器自动注入
new Vue({ render: (h) => h(App) }).$mount('#app');
```

```tsx [React]
// main.tsx
import { createRoot } from 'react-dom/client';
import { App } from './App';

// 样式由适配器自动注入
createRoot(document.getElementById('root')!).render(<App />);
```

:::

## 核心数据模型

甘特图使用 `bars`（条形）、`rows`（行）和 `axisInput`（轴配置）三个核心 prop：

- **`RowSpec[]`** — 左侧标签列的行定义
- **`BarSpec[]`** — 时间轴上的任务条形，通过 `rowId` 关联到行
- **`AxisRangePlanInput`** — 视图缩放级别、锚点日期、视口宽度等

```typescript
import type { BarSpec, RowSpec, AxisRangePlanInput } from '@chronixjs/gantt';

const rows: RowSpec[] = [
  { id: 'row-1', columns: { name: 'Design' } },
  { id: 'row-2', columns: { name: 'Development' } },
];

const bars: BarSpec[] = [
  {
    id: 'bar-1',
    rowId: 'row-1',
    range: { start: new Date('2026-01-05'), end: new Date('2026-01-15') },
    title: 'UI Design',
    dprIntent: 'crisp-pixel',
  },
];

const axisInput: AxisRangePlanInput = {
  viewId: 'week', // 缩放级别: 'day' | 'week' | 'month' | 'season' | 'halfYear' | 'year'
  anchorDate: new Date('2026-01-05'), // 初始中心日期
  viewportWidth: 800, // 图表容器宽度 (px)
  locale: 'en', // 日期格式化区域设置
  weekendsVisible: true, // 显示周末列底纹
};
```

## 完整示例

::: code-group

```vue [Vue 3]
<template>
  <div style="height: 400px">
    <ChronixGantt
      :bars="bars"
      :rows="rows"
      :axis-input="axisInput"
      :header-toolbar="toolbar"
      editable
      @bar-drop="onBarDrop"
      @bar-resize="onBarResize"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ChronixGantt } from '@chronixjs/gantt-vue3';
import type { BarSpec, RowSpec, AxisRangePlanInput, ToolbarInput } from '@chronixjs/gantt';

const rows: RowSpec[] = [
  { id: 'row-1', columns: { name: 'Planning' } },
  { id: 'row-2', columns: { name: 'Design' } },
  { id: 'row-3', columns: { name: 'Development' } },
  { id: 'row-4', columns: { name: 'Testing' } },
];

const bars = ref<BarSpec[]>([
  {
    id: 'bar-1',
    rowId: 'row-1',
    range: { start: new Date('2026-01-05'), end: new Date('2026-01-12') },
    title: 'Planning',
    dprIntent: 'crisp-pixel',
    progress: { value: 100, showText: true },
  },
  {
    id: 'bar-2',
    rowId: 'row-2',
    range: { start: new Date('2026-01-10'), end: new Date('2026-01-22') },
    title: 'Design',
    dprIntent: 'crisp-pixel',
    progress: { value: 65, showText: true },
  },
  {
    id: 'bar-3',
    rowId: 'row-3',
    range: { start: new Date('2026-01-18'), end: new Date('2026-02-10') },
    title: 'Development',
    dprIntent: 'crisp-pixel',
    progress: { value: 30, showText: true },
  },
  {
    id: 'bar-4',
    rowId: 'row-4',
    range: { start: new Date('2026-02-05'), end: new Date('2026-02-18') },
    title: 'Testing',
    dprIntent: 'crisp-pixel',
  },
]);

const axisInput = ref<AxisRangePlanInput>({
  viewId: 'week',
  anchorDate: new Date('2026-01-05'),
  viewportWidth: 800,
  locale: 'en',
  weekendsVisible: true,
});

const toolbar: ToolbarInput = {
  left: 'prev,next today',
  center: 'title',
  right: 'day,week,month,season,year',
};

function onBarDrop(payload: {
  barId: string;
  newRange: { start: Date; end: Date };
  newRowId: string;
}) {
  const bar = bars.value.find((b) => b.id === payload.barId);
  if (bar) {
    bar.range = payload.newRange;
    bar.rowId = payload.newRowId;
  }
}

function onBarResize(payload: {
  barId: string;
  edge: 'start' | 'end';
  newRange: { start: Date; end: Date };
}) {
  const bar = bars.value.find((b) => b.id === payload.barId);
  if (bar) bar.range = payload.newRange;
}
</script>
```

```vue [Vue 2]
<template>
  <div style="height: 400px">
    <ChronixGantt
      :bars="bars"
      :rows="rows"
      :axis-input="axisInput"
      :header-toolbar="toolbar"
      editable
      @bar-drop="onBarDrop"
    />
  </div>
</template>

<script>
import { ChronixGantt } from '@chronixjs/gantt-vue2';

export default {
  components: { ChronixGantt },
  data() {
    return {
      rows: [
        { id: 'row-1', columns: { name: 'Planning' } },
        { id: 'row-2', columns: { name: 'Design' } },
        { id: 'row-3', columns: { name: 'Development' } },
      ],
      bars: [
        {
          id: 'bar-1',
          rowId: 'row-1',
          range: { start: new Date('2026-01-05'), end: new Date('2026-01-12') },
          title: 'Planning',
          dprIntent: 'crisp-pixel',
        },
        {
          id: 'bar-2',
          rowId: 'row-2',
          range: { start: new Date('2026-01-10'), end: new Date('2026-01-22') },
          title: 'Design',
          dprIntent: 'crisp-pixel',
        },
        {
          id: 'bar-3',
          rowId: 'row-3',
          range: { start: new Date('2026-01-18'), end: new Date('2026-02-10') },
          title: 'Development',
          dprIntent: 'crisp-pixel',
        },
      ],
      axisInput: {
        viewId: 'week',
        anchorDate: new Date('2026-01-05'),
        viewportWidth: 800,
        locale: 'en',
        weekendsVisible: true,
      },
      toolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'day,week,month,season,year',
      },
    };
  },
  methods: {
    onBarDrop(payload) {
      const bar = this.bars.find((b) => b.id === payload.barId);
      if (bar) {
        bar.range = payload.newRange;
        bar.rowId = payload.newRowId;
      }
    },
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { ChronixGantt } from '@chronixjs/gantt-react';
import type { BarSpec, RowSpec, AxisRangePlanInput, ToolbarInput } from '@chronixjs/gantt';

const rows: RowSpec[] = [
  { id: 'row-1', columns: { name: 'Planning' } },
  { id: 'row-2', columns: { name: 'Design' } },
  { id: 'row-3', columns: { name: 'Development' } },
];

const initialBars: BarSpec[] = [
  {
    id: 'bar-1',
    rowId: 'row-1',
    range: { start: new Date('2026-01-05'), end: new Date('2026-01-12') },
    title: 'Planning',
    dprIntent: 'crisp-pixel',
    progress: { value: 100, showText: true },
  },
  {
    id: 'bar-2',
    rowId: 'row-2',
    range: { start: new Date('2026-01-10'), end: new Date('2026-01-22') },
    title: 'Design',
    dprIntent: 'crisp-pixel',
    progress: { value: 65, showText: true },
  },
  {
    id: 'bar-3',
    rowId: 'row-3',
    range: { start: new Date('2026-01-18'), end: new Date('2026-02-10') },
    title: 'Development',
    dprIntent: 'crisp-pixel',
    progress: { value: 30, showText: true },
  },
];

const axisInput: AxisRangePlanInput = {
  viewId: 'week',
  anchorDate: new Date('2026-01-05'),
  viewportWidth: 800,
  locale: 'en',
  weekendsVisible: true,
};

const toolbar: ToolbarInput = {
  left: 'prev,next today',
  center: 'title',
  right: 'day,week,month,season,year',
};

export function App() {
  const [bars, setBars] = useState<BarSpec[]>(initialBars);

  return (
    <div style={{ height: 400 }}>
      <ChronixGantt
        bars={bars}
        rows={rows}
        axisInput={axisInput}
        headerToolbar={toolbar}
        editable
        onBarDrop={(payload) => {
          setBars((prev) =>
            prev.map((b) =>
              b.id === payload.barId
                ? { ...b, range: payload.newRange, rowId: payload.newRowId }
                : b,
            ),
          );
        }}
      />
    </div>
  );
}
```

:::

## 下一步

- [条形图](/gantt/bars) — 配置条形图外观与行为
- [依赖](/gantt/links) — 使用依赖连线连接任务
- [时间线视图](/gantt/views) — 切换缩放级别
- [主题](/gantt/theme) — 自定义颜色与尺寸
