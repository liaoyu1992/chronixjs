# chronix render+interaction self-inventory (Agent A3)

(Full agent output archived. Key implemented / NOT-implemented items below; cite chronix file:line for spot-check.)

## Section H' — Internal SVG / DOM render branches

### H'.1 Vertical grid separators (time-column lines)

**chronix: NOT IMPLEMENTED** — no `vline|vertical.*line|grid.*line|cell-boundary` matches in `adapters/vue3/src/chronix-gantt.ts` (lines 1-2100). Header band emits `<line class="cx-gantt-tick-line">` per tick (1139-1147); body SVG has NO per-column vertical grid. Bars paint directly on blank background. No CSS class `cx-gantt-cell-vline` is emitted anywhere.

### H'.2 Horizontal grid separators (row-dividing lines)

**chronix: NOT IMPLEMENTED** — no `hline|horizontal.*line|row.*separator` matches. Rows derive y-position from `RowSwimlaneLayout.layout()` (output: `SwimlaneStrip[]` with y+height), but body SVG never emits `<line>` between strips. No CSS class `cx-gantt-row-divider`.

### H'.3 Today line — IMPLEMENTED (Phase 21)

- Body: `<line class="cx-gantt-today-line" data-today-line-side="body">` (chronix-gantt.ts:1619-1635).
- Header: `<line class="cx-gantt-today-line" data-today-line-side="header">` (1222-1234).
- `props.todayLine`: false | true | TodayLineOption.
- Theme: `todayLineColor` + `todayLineTooltipBg`.
- Tooltip: `cx-gantt-today-line-tooltip` group (1241-1271).

### H'.4 Today cell background — IMPLEMENTED (Phase 22.2)

- Body: `<rect class="cx-gantt-today-cell" data-today-cell-side="body">` (1601-1613).
- Header: same with `side="header"` (1204-1216).
- One-day-slot width spanning chart height.
- `props.todayCellBg`: false | true | TodayCellBgOption.
- Theme: `todayCellBgColor` (default `rgba(255, 220, 40, .15)` — k-ui-parity exact match).

### H'.5 / H'.6 / H'.7 Mirror elements — NOT IMPLEMENTED (intentional in-place mutation)

- Drag/resize transactions apply deltaX/Y directly to render geometry (chronix-gantt.ts:1315-1354).
- No ghost/original split; no separate `<rect class="cx-gantt-bar-mirror">`.
- Cross-row snap: snaps to target strip y when `projectedRowId !== sourceRowId` (1330-1342).
- No link-mirror (no link-creation UI at all).

### H'.8 Selection overlay — BASIC, CSS-CONTROLLED

- Selected bars get class `cx-gantt-bar--selected` (1436).
- Custom slots receive `BarSlotArgs.isSelected: boolean` (47 bar-slot.ts).
- NO render-layer overlay rect; consumer CSS or custom slot owns visual.

### H'.9 Popover — NOT IMPLEMENTED

### H'.10 SVG `<defs>` — IMPLEMENTED (link markers only) — Phase 8

- 7 built-in markers: arrow/diamond/diamond-hollow/circle/circle-hollow/pointer/plus.
- Custom markers via `CustomLinkMarker` interface.
- Marker id schema: `cx-marker-{type}-{colorIdEncoded}` (121-123).
- Per-link colorOverride encodes into marker id (256-260 `markerEndUrl`).

### H'.11 Background events — NOT IMPLEMENTED

### H'.12 Non-business-hours fill — NOT IMPLEMENTED

### H'.13 / H'.14 Sticky header + sticky sidebar — IMPLEMENTED (Phase 4.5 + Phase 14)

- Header: `position: sticky; top: 0; zIndex: 2` (1283-1284).
- Sidebar header: sticky both axes, zIndex 3 (1711-1713).
- Sidebar body: sticky-left only, zIndex 1 (1786-1787).
- Divider: sticky both axes, zIndex 4 (1883-1885).

### H'.15 Resize-handle render — IMPLICIT (no separate handle rect)

- Edge zones pure geometric in `pointer-hit-test.ts:105-118 hitZoneInBar`.
- `edgeZoneWidth` default 8px (line 122).
- If `bar.width < 2 × edgeZoneWidth`: center splits.
- NO visible handle graphic (cursor change + drag feedback IS the UX).

### H'.16 Bar progress indicator — IMPLEMENTED (Phase 7)

- Progress fill: `<rect class="cx-gantt-progress-fill">` (1475-1486) — translucent overlay from bar start to progress-x.
- **Progress handle**: `<rect class="cx-gantt-progress-handle">` (1487-1502) — **small square centered vertically on bar at progress-x**. NOT a triangle. NOT below bar.
- Position: `x = renderX + (clamped/100) × renderWidth`; `y = renderY + bar.height/2 - handleSize/2` (1466-1472).
- Theme: progressFill / progressFillOpacity / progressHandleFill / progressHandleStroke / progressHandleStrokeWidth / progressLabel.

### H'.17 Bar text/label — MINIMAL

- Only progress label emitted natively (`<text class="cx-gantt-progress-label">` 1516-1533).
- No automatic bar title rendering — custom slot owns this (BarSlotArgs.sourceBar gives access).

### H'.18 Loading UI — NOT IMPLEMENTED

### H'.19 Event continuation triangles (overflow indicators) — NOT IMPLEMENTED

- NO `cx-gantt-event-continuation-indicator` or `-left` / `-right` polygons.
- NO `isClippedStart` / `isClippedEnd` flag propagation to render.
- Bars that exceed viewport are clipped by wrapper `overflow: auto` without any visual indicator.

## Section I' — Per-view render variations — IMPLEMENTED (Phase 2)

6 views: day (1h slot, 1 header row), week (1d slot, 1 header row, 7 ticks), month (1d slot, 1 header row), season (1d slot, 1 header row 3-month bands), halfYear (6-month bands), year (12-month bands).
Slot width derivation: time-scale floor 52px, date-scale floor 65px.
Weekends filter via `weekendsVisible` (Phase 18).
Locale-aware labels via `Intl.DateTimeFormat`.

## Section J' — Pointer / interaction code

### J'.1 Pointer handlers — IMPLEMENTED (chronix-gantt.ts:988-1076)

- pointerdown / pointermove / pointerup / pointercancel all wired.
- setPointerCapture / releasePointerCapture on bodySvgRef.

### J'.2 Drag-distance gate — DEFERRED (Phase 25)

- Any non-zero deltaX/Y triggers drag. 0-delta aborts.
- No 5px Pythagorean gate (k-ui's `eventDragMinDistance` absent).

### J'.3 Long-press — NOT IMPLEMENTED

### J'.4 Click vs drag — IMPLEMENTED (zero-delta gate, Phase 12)

- `pointer.abort()` if deltaX===0 && deltaY===0.
- `pointer.commit()` otherwise.
- bar-click / empty-area-click emits fire ONLY when `wasDragCommit===false`.

### J'.5 Hit-test surfaces — IMPLEMENTED (`pointer-hit-test.ts:120-174`)

- Hit types: bar-body, bar-edge-start, bar-edge-end, progress-handle, empty-row.
- Progress-handle checked first.
- Bars walked top-down (last wins on overlap).
- Empty-row fallback.

### J'.6 Link interactions — NOT IMPLEMENTED (links are static input)

### J'.7 Drag-to-create-event — IMPLEMENTED (CalendarRangeSelectTransaction, Phase 19)

- begin → advance → commit pattern.
- snapDurationMs snap on commit.
- selectAllow + selectConstraint validation gates.
- 'select' / 'select-rejected' emits.

### J'.8 Keyboard — NOT IMPLEMENTED (Phase 13 deferred)

### J'.9 Modifier keys — PARTIAL (Shift-key only)

- `useGanttSelection.handleBarClick` reads `payload.jsEvent.shiftKey` for toggle vs replace selection.
- No Ctrl/Cmd/Alt handling.

### J'.10 Touch — SUPPORTED (via PointerEvent)

- No touch-specific gestures (long-press, swipe, multi-touch).

### J'.11 External HTML5 drag — NOT IMPLEMENTED

## Section K' — Animations / timers — ALL NOT IMPLEMENTED

- No setInterval / requestAnimationFrame.
- Scroll-sync via Vue reactivity only (no imperative sync).
- No drag-revert animation (instant revert).
- No window-resize listener (consumer responsibility).
- No rerender debounce (Vue reactivity is inherently batched).
- No AutoScroller (no edge-proximity auto-scroll during drag).
- No ScrollResponder (no initial scroll, no scroll queuing).
- No NowTimer (no live "now" updates).
- No print mode.

## Section L' — Per-bar render details

### L'.1 Bar geometry — slot-controlled or default rect

- Default: `<rect class="cx-gantt-bar [cx-gantt-bar--selected]">` (1432-1448).
- Custom: `props.slotRegistry?.get('bar')` template; replaces default entirely.
- BarSlotArgs fields: placedBar, sourceBar, renderX/Y/Width/Height, theme, activeTransaction, isSelected, resolvedBackgroundColor/BorderColor/TextColor.

### L'.2 Color cascade — Phase 20

- Theme defaults → component props → BarSpec.style → callbacks (per-bar last-win).

### L'.5 A11y attributes — MINIMAL

- Default rect has only `data-bar-id`. NO role / aria-label / aria-selected.

### L'.6 Hover state — NOT IMPLEMENTED

- NO `data-event-hover` attribute toggling (k-ui's pattern).
- NO `hoveredBarId` reactive state.
- CSS `:hover` can be applied by consumer but no chronix-side hover class injection.

### L'.10 Per-event class names callback — NOT IMPLEMENTED

- No `barClassNames(args)` or equivalent. Slot registry covers full custom render but no per-bar class callback for default rect.

## Section M' — Per-link render details

### M'.1 Link routing — IMPLEMENTED (Phase 8)

- 'square' (3-segment orthogonal) + 'smooth' (cubic-Bézier forward-only).
- All paths end with `L` to (to.x, to.y) so marker always points right (0°).

### M'.2 Markers — IMPLEMENTED (7 built-in + custom)

### M'.3 LinkSpec.colorOverride — IMPLEMENTED

### M'.4 Callback hooks — NONE

- No `onLine(line)` per-line callback.
- No link-hover, link-click, link-mouseenter emits.
- No link slot in slotRegistry.

### M'.5 Hover/focus on links — NOT IMPLEMENTED

## Section N' — Per-cell / per-row / per-header render

### N'.1 Day-cell CSS classes — MINIMAL (today-cell only)

- `cx-gantt-today-cell` emitted via Phase 22.2.
- NO `cx-gantt-day-past`, `-future`, `-disabled`, `-other`, `-{dayId}`, `-saturday`, `-sunday`, etc.

### N'.2 Header cell — HARDCODED rect+text (no callback, no slot)

- `<rect class="cx-gantt-header-cell">` + `<text class="cx-gantt-header-cell-label">` per cell.
- Fill/stroke/text-color from theme.

### N'.3 Row class names callback — NOT IMPLEMENTED

- Sidebar rows get static `cx-gantt-sidebar-row` + `data-row-id`. No per-row callback.

### N'.4 Resource group rowspan merge — IMPLEMENTED (Phase 5.x)

### N'.5 Sidebar cell — HARDCODED table (no slot, no callback)

## Section O' — Theme — 49 tokens enumerated

Chart, header band, progress, sidebar, links, typography, bar colors (Phase 20), today line/cell (Phase 21/22.2), toolbar (Phase 22). NO grid line tokens, NO selection overlay tokens, NO non-business tokens, NO hover-state tokens.

## Section P' — Audit infrastructure

- Phase design docs: Phases 1-22.2 done + 22.AUTOMATE (catalog CI gate) + Phase 23/24/25 planned.
- PARITY_RECHECK.md disposition register: per-item severity (P0/P1/P2/P3) + disposition (DONE / Planned / Defer-indefinite / Reject).
- SILENT_GAP_SWEEP_2026-05-16.md: 350-item Options-level enumeration (Sections A-G).
- KUI_SURFACE_BASELINE.json: 361 items × 6 surfaces tracked by audit:catalog CI gate.
- scripts/audit-catalog-completeness.mjs: scans 33+ audit files for substring presence of each k-ui item.

---

## chronix Silent Gaps — Consolidated Summary

### Architectural NOT-implemented (intentional / rejected / by-design):

- All-day events (rejected).
- Business-hours fill (rejected).
- Recurring events / async event sources (deferred).
- Drag revert animation (rejected — instant revert).
- Mirror elements (intentional in-place mutation).
- Long-press touch (deferred).
- Keyboard navigation Phase 13 (deferred).
- External HTML5 drag-in (deferred).
- Popover infrastructure (deferred).

### **Silent gaps confirmed by this sweep (no audit row):**

1. **Vertical grid separators** (gantt-grid-vline solid + dashed + week-emphasis variants) — k-ui core; chronix nothing.
2. **Horizontal grid separators** (gantt-grid-hline DPR-snapped row-bottom lines).
3. **Event continuation indicators** (gantt-event-continuation-left/-right polygons for clipped events).
4. **Per-day CSS classes** (gantt-day-{dayId}, -today, -past, -future, -disabled, -other; same for gantt-slot-\* on slot row).
5. **Per-event class callback** (eventClassNames generator).
6. **Per-event style callbacks: font-size + font-weight** (chronix has bg/border/text-color only).
7. **Link onLine callback** + per-link callback hooks generally.
8. **Hover-state injection** (no `data-event-hover` / hoveredBarId state).
9. **A11y attributes on bars** (role, aria-label, aria-selected, tabIndex).
10. **Selection overlay rect or pseudo-elements** (k-ui has visible :after overlay; chronix relies on consumer CSS).
11. **Visible resize-handle dot** when selected (k-ui shows white dot; chronix shows nothing).
12. **Bar text/label auto-render** (k-ui renders title text in `<text class="gantt-event-text">`; chronix only progress label).
13. **AutoScroller** (no edge-proximity auto-scroll during drag).
14. **ScrollResponder** (no programmatic initial scroll honoring `scrollTime`).
15. **Window resize listener** (no `handleWindowResize` / `windowResizeDelay`).
16. **Print mode hooks** (no `_beforeprint` / `_afterprint`).

Plus chronix-known-deferred:

- Drag-distance gate (Phase 25 planned).
- nowIndicator (rejected).
- Keyboard nav (Phase 13 deferred).
