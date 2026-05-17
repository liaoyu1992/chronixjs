# Phase 29 — per-day / per-slot CSS class system + header cell slot/callback

**Status**: **Approved (pending user reply)** — design only; no code yet.

## Problem

Two related render-layer gaps from `audit/RENDER_LAYER_GAP_SWEEP_2026-05-16.md`
(Sections I + N.1 + N.2 → Cluster D) remain after Phase 28.x closed the
bar / link customization surfaces:

1. **Per-day / per-slot CSS class taxonomy.** k-ui's body grid emits a
   rich state-class set on every day cell + slot — `gantt-day-{mon..sun}`,
   `gantt-day-today`, `gantt-day-past`, `gantt-day-future`,
   `gantt-day-disabled`, `gantt-day-other` (and slot equivalents). These
   classes are pure CSS hooks: hosts wire `.gantt-day-today { background:
gold; }` or `.gantt-day-sat .gantt-event { opacity: 0.5; }` without
   touching any callback. **Chronix's only cell-state class is
   `cx-gantt-today-cell` (Phase 22.2's tinted rect).** Hosts wanting any
   other state (weekday, past/future, day-id) have no hook.

2. **Header cell render is hardcoded.** chronix emits header band cells
   as `<rect class="cx-gantt-header-cell">` + centered `<text
class="cx-gantt-header-cell-label">`. No way for a host to (a) add
   per-cell classes (analog of k-ui's `dayHeaderClassNames` callback) or
   (b) fully replace the cell render (analog of k-ui's
   `dayHeaderContent`). Consumers wanting a custom navigable header
   (drilldown links, icons, bold weekend labels) have no path.

These are the last user-spotted render-layer surfaces in the
2026-05-16 sweep. Closing them completes Cluster D and the
post-sweep silent-gap remediation arc started at Phase 26.

## Reference (k-ui) behavior surface — full catalog

Reference files audited:

- `d:/work/k-ui/packages/gantt/src/component/date-rendering.ts:1-81` —
  `DateMeta` shape (`dow`, `isDisabled`, `isOther`, `isToday`, `isPast`,
  `isFuture`) + two class-generator functions `getDayClassNames` (returns
  `['gantt-day', 'gantt-day-{dayId}', + state-modifiers]`) and
  `getSlotClassNames` (same shape minus `-other`, plus `'gantt-slot'` /
  `'gantt-slot-{dayId}'` prefix).
- `d:/work/k-ui/packages/gantt/src/common/TableDateCell.tsx:29-89` —
  header cell render: `<ContentContainer elTag="th"
elClasses={[CLASS_NAME, ...getDayClassNames(dayMeta, theme)]}>` with
  `dayHeaderFormat`/`dayHeaderContent`/`dayHeaderClassNames` callback
  hooks + `buildNavLinkAttrs` (drilldown) + `extraDataAttrs` /
  `extraRenderProps`.
- `d:/work/k-ui/packages/gantt/src/common/DayCellContainer.tsx:1-66` —
  body cell render: same `getDayClassNames` applied to body cell
  wrapper element.
- `d:/work/k-ui/packages/gantt/src/resource-timeline/GanttView.tsx:578-615` —
  the SVG tick-row text render path: `<text>` with `clipPath` clip,
  fontSize=13 (row 0 bold) / 11 (sub-rows), truncation tooltip via
  child `<title>`, week-start emphasis via
  `cell.isWeekStart ? 'gantt-timeline-header-cell-week-start' : ''`.
- `d:/work/k-ui/packages/gantt/src/datelib/marker.ts` — `DAY_IDS = ['sun',
'mon', ..., 'sat']` (k-ui uses Sun-anchored day-id).

### Day-class vs slot-class semantics (k-ui)

- `getDayClassNames` returns `['gantt-day', 'gantt-day-{dayId}']` plus
  state modifiers. The `-other` modifier (out-of-current-month) is
  in this family only.
- `getSlotClassNames` returns `['gantt-slot', 'gantt-slot-{dayId}']`
  plus state modifiers, **minus `-other`**. Slots are sub-day units
  (week view's 24 hourly slots per day); the `-other` semantic
  doesn't apply because slots aren't day-grouped.
- Both families fire on the same DateMeta input but attach to
  different DOM elements: `gantt-day-*` on day cells (week view's day
  header cell, month view's calendar grid cell); `gantt-slot-*` on
  body slots (timeline body's vertical strips).

### Per-view class application in k-ui

| View     | Day classes fire on            | Slot classes fire on            |
| -------- | ------------------------------ | ------------------------------- |
| day      | The single header day-cell     | Each of 24 hourly body slots    |
| week     | 7 header day-cells (Mon..Sun)  | Each of 7×24 = 168 hourly slots |
| month    | Each of 30+ daily header cells | N/A (slots = days, only day-\*) |
| season   | Each of 90+ daily header cells | N/A                             |
| halfYear | Each of 180+ daily cells       | N/A                             |
| year     | Each of 360+ daily cells       | N/A                             |

### Header cell callback / slot surface

| Item                              | k-ui                                            | k-ui source                                                                                                                  |
| --------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `dayHeaderFormat`                 | Locale-driven label formatter                   | `options.ts:191` referenced in `TableDateCell.tsx:37`                                                                        |
| `dayHeaderClassNames`             | Class-array callback per header cell            | Passed into ContentContainer at `TableDateCell.tsx:71`                                                                       |
| `dayHeaderContent`                | Full-content render callback                    | Passed into ContentContainer at `TableDateCell.tsx:69`                                                                       |
| `dayHeaderDidMount/WillUnmount`   | Lifecycle hooks                                 | `TableDateCell.tsx:72-73`                                                                                                    |
| Header text `clipPath` truncation | Hard-coded per cell                             | `GanttView.tsx:585-612` (already PORTED — chronix `truncateTimelineHeaderText` not relevant since chronix already truncates) |
| Bold first row                    | Hard-coded `fontSize: rowIndex === 0 ? 13 : 11` | `GanttView.tsx:588`                                                                                                          |
| Truncation tooltip via `<title>`  | Hard-coded child `<title>{cell.text}</title>`   | `GanttView.tsx:609`                                                                                                          |

### Surface-level disposition table

| Item                                                                         | k-ui                                      | chronix v0                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gantt-day` base class                                                       | `date-rendering.ts:34`                    | ✅ **port** as `cx-gantt-day`. Attached to header-band day cells (week view's 7 day-header cells, month/season/halfYear/year's per-day header cells). NOT attached to outer month-band cells (those are calendar bands, not day cells).                                                                                                                 |
| `gantt-day-{dayId}` weekday modifier (`sun`/`mon`/.../`sat`)                 | `date-rendering.ts:34`                    | ✅ **port** as `cx-gantt-day-{dayId}` using k-ui's `DAY_IDS` array verbatim. Derived from `tick.time.getDay()` at render time — no `AxisTick` shape extension. Naming kept Sun-anchored to match k-ui consumer CSS (consumer porting `.gantt-day-sat { background: #ffefef }` maps 1:1).                                                                |
| `gantt-day-today`                                                            | `date-rendering.ts:40`                    | ✅ **port** as `cx-gantt-day-today`. Computed at render time via `tick.time` vs `chronixToday`. Coexists with Phase 22.2's `cx-gantt-today-cell` (separate element — 22.2 is the backing tinted rect; 29 is the cell-content-level state modifier). Both selectable.                                                                                    |
| `gantt-day-past`                                                             | `date-rendering.ts:44-46`                 | ✅ **port** as `cx-gantt-day-past`.                                                                                                                                                                                                                                                                                                                     |
| `gantt-day-future`                                                           | `date-rendering.ts:48-50`                 | ✅ **port** as `cx-gantt-day-future`.                                                                                                                                                                                                                                                                                                                   |
| `gantt-day-disabled`                                                         | `date-rendering.ts:36-38`                 | ⏸️ **parked** — chronix's PlannedAxis has no `validRange` / `activeRange` concept (would need a new prop + layout-pass plumbing). All chronix days are "active" in v0. Class never emitted today. Re-prioritize when chronix grows `disabledDateRange` prop (likely Phase 31+).                                                                         |
| `gantt-day-other` (out-of-current-month padding day)                         | `date-rendering.ts:52-54`                 | ❌ **Reject** (architectural divergence). chronix's month view is a continuous timeline of 30+ daily slots — NOT a 7×6 calendar grid with prev/next-month padding days. There are no "other-month days" to mark. Document explicitly; closes the catalog row with rationale.                                                                            |
| `theme.getClass('today')` injection                                          | `date-rendering.ts:41`                    | ❌ **Reject** — k-ui's theme system injects per-theme override classes; chronix's `ChronixTheme` is a JS-prop token bag, not a class injector. Phase 10 architectural decision; not re-litigated here.                                                                                                                                                  |
| `gantt-slot` base class                                                      | `date-rendering.ts:61`                    | ✅ **port** as `cx-gantt-slot`. Attached to every body-side per-slot rect (NEW transparent `<rect>` per axis tick — see Approach below).                                                                                                                                                                                                                |
| `gantt-slot-{dayId}` weekday modifier                                        | `date-rendering.ts:61`                    | ✅ **port** as `cx-gantt-slot-{dayId}`. Same derivation as day-id.                                                                                                                                                                                                                                                                                      |
| `gantt-slot-today` / `-past` / `-future`                                     | `date-rendering.ts:66-77`                 | ✅ **port** as `cx-gantt-slot-{today,past,future}`. Derived per-tick at render time.                                                                                                                                                                                                                                                                    |
| `gantt-slot-disabled`                                                        | `date-rendering.ts:63-65`                 | ⏸️ **parked** — same disabled-range rationale as day class.                                                                                                                                                                                                                                                                                             |
| `gantt-slot-other`                                                           | k-ui doesn't emit it                      | ✅ **match** (don't emit; aligns with k-ui's intentional omission).                                                                                                                                                                                                                                                                                     |
| Body cell DOM hook for the day/slot classes                                  | k-ui body strips render a per-slot `<td>` | ✅ **port (chronix-shaped)** as one transparent `<rect class="cx-gantt-slot ...">` per axis tick, inserted into the body SVG between Phase 26's grid-vline group and the bars group. Pointer-events: none. Empty fill. Layer ordering: today-cell → slot-rects → grid-vlines → today-line → bars → links. See Approach §2.                              |
| Day-cell DOM hook for day classes (header side)                              | k-ui `<th>` element                       | ✅ **port** — append day classes onto the existing `cx-gantt-header-cell` rect's class attribute (inner header band's day cells only — outer month bands keep just `cx-gantt-header-cell`). Day classes attach to BOTH the `<rect>` and the sibling `<text>` so CSS selectors targeting either work.                                                    |
| `dayHeaderFormat` (label formatter)                                          | `TableDateCell.tsx:37`                    | ❌ **Reject** for Phase 29 — chronix's label formatting goes through `AxisRangePlanner` (`Intl.DateTimeFormat` configured per view). Per-cell label override requires a different abstraction (formatter chain on PlannedAxis input) — out of scope. Consumer wanting custom label uses the slot route instead (full replace covers it).                |
| `dayHeaderClassNames` (class callback)                                       | `TableDateCell.tsx:71`                    | ✅ **port** as `headerCellClassNamesCallback?: (arg: HeaderCellArg) => string \| readonly string[] \| undefined`. Fires per header cell (both outer band cells AND inner day cells); arg carries `{ cell, rowIndex, cellIndex, date?, dayMeta? }`. Returned classes append to the cell's `<rect>` class attribute.                                      |
| `dayHeaderContent` (content callback)                                        | `TableDateCell.tsx:69`                    | ⏸️ **parked** — overlaps strongly with the slot route (both replace cell content). Single replace-content API per phase keeps the surface clean; if consumer demand for "callback that returns a string label only" emerges, re-prioritize as a thin wrapper that registers the callback as a slot internally.                                          |
| `dayHeaderDidMount` / `WillUnmount`                                          | `TableDateCell.tsx:72-73`                 | ⏸️ **parked** — chronix has no equivalent lifecycle-hook API today; bar / link surfaces don't have it either. Defer until a coherent lifecycle-hook story for ALL render surfaces lands (likely Phase 31+).                                                                                                                                             |
| Full header-cell render replacement                                          | k-ui has no slot system                   | ✅ **chronix-additive** as new `HEADER_CELL_SLOT_NAME = 'header-cell'` + `HeaderCellSlotArgs` interface in `packages/gantt/src/render/header-cell-slot.ts`. When `slotRegistry.get('header-cell')` returns a template, the adapter replaces the default `<rect>+<text>` pair for that cell with the slot's output. Mirrors Phase 11/28.3 bar/link slot. |
| Slot scope: fires for ALL header cells, both outer bands AND inner day cells | N/A                                       | ✅ **chronix-additive** — args carry `bandIndex` so the consumer can render different content per band level (e.g. plain text for outer month band, navigable link for inner day cell).                                                                                                                                                                 |
| Bold first row / 13px vs 11px text                                           | `GanttView.tsx:588`                       | ✅ **already DONE** — chronix renders the tick row at `tickLabelFontSize` and outer band cells at `headerCellLabelFontSize`. Existing tokens cover the difference; Phase 29 does NOT touch.                                                                                                                                                             |
| Truncation tooltip via child `<title>`                                       | `GanttView.tsx:609`                       | ⏸️ **parked** — chronix doesn't truncate header labels today; adding `<title>` is contingent on truncation landing first. RENDER_LAYER_GAP_SWEEP defers this. Not a Phase 29 scope item.                                                                                                                                                                |

**Phase 29 net surface**: 9 ✅-port items (day base + 5 day modifiers, slot base + 4 slot modifiers — counting `-{dayId}` as one each), 1 ✅-chronix-additive (header-cell slot), 1 ✅-port-callback (`headerCellClassNamesCallback`), 2 ❌-reject (`gantt-day-other` architectural, `theme.getClass` architectural, `dayHeaderFormat` scope), 3 ⏸️-parked (`-disabled` family, `dayHeaderContent` callback, lifecycle hooks).

### Naming alignment table

| k-ui                             | chronix                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------- |
| `gantt-day`                      | `cx-gantt-day`                                                                    |
| `gantt-day-{sun..sat}`           | `cx-gantt-day-{sun..sat}` (same `DAY_IDS` literal)                                |
| `gantt-day-today`                | `cx-gantt-day-today` (NEW; orthogonal to `cx-gantt-today-cell` from Phase 22.2)   |
| `gantt-day-past`                 | `cx-gantt-day-past`                                                               |
| `gantt-day-future`               | `cx-gantt-day-future`                                                             |
| `gantt-slot`                     | `cx-gantt-slot`                                                                   |
| `gantt-slot-{sun..sat}`          | `cx-gantt-slot-{sun..sat}`                                                        |
| `gantt-slot-today/-past/-future` | `cx-gantt-slot-today/-past/-future`                                               |
| `dayHeaderClassNames`            | `headerCellClassNamesCallback` (component prop, chronix-prefixed by feature)      |
| (no slot)                        | `HEADER_CELL_SLOT_NAME = 'header-cell'` + `HeaderCellSlotArgs` (chronix-additive) |

## Approach

### §1 — `cx-gantt-day-*` / `cx-gantt-slot-*` derivation helpers (`packages/gantt/src/render/cell-state-classes.ts`)

New pure module — no axis shape changes:

```ts
import type { AxisTick } from '../layout/types.js';

/** Sun-anchored day-id literal, matching k-ui's `DAY_IDS` for consumer CSS portability. */
export const DAY_IDS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
export type DayId = (typeof DAY_IDS)[number];

export interface CellStateMeta {
  readonly dayId: DayId;
  readonly isToday: boolean;
  readonly isPast: boolean;
  readonly isFuture: boolean;
}

/** Compute meta from a Date + a today reference. `today` is start-of-day. */
export function computeCellStateMeta(date: Date, today: Date): CellStateMeta;

/** day classes for a tick whose slotDurationMs >= MS_PER_DAY OR for header day cells. */
export function getDayClassNames(meta: CellStateMeta): readonly string[];

/** slot classes for any body tick. Subset (no -other; k-ui parity). */
export function getSlotClassNames(meta: CellStateMeta): readonly string[];
```

No PlannedAxis shape extension — meta computed at render time from
`tick.time` + the same `chronixToday` value Phase 21 / 22.2 already
derive. This is the load-bearing simplification: zero fixture-test
churn.

### §2 — Body slot rect emission (`adapters/vue3/src/chronix-gantt.ts`)

New per-tick transparent rect inserted into body SVG between the
Phase 22.2 today-cell-bg layer and the Phase 26 grid-vline layer:

```ts
const slotChildren: VNode[] = [];
const todayStart = startOfDay(props.now ?? new Date());
for (const tick of a.ticks) {
  const meta = computeCellStateMeta(tick.time, todayStart);
  slotChildren.push(
    h('rect', {
      key: `slot-${tick.x}`,
      class: ['cx-gantt-slot', ...getSlotClassNames(meta)].join(' '),
      x: tick.x,
      y: 0,
      width: a.slotWidth,
      height: bodyHeight,
      fill: 'transparent',
      'pointer-events': 'none',
    }),
  );
}
```

Layer order in body SVG (top → bottom in markup = back → front in paint):
today-cell-bg → **slot rects (NEW)** → grid vlines → grid hlines →
today-line → bars → links. The slot rects sit BEHIND the grid lines
so the grid still paints visibly over them, and behind bars so bars
paint over the (transparent) slot rect without obstruction.

For day/month/season/halfYear/year views — same emission. For week
view (24 hourly slots per day), each of the 168 slot rects gets its
parent-day's `dayId` (via `tick.time.getDay()`) — week view's
"day-coloring CSS" patterns (`.cx-gantt-slot-sat { background: #ffefef }`)
work without per-slot client logic.

### §3 — Header cell day classes

For each `axis.headerRows[r].cells[i]` AND for each tick label in the
tick row, decide whether the cell represents a single day (eligible
for day classes):

- A header band cell is **day-eligible** when its `width === axis.slotWidth`
  AND `axis.slotDurationMs >= MS_PER_DAY`. In the multi-view registry:
  - week view's `dayCells` (7 cells × 24-hour width) → NOT day-eligible
    (each cell spans 24 slots). **But** week view's per-day header is
    semantically "one day per cell" — so apply day classes anyway,
    sourced from the cell's start date.
  - month/season/halfYear/year — inner row (currently the only row,
    `axis.headerRows[0]`) carries month-banded cells multi-day wide
    → NOT day-eligible at the cell-rect level. Day classes attach to
    the TICK row's per-day labels instead.

This drives a simple rule: day classes attach to whichever row
renders one-cell-per-day. In chronix's current 6 views:

| View     | One-cell-per-day at                         | Day classes go on                                                      |
| -------- | ------------------------------------------- | ---------------------------------------------------------------------- |
| day      | `axis.headerRows[0]` (1 cell = whole day)   | The single outer header cell + (all 24 tick labels: `cx-gantt-slot-*`) |
| week     | `axis.headerRows[0]` (7 cells × 24-hr each) | Each of 7 outer header day cells                                       |
| month    | Tick row (1 tick = 1 day)                   | Each of 30+ tick labels                                                |
| season   | Tick row                                    | Each of 90+ tick labels                                                |
| halfYear | Tick row                                    | Each of 180+ tick labels                                               |
| year     | Tick row                                    | Each of 360+ tick labels                                               |

Implementation: hoist a `dayClassEligibility` derivation pass that
maps each header cell + each tick to `{eligibleForDayClass: bool,
date: Date}`. Render code consults it; non-eligible cells/ticks render
unchanged.

### §4 — Header cell class callback

New component prop `headerCellClassNamesCallback?: HeaderCellClassNamesFunc`:

```ts
export interface HeaderCellArg {
  readonly bandIndex: number; // 0 = innermost tick row, 1+ = outer bands
  readonly cellIndex: number;
  readonly date: Date | undefined; // undefined for multi-day band cells
  readonly label: string;
  readonly dayMeta: CellStateMeta | undefined;
}

export type HeaderCellClassNamesFunc = (
  arg: HeaderCellArg,
) => string | readonly string[] | undefined;
```

Fires for EVERY rendered header cell (outer band cells + tick-row
labels). Returned classes append to the cell `<rect>`'s class
attribute (NOT the `<text>` label sibling — keeps the surface
restricted to the cell's primary element; for label styling, the
slot route covers it).

### §5 — Header cell slot (chronix-additive, parallel to BAR_SLOT / LINK_SLOT)

New module `packages/gantt/src/render/header-cell-slot.ts`:

```ts
import type { AxisHeaderCell, AxisTick } from '../layout/types.js';
import type { ChronixTheme } from '../api/chronix-theme.js';
import type { CellStateMeta } from './cell-state-classes.js';

export interface HeaderCellSlotArgs {
  readonly bandIndex: number;
  readonly cellIndex: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly label: string;
  readonly date: Date | undefined;
  readonly dayMeta: CellStateMeta | undefined;
  readonly theme: ChronixTheme;
  /** Underlying band cell (undefined when rendering a tick-row label). */
  readonly cell?: AxisHeaderCell;
  /** Underlying tick (undefined when rendering an outer band cell). */
  readonly tick?: AxisTick;
}

export const HEADER_CELL_SLOT_NAME = 'header-cell';
```

When `slotRegistry.get('header-cell')` returns a template, adapter
invokes it per cell with full args and uses the template's return
as the entire cell render — the default `<rect>+<text>` pair is
suppressed for that cell. The class callback (§4) still runs and
its returned classes are passed into the slot args as
`extraClasses?: readonly string[]` so slot consumers can compose
them in their own output.

### Sample consumer

```vue
<template>
  <ChronixGantt
    :bars="bars"
    :rows="rows"
    :axis-input="axisInput"
    :header-cell-class-names-callback="
      (arg) => (arg.dayMeta?.dayId === 'sat' ? ['weekend-header'] : undefined)
    "
  >
    <template #header-cell="{ x, y, width, height, label, dayMeta }">
      <g>
        <rect :x="x" :y="y" :width="width" :height="height" fill="#fafafa" stroke="#ddd" />
        <text
          :x="x + width / 2"
          :y="y + height / 2 + 4"
          text-anchor="middle"
          :font-weight="dayMeta?.isToday ? 'bold' : 'normal'"
        >
          {{ label }}
        </text>
      </g>
    </template>
  </ChronixGantt>
</template>

<style>
.cx-gantt-day-sat,
.cx-gantt-slot-sat {
  background: rgba(255, 200, 200, 0.1);
}
.cx-gantt-day-today {
  background: rgba(255, 220, 40, 0.2);
}
.weekend-header text {
  fill: #c00;
}
</style>
```

### Alternatives considered

- **Add `tick.dayId` / `tick.dayMeta` to `PlannedAxis.ticks`** — Reject.
  Computed at render time from `tick.time` cheaply. Adding fields ripples
  through ~7 fixture test files (see Phase 27 churn on `PlacedBar.isStart`)
  and the freeze data type. The current "pure data" axis-types contract
  stays clean.
- **Unify day + slot into one `cx-gantt-cell-*` class family** — Reject.
  Loses 1:1 portability with k-ui consumer CSS. The split is small
  (essentially "does this cell carry the `-other` semantic?") and the
  parity gain is concrete.
- **Add `cx-gantt-day-disabled` + `disabledDateRange` prop in same phase** —
  Reject. Disabled-range plumbing needs a layout-pass-level concept
  (PlannedAxis output marks slots as `disabled`); large scope, separate
  phase. Park as the design notes.
- **Theme tokens for day-state colors (`dayTodayBg`, `daySatBg`, ...)** —
  Reject for v0. Per user constraint, classes-only emission keeps VRT at
  0 PNG churn. Consumers wanting defaults can CSS-style by class. If
  consumer demand for "chronix-default weekend tinting" emerges,
  re-prioritize as Phase 29.1.
- **Bundle Phase 29 with `gantt-day-other` calendar-grid month view** —
  Reject (architectural divergence). chronix's month view is a continuous
  timeline; reshaping it into a 7×6 calendar grid is a major UX change,
  not a class-emission tweak. Park indefinitely.

## Parity assertion plan — MANDATORY

The day/slot class taxonomy IS parity-testable: both demos render
the same logical cells at the same x-coordinates, and the class
attribute can be read in the same way as Phase 22.2's today-cell
check. The header callback + slot are chronix-additive (no parity
equiv) and get pinned by adapter unit tests.

| Assertion id (in parity.spec.ts)                      | Drives k-ui demo via | Drives chronix demo via | Compares                                                                                                                                                                                                                                                            | Tolerance        |
| ----------------------------------------------------- | -------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| `phase29-day-today class presence parity (week view)` | `loadBothDemos`      | `loadBothDemos`         | The set of x-coordinates at which `.cx-gantt-day-today` / `.gantt-day-today` is emitted in the header. Both sides should mark exactly one day cell (today's), at the same x-coordinate (within `slotWidth/2` — week view tolerates the day-cell-vs-tick alignment). | `x: slotWidth/2` |
| `phase29-day-id class set parity (week view)`         | `loadBothDemos`      | `loadBothDemos`         | The set of `{x, dayId}` pairs from header day cells. Both sides should emit `mon..sun` (or filtered) classes at the same x-coords.                                                                                                                                  | `x: 1px`         |

The 2 parity assertions cover the day-class application path
end-to-end. Slot classes get cross-demo parity DEFERRED to
Phase 29.1 if needed — chronix slot rects are NEW elements, the
parity reference has no exact DOM counterpart (k-ui slots are
`<td>` inside `<tr>`, chronix's are `<rect>` inside the body SVG),
so equivalence by xy + class is harder to reduce to one assertion.
Slot class application is pinned by adapter unit tests.

### Drift-detection scope

- **Covered**: day-class application chain — `tick.time → computeCellStateMeta → getDayClassNames → header cell render`. Both isToday derivation AND day-id assignment are exercised across both demos.
- **NOT covered (cross-demo)**:
  - `cx-gantt-slot-*` classes — chronix-shaped DOM (new transparent `<rect>` per slot) without 1:1 k-ui equivalent. Adapter unit tests only.
  - `headerCellClassNamesCallback` — chronix-additive (no parity surface; k-ui's `dayHeaderClassNames` isn't wired in the parity-reference demo).
  - `HEADER_CELL_SLOT_NAME` slot — chronix-additive (no parity surface).
- **NOT covered (adapter)**: VRT pixel parity. Class additions don't drive any default visible pixel change (no theme inline color); VRT baselines stay at 0 PNG churn.

## Test coverage

- **core** — `packages/gantt/src/render/cell-state-classes.test.ts` (new, ~10 tests):
  - `DAY_IDS` exports Sun-anchored 7-element literal matching k-ui's order
  - `computeCellStateMeta` returns correct dayId for `2026-05-13` (Wednesday → 'wed')
  - `computeCellStateMeta` sets `isToday=true` only when date equals today within the same calendar day (timezone-local)
  - `computeCellStateMeta` sets `isPast/isFuture` mutually exclusive based on date vs today
  - `getDayClassNames` returns `['cx-gantt-day', 'cx-gantt-day-{dayId}']` minimum
  - `getDayClassNames` appends `-today` / `-past` / `-future` when applicable
  - `getDayClassNames` does NOT emit `-other` (architectural rejection)
  - `getSlotClassNames` returns `['cx-gantt-slot', 'cx-gantt-slot-{dayId}']` minimum
  - `getSlotClassNames` appends state modifiers same as day
  - `getSlotClassNames` does NOT carry `-other` (matches k-ui omission)

- **core** — `packages/gantt/src/render/header-cell-slot.test.ts` (new, ~3 tests):
  - `HEADER_CELL_SLOT_NAME` exported as `'header-cell'` constant
  - `HeaderCellSlotArgs` type-checks required fields (bandIndex, cellIndex, x, y, width, height, label, theme; optional date, dayMeta, cell, tick, extraClasses)
  - `slotRegistry.register('header-cell', ...)` round-trips

- **adapter** — `adapters/vue3/src/chronix-gantt-slot-classes.test.ts` (new, ~6 tests):
  - Body emits one `<rect class="cx-gantt-slot ...">` per axis tick
  - Day view: each slot rect carries the day's `cx-gantt-slot-{dayId}` for that hour
  - Week view: Saturday-hour slots carry `cx-gantt-slot-sat`
  - Today's slot carries `cx-gantt-slot-today`; past slots carry `-past`; future `-future`
  - Slot rects are positioned at `(tick.x, 0)` with `width=axis.slotWidth, height=bodyHeight`
  - Slot rects have `pointer-events: none` + `fill: transparent`

- **adapter** — `adapters/vue3/src/chronix-gantt-day-classes.test.ts` (new, ~5 tests):
  - Week view: each header day cell carries `cx-gantt-day` + `cx-gantt-day-{dayId}`
  - Week view: today's day-header-cell carries `cx-gantt-day-today`
  - Month view: tick-row labels carry `cx-gantt-day` + `cx-gantt-day-{dayId}` + state modifiers
  - Day view: the single outer header cell carries `cx-gantt-day-{dayId}` for the anchor day
  - `cx-gantt-day-other` NEVER emitted (regression guard for the architectural rejection)

- **adapter** — `adapters/vue3/src/chronix-gantt-header-cell-callback.test.ts` (new, ~5 tests):
  - No callback set → no extra classes on header cells
  - Callback returning `['weekend']` adds class to matching cells
  - Callback returning string wraps to single-entry array
  - Callback returning undefined leaves cell with only default + day classes
  - Callback receives `HeaderCellArg` with correct `bandIndex` / `cellIndex` / `date` / `dayMeta`

- **adapter** — `adapters/vue3/src/chronix-gantt-header-cell-slot.test.ts` (new, ~4 tests):
  - No slot registered → emits default `<rect>+<text>` pair per header cell
  - Registered slot template invokes per cell with full `HeaderCellSlotArgs`
  - Slot template's returned VNode REPLACES the default `<rect>+<text>` pair
  - Slot fires for both outer band cells (bandIndex >= 1) AND tick-row labels (bandIndex === 0)

- **parity** — `tooling/golden-runner/tests/parity.spec.ts` (+2 assertions):
  Per the table above — day-today class presence parity + day-id class set parity (both week view).

Expected counts after Phase 29:

- vitest 614 → ~647 (+33: 10 + 3 core + 6 + 5 + 5 + 4 adapter).
- parity-spec 51 → 53 (+2 phase29-day-\* assertions).
- ChronixTheme tokens 50 unchanged (no new tokens — class hooks only).
- cross-demo verify scenarios 27 unchanged (no demo wiring changes for default render).

## VRT impact

- **chronix-visual baselines** (5): zero pixel change. New body slot rects are transparent + pointer-events:none; new classes have no inline color → 0 PNG churn (consistent with Phase 27 + 28.1 + 28.3 pattern). No re-baseline.
- **cross-demo VRT baselines** (27): zero pixel change. Class additions don't drive any visible default; both sides remain pixel-identical.
- **NO new VRT scenarios** — the 2 parity assertions read class attributes from DOM, not pixels.

Predicted re-baseline count: 0 PNGs (fourth consecutive 0-VRT phase after 27 / 28.1 / 28.3).

## Execution plan — 4 commits + wrap-up

### Commit 1 (design doc, this commit) — REQUIRES user review of 3 load-bearing decisions

Lands only `audit/PHASE_29_PER_DAY_SLOT_CSS_CLASSES_DESIGN.md`.
Awaits user confirmation of the 3 decisions in "Open questions"
before implementation.

### Commit 2: Core — `cell-state-classes` module + `header-cell-slot` module + ~13 core tests

- `packages/gantt/src/render/cell-state-classes.ts` (new): `DAY_IDS`, `DayId`, `CellStateMeta`, `computeCellStateMeta`, `getDayClassNames`, `getSlotClassNames`.
- `packages/gantt/src/render/cell-state-classes.test.ts` (new): +10 tests.
- `packages/gantt/src/render/header-cell-slot.ts` (new): `HEADER_CELL_SLOT_NAME`, `HeaderCellSlotArgs`.
- `packages/gantt/src/render/header-cell-slot.test.ts` (new): +3 tests.
- `packages/gantt/src/render/index.ts`: re-export both modules.
- `packages/gantt/src/index.ts`: top-level re-exports.
- Rebuild `@chronixjs/gantt` dist.
- ci-check green (vitest 614 → ~627).

### Commit 3: Adapter — body slot rects + header day classes + class callback + header slot + ~20 adapter tests

- `adapters/vue3/src/chronix-gantt.ts`:
  - New `headerCellClassNamesCallback?: HeaderCellClassNamesFunc` prop.
  - Hoist `todayStart` + `dayClassEligibility` derivation pass per render.
  - Body slot rect emission loop (between today-cell-bg and grid-vline layers).
  - Header tick + header-band-cell render: append day classes when eligible + invoke class callback + check `slotRegistry.get('header-cell')` for full replacement.
- `adapters/vue3/src/chronix-gantt-slot-classes.test.ts` (new, ~6 tests).
- `adapters/vue3/src/chronix-gantt-day-classes.test.ts` (new, ~5 tests).
- `adapters/vue3/src/chronix-gantt-header-cell-callback.test.ts` (new, ~5 tests).
- `adapters/vue3/src/chronix-gantt-header-cell-slot.test.ts` (new, ~4 tests).
- Rebuild `@chronixjs/gantt-vue3` dist.
- ci-check green (vitest 627 → ~647).

### Commit 4: Parity assertions + VRT verify

- `tooling/golden-runner/src/reference-dom-map.ts`: 1 new selector group (`DAY_TODAY_CELLS` / `DAY_ID_CELLS` — k-ui side maps to `.gantt-day-today`, chronix side to `.cx-gantt-day-today`).
- `tooling/golden-runner/tests/parity.spec.ts`: +2 day-class parity assertions.
- Run cross-demo verify + chronix-visual verify; confirm 0 baseline diffs.
- ci-check green; cross-demo-verify gate green (27/27).

### Commit 5 (wrap-up — REQUIRES /phase-close invocation)

- `audit/journal/2026-05-13.md`: "Phase 29 — per-day/per-slot CSS classes + header cell slot/callback (DONE, YYYY-MM-DD)" section.
- `memory/project_gantt_rewrite_plan.md`: bump vitest 614 → ~647; parity-spec 51 → 53; theme tokens 50 unchanged; add Phase 29 DONE marker; mark Cluster D closed.
- `audit/PHASE_29_PER_DAY_SLOT_CSS_CLASSES_DESIGN.md` Status → DONE.
- Update `audit/PARITY_RECHECK.md` + `audit/RENDER_LAYER_GAP_SWEEP_2026-05-16.md` Cluster D rows → DONE Phase 29.
- Update `audit/KUI_SURFACE_BASELINE.json` catalog rows for `.gantt-day-today` / `.gantt-day-past` / `.gantt-day-future` / `.gantt-day-other` / `dayHeaderClassNames` (status → covered).

## Estimated scope

| Commit                                         | Hours | LOC est.                                                  |
| ---------------------------------------------- | ----- | --------------------------------------------------------- |
| 1 (design doc)                                 | 1     | this file (~600 LOC)                                      |
| 2 (core: 2 new modules + 13 tests)             | 1.5   | ~140 LOC src + ~180 LOC tests                             |
| 3 (adapter: render rewrite + 4 new test files) | 3     | ~250 LOC src + ~400 LOC tests                             |
| 4 (parity + VRT verify)                        | 1     | ~80 LOC parity tests + ~20 LOC selector map + 0 baselines |
| 5 (wrap-up)                                    | 0.5   | journal + memory + 3 audit doc status flips               |
| **Total**                                      | **7** | ~1070 LOC + 0 baseline PNGs                               |

Within single-session discipline (per `feedback_quality_acceleration.md`
constraint #3). Matches the 5-7h sweep estimate.

## 4-dimension audit check

| Dimension                     | Coverage in Phase 29                                                                                                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Options surface**           | 1 new component-prop callback (`headerCellClassNamesCallback`). 1 new slot constant (`HEADER_CELL_SLOT_NAME`). New core types (`DayId`, `CellStateMeta`, `HeaderCellArg`, `HeaderCellClassNamesFunc`, `HeaderCellSlotArgs`). No new theme tokens. No new render-callback props for day/slot themselves (CSS hooks only — by design). |
| **Render code**               | Body SVG gains one transparent `<rect class="cx-gantt-slot ...">` per axis tick (N new SVG elements per render where N = `axis.ticks.length`). Header cell `<rect>` class attribute gains day-class append. Header render gains slot-template check. Header text label keeps existing class set (no change).                         |
| **Interaction code**          | Zero impact. New slot rects have `pointer-events: none`. Hit-test reads `data-bar-id` only. Custom classes from `headerCellClassNamesCallback` are NOT consumed by any interaction path.                                                                                                                                             |
| **Layout-algorithm pipeline** | Zero impact. **PlannedAxis shape unchanged** (load-bearing simplification — meta computed render-time from existing `tick.time`). No fixture-test churn. No LinkRouter / BarPlacementPass / RowSwimlaneLayout touched.                                                                                                               |

## Open questions for the user — 3 load-bearing decisions

**1. Scope: A (full bundle — body slot classes + header day classes + header class callback + header slot) / B (split: 29a body slot classes only, 29b header callback+slot follow-up) / C (body classes only, header slot+callback parked indefinitely)** — recommended **A**.

- **A (recommended)**: all 4 surfaces in one phase. ~7h. All 4 are
  independent (no shared mid-phase findings risk). The header surfaces
  alone are too thin to justify a separate phase (~3h would be ~2h
  overhead for design + audit + wrap-up + ~1h work). Bundling
  amortizes phase-overhead well.
- **B**: 29a body slot classes (~3-4h) + 29b header surfaces (~3-4h).
  Cost: 2x phase-overhead (2× design doc, 2× /phase-close, 2× journal
  - memory + audit flips). Cluster D closure deferred.
- **C**: body classes only. -3h. Cost: header customization stays a
  silent gap; consumers wanting drilldown / icon-bearing header have
  no path. Cluster D stays open indefinitely.

**Recommendation**: **A**. Same calculus as Phase 28.3 — 4 additive
surfaces fit one single-session phase cleanly.

**2. Day-class taxonomy: A (mirror k-ui split exactly — `cx-gantt-day-*` family for day cells + `cx-gantt-slot-*` family for body slots, REJECT `-other`, PARK `-disabled`) / B (unify into one `cx-gantt-cell-*` family) / C (slot family only, drop the day variant)** — recommended **A**.

- **A (recommended)**: emit both `cx-gantt-day-*` and `cx-gantt-slot-*`
  families per k-ui's exact split. Consumer CSS porting from k-ui
  maps 1:1 (`.gantt-day-sat → .cx-gantt-day-sat`). `-other` rejected
  as architectural divergence (chronix month = timeline-not-grid).
  `-disabled` parked until a `disabledDateRange` prop lands.
- **B**: one unified `cx-gantt-cell-*` family. Simpler chronix surface
  but loses 1:1 k-ui CSS portability. Consumer CSS port-ing requires
  selector rewrites. Saves ~50 LOC; costs parity hook.
- **C**: only `cx-gantt-slot-*` (drop day family). Saves ~30 LOC;
  costs the day-cell hook on header bands (no way to style "today's
  day-header-cell" via class alone).

**Recommendation**: **A**. Day/slot split is the load-bearing parity-
preserving choice; the chronix-additive `cx-` prefix is the only
divergence consumers have to learn.

**3. Header customization API: A (BOTH `headerCellClassNamesCallback` callback AND `HEADER_CELL_SLOT_NAME` slot — class-callback for common case, slot for full replace) / B (slot only) / C (callback only)** — recommended **A**.

- **A (recommended)**: matches Phase 28.3's bar pattern exactly
  (`barClassNamesCallback` + `BAR_SLOT_NAME`). Class-callback covers
  the 80% case (CSS hook for state-driven styling); slot covers the
  20% case (full template replacement for navigable links, icons,
  custom layouts). Single phase, both APIs ergonomic, ~2 surfaces
  worth of test coverage.
- **B**: slot only. Forces consumers wanting "just add a class" to
  re-implement the entire cell render in their template. Over-scoped
  for the common case.
- **C**: callback only. Loses the full-replace path; consumers
  needing navlinks / icons / complex layouts have to drop down to
  fork the adapter.

**Recommendation**: **A**. Same precedent as bar (Phase 28.3) and
link (Phase 28.3) surfaces; consistency across customization APIs
is itself a feature.

Reply **按推荐继续** to accept all three (A / A / A), or call out
any 1-3 to override.
