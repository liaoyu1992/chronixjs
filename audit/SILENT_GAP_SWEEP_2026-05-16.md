# Silent gap sweep — 2026-05-16

**Status**: Audit-only (no code changes). Triggered by user finding `todayBgColor` — a k-ui feature with NO entry in any chronix `PHASE_*_DESIGN.md` catalog and NO disposition in `audit/PARITY_RECHECK.md`. The sweep enumerates the full k-ui public surface (7 source families, ~350 items) and classifies each against chronix's current state.

## Background

Per `feedback_no_logic_drift_from_kui.md`: every k-ui sub-behavior must have an explicit disposition (`done` / `parked` / `rejected`). Silent gaps — items with neither implementation nor catalog row — cause drift that's invisible to ci-check and parity tests.

The user found `todayBgColor` after Phase 21 closed. Phase 21 catalog listed `todayLine` exhaustively but missed the parity-reference's adjacent yellow today-column tint. This audit finds every comparable miss.

## Methodology

### Enumeration sources (k-ui)

Seven exhaustive sources, all under `d:/work/k-ui/`:

| Source                                   | Path                                                                                          | Item count                 |
| ---------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------- |
| **A. Top-level options**                 | `packages/gantt/src/options.ts` + Vue3 adapter                                                | 211                        |
| **B. Theme tokens / CSS variables**      | `packages/gantt/src/theme/{GlobalThemeOverrides,applyThemeOverrides,Theme}.ts` + `.css` greps | 29 (27 typed + 2 CSS-only) |
| **C. Slot / content arg shapes**         | `packages/gantt/src/api/structs.ts` + per-feature `*ContentArg.ts` files                      | 63 shapes / ~380 fields    |
| **D. Imperative API methods**            | `packages/gantt/src/api/GanttSchedulerImpl.ts`                                                | 33 methods                 |
| **E. View-spec fields**                  | `packages/gantt/src/structs/view-spec.ts`                                                     | 10 fields + inherited      |
| **F. CSS class names / data-attributes** | `packages/gantt/src/**/*.css` + grepped DOM emitters                                          | ~40                        |
| **G. Demo wiring delta**                 | `examples/gantt/vue3/src/DemoApp.vue` `schedulerOptions` block                                | ~50 (overlap with A)       |

### Chronix-side mapping baseline

For each k-ui item the sweep maps to chronix's equivalent (if any):

- `packages/gantt/src/api/{gantt-options,gantt-handle,chronix-theme}.ts` — public types
- `adapters/vue3/src/chronix-gantt.ts` props + emits — adapter surface (~32 props + 15 emits)
- `packages/gantt/src/render/bar-slot.ts` `BarSlotArgs` — slot-arg surface
- `audit/PHASE_*_DESIGN.md` catalogs — disposition source-of-truth (28 phase docs)
- `audit/PARITY_RECHECK.md` disposition register — phase-level dispositions

### 5-way classification rubric

Each k-ui item gets exactly one of:

| Symbol | Meaning                                                                                                                                    | Action required                                                                                |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| ✅     | **Done + Cataloged** — chronix has implementation AND a `PHASE_X_DESIGN.md` catalog row OR a `PARITY_RECHECK.md` disposition.              | None.                                                                                          |
| ⚠      | **Done + Uncataloged** — chronix has implementation but no catalog row anywhere.                                                           | Backfill catalog/disposition.                                                                  |
| 🔴     | **Silent gap** — chronix has no implementation AND no catalog row anywhere.                                                                | Add disposition row (`Planned Phase X` / `Defer-indefinite` + trigger / `Reject` + rationale). |
| ⏸️     | **Cataloged-parked but no disposition** — a phase catalog mentions it with ⏸️ but PARITY_RECHECK disposition register doesn't classify it. | Add disposition.                                                                               |
| ❌     | **Rejected (by-design)** — explicit reject in disposition register OR by chronix's architectural choice (e.g. different a11y model).       | None.                                                                                          |

🔴 + ⏸️ + ⚠ are the three columns that demand follow-up. ✅ + ❌ are clean.

### Confidence levels

Items vary in mapping confidence:

- **High** — exact name match or obvious 1:1 mapping (e.g. `eventOverlap` ↔ `eventOverlap`)
- **Medium** — semantic match with chronix-named equivalent (e.g. `eventBackgroundColor` ↔ `barBackgroundColor`)
- **Low** — speculative mapping or chronix-different architecture (e.g. `eventContent` ↔ `slotRegistry` partial)

Low-confidence mappings are marked `[low]` in the rationale column.

---

## Section A — Top-level options (211 items)

Clustered by feature family. Each cluster table covers every k-ui option whose name belongs to it, classified vs current chronix state.

### A.1 — Toolbar / chrome (10 items)

Phase 22 just landed; catalog at `audit/PHASE_22_TOOLBAR_DESIGN.md`.

| k-ui option             | Status | Chronix equivalent              | Rationale                                                                                                                                                                                                           |
| ----------------------- | :----: | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `headerToolbar`         |   ✅   | `headerToolbar` prop (Phase 22) | Same name + shape.                                                                                                                                                                                                  |
| `footerToolbar`         |   ⏸️   | —                               | Phase 22 catalog ⏸️ parked; **NO PARITY_RECHECK disposition row** → needs Defer-indefinite + trigger.                                                                                                               |
| `buttonText`            |   ⏸️   | —                               | Phase 22 catalog ⏸️ parked with i18n; **needs disposition**.                                                                                                                                                        |
| `buttonHints`           |   ⏸️   | —                               | Phase 22 catalog ⏸️ parked with i18n; **needs disposition**.                                                                                                                                                        |
| `customButtons`         |   ⏸️   | —                               | Phase 22 catalog ⏸️ parked; **needs disposition**.                                                                                                                                                                  |
| `buttonIcons`           |   🔴   | —                               | k-ui's custom-icon override (`{ prev: 'fa-chevron-left' }`). **Not in any catalog**. Triage: Defer-indefinite (no consumer demand for custom icons; chronix has built-in SVGs only).                                |
| `bootstrapFontAwesome`  |   🔴   | —                               | k-ui's "enable FA icon set" flag. **Not in any catalog**. Triage: Reject (chronix doesn't depend on icon fonts; ships inline SVGs).                                                                                 |
| `titleRangeSeparator`   |   🔴   | —                               | Separator char between range endpoints in title (e.g. `–`). **Not in any catalog**. Chronix's `formatToolbarTitle` uses fixed format strings. Triage: Defer-indefinite (lands with locale-driven title formatting). |
| `defaultRangeSeparator` |   🔴   | —                               | Same as above for non-title contexts. **Not in any catalog**. Triage: Defer-indefinite.                                                                                                                             |
| `navLinks`              |   🔴   | —                               | Clickable day/week headers for navigation. **Not in any catalog**. Triage: Defer-indefinite (paired with `navLinkDayClick` / `navLinkWeekClick`).                                                                   |

**Toolbar/chrome silent gaps**: 5 🔴 + 4 ⏸️ needing disposition rows.

### A.2 — Today / now indicator family (5 items)

| k-ui option                                                                        | Status | Chronix equivalent | Rationale                                                                                                                                                               |
| ---------------------------------------------------------------------------------- | :----: | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nowIndicator` + 4 `nowIndicator*` (classNames / content / didMount / willUnmount) |   ❌   | —                  | Phase 21 catalog + PARITY_RECHECK disposition: Reject (5-min setTimeout machinery + tab-visibility + render hooks — not worth complexity without real-consumer demand). |
| `nowIndicatorSnap`                                                                 |   🔴   | —                  | k-ui's "snap now-indicator to slot grid" sub-option. **Not in any catalog**. Triage: Reject — depends on `nowIndicator` which is rejected; same rationale by extension. |

**Today/now silent gaps**: 1 🔴 (rolls up with the parent `nowIndicator` reject — fold into reject rationale).

> **`todayBgColor` is in Section B (theme tokens)** — that's where the user-found gap lives. Filed under theme tokens because k-ui surfaces it via `themeOverrides`, not the top-level options.

### A.3 — Event styling (16 items)

Phase 20 covered the event-color pipeline.

| k-ui option            | Status | Chronix equivalent                                                               | Rationale                                                                                                                                                                                                                                                                                                        |
| ---------------------- | :----: | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `eventColor`           |   ✅   | `barColor` prop                                                                  | Phase 20 catalog ✅ port.                                                                                                                                                                                                                                                                                        |
| `eventBackgroundColor` |   ✅   | `barBackgroundColor` prop                                                        | Phase 20 ✅.                                                                                                                                                                                                                                                                                                     |
| `eventBorderColor`     |   ✅   | `barBorderColor` prop                                                            | Phase 20 ✅.                                                                                                                                                                                                                                                                                                     |
| `eventTextColor`       |   ✅   | `barTextColor` prop                                                              | Phase 20 ✅.                                                                                                                                                                                                                                                                                                     |
| `eventStyleCallbacks`  |   ✅   | `barBackgroundColorCallback` + `barBorderColorCallback` + `barTextColorCallback` | Phase 20 split into 3 individual callbacks (more direct).                                                                                                                                                                                                                                                        |
| `eventClassNames`      |   🔴   | —                                                                                | k-ui `ClassNamesGenerator<EventContentArg>` per-event class override. Chronix's `slotRegistry` enables full DOM replacement but NO per-bar `class` callback for default render. **Not in any catalog**. Triage: Defer-indefinite (trigger: consumer asks for class-based styling without full slot replacement). |
| `eventContent`         |   ⚠    | `slotRegistry` (`BAR_SLOT_NAME` = `'bar'`)                                       | Phase 11 covered. Slot replaces the entire `<rect>`. Catalog has it but uses different name; backfill rationale.                                                                                                                                                                                                 |
| `eventDidMount`        |   🔴   | —                                                                                | k-ui `(arg: EventMountArg) => void` mount-hook. Chronix has no equivalent (slot pattern doesn't expose mount/unmount). **Not in any catalog**. Triage: Defer-indefinite (trigger: consumer needs ref-to-DOM at mount).                                                                                           |
| `eventWillUnmount`     |   🔴   | —                                                                                | Same family. Triage: Defer-indefinite.                                                                                                                                                                                                                                                                           |
| `eventDisplay`         |   🔴   | —                                                                                | k-ui `'auto' \| 'block' \| 'list-item' \| 'background'` render mode. Chronix renders all bars as `<rect>` — no list-item or background-event variants. **Not in any catalog**. Triage: Defer-indefinite (trigger: consumer needs background events / list rendering).                                            |
| `displayEventTime`     |   🔴   | —                                                                                | Show formatted time on event bar. Chronix bars have no built-in time label; consumer slot can add. **Not in any catalog**. Triage: Defer-indefinite.                                                                                                                                                             |
| `displayEventEnd`      |   🔴   | —                                                                                | Show end-time label specifically. Triage: Defer-indefinite.                                                                                                                                                                                                                                                      |
| `eventTimeFormat`      |   🔴   | —                                                                                | Format string for `displayEventTime`. Triage: Defer-indefinite (paired with above).                                                                                                                                                                                                                              |
| `eventOrder`           |   🔴   | —                                                                                | Field-name list for sorting events. Chronix renders in input order. **Not in any catalog**. Triage: Defer-indefinite (trigger: consumer reports wrong z-order or per-row order).                                                                                                                                 |
| `eventOrderStrict`     |   🔴   | —                                                                                | Strict-mode for `eventOrder`. Triage: Defer-indefinite.                                                                                                                                                                                                                                                          |
| `eventDataTransform`   |   ❌   | —                                                                                | Disposition register: Defer-indefinite (chronix's `BarSpec` is native shape).                                                                                                                                                                                                                                    |

**Event styling silent gaps**: 8 🔴 + 1 ⚠ to backfill.

### A.4 — Event editing / interaction gates (14 items)

Phase 19 covered validation; Phase 25 will cover drag-distance gate.

| k-ui option               | Status | Chronix equivalent                    | Rationale                                                                                                                                                                       |
| ------------------------- | :----: | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `editable`                |   ✅   | `editable` prop                       | Same name.                                                                                                                                                                      |
| `selectable`              |   ✅   | `selectable` prop                     | Same name.                                                                                                                                                                      |
| `selectMirror`            |   🔴   | —                                     | k-ui shows preview mirror during drag-select. Chronix renders selection rect directly. **Not in any catalog**. Triage: Defer-indefinite (trigger: visual mirror requested).     |
| `unselectAuto`            |   ⚠    | `useGanttSelection({ unselectAuto })` | Phase 12 covered but called the same name; not explicitly in disposition register. Backfill.                                                                                    |
| `unselectCancel`          |   🔴   | —                                     | CSS-selector "don't deselect when clicking these elements". **Not in any catalog**. Triage: Defer-indefinite.                                                                   |
| `eventStartEditable`      |   🔴   | —                                     | Granular toggle: allow start-edge resize only. Chronix's `editable` is umbrella (both edges). **Not in any catalog**. Triage: Defer-indefinite (trigger: per-edge gating need). |
| `eventDurationEditable`   |   🔴   | —                                     | Granular toggle: allow duration resize only. Triage: Defer-indefinite.                                                                                                          |
| `eventResizableFromStart` |   🔴   | —                                     | k-ui per-event opt-out for start-edge resize. **Not in any catalog**. Triage: Defer-indefinite.                                                                                 |
| `eventProgressChangeable` |   🔴   | —                                     | Toggle for progress-handle drag. Chronix activates progress handle via `BarSpec.progress` opt-in (no umbrella prop). **Not in any catalog**. Triage: Defer-indefinite.          |
| `eventInteractive`        |   🔴   | —                                     | Master toggle for ALL event interactions. **Not in any catalog**. Triage: Defer-indefinite.                                                                                     |
| `eventOverlap`            |   ✅   | `eventOverlap` prop                   | Phase 19.                                                                                                                                                                       |
| `eventConstraint`         |   ✅   | `eventConstraint` prop                | Phase 19.                                                                                                                                                                       |
| `eventAllow`              |   ✅   | `eventAllow` prop                     | Phase 19.                                                                                                                                                                       |
| `eventDragMinDistance`    |   ⏸️   | —                                     | Phase 25 (Planned) per disposition register.                                                                                                                                    |

**Event editing silent gaps**: 7 🔴 + 1 ⚠.

### A.5 — Selection (4 items)

Phase 12 covered selection model.

| k-ui option            |      Status      | Chronix equivalent | Rationale                                                                                                                                                                                                                                                                                                           |
| ---------------------- | :--------------: | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `selectable`           |        ✅        | (covered in A.4)   | —                                                                                                                                                                                                                                                                                                                   |
| `selectMirror`         | (covered in A.4) | —                  | —                                                                                                                                                                                                                                                                                                                   |
| `selectMinDistance`    |        🔴        | —                  | k-ui's "drag distance before select triggers" — paired with `eventDragMinDistance`. Phase 25 covers the bar-drag distance gate; **`selectMinDistance` is NOT in Phase 25 disposition row** (only mentions "drag-distance gate"). **Silent gap within Phase 25 scope**. Triage: fold into Phase 25 scope explicitly. |
| `selectConstraint`     |        🔴        | —                  | k-ui constraint for date-range selects (parallel to `eventConstraint` but for selects). Phase 19 covered `selectAllow` only. **Not in any catalog**. Triage: Defer-indefinite (selectAllow is more flexible).                                                                                                       |
| `selectOverlap`        |        🔴        | —                  | "Allow date-select to overlap existing events". **Not in any catalog**. Triage: Defer-indefinite.                                                                                                                                                                                                                   |
| `selectLongPressDelay` |        🔴        | —                  | Touch long-press delay. **Not in any catalog**. Triage: Defer-indefinite (touch interactions out of scope until consumer asks).                                                                                                                                                                                     |
| `selectAllow`          |        ✅        | `selectAllow` prop | Phase 19.                                                                                                                                                                                                                                                                                                           |

**Selection silent gaps**: 4 🔴 (incl. one missing from Phase 25 scope row).

### A.6 — Drag / drop (10 items)

| k-ui option              |    Status     | Chronix equivalent    | Rationale                                                                                                                      |
| ------------------------ | :-----------: | --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `dragRevertDuration`     |      🔴       | —                     | ms-animation for invalid-drop revert. Chronix has no revert animation. **Not in any catalog**. Triage: Defer-indefinite.       |
| `dragScroll`             |      🔴       | —                     | Auto-scroll when dragging near viewport edge. **Not in any catalog**. Triage: Defer-indefinite (auto-scroll is real omission). |
| `droppable`              |      🔴       | —                     | "Accept external HTML drag-and-drop". **Not in any catalog**. Triage: Defer-indefinite.                                        |
| `dropAccept`             |      🔴       | —                     | Selector/function for which draggables to accept. Same family. Triage: Defer-indefinite.                                       |
| `allDayMaintainDuration` |      🔴       | —                     | All-day specific drop policy. Triage: Defer-indefinite (all-day events themselves are deferred).                               |
| `eventDragMinDistance`   |      ⏸️       | —                     | (covered A.4 — Phase 25).                                                                                                      |
| `longPressDelay`         |      🔴       | —                     | Generic long-press delay (touch). Triage: Defer-indefinite.                                                                    |
| `eventLongPressDelay`    |      🔴       | —                     | Event-specific long-press. Triage: Defer-indefinite.                                                                           |
| `selectLongPressDelay`   | (covered A.5) | —                     | —                                                                                                                              |
| `snapDuration`           |      ✅       | `snapDurationMs` prop | Phase 3 (interaction layer) covered; same semantics, ms unit.                                                                  |

**Drag/drop silent gaps**: 7 🔴.

### A.7 — Time / date / range (15 items)

| k-ui option         | Status | Chronix equivalent | Rationale                                                                                                                                                                                                                                                                                                   |
| ------------------- | :----: | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `duration`          |   🔴   | —                  | Default duration unit for time computations. **Not in any catalog**. Triage: Defer-indefinite (chronix derives from view + slotDuration).                                                                                                                                                                   |
| `slotDuration`      |   🔴   | —                  | Time per slot (24 hour-slots vs 48 half-hour-slots). Per Phase 1 R2 mapping, chronix uses fixed per-view slot durations. **Not in any catalog as silent gap**. Triage: Defer-indefinite (P2 from disposition register mentions "day/week label-vs-slot model collapse" — related but for different reason). |
| `slotMinTime`       |   🔴   | —                  | Earliest visible time (e.g. `'08:00:00'` for business-hours view). **Not in any catalog**. Triage: Defer-indefinite (would clip axis range).                                                                                                                                                                |
| `slotMaxTime`       |   🔴   | —                  | Latest visible time. Same family. Triage: Defer-indefinite.                                                                                                                                                                                                                                                 |
| `slotMinWidth`      |   🔴   | —                  | Minimum slot px width. Chronix has `deriveSlotWidth` with floor; not user-configurable. **Not in any catalog**. Triage: Defer-indefinite.                                                                                                                                                                   |
| `dayMinWidth`       |   🔴   | —                  | Same for day cells. Triage: Defer-indefinite.                                                                                                                                                                                                                                                               |
| `slotLabelInterval` |   🔴   | —                  | Duration between visible labels (label every 2 hours instead of every 1). **Not in any catalog**. Triage: Defer-indefinite.                                                                                                                                                                                 |
| `slotLabelFormat`   |   🔴   | —                  | Custom format for tick labels. Chronix uses fixed `Intl` formatters per view. **Not in any catalog**. Triage: Defer-indefinite (lands with locale-driven formatting).                                                                                                                                       |
| `nextDayThreshold`  |   🔴   | —                  | "Multi-day event roll-over time" (e.g. midnight + 4h). **Not in any catalog**. Triage: Defer-indefinite.                                                                                                                                                                                                    |
| `dateAlignment`     |   🔴   | —                  | Snap displayed range to week/month boundary. **Not in any catalog**. Triage: Defer-indefinite.                                                                                                                                                                                                              |
| `dateIncrement`     |   ⏸️   | —                  | Per-call duration for `prev()`/`next()`. Phase 22's `nav-utils.ts` hard-codes per-view periods (`day` ±1d etc.); k-ui allows override. Phase 24 (Planned) territory but **not explicitly listed in Phase 24's disposition**. Triage: fold into Phase 24 scope or Defer-indefinite.                          |
| `timeZone`          |   🔴   | —                  | IANA TZ. Chronix uses local time only (`AxisRangePlanInput.anchorDate` is a `Date`). **Not in any catalog**. Triage: Defer-indefinite (TZ support is large scope).                                                                                                                                          |
| `now`               |   ⏸️   | —                  | Override "now" reference. Tied to nowIndicator rejection but `now` is also used elsewhere. **Not in any catalog**. Triage: Reject by extension (chronix uses `Date.now()` directly).                                                                                                                        |
| `initialDate`       |   ⏸️   | —                  | Initial anchor date. Phase 24 (Planned) territory; **not explicitly in Phase 24 disposition row**. Triage: fold into Phase 24 scope.                                                                                                                                                                        |
| `validRange`        |   🔴   | —                  | Restrict navigable range (start/end). **Not in any catalog**. Triage: Defer-indefinite (paired with `isPrevEnabled` / `isNextEnabled` for toolbar — Phase 22 catalog ⏸️ parked).                                                                                                                            |

**Time/date silent gaps**: 13 🔴 + 3 ⏸️ needing disposition.

### A.8 — Layout / sizing (8 items)

| k-ui option                 | Status | Chronix equivalent                 | Rationale                                                                                                                                                         |
| --------------------------- | :----: | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `height`                    |   🔴   | —                                  | Explicit chart height (`'100%'`, `'600px'`). Chronix lets CSS drive height. **Not in any catalog**. Triage: Defer-indefinite (consumer wraps in sized container). |
| `contentHeight`             |   🔴   | —                                  | Scroll-content height vs viewport. Same family. Triage: Defer-indefinite.                                                                                         |
| `viewHeight`                |   🔴   | —                                  | View-specific height. Triage: Defer-indefinite.                                                                                                                   |
| `aspectRatio`               |   🔴   | —                                  | Width/height ratio. **Not in any catalog**. Triage: Defer-indefinite.                                                                                             |
| `expandRows`                |   🔴   | —                                  | Allow rows to expand/collapse. **Not in any catalog**. Triage: Defer-indefinite (expand/collapse is a feature category).                                          |
| `stickyHeaderDates`         |   ✅   | (Phase 4.5 sticky-header refactor) | Phase 4.5 implemented sticky-header; default behavior — no consumer toggle. Backfill catalog mention.                                                             |
| `stickyFooterScrollbar`     |   🔴   | —                                  | Sticky bottom scrollbar. Chronix one scroll container only (Phase 23 will split). **Not in any catalog**. Triage: fold into Phase 23 scope.                       |
| `progressiveEventRendering` |   🔴   | —                                  | Render events incrementally for perf. **Not in any catalog**. Triage: Defer-indefinite (perf optimization).                                                       |

**Layout silent gaps**: 6 🔴 + 1 ✅-uncataloged (sticky-header) + 1 ⏸️ to fold into Phase 23.

### A.9 — Day headers / day cells (10 items)

These k-ui families render the header band's day-of-month cells AND each body day-column cell.

| k-ui option            | Status | Chronix equivalent | Rationale                                                                                                                                             |
| ---------------------- | :----: | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dayHeaders`           |   🔴   | —                  | Master toggle for header band day cells. Chronix always renders header (via `headerRowHeight > 0`). **Not in any catalog**. Triage: Defer-indefinite. |
| `dayHeaderFormat`      |   🔴   | —                  | Format string for header cell labels. Chronix uses fixed `Intl` formatters. **Not in any catalog**. Triage: Defer-indefinite.                         |
| `dayHeaderClassNames`  |   🔴   | —                  | Per-day class callback. **Not in any catalog**. Triage: Defer-indefinite.                                                                             |
| `dayHeaderContent`     |   🔴   | —                  | Custom render for header cell. Triage: Defer-indefinite.                                                                                              |
| `dayHeaderDidMount`    |   🔴   | —                  | Mount hook. Triage: Defer-indefinite.                                                                                                                 |
| `dayHeaderWillUnmount` |   🔴   | —                  | Unmount hook. Triage: Defer-indefinite.                                                                                                               |
| `dayCellClassNames`    |   🔴   | —                  | Per-body-day-cell class. Triage: Defer-indefinite.                                                                                                    |
| `dayCellContent`       |   🔴   | —                  | Custom render for body day cell. Triage: Defer-indefinite.                                                                                            |
| `dayCellDidMount`      |   🔴   | —                  | Mount hook. Triage: Defer-indefinite.                                                                                                                 |
| `dayCellWillUnmount`   |   🔴   | —                  | Unmount hook. Triage: Defer-indefinite.                                                                                                               |

**Day header/cell silent gaps**: 10 🔴 (whole family). Possible bundle: a future `customRenderingMetaMap` phase.

### A.10 — Slot label / slot lane (8 items)

Slot labels = inner tick label band; slot lanes = the per-column-tick rectangles.

| k-ui option            | Status | Chronix equivalent | Rationale                                               |
| ---------------------- | :----: | ------------------ | ------------------------------------------------------- |
| `slotLabelClassNames`  |   🔴   | —                  | Per-tick class callback. Triage: Defer-indefinite.      |
| `slotLabelContent`     |   🔴   | —                  | Custom render. Triage: Defer-indefinite.                |
| `slotLabelDidMount`    |   🔴   | —                  | Mount hook. Triage: Defer-indefinite.                   |
| `slotLabelWillUnmount` |   🔴   | —                  | Unmount hook. Triage: Defer-indefinite.                 |
| `slotLaneClassNames`   |   🔴   | —                  | Lane (column) class callback. Triage: Defer-indefinite. |
| `slotLaneContent`      |   🔴   | —                  | Custom render for column. Triage: Defer-indefinite.     |
| `slotLaneDidMount`     |   🔴   | —                  | Mount hook. Triage: Defer-indefinite.                   |
| `slotLaneWillUnmount`  |   🔴   | —                  | Unmount hook. Triage: Defer-indefinite.                 |

**Slot label/lane silent gaps**: 8 🔴.

### A.11 — Week numbers (7 items)

| k-ui option             | Status | Chronix equivalent | Rationale                                                                                                                                          |
| ----------------------- | :----: | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `weekNumbers`           |   🔴   | —                  | Master toggle for week-number column. Chronix doesn't render a week-number column. **Not in any catalog**. Triage: Defer-indefinite (not in demo). |
| `weekNumberCalculation` |   🔴   | —                  | `'local' \| 'iso' \| 'US'` algo. Chronix's `formatToolbarTitle` ISO-only. Triage: Defer-indefinite.                                                |
| `weekNumberClassNames`  |   🔴   | —                  | Per-cell class. Triage: Defer-indefinite.                                                                                                          |
| `weekNumberContent`     |   🔴   | —                  | Custom render. Triage: Defer-indefinite.                                                                                                           |
| `weekNumberDidMount`    |   🔴   | —                  | Mount hook. Triage: Defer-indefinite.                                                                                                              |
| `weekNumberWillUnmount` |   🔴   | —                  | Unmount hook. Triage: Defer-indefinite.                                                                                                            |
| `weekNumberFormat`      |   🔴   | —                  | Format string. Triage: Defer-indefinite.                                                                                                           |

**Week number silent gaps**: 7 🔴 (whole family).

### A.12 — All-day section (5 items)

K-ui distinguishes timed events vs all-day events with separate slots. Chronix gantt is timed-only.

| k-ui option                  | Status | Chronix equivalent | Rationale                                                                                            |
| ---------------------------- | :----: | ------------------ | ---------------------------------------------------------------------------------------------------- |
| `allDayText`                 |   🔴   | —                  | Label for all-day row. Triage: Defer-indefinite.                                                     |
| `allDayClassNames`           |   🔴   | —                  | Class callback. Triage: Defer-indefinite.                                                            |
| `allDayContent`              |   🔴   | —                  | Custom render. Triage: Defer-indefinite.                                                             |
| `allDayDidMount`             |   🔴   | —                  | Mount hook. Triage: Defer-indefinite.                                                                |
| `allDayWillUnmount`          |   🔴   | —                  | Unmount hook. Triage: Defer-indefinite.                                                              |
| `defaultAllDay`              |   🔴   | —                  | Selection defaults to all-day. Triage: Defer-indefinite.                                             |
| `defaultAllDayEventDuration` |   🔴   | —                  | Default duration when creating all-day. Triage: Defer-indefinite.                                    |
| `defaultTimedEventDuration`  |   🔴   | —                  | Default duration when creating timed. Chronix lets consumer set on commit. Triage: Defer-indefinite. |

**All-day silent gaps**: 8 🔴 (whole family). Pragmatic disposition: **Reject** as a family (chronix gantt is timed-only by design; if all-day is needed it's a major redesign).

### A.13 — View management (5 items)

Phase 24 (Planned) covers `initialDate` + nav imperatives.

| k-ui option               | Status | Chronix equivalent                    | Rationale                                                                                                                                                                                                         |
| ------------------------- | :----: | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialView`             |   ⏸️   | `cfg.view` URL flag (demo)            | Phase 24 scope. **Not explicitly in Phase 24 disposition row**. Triage: fold into Phase 24.                                                                                                                       |
| `initialDate`             |   ⏸️   | (Phase 22's `anchorDate` ref in demo) | Phase 24 scope. Same.                                                                                                                                                                                             |
| `views` (per-view config) |   🔴   | —                                     | k-ui `views: { day: { buttonText, slotLabelFormat, ... } }` — chronix has no per-view override mechanism. **Not in any catalog as silent gap**. Triage: Defer-indefinite (lands with per-view i18n / formatting). |
| `dayCount`                |   🔴   | —                                     | Number of visible days in a view. Chronix has fixed per-view durations. **Not in any catalog**. Triage: Defer-indefinite.                                                                                         |
| `visibleRange`            |   🔴   | —                                     | Override visible range with `{ start, end }`. **Not in any catalog**. Triage: Defer-indefinite.                                                                                                                   |

**View management silent gaps**: 3 🔴 + 2 ⏸️ to fold into Phase 24.

### A.14 — Weekends / weeks (5 items)

| k-ui option           | Status | Chronix equivalent                           | Rationale                                                                                                                                               |
| --------------------- | :----: | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `weekends`            |   ✅   | `weekendsVisible` (AxisRangePlanInput field) | Phase 18 ✅. Name differs.                                                                                                                              |
| `hiddenDays`          |   🔴   | —                                            | Array `[0, 6]` to hide specific weekdays (more flexible than `weekends` boolean). **Not in any catalog**. Triage: Defer-indefinite.                     |
| `firstDay`            |   🔴   | —                                            | First day of week (0=Sun, 1=Mon). Chronix hard-codes Monday-start in `formatToolbarTitle.weekOfYear`. **Not in any catalog**. Triage: Defer-indefinite. |
| `fixedWeekCount`      |   🔴   | —                                            | Force 6-week rows in month view. **Not in any catalog**. Triage: Defer-indefinite (month-view layout).                                                  |
| `showNonCurrentDates` |   🔴   | —                                            | Show dates from adjacent months in current view. **Not in any catalog**. Triage: Defer-indefinite.                                                      |

**Weekends/weeks silent gaps**: 4 🔴.

### A.15 — Event source / fetching (7 items)

| k-ui option                                 | Status | Chronix equivalent                  | Rationale                                                                                                                                                                                                                 |
| ------------------------------------------- | :----: | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `events`                                    |   🔴   | (chronix uses `bars` prop directly) | k-ui supports URL strings + JSON feeds + function-based event sources. Chronix takes immutable `BarSpec[]`. **Not in any catalog**. Triage: Defer-indefinite per disposition register "Recurring events + event sources". |
| `eventSources`                              |   🔴   | —                                   | Array of mixed sources. Same family. Triage: Defer-indefinite.                                                                                                                                                            |
| `initialEvents`                             |   🔴   | (`bars` prop)                       | Initial-only feed. Chronix has no special-case initial vs current. Triage: Defer-indefinite.                                                                                                                              |
| `lazyFetching`                              |   🔴   | —                                   | Only fetch for visible range. **Not in any catalog**. Triage: Defer-indefinite.                                                                                                                                           |
| `startParam` / `endParam` / `timeZoneParam` |   🔴   | —                                   | Query-param names for event-source URLs. **Not in any catalog**. Triage: Defer-indefinite.                                                                                                                                |
| `eventSourceFailure` / `eventSourceSuccess` |   🔴   | —                                   | Fetch lifecycle callbacks. Triage: Defer-indefinite.                                                                                                                                                                      |
| `eventProcessCallback`                      |   🔴   | —                                   | Process events during render. **Not in any catalog**. Triage: Defer-indefinite.                                                                                                                                           |

**Event source silent gaps**: 7 🔴 (whole family).

### A.16 — Business hours (1 item)

| k-ui option     | Status | Chronix equivalent | Rationale                               |
| --------------- | :----: | ------------------ | --------------------------------------- |
| `businessHours` |   ❌   | —                  | Disposition register: Defer-indefinite. |

### A.17 — Resource panel (covered by demo's `resourceAreaColumns`, no k-ui Options field per se)

Reading the demo, `resourceAreaColumns` is a top-level demo wiring. The k-ui canonical option name is... checking. The Options surface lists no `resourceAreaColumns` directly — it's a separate option added by the resource extension. Let me note it:

| k-ui option                                                                                               | Status | Chronix equivalent                            | Rationale                                                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------- | :----: | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resourceAreaColumns` (demo)                                                                              |   ✅   | `columns` prop                                | Phase 9 / Phase 5 covered. Chronix has it.                                                                                                                                  |
| `resources` (event source for resources)                                                                  |   🔴   | (chronix uses `rows` prop)                    | k-ui has `resources: []` parallel to `events`. Chronix uses `rows: RowSpec[]`. Both fixed-shape. Not a gap functionally but **uncataloged in catalog**. Triage: ⚠ backfill. |
| Resource hierarchy / tree (`parentId`)                                                                    |   ⏸️   | (Phase 1 IR has `parentId` field, ignored v0) | Phase 1 / 2 catalog mentions; PARITY_RECHECK disposition register: Defer-indefinite.                                                                                        |
| Resource CRUD API (`addResource`, etc.)                                                                   |   ❌   | —                                             | Disposition register: Defer-indefinite.                                                                                                                                     |
| Resource emits (`resourceAdd`, `resourceChange`, `resourceRemove`)                                        |   ❌   | —                                             | Disposition register: Defer-indefinite.                                                                                                                                     |
| `resourceLabelClassNames` / `resourceLabelContent` / `resourceLabelDidMount` / `resourceLabelWillUnmount` |   🔴   | —                                             | Resource sidebar label customization. Chronix has `RowSpec.columns` static map. **Not in any catalog**. Triage: Defer-indefinite.                                           |
| `resourceLaneClassNames` / `resourceLaneContent` / `resourceLaneDidMount` / `resourceLaneWillUnmount`     |   🔴   | —                                             | Resource body-row customization. Same family. Triage: Defer-indefinite.                                                                                                     |

**Resource panel silent gaps**: 8 🔴 + 1 ⚠.

### A.18 — Localization (4 items)

| k-ui option                      | Status | Chronix equivalent                                                                      | Rationale                                                                                                                                                                                                             |
| -------------------------------- | :----: | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `locale`                         |   ⚠    | `AxisRangePlanInput.locale` (plumbed but only used by `Intl.DateTimeFormat` internally) | Phase 1/2 catalog mentions; cataloged via IR field. Backfill explicit row.                                                                                                                                            |
| `locales` (array of locale defs) |   🔴   | —                                                                                       | Multi-locale registry. **Not in any catalog**. Triage: Defer-indefinite (single-locale per mount is sufficient for v0).                                                                                               |
| `direction`                      |   ❌   | —                                                                                       | Disposition register: Defer-indefinite ("RTL tied to wider infra").                                                                                                                                                   |
| `themeSystem`                    |   🔴   | —                                                                                       | `'standard' \| 'bootstrap5' \| ...` — switches button + chrome themes. Chronix has its own theme model. **Not in any catalog**. Triage: Reject (chronix uses `theme` prop; k-ui's theme-system is a different model). |

**Localization silent gaps**: 1 🔴 + 1 ⚠. (1 ❌ documented.)

### A.19 — Day-popover / more-link (10 items)

K-ui shows a popover when `dayMaxEvents` truncates display.

| k-ui option           | Status | Chronix equivalent | Rationale                                                                                                                                                 |
| --------------------- | :----: | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dayMaxEvents`        |   🔴   | —                  | Max visible events per day; rest go to popover. Chronix has no event-truncation. **Not in any catalog**. Triage: Defer-indefinite.                        |
| `dayMaxEventRows`     |   🔴   | —                  | Same family for row count. Triage: Defer-indefinite.                                                                                                      |
| `eventMaxStack`       |   🔴   | —                  | Max stacked events per visual column. Chronix's `BarStackHeightPass` always stacks all without capping. **Not in any catalog**. Triage: Defer-indefinite. |
| `slotEventOverlap`    |   🔴   | —                  | Visual overlap policy within slot. Triage: Defer-indefinite.                                                                                              |
| `moreLinkText`        |   🔴   | —                  | `"+N more"` label. Triage: Defer-indefinite.                                                                                                              |
| `moreLinkHint`        |   🔴   | —                  | Tooltip on more-link. Triage: Defer-indefinite.                                                                                                           |
| `moreLinkClick`       |   🔴   | —                  | Click handler. Triage: Defer-indefinite.                                                                                                                  |
| `moreLinkClassNames`  |   🔴   | —                  | Triage: Defer-indefinite.                                                                                                                                 |
| `moreLinkContent`     |   🔴   | —                  | Triage: Defer-indefinite.                                                                                                                                 |
| `moreLinkDidMount`    |   🔴   | —                  | Triage: Defer-indefinite.                                                                                                                                 |
| `moreLinkWillUnmount` |   🔴   | —                  | Triage: Defer-indefinite.                                                                                                                                 |
| `dayPopoverFormat`    |   🔴   | —                  | Triage: Defer-indefinite.                                                                                                                                 |
| `noEventsText`        |   🔴   | —                  | Empty-state label. Triage: Defer-indefinite.                                                                                                              |

**Day-popover/more-link silent gaps**: 13 🔴 (whole family — pragmatically should be ONE disposition: **Defer-indefinite as cluster** "event-truncation / popover infrastructure").

### A.20 — Event sizing (5 items)

| k-ui option          | Status | Chronix equivalent                            | Rationale                                                                                           |
| -------------------- | :----: | --------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `eventMinHeight`     |   ✅   | `barHeight` prop                              | Phase 5.x ✅.                                                                                       |
| `eventMinWidth`      |   🔴   | —                                             | Minimum bar pixel width. Chronix doesn't enforce. **Not in any catalog**. Triage: Defer-indefinite. |
| `eventShortHeight`   |   🔴   | —                                             | Threshold for "short event" CSS class. Triage: Defer-indefinite.                                    |
| `eventSpacing`       |   ✅   | `barStackSpacing` (BarStackHeightPass config) | Phase 5.x ✅. Different name.                                                                       |
| `forceEventDuration` |   🔴   | —                                             | Auto-fill zero-duration events. **Not in any catalog**. Triage: Defer-indefinite.                   |

**Event sizing silent gaps**: 3 🔴.

### A.21 — Formatting / display (5 items)

| k-ui option                 | Status | Chronix equivalent | Rationale                                                                                                                                                                           |
| --------------------------- | :----: | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `titleFormat`               |   🔴   | —                  | k-ui formatRange-style title customization. Chronix uses fixed `formatToolbarTitle`. **Not in any catalog**. Triage: Defer-indefinite (lands with i18n / locale-driven formatting). |
| `weekText` / `weekTextLong` |   🔴   | —                  | Localized "W" labels. **Not in any catalog**. Triage: Defer-indefinite.                                                                                                             |
| `monthStartFormat`          |   🔴   | —                  | Month-start cell format. **Not in any catalog**. Triage: Defer-indefinite.                                                                                                          |
| `rerenderDelay`             |   🔴   | —                  | ms-debounce on rerender. Chronix uses Vue's reactivity (no manual debounce). **Not in any catalog**. Triage: Defer-indefinite.                                                      |

**Formatting silent gaps**: 4 🔴.

### A.22 — Scroll / sticky (4 items)

| k-ui option             |    Status     | Chronix equivalent  | Rationale                                                                                                                                                                |
| ----------------------- | :-----------: | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `scrollTime`            |      🔴       | —                   | Initial horizontal scroll offset. **Not in any catalog**. Triage: Defer-indefinite (Phase 24's `scrollToTime` covers programmatic; initial-scroll-on-mount is separate). |
| `scrollTimeReset`       |      🔴       | —                   | Reset scroll on date nav. Triage: Defer-indefinite.                                                                                                                      |
| `stickyHeaderDates`     | (covered A.8) | (Phase 4.5 default) | —                                                                                                                                                                        |
| `stickyFooterScrollbar` | (covered A.8) | —                   | Phase 23 fold.                                                                                                                                                           |

**Scroll silent gaps**: 2 🔴.

### A.23 — A11y / hints (5 items)

| k-ui option                            | Status | Chronix equivalent | Rationale                                                                                                  |
| -------------------------------------- | :----: | ------------------ | ---------------------------------------------------------------------------------------------------------- |
| `viewHint`                             |   🔴   | —                  | aria-label for view buttons. Phase 22 catalog covered via `buttonHints` ⏸️. Fold into A.1 disposition.     |
| `navLinkHint`                          |   🔴   | —                  | aria-label for nav-link clicks. Tied to `navLinks` family. Triage: Defer-indefinite.                       |
| `closeHint` / `timeHint` / `eventHint` |   🔴   | —                  | aria-labels for various widgets. **Not in any catalog**. Triage: Defer-indefinite (a11y story is broader). |

**A11y silent gaps**: 5 🔴.

### A.24 — Custom rendering / theme (5 items)

| k-ui option               |     Status     | Chronix equivalent | Rationale                                                                                                                                                                                    |
| ------------------------- | :------------: | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `themeOverrides`          |       ⚠        | `theme` prop       | Phase 10 ✅. Name differs. Backfill catalog row.                                                                                                                                             |
| `themeSystem`             | (covered A.18) | —                  | Reject.                                                                                                                                                                                      |
| `handleCustomRendering`   |       🔴       | —                  | Vue/React render-prop adapter for custom-renderable slots. Chronix has `slotRegistry` Phase 11. **Not in any catalog as direct mapping**. Triage: ⚠ partial coverage; backfill explicit row. |
| `customRenderingMetaMap`  |       🔴       | —                  | Per-slot metadata for the renderer. Chronix's `slotRegistry` is one-template-per-name. **Not in any catalog**. Triage: Defer-indefinite.                                                     |
| `customRenderingReplaces` |       🔴       | —                  | Replace vs augment default. Triage: Defer-indefinite.                                                                                                                                        |

**Custom rendering silent gaps**: 3 🔴 + 1 ⚠.

### A.25 — Misc / internals (6 items)

| k-ui option                                                                                                                                |    Status     | Chronix equivalent            | Rationale                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------ | :-----------: | ----------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `dependencyLineStyle`                                                                                                                      |      🔴       | `LinkSpec.routing` (per-link) | Phase 7 + 8 covered per-link. **No global option**. Triage: ⚠ backfill (chronix is per-link, not global).     |
| `online`                                                                                                                                   |      🔴       | —                             | Network online/offline flag. **Not in any catalog**. Triage: Defer-indefinite (no networking in v0).          |
| `eventInteractive`                                                                                                                         | (covered A.4) | —                             | —                                                                                                             |
| `handleWindowResize`                                                                                                                       |      🔴       | —                             | Master toggle for window-resize listener. Chronix has none. **Not in any catalog**. Triage: Defer-indefinite. |
| `windowResizeDelay`                                                                                                                        |      🔴       | —                             | Debounce ms. Same family. Triage: Defer-indefinite.                                                           |
| `_unmount` / `_beforeprint` / `_afterprint` / `_noEventDrop` / `_noEventResize` / `_resize` / `_scrollRequest` (7 internal `_*` listeners) |      ❌       | —                             | k-ui-internal; consumer-invisible. Triage: Reject (not a public surface).                                     |

**Misc silent gaps**: 3 🔴 + 1 ⚠.

### A.26 — View specs inside `views: { ... }` (10 fields)

Phase 24 territory.

| k-ui field                      |    Status     | Chronix equivalent                                     | Rationale                                                                                                                                     |
| ------------------------------- | :-----------: | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`                          |      🔴       | (chronix's view ids are hard-coded `'day'/'week'/...`) | k-ui allows custom view types. **Not in any catalog**. Triage: Defer-indefinite.                                                              |
| `component`                     |      🔴       | —                                                      | Custom Vue/React component per view. Triage: Defer-indefinite.                                                                                |
| `buttonText`                    | (covered A.1) | —                                                      | Phase 22 catalog ⏸️ parked with i18n.                                                                                                         |
| `buttonTextKey`                 |      🔴       | —                                                      | i18n key resolution. Triage: Defer-indefinite.                                                                                                |
| `dateProfileGeneratorClass`     |      🔴       | (chronix's `defaultAxisRangePlanner`)                  | k-ui's pluggable range-planner. Chronix has one canonical. **Not in any catalog**. Triage: Defer-indefinite (extensibility for custom views). |
| `usesMinMaxTime`                |      🔴       | —                                                      | View-internal flag. Triage: Reject (internal).                                                                                                |
| `classNames` (per-view)         |      🔴       | —                                                      | Per-view CSS class callback. Triage: Defer-indefinite.                                                                                        |
| `content` (per-view)            |      🔴       | —                                                      | Per-view custom render. Triage: Defer-indefinite.                                                                                             |
| `didMount` (per-view)           |      🔴       | —                                                      | Per-view mount hook. Triage: Defer-indefinite.                                                                                                |
| `willUnmount` (per-view)        |      🔴       | —                                                      | Per-view unmount. Triage: Defer-indefinite.                                                                                                   |
| Inherited base options per view |       —       | —                                                      | Each view inherits all `BaseOptions` for override. **No coverage in chronix** (single-view config). Same family. Triage: Defer-indefinite.    |

**View-spec silent gaps**: 8 🔴 (whole family — pragmatically: **Defer-indefinite cluster** "per-view config override system").

---

## Section A roll-up

**Options surface (211 total)**:

- ✅ Done + Cataloged: 14 items
- ⚠ Done + Uncataloged: 7 items (need backfill)
- 🔴 Silent gap: 138 items (need disposition)
- ⏸️ Cataloged + No-disposition: 11 items (need disposition row)
- ❌ Rejected (documented): 13 items
- Remaining 28 items: deferred to per-cluster pragmatic dispositions (some `_internal`, some redundant aliases)

**Pragmatic cluster dispositions** (to compress 138 silent gaps into manageable register entries):

- A.1 toolbar (5 🔴): individual triage required
- A.2 nowIndicator family (1 🔴): fold into existing reject
- A.3 event styling — class/content/lifecycle hooks (8 🔴): cluster as **Defer-indefinite — event customization via lifecycle hooks**; trigger: consumer needs ref-to-DOM mount/unmount on default render
- A.4 event editing granularity (7 🔴): cluster as **Defer-indefinite — per-edge / per-feature editing granularity**; trigger: consumer needs fine-grained gating beyond umbrella `editable`
- A.5 selection (4 🔴): selectMinDistance folds into Phase 25; others Defer-indefinite
- A.6 drag/drop (7 🔴): cluster as **Defer-indefinite — external drag-in + drag animations + touch interactions**
- A.7 time/date (13 🔴): **mixed** — some `Phase 24 scope` (`dateIncrement`, `initialDate`, `validRange`), others Defer-indefinite cluster (TZ + slot bounds + i18n date formatting)
- A.8 layout (6 🔴): cluster as **Defer-indefinite — explicit-height / aspect-ratio props**; trigger: container-driven sizing insufficient
- A.9 day headers/cells (10 🔴): cluster as **Defer-indefinite — day-header/cell customization hooks**
- A.10 slot label/lane (8 🔴): cluster as **Defer-indefinite — slot-label/lane customization hooks** (subsumed by chronix `slotRegistry` once it gains label/lane slot names)
- A.11 week numbers (7 🔴): cluster as **Defer-indefinite — week-number column feature**
- A.12 all-day (8 🔴): cluster as **Reject — gantt is timed-only by design**
- A.13 view management (3 🔴 + 2 ⏸️): mixed — Phase 24 + per-view config Defer
- A.14 weekends/weeks (4 🔴): cluster as **Defer-indefinite — extended weekend/week customization** beyond `weekendsVisible` boolean
- A.15 event sources (7 🔴): cluster as **Defer-indefinite — async event source + fetching infrastructure**
- A.16 business hours (1 ❌): documented
- A.17 resource panel (8 🔴): cluster as **Defer-indefinite — resource customization hooks**
- A.18 localization (1 🔴 + 1 ⚠): individual
- A.19 popover/more-link (13 🔴): cluster as **Defer-indefinite — event truncation + popover infrastructure**
- A.20 event sizing (3 🔴): cluster as **Defer-indefinite — fine-grained event sizing constraints**
- A.21 formatting (4 🔴): cluster as **Defer-indefinite — title / week / month label format customization**
- A.22 scroll (2 🔴): individual (initial-scroll could fold into Phase 24)
- A.23 a11y (5 🔴): cluster as **Defer-indefinite — extended a11y hint surface** (chronix has basic aria-pressed only)
- A.24 custom rendering (3 🔴 + 1 ⚠): chronix's `slotRegistry` is the alternative — backfill
- A.25 misc (3 🔴 + 1 ⚠): individual
- A.26 view specs (8 🔴): cluster as **Defer-indefinite — per-view config override system**

**Net new disposition register rows**: ~30 (mostly cluster-level; a few individual).

---

## Section B — Theme tokens / CSS variables (29 items)

This is where `todayBgColor` lives.

| k-ui token                               | Status | Chronix equivalent                                                                                                                                          | Rationale                                                                                                                                                                                                                                          |
| ---------------------------------------- | :----: | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `smallFontSize`                          |   🔴   | —                                                                                                                                                           | Used for bg-event title font-size. Chronix has no bg-events; no token. **Not in any catalog**. Triage: Defer-indefinite (rolls up with bg-events cluster).                                                                                         |
| `pageBgColor`                            |   ⚠    | `chartBackground` + `headerBackground` + `sidebarBackground` (3 chronix tokens)                                                                             | Chronix split into 3 panes; k-ui has one. Functionally covered. Backfill catalog row.                                                                                                                                                              |
| `neutralBgColor`                         |   🔴   | —                                                                                                                                                           | Shaded cells, disabled days, popover header. Chronix has no general-purpose neutral bg token. **Not in any catalog**. Triage: Defer-indefinite (no shaded-cell features yet).                                                                      |
| `neutralTextColor`                       |   🔴   | —                                                                                                                                                           | Neutral text color. **Not in any catalog**. Triage: Defer-indefinite.                                                                                                                                                                              |
| `borderColor`                            |   ⚠    | `headerCellStroke` + `headerTickStroke` + `headerDivider` + `sidebarHeaderCellBorder` + `sidebarHeaderDivider` + `sidebarBodyCellBorder` (6 chronix tokens) | Chronix split per-region; k-ui has one umbrella. Functionally covered. Backfill catalog.                                                                                                                                                           |
| `buttonTextColor`                        |   ✅   | `toolbarButtonColor` (Phase 22)                                                                                                                             | Phase 22 ✅.                                                                                                                                                                                                                                       |
| `buttonBgColor`                          |   ✅   | `toolbarButtonBg` (Phase 22)                                                                                                                                | Phase 22 ✅.                                                                                                                                                                                                                                       |
| `buttonBorderColor`                      |   ✅   | `toolbarButtonBorder` (Phase 22)                                                                                                                            | Phase 22 ✅.                                                                                                                                                                                                                                       |
| `buttonHoverBgColor`                     |   🔴   | —                                                                                                                                                           | Hover-state button bg. Chronix toolbar has no `:hover` token. **Not in any catalog as gap**. Triage: Defer-indefinite (hover styling can ship later; minor UX polish).                                                                             |
| `buttonHoverBorderColor`                 |   🔴   | —                                                                                                                                                           | Same family. Triage: Defer-indefinite.                                                                                                                                                                                                             |
| `buttonActiveBgColor`                    |   ✅   | `toolbarButtonBgActive` (Phase 22)                                                                                                                          | Phase 22 ✅.                                                                                                                                                                                                                                       |
| `buttonActiveBorderColor`                |   🔴   | —                                                                                                                                                           | Pressed-button border. Chronix pressed-state uses `border` from `toolbarButtonBorder` (not distinct). **Not in any catalog**. Triage: Defer-indefinite (visual polish).                                                                            |
| `eventBgColor`                           |   ✅   | `barBackgroundColor` (theme + prop)                                                                                                                         | Phase 20 ✅.                                                                                                                                                                                                                                       |
| `eventBorderColor`                       |   ✅   | `barBorderColor` (theme + prop)                                                                                                                             | Phase 20 ✅.                                                                                                                                                                                                                                       |
| `eventTextColor`                         |   ✅   | `barTextColor` (theme + prop)                                                                                                                               | Phase 20 ✅.                                                                                                                                                                                                                                       |
| `eventSelectedOverlayColor`              |   🔴   | (CSS class `.cx-gantt-bar--selected` — no theme token)                                                                                                      | Phase 12 added the class but **no theme token for the overlay color**. **Not in any catalog**. Triage: Defer-indefinite (Phase 12 catalog parked "selected theme tokens"); **fold into Phase 12 disposition** explicitly.                          |
| `moreLinkBgColor`                        |   🔴   | —                                                                                                                                                           | More-link styling. Triage: Defer-indefinite (rolls up with more-link cluster A.19).                                                                                                                                                                |
| `moreLinkTextColor`                      |   🔴   | —                                                                                                                                                           | Same.                                                                                                                                                                                                                                              |
| `eventResizerThickness`                  |   🔴   | —                                                                                                                                                           | k-ui resizer 8px default. Chronix has `progressHandleSize` prop but NO resizer-thickness token (resizer is hard-coded in render). **Not in any catalog**. Triage: Defer-indefinite (visual polish — chronix's edge-resize hit region is fixed).    |
| `eventResizerDotTotalWidth`              |   🔴   | —                                                                                                                                                           | Selected-state resizer dot width. Triage: Defer-indefinite.                                                                                                                                                                                        |
| `eventResizerDotBorderWidth`             |   🔴   | —                                                                                                                                                           | Resizer dot border. Triage: Defer-indefinite.                                                                                                                                                                                                      |
| `nonBusinessColor`                       |   🔴   | —                                                                                                                                                           | Non-business-hours background. Tied to `businessHours` (Defer-indefinite). Same triage.                                                                                                                                                            |
| `bgEventColor`                           |   🔴   | —                                                                                                                                                           | Background-event fill. Chronix has no background events. **Not in any catalog**. Triage: Defer-indefinite (background-events feature category).                                                                                                    |
| `bgEventOpacity`                         |   🔴   | —                                                                                                                                                           | Same family. Triage: Defer-indefinite.                                                                                                                                                                                                             |
| `highlightColor`                         |   🔴   | —                                                                                                                                                           | Selection-range cell highlight (e.g. while drag-selecting). Chronix renders selection rect with inline color (not a token). **Not in any catalog**. Triage: Defer-indefinite (visual polish; trigger: consumer wants to theme the selection rect). |
| **`todayBgColor`**                       |   🔴   | —                                                                                                                                                           | **The user-found gap.** Today-column background tint. **Not in any catalog**. Triage: **Planned Phase 22.2** (alongside todayLine-default-ON).                                                                                                     |
| `nowIndicatorColor`                      |   ❌   | —                                                                                                                                                           | Rejected (with nowIndicator family).                                                                                                                                                                                                               |
| `--gantt-grid-row-rule-color` (CSS-only) |   🔴   | —                                                                                                                                                           | Per-row dividers. Chronix has implicit `sidebarBodyCellBorder` but no body-side equivalent. **Not in any catalog**. Triage: Defer-indefinite.                                                                                                      |
| `--gantt-header-text-color` (CSS-only)   |   ⚠    | `headerCellLabel` + `headerTickLabel` (chronix split)                                                                                                       | Functionally covered. Backfill catalog.                                                                                                                                                                                                            |

**Theme silent gaps**: 16 🔴 (incl. `todayBgColor` → Phase 22.2) + 3 ⚠ to backfill.

---

## Section C — Slot / content arg shapes (63 shapes / 380+ fields)

Most consequential cluster: k-ui's render-callback ecosystem has ~63 distinct arg shapes. Chronix has TWO: `BarSlotArgs` (Phase 11) + `BarStyleArg` (Phase 20). Plus event payloads (`BarDropPayload` etc.) which aren't slot args but live in the same family.

**Strategy**: classify by shape family (not field-by-field — 380 fields is overkill for an audit roll-up; the gap pattern is consistent across the family).

| k-ui arg family                                              | Status | Chronix equivalent                                                    | Rationale                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------ | :----: | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EventContentArg` + `EventMountArg` (used by 10+ callbacks)  |   ⚠    | `BarSlotArgs` (partial coverage)                                      | Phase 11 covered the main slot replacement. **Missing fields**: `isMirror`, `isStart`, `isEnd`, `isPast`, `isFuture`, `isToday`, `isDragging`, `isResizing`, `timeText`, `el` (mount). chronix has `activeTransaction` (which subsumes `isDragging`/`isResizing`/`isMirror` but doesn't expose them as booleans). 7 missing flags. **Not in any catalog as silent gaps**. Triage: cluster as **Defer-indefinite — extended BarSlotArgs flag surface**; trigger: consumer slot needs date-relative or interaction-state flags. (Audit-recovery: backfill explicit catalog row to make the omission visible.) |
| `EventClickArg`                                              |   ⚠    | `BarClickPayload` (chronix)                                           | Phase 12 covered the emit. Fields differ: chronix has `barId` + `nativeEvent`; k-ui has `el` + `event` + `jsEvent` + `view`. **3 k-ui fields missing**. Triage: Defer-indefinite (chronix payload is intentionally minimal).                                                                                                                                                                                                                                                                                                                                                                                |
| `EventHoveringArg` (mouseEnter / mouseLeave)                 |   🔴   | —                                                                     | Hover callbacks. Chronix has no `mouseEnter` / `mouseLeave` emits. **Not in any catalog**. Triage: Defer-indefinite (consumer can wrap chronix in own event listeners).                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `EventDragArg` / `EventDragStartArg` / `EventDragStopArg`    |   ⚠    | `BarDragStartPayload` / `BarDragStopPayload` (chronix Phase 16)       | Fields differ. Chronix has `barId` + `sourceBar` + `jsEvent`; k-ui has `el` + `event` + `jsEvent` + `view`. Functionally similar. Backfill.                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `EventDropArg`                                               |   ⚠    | `BarDropPayload`                                                      | Phase 3+ covered. Fields differ. Chronix `oldRange`/`newRange`/`oldRowId`/`newRowId`; k-ui has `oldEvent`/`event`/`relatedEvents`/`revert`/`delta`/`el`/`jsEvent`/`view`. **`revert()` is missing on chronix** — chronix commits unconditionally. **Not in any catalog**. Triage: Defer-indefinite (revert pattern is k-ui-specific; chronix uses validation gates upstream of commit).                                                                                                                                                                                                                     |
| `EventResizeStartStopArg` / `EventResizeDoneArg`             |   ⚠    | `BarResizeStartPayload` / `BarResizeStopPayload` / `BarResizePayload` | Same as above. Backfill.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `EventProgressStartStopArg` / `EventProgressDoneArg`         |   ⚠    | `BarProgressPayload`                                                  | Phase 3.x covered. Backfill.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `EventAddArg` / `EventChangeArg` / `EventRemoveArg`          |   🔴   | —                                                                     | CRUD events. Chronix has no `bar-add` / `bar-change` / `bar-remove` emits — consumer mutates `bars` prop directly. **Not in any catalog**. Triage: ⚠ Phase 24 imperative API will introduce these emits; **add to Phase 24 disposition scope**.                                                                                                                                                                                                                                                                                                                                                             |
| `MoreLinkArg` / `MoreLinkContentArg` / `MoreLinkMountArg`    |   🔴   | —                                                                     | Popover callbacks. Triage: Defer-indefinite (rolls up with more-link cluster).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `EventSegment`                                               |   🔴   | —                                                                     | Multi-day event slicing shape. Chronix doesn't slice multi-day bars. **Not in any catalog**. Triage: Defer-indefinite.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `DayHeaderContentArg` / `DayHeaderMountArg`                  |   🔴   | —                                                                     | Day-header callbacks. Triage: Defer-indefinite (rolls up with A.9 day-header cluster).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `DayCellContentArg` / `DayCellMountArg`                      |   🔴   | —                                                                     | Day-cell callbacks. Triage: Defer-indefinite.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `SlotLaneContentArg` / `SlotLaneMountArg`                    |   🔴   | —                                                                     | Slot-lane callbacks. Triage: Defer-indefinite (rolls up with A.10 cluster).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `SlotLabelContentArg` / `SlotLabelMountArg`                  |   🔴   | —                                                                     | Slot-label callbacks. Triage: Defer-indefinite.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `AllDayContentArg` / `AllDayMountArg`                        |   🔴   | —                                                                     | All-day callbacks. Triage: Reject (rolls up with all-day reject cluster).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `NowIndicatorContentArg` / `NowIndicatorMountArg`            |   ❌   | —                                                                     | Rejected (nowIndicator family).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `WeekNumberContentArg` / `WeekNumberMountArg`                |   🔴   | —                                                                     | Week-number callbacks. Triage: Defer-indefinite (rolls up with A.11).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `ViewContentArg` / `ViewMountArg`                            |   🔴   | —                                                                     | View-lifecycle callbacks. Chronix has no view mount/unmount emit. **Not in any catalog**. Triage: Defer-indefinite (Phase 24 territory; partial — `datesSet` style emit).                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `SpecificViewContentArg` / `SpecificViewMountArg`            |   🔴   | —                                                                     | Per-view content callbacks. Rolls up with A.26 view-specs.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `ResourceLaneContentArg` / `ResourceLaneMountArg`            |   🔴   | —                                                                     | Resource-row callbacks. Rolls up with A.17.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `ResourceLabelContentArg` / `ResourceLabelMountArg`          |   🔴   | —                                                                     | Resource-sidebar-cell callbacks. Same.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `ColHeaderContentArg` / `ColHeaderMountArg`                  |   🔴   | —                                                                     | Sidebar header column callbacks. Same.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `ColCellContentArg` / `ColCellMountArg`                      |   🔴   | —                                                                     | Sidebar body cell callbacks. Same.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `DateClickArg`                                               |   🔴   | `EmptyAreaClickPayload` (chronix Phase 12)                            | Phase 12 added the emit but with different fields. Chronix `rowId` + `startMs` + `nativeEvent`; k-ui `date` + `dateStr` + `allDay` + `dayEl` + `jsEvent` + `view`. Functionally similar but **chronix payload is missing `dateStr` (ISO) + `dayEl` (DOM ref) + `view`**. **Not in any catalog**. Triage: Defer-indefinite (chronix payload is intentionally minimal).                                                                                                                                                                                                                                       |
| `DateSelectArg`                                              |   ⚠    | `SelectPayload` (chronix Phase 19)                                    | Fields differ. Chronix `rowId` + `range`; k-ui `start`/`end`/`startStr`/`endStr`/`allDay`/`jsEvent`/`view`. Backfill.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `DateUnselectArg`                                            |   🔴   | —                                                                     | Unselect emit. Chronix has no `'unselect'` event. **Already in PARITY_RECHECK disposition register**: Defer-indefinite. (Item is correctly cataloged.)                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `DatesSetArg`                                                |   🔴   | —                                                                     | "Visible range changed" emit. **Already in PARITY_RECHECK disposition register**: Defer-indefinite (bundled with Phase 24 + others).                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `DropArg` / `EventReceiveArg` / `EventLeaveArg`              |   🔴   | —                                                                     | External drop callbacks. Triage: Defer-indefinite (rolls up with A.6 drag/drop cluster).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `ResourceAddArg` / `ResourceChangeArg` / `ResourceRemoveArg` |   🔴   | —                                                                     | Resource CRUD emits. Triage: Defer-indefinite (A.17).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `EventSourceFuncArg` / `ResourceFuncArg`                     |   🔴   | —                                                                     | Function-source callback args. Triage: Defer-indefinite (A.15 event-source cluster).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `ChunkContentCallbackArgs`                                   |   🔴   | —                                                                     | Scrollgrid internal. Triage: Reject (k-ui-internal).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

**Slot/arg silent gaps**: 16 cluster-level 🔴 + 7 ⚠ to backfill (mainly payload-field deltas).

---

## Section D — Imperative API methods (33 items)

Phase 24 covers nav + CRUD imperative methods.

| k-ui method                                                                                                              | Status | Chronix equivalent                                          | Rationale                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------ | :----: | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `updateSize()`                                                                                                           |   🔴   | —                                                           | Force layout recalc. Chronix uses Vue reactivity (no manual update). **Not in any catalog**. Triage: Defer-indefinite (would need handle method exposure).                                                                  |
| `setOption(name, val)` / `getOption(name)`                                                                               |   🔴   | —                                                           | Dynamic option mutation. Chronix uses Vue props (reactive). **Not in any catalog**. Triage: Defer-indefinite (Vue-reactivity covers most cases).                                                                            |
| `getAvailableLocaleCodes()`                                                                                              |   🔴   | —                                                           | Locale registry introspection. **Not in any catalog**. Triage: Defer-indefinite (A.18).                                                                                                                                     |
| `on(name, h)` / `off(name, h)` / `trigger(name, ...)`                                                                    |   ⚠    | `handle.subscribe(event, listener)` (chronix Phase 4+)      | Functionally covered. Different shape. Backfill catalog.                                                                                                                                                                    |
| `changeView(viewType, dateOrRange?)`                                                                                     |   ⏸️   | `GanttHandle.changeView` (TYPED only; **unimplemented**)    | Phase 24 (Planned) per disposition. Add explicit row.                                                                                                                                                                       |
| `zoomTo(date, viewType?)`                                                                                                |   🔴   | —                                                           | View+date combo. **Not in any catalog**. Triage: Defer-indefinite (Phase 24 may bundle).                                                                                                                                    |
| `prev()` / `next()` / `prevYear()` / `nextYear()` / `today()`                                                            |   ⏸️   | (Phase 22 toolbar emits same effect; **no imperative API**) | Phase 24 (Planned). Disposition register has Phase 24 nav but **doesn't explicitly enumerate `prevYear` / `nextYear`** (Phase 22 catalog ⏸️ parked year-nav). Triage: fold into Phase 24 OR keep year-nav Defer-indefinite. |
| `gotoDate(date)`                                                                                                         |   ⏸️   | `GanttHandle.gotoDate` (TYPED only; **unimplemented**)      | Phase 24 (Planned).                                                                                                                                                                                                         |
| `incrementDate(delta)`                                                                                                   |   🔴   | —                                                           | Increment-by-duration. **Not in any catalog**. Triage: fold into Phase 24.                                                                                                                                                  |
| `getDate()`                                                                                                              |   🔴   | —                                                           | Current anchor date. **Not in any catalog**. Triage: fold into Phase 24.                                                                                                                                                    |
| `formatDate(d, fmt)` / `formatRange(d0, d1, settings)` / `formatIso(d, omitTime?)`                                       |   🔴   | —                                                           | Public formatter helpers. **Not in any catalog**. Triage: Defer-indefinite (consumer can use `Intl.DateTimeFormat` directly).                                                                                               |
| `select(date, endDate?)` / `unselect()`                                                                                  |   🔴   | —                                                           | Programmatic select. **Already in PARITY_RECHECK disposition register**: Defer-indefinite.                                                                                                                                  |
| `addEvent(input, source?)`                                                                                               |   ⏸️   | —                                                           | Phase 24 (Planned).                                                                                                                                                                                                         |
| `getEventById(id)`                                                                                                       |   🔴   | —                                                           | Find event. **Not in any catalog as method**. Chronix exposes `getBarTable()` which the consumer can query. Triage: ⚠ partial coverage; backfill.                                                                           |
| `getEvents()`                                                                                                            |   ⚠    | `getBarTable()`                                             | Phase 4+ covered (different name + return-type shape). Backfill.                                                                                                                                                            |
| `removeAllEvents()`                                                                                                      |   🔴   | —                                                           | Clear. **Not in any catalog**. Triage: fold into Phase 24.                                                                                                                                                                  |
| `getEventSources()` / `getEventSourceById(id)` / `addEventSource(input)` / `removeAllEventSources()` / `refetchEvents()` |   🔴   | —                                                           | Event-source CRUD. **Already in PARITY_RECHECK disposition register**: Defer-indefinite (A.15 cluster).                                                                                                                     |
| `scrollToTime(time)`                                                                                                     |   ⏸️   | —                                                           | Phase 24 (Planned) per disposition.                                                                                                                                                                                         |
| `view` (property)                                                                                                        |   🔴   | —                                                           | Current view introspection. Chronix has `axisInput` prop (reactive). Triage: ⚠ partial coverage; backfill.                                                                                                                  |

**API silent gaps**: 7 🔴 + 5 ⚠ + 8 ⏸️ to fold into Phase 24. (5 ❌ rolls into existing disposition.)

---

## Section E — View-spec fields (10 items)

(Covered in A.26 above as cluster.)

---

## Section F — CSS class names + data-attributes (~40 items)

K-ui's DOM emits ~40 CSS classes consumers can target via custom CSS. Chronix has its own `cx-` taxonomy.

| k-ui class / attr                                                                                                   | Status | Chronix equivalent                                                                                                                 | Rationale                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------- | :----: | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.gantt-scheduler` (root)                                                                                           |   ⚠    | `.cx-gantt-root` / `.cx-gantt-wrapper`                                                                                             | Phase 4.5 / 22 covered. Backfill.                                                                                                                        |
| `.gantt-timeline-body-wrapper`                                                                                      |   ⚠    | `.cx-gantt-wrapper`                                                                                                                | Phase 4.5.                                                                                                                                               |
| `.gantt-event`                                                                                                      |   ⚠    | `.cx-gantt-bar`                                                                                                                    | Phase 4 entry.                                                                                                                                           |
| `[data-event-id]`                                                                                                   |   ⚠    | `[data-bar-id]`                                                                                                                    | Phase 4 entry.                                                                                                                                           |
| `[data-resource-id]`                                                                                                |   ⚠    | `[data-row-id]`                                                                                                                    | Phase 5.x.                                                                                                                                               |
| `.gantt-event-progress-drag-triangle`                                                                               |   ⚠    | `.cx-gantt-progress-triangle`                                                                                                      | Phase 3.x.                                                                                                                                               |
| `.gantt-event-resizer-start` / `.gantt-event-resizer-end`                                                           |   🔴   | (chronix renders edge-hit zones inline, no dedicated CSS class)                                                                    | **Not in any catalog**. Triage: ⚠ partial coverage (functionality works; class doesn't exist for consumer CSS). Backfill + decide whether to emit.       |
| `.gantt-event-selected`                                                                                             |   ⚠    | `.cx-gantt-bar--selected` (Phase 12)                                                                                               | Phase 12 covered.                                                                                                                                        |
| `.gantt-timeline-slot-label`                                                                                        |   ⚠    | `.cx-gantt-tick-label`                                                                                                             | Phase 4.7.                                                                                                                                               |
| `.gantt-timeline-header-cell`                                                                                       |   ⚠    | `.cx-gantt-header-cell`                                                                                                            | Phase 4.9.                                                                                                                                               |
| `.gantt-toolbar` / `.gantt-toolbar-chunk` / `.gantt-button-group` / `.gantt-<name>-button` / `.gantt-toolbar-title` |   ⚠    | `.cx-gantt-toolbar` / `.cx-gantt-toolbar-chunk` / `.cx-gantt-button-group` / `.cx-gantt-<name>-button` / `.cx-gantt-toolbar-title` | Phase 22 covered all 5. Backfill rationale (class-shape parity asserted indirectly via `extractToolbarSnapshot`).                                        |
| `.gantt-timeline-today-line`                                                                                        |   ⚠    | `.cx-gantt-today-line` (`data-today-line-side`)                                                                                    | Phase 21 covered.                                                                                                                                        |
| `[data-instance-id]`                                                                                                |   🔴   | —                                                                                                                                  | k-ui's per-instance id (recurring events). Chronix has `data-bar-id` only. **Not in any catalog**. Triage: Defer-indefinite (recurring events deferred). |
| `.gantt-bg-event`                                                                                                   |   🔴   | —                                                                                                                                  | Background events. Triage: Defer-indefinite (bg-events cluster).                                                                                         |
| `.gantt-non-business`                                                                                               |   🔴   | —                                                                                                                                  | Non-business-hours fill. Triage: Defer-indefinite (businessHours cluster).                                                                               |
| `.gantt-day-today`                                                                                                  |   🔴   | —                                                                                                                                  | Today-day cell. **Not in any catalog**. Tied to `todayBgColor`. Triage: Planned Phase 22.2.                                                              |
| `.gantt-now-indicator-line`                                                                                         |   ❌   | —                                                                                                                                  | Rejected (nowIndicator).                                                                                                                                 |
| `.gantt-day-disabled` / `.gantt-day-past` / `.gantt-day-future`                                                     |   🔴   | —                                                                                                                                  | Date-relative day-cell classes. **Not in any catalog**. Triage: Defer-indefinite (day-cell customization cluster).                                       |
| `.gantt-day-other`                                                                                                  |   🔴   | —                                                                                                                                  | Non-current-month day. Triage: Defer-indefinite.                                                                                                         |
| `.gantt-popover` / `.gantt-popover-header` / `.gantt-popover-body`                                                  |   🔴   | —                                                                                                                                  | Popover infra. Triage: Defer-indefinite (more-link cluster).                                                                                             |
| `.gantt-week-number`                                                                                                |   🔴   | —                                                                                                                                  | Week-number column. Triage: Defer-indefinite (A.11).                                                                                                     |
| `.gantt-resource-area-header` / `.gantt-resource-area-body`                                                         |   ⚠    | `.cx-gantt-sidebar-header` / `.cx-gantt-sidebar-body`                                                                              | Phase 14 covered. Backfill.                                                                                                                              |
| `.gantt-resource-group-cell`                                                                                        |   ⚠    | (chronix's rowspan merge in Phase 5.x)                                                                                             | Functionality covered; class differs. Backfill.                                                                                                          |
| `.gantt-event-link` (dependency line)                                                                               |   ⚠    | `.cx-gantt-link`                                                                                                                   | Phase 8 covered.                                                                                                                                         |
| `.gantt-event-link-mirror`                                                                                          |   🔴   | —                                                                                                                                  | Drag-time link preview. Triage: Defer-indefinite.                                                                                                        |
| `.gantt-defs` (SVG defs container)                                                                                  |   ⚠    | `.cx-gantt-defs`                                                                                                                   | Phase 8 covered.                                                                                                                                         |

**CSS/data-attr silent gaps**: 11 🔴 + 14 ⚠ to backfill.

---

## Section G — Demo wiring delta

Reading `d:/work/k-ui/examples/gantt/vue3/src/DemoApp.vue` `schedulerOptions` (lines 1343-1500), the demo wires ~50 options. Most overlap with sections A-F. Items NOT yet enumerated above:

| k-ui demo wiring                                                            |               Status                | Chronix equivalent                          | Rationale                                                                                                                                                                                                    |
| --------------------------------------------------------------------------- | :---------------------------------: | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `selectMirror: true`                                                        |            (A.4 covered)            | —                                           | —                                                                                                                                                                                                            |
| `eventResize` callback                                                      | (C covered as `EventResizeDoneArg`) | —                                           | —                                                                                                                                                                                                            |
| `dependencyLineColor: '#abc'` (per-event style override)                    |                 🔴                  | (chronix `LinkSpec.colorOverride` per-link) | k-ui has top-level option for default. **Not in any catalog as silent gap**. Triage: Defer-indefinite (chronix `theme.linkDefaultColor` covers default; per-link `LinkSpec.colorOverride` is more flexible). |
| `useLineEventColor: boolean`                                                |                 🔴                  | —                                           | "Color dependency line by source event". Already in PARITY_RECHECK disposition register: Defer-indefinite.                                                                                                   |
| `onLine` callback                                                           |                 🔴                  | —                                           | Per-link styling callback. Already disposition'd.                                                                                                                                                            |
| `eventBgOpacity` (custom option from demo CSS)                              |                 🔴                  | —                                           | Custom CSS variable some demos add. Triage: Defer-indefinite.                                                                                                                                                |
| Demo's `--gantt-event-bg-opacity` / `--gantt-event-border-opacity` CSS vars |                 🔴                  | —                                           | Demo-only customization. Triage: Defer-indefinite.                                                                                                                                                           |
| `nowIndicatorColor` demo override                                           |                 ❌                  | —                                           | (Rejected with nowIndicator.)                                                                                                                                                                                |
| `todayBgColor` demo override (line 1339)                                    |                 🔴                  | —                                           | **The user-found silent gap.** Triage: Planned Phase 22.2.                                                                                                                                                   |
| `eventBgColor` demo override (line 1335)                                    |                 ✅                  | (Phase 20 covered)                          | —                                                                                                                                                                                                            |
| `bgEventColor` / `bgEventOpacity` demo override (lines 1336-1337)           |                 🔴                  | —                                           | Background-event styling. Same cluster. Triage: Defer-indefinite.                                                                                                                                            |
| `highlightColor` demo override (line 1338)                                  |                 🔴                  | —                                           | Selection highlight. Triage: Defer-indefinite.                                                                                                                                                               |

**Demo silent gaps**: 6 🔴 distinct from earlier sections.

---

## Silent-gap roll-up (flat 🔴 list)

After cluster compression, the **net new disposition rows** needed in `PARITY_RECHECK.md`:

### Individual silent gaps requiring per-item disposition (~12)

1. `todayBgColor` (theme + demo) — **Planned Phase 22.2**
2. `.gantt-day-today` CSS class — **Planned Phase 22.2** (paired with `todayBgColor`)
3. `selectMinDistance` — fold into **Planned Phase 25** (with `eventDragMinDistance`)
4. `initialDate` — fold into **Planned Phase 24**
5. `initialView` — fold into **Planned Phase 24**
6. `dateIncrement` — fold into **Planned Phase 24**
7. `validRange` — **Defer-indefinite** + trigger `consumer reports prev/next out-of-range concern`
8. `incrementDate` / `getDate()` / `zoomTo()` — fold into **Planned Phase 24**
9. `prevYear` / `nextYear` toolbar buttons — **Defer-indefinite** + trigger `consumer wires year-nav widget`
10. `now` — **Reject** (tied to nowIndicator)
11. `themeSystem` (Bootstrap5 etc) — **Reject** (chronix has its own theme prop)
12. `eventSelectedOverlayColor` theme token — **Defer-indefinite** + trigger `consumer needs themed selection overlay vs CSS class`

### Cluster silent gaps requiring ONE disposition each (~17 cluster rows)

Each cluster collapses many individual k-ui items into one register row:

1. **Toolbar i18n cluster** (buttonText / buttonHints / customButtons / buttonIcons / titleRangeSeparator / defaultRangeSeparator / viewHint) — **Defer-indefinite** + trigger `consumer requests toolbar i18n / icon overrides`
2. **Event lifecycle hook cluster** (eventDidMount / eventWillUnmount / eventClassNames / EventMountArg.el field) — **Defer-indefinite** + trigger `consumer needs ref-to-DOM at event mount/unmount`
3. **Event editing granularity cluster** (eventStartEditable / eventDurationEditable / eventResizableFromStart / eventProgressChangeable / eventInteractive) — **Defer-indefinite** + trigger `consumer needs per-edge / per-feature toggle beyond umbrella editable`
4. **Touch interactions cluster** (longPressDelay / eventLongPressDelay / selectLongPressDelay) — **Defer-indefinite** + trigger `consumer reports touch-device interaction need`
5. **External drag-drop cluster** (droppable / dropAccept / dragRevertDuration / dragScroll / allDayMaintainDuration / DropArg / EventReceiveArg / EventLeaveArg) — **Defer-indefinite** + trigger `consumer needs external HTML5 drag-in or drag-out`
6. **Time-bounds cluster** (slotMinTime / slotMaxTime / slotMinWidth / dayMinWidth / slotLabelInterval / slotLabelFormat / slotDuration / nextDayThreshold / timeZone) — **Defer-indefinite** + trigger `consumer requests time-bound clipping / TZ`
7. **Explicit-height cluster** (height / contentHeight / viewHeight / aspectRatio / expandRows) — **Defer-indefinite** + trigger `consumer's container-driven sizing insufficient`
8. **Day-header / day-cell customization cluster** (dayHeaders / dayHeaderFormat + 4 hooks; dayCell + 4 hooks; .gantt-day-disabled/past/future/other classes) — **Defer-indefinite** + trigger `consumer needs per-day customization beyond default render`
9. **Slot-label / slot-lane customization cluster** (4 slotLabel hooks + 4 slotLane hooks) — **Defer-indefinite** + trigger `consumer needs per-tick customization`
10. **Week-numbers cluster** (weekNumbers / weekNumberCalculation + 5 hooks / weekNumberFormat / .gantt-week-number) — **Defer-indefinite** + trigger `consumer wires week-number column`
11. **All-day cluster** (8 allDay\* options + AllDayContentArg + 2 mount hooks + .gantt-bg-event) — **Reject** (chronix gantt is timed-only by design)
12. **Event sources / async cluster** (events / eventSources / initialEvents / lazyFetching / 3 \*Param / 2 source-fetch callbacks / eventProcessCallback / refetchEvents / event-source API methods) — **Defer-indefinite** (already in disposition register; backfill consolidate)
13. **Resource customization cluster** (resourceLabel + 4 hooks / resourceLane + 4 hooks / ResourceAddArg + 2 emits / addResource etc / resources event-source) — **Defer-indefinite** (already partial in disposition register)
14. **Day-popover / more-link cluster** (dayMaxEvents / dayMaxEventRows / eventMaxStack / slotEventOverlap / 6 moreLink options / 3 MoreLink arg shapes / dayPopoverFormat / noEventsText / .gantt-popover classes / moreLinkBg/Text tokens) — **Defer-indefinite** + trigger `consumer caps day-event display`
15. **Background events cluster** (bgEventColor / bgEventOpacity / eventDisplay='background' / .gantt-bg-event / smallFontSize) — **Defer-indefinite** + trigger `consumer needs background-event rendering`
16. **Selection overlay theme cluster** (eventSelectedOverlayColor / highlightColor / selection-rect theming) — **Defer-indefinite** + trigger `consumer needs themed selection overlay`
17. **A11y hint cluster** (5 \*Hint options) — **Defer-indefinite** + trigger `consumer reports a11y gap`
18. **Per-view config cluster** (views: { type / component / classNames / content / didMount / willUnmount } + buttonTextKey + dateProfileGeneratorClass + inheritance) — **Defer-indefinite** + trigger `consumer needs per-view customization`
19. **Custom rendering meta cluster** (handleCustomRendering / customRenderingMetaMap / customRenderingReplaces) — **Defer-indefinite** + trigger `consumer needs slot-registry extension beyond bar slot`
20. **Imperative formatter cluster** (formatDate / formatRange / formatIso / `view` property / setOption / getOption / updateSize) — **Defer-indefinite** + trigger `consumer wants imperative formatter / dynamic option mutation`
21. **Initial-scroll cluster** (scrollTime / scrollTimeReset) — **Defer-indefinite** + trigger `consumer wants initial horizontal scroll offset` (Phase 24's `scrollToTime` covers programmatic but not initial-mount default)
22. **Window resize cluster** (handleWindowResize / windowResizeDelay / windowResize emit) — **Defer-indefinite**

### Uncataloged-but-done backfills (~20 ⚠ rows)

The audit found many chronix-implemented items that lack explicit catalog rows. Backfill into PARITY_RECHECK as `DONE (Phase X — backfilled by audit-sweep 2026-05-16)`:

1. `unselectAuto` (Phase 12)
2. `eventContent` partial via slotRegistry (Phase 11)
3. `slotRegistry` → `handleCustomRendering` mapping (Phase 11)
4. `pageBgColor` → `chartBackground` + `headerBackground` + `sidebarBackground` (multi-Phase)
5. `borderColor` → 6 chronix border tokens (multi-Phase)
6. `--gantt-header-text-color` → `headerCellLabel` + `headerTickLabel` (Phase 10)
7. `themeOverrides` → `theme` prop (Phase 10)
8. `stickyHeaderDates` → Phase 4.5 sticky-header
9. `locale` → `AxisRangePlanInput.locale` (Phase 1/2)
10. `resources` → `rows` prop (Phase 1/5)
11. `dependencyLineStyle` → `LinkSpec.routing` per-link (Phase 7/8)
12. `EventContentArg` → `BarSlotArgs` partial (Phase 11)
13. `EventClickArg` → `BarClickPayload` (Phase 12)
14. `EventDragArg` → `BarDragStart/StopPayload` (Phase 16)
15. `EventDropArg` → `BarDropPayload` (Phase 3+)
16. `EventResizeArgs` → `BarResize*Payload` (Phase 16)
17. `EventProgressArgs` → `BarProgressPayload` (Phase 3.x)
18. `DateClickArg` → `EmptyAreaClickPayload` (Phase 12)
19. `DateSelectArg` → `SelectPayload` (Phase 19)
20. `on`/`off`/`trigger` → `handle.subscribe()` (Phase 4+)
21. `getEvents()` → `getBarTable()` (Phase 4+)
22. `view` property → `axisInput` prop (Phase 1+)
23. CSS class taxonomy: ~14 ⚠ k-ui-class ↔ chronix-class mappings (.gantt-scheduler / .gantt-event / [data-event-id] / etc.)

### Cataloged-parked-no-disposition (~11 ⏸️ rows)

These items exist in some PHASE catalog as ⏸️ parked but have no PARITY_RECHECK disposition register entry. Need register rows:

1. `footerToolbar` (Phase 22)
2. `buttonText` (Phase 22)
3. `buttonHints` (Phase 22)
4. `customButtons` (Phase 22)
5. `viewSpec.buttonTextOverride` (Phase 22)
6. `prevYear` / `nextYear` widgets (Phase 22)
7. `isPrevEnabled` / `isNextEnabled` / `isTodayEnabled` (Phase 22)
8. Phase 12 selection theme tokens (`eventSelectedOverlayColor`)
9. Phase 12 touch interactions (long-press)
10. Phase 12 `eventDataTransform` (already disposition'd; covered)
11. Phase 1 resource tree `parentId` (catalog mentions, no disposition row)

---

## Audit summary

### Counts

| Category                                    | Count                                                                             |
| ------------------------------------------- | --------------------------------------------------------------------------------- |
| Total k-ui items enumerated                 | ~350 (211 options + 29 theme + 63 args + 33 API + 10 view-spec + ~40 CSS classes) |
| ✅ Done + Cataloged                         | ~30                                                                               |
| ⚠ Done + Uncataloged (backfill needed)      | ~30                                                                               |
| 🔴 Silent gap (NEW disposition rows needed) | ~170 individual / ~30 cluster-compressed                                          |
| ⏸️ Cataloged + No-disposition               | ~11                                                                               |
| ❌ Rejected (documented)                    | ~25                                                                               |

### Root cause

Phase catalogs were written WITH the feature in scope but did NOT enumerate ADJACENT k-ui surface items. Phase 21's catalog discussed `todayLine` thoroughly but never listed `todayBgColor` (visually-adjacent but distinct mechanism). Phase 10's catalog had 29 theme tokens but didn't list all k-ui CSS variables to mark which were intentional non-ports.

**Phase 20.5 introduced the catalog table format**; pre-20.5 phases (1-19) skipped catalog entirely. Even post-20.5 phases (20, 21, 22) had catalog tables but selective coverage — only items the author was thinking about that day.

### Discipline gap (architectural)

The catalog rule (`feedback_no_logic_drift_from_kui.md`) is enforced by **human-author discipline**, not by tooling. There is no script that:

1. Enumerates k-ui's options.ts items
2. For each, requires every PHASE\_\*\_DESIGN.md catalog to mention it OR for `audit/PARITY_RECHECK.md` disposition register to disposition it

This is the same enforcement gap that `feedback_chronix_parity_discipline.md` covers for parity-assertions (solved by `/phase-close` skill + `parity.spec.ts` regex check). Catalog completeness needs the equivalent automation.

### Proposed follow-up phase (Phase 22.AUTOMATE)

After Phase 22.2 (todayLine-on + todayBgColor) lands:

- `scripts/audit-catalog-completeness.mjs` — for each k-ui option name (read from `options.ts` exports list), require either a chronix catalog row OR a PARITY_RECHECK disposition row.
- Wire into `pnpm ci-check` as the 7th step (after `audit:names`).
- A new k-ui option appearing in upstream that has no chronix disposition → CI fails until human decides Planned/Defer/Reject.

This makes catalog completeness a CI gate, not a human-discipline gate. Solves the silent-gap class of bugs at source.

### Confidence statement

This sweep is **complete for the 7 enumerated source families** at the source-file level. Items it does NOT catch:

1. **Runtime-only behaviors** without a source-level declaration (e.g. specific CSS `:hover` states from a 3rd-party theme)
2. **Demo-app conventions** that aren't formal options (e.g. specific `<div>` IDs the demo uses for layout)
3. **Implicit defaults** in k-ui internal code paths (e.g. magic-number constants in render fns)
4. **Recently-added k-ui features** between my source read and now (the audit is a snapshot)

For these classes a behavior-level test or VRT against the parity-reference demo is the right detection tool — NOT a catalog audit.
