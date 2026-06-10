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

## Configuring the View

Set the initial view via `axisInput.viewId`:

::: code-group

```vue [Vue 3]
<template>
  <ChronixGantt :bars="bars" :rows="rows" :axis-input="axisInput" />
</template>

<script setup lang="ts">
import { ChronixGantt } from '@chronixjs/gantt-vue3';
import type { AxisRangePlanInput } from '@chronixjs/gantt';

const axisInput: AxisRangePlanInput = {
  viewId: 'month', // View level
  anchorDate: new Date('2026-01-01'), // Initial center date
  viewportWidth: 900, // Chart width in pixels
  locale: 'en', // Locale for formatting
  weekendsVisible: true, // Show weekend columns
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
      axisInput: {
        viewId: 'month',
        anchorDate: new Date('2026-01-01'),
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
import type { AxisRangePlanInput } from '@chronixjs/gantt';

const axisInput: AxisRangePlanInput = {
  viewId: 'month',
  anchorDate: new Date('2026-01-01'),
  viewportWidth: 900,
  locale: 'en',
  weekendsVisible: true,
};

export function App() {
  return <ChronixGantt bars={bars} rows={rows} axisInput={axisInput} />;
}
```

:::

### AxisRangePlanInput

| Field             | Type      | Required | Description                 |
| ----------------- | --------- | -------- | --------------------------- |
| `viewId`          | `ViewId`  | ✅       | Zoom level                  |
| `anchorDate`      | `Date`    | ✅       | Initial center/focus date   |
| `viewportWidth`   | `number`  | ✅       | Chart container width (px)  |
| `locale`          | `string`  | ✅       | Locale for date formatting  |
| `weekendsVisible` | `boolean` | ✅       | Show weekend column shading |

## Toolbar with View Switcher

Add a built-in toolbar with navigation and view switching:

::: code-group

```vue [Vue 3]
<template>
  <ChronixGantt
    :bars="bars"
    :rows="rows"
    :axis-input="axisInput"
    :header-toolbar="toolbar"
    @update:axis-input="onAxisChange"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ChronixGantt } from '@chronixjs/gantt-vue3';
import type { AxisRangePlanInput, ToolbarInput } from '@chronixjs/gantt';

const axisInput = ref<AxisRangePlanInput>({
  viewId: 'week',
  anchorDate: new Date(),
  viewportWidth: 900,
  locale: 'en',
  weekendsVisible: true,
});

// Toolbar layout: left=nav, center=title, right=view switcher
const toolbar: ToolbarInput = {
  left: 'prev,next today',
  center: 'title',
  right: 'day,week,month,season,year',
};

function onAxisChange(next: AxisRangePlanInput) {
  axisInput.value = next;
}
</script>
```

```tsx [React]
import { useState } from 'react';
import { ChronixGantt } from '@chronixjs/gantt-react';
import type { AxisRangePlanInput, ToolbarInput } from '@chronixjs/gantt';

const toolbar: ToolbarInput = {
  left: 'prev,next today',
  center: 'title',
  right: 'day,week,month,season,year',
};

export function App() {
  const [axisInput, setAxisInput] = useState<AxisRangePlanInput>({
    viewId: 'week',
    anchorDate: new Date(),
    viewportWidth: 900,
    locale: 'en',
    weekendsVisible: true,
  });

  return (
    <ChronixGantt
      bars={bars}
      rows={rows}
      axisInput={axisInput}
      headerToolbar={toolbar}
      onUpdateAxisInput={setAxisInput}
    />
  );
}
```

:::

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
