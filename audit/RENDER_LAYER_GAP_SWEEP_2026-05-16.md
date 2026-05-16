# Render / interaction code-layer gap sweep (2026-05-16)

> Companion to `SILENT_GAP_SWEEP_2026-05-16.md`. That sweep enumerated
> Options-level surface (props, callbacks, type args, demo wiring — 350+
> items). This one enumerates code-level surface: internal render branches,
> CSS classes / data-attrs emitted by the render code, interaction
> handlers, animations, timers — every k-ui behavior that exists in the
> code but is not exposed as an Option.
>
> Trigger: 2026-05-16 user-spotted regression — vertical grid lines
> (dashed sub-slot + solid cell-boundary + week-start emphasis), event
> continuation triangles, render callbacks for links / progress / events,
> and progress-triangle position are all part of k-ui's normal demo
> render but completely absent from chronix AND from every audit doc.
> The user's `feedback_no_logic_drift_from_kui` rule fired: silent gaps
> without explicit disposition cause hard-to-detect parity drift.
>
> Methodology: 3 parallel research agents enumerated k-ui render
> (Agent A1), k-ui interaction (Agent A2), and chronix self-inventory
> (Agent A3). Raw outputs archived under `audit/tmp/A{1,2,3}_*.md`.
> This document is the synthesized diff with explicit disposition per
> item.

## Methodology

### Sources

| Surface               | k-ui agent | chronix agent | File coverage                                                                                                                                                                                   |
| --------------------- | ---------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Render code (SVG/DOM) | A1         | A3            | `packages/gantt/src/{resource-timeline,timeline,common,component,styles}/**` (k-ui) vs `adapters/vue3/src/chronix-gantt.ts` + `packages/gantt/src/{api,render,layout,interaction}/**` (chronix) |
| Interaction code      | A2         | A3            | `packages/gantt/src/interaction/**` (k-ui) vs `adapters/vue3/src/use-gantt-*.ts` + `packages/gantt/src/interaction/**` (chronix)                                                                |
| Animation / timing    | A2         | A3            | `NowTimer.ts`, `ScrollResponder.ts`, `dnd/*` (k-ui) — chronix has none                                                                                                                          |
| CSS / theme           | A1         | A3            | `styles/core-css-inline.ts` (k-ui) vs `api/chronix-theme.ts` (chronix)                                                                                                                          |

### 5-way disposition rubric

Same scheme as PARITY_RECHECK.md disposition register:

- **✅ DONE** — already in chronix (with phase ref).
- **🚧 Planned (Phase N)** — assigned to roadmap; phase doc exists or being written.
- **⏸️ Defer-indefinite** — no current plan; revisit on concrete consumer report. Each row names the trigger.
- **❌ Reject** — deliberate chronix divergence; documented and not planned. Each row names rationale.
- **🔴 Silent gap (need disposition)** — confirmed absent from both chronix code and every audit row. Triage decision required.

## Section H — Internal render branches

### H.1 — Vertical grid separators (cell-boundary + sub-slot dashed + week-start emphasis)

| Item                                                               | k-ui                                                                                                | chronix                                                                                                        | Disposition                  | Rationale / trigger                                                                                                                                  |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gantt-grid-vline` (solid 1px rect, cell-boundary)                 | `GanttView.tsx:914-975` `appendVerticalSlotSeparators` boundary branch                              | NOT IMPLEMENTED — `adapters/vue3/src/chronix-gantt.ts` emits only `cx-gantt-tick-line` in header, no body grid | 🔴 → **🚧 Planned Phase 26** | Visible parity gap: k-ui demo screenshots show vertical grid in body across all 6 views; chronix demo shows blank background. Bundle with H.2 + H.3. |
| `gantt-grid-vline-dashed` (`strokeDasharray="2,2"` line, sub-slot) | `GanttView.tsx:976-990` non-boundary branch with `showDashedNonBoundaries=true`                     | NOT IMPLEMENTED                                                                                                | 🔴 → **🚧 Planned Phase 26** | Same bundle. Sub-slot dashed dividers are k-ui's signature; only emitted in body grid (header skips).                                                |
| `gantt-grid-vline-week` (darker fill on week-start)                | `GanttView.tsx:964-974` `isWeekStart` branch with `var(--gantt-border-color, #bbb)` darker fallback | NOT IMPLEMENTED                                                                                                | 🔴 → **🚧 Planned Phase 26** | Week-start emphasis matters for week / month / quarter views. Bundle with above.                                                                     |
| Right-edge closing rect (when `includeRightEdge`)                  | `GanttView.tsx:993-1009` final rect at `actualWidthGeom - 1`                                        | NOT IMPLEMENTED                                                                                                | 🔴 → **🚧 Planned Phase 26** | Bundle.                                                                                                                                              |

### H.2 — Horizontal grid separators (row-bottom DPR-snapped lines)

| Item                                                                                               | k-ui                                                                                      | chronix                                                                                                                                                | Disposition                  | Rationale / trigger                                                                                                     |
| -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `gantt-grid-hline` per row-bottom (1px `<line>`, `vectorEffect="non-scaling-stroke"`, DPR-snapped) | `GanttView.tsx:1062-1108` `renderGridLines` + `snapHorizontalGridLineY` (lines 1034-1057) | NOT IMPLEMENTED — body SVG never emits `<line>` between strips                                                                                         | 🔴 → **🚧 Planned Phase 26** | Bundle with H.1. The DPR-snap algorithm is non-trivial — must be ported correctly per k-ui's recent `563b230` refactor. |
| Header row dividers (inter-row rect at `(r+1)*rowH - 1`)                                           | `GanttView.tsx:563-576` `renderTimelineHeader`                                            | PARTIAL — chronix has axis-divider line at `y=hh` (1162-1173) but only ONE between header-rows + tick-row; no inter-band lines if multiple header rows | 🔴 → **🚧 Planned Phase 26** | Bundle.                                                                                                                 |

### H.3 — Today highlight (per-slot rect during today)

| Item                                                                          | k-ui                                           | chronix                                                                                   | Disposition | Rationale / trigger                                                                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `gantt-today-highlight` (per-slot rect, fillTodaySlotHighlight)               | `GanttView.tsx:950-962`                        | ✅ DONE (Phase 22.2) — `cx-gantt-today-cell` rect spans body + header at 1-day-slot width | ✅ DONE     | k-ui emits ONE rect per today slot (multiple slots if day-view with hourly granularity); chronix emits ONE rect spanning the day. Geometrically equivalent for parity views (week/month/etc); for day-view there's a divergence (chronix shows one tinted day, k-ui tints 24 hourly slots that visually merge). Acceptable v0. |
| `gantt-timeline-header-cell-today` (header-side rect with `#fcf8e3` fallback) | `GanttView.tsx:525-537` `renderTimelineHeader` | ✅ DONE (Phase 22.2) — `cx-gantt-today-cell` with `side="header"`                         | ✅ DONE     |                                                                                                                                                                                                                                                                                                                                |

### H.4 — Mirror elements (drag/resize ghost)

| Item                                                                    | k-ui                                                         | chronix                                                                                          | Disposition                   | Rationale / trigger                                                                                                                                                                                                      |
| ----------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `gantt-event-mirror` (cloned SVG/HTML, position absolute via deltaX/Y)  | `dnd/ElementMirror.ts:14-200`                                | NOT IMPLEMENTED — chronix uses in-place mutation (intentional). Architecture documented Phase 9. | ❌ **Reject** (architectural) | chronix-by-design. In-place mutation is simpler + matches single-source-of-truth render. Revisit only if a feature requires "show old + new position simultaneously". Already in PARITY_RECHECK P2 register as "Reject". |
| Continuation indicators on mirror (`updateTriangleIndicators` ~233-401) | k-ui adjusts triangle indicators dynamically as mirror moves | NOT IMPLEMENTED (chronix has no continuation indicators at all — see H.6)                        | 🔴 → **🚧 Planned Phase 27**  | Folds into Phase 27 (continuation indicators).                                                                                                                                                                           |
| Drag-revert animation (`dragRevertDuration` CSS transition)             | `dnd/ElementMirror.ts:178-193`                               | NOT IMPLEMENTED — instant revert on validation failure                                           | ⏸️ **Defer-indefinite**       | Polish item; instant revert isn't broken UX. Trigger: consumer report of jarring revert.                                                                                                                                 |

### H.5 — Selection visual feedback

| Item                                                                                                | k-ui                                | chronix                                                                                                         | Disposition                  | Rationale / trigger                                                                                                                      |
| --------------------------------------------------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `gantt-event-selection-border` (SVG rounded rect, no-fill, `stroke=rgba(0,0,0,0.3)`, strokeWidth 2) | `TimelineEvent.tsx:659-673`         | NOT IMPLEMENTED — chronix only toggles `cx-gantt-bar--selected` class on default rect; consumer CSS owns visual | 🔴 → **🚧 Planned Phase 28** | k-ui has visible selection outline by default; chronix relies on consumer CSS. Bundle into Phase 28 render-callback/visual-polish phase. |
| `:before` / `:after` pseudo-element overlay (box-shadow + `--gantt-event-selected-overlay-color`)   | `styles/core-css-inline.ts:567-588` | NOT IMPLEMENTED                                                                                                 | 🔴 → **🚧 Planned Phase 28** | Bundle.                                                                                                                                  |
| Selected styling: darker background + box-shadow + visible resize-handle dot                        | `TimelineEvent.tsx:564, 500-541`    | NOT IMPLEMENTED (no visible resize dot, no darker bg on default rect)                                           | 🔴 → **🚧 Planned Phase 28** | Bundle.                                                                                                                                  |

### H.6 — Event continuation indicators (overflow triangles) ⭐ USER-FLAGGED

| Item                                                                                                                       | k-ui                                              | chronix                                                                      | Disposition                                                                 | Rationale / trigger                                                                                                                                              |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gantt-event-continuation-left` polygon (`fill="#000" opacity=0.8 pointerEvents=none`) when `!isStart` OR `isClippedStart` | `TimelineEvent.tsx:412-420` + points calc 313-328 | NOT IMPLEMENTED — no polygon, no flag, no propagation                        | 🔴 → **🚧 Planned Phase 27**                                                | User-flagged 2026-05-16: k-ui demo shows clear left/right black triangles at viewport edges for clipped events; chronix shows nothing. Major visible parity gap. |
| `gantt-event-continuation-right` polygon (mirror, lines 423-431, points calc 330-348)                                      | Same                                              | NOT IMPLEMENTED                                                              | 🔴 → **🚧 Planned Phase 27**                                                | Bundle.                                                                                                                                                          |
| `isStart` / `isEnd` flags (whether event starts/ends within visible range)                                                 | `TimelineEvent.tsx:292-299`                       | NOT IMPLEMENTED — chronix's `PlacedBar` shape has no `isStart`/`isEnd` flags | 🔴 → **🚧 Planned Phase 27**                                                | Bundle. PlacedBar extension required.                                                                                                                            |
| `isClippedStart` / `isClippedEnd` flags (whether event extends past container clip)                                        | `TimelineEvent.tsx:292-299`                       | NOT IMPLEMENTED                                                              | 🔴 → **🚧 Planned Phase 27**                                                | Bundle. Separate from isStart/isEnd.                                                                                                                             |
| Text positioning adjusted to avoid triangle overlap                                                                        | `TimelineEvent.tsx:577-600`                       | N/A — chronix has no default bar text label                                  | ⏸️ **Defer-indefinite** (re-evaluate if Phase 28 adds bar text auto-render) | Bundle decision: if Phase 28 ships bar-text auto-render, fold this into Phase 28's text positioning.                                                             |

### H.7 — Bar text / label auto-render

| Item                                                                                                    | k-ui                                 | chronix                                                                       | Disposition                  | Rationale / trigger                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gantt-event-text` (SVG `<text>` with truncation, font-size, font-weight, textAnchor, dominantBaseline) | `TimelineEvent.tsx:543-656`          | NOT IMPLEMENTED — only progress label renders; bar title requires custom slot | 🔴 → **🚧 Planned Phase 28** | Bar title rendering by default is common-case parity. Bundle with Phase 28 (render polish: selection overlay + bar text + class callbacks + style callbacks). |
| Text truncation via `truncateText` based on available width (subtracting triangle indicators)           | `TimelineEvent.tsx:615-635, 717-730` | N/A                                                                           | 🔴 → **🚧 Planned Phase 28** | Bundle.                                                                                                                                                       |
| Text width thresholds: `showText` only if `finalWidth > 30` AND `availableWidth >= 10`                  | `TimelineEvent.tsx` line 615 area    | N/A                                                                           | 🔴 → **🚧 Planned Phase 28** | Bundle.                                                                                                                                                       |

### H.8 — Progress fill & drag handle ⭐ USER-FLAGGED (position question)

| Item                                                                                                                                                                             | k-ui                                                                             | chronix                                                                                                                            | Disposition                                 | Rationale / trigger                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gantt-event-progress` rect (`fill=progColor, pointerEvents=none`, same x/y/rx/ry as bg)                                                                                         | `TimelineEvent.tsx:397-410`                                                      | ✅ DONE (Phase 7) — `cx-gantt-progress-fill` rect at 1475-1486                                                                     | ✅ DONE                                     | Equivalent.                                                                                                                                                                                                                                                                                                                                         |
| `gantt-event-progress-drag-triangle` (selector referenced in interactions, line 106 EventProgressing) — actual render likely in StandardEvent.tsx or separate triangle below bar | k-ui: triangle BELOW bar (per user screenshot + selector name "drag-triangle")   | chronix: `cx-gantt-progress-handle` is a SMALL SQUARE rect, CENTERED VERTICALLY on bar, at progress-x (1487-1502 chronix-gantt.ts) | 🔴 **Position divergence — needs decision** | k-ui shows a triangle DOWN-pointing BELOW the bar at progress-x (per user screenshot). chronix shows a small SQUARE inside-bar at progress-x. Two questions: (1) shape (triangle vs square)? (2) position (below vs inside)? **Trigger /phase-close-style discussion → Phase 28.1 sub-phase OR catalog as ⏸️ defer-indefinite + Reject-by-design**. |
| Progress label `gantt-event-text` with `textFormat` template (e.g. `{value}% {title}`)                                                                                           | `TimelineEvent.tsx:619-633`                                                      | ✅ DONE (Phase 7) — `cx-gantt-progress-label` at 1516-1533 reads `BarProgress.textFormat`                                          | ✅ DONE                                     |                                                                                                                                                                                                                                                                                                                                                     |
| Progress fill resize-edge collision handling (special at lines 452-495)                                                                                                          | k-ui has special logic to avoid edge-handle overlap when progress is nearly 100% | NOT IMPLEMENTED                                                                                                                    | ⏸️ **Defer-indefinite**                     | Edge case; trigger: consumer reports overlap.                                                                                                                                                                                                                                                                                                       |

### H.9 — Resize-handle render

| Item                                                                                           | k-ui                                          | chronix                                                                                                                    | Disposition                  | Rationale / trigger                                                                          |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------- |
| Transparent edge zones (`gantt-event-resizer-start/end` rects, 8px width, `cursor: ew-resize`) | `TimelineEvent.tsx:437-497`                   | NOT IMPLEMENTED as DOM — chronix has GEOMETRIC edge zones (`pointer-hit-test.ts:105-118`) but no `<rect>` and no CSS class | 🔴 → **🚧 Planned Phase 28** | Bundle with selection overlay (H.5). When emitted, also enables CSS cursor styling per-edge. |
| Visible dot handles when selected (white background, border-radius, 8px)                       | `TimelineEvent.tsx:500-541, 543-551, 662-675` | NOT IMPLEMENTED                                                                                                            | 🔴 → **🚧 Planned Phase 28** | Bundle.                                                                                      |

### H.10 — Popover infrastructure

| Item                                                                       | k-ui                           | chronix         | Disposition             | Rationale / trigger                                                                                  |
| -------------------------------------------------------------------------- | ------------------------------ | --------------- | ----------------------- | ---------------------------------------------------------------------------------------------------- |
| `gantt-popover` (Portal-rendered, z-index 9999, box-shadow, theme classes) | `common/Popover.tsx:22-128`    | NOT IMPLEMENTED | ⏸️ **Defer-indefinite** | Already in PARITY_RECHECK as "Event truncation + popover infrastructure" cluster (defer-indefinite). |
| `gantt-popover-header`, `-title`, `-body`, `-close`                        | Same                           | NOT IMPLEMENTED | ⏸️ **Defer-indefinite** | Bundle.                                                                                              |
| `MorePopover` (more-link day cell popover)                                 | `common/MorePopover.tsx:26-61` | NOT IMPLEMENTED | ⏸️ **Defer-indefinite** | Bundle.                                                                                              |

### H.11 — SVG `<defs>` block contents

| Item                                                      | k-ui                              | chronix                                                                                                                                    | Disposition             | Rationale / trigger                                                                           |
| --------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------- | --------------------------------------------------------------------------------------------- |
| `clipPath` per header cell (text clipping to cell bounds) | `GanttView.tsx:493-514`           | NOT IMPLEMENTED — chronix relies on `<rect>` clip + text overflow                                                                          | ⏸️ **Defer-indefinite** | Trigger: header text overflows visually (likely if labels are too long; user not reported).   |
| `pattern` for dashed-dot today-line                       | `GanttView.tsx:1204-1223`         | NOT IMPLEMENTED — chronix uses CSS `stroke-dasharray` for today-line styles `'solid'`/`'dashed'`/`'dotted'`. `'dashed-dot'` not supported. | ⏸️ **Defer-indefinite** | Trigger: consumer requests dashed-dot today-line style.                                       |
| Link markers (`<marker>` defs per type × color)           | k-ui has 8 marker types + customs | ✅ DONE (Phase 8) — 7 built-in + `CustomLinkMarker`                                                                                        | ✅ DONE                 | One marker type difference (k-ui's `'pointer'` vs chronix's mapping — verify in Phase 8 doc). |

### H.12 — Background events + non-business hours

| Item                                  | k-ui                                                                | chronix         | Disposition             | Rationale / trigger                                                         |
| ------------------------------------- | ------------------------------------------------------------------- | --------------- | ----------------------- | --------------------------------------------------------------------------- |
| `gantt-bg-event` rect                 | `timeline/TimelineContent.tsx:195-211` + `TimelineLane.tsx:179-206` | NOT IMPLEMENTED | ⏸️ **Defer-indefinite** | Already in SILENT_GAP_SWEEP cluster "Background events" (defer-indefinite). |
| `gantt-non-business` CSS class + fill | `styles/core-css-inline.ts:484-486`                                 | NOT IMPLEMENTED | ⏸️ **Defer-indefinite** | Already in PARITY_RECHECK "businessHours" cluster (defer-indefinite).       |

### H.13 — Sticky elements

| Item                                           | k-ui                                                                    | chronix                                                                               | Disposition | Rationale / trigger                                                        |
| ---------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------- |
| `position: sticky` on header / sidebar / cells | k-ui via CSS class `.gantt-sticky` + `.gantt-scrollgrid-section-sticky` | ✅ DONE (Phase 4.5, Phase 9, Phase 14) — chronix uses inline `position: sticky` style | ✅ DONE     | Equivalent behavior; CSS-class-vs-inline is a P2 architectural divergence. |

### H.14 — Loading UI

| Item                                        | k-ui                                                            | chronix         | Disposition             | Rationale / trigger                                     |
| ------------------------------------------- | --------------------------------------------------------------- | --------------- | ----------------------- | ------------------------------------------------------- |
| Loading spinner / skeleton / `loading` emit | k-ui has no explicit loading UI in render; emit + reducer state | NOT IMPLEMENTED | ⏸️ **Defer-indefinite** | Already in SILENT_GAP_SWEEP cluster (defer-indefinite). |

## Section I — Per-view render variations

| Item                                                                                                                                | k-ui                                   | chronix                                                                                                | Disposition                  | Rationale / trigger                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------- | ----------------------------------------------------------------------------------- |
| Day view: 1 header row + hourly slots                                                                                               | `tDateProfile.slotDuration` hourly     | ✅ DONE (Phase 2/6)                                                                                    | ✅ DONE                      |                                                                                     |
| Week view: 2 header rows + day slots + week-start emphasis                                                                          | `cellRows.length=2` + `isWeekStarts[]` | PARTIAL — chronix has week view but no week-start emphasis on grid (depends on H.1 vline-week landing) | 🔴 → **🚧 Planned Phase 26** | Bundle into Phase 26 grid lines (week-start emphasis is part of vline-week branch). |
| Month view: 2-3 header rows + daily slots + `gantt-day-other` for non-current-month                                                 | `date-rendering.ts:52`                 | PARTIAL — chronix has month view but no `cx-gantt-day-other` class on out-of-month days                | 🔴 → **🚧 Planned Phase 29** | Folds into new Phase 29 (per-day CSS class system).                                 |
| Per-view CSS classes: `gantt-day-{dayId}`, `gantt-day-today`, `-past`, `-future`, `-disabled`, `-other`, `gantt-slot-*` equivalents | `date-rendering.ts:33-81`              | NOT IMPLEMENTED — chronix has only `cx-gantt-today-cell` (Phase 22.2)                                  | 🔴 → **🚧 Planned Phase 29** | New phase for per-day/per-slot CSS class taxonomy.                                  |
| Week-number column (`WeekNumberContainer` + `weekNumberContent` callback)                                                           | `common/WeekNumberContainer.tsx:23-53` | NOT IMPLEMENTED                                                                                        | ⏸️ **Defer-indefinite**      | Already in SILENT_GAP_SWEEP cluster "Week-numbers column" (defer-indefinite).       |

## Section J — Pointer / interaction code

### J.1 — Pointer handlers

All 4 pointer events wired in both: ✅ DONE for both sides.

### J.2 — Drag-distance gate

| Item                                     | k-ui                                       | chronix                                           | Disposition             | Rationale / trigger |
| ---------------------------------------- | ------------------------------------------ | ------------------------------------------------- | ----------------------- | ------------------- |
| 5px Pythagorean gate (mouse) / 0 (touch) | `dnd/FeaturefulElementDragging.ts:101-125` | NOT IMPLEMENTED — chronix uses 0-delta abort only | 🚧 **Planned Phase 25** | Already on roadmap. |

### J.3 — Long-press

| Item                                                                           | k-ui                             | chronix         | Disposition             | Rationale / trigger                                                                       |
| ------------------------------------------------------------------------------ | -------------------------------- | --------------- | ----------------------- | ----------------------------------------------------------------------------------------- |
| `longPressDelay` / `eventLongPressDelay` / `selectLongPressDelay` (touch only) | `EventDragging.ts:687-693`, etc. | NOT IMPLEMENTED | ⏸️ **Defer-indefinite** | Already in SILENT_GAP_SWEEP cluster "Touch interactions (long-press)" (defer-indefinite). |

### J.4 — Click-vs-drag

Both have it (chronix uses 0-delta gate; k-ui uses isHitsEqual + initialTarget tracking). ✅ DONE for both.

### J.5 — Hit-test

Both have hit-test. chronix's covers bar-body / bar-edge-start / bar-edge-end / progress-handle / empty-row; k-ui's covers same surfaces via different selectors. ✅ DONE.

### J.6 — Link interactions

| Item                             | k-ui                                            | chronix         | Disposition             | Rationale / trigger                                                                                      |
| -------------------------------- | ----------------------------------------------- | --------------- | ----------------------- | -------------------------------------------------------------------------------------------------------- |
| Drag-to-create dependency line   | k-ui has it (interaction layer + visual mirror) | NOT IMPLEMENTED | ⏸️ **Defer-indefinite** | Major scope. Already implicit-deferred. Trigger: consumer asks for link-creation UI. Catalog explicitly. |
| Link hover / click handler emits | k-ui has it (link is interactive element)       | NOT IMPLEMENTED | ⏸️ **Defer-indefinite** | Same trigger.                                                                                            |

### J.7 — Drag-to-create event

Both have it. chronix: `CalendarRangeSelectTransaction` (Phase 19). k-ui: `DateSelecting.handleHitUpdate`. ✅ DONE.

### J.8 — Keyboard

| Item                                          | k-ui                       | chronix         | Disposition                                            | Rationale / trigger                                   |
| --------------------------------------------- | -------------------------- | --------------- | ------------------------------------------------------ | ----------------------------------------------------- |
| `createAriaKeyboardAttrs` Enter/Space trigger | `util/dom-event.ts:99-109` | NOT IMPLEMENTED | 🚧 **Phase 13 deferred** (per PARITY_RECHECK register) | Stays deferred.                                       |
| Arrow keys, Escape, Delete handlers           | k-ui has none in code path | NOT IMPLEMENTED | ❌ **Reject**                                          | Neither k-ui nor chronix implements. Skip cataloging. |

### J.9 — Modifier keys

| Item                                                  | k-ui                                                           | chronix                                                            | Disposition                    | Rationale / trigger                                                                             |
| ----------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------ | ----------------------------------------------------------------------------------------------- |
| `isPrimaryMouseButton` (button===0 && !ctrlKey) check | k-ui has it in `PointerDragging.ts:349`                        | NOT EXPLICITLY CHECKED — chronix uses `e.button===0` only          | 🔴 → **⏸️ Defer-indefinite**   | Minor: chronix accepts ctrl+click. Trigger: consumer reports right-click being treated as drag. |
| Shift-click toggle selection                          | k-ui does NOT have shift (uses ctrl/cmd) — already P2 register | ✅ DONE (chronix uses shift per Phase 12 — intentional divergence) | ❌ Reject (already documented) | Already in P2 register.                                                                         |

### J.10 — Touch

Both support via PointerEvent. Long-press + multi-touch + swipe NOT in either side. ✅ DONE for basics.

### J.11 — External HTML5 drag

Already in PARITY_RECHECK cluster "External HTML5 drag-in/drag-out" (defer-indefinite).

### J.12 — Hover detection ⭐ USER-FLAGGED implication

| Item                                                                | k-ui                                  | chronix                                                                    | Disposition                  | Rationale / trigger                                                                                                      |
| ------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `EventHovering` class + `eventMouseEnter` / `eventMouseLeave` emits | `interactions/EventHovering.ts:18-74` | NOT IMPLEMENTED — chronix has no hover emits                               | 🔴 → **⏸️ Defer-indefinite** | Already in SILENT_GAP_SWEEP cluster "Hover / mouse callbacks" (defer-indefinite). Re-confirm.                            |
| `data-event-hover` attribute toggle on mouseenter/leave             | `TimelineEvent.tsx:358-371`           | NOT IMPLEMENTED — chronix has no hover attribute                           | 🔴 → **⏸️ Defer-indefinite** | Trigger: consumer asks for chronix-side hover CSS class injection. (CSS `:hover` works in both regardless of attribute.) |
| Cursor change on bar body hover                                     | `TimelineEvent.tsx:116-119`           | NOT IMPLEMENTED — chronix's default rect uses no cursor; consumer CSS owns | ⏸️ **Defer-indefinite**      | Trigger: consumer asks for move-cursor on draggable bars.                                                                |

## Section J.6 — Validation pathway divergence

| Item                                                                                                  | k-ui        | chronix                                                           | Disposition                  | Rationale / trigger                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Validation timing: constraint + overlap during drag (visual feedback) + at commit                     | k-ui: both  | chronix: at commit only (Phase 19) — per `useGanttPointer.commit` | 🔴 → **⏸️ Defer-indefinite** | chronix delivers commit-time validation. During-drag visual feedback (color change, cursor change) on rejection requires additional reactive state. Trigger: consumer reports rejection without visual cue. |
| `disableCursor()` / `enableCursor()` (CSS class on body changes cursor to "not-allowed") on rejection | k-ui has it | NOT IMPLEMENTED                                                   | 🔴 → **⏸️ Defer-indefinite** | Bundle with above.                                                                                                                                                                                          |

## Section J.7 — Resize semantics

| Item                                                         | k-ui                                                    | chronix                                                         | Disposition                                         | Rationale / trigger     |
| ------------------------------------------------------------ | ------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------- | ----------------------- |
| Cross-over rejection (resize start past end → null mutation) | `EventResizing.ts:302-318`                              | chronix ALLOWS cross-over by default (caller-policy delegation) | ❌ **Reject** (P1 register — chronix-architectural) | Already in P1 register. |
| Minimum bar duration                                         | NOT enforced (constraint-based)                         | NOT enforced                                                    | ✅ Both same                                        |                         |
| Snap-to-tick                                                 | NOT in interaction layer (component's queryHit owns it) | chronix: `snapDurationMs` prop in pointer composable            | ✅ chronix more explicit                            |                         |

## Section K — Animations / timers

### K.1 — NowTimer

| Item                                                | k-ui                  | chronix         | Disposition                                                                 | Rationale / trigger                                                       |
| --------------------------------------------------- | --------------------- | --------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| setInterval cadence (1-min / 5-min / unit-boundary) | `NowTimer.ts:53-88`   | NOT IMPLEMENTED | ❌ **Reject** (PARITY_RECHECK nowIndicator P0 register — Phase 21 decision) | Already documented. Static todayLine alone covers visible default parity. |
| Tab-visibility pause + refresh                      | `NowTimer.ts:121-125` | N/A (no timer)  | ❌ Reject (bundle)                                                          |                                                                           |

### K.2 — Drag-revert animation

Covered in H.4 above (⏸️ Defer-indefinite).

### K.3 — Continuation indicator animation

N/A until Phase 27 lands.

### K.4 — Window resize

| Item                                                | k-ui        | chronix                                                                  | Disposition             | Rationale / trigger                                                              |
| --------------------------------------------------- | ----------- | ------------------------------------------------------------------------ | ----------------------- | -------------------------------------------------------------------------------- |
| `handleWindowResize` + `windowResizeDelay` listener | k-ui has it | NOT IMPLEMENTED — chronix relies on Vue reactivity from parent container | ⏸️ **Defer-indefinite** | Already in SILENT_GAP_SWEEP cluster "Window resize handling" (defer-indefinite). |

### K.5 — Rerender debounce

| Item                     | k-ui        | chronix                                             | Disposition                   | Rationale / trigger                 |
| ------------------------ | ----------- | --------------------------------------------------- | ----------------------------- | ----------------------------------- |
| `rerenderDelay` debounce | k-ui has it | NOT IMPLEMENTED — Vue reactivity batches inherently | ❌ **Reject** (architectural) | Vue's reactivity model covers this. |

### K.6 — Print mode

| Item                                     | k-ui        | chronix         | Disposition             | Rationale / trigger                                                                                              |
| ---------------------------------------- | ----------- | --------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `_beforeprint` / `_afterprint` listeners | k-ui has it | NOT IMPLEMENTED | ⏸️ **Defer-indefinite** | Already in SILENT*GAP_SWEEP cluster "Network + lifecycle internals" (reject as `*\*`-prefixed internal). Bundle. |

### K.7 — AutoScroller (edge-proximity auto-scroll during drag)

| Item                                                                                   | k-ui        | chronix                                                                       | Disposition                  | Rationale / trigger                                                                                                                                                     |
| -------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AutoScroller` (edgeThreshold 50px, maxVelocity 300px/sec, requestAnimationFrame loop) | k-ui has it | NOT IMPLEMENTED — chronix does not auto-scroll during drag near viewport edge | 🔴 → **⏸️ Defer-indefinite** | UX gap for long-bar drags but not blocking. Trigger: consumer reports needing to manually scroll during long drags. **NEW DISPOSITION ROW REQUIRED** in PARITY_RECHECK. |
| Direction flags (`everMovedUp/Down/Left/Right`) prevent initial near-edge              | k-ui has it | N/A                                                                           | Bundle                       |                                                                                                                                                                         |

### K.8 — ScrollResponder

| Item                                                                | k-ui                       | chronix                                                                                 | Disposition                  | Rationale / trigger                                                                       |
| ------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------- |
| `fireInitialScroll` honoring `scrollTime` on mount + on date change | `ScrollResponder.ts:37-41` | NOT IMPLEMENTED — chronix only has scroll handle (Phase 24 `scrollToDate` programmatic) | 🔴 → **⏸️ Defer-indefinite** | Already in SILENT_GAP_SWEEP cluster "Initial-scroll cluster" (defer-indefinite). Confirm. |
| Scroll-request queuing + drain                                      | Same                       | NOT IMPLEMENTED                                                                         | ⏸️ Bundle                    |                                                                                           |

### K.9 — Performance optimizations

| Item                                                                 | k-ui                                      | chronix                                                               | Disposition                  | Rationale / trigger                                                                                              |
| -------------------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| OffsetTracker caching (cached element rect + parent-scroll tracking) | k-ui has it                               | NOT IMPLEMENTED — chronix recomputes per pointermove                  | 🔴 → **⏸️ Defer-indefinite** | Trigger: profiling shows pointermove is slow with many bars / nested scroll containers. **NEW DISPOSITION ROW**. |
| HitDragging cache (per-droppable OffsetTracker)                      | Same                                      | N/A (no droppables)                                                   | Bundle                       |                                                                                                                  |
| Progress drag throttling (0.5% gate or 16ms setTimeout)              | `EventProgressing.handleDragMove:168-293` | NOT IMPLEMENTED — chronix fires progress updates on every pointermove | 🔴 → **⏸️ Defer-indefinite** | Trigger: profiling shows progress drag is bottleneck. **NEW DISPOSITION ROW**.                                   |

## Section L — Per-bar render details

### L.1 — Bar geometry

Both have it; chronix via slotRegistry. ✅ DONE.

### L.2 — Border / fill defaults

Both have it. chronix via Phase 20 color cascade. ✅ DONE.

### L.3 — A11y attributes ⭐ Render-layer silent gap

| Item                                                    | k-ui                                      | chronix                                                                 | Disposition                                                  | Rationale / trigger                                              |
| ------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------- |
| `tabIndex=0` on event group                             | k-ui has it (referenced in StandardEvent) | NOT IMPLEMENTED                                                         | ❌ **Reject** (P1 register — Phase 13 keyboard nav deferred) | Already documented. Won't add tabIndex without keyboard model.   |
| `role="button"` / `aria-selected` / `aria-label` on bar | k-ui has it                               | NOT IMPLEMENTED — chronix has only `data-bar-id`                        | 🔴 → **⏸️ Defer-indefinite**                                 | a11y story expands when Phase 13 unblocks. Bundle with Phase 13. |
| `data-event-id` / `data-instance-id`                    | k-ui has both                             | chronix has `data-bar-id` only (no instance — chronix has no recurring) | ✅ DONE (chronix-equivalent)                                 |                                                                  |

### L.4 — Per-event class callback ⭐ USER-FLAGGED (item 4 of 4)

| Item                                                       | k-ui                         | chronix         | Disposition                  | Rationale / trigger                             |
| ---------------------------------------------------------- | ---------------------------- | --------------- | ---------------------------- | ----------------------------------------------- |
| `eventClassNames` callback (returns class array per event) | `EventContainer.tsx:120-124` | NOT IMPLEMENTED | 🔴 → **🚧 Planned Phase 28** | Bundle into Phase 28 render-callback expansion. |

### L.5 — Per-event style callbacks ⭐ USER-FLAGGED (item 4 of 4)

| Item                            | k-ui                       | chronix                                         | Disposition                  | Rationale / trigger |
| ------------------------------- | -------------------------- | ----------------------------------------------- | ---------------------------- | ------------------- |
| `eventBackgroundColor` callback | `EventContainer.tsx:68-70` | ✅ DONE (Phase 20 `barBackgroundColorCallback`) | ✅ DONE                      |                     |
| `eventBorderColor` callback     | `EventContainer.tsx:72-75` | ✅ DONE (Phase 20 `barBorderColorCallback`)     | ✅ DONE                      |                     |
| `eventTextColor` callback       | `EventContainer.tsx:89-91` | ✅ DONE (Phase 20 `barTextColorCallback`)       | ✅ DONE                      |                     |
| `eventFontSize` callback        | `EventContainer.tsx:94-96` | NOT IMPLEMENTED                                 | 🔴 → **🚧 Planned Phase 28** | Bundle.             |
| `eventFontWeight` callback      | `EventContainer.tsx:97-99` | NOT IMPLEMENTED                                 | 🔴 → **🚧 Planned Phase 28** | Bundle.             |

## Section M — Per-link render details

### M.1 — Link routing

Both have square + smooth. ✅ DONE.

### M.2 — Marker variants

Both have 7+ types + custom. ✅ DONE.

### M.3 — Per-link color override

Both have it (`LinkSpec.colorOverride`). ✅ DONE.

### M.4 — onLine callback ⭐ USER-FLAGGED (item 4 of 4)

| Item                                                                                  | k-ui                                        | chronix                                                            | Disposition                  | Rationale / trigger                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onLine(line)` callback for per-line type / markerType / extraVerticalOffset mutation | `DependencyLineAlgorithm.ts:73-76, 143-151` | NOT IMPLEMENTED — chronix has only static `LinkSpec.colorOverride` | 🔴 → **🚧 Planned Phase 28** | Bundle into Phase 28. Already in PARITY_RECHECK P0 register "dependencyLineColor / useLineEventColor / onLine callback" — current disposition was "Defer-indefinite". Upgrade to **Planned Phase 28**. |
| `useLineEventColor: boolean` (line color from source event vs. default)               | Same                                        | NOT IMPLEMENTED                                                    | 🔴 → **🚧 Planned Phase 28** | Bundle.                                                                                                                                                                                                |

### M.5 — Link hover/click handlers

Both have none / consumer CSS. ⏸️ Defer-indefinite.

### M.6 — Link slot (chronix-additive)

| Item                                                  | k-ui                    | chronix                                                    | Disposition                                            | Rationale / trigger                                                                                                |
| ----------------------------------------------------- | ----------------------- | ---------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Full link render replacement via slotRegistry('link') | k-ui has no slot system | NOT IMPLEMENTED in chronix either (only 'bar' slot exists) | 🔴 → **🚧 Planned Phase 28** (chronix-additive bundle) | If we're adding `onLine` callback, also worth exposing link slot for full custom render. Decision in Phase 28 doc. |

## Section N — Per-cell / per-row / per-header

### N.1 — Day-cell CSS classes

Covered in Section I (Phase 29).

### N.2 — Header cell render

| Item                                                                            | k-ui                             | chronix                                                        | Disposition                  | Rationale / trigger                   |
| ------------------------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------------- | ---------------------------- | ------------------------------------- |
| TableDateCell with `dayHeaderFormat`, navLink, callback content                 | `common/TableDateCell.tsx:29-89` | PARTIAL — chronix has hardcoded rect+text; no slot or callback | 🔴 → **🚧 Planned Phase 29** | Bundle with per-day CSS class system. |
| Header `<text>` with `clipPath` + bold first-row + truncation tooltip `<title>` | `GanttView.tsx:578-615`          | PARTIAL — chronix has text but no clip + no tooltip            | 🔴 → **🚧 Planned Phase 29** | Bundle.                               |

### N.3 — Row class names callback

NOT IMPLEMENTED on both sides — consumer-side. ⏸️ Defer-indefinite (rare ask).

### N.4 — Resource group rowspan

Both have it. ✅ DONE.

### N.5 — Sidebar cell render

Both have it (chronix table-based, k-ui table-based). ✅ DONE.

### N.6 — More-link popover trigger

Covered in H.10 (defer-indefinite).

## Section O — CSS / theme surface

### O.1 — CSS variables

| Item                                                                         | k-ui                                     | chronix                                                            | Disposition                                                        | Rationale / trigger                                                                                                                    |
| ---------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `--gantt-border-color` umbrella                                              | k-ui has it                              | PARTIAL — chronix has per-region tokens (Phase 10) but no umbrella | ✅ DONE (Phase 10 backfill in PARITY_RECHECK uncataloged-but-done) |                                                                                                                                        |
| `--gantt-grid-row-rule-color` (overrides border-color for h-lines)           | k-ui has it                              | NOT IMPLEMENTED                                                    | 🔴 → **🚧 Planned Phase 26**                                       | Bundle with grid lines phase. Theme tokens: `gridLineColor`, `gridLineWeekStartColor`, `gridLineSubSlotColor`, `gridLineRowRuleColor`. |
| `--gantt-event-selected-overlay-color`                                       | k-ui has it (default `rgba(0,0,0,0.25)`) | NOT IMPLEMENTED — chronix has only class                           | 🔴 → **🚧 Planned Phase 28**                                       | Bundle with selection overlay (H.5).                                                                                                   |
| `--gantt-event-resizer-thickness` / `-dot-total-width` / `-dot-border-width` | k-ui has all 3                           | NOT IMPLEMENTED                                                    | 🔴 → **🚧 Planned Phase 28**                                       | Bundle with resize-handle render (H.9).                                                                                                |
| `--gantt-non-business-color`                                                 | k-ui has it                              | NOT IMPLEMENTED                                                    | ⏸️ Defer-indefinite (bundle with non-business)                     |                                                                                                                                        |
| `--gantt-bg-event-color` / `-opacity`                                        | k-ui has them                            | NOT IMPLEMENTED                                                    | ⏸️ Defer-indefinite (bundle with bg-events)                        |                                                                                                                                        |
| `--gantt-highlight-color` (date selection highlight)                         | k-ui has it                              | NOT IMPLEMENTED — chronix has no select-rect visual                | 🔴 → **⏸️ Defer-indefinite**                                       | Trigger: consumer asks for selection visual feedback during drag. **NEW DISPOSITION ROW**.                                             |
| `--gantt-now-indicator-color`                                                | k-ui has it                              | ❌ Reject (nowIndicator rejected)                                  | ❌ Bundle                                                          |                                                                                                                                        |

### O.2 — Animation / transitions

- k-ui: only mirror-revert + popover repositioning.
- chronix: none.
- Disposition: ⏸️ Defer-indefinite (matches H.4 defer). No new phase.

### O.3 — No media queries / print styles on either side. ✅ Both same.

---

## Summary — New disposition rows requiring backfill into PARITY_RECHECK.md

Total **new silent gaps confirmed by this sweep**: **18 distinct items** spanning 7 cluster phases.

### Cluster A — Grid lines (🚧 Planned Phase 26)

- H.1 vertical separators (4 sub-items)
- H.2 horizontal separators (2 sub-items)
- Week-start emphasis (folds into H.1)
- Theme tokens (gridLineColor + 3 more)

**Estimated scope**: ~8-10h, ~600 LOC. Single-session phase.

### Cluster B — Event continuation indicators (🚧 Planned Phase 27) ⭐ USER-FLAGGED

- H.6 left/right polygons (4 sub-items)
- isStart/isEnd/isClippedStart/isClippedEnd flag propagation
- Mirror continuation indicator animation (bundles with mirror — N/A since chronix is in-place)

**Estimated scope**: ~6-8h, ~400 LOC. Single-session phase.

### Cluster C — Bar render polish (🚧 Planned Phase 28) ⭐ USER-FLAGGED (item 4)

- H.5 selection overlay (3 sub-items: SVG border rect + pseudo-element overlay + visible resize dot)
- H.7 bar text auto-render (3 sub-items: SVG text + truncation + width thresholds)
- H.9 resize handle DOM emission (transparent zones + visible dot)
- L.4 `eventClassNames` callback
- L.5 `eventFontSize` + `eventFontWeight` callbacks
- M.4 `onLine` callback + `useLineEventColor`
- M.6 link slot in slotRegistry
- Theme tokens: `eventSelectedOverlayColor`, `eventResizerThickness`, `eventResizerDotTotalWidth`, `eventResizerDotBorderWidth`

**Estimated scope**: ~12-15h, ~900 LOC. **Likely splits into Phase 28.1 (selection overlay + resize handle) + Phase 28.2 (text + render callbacks)** to keep single-session discipline.

### Cluster D — Per-day CSS class system (🚧 Planned Phase 29)

- I.5 + N.1 — `cx-gantt-day-{dayId}` / `-today` / `-past` / `-future` / `-disabled` / `-other`, equivalents for slot row
- N.2 header cell slot / callback

**Estimated scope**: ~5-7h, ~400 LOC. Single-session phase.

### Cluster E — Progress handle position divergence (decision needed) ⭐ USER-FLAGGED (item 3)

- H.8 — k-ui triangle BELOW bar vs chronix square INSIDE bar
- **Requires user decision**: port to k-ui geometry (triangle, below) OR keep chronix geometry (square, inside) as documented divergence?
- If port → Phase 28.3 (small, ~3h, ~150 LOC)
- If keep → add Reject disposition row to PARITY_RECHECK with rationale

### Cluster F — Defer-indefinite additions (catalog only, no phase)

- J.2 long-press (already in cluster)
- J.12 hover detection (already in cluster)
- J.6 link interactions (already implicit, add explicit row)
- J.6 validation visual feedback (during-drag color + cursor)
- J.9 modifier keys (`isPrimaryMouseButton`)
- K.7 AutoScroller
- K.9 OffsetTracker caching + progress throttling
- O.1 `--gantt-highlight-color` for select-rect
- L.3 a11y attributes (bundle with Phase 13)

These add ~9 new disposition rows to PARITY_RECHECK with explicit triggers.

### Cluster G — Already-rejected / already-deferred (verify in register, no action)

- H.4 mirror (Reject — chronix-architectural)
- K.1 NowTimer (Reject — Phase 21 decision)
- K.4 windowResize (defer-indefinite — already)
- K.5 rerenderDelay (Reject — Vue reactivity)
- K.6 print mode (Reject — k-ui-internal)
- H.10/12 popover/bg-events/non-business (defer-indefinite — already)

---

## Roadmap implication

**Before** this sweep: roadmap had Phase 23 (sidebar dual-scrollport), Phase 24 (imperative handle), Phase 25 (drag-distance gate) as remaining demo-parity phases.

**After** this sweep: add **4 new phases (26-29)** to close render-layer silent gaps:

| New phase      | Title                                                                                                                                               | Est. h | Single-session? |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------------- |
| **Phase 26**   | Grid lines (vertical cell-boundary + sub-slot dashed + week-start + horizontal row-bottom + theme)                                                  | 8-10   | Yes             |
| **Phase 27**   | Event continuation indicators (overflow triangles + isStart/isEnd/isClippedStart/isClippedEnd flags)                                                | 6-8    | Yes             |
| **Phase 28.1** | Selection overlay + visible resize handle (SVG border rect + pseudo-overlay + dot when selected + theme tokens)                                     | 6-7    | Yes             |
| **Phase 28.2** | Bar text auto-render + render-callback expansion (auto title text + truncation + `eventClassNames` + `eventFontSize/Weight` + `onLine` + link slot) | 8-10   | Likely yes      |
| **Phase 29**   | Per-day / per-slot CSS class system + header cell slot/callback                                                                                     | 5-7    | Yes             |

**Plus Phase 28.3 conditional**: progress triangle position (only if user wants port to k-ui geometry, +3h).

**Total new scope**: ~33-42 hours across 4-5 phases. Roughly doubles the remaining roadmap (current: 23+24+25 ≈ 18h; new: 23+24+25+26+27+28.1+28.2+29 ≈ 51-60h).

**Discipline implication**: per `feedback_chronix_parity_discipline.md`, each new phase needs its own design doc + parity assertion + /phase-close before DONE. Per `feedback_quality_acceleration.md`, each runs single-session no-batch.

---

## Status of Phase 24 (imperative handle API)

Phase 24 is currently mid-implementation (Commit 2 `d99c51f` landed — core handle interface + applyIncrement). The adapter implementation (Commit 3) is **blocked pending this sweep's resolution**.

**Recommendation**: Phase 24 is **orthogonal to the new render-layer phases** (it's about imperative methods, not render code). Finishing Phase 24 first does not introduce any drift from k-ui because the handle methods compute-and-emit through `update:axisInput` (Phase 22 channel) — they don't render anything new. Phase 24 completion then enables the demo-test-button pattern that Phases 26-29 can reuse for their parity assertions.

**Suggested sequence**:

1. **Resume Phase 24** (3 commits left: adapter + demo+parity + wrap-up) — ~6h
2. **Backfill PARITY_RECHECK + KUI_SURFACE_BASELINE** with this sweep's disposition rows — ~2h
3. **Phase 26** grid lines (highest-visibility user-flagged) — ~8-10h
4. **Phase 27** continuation triangles (second user-flagged) — ~6-8h
5. **Phase 28.1 + 28.2** render polish — ~14-17h
6. **Phase 29** CSS class system — ~5-7h
7. Continue original roadmap: Phase 23 (dual-scrollport), Phase 25 (drag-distance) — ~16h

Total remaining roadmap: ~57-66 hours across 7-8 phases.

User decides ordering. The 3 critical user-flagged items (grid lines, overflow triangles, render callbacks) all land in Phases 26, 27, 28.

---

## Sources (raw agent outputs)

- `audit/tmp/A1_kui_render_enumeration.md` — k-ui render-layer enumeration (A1 output)
- `audit/tmp/A2_kui_interaction_enumeration.md` — k-ui interaction+animation enumeration (A2 output)
- `audit/tmp/A3_chronix_self_inventory.md` — chronix self-inventory (A3 output)

These archived under `audit/tmp/` for reference; safe to delete after PARITY_RECHECK backfill commits.
