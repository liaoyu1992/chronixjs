# @chronixjs/gantt

Framework-agnostic gantt core. Types, intermediate representation (IR), pure layout / interaction helpers, theme tokens. No runtime DOM, no framework binding — those live in adapter packages such as [`@chronixjs/gantt-vue3`](https://github.com/liaoyu1992/chronixjs/tree/master/adapters/vue3).

> **Status: alpha.** Published under the `alpha` npm dist-tag. Install with `@alpha`. APIs may shift before `1.0.0`; SemVer stability commitment begins at `1.0`.

## Install

```bash
pnpm add @chronixjs/gantt@alpha
```

Most consumers want the Vue 3 adapter instead:

```bash
pnpm add @chronixjs/gantt-vue3@alpha vue
```

The adapter depends on this core; installing the adapter pulls it transitively.

## What's in here

### Specifications (immutable input shapes)

- `BarSpec` — one bar (id, rowId, time range, optional progress / style overrides / class names / DPR intent)
- `RowSpec` — one row (id, height hint, columns, parent id for grouping)
- `LinkSpec` — one dependency edge (source / target bar id, routing, marker, color override)
- `AxisRangePlanInput` — viewId / anchorDate / viewportWidth / locale / weekendsVisible
- `ChartIR` — top-level immutable graph

### Layout passes (pure functions on specs + axis)

- `defaultAxisRangePlanner` — viewId × anchorDate → `PlannedAxis` (ticks, headerRows, slot widths)
- `defaultBarStackHeightPass` — greedy interval coloring → per-row stack height
- `defaultRowSwimlaneLayout` — flat top-to-bottom strip Y placement
- `defaultBarPlacementPass` — bars → `{ x, y, width, height }` placement
- `defaultLinkRouter` — link endpoints → square / smooth-Bézier path points
- `defaultVirtualizedPaneLayout` — viewport + overscan → visible strip / slot ranges

### Interaction runtime (pure transaction reducers)

- `defaultPointerCaptureSession` — begin / advance / commit for 4 kinds: `BarDragTransaction`, `BarResizeTransaction`, `ProgressHandleTransaction`, `CalendarRangeSelectTransaction`
- `defaultPointerHitTester` — pointer position → bar / progress-handle / edge-resizer / empty-row zone
- `defaultStripResolver` — y → row id (half-open intervals)

### API surface

- `GanttHandle` — imperative facade (changeView / prev / next / today / gotoDate / incrementDate / getDate / zoomTo / scrollToDate / getBarById / getBars / subscribe)
- `GanttEventMap` — payload types for every emit (bar-drop / bar-resize / bar-progress / select / bar-click / empty-area-click / link-orphan / etc.)
- `ChronixTheme` + `defaultChronixTheme` — 50-token theme dictionary
- `ToolbarInput` + `parseToolbar` + `formatToolbarTitle` — header-toolbar string DSL parser
- `nextAnchor` / `prevAnchor` / `todayAnchor` / `applyIncrement` — date navigation math
- `resolveBarStyle` + `validateDrop` / `validateResize` / `validateSelect` — bar styling + interaction validation cascades

### Slot registry + render callbacks

- `createSlotRegistry()` — for full per-element render replacement
- `BAR_SLOT_NAME` / `LINK_SLOT_NAME` / `HEADER_CELL_SLOT_NAME` — registered slot names
- `BarSlotArgs` / `LinkSlotArgs` / `HeaderCellSlotArgs` — slot context types
- `getDayClassNames` / `getSlotClassNames` / `computeCellStateMeta` + `DAY_IDS` — per-day / per-slot CSS class helpers

## Quickstart (TypeScript, no framework)

This package has no runtime side effects. Typical use case: declare specs + use the pure helpers (axis planner, layout passes, link router, interaction reducers) inside your own renderer (canvas, custom SVG, DOM diff, headless test). For a ready-made Vue 3 component see [`@chronixjs/gantt-vue3`](https://www.npmjs.com/package/@chronixjs/gantt-vue3).

```ts
import {
  defaultAxisRangePlanner,
  type AxisRangePlanInput,
  type BarSpec,
  type RowSpec,
} from '@chronixjs/gantt';

const rows: RowSpec[] = [
  { id: 'r1', columns: { name: 'Row 1' }, heightHint: 38 },
  { id: 'r2', columns: { name: 'Row 2' }, heightHint: 38 },
];

const bars: BarSpec[] = [
  {
    id: 'b1',
    rowId: 'r1',
    range: { start: new Date('2026-05-18'), end: new Date('2026-05-20') },
    dprIntent: 'pixel-snap',
  },
];

const axisInput: AxisRangePlanInput = {
  viewId: 'week',
  anchorDate: new Date('2026-05-18'),
  viewportWidth: 1440,
  locale: 'zh-CN',
  weekendsVisible: true,
};

const axis = defaultAxisRangePlanner.plan(axisInput);
// axis.ticks / axis.headerRows / axis.slotWidth / axis.slotCount

// From here, feed `bars`, `rows`, `axis` through the layout passes
// (`defaultBarStackHeightPass`, `defaultRowSwimlaneLayout`,
// `defaultBarPlacementPass`, `defaultLinkRouter`) and route the output
// to your renderer. See the source of `@chronixjs/gantt-vue3` for a
// worked end-to-end integration.
```

## Parity

`@chronixjs/gantt` is an R2 rewrite of a mature reference gantt library with L2 parity (same observable outputs for same inputs). 56 cross-demo parity assertions plus 27 visual-regression scenarios pin the published surface against the reference. Drift inventory + disposition register live in [`audit/PARITY_RECHECK.md`](https://github.com/liaoyu1992/chronixjs/blob/master/audit/PARITY_RECHECK.md) in the monorepo.

## License

[MIT](./LICENSE) © liaoyu1992
