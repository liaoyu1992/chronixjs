# Phase 22 — Toolbar / view-switch buttons

**Status**: **DONE (2026-05-16)**. Landed as 3 commits: `7e12b47` (design doc, 544 lines), `7935b74` (Commit 1: core toolbar types + parser + nav-utils + theme tokens + adapter render + 38 vitest, ~980 LOC), `099cb5a` (Commit 2: demo wiring + `extractToolbarSnapshot` + 3 parity assertions + 15 VRT re-baselines, ~286 LOC). Cumulative vitest 445 → 483, parity assertions 28 → 31, cross-demo 27/27 green after 15 chronix-self baseline re-captures for `.cx-gantt-root` wrapper's 1-pixel layout shift. `/phase-close` skill walked all 7 gates (6 standard + 6.5 cross-demo-verify) green before status flip. See `audit/journal/2026-05-13.md` "Phase 22" section.

## Problem

The parity-reference demo wires a built-in chrome above the chart:
`headerToolbar: { left: 'prev,next today', center: 'title', right: 'day,week,month,season,halfYear,year' }`
(see `d:/work/k-ui/examples/gantt/vue3/src/DemoApp.vue:1346-1350`). That
gives consumers a 9-button widget — 3 nav buttons + a title + 6
view-toggle buttons — driven entirely by component props. Clicking
`day` calls `api.changeView('day')`; clicking `next` calls
`api.next()`; the title text updates as the visible range moves.

Chronix's demo today (`examples/gantt-vue3/src/App.vue:339-350`)
substitutes a bare `<div class="cx-demo-view-toggle">` with 6 bare
`<button>` elements bound to `cfg.view.value`. There is no chronix
component rendering this — it's plain demo template. Two
consequences:

1. **No drop-in parity.** A consumer migrating from the reference
   library cannot `s/headerToolbar/headerToolbar/` and have chronix
   render the same chrome. The string-DSL has no chronix counterpart.
2. **Cross-demo screenshots don't align toolbar regions.** The bare
   demo buttons sit at different y-offsets / sizes than the
   reference's `.gantt-toolbar` chunk, so the Phase 20.7 cross-demo
   baselines have nothing to assert about toolbar parity.

Per `audit/PARITY_RECHECK.md:329` the disposition register pins
toolbar as **Planned Phase 22**, the first of the 4 remaining
demo-parity phases (22 + 23 + 24 + 25).

This phase introduces a `headerToolbar` prop on `<ChronixGantt>` that
accepts the same string-DSL shape, parses it into widgets, renders
them above the chart with stable classNames, and wires their clicks
to a controlled-prop `update:axisInput` two-way binding. View-switch
buttons (`day` / `week` / `...`) emit a new `axisInput` with
`viewId` swapped; nav buttons (`prev` / `next` / `today`) emit one
with `anchorDate` advanced / retreated / reset.

Phase 24's imperative handle API (`handle.changeView()` /
`handle.prev()` / `handle.next()` / `handle.today()` /
`handle.gotoDate()`) is left for its own phase; per
`feedback_quality_acceleration.md` we don't batch phases. Phase 24
will reuse this phase's internal `computeNextAxisInput()` math.

## Reference behavior surface — full catalog

Reference files audited:

- `d:/work/k-ui/packages/gantt/src/Toolbar.tsx` (73 lines) — outer
  toolbar component, splits sections into left/start, center,
  right/end.
- `d:/work/k-ui/packages/gantt/src/toolbar-parse.ts` (174 lines) —
  string-DSL → widget tree. Resolves view names, API methods, and
  custom buttons.
- `d:/work/k-ui/packages/gantt/src/toolbar-struct.ts` (66 lines) —
  `ToolbarInput`, `ToolbarWidget`, `CustomButtonInput`,
  `ButtonIconsInput`, `ButtonTextCompoundInput`,
  `ButtonHintCompoundInput`.
- `d:/work/k-ui/packages/gantt/src/ToolbarSection.tsx` (147 lines) —
  per-section button row rendering + inline SVG icons for prev / next
  / prevYear / nextYear.
- `d:/work/k-ui/examples/gantt/vue3/src/DemoApp.vue:1346-1350` —
  demo's actual `headerToolbar` value.

| Item                                                                                                                          | k-ui         | chronix v0     | Reason                                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `headerToolbar: { left, center, right, start, end } \| false` string-DSL                                                      | ✅           | ✅ port        | The demo wires `{ left, center, right }` exactly. Drop-in compat requires the same shape.                                                                                       |
| `footerToolbar` (identical shape, rendered below chart)                                                                       | ✅           | ⏸️ parked      | Demo doesn't use it. Trivial to add later by ducplicating the header pathway; defer to consumer request.                                                                        |
| Section splitting: `left` forces LTR ordering; `start` respects RTL                                                           | ✅           | ✅ port (LTR)  | Demo uses `left/center/right` LTR-locked variant. RTL `start/end` accepted but renders identically since chronix is LTR-only (per `direction` deferral).                        |
| Space-separated widget groups within a section (`'prev,next today'` → two groups, the first a 2-button group)                 | ✅           | ✅ port        | Affects `.gantt-button-group` class emission on multi-button groups; visible chrome.                                                                                            |
| Comma-separated widgets within a group                                                                                        | ✅           | ✅ port        | Same.                                                                                                                                                                           |
| `title` widget renders dynamic title (`<h2.gantt-toolbar-title>`)                                                             | ✅           | ✅ port        | Demo wires `center: 'title'`. Text is derived from current `axisInput`.                                                                                                         |
| View-name widgets (`day`, `week`, `month`, `season`, `halfYear`, `year`) → click calls `changeView(name)`                     | ✅           | ✅ port (emit) | Demo wires all 6. Chronix emits `update:axisInput` with new `viewId`; controlled-prop pathway. Phase 24 will add imperative `handle.changeView()`.                              |
| Nav widgets (`prev` / `next` / `today`) → click calls `api[name]()`                                                           | ✅           | ✅ port (emit) | Demo wires all 3. Chronix emits `update:axisInput` with computed `anchorDate`. Phase 24 will add imperative `handle.prev/next/today()`.                                         |
| Year-nav widgets (`prevYear` / `nextYear`)                                                                                    | ✅           | ⏸️ parked      | Demo doesn't use. Defer-indefinite — re-prioritize per consumer request.                                                                                                        |
| `buttonText: { prev, next, today, day, week, ... }` localization overrides                                                    | ✅           | ⏸️ parked      | Demo accepts defaults. Chronix v0 hard-codes English-ish defaults matching reference (`Today`, `‹`/`›`). Defer until i18n becomes a phase.                                      |
| `buttonHints: { prev, next, today, ... }` aria-label / title overrides                                                        | ✅           | ⏸️ parked      | Same — defaults are sufficient for v0 a11y.                                                                                                                                     |
| `customButtons: { foo: { text, hint, click } }` consumer-supplied widgets                                                     | ✅           | ⏸️ parked      | Demo doesn't use. Defer-indefinite; lands when a consumer needs it.                                                                                                             |
| Inline SVG icons for `prev` / `next` / `prevYear` / `nextYear` (defined in `ToolbarSection.tsx:6-61`)                         | ✅           | ✅ port        | Reference renders SVG `<polyline>` shapes inline; chronix matches for visual parity (single-glyph buttons would otherwise render as text fallback).                             |
| `isPrevEnabled` / `isNextEnabled` / `isTodayEnabled` (disabled state when at boundary of `validRange`)                        | ✅           | ⏸️ parked      | Chronix has no `validRange` option. Defer until validRange lands; nav buttons always enabled in v0.                                                                             |
| `activeButton` pressed state (`aria-pressed`, `.gantt-button-active`)                                                         | ✅           | ✅ port        | The current view's button shows pressed state; affects visible chrome.                                                                                                          |
| Theme-driven button classes (`theme.getClass('button')`, `'buttonActive'`, `'buttonGroup')`)                                  | ✅           | ✅ port        | Map to chronix theme tokens (`toolbarButtonBg`, `toolbarButtonBgActive`, etc. — new in this phase).                                                                             |
| `viewSpec.buttonTextOverride` / `buttonTitleOverride` per-view custom labels                                                  | ✅           | ⏸️ parked      | Demo doesn't override. Chronix uses fixed Chinese single-char labels (`日`, `周`, `月`, `季`, `半年`, `年`) matching the demo's existing `VIEW_TOGGLE` labels.                  |
| `viewsWithButtons` derived list (which views appear in the toolbar)                                                           | ✅           | ✅ port        | Used internally to validate view names in the string DSL; throws on unknown view.                                                                                               |
| Toolbar interaction recording-replay (`recordButtonClicks` + `replayClickLog` Playwright helpers) — Phase 20.5 catalog parked | 🟡 1 fixture | ⏸️ parked      | **Promoted from Phase 20.5 catalog to Phase 22.1** (separate follow-up). See "Open / parked" below. v0 parity uses DOM snapshots of toolbar state, not end-to-end click replay. |

**Parked total: 8 items** (footerToolbar, year-nav, buttonText i18n,
buttonHints, customButtons, validRange-driven enable state,
viewSpec.buttonTextOverride, recording-replay). All eight are
demand-driven: re-prioritize per consumer request OR when a
downstream phase needs them. No P0-severity behavior is dropped — the
demo's actual `headerToolbar` wiring (3 nav + title + 6 views) ports
fully.

## Approach

### New API surface on `<ChronixGantt>`

```ts
// adapters/vue3/src/chronix-gantt.ts (added to props block)
headerToolbar: {
  type: [Object, Boolean] as PropType<ToolbarInput | false>,
  default: false,
},

// emits block (new)
'update:axisInput': (_next: AxisRangePlanInput) => true,
```

Two-way binding shape:

```vue
<ChronixGantt
  v-model:axis-input="cfg.axisInput"
  :header-toolbar="{
    left: 'prev,next today',
    center: 'title',
    right: 'day,week,month,season,halfYear,year',
  }"
/>
```

`false` (default) suppresses the toolbar entirely — chronix renders
flush as it does today. Existing consumers passing `:axis-input=`
one-way are unaffected.

### Toolbar-input types (re-export from core)

```ts
// packages/gantt/src/api/toolbar-types.ts (new)
export interface ToolbarInput {
  readonly left?: string;
  readonly center?: string;
  readonly right?: string;
  readonly start?: string;
  readonly end?: string;
}

export interface ToolbarWidget {
  readonly buttonName: string;
  readonly kind: 'title' | 'view' | 'nav';
  readonly labelText?: string;
  readonly iconSvg?: 'prev' | 'next';
  readonly isPressed?: boolean;
}

export interface ToolbarModel {
  readonly sectionWidgets: Readonly<
    Record<'start' | 'center' | 'end', readonly (readonly ToolbarWidget[])[]>
  >;
}
```

Re-exported from `packages/gantt/src/index.ts` so consumers can type
their toolbar prop.

### Toolbar parse — `packages/gantt/src/api/parse-toolbar.ts` (new)

```ts
export function parseToolbar(
  input: ToolbarInput,
  options: {
    readonly viewIds: readonly ViewId[];
    readonly activeViewId: ViewId;
  },
): ToolbarModel;
```

Mirrors `d:/work/k-ui/packages/gantt/src/toolbar-parse.ts` semantics:

- Each section's string is split on `' '` → widget groups
- Each group's string is split on `','` → widgets
- For each widget name:
  - `'title'` → `kind: 'title'`
  - one of `viewIds` → `kind: 'view'`, `labelText` from `VIEW_LABELS[name]`, `isPressed: name === activeViewId`
  - one of `'prev' | 'next' | 'today'` → `kind: 'nav'`, `labelText: 'Today'` for today, `iconSvg: 'prev' | 'next'` for nav arrows
  - else → throw `Error(\`Unknown toolbar widget '${name}'. Expected 'title', a view id (${viewIds.join('/')}), or a nav button ('prev' | 'next' | 'today').\`)`
- `left` / `right` map to `start` / `end` (LTR-locked); both forms accepted

`VIEW_LABELS` is a chronix-internal constant matching the demo's
current Chinese single-char labels (`day → '日'`, etc.). Future
phases adding `buttonText` localization override this.

### Toolbar render — adapter-internal h() factory

`adapters/vue3/src/chronix-gantt.ts` renders the toolbar inline (no
separate SFC; matches the existing render-function style of
`ChronixGantt`). New helper:

```ts
function renderToolbar(
  model: ToolbarModel,
  activeAxisInput: AxisRangePlanInput,
  theme: ChronixTheme,
  emit: (e: 'update:axisInput', next: AxisRangePlanInput) => void,
): VNode | null;
```

Emits class names matching k-ui's chrome (`.gantt-toolbar`,
`.gantt-toolbar-chunk`, `.gantt-button-group`, `.gantt-<name>-button`,
`.gantt-toolbar-title`) prefixed with `cx-` (`cx-gantt-toolbar`,
etc.) — chronix's existing naming convention. **The reference DOM
selector map (`reference-dom-map.ts`) gains a `TOOLBAR` family
mapping each chronix class to its k-ui counterpart** for the cross-
demo parity extractor.

### Click-to-axisInput math — `packages/gantt/src/api/nav-utils.ts` (new)

```ts
export function nextAnchor(viewId: ViewId, current: Date): Date;
export function prevAnchor(viewId: ViewId, current: Date): Date;
export function todayAnchor(): Date;
```

Per-view period:

- `day` → ±1 day
- `week` → ±7 days
- `month` → ±1 calendar month
- `season` → ±3 calendar months
- `halfYear` → ±6 calendar months
- `year` → ±1 calendar year

`todayAnchor()` returns local-midnight `Date` matching
`sample-data.ts`'s `todayLocalMidnight` shape — keeps cross-demo
date alignment with Phase 21 todayLine.

Click handler in `renderToolbar`:

```ts
function onClick(widget: ToolbarWidget) {
  if (widget.kind === 'view') {
    emit('update:axisInput', { ...activeAxisInput, viewId: widget.buttonName });
  } else if (widget.kind === 'nav') {
    const anchor =
      widget.buttonName === 'prev'
        ? prevAnchor(activeAxisInput.viewId, activeAxisInput.anchorDate)
        : widget.buttonName === 'next'
          ? nextAnchor(activeAxisInput.viewId, activeAxisInput.anchorDate)
          : /* today */ todayAnchor();
    emit('update:axisInput', { ...activeAxisInput, anchorDate: anchor });
  }
  // title is non-interactive
}
```

### Title text

Derived from current `axisInput` via a small `formatToolbarTitle()`
helper. For v0:

- `day` → `YYYY-MM-DD` (e.g. `2026-05-16`)
- `week` → `YYYY 第N周` (week-of-year)
- `month` → `YYYY年M月`
- `season` → `YYYY Q{1-4}`
- `halfYear` → `YYYY H{1-2}`
- `year` → `YYYY年`

Chinese locale matches the demo's `VIEW_LABELS`. Locale-driven
formatting is a Phase 24+ concern (datesSet emit + locale-aware
`Intl.DateTimeFormat`).

### Theme tokens (additive to `ChronixTheme`)

```ts
toolbarBg: string; // .cx-gantt-toolbar background
toolbarButtonBg: string; // resting button bg
toolbarButtonBgActive: string; // .cx-gantt-button-active bg
toolbarButtonBorder: string;
toolbarButtonColor: string;
toolbarTitleColor: string;
```

`defaultChronixTheme` ships values matching the demo's current
`cx-demo-view-toggle-button` CSS. `chronix-theme.test.ts`'s
`EXPECTED_TOKEN_KEYS` + `stringKeys` arrays bump by 6 entries (per
the Phase 21 gotcha — already in the pre-flight checklist).

### Demo wiring

`examples/gantt-vue3/src/App.vue`:

- Replace `cfg.view` (single `ref<ViewId>`) with `cfg.axisInput`
  (`ref<AxisRangePlanInput>`) — encodes view + anchor + viewport
  width + locale + weekendsVisible. Initial value derives from
  current `axisInput` computed.
- Remove the bare `<div.cx-demo-view-toggle>` block (lines 339-350).
- Pass `:header-toolbar=` matching the demo:
  ```
  { left: 'prev,next today', center: 'title', right: 'day,week,month,season,halfYear,year' }
  ```
- Wire `v-model:axis-input="cfg.axisInput"` — chronix toolbar
  emits propagate.

The existing `demo-config.ts` schema entry `view: enumOf<ViewId>(...)`
becomes `viewId` (renamed) — Phase 20.6 round-trip test bumps
accordingly. **No URL-shape breakage**: existing `?view=day` URLs
continue to resolve via a one-line back-compat alias in `useDemoConfig`.

### Alternatives considered + rejected

- **Slot-based toolbar** (consumer renders own buttons via a
  `<template #toolbar>` slot): more flexible but breaks `s/k-ui/
@chronixjs\/gantt/` drop-in. Toolbar parity assertion needs ONE
  canonical shape per demo; slot makes that impossible.
- **Imperative `handle.changeView()` in this phase**: pre-empts
  Phase 24's scope. Per `feedback_quality_acceleration.md` we don't
  batch phases. The internal `nextAnchor` / `prevAnchor` / etc.
  helpers stay testable and Phase 24 calls them.
- **Toolbar as a separate `<ChronixGanttToolbar>` component**: gives
  consumers placement freedom (toolbar elsewhere on page) but k-ui's
  `headerToolbar` prop ports cleaner as integrated chrome. Two-
  component split can be added later if a consumer asks; v0 stays
  monolithic.
- **End-to-end recording-replay parity in this phase**: see Decision 3
  in "Open questions for the user". Recommended deferred to Phase
  22.1 because the recording-replay infrastructure is non-trivial
  (Playwright launcher → JSON event log → replay step-by-step → diff
  per-step DOM); folding it in inflates Phase 22 to ~8h, breaking
  single-session budget.

## Parity assertion plan — MANDATORY

| Assertion id (in parity.spec.ts)                              | Drives k-ui demo via                                                  | Drives chronix demo via                                                          | Compares                                                                                                                                              | Tolerance                                                                              |
| ------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `toolbar widget set parity (week view, default)`              | `loadBothDemos` → k-ui at 8701 with default `headerToolbar` wired     | `loadBothDemos` → chronix at 8702 with `?parity=true&headerToolbar=default`      | Per-widget snapshot via new `extractToolbarSnapshot` — pairs by `data-button-name`; checks `text`, `isPressed`, `kind`, `position.x` (group ordering) | `x: 2px, width: 4px, y: Infinity, height: Infinity, text: 'exact', isPressed: 'exact'` |
| `toolbar active-button shifts on view-id change (day → week)` | k-ui demo: programmatic `changeView('week')` via `__gantt.changeView` | chronix demo: `cfg.axisInput.value = { ...cfg.axisInput.value, viewId: 'week' }` | Same `extractToolbarSnapshot`, now asserting the `isPressed` boolean moved from `day` button to `week` button on both sides                           | `isPressed: 'exact'` (other fields not asserted; only the pressed-state move matters)  |
| `toolbar title text format parity (week view)`                | k-ui demo                                                             | chronix demo                                                                     | `extractToolbarSnapshot` → entry with `kind: 'title'`; `text` field                                                                                   | `text: 'exact'` — both demos render same week label                                    |

3 new parity assertions; cumulative 28 → **31**.

Out-of-scope for this phase (covered by Phase 22.1 follow-up): end-
to-end click→state-change recording-replay. The 3 assertions above
exercise the snapshot extraction + per-widget state agreement at
mount; the click pathway is exercised via unit tests against the
adapter (see Test coverage).

### Or — chronix-new declaration

(Not applicable; k-ui counterpart exists.)

## Test coverage

- **core**: `packages/gantt/src/api/parse-toolbar.test.ts` (new,
  ~12 tests) — section splitting, view-name resolution, nav
  resolution, error on unknown widget, error on empty section,
  `start`/`end` ↔ `left`/`right` aliasing, `isPressed` flag
  propagation.
- **core**: `packages/gantt/src/api/nav-utils.test.ts` (new, ~8
  tests) — `nextAnchor` / `prevAnchor` for each viewId, month-end
  rollover (e.g. Jan 31 + 1mo → Feb 28/29), leap-year + year ±1,
  `todayAnchor` returns local-midnight.
- **adapter**: `adapters/vue3/src/chronix-gantt.test.ts` —
  `describe('Phase 22 toolbar')` (~10 SFC tests) — toolbar visible
  when `headerToolbar` set, hidden when `false` (default); each of
  the 9 buttons renders with expected text + class; clicking a view
  button emits `update:axisInput` with new `viewId`; clicking `prev`
  / `next` / `today` emits with new `anchorDate`; pressed state
  follows `axisInput.viewId`; title updates after `axisInput`
  changes.
- **demo**: `examples/gantt-vue3/src/demo-config.test.ts` (+1) —
  `viewId` schema key round-trips (`?view=day` legacy URL still
  resolves to `?viewId=day` shape).
- **parity**: `tooling/golden-runner/tests/parity.spec.ts` (+3
  assertions, see Parity assertion plan above).
- **cross-demo**: `tooling/golden-runner/src/cross-demo-scenarios.ts`
  — register 3 new scenarios (`vrt-toolbar-default-week`,
  `vrt-toolbar-after-view-change-month`, `vrt-toolbar-after-next`).
  Count assertions in `cross-demo-scenarios.unit.spec.ts` bump
  27 → 30, 15 vrt → 18.

Drift-detection scope: assertions cover the 9 default buttons + 3
post-click states. NOT covered: `footerToolbar`, year-nav buttons,
`customButtons`, `buttonText` overrides (all parked per catalog).

## VRT impact

3 new chronix baselines captured via `node tooling/golden-runner/
scripts/run-cross-demo.mjs capture --grep toolbar` (existing 27
untouched per memory rule `feedback_vrt_screenshots.md` — local
capture, not blanket re-capture).

Existing 5 chronix VRT baselines + 17 chronix-visual baselines may
need rebaseline IF the toolbar's presence shifts the chart's body
y-offset. Mitigation: chronix toolbar uses absolute height
(`52px` matching k-ui's `.gantt-toolbar`) and the body wrapper's
top-margin matches — should be a no-op for existing baselines, but
verify in Commit 1 before moving on.

## Execution plan — 2 commits + wrap-up

### Commit 1: `feat(gantt): headerToolbar prop + parse + nav-utils + adapter render (Phase 22)`

- `packages/gantt/src/api/toolbar-types.ts` (new) — types
- `packages/gantt/src/api/parse-toolbar.ts` (new) — string-DSL parser
- `packages/gantt/src/api/parse-toolbar.test.ts` (new) — ~12 tests
- `packages/gantt/src/api/nav-utils.ts` (new) — `nextAnchor` /
  `prevAnchor` / `todayAnchor`
- `packages/gantt/src/api/nav-utils.test.ts` (new) — ~8 tests
- `packages/gantt/src/theme/ChronixTheme.ts` — +6 toolbar tokens
- `packages/gantt/src/theme/chronix-theme.test.ts` — bump
  `EXPECTED_TOKEN_KEYS` + `stringKeys` (+6)
- `packages/gantt/src/index.ts` — re-export `ToolbarInput`,
  `ToolbarWidget`, `ToolbarModel`
- **dist rebuild**: `pnpm --filter @chronixjs/gantt build` (memory
  rule `feedback_rebuild_dist_for_cross_package_changes.md` — Phase
  21 + Phase 12 etc. all hit by skipping this)
- `adapters/vue3/src/chronix-gantt.ts` — `headerToolbar` prop,
  `update:axisInput` emit, `renderToolbar` h() helper,
  `formatToolbarTitle` helper
- `adapters/vue3/src/chronix-gantt.test.ts` — `describe('Phase 22
toolbar')` (~10 SFC tests)
- **Anti-regression**: existing 240 core + 194 adapter + 11 demo
  vitest stay green
- **Browser verify**: chronix dev at 8702, k-ui at 8701; click each
  of the 9 buttons; toolbar UI matches reference visually; title
  updates; view-toggle pressed state moves

### Commit 2: `feat(example-gantt-vue3): wire headerToolbar + drop bare view-toggle (Phase 22)`

- `examples/gantt-vue3/src/App.vue` — replace `cfg.view` with
  `cfg.axisInput`, drop `cx-demo-view-toggle` block, add `:header-
toolbar=` prop + `v-model:axis-input` binding
- `examples/gantt-vue3/src/demo-config.ts` — `viewId` schema key
  (with `view` legacy alias), `axisInput` derived computed
- `examples/gantt-vue3/src/demo-config.test.ts` — +1 round-trip test
- `tooling/golden-runner/src/cross-demo-scenarios.ts` — 3 new
  scenarios (toolbar-default-week, toolbar-after-view-change-month,
  toolbar-after-next)
- `tooling/golden-runner/src/parity-helpers.ts` — new
  `extractToolbarSnapshot` helper (follows the existing
  `extractSidebarSnapshot` pattern — multi-element pairing by
  `data-button-name`; pairs k-ui's `[class*='-button']` with
  chronix's `.cx-gantt-*-button`)
- `tooling/golden-runner/src/parity-helpers.test.ts` — +2 tests
  exercising `extractToolbarSnapshot` against fixtures
- `tooling/golden-runner/src/reference-dom-map.ts` — `TOOLBAR`
  constant family
- `tooling/golden-runner/tests/cross-demo-scenarios.unit.spec.ts` —
  count assertions 27→30, 15 vrt→18
- `tooling/golden-runner/tests/parity.spec.ts` — +3 toolbar
  assertions
- Capture 3 new chronix baselines via local `--grep toolbar`
- **Cross-demo verify**: `pnpm cross-demo-verify` confirms 30/30
- **Browser verify**: demo URL `?viewId=week` + `?viewId=day` both
  render correctly; toolbar renders; clicks propagate; existing
  Phase 19-21 toggles still work

### Commit 3 (wrap-up — REQUIRES `/phase-close` invocation)

Before flipping this design doc's Status to DONE OR adding the
"Phase 22 — DONE" section to `audit/journal/`, MUST invoke
`/phase-close` skill. The 7-gate (6 standard + 6.5 cross-demo-verify)
all green:

- parity.spec.ts has 3 new toolbar assertions
- audit/journal/2026-05-13.md has a Phase 22 section
- memory `project_gantt_rewrite_plan.md` test count + phase status
  updated (+30 tests rough, Phase 22 → DONE)
- audit/PHASE_22_TOOLBAR_DESIGN.md status flipped to DONE
- audit/PARITY_RECHECK.md disposition register: Phase 22 row →
  `DONE Phase 22`

## Estimated scope

- Toolbar types + parser + tests: ~1.5 h (~150 LOC)
- Nav-utils + tests: ~1 h (~80 LOC)
- Theme tokens + theme-test bump: ~0.5 h (~20 LOC)
- Adapter render + SFC tests: ~1.5 h (~200 LOC)
- Dist rebuild + adapter typecheck: ~0.25 h
- Demo wiring + axisInput schema migration: ~1 h (~80 LOC)
- `extractToolbarSnapshot` + parity assertions: ~1 h (~120 LOC)
- Cross-demo scenarios + baselines + verify: ~0.75 h
- Wrap-up + `/phase-close`: ~0.5 h
- **Total: ~8 hours**, ~650 LOC across 2 implementation commits + 1
  wrap-up. Single-session feasible per `feedback_quality_acceleration.md`.

## Open / parked (for follow-up phases)

- **Phase 22.1 — toolbar click recording-replay infrastructure**
  (~3-4h). The Phase 20.5 catalog identified Phase 22 as the first
  phase needing button-click recording-replay parity. v0 parity in
  this phase uses static DOM snapshots; the recording-replay
  infrastructure (Playwright launcher → JSON event log → replay
  step-by-step → per-step DOM diff) is its own follow-up phase. New
  phase number 22.1, allocated after Phase 22 lands. Trigger:
  whenever a second phase needs button-click parity (Phase 24
  imperative API → invoke `handle.next()` and assert post-state
  DOM); fold both into 22.1 then.
- **`footerToolbar`** — port pathway is identical to header; ~30 LOC
  delta. Land when a consumer wires it.
- **Year-nav buttons (`prevYear` / `nextYear`)** — defer; demo
  doesn't use.
- **`buttonText` / `buttonHints` i18n** — defer to a future i18n
  phase that does Intl.DateTimeFormat properly for title text too.
- **`customButtons`** — defer to first consumer request.
- **`validRange` + `isPrevEnabled` / `isNextEnabled` /
  `isTodayEnabled`** — defer until validRange becomes a phase.
- **`viewSpec.buttonTextOverride` / `buttonTitleOverride`** — defer
  with i18n.
- **`<ChronixGanttToolbar>` as standalone component** — current
  monolithic approach matches k-ui's chrome model. Split if a
  consumer needs toolbar placement elsewhere.

## Open questions for the user

Only 3 load-bearing decisions (per `feedback_quality_acceleration.md`
"design summaries highlight 3 load-bearing decisions only — no 8-10
open-question overload"). Sub-decisions absorbed into recommendations.

1. **Scope: A+ (toolbar UI + per-button DOM snapshot parity, ~8h
   single-session) vs B (toolbar UI + recording-replay infra, ~10-
   12h) vs C (toolbar UI + Phase 24 imperative API merge, ~12h)?**
   Recommended: **A+**. Recording-replay infra is its own follow-up
   (Phase 22.1, deferred until a second consumer materializes —
   Phase 24's imperative API tests would be the second consumer,
   amortizing the infra cost across both). Phase 24 imperative API
   merge violates the single-session no-batch rule. A+ ships
   toolbar + 3 parity assertions in one session.

2. **Toolbar input API: data-driven `headerToolbar: ToolbarInput`
   (k-ui string-DSL parity) vs slot-based (consumer renders own
   buttons) vs dual (both)?** Recommended: **data-driven only**.
   This is the only phase where k-ui-parity has a concrete
   behavioral surface (the string-DSL is the API contract).
   Diverging here means consumers can't `s/parity-ref/chronix/` mechanically.
   Slot-based is more flexible but breaks parity-asserted equivalence;
   add later (Phase 26+?) if a consumer asks.

3. **Interaction shape: controlled-prop `v-model:axisInput` (chronix
   emits `update:axisInput`, consumer two-way-binds) vs uncontrolled
   internal state (chronix holds `currentAxisInput` ref, consumer
   reads via handle)?** Recommended: **controlled-prop**. Matches
   chronix's existing "props down, events up" idiom (bars, rows,
   axisInput today, selectedBarIds via composable). Phase 24
   imperative `handle.prev()` later compute-and-emits through the
   same pathway — no internal-state hybrid model needed. The
   controlled-prop contract holds across every chronix prop.

Reply **按照推荐继续** to accept all three defaults (A+ scope, data-
driven `headerToolbar`, controlled-prop `v-model:axisInput`) and
proceed to commit the design doc + start Commit 1.
