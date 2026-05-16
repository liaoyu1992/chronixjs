# Phase 28.1 — Selection overlay + visible resize handle

**Status**: **Approved (pending user reply)** — design only; no code yet.

## Problem

The parity reference's default demo gives the user immediate visual
feedback when a bar is selected: a thin rounded border outlines the
bar (`gantt-event-selection-border`), and 2 small white "grab dots"
appear on the bar's left + right edges (`gantt-event-handle`) signalling
that the bar can be resized by dragging. Independent of selection,
every editable bar carries 2 transparent edge-zone rects
(`gantt-event-resizer-start` / `-end`) with `cursor: ew-resize` so the
mouse pointer changes when hovering the resize zone — telling the user
"grab this edge to resize" before any click happens.

Chronix toggles a `cx-gantt-bar--selected` CSS class on the bar's
`<rect>` when the bar is selected, but emits **no default visual** —
consumer CSS is required to make a selected bar look different from
an unselected one. There is no resize-cursor hint at all: chronix's
pointer-hit-test owns resize-edge detection geometrically but does not
emit any DOM element, so the browser shows the default cursor over the
resize zone (no `cursor: ew-resize` change). Side-by-side with the
parity reference, clicking a chronix bar produces no visible feedback,
and hovering its edge gives no cursor cue that it's resizable.

User flagged this on the 2026-05-16 render-layer sweep as cluster C
item #2 (`audit/RENDER_LAYER_GAP_SWEEP_2026-05-16.md` Sections H.5 +
H.9 + O.1). It is the **fourth and final user-flagged silent gap**
from that sweep — Phase 26 closed grid lines (#1), Phase 27 closed
continuation triangles (#2), Phase 28.2 closed bar title auto-render
(#3); selection visual + resize cursor is the remaining one.

The data needed is already in chronix: Phase 12 selection model gives
`selectedBarSet`, Phase 27 added `bar.isStart` / `bar.isEnd` to
`PlacedBar` (used here to position resize-dot away from continuation
triangles), Phase 20 cascade gives resolved bar colors. Nothing new
in the layout pipeline — this is render-layer only.

## Reference (k-ui) behavior surface — full catalog

The render code lives in
`d:/work/k-ui/packages/gantt/src/timeline/TimelineEvent.tsx`:

- **Edge resize zones** (437-497): when `isDateChangeable && !isMirror`,
  emit 2 SVG `<rect class="gantt-event-resizer-start" />` and
  `<rect class="gantt-event-resizer-end" />`, each `edgeResizeZone`
  wide (= 8 px), full bar height, `fill="transparent"`,
  `pointer-events: 'auto'`, `cursor: 'ew-resize'`. Position: left rect
  at `x=barX`, right rect at `x=barX + finalWidth - 8`. Special
  collision branch at lines 452-495 narrows the right rect to 4 px
  when the progress fill is within 2 px of the right edge.
- **Visible resize dots** (500-541): when `isDateChangeable` and the
  bar is selected (gated by CSS — see below), emit 2 SVG
  `<rect class="gantt-event-handle gantt-event-handle-start gantt-event-resizer gantt-event-resizer-start" />`
  / `-end`. Each is `handleWidth` × `handleHeight` (= 8 × 8) with
  `rx/ry = barCornerRadius`. Position: 1 px inset from each bar edge,
  vertically centered. Renders transparent — CSS `--gantt-event-resizer-dot-*`
  variables make them visible (white fill + colored border) only when
  `.gantt-event-selected .gantt-event-resizer` (line 543-551).
- **CSS visibility rules** (`core-css-inline.ts:532-551`):
  - `.gantt-event .gantt-event-resizer { display: none }` — base hidden.
  - `.gantt-event-selected .gantt-event-resizer` AND
    `.gantt-event:hover .gantt-event-resizer` → `display: block`. So
    edge zones AND visible dots show on both hover AND selected.
  - `.gantt-event-selected .gantt-event-resizer` adds border-radius +
    border + `background: var(--gantt-page-bg-color)` (white) to turn
    the transparent rect into a visible dot.
- **Selection border rect** (659-673): when `isSelected`, emit one
  SVG `<rect class="gantt-event-selection-border" />` covering the
  full bar (`width=finalWidth, height=height`) with
  `rx/ry = barCornerRadius`, `fill="none"`, `stroke="rgba(0,0,0,0.3)"`,
  `strokeWidth="2"`, `pointer-events: 'none'`.
- **`:before` / `:after` pseudo-element overlay** (`core-css-inline.ts:567-588`):
  for `.gantt-event-selected`, adds a CSS `:after` overlay covering
  the bar with `background: var(--gantt-event-selected-overlay-color)`
  - a `:before` overlay for box-shadow. **CSS pseudo-elements do not
    apply to SVG elements** — these rules only take effect for k-ui's
    HTML-mode rendering (`gantt-h-event`, `.gantt-event-main`). The SVG
    TimelineEvent rendering at lines 659-673 is `gantt-event-selection-border`
    rect only — no pseudo-overlay.
- **CSS variables consumed** (`core-css-inline.ts:543-551`):
  - `--gantt-event-resizer-dot-total-width` (default 8 px) — dot size.
  - `--gantt-event-resizer-dot-border-width` (default 1 px) — dot border.
  - `--gantt-event-selected-overlay-color` (default `rgba(0,0,0,0.25)`) —
    HTML-only pseudo-element overlay color.
  - `--gantt-page-bg-color` (default `#fff`) — dot background.
- **Cross-over rejection** (`EventResizing.ts:302-318`): k-ui drops
  resize mutations that would make `end < start`. Chronix has accepted
  this as a P1 architectural divergence (chronix delegates the policy
  to the host application via the validation hooks — Phase 19) — out
  of scope for Phase 28.1.

### Surface-level disposition table

| Item                                                                                                                                                         | k-ui                                                                        | chronix v0                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Selection border SVG `<rect>` (rounded, no-fill, dark stroke 2 px) emitted when bar is selected                                                              | `TimelineEvent.tsx:659-673`                                                 | ✅ **port** as `cx-gantt-bar-selection-border` rect. Same geometry (`rx/ry = barCornerRadius`, full bar bounds). Default stroke from theme token `barSelectedBorderColor` (default `'rgba(0,0,0,0.3)'`). `pointer-events: 'none'`.                                                                                                                                                                                                                                                                                           |
| HTML `:before` / `:after` pseudo-element overlay (translucent fill + box-shadow on selected bar)                                                             | `core-css-inline.ts:567-588`                                                | ❌ **Reject for SVG mode** — CSS pseudo-elements do not apply to SVG. The parity reference's pseudo-overlay only fires for HTML-mode `gantt-h-event` rendering, NOT for the SVG `TimelineEvent` chronix mirrors. A direct equivalent (translucent SVG `<rect>` overlay) is **bundled into the selection-border decision** (option A keeps the simpler one-rect border-only model; option B adds the overlay rect). See decision 1.                                                                                           |
| Transparent edge resize zones (left + right rects, full bar height, 8 px wide, `cursor: ew-resize`)                                                          | `TimelineEvent.tsx:437-497`                                                 | ✅ **port** as `cx-gantt-bar-resizer-start` / `-end` rects. `fill="transparent"`, `pointer-events: 'auto'`, `cursor: 'ew-resize'` inline style. Always emitted when bar is editable + has axis-overlap. Width from theme token `barResizerThickness` (default 8 px).                                                                                                                                                                                                                                                         |
| Visible white dot handles (8 × 8 transparent `<rect>` with `rx/ry`; CSS makes them visible when selected or hovered)                                         | `TimelineEvent.tsx:500-541`                                                 | ✅ **port** as `cx-gantt-bar-resizer-dot-start` / `-end` rects. Emitted only when bar is selected (chronix v0 skips hover state — see decision 3). Fill = theme `barResizerDotFill` (default `#fff`), stroke = resolved `borderColor` from Phase 20 cascade, strokeWidth 1 px, `rx/ry = barCornerRadius`. Size from theme `barResizerDotSize` (default 8 px). Position: 1 px inset from bar edge, vertically centered. Triangle-aware shift when `!bar.isStart`/`!isEnd`.                                                    |
| Hover-state visibility (`.gantt-event:hover .gantt-event-resizer` shows dots on hover)                                                                       | `core-css-inline.ts:538-541`                                                | ⏸️ **Defer-indefinite** — chronix has no hover-state tracking (Section J.12 hover detection is defer-indefinite — no `EventHovering` analog, no `data-event-hover` attribute toggle). Phase 28.1 emits visible dots **only when selected**. Re-prioritize alongside J.12 when a consumer asks for hover affordances. Cross-demo cross VRT will show k-ui dots-on-hover diverging from chronix selected-only; documented in VRT impact.                                                                                       |
| Resize-zone + progress-fill collision branch (right rect narrows to 4 px when progress edge is within 2 px of bar's right edge)                              | `TimelineEvent.tsx:452-495`                                                 | ⏸️ **Defer-indefinite** — edge case; chronix v0 emits the 8-px right zone unconditionally. The visual collision is minor (the 8-px zone overlaps the progress-edge by up to 6 px, still draggable since rect is transparent). Re-prioritize on consumer report of "progress handle and resize handle visually conflict at 100% progress".                                                                                                                                                                                    |
| `cx-gantt-bar--selected` class on the bar's main `<rect>` (existing chronix behavior)                                                                        | k-ui: `gantt-event-selected` on `<g>`                                       | ✅ **already-done** (kept as-is). Chronix's bar `<rect>` keeps the `cx-gantt-bar--selected` modifier class; new selection-border rect is a SEPARATE sibling rect so consumers can target either independently.                                                                                                                                                                                                                                                                                                               |
| CSS `--gantt-event-resizer-dot-total-width` / `-dot-border-width` (two separate variables)                                                                   | `core-css-inline.ts:543-551`                                                | ⏸️ **Defer-indefinite** — chronix v0 collapses to one `barResizerDotSize` token (= total width); border width is hard-coded to 1 px to match the parity reference's default. Splitting becomes worthwhile only if a consumer asks for a wide-border / thick-dot variant. See decision 1.                                                                                                                                                                                                                                     |
| `cursor: ew-resize` on edge zones (CSS cursor change)                                                                                                        | inline `style: { cursor: ... }`                                             | ✅ **port** as inline SVG `style="cursor: ew-resize"`. Same place where k-ui sets it.                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Edge zone interaction wiring (`onMouseDown` calls `onMouseDown(e, 'start' / 'end')` on the dot handles)                                                      | `TimelineEvent.tsx:513-538`                                                 | ❌ **Architecturally different** — chronix's pointer interaction is owned by `useGanttPointer` + `pointer-hit-test.ts` at the wrapper level (Phases 9 + 19); the new resize-zone rects are **decorative** (cursor styling only) and rely on event-bubble through the wrapper. Existing `pointer-hit-test.ts` resize-edge logic stays the source of truth for "which edge did the user grab"; the new rects do not own that decision.                                                                                         |
| ⭐ **`hasAxisOverlap` gate** — bars whose calendar range falls entirely outside the visible axis (the `bar.x < a.totalWidth && bar.x + bar.width > 0` check) | k-ui's `TimelineEvent` doesn't mount for off-axis bars (no children at all) | ✅ **port** verbatim. Phase 26 (grid lines), Phase 27 (continuation triangles), and Phase 28.2 (bar title) all converged on this gate as the third consecutive cross-demo-parity-driven discovery (`audit/journal/2026-05-13.md` Phase 28.2 "third consecutive phase" entry). Phase 28.1 adopts the gate **proactively** at design time for selection-border / resize-zone / dot emissions: off-axis bars emit no selection visual + no resize zones + no dots, matching the parity reference's mount-vs-no-mount semantics. |

**Phase 28.1 net surface**: 6 ✅-port items (selection-border rect +
edge-zone rects + dot rects + cursor style + bar--selected class kept +
axis-overlap gate), 1 ❌-reject for SVG mode (pseudo-element overlay
— bundled into decision 1 as optional translucent-overlay rect), 1
❌-architectural (`onMouseDown` direct binding — chronix uses
wrapper-level hit-test instead), 3 ⏸️-defer items (hover state, narrow-
right-zone collision branch, split dot-total / dot-border tokens).

The new chronix class names mirror the parity reference's selectors
with the chronix `cx-` + bar-prefix swap:

| k-ui                                           | chronix                          |
| ---------------------------------------------- | -------------------------------- |
| `gantt-event-selection-border`                 | `cx-gantt-bar-selection-border`  |
| `gantt-event-resizer-start`                    | `cx-gantt-bar-resizer-start`     |
| `gantt-event-resizer-end`                      | `cx-gantt-bar-resizer-end`       |
| `gantt-event-handle-start` (selected, visible) | `cx-gantt-bar-resizer-dot-start` |
| `gantt-event-handle-end`                       | `cx-gantt-bar-resizer-dot-end`   |

## Approach

### Theme tokens — `packages/gantt/src/api/chronix-theme.ts`

Add 4 new flat tokens after the Phase 28.2 grid-lines block:

```ts
export interface ChronixTheme {
  // ... existing 46 tokens ...

  // ----- Bar selection + resize handles (Phase 28.1) -----
  /**
   * Stroke color for the selection-border SVG rect rendered on top of
   * a selected bar (`.cx-gantt-bar-selection-border`). Default
   * `'rgba(0,0,0,0.3)'` matches the parity reference's hard-coded
   * stroke for `gantt-event-selection-border`.
   */
  readonly barSelectedBorderColor: string;
  /**
   * Stroke width (px) for the selection-border SVG rect. Default `2`
   * matches the parity reference's `strokeWidth="2"`.
   */
  readonly barSelectedBorderWidth: number;
  /**
   * Width (px) of the transparent edge-zone rects emitted on each
   * editable bar (`.cx-gantt-bar-resizer-start` / `-end`) for cursor
   * styling. Default `8` matches the parity reference's
   * `edgeResizeZone` = 8 px. The pointer-hit-test layer's edge-zone
   * width (currently a separate file-private constant) is read from
   * this token in the same commit so the cursor cue and the hit-test
   * boundary stay synchronized.
   */
  readonly barResizerThickness: number;
  /**
   * Total side length (px) of the visible white dot handles emitted
   * when a bar is selected (`.cx-gantt-bar-resizer-dot-start` /
   * `-end`). Default `8` matches the parity reference's
   * `--gantt-event-resizer-dot-total-width` default. Per
   * `feedback_no_logic_drift_from_kui.md` the parity reference also
   * exposes a separate `-dot-border-width` variable; chronix v0
   * collapses to one token (border width hard-coded to 1 px). Re-
   * prioritize on consumer ask.
   */
  readonly barResizerDotSize: number;
}
```

Defaults:

```ts
barSelectedBorderColor: 'rgba(0,0,0,0.3)',
barSelectedBorderWidth: 2,
barResizerThickness: 8,
barResizerDotSize: 8,
```

Test updates in `packages/gantt/src/api/chronix-theme.test.ts`:

- Add 4 new keys to `EXPECTED_TOKEN_KEYS` (46 → 50).
- Add `barSelectedBorderColor` to `stringKeys`.
- Add `barSelectedBorderWidth`, `barResizerThickness`, `barResizerDotSize`
  to `numberKeys`.

### Pointer-hit-test coordination — `packages/gantt/src/interaction/pointer-hit-test.ts`

Currently `pointer-hit-test.ts:105-118` (approx.) decides the resize-
edge zone width via a file-private constant. Phase 28.1 reads
`barResizerThickness` at the same call site so the cursor cue (DOM
rect) and the hit-test boundary (geometric) stay aligned to a single
configurable value. No algorithmic change — just thread the value
from theme.

**Behavior preserved**: existing tests cover edge-vs-body classification
at the current 8 px boundary; with the default theme value still 8, all
tests pass unchanged. If a consumer overrides `barResizerThickness` to
12, the hit-test grows to match — same configurability story as Phase
20 colors.

### Adapter render — `adapters/vue3/src/chronix-gantt.ts`

In the per-bar render block (after Phase 28.2's bar-text emission,
before Phase 7's progress fill — paint order: rect → triangles →
title → selection-overlay → progress → dots → border → resize-zones):

1. **Compute `selectionHasAxisOverlap`** (mirror Phase 28.2's
   `titleHasAxisOverlap`): `bar.x < a.totalWidth && bar.x + bar.width > 0`.
2. **Edge resize zones**: when bar is editable + axis-overlap, emit 2
   rects (`cx-gantt-bar-resizer-start` left + `cx-gantt-bar-resizer-end`
   right). `fill="transparent"`, `width = t.barResizerThickness`,
   `height = bar.height`, `pointer-events: auto`,
   `style="cursor: ew-resize"`. Insert AFTER the bar's main rect to
   ensure pointer events bubble over the bar's body.
3. **Selection-border rect**: when `isSelected && selectionHasAxisOverlap`,
   emit one `cx-gantt-bar-selection-border` rect. `width = renderWidth`,
   `height = bar.height`, `rx/ry = 0` (chronix's bars currently have
   square corners; theme `barCornerRadius` is a future token), `fill="none"`,
   `stroke = t.barSelectedBorderColor`,
   `stroke-width = t.barSelectedBorderWidth`, `pointer-events: none`.
4. **Visible dot handles**: when `isSelected && selectionHasAxisOverlap`,
   emit 2 dot rects. Geometry:
   - `dotSize = t.barResizerDotSize` (= 8).
   - Vertical center: `dotY = renderY + (bar.height - dotSize) / 2`.
   - Left dot x: `renderX + 1` (1-px inset). Right dot x:
     `renderX + renderWidth - dotSize - 1`.
   - When `!bar.isStart`, shift left dot x to clear the continuation
     triangle: `renderX + TRIANGLE_MARGIN + TRIANGLE_SIZE + 2` (= 9 px,
     analogous to Phase 28.2's `TITLE_TRIANGLE_GAP`).
   - When `!bar.isEnd`, shift right dot x analogously:
     `renderX + renderWidth - TRIANGLE_MARGIN - TRIANGLE_SIZE - dotSize - 2`.
   - Fill = theme `barResizerDotFill` (default `#fff`, hard-coded
     for v0 — added to design surface? **DECISION** — see option B in
     decision 1; if rejected, hard-code in adapter).
   - Stroke = `resolvedStyle.borderColor` (Phase 20 cascade resolves the
     dot border to match the bar's resolved border color — visually
     coherent without a separate token).
   - `pointer-events: none` so dots don't block edge-zone interaction
     (the underlying edge-zone rect owns the hit test + cursor).

Selectors in chronix code (test scaffolding + render references)
read from `tooling/golden-runner/src/reference-dom-map.ts` exports
matching Phase 26/27/28.2 convention.

### Component prop surface

No new component-level props. Selection visual feedback is
**theme-driven only** (the 4 new theme tokens). Per-bar override is
NOT in scope for v0:

- k-ui has no `eventSelectedColor` callback for selection visual —
  the override path there is "consumer extends `--gantt-event-selected-overlay-color`
  in CSS at the rendered HTML element". Chronix's equivalent is theme
  tokens (single chart-wide override; per-bar would need a new
  callback path with no upstream parallel).
- Future: if a consumer asks for per-bar `selectionBorderColor`, add a
  `barSelectedBorderColorCallback` mirroring Phase 20's 3-color
  callbacks. Out of scope here.

### Sample consumer

```vue
<template>
  <ChronixGantt
    :bars="bars"
    :rows="rows"
    :axis-input="axisInput"
    :selected-bar-ids="selection.selectedBarIds.value"
    :theme="{
      barSelectedBorderColor: '#3b82f6',
      barSelectedBorderWidth: 2,
      barResizerDotSize: 10,
    }"
    @bar-click="selection.handleBarClick"
    @empty-area-click="selection.handleEmptyAreaClick"
  />
</template>

<script setup lang="ts">
import { useGanttSelection } from '@chronixjs/gantt-vue3';
const selection = useGanttSelection();
</script>
```

With default theme: black 30%-alpha border, white 8-px dots, 8-px
resize zones with `cursor: ew-resize`. Consumer overrides via theme
prop. No new event emissions, no new composables.

### Alternatives considered

- **Add HTML-mode pseudo-element overlay (`:before` / `:after`)** —
  Reject. CSS pseudo-elements do not apply to SVG. The parity
  reference's overlay only fires for HTML-mode rendering; chronix
  exclusively renders SVG.
- **Add a translucent SVG `<rect>` overlay covering the bar (selection-
  overlay, distinct from border)** — bundled into **decision 1**.
  Option A: border only (matches parity reference's SVG mode exactly).
  Option B: border + translucent overlay rect (approximates the
  HTML-mode visual feedback for SVG consumers).
- **Per-bar callback for selection visual** — Defer-indefinite. No
  upstream parallel; consumer ask absent. Theme tokens cover the
  chart-wide override case.
- **Custom resize-cursor-only mode without resize-zone DOM rects**
  (just inline `style="cursor: ew-resize"` on the bar's main rect over
  the edge regions) — Reject. Bar `<rect>` is one element; CSS cursor
  is element-scoped, not coordinate-scoped. Edge-zone rects are the
  only SVG-native way to localize the cursor change to the bar's edge.
- **Always-visible resize dots (independent of selection)** — Reject.
  Visual clutter; the parity reference's "show only when selected /
  hover" model is the right tradeoff. Chronix v0 skips hover (J.12
  defer) — selected-only is what's left.
- **Use existing geometric edge zones from `pointer-hit-test.ts`
  as the cursor source** — Reject. Geometric hit-test runs in
  pointermove handler; setting `body.style.cursor` from JS produces
  flicker + breaks at the boundary between edge and body. CSS cursor
  on a static SVG rect is event-loop-free and pixel-accurate.

## Parity assertion plan — MANDATORY

This phase modifies `packages/gantt/src/api/chronix-theme.ts` (core
tokens), `packages/gantt/src/interaction/pointer-hit-test.ts` (read
threshold from theme — algorithm preserved), AND
`adapters/vue3/src/chronix-gantt.ts` (render). Parity assertions are
mandatory.

The cross-demo parity tests need a way to put bars into the selected
state on both sides:

- **k-ui side**: the parity-mode demo exposes a controllable initial
  selection through the existing `selectedEventIds` prop on the demo's
  `<KGantt>` component. The cross-demo loader will pass a 2-element
  selection (event ids `'event-1'` + `'event-3'` — first + third in
  the parity fixture).
- **chronix side**: same — `<ChronixGantt>` already accepts
  `selectedBarIds` as a controlled prop (Phase 12). The parity-mode
  example wires it from a URL query param (`?selected=event-1,event-3`)
  that the loader sets before screenshot capture.

If the parity-mode demos don't already expose a selection-from-URL
hook, Commit 4 adds the minimal plumbing (~30 LOC across the two
`sample-data-parity.ts` files) — the alternative would be Playwright
clicking bars before assertions, which is fragile + slower.

| Assertion id (in parity.spec.ts)                                                      | Drives k-ui demo via                             | Drives chronix demo via | Compares                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Tolerance      |
| ------------------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| `phase28.1-selection-border count parity (week view, 2 selected)`                     | `loadBothDemos` with `?selected=event-1,event-3` | same                    | Count of selection-border rects (chronix `.cx-gantt-bar-selection-border`; k-ui `.gantt-event-selection-border`). Both sides emit one per selected bar that has axis overlap. With 2 selected + both axis-overlapping → both sides should report exactly 2.                                                                                                                                                                                                      | Exact equality |
| `phase28.1-resizer-zone count parity (week view)`                                     | `loadBothDemos` (any selection state)            | same                    | Count of edge-zone rects (start + end) summed across both sides. Both emit 2 per editable axis-overlapping bar. Verifies the always-on edge-zone behavior independent of selection.                                                                                                                                                                                                                                                                              | Exact equality |
| `phase28.1-resizer-dot count parity (week view, 2 selected)`                          | `loadBothDemos` with `?selected=event-1,event-3` | same                    | Count of visible dot rects (start + end). Both emit 2 per selected axis-overlapping bar; with 2 selected → 4 dots each side. **NOTE**: k-ui's CSS also makes dots visible on `:hover`; Playwright screenshot is captured without mouse over a bar so hover state shouldn't fire. If it does, the test selector `.cx-gantt-bar-resizer-dot-*` for chronix vs `.gantt-event-handle` for k-ui needs to exclude hover-only matches. Address in Commit 4 if observed. | Exact equality |
| `phase28.1-resizer-zone count parity respects axis-overlap (day view, narrow window)` | `loadBothDemos` viewId `day`                     | same                    | Day-view axis shows ~1 day; some fixture bars (multi-day) extend past the right edge, some are entirely before/after. Verifies edge-zone count matches between sides when off-axis bars are excluded.                                                                                                                                                                                                                                                            | Exact equality |

Selectors queried via `page.evaluate(() => document.querySelectorAll(selector).length)`
inline in each test. New `reference-dom-map.ts` exports:

- `SELECTION_BORDER`
- `RESIZER_ZONE_START` / `RESIZER_ZONE_END`
- `RESIZER_DOT_START` / `RESIZER_DOT_END`

### Drift-detection scope

- **Covered**:
  - Structural count of selection-border rects (4 assertion: 2 selected → 2 border rects per side).
  - Structural count of edge-zone rects (4 per axis-overlapping bar × N axis-overlapping bars per view).
  - Structural count of visible-dot rects (4 per selected bar — 2 dots × 2 sides).
  - Axis-overlap gate behavior — day-view assertion specifically exercises bars off-axis.
- **NOT covered**:
  - **Per-rect pixel position parity** (selection-border `x` / `y` / `width` etc.). Per-bar bar-bbox parity from Phase 17/20.5 already covers the underlying geometry; the new rects derive from the same bar bbox so position parity is implied. If a future bug shifts the selection-border by 1 px, bar-bbox parity catches it.
  - **Hover-state behavior** — chronix doesn't track hover (J.12 defer). Cross-demo VRT will show k-ui dots-on-hover as a divergence; documented in VRT impact section.
  - **`cursor: ew-resize` visual feedback** — Playwright can't assert cursor styling without a mouseover. Validation is by manual browser check (item in execution plan Commit 4).
  - **Resize interaction wiring** — chronix's resize behavior is owned by Phases 9 + 19 and is already covered by existing transaction tests. The new edge-zone rects do not own the interaction.

## Test coverage

- **core** — `packages/gantt/src/api/chronix-theme.test.ts` (+1 test): 4 new key assertions + type bucket checks (already covered by the `EXPECTED_TOKEN_KEYS` + `stringKeys` / `numberKeys` arrays — the existing comprehensive test catches all 4 in one assertion). Net new test count: ~1 (a dedicated "Phase 28.1 tokens are sensible defaults" sanity test that pins `barResizerThickness === 8`, `barResizerDotSize === 8`, `barSelectedBorderWidth === 2`).
- **core** — `packages/gantt/src/interaction/pointer-hit-test.test.ts` (~+3 tests): "edge-zone threshold reads from `barResizerThickness` parameter" + "hit-test classifies bar-edge correctly when threshold is overridden to 12" + "hit-test boundary moves continuously with the threshold parameter".
- **adapter** — `adapters/vue3/src/chronix-gantt-selection.test.ts` (new, ~12 tests):
  - "emits no `.cx-gantt-bar-selection-border` when no bar is selected"
  - "emits one `.cx-gantt-bar-selection-border` per selected axis-overlapping bar"
  - "omits selection-border for selected bars that fail axis-overlap gate (`bar.x + width <= 0` or `bar.x >= totalWidth`)"
  - "selection-border `stroke` and `stroke-width` follow theme tokens"
  - "always emits 2 resize-zone rects per editable axis-overlapping bar regardless of selection"
  - "resize-zone `width` follows theme `barResizerThickness`"
  - "resize-zone rect has `cursor: ew-resize` inline style"
  - "emits 2 visible dot rects per selected axis-overlapping bar"
  - "omits dot rects for unselected bars"
  - "dot `width`/`height` follow theme `barResizerDotSize`"
  - "left dot x shifts right by `TRIANGLE_MARGIN + TRIANGLE_SIZE + 2` when `!bar.isStart` (clear continuation triangle)"
  - "right dot x mirrors the shift when `!bar.isEnd`"
- **parity** — `tooling/golden-runner/tests/parity.spec.ts` (+4 assertions per the table above).

Expected counts after Phase 28.1:

- vitest 565 → ~581 (+16: ~4 core + ~12 adapter).
- parity-spec 49 → 53 (+4 phase28.1-\*).
- ChronixTheme tokens 46 → 50 (+4 selection/resizer).
- cross-demo verify scenarios 27 unchanged.

## VRT impact

**Re-baseline expected** for cross-demo baselines that capture
selection state. For visual-only baselines (no selection):

- **chronix-visual baselines** (5): chronix-visual captures the demo's
  default state which has NO selected bars. With no selection, no
  selection-border / no dots are emitted — only the resize-zone rects
  (transparent, no visible pixels). VRT pixel-diff should be **zero**
  for these 5 baselines.
- **cross-demo VRT baselines** (15 chronix-side, 12 k-ui-side, 27
  total): same logic — most cross-demo scenarios run without a forced
  selection state. The new resize-zone rects are transparent so they
  contribute zero pixels. **Predicted: no re-baseline needed for any
  existing cross-demo scenario**.
- **New parity-test scenarios with `?selected=...`**: introduces 1-2
  new screenshot baselines (one per view that exercises selection
  state). Captured fresh in Commit 4.

Predicted re-baseline count: **~0-2** PNGs. Much smaller than Phase
26 (~20) or Phase 28.2 (~17) because the new visual elements only fire
in the selected state which the existing baselines don't exercise.

**Caveat**: if k-ui's CSS makes resize dots visible on `:hover` during
the screenshot's brief mouse-position window, the cross-demo cross
diff may show dots on the k-ui side that chronix doesn't emit. Mitigation
options if observed in Commit 4 testing:

1. Set chronix's screenshot capture to use `await page.mouse.move(0,0)`
   before snap to clear hover state on both sides (most reliable).
2. Mask the dot positions via Playwright `clip` regions.
3. Accept the divergence as a known v0 gap; track in
   `audit/journal/2026-05-13.md`'s Phase 28.1 "Open / parked" section.

## Execution plan — 4 commits + wrap-up

### Commit 1 (design doc, this commit) — REQUIRES user review of 3 load-bearing decisions

Lands only `audit/PHASE_28_1_SELECTION_OVERLAY_DESIGN.md`. Awaits user
confirmation of the 3 decisions in "Open questions" before
implementation begins.

### Commit 2: Core — 4 theme tokens + pointer-hit-test threshold parameterization + ~4 core tests

- `packages/gantt/src/api/chronix-theme.ts`: add 4 new tokens
  (`barSelectedBorderColor`, `barSelectedBorderWidth`,
  `barResizerThickness`, `barResizerDotSize`) with defaults.
- `packages/gantt/src/api/chronix-theme.test.ts`: extend
  `EXPECTED_TOKEN_KEYS` (46 → 50), `stringKeys`, `numberKeys`. Add
  Phase 28.1 sanity test pinning default values.
- `packages/gantt/src/interaction/pointer-hit-test.ts`: parameterize
  edge-zone threshold (read from theme), default 8 preserves existing
  behavior. Update call sites.
- `packages/gantt/src/interaction/pointer-hit-test.test.ts`: +3 tests
  for threshold parameterization (preserves existing behavior at 8,
  exercises override at 12).
- Rebuild `@chronixjs/gantt` dist.
- ci-check green (vitest 565 → ~570).

### Commit 3: Adapter — bar selection-border + edge zones + visible dots + ~12 adapter tests

- `adapters/vue3/src/chronix-gantt.ts`:
  - Compute `selectionHasAxisOverlap` in the per-bar render closure.
  - Emit `cx-gantt-bar-resizer-start` / `-end` rects (always when bar
    is editable + axis-overlap) AFTER the bar's main rect.
  - Emit `cx-gantt-bar-selection-border` rect when `isSelected` +
    axis-overlap.
  - Emit `cx-gantt-bar-resizer-dot-start` / `-end` rects when
    `isSelected` + axis-overlap, with triangle-aware x position
    (consume `bar.isStart` / `bar.isEnd` from Phase 27 cascade).
  - Wire `theme.barSelectedBorderColor / -Width / barResizerThickness /
barResizerDotSize` into render.
- `adapters/vue3/src/chronix-gantt-selection.test.ts` (new, ~12 tests).
- Rebuild `@chronixjs/gantt-vue3` dist.
- ci-check green (vitest 570 → ~582).

### Commit 4: Parity assertions + parity-mode selection plumbing + VRT re-check + manual cursor verify

- `tooling/golden-runner/src/reference-dom-map.ts`: +5 selectors.
- `tooling/golden-runner/tests/parity.spec.ts`: +4 phase28.1-\*
  count parity assertions.
- `examples/gantt-vue3/src/sample-data-parity.ts` + parallel k-ui
  side: thread `?selected=...` query param into `selectedBarIds` /
  `selectedEventIds` props so the parity tests can put bars into
  selected state from URL.
- Run cross-demo verify + chronix-visual verify; capture any new
  selection-state baselines.
- **Manual browser verify** (added to execution checklist for /phase-close):
  open chronix demo, hover bar's left edge, confirm `cursor: ew-resize`
  fires; click a bar, confirm selection border + dots appear; click
  empty area, confirm border + dots disappear.
- ci-check green; cross-demo-verify gate green (27/27 + new baselines).

### Commit 5 (wrap-up — REQUIRES /phase-close invocation)

- `audit/journal/2026-05-13.md`: "Phase 28.1 — Selection overlay +
  visible resize handle (DONE, YYYY-MM-DD)" section per the strict
  6-sub-section template.
- `memory/project_gantt_rewrite_plan.md`: bump vitest 565 → 582;
  parity-spec 49 → 53; theme tokens 46 → 50; add Phase 28.1 DONE
  marker (final user-flagged silent gap closed).
- `audit/PHASE_28_1_SELECTION_OVERLAY_DESIGN.md` Status → DONE.

## Estimated scope

| Commit                                    | Hours | LOC est.                                                 |
| ----------------------------------------- | ----- | -------------------------------------------------------- |
| 1 (design doc)                            | 1     | this file (~500 LOC)                                     |
| 2 (core: tokens + hit-test param)         | 1.5   | ~50 LOC src + ~80 LOC tests                              |
| 3 (adapter: 3 new rect emissions + tests) | 2.5   | ~140 LOC src + ~280 LOC tests                            |
| 4 (parity + selection plumbing + VRT)     | 1.5   | ~140 LOC parity tests + ~30 LOC plumbing + 0-2 baselines |
| 5 (wrap-up)                               | 0.5   | journal + memory + status flip                           |
| **Total**                                 | **7** | ~720 LOC + ~0-2 baseline PNGs                            |

Within single-session discipline (per
`feedback_quality_acceleration.md` constraint #3). Within the 6-7h
estimate from the RENDER_LAYER_GAP_SWEEP Phase-28.1 row.

## 4-dimension audit check

| Dimension                     | Coverage in Phase 28.1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Options surface**           | 4 new theme tokens (`barSelectedBorderColor`, `barSelectedBorderWidth`, `barResizerThickness`, `barResizerDotSize`). No new component-level props (selection visual is theme-driven, no per-bar callback path — out of scope). `barResizerThickness` is consumed by BOTH render (cursor zone width) AND interaction (hit-test boundary) — explicit cross-cutting concern documented.                                                                                                                                                                                                                                                                                     |
| **Render code**               | 3 new per-bar `<rect>` emissions: `cx-gantt-bar-selection-border` (selected only), `cx-gantt-bar-resizer-start/-end` (always when editable + axis-overlap), `cx-gantt-bar-resizer-dot-start/-end` (selected only). Triangle-aware dot positioning extends Phase 27's `bar.isStart/isEnd` consumption pattern. `selectionHasAxisOverlap` gate mirrors Phase 28.2's `titleHasAxisOverlap`. Z-order: bar rect → triangles → title → selection-border → progress fill → dots → resize zones (resize zones LAST so cursor styling wins over bar's body cursor; dots BEFORE resize zones so the transparent edge-zone rect doesn't block dot's pointer-events:none rendering). |
| **Interaction code**          | `pointer-hit-test.ts` edge-zone threshold parameterized from theme (default 8 unchanged) — synchronizes the visual cursor zone with the geometric hit-test boundary. **No new transaction kinds, no new emit, no new composable**. Existing Phase 9 resize transactions + Phase 19 validation hooks still own the actual resize. The new DOM rects are decorative for cursor styling only.                                                                                                                                                                                                                                                                               |
| **Layout-algorithm pipeline** | **Zero impact**. No PlacedBar shape change. `selectionHasAxisOverlap` is render-time derivation from existing `bar.x` / `bar.width` / `axis.totalWidth`. Selected-state cascades through `selectedBarSet` (Phase 12) which already exists in the closure.                                                                                                                                                                                                                                                                                                                                                                                                                |

## Open questions for the user — 3 load-bearing decisions

**1. Selection visual scope: A (border only — k-ui SVG mode exact match) / B (border + translucent overlay rect — approximate HTML pseudo-element via SVG `<rect>`) / C (border + dot only, drop edge-zone rects → resize cursor doesn't fire)** — recommended **A**.

- **A (recommended)**: 1 selection-border rect (selected only) + 2 always-on edge-zone rects + 2 dot rects (selected only). 4 SVG elements added per axis-overlapping editable bar in the worst case (selected). Matches the parity reference's SVG-mode TimelineEvent rendering exactly. CSS pseudo-element overlay is HTML-mode-only and doesn't apply.
- **B**: A + 1 translucent SVG `<rect>` overlay covering the entire bar (`fill = t.barSelectedOverlayColor`, e.g. `rgba(0,0,0,0.25)`). Approximates the parity reference's HTML `:after` pseudo overlay for SVG consumers. Adds ~30 LOC adapter + 1 new theme token (`barSelectedOverlayColor`) + 1 additional cross-demo parity assertion. Visual: selected bars get a slight darkening overlay on top of the border. Pro: closer to k-ui HTML-mode demo's apparent visual feedback; con: doesn't match k-ui SVG-mode (which has no such overlay); con: introduces a new theme token for a non-load-bearing visual.
- **C**: drop the always-on edge-zone rects entirely. Visible dots + selection-border + bar's existing hit-test continue to work. **Trades off**: no `cursor: ew-resize` cue when hovering bar edges (the user-flagged "where do I resize" affordance). RENDER_LAYER_GAP_SWEEP Section H.9 specifically calls out the cursor cue as a gap; dropping it leaves the gap open.

**Recommendation**: **A**. Closest match to the parity reference's SVG-mode rendering. The HTML pseudo-element overlay (option B) approximates a visual that doesn't exist in k-ui's SVG mode and adds a 5th theme token + a cross-cutting visual concept (overlay vs border) for marginal benefit. Option C leaves the resize-cursor cue gap open — defeats the purpose of the phase.

**2. Edge-zone implementation: A (theme-driven thickness parameter threaded into both `pointer-hit-test.ts` and adapter render — single source of truth) / B (file-private constant in adapter for cursor zone, separate file-private constant in `pointer-hit-test.ts` for hit-test — independently tunable but can drift) / C (hard-code 8 px in adapter render, don't change hit-test)** — recommended **A**.

- **A (recommended)**: `barResizerThickness` theme token is consumed by **both** `chronix-gantt.ts` (rect width) AND `pointer-hit-test.ts` (geometric edge-zone boundary). One token → one consistent behavior. If a consumer overrides to 12, both the cursor zone and the hit-test grow to 12 simultaneously.
- **B**: keep the existing file-private edge-zone constant in `pointer-hit-test.ts` (currently 8); add a separate `barResizerThickness` theme token that drives only the visual cursor zone width. Pro: hit-test sensitivity stays stable across theme changes. Con: the visual cue and the actual interaction boundary can drift, producing UX bugs where the cursor changes outside the actual resize zone (or vice versa).
- **C**: no theme token; hard-code 8 in adapter; don't touch hit-test. Pro: simpler — no core file change. Con: no way for a consumer to widen the resize cue without forking; no synchronization story.

**Recommendation**: **A**. Single source of truth eliminates the drift class of bug. Cost is small (`pointer-hit-test.ts` change is one constant → one parameter; ~10 LOC across hit-test + tests). Same precedent as Phase 20's theme cascade (one token drives multiple emit sites).

**3. Hover-state visibility: A (selected-only dots, hover deferred per J.12) / B (also emit dots on `:hover` via CSS rule + new hover-state tracking) / C (always-visible dots regardless of selection state — disable selected-gate)** — recommended **A**.

- **A (recommended)**: visible dots emit only when `isSelected && selectionHasAxisOverlap`. Hover state is not tracked (J.12 is defer-indefinite). Cross-demo cross VRT will show k-ui dots-on-hover diverging from chronix selected-only — documented as known v0 gap. Future Phase 28.1.1 (post-J.12 hover) re-enables `:hover` visibility via CSS.
- **B**: add hover tracking (CSS class toggle on bar mouseenter/mouseleave) + emit dots always; CSS controls visibility via `:hover` OR `:selected`. **Pulls J.12 hover-state scope into Phase 28.1**, increases scope by ~30 LOC adapter + ~4 adapter tests + 1 more CSS class to manage. Worth doing? **No** per `feedback_quality_acceleration.md` constraint #3 (single-session discipline) — bundles 2 deferred concerns where the gap-sweep deliberately split them.
- **C**: drop the selected-gate; emit dots always when bar is editable + axis-overlap. Visual: every editable bar has dots permanently visible. Pro: simplest. Con: visual clutter (8 white dots × N bars); diverges from k-ui's "show only when relevant" convention.

**Recommendation**: **A**. Selected-only matches the load-bearing visual feedback case (user selected a bar → dots show where to grab to resize); hover state is genuinely independent (different render trigger, different scope) and folds naturally into a future J.12 phase. Option B violates single-session discipline; option C creates visual noise on every editable bar.

Reply **按推荐继续** to accept all three (A / A / A), or call out any 1-3 to override.
