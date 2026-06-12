<script setup>
import GanttBarProgress from './demos/GanttBarProgress.vue';
import ganttBarProgressCode from './demos/GanttBarProgress.vue?raw';
import ganttBarProgressVue2 from './demos/GanttBarProgress.vue2?raw';
import ganttBarProgressReact from './demos/GanttBarProgress.react?raw';
</script>

# 条形图

条形图表示甘特图时间线中的任务。每个条形对应一个任务，在视觉上从其开始日期延伸到结束日期。条形图支持拖拽移动、调整大小和进度调整。

## BarSpec

每个条形由一个 `BarSpec` 对象定义：

```typescript
import type { BarSpec } from '@chronixjs/gantt';

const bar: BarSpec = {
  id: 'task-1',
  rowId: 'row-1',
  range: { start: new Date('2026-01-05'), end: new Date('2026-01-15') },
  title: 'Design Phase',
  dprIntent: 'crisp-pixel',
};
```

| 字段            | 类型                                       | 必填 | 描述                   |
| --------------- | ------------------------------------------ | ---- | ---------------------- |
| `id`            | `string`                                   | ✅   | 唯一条形标识符         |
| `rowId`         | `string`                                   | ✅   | 此条形所属的行         |
| `range`         | `{ start: Date; end: Date }`               | ✅   | 时间跨度               |
| `title`         | `string`                                   |      | 在条形内渲染的显示文本 |
| `style`         | `BarStyleOverrides`                        |      | 单个条形的颜色覆盖     |
| `progress`      | `BarProgress`                              |      | 进度指示器配置         |
| `dprIntent`     | `'crisp-pixel' \| 'subpixel' \| 'inherit'` | ✅   | 像素对齐意图           |
| `extendedProps` | `Record<string, unknown>`                  |      | 不透明的用户数据负载   |

## 基本用法

<DemoBox title="带进度和样式的条形" description="自定义颜色和进度指示器的条形图。" :code="ganttBarProgressCode" :code-vue2="ganttBarProgressVue2" :code-react="ganttBarProgressReact">
  <GanttBarProgress />
</DemoBox>

## 单条形样式

使用 `BarStyleOverrides` 覆盖单个条形的颜色：

```typescript
const bars: BarSpec[] = [
  {
    id: 'bar-1',
    rowId: 'row-1',
    range: { start: new Date('2026-01-05'), end: new Date('2026-01-15') },
    title: 'Critical Task',
    dprIntent: 'crisp-pixel',
    style: {
      backgroundColor: '#ef4444',
      borderColor: '#dc2626',
      textColor: '#ffffff',
    },
  },
];
```

| 字段              | 类型     | 描述         |
| ----------------- | -------- | ------------ |
| `backgroundColor` | `string` | 条形填充颜色 |
| `borderColor`     | `string` | 条形边框颜色 |
| `textColor`       | `string` | 条形文本颜色 |

## 进度指示器

为任意条形添加进度覆盖层：

```typescript
const bars: BarSpec[] = [
  {
    id: 'bar-1',
    rowId: 'row-1',
    range: { start: new Date('2026-01-05'), end: new Date('2026-01-15') },
    title: 'In Progress',
    dprIntent: 'crisp-pixel',
    progress: {
      value: 65, // 0–100
      showText: true, // 显示百分比标签
      textFormat: '{value}% complete', // 模板字符串
      backgroundColor: '#10b981', // 可选填充颜色
    },
  },
];
```

| 字段              | 类型      | 默认值 | 描述                     |
| ----------------- | --------- | ------ | ------------------------ |
| `value`           | `number`  | —      | 进度百分比 (0–100)       |
| `backgroundColor` | `string`  |        | 进度填充颜色             |
| `textColor`       | `string`  |        | 进度文本颜色             |
| `textFormat`      | `string`  |        | 模板（`{value}` 占位符） |
| `showText`        | `boolean` | `true` | 显示百分比标签           |

## 样式回调

根据条形状态进行动态样式设置，使用回调属性：

::: code-group

```vue [Vue 3]
<template>
  <ChronixGantt
    :bars="bars"
    :rows="rows"
    :axis-input="axisInput"
    :bar-background-color-callback="getBarColor"
  />
</template>

<script setup lang="ts">
import { ChronixGantt } from '@chronixjs/gantt-vue3';
import type { BarColorFunc } from '@chronixjs/gantt';

const getBarColor: BarColorFunc = (arg) => {
  if (arg.isSelected) return '#1e40af';
  if (arg.bar.progress && arg.bar.progress.value > 80) return '#10b981';
  return undefined; // 使用默认值
};
</script>
```

```tsx [React]
import { ChronixGantt } from '@chronixjs/gantt-react';
import type { BarColorFunc } from '@chronixjs/gantt';

const getBarColor: BarColorFunc = (arg) => {
  if (arg.isSelected) return '#1e40af';
  return undefined;
};

export function App() {
  return (
    <ChronixGantt
      bars={bars}
      rows={rows}
      axisInput={axisInput}
      barBackgroundColorCallback={getBarColor}
    />
  );
}
```

:::

可用的回调属性：

| 属性                         | 签名                                                    |
| ---------------------------- | ------------------------------------------------------- |
| `barBackgroundColorCallback` | `(arg: BarStyleArg) => string \| undefined`             |
| `barBorderColorCallback`     | `(arg: BarStyleArg) => string \| undefined`             |
| `barTextColorCallback`       | `(arg: BarStyleArg) => string \| undefined`             |
| `barFontSizeCallback`        | `(arg: BarStyleArg) => number \| undefined`             |
| `barFontWeightCallback`      | `(arg: BarStyleArg) => number \| string \| undefined`   |
| `barClassNamesCallback`      | `(arg: BarStyleArg) => string \| string[] \| undefined` |

## 拖拽与放置

使用 `editable` 启用交互式条形编辑：

::: code-group

```vue [Vue 3]
<template>
  <ChronixGantt
    :bars="bars"
    :rows="rows"
    :axis-input="axisInput"
    editable
    @bar-drop="onBarDrop"
    @bar-resize="onBarResize"
    @bar-progress="onProgressChange"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ChronixGantt } from '@chronixjs/gantt-vue3';
import type { BarDropPayload, BarResizePayload, BarProgressPayload } from '@chronixjs/gantt';

function onBarDrop(payload: BarDropPayload) {
  console.log(`Bar ${payload.barId} moved to row ${payload.newRowId}`);
  console.log(`New range: ${payload.newRange.start} → ${payload.newRange.end}`);
}

function onBarResize(payload: BarResizePayload) {
  console.log(`Bar ${payload.barId} ${payload.edge} edge resized`);
}

function onProgressChange(payload: BarProgressPayload) {
  console.log(`Progress: ${payload.oldProgress} → ${payload.newProgress}`);
}
</script>
```

```tsx [React]
import { ChronixGantt } from '@chronixjs/gantt-react';
import type { BarDropPayload, BarResizePayload } from '@chronixjs/gantt';

export function App() {
  return (
    <ChronixGantt
      bars={bars}
      rows={rows}
      axisInput={axisInput}
      editable
      onBarDrop={(payload: BarDropPayload) => {
        console.log(`Bar ${payload.barId} dropped`);
      }}
      onBarResize={(payload: BarResizePayload) => {
        console.log(`Bar ${payload.barId} resized`);
      }}
    />
  );
}
```

:::

### 事件负载

| 事件            | 负载字段                                                       |
| --------------- | -------------------------------------------------------------- |
| `bar-drop`      | `barId`, `oldRange`, `newRange`, `oldRowId`, `newRowId`        |
| `bar-resize`    | `barId`, `edge` (`'start'` \| `'end'`), `oldRange`, `newRange` |
| `bar-progress`  | `barId`, `oldProgress`, `newProgress`                          |
| `bar-click`     | `barId`, `nativeEvent`                                         |
| `bar-dragstart` | `barId`, `nativeEvent`                                         |
| `bar-dragstop`  | `barId`, `nativeEvent`                                         |

## 校验

使用校验属性控制允许的交互：

::: code-group

```vue [Vue 3]
<template>
  <ChronixGantt
    :bars="bars"
    :rows="rows"
    :axis-input="axisInput"
    editable
    :event-overlap="false"
    :event-allow="allowDrop"
    @bar-drop-rejected="onRejected"
  />
</template>

<script setup lang="ts">
import { ChronixGantt } from '@chronixjs/gantt-vue3';
import type { EventAllowFunc } from '@chronixjs/gantt';

// 仅允许在工作日放置
const allowDrop: EventAllowFunc = (proposal, movingBar) => {
  const day = proposal.range.start.getDay();
  return day !== 0 && day !== 6; // 不在周日或周六
};
</script>
```

:::

| 属性              | 类型                          | 描述                      |
| ----------------- | ----------------------------- | ------------------------- |
| `eventOverlap`    | `boolean \| EventOverlapFunc` | 防止条形重叠              |
| `eventAllow`      | `EventAllowFunc`              | 自定义允许/拒绝回调       |
| `eventConstraint` | `EventConstraint`             | 限制到特定时间范围或行 ID |
