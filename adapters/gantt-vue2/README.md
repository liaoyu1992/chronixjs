# @chronixjs/gantt-vue2

Vue 2.7 component + composables built on [`@chronixjs/gantt`](https://www.npmjs.com/package/@chronixjs/gantt).

> **Status: alpha.** Published under the `alpha` npm dist-tag. Install with `@alpha`. APIs may shift before `1.0.0`; SemVer stability commitment begins at `1.0`. Feature-parity with [`@chronixjs/gantt-vue3`](https://www.npmjs.com/package/@chronixjs/gantt-vue3) for the v0.1.0-alpha cross-adapter parity scope (chart-only branch — sidebar / `columns` prop deferred).

## Install

```bash
pnpm add @chronixjs/gantt-vue2@alpha vue@^2.7
```

The `@chronixjs/gantt` core is pulled transitively — you don't install it separately unless you also consume the framework-agnostic types / IR / pure helpers in non-Vue code.

`vue` is a peer dependency (`^2.7.0`); bring your own. **Vue 2.6 is not supported** — chronix-vue2 requires Vue 2.7's native Composition API (`@vue/composition-api` plugin is not a substitute).

## Quickstart

```vue
<script lang="ts">
import { defineComponent, ref } from 'vue';
import type { AxisRangePlanInput, BarSpec, RowSpec } from '@chronixjs/gantt';
import { ChronixGantt } from '@chronixjs/gantt-vue2';
import type { BarDropPayload } from '@chronixjs/gantt-vue2';

export default defineComponent({
  components: { ChronixGantt },
  setup() {
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
        dprIntent: 'crisp-pixel',
      },
      {
        id: 'b2',
        rowId: 'r2',
        range: { start: new Date('2026-05-19'), end: new Date('2026-05-22') },
        title: 'Implementation',
        progress: { value: 35 },
        dprIntent: 'crisp-pixel',
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
      bars.value = bars.value.map((b) =>
        b.id === payload.barId
          ? { ...b, range: payload.range, rowId: payload.newRowId ?? b.rowId }
          : b,
      );
    }

    return { rows, bars, axisInput, onBarDrop };
  },
});
</script>

<template>
  <chronix-gantt
    :bars="bars"
    :rows="rows"
    :axis-input="axisInput"
    :editable="true"
    @bar-drop="onBarDrop"
  />
</template>
```

> Vue 2.7 doesn't support `<script setup>` — use `defineComponent({ setup() { ... } })` instead. Composition API behavior is otherwise identical to Vue 3.

## Composables (advanced wiring)

When you need to drive the pointer pipeline manually (custom hit-test, replaced default ChronixGantt rendering, headless test harness):

```ts
import {
  useGanttLayout,
  useGanttPointer,
  useGanttSelection,
  useChartScrollState,
} from '@chronixjs/gantt-vue2';
```

- `useGanttLayout({ bars, rows, axisInput })` — reactive layout pipeline; returns `axis`, `strips`, `placedBars`, `routedLinks` refs
- `useGanttPointer({ bars, rows, axis, strips, ... })` — pointer state machine; emits `bar-drop` / `bar-resize` / `bar-progress` / `select`; exposes `activeTransaction`, `projectedRowId`, `wasDragCommit`
- `useGanttSelection({ unselectAuto })` — selection set helpers; `handleBarClick` (replace on plain, toggle on shift), `handleEmptyAreaClick` (clear)
- `useChartScrollState(paneRef)` — reactive `scrollLeft` + `clientWidth` refs from the chart pane; powers viewport-aware features (continuation triangles, bar text/dot positioning)

## Imperative handle

```vue
<script lang="ts">
import { defineComponent, ref } from 'vue';
import type { GanttHandle } from '@chronixjs/gantt';
import { ChronixGantt } from '@chronixjs/gantt-vue2';

export default defineComponent({
  components: { ChronixGantt },
  setup() {
    const ganttRef = ref<GanttHandle | null>(null);

    function jumpToNextMonth() {
      ganttRef.value?.next();
    }

    function focusOnBar(id: string) {
      const bar = ganttRef.value?.getBarById(id);
      if (bar) ganttRef.value?.scrollToDate(bar.range.start);
    }

    return { ganttRef, jumpToNextMonth, focusOnBar };
  },
});
</script>

<template>
  <chronix-gantt ref="ganttRef" ... />
</template>
```

Available handle methods: `changeView` / `prev` / `next` / `today` / `gotoDate` / `incrementDate` / `getDate` / `zoomTo` / `scrollToDate` / `getBarById` / `getBars` / `getBarTable` / `getRowDataSource` / `getLinkTable` / `subscribe`.

## Theme

```vue
<chronix-gantt :theme="{ chartBackground: '#fafafa', linkDefaultColor: '#5c6bc0' }" ... />
```

50 tokens. Partial merge — unset tokens fall back to `defaultChronixTheme`. See `ChronixTheme` type for the full key list.

## Header toolbar (parity-shape string DSL)

```vue
<chronix-gantt
  :axis-input="axisInput"
  :header-toolbar="{
    left: 'prev,next today',
    center: 'title',
    right: 'day,week,month,season,halfYear,year',
  }"
  @update:axis-input="(next) => (axisInput = next)"
  ...
/>
```

Buttons emit `update:axisInput` with the new `viewId` / `anchorDate`. Vue 2.7 supports `v-model:axis-input` syntax too, or wire the handler manually as above.

## Dual-scrollport architecture

```vue
<chronix-gantt :max-body-height="'400px'" ... />
```

Setting `maxBodyHeight` opts the consumer into chart-pane vertical scroll. Without it (default), the chart body auto-sizes to content and the consumer's outer container owns scrolling. Header pane stays horizontally synced via `transform: translateX(-${scrollLeft}px)` on the chart-pane scroll event.

## Slot registry

For per-bar / per-link / per-header-cell render replacement that the prop surface doesn't cover:

```ts
import { createSlotRegistry, BAR_SLOT_NAME, type BarSlotArgs } from '@chronixjs/gantt';
import { h } from 'vue';

const slotRegistry = createSlotRegistry();
slotRegistry.register(BAR_SLOT_NAME, (ctx: BarSlotArgs) => {
  // return a VNode (h(...)) or array of VNodes
  return h('rect', { class: 'my-custom-bar', attrs: { x: ctx.renderX /* ... */ } });
});
```

Pass `<chronix-gantt :slot-registry="slotRegistry" ... />`. Same pattern for `LINK_SLOT_NAME` and `HEADER_CELL_SLOT_NAME`.

> Note: Vue 2's `h()` separates props / attrs / event listeners into distinct vnode-data fields (`{ class, attrs: { ... }, on: { ... } }`); Vue 3 uses a flat shape. Use Vue 2's separated form inside slot render callbacks.

## See also

- Core types + IR + pure helpers: [`@chronixjs/gantt`](https://www.npmjs.com/package/@chronixjs/gantt)
- Vue 3 adapter (canonical reference): [`@chronixjs/gantt-vue3`](https://www.npmjs.com/package/@chronixjs/gantt-vue3)
- Live example: [`examples/gantt-vue2`](https://github.com/liaoyu1992/chronixjs/tree/master/examples/gantt-vue2) in the monorepo

## License

[MIT](./LICENSE) © liaoyu1992
