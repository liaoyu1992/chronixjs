# Phase 23 — sidebar dual-scrollport architecture

**Status**: **DONE (2026-05-17)** — all 5 commits landed + /phase-close passed (6/6 gates) + ci-check green + cross-demo verify 27/27 (15 chronix-side baselines re-captured) + chronix-visual 5/5 (re-captured) + 2 new parity assertions. See `audit/journal/2026-05-13.md` "Phase 23" section for full wrap-up.

## Problem

chronix's current wrapper architecture (Phase 4.5 + 5 + 14 + 22) is
**single-scrollport**: one `<div class="cx-gantt-wrapper">` with
`overflow: auto`, hosting a 2×3 CSS grid of 5 panes (sidebar-header /
chart-header / sidebar-body / chart-body / divider). The wrapper owns
the only scroll container; sidebar panes use `position: sticky;
left: 0` to stay visible during horizontal scroll, chart-header uses
`position: sticky; top: 0` to stay visible during vertical scroll.

The parity reference uses **dual-scrollport** instead: TWO independent
`overflow: auto` containers (`gantt-timeline-body-left` for sidebar +
`gantt-timeline-body-right` for chart body), with JS-coordinated
vertical scroll sync. Visible difference: the parity reference has
two scrollbars (one per pane); chronix has one combined scrollbar.

The architectural divergence isn't cosmetic — it unblocks three
downstream concerns currently parked:

1. **Phase 27 `isClippedStart` / `isClippedEnd` viewport-clipping
   flags** (deferred per `audit/PHASE_27_CONTINUATION_INDICATORS_DESIGN.md:73`):
   need `scrollLeft` + `clientWidth` state from the chart-body's scroll
   container. With single-scrollport, that state lives on the wrapper
   and is conflated with sidebar geometry; with dual-scrollport, the
   chart-pane has its own clean scroll-state to thread into render.
2. **Multi-column sidebars wider than the sidebar pane**: chronix v0
   has no path. With single-scrollport, the wrapper's horizontal scroll
   moves the entire chart together — narrowing the sidebar pane would
   require either truncating the sidebar visually or pushing chart
   content off-screen. With dual-scrollport, the sidebar gets its own
   horizontal scroll independent of the chart.
3. **Visual parity with the reference demo's two-scrollbar look** (user
   observed during Phase 21 session 2026-05-16; tracked at
   `audit/PARITY_RECHECK.md:196` as the Phase 23 commitment).

Promoting from "Planned" to executing because it's the longest-
deferred architectural item on the roadmap (allocated since the
Phase 22 era) and three later phases reference it as a prereq.

## Reference (k-ui) behavior surface — full catalog

Reference files audited:

- `d:/work/k-ui/packages/gantt/src/resource-timeline/ResourceTimelineLayout.tsx:74-185` — the layout shell: a CSS grid with `gantt-timeline-body-left` (sidebar pane, own `overflow: auto`) + `gantt-timeline-body-right` (chart pane, own `overflow: auto`) as siblings under a single grid row. Header pane `gantt-timeline-header-pane` sits above with its own `overflow: hidden` (header tracks chart-pane's `scrollLeft` via `transform: translateX`, NOT its own scroll).
- `d:/work/k-ui/packages/gantt/src/resource-timeline/ResourceTimelineLayout.tsx:240-302` — `handleBodyLeftScroll` and `handleBodyRightScroll` — bidirectional vertical scroll sync with a `scrollingPaneRef` guard flag to prevent the writeback loop. Each handler writes the other pane's `scrollTop` only when `scrollingPaneRef.current` matches its own pane id (the source pane sets the ref, the target pane reads + bails if mismatched).
- `d:/work/k-ui/packages/gantt/src/resource-timeline/ResourceTimelineLayout.tsx:304-340` — `handleBodyRightScroll` ALSO writes `transform: translateX(-${scrollLeft}px)` on the header pane's inner content wrapper — that's how the header tracks horizontal scroll without a scroll container of its own.
- `d:/work/k-ui/packages/gantt/src/resource-timeline/GanttView.tsx:481-616` — the header SVG is rendered inside the static `gantt-timeline-header-pane` wrapper; the `translateX` happens on the inner `gantt-timeline-header-wrapper` div that hosts the SVG.
- `d:/work/k-ui/packages/gantt/src/resource-timeline/ResourceTimelineLayout.tsx:127-138` — `gantt-timeline-divider` lives in column 2 of the 3-column grid, spans `1 / 3` row range so it crosses both the header row AND the body row.
- `d:/work/k-ui/packages/gantt/src/internal-common/RegistryConfigImpl.ts:48-67` — `stickyHeader: true` (default) is what the parity reference always sets; `false` mode collapses to a single scroll pane behavior that no chronix consumer needs.

### Vertical sync mechanism — `scrollingPaneRef` guard

```
function handleBodyLeftScroll(ev) {
  if (scrollingPaneRef.current && scrollingPaneRef.current !== 'left') return;
  scrollingPaneRef.current = 'left';
  bodyRightRef.current.scrollTop = ev.target.scrollTop;
  // Async reset — gives both panes time to settle before allowing the other to drive.
  requestAnimationFrame(() => { scrollingPaneRef.current = null });
}

function handleBodyRightScroll(ev) {
  if (scrollingPaneRef.current && scrollingPaneRef.current !== 'right') return;
  scrollingPaneRef.current = 'right';
  bodyLeftRef.current.scrollTop = ev.target.scrollTop;
  headerWrapperRef.current.style.transform = `translateX(-${ev.target.scrollLeft}px)`;
  requestAnimationFrame(() => { scrollingPaneRef.current = null });
}
```

The guard flag is the load-bearing detail: without it, every
programmatic `scrollTop` write fires a scroll event in the target
pane, which writes back to the source, ad infinitum. The
"first-to-fire wins" pattern + rAF reset is the parity-reference's
chosen idiom; it's robust to both mouse wheel + scrollbar drag + JS
`element.scrollTo()`.

### Header horizontal sync — `transform: translateX` not `scrollLeft`

The reference uses transform-on-inner-element (not scrollLeft on the
header pane) for one reason: scrollbar visibility. `overflow: hidden +
transform` produces zero scrollbar on the header band; `overflow:
scroll + scrollLeft` would either show a redundant header scrollbar
(if visible) or fight with the chart-pane's scrollbar layout. Visual
parity demands the header has NO scrollbar of its own — it's an axis
display, not a scroll surface.

### Surface-level disposition table

| Item                                                                                        | k-ui                                                  | chronix v0                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Two separate `overflow: auto` panes (sidebar + chart)                                       | `ResourceTimelineLayout.tsx:74-185`                   | ✅ **port** as `cx-gantt-sidebar-pane` + `cx-gantt-chart-pane`. Each pane owns its vertical + horizontal scroll. Wrapper becomes a 1×3 grid (sidebar / divider / chart) with no overflow on the wrapper itself.                                                                                                                      |
| Bidirectional JS vertical scroll sync with guard-flag (prevents writeback loop)             | `handleBodyLeftScroll` / `handleBodyRightScroll`      | ✅ **port** — `scrollingPaneSource: Ref<'sidebar' \| 'chart' \| null>` mirrors `scrollingPaneRef.current`. rAF reset after each forwarded write.                                                                                                                                                                                     |
| Header pane separated from body panes; tracks horizontal scroll via `transform: translateX` | `handleBodyRightScroll:325`                           | ✅ **port (chronix-shaped)** — chart-header SVG sits above the chart-pane (separate sibling in the grid); its inner wrapper gets `transform: translateX(-${chartPane.scrollLeft}px)` updated on chart-pane scroll. Same scrollLeft trick for the sidebar-header above the sidebar-pane.                                              |
| No `overflow` on the header pane wrappers                                                   | `ResourceTimelineLayout.tsx:140`                      | ✅ **port** — chart-header + sidebar-header wrappers get `overflow: hidden` so their `translateX` content can move freely without a stray scrollbar.                                                                                                                                                                                 |
| Sticky-top header inside its own pane (chronix's Phase 4.5 model)                           | N/A (k-ui uses outside-pane headers)                  | ❌ **Reject** — chronix's Phase 4.5 sticky-top model was a workaround for the single-scrollport architecture; with dual scrollports the header sits as a sibling above the chart-pane, not inside it. Removing the sticky positioning simplifies the z-index stack (no more 4-level nesting).                                        |
| Sidebar resize divider spans both header row + body row                                     | `ResourceTimelineLayout.tsx:127-138`                  | ✅ **port** — divider grid-row spans `1 / 3` (header band + body row).                                                                                                                                                                                                                                                               |
| Sidebar pane can horizontally scroll if its columns exceed pane width                       | inherent to `overflow: auto` on the pane              | ✅ **port** — `cx-gantt-sidebar-pane` with `overflow: auto` gets horizontal scroll automatically when sum of column widths > pane width.                                                                                                                                                                                             |
| Chart-pane scrollLeft / clientWidth state exposed to render code                            | k-ui threads `scrollLeft` into `containerWidth` props | ✅ **port** as new `useChartScrollState({ chartPaneRef })` composable returning `{ scrollLeft: Ref<number>, clientWidth: Ref<number> }`. Wires into render so Phase 27.1 viewport clipping + Phase 28.2.1 text-area-by-viewport can consume it in a follow-up phase (Phase 23 only exposes the state; downstream consumers wire it). |
| `setAutoScrollEnabled(false)` while divider drags (prevents inertia-scroll fight)           | `initResizing:328`                                    | ⏸️ **parked** — chronix has no auto-scroll feature today. Re-prioritize when an auto-scroll feature lands (Phase 25 drag-distance gate is unrelated; auto-scroll is a separate K.7 RENDER_LAYER_GAP_SWEEP item already defer-indefinite).                                                                                            |
| Header pane `scrollTop` clamping (prevent vertical scroll on the header pane itself)        | implicit (header pane has no `overflow-y: auto`)      | ✅ **port** — chart-header + sidebar-header wrappers stay `overflow: hidden`, no vertical scroll possible.                                                                                                                                                                                                                           |
| Sticky positioning on inner sidebar / header cells (existing Phase 5 / 14 sticky markers)   | N/A                                                   | ❌ **remove** — sticky-left on sidebar-header / sidebar-body + sticky-top on chart-header all become dead code once they sit inside their own panes. Removal cleans up ~6 inline `position: sticky` style blobs in the render function.                                                                                              |
| Horizontal scrollbar visibility on chart-pane                                               | visible (default browser scrollbar)                   | ✅ **port** — chart-pane gets the default scrollbar (no `overflow-x: hidden`). User now sees two scrollbars (one on chart-pane horizontal + one on chart-pane vertical, plus sidebar-pane scrollbars when its content exceeds its pane).                                                                                             |
| Header pane height matches `totalHeaderBandHeight`                                          | matches                                               | ✅ **port** — sidebar-header pane height = `totalHeaderBandHeight`; chart-header pane height = same.                                                                                                                                                                                                                                 |
| Body pane heights = `bodyHeight` cap (vertical scroll engages above this)                   | matches                                               | ✅ **port (default)** — sidebar-pane + chart-pane heights default to `min(bodyHeight, maxBodyHeight)` where `maxBodyHeight` is a new prop (default `none` = no cap, but example app sets `70vh` like Phase 4.5).                                                                                                                     |

**Phase 23 net surface**: 8 ✅-port items (dual panes / sync mechanism / scrollLeft state / header sibling-above-pane / divider rowspan / sidebar horizontal scroll / scrollLeft state exposure / scroll state composable), 3 ❌-remove (sticky inner cells / sticky chart-header / sticky sidebar panes are all dead code under dual-scrollport), 1 ⏸️-parked (autoScroll-during-divider-drag — chronix has no auto-scroll feature yet).

### Naming alignment table

| k-ui                            | chronix                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `gantt-timeline-body-left`      | `cx-gantt-sidebar-pane` (chronix-feature-name vs k-ui's geometric `body-left`)       |
| `gantt-timeline-body-right`     | `cx-gantt-chart-pane`                                                                |
| `gantt-timeline-header-pane`    | `cx-gantt-chart-header-pane` + `cx-gantt-sidebar-header-pane` (chronix splits these) |
| `gantt-timeline-header-wrapper` | `cx-gantt-chart-header-inner` + `cx-gantt-sidebar-header-inner`                      |
| `scrollingPaneRef`              | `scrollSyncSource` (chronix-named — describes purpose, not implementation)           |
| `handleBodyLeftScroll`          | `onSidebarPaneScroll`                                                                |
| `handleBodyRightScroll`         | `onChartPaneScroll`                                                                  |

## Approach

### §1 — Wrapper structural refactor

Replace the current 2×3 CSS grid:

```ts
// CURRENT (Phase 4.5 + 5 + 14 + 22)
'<div class="cx-gantt-wrapper" style="overflow: auto; display: grid;
  grid-template-columns: ${sidebarWidth}px ${dividerWidth}px auto;
  grid-template-rows: ${headerHeight}px auto;">'
  // 5 children: sidebarHeader (sticky), chartHeader (sticky), sidebarBody (sticky), chartBody, divider
'</div>'
```

with a 2×3 CSS grid where panes own their scrolls:

```ts
// PHASE 23
'<div class="cx-gantt-wrapper" style="display: grid;
  grid-template-columns: ${sidebarWidth}px ${dividerWidth}px auto;
  grid-template-rows: ${headerHeight}px auto;
  height: ${maxBodyHeight ?? "auto"};">'
  '<div class="cx-gantt-sidebar-header-pane" style="overflow: hidden;
    grid-column: 1; grid-row: 1;">'
    '<div class="cx-gantt-sidebar-header-inner">' sidebarHeader '</div>'
  '</div>'
  '<div class="cx-gantt-chart-header-pane" style="overflow: hidden;
    grid-column: 3; grid-row: 1;">'
    '<div class="cx-gantt-chart-header-inner">' chartHeaderSvg '</div>'
  '</div>'
  '<div class="cx-gantt-sidebar-pane" style="overflow: auto;
    grid-column: 1; grid-row: 2;" @scroll="onSidebarPaneScroll">'
    sidebarBody
  '</div>'
  '<div class="cx-gantt-chart-pane" style="overflow: auto;
    grid-column: 3; grid-row: 2;" @scroll="onChartPaneScroll">'
    chartBodySvg
  '</div>'
  divider  // grid-column: 2, grid-row: 1 / 3 (unchanged)
'</div>'
```

Key changes:

- Wrapper itself: NO `overflow` — the panes own it.
- 6 children (was 5): four panes + chart-header inner wrapper + chart-body, plus the divider.
- Sidebar / chart header panes: `overflow: hidden` so their inner `translateX` content doesn't show a scrollbar.
- Sidebar-pane / chart-pane: own `overflow: auto`.
- All `position: sticky` inline styles removed from the 4 inner blocks (sidebar-header, chart-header, sidebar-body now flow naturally inside their panes).

### §2 — Vertical scroll sync composable

New file `adapters/vue3/src/use-scroll-sync.ts`:

```ts
import { onMounted, onUnmounted, ref, type Ref } from 'vue';

/**
 * Phase 23: bidirectional vertical scroll sync between two DOM
 * elements. Reads each element's scroll event and writes the other's
 * scrollTop in lockstep, guarded by a source-tracking flag so the
 * writeback doesn't fire its own scroll event in an infinite loop.
 *
 * `requestAnimationFrame` reset clears the source flag after each
 * write so subsequent native scrolls can take over. The flag-based
 * approach matches the parity reference's `scrollingPaneRef` idiom
 * — proven robust across mouse wheel, scrollbar drag, and
 * programmatic `scrollTo` calls.
 *
 * Both refs must point at HTMLElements with `overflow: auto`; the
 * composable attaches `scroll` listeners on mount and removes them
 * on unmount. Safe to call before the elements are populated — the
 * watcher fires when refs resolve.
 */
export function useScrollSync(
  paneA: Ref<HTMLElement | null>,
  paneB: Ref<HTMLElement | null>,
): void {
  const source = ref<'a' | 'b' | null>(null);

  function onScrollA(): void {
    const a = paneA.value;
    const b = paneB.value;
    if (!a || !b) return;
    if (source.value && source.value !== 'a') return;
    source.value = 'a';
    b.scrollTop = a.scrollTop;
    requestAnimationFrame(() => {
      source.value = null;
    });
  }

  function onScrollB(): void {
    const a = paneA.value;
    const b = paneB.value;
    if (!a || !b) return;
    if (source.value && source.value !== 'b') return;
    source.value = 'b';
    a.scrollTop = b.scrollTop;
    requestAnimationFrame(() => {
      source.value = null;
    });
  }

  onMounted(() => {
    paneA.value?.addEventListener('scroll', onScrollA, { passive: true });
    paneB.value?.addEventListener('scroll', onScrollB, { passive: true });
  });

  onUnmounted(() => {
    paneA.value?.removeEventListener('scroll', onScrollA);
    paneB.value?.removeEventListener('scroll', onScrollB);
  });
}
```

### §3 — Header horizontal sync (chart-pane → chart-header)

In `<ChronixGantt>`'s setup:

```ts
const chartPaneRef = ref<HTMLElement | null>(null);
const chartHeaderInnerRef = ref<HTMLElement | null>(null);
const sidebarPaneRef = ref<HTMLElement | null>(null);
const sidebarHeaderInnerRef = ref<HTMLElement | null>(null);

function onChartPaneHorizontalScroll(): void {
  const pane = chartPaneRef.value;
  const inner = chartHeaderInnerRef.value;
  if (!pane || !inner) return;
  inner.style.transform = `translateX(-${pane.scrollLeft}px)`;
}

function onSidebarPaneHorizontalScroll(): void {
  const pane = sidebarPaneRef.value;
  const inner = sidebarHeaderInnerRef.value;
  if (!pane || !inner) return;
  inner.style.transform = `translateX(-${pane.scrollLeft}px)`;
}

// Scroll listeners — vertical handled by useScrollSync, horizontal
// inline (only one direction, no sync loop).
onMounted(() => {
  chartPaneRef.value?.addEventListener('scroll', onChartPaneHorizontalScroll, { passive: true });
  sidebarPaneRef.value?.addEventListener('scroll', onSidebarPaneHorizontalScroll, {
    passive: true,
  });
});

useScrollSync(sidebarPaneRef, chartPaneRef); // vertical sync
```

`onChartPaneHorizontalScroll` runs on EVERY scroll event (cheap —
single style write). Sidebar's horizontal scroll only triggers
the sidebar-header transform (no cross-pane sync since chart and
sidebar can horizontally scroll independently).

### §4 — Chart scroll-state composable (downstream consumer hook)

New file `adapters/vue3/src/use-chart-scroll-state.ts`:

```ts
import { onMounted, onUnmounted, ref, type Ref } from 'vue';

/**
 * Phase 23: tracks the chart-pane's scrollLeft + clientWidth so
 * downstream render code (Phase 27.1 viewport clipping; Phase 28.2.1
 * text-area-by-viewport-width) can consume them as reactive refs.
 *
 * Updates on scroll + on ResizeObserver — covers both user scroll
 * and container resize. clientWidth tracks the chart-pane's visible
 * width post-padding (browser-native `.clientWidth` semantics).
 *
 * Defaults to `{ scrollLeft: 0, clientWidth: 0 }` before the ref
 * resolves; consumers can guard on `clientWidth > 0` to skip first-
 * paint pre-mount frames.
 */
export interface ChartScrollState {
  readonly scrollLeft: Ref<number>;
  readonly clientWidth: Ref<number>;
}

export function useChartScrollState(paneRef: Ref<HTMLElement | null>): ChartScrollState {
  const scrollLeft = ref(0);
  const clientWidth = ref(0);

  function readState(): void {
    const pane = paneRef.value;
    if (!pane) return;
    scrollLeft.value = pane.scrollLeft;
    clientWidth.value = pane.clientWidth;
  }

  let resizeObserver: ResizeObserver | null = null;
  onMounted(() => {
    paneRef.value?.addEventListener('scroll', readState, { passive: true });
    if (typeof ResizeObserver !== 'undefined' && paneRef.value) {
      resizeObserver = new ResizeObserver(readState);
      resizeObserver.observe(paneRef.value);
    }
    readState();
  });

  onUnmounted(() => {
    paneRef.value?.removeEventListener('scroll', readState);
    resizeObserver?.disconnect();
    resizeObserver = null;
  });

  return { scrollLeft, clientWidth };
}
```

Wired into `<ChronixGantt>`:

```ts
const chartScroll = useChartScrollState(chartPaneRef);
// chartScroll.scrollLeft.value + chartScroll.clientWidth.value
// stay live across user interaction; Phase 27.1 + 28.2.1 will read
// them when those follow-ups land.
```

Phase 23 ITSELF doesn't consume the state visually — it just exposes
the hooks. Downstream phases (27.1 / 28.2.1) thread the values into
PlacedBar's `isClippedStart` / `isClippedEnd` derivation. This split
keeps Phase 23 scope focused on the structural refactor.

### §5 — Pointer math validation under dual-scrollport

chronix's existing pointer composable (`useGanttPointer`) reads:

```ts
function toContentXY(e: PointerEvent): { x: number; y: number } | null {
  const svg = bodySvgRef.value;
  if (!svg) return null;
  const rect = svg.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}
```

With the chart-body SVG nested inside the chart-pane (which has its
own scroll), `bodySvg.getBoundingClientRect()` already reflects the
SVG's CURRENT visible position — the browser accounts for the pane's
scroll automatically. So `clientX - rect.left` = content-x including
the scroll offset. Same model as today; nothing to change.

**Edge case**: when `chartPane.scrollLeft > 0`, the SVG's bounding
rect's `left` is NEGATIVE (the SVG has scrolled out of view to the
left). `e.clientX - rect.left` still produces the correct content-x
because `rect.left` already encodes the scroll-shift. Browser-tested
this pattern in the Phase 4.5 sticky-header refactor; same model.

### Sample consumer (no API change for the common case)

```vue
<template>
  <ChronixGantt
    :bars="bars"
    :rows="rows"
    :axis-input="axisInput"
    :columns="columns"
    max-body-height="70vh"
  />
</template>
```

No new required props. Existing `:columns` consumers see the new
dual-scrollport layout automatically; no-sidebar consumers (no
`columns` prop) keep the existing single-pane layout (no dual
scrollports apply when there's only one pane to scroll).

### Alternatives considered

- **Single-scrollport with passive scroll-state observe** (use a
  ResizeObserver + scrollTop watch to derive viewport state without
  changing DOM structure). Reject. Doesn't solve the multi-column-
  sidebar problem; doesn't match the parity reference's visible
  two-scrollbar appearance; doesn't unblock Phase 27.1 cleanly because
  the chart-body's "viewport" in single-scrollport is ambiguous (is it
  the wrapper minus the sticky sidebar pane? minus the sticky header
  band?). The cleaner architecture pays dividends downstream.
- **Header inside chart-pane with sticky-top** (chronix's Phase 4.5
  model, extended). Reject. Mixing scroll panes with sticky positioning
  produces subtle bugs around scroll-snap boundaries (sticky elements
  fight with scroll-into-view behavior); the parity reference's
  "header outside the scroll pane + transform sync" pattern is more
  robust + matches what consumers expect to see in DevTools.
- **One-way master-slave sync** (chart drives sidebar, sidebar is
  scroll-locked). Reject. Visible scrollbar on sidebar pane that can't
  be dragged feels broken; users WILL try to scroll the sidebar
  directly. Bidirectional sync is the established pattern.
- **Phase 23a (structural refactor only) + Phase 23b (scroll-sync
  handler)** split. Reject. The two pieces are tightly coupled — a
  dual-pane layout without scroll sync is visibly broken (vertical
  scroll on one pane leaves the other behind). Single phase keeps the
  user-visible result coherent.
- **CSS-only sync via `scroll-snap` or `position: sticky` tricks**.
  Reject. No CSS-only mechanism exists for cross-element scrollTop
  mirroring across separate scroll containers. JS handler is unavoidable.

## Parity assertion plan — MANDATORY

The dual-scrollport architecture IS parity-testable structurally: both
demos render a chart-pane element with its own `overflow: auto`, and
both produce DOM-level evidence of two scroll containers (cross-demo
verify can probe `getComputedStyle(.cx-gantt-chart-pane).overflow`
on chronix and the equivalent on k-ui's pane). The scroll-sync
behavior (vertical lockstep when one pane scrolls) requires a
Playwright interaction test — drive `pane.scrollTo({ top: 100 })` on
one side, assert the other's `scrollTop === 100` after rAF.

| Assertion id (in parity.spec.ts)                                           | Drives k-ui demo via | Drives chronix demo via | Compares                                                                                                                                                                                                                                    | Tolerance |
| -------------------------------------------------------------------------- | -------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| `phase23-dual-scrollport DOM presence parity`                              | `loadBothDemos`      | `loadBothDemos`         | Both sides render exactly TWO scroll containers (chronix: `.cx-gantt-sidebar-pane` + `.cx-gantt-chart-pane`; k-ui: `.gantt-timeline-body-left` + `.gantt-timeline-body-right`), each with `overflow: auto` (or `scroll`) in computed style. | exact     |
| `phase23-vertical-scroll-sync lockstep (week view, programmatic scrollTo)` | `loadBothDemos`      | `loadBothDemos`         | Drive `chartPane.scrollTo({ top: 100 })`; after a rAF tick, sidebar pane's `scrollTop === 100` on both sides. Then drive `sidebarPane.scrollTo({ top: 50 })`; assert chart pane mirrors.                                                    | `1 px`    |

2 parity assertions cover the load-bearing dual-scrollport invariants:
DOM structure (both sides have 2 scroll containers) + scroll-sync
behavior (vertical lockstep).

### Drift-detection scope

- **Covered**: DOM-structure parity (two scroll containers, expected `overflow` style) + bidirectional vertical sync behavior + the rAF settling window.
- **NOT covered (cross-demo)**:
  - Horizontal sidebar-pane scroll (sidebar columns wider than pane) — chronix's parity-mode demo doesn't exercise wide sidebars; adding the test data is a separate fixture-extension task.
  - `transform: translateX` header sync — visible only with horizontal scroll active on chart-pane. The cross-demo verify scenarios scroll programmatically but not horizontally; pinned by adapter unit test instead.
  - `useChartScrollState` composable's `clientWidth` derivation — chronix-additive (no k-ui counterpart to consume).
- **NOT covered (adapter)**: VRT pixel parity for the new scrollbar appearance. The scrollbar visual is browser-rendered and depends on OS / theme; not VRT-stable. Adapter tests assert DOM structure + computed-style invariants instead.

## Test coverage

- **adapter** — `adapters/vue3/src/use-scroll-sync.test.ts` (new, ~6 tests):
  - Mount + unmount cleanup (scroll listeners attached on mount, removed on unmount)
  - PaneA scroll writes paneB.scrollTop (one-way forward)
  - PaneB scroll writes paneA.scrollTop (one-way reverse)
  - Source guard prevents writeback loop (mock scroll on both panes in close succession; only one direction propagates per source-set)
  - rAF reset allows next scroll to propagate
  - Null ref guards (no error when refs resolve to null)

- **adapter** — `adapters/vue3/src/use-chart-scroll-state.test.ts` (new, ~5 tests):
  - Initial state `{ scrollLeft: 0, clientWidth: 0 }` before mount resolution
  - Reads pane's scrollLeft on scroll event
  - Reads pane's clientWidth on ResizeObserver fire (mock the observer)
  - Returns reactive refs (assertions on `.value` after scroll)
  - Cleanup on unmount (no leaked observer / listener)

- **adapter** — `adapters/vue3/src/chronix-gantt-dual-scrollport.test.ts` (new, ~10 tests):
  - With `:columns` set, renders `.cx-gantt-sidebar-pane` + `.cx-gantt-chart-pane`
  - Without `:columns`, no dual scrollports (back to single-pane layout)
  - Sidebar-header-inner has `transform: translateX(...)` after sidebar-pane scrollLeft change
  - Chart-header-inner has `transform: translateX(...)` after chart-pane scrollLeft change
  - Vertical scroll on chart-pane mirrors to sidebar-pane (jsdom assertion on scrollTop after rAF)
  - Vertical scroll on sidebar-pane mirrors to chart-pane
  - All 4 inner panes have correct overflow style (sidebar-pane + chart-pane: `auto`; headers: `hidden`)
  - Sticky `position: sticky` styles REMOVED from sidebar-header / chart-header / sidebar-body (regression guard)
  - Divider spans both header row + body row (grid-row `1 / 3` regression guard)
  - Pointer math still produces correct content-x when chart-pane is scrolled (drive `chartPane.scrollLeft = 100`; pointer at `clientX = 200` resolves to content-x = 200 - rect.left, where rect.left = -100 post-scroll, so content-x = 300)

- **parity** — `tooling/golden-runner/tests/parity.spec.ts` (+2 assertions):
  Per the table above — DOM-presence parity + vertical-scroll-sync lockstep parity (both week view).

Expected counts after Phase 23:

- vitest 651 → ~672 (+21: 6 scroll-sync + 5 chart-scroll-state + 10 dual-scrollport).
- parity-spec 51 → 53 (+2 phase23-dual-scrollport-\*).
- ChronixTheme tokens 50 unchanged.
- cross-demo verify scenarios 27 → 27 with 27 baselines re-captured (new DOM structure shifts pixel positions of the chart-pane content slightly; sidebar pane gains a visible scrollbar where there was none).
- chronix-visual baselines 5 → 5 re-captured for same reason.

### Existing adapter test churn estimate

The Phase 4.5 refactor caused ~80 SFC tests to update from `wrapper.find('svg')` to `wrapper.find('svg.cx-gantt-body')`. Phase 23's structural refactor will need a parallel sweep. Inventory of likely-affected selectors:

- `wrapper.find('.cx-gantt-wrapper')` — still valid (root unchanged)
- `wrapper.find('svg.cx-gantt-body')` — still valid (chart-body SVG class unchanged)
- `wrapper.find('svg.cx-gantt-header')` — still valid (chart-header SVG class unchanged)
- `wrapper.find('div.cx-gantt-sidebar-header')` — still valid (sidebar-header class unchanged; lives inside the new sidebar-header-pane)
- `wrapper.find('div.cx-gantt-sidebar-body')` — still valid (lives inside the new sidebar-pane)
- Tests asserting on inline `position: sticky` style — **will need to remove** (Phase 23 removes those styles). Estimated 6-8 tests in `chronix-gantt.test.ts`.
- Tests asserting on `wrapper.element.style.overflow === 'auto'` — **need to flip** to assert overflow on the pane, not the wrapper. ~3 tests.

Total estimated test churn: ~10-12 existing tests updated + 21 new tests = ~33 test diffs. Bounded; no architectural API change.

## VRT impact

- **chronix-visual baselines** (5): re-baseline expected. The new DOM structure produces a scrollbar inside the chart-pane (which IS the captured locator in chronix-visual.spec.ts) — the scrollbar shows up at the right edge of each captured screenshot.
- **cross-demo VRT baselines** (27): re-baseline expected for the same reason. Cross-demo screenshots capture chronix and parity-reference side-by-side; chronix's new scrollbar shifts the visible content area horizontally by the scrollbar's width.
- **Re-baseline procedure**:
  1. Kill any leftover chronix demo dev server (vite caches stale dist).
  2. Restart `pnpm --filter @chronixjs/example-gantt-vue3 dev` against the rebuilt adapter dist.
  3. Run `pnpm --filter @chronixjs/golden-runner chronix-capture` (5 PNGs).
  4. Run `pnpm --filter @chronixjs/golden-runner cross-demo-capture` (27 scenarios).
  5. Read 3-5 sampled PNGs via Read tool to visually verify the new layout looks correct.

Predicted re-baseline count: **32 PNGs** (5 chronix-visual + 27 cross-demo). **First non-zero-VRT phase since Phase 26** (Phase 27 / 28.1 / 28.3 / 29 were all 0-VRT). Justified by the genuine structural change.

## Execution plan — 4 commits + wrap-up

### Commit 1 (design doc, this commit) — REQUIRES user review of 3 load-bearing decisions

Lands only `audit/PHASE_23_SIDEBAR_DUAL_SCROLLPORT_DESIGN.md`.
Awaits user confirmation of the 3 decisions in "Open questions"
before implementation.

### Commit 2: Adapter — useScrollSync + useChartScrollState composables + structural refactor + ~21 tests

- `adapters/vue3/src/use-scroll-sync.ts` (new, ~50 LOC): bidirectional scrollTop sync with rAF-reset guard.
- `adapters/vue3/src/use-scroll-sync.test.ts` (new, ~120 LOC, +6 tests).
- `adapters/vue3/src/use-chart-scroll-state.ts` (new, ~60 LOC): scrollLeft + clientWidth refs with scroll + ResizeObserver listeners.
- `adapters/vue3/src/use-chart-scroll-state.test.ts` (new, ~110 LOC, +5 tests).
- `adapters/vue3/src/chronix-gantt.ts` (~150 LOC modified): wrapper restructure to dual-pane grid + sidebar-header-pane / chart-header-pane wrappers + 4 new refs (chartPaneRef / chartHeaderInnerRef / sidebarPaneRef / sidebarHeaderInnerRef) + scroll handlers + useScrollSync + useChartScrollState wiring. Sticky-position style blobs removed from sidebar-header / chart-header / sidebar-body.
- `adapters/vue3/src/chronix-gantt-dual-scrollport.test.ts` (new, ~220 LOC, +10 tests).
- `adapters/vue3/src/chronix-gantt.test.ts` (~10-12 existing test updates) — remove dead sticky-position assertions.
- New prop `maxBodyHeight?: string` (default `undefined` = no cap; example app sets `'70vh'`).
- Rebuild `@chronixjs/gantt-vue3` dist.
- ci-check green (vitest 651 → ~672).

### Commit 3: Demo wiring + VRT re-baseline

- `examples/gantt-vue3/src/App.vue`: thread `max-body-height="70vh"` onto `<ChronixGantt>` so the dual-scrollport vertical scroll actually engages in the demo.
- `examples/gantt-vue3/src/styles.css`: remove the now-redundant `.cx-gantt-wrapper { max-height: 70vh }` override (the prop drives it now).
- Restart chronix demo dev server (fresh vite, post-dist-rebuild).
- `pnpm --filter @chronixjs/golden-runner chronix-capture` (5 PNGs).
- Read 2-3 sampled chronix-visual PNGs via Read tool to visually verify.
- `pnpm --filter @chronixjs/golden-runner cross-demo-capture` (27 scenarios).
- Read 3-5 sampled cross-demo PNGs via Read tool.
- ci-check green; cross-demo-verify gate green (27/27 with new baselines).

### Commit 4: Parity assertions

- `tooling/golden-runner/src/reference-dom-map.ts`: 2 new selector exports (`TIMELINE_BODY_LEFT = '.gantt-timeline-body-left'` + `TIMELINE_BODY_RIGHT = '.gantt-timeline-body-right'`).
- `tooling/golden-runner/tests/parity.spec.ts`: +2 dual-scrollport parity assertions (DOM presence + vertical-scroll-sync lockstep).
- Run parity.spec.ts (`pnpm --filter @chronixjs/golden-runner verify` includes it) — both new assertions should pass.
- ci-check green.

### Commit 5 (wrap-up — REQUIRES /phase-close invocation)

- `audit/journal/2026-05-13.md`: "Phase 23 — sidebar dual-scrollport architecture (DONE, YYYY-MM-DD)" section.
- `memory/project_gantt_rewrite_plan.md`: bump vitest 651 → ~672; parity-spec 51 → 53; theme tokens 50 unchanged; add Phase 23 DONE marker; note Phase 27.1 / 28.2.1 viewport clipping now unblocked.
- `audit/PHASE_23_SIDEBAR_DUAL_SCROLLPORT_DESIGN.md` Status → DONE.
- Update `audit/PARITY_RECHECK.md` row 367 ("Wrapper one-scroll vs k-ui's two-scroll architecture") → DONE Phase 23.

## Estimated scope

| Commit                                               | Hours   | LOC est.                                    |
| ---------------------------------------------------- | ------- | ------------------------------------------- |
| 1 (design doc)                                       | 1       | this file (~700 LOC)                        |
| 2 (adapter: 2 new composables + restructure + tests) | 3.5     | ~260 LOC src + ~450 LOC tests               |
| 3 (demo wiring + VRT re-baseline)                    | 1.5     | ~30 LOC demo + 32 PNGs re-baselined         |
| 4 (parity assertions)                                | 1       | ~80 LOC parity tests + ~10 LOC selector map |
| 5 (wrap-up)                                          | 0.5     | journal + memory + status flip              |
| **Total**                                            | **7.5** | ~1530 LOC + 32 baseline PNGs                |

Within single-session discipline (per `feedback_quality_acceleration.md`
constraint #3). Slightly over the 7h memory estimate due to the
adapter test churn estimate (~10 existing tests need updates plus the
21 new tests).

## 4-dimension audit check

| Dimension                     | Coverage in Phase 23                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Options surface**           | 1 new prop `maxBodyHeight?: string` (CSS height value, default undefined). 2 new public composables (`useScrollSync`, `useChartScrollState`) exported from `@chronixjs/gantt-vue3` for consumer reuse. No new theme tokens (scrollbar visual is browser-native).                                                                                                         |
| **Render code**               | BIG: wrapper restructured from 5-pane single-overflow grid to 6-pane (2 panes inside 2 wrapper panes + 2 scroll panes + divider) dual-overflow grid. Sticky positioning removed from 3 panes. Header content moved inside new `*-header-inner` translateX wrappers. ~150 LOC of net adapter changes (excluding new files).                                               |
| **Interaction code**          | Zero algorithmic change. Pointer math (`toContentXY`) already reads `bodySvg.getBoundingClientRect()` which the browser auto-adjusts for the chart-pane's scroll — works under both single- and dual-scrollport architectures unchanged. Scroll handlers added (sync + translateX + scroll-state) are non-pointer event handlers; orthogonal to the pointer composables. |
| **Layout-algorithm pipeline** | Zero impact. PlannedAxis / SwimlaneStrip / PlacedBar / RoutedLink shapes all unchanged. AxisRangePlanner / RowSwimlaneLayout / BarPlacementPass / LinkRouter all unchanged. Phase 23 is purely a wrapper-shell concern.                                                                                                                                                  |

## Open questions for the user — 3 load-bearing decisions

**1. Scroll-sync direction model: A (bidirectional with `scrollingPaneRef`-style guard, matches parity reference verbatim) / B (one-way master-slave: chart owns vertical, sidebar mirrors) / C (passive `translateY` on sidebar content, no actual scroll on sidebar)** — recommended **A**.

- **A (recommended)**: both panes get native scrollbars + native scroll
  feel; either can be dragged by the user; rAF-reset guard prevents
  infinite loops. Matches the parity reference's `scrollingPaneRef`
  idiom verbatim. ~25 LOC composable. Robust under mouse wheel,
  scrollbar drag, and programmatic `scrollTo`.
- **B**: chart-pane is the sole vertical scroll source; sidebar-pane's
  `overflow-y: hidden` + sidebar content gets `transform: translateY(-${chartPane.scrollTop}px)`. Cost: sidebar's scrollbar disappears
  (no native sidebar scroll); user dragging the (non-existent) sidebar
  scrollbar has nothing to grab. Visible regression vs parity reference.
- **C**: both panes' content gets `transform: translateY`; no real scroll
  on either pane. Cost: scrollbars disappear from both sides; visual
  scrollbar-position indicator is lost; multi-pane scroll-into-view
  semantics break.

**Recommendation**: **A**. The bidirectional-sync-with-guard pattern is
proven; the small JS cost (one scroll handler per pane + a single ref
flag) is well worth the visual + UX parity.

**2. Header positioning: A (chart-header SVG inside a sibling `cx-gantt-chart-header-pane` wrapper sitting ABOVE the chart-pane in the grid; `transform: translateX(-${chartPane.scrollLeft}px)` on chart-header-inner — matches parity reference) / B (chart-header inside the chart-pane with `position: sticky; top: 0` — chronix Phase 4.5 model, extended to inside-the-pane) / C (single shared header pane spanning both columns, above both sidebar-pane and chart-pane)** — recommended **A**.

- **A (recommended)**: chart-header lives in grid row 1 as a sibling of
  the chart-pane (grid row 2). `overflow: hidden` on the header pane;
  the inner content wrapper gets a `translateX` update on every chart-pane
  scroll event. Matches parity reference's pattern. Avoids the sticky-
  inside-scroll-pane edge cases (sticky positioning interacts
  unpredictably with `scroll-snap-type` and `scroll-padding`).
- **B**: header lives inside the chart-pane with `position: sticky;
top: 0`. Cost: sticky positioning IS supported, but it interacts
  with scrollbar offset (header may shift by scrollbar-width when
  vertical scroll engages); also conflicts with `:hover`-driven
  scrollbar overlay schemes (Mac trackpad mode).
- **C**: single header spans BOTH columns. Requires the header to know
  the sidebar's current scrollLeft AND the chart's current scrollLeft
  — header would need TWO `translateX` updates internally (one per
  column). More complex; loses the clean "header per pane" mental model.

**Recommendation**: **A**. Matches the parity reference; avoids sticky
edge cases; the `translateX` cost is one style write per scroll event.

**3. Existing-test churn handling: A (update the ~10-12 sticky-style-assertion tests in-place, accept the ~672 vitest count, take the 32-PNG VRT re-baseline hit — recommended) / B (add a `dualScrollport?: boolean` prop defaulting to `false` so existing consumers see no change; old mode + new mode coexist) / C (split into Phase 23a structural refactor + Phase 23b scroll-sync as separate phases)** — recommended **A**.

- **A (recommended)**: clean replacement; no API surface for
  "scrollport mode"; new architecture is the default + only mode.
  Existing tests that asserted on the (now-removed) sticky styles get
  updated to not assert on dead code. 32 PNG re-baseline is the
  4-consecutive-0-VRT-streak break — justified by the genuine
  structural change. Future maintenance is simpler with only one
  scrollport model in the codebase.
- **B**: both modes coexist behind a prop. Cost: doubles the render-
  branch complexity in `<ChronixGantt>`'s template logic; tests must
  cover both branches; documentation grows. Consumers stuck on the old
  mode forever miss out on the unblocked viewport-tracking features.
  Parity-divergence locks in.
- **C**: Phase 23a refactor (no sync, just structure) — visibly broken
  intermediate state (vertical scroll on one pane leaves the other
  behind). Phase 23b sync handler. Cost: 2× phase overhead; visible
  user-broken state between commits 2 and 3 if anyone pulls master
  during the gap.

**Recommendation**: **A**. chronix is pre-1.0; structural cleanup
without flag-gating keeps the codebase honest. The 32-PNG re-baseline
is the documented cost of the genuine architectural change.

Reply **按推荐继续** to accept all three (A / A / A), or call out
any 1-3 to override.
