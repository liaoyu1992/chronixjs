# Phase 27 — Event continuation indicators (overflow triangles)

**Status**: **DONE (2026-05-16)** — all 5 commits landed + /phase-close passed + ci-check green. See `audit/journal/2026-05-13.md` "Phase 27" section for full wrap-up.

> **Implementation note (2026-05-16, mid-Phase-27)**: chronix's initial `isStart` / `isEnd` formula emitted triangles for bars entirely outside the axis range (bars from yesterday or tomorrow in a day-view session). The parity reference's `TimelineEvent` doesn't mount for bars without a visible segment, so its triangle count is strictly bars-overlapping-axis. Fix: gate the flags by `hasAxisOverlap = startMs < axisEndMs && endMs > axisStartMs` — bars not overlapping the axis get `isStart=true, isEnd=true` so the adapter skips both triangles. Caught by the cross-demo parity assertion (chronix=12/23/7 vs kui=10/13/6 in day/right/week before the gate; exact match after).

## Problem

In the parity reference's default demo, bars whose calendar range
extends beyond the current view's axis range render a small black
triangle indicator inside the bar — pointing LEFT when the bar
continues past the axis's left edge, pointing RIGHT when it
continues past the axis's right edge. The visual cue tells the user
"this bar exists in time beyond what's currently shown; switch
views or scroll to see the rest."

Chronix renders **none** of these triangles. Bars that span past
the axis just get clipped silently — a multi-week bar viewed in
day-view shows a half-bar with no hint that more exists.

User flagged this 2026-05-16 as the second-highest-visibility
silent gap on the render-layer sweep
(`audit/RENDER_LAYER_GAP_SWEEP_2026-05-16.md` Section H.6 ⭐).
The gap escaped every prior parity assertion for the same reason
as the grid-lines gap (Phase 26): bar-bbox parity diffs `(x, y,
width, height)` — bar geometry is identical with or without
continuation indicators on top.

The data needed to position every triangle is already in
`PlacedBar` (`x`, `y`, `width`, `height`) plus two new boolean
flags (`isStart`, `isEnd`) derived from comparing each bar's
`range` against the axis time bounds. No new layout pass, no new
data-model surface beyond two booleans.

## Reference (k-ui) behavior surface — full catalog

The render code lives in
`d:/work/k-ui/packages/gantt/src/timeline/TimelineEvent.tsx`:

- `isEventStart` / `isEventEnd` flags (264-265) read from
  `seg.isStart` / `seg.isEnd` — set during the bar-segmentation
  step before TimelineEvent renders.
- `isClippedStart` / `isClippedEnd` (292-298) — additional clipping
  detection based on rendered `x < 0` or `x + width > containerWidth`
  when `containerWidth` is provided. Drives a separate "lock
  triangle to container edge" branch.
- Left triangle points (313-328): when `isClippedStart`, apex at
  `(triangleMargin, centerY)` (locked to container); else when
  `!isEventStart`, apex at `(barX + triangleMargin, centerY)`
  (inside the bar's left edge).
- Right triangle points (330-348): mirror of left, locks to
  `containerWidth - triangleMargin` when `isClippedEnd`.
- Polygons rendered at 412-431 with `fill="#000"`, `opacity: 0.8`,
  `pointerEvents: 'none'`, classes
  `gantt-event-continuation-indicator gantt-event-continuation-{left,right}`.

Geometry constants:

- `triangleSize = 6` — half-base from apex (so total base is 12px,
  apex-to-base is 6px).
- `triangleMargin = 1` — inset from the bar's edge so the apex sits
  1px inside the bar body.
- `centerY = y + height / 2` — vertical center of the bar.

### Surface-level disposition table

| Item                                                                                                                                     | k-ui                                                                           | chronix v0                                                                                                                                                                                                                                                                                                                                                                                   | Reason |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Left continuation polygon `gantt-event-continuation-left` (apex at bar's left edge + triangleMargin, pointing left, 6px × 12px)          | `TimelineEvent.tsx:412-420` + points calc 313-328                              | ✅ **port** as `cx-gantt-bar-continuation-left`. Fill `#000`, opacity 0.8, pointer-events none.                                                                                                                                                                                                                                                                                              |
| Right continuation polygon `gantt-event-continuation-right` (mirror geometry, apex at bar's right edge − triangleMargin, pointing right) | `TimelineEvent.tsx:423-431` + points calc 330-348                              | ✅ **port** as `cx-gantt-bar-continuation-right`. Same fill/opacity/pointer-events as left.                                                                                                                                                                                                                                                                                                  |
| `isStart` flag derived from `seg.isStart` (bar's start within axis range)                                                                | `TimelineEvent.tsx:264` reads from segmentation output                         | ✅ **port** as `PlacedBar.isStart: boolean` derived in `BarPlacementPass.place` from `bar.range.start.getTime() >= axisStartMs`                                                                                                                                                                                                                                                              |
| `isEnd` flag derived from `seg.isEnd` (bar's end within axis range)                                                                      | `TimelineEvent.tsx:265`                                                        | ✅ **port** as `PlacedBar.isEnd: boolean` derived from `bar.range.end.getTime() <= axisEndMs` (where `axisEndMs = axisStartMs + slotCount × slotDurationMs`)                                                                                                                                                                                                                                 |
| `isClippedStart` / `isClippedEnd` flags (additional clipping past container viewport)                                                    | `TimelineEvent.tsx:292-298` consumes `containerWidth` prop                     | ⏸️ **Defer-indefinite** — requires wrapper scroll-viewport tracking (chronix's `cx-gantt-wrapper` has scrollLeft / clientWidth state; not currently threaded into render). Bundle with Phase 23 (sidebar dual-scrollport) integration when viewport tracking lands. v0 covers `!isStart` / `!isEnd` only — the user-visible case where the bar's calendar range extends past the axis range. |
| `triangleSize: 6`, `triangleMargin: 1` constants                                                                                         | `TimelineEvent.tsx:306-307`                                                    | ✅ **port** as module-level constants in `chronix-gantt.ts` (private helper consts; not exposed). Match k-ui's values for visual parity.                                                                                                                                                                                                                                                     |
| `opacity: 0.8`, `fill: '#000'` inline style                                                                                              | `TimelineEvent.tsx:419, 428`                                                   | ✅ **port** as inline attributes on the polygon. Theme tokens NOT added in v0 — the indicators are deliberately one-color visual cues (a custom-color "continuation" loses the universally-recognized meaning). Re-prioritize if a consumer asks for theming.                                                                                                                                |
| `pointer-events: 'none'`                                                                                                                 | `TimelineEvent.tsx:419, 428`                                                   | ✅ **port** — triangles must not intercept clicks on the bar body underneath.                                                                                                                                                                                                                                                                                                                |
| Triangle render placement (sibling of bar background rect, inside same SVG `<g>` per event)                                              | `TimelineEvent.tsx:351-432` — all inside one event `<g>`                       | ✅ **port** as per-bar sibling in chronix's existing flatMap per `placedBar`. Triangles emit AFTER the bar's main rect (default render) or after the custom-slot output so they paint on top, then before the progress fill / handle so they don't get covered by those.                                                                                                                     |
| Mirror continuation indicator animation during drag                                                                                      | `dnd/ElementMirror.ts:233-401` updates `points` reactively as the mirror moves | ❌ **Reject** — chronix uses in-place mutation (no mirror, Phase 9 decision; documented in PARITY_RECHECK). The bar's main rect already shifts during drag; triangles re-derive on the next render from updated `placedBar` data, no special animation path needed.                                                                                                                          |
| Bars with text-positioning adjusted to avoid triangle overlap                                                                            | `TimelineEvent.tsx:577-600`                                                    | ⏸️ **Defer-indefinite** — chronix has no default bar-text auto-render in v0 (Phase 28.2 will). When Phase 28.2 lands, fold this into its design — until then there's no text to displace.                                                                                                                                                                                                    |

**Phase 27 net surface**: 5 ✅-port items (2 polygons + 2 flag
fields + geometry constants), 1 ⏸️-defer item (`isClippedStart` /
`isClippedEnd` — viewport clipping), 2 ❌-reject items (mirror
animation, theme tokens), 1 ⏸️-defer cascading on Phase 28.2 (text
position).

## Approach

### Layout-pass change — `BarPlacementPass.place` adds `isStart` / `isEnd` to `PlacedBar`

Add to `packages/gantt/src/layout/types.ts`:

```ts
export interface PlacedBar {
  readonly barId: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /**
   * Phase 27: `true` when this bar's `range.start` falls AT OR
   * AFTER the axis's first tick (i.e. the bar's left edge is
   * inside the visible time range). `false` when the bar started
   * before the axis range — the render layer emits a left-pointing
   * continuation triangle in that case.
   *
   * NOT the same as "rendered x is inside the viewport scroll
   * window" — that's a separate viewport-clipping concern deferred
   * to a future phase. This flag tracks the bar's calendar range
   * vs the axis's time range only.
   */
  readonly isStart: boolean;
  /**
   * Phase 27: `true` when this bar's `range.end` falls AT OR
   * BEFORE the axis's end (`axisStartMs + slotCount × slotDurationMs`).
   * `false` when the bar extends past the axis range — the render
   * layer emits a right-pointing continuation triangle in that case.
   */
  readonly isEnd: boolean;
}
```

Update `bar-placement-pass.ts` (currently 73 LOC) to populate both
fields. The math:

```ts
const axisStartMs = input.axis.ticks[0]?.time.getTime() ?? 0;
const axisEndMs = axisStartMs + input.axis.slotCount * input.axis.slotDurationMs;
// ...
for (const bar of input.bars) {
  // ... existing strip / level / xy computation ...
  const startMs = bar.range.start.getTime();
  const endMs = bar.range.end.getTime();
  placedBars.push({
    barId: bar.id,
    x: (startMs - axisStartMs) * pxPerMs,
    y: strip.y + padding + level * offsetPerLevel,
    width: (endMs - startMs) * pxPerMs,
    height,
    isStart: startMs >= axisStartMs,
    isEnd: endMs <= axisEndMs,
  });
}
```

For `weekendsVisible: false` views (where ticks are non-contiguous
in calendar time but `slotCount × slotDurationMs` still spans the
visible-day-count × MS_PER_DAY): the formula treats axis time as
contiguous, so a bar ending on a hidden Saturday will have
`isEnd = true` if the Saturday is still within the dense-packed
axis window. This matches chronix's existing v0 disposition
("bars on hidden weekend days render at their raw offset; not
sliced" — `axis-range-planner.ts` JSDoc). The continuation triangle
fires correctly for bars genuinely past the last visible day.

### Adapter render — per-bar sibling polygons in `chronix-gantt.ts`

In the existing `barChildren = placedBars.value.flatMap((bar) => {...})`
closure, AFTER pushing the bar's main rect (default-render `<rect>`
OR custom-slot output), AND BEFORE pushing the progress fill /
handle, append left + right triangle polygons when their flags
fire:

```ts
// ... after the bar rect push ...

if (!bar.isStart) {
  const apexX = renderX + TRIANGLE_MARGIN;
  const baseX = renderX + TRIANGLE_MARGIN + TRIANGLE_SIZE;
  const centerY = renderY + bar.height / 2;
  nodes.push(
    h('polygon', {
      key: `${bar.barId}-continuation-left`,
      class: 'cx-gantt-bar-continuation-indicator cx-gantt-bar-continuation-left',
      points: `${apexX},${centerY} ${baseX},${centerY - TRIANGLE_SIZE} ${baseX},${centerY + TRIANGLE_SIZE}`,
      fill: '#000',
      opacity: 0.8,
      'pointer-events': 'none',
    }),
  );
}

if (!bar.isEnd) {
  const apexX = renderX + renderWidth - TRIANGLE_MARGIN;
  const baseX = renderX + renderWidth - TRIANGLE_MARGIN - TRIANGLE_SIZE;
  const centerY = renderY + bar.height / 2;
  nodes.push(
    h('polygon', {
      key: `${bar.barId}-continuation-right`,
      class: 'cx-gantt-bar-continuation-indicator cx-gantt-bar-continuation-right',
      points: `${apexX},${centerY} ${baseX},${centerY - TRIANGLE_SIZE} ${baseX},${centerY + TRIANGLE_SIZE}`,
      fill: '#000',
      opacity: 0.8,
      'pointer-events': 'none',
    }),
  );
}

// ... existing progress fill / handle push ...
```

Constants (file-level private):

```ts
const TRIANGLE_SIZE = 6;
const TRIANGLE_MARGIN = 1;
```

`renderX` and `renderWidth` are the live-geometry values already
computed for the bar (accounts for in-flight drag deltaX); using
them ensures triangles follow the bar during a drag.

Triangles render for BOTH default-rect bars AND custom-slot bars —
they're chart-level indicators, not bar-content. A consumer using
`slotRegistry.get('bar')` to render a custom bar shape still gets
continuation triangles on top via the adapter's per-bar flatMap.
If a consumer explicitly doesn't want triangles, they hide via CSS
(`.cx-gantt-bar-continuation-indicator { display: none }`).

### Alternatives considered

- **Render-time flag derivation (no PlacedBar shape change)** —
  Reject. The flags are placement-pipeline outputs (derived from
  `bar.range` vs `axis` — both pure layout inputs), not render
  state. Co-locating with `BarPlacementPass`'s existing per-bar
  derivation means consumers see the flags via the same type
  contract as `x` / `y` / `width` / `height`. Unit-testable in
  `bar-placement-pass.test.ts`. Render-time inline would couple the
  formula to one consumer (the adapter render closure); a future
  consumer (e.g. virtualization to skip rendering entirely
  off-screen bars vs partially-clipped bars) would reinvent it.

- **`isClippedStart` / `isClippedEnd` viewport-clipping in v0** —
  Defer. Requires reactive wrapper-scroll tracking (`wrapper.scrollLeft`
  - `wrapper.clientWidth` reading + scroll-listener re-render); the
    wrapper geometry isn't currently threaded through Vue reactivity.
    Phase 23 (sidebar dual-scrollport) will introduce scroll-state
    tracking anyway; fold viewport clipping into Phase 23.1 follow-up.
    v0's axis-clipped triangles cover the user-flagged visual gap
    (bars whose calendar range extends past the view's axis range)
    without the additional complexity.

- **Separate `<g class="cx-gantt-bar-continuations">` group above
  the `<g class="cx-gantt-bars">` group** — Reject. Per-bar sibling
  matches chronix's existing flat-flatMap pattern (progress fill +
  handle are already siblings of the bar rect in the same per-bar
  nodes array). Separate group would complicate the slot-registry
  interaction (custom slot's bar would be in one group, its triangles
  in another) and provide no paint-order benefit since polygons are
  `pointer-events: none` anyway.

- **Theme tokens for triangle fill / opacity** — Reject for v0.
  Continuation indicators have universally-recognized semantics
  (left/right arrow at edge = "continues that direction"); the
  black-with-0.8-opacity convention reads clearly on any bar fill
  including chronix's blue / k-ui's various colors. Adding two
  more `ChronixTheme` tokens (4 → 6 since Phase 26 added 3
  grid-line tokens) for a feature that has no styling-request
  history would be premature. Re-prioritize on consumer ask;
  the catalog-completeness CI gate ensures the cluster gets
  re-considered.

- **Reuse Phase 26's grid-render block (emit triangles in
  `cx-gantt-grid` group)** — Reject. Triangles are per-bar
  decorations, not per-axis. They depend on `placedBar.isStart` /
  `isEnd`, not on `axis.ticks`. Mixing the two would create a
  cross-concern coupling for no benefit.

- **Mirror animation during drag (k-ui's `updateTriangleIndicators`
  in `ElementMirror.ts`)** — Reject. Chronix uses in-place mutation
  (no mirror, Phase 9). The next render after a drag-advance
  re-derives `placedBar` (via `bar-drag-transaction`'s `deltaX`
  applied to `bar.range`) — if the drag moves a bar's start past
  the axis edge, the flag flips and the triangle appears in the
  next frame. No special animation path needed.

## Parity assertion plan — MANDATORY

This phase modifies `packages/gantt/src/layout/bar-placement-pass.ts`
(layout) AND `adapters/vue3/src/chronix-gantt.ts` (render). Parity
assertions are mandatory.

| Assertion id (in parity.spec.ts)                                       | Drives k-ui demo via             | Drives chronix demo via            | Compares                                                                                                                                                                                                                                                                                                   | Tolerance                  |
| ---------------------------------------------------------------------- | -------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `phase27-continuation-left count parity (day view)`                    | `loadBothDemos` → viewId `day`   | same, parity-mode (`?parity=true`) | Count of left-pointing continuation indicators (chronix `.cx-gantt-bar-continuation-left`; k-ui `.gantt-event-continuation-left`)                                                                                                                                                                          | Exact equality             |
| `phase27-continuation-right count parity (day view)`                   | `loadBothDemos` → viewId `day`   | same                               | Right-pointing indicator count (chronix `.cx-gantt-bar-continuation-right`; k-ui `.gantt-event-continuation-right`)                                                                                                                                                                                        | Exact equality             |
| `phase27-continuation-left count parity (week view)`                   | `loadBothDemos` → viewId `week`  | same                               | Same as day-view left assertion but in week view — different bar subset triggers triangles (multi-week bars; bars starting before Mon)                                                                                                                                                                     | Exact equality             |
| `phase27-no-triangles-on-fully-contained-bars regression (month view)` | `loadBothDemos` → viewId `month` | same                               | Total triangle count (left + right). Month view (30-day axis) should have FEWER triangles than day-view (24-hour axis) since more bars fit fully. Asserts chronix's count `<=` k-ui's (chronix's `isEnd` is more lenient if any bar's end coincides with day boundary — see `weekendsVisible:false` note). | chronix count ≤ k-ui count |

Selectors queried via `page.evaluate(() => document.querySelectorAll(selector).length)`
inline in each test. New `reference-dom-map.ts` exports:
`CONTINUATION_LEFT` / `CONTINUATION_RIGHT` so chronix test code
never names the upstream classes inline.

### Drift-detection scope

- **Covered**: structural counts of left + right indicators across
  3 views (day / week / month). Each view exercises a distinct
  axis time range, so different subsets of bars trigger triangles —
  the assertions catch axis-range-vs-bar-range divergence in either
  direction.
- **NOT covered**: per-bar x / y positions of the triangle. The
  triangle's apex is at `placedBar.x + TRIANGLE_MARGIN` (chronix) /
  `barX + triangleMargin` (k-ui); both demos use the same `1` margin
  and `6` size constants. Per-bar x parity is implied by the
  existing `extractBarsSnapshot` bar-bbox parity (Phase 17/20.5) —
  if `placedBar.x` agrees with k-ui's `barX`, the apex x agrees
  too.
- **NOT covered**: triangle fill color / opacity. Both demos
  hard-code `#000` / `0.8`; no theme cascade today.
- **NOT covered**: per-bar id-pairing of triangles. A future
  follow-up could assert "bar id X has a triangle on both demos"
  via `data-bar-id` proximity, but for v0 count-parity catches the
  load-bearing divergence (formula mismatch → off-by-N triangles
  on one side).

### chronix-new declaration — N/A

Phase 27's left + right triangle indicators have direct k-ui
counterparts (`gantt-event-continuation-{left,right}`). The flag
derivation in chronix (`PlacedBar.isStart`/`isEnd`) is internally
chronix-named but the rendered DOM has matching class semantics.
No chronix-new declaration needed.

## Test coverage

- **core**: `packages/gantt/src/layout/bar-placement-pass.test.ts`
  (+5 tests):
  - "`PlacedBar.isStart` is true when bar starts at axis start"
  - "`PlacedBar.isStart` is false when bar starts before axis start"
  - "`PlacedBar.isEnd` is true when bar ends at axis end"
  - "`PlacedBar.isEnd` is false when bar ends past axis end"
  - "bar fully contained in axis range has both `isStart` and `isEnd` true"

- **adapter**: `adapters/vue3/src/chronix-gantt-continuation.test.ts`
  (new, ~6 tests):
  - "emits no `cx-gantt-bar-continuation-*` polygons when every bar has `isStart && isEnd`"
  - "emits one `cx-gantt-bar-continuation-left` per bar with `isStart === false`"
  - "emits one `cx-gantt-bar-continuation-right` per bar with `isEnd === false`"
  - "emits BOTH left + right indicators for a bar that spans across the entire axis"
  - "left triangle apex x is at `placedBar.x + 1` (TRIANGLE_MARGIN)"
  - "polygon has `pointer-events: none` (no hit-test interference with bar body)"

- **parity**: `tooling/golden-runner/tests/parity.spec.ts`
  (+4 assertions per the parity-assertion table above).

Expected counts after Phase 27: vitest 532 → ~543 (+11);
parity-spec 42 → 46 (+4); cross-demo verify scenarios 27 unchanged.

## VRT impact

**Re-baseline required** for any chronix-side baseline whose
captured bars now show triangles. Predicted churn:

- **chronix-visual baselines**: views where bars genuinely span
  past the axis range. Day view shows the most (most bars span
  multiple hours / days); week and longer views show fewer. All 5
  baselines likely diff, but the per-baseline pixel delta will be
  small (each triangle is ~6×12 px black; total continuation
  decoration per baseline is ~10-30 pixels of black).
- **cross-demo VRT baselines**: the 15 chronix-side scenarios all
  capture bars; most will gain triangles. K-ui-side baselines stay
  unchanged (k-ui already emits the same triangles).

Predicted re-baseline count: 5 chronix-visual + ~10-15 cross-demo
vrt scenarios = ~15-20 PNGs. Same workflow as Phase 26.

`maxDiffPixelRatio: 0.001` tolerance may pass some scenarios
without explicit re-capture if the triangles happen to be small
enough fractions of the captured area; previous phase showed only
3 of 27 cross-demo + 4 of 5 chronix-visual actually failed verify
(many baselines re-capture identically but the file mtime
changes).

## Execution plan — 4 commits + wrap-up

### Commit 1 (design doc, this commit) — REQUIRES user review of 3 load-bearing decisions

Lands only `audit/PHASE_27_CONTINUATION_INDICATORS_DESIGN.md`.
Awaits user confirmation of the 3 questions in the "Open questions"
section before implementation.

### Commit 2: Core — `PlacedBar.isStart` / `isEnd` + 5 bar-placement-pass tests

- `packages/gantt/src/layout/types.ts`: add `isStart: boolean` +
  `isEnd: boolean` to `PlacedBar`.
- `packages/gantt/src/layout/bar-placement-pass.ts`: compute
  `axisEndMs`; populate both fields per bar.
- `packages/gantt/src/layout/bar-placement-pass.test.ts`: +5 tests
  per Test coverage section.
- Rebuild `@chronixjs/gantt` dist: `pnpm --filter @chronixjs/gantt build`.
- ci-check green (vitest 532 → ~537).

### Commit 3: Adapter — body SVG triangle emission + 6 adapter tests

- `adapters/vue3/src/chronix-gantt.ts`:
  - Add `TRIANGLE_SIZE` / `TRIANGLE_MARGIN` file-level constants.
  - In the `barChildren` flatMap closure, push left + right
    polygons when `!bar.isStart` / `!bar.isEnd` respectively. Insert
    BETWEEN the bar's main rect (default or custom-slot output) and
    the progress fill/handle.
- `adapters/vue3/src/chronix-gantt-continuation.test.ts` (new, ~6 tests).
- ci-check green (vitest 537 → ~543).

### Commit 4: Parity assertions + VRT re-baseline

- `tooling/golden-runner/src/reference-dom-map.ts`: +2 selectors
  (`CONTINUATION_LEFT`, `CONTINUATION_RIGHT`).
- `tooling/golden-runner/tests/parity.spec.ts`: +4 phase27-\*
  count-parity assertions per the parity-assertion table.
- Run cross-demo verify; for chronix-side scenarios that diff,
  re-capture (predicted 10-15 of 27).
- Run chronix-visual verify; re-capture failing baselines
  (predicted 4-5 of 5).
- ci-check green; cross-demo-verify gate green (27/27).

### Commit 5 (wrap-up — REQUIRES /phase-close invocation)

Before flipping this design doc's Status to DONE OR adding the
"Phase 27 — DONE" section to `audit/journal/`, MUST invoke
`/phase-close` skill. The skill verifies the 7 standard gates
(parity assertions present, journal section written, memory
updated, design status DONE, + catalog-completeness CI gate
green, + cross-demo-verify gate green, + prettier-clean tree).

- `audit/journal/2026-05-13.md` (continuation): "Phase 27 —
  Event continuation indicators (DONE, YYYY-MM-DD)" section
  per the strict 6-sub-section template.
- `memory/project_gantt_rewrite_plan.md`: bump vitest 532 → 543;
  parity-spec 42 → 46; add Phase 27 DONE marker.
- `audit/PHASE_27_CONTINUATION_INDICATORS_DESIGN.md` Status → DONE.

## Estimated scope

| Commit                      | Hours | LOC est.                                           |
| --------------------------- | ----- | -------------------------------------------------- |
| 1 (design doc)              | 1     | this file (~420 LOC)                               |
| 2 (core flags + 5 tests)    | 1.5   | ~20 LOC src + ~80 LOC tests                        |
| 3 (adapter + 6 tests)       | 2.5   | ~50 LOC src + ~150 LOC tests                       |
| 4 (parity + VRT rebaseline) | 2.5   | ~120 LOC parity tests + 15-20 baseline re-captures |
| 5 (wrap-up)                 | 0.5   | journal + memory + status flip                     |
| **Total**                   | **8** | ~420 LOC + 15-20 baseline PNGs                     |

Within single-session discipline (per
`feedback_quality_acceleration.md` constraint #3). Matches the
RENDER_LAYER_GAP_SWEEP Phase-27 row estimate of 6-8h.

## 4-dimension audit check

Per `feedback_4_dimension_audit_checklist.md`, this phase
explicitly walks all 4 audit dimensions:

| Dimension                     | Coverage in Phase 27                                                                                                                                                                                        |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Options surface**           | Zero — no new prop, no new theme token (deliberately, per Reject rationale). Matches k-ui's no-customization design.                                                                                        |
| **Render code**               | New per-bar polygon emission in `chronix-gantt.ts` (`<polygon>` × 2 per bar with `!isStart` / `!isEnd`). Both classes (`cx-gantt-bar-continuation-{left,right}`) emitted.                                   |
| **Interaction code**          | Zero impact — `pointer-events: none` on every polygon. Existing pointer-hit-test / pointer-handler tests untouched. Triangles paint above bar body but don't intercept clicks.                              |
| **Layout-algorithm pipeline** | `BarPlacementPass.place` gains 2 derived boolean outputs on `PlacedBar`. No new pass, no input change beyond what was already present (`bar.range`, `axis.ticks`, `axis.slotCount`, `axis.slotDurationMs`). |

The Layout-algorithm-pipeline-integrity dimension is the one that
historically hid silent gaps (per the Phase 30 bar-stacking
finding). Phase 27 has a clean cross-pass data flow:
`BarPlacementPass` writes `isStart`/`isEnd` → adapter renders
polygons consuming them. No intermediate-output drop risk; the
flags are consumed directly at the render layer that needs them.

## Open questions for the user — 3 load-bearing decisions

**1. Scope: A (axis-clipped only) vs B (axis-clipped + viewport-scroll-clipped)** — recommended **A**.

- **A** (recommended): triangle fires only when `bar.range` extends
  past the AXIS range (`!isStart` or `!isEnd`). Implementation
  contained to `BarPlacementPass` + adapter render; no scroll-state
  reactivity. Covers the user-flagged visual case (bars whose
  calendar range extends past the visible view's axis bounds).
- **B**: triangle ALSO fires when bar's rendered `x` extends past
  the wrapper's scrollLeft / clientWidth (matches k-ui's
  `isClippedStart`/`isClippedEnd`). Requires reactive wrapper
  scroll tracking + scroll-listener re-render path. Best done
  alongside Phase 23 (sidebar dual-scrollport) when wrapper-state
  tracking lands. Adds ~2-3h to the estimate.

**Recommendation**: **A**. Phase 23 (already roadmapped) will
introduce wrapper scroll-state plumbing; viewport clipping folds
into that phase naturally. Doing it now would duplicate effort.

**2. Flag derivation site: layout pass (extend PlacedBar) vs render-time inline in adapter** — recommended **layout pass**.

- **Layout pass** (recommended): `PlacedBar.isStart` / `isEnd`
  populated by `BarPlacementPass.place` from `bar.range` vs axis
  time bounds. PlacedBar grows from 5 fields to 7. Cleanly
  unit-tested in `bar-placement-pass.test.ts`; type contract
  ensures all consumers see the same flags.
- **Render-time inline**: adapter compares `bar.range.start` vs
  `axis.ticks[0].time` at render time inside the per-bar flatMap.
  Avoids PlacedBar shape change. Couples the formula to one
  consumer (render); a future consumer (virtualization,
  hit-test-priority) would reinvent it.

**Recommendation**: **layout pass**. Continuation flags are
placement-pipeline outputs (derived from layout inputs, consumed
by layout-pipeline downstream); the existing `PlacedBar.x` / `y` /
`width` / `height` are the closest precedent — also layout-derived.

**3. Render placement: per-bar sibling (each bar's flatMap returns rect + optional triangles + progress) vs separate `<g class="cx-gantt-bar-continuations">` group rendered after the bars group** — recommended **per-bar sibling**.

- **Per-bar sibling** (recommended): each bar's flatMap output
  includes `[main rect, optional left triangle, optional right
triangle, optional progress fill, optional progress handle, optional
progress label]`. Matches the existing flatMap pattern; no
  restructuring of the body-SVG children array. Triangles paint
  immediately after their bar — Z-order is scoped per-bar.
- **Separate group above bars**: collect all triangle nodes into a
  separate `<g class="cx-gantt-bar-continuations">` rendered after
  the `<g class="cx-gantt-bars">` group. Cleaner paint isolation
  (all triangles always paint on top of all bars) but harder to
  reason about per-bar geometry, complicates the slot-registry
  interaction (custom slot's bar in one group, its triangles in
  another).

**Recommendation**: **per-bar sibling**. The progress fill +
handle are already siblings of the bar rect in the same flatMap;
triangles join them naturally. Custom-slot users get triangles
"for free" because the flatMap appends them after slot output, not
inside the slot.

Reply **按推荐继续** to accept all three (A / layout pass /
per-bar sibling), or call out any 1-3 to override.
