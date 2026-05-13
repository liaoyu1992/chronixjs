# @chronixjs/gantt — Module taxonomy

The chronix-native module decomposition. Drives `src/` layout, public type
exports, and the R2 audit trail. Independent of any reference codebase.

Status: **v0 draft.** Names locked; responsibilities can still shift.
Companion file: [`../../audit/BANNED_IDENTIFIERS.md`](../../audit/BANNED_IDENTIFIERS.md)
declares the matching reference-side names that chronix must NOT carry.

## Layer overview

```text
src/
├── ir/             pure data shapes (frozen, framework-free)
├── data/           runtime collections + their mutation API
├── layout/         single-pass derivation: data + viewport → render nodes
├── render/         render-node tree + paint primitives
├── interaction/    pointer transactions + capture session
└── api/            external option shape + GanttHandle facade
```

Data flows left → right: `data` feeds `layout` which produces `render` nodes;
`interaction` reads `render` to hit-test and writes back to `data` via
transactions.

## ir/ — data shapes

Pure types. No methods. No mutation. Cloning is structural. Carries
[anti-regression hooks](#anti-regression-hooks) as first-class fields so
they cannot be forgotten downstream.

| name | responsibility |
| --- | --- |
| `BarSpec` | one drawable bar's static description: id, row, time range, style overrides, optional `progress`, optional `pointerOverlay` group binding |
| `LinkSpec` | dependency between two bar ids: routing hint (`'square' \| 'smooth'`), marker shape, color override |
| `RowSpec` | one swimlane: id, parent id (for grouping), display columns, height hint |
| `AxisSpec` | one tick axis: range, granularity (`'hour'\|'day'\|'month'\|...`), label format |
| `ChartIR` | the root assembly: rows, bars, links, axes, plus a `viewport` reference |
| `dprIntent` | enum on grid-line/bar-edge nodes: `'crisp-pixel' \| 'subpixel' \| 'inherit'` |

## data/ — runtime collections

| name | responsibility |
| --- | --- |
| `BarTable` | indexed bar collection; supports query-by-row, query-by-time-range, in-flight transaction overlay |
| `RowDataSource` | tree-aware row collection; resolves group hierarchy |
| `LinkTable` | indexed link collection; lookup by from-bar-id, to-bar-id |

## layout/ — single-pass derivation

The **single-pass** rule: each pass reads from immutable IR + viewport state,
writes render-node fields. No back-and-forth. No layout effects.

| name | responsibility |
| --- | --- |
| `AxisRangePlanner` | computes tick positions, slot widths, header rows for a view (day/week/month/season/halfYear/year) |
| `RowSwimlaneLayout` | resolves Y positions and heights of all rows including grouped/collapsed states |
| `BarPlacementPass` | resolves X positions and widths of bars from their time range + axis ticks |
| `LinkRouter` | computes polyline/curve path strings for dependency lines, including marker placement |
| `VirtualizedPaneLayout` | scroll-region geometry: which rows/columns are in viewport, which are virtualized |

## render/ — render-node tree

The output of `layout/`. Framework-agnostic — adapters consume this tree
and emit Vue/React/Vue2 components.

| name | responsibility |
| --- | --- |
| `PointerOverlayGroup` | a hit-test layer that re-enables `pointer-events` inside an otherwise pointer-events:none parent. First-class IR primitive, not a CSS afterthought. |
| `SlotRenderer` | invokes user-supplied content templates with a context arg (bar/link/header) |
| `SlotRegistry` | maps slot name → template; survives view changes |
| `IRCanvas` | the [imperative escape hatch](#anti-regression-hooks): `{ draw(ctx: CanvasRenderingContext2D, dpr: number): void }` for nodes that prefer direct paint |

## interaction/ — pointer transactions

Each transaction is **distinct, not a mode flag**. Composing them through a
discriminator union is the wrong shape — reference code that did that ended
up with hit-test bugs that took multiple patches to fix.

| name | responsibility |
| --- | --- |
| `PointerCaptureSession` | one pointer-down → pointer-up lifecycle; owns native pointer capture |
| `BarDragTransaction` | move a bar along time axis (and/or across rows) |
| `BarResizeTransaction` | drag the start- or end-edge of a bar |
| `ProgressHandleTransaction` | drag the progress triangle of a bar (separate transaction because the hit zone is a separate render-overlay group, not the bar body) |
| `CalendarRangeSelectTransaction` | drag on empty calendar area to select a date range |
| `requireInitialHit` | config on `PointerCaptureSession`: when `false`, the session is willing to start without the initial pointerdown landing on the registered subject element — needed when the subject is inside a `PointerOverlayGroup` that may not be the topmost layer at pointerdown time |

## api/ — external surface

| name | responsibility |
| --- | --- |
| `GanttOptions` | user-supplied options: roughly FullCalendar-shape-compatible for adapter convenience |
| `GanttHandle` | imperative facade: `changeView`, `gotoDate`, `getBarTable`, `subscribe(event, fn)` |

Adapters (Vue3/React/Vue2) live in `adapters/<framework>/` and wrap
`GanttHandle` in framework-idiomatic components — they do not add core
behavior.

## Anti-regression hooks

Five IR-level fields whose existence prevents the reference codebase's
biggest categories of bug from being possible in chronix:

1. **`dprIntent` on grid/bar nodes.** Forces every node to declare its
   pixel-alignment intent at IR-build time. Eliminates the
   "renders crisp on retina, blurry on standard DPR" class of bugs that
   gets discovered weeks after a layout change.
2. **`pointerOverlay: PointerOverlayGroup | null` on render nodes.** Makes
   the separate-hit-test-layer pattern a first-class field of the IR
   instead of a "remember to add `pointerEvents: 'auto'` on the right
   element" oral tradition.
3. **`inFlightTransaction` on `BarTable`.** Drag/resize/progress state
   must be representable inside `BarTable` (transaction overlay), not as
   imperative state on an interaction object. Lets `layout/` see in-flight
   bars without a special path.
4. **`requireInitialHit: boolean` on `PointerCaptureSession`.** Lifts the
   reference codebase's `requireInitial=false` magic boolean to a named,
   documented option. The semantic name explains _why_ you'd want this
   (separate-overlay subject), not just _what_ it does.
5. **`IRCanvas { draw(ctx, dpr) }` escape hatch on render nodes.** Any
   render node may opt into direct canvas paint instead of the standard
   DOM/SVG path. Performance-critical bars and high-density grids use it
   without the rest of the system caring.

## R2 mapping

Reference-side analog for each chronix name lives in
[`../../audit/R2_MAPPING.md`](../../audit/R2_MAPPING.md) — kept separate
because the table necessarily mentions banned identifiers, which the
audit dir is exempt from scanning.

## Naming principles

1. **Domain-grounded, not framework-borrowed.** `BarSpec` not `EventModel`;
   gantt's domain is bars on a time axis, not generic events.
2. **Transactions are nouns; passes are verbs-as-nouns.** `BarDragTransaction`,
   `BarPlacementPass`. Verb in the middle for processes, noun-noun for things.
3. **No `*Impl` or `*Manager`.** If a class would be `XManager`, it's
   probably `XRegistry` or `XSession` or just `X`.
4. **R2 distinctiveness over brevity.** A slightly longer name that doesn't
   collide with any reference name is preferred over a short name that does.
5. **Hooks state their intent in the name.** `requireInitialHit` not
   `strict`; `pointerOverlay` not `interactive`.
