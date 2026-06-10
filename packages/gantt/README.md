# @chronixjs/gantt

Framework-agnostic gantt core. Types, intermediate representation (IR), pure layout / interaction / render helpers, theme tokens. No runtime DOM, no framework binding — those live in adapter packages: [`@chronixjs/gantt-vue3`](https://github.com/liaoyu1992/chronixjs/tree/master/adapters/vue3), [`@chronixjs/gantt-vue2`](https://github.com/liaoyu1992/chronixjs/tree/master/adapters/vue2), and [`@chronixjs/gantt-react`](https://github.com/liaoyu1992/chronixjs/tree/master/adapters/react).

> **Status: alpha.** Published under the `alpha` npm dist-tag. Install with `@alpha`. APIs may shift before `1.0.0`; SemVer stability commitment begins at `1.0`.

## Install

```bash
pnpm add @chronixjs/gantt@alpha
```

Most consumers want a framework adapter instead:

```bash
pnpm add @chronixjs/gantt-vue3@alpha vue                          # Vue 3
pnpm add @chronixjs/gantt-vue2@alpha vue@^2.7                     # Vue 2.7
pnpm add @chronixjs/gantt-react@alpha react@^18 react-dom@^18     # React 18
```

The adapter depends on this core; installing the adapter pulls it transitively. Install this core package directly only when consuming the types / IR / pure helpers in non-Vue/non-React code (canvas renderer, custom SVG layer, headless test harness, etc.).

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

### Pure render helpers (Phase 32.6)

For downstream consumers building custom renderers, the following pure helpers are canonical across all 3 adapters and stable under SemVer:

- `truncateBarText(text, maxWidth, fontSize)` — char-count + ellipsis truncation. `avgCharWidth = fontSize * 0.6`; cutoff at `maxChars <= 3` returns empty; otherwise `prefix + '...'`.
- `snapHorizontalGridLineY(lineY, drawableHeight)` — DPR-aware crisp-pixel snap (reads `window.devicePixelRatio` defensively; SSR-safe). Pairs with `vector-effect="non-scaling-stroke"` on the consumer's SVG line.
- `deriveViewportClipping(renderX, renderWidth, scrollLeft, clientWidth, triangleMargin)` — returns `{ isViewportClippedStart, isViewportClippedEnd, viewportLockedLeftApexX, viewportLockedRightApexX }`. Includes Phase 28.2.2 partial-overlap correctness guard + `clientWidth === 0` pre-mount short-circuit + strict `<` / `>` boundary semantics.
- `deriveEdgePaddedX(side, renderEdge, viewportLockedApex, isAxisClipped, isViewportClipped, defaultInset, triangleMargin, triangleSize, consumerGap)` — 3-way precedence (viewport-clipped > axis-clipped > default). Used for bar text + progress-dot x-positioning.

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
    dprIntent: 'crisp-pixel',
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

`@chronixjs/gantt` ships 56 Vue 3 + 26 Vue 2 cross-demo parity assertions plus 27 visual-regression scenarios that pin the published surface against itself across adapter versions.

## License

[MIT](./LICENSE) © liaoyu1992
