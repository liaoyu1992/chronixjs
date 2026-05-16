# Phase 26 — Grid lines (vertical cell-boundary + week-start emphasis + horizontal row-bottom)

**Status**: **DONE (2026-05-16)** — all 5 commits landed + /phase-close passed + ci-check green. See `audit/journal/2026-05-13.md` "Phase 26" section for full wrap-up.

> **Implementation note (2026-05-16, mid-Phase-26)**: the design's
> dashed-sub-slot branch turned out to be dead code in the parity
> reference's default demo — k-ui's `cellBoundarySlots` covers every
> rendered tick (because its innermost `cellRow` has one cell per
> tick), so the `gantt-grid-vline-dashed` branch only fires when a
> host configures `slotDuration < cell duration`, which neither side
> exposes today. Chronix v0 matches by treating every tick as a
> cell-boundary — the `cx-gantt-grid-vline-dashed` class never
> renders. The dashed branch is documented in the catalog below for
> future-phase reference (when chronix grows sub-tick subdivisions),
> but no chronix code emits it. Design-doc dispositions for items
> referencing the dashed branch are flipped to ⏸️-defer.

## Problem

In every k-ui demo screenshot the body SVG carries a visible grid of
vertical and horizontal lines:

- one **solid 1-px vertical line** at every "cell-boundary" slot (the
  x position where an outer header cell starts — e.g. the start-of-month
  x in season view, the start-of-day x in week view, the start-of-day x
  in day view);
- one **dashed 1-px vertical line** (`strokeDasharray="2,2"`) at every
  non-cell-boundary slot (sub-slot dividers — e.g. each hour within a
  day in week view);
- the cell-boundary line gets a **darker fill** when the boundary
  coincides with the start of an ISO week (Monday), so multi-month
  views read with subtle weekly grouping;
- one **horizontal 1-px line** at every row's bottom edge, snapped to
  the device-pixel grid so the stroke stays single-weight under
  non-integer row geometry and non-100% OS scaling.

Chronix's body SVG today renders **none** of these. The body has only:

```
[ defs, todayCellBodyNode, todayLineBodyNode, bars group, links group ]
```

— a flat white background between bars and links. Side-by-side with
the k-ui demo, the visual difference is immediate: k-ui's chart looks
like a calendar grid, chronix's looks like floating bars on a blank
canvas. The user called this out 2026-05-16 as the highest-visibility
silent gap on the render-layer sweep
(`audit/RENDER_LAYER_GAP_SWEEP_2026-05-16.md` Sections H.1 / H.2 /
I.2 / O.1).

The gap escaped every prior parity assertion because:

- **Cross-demo bar-bbox parity** (`extractBarsSnapshot` + `diffBarsSnapshots`)
  diffs bar `(x, y, width, height)` — bar geometry is identical with or
  without grid lines.
- **Tick / header-cell parity** (Phase 20.5 channels) covers axis labels —
  grid lines are separate render branches with no labels.
- **VRT screenshots** capture the body but the chronix-side baselines
  themselves never had lines, so a clean re-capture of "chronix is
  internally consistent" stayed green forever.

The gap is also the cleanest possible **render-only addition**: the
data needed to position every line is already in `PlannedAxis` (`ticks`
and `headerRows`) and `SwimlaneStrip[]` (output of `RowSwimlaneLayout`).
No new layout pass, no IR change. Just one SVG group to insert into
the body, between `todayCellBodyNode` and `todayLineBodyNode`.

## Reference (k-ui) behavior surface — full catalog

The render code lives in `d:/work/k-ui/packages/gantt/src/resource-timeline/GanttView.tsx`:

- `appendVerticalSlotSeparators` (914-1010) — the per-slot vline branch
  (solid cell-boundary `gantt-grid-vline` + dashed sub-slot
  `gantt-grid-vline-dashed` + week-start `gantt-grid-vline-week` darker
  fill + right-edge closing rect).
- `snapHorizontalGridLineY` (1034-1057) — DPR-aware half-integer snap so
  `<line>` strokes stay 1-device-pixel thick under fractional CSS row
  height and 125% / 150% OS scaling.
- `renderGridLines` (1062-1108) — composes the body grid: calls
  `appendVerticalSlotSeparators` with `keyPrefix: 'grid'`,
  `fillTodaySlotHighlight: true`, `showDashedNonBoundaries: true`, then
  emits one `<line class="gantt-grid-hline">` per row-bottom using the
  snap helper. `vectorEffect="non-scaling-stroke"` keeps the stroke
  weight stable under any future SVG zoom transform.

The CSS-variable cascade lives in
`d:/work/k-ui/packages/gantt/src/styles/core-css-inline.ts`:

- `--gantt-border-color` (umbrella, default `#ddd`) — used as the fill
  for non-week boundary vlines AND as the dashed sub-slot stroke.
- The same `--gantt-border-color` is referenced for the week-start vline
  fill but with a different fallback `#bbb` — so the visual hierarchy
  "week-start is darker" only holds in the default-unset state; once a
  user sets `--gantt-border-color`, both branches collapse to the same
  color. (Chronix does NOT replicate this quirk — see Approach.)
- `--gantt-grid-row-rule-color` (default `var(--gantt-border-color, #ddd)`)
  — independent override for horizontal row-bottom lines.

### Surface-level disposition table

| Item                                                                                                  | k-ui                                                                                              | chronix v0                                                                                                                                                                                                                                                                                                                                                                                  | Reason |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Vertical cell-boundary `gantt-grid-vline` (solid 1-px rect)                                           | `appendVerticalSlotSeparators` boundary branch (964-975)                                          | ✅ **port** as `cx-gantt-grid-vline`                                                                                                                                                                                                                                                                                                                                                        |
| Vertical sub-slot `gantt-grid-vline-dashed` (`<line>` with `strokeDasharray="2,2"`)                   | Non-boundary branch (976-990) when `showDashedNonBoundaries=true`                                 | ⏸️ **Defer-indefinite (mid-Phase-26 finding)** — k-ui's default demo emits ZERO dashed lines because its `cellBoundarySlots` derived from innermost `cellRow` covers every tick. Branch fires only when a host configures `slotDuration < cell duration`; chronix doesn't expose that knob in v0. Re-prioritize when chronix grows sub-tick views (e.g. half-hour subdivisions in day view) |
| Week-start emphasis `gantt-grid-vline-week` (darker fill on week-start cell boundaries)               | Boundary branch's `isWeekStart` flag from `tDateProfile.isWeekStarts[]`                           | ✅ **port** as `cx-gantt-grid-vline-week`; week-start derived inline at render time from `tick.time.getDay() === 1 && tick.time.getHours() === 0` (see Approach for why no `AxisTick.isWeekStart` field)                                                                                                                                                                                    |
| Right-edge closing rect (when `includeRightEdge`)                                                     | 993-1009                                                                                          | ✅ **port** — single closing solid vline at `axis.totalWidth - 1` so the rightmost cell visually closes                                                                                                                                                                                                                                                                                     |
| Horizontal row-bottom `gantt-grid-hline` (`<line>` with `vectorEffect=non-scaling-stroke` + DPR snap) | `renderGridLines` 1089-1105 + `snapHorizontalGridLineY` 1034-1057                                 | ✅ **port** as `cx-gantt-grid-hline`; port `snapHorizontalGridLineY` verbatim                                                                                                                                                                                                                                                                                                               |
| Header-row dividers (rect at `(r+1)*rowH - 1` between stacked outer header rows)                      | `renderTimelineHeader` 563-576                                                                    | ⏸️ **Defer-indefinite (out-of-scope for Phase 26)** — chronix has at most 1 outer header row today (`AxisHeaderRows.length === 1` for every view); k-ui's inter-band rect is meaningful only with ≥2 outer rows. Re-prioritize when chronix grows multi-band header (week-of-month, etc.)                                                                                                   |
| `--gantt-border-color` umbrella                                                                       | Default `#ddd`                                                                                    | ✅ **port** as theme token `gridLineColor` — used for both solid boundary AND dashed sub-slot                                                                                                                                                                                                                                                                                               |
| `--gantt-border-color` week-start fallback `#bbb`                                                     | Same CSS var, different fallback                                                                  | ✅ **port** as **separate** theme token `gridLineWeekStartColor` (default `#bbb`) — chronix does NOT replicate k-ui's quirk where setting `--gantt-border-color` collapses both branches; the two are independently themeable                                                                                                                                                               |
| `--gantt-grid-row-rule-color`                                                                         | Falls back to `var(--gantt-border-color, #ddd)` if unset                                          | ✅ **port** as theme token `gridLineRowRuleColor` (default `#ddd`)                                                                                                                                                                                                                                                                                                                          |
| `showDashedNonBoundaries` heuristic (defaults to `!(isTimeScale && slotsPerLbl > 1)`)                 | Body grid passes `true` explicitly                                                                | ✅ **port** equivalent: chronix always emits dashed at non-boundary slots (matches k-ui body-side behavior); the heuristic is moot because chronix's header doesn't draw the grid                                                                                                                                                                                                           |
| `fillTodaySlotHighlight` (per-slot today rect intermixed into the vline loop)                         | 950-962                                                                                           | ❌ **Reject** (already DONE differently — Phase 22.2) — chronix emits ONE `cx-gantt-today-cell` rect spanning the day, not per-hour-slot. Geometrically equivalent at day-resolution; for hourly day-view, k-ui tints 24 hourly cells that visually merge (P2 architectural divergence, already cataloged)                                                                                  |
| `cellBoundarySlots` Set derivation (`collectCellBoundarySlotSet`)                                     | 882-909 — builds Set from `cellRows` colspans                                                     | ✅ **port** equivalent: chronix derives the boundary Set from `axis.headerRows[0].cells.map(c => c.x)`. For 1-cell views (day, month, season+) this Set has 1-N entries; for week view it has 7 (or 5 with `weekendsVisible: false`)                                                                                                                                                        |
| Continuous reactivity to slot-width / view changes                                                    | k-ui re-renders on resize                                                                         | ✅ Vue reactivity — `axis` and `strips` are already computed refs; grid group rebuilds when either changes                                                                                                                                                                                                                                                                                  |
| Per-vline / per-hline custom callback                                                                 | k-ui has none (CSS-class-based theming only)                                                      | ❌ **Reject** — no consumer ask                                                                                                                                                                                                                                                                                                                                                             |
| Grid-toggle prop (`showGrid?: boolean`)                                                               | k-ui has none (grid always renders; consumers hide via CSS `.gantt-grid-vline { display: none }`) | ❌ **Reject** for v0 — match k-ui's always-on behavior. Consumers can hide via `.cx-gantt-grid-vline { display: none }`. Re-prioritize on consumer ask                                                                                                                                                                                                                                      |
| Per-line `data-*` attribute on vlines (slot index / boundary kind)                                    | k-ui emits none                                                                                   | ❌ **Reject** — no consumer ask; class names are enough for the parity-assertion count                                                                                                                                                                                                                                                                                                      |

**Phase 26 net surface**: 7 ✅-port items (3 vline branches +
right-edge + hline + DPR snap + boundary-set derivation), 3 theme tokens,
1 ⏸️-defer (inter-band header dividers — N/A for chronix's single-row
outer header), 4 ❌-reject items (each justified above).

The new chronix class names — `cx-gantt-grid-vline`,
`cx-gantt-grid-vline-dashed`, `cx-gantt-grid-vline-week`,
`cx-gantt-grid-hline` — all mirror k-ui's
`gantt-grid-vline` / `gantt-grid-vline-dashed` / `gantt-grid-vline-week` /
`gantt-grid-hline` with the chronix `cx-` prefix.

## Approach

### Render-time, in-adapter (no new layout pass)

The grid is purely a function of two already-computed inputs:

- `axis: PlannedAxis` — has `ticks: AxisTick[]` (each with `x`, `time`,
  `label`) and `headerRows: AxisHeaderRow[]` (outer-most band cell `x`
  positions).
- `strips: readonly SwimlaneStrip[]` — output of `RowSwimlaneLayout`; each
  has `y` and `height`.

Both flow through `useGanttLayout` and are reactive computed refs in the
adapter. The grid render attaches the new SVG group inline next to the
existing today-cell-tint and today-line groups; **no new pass**, no new
IR contract, no `packages/gantt/src/layout/**` code change.

This matches the pattern already in place for `todayCellBodyNode`
(Phase 22.2) and `todayLineBodyNode` (Phase 21) — both render-time
inline computations. Promoting grid to a 7th layout pass would
over-engineer a ~30-LOC formula.

### Body SVG insertion point — `adapters/vue3/src/chronix-gantt.ts`

Insert the new `<g class="cx-gantt-grid">` BETWEEN `todayCellBodyNode`
and `todayLineBodyNode`:

```ts
// chronix-gantt.ts:1831-1837 (existing)
[
  h('defs', { class: 'cx-gantt-defs' }, defsChildren),
  ...(todayCellBodyNode ? [todayCellBodyNode] : []),
  // ⭐ Phase 26 insertion (NEW):
  gridGroupNode, // <g class="cx-gantt-grid"> with vline / vline-dashed / vline-week / hline children
  ...(todayLineBodyNode ? [todayLineBodyNode] : []),
  h('g', { class: 'cx-gantt-bars' }, barChildren),
  h('g', { class: 'cx-gantt-links', 'pointer-events': 'none' }, linkPathNodes),
];
```

SVG paint order matches k-ui's: today-cell tint paints first (deepest
background), grid lines paint on top of the tint, today-line paints on
top of grid, bars paint on top of today-line, links paint on top of
bars. The same visual layering the user expects from the k-ui demo.

### Vline geometry

```ts
// Pseudocode for the grid-group children build:
const boundaryXSet = new Set<number>();
for (const cell of axis.headerRows[0]?.cells ?? []) {
  boundaryXSet.add(cell.x);
}
// Right-edge closing line: at the rightmost cell's (x + width) - 1
const rightEdgeX = axis.totalWidth - 1;

const vlineChildren: VNode[] = [];
const isDailySlot = axis.slotDurationMs === MS_PER_DAY;
for (const tick of axis.ticks) {
  const isBoundary = boundaryXSet.has(tick.x);
  const isWeekStart = isBoundary && tick.time.getDay() === 1 && tick.time.getHours() === 0;

  if (isBoundary) {
    vlineChildren.push(
      h('rect', {
        key: `vline-${tick.x}`,
        class: isWeekStart ? 'cx-gantt-grid-vline cx-gantt-grid-vline-week' : 'cx-gantt-grid-vline',
        x: tick.x - 1,
        y: 0,
        width: 1,
        height: bodyHeight,
        fill: isWeekStart ? t.gridLineWeekStartColor : t.gridLineColor,
        'pointer-events': 'none',
      }),
    );
  } else {
    vlineChildren.push(
      h('line', {
        key: `vline-${tick.x}`,
        class: 'cx-gantt-grid-vline cx-gantt-grid-vline-dashed',
        x1: tick.x - 1,
        y1: 0,
        x2: tick.x - 1,
        y2: bodyHeight,
        stroke: t.gridLineColor,
        'stroke-width': 1,
        'stroke-dasharray': '2,2',
        'pointer-events': 'none',
      }),
    );
  }
}
// Right-edge closing solid line so the rightmost cell visually closes
vlineChildren.push(
  h('rect', {
    key: 'vline-right-edge',
    class: 'cx-gantt-grid-vline',
    x: rightEdgeX,
    y: 0,
    width: 1,
    height: bodyHeight,
    fill: t.gridLineColor,
    'pointer-events': 'none',
  }),
);
```

#### Week-start derivation

Computed inline as `tick.time.getDay() === 1 && tick.time.getHours() === 0`
(Monday at 00:00). Works correctly for every chronix view:

| View     | Slot duration | Tick distribution                          | Week-start hits                                                                           |
| -------- | ------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| day      | 1 h           | 24 hourly ticks on the anchor calendar day | At most 1 (only if anchor day is Monday and tick[0] is at hour 0) — acceptable            |
| week     | 1 h           | 7 days × 24 hourly ticks                   | Exactly 1 (Monday hour 0 = tick[0]); other Monday hours `getHours()!==0` → not emphasized |
| month    | 1 day         | All days of the anchor month               | Once per Monday in the month                                                              |
| season   | 1 day         | 3 months of daily ticks                    | Once per Monday across 3 months (~13)                                                     |
| halfYear | 1 day         | 6 months of daily ticks                    | Once per Monday across 6 months (~26)                                                     |
| year     | 1 day         | 12 months of daily ticks                   | Once per Monday across 12 months (~52)                                                    |

The `getDay() === 1 && getHours() === 0` conjunction is robust — it
fires only at "Monday at midnight", which is the precise definition of
ISO week start regardless of slot duration. No need for `AxisTick.isWeekStart`
plumbing through the planner.

### Hline geometry — port `snapHorizontalGridLineY` verbatim

Copy `snapHorizontalGridLineY` from `GanttView.tsx:1034-1057` into a new
adapter-private helper `snapHorizontalGridLineY` in
`adapters/vue3/src/chronix-gantt.ts` (same SSR-safe DPR-aware shape):

```ts
function snapHorizontalGridLineY(lineY: number, drawableHeight: number): number {
  let y = lineY;
  if (y >= drawableHeight) y = drawableHeight - 1;
  const dpr =
    typeof window !== 'undefined' &&
    typeof window.devicePixelRatio === 'number' &&
    Number.isFinite(window.devicePixelRatio) &&
    window.devicePixelRatio > 0
      ? window.devicePixelRatio
      : 1;
  let yCrisp = (Math.round(y * dpr) + 0.5) / dpr;
  const margin = 0.5 / dpr;
  const maxY = drawableHeight - margin;
  if (yCrisp < margin) yCrisp = margin;
  if (yCrisp > maxY) yCrisp = maxY;
  return yCrisp;
}

const hlineChildren: VNode[] = [];
for (let i = 0; i < strips.length; i += 1) {
  const strip = strips[i]!;
  const lineY = strip.y + strip.height;
  const yCrisp = snapHorizontalGridLineY(lineY, bodyHeight);
  hlineChildren.push(
    h('line', {
      key: `hline-${i}`,
      class: 'cx-gantt-grid-hline',
      x1: 0,
      y1: yCrisp,
      x2: axis.totalWidth,
      y2: yCrisp,
      stroke: t.gridLineRowRuleColor,
      'stroke-width': 1,
      'vector-effect': 'non-scaling-stroke',
      'pointer-events': 'none',
    }),
  );
}

const gridGroupNode = h('g', { class: 'cx-gantt-grid', 'pointer-events': 'none' }, [
  ...vlineChildren,
  ...hlineChildren,
]);
```

Hline at every strip's bottom edge (incl. the last — matches k-ui's
`rowYPositions.forEach` without the `- 1` adjustment). The DPR snap is
the load-bearing detail: a 1-px stroke on a half-integer y coordinate
stays single-weight at 100% / 125% / 150% OS scaling. Without it,
fractional y produces blurred 2-px-wide lines that visually clash with
the sidebar's 1-px borders.

### Theme tokens — three new fields

Add to `packages/gantt/src/api/chronix-theme.ts`:

```ts
export interface ChronixTheme {
  // ... existing ...

  // ----- Grid lines (Phase 26) -----
  /**
   * Stroke / fill color for body grid lines: vertical cell-boundary
   * (solid rect) AND vertical sub-slot (dashed line). Default `'#ddd'`
   * matches the parity-reference's `--gantt-border-color` fallback.
   */
  readonly gridLineColor: string;
  /**
   * Fill color for vertical cell-boundary lines that coincide with
   * the start of an ISO week (Monday at 00:00). Default `'#bbb'`
   * matches the parity-reference's week-emphasis fallback. Unlike
   * the parity reference (which uses the SAME CSS var with two
   * different fallbacks — so setting the var collapses the two
   * branches), chronix exposes them as separate tokens so consumers
   * can independently customize week-start emphasis.
   */
  readonly gridLineWeekStartColor: string;
  /**
   * Stroke color for horizontal row-bottom lines. Defaults to `'#ddd'`,
   * matching the parity-reference's `--gantt-grid-row-rule-color`
   * (which itself falls back to `--gantt-border-color`). Consumers
   * who want different vertical-vs-horizontal grid intensity can set
   * this independently from `gridLineColor`.
   */
  readonly gridLineRowRuleColor: string;
}

export const defaultChronixTheme: ChronixTheme = {
  // ... existing ...
  gridLineColor: '#ddd',
  gridLineWeekStartColor: '#bbb',
  gridLineRowRuleColor: '#ddd',
};
```

Also update `chronix-theme.test.ts`:

- Add the 3 new keys to `EXPECTED_TOKEN_KEYS` (41 → 44).
- Add the 3 new keys to `stringKeys` (all 3 are strings).

The catalog-completeness CI gate is satisfied because every k-ui class
name introduced in this phase (`gantt-grid-vline`,
`gantt-grid-vline-dashed`, `gantt-grid-vline-week`, `gantt-grid-hline`)
already substring-matches in `audit/RENDER_LAYER_GAP_SWEEP_2026-05-16.md`
Sections H.1 / H.2 / O.1, and the chronix prefixed counterparts
(`cx-gantt-grid-vline`, etc.) appear in this design doc itself.

### Alternatives considered

- **Promote grid to a 7th `GridLinesPass` in `packages/gantt/src/layout/`** —
  Reject. The "algorithm" is `tick.x ∈ boundaryXSet ? solid : dashed`
  plus a one-line DPR snap — ~30 LOC of inline render code is the
  appropriate scale. A new pass would cascade through `useGanttLayout`,
  add an `Input`/`Output` type pair to `types.ts`, require a separate
  test file, and bloat the cross-pass diagram for no benefit. The
  existing render-time inline pattern (today-line, today-cell-tint)
  is the right precedent.

- **Add `isWeekStart?: boolean` field to `AxisTick`** — Reject. The
  formula `tick.time.getDay() === 1 && tick.time.getHours() === 0` is
  2 method calls — cheaper than the cross-pass plumbing it would
  replace. Adding the field would cascade through 6 view planners
  (`planDayView`, `planMonthView`, `planWeekView`,
  `planMonthBandedAxis` calls × 3), every `AxisTick` mock fixture in
  `axis-range-planner.test.ts` and downstream pass tests, plus the
  test that asserts `AxisTick` shape. Not worth the surface change
  for a render-time concern.

- **Single `gridLineColor` token (drop separate week-start + row-rule
  tokens)** — Reject. The 3-token shape is the cleanest mirror of
  k-ui's effective surface (where `--gantt-grid-row-rule-color` is
  already documented separately and the `#bbb` vs `#ddd` distinction
  IS visible in default-theme rendering). Collapsing to one token
  loses the week-emphasis distinction without saving meaningful API
  surface — 3 tokens vs 1 token is one additional entry per token in
  `EXPECTED_TOKEN_KEYS`. Cost trivial; flexibility material.

- **Replicate k-ui's CSS-var quirk (single var, two fallbacks)** —
  Reject. K-ui's quirk is an accident of CSS-variable inheritance, not
  a deliberate design. Two independent tokens are cleaner.

- **Per-view grid toggle prop (`showGrid?: boolean`)** — Reject.
  K-ui has none; consumers hide via CSS class. Same for chronix.
  Adding a prop introduces a "did we wire all branches" reactivity
  question for a feature with no consumer ask.

- **Bundle Phase 28.1 (selection overlay + visible resize handle)
  into Phase 26 to share theme-token churn** — Reject. The
  `chronix-theme.test.ts` `EXPECTED_TOKEN_KEYS` update is a 3-line
  diff per phase; bundling produces a 14-16h phase that violates the
  single-session quality-acceleration constraint
  (`feedback_quality_acceleration.md` constraint #3).

- **Render grid in a separate `<svg>` overlay positioned over the body** —
  Reject. Same coordinate frame as `cx-gantt-body`; same DPR concerns;
  splitting just adds DOM nodes and a second sizing pathway. Inline
  in the body SVG is the simpler answer.

## Parity assertion plan — MANDATORY

This phase modifies `adapters/vue3/src/chronix-gantt.ts` (in the
algorithm-code scope per the template). Parity assertions are
mandatory.

| Assertion id (in parity.spec.ts)                       | Drives k-ui demo via              | Drives chronix demo via            | Compares                                                                                                                                                          | Tolerance      |
| ------------------------------------------------------ | --------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| `phase26-vline count parity (week view)`               | `loadBothDemos` → viewId `week`   | same, parity-mode (`?parity=true`) | Total vertical-line element count in body (chronix `.cx-gantt-grid-vline` + `.cx-gantt-grid-vline-dashed`; k-ui `.gantt-grid-vline` + `.gantt-grid-vline-dashed`) | Exact equality |
| `phase26-vline cell-boundary count parity (week view)` | `loadBothDemos` → viewId `week`   | same                               | Solid cell-boundary vline count (chronix `.cx-gantt-grid-vline:not(.cx-gantt-grid-vline-dashed)`; k-ui equivalent — 7 day boundaries + right edge)                | Exact equality |
| `phase26-vline week-start count parity (season view)`  | `loadBothDemos` → viewId `season` | same                               | Week-emphasis vline count (chronix `.cx-gantt-grid-vline-week`; k-ui `.gantt-grid-vline-week`) — should be ~13 Mondays across 3 months                            | Exact equality |
| `phase26-hline row-bottom count parity (any view)`     | `loadBothDemos` → viewId `month`  | same                               | Hline count (chronix `.cx-gantt-grid-hline`; k-ui `.gantt-grid-hline`) — should equal rendered-row count                                                          | Exact equality |

Selectors are queried via `page.evaluate(() => document.querySelectorAll('selector').length)`
inline in each test (no new `extractGridLinesSnapshot` helper added to
`parity-helpers.ts` — premature abstraction for one phase; promote
later if Phase 28 needs the same channel).

### Drift-detection scope

- **Covered**: structural counts of all 4 vline / vline-dashed /
  vline-week / hline channels across 3 views (week / season / month) —
  every view that exercises a distinct combination of slot duration ×
  outer-cell layout.
- **NOT covered**: per-line `x` / `y` pixel parity. Rationale: chronix's
  vline x positions are derived from `axis.ticks[i].x` and chronix's
  axis x derivation has been parity-tested since Phase 17 via
  `extractTicksSnapshot` (Phase 20.5). If tick x's agree and the grid
  formula is `tick.x - 1`, vline x parity is implied. Hline y depends
  on chronix's strip-y vs k-ui's row-y, which differs (chronix's
  row-order is input-order, k-ui's is grouped-by-baseName per Phase
  20.5 catalog) — covering y would force an O(N²) row pairing that's
  out of scope.
- **NOT covered**: dashed `strokeDasharray` value or stroke width
  match. Computed-style parity for grid would extend Phase 20.5's
  `ComputedStyleKey` union; deferred until Phase 28 needs it for
  selection-overlay styling.
- **NOT covered**: `weekendsVisible: false` interaction with grid line
  count. K-ui drops Saturday/Sunday slots when `weekendsVisible: false`;
  chronix does the same (Phase 18). Both sides should drop the same
  vlines but isn't asserted directly in v0 — covered indirectly by the
  general count parity above for the default `weekendsVisible: true`
  state. Re-prioritize as a Phase 26.1 follow-up if user reports
  drift.

## Test coverage

- **adapter**: `adapters/vue3/src/chronix-gantt-grid.test.ts` (new, ~8
  tests):
  - "emits no grid group when axis has zero ticks (empty render)"
  - "emits one `.cx-gantt-grid-vline` per cell-boundary tick (day view)"
  - "emits `.cx-gantt-grid-vline-dashed` at non-cell-boundary slots
    (week view sub-hour slots)"
  - "emits `.cx-gantt-grid-vline-week` at Monday-midnight ticks (season
    view)"
  - "emits one `.cx-gantt-grid-hline` per row strip"
  - "hline y values are DPR-snapped to half-integer in CSS px under
    fractional row height" (mocks `window.devicePixelRatio`)
  - "right-edge closing vline emitted at `axis.totalWidth - 1`"
  - "grid group is `pointer-events: none` (no hit-test interference)"

- **theme**: `packages/gantt/src/api/chronix-theme.test.ts` updated
  (+0 new tests; the existing 2 tests cover the 3 new keys via
  `EXPECTED_TOKEN_KEYS` and `stringKeys`).

- **parity**: `tooling/golden-runner/tests/parity.spec.ts` (+4
  assertions per the table above).

- **core**: no new core test file (no core code change).

Expected counts after Phase 26: vitest 524 → ~532 (+8); parity-spec
assertions 38 → 42 (+4); cross-demo verify scenarios 27 unchanged
(scenario list unaffected — same demo configurations, just with grid
lines added to the chronix-side render).

## VRT impact

**Re-baseline required**: every chronix-side body screenshot will gain
visible grid lines. K-ui baselines stay unchanged (k-ui already had
the lines — its baselines were captured WITH grid).

Predicted baseline churn:

- **chronix-visual baselines** (`tooling/golden-runner/__screenshots__/`):
  ~5 baselines for the chronix-self VRT scenarios — every one captures
  the body. All need re-capture.
- **cross-demo VRT baselines** (`tooling/golden-runner/__screenshots__/cross-demo/`):
  15 chronix-side scenarios re-baseline (the chronix copy of every
  scenario gains grid lines); 0 k-ui-side scenarios change. The
  cross-demo pixel diff between k-ui and chronix sides should NOT
  improve — k-ui's grid is its own pixels; the cross-demo diff
  measures "does chronix render the SAME pixels as k-ui at the same
  coordinates" — which becomes MORE true after Phase 26, not less.
  In practice the cross-demo diff stays stable (or improves slightly)
  because the two sides now both have grid lines at matching
  positions.

Re-baseline plan in Commit 4 (parity + VRT). Same workflow as Phase
22.2 (where today-cell-bg also triggered ~20 baseline re-captures).

## Execution plan — 4 commits + wrap-up

### Commit 1 (design doc, this commit) — REQUIRES user review of 3 load-bearing decisions

Lands only `audit/PHASE_26_GRID_LINES_DESIGN.md`. Awaits user
confirmation of the 3 questions in the "Open questions" section before
implementation.

### Commit 2: Core theme tokens — 3 new ChronixTheme fields

- `packages/gantt/src/api/chronix-theme.ts`: add `gridLineColor`,
  `gridLineWeekStartColor`, `gridLineRowRuleColor` to `ChronixTheme`
  interface + `defaultChronixTheme`.
- `packages/gantt/src/api/chronix-theme.test.ts`: add 3 new keys to
  `EXPECTED_TOKEN_KEYS` + `stringKeys` arrays.
- Rebuild `@chronixjs/gantt` dist: `pnpm --filter @chronixjs/gantt build`.
- ci-check green (vitest 524 unchanged for theme — only 2 tests touched,
  both still pass with expanded key list).

### Commit 3: Adapter — body SVG grid render + 8 adapter tests

- `adapters/vue3/src/chronix-gantt.ts`:
  - Add `snapHorizontalGridLineY` private helper (ported from k-ui
    `GanttView.tsx:1034-1057`).
  - Build `gridGroupNode` after `todayCellBodyNode` and before
    `todayLineBodyNode` in the body SVG children array
    (lines 1831-1837).
  - Wire `t.gridLineColor` / `t.gridLineWeekStartColor` /
    `t.gridLineRowRuleColor` into the grid children.
- `adapters/vue3/src/chronix-gantt-grid.test.ts` (new, ~8 tests per
  the Test coverage section).
- ci-check green (vitest 524 → ~532).

### Commit 4: Parity assertions + VRT re-baseline

- `tooling/golden-runner/tests/parity.spec.ts`: +4 phase26-\* assertions
  per the parity-assertion table.
- Run cross-demo verify; for chronix-side scenarios that diff purely
  due to new grid lines (expected: all 15), re-capture.
- Run chronix-visual VRT; re-capture all 5 baselines.
- ci-check green; cross-demo-verify gate green (27 scenarios still
  pass + 4 new parity assertions pass).

### Commit 5 (wrap-up — REQUIRES /phase-close invocation)

Before flipping this design doc's Status to DONE OR adding the
"Phase 26 — DONE" section to `audit/journal/`, MUST invoke
`/phase-close` skill (see `.claude/skills/phase-close/SKILL.md`).
The skill verifies the 7 standard gates (parity assertions present,
journal section written, memory updated, design status DONE, +
catalog-completeness CI gate green, + cross-demo-verify gate green,

- prettier-clean tree).

* `audit/journal/2026-05-13.md` (continuation): "Phase 26 — Grid
  lines (DONE, 2026-05-16)" section per the existing template.
* `memory/project_gantt_rewrite_plan.md`: bump vitest 524 → 532;
  parity-spec 38 → 42; theme token count 41 → 44; add Phase 26 DONE
  marker.
* `audit/PHASE_26_GRID_LINES_DESIGN.md` Status → DONE.

## Estimated scope

| Commit                      | Hours   | LOC est.                                        |
| --------------------------- | ------- | ----------------------------------------------- |
| 1 (design doc)              | 1.5     | this file (~530 LOC)                            |
| 2 (theme tokens)            | 0.5     | ~10 LOC src + ~10 LOC test                      |
| 3 (adapter grid + tests)    | 4       | ~80 LOC adapter src + ~200 LOC tests            |
| 4 (parity + VRT rebaseline) | 3       | ~140 LOC parity tests + 20 baseline re-captures |
| 5 (wrap-up)                 | 0.5     | journal + memory + status flip                  |
| **Total**                   | **9.5** | ~440 LOC + 20 baseline PNGs                     |

Within single-session discipline (per `feedback_quality_acceleration.md`
constraint #3). Within the 8-10h estimate from the RENDER_LAYER_GAP_SWEEP
phase-26 row.

## 4-dimension audit check

Per `feedback_4_dimension_audit_checklist.md`, this phase explicitly
walks all 4 audit dimensions:

| Dimension                     | Coverage in Phase 26                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Options surface**           | 3 theme tokens added (`gridLineColor`, `gridLineWeekStartColor`, `gridLineRowRuleColor`); no new prop (matches k-ui — always-on grid)                                                                                                                                                                                                                                                                                                       |
| **Render code**               | This is the phase's primary target — new `<g class="cx-gantt-grid">` in body SVG with 4 child branches (vline solid / dashed / week / hline)                                                                                                                                                                                                                                                                                                |
| **Interaction code**          | `pointer-events: none` on group + every child — no interaction surface introduced; existing pointer-handler tests are not impacted                                                                                                                                                                                                                                                                                                          |
| **Layout-algorithm pipeline** | Inputs (`axis.ticks`, `axis.headerRows`, `strips`) come from existing passes — no pipeline change. Verified that `BarStackHeightPass.levelByBarId` (Phase 30) is independent and unaffected; that `LinkRouter.routedLinks` does not consume grid output; that `VirtualizedPaneLayout` would integrate transparently if/when Phase X enables it (grid is per-frame, virtualization is a viewport filter that doesn't intersect render order) |

The Layout-algorithm-pipeline dimension is the one most prone to silent
gaps (per the 2026-05-16 user-spotted bar-stacking gap that motivated
the addition of this dimension). Phase 26 has zero pipeline change, so
the failure mode "intermediate output computed but not consumed" is
structurally impossible here — there's no new intermediate output.

## Open questions for the user — 3 load-bearing decisions

**1. Scope: A (full k-ui parity), B (chronix-minimal), C (A + Phase 28.1 bundle)** — recommended **A**.

- **A** (recommended): full parity — vline solid cell-boundary + vline
  dashed sub-slot + week-start emphasis + right-edge closing + hline
  DPR-snapped + 3 theme tokens. Highest user visibility; closes the
  signature aesthetic gap; ~9.5h, single session.
- **B** (chronix-minimal): solid vlines + hline only; skip dashed
  sub-slot + skip week emphasis + collapse to 1 theme token. Saves
  ~3h but leaves the dashed sub-hour dividers absent (which is k-ui's
  most distinctive look in week/day views); user will likely ask for
  the dashed lines back within the next phase, reopening this work.
- **C** (A + Phase 28.1 selection overlay bundle): land grid + selection
  overlay + visible resize handle together to share the
  `chronix-theme.test.ts` `EXPECTED_TOKEN_KEYS` update. ~14-16h —
  breaks single-session discipline per `feedback_quality_acceleration.md`
  constraint #3.

**Recommendation**: **A**. Full parity, single session, matches the
user-flagged highest-visibility classification from the
RENDER_LAYER_GAP_SWEEP.

**2. Geometry computation site: render-time inline (in adapter) vs new GridLinesPass (in `packages/gantt/src/layout/`)** — recommended **render-time inline**.

- **Render-time inline** (recommended): build vline / hline children
  directly in `adapters/vue3/src/chronix-gantt.ts`'s render closure,
  reading from `axis` and `strips` reactive refs. Matches the precedent
  set by today-line (Phase 21) and today-cell-tint (Phase 22.2). ~30
  LOC formula; no cross-pass plumbing.
- **New GridLinesPass**: promote to a 7th layout pass with `Input` /
  `Output` types in `packages/gantt/src/layout/types.ts`; wire through
  `useGanttLayout`. Premature abstraction for a render-only concern;
  bloats cross-pass diagram; adds a test file; cascades types.ts
  surface. K-ui itself doesn't abstract this — `renderGridLines` is
  an inline method on `GanttView`.

**Recommendation**: **render-time inline**. Matches today-line +
today-cell-tint precedent.

**3. Week-start derivation: inline (compute from `tick.time.getDay() === 1 && tick.time.getHours() === 0` at render) vs add `AxisTick.isWeekStart?: boolean` field** — recommended **inline**.

- **Inline** (recommended): 2-method-call inline check at render
  time. No planner code change; no `AxisTick` shape change; no
  cascade through 6 view planners + their test fixtures. Pure render
  concern, kept at the render site.
- **`AxisTick.isWeekStart` field**: populate in each `plan*` function;
  consumers read `tick.isWeekStart` directly. Cleaner data flow if
  ANY future render consumer needs week-start info — but only grid
  lines need it today, and even then only at one render site. The
  cascade cost (6 planner functions × test fixtures) exceeds the
  savings.

**Recommendation**: **inline**. Avoids cross-pass shape change for a
render-only concern; keeps the planner pure (axis = positions + time

- label only).

Reply **按推荐继续** to accept all three (A / render-time inline /
inline week-start), or call out any 1-3 to override.
