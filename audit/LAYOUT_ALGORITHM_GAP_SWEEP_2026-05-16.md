# Layout-algorithm parity sweep (2026-05-16)

> 4th-dimension audit. Companion to:
>
> - `SILENT_GAP_SWEEP_2026-05-16.md` (1st dimension: Options surface).
> - `RENDER_LAYER_GAP_SWEEP_2026-05-16.md` (2nd + 3rd dimensions: render plus interaction code).
> - **This document** (4th dimension: layout-pass pipeline integrity — per-pass internal computation vs downstream consumption).

## Trigger

2026-05-16: user spotted that bars on the same row with overlapping
time in k-ui stack VERTICALLY (one above the other) while in chronix
they render at the same Y coordinate (visually overlapping). The user
wrote: "如果漏掉了，那我严重怀疑你的能力了."

Investigation confirmed:

- chronix `BarStackHeightPass` (`packages/gantt/src/layout/bar-stack-height-pass.ts`)
  computes per-bar `level` via greedy interval coloring at line 89, but
  **discards** the level info — only returns `heightByRowId`.
- chronix `BarPlacementPass` (`packages/gantt/src/layout/bar-placement-pass.ts:46`)
  places every bar at `y: strip.y + padding` — single Y per row.
- The level information **never reaches the placement pass**, so same-row
  overlapping bars always render at identical Y.
- `PARITY_RECHECK.md:78` labels this 🟢 GREEN with rationale "Same formula".
  The label is correct for the height formula but **misleading** about
  the pipeline integrity.

This was a "formula correct, downstream consumer doesn't use the
intermediate output" silent gap. No prior audit dimension was designed
to catch it.

## Methodology

Agent A4 walked chronix's 6-pass layout pipeline + k-ui's equivalent
code (`SegHierarchy`, `event-placement`, `TimelineLane`). For each pass,
it produced:

1. What chronix computes internally.
2. What it exposes via output.
3. What downstream passes actually consume.
4. The k-ui equivalent.
5. Gap with severity + visibility.
6. Disposition.

Raw A4 output archived (see synthesis trail in this commit's parent agent
transcript). This document is the synthesized findings with **independent
verification** of A4's claims against the chronix codebase.

## Agent A4 quality note — false-positive flagged

A4 reported `weekendsVisible: false` as 🔴 BLOCKING with rationale "flag
plumbed but never read in axis-range-planner; zero grep matches for
'weekend'". **This was wrong.** Independent verification (this audit
synthesis):

```text
$ grep -nE "weekend|isHidden|Saturday|Sunday|hiddenDay|getDay\(\)" \
    packages/gantt/src/layout/axis-range-planner.ts
68:  // European locales start the week on Monday...
74:  // getDay(): 0=Sun..6=Sat. Map to 0=Mon..6=Sun...
81:  // Whether the given date is a hidden weekend day...
89: function isHiddenWeekendDay(d: Date, weekendsVisible: boolean): boolean {
161:   weekendsVisible: boolean,
178:   const slotCount = countVisibleDaysAcrossMonths(start, 1, input.weekendsVisible);
201:     if (!isHiddenWeekendDay(cursor, input.weekendsVisible)) {
237:   const slotCount = countVisibleDaysAcrossMonths(start, monthCount, input.weekendsVisible);
266:       if (!isHiddenWeekendDay(cursor, input.weekendsVisible)) {
302:   // Pre-resolve the visible days...
309:     if (!isHiddenWeekendDay(day, input.weekendsVisible)) visibleDays.push(day);
```

`weekendsVisible` is read by `isHiddenWeekendDay` (line 89-91) and
applied in week / month / season / halfYear / year planners (lines
178, 201, 237, 266, 302, 309). **Phase 18 is implemented correctly.**

Lesson for the 4-dimension audit checklist: **agent claims about
"never read / never used" require independent grep verification before
acting on them**. A4's other claims (bar stacking pipeline, VirtualizedPaneLayout
unused, LinkRouter nub geometry) were verified against the codebase and
held up.

## Real findings (verified)

### 🔴 BLOCKING — Bar stacking placement broken (the user-spotted gap)

**Where**: cross-pass coupling between `BarStackHeightPass` and
`BarPlacementPass`.

**chronix internal computation**:

```ts
// bar-stack-height-pass.ts:89-105
function computeMaxLevel(bars) {
  const sorted = [...bars].sort((a, b) => a.start - b.start || a.end - b.end);
  const levelEnds = [];
  let maxLevel = 0;
  for (const bar of sorted) {
    let assigned = -1;
    for (let l = 0; l < levelEnds.length; l += 1) {
      const end = levelEnds[l];
      if (end !== undefined && end <= bar.start) {
        assigned = l; // ← per-bar level computed
        levelEnds[l] = bar.end;
        break;
      }
    }
    if (assigned === -1) {
      levelEnds.push(bar.end);
      assigned = levelEnds.length - 1;
    }
    if (assigned > maxLevel) maxLevel = assigned;
  }
  return maxLevel; // ← only maxLevel returned; assigned[] DROPPED
}
```

**chronix output type** (`packages/gantt/src/layout/types.ts:136-144`):

```ts
export interface BarStackHeightPassOutput {
  readonly heightsPerRow: readonly number[];
  readonly heightByRowId: Map<string, number>;
  // ❌ no levelByBarId — the level assignment is lost
}
```

**chronix downstream**: `bar-placement-pass.ts:46`:

```ts
placedBars.push({
  barId: bar.id,
  x: (startMs - axisStartMs) * pxPerMs,
  y: strip.y + padding, // ← EVERY bar gets same y per row
  width: (endMs - startMs) * pxPerMs,
  height,
});
```

**k-ui equivalent** (`packages/gantt/src/common/seg-hierarchy.ts:212-231`,
`event-placement.ts:127-142`):

```ts
// SegHierarchy.toRects() exposes per-segment levelCoord:
for (let level = 0; level < levelCnt; level += 1) {
  for (const entry of entriesByLevel[level]) {
    rects.push({ ...entry, thickness, levelCoord });
  }
}
// event-placement.ts:
top: rect.levelCoord; // ← per-segment Y, varies within row
```

**Visible-impact verification**:

- chronix demo sample data (`examples/gantt-vue3/src/sample-data.ts`)
  has **NO bars on the same row with overlapping time**. All same-row
  bars are time-disjoint (`workshop-a`: 1-5h, 8-12h, 15-22h; etc).
  Cross-demo VRT therefore cannot catch this gap with current demo
  data. The user spotted it in a **live screenshot of their actual
  data** which had `待排` row with two overlapping bars.

- Test gap: `bar-placement-pass.test.ts` has NO scenario for multiple
  bars on the same row with overlapping time. No assertion on per-bar
  Y differing across levels.

**Disposition**: ✅ **Planned Phase 30** — bar stacking placement.

### 🟡 NOTED — VirtualizedPaneLayout output unused

A4 confirmed (also matches `PARITY_RECHECK.md:307` "VirtualizedPaneLayout
computed but not wired into render" — already cataloged).

**Real status**: `visibleStripRange` / `visibleSlotRange` are computed
in the pass + threaded through `useGanttLayout` outputs, but the
adapter render loop iterates over **all** `placedBars` without
filtering by visible range. Grep of `adapters/vue3/src/` for
`visibleStripRange | visibleSlotRange` returns zero matches.

**Disposition**: ⏸️ **Defer-indefinite** (already in PARITY_RECHECK
register). Triggers: profiling shows render bottleneck with 500+ rows
OR consumer reports virtualization-required scenario.

### 🟡 NOTED — Day-view extra header row

A4 confirmed (already in `PARITY_RECHECK.md`, journal 2026-05-13
section "Phase 16 — Parity re-check Batch 5"). chronix's
`planDayView` emits a date label header row above hourly ticks
(`axis-range-planner.ts:121-123`); k-ui's `hour`-unit branch
suppresses this when `range ≤ 1 day`. Visual diff: chronix has an
extra header band on day view.

**Disposition**: 🟡 **Defer-indefinite** (P2 — visual nit; chronix's
render is arguably more informative).

### 🟡 NOTED — LinkRouter square nub geometry

A4 confirmed (already in `PARITY_RECHECK.md:291` P1 register).
chronix anchors the vertical leg at `fromX + 12` (12px right of
source); k-ui anchors at `toX - 20` (20px left of target). Same
topology, different X. Demo uses `smooth` routing, so not visible
in VRT.

**Disposition**: ⏸️ **Defer-indefinite** (already documented).

## Cross-pass data-contract gaps

### Gap A: BarStackHeightPassOutput missing `levelByBarId`

**Fix**: Add to `types.ts:136-144`:

```ts
export interface BarStackHeightPassOutput {
  readonly heightsPerRow: readonly number[];
  readonly heightByRowId: Map<string, number>;
  readonly levelByBarId: ReadonlyMap<string, number>; // ← NEW
}
```

### Gap B: BarPlacementPassInput missing `levelByBarId`

**Fix**: Add to `types.ts:173-197`:

```ts
export interface BarPlacementPassInput {
  readonly bars: readonly BarSpec[];
  readonly axis: PlannedAxis;
  readonly strips: readonly SwimlaneStrip[];
  readonly barHeight?: number;
  readonly barVerticalPadding?: number;
  readonly barStackSpacing?: number; // ← NEW (matches height-pass)
  readonly levelByBarId?: ReadonlyMap<string, number>; // ← NEW
}
```

### Gap C: useGanttLayout pipeline wiring

**Fix**: `adapters/vue3/src/use-gantt-layout.ts:95-103`:

```ts
const placementOutput = computed(() =>
  defaultBarPlacementPass.place({
    bars: toValue(input.bars),
    axis: axis.value,
    strips: strips.value,
    barHeight: toValue(input.barHeight ?? 30),
    barVerticalPadding: toValue(input.barVerticalPadding ?? 8),
    // NEW: thread level info from height pass to placement pass
    levelByBarId: stackHeightOutput.value.levelByBarId,
    barStackSpacing: toValue(input.barStackSpacing ?? 10),
  }),
);
```

## Disposition register additions

Adding to `PARITY_RECHECK.md` register:

| Item                                                                                                                                 | Disposition             | Trigger / rationale                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Bar stacking placement (level info computed but never threaded to BarPlacementPass; same-row overlapping bars render at identical Y) | **🚧 Planned Phase 30** | User-spotted 2026-05-16. PARITY_RECHECK row 78's 🟢 GREEN label was misleading (formula-only validation; pipeline integrity not checked). |
| BarStackHeightPassOutput interface contract: missing `levelByBarId` field                                                            | **🚧 Planned Phase 30** | Cross-pass data-contract gap; fixed as part of bar-stacking phase.                                                                        |
| BarPlacementPassInput interface contract: missing `levelByBarId` + `barStackSpacing` fields                                          | **🚧 Planned Phase 30** | Bundle with above.                                                                                                                        |

(VirtualizedPaneLayout unused + LinkRouter nub + day-view header row are
already cataloged; no new rows needed.)

## Audit-method lessons (for memory)

**4-dimension audit checklist** is now permanent. Each new phase doc +
audit-sweep MUST walk all 4:

1. **Options surface** — props, callbacks, type args, demo wiring (covered
   by `SILENT_GAP_SWEEP_2026-05-16.md` methodology).
2. **Render code** — SVG elements, CSS classes, render branches, per-view
   variations (covered by `RENDER_LAYER_GAP_SWEEP_2026-05-16.md`).
3. **Interaction code** — pointer handlers, hover/focus/keyboard/touch,
   animations, timers (covered by `RENDER_LAYER_GAP_SWEEP_2026-05-16.md`).
4. **Layout-algorithm pipeline integrity** — per-pass internal computation
   vs downstream consumption; "formula correct, output unused" class of
   silent gap (this document's methodology).

**Verification discipline**: agent claims about "never read / never used"
require independent grep verification before acting (A4's
`weekendsVisible` false-positive). Trust the algorithm but verify the
specific code claim before triaging.

**Demo coverage caveat**: cross-demo VRT cannot catch a gap if the demo
doesn't exercise the relevant scenario. Sample data needs to include
edge cases (same-row overlapping bars, hidden weekend toggle, etc.) OR
phase parity assertions need explicit data setup. The chronix demo's
sample-data is a parity-mode mirror of k-ui's demo data — both lack
same-row overlapping bars by coincidence, so VRT was silent on the
bar-stacking gap.

## Phase 30 design preview

(Full design doc forthcoming.)

**Scope**:

1. Extend `BarStackHeightPass.compute` to return `levelByBarId`.
2. Extend `BarPlacementPass.place` to accept `levelByBarId` +
   `barStackSpacing`, emit
   `y = strip.y + padding + (level ?? 0) * (barHeight + spacing)`.
3. Thread the level map through `useGanttLayout`.
4. Add `bar-placement-pass.test.ts` scenario: 3 same-row overlapping
   bars, assert 3 distinct Y offsets.
5. Add parity-spec cross-demo assertion: chronix demo's parity-mode
   gets a synthetic 3-bar-overlap row; assert chronix renders 3
   distinct Y vs k-ui renders 3 distinct levelCoord.
6. Re-baseline whichever VRT scenarios capture rows with the new
   overlap data.

**Estimated scope**: 6-8h (single session per quality-acceleration
constraints).

## Sources

- A4 agent raw output (archived in agent run transcript).
- Independent verification grep results in the "Agent A4 quality note"
  section above.
- chronix code: `packages/gantt/src/layout/{axis-range-planner,bar-stack-height-pass,bar-placement-pass,row-swimlane-layout,link-router,virtualized-pane-layout}.ts`.
- chronix adapter wiring: `adapters/vue3/src/use-gantt-layout.ts`.
- k-ui code: `packages/gantt/src/common/seg-hierarchy.ts`, `event-placement.ts`, `timeline/TimelineLane.tsx`.
