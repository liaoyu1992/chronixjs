# Phase 27.1 — Viewport-clipping flags + viewport-edge continuation triangles

**Status**: **DRAFT (2026-05-18)** — awaiting user review of the 3 load-bearing decisions at the bottom of this file. Implementation commits do NOT land until the user replies `按推荐继续` or overrides one of the three.

## Problem

Phase 27 (DONE 2026-05-16) landed left + right continuation
triangles for bars whose **calendar range** extends past the visible
**axis range** (`!bar.isStart` / `!bar.isEnd`). That covers the
"viewing a multi-week bar in day-view" case: a half-bar at the
edge of the axis grows a triangle pointing past the axis.

It does NOT cover the **viewport-clipping** case: when the chart
pane has horizontal scroll (chart-content width > visible chart-pane
width — typical for week / month / season / half-year / year views)
and the user scrolls horizontally, bars that are **inside the axis
range** but **outside the visible viewport** disappear silently. No
triangle marks where they exited; nothing indicates "this bar
continues offscreen — keep scrolling to see it."

The parity reference handles this via
`d:/work/k-ui/packages/gantt/src/timeline/TimelineEvent.tsx:286-298`
— when its `containerWidth` prop is provided, the same triangle
machinery additionally fires for `x < 0` (bar's left edge offscreen
to the left of the visible viewport) or `x + finalWidth > containerWidth`
(right edge offscreen). When viewport-clipping fires, the triangle
**locks to the viewport edge** instead of the bar's edge, so the
user always sees the indicator regardless of how far the bar has
scrolled offscreen.

Phase 27's design doc explicitly deferred this work
(`audit/PHASE_27_CONTINUATION_INDICATORS_DESIGN.md:73, 237-238,
480-483`): "requires wrapper scroll-viewport tracking; not currently
threaded through Vue reactivity. Bundle with Phase 23 (sidebar
dual-scrollport) integration when viewport tracking lands."

Phase 23 (DONE 2026-05-17) landed `useChartScrollState` —
`{scrollLeft: Ref<number>, clientWidth: Ref<number>}` ComputedRefs
tracking the chart-pane's viewport state reactively. It's already
wired in `<ChronixGantt>` setup (`chronix-gantt.ts:1221`) with an
`eslint-disable-next-line @typescript-eslint/no-unused-vars` because
Phase 23 itself didn't consume it. Phase 27.1 is the planned
consumer. The composable's JSDoc explicitly names this phase as
the first consumer:

```ts
// Phase 27.1 — `PlacedBar.isClippedStart` / `isClippedEnd`
// viewport-clipping flags (vs Phase 27's axis-range flags) need
// scrollLeft + clientWidth to decide whether a bar's start/end
// extends past the visible viewport.
```

User-observable consequence today: in chronix's week / month /
year demo views, the chart is wider than the visible chart-pane;
on initial mount (`scrollLeft = 0`) bars in the right half of the
axis are partially or fully offscreen with no visual indicator.
As the user scrolls right, those bars come into view from the right
edge of the viewport (no incoming-triangle warning); bars on the
left silently slide out of view (no outgoing-triangle marker).

Phase 27.1 closes this gap by extending the triangle render to
also fire on viewport-clipping, with apex locked to the viewport
edge when triggered.

## Reference (k-ui) behavior surface — full catalog

Reference files audited:

- `d:/work/k-ui/packages/gantt/src/timeline/TimelineEvent.tsx:24` —
  `containerWidth?: number` declared on the prop interface. Optional
  — when omitted, the viewport-clipping branch short-circuits and
  only axis-clipping triggers triangles.
- `d:/work/k-ui/packages/gantt/src/timeline/TimelineEvent.tsx:286-298`
  — the load-bearing combined check:

  ```ts
  let isClippedStart = !isEventStart;
  let isClippedEnd = !isEventEnd;
  if (containerWidth !== undefined) {
    isClippedStart = x < 0 || !isEventStart;
    isClippedEnd = x + finalWidth > containerWidth || !isEventEnd;
  }
  ```

  Note: the `containerWidth`-branch OR's the viewport-clipped check
  INTO the axis-clipped flag. After this block, `isClippedStart`
  represents "left triangle should fire on EITHER viewport-clipped
  or axis-clipped grounds." Same for the right side.

- `d:/work/k-ui/packages/gantt/src/timeline/TimelineEvent.tsx:313-348`
  — triangle position derivation:
  - When `isClippedStart`: apex at viewport-coord `(triangleMargin,
centerY)` — locked to the viewport's left edge (1 px inset).
  - Else when `!isEventStart`: apex at content-coord
    `(x + triangleMargin, centerY)` — inside the bar's own left edge.

  Note the precedence: viewport-lock wins when fired. Once
  `containerWidth` is provided, the `!isEventStart` branch is
  effectively dead (the OR'd condition already pulled axis-clipping
  into `isClippedStart`). When `containerWidth` is undefined,
  `isClippedStart === !isEventStart` and the first branch fires for
  axis-clipping — apex at viewport-coord `(1, centerY)`, which in
  TimelineEvent.tsx's coordinate system is the leftmost paintable
  pixel (since the parent SVG has no scroll). chronix's coordinate
  system differs (see Naming alignment below).

- `d:/work/k-ui/packages/gantt/src/timeline/TimelineEvent.tsx:540-605`
  — title position adapts to `isClippedStart` / `isClippedEnd`:
  - When `isClippedStart`: `titleStartX = triangleMargin +
triangleSize + 4` (locked to viewport-coord, behind the
    viewport-locked triangle).
  - When `isClippedEnd`: `titleEndX = containerWidth - triangleMargin
    - triangleSize - 4`.

  Phase 28.2 already implements the axis-clipped branch of title
  positioning. The viewport-clipped extension is Phase 28.2.1
  scope (separately roadmapped — see "Cascading dispositions" below).

- `d:/work/k-ui/packages/gantt/src/timeline/TimelineEvent.tsx:177-180`
  — `containerWidth` is wired via TimelineEvent's parent
  (`TimelineContent.tsx` / `TimelineEvents.tsx`) which reads it from
  the timeline-layout `state.actualBodyWidth` (the chart-pane's
  current paint-time width, NOT scroll-aware). The reference does
  NOT thread `scrollLeft` through TimelineEvent — k-ui works in a
  fully-stretched (non-scrolling) coordinate system AND uses CSS
  `transform: translateX` on the wrapper to scroll, then bars know
  their absolute content-x.

  **Critical chronix architectural divergence**: chronix's chart-pane
  uses native `overflow: auto` scroll (Phase 23 wiring), not
  transform-scroll. `placedBar.x` is in content-coords (absolute from
  the chart's left edge). To replicate k-ui's "viewport-coord apex"
  position, chronix needs both `scrollLeft` AND `clientWidth` — k-ui
  gets the same semantics from `containerWidth` alone because its
  coord system already has scroll baked in via CSS transform. The
  derived condition is algebraically equivalent on both sides:
  "is the bar's edge outside the currently-visible window?"

### Coordinate-system reconciliation

k-ui's `x` (in TimelineEvent's render closure) is **viewport-local**
— the bar's pixel position relative to the visible chart left edge.
A negative `x` means the bar's left edge is to the LEFT of the
viewport. The CSS scroll-transform on the parent has already
subtracted `scrollLeft` from absolute content-x by the time `x`
arrives in TimelineEvent.

chronix's `placedBar.x` (and `renderX` after drag adjustment) is
**content-local** — the bar's pixel position relative to the
chart's content left edge (the leftmost axis tick). A `renderX < 0`
would mean the bar started before the axis — that's the Phase 27
axis-clipping case. Viewport-clipping is `renderX < scrollLeft`
(bar's left is to the LEFT of the visible viewport).

Translation table:

| concept                   | k-ui viewport-local                          | chronix content-local                                  |
| ------------------------- | -------------------------------------------- | ------------------------------------------------------ |
| viewport left edge        | `0`                                          | `scrollLeft`                                           |
| viewport right edge       | `containerWidth`                             | `scrollLeft + clientWidth`                             |
| bar left in coord system  | `x`                                          | `renderX`                                              |
| bar right in coord system | `x + finalWidth`                             | `renderX + renderWidth`                                |
| viewport-clipped-start    | `x < 0`                                      | `renderX < scrollLeft`                                 |
| viewport-clipped-end      | `x + finalWidth > containerWidth`            | `renderX + renderWidth > scrollLeft + clientWidth`     |
| viewport-locked apex (L)  | `(triangleMargin, centerY)`                  | `(scrollLeft + triangleMargin, centerY)`               |
| viewport-locked apex (R)  | `(containerWidth - triangleMargin, centerY)` | `(scrollLeft + clientWidth - triangleMargin, centerY)` |

Both columns produce visually identical output: a triangle painted
at the visible viewport edge regardless of how far the bar has
scrolled offscreen.

### Surface-level disposition table

| Item                                                                                                | k-ui                                                                                          | chronix v0                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `containerWidth?: number` prop on TimelineEvent — single number representing visible viewport width | `TimelineEvent.tsx:24`                                                                        | ✅ **port (transposed shape)** — chronix consumes the same semantic state via two ComputedRefs `chartScroll.scrollLeft` + `chartScroll.clientWidth` from the existing `useChartScrollState` composable (Phase 23). The `scrollLeft + clientWidth` pair encodes "visible viewport in content-coords"; no new prop on `<ChronixGantt>` needed — the data is already plumbed.                                                                                                      |
| `isClippedStart = x < 0 \|\| !isEventStart` combined viewport-and-axis check                        | `TimelineEvent.tsx:295-296`                                                                   | ✅ **port** as render-time derivation in the adapter's per-bar flatMap closure. Concrete formula: `isClippedStart = renderX < scrollLeft \|\| !bar.isStart` (where `renderX` is the drag-aware geometry already computed at flatMap-closure entry). Same OR-combination semantics.                                                                                                                                                                                              |
| `isClippedEnd = x + finalWidth > containerWidth \|\| !isEventEnd`                                   | `TimelineEvent.tsx:298`                                                                       | ✅ **port** — `isClippedEnd = renderX + renderWidth > scrollLeft + clientWidth \|\| !bar.isEnd`.                                                                                                                                                                                                                                                                                                                                                                                |
| Viewport-locked left triangle position (apex at viewport-coord `triangleMargin`)                    | `TimelineEvent.tsx:314-320` `(triangleMargin, centerY)`                                       | ✅ **port** — when `isViewportClippedStart` (the viewport-only sub-case), apex at content-coord `(scrollLeft + TRIANGLE_MARGIN, centerY)`. When ONLY axis-clipped (Phase 27's existing branch), keep apex at `(renderX + TRIANGLE_MARGIN, centerY)`. Precedence: viewport-clipped wins when both fire on the same side (matches reference's first-branch-wins).                                                                                                                 |
| Viewport-locked right triangle position                                                             | `TimelineEvent.tsx:334-340` `(containerWidth - triangleMargin, centerY)`                      | ✅ **port** — when `isViewportClippedEnd`, apex at `(scrollLeft + clientWidth - TRIANGLE_MARGIN, centerY)`.                                                                                                                                                                                                                                                                                                                                                                     |
| Triangle's visual constants `triangleSize: 6`, `triangleMargin: 1`                                  | `TimelineEvent.tsx:306-307`                                                                   | ✅ **already ported (Phase 27)** — `TRIANGLE_SIZE = 6`, `TRIANGLE_MARGIN = 1` are file-level constants in `chronix-gantt.ts`. Phase 27.1 reuses them; no new constants.                                                                                                                                                                                                                                                                                                         |
| Reactivity (rerender when viewport changes)                                                         | k-ui rerenders via parent timeline-layout updating `state.actualBodyWidth` + scroll transform | ✅ **port (Vue-native)** — `chartScroll.scrollLeft.value` + `chartScroll.clientWidth.value` are Vue Refs. Reading them inside the flatMap closure (which is itself inside a `computed()` / setup-scope reactive function) establishes the reactive dependency; Vue re-runs the render when either changes. The `useChartScrollState` composable already wires `scroll` event + `ResizeObserver` to keep these refs current.                                                     |
| `containerWidth === undefined` short-circuit (no viewport tracking)                                 | `TimelineEvent.tsx:295` — `if (containerWidth !== undefined)` guards the OR'd refinement      | ✅ **port (different shape)** — when `chartScroll.clientWidth.value === 0` (pre-mount, before ResizeObserver fires), the viewport-clipping check is suppressed. Concrete: in the derivation, guard with `clientWidth > 0`; below that, only axis-clipping fires. Matches reference's "no viewport info → skip viewport check" semantics. Without the guard, `viewportRight = scrollLeft + 0 = scrollLeft` would erroneously flag most bars as viewport-clipped-right pre-mount. |
| Title position adapts to `isClippedStart` / `isClippedEnd` (locks behind viewport-locked triangle)  | `TimelineEvent.tsx:540-605`                                                                   | ⏸️ **Defer to Phase 28.2.1** — chronix's Phase 28.2 already adapts title position to **axis-clipped** triangles (chronix-gantt.ts:2254-2258 `leftPadding = !bar.isStart ? TRIANGLE_MARGIN + TRIANGLE_SIZE + TITLE_TRIANGLE_GAP : 8`). Extending to viewport-clipped is the planned Phase 28.2.1 scope. Phase 27.1 leaves title positioning alone; title may visually overlap the viewport-locked triangle until 28.2.1 lands. Documented interim state.                         |
| Progress dot position adapts to triangles                                                           | (Phase 28.x equivalent)                                                                       | ⏸️ **Defer to Phase 28.2.1 (cascading)** — chronix's progress-dot positioning at chronix-gantt.ts:2456-2466 also only consults `!bar.isStart`/`!bar.isEnd` (axis-clipping). Same defer rationale — fold into Phase 28.2.1's viewport-aware text-region work.                                                                                                                                                                                                                    |
| Per-pointer-type or per-view threshold for viewport-clipping fire                                   | k-ui: none — all pointer types use the same `containerWidth`                                  | ✅ **port** — uniform behavior across all pointer types + view ids. No new prop.                                                                                                                                                                                                                                                                                                                                                                                                |
| Theme tokens for viewport-locked triangle distinct from axis-locked                                 | k-ui: none — same `#000` / `0.8` for all                                                      | ❌ **Reject** — same triangles, same fill + opacity. No new tokens. (Phase 27's reject rationale extends here.)                                                                                                                                                                                                                                                                                                                                                                 |
| Triangle animation across scroll                                                                    | k-ui: none — triangles re-render frame-by-frame via React's normal reconciliation             | ✅ **port** — chronix's Vue reactivity re-runs the flatMap on each scroll event (debounced by Vue's microtask scheduler). Triangle "slides" along the viewport edge naturally as scroll progresses; no special animation path.                                                                                                                                                                                                                                                  |

**Phase 27.1 net surface**: 7 ✅-port items (the viewport-clipped
flag derivation, position-locking, reactivity, no-viewport-info
short-circuit, both polygons, no new tokens, no animation),
2 ⏸️-defer-to-28.2.1 (title-position adapter, progress-dot
adapter), 1 ❌-reject (separate theme tokens).

### Naming alignment table

| k-ui                                           | chronix                                                                                             |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `containerWidth?: number` (TimelineEvent prop) | `chartScroll.clientWidth: ComputedRef<number>` (already plumbed by Phase 23)                        |
| (implicit: scroll baked into coord system)     | `chartScroll.scrollLeft: ComputedRef<number>` (already plumbed by Phase 23)                         |
| `isClippedStart` (combined flag)               | `isClippedStart` (local var in flatMap closure — same semantics)                                    |
| `isClippedEnd` (combined flag)                 | `isClippedEnd` (local var in flatMap closure)                                                       |
| (no separate viewport-only sub-flag)           | `isViewportClippedStart` (local var — needed to choose viewport-locked vs bar-locked apex)          |
| (no separate viewport-only sub-flag)           | `isViewportClippedEnd` (local var)                                                                  |
| `triangleSize`, `triangleMargin`               | `TRIANGLE_SIZE`, `TRIANGLE_MARGIN` (already file-level constants)                                   |
| (helper inlined in TimelineEvent.tsx)          | `deriveViewportClipping(renderX, renderWidth, scrollLeft, clientWidth)` (new pure helper, exported) |

### Cascading dispositions (other phases affected)

- **Phase 28.2 (bar title)**: leaves it as-is. Title currently adapts
  to axis-clipped triangles only; will adapt to viewport-clipped
  triangles in the planned Phase 28.2.1. Phase 27.1 does NOT touch
  the title-positioning block (chronix-gantt.ts:2254-2270). Note for
  Phase 28.2.1 design: it consumes the same `deriveViewportClipping`
  helper this phase introduces.
- **Phase 28.x (progress-dot)**: same as Phase 28.2 — defer to 28.2.1.
- **Phase 23 (dual-scrollport)**: removes the `eslint-disable
no-unused-vars` on `chartScroll` (chronix-gantt.ts:1220) — Phase
  27.1 is the first consumer that justifies the composable.

## Approach

### §1 — New pure helper `deriveViewportClipping` (`adapters/vue3/src/derive-viewport-clipping.ts`)

A pure function — no Vue reactivity, no DOM. Takes 4 numbers,
returns 4 booleans + 4 apex coords. Unit-testable as a pure data
transform; the SFC consumer is a thin wrapper that pulls reactive
inputs and feeds them in.

```ts
/**
 * Phase 27.1: derives viewport-clipping flags + viewport-locked
 * triangle apex positions for a single bar. Pure function — does
 * NOT read Vue refs. Consumer pulls reactive `scrollLeft` +
 * `clientWidth` from `useChartScrollState` (Phase 23) and feeds
 * them in alongside the bar's live render geometry.
 *
 * `isViewportClippedStart` fires when the bar's left edge is to
 * the LEFT of the visible viewport — i.e. the user has scrolled
 * right past the bar's start. Independent of Phase 27's
 * axis-clipping flag (`bar.isStart`): a bar can be inside the
 * axis (`bar.isStart === true`) but scrolled out of view
 * (`isViewportClippedStart === true`).
 *
 * `clientWidth === 0` short-circuits both viewport-clipped checks
 * to `false` — this is the pre-mount frame before ResizeObserver
 * fires. Without the guard, `viewportRight = scrollLeft + 0` would
 * flag every bar as viewport-clipped-right.
 *
 * Apex positions in CONTENT-COORDS (chronix's render space). When
 * viewport-clipped, the apex locks to the visible viewport edge
 * in content-coords: `scrollLeft + TRIANGLE_MARGIN` (left edge),
 * `scrollLeft + clientWidth - TRIANGLE_MARGIN` (right edge). The
 * chart-pane's CSS transform/scroll then translates these into
 * the user's viewport coordinates at paint time, so the user sees
 * the apex 1 px inside the visible viewport edge.
 */
export interface ViewportClippingResult {
  readonly isViewportClippedStart: boolean;
  readonly isViewportClippedEnd: boolean;
  readonly viewportLockedLeftApexX: number; // content-coords
  readonly viewportLockedRightApexX: number; // content-coords
}

export function deriveViewportClipping(
  renderX: number,
  renderWidth: number,
  scrollLeft: number,
  clientWidth: number,
  triangleMargin: number,
): ViewportClippingResult {
  if (clientWidth === 0) {
    return {
      isViewportClippedStart: false,
      isViewportClippedEnd: false,
      viewportLockedLeftApexX: 0,
      viewportLockedRightApexX: 0,
    };
  }
  const viewportRight = scrollLeft + clientWidth;
  return {
    isViewportClippedStart: renderX < scrollLeft,
    isViewportClippedEnd: renderX + renderWidth > viewportRight,
    viewportLockedLeftApexX: scrollLeft + triangleMargin,
    viewportLockedRightApexX: viewportRight - triangleMargin,
  };
}
```

The `triangleMargin` parameter is passed in (not hardcoded) so the
helper has zero dependency on `chronix-gantt.ts`'s file-level
constants — keeps the helper testable in isolation.

### §2 — Adapter integration (`adapters/vue3/src/chronix-gantt.ts`)

Three changes:

**a)** Remove the `eslint-disable-next-line` on the existing
`chartScroll` declaration at line 1220-1221. Phase 27.1 is its
first consumer; the suppression is no longer needed.

**b)** Inside the existing `placedBars.value.flatMap((bar) => {...})`
closure, AFTER the drag-aware `renderX` / `renderY` / `renderWidth`
computation (chronix-gantt.ts:1989-2028) but BEFORE the bar's main
rect emission (around line 2150), compute the viewport-clipping
state per-bar:

```ts
const viewportClip = deriveViewportClipping(
  renderX,
  renderWidth,
  chartScroll.scrollLeft.value,
  chartScroll.clientWidth.value,
  TRIANGLE_MARGIN,
);
```

**c)** Rewrite the existing Phase 27 continuation-triangle emit
blocks (chronix-gantt.ts:2181-2212) to combine axis + viewport
clipping, with viewport-locked apex taking precedence:

```ts
// Phase 27.1: combined axis + viewport clipping. Left triangle
// fires when EITHER `!bar.isStart` (Phase 27 axis-clipped) OR
// `isViewportClippedStart` (Phase 27.1 viewport-clipped). Apex
// position depends on WHICH case fired: viewport-locked when the
// viewport-only sub-case fires (locks apex to viewport edge in
// content-coords, so the user sees the triangle at the visible
// edge regardless of how far the bar has scrolled offscreen);
// bar-edge-anchored when only axis-clipped (Phase 27's existing
// behavior — apex inside the bar's content-x edge).
//
// Precedence (viewport over bar-edge) matches the parity
// reference's first-branch-wins logic at TimelineEvent.tsx:314-320.
const fireLeftTriangle = !bar.isStart || viewportClip.isViewportClippedStart;
if (fireLeftTriangle) {
  const apexX = viewportClip.isViewportClippedStart
    ? viewportClip.viewportLockedLeftApexX
    : renderX + TRIANGLE_MARGIN;
  const baseX = apexX + TRIANGLE_SIZE;
  const centerY = renderY + bar.height / 2;
  nodes.push(
    h('polygon', {
      key: `${bar.barId}-continuation-left`,
      'data-bar-id': bar.barId,
      class: 'cx-gantt-bar-continuation-indicator cx-gantt-bar-continuation-left',
      points: `${apexX},${centerY} ${baseX},${centerY - TRIANGLE_SIZE} ${baseX},${centerY + TRIANGLE_SIZE}`,
      fill: '#000',
      opacity: 0.8,
      'pointer-events': 'none',
    }),
  );
}

const fireRightTriangle = !bar.isEnd || viewportClip.isViewportClippedEnd;
if (fireRightTriangle) {
  const apexX = viewportClip.isViewportClippedEnd
    ? viewportClip.viewportLockedRightApexX
    : renderX + renderWidth - TRIANGLE_MARGIN;
  const baseX = apexX - TRIANGLE_SIZE;
  const centerY = renderY + bar.height / 2;
  nodes.push(
    h('polygon', {
      key: `${bar.barId}-continuation-right`,
      'data-bar-id': bar.barId,
      class: 'cx-gantt-bar-continuation-indicator cx-gantt-bar-continuation-right',
      points: `${apexX},${centerY} ${baseX},${centerY - TRIANGLE_SIZE} ${baseX},${centerY + TRIANGLE_SIZE}`,
      fill: '#000',
      opacity: 0.8,
      'pointer-events': 'none',
    }),
  );
}
```

The class names stay `cx-gantt-bar-continuation-left/right` (no
new class for the viewport-locked variant) — same as the reference
reuses `gantt-event-continuation-left/right` for both cases. The
visual difference is in the apex position only; consumers who want
to style viewport-locked triangles differently can use a CSS
attribute selector with a `data-viewport-clipped="true"` attribute,
which Phase 27.1 adds:

```ts
'data-viewport-clipped': viewportClip.isViewportClippedStart ? 'true' : 'false',
```

(One per side; left polygon gets `isViewportClippedStart`'s value,
right gets `isViewportClippedEnd`.) The attribute lets tests probe
which branch fired without re-running the math.

### §3 — Title-position interim state (documented, not addressed)

Phase 28.2's title-positioning logic (chronix-gantt.ts:2254-2258)
currently reads `!bar.isStart` to shift the title past the
axis-clipped triangle. Phase 27.1 introduces a SECOND triangle
case (viewport-clipped) which Phase 28.2 does NOT know about. The
title may visually overlap the viewport-locked triangle (the
triangle paints at 0.8 opacity above the title, partially
obscuring it).

This is the planned Phase 28.2.1 scope. Phase 27.1 does not block
on it. The interim visual issue affects bars whose title is wider
than the visible viewport portion — a small fraction of the demo
data. Documented in the Phase 28.2.1 placeholder.

## Alternatives considered

- **Decision A — Extend `PlacedBar` shape with `isClippedStart` /
  `isClippedEnd` fields**. Reject.
  - Forces core `BarPlacementPass` (in `packages/gantt`, no Vue
    knowledge) to know about scroll state.
  - `scrollLeft` + `clientWidth` change reactively per scroll event;
    re-running the layout pipeline on every scroll tick would be
    O(n_bars) per frame — wasteful when only the 2 triangle-apex
    positions need to react.
  - Breaks the established "layout passes consume layout-only inputs"
    boundary (Phase 2 architectural decision; never broken since).
  - Forces ALL `BarPlacementPass.place` consumers (not just the
    adapter) to thread scroll state — golden-runner unit tests,
    parity tests, etc., none of which have scroll state.

- **Render-time derivation (Decision B — recommended)**. The
  triangle position is render-state, not layout-pipeline state.
  Co-located with the existing per-bar render closure that already
  consumes `renderX` / `renderWidth` / `bar.height` / etc.
  Reactive via Vue's natural ref-dependency tracking. Zero PlacedBar
  shape change, zero fixture churn. Same simplification pattern as
  Phase 29 (per-day CSS classes derived render-time from `tick.time`
  rather than added to `PlannedAxis` shape — Phase 29 net 0 fixture
  churn).

- **Decision C — Partial scope (right-edge only, defer left to
  Phase 27.2)**. Reject.
  - The work to wire `chartScroll` into the flatMap is shared
    between both sides — once `viewportClip.isViewportClippedStart`
    is computed, computing `isViewportClippedEnd` is free.
  - Splitting would leave a visibly asymmetric UX (bars sliding off
    the right get a triangle, bars sliding off the left don't) —
    surprising for users.
  - Saves ~30 minutes of work + ~4 test cases; net cost of the
    additional symmetric side is low.

- **Use `data-bar-id` proximity for parity assertion (per-bar
  alignment)**. Reject for v0. Cross-demo parity catches structural
  count divergence between chronix and k-ui; per-bar position
  parity is already implied by Phase 17's bar-bbox parity. Phase
  27.1's load-bearing risk is the FORMULA mismatch (viewport-edge
  vs bar-edge fire condition); a count-based check covers that.

- **Smooth animated triangle motion as user scrolls**. Reject.
  k-ui doesn't do this; Vue reactivity already re-runs the render
  on every scroll event, so the triangle "slides" along the
  viewport edge naturally without explicit animation code.

- **Track the viewport-clipped state on the `barId` map** for
  cross-frame consistency. Reject. Each render frame re-derives
  from current `chartScroll` state; no benefit to caching.

- **Suppress viewport-clipping for bars that are FULLY offscreen**
  (`renderX + renderWidth < scrollLeft` OR `renderX > viewportRight`).
  Defer (probably never). The triangle for a fully-offscreen bar
  paints at the viewport edge and is visually identical to a
  partially-clipped bar's triangle — the user just sees an arrow,
  doesn't know whether the bar is 1 px or 1000 px past the edge.
  Suppressing fully-offscreen bars would HIDE information (the user
  loses the "bar exists past this edge" hint entirely). The k-ui
  reference doesn't suppress; chronix follows suit.

- **Extract `triangleMargin` / `triangleSize` to `useChartScrollState`
  's API surface or to a separate constants module**. Reject. The
  constants are tightly coupled to the per-bar render closure; the
  helper takes them as parameters so it's testable in isolation.
  Module-level co-location in `chronix-gantt.ts` is the current
  Phase 27 pattern; consistency wins.

## Parity assertion plan — MANDATORY

This phase modifies `adapters/vue3/src/chronix-gantt.ts` (render
layer). Per Phase 27's precedent (4 parity assertions for triangle
counts across views), Phase 27.1 adds **2 cross-demo parity
assertions** specifically targeting viewport-clipped triangles
under programmatic horizontal scroll.

The chronix demo's existing week view (`viewId: 'week'`) has axis
totalWidth (~7 × day-slots × hourly-pxPerHour) > the chart-pane's
visible width on a typical 1280-wide viewport, so initial mount
already exhibits the viewport-clipping case at the right edge.
Programmatically scrolling to a middle scroll position exercises
both edges simultaneously.

| Assertion id (in parity.spec.ts)                                          | Drives both demos via                                                                                                              | Compares                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Tolerance      |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| `phase27_1-viewport-clipping count parity (week view, initial scroll)`    | `loadBothDemos` → viewId `week` → no programmatic scroll                                                                           | Combined left + right `cx-gantt-bar-continuation-*` count after initial mount. Should match k-ui's reference triangle count (which includes its own `containerWidth`-driven viewport-clipped triangles).                                                                                                                                                                                                                                                                                                                            | Exact equality |
| `phase27_1-viewport-clipping count parity (week view, scrolled to 400px)` | `loadBothDemos` → viewId `week` → programmatically set both demos' chart-pane `scrollLeft = 400` + `await page.waitForTimeout(50)` | Same selector count after scroll. Asserts both demos respond to scroll changes by re-firing viewport-clipped triangles (left triangles appear at viewport left edge for bars whose start is now offscreen-left; right triangles appear at viewport right for bars whose end is offscreen-right). Tolerance: exact count match. Optional second sub-assertion: read the apex `x` attribute of the leftmost left-triangle and assert it falls within `[scrollLeft, scrollLeft + 5px]` (i.e. the triangle locks to the viewport edge). | Exact equality |

Selector aliases reused from Phase 27:
`reference-dom-map.ts` already exports `CONTINUATION_LEFT` and
`CONTINUATION_RIGHT`. No new selector constants.

### Drift-detection scope

- **Covered**: structural triangle count under initial scroll +
  programmatic scroll. Catches:
  - Formula mismatch (e.g. chronix uses `<=` instead of `<` for
    `renderX < scrollLeft`) → count off by 1+ on each scroll position.
  - Pre-mount short-circuit failure (`clientWidth === 0` not handled)
    → false-positive triangles on initial render → count too high.
  - Reactivity failure (`chartScroll.scrollLeft` not establishing
    a dependency) → triangle count doesn't change post-scroll → count
    matches initial-mount count after scroll, not the expected new count.
- **NOT covered**:
  - Per-bar viewport-locked apex x position parity (implied by the
    OPTIONAL second sub-assertion above + Phase 17's bar-bbox parity).
  - Mouse-wheel scroll vs programmatic `scrollLeft` setter divergence
    — same scroll event path on both sides, structurally identical.
  - Touch scroll behavior — chronix v0 uniform pointer model; touch
    works through native `overflow: auto`'s default touch handling.
- **chronix-new declaration — N/A**. Viewport-clipping triangles
  have direct k-ui counterparts (`gantt-event-continuation-{left,right}`
  with `containerWidth`-driven branch). chronix and k-ui produce
  the same DOM emission semantics via different coord systems —
  algebraically equivalent. No chronix-new declaration needed.

## Test coverage

- **adapter helper** — `adapters/vue3/src/derive-viewport-clipping.test.ts`
  (new, ~8 tests):
  - "no viewport-clipping when bar is fully inside the viewport"
    (`renderX=100, renderWidth=200, scrollLeft=50, clientWidth=400`)
  - "viewport-clipped-start when bar's left edge is before viewport"
    (`renderX=20, scrollLeft=50` → `isViewportClippedStart=true`)
  - "viewport-clipped-end when bar's right edge is past viewport"
    (`renderX=200, renderWidth=300, scrollLeft=50, clientWidth=400`
    → viewport right = 450, bar right = 500 → `isViewportClippedEnd=true`)
  - "both flags fire when bar spans entire viewport"
  - "`clientWidth === 0` short-circuits both flags to false"
    (pre-mount frame)
  - "viewport-locked left apex = `scrollLeft + TRIANGLE_MARGIN`"
  - "viewport-locked right apex = `scrollLeft + clientWidth - TRIANGLE_MARGIN`"
  - "exact-boundary case: `renderX === scrollLeft` → NOT clipped
    (strict `<`)"

- **adapter SFC** —
  `adapters/vue3/src/chronix-gantt-viewport-clipping.test.ts`
  (new, ~5 tests). Uses programmatic scroll via setting
  `chartPaneEl.scrollLeft` + dispatching `'scroll'` event +
  `await nextTick()`:
  - "axis-clipped bar (Phase 27 case) renders triangle at bar's
    own edge with `data-viewport-clipped='false'`"
  - "viewport-clipped bar (axis-inside, scrolled-out) renders
    triangle at viewport edge with `data-viewport-clipped='true'`"
  - "bar that is both axis-clipped AND viewport-clipped on same
    side renders one triangle at viewport edge (precedence)"
  - "scroll event causes triangle count to update reactively"
    (set scrollLeft → assert count differs)
  - "pre-mount frame (`clientWidth = 0`) does NOT emit phantom
    viewport-clipped triangles"

- **parity** — `tooling/golden-runner/tests/parity.spec.ts`
  (+~120 LOC, +2 assertions per the Parity assertion plan).

Expected counts after Phase 27.1:

- vitest: 684 → ~697 (+13: 8 helper + 5 adapter SFC).
- parity-spec: 54 → 56 (+2 phase27_1-viewport-clipping).
- ChronixTheme tokens: 50 unchanged.
- cross-demo verify scenarios: 27 unchanged (existing scenarios at
  scrollLeft=0 may produce different bar-bbox results if the
  triangle is positioned via the new branch; pixel-bbox parity
  unaffected because only triangle apex moves).
- chronix-visual: 5 baselines unchanged at initial-mount scroll=0
  IF default views' chart-pane is wide enough to contain the full
  axis. **VRT impact analysis below**.

## VRT impact

**Predicted re-baseline count**: **5-12 PNGs** depending on the
demo's default chart-pane width vs each view's `totalWidth`.

Concrete VRT analysis per view:

- **chronix-visual baselines** (5: day, week, month, season,
  half-year, year):
  - **day view** (`totalWidth = 24 × hourlySlotWidth = 1440 px`):
    if demo chart-pane visible width >= 1440, NO viewport-clipping
    on initial mount, zero pixel change. If chart-pane is narrower
    (~ 1200 px on the default demo container after sidebar), bars
    on the right end get viewport-clipped → triangle appears at
    viewport right edge → baseline diffs.
  - **week view** (`totalWidth = 7 × dayWidth = 7 × ~200 = 1400 px`):
    similar to day-view; likely chart-pane is narrower on the
    default demo container.
  - **month / season / half-year / year views**: `totalWidth` grows
    proportionally; chart-pane stays the same → guaranteed
    viewport-clipping at right edge on initial mount → triangles
    appear → all 4 baselines diff.

  Conservative prediction: **4-5 of 5 chronix-visual baselines
  re-capture**. Each pixel-diff is small (one extra 6×12 px
  triangle at viewport right edge).

- **cross-demo VRT baselines** (15 chronix-side scenarios in
  `tooling/golden-runner/tests/visual.spec.ts`): same logic per
  view → predicted **8-12 of 15 re-capture**.

- **k-ui-side cross-demo baselines** (12): zero change. k-ui
  already emits viewport-clipped triangles via `containerWidth`.

Total predicted re-baseline: **12-17 PNGs**, similar to Phase 27's
~15-20 PNG estimate. Lower than Phase 23's 20 (Phase 23 was a
structural DOM change; Phase 27.1 only repositions/adds triangles).

`maxDiffPixelRatio: 0.001` tolerance may pass some scenarios
without explicit re-capture if the triangles fall on already-busy
pixel regions; previous phases consistently showed 30-60% of
predicted baselines actually fail verify (the others stay
pixel-identical because the new triangle paint over already-dark
pixels).

## Execution plan — 3 commits + wrap-up

### Commit 1 (design doc, this commit) — REQUIRES user review of 3 load-bearing decisions

Lands only `audit/PHASE_27_1_VIEWPORT_CLIPPING_DESIGN.md`. Awaits
user confirmation of the 3 questions at the bottom of this file
before implementation.

### Commit 2: Pure helper + SFC integration — ~13 tests

- `adapters/vue3/src/derive-viewport-clipping.ts` (new, ~30 LOC).
- `adapters/vue3/src/derive-viewport-clipping.test.ts` (new, ~8
  tests, ~100 LOC).
- `adapters/vue3/src/chronix-gantt.ts` (~50 LOC modified):
  - Remove `eslint-disable-next-line @typescript-eslint/no-unused-vars`
    on line 1220.
  - Import `deriveViewportClipping`.
  - Inside per-bar flatMap closure, compute `viewportClip` after
    drag-aware `renderX` / `renderWidth`.
  - Rewrite the existing Phase 27 left+right triangle emit blocks
    (lines 2181-2212) to combine axis + viewport clipping per §2
    above.
  - Add `data-viewport-clipped` attribute on the polygon emit.
- `adapters/vue3/src/chronix-gantt-viewport-clipping.test.ts` (new,
  ~5 tests, ~150 LOC).
- Rebuild `@chronixjs/gantt-vue3` dist:
  `pnpm --filter @chronixjs/gantt-vue3 build`.
- ci-check green (vitest 684 → ~697).
- Kill + restart chronix demo dev server (port 8702) to pick up
  rebuilt dist.

### Commit 3: Parity assertion + cross-demo VRT re-baseline

- `tooling/golden-runner/tests/parity.spec.ts` (+~120 LOC, +2
  `phase27_1-viewport-clipping-*` assertions per the Parity
  assertion plan).
- Run parity.spec.ts — both new assertions should pass.
- Run chronix-visual verify (`pnpm test:visual`); re-capture
  failing baselines (predicted 4-5 of 5).
- Run cross-demo verify (`pnpm test:cross-demo`); re-capture
  failing scenarios (predicted 8-12 of 15).
- ci-check green; cross-demo-verify gate green (27/27).

### Commit 4 (wrap-up — REQUIRES `/phase-close` invocation)

Before flipping this design doc's Status to DONE OR adding the
"Phase 27.1 — DONE" section to `audit/journal/`, MUST invoke
`/phase-close` skill. The skill verifies the 6 standard gates
(parity assertions present or chronix-new declared, journal section
written, memory updated, design status DONE, + catalog-completeness
CI gate green, + cross-demo-verify gate green, + prettier-clean tree).

- `audit/journal/2026-05-13.md` (continuation): "Phase 27.1 —
  Viewport-clipping flags + viewport-edge continuation triangles
  (DONE, YYYY-MM-DD)" section per the strict 6-sub-section template.
- `memory/project_gantt_rewrite_plan.md`: bump vitest 684 → ~697;
  parity-spec 54 → 56; add Phase 27.1 DONE marker.
- `audit/PHASE_27_1_VIEWPORT_CLIPPING_DESIGN.md` Status → DONE.
- `audit/PHASE_27_CONTINUATION_INDICATORS_DESIGN.md` — annotate
  the deferred-row in the disposition table (line 73) with "DONE
  Phase 27.1".

## Estimated scope

| Commit                          | Hours    | LOC est.                                      |
| ------------------------------- | -------- | --------------------------------------------- |
| 1 (design doc)                  | 0.5      | this file (~450 LOC)                          |
| 2 (helper + adapter + 13 tests) | 2.0      | ~80 LOC src + ~250 LOC tests                  |
| 3 (parity + VRT rebaseline)     | 1.5      | ~120 LOC parity tests + 12-17 PNG re-captures |
| 4 (wrap-up)                     | 0.25     | journal + memory + status flips               |
| **Total**                       | **4.25** | ~900 LOC + 12-17 baseline PNGs                |

Within single-session discipline (per
`feedback_quality_acceleration.md` constraint #3). Matches the
4-5h roadmap estimate.

## 4-dimension audit check

Per `feedback_4_dimension_audit_checklist.md`, this phase
explicitly walks all 4 audit dimensions:

| Dimension                     | Coverage in Phase 27.1                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Options surface**           | Zero — no new component prop, no new composable input, no new theme token. Phase 23's `useChartScrollState` is already plumbed; Phase 27.1 only consumes its output.                                                                                                                                                                                                                                                                                                       |
| **Render code**               | LOAD-BEARING — per-bar flatMap closure gains: (a) `viewportClip` derivation call to new helper; (b) rewritten triangle emit block combining axis + viewport clipping with viewport-locked apex precedence; (c) `data-viewport-clipped` attribute on each polygon. Pure additive on the polygon node's attribute set; existing axis-clipping codepath still triggers as before.                                                                                             |
| **Interaction code**          | Zero impact — `pointer-events: none` on every polygon (unchanged from Phase 27). Existing pointer-hit-test / drag / resize / click / select tests untouched. Triangles paint above bar body at the viewport edge but don't intercept clicks.                                                                                                                                                                                                                               |
| **Layout-algorithm pipeline** | Zero impact — no PlannedAxis / PlacedBar / RoutedLink shape change. No new layout pass. No layout-pipeline input change. The triangle-position derivation is render-state, intentionally NOT layout-pipeline state. This is consistent with Phase 29's render-time-from-`tick.time` pattern (also zero PlannedAxis change) — the principle is: data that depends on reactive runtime state (scroll, viewport) belongs in the render closure, not in static layout outputs. |

The Layout-algorithm-pipeline-integrity dimension is the one that
historically hid silent gaps (per the Phase 30 bar-stacking
finding). Phase 27.1 has zero cross-pipeline coupling:
`useChartScrollState` (Phase 23) → adapter render closure
(Phase 27.1). No intermediate-output drop risk because there is
no intermediate output — the data flow is a single hop from
reactive ref to render attribute.

## Open questions for the user — 3 load-bearing decisions

**1. Derivation site: A (extend `PlacedBar` with `isClippedStart` / `isClippedEnd` fields, computed in `BarPlacementPass`) / B (render-time derivation via new pure helper `deriveViewportClipping`, no PlacedBar shape change) / C (partial — right edge only this phase, left edge in Phase 27.2)** — recommend **B**.

- **B (recommended)**: render-state belongs in the render closure.
  `chartScroll.scrollLeft.value` + `chartScroll.clientWidth.value`
  are reactive refs that change frame-by-frame; pushing them into
  the layout pipeline (option A) would force layout re-runs on
  every scroll tick — O(n_bars) wasted work per frame. Phase 29
  established this simplification pattern with zero fixture churn
  (`getDayClassNames` derived render-time from `tick.time`, not
  added to `PlannedAxis` shape). Phase 27.1 follows suit. Zero
  PlacedBar shape change → zero fixture churn → zero core test
  impact.

- **A (rejected)**: would add `isClippedStart` / `isClippedEnd`
  to `PlacedBar`, forcing `BarPlacementPass.place` to read
  `scrollLeft` + `clientWidth` as new layout inputs. Architectural
  drift — breaks the established "layout consumes layout-only
  inputs" boundary (Phase 2 architectural decision, never
  violated). Forces all `BarPlacementPass` consumers (core unit
  tests, parity tests, etc., none of which have scroll state) to
  thread fake scroll values. Predicted 6+ fixture file churn.

- **C (rejected)**: splitting the work leaves a visibly asymmetric
  UX (right-edge bars get a triangle, left-edge bars don't)
  surprising to users. The work to wire `chartScroll` into the
  flatMap is shared between both sides — computing
  `isViewportClippedEnd` once `isViewportClippedStart` is
  available is essentially free.

**Recommendation**: **B**. Render-time derivation via pure helper.

---

**2. Test surface for reactivity: A (extract pure helper `deriveViewportClipping(renderX, renderWidth, scrollLeft, clientWidth, triangleMargin) → ViewportClippingResult` + SFC tests programmatically set `paneEl.scrollLeft` + dispatch `'scroll'` event + `await nextTick`) / B (refactor `<ChronixGantt>` to accept an optional `chartScrollOverride?: ChartScrollState` input for test injection, bypassing the composable in jsdom) / C (skip SFC reactivity tests; rely on the pure helper's unit tests + the parity assertions for cross-demo behavior)** — recommend **A**.

- **A (recommended)**: pure helper is the clean unit-test target
  (8 cases above). SFC tests do programmatic scroll via jsdom's
  native `scrollLeft` setter + `dispatchEvent('scroll')` —
  Phase 23's `useChartScrollState` already supports this path
  (the composable listens on the native `scroll` event). 5 SFC
  tests verify reactive update + branch precedence. Helper +
  SFC together pin all formula edges + reactivity behavior; the
  parity assertion pins cross-demo behavior.

- **B (rejected)**: would add a test-only input field to a
  production component prop interface. Pollutes the public
  surface. Pattern is awkward when `chartScroll` is just one of
  many internal composables in `<ChronixGantt>`'s setup (none
  of the others have an injection override).

- **C (rejected)**: skips reactivity testing entirely. Reactivity
  is the load-bearing thing in Phase 27.1 (the user-visible
  feature is "triangle reacts to scroll"). Not testing
  reactivity at the SFC level means a regression in `chartScroll`
  ref-dependency tracking (e.g. someone accidentally reads
  `.value` outside a reactive context) would only be caught by
  the parity assertion — slow, expensive, indirect signal.

**Recommendation**: **A**. Pure helper + SFC programmatic-scroll
tests.

---

**3. Title + progress-dot interaction with viewport-clipped triangles: A (defer to Phase 28.2.1 — Phase 27.1 leaves Phase 28.2's title-positioning logic alone; title may visually overlap the viewport-locked triangle on bars whose title is wider than the visible portion) / B (bundle into Phase 27.1 — extend Phase 28.2's `leftPadding` / `rightPadding` computation to also check `isViewportClippedStart` / `isViewportClippedEnd`) / C (gate Phase 27.1 on Phase 28.2.1 — refuse to land 27.1 until the title-position adapter is ready)** — recommend **A**.

- **A (recommended)**: scope discipline. Phase 28.2.1 is already
  roadmapped as the planned consumer of viewport-clipping flags
  for title + progress-dot positioning. Phase 27.1 lands the
  triangle infrastructure (load-bearing visual indicator);
  Phase 28.2.1 lands the title/dot adapter that consumes the same
  `deriveViewportClipping` helper. Splitting matches the existing
  Phase 27 (triangle) → Phase 28.2 (title) → Phase 28.2.1 (title
  ×scroll) cascade. Interim visual issue (title text behind
  translucent 0.8-opacity triangle) is small + easy to reverse.

- **B (rejected)**: bundles two concerns. Triangle work is purely
  additive on the polygon emit. Title work would touch the
  existing Phase 28.2 title-positioning block (chronix-gantt.ts:2254-2270),
  the title-padding computation, AND would need its own test
  coverage (~6 tests for `leftPadding` adapts to viewport-clipping;
  ~6 for `rightPadding`). Triples the Phase 27.1 scope. Violates
  single-responsibility per phase (`feedback_quality_acceleration.md`
  #3).

- **C (rejected)**: blocks Phase 27.1 on a phase that's not yet
  designed. Phase 28.2.1 hasn't entered the design queue; gating
  would idle Phase 27.1 indefinitely. The interim visual issue is
  acceptable.

**Recommendation**: **A**. Defer title + progress-dot adapter to
Phase 28.2.1.

---

Reply **按推荐继续** to accept all three (B / A / A), or call out
any 1-3 to override.
