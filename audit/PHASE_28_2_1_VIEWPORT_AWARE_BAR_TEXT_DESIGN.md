# Phase 28.2.1 — Viewport-aware bar title + progress-dot positioning

**Status**: **DONE (2026-05-18)** — 3 commits landed (`f31297b` design + `0e2da73` helper + adapter + `314dcb3` chronix-new declaration) + this wrap-up. `/phase-close` skill walked 6/6 gates green; ci-check fully green; vitest 697 → 708 (+11: 8 helper + 3 SFC); parity-spec 54 unchanged (chronix-new declaration substitutes for the originally-planned cross-demo assertions; inherits Phase 27.1's reasoning); cross-demo VRT 27/27 green WITHOUT re-baseline; chronix-visual VRT 5/5 unchanged. **0-VRT phase** — predicted 8-15 PNG re-baselines, actual 0 (Playwright capture's `ResizeObserver`-not-fired-yet timing short-circuits `deriveViewportClipping`, falling back to existing axis-only paths). Behavior IS exercised in real browsers + pinned via SFC tests. See `audit/journal/2026-05-13.md` "Phase 28.2.1" section for full wrap-up.

## Problem

Phase 28.2 (DONE 2026-05-16) landed `<text class="cx-gantt-bar-text">`
auto-render per bar with axis-clipped-aware title positioning: when
a bar's calendar range is clipped against the axis (`!bar.isStart` /
`!bar.isEnd`), the title shifts inward by `TRIANGLE_MARGIN +
TRIANGLE_SIZE + TITLE_TRIANGLE_GAP = 11 px` to clear the Phase 27
axis-clipped continuation triangle on that side. Otherwise the
default 8 px (left) / 4 px (right) insets apply.

Phase 28.1 (DONE 2026-05-17) added analogous axis-clipped-aware
positioning for the **progress-dot** resize handles when the bar is
both selected AND editable: dot shifts past the triangle on the
clipped side via `TRIANGLE_MARGIN + TRIANGLE_SIZE + DOT_TRIANGLE_GAP
= 9 px` cushion.

Phase 27.1 (DONE 2026-05-18) introduced a SECOND triangle case —
**viewport-clipped** triangles — that fire when a bar is axis-inside
but the chart pane has scrolled past the bar's edge. Apex locks to
the visible viewport edge in content-coords (`scrollLeft +
TRIANGLE_MARGIN` left, `scrollLeft + clientWidth - TRIANGLE_MARGIN`
right). Phase 27.1 deliberately left the title + progress-dot
adapters alone, deferring to this phase per the roadmap.

**Today's user-observable consequence**: in chronix's week / month /
year views, when a bar straddles the viewport edge (e.g. user has
scrolled right and a bar's left edge is now offscreen-left):

- A viewport-locked LEFT triangle paints at the viewport's left edge
  (visible to user; correct — landed Phase 27.1).
- The bar's TITLE TEXT, however, still starts at `renderX + 8` —
  which is offscreen-left, inside the scrolled-out portion of the
  bar. The user sees the viewport-locked triangle but no title text
  (it's all hidden past the viewport's left edge).
- Symmetric on the right: viewport-clipped bars' titles continue
  past the visible viewport edge, overlapping the viewport-locked
  right triangle when the bar overflows by less than its full width.
- Same applies to progress-dots: they sit at `renderX + 1` or
  `renderX + renderWidth - 1` regardless of viewport state.

The parity reference handles this via TimelineEvent.tsx:540-605:

```ts
if (isClippedStart) {
  // viewport-locked apex case
  titleStartX = triangleMargin + triangleSize + 4; // viewport-coord
} else if (!isEventStart) {
  // axis-clipped, not viewport-clipped
  titleStartX = x + triangleMargin + triangleSize + 4;
} else {
  // default
  titleStartX = visibleStartX + titleLeftPadding;
}
```

— title's start position locks to viewport-coord when viewport-clipped.

Phase 28.2.1's role: extend chronix's existing title + progress-dot
positioning logic (already axis-clipped-aware) with the
viewport-clipped sub-case, consuming the `viewportClip` already
computed once per bar in the Phase 27.1 flatMap closure.

## Reference (k-ui) behavior surface — full catalog

Reference files audited:

- `d:/work/k-ui/packages/gantt/src/timeline/TimelineEvent.tsx:543-545`
  — outer text gate: `showText && finalWidth > 30`. The `> 30`
  threshold is bar's width (already mirrored in chronix Phase 28.2
  via `renderWidth > 30`).
- `d:/work/k-ui/packages/gantt/src/timeline/TimelineEvent.tsx:551-565`
  — visible-region computation: `visibleStartX = max(0, x);
visibleEndX = min(containerWidth, x + finalWidth);`. The
  `visibleWidth < 30` short-circuit returns null. **Note**:
  `containerWidth = timelineWidth` (axis content width — same finding
  as Phase 27.1), so this clamps to axis bounds, not viewport bounds.
- `d:/work/k-ui/packages/gantt/src/timeline/TimelineEvent.tsx:576-587`
  — title-start position three-way branch:
  - `isClippedStart` → viewport-locked apex: `triangleMargin +
triangleSize + 4`.
  - `!isEventStart` → bar-edge-locked: `x + triangleMargin +
triangleSize + 4`.
  - default → `visibleStartX + 8`.
- `d:/work/k-ui/packages/gantt/src/timeline/TimelineEvent.tsx:589-600`
  — title-end position three-way branch (symmetric).
- `d:/work/k-ui/packages/gantt/src/timeline/TimelineEvent.tsx:602-605`
  — final clamp to visible region: `titleStartX = max(titleStartX,
visibleStartX + 8); titleEndX = min(titleEndX, visibleEndX - 4);`.
- `d:/work/k-ui/packages/gantt/src/timeline/TimelineEvent.tsx:608-612`
  — inner gate: `availableWidth = max(0, titleEndX - titleStartX); if
(availableWidth < 10) return null;`.

**Critical chronix divergence (carried over from Phase 27.1)**:
k-ui's `containerWidth` is **axis content width**, not viewport
width. So k-ui's "viewport-clipped" title branch at line 580 only
fires when the bar's left edge `x < 0` in content-coords — which
means it's axis-clipped (bar starts before axis). The `isClippedStart`
check duplicates the `!isEventStart` check; the apex position
formula uses viewport-coord `(1, centerY)` only because the parent
SVG has no scroll offset, so axis-content-coord `0` IS the visible
left edge in k-ui's coordinate system.

chronix's situation is different: native `overflow:auto` scroll
means `scrollLeft` can be non-zero. So when chronix transposes
k-ui's "lock title to viewport-coord 1" semantics, it has to use
`scrollLeft + 1` in content-coords (the viewport-locked apex from
Phase 27.1's `deriveViewportClipping`). This is the **same
coordinate-system reconciliation** Phase 27.1 already worked out for
the triangle apex — Phase 28.2.1 reuses the same `viewportLocked*ApexX`
outputs.

### Coordinate-system reconciliation (carried over from Phase 27.1)

For the title-start position:

| sub-case                                        | k-ui (viewport-local x; containerWidth = axis width)         | chronix (content-local x; uses Phase 27.1 helper)                                               |
| ----------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| viewport-clipped left (bar's left scrolled out) | n/a (k-ui never enters this branch on user scroll)           | `viewportClip.viewportLockedLeftApexX + TRIANGLE_SIZE + TITLE_TRIANGLE_GAP` = `scrollLeft + 11` |
| axis-clipped left, viewport-inside              | `x + triangleMargin + triangleSize + 4` = `x + 11`           | `renderX + TRIANGLE_MARGIN + TRIANGLE_SIZE + TITLE_TRIANGLE_GAP` = `renderX + 11`               |
| default (no clipping)                           | `visibleStartX + 8` (clamped to axis bounds via `max(0, x)`) | `renderX + TITLE_LEFT_PADDING` = `renderX + 8`                                                  |

Symmetric on the right side. Progress-dot uses analogous transpose
with `DOT_*` constants instead of `TITLE_*`.

### Surface-level disposition table

| Item                                                                                                                    | k-ui                                       | chronix v0                                                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Title-start position viewport-locked branch (`isClippedStart` → apex `triangleMargin + triangleSize + 4`)               | `TimelineEvent.tsx:577-580`                | ✅ **port (transposed coord)** — when `viewportClip.isViewportClippedStart`, title-start at `viewportClip.viewportLockedLeftApexX + TRIANGLE_SIZE + TITLE_TRIANGLE_GAP`. Reuses Phase 27.1 helper output verbatim — same coord-system transpose as Phase 27.1's triangle apex. |
| Title-end position viewport-locked branch                                                                               | `TimelineEvent.tsx:590-593`                | ✅ **port (transposed coord)** — symmetric.                                                                                                                                                                                                                                    |
| Title-start position axis-clipped branch                                                                                | `TimelineEvent.tsx:581-583`                | ✅ **already ported (Phase 28.2)** — at chronix-gantt.ts:2306-2308. Stays untouched.                                                                                                                                                                                           |
| Title-end position axis-clipped branch                                                                                  | `TimelineEvent.tsx:594-596`                | ✅ **already ported (Phase 28.2)** — at chronix-gantt.ts:2309-2311. Stays untouched.                                                                                                                                                                                           |
| Default title-start / end positions (`8` / `4` px)                                                                      | `TimelineEvent.tsx:584-587, 597-600`       | ✅ **already ported (Phase 28.2)** — `TITLE_LEFT_PADDING = 8` / `TITLE_RIGHT_PADDING = 4` file-level constants.                                                                                                                                                                |
| Visible-region clamp (`titleStartX = max(titleStartX, visibleStartX + 8); titleEndX = min(titleEndX, visibleEndX - 4)`) | `TimelineEvent.tsx:602-605`                | ⏸️ **chronix-additive option** — k-ui's `visibleStartX/EndX` is axis-bound (not viewport-bound); chronix could extend to viewport-bound clamp for tighter "what user can actually see" semantics. See Decision 1.                                                              |
| Outer text gate `finalWidth > 30`                                                                                       | `TimelineEvent.tsx:544-545`                | ✅ **already ported (Phase 28.2)** — `renderWidth > 30`.                                                                                                                                                                                                                       |
| `visibleWidth < 30` short-circuit                                                                                       | `TimelineEvent.tsx:562-565`                | ⏸️ **chronix-additive option** — k-ui short-circuits when axis-clipped visible width is < 30. chronix could short-circuit on viewport-visible width instead. Bundle with the visible-region clamp decision (same conceptual choice). See Decision 1.                           |
| Inner gate `availableWidth < 10`                                                                                        | `TimelineEvent.tsx:608-612`                | ✅ **already ported (Phase 28.2)** — `availableWidth >= 10` gate at chronix-gantt.ts:2315.                                                                                                                                                                                     |
| `truncateText` char-count truncation                                                                                    | `TimelineEvent.tsx:715-730`                | ✅ **already ported (Phase 28.2)** — `truncateBarText` helper.                                                                                                                                                                                                                 |
| Progress-dot left/right position with axis-clipped triangle cushion                                                     | (Phase 28.1 equivalent)                    | ✅ **already ported (Phase 28.1)** — at chronix-gantt.ts:2513-2518.                                                                                                                                                                                                            |
| Progress-dot left/right position with viewport-clipped triangle cushion                                                 | k-ui doesn't viewport-clip dots reactively | ✅ **chronix-additive (this phase)** — when `viewportClip.isViewportClippedStart`, left dot at `viewportClip.viewportLockedLeftApexX + TRIANGLE_SIZE + DOT_TRIANGLE_GAP`. Symmetric right. Falls through to Phase 28.1 axis-clipped position when viewport-clip doesn't fire.  |
| `data-viewport-clipped` attribute on title / dot (mirror Phase 27.1's triangle attribute)                               | n/a                                        | 🟡 **defer** — only required if cross-demo parity needs to filter. Phase 28.2.1 is chronix-new declared (parity matches Phase 27.1: k-ui doesn't viewport-shift either surface), so no parity-filter need. Skip the attribute to keep DOM tight.                               |
| Text-baseline / font / fill attributes                                                                                  | `TimelineEvent.tsx:637-655`                | ✅ **already ported (Phase 28.2)** — `text-anchor="start"`, `dominant-baseline="middle"`, `pointer-events: none`, `userSelect: none`.                                                                                                                                          |
| Theme tokens for viewport-locked vs axis-locked title                                                                   | n/a                                        | ❌ **Reject** — same `cx-gantt-bar-text` class on both branches. Position differs; semantics identical.                                                                                                                                                                        |

**Phase 28.2.1 net surface**: 4 ✅-port items (title-start / title-end
viewport-locked branches × 2; progress-dot left/right viewport-locked
chronix-additive × 2), 2 ⏸️-defer-or-decision items (visible-region
clamp + `visibleWidth < 30` gate — bundled into Decision 1), 1 🟡-defer
(`data-viewport-clipped` attribute on title — not needed without
parity filter), 1 ❌-reject (separate theme token).

### Naming alignment table

| k-ui                                            | chronix                                                                                                                                                          |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `titleStartX` / `titleEndX` (local var names)   | `titleStartX` / `titleEndX` (kept verbatim — already in chronix Phase 28.2)                                                                                      |
| `visibleStartX` / `visibleEndX`                 | (depends on Decision 1: either added under same name, or omitted entirely)                                                                                       |
| `isClippedStart` / `isClippedEnd`               | `viewportClip.isViewportClippedStart` / `End` (Phase 27.1 helper output)                                                                                         |
| `triangleMargin`, `triangleSize`                | `TRIANGLE_MARGIN`, `TRIANGLE_SIZE` (already file-level constants)                                                                                                |
| `titleLeftPadding = 8`, `titleRightPadding = 4` | `TITLE_LEFT_PADDING`, `TITLE_RIGHT_PADDING` (already file-level constants)                                                                                       |
| (helper inlined in TimelineEvent.tsx)           | `deriveEdgePaddedX(renderEdge, viewportLockedApex, isAxisClipped, isViewportClipped, defaultInset, triangleCushion)` (proposed new pure helper — see Decision 2) |

### Cascading dispositions (other phases affected)

- **Phase 27.1**: no changes. Triangle render unaffected; only title +
  dot positioning consume the new viewport-aware branches.
- **Phase 28.2**: minimal edit. The existing title block gains a
  preceding branch for `viewportClip.isViewportClipped*` before
  falling through to the existing axis-clipped / default branches.
  ~10 LOC delta.
- **Phase 28.1**: same minimal edit on the dot block. ~6 LOC delta.
- **Phase 27**: no changes.
- **PARITY_RECHECK.md**: a chronix-new declaration row added under
  P3 (analogous to Phase 27.1's row), folding both title + dot
  viewport-aware positioning into a single line.

## Approach

### §1 — Pure helper `deriveEdgePaddedX` (`adapters/vue3/src/derive-edge-padded-x.ts`)

A pure function returning the padded x-coord for ONE side (left OR
right) of a bar's "content-region" — the area inside the bar that
both title and progress-dot need to clear of continuation triangles.
Takes the 3 clipping sub-case constants + the position constants and
returns the final x.

```ts
/**
 * Phase 28.2.1: derives the x-coordinate inside a bar where its
 * title text + progress-dot resize handle should anchor on one side
 * (left OR right). Three-way branch:
 *
 *   1. `isViewportClipped` → viewport-edge-locked (chronix-additive
 *      sub-case; locks to the Phase 27.1 viewport-locked triangle's
 *      base + triangleCushion).
 *   2. `isAxisClipped` → bar-edge-locked with triangle cushion
 *      (Phase 27 sub-case; mirrors k-ui's `x + triangleMargin +
 *      triangleSize + N` formula).
 *   3. default → renderEdge + defaultInset (Phase 28.2 / 28.1
 *      pre-clipping path).
 *
 * Pure function — no Vue reactivity, no DOM. Consumer (the per-bar
 * flatMap closure) supplies all inputs from already-computed
 * locals.
 *
 * `triangleCushion` differs between consumers:
 *   - Title: `TRIANGLE_SIZE + TITLE_TRIANGLE_GAP = 10 px`
 *   - Progress-dot: `TRIANGLE_SIZE + DOT_TRIANGLE_GAP = 8 px`
 *
 * `side` selects sign of `triangleCushion` + which renderEdge is
 * meaningful. The helper returns the x for that side; callers
 * combine the two sides to derive `availableWidth`.
 */
export type EdgeSide = 'start' | 'end';

export function deriveEdgePaddedX(
  side: EdgeSide,
  renderEdge: number, // for 'start': renderX; for 'end': renderX + renderWidth
  viewportLockedApex: number, // for 'start': scrollLeft + TRIANGLE_MARGIN; for 'end': scrollLeft + clientWidth - TRIANGLE_MARGIN
  isAxisClipped: boolean,
  isViewportClipped: boolean,
  defaultInset: number,
  triangleCushion: number,
): number {
  if (isViewportClipped) {
    return side === 'start'
      ? viewportLockedApex + triangleCushion
      : viewportLockedApex - triangleCushion;
  }
  if (isAxisClipped) {
    return side === 'start'
      ? renderEdge + TRIANGLE_MARGIN + triangleCushion
      : renderEdge - TRIANGLE_MARGIN - triangleCushion;
  }
  return side === 'start' ? renderEdge + defaultInset : renderEdge - defaultInset;
}
```

The helper takes `TRIANGLE_MARGIN` as an implicit dependency — it's
the SAME `1 px` inset baked into the Phase 27 / 27.1 triangle apex
math. Importing it from `chronix-gantt.ts` would cross a layering
boundary; instead, the helper exports a constant + the consumer
passes a `triangleCushion` already including `TRIANGLE_SIZE +
typeOfGap`. Wait — re-reading the formula above, `TRIANGLE_MARGIN`
appears in the axis-clipped branch (`renderEdge + TRIANGLE_MARGIN +
triangleCushion`). Cleaner alternative: the helper takes ONE
combined `triangleClearance` param representing the total inset from
`renderEdge` to the title start. Caller computes `triangleClearance
= TRIANGLE_MARGIN + TRIANGLE_SIZE + TITLE_TRIANGLE_GAP = 11` for
title or `TRIANGLE_MARGIN + TRIANGLE_SIZE + DOT_TRIANGLE_GAP = 9`
for dot. Helper becomes simpler:

```ts
export function deriveEdgePaddedX(
  side: EdgeSide,
  renderEdge: number,
  viewportLockedApex: number,
  isAxisClipped: boolean,
  isViewportClipped: boolean,
  defaultInset: number,
  triangleClearance: number,
): number {
  if (isViewportClipped) {
    // The viewport-locked apex sits at `viewportLeftOrRightEdge ±
    // TRIANGLE_MARGIN` (Phase 27.1). The triangle's base extends
    // `TRIANGLE_SIZE` further inside the visible area. Add the
    // remaining `consumerGap` (TITLE_TRIANGLE_GAP=4 or
    // DOT_TRIANGLE_GAP=2) to get past the triangle's base.
    // `triangleClearance` already encodes `TRIANGLE_SIZE +
    // consumerGap`; the additional `TRIANGLE_MARGIN` term is BAKED
    // INTO `viewportLockedApex` (Phase 27.1's helper returns
    // `scrollLeft + TRIANGLE_MARGIN` for left).
    return side === 'start'
      ? viewportLockedApex + (triangleClearance - 0) // see note below
      : viewportLockedApex - (triangleClearance - 0);
  }
  if (isAxisClipped) {
    return side === 'start' ? renderEdge + triangleClearance : renderEdge - triangleClearance;
  }
  return side === 'start' ? renderEdge + defaultInset : renderEdge - defaultInset;
}
```

Hmm the `triangleClearance - 0` is awkward. Let me work the math:

- Phase 27.1 helper returns `viewportLockedLeftApexX = scrollLeft + TRIANGLE_MARGIN = scrollLeft + 1`
- This is the apex (innermost x) of the viewport-locked triangle. The triangle's BASE extends another `TRIANGLE_SIZE = 6 px` further inside, ending at `scrollLeft + TRIANGLE_MARGIN + TRIANGLE_SIZE = scrollLeft + 7`.
- Title needs to start `TITLE_TRIANGLE_GAP = 4 px` past the triangle's base, so `titleStartX = scrollLeft + 7 + 4 = scrollLeft + 11`.
- Dot needs to start `DOT_TRIANGLE_GAP = 2 px` past the triangle's base, so `dotStartX = scrollLeft + 7 + 2 = scrollLeft + 9`.

For the axis-clipped branch:

- Apex at `renderEdge + TRIANGLE_MARGIN = renderEdge + 1`
- Base at `renderEdge + TRIANGLE_MARGIN + TRIANGLE_SIZE = renderEdge + 7`
- Title at `renderEdge + 11`; dot at `renderEdge + 9`.

So `triangleClearance` differs per consumer:

- Title: `TRIANGLE_MARGIN + TRIANGLE_SIZE + TITLE_TRIANGLE_GAP = 1 + 6 + 4 = 11`
- Dot: `TRIANGLE_MARGIN + TRIANGLE_SIZE + DOT_TRIANGLE_GAP = 1 + 6 + 2 = 9`

The HALF that's already baked into `viewportLockedApex` (= `scrollLeft + TRIANGLE_MARGIN`) is exactly `TRIANGLE_MARGIN`. So the viewport-clipped branch adds `triangleClearance - TRIANGLE_MARGIN = TRIANGLE_SIZE + consumerGap`. Cleanest signature: take `triangleClearanceFromRenderEdge` (the full 11 or 9) AND `triangleClearanceFromApex` (the 10 or 8 difference). That's 2 args. Or — make the helper take SEPARATE `triangleSize` and `consumerGap` args:

```ts
export function deriveEdgePaddedX(
  side: EdgeSide,
  renderEdge: number,
  viewportLockedApex: number, // already includes TRIANGLE_MARGIN
  isAxisClipped: boolean,
  isViewportClipped: boolean,
  defaultInset: number, // 8 (title) or 1 (dot DOT_EDGE_INSET)
  triangleMargin: number, // 1
  triangleSize: number, // 6
  consumerGap: number, // 4 (title) or 2 (dot)
): number {
  if (isViewportClipped) {
    // viewportLockedApex already past TRIANGLE_MARGIN from edge;
    // clear triangleSize + consumerGap more to land past the base.
    return side === 'start'
      ? viewportLockedApex + triangleSize + consumerGap
      : viewportLockedApex - triangleSize - consumerGap;
  }
  if (isAxisClipped) {
    return side === 'start'
      ? renderEdge + triangleMargin + triangleSize + consumerGap
      : renderEdge - triangleMargin - triangleSize - consumerGap;
  }
  return side === 'start' ? renderEdge + defaultInset : renderEdge - defaultInset;
}
```

Better — explicit + readable. 8 args is a lot but each is well-named.
Unit-testable as a pure function.

### §2 — Adapter integration (`adapters/vue3/src/chronix-gantt.ts`)

Three edits to the existing flatMap closure:

**(a)** Title block (chronix-gantt.ts:2305-2317): replace the
current axis-clipped-only padding with `deriveEdgePaddedX` calls:

```ts
const titleStartX = deriveEdgePaddedX(
  'start',
  renderX,
  viewportClip.viewportLockedLeftApexX,
  !bar.isStart,
  viewportClip.isViewportClippedStart,
  TITLE_LEFT_PADDING,
  TRIANGLE_MARGIN,
  TRIANGLE_SIZE,
  TITLE_TRIANGLE_GAP,
);
const titleEndX = deriveEdgePaddedX(
  'end',
  renderX + renderWidth,
  viewportClip.viewportLockedRightApexX,
  !bar.isEnd,
  viewportClip.isViewportClippedEnd,
  TITLE_RIGHT_PADDING,
  TRIANGLE_MARGIN,
  TRIANGLE_SIZE,
  TITLE_TRIANGLE_GAP,
);
const availableWidth = Math.max(0, titleEndX - titleStartX);
// ... rest of existing title block (availableWidth >= 10 gate + truncateBarText + emit) ...
```

**(b)** Progress-dot block (chronix-gantt.ts:2513-2518): replace the
current axis-clipped-only padding with `deriveEdgePaddedX` calls:

```ts
const leftDotX = deriveEdgePaddedX(
  'start',
  renderX,
  viewportClip.viewportLockedLeftApexX,
  !bar.isStart,
  viewportClip.isViewportClippedStart,
  DOT_EDGE_INSET,
  TRIANGLE_MARGIN,
  TRIANGLE_SIZE,
  DOT_TRIANGLE_GAP,
);
const rightDotX =
  deriveEdgePaddedX(
    'end',
    renderX + renderWidth,
    viewportClip.viewportLockedRightApexX,
    !bar.isEnd,
    viewportClip.isViewportClippedEnd,
    DOT_EDGE_INSET,
    TRIANGLE_MARGIN,
    TRIANGLE_SIZE,
    DOT_TRIANGLE_GAP,
  ) - dotSize;
```

Note the `- dotSize` adjustment on the right dot: the existing
Phase 28.1 code subtracts `dotSize` from the right edge so the dot
ends at the desired x. The helper returns the title-end position
(text-anchor end-side); the dot uses that position as its right
edge, so the dot's x (left side, since SVG rects are positioned
from top-left) is `(helperResult) - dotSize`.

**(c)** No new imports beyond `deriveEdgePaddedX`. No new file-level
constants (all 4 are already declared from Phase 27/28.1/28.2).

### §3 — Decision-bound: visible-region clamp + visibleWidth gate

Two sub-features from k-ui's title block that may or may not be
ported. Bundled together because they share the same conceptual
choice ("treat 'visible' as axis-bound or viewport-bound").

**Option Y (chronix-additive, viewport-bound)**: clamp
`titleStartX = max(titleStartX, scrollLeft + TITLE_LEFT_PADDING)` and
`titleEndX = min(titleEndX, scrollLeft + clientWidth -
TITLE_RIGHT_PADDING)` so the title NEVER extends past the visible
viewport edge — even when it's structurally inside the bar's
content area. Short-circuit when the visible portion of the bar is
narrower than 30 px. Maximalist UX: title NEVER hides offscreen.

**Option N (k-ui-mirror, axis-bound)**: skip the clamp entirely.
Phase 28.2.1 only adjusts the **start position** (the new branch
that locks to viewport when scrolled-out); the END position still
uses the existing `renderX + renderWidth - rightPadding` formula
unless `isViewportClippedEnd` flips on. If a bar's right edge
extends 100 px past the viewport, the title text continues past the
viewport too (browser clips it). Matches k-ui's behavior (k-ui's
`visibleStartX/EndX` clamp is axis-bound, not viewport-bound).

See Decision 1.

## Alternatives considered

- **Decision A — Extend the existing inline title-padding math
  without a helper**. Reject for the same reason Phase 27.1 chose
  the helper route (Decision B in that phase): the 3-way branch is
  reused twice (title left + right + dot left + right = 4 sites),
  and the math has subtle correctness invariants (
  `viewportLockedApex` already includes `TRIANGLE_MARGIN`, the
  cushion only needs to clear `TRIANGLE_SIZE + consumerGap`).
  Inlining the math 4 times invites copy-paste drift; a helper +
  unit tests pins the invariant once.

- **Decision A' — Inline title padding for the title block; inline
  dot padding for the dot block; no helper**. Reject. Same argument
  as above + the two sites would diverge over time.

- **Use Phase 28.2's existing `titleStartX = renderX + leftPadding`
  pattern; check viewport-clip outside the leftPadding ternary**.
  Reject. Mixing the precedence rule into the `leftPadding` variable
  itself is the cleanest expression of the 3-way branch — and the
  pure helper IS that expression, just factored out.

- **Add `data-viewport-clipped="true|false"` to the title text
  element** (mirror Phase 27.1's triangle attribute). Defer. Phase
  27.1's attribute exists because the Phase 27 cross-demo parity
  assertions had to FILTER to axis-only. Phase 28.2.1 has no
  cross-demo parity assertion to filter (chronix-new declared, see
  Parity assertion plan below), so the attribute would be
  unconsumed. Add later only if a consumer needs it.

- **Reuse `truncateBarText` unchanged**. Accept. The truncation math
  takes `availableWidth` regardless of where the visible space comes
  from. Phase 28.2.1 just changes how `availableWidth` is computed;
  truncation logic stays.

- **Folded visible-region clamp + `visibleWidth < 30` gate together
  vs split decisions**. Folded — they share the same conceptual
  choice (axis-bound vs viewport-bound "visible"). Splitting would
  fork the chronix-additive policy mid-render.

- **Per-side cushion config (separate `triangleCushion.start` /
  `.end` constants)**. Reject. Both sides use identical 4 px / 2 px
  cushions; symmetric design.

- **Render the title in TWO emits — one anchored to bar-edge for
  axis-clipped + a second anchored to viewport-edge for viewport-
  clipped**. Reject. Doubles DOM nodes for the same visual effect;
  text-anchor start/end positions interact incorrectly with the
  truncation algorithm.

- **Use a Vue computed-ref for the per-bar padding state**. Reject.
  The per-bar render closure already reads reactive deps
  (`chartScroll.scrollLeft.value` etc.); the pure-helper call sits
  inside that closure and inherits its reactivity.

## Parity assertion plan — chronix-new declaration

Following Phase 27.1's precedent and reasoning verbatim: k-ui's
`<TimelineEvent containerWidth>` prop carries axis content width
(`timelineWidth = slotCount × slotMinWidth`), NOT visible viewport
width. So k-ui's title-position viewport-locked branch (line
576-580) only fires when the bar's `x < 0` in content-coords —
which means the bar is **axis-clipped**, not "viewport-clipped" in
the user-visible sense. k-ui's title positioning is **scroll-
invariant**.

Phase 28.2.1's viewport-aware title + dot positioning therefore have
**no k-ui counterpart**; chronix is adding scroll-responsive UX
that k-ui doesn't provide.

### Chronix-new declaration

Phase 28.2.1's viewport-clipped sub-case for title-start /
title-end position + progress-dot left/right position is
**chronix-additive** behavior:

- **What is new**: when a bar's left edge has scrolled past the
  visible chart-pane viewport edge, the title text + left
  progress-dot reposition to the viewport edge (matching where the
  Phase 27.1 viewport-locked left triangle paints) so they remain
  user-visible. Symmetric on the right.
- **Why k-ui doesn't have it**: k-ui's `containerWidth` is axis
  width; its viewport-locked branch is algebraically equivalent
  to the axis-clipped branch. No scroll-aware code path exists in
  the reference's title rendering.
- **Why chronix adds it**: in week / month / year views the chart
  pane has horizontal scroll. Without viewport-aware repositioning,
  bars that scroll partially offscreen lose their visible title
  text (anchored inside the scrolled-out portion). The viewport-
  locked position keeps the title visible at the viewport edge —
  a discoverability improvement over k-ui.
- chronix's **axis-clipped sub-case is still a port** of k-ui's
  `!isEventStart` / `!isEventEnd` title positioning (Phase 28.2,
  DONE 2026-05-16). Only the viewport-clipped sub-case is
  chronix-new. Same for the dot block (Phase 28.1 ported axis-
  clipped; this phase adds viewport-clipped).

### Pinning surface

Since no k-ui parity counterpart exists, behavior is pinned via
internal tests. Test plan in "Test coverage" below.

### PARITY_RECHECK.md entry (lands in Commit 3)

A row added under section **P3 — chronix-only feature with no
k-ui counterpart**:

| Item                                                                                                                                               | Disposition                   | Rationale                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 28.2.1 viewport-aware bar title + progress-dot positioning (extends Phase 27.1's viewport-clipped sub-case to the title + dot render layers) | **Reject** (chronix-additive) | Inherits Phase 27.1's chronix-new rationale: k-ui's `containerWidth = timelineWidth` (axis content width); k-ui's title positioning is scroll-invariant. chronix Phase 28.2.1 extends Phase 27.1's `viewportLocked*ApexX` to drive title-start / title-end + progress-dot left/right positioning when `isViewportClipped*` fires — title + dot stay user-visible at viewport edge regardless of bar's scroll position. Pinned via 8 helper unit tests + 3 SFC reactivity tests. |

### Drift-detection scope (internal)

- **Covered by helper + SFC tests**: the 4 padded-x sites (title-
  start, title-end, dot-left, dot-right) under each of the 4
  sub-case combinations (default / axis-only-clipped / viewport-
  only-clipped / both-clipped). Reactivity (scroll event triggers
  reposition).
- **NOT covered** (acknowledged tradeoffs of the chronix-new
  declaration):
  - Per-bar title-text content parity (truncation is unchanged;
    `truncateBarText` was pinned in Phase 28.2).
  - Visual continuity during scroll animation — pinned only via
    VRT re-baseline + manual demo verification.
- **chronix Phase 28.2 axis-clipped title parity continues to be
  cross-demo parity-tested** via the existing `phase28.2-bar-text
count parity (week view)` assertion — that remains green
  because the axis-clipped branch is unchanged.

## Test coverage

- **adapter helper** — `adapters/vue3/src/derive-edge-padded-x.test.ts`
  (new, ~8 tests):
  - "default left: no clipping → `renderEdge + defaultInset`"
  - "default right: no clipping → `renderEdge - defaultInset`"
  - "axis-only-clipped left → `renderEdge + triangleMargin +
triangleSize + consumerGap`"
  - "axis-only-clipped right → `renderEdge - triangleMargin -
triangleSize - consumerGap`"
  - "viewport-clipped left → `viewportLockedApex + triangleSize +
consumerGap`"
  - "viewport-clipped right → `viewportLockedApex - triangleSize -
consumerGap`"
  - "both-clipped same side: viewport wins (precedence)"
  - "title vs dot: same helper produces different output for
    different `defaultInset` / `consumerGap` values"

- **adapter SFC** —
  `adapters/vue3/src/chronix-gantt-viewport-aware-text.test.ts`
  (new, ~3 tests): mounts ChronixGantt with stubbed
  `ResizeObserver`; drives programmatic scroll. Covers:
  - "viewport-clipped left bar repositions title-start to
    viewport-edge"
  - "viewport-clipped + axis-inside selected editable bar repositions
    left progress-dot to viewport-edge"
  - "post-scroll re-render relocates title-start reactively"

Expected counts after Phase 28.2.1: vitest 697 → ~708 (+11); parity-
spec 54 unchanged (chronix-new declaration substitutes for a
cross-demo assertion); ChronixTheme tokens 50 unchanged; cross-demo
verify scenarios 27 unchanged in count but possibly re-baselined
(see VRT impact); chronix-visual 5 likely unchanged (same
short-circuit reason Phase 27.1 hit — Playwright's chronix-visual
captures the SVG directly with `clientWidth=0` pre-mount).

## VRT impact

**Predicted re-baseline count**: **8-15 PNGs** (chronix-side
cross-demo `vrt-*.png` files; same scenarios that re-baselined in
Phase 27.1). K-ui-side cross-demo baselines (`cross-*.png`) and
chronix-visual baselines (`view-*.png`) likely unchanged for the
same reasons as Phase 27.1 (k-ui is scroll-invariant; chronix-visual
captures with `clientWidth=0` short-circuit).

Per scenario, the pixel diff is the title's new x position when
a bar is viewport-clipped — small but real. Predicted lower bound
8 (fewer scenarios show viewport-clipped bars with non-empty title
text); upper bound 15 (matches Phase 27.1's count if all
viewport-clipped scenarios also have bars with titles).

## Execution plan — 3 commits + wrap-up

### Commit 1 (design doc, this commit) — REQUIRES user review of 3 load-bearing decisions

Lands only `audit/PHASE_28_2_1_VIEWPORT_AWARE_BAR_TEXT_DESIGN.md`.
Awaits user confirmation of the 3 questions at the bottom of this
file before implementation.

### Commit 2: Pure helper + adapter integration + ~11 tests

- `adapters/vue3/src/derive-edge-padded-x.ts` (new, ~50 LOC):
  pure helper per §1.
- `adapters/vue3/src/derive-edge-padded-x.test.ts` (new, ~80 LOC,
  +8 tests per Test coverage).
- `adapters/vue3/src/chronix-gantt.ts` (~35 LOC modified):
  - Import `deriveEdgePaddedX`.
  - Title block: replace existing `leftPadding` / `rightPadding`
    ternaries with two `deriveEdgePaddedX` calls.
  - Dot block: same — replace ternaries with two helper calls.
- `adapters/vue3/src/chronix-gantt-viewport-aware-text.test.ts`
  (new, ~150 LOC, +3 SFC reactivity tests).
- Rebuild `@chronixjs/gantt-vue3` dist.
- ci-check green (vitest 697 → ~708).
- Kill + restart chronix demo dev server (port 8702) to pick up
  rebuilt dist.

### Commit 3: chronix-new declaration + cross-demo VRT re-baseline

- `audit/PARITY_RECHECK.md`: P3 row added per the Chronix-new
  declaration block. Reject (by-design) tally 9 → 10.
- `audit/PHASE_28_2_1_VIEWPORT_AWARE_BAR_TEXT_DESIGN.md` Status →
  cross-reference to wrap-up.
- Run cross-demo verify; re-capture chronix-side scenarios that
  diff (predicted 8-15 PNGs).
- ci-check + cross-demo verify green.

### Commit 4 (wrap-up — REQUIRES `/phase-close` invocation)

Before flipping this design doc's Status to DONE OR adding the
"Phase 28.2.1 — DONE" section to `audit/journal/`, MUST invoke
`/phase-close` skill. The skill verifies the 6 standard gates.

- `audit/journal/2026-05-13.md` (continuation): "Phase 28.2.1 —
  Viewport-aware bar title + progress-dot positioning (DONE,
  YYYY-MM-DD)" section per the strict 6-sub-section template.
- `memory/project_gantt_rewrite_plan.md`: bump vitest 697 → ~708;
  parity-spec 54 unchanged; add Phase 28.2.1 DONE marker.
- `audit/PHASE_28_2_1_VIEWPORT_AWARE_BAR_TEXT_DESIGN.md` Status →
  DONE.

## Estimated scope

| Commit                           | Hours    | LOC est.                                      |
| -------------------------------- | -------- | --------------------------------------------- |
| 1 (design doc)                   | 0.5      | this file (~500 LOC)                          |
| 2 (helper + adapter + 11 tests)  | 1.5      | ~50 LOC src + ~230 LOC tests                  |
| 3 (chronix-new + VRT rebaseline) | 1.0      | ~30 LOC PARITY_RECHECK + 8-15 PNG re-captures |
| 4 (wrap-up)                      | 0.25     | journal + memory + status flips               |
| **Total**                        | **3.25** | ~810 LOC + 8-15 baseline PNGs                 |

Within single-session discipline. Matches the 3-4h roadmap
estimate.

## 4-dimension audit check

Per `feedback_4_dimension_audit_checklist.md`:

| Dimension                     | Coverage in Phase 28.2.1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Options surface**           | Zero — no new component prop, no new composable input, no new theme token. Reuses Phase 27.1's `viewportClip` output already plumbed through the flatMap closure.                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Render code**               | LOAD-BEARING — title block + progress-dot block in `chronix-gantt.ts` flatMap closure each replace their existing axis-only-aware padding ternaries with calls to the new pure helper `deriveEdgePaddedX`. The helper handles the 3-way branch (default / axis-clipped / viewport-clipped) uniformly. Title's `availableWidth` derivation, truncation, emit attrs all unchanged.                                                                                                                                                                                                                 |
| **Interaction code**          | Zero impact — title + dot continue to use `pointer-events: none` (unchanged from Phase 28.2 / 28.1). Existing pointer-hit-test tests untouched. The dot's visible position shifts to viewport-edge under scroll, but the underlying edge-zone hit-test rect (Phase 28.1's `cx-gantt-bar-resizer-{start,end}` transparent rects at `renderX` / `renderX + renderWidth - resizerThickness`) is NOT viewport-shifted — the visual dot and the underlying hit-test geometry intentionally diverge under viewport-clipping (visual cue at viewport edge; pointer events still on bar's actual edges). |
| **Layout-algorithm pipeline** | Zero impact — no PlannedAxis / PlacedBar / RoutedLink shape change. No new layout pass. Phase 27.1's render-time derivation pattern continues — viewport-state stays in render closure scope, never pollutes layout pipeline.                                                                                                                                                                                                                                                                                                                                                                    |

The "visual dot at viewport edge but hit-test on bar edge" decision
is a deliberate consistency with the user's mental model: pointer
clicks land on the bar's actual edge (where the cursor naturally
moves the bar); the dot is purely decorative under viewport-clip.
The opposite (move hit-test to viewport edge) would let the user
resize a bar from a "phantom" handle that doesn't correspond to a
real geometric edge — surprising.

## Open questions for the user — 3 load-bearing decisions

**1. Scope: A (title + progress-dot, both viewport-aware) / B (title only — defer progress-dot to a follow-up phase) / C (title + progress-dot + visible-region clamp + `visibleWidth < 30` gate)** — recommend **A**.

- **A (recommended)**: extend BOTH title + progress-dot positioning
  to viewport-aware mode. Both surfaces consume the same
  `viewportClip` already in the flatMap closure; the same helper
  serves both (different `defaultInset` / `consumerGap` constants).
  Single-phase scope; closes the "title + dot both shift when
  viewport-clipped" expectation cleanly. ~80 LOC + 11 tests.
- **B**: title-only minimal scope. Saves ~6 LOC adapter + ~1 SFC
  test on the dot side. Cost: a follow-up Phase 28.2.2 to extend
  the dot. Doesn't feel worth splitting given the dot block is 6
  LOC.
- **C**: title + dot + extend the "visible-region clamp"
  (chronix-additive: clamp title to viewport-bound + short-circuit
  on viewport-visible width < 30). Adds: 4 LOC for clamps; 2 LOC
  for short-circuit; ~2 more SFC tests. ~10 LOC delta. Diverges
  from k-ui's axis-bound `visibleStartX/EndX` clamp — chronix-
  additive on TOP of chronix-additive (which gets harder to
  audit). Don't recommend now; can revisit if users report title
  overflowing the viewport edge after Phase 28.2.1 ships.

**Recommendation**: **A**. Title + dot together, no visible-region
clamp.

---

**2. Helper shape: A (one pure helper `deriveEdgePaddedX(side, renderEdge, viewportLockedApex, isAxisClipped, isViewportClipped, defaultInset, triangleMargin, triangleSize, consumerGap) → number` covering the 3-way branch for one side) / B (extend `deriveViewportClipping` to also return `titlePaddedStartX` / `titlePaddedEndX` / `dotPaddedStartX` / `dotPaddedEndX` directly — single helper, more outputs) / C (inline all 4 padded-x computations in the flatMap closure; no helper)** — recommend **A**.

- **A (recommended)**: one pure helper, 8 args, single output per
  call. Used 4 times per bar (title-left, title-right, dot-left,
  dot-right). 8 unit tests pin every formula edge. Helper has zero
  Vue dependency; testable in isolation. Matches Phase 27.1's
  `deriveViewportClipping` pattern.
- **B**: extend the Phase 27.1 helper to know about consumer
  semantics. Reject. Couples `deriveViewportClipping` (currently a
  clean geometric primitive) to Phase 28's specific consumer
  insets. Future consumers (e.g. Phase 28.3.1 link rendering, or
  consumer slot templates) would each force adding more outputs.
  Single-responsibility violation.
- **C**: inline. Same anti-pattern as Phase 27.1 Decision A
  inlining the viewport-clipping math 2 times — the 3-way branch
  has subtle invariants (`viewportLockedApex` includes
  `TRIANGLE_MARGIN`; the cushion only adds `TRIANGLE_SIZE +
consumerGap`). 4 inline copies invite copy-paste drift.

**Recommendation**: **A**. New helper `deriveEdgePaddedX`.

---

**3. Hit-test alignment for progress-dot under viewport-clip: A (visual dot shifts to viewport edge; hit-test edge-zone STAYS at bar's actual edge — visual + hit-test diverge under viewport-clip only) / B (both visual + hit-test shift to viewport edge — keep them aligned) / C (NEITHER shifts — dot stays at bar's actual edge even when viewport-clipped, matching pre-Phase-27.1 behavior)** — recommend **A**.

- **A (recommended)**: visual dot at viewport edge (UX: user sees
  a handle at the visible viewport edge); hit-test edge-zone
  (`cx-gantt-bar-resizer-{start,end}` transparent rects at
  `renderX` / `renderX + renderWidth - resizerThickness`) stays at
  the bar's actual geometric edge. Trade-off: visual cue is "you
  can resize from here" pointing at viewport edge, but the actual
  cursor:ew-resize cue + pointer-hit-test fires at the bar's real
  edge (which may be offscreen — invisible to user). User would
  have to scroll to bring the real edge into view, then resize.
  Matches k-ui's behavior (k-ui doesn't viewport-shift dots
  either; chronix is genuinely extending k-ui here).
- **B**: hit-test also shifts. Resizing the bar from the viewport
  edge would move the bar's edge from wherever-it-is to wherever-
  the-pointer-lands. Resize math (`activeTxn.deltaX` applied to
  `bar.width`) would behave correctly because `deltaX` is in
  content-coords. But: clicking the visible dot would IMMEDIATELY
  start a resize transaction with `deltaX = scrollLeft +
viewportClip.viewportLockedLeftApexX - renderX` — instantly
  changing the bar's start by hundreds of pixels. User-hostile.
- **C**: nothing shifts under viewport-clip. Visual dot stays at
  `renderX + 1` (potentially offscreen). User loses visibility of
  the resize affordance entirely. Don't recommend — defeats the
  Phase 28.2.1 UX motivation.

**Recommendation**: **A**. Visual at viewport edge, hit-test at bar
edge. Visual + hit-test diverge under viewport-clip only.

---

Reply **按推荐继续** to accept all three (A / A / A), or call out
any 1-3 to override.
