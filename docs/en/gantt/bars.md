<script setup>
import GanttBarProgress from '../../gantt/demos/GanttBarProgress.vue';
import ganttBarProgressCode from '../../gantt/demos/GanttBarProgress.vue?raw';
import ganttBarProgressVue2 from '../../gantt/demos/GanttBarProgress.vue2?raw';
import ganttBarProgressReact from '../../gantt/demos/GanttBarProgress.react?raw';
</script>

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

<DemoBox title="Bars with Progress & Styling" description="Bars with custom colors and progress indicators." :code="ganttBarProgressCode" :code-vue2="ganttBarProgressVue2" :code-react="ganttBarProgressReact">
  <GanttBarProgress />
</DemoBox>

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
