# Phase 24 — Imperative handle API + navigation

**Status**: **Approved (pending user reply)** — design only; no code yet.

## Problem

The imperative handle (`GanttHandle`) returned by mounting `<ChronixGantt>` is
the surface a consumer programs against when they need to drive the chart
from outside — "switch to month view", "go forward one week", "scroll the
chart so 2026-06-01 is visible", "look up this bar by id". Today the
interface lists `changeView(view: string): void` and `gotoDate(date): void`
but they are **typed-only — no adapter wires an implementation**. The other
30 methods on the parity-reference surface (`prev` / `next` / `today` /
`incrementDate` / `getDate` / `zoomTo` / `scrollToTime` / `addEvent` /
`removeAllEvents` / `getEventById` / `getEvents` …) have no chronix
counterpart at all.

Phase 22 landed the toolbar widget set on a **controlled-prop** pathway:
clicking `next` emits `update:axisInput` with a new `anchorDate`; the
consumer's `v-model:axis-input` round-trips and the chart re-renders. That
proves the data flow — but a consumer who wants to drive the same change
from a non-toolbar context (a keyboard shortcut, a route handler, a parent
component's button) has no API. They'd have to reimplement `nextAnchor` /
`prevAnchor` / `todayAnchor` math themselves.

Phase 24 closes that gap: `handle.next()` exists, and it ends up emitting
the same `update:axisInput` event the toolbar emits — single internal
pathway, both surfaces equivalent. After this phase a consumer migrating
from k-ui's `ganttApi.next()` → chronix's `handle.next()` is a literal
identifier rename for the methods this phase covers.

## Reference (k-ui) behavior surface — full catalog

K-ui's `packages/gantt/src/api/GanttSchedulerImpl.ts` (525 LOC) exposes 33
public methods grouped by area. The full surface was enumerated 2026-05-16
in `audit/SILENT_GAP_SWEEP_2026-05-16.md` Section D. The table below
reproduces every method with its Phase 24 disposition. Catalog identifiers
that are **already** in the disposition register (`PARITY_RECHECK.md`) keep
their existing classification; new dispositions added by this phase are
marked **(Phase 24)**.

| k-ui method                                                                                             | k-ui source                            | chronix v0 disposition        | Reason                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `changeView(viewType, dateOrRange?)`                                                                    | `GanttSchedulerImpl.ts:110-143`        | ✅ **port** (Phase 24)        | Implement the typed-but-unimplemented `GanttHandle.changeView`. Chronix-shape: `changeView(viewId: ViewId)` — drop the 2nd-arg overload; `zoomTo` covers (view, date) combo separately.                                                                                             |
| `prev()`                                                                                                | `GanttSchedulerImpl.ts:200-203`        | ✅ **port** (Phase 24)        | Reuse `prevAnchor` (Phase 22 nav-utils).                                                                                                                                                                                                                                            |
| `next()`                                                                                                | `GanttSchedulerImpl.ts:205-208`        | ✅ **port** (Phase 24)        | Reuse `nextAnchor`.                                                                                                                                                                                                                                                                 |
| `today()`                                                                                               | `GanttSchedulerImpl.ts:229-237`        | ✅ **port** (Phase 24)        | Reuse `todayAnchor`.                                                                                                                                                                                                                                                                |
| `gotoDate(date)`                                                                                        | `GanttSchedulerImpl.ts:239-247`        | ✅ **port** (Phase 24)        | Implement typed-but-unimplemented `GanttHandle.gotoDate`. Chronix-shape: `gotoDate(date: Date)` (strict `Date`; no `DateInput` string coercion — consumers already work with `Date` per `AxisRangePlanInput.anchorDate`).                                                           |
| `incrementDate(delta)`                                                                                  | `GanttSchedulerImpl.ts:249-261`        | ✅ **port** (Phase 24)        | New method, **not previously cataloged** (silent gap per SILENT_GAP_SWEEP D). Chronix-shape: `incrementDate(delta: IncrementDelta)` where `IncrementDelta = { days?: number; weeks?: number; months?: number; years?: number }` — chronix-native shape, not k-ui's `DurationInput`. |
| `getDate(): Date`                                                                                       | `GanttSchedulerImpl.ts:263-266`        | ✅ **port** (Phase 24)        | New method (silent gap). Returns current `axisInput.anchorDate`.                                                                                                                                                                                                                    |
| `zoomTo(date, viewType?)`                                                                               | `GanttSchedulerImpl.ts:148-168`        | ✅ **port** (Phase 24)        | New method (silent gap). Chronix-shape: `zoomTo(date: Date, viewId?: ViewId)`; default `viewId` is current `axisInput.viewId` (k-ui defaults to `'day'`; chronix preserves current — the more useful default when consumer just wants to recenter at a date).                       |
| `scrollToTime(timeInput)`                                                                               | `GanttSchedulerImpl.ts:518-524`        | ✅ **port** (Phase 24)        | Chronix-shape: `scrollToDate(date: Date)` — absolute moment, not k-ui's duration-from-start-of-day (chronix axes are multi-day; duration is the wrong unit). Writes `wrapperRef.scrollLeft` directly (DOM mutation, no emit).                                                       |
| `getEventById(id)`                                                                                      | `GanttSchedulerImpl.ts:415-439`        | ✅ **port** (Phase 24)        | Chronix-name: `getBarById(id: string)` → `BarSpec \| undefined`. Wraps `getBarTable().getById(id)`. Backfills the ⚠ silent gap noted in SILENT_GAP_SWEEP D row 14.                                                                                                                  |
| `getEvents()`                                                                                           | `GanttSchedulerImpl.ts:441-445`        | ✅ **port** (Phase 24)        | Chronix-name: `getBars()` → `readonly BarSpec[]`. Convenience alias for `getBarTable().bars`. Already partially covered by `getBarTable()`; this method gives consumers a more familiar shape without going through the table-handle indirection.                                   |
| `addEvent(input, sourceInput?)`                                                                         | `GanttSchedulerImpl.ts:344-397`        | ⏸️ **deferred** to Phase 26+  | Write CRUD needs transaction-overlay commit semantics + new emit events (`bar-add`) + id-collision policy + `rowId` validation. Out of scope for Phase 24 to keep it single-session. Re-prioritize when a consumer needs programmatic bar mutation.                                 |
| `removeAllEvents()`                                                                                     | `GanttSchedulerImpl.ts:447-449`        | ⏸️ **deferred** to Phase 26+  | Bundled with `addEvent` (same transaction concerns).                                                                                                                                                                                                                                |
| `prevYear()` / `nextYear()`                                                                             | `GanttSchedulerImpl.ts:210-227`        | ⏸️ **defer-indefinite**       | Demo doesn't wire year-nav (per Phase 22 disposition). Re-prioritize on consumer ask for decade-scale navigation.                                                                                                                                                                   |
| `select(d, end?)` / `unselect()`                                                                        | `GanttSchedulerImpl.ts:299-339`        | ⏸️ **defer-indefinite**       | Already in PARITY_RECHECK register (programmatic selection deferred — Phase 12 selection model covers the demo).                                                                                                                                                                    |
| `updateSize()`                                                                                          | `GanttSchedulerImpl.ts:50`             | ⏸️ **defer-indefinite**       | Chronix uses Vue reactivity for re-renders; no manual `updateSize` needed. Re-prioritize if a consumer reports a layout-stale bug.                                                                                                                                                  |
| `setOption(name, val)` / `getOption`                                                                    | `GanttSchedulerImpl.ts:60-90` (approx) | ⏸️ **defer-indefinite**       | Already in register (cluster row "Imperative formatter / dynamic-option mutation"). Vue props cover most cases.                                                                                                                                                                     |
| `formatDate` / `formatRange` / `formatIso`                                                              | `GanttSchedulerImpl.ts:271-296`        | ⏸️ **defer-indefinite**       | Already in register. Consumer can use `Intl.DateTimeFormat` directly.                                                                                                                                                                                                               |
| `getAvailableLocaleCodes()`                                                                             | `GanttSchedulerImpl.ts` (approx)       | ⏸️ **defer-indefinite**       | Already in register (locale cluster).                                                                                                                                                                                                                                               |
| `on(name, h)` / `off(name, h)` / `trigger`                                                              | `GanttSchedulerImpl.ts:80-105`         | ✅ **already done** (Phase 4) | `handle.subscribe(event, listener)` covers `on`+`off` in one returns-unsubscribe shape. `trigger` is internal-only on the k-ui side. Backfilled in `PARITY_RECHECK.md` register.                                                                                                    |
| `getEventSources` / `addEventSource` / `removeAllEventSources` / `refetchEvents` / `getEventSourceById` | `GanttSchedulerImpl.ts:454-513`        | ⏸️ **defer-indefinite**       | Event-source CRUD cluster (already in register). Massive scope; not in demo.                                                                                                                                                                                                        |
| `view` (property)                                                                                       | `GanttSchedulerImpl.ts` (getter)       | ✅ **already done**           | Chronix has reactive `axisInput` prop. `getDate()` (new) + existing `getBarTable()` cover the "what state am I in" surface.                                                                                                                                                         |

**Phase 24 net surface**: 11 methods land (9 nav + view + 2 read-only event
lookup). 2 deferred to Phase 26+ (`addBar` / `removeAllBars`). 12 carry
forward existing defer-indefinite dispositions. 3 are pre-existing chronix
coverage (subscribe / axisInput-as-view / getBarTable-as-getEvents).

## Approach

### Handle interface — `packages/gantt/src/api/gantt-handle.ts`

```ts
export interface GanttHandle {
  // Existing (Phase 4+):
  getBarTable(): BarTable;
  getRowDataSource(): RowDataSource;
  getLinkTable(): LinkTable;
  subscribe<K extends keyof GanttEventMap>(
    event: K,
    listener: (payload: GanttEventMap[K]) => void,
  ): () => void;

  // Phase 24 — view / nav:
  changeView(viewId: ViewId): void;
  prev(): void;
  next(): void;
  today(): void;
  gotoDate(date: Date): void;
  incrementDate(delta: IncrementDelta): void;
  getDate(): Date;
  zoomTo(date: Date, viewId?: ViewId): void;

  // Phase 24 — scroll:
  scrollToDate(date: Date): void;

  // Phase 24 — read-only bar lookup:
  getBarById(id: string): BarSpec | undefined;
  getBars(): readonly BarSpec[];
}

export interface IncrementDelta {
  readonly days?: number;
  readonly weeks?: number;
  readonly months?: number;
  readonly years?: number;
}
```

### Internal pathway

All view / nav methods funnel through a single internal helper that
computes the next `AxisRangePlanInput` and emits `update:axisInput`. Same
channel as Phase 22 toolbar — both surfaces drive the chart via one event.

```ts
// In setup(props, { emit, expose }):
function emitNewAxisInput(next: Partial<AxisRangePlanInput>): void {
  emit('update:axisInput', { ...props.axisInput, ...next });
}

const handle: GanttHandle = {
  // … existing getBarTable / subscribe / etc …
  changeView(viewId) {
    emitNewAxisInput({ viewId });
  },
  prev() {
    emitNewAxisInput({
      anchorDate: prevAnchor(props.axisInput.viewId, props.axisInput.anchorDate),
    });
  },
  next() {
    emitNewAxisInput({
      anchorDate: nextAnchor(props.axisInput.viewId, props.axisInput.anchorDate),
    });
  },
  today() {
    emitNewAxisInput({ anchorDate: todayAnchor() });
  },
  gotoDate(date) {
    emitNewAxisInput({ anchorDate: date });
  },
  incrementDate(delta) {
    emitNewAxisInput({ anchorDate: applyIncrement(props.axisInput.anchorDate, delta) });
  },
  getDate() {
    return props.axisInput.anchorDate;
  },
  zoomTo(date, viewId) {
    emitNewAxisInput({ anchorDate: date, viewId: viewId ?? props.axisInput.viewId });
  },
  scrollToDate(date) {
    scrollToDateImpl(date);
  }, // DOM-side
  getBarById(id) {
    return barTableImpl.getById(id);
  },
  getBars() {
    return barTableImpl.bars;
  },
};

expose(handle);
```

`applyIncrement(anchor, delta)` lives next to `nextAnchor` in
`packages/gantt/src/api/nav-utils.ts` (Phase 22 added that file; this
phase extends it). It applies `days` / `weeks` / `months` / `years` in
that order with `Date.setDate` / `Date.setMonth` / `Date.setFullYear`
semantics — same calendar-month-rollover behavior as `nextAnchor`'s
month/season/halfYear branches.

`scrollToDateImpl(date)` reads the current `axis` (already computed by
`useGanttLayout`) to map `date` → x:

```ts
function scrollToDateImpl(date: Date): void {
  const a = axis.value;
  const x = a.pxPerMs * (date.getTime() - a.windowStart);
  const w = wrapperRef.value;
  if (w) w.scrollLeft = x; // clamped by browser to [0, scrollWidth - clientWidth]
}
```

Pure DOM side-effect; matches Phase 23's planned dual-scrollport ergonomics
(`scrollLeft` will continue to mean the same thing on the chart scrollport
even after Phase 23 splits sidebar+chart).

### Handle stability

The handle object is created once per `setup()` call (component instance)
and `expose()`d. Method closures capture `props` / `emit` / `axis` /
`wrapperRef` reactively — the handle reference stays referentially stable
across renders. Consumers can store `ref.value` once at `onMounted` and
keep it. Matches Vue's expectation for `defineExpose` / `setup({ expose })`.

### Sample consumer

```vue
<template>
  <ChronixGantt ref="ganttRef" v-model:axis-input="axisInput" :bars="bars" :rows="rows" />
  <button @click="ganttRef.next()">Next</button>
  <button @click="ganttRef.today()">Today</button>
  <button @click="ganttRef.changeView('month')">Month view</button>
  <button @click="ganttRef.scrollToDate(new Date('2026-06-01'))">Scroll to June</button>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ChronixGantt } from '@chronixjs/gantt-vue3';
import type { GanttHandle, AxisRangePlanInput } from '@chronixjs/gantt';

const ganttRef = ref<GanttHandle | null>(null);
const axisInput = ref<AxisRangePlanInput>({
  viewId: 'week',
  anchorDate: new Date(),
  // …
});
</script>
```

### Contract notes

- **`v-model:axis-input` is required** for nav / view methods to take
  effect. `handle.next()` emits `update:axisInput`; without a consumer
  binding the emit fires-and-forgotten and the chart stays put. This is
  the documented chronix-controlled-prop contract (Phase 22) and applies
  here for the same reason — no internal-state hybrid model.
- **`scrollToDate` is the one exception**: it writes `wrapperRef.scrollLeft`
  directly. No emit; no consumer wiring required. Matches k-ui's
  `_scrollRequest` → DOM-side scrollLeft write.
- **`getDate()` returns the prop**, not an internal copy. If the consumer
  hasn't yet propagated a recent `update:axisInput` round-trip,
  `getDate()` reflects the lagging state (one tick). Consistent with Vue's
  controlled-prop semantics.

### Alternatives considered

- **Internal-state hybrid** (`handle.next()` mutates a component-owned
  `axisInput` ref, consumer may or may not wire `v-model`). **Rejected**:
  breaks Phase 22's clean "props down, events up" model; introduces
  dual-source-of-truth (prop vs internal); makes `getDate()` ambiguous
  (prop or internal?).
- **Emit `scroll-request` event** (consumer responsible for honoring it).
  **Rejected**: scroll position has never been a chronix prop; consumers
  expect "scroll the chart" to actually scroll the chart. Adding a
  scroll-request emit consumers must wire just for `scrollToDate` to work
  is friction without a benefit.
- **k-ui-verbatim method names** (`getEventById` / `getEvents` / `addEvent`).
  **Rejected**: chronix's whole IR is `bar`-named (`BarSpec`, `BarDropPayload`,
  `getBarTable`, `bar-drop` emit). A `handle.getEventById` next to
  `handle.getBarTable` would be lexically inconsistent. Consumers migrating
  from k-ui already need a one-line shim (`const event = handle.getBarById(id)`)
  regardless of which name we pick.
- **k-ui `DurationInput` for `incrementDate`** (a `'1d 2h'` string-form or
  `{ year, month, week, day, hour, minute, second }` shape with the broader
  k-ui duration grammar). **Rejected**: chronix has no hour-granular axis
  today; an `IncrementDelta` of `{ days, weeks, months, years }` matches
  the granularity chronix actually supports and avoids the string-parsing
  surface area.
- **k-ui `scrollToTime(duration)` shape** (duration from start-of-day).
  **Rejected**: chronix axes are multi-day; duration-from-start-of-day is
  the wrong unit. `scrollToDate(date: Date)` matches chronix's natural
  coordinate system.

## Parity assertion plan — MANDATORY

| Assertion id (in parity.spec.ts)                                                | Drives k-ui demo via                                                                                                                           | Drives chronix demo via                                                                                             | Compares                                                                                                                                    | Tolerance                                                             |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `phase24-handle-next anchor parity across both rendered demos`                  | `loadBothDemos` → click `[data-test-handle-method='next']` button in k-ui demo header (wired to `api.next()`)                                  | `loadBothDemos` → click `[data-test-handle-method='next']` button in chronix demo header (wired to `handle.next()`) | Toolbar title text (from `formatToolbarTitle` / k-ui's title) after the click                                                               | Exact string match                                                    |
| `phase24-handle-changeView pressed-state parity across both rendered demos`     | click `[data-test-handle-method='changeView-month']` → `api.changeView('month')`                                                               | click `[data-test-handle-method='changeView-month']` → `handle.changeView('month')`                                 | Toolbar widget set with `aria-pressed='true'` on the `month` button                                                                         | Exact set match (extends Phase 22's `extractToolbarSnapshot`)         |
| `phase24-handle-today anchor parity across both rendered demos`                 | click `[data-test-handle-method='today']` → `api.today()`                                                                                      | click `[data-test-handle-method='today']` → `handle.today()`                                                        | Per-bar `(x, width)` via `extractBarsSnapshot` + `diffBarsSnapshots` (today's anchor produces deterministic axis window)                    | `x: 1px, width: 1px, y: Infinity, height: Infinity`                   |
| `phase24-handle-scrollToDate scroll-position parity across both rendered demos` | click `[data-test-handle-method='scrollToDate-2026-06-01']` → `api.scrollToTime({ days: 14 })` (k-ui-shape equivalent) on a same-anchored demo | click `[data-test-handle-method='scrollToDate-2026-06-01']` → `handle.scrollToDate(new Date('2026-06-01'))`         | `wrapperRef.scrollLeft` read via `page.evaluate(() => document.querySelector('.cx-gantt-wrapper').scrollLeft)` and equivalent k-ui selector | `±2px` (rounding tolerance for two different scroll-arithmetic paths) |

Drift-detection scope:

- **Covered**: `next` / `today` (anchor-shift math), `changeView` (pressed
  state + view-id swap), `scrollToDate` (axis → scrollLeft math).
- **Not covered**: `prev`, `gotoDate`, `incrementDate`, `getDate`, `zoomTo`,
  `getBarById`, `getBars`. Rationale: `prev` is symmetric with `next`
  (`prevAnchor` shares one impl with `nextAnchor`'s direction parameter);
  `gotoDate` is the same emit shape as `today` with a different date;
  `incrementDate` math is unit-tested in `nav-utils.test.ts`; `getDate`
  / `getBarById` / `getBars` are read-only and have no k-ui-side DOM
  effect to diff. Covering these in parity is busy-work; the 4 above
  cover the load-bearing distinct pathways.

## Test coverage

- core: `packages/gantt/src/api/nav-utils.test.ts` (+8 tests for
  `applyIncrement` covering days / weeks / months / years and combined
  deltas; calendar-month-rollover behavior; negative deltas).
- adapter: `adapters/vue3/src/chronix-gantt-handle.test.ts` (new, ~14
  tests) — mounts `<ChronixGantt>`, gets `ref.value`, calls each handle
  method, asserts either the emitted `update:axisInput` payload (nav /
  view methods) OR the post-DOM-state (`scrollToDate` writes scrollLeft)
  OR the returned value (`getDate` / `getBarById` / `getBars`). One test
  per method × happy path.
- adapter: `adapters/vue3/src/chronix-gantt-handle.test.ts` (+2 tests for
  handle ref stability across re-renders + `expose()` shape check).
- parity: `tooling/golden-runner/tests/parity.spec.ts` (+4 cross-demo
  assertions per the table above).

Expected counts after Phase 24: vitest 489 → ~513 (+24); golden-runner
Playwright unit tests 32 unchanged; parity-spec assertions 32 → 36 (+4);
cross-demo scenarios 27 unchanged.

## VRT impact

**None expected.** Handle methods are imperative-only — they mutate state
at call time, not at mount time. The mount-state DOM (toolbar widget set,
bar geometry, today-line, today-cell-bg, sidebar layout) is identical to
post-Phase-22.2. No re-baseline of the 15 chronix cross-demo VRT scenarios
or 17 chronix-visual baselines or 6 k-ui parity goldens.

Test-only demo buttons (`<button data-test-handle-method='next'>` etc) are
added to demos but **rendered outside the captured bbox** (positioned
inside a `<div class='cx-demo-handle-test-bar'>` below the gantt wrapper,
excluded from the chrome-isolation CSS so they don't leak into snapshots).
Per the documented `feedback_vrt_screenshots.md` rule.

## Execution plan — 4 commits + wrap-up

### Commit 1 (design doc, this commit) — REQUIRES user review of 3 load-bearing decisions

Lands only `audit/PHASE_24_IMPERATIVE_HANDLE_DESIGN.md`. Awaits user
confirmation of decisions 1-3 before implementation begins.

### Commit 2: Core — `GanttHandle` interface + `nav-utils.applyIncrement`

- `packages/gantt/src/api/gantt-handle.ts` — extend `GanttHandle` with 11
  new method signatures; add `IncrementDelta` interface.
- `packages/gantt/src/api/nav-utils.ts` — add `applyIncrement(anchor, delta)`.
- `packages/gantt/src/api/nav-utils.test.ts` — +8 tests for `applyIncrement`.
- `packages/gantt/src/api/index.ts` — re-export `IncrementDelta`.
- Rebuild `@chronixjs/gantt` dist: `pnpm --filter @chronixjs/gantt build`.
- ci-check green (vitest 489 → 497).

### Commit 3: Adapter — `setup()` builds + `expose()`s handle; `scrollToDate` DOM impl

- `adapters/vue3/src/chronix-gantt.ts`:
  - `setup(props, { emit, expose })` — receive `expose` in 3rd-arg
    destructure.
  - Build `handle: GanttHandle` object inside `setup()` (after `axis` and
    `wrapperRef` are in scope).
  - `expose(handle)` before returning the render function.
- `adapters/vue3/src/chronix-gantt-handle.test.ts` (new, ~16 tests).
- ci-check green (vitest 497 → ~513).

### Commit 4: Demo wiring + cross-demo parity assertions

- `examples/gantt-vue3/src/App.vue`: add `<div class='cx-demo-handle-test-bar'>`
  below the gantt with 4 hidden-but-clickable test buttons:
  `data-test-handle-method='next'` / `'today'` / `'changeView-month'` /
  `'scrollToDate-2026-06-01'`. Each click invokes the corresponding
  `ganttRef.value?.<method>()`. CSS positions the bar `position: absolute;
top: -9999px` so it's clickable by Playwright but invisible to humans /
  VRT snapshots.
- `d:/work/k-ui/examples/gantt/vue3/src/DemoApp.vue`: matching test-button
  bar wired to `ganttApi.next()` / `today()` / `changeView('month')` /
  `scrollToTime({ days: 14 })` (k-ui-shape equivalent; June 1 from a
  fixed demo anchor of May 18).
- `tooling/golden-runner/tests/parity.spec.ts` (+4 assertions per the
  parity table).
- ci-check green; cross-demo-verify gate green (27 scenarios still pass).

### Commit 5 (wrap-up — REQUIRES /phase-close invocation)

Before flipping this design doc's Status to DONE OR adding the "Phase 24
— DONE" section to `audit/journal/`, MUST invoke `/phase-close` skill.
The skill verifies the 7 standard gates (parity assertions present,
journal section written, memory updated, design status DONE, +
catalog-completeness CI gate green, + cross-demo-verify gate green, +
prettier-clean tree).

- `audit/journal/2026-05-16.md` (or whatever date the implementation
  lands): "Phase 24 — Imperative handle API + nav (DONE, YYYY-MM-DD)"
  section per the existing template.
- `memory/project_gantt_rewrite_plan.md`: bump vitest count, phase status.
- `audit/PHASE_24_IMPERATIVE_HANDLE_DESIGN.md` Status → DONE.

## Estimated scope

| Commit            | Hours | LOC est.                            |
| ----------------- | ----- | ----------------------------------- |
| 1 (design doc)    | 1.5   | this file (~480 LOC)                |
| 2 (core)          | 1.5   | ~80 LOC src + 60 LOC tests          |
| 3 (adapter)       | 2.5   | ~120 LOC src + 220 LOC tests        |
| 4 (demo + parity) | 2     | ~80 LOC demo + 200 LOC parity tests |
| 5 (wrap-up)       | 0.5   | journal + memory + status flip      |
| **Total**         | **8** | ~1160 LOC                           |

Matches scope candidate **B (Nav + read-only event API, 11 methods, ~7h)** —
slightly over from explicit `scrollToDate` DOM-side work and the 4-button
demo test-bar wiring on both sides.

## Open questions for the user — 3 load-bearing decisions

**1. Scope: A / B / C** — recommended **B**.

- A (just nav, 9 methods, ~6h) leaves `getBarById` / `getBars` as awkward
  silent gaps (consumers commonly ask for these; they're already 80%
  there via `getBarTable().getById(id)` / `getBarTable().bars`; the wrap
  is one line each).
- B (nav + read-only event API, 11 methods, ~7-8h) — adds `getBarById`
  - `getBars` as direct wrappers. Free coverage gain, no new emits,
    no new state.
- C (B + `addBar` + `removeAllBars`, 13 methods, ~10h) — adds write CRUD
  that needs transaction-overlay commit semantics + new `bar-add` /
  `bar-remove` emits + id-collision policy + `rowId` validation. Worth
  its own phase (Phase 26+) when a real consumer needs programmatic
  bar mutation.

**Recommendation**: B.

**2. State-change mechanism — compute-and-emit vs internal-state hybrid**
— recommended **compute-and-emit through `update:axisInput`**.

- Same channel as Phase 22 toolbar. Single pathway, both surfaces equivalent.
- Consumer contract: must wire `v-model:axis-input` for nav / view methods
  to take effect. `scrollToDate` is the documented exception (direct DOM
  scrollLeft write).
- Alternative (internal-state hybrid) breaks "props down, events up";
  introduces dual-source-of-truth; makes `getDate()` ambiguous.

**Recommendation**: compute-and-emit (no internal state).

**3. Method naming & parameter shapes — k-ui verbatim vs chronix-native**
— recommended **chronix-native**.

- `getBarById` / `getBars` not `getEventById` / `getEvents` (matches
  chronix's `BarSpec` / `bar-drop` / `getBarTable` naming).
- `scrollToDate(date: Date)` not `scrollToTime(duration)` (chronix axes
  are multi-day; date is the right unit).
- `incrementDate(delta: IncrementDelta)` where `IncrementDelta = { days?,
weeks?, months?, years? }` not k-ui's broader `DurationInput`
  (string-form `'1d 2h'` or 7-field object) — chronix has no hour-granular
  axis; `IncrementDelta` matches what chronix actually supports.
- `gotoDate(date: Date)` strict — no `string` overload (consumers already
  work with `Date` per `axisInput.anchorDate`).
- `zoomTo(date, viewId?)` — default `viewId` is current (not k-ui's
  `'day'` hard-default) — recenter-at-date is the more useful default.

**Recommendation**: chronix-native shapes for all 11 methods.

Reply **按照推荐继续** to accept all three recommendations (B / compute-and-emit
/ chronix-native), or call out any of 1-3 you'd like to override.
