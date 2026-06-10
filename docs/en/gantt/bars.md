# Bars

Bars represent tasks in the Gantt chart timeline. Each bar corresponds to a task and visually spans from its start date to its end date. Bars support drag-to-move, resize, and progress adjustment.

## BarSpec

Every bar is defined by a `BarSpec` object:

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

| Field           | Type                                       | Required | Description                          |
| --------------- | ------------------------------------------ | -------- | ------------------------------------ |
| `id`            | `string`                                   | ✅       | Unique bar identifier                |
| `rowId`         | `string`                                   | ✅       | Which row this bar belongs to        |
| `range`         | `{ start: Date; end: Date }`               | ✅       | Time span                            |
| `title`         | `string`                                   |          | Display text rendered inside the bar |
| `style`         | `BarStyleOverrides`                        |          | Per-bar color overrides              |
| `progress`      | `BarProgress`                              |          | Progress indicator configuration     |
| `dprIntent`     | `'crisp-pixel' \| 'subpixel' \| 'inherit'` | ✅       | Pixel-alignment intent               |
| `extendedProps` | `Record<string, unknown>`                  |          | Opaque user data payload             |

## Basic Usage

::: code-group

```vue [Vue 3]
<template>
  <ChronixGantt :bars="bars" :rows="rows" :axis-input="axisInput" />
</template>

<script setup lang="ts">
import { ChronixGantt } from '@chronixjs/gantt-vue3';
import type { BarSpec, RowSpec, AxisRangePlanInput } from '@chronixjs/gantt';

const rows: RowSpec[] = [
  { id: 'row-1', columns: { name: 'Task A' } },
  { id: 'row-2', columns: { name: 'Task B' } },
];

const bars: BarSpec[] = [
  {
    id: 'bar-1',
    rowId: 'row-1',
    range: { start: new Date('2026-01-05'), end: new Date('2026-01-15') },
    title: 'Design Phase',
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-2',
    rowId: 'row-2',
    range: { start: new Date('2026-01-10'), end: new Date('2026-01-20') },
    title: 'Development',
    dprIntent: 'crisp-pixel',
  },
];

const axisInput: AxisRangePlanInput = {
  viewId: 'week',
  anchorDate: new Date('2026-01-05'),
  viewportWidth: 900,
  locale: 'en',
  weekendsVisible: true,
};
</script>
```

```vue [Vue 2]
<template>
  <ChronixGantt :bars="bars" :rows="rows" :axis-input="axisInput" />
</template>

<script>
import { ChronixGantt } from '@chronixjs/gantt-vue2';

export default {
  components: { ChronixGantt },
  data() {
    return {
      bars: [
        {
          id: 'bar-1',
          rowId: 'row-1',
          range: { start: new Date('2026-01-05'), end: new Date('2026-01-15') },
          title: 'Design Phase',
          dprIntent: 'crisp-pixel',
        },
      ],
      rows: [{ id: 'row-1', columns: { name: 'Task A' } }],
      axisInput: {
        viewId: 'week',
        anchorDate: new Date('2026-01-05'),
        viewportWidth: 900,
        locale: 'en',
        weekendsVisible: true,
      },
    };
  },
};
</script>
```

```tsx [React]
import { ChronixGantt } from '@chronixjs/gantt-react';
import type { BarSpec, RowSpec, AxisRangePlanInput } from '@chronixjs/gantt';

const rows: RowSpec[] = [{ id: 'row-1', columns: { name: 'Task A' } }];

const bars: BarSpec[] = [
  {
    id: 'bar-1',
    rowId: 'row-1',
    range: { start: new Date('2026-01-05'), end: new Date('2026-01-15') },
    title: 'Design Phase',
    dprIntent: 'crisp-pixel',
  },
];

const axisInput: AxisRangePlanInput = {
  viewId: 'week',
  anchorDate: new Date('2026-01-05'),
  viewportWidth: 900,
  locale: 'en',
  weekendsVisible: true,
};

export function App() {
  return <ChronixGantt bars={bars} rows={rows} axisInput={axisInput} />;
}
```

:::

## Per-Bar Styling

Override colors on individual bars with `BarStyleOverrides`:

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

| Field             | Type     | Description      |
| ----------------- | -------- | ---------------- |
| `backgroundColor` | `string` | Bar fill color   |
| `borderColor`     | `string` | Bar border color |
| `textColor`       | `string` | Bar text color   |

## Progress Indicator

Add a progress overlay to any bar:

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
      showText: true, // Show percentage label
      textFormat: '{value}% complete', // Template string
      backgroundColor: '#10b981', // Optional fill color
    },
  },
];
```

| Field             | Type      | Default | Description                      |
| ----------------- | --------- | ------- | -------------------------------- |
| `value`           | `number`  | —       | Progress percentage (0–100)      |
| `backgroundColor` | `string`  |         | Progress fill color              |
| `textColor`       | `string`  |         | Progress text color              |
| `textFormat`      | `string`  |         | Template (`{value}` placeholder) |
| `showText`        | `boolean` | `true`  | Show percentage label            |

## Styling Callbacks

For dynamic styling based on bar state, use callback props:

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
  return undefined; // fall back to default
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

Available callback props:

| Prop                         | Signature                                               |
| ---------------------------- | ------------------------------------------------------- |
| `barBackgroundColorCallback` | `(arg: BarStyleArg) => string \| undefined`             |
| `barBorderColorCallback`     | `(arg: BarStyleArg) => string \| undefined`             |
| `barTextColorCallback`       | `(arg: BarStyleArg) => string \| undefined`             |
| `barFontSizeCallback`        | `(arg: BarStyleArg) => number \| undefined`             |
| `barFontWeightCallback`      | `(arg: BarStyleArg) => number \| string \| undefined`   |
| `barClassNamesCallback`      | `(arg: BarStyleArg) => string \| string[] \| undefined` |

## Drag & Drop

Enable interactive bar editing with `editable`:

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

### Event Payloads

| Event           | Payload Fields                                                 |
| --------------- | -------------------------------------------------------------- |
| `bar-drop`      | `barId`, `oldRange`, `newRange`, `oldRowId`, `newRowId`        |
| `bar-resize`    | `barId`, `edge` (`'start'` \| `'end'`), `oldRange`, `newRange` |
| `bar-progress`  | `barId`, `oldProgress`, `newProgress`                          |
| `bar-click`     | `barId`, `nativeEvent`                                         |
| `bar-dragstart` | `barId`, `nativeEvent`                                         |
| `bar-dragstop`  | `barId`, `nativeEvent`                                         |

## Validation

Control which interactions are allowed using validation props:

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

// Only allow drops on weekdays
const allowDrop: EventAllowFunc = (proposal, movingBar) => {
  const day = proposal.range.start.getDay();
  return day !== 0 && day !== 6; // Not Sunday or Saturday
};
</script>
```

:::

| Prop              | Type                          | Description                        |
| ----------------- | ----------------------------- | ---------------------------------- |
| `eventOverlap`    | `boolean \| EventOverlapFunc` | Prevent bars from overlapping      |
| `eventAllow`      | `EventAllowFunc`              | Custom allow/deny callback         |
| `eventConstraint` | `EventConstraint`             | Restrict to a time range / row IDs |
