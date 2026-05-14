# Phase 4.5 — Sticky-header scroll wrapper design note

**Status**: parked, waiting on user decision between three options.

## Problem

`<ChronixGantt>` currently renders a single SVG root. The example app wraps
it in `.cx-demo-svg-frame` with `overflow: auto + max-height: 70vh`. When
the user scrolls vertically (long bar list) or horizontally (wide view —
week's axis is 8736 px, year's is ~24000 px), the **header rows + tick
row scroll along with the bars**. There is no "sticky header" semantic —
once you scroll past the top, you lose the time axis reference.

The reference (k-ui) demo solves this with a split-pane layout:

- left: resource panel (sidebar) — vertical scroll, no horizontal
- right top: chart header (axis + ticks) — horizontal scroll, no vertical
- right bottom: chart body (bars + gridlines) — both axes scroll, sync'd
- horizontal scroll is shared between right-top and right-bottom

The right-top stays at viewport top while right-bottom scrolls vertically;
both scroll horizontally in lockstep when the user drags the bottom-right
content sideways.

chronix v1 needs an equivalent for the right-pane half (we don't have a
resource panel yet — that's a separate phase).

## Three candidate approaches

### X. Two SVGs, JS-synced horizontal scroll

```
<div class="cx-gantt-wrapper">
  <div class="cx-gantt-header-pane" style="overflow-x: hidden">
    <svg class="cx-gantt-header" width="${axis.totalWidth}" height="${bandHeight}">
      ...headerRows + tickRow...
    </svg>
  </div>
  <div class="cx-gantt-body-pane" style="overflow: auto; max-height: 70vh"
       @scroll="syncHeaderScrollLeft">
    <svg class="cx-gantt-body" width="${axis.totalWidth}" height="${contentHeight}">
      ...bars...
    </svg>
  </div>
</div>
```

- Body's `scroll` event handler writes `body.scrollLeft` → `headerPane.scrollLeft`.
- Two SVG roots, each with its own pointer handlers if needed.
- Header pane is `overflow-x: hidden` (user can't horizontally scroll it
  directly); body owns the horizontal scroll, header follows.
- Vertical scroll is body-only — header has fixed height, no overflow-y.

**Pros**:

- Standard SVG semantics, no foreignObject quirks.
- Clean DOM separation (header vs body).
- Two pointer handlers, but each owns its own surface — no overlap.
- Scroll-sync is one line: `headerPane.scrollLeft = e.target.scrollLeft`.

**Cons**:

- Public `<ChronixGantt>` API changes from "single SVG root" to "div root
  with two SVG children" — every test using `wrapper.find('svg')` needs
  to disambiguate (e.g. `find('svg.cx-gantt-body')`).
- Two `<svg>` elements means two coordinate systems for pointer math.
  Bar interactions stay on the body SVG; header interactions (axis-row
  filter) move to the header SVG. The composable's content-y filter
  shifts from `clientY - rect.top - bandHeight` to `clientY - bodyRect.top`
  (no band subtraction since the body doesn't render the band).
- Scroll-sync requires a JS handler. Minor perf cost, but reliable.

### Y. Single SVG with `<foreignObject>` + CSS sticky

```
<svg class="cx-gantt" width="..." height="...">
  <foreignObject x="0" y="0" width="100%" height="${bandHeight}"
                 style="position: sticky; top: 0">
    <div xmlns="http://www.w3.org/1999/xhtml">
      ...headerRows + tickRow as HTML divs...
    </div>
  </foreignObject>
  <g transform="translate(0, ${bandHeight})">
    ...bars...
  </g>
</svg>
```

- One SVG root preserves the existing API.
- `<foreignObject>` hosts HTML; HTML supports `position: sticky`.
- Header is rendered as HTML divs, not SVG.

**Pros**:

- Single SVG root → minimal test churn.
- One coordinate system for pointer math.

**Cons**:

- **`position: sticky` inside SVG is poorly supported.** Chromium may
  honor it; Firefox / Safari often don't (`<foreignObject>` doesn't
  always participate in CSS scroll containers correctly).
- HTML inside SVG mixes rendering models — accessibility tooling,
  copy/paste behavior, and zoom semantics all get weird.
- Header rendered as HTML divs loses SVG sizing semantics — the header's
  width tracking the SVG's content width requires manual sync anyway.

**Recommendation**: avoid.

### Z. Single overflow:auto container, HTML header + SVG body

```
<div class="cx-gantt-wrapper" style="overflow: auto; max-height: 70vh">
  <div class="cx-gantt-header" style="position: sticky; top: 0; z-index: 1;
                                       width: ${axis.totalWidth}px">
    ...headerRows + tickRow rendered as HTML/SVG...
  </div>
  <svg class="cx-gantt-body" width="${axis.totalWidth}" height="${contentHeight}">
    ...bars...
  </svg>
</div>
```

- One scroll container hosts both children.
- Horizontal scroll on the container moves both children together
  (header div is `width: ${axis.totalWidth}px`, so it scrolls with the body).
- `position: sticky; top: 0` keeps the header at the top during vertical
  scroll.
- Header rendered as HTML (divs) or as a separate inner SVG inside the
  outer div — either works.

**Pros**:

- Zero JS scroll-sync — CSS does the work.
- Single scroll container = single user-visible scrollbar.
- Header sticking on vertical scroll is standard CSS, broadly supported.

**Cons**:

- Public `<ChronixGantt>` API changes from SVG root to div root.
- Header rendered as HTML (or wrapped in a div containing an SVG) — at
  minimum, the `<text class="cx-gantt-tick-label">` becomes either
  `<span>` text in HTML or stays SVG inside the wrapping div.
- Test churn: `wrapper.find('svg')` won't return the wrapper; it returns
  the body SVG. Tests asserting on the wrapper (`SVG height` etc.)
  shift to the new structure.
- Pointer math: the body SVG's `getBoundingClientRect()` shifts on
  vertical scroll (the SVG moves up as scroll increases). The composable's
  pointer translation still works (it reads `rect.top` fresh on every
  pointerdown), so this is transparent.

## Decision criteria

1. **API stability for early consumers**: chronix is pre-1.0; we can
   change the root element shape. Test churn is a fixed cost, not a
   recurring one.
2. **Future-proofing for a resource panel**: a left sidebar is a separate
   pane that needs to vertical-scroll-sync with the body. **X** can
   extend to three panes (sidebar + header + body) by adding a third
   pane and another scroll-sync. **Z** would need either nested scroll
   containers (tricky CSS) or a sidebar outside the main container.
3. **Pointer model clarity**: chronix's hit-tester is geometry-only and
   doesn't care which SVG receives the event. **X** keeps each SVG's
   pointer math self-contained — header-row clicks filtered out at the
   header SVG, bar-area pointer math at the body SVG. **Z** keeps a
   single SVG for the bar area; header is HTML, no pointer handling.

## Recommendation

**Z first, X as a future extension when the sidebar lands.**

Reasoning:

- Z is the simplest CSS — no JS scroll-sync. Works out of the box for
  the single-pane case.
- The test churn is real but bounded (~80 tests using `wrapper.find('svg')`
  → `find('svg.cx-gantt-body')`).
- When the resource panel (Phase 5.x?) lands, Z extends to a three-pane
  layout naturally: sidebar div on the left (sticky-left), header div on
  top (sticky-top), body SVG bottom-right. CSS grid or flex handles the
  three-pane geometry; sticky positioning handles the scroll behavior
  on both axes. No scroll-sync handlers anywhere.
- X is the right answer if we ever need the header to scroll
  **independently** from the body — but the reference doesn't do that
  (header and body share horizontal scroll), so X's JS sync handler
  isn't earning its complexity.

## Estimated scope

- Refactor `<ChronixGantt>` to render `<div>` root with sticky header
  child + body SVG child: ~1.5 hours
- Update ~80 SFC tests to use `svg.cx-gantt-body` selectors: ~2 hours
- Pointer math verification under vertical scroll: ~1 hour + manual browser test
- Example app + CSS updates: ~30 min
- 2-3 new sticky-behavior tests (best done in browser, but can also
  assert on render-time CSS classes / inline styles): ~1 hour
- Journal + docs: ~30 min
- Total: ~6-7 hours of focused work

## Open questions for the user

1. **Approve Z?** Or prefer X for sidebar-future-proofing despite the JS sync cost?
2. **Render the header as HTML divs or as a separate inner SVG?** HTML is
   simpler (uses normal CSS for text positioning); SVG keeps the
   geometry consistent with the body. Recommend HTML for sticky-header
   correctness.
3. **Drop the example app's `max-height: 70vh` cap?** With sticky headers,
   the cap becomes meaningless (no vertical clipping at the wrapper).
   Default the wrapper's max-height to the container's height.

---

This document is updated when the decision lands.
