# @chronixjs/gantt-vue3

Vue 3 component + composables built on [`@chronixjs/gantt`](https://www.npmjs.com/package/@chronixjs/gantt). The default surface most consumers want.

> **Status: alpha.** Published under the `alpha` npm dist-tag. Install with `@alpha`. APIs may shift before `1.0.0`; SemVer stability commitment begins at `1.0`.

## Install

```bash
pnpm add @chronixjs/gantt-vue3@alpha vue
```

The `@chronixjs/gantt` core is pulled transitively — you don't install it separately unless you also consume the framework-agnostic types / IR / pure helpers in non-Vue code.

`vue` is a peer dependency (`^3.4`); bring your own.

## Quickstart

```vue
<script setup lang="ts">
import { ref } from 'vue';
import type { AxisRangePlanInput, BarSpec, RowSpec } from '@chronixjs/gantt';
import { ChronixGantt } from '@chronixjs/gantt-vue3';
import type { BarDropPayload } from '@chronixjs/gantt-vue3';

const rows = ref<RowSpec[]>([
  { id: 'r1', columns: { name: 'Alice' }, heightHint: 38 },
  { id: 'r2', columns: { name: 'Bob' }, heightHint: 38 },
  { id: 'r3', columns: { name: 'Carol' }, heightHint: 38 },
]);

const bars = ref<BarSpec[]>([
  {
    id: 'b1',
    rowId: 'r1',
    range: { start: new Date('2026-05-18T09:00'), end: new Date('2026-05-20T17:00') },
    title: 'Design review',
    dprIntent: 'pixel-snap',
  },
  {
    id: 'b2',
    rowId: 'r2',
    range: { start: new Date('2026-05-19'), end: new Date('2026-05-22') },
    title: 'Implementation',
    progress: { value: 35 },
    dprIntent: 'pixel-snap',
  },
]);

const axisInput = ref<AxisRangePlanInput>({
  viewId: 'week',
  anchorDate: new Date('2026-05-18'),
  viewportWidth: 1440,
  locale: 'zh-CN',
  weekendsVisible: true,
});

function onBarDrop(payload: BarDropPayload) {
  const target = bars.value.find((b) => b.id === payload.barId);
  if (!target) return;
  bars.value = bars.value.map((b) =>
    b.id === payload.barId ? { ...b, range: payload.range, rowId: payload.newRowId ?? b.rowId } : b,
  );
}
</script>

<template>
  <ChronixGantt :bars="bars" :rows="rows" :axis-input="axisInput" editable @bar-drop="onBarDrop" />
</template>
```

## Composables (advanced wiring)

When you need to drive the pointer pipeline manually (custom hit-test, replaced default ChronixGantt rendering, headless test harness):

```ts
import { useGanttLayout, useGanttPointer, useGanttSelection } from '@chronixjs/gantt-vue3';
```

- `useGanttLayout({ bars, rows, axisInput })` — reactive layout pipeline; returns `axis`, `strips`, `placedBars`, `routedLinks` refs
- `useGanttPointer({ bars, rows, axis, strips, ... })` — pointer state machine; emits `bar-drop` / `bar-resize` / `bar-progress` / `select`; exposes `activeTransaction`, `projectedRowId`, `wasDragCommit`
- `useGanttSelection({ unselectAuto })` — selection set helpers; `handleBarClick` (replace on plain, toggle on shift), `handleEmptyAreaClick` (clear)

## Imperative handle

```vue
<script setup lang="ts">
import { ref } from 'vue';
import type { GanttHandle } from '@chronixjs/gantt';
import { ChronixGantt } from '@chronixjs/gantt-vue3';

const ganttRef = ref<(InstanceType<typeof ChronixGantt> & GanttHandle) | null>(null);

function jumpToNextMonth() {
  ganttRef.value?.next();
}

function focusOnBar(id: string) {
  const bar = ganttRef.value?.getBarById(id);
  if (bar) ganttRef.value?.scrollToDate(bar.range.start);
}
</script>

<template>
  <ChronixGantt ref="ganttRef" ... />
</template>
```

Available handle methods: `changeView` / `prev` / `next` / `today` / `gotoDate` / `incrementDate` / `getDate` / `zoomTo` / `scrollToDate` / `getBarById` / `getBars` / `getBarTable` / `getRowDataSource` / `getLinkTable` / `subscribe`.

## Theme

```vue
<ChronixGantt :theme="{ chartBackground: '#fafafa', linkDefaultColor: '#5c6bc0' }" ... />
```

50 tokens. Partial merge — unset tokens fall back to `defaultChronixTheme`. See `ChronixTheme` type for the full key list.

## Header toolbar (parity-shape string DSL)

```vue
<ChronixGantt
  v-model:axis-input="axisInput"
  :header-toolbar="{
    left: 'prev,next today',
    center: 'title',
    right: 'day,week,month,season,halfYear,year',
  }"
  ...
/>
```

Buttons emit `update:axisInput` with the new `viewId` / `anchorDate`; use `v-model:axis-input` to round-trip.

## Slot registry

For per-bar / per-link / per-header-cell render replacement that the prop surface doesn't cover:

```ts
import { createSlotRegistry, BAR_SLOT_NAME, type BarSlotArgs } from '@chronixjs/gantt';

const slotRegistry = createSlotRegistry();
slotRegistry.register(BAR_SLOT_NAME, (ctx: BarSlotArgs) => {
  // return a VNode (h(...)) or array of VNodes
});
```

Pass `<ChronixGantt :slot-registry="slotRegistry" ... />`. Same pattern for `LINK_SLOT_NAME` and `HEADER_CELL_SLOT_NAME`.

## See also

- Core types + IR + pure helpers: [`@chronixjs/gantt`](https://www.npmjs.com/package/@chronixjs/gantt)
- Live example: [`examples/gantt-vue3`](https://github.com/liaoyu1992/chronixjs/tree/master/examples/gantt-vue3) in the monorepo

## License

[MIT](./LICENSE) © liaoyu1992
