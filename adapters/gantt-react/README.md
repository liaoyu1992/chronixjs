# @chronixjs/gantt-react

React 18 component + hooks built on [`@chronixjs/gantt`](https://www.npmjs.com/package/@chronixjs/gantt). The React surface; same feature parity as `@chronixjs/gantt-vue3` and `@chronixjs/gantt-vue2`.

> **Status: alpha.** Published under the `alpha` npm dist-tag. Install with `@alpha`. APIs may shift before `1.0.0`; SemVer stability commitment begins at `1.0`.

## Install

```bash
pnpm add @chronixjs/gantt-react@alpha react@^18 react-dom@^18
```

The `@chronixjs/gantt` core is pulled transitively — you don't install it separately unless you also consume the framework-agnostic types / IR / pure helpers in non-React code.

`react` (`^18.0.0`) and `react-dom` (`^18.0.0`) are peer dependencies; bring your own. React 17 is not supported in v0; React 19 will be evaluated when it ships its stable production build.

## Quickstart

```tsx
import { useState, type FC } from 'react';
import type { AxisRangePlanInput, BarSpec, RowSpec } from '@chronixjs/gantt';
import { ChronixGantt, type BarDropPayload } from '@chronixjs/gantt-react';

const initialRows: RowSpec[] = [
  { id: 'r1', columns: { name: 'Alice' }, heightHint: 38 },
  { id: 'r2', columns: { name: 'Bob' }, heightHint: 38 },
  { id: 'r3', columns: { name: 'Carol' }, heightHint: 38 },
];

const initialBars: BarSpec[] = [
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
];

export const App: FC = () => {
  const [rows] = useState<RowSpec[]>(initialRows);
  const [bars, setBars] = useState<BarSpec[]>(initialBars);
  const [axisInput, setAxisInput] = useState<AxisRangePlanInput>({
    viewId: 'week',
    anchorDate: new Date('2026-05-18'),
    viewportWidth: 1440,
    locale: 'zh-CN',
    weekendsVisible: true,
  });

  function onBarDrop(p: BarDropPayload) {
    setBars((prev) =>
      prev.map((b) =>
        b.id === p.barId ? { ...b, range: p.newRange, rowId: p.newRowId ?? b.rowId } : b,
      ),
    );
  }

  return (
    <ChronixGantt
      bars={bars}
      rows={rows}
      axisInput={axisInput}
      onAxisInputChange={setAxisInput}
      editable
      onBarDrop={onBarDrop}
    />
  );
};
```

The `onAxisInputChange` callback prop closes the controlled-prop loop for view / nav buttons (when `headerToolbar` is configured) and imperative handle methods (`handle.next()` / `handle.today()` / etc.). Pass the new value back via `axisInput` on the next render.

## Hooks (advanced wiring)

When you need to drive the layout / pointer / scroll pipelines manually (custom hit-test, replaced default `<ChronixGantt>` rendering, headless test harness):

```ts
import {
  useGanttLayout,
  useGanttPointer,
  useGanttSelection,
  useChartScrollState,
} from '@chronixjs/gantt-react';
```

- `useGanttLayout({ bars, rows, axisInput })` — memoized layout pipeline; returns `{ axis, strips, placedBars, contentSize }`.
- `useGanttPointer({ bars, rows, axis, strips, ... })` — pointer state machine; fires `onBarDrop` / `onBarResize` / `onBarProgress` / `onSelect`; exposes `activeTransaction`, `projectedRowId`, `wasDragCommit`. Uses an internal `useRef` + `useReducer` getter pattern so consumers reading `pointer.activeTransaction` in the same handler that called `pointer.begin()` see the just-written state.
- `useGanttSelection({ unselectAuto })` — selection set helpers; `handleBarClick` (replace on plain, toggle on shift), `handleEmptyAreaClick` (clear).
- `useChartScrollState(paneRef)` — reactive `{ scrollLeft, clientWidth }` derived from the chart pane's scroll event + `ResizeObserver`. Used internally by `<ChronixGantt>` for viewport-clipped triangle math; exposed for custom consumers building scroll-aware overlays.

## Imperative handle

```tsx
import { useRef, type FC } from 'react';
import type { GanttHandle } from '@chronixjs/gantt';
import { ChronixGantt } from '@chronixjs/gantt-react';

export const Demo: FC = () => {
  const ganttRef = useRef<GanttHandle | null>(null);

  function jumpToNextMonth() {
    ganttRef.current?.next();
  }

  function focusOnBar(id: string) {
    const bar = ganttRef.current?.getBarById(id);
    if (bar) ganttRef.current?.scrollToDate(bar.range.start);
  }

  return <ChronixGantt ref={ganttRef} /* ... */ />;
};
```

Available handle methods: `changeView` / `prev` / `next` / `today` / `gotoDate` / `incrementDate` / `getDate` / `zoomTo` / `scrollToDate` / `getBarById` / `getBars` / `getBarTable` / `getRowDataSource` / `getLinkTable` / `subscribe`.

`handle.subscribe(event, listener)` returns an unsubscribe function and fires alongside the corresponding callback prop:

```tsx
const off = ganttRef.current?.subscribe('update:axisInput', (next) => {
  console.log('axis changed', next);
});
// later
off?.();
```

## Theme

```tsx
<ChronixGantt
  theme={{ chartBackground: '#fafafa', linkDefaultColor: '#5c6bc0' }}
  /* ... */
/>
```

50 tokens. Partial merge — unset tokens fall back to `defaultChronixTheme`. See `ChronixTheme` type for the full key list.

## Header toolbar (parity-shape string DSL)

```tsx
<ChronixGantt
  axisInput={axisInput}
  onAxisInputChange={setAxisInput}
  headerToolbar={{
    left: 'prev,next today',
    center: 'title',
    right: 'day,week,month,season,halfYear,year',
  }}
  /* ... */
/>
```

View buttons fire `onAxisInputChange` with a new `viewId`; nav buttons (`prev` / `next` / `today`) fire with a new `anchorDate`. Wire the controlled-prop loop via `useState` so the next render picks up the change. Title widgets render as non-interactive `<h2>` headings.

## Slot registry

For per-bar / per-link / per-header-cell render replacement that the prop surface doesn't cover:

```tsx
import { createSlotRegistry, BAR_SLOT_NAME, type BarSlotArgs } from '@chronixjs/gantt';

const slotRegistry = createSlotRegistry();
slotRegistry.register(BAR_SLOT_NAME, (ctx) => {
  const args = ctx.args as unknown as BarSlotArgs;
  return (
    <g data-bar-id={args.sourceBar.id}>
      <rect
        x={args.renderX}
        y={args.renderY}
        width={args.renderWidth}
        height={args.renderHeight}
        fill={args.resolvedBackgroundColor}
        stroke={args.resolvedBorderColor}
      />
    </g>
  );
});
```

Pass `<ChronixGantt slotRegistry={slotRegistry} /* ... */ />`. Same pattern for `LINK_SLOT_NAME` and `HEADER_CELL_SLOT_NAME`.

## Vertical scroll (`maxBodyHeight`)

```tsx
<ChronixGantt maxBodyHeight="400px" /* ... */ />
```

When set, the chart body scroll-pane caps to that CSS height and a vertical scrollbar engages. When omitted, the wrapper grows to content height (no vertical scroll). The chart-header pane stays sticky regardless.

## See also

- Core types + IR + pure helpers: [`@chronixjs/gantt`](https://www.npmjs.com/package/@chronixjs/gantt)
- Live example: [`examples/gantt-react`](https://github.com/liaoyu1992/chronixjs/tree/master/examples/gantt-react) in the monorepo
- Vue 3 equivalent: [`@chronixjs/gantt-vue3`](https://www.npmjs.com/package/@chronixjs/gantt-vue3)
- Vue 2.7 equivalent: [`@chronixjs/gantt-vue2`](https://www.npmjs.com/package/@chronixjs/gantt-vue2)

## License

[MIT](./LICENSE) © liaoyu1992
