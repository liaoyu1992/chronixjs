# Phase 30 — Bar stacking placement

**Status**: **DONE (2026-05-16)** — all 4 commits landed + /phase-close passed + ci-check green. See `audit/journal/2026-05-13.md` "Phase 30" section for full wrap-up.

## Problem

When two or more bars on the same row have overlapping time windows, k-ui distributes them across vertical "tracks" within the row — each bar gets its own Y coordinate so all are visible side-by-side vertically. Chronix renders all such bars at the **same Y coordinate** (`strip.y + padding`), so later-painted bars hide earlier ones. The visual result: one bar visible, others invisible until the user scrolls horizontally past the overlap.

User spotted this 2026-05-16 in their production data (`待排` row with two overlapping bars; only one rendered). Investigation:

- `packages/gantt/src/layout/bar-stack-height-pass.ts:84-105` `computeMaxLevel` correctly assigns each bar a `level` via greedy interval coloring (`assigned = l` on line 94 when a slot is found).
- **The level info is thrown away.** `BarStackHeightPassOutput` (`types.ts:136-144`) only exposes `heightsPerRow` and `heightByRowId`. No `levelByBarId` field exists.
- `bar-placement-pass.ts:46` places every bar at `y: strip.y + padding` — single Y per row, no level offset.
- Row HEIGHT correctly expands to fit the stacking (level 2 = 3 tracks = 3 × barHeight tall), but bars all sit at the top.

This is the canonical "formula correct, downstream consumer doesn't use the intermediate output" silent gap. The 4th-dimension layout-algorithm sweep (`audit/LAYOUT_ALGORITHM_GAP_SWEEP_2026-05-16.md`) cataloged it. PARITY_RECHECK.md row 78 had labeled `BarStackHeightPass formula` as 🟢 GREEN — true about formula equivalence, misleading about pipeline integrity.

## Reference (k-ui) behavior surface — full catalog

`SegHierarchy` (`packages/gantt/src/common/seg-hierarchy.ts:33-231`) and `event-placement.ts:44-146` together produce per-bar levelCoord (Y pixel offset within row) that downstream render code consumes.

| Item                                          | k-ui                                                                                                               | chronix v0                                                                                           | Reason                                                                                                                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Greedy interval coloring                      | `SegHierarchy.addSegs` (`seg-hierarchy.ts:62-150`) builds a per-row hierarchy assigning each seg a `level`         | ✅ DONE (Phase 2 — `bar-stack-height-pass.ts:84-105` `computeMaxLevel`)                              | Same algorithm; chronix's variant tracks only `maxLevel` per row instead of returning per-seg                                                                                 |
| Per-segment `levelCoord` (Y pixel offset)     | `SegHierarchy.toRects` (`seg-hierarchy.ts:212-231`) returns `{ ...entry, thickness, levelCoord }` per visible seg  | ❌ **NOT EXPOSED** — `BarStackHeightPassOutput` only returns heights, not per-bar levels             | ✅ **port Phase 30**: add `levelByBarId: ReadonlyMap<string, number>` to `BarStackHeightPassOutput`                                                                           |
| Per-segment Y consumption                     | `event-placement.ts:127-142` reads `rect.levelCoord` and emits `top: rect.levelCoord` per `TimelineSegPlacement`   | ❌ **NOT WIRED** — `bar-placement-pass.ts:46` uses `y: strip.y + padding` constant per row           | ✅ **port Phase 30**: `BarPlacementPass.place` emits `y: strip.y + padding + (level ?? 0) * (barHeight + spacing)`                                                            |
| Cross-pass data contract (Input/Output types) | k-ui colocates SegHierarchy + lane consumption in the same render function                                         | ❌ chronix `BarPlacementPassInput` doesn't include `levelByBarId`                                    | ✅ **port Phase 30**: add `levelByBarId?: ReadonlyMap<string, number>` + `barStackSpacing?: number` to `BarPlacementPassInput`                                                |
| Compose pipeline at adapter                   | k-ui inlines stacking + placement in the same render pass                                                          | chronix splits into separate passes via `useGanttLayout`                                             | ✅ **port Phase 30**: `useGanttLayout` threads `levelByBarId` from `BarStackHeightPass.compute` output into `BarPlacementPass.place` input                                    |
| Stacking spacing                              | k-ui has `eventSpacing` option (default ~1px)                                                                      | ✅ chronix has `barStackSpacing` (Phase 2 `BarStackHeightPassInput`, default 10px) — name divergence | ✅ already done; Phase 30 propagates the existing value into placement-pass without renaming                                                                                  |
| Test coverage for same-row overlapping bars   | k-ui has multi-event-per-resource fixtures                                                                         | ❌ `bar-placement-pass.test.ts` has NO scenario for multiple bars on the same row with time overlap  | ✅ **port Phase 30**: new test scenario(s) covering 2 + 3 + N same-row overlapping bars; assert distinct Y per stack level                                                    |
| Demo data exercises stacking                  | k-ui demo has resources with multiple same-day overlapping events                                                  | ❌ chronix sample-data (parity-mode AND default-mode) has NO same-row overlaps                       | ✅ **port Phase 30**: add at least one row to `sample-data.ts` AND `sample-data-parity.ts` with 2-3 overlapping bars so cross-demo VRT actually exercises the fixed behavior  |
| Cross-demo parity assertion                   | k-ui's behavior validated by user observation                                                                      | ❌ no parity assertion for stacked-bar Y                                                             | ✅ **port Phase 30**: cross-demo assertion comparing per-bar Y on an overlap-row — distinct level → distinct Y on both sides                                                  |
| Per-bar level callback                        | k-ui exposes `eventOrder` callback to influence stacking order; otherwise default sort by `(start, end)` ascending | chronix sorts by `(start, end)` ascending implicitly                                                 | ⏸️ **Defer-indefinite**: `eventOrder` is a customization hook; not in Phase 30 scope. Re-prioritize on consumer ask.                                                          |
| Stack-height cap (max levels)                 | k-ui has `eventMaxStack` (truncates after N tracks; shows "+more")                                                 | chronix stacks unbounded (no cap)                                                                    | ⏸️ **Defer-indefinite** (already in SILENT_GAP_SWEEP A.21 disposition register: "Max stacked events per visual column. Defer-indefinite.")                                    |
| Mirror geometry during drag                   | k-ui mirror clones the dragged event element with same level                                                       | chronix in-place mutation (no mirror) — level should follow the bar during drag-preview              | ⚠️ **needs verification**: during cross-row drag (Phase 9), the placedBar's Y is recomputed; does the new level recompute happen too? Phase 30 test must cover drag-preview Y |

**Phase 30 net surface**: 6 ✅-port items (interface field additions on 2 types + algorithm wiring in 3 places + 2 new test categories + demo-data fixture extension + cross-demo parity assertion), 2 ⏸️-defer items (already cataloged), 1 ⚠️ verification item.

## Approach

### Interface changes — `packages/gantt/src/layout/types.ts`

Add to `BarStackHeightPassOutput`:

```ts
export interface BarStackHeightPassOutput {
  readonly heightsPerRow: readonly number[];
  readonly heightByRowId: Map<string, number>;
  /**
   * Phase 30: per-bar stacking level (0 = top track, 1 = second track,
   * etc.). Populated for every bar that intersects the axis range; bars
   * outside the axis range are absent from the map. Used by
   * `BarPlacementPass` to assign Y offset within the row strip.
   */
  readonly levelByBarId: ReadonlyMap<string, number>;
}
```

Add to `BarPlacementPassInput`:

```ts
export interface BarPlacementPassInput {
  // ... existing fields ...

  /**
   * Phase 30: per-bar stacking level from `BarStackHeightPass`. When
   * present, bar Y = `strip.y + padding + level * (barHeight + barStackSpacing)`.
   * When absent (or bar id not in map), defaults to level 0 — single-track
   * placement, matching pre-Phase-30 behavior for callers that don't
   * thread the height-pass output through.
   */
  readonly levelByBarId?: ReadonlyMap<string, number>;

  /**
   * Phase 30: vertical spacing between stacked bars on the same row.
   * Must match `BarStackHeightPassInput.barStackSpacing` so the placed
   * bars fit within the row height the height-pass reserved. Default 10px
   * (same as the height-pass default for symmetry).
   */
  readonly barStackSpacing?: number;
}
```

### Algorithm changes

**`bar-stack-height-pass.ts`**:

Update `computeMaxLevel` to return both the max and the per-bar mapping. New signature:

```ts
function computeMaxLevelWithAssignments(
  bars: readonly { id: string; start: number; end: number }[],
): { maxLevel: number; levelByBarId: Map<string, number> };
```

Update the main `compute` function to:

1. Pass per-bar `id` into the sorting/assignment loop (currently strips ids).
2. Collect `levelByBarId` per row into a single Map that spans all rows.
3. Return it in the output struct.

**`bar-placement-pass.ts`**:

Update line 46 from:

```ts
y: strip.y + padding,
```

to:

```ts
const level = input.levelByBarId?.get(bar.id) ?? 0;
const stackSpacing = input.barStackSpacing ?? 10;
const explicitBarHeight = input.barHeight;
const offsetPerLevel = (explicitBarHeight ?? height) + stackSpacing;
// ...
y: strip.y + padding + level * offsetPerLevel,
```

(Refactor: compute `offsetPerLevel` once outside the loop since it doesn't depend on the bar; pass into the placement.)

**`adapters/vue3/src/use-gantt-layout.ts`** (lines 95-103):

Thread the level map through:

```ts
const stackHeightOutput = computed(() =>
  defaultBarStackHeightPass.compute({
    /* … */
  }),
);

const heightByRowId = computed(() => stackHeightOutput.value.heightByRowId);
// ...

const placementOutput = computed(() =>
  defaultBarPlacementPass.place({
    bars: toValue(input.bars),
    axis: axis.value,
    strips: strips.value,
    barHeight: toValue(input.barHeight ?? 30),
    barVerticalPadding: toValue(input.barVerticalPadding ?? 8),
    // Phase 30: thread per-bar level from stack-height pass.
    levelByBarId: stackHeightOutput.value.levelByBarId,
    barStackSpacing: toValue(input.barStackSpacing ?? 10),
  }),
);
```

Composable input type also gets an optional `barStackSpacing` reactive source.

### Sample data updates

Add 1 row to both `sample-data.ts` and `sample-data-parity.ts` with 2-3 same-row overlapping bars. Suggested structure:

```ts
// sample-data.ts
{ id: 'workshop-overlap-test', name: '待排', columns: { region: '海口', base: '空港维修基地', name: '待排' } }
// + 3 bars on workshop-overlap-test with overlapping time:
// bar-overlap-1: today 0h–10h
// bar-overlap-2: today 5h–15h
// bar-overlap-3: today 8h–18h
```

Same for parity mode. The k-ui-side demo data already includes overlapping events (per the user's screenshot showing `787机型-4C检查` + `73M-73N-起落架大修` on the `待排` row).

### Sample consumer (no API change for consumer)

Consumers don't need to do anything new — the fix is internal pipeline wiring. Existing consumers benefit transparently: bars that were overlapping silently now stack visually.

### Alternatives considered

- **Per-bar Y as composable's responsibility, not pass's**: Reject. The stacking algorithm + Y assignment must be co-located so changes to the algorithm propagate to Y math. Splitting them across passes preserves chronix's pass-architecture cleanliness — `BarStackHeightPass` owns "how many tracks + which bar to which track", `BarPlacementPass` owns "given those tracks, place each bar in pixel space". This is the cleanest decomposition.
- **Rename `barStackSpacing` to `eventSpacing`**: Reject. k-ui's name leaks "event" into chronix's "bar"-named IR. Keep `barStackSpacing` (already in `BarStackHeightPassInput` since Phase 2). Mirror the same name on `BarPlacementPassInput` for symmetry.
- **Inline `levelByBarId` directly on `PlacedBar` (output of placement pass)**: Reject. PlacedBar is the rendered geometry; level is a pre-placement input. Keeping them separate makes the data flow clearer + lets future readers see "level came from stack-height pass, geometry came from placement pass" at a glance.
- **Add `eventMaxStack` / `eventOrder` as part of Phase 30**: Reject. Both are customization hooks deferred to a future phase per existing PARITY_RECHECK disposition. Phase 30 scope is the minimum to close the visible-render gap; customization is layer-on later.
- **Use Phase 30 to also reshape the cross-pass interfaces for VirtualizedPaneLayout consumption**: Reject. `VirtualizedPaneLayout` output is a separate "computed but unused" gap (per the layout-algorithm sweep) with its own scope. Bundling would make Phase 30 a refactor, not a fix.

## Parity assertion plan — MANDATORY

| Assertion id (in parity.spec.ts)                            | Drives k-ui demo via                                                                   | Drives chronix demo via            | Compares                                                                                                                                                                                               | Tolerance |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| `phase30-stacking same-row overlapping bars get distinct Y` | `loadBothDemos` → default load with sample data that includes the new overlap-test row | same, parity-mode (`?parity=true`) | Per-bar `y` extracted via `extractBarsSnapshot` on the overlap-test-row ids; assert ≥3 distinct Y values per side; assert chronix Y ordering matches k-ui's (sorted by bar id) within `±2px` tolerance | y: ±2px   |
| `phase30-stacking non-overlapping bars still share Y`       | regression check: pick an existing single-bar-per-row row                              | same                               | Y of bar = `strip.y + padding` exactly (level 0); assert chronix Y == k-ui Y within 1px                                                                                                                | y: ±1px   |

Drift-detection scope:

- **Covered**: per-bar Y placement when bars overlap; non-overlapping bars regression.
- **NOT covered**: extreme stacking (10+ tracks) — bounded by row-height calculation correctness which is already tested in `bar-stack-height-pass.test.ts`. Rationale: if heights are right and per-bar Y is right for N ≤ 3, the formula extrapolates correctly for any N.
- **NOT covered**: drag-preview Y when crossing into a row with existing overlapping bars — gets verification flag ⚠️ in the catalog; if behavior regresses we add a Phase 30.1 follow-up.

## Test coverage

- **core**: `packages/gantt/src/layout/bar-placement-pass.test.ts` (+3 tests)
  - "places 2 overlapping same-row bars at distinct Y offsets"
  - "places 3 mutually-overlapping bars at level 0/1/2 with correct stack spacing"
  - "non-overlapping same-row bars all stay at level 0 (Y = strip.y + padding)"

- **core**: `packages/gantt/src/layout/bar-stack-height-pass.test.ts` (+3 tests)
  - "output.levelByBarId assigns level 0 to first sorted bar"
  - "output.levelByBarId tracks per-row assignments (different rows can reuse level 0 simultaneously)"
  - "output.levelByBarId omits bars outside axis range"

- **adapter**: `adapters/vue3/src/use-gantt-layout.test.ts` (+1 test)
  - "threads levelByBarId from stack-height pass into placement pass" (mount with overlapping bars; assert placedBars Y differs)

- **parity**: `tooling/golden-runner/tests/parity.spec.ts` (+2 cross-demo assertions per the table above)

Expected counts after Phase 30: vitest 515 → ~522 (+7); parity-spec 36 → 38 (+2); cross-demo verify scenarios 27 unchanged (uses existing demo wiring, new sample data won't add scenarios).

## VRT impact

**Some chronix-visual + cross-demo VRT baselines WILL need re-capture** because the demo gains a new overlap-test row + the existing rows' bars in some views may shift Y if any of them happen to overlap by ms.

Prediction:

- chronix-visual: 5 baselines re-capture if the demo gains a new row (visible chrome change).
- cross-demo VRT: any scenario that captures rows including the new overlap-test row will diff. Scenarios that don't include that row (or capture only a subset) stay clean. Probably 3-5 of the 15 vrt-\* scenarios need re-baseline.

Re-baseline plan: after Phase 30 implementation, run cross-demo verify; for any scenario where chronix-self diff is purely due to the new row appearing, re-capture. K-ui-side baselines stay unchanged.

## Execution plan — 3 commits + wrap-up

### Commit 1 (design doc, this commit) — REQUIRES user review of 3 load-bearing decisions

Lands only `audit/PHASE_30_BAR_STACKING_PLACEMENT_DESIGN.md`. Awaits user confirmation before implementation.

### Commit 2: Core — `BarStackHeightPass` exposes `levelByBarId` + `BarPlacementPass` consumes it

- `packages/gantt/src/layout/types.ts`: add `levelByBarId` to output, add `levelByBarId` + `barStackSpacing` to placement input.
- `packages/gantt/src/layout/bar-stack-height-pass.ts`: extract `computeMaxLevelWithAssignments`; pass bar ids through; populate `levelByBarId` Map.
- `packages/gantt/src/layout/bar-placement-pass.ts`: compute `y = strip.y + padding + level * (barHeight + spacing)`.
- `packages/gantt/src/layout/bar-stack-height-pass.test.ts`: +3 tests for `levelByBarId`.
- `packages/gantt/src/layout/bar-placement-pass.test.ts`: +3 tests for stacked-Y placement.
- Rebuild `@chronixjs/gantt` dist.
- ci-check green (vitest 515 → 521).

### Commit 3: Adapter — thread `levelByBarId` through `useGanttLayout` + composable test

- `adapters/vue3/src/use-gantt-layout.ts`: split `stackHeightOutput` computed; thread `levelByBarId` into placement input; add optional `barStackSpacing` to composable input.
- `adapters/vue3/src/use-gantt-layout.test.ts`: +1 integration test.
- ci-check green (vitest 521 → 522).

### Commit 4: Demo data + cross-demo parity assertions + VRT re-baseline

- `examples/gantt-vue3/src/sample-data.ts` + `sample-data-parity.ts`: add overlap-test row with 3 same-row overlapping bars.
- `tooling/golden-runner/tests/parity.spec.ts`: +2 phase30-stacking assertions.
- Run cross-demo verify; re-capture VRT baselines for scenarios where chronix-side diff is purely the new row.
- ci-check green; cross-demo-verify gate green.

### Commit 5 (wrap-up — REQUIRES /phase-close invocation)

- Journal: `audit/journal/2026-05-13.md` (continuation file) Phase 30 section.
- Memory: bump vitest 515 → 522 + Phase 30 DONE marker.
- Design doc Status → DONE.

## Estimated scope

| Commit                  | Hours   | LOC est.                                                                 |
| ----------------------- | ------- | ------------------------------------------------------------------------ |
| 1 (design doc)          | 1       | this file (~400 LOC)                                                     |
| 2 (core)                | 2       | ~50 LOC src + 80 LOC tests                                               |
| 3 (adapter)             | 1       | ~20 LOC src + 30 LOC tests                                               |
| 4 (demo + parity + VRT) | 2       | ~30 LOC sample data + 80 LOC parity assertions + 3-5 baseline re-capture |
| 5 (wrap-up)             | 0.5     | journal + memory + status flip                                           |
| **Total**               | **6.5** | ~290 LOC + 3-5 baseline PNGs                                             |

Within single-session discipline (per `feedback_quality_acceleration.md` constraint #3). Within the 6-8h estimate from the layout-algorithm sweep doc.

## Open questions for the user — 3 load-bearing decisions

**1. Sample-data row addition — where to place the overlap-test row** — recommended: **add to BOTH `sample-data.ts` (default mode) and `sample-data-parity.ts` (parity mode), with the same row id + same 3 bar shapes**.

- A: only parity mode (cross-demo VRT exercises it, chronix-visual doesn't)
- B: only default mode (chronix users see it; parity-mode doesn't exercise it)
- C: **both** (recommended) — chronix-visual baselines get the new row visible to humans inspecting the demo; parity assertions can run in either mode

Rationale: the gap is invisible until demo data exercises it; "both" is the cheapest way to guarantee future regression detection from any mode. ~10 LOC additional cost vs. ~5 LOC for one mode.

**Recommendation**: C (both).

**2. `barStackSpacing` default — keep 10px or align with k-ui's eventSpacing?**

- A: **Keep chronix default 10px** (current Phase 2 value; existing rows that happen to have overlaps will get noticeably-separated stacked bars)
- B: Match k-ui's `eventSpacing` ~1px (visually tighter, closer to k-ui's render; existing chronix users who relied on the 10px height calculation see stacked rows shrink)
- C: Make the default 10px but document that consumers should match k-ui by passing `barStackSpacing: 1` if exact-parity matters

Rationale: chronix's 10px default is established in Phase 2; changing it would cascade into row-height arithmetic for any chart that happens to have overlaps. Phase 30 should be a **pure pipeline fix**, not a behavior change for existing consumers. The visual difference between 10px and 1px is mostly aesthetic; consumers who need exact-parity can opt in via prop.

**Recommendation**: A (keep 10px).

**3. Cross-demo parity tolerance for stacked Y** — recommended: **±2px**

- A: **±2px** (recommended) — accommodates k-ui's vs chronix's slightly different `padding` defaults (k-ui's `eventMinHeight` + chronix's `barVerticalPadding`) without being so loose that a 1-track-off bug slips through
- B: ±1px (strict) — may fail flaky if `padding` defaults differ even slightly between adapter renders
- C: ±5px (lenient) — would mask a single-pixel cumulative-rounding bug

Rationale: chronix's `barVerticalPadding` default is 8px and stack-spacing is 10px (level 1 = +30+10 = +40px relative); k-ui's bar height is ~30px with `padding: 1px`. A +1-track bug = +40px diff → ±2px tolerance catches it cleanly. A 1px rendering-anti-aliasing diff doesn't fail.

**Recommendation**: A (±2px).

Reply **按推荐继续** to accept all three (C / A / A), or call out any 1-3 to override.
