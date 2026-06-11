<script setup>
import GanttViewsToolbar from '../../gantt/demos/GanttViewsToolbar.vue';
import ganttViewsToolbarCode from '../../gantt/demos/GanttViewsToolbar.vue?raw';
import ganttViewsToolbarVue2 from '../../gantt/demos/GanttViewsToolbar.vue2?raw';
import ganttViewsToolbarReact from '../../gantt/demos/GanttViewsToolbar.react?raw';
</script>

# Timeline Views

The Gantt chart supports 6 built-in timeline zoom levels, each designed for different planning horizons.

## Available Views

| ViewId       | Unit     | Best For              |
| ------------ | -------- | --------------------- |
| `'day'`      | 1 day    | Short-term scheduling |
| `'week'`     | 1 week   | Weekly planning       |
| `'month'`    | 1 month  | Medium-term roadmaps  |
| `'season'`   | 3 months | Quarterly overview    |
| `'halfYear'` | 6 months | Semi-annual planning  |
| `'year'`     | 1 year   | Annual overview       |

## Toolbar with View Switcher

Add a built-in toolbar with navigation and view switching:

<DemoBox title="Toolbar with View Switcher" description="Navigate between views using the built-in toolbar." :code="ganttViewsToolbarCode" :code-vue2="ganttViewsToolbarVue2" :code-react="ganttViewsToolbarReact">
  <GanttViewsToolbar />
</DemoBox>

### AxisRangePlanInput

| Field             | Type      | Required | Description                 |
| ----------------- | --------- | -------- | --------------------------- |
| `viewId`          | `ViewId`  | ✅       | Zoom level                  |
| `anchorDate`      | `Date`    | ✅       | Initial center/focus date   |
| `viewportWidth`   | `number`  | ✅       | Chart container width (px)  |
| `locale`          | `string`  | ✅       | Locale for date formatting  |
| `weekendsVisible` | `boolean` | ✅       | Show weekend column shading |

### ToolbarInput

| Field    | Type     | Description                        |
| -------- | -------- | ---------------------------------- |
| `left`   | `string` | Left section widgets (nav buttons) |
| `center` | `string` | Center section (title)             |
| `right`  | `string` | Right section (view switcher)      |
| `start`  | `string` | Alias for `left`                   |
| `end`    | `string` | Alias for `right`                  |

**Toolbar tokens:**

- Navigation: `prev`, `next`, `today`
- Title: `title`
- Views: `day`, `week`, `month`, `season`, `year`

## Programmatic Navigation

Use the imperative `GanttHandle` to navigate programmatically:

::: code-group

```vue [Vue 3]
<template>
  <div>
    <button @click="gantt?.prev()">← Prev</button>
    <button @click="gantt?.today()">Today</button>
    <button @click="gantt?.next()">Next →</button>
    <button @click="gantt?.changeView('month')">Month View</button>
    <ChronixGantt ref="ganttRef" :bars="bars" :rows="rows" :axis-input="axisInput" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ChronixGantt } from '@chronixjs/gantt-vue3';
import type { GanttHandle } from '@chronixjs/gantt';

const ganttRef = ref<{ handle: GanttHandle } | null>(null);
const gantt = computed(() => ganttRef.value?.handle);
</script>
```

:::

### GanttHandle Navigation Methods

| Method                  | Description                      |
| ----------------------- | -------------------------------- |
| `changeView(viewId)`    | Switch to a different zoom level |
| `prev()`                | Navigate to previous time span   |
| `next()`                | Navigate to next time span       |
| `today()`               | Jump to today                    |
| `gotoDate(date)`        | Scroll to a specific date        |
| `incrementDate(delta)`  | Shift by custom offset           |
| `getDate()`             | Get current anchor date          |
| `zoomTo(date, viewId?)` | Zoom and center on a date        |
| `scrollToDate(date)`    | Smooth scroll to date (no emit)  |

### IncrementDelta

```typescript
interface IncrementDelta {
  readonly days?: number;
  readonly weeks?: number;
  readonly months?: number;
  readonly years?: number;
}

// Example: jump forward 3 months
gantt.incrementDate({ months: 3 });
```

## Toolbar Title Formatting

Use the `formatToolbarTitle` utility to generate custom title text:

```typescript
import { formatToolbarTitle } from '@chronixjs/gantt';

const title = formatToolbarTitle(axisInput);
// e.g., "January 2026" for month view
```
