# Phase 18 — `weekendsVisible` actually filters the axis

**Status**: **Approved (pending user reply)** — design only; no code yet.

## Problem

`audit/PARITY_RECHECK.md` (2026-05-15) flags `weekendsVisible` as the
sole **🔴 BLOCKING** drift in the algorithm audit (Batch 1, item #10).
The flag is plumbed everywhere — `AxisRangePlanInput.weekendsVisible:
boolean` is declared at `packages/gantt/src/layout/types.ts:62-64`,
documented as _"When false, Saturday + Sunday slots are omitted from
week-and-wider views"_, and threaded through ~14 call sites (every
adapter / vitest / parity test). But `axis-range-planner.ts` (333
lines) has **zero** references to it.

Net consequence: a host that passes `weekendsVisible: false` gets the
documented behavior on k-ui (Mon–Fri only, ~132 slots in half-year)
and the wrong behavior on chronix (Mon–Sun, ~184 slots). Every
downstream computation (slot width, bar placement, header band
widths) drifts with the slot count.

The chronix demo hard-codes `weekendsVisible: true` (`examples/gantt-
vue3/src/App.vue:104`), so neither vitest nor the 5 chronix VRT
baselines nor the 27 parity assertions currently exercise the
`false` branch — which is exactly why this drift survived 15 phases
undetected. Phase 18 closes the algorithm gap **and** lands the
parity assertions that prevent it from regressing.

**Reference**: k-ui's `DateProfileGenerator.initHiddenDays()` reads
`props.weekends === false` and pushes day-of-week 0 (Sunday) + 6
(Saturday) into `isHiddenDayHash`. `buildTimelineDateProfile` then
filters those dates out of `slotDates` via `isValidDate(...)` →
`dateProfileGenerator.isHiddenDay(date)`
(`packages/gantt/src/DateProfileGenerator.ts:380-410` +
`packages/gantt/src/timeline/timeline-date-profile.ts:160-167`).

## Reference (k-ui) behavior surface — full catalog

| Item                                                                              | k-ui                                                                                                                       | chronix v0                                                                                  | Reason                                                                                                          |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Boolean `weekends: false` → mark Sat (6) + Sun (0) hidden                         | `DateProfileGenerator.ts:388-390` pushes `0, 6` into `hiddenDays`                                                          | ✅ port — same semantics via the existing `weekendsVisible: boolean` flag                   | direct semantic match                                                                                           |
| User-supplied `hiddenDays` array (any subset of 0..6)                             | `DateProfileGenerator.ts:383` reads `props.hiddenDays`                                                                     | ⏸️ parked — only the `weekendsVisible` boolean exists in v0                                 | full hidden-days array is a separate phase; out of demo + audit scope                                           |
| Slot-loop date filter via `isValidDate` → `isHiddenDay`                           | `timeline-date-profile.ts:160-167` (`while (date < end) { if (isValidDate(...)) slotDates.push(date); ... }`)              | ✅ port — inline filter inside `planWeekView` + `planMonthView` + `planMonthBandedAxis`     | observable filter; the structural shape stays chronix-native (no separate `DateProfileGenerator` object)        |
| Snap-index filter (`snapDiffToIndex`) skips hidden days for interaction snapping  | `timeline-date-profile.ts:173-194`                                                                                         | ⏸️ parked — chronix's snap math uses `slotDurationMs` directly, not a per-date snap array   | snap-on-hidden-day is an interaction concern; out of axis-planner scope. Revisit if snap ↔ weekends bug appears |
| `trimHiddenDays(range)` for view-range pre-trim                                   | `DateProfileGenerator.ts:407-423`                                                                                          | ❌ rejected v0 — chronix doesn't expose a range-trim API; the view range is `anchorDate`-driven | not needed for slot generation; planner walks the raw range and filters at emit time                            |
| All-days-hidden throw (`invalid hiddenDays`)                                      | `DateProfileGenerator.ts:398-400`                                                                                          | ❌ rejected — only the boolean exists; "hide every day" is unreachable                       | impossible state in v0; revisit when `hiddenDays` array lands                                                   |
| Day view weekend behavior (weekends-off on a Sat/Sun anchor)                      | k-ui's `trimHiddenDays` on a single weekend day returns null → view fails to render                                        | ❌ rejected — `planDayView` stays unchanged; renders 24 hourly ticks on the anchor day      | matches the docstring scope: _"week-and-wider views"_. Day view = single calendar day, weekend or not          |
| Week view per-day filter                                                          | `weekends: false` → `slotDates` skips Sat/Sun; `<th>` count drops to 5                                                     | ✅ port — `planWeekView` filters per-hour loop; emits 5 × 24 = 120 ticks; 5 dayCells       | core week-view algorithm change                                                                                 |
| Month view per-day filter                                                         | `weekends: false` → ~20-23 day ticks (28-31 calendar days minus weekend days)                                              | ✅ port — `planMonthView` filters; `slotCount` via new `countVisibleDaysAcrossMonths` helper | core month-view algorithm change                                                                                |
| Season / halfYear / year per-day filter                                           | same per-day filter applied across N months                                                                                | ✅ port — `planMonthBandedAxis` filters; per-month `monthCell.width = visibleDaysInMonth × slotWidth` | core multi-month algorithm change                                                                               |
| Dense-packed tick X positions post-filter (no visual gaps where weekends would be) | `slotDates` is dense after filter; rendered at `i * slotWidth` for dense `i`                                              | ✅ port — chronix emits `x = (post-filter-index) × slotWidth`; no gaps                       | matches k-ui's rendered geometry; visible day cells abut directly                                                |
| Header band widths recomputed against filtered visible-day count                  | k-ui `<th>` widths come from CSS grid template; band shrinks as `slotDates` shrinks                                       | ✅ port — `dayCells[d].width = hoursPerDay × slotWidth` only for visible d; `monthCells[m].width = visibleDays[m] × slotWidth` | matches k-ui's visible band geometry                                                                            |
| `slotDurationMs` semantic unchanged                                               | k-ui keeps `slotDuration` constant; bars at hidden-day timestamps slice via `TimelineLaneSlicer`                          | ✅ same — `slotDurationMs` stays `MS_PER_HOUR` / `MS_PER_DAY`; bars use `pxPerMs` math unchanged | preserves all downstream layout passes' math; gap is bar-on-weekend slicing — see below                          |
| Bar slicing across hidden weekend days (`TimelineLaneSlicer`)                     | `packages/gantt/src/resource-timeline/utils/TimelineLaneSlicer.ts:42-67` slices bars at hidden-day boundaries              | ⏸️ parked v0 — chronix's `BarPlacementPass` doesn't slice; a bar starting on Sat in weekends-off mode renders at its raw `(t - axisStart) × pxPerMs` offset | scope-out per discipline; bar-slicing is a separate Phase 18.x. Demo data + parity assertions deliberately avoid weekend-anchored bars when asserting under weekends-off |

## Approach

### Internal helper

```ts
function isHiddenWeekendDay(d: Date, weekendsVisible: boolean): boolean {
  if (weekendsVisible) return false;
  const dow = d.getDay();
  return dow === 0 || dow === 6; // 0=Sun, 6=Sat — matches k-ui's hash push
}
```

Plus a small generalization of `countDaysAcrossMonths`:

```ts
function countVisibleDaysAcrossMonths(
  start: Date,
  monthCount: number,
  weekendsVisible: boolean,
): number {
  let total = 0;
  const cursor = new Date(start);
  for (let m = 0; m < monthCount; m += 1) {
    const monthIndex = cursor.getMonth();
    while (cursor.getMonth() === monthIndex) {
      if (!isHiddenWeekendDay(cursor, weekendsVisible)) total += 1;
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  return total;
}
```

The original `countDaysAcrossMonths(start, monthCount)` becomes a
trivial pass-through: `countVisibleDaysAcrossMonths(start, monthCount,
true)`. Inline replacement at the call sites is cleaner than keeping
both — there are only 2 call sites (`planMonthView` + `planMonthBandedAxis`).

### `planDayView` — **no change**

Day view emits 24 hourly ticks for the anchor day regardless of
weekend. Matches the docstring scope (_"week-and-wider views"_). A
code comment cites this explicitly so future readers don't add the
filter here by mistake. `types.ts:62-64` JSDoc is updated to drop
the ambiguity.

### `planWeekView`

Restructure the per-slot loop to walk by `(dayIdx, hour)`:

```ts
function planWeekView(input: AxisRangePlanInput): PlannedAxis {
  const monday = startOfWeekMonday(input.anchorDate);
  const hoursPerDay = 24;
  const daysInWeek = 7;

  // Pre-compute which days are visible. Dense indices used downstream.
  const visibleDays: Date[] = [];
  for (let d = 0; d < daysInWeek; d += 1) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + d);
    if (!isHiddenWeekendDay(day, input.weekendsVisible)) visibleDays.push(day);
  }
  const visibleDayCount = visibleDays.length;
  const slotCount = hoursPerDay * visibleDayCount;
  const slotWidth = deriveSlotWidth(input.viewportWidth, slotCount, IS_TIME_SCALE.week);
  const totalWidth = slotWidth * slotCount;

  const hourFmt = new Intl.DateTimeFormat(input.locale, { hour: 'numeric', hour12: false });
  const dayFmt = new Intl.DateTimeFormat(input.locale, {
    weekday: 'short', month: 'numeric', day: 'numeric',
  });

  const ticks: AxisTick[] = [];
  const dayCells: AxisHeaderCell[] = [];
  for (let d = 0; d < visibleDayCount; d += 1) {
    const dayStart = visibleDays[d]!;
    for (let h = 0; h < hoursPerDay; h += 1) {
      const t = new Date(dayStart);
      t.setHours(h);
      ticks.push({ x: ticks.length * slotWidth, time: t, label: hourFmt.format(t) });
    }
    dayCells.push({
      x: d * hoursPerDay * slotWidth,
      width: hoursPerDay * slotWidth,
      label: dayFmt.format(dayStart),
    });
  }

  return {
    viewId: 'week', slotWidth, slotDurationMs: MS_PER_HOUR,
    totalWidth, slotCount, ticks, headerRows: [{ cells: dayCells }],
  };
}
```

Behavior with `weekendsVisible: true`: identical to current
(7 days × 24 = 168 ticks, 7 dayCells). With `false`: 5 days × 24 =
120 ticks, 5 dayCells, no Sat/Sun in labels. Tick X positions stay
dense (no gaps where weekends would be) — matches k-ui's rendered
geometry.

### `planMonthView`

```ts
function planMonthView(input: AxisRangePlanInput): PlannedAxis {
  const start = startOfMonth(input.anchorDate);
  const monthIndex = start.getMonth();
  const slotCount = countVisibleDaysAcrossMonths(start, 1, input.weekendsVisible);
  const slotWidth = deriveSlotWidth(input.viewportWidth, slotCount, IS_TIME_SCALE.month);
  // ... (dayFmt + monthFmt unchanged)

  const ticks: AxisTick[] = [];
  const cursor = new Date(start);
  while (cursor.getMonth() === monthIndex) {
    if (!isHiddenWeekendDay(cursor, input.weekendsVisible)) {
      ticks.push({
        x: ticks.length * slotWidth,
        time: new Date(cursor),
        label: dayFmt.format(cursor),
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  const totalWidth = slotWidth * slotCount;
  return {
    viewId: 'month', slotWidth, slotDurationMs: MS_PER_DAY,
    totalWidth, slotCount, ticks,
    headerRows: [{ cells: [{ x: 0, width: totalWidth, label: monthFmt.format(start) }] }],
  };
}
```

### `planMonthBandedAxis`

```ts
function planMonthBandedAxis(
  input: AxisRangePlanInput,
  start: Date,
  monthCount: number,
): PlannedAxis {
  const slotCount = countVisibleDaysAcrossMonths(start, monthCount, input.weekendsVisible);
  const slotWidth = deriveSlotWidth(input.viewportWidth, slotCount, IS_TIME_SCALE[input.viewId]);
  // ... (dayFmt + monthFmt unchanged)

  const ticks: AxisTick[] = [];
  const monthCells: AxisHeaderCell[] = [];
  const cursor = new Date(start);
  for (let m = 0; m < monthCount; m += 1) {
    const monthStart = new Date(cursor);
    const monthIndex = cursor.getMonth();
    const firstSlotIdx = ticks.length;

    while (cursor.getMonth() === monthIndex) {
      if (!isHiddenWeekendDay(cursor, input.weekendsVisible)) {
        ticks.push({
          x: ticks.length * slotWidth,
          time: new Date(cursor),
          label: dayFmt.format(cursor),
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    const visibleDaysInMonth = ticks.length - firstSlotIdx;
    monthCells.push({
      x: firstSlotIdx * slotWidth,
      width: visibleDaysInMonth * slotWidth,
      label: monthFmt.format(monthStart),
    });
  }

  return {
    viewId: input.viewId, slotWidth, slotDurationMs: MS_PER_DAY,
    totalWidth: slotCount * slotWidth, slotCount, ticks,
    headerRows: [{ cells: monthCells }],
  };
}
```

### `types.ts` doc cleanup

```ts
  /**
   * When false, Saturday + Sunday day-slots are filtered out of
   * week / month / season / halfYear / year views (matching k-ui's
   * `weekends: false` option). Day view is unaffected — it always
   * renders 24 hourly ticks on the anchor day, weekend or not.
   *
   * Bars whose timestamps fall on hidden weekend days are NOT
   * sliced in v0; they render at their raw `(t - axisStart) ×
   * pxPerMs` offset which may visually land inside an adjacent
   * weekday's slot. Hidden-day bar slicing is parked (see
   * audit/PHASE_18_WEEKENDS_VISIBLE_FILTER_DESIGN.md "Reference
   * catalog" row for k-ui's `TimelineLaneSlicer`).
   */
  readonly weekendsVisible: boolean;
```

### Alternative approaches rejected

1. **Separate `WeekendFilterPass` after `AxisRangePlanner.plan`**: a
   post-pass that walks `axis.ticks` + `axis.headerRows` and drops
   weekend entries. Rejected because slot-width depends on slot
   count, and slot count depends on the filter — the post-pass
   would either need to re-derive slotWidth (re-running half the
   planner) or accept that all ticks end up at wrong X positions.
   In-place filtering is simpler and one fewer pass.

2. **Generalize to `hiddenDays: number[]` now**: future-proof but
   widens scope beyond the 🔴 BLOCKING fix. The catalog above marks
   it ⏸️ parked. Phase 18.1 (if/when a host needs it) is a thin
   extension: `isHiddenWeekendDay` becomes `isHiddenDay(d,
   hiddenDays)`; `weekendsVisible: false` desugars to `hiddenDays:
   [0, 6]`.

3. **Slice bars in this phase**: catalog row marks bar-slicing as
   ⏸️ parked. Adding it would (a) double the algorithmic surface,
   (b) require touching `BarPlacementPass` + adapter render, (c)
   make the parity assertions much harder to write cleanly (the
   demo's k-ui events span weekends, so a faithful bar-X parity
   under weekends-off requires slicing both sides). Park keeps
   this phase a clean axis-only fix.

## Parity assertion plan — MANDATORY

The discipline rule: every algorithm-touching phase MUST add at
least one side-by-side k-ui-vs-chronix assertion in the **same
commit** as the implementation. The pattern for axis-only changes
is the existing in-process pattern at `parity.spec.ts:90-415`
(chronix planner runs in-process; k-ui demo's rendered DOM is
extracted via Playwright).

For weekends-off, the k-ui demo at `localhost:8701` exposes a
clickable `<input type="checkbox">` labeled `显示周末` (`vue3/src/
DemoApp.vue:1941`). The parity tests click that checkbox to flip
the k-ui demo into weekends-off mode, then switch to the view
under test, then extract rendered ticks.

| Assertion id (in parity.spec.ts)                                                              | Drives k-ui demo via                                                                            | Drives chronix demo via                                                                       | Compares                                                       | Tolerance                                  |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------ |
| `week-view dayCells (weekendsVisible: false) — set equality + count`                          | `loadView(page, '周')` after clicking `getByLabel('显示周末')` to uncheck                       | `defaultAxisRangePlanner.plan({ viewId: 'week', weekendsVisible: false, ... })` in-process    | dayCell labels (regex `^\d+\/\d+周[一二三四五]$` — Mon-Fri only) | exact set equality + chronix `dayCells.length === 5` + ref ≥ 1 |
| `halfYear-view slot count (weekendsVisible: false) — count equality`                          | `loadView(page, '半年')` after clicking `getByLabel('显示周末')` to uncheck                     | `defaultAxisRangePlanner.plan({ viewId: 'halfYear', weekendsVisible: false, ... })` in-process | rendered tick count (regex `^\d+日[一二三四五]$` — Mon-Fri only) | exact integer equality (`chronix.slotCount === refTickCount`); chronix `slotCount` in [125, 135] sanity range |

**Drift-detection scope of these two assertions**:
- ✅ catches: chronix forgetting to filter weekends in `planWeekView`
  (assertion 1 fails — chronix emits 7 dayCells with Sat/Sun while
  k-ui renders 5)
- ✅ catches: chronix forgetting to filter weekends in
  `planMonthBandedAxis` (assertion 2 fails — chronix slotCount is
  ~184 while k-ui renders ~132)
- ✅ catches: chronix mis-counting visible days at month boundaries
  (assertion 2 — slot count off by 1+ on any month with off-by-one
  weekend handling)
- ❌ does NOT catch: bar slicing parity (out of scope per catalog —
  bar-X parity under weekends-off is parked)
- ❌ does NOT catch: `planMonthView` (single-month) filter — only
  `planMonthBandedAxis` is exercised by the demo's 半年 button. The
  unit test on `planMonthView` (next section) covers this codepath.

## Test coverage

- core: `packages/gantt/src/layout/axis-range-planner.test.ts`
  (+8 tests):
  - `weekendsVisible: false` — week view: `slotCount === 120`,
    `ticks.length === 120`, `headerRows[0].cells.length === 5`,
    no `周六` / `周日` substring in dayCell labels
  - `weekendsVisible: false` — week view: `slotWidth` differs from
    `weekendsVisible: true` case (recomputed against smaller
    slotCount), ticks dense-packed at `i * slotWidth`
  - `weekendsVisible: false` — month view: `slotCount` equals
    pre-computed visible-day count for the anchor month (e.g. May
    2026 has 21 weekdays; assert `slotCount === 21`)
  - `weekendsVisible: false` — month view: tick labels carry no
    `六` / `日` narrow weekday suffix
  - `weekendsVisible: false` — season view: `slotCount` = sum of
    visible days across 3 months at anchor
  - `weekendsVisible: false` — halfYear view: `slotCount` ∈ [125,
    135] (depends on month-start day-of-week of the 6-month range);
    `monthCells[0..5].width` sum equals `totalWidth`
  - `weekendsVisible: false` — year view: 12 monthCells; sum of
    cell widths === totalWidth
  - `weekendsVisible: false` — day view: **no change** (still 24
    ticks, single full-date header cell) — regression guard
- parity: `tooling/golden-runner/tests/parity.spec.ts` (+2
  assertions — see table above)
- adapter / SFC tests: NONE — adapter-layer passthrough only;
  changing `weekendsVisible` doesn't change the adapter API. The
  ~5 adapter tests that hard-code `weekendsVisible: true` stay
  unchanged.

Drift-detection summary: unit tests cover all 3 filter codepaths
(`planWeekView`, `planMonthView`, `planMonthBandedAxis`). Parity
assertions cover 2 of the 3 against rendered k-ui DOM. The
`planMonthView` codepath isn't exercised by k-ui demo's view
buttons under weekends-off, so unit-test coverage is the only
defense there — accepted.

## VRT impact

**None**. The chronix demo hard-codes `weekendsVisible: true` and
this phase does NOT change that. All 5 existing chronix VRT
baselines (`tooling/golden-runner/visual.snapshots/chronix-*.png`)
render with weekends-on and are unaffected.

A future phase could ADD chronix VRT baselines for the
weekends-off case (likely needs a `?weekends=false` URL toggle on
the demo + new baselines per view). Out of scope here; the
parity assertions are the cross-implementation guard.

## Execution plan — 1 commit + wrap-up

The parity discipline rule says algorithm + parity assertions land
in the SAME commit. Implementation + unit tests + parity
assertions are tightly coupled and modest in size (~150-200 LOC
total) — one commit keeps blast radius visible to the reviewer.

### Commit 1: `feat(gantt): weekendsVisible filters week/month/season/halfYear/year axis (Phase 18)`

- `packages/gantt/src/layout/axis-range-planner.ts`:
  - Add `isHiddenWeekendDay(d, weekendsVisible)` helper
  - Generalize `countDaysAcrossMonths` → `countVisibleDaysAcrossMonths(start, monthCount, weekendsVisible)`; update both call sites
  - Refactor `planWeekView` to walk visible days then hours; emit
    filtered ticks + dayCells; slotWidth recomputed
  - Update `planMonthView` to filter inside the day loop;
    `slotCount` from the new helper
  - Update `planMonthBandedAxis` to filter inside the day loop;
    `monthCells[m].width = visibleDaysInMonth × slotWidth`
  - `planDayView` unchanged + add a code comment citing the
    docstring rationale
- `packages/gantt/src/layout/types.ts`: rewrite the
  `weekendsVisible` JSDoc (delete "When false, ..." → expand with
  view-by-view semantics + bar-slicing park notice)
- `packages/gantt/src/layout/axis-range-planner.test.ts`: +8 tests
  per the coverage list above
- `tooling/golden-runner/tests/parity.spec.ts`: +2 tests (week
  dayCells set equality under weekends-off; halfYear slot count
  count equality under weekends-off). Both tests start by
  clicking the `显示周末` checkbox on the k-ui demo to flip it off,
  then proceed like the existing in-process parity tests.
- **Browser-verify**: cannot run the chronix demo with weekends-off
  (no toggle), so verification = (a) chronix unit tests green, (b)
  parity tests green against running k-ui demo at 8701 + chronix
  vitest in-process. The k-ui demo's `显示周末` checkbox is
  clicked once at test start; both new parity tests pass.
- **Anti-regression check**: existing 27 parity assertions stay
  green (they hard-code `weekendsVisible: true` so they're
  unaffected).

### Commit 2 (wrap-up — REQUIRES `/phase-close` invocation)

- `audit/journal/2026-05-13.md` (or new `2026-05-15.md` if today's
  journal doesn't exist yet — check at wrap time): "Phase 18 —
  weekendsVisible filter (DONE)" section citing commit shas, total
  test count, parity assertion count.
- Memory `project_gantt_rewrite_plan.md`: bump test count
  (374 → 382) + assertion count (27 → 29) + flip phase status
  (Phase 17 DONE → Phase 18 DONE).
- This doc's Status → DONE with commit shas.
- **Before flipping Status** OR adding the journal "DONE" section:
  invoke `/phase-close` skill. Skill's 6-step gate verifies:
  - parity.spec.ts has the 2 new assertions in the same commit as
    the implementation (this is the central discipline check)
  - audit/journal/ has a Phase 18 section
  - memory project_gantt_rewrite_plan.md updated
  - design doc status flipped

## Estimated scope

- Algorithm changes (axis-range-planner.ts): ~1 hour
- Unit tests (+8): ~45 minutes
- Parity assertions (+2 driving the k-ui weekends checkbox): ~1
  hour (incl. running against k-ui demo, debugging selector for
  `显示周末` checkbox)
- Types.ts JSDoc rewrite: ~10 minutes
- Browser/test verification: ~30 minutes
- Wrap-up commit + `/phase-close` invocation: ~30 minutes
- **Total: ~3.5–4 hours focused work.**

## Open questions for the user

1. **Approve filter location — inline inside each `planXxx` function
   (NOT a separate `WeekendFilterPass`)?** Rationale: slot width
   depends on slot count which depends on the filter; a post-pass
   would either need to re-derive slotWidth or accept wrong X
   positions. Recommended: inline.

2. **Approve k-ui-exact day-of-week filter (`dow === 0 || dow === 6`
   when `!weekendsVisible`)?** Matches `DateProfileGenerator.ts:389`.
   Recommended: yes.

3. **Approve `planDayView` stays unchanged (day view never filters
   weekends)?** Matches `types.ts` docstring scope _"week-and-wider
   views"_. K-ui's `trimHiddenDays` actually nukes the day-view
   render entirely on a weekend anchor — chronix's no-filter
   behavior is more forgiving and matches the docstring.
   Recommended: yes, keep planDayView unchanged + add a code
   comment + clarify the docstring.

4. **Approve dense-packed tick X positions post-filter (no visual
   gaps where weekends would be)?** Matches k-ui's `slotDates`-is-
   dense rendering. Recommended: yes.

5. **Approve PARKING bar-slicing for hidden weekend days**
   (`TimelineLaneSlicer` equivalent)? Bars whose timestamps fall on
   Sat/Sun render at their raw `(t - axisStart) × pxPerMs` offset
   in chronix v0; k-ui slices them out. Documented as ⏸️ in the
   catalog. Recommended: yes — keeps Phase 18 axis-only.

6. **Approve PARKING generalized `hiddenDays: number[]`** (k-ui's
   per-dow-index hiding array)? `weekendsVisible: boolean` covers
   the demo's case + the 🔴 BLOCKING drift. Phase 18.1 if/when a
   host asks. Recommended: yes.

7. **Approve the 2 parity assertions in scope** (week dayCells set
   equality under weekends-off; halfYear slot count count equality
   under weekends-off)? Both drive the k-ui demo's `显示周末`
   checkbox and compare against in-process chronix planner output.
   Recommended: yes.

8. **Approve single-commit implementation** (algorithm + unit
   tests + parity assertions all together) + 1 wrap-up commit?
   Per parity discipline rule. Recommended: yes.

Reply **按照推荐继续** to accept all defaults (inline filter, k-ui-
exact dow check, day-view unchanged, dense tick X, park bar-slicing,
park hiddenDays array, 2 parity assertions, single-commit
implementation).
