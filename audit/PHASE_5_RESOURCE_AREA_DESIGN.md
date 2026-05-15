# Phase 5 — ResourceArea sidebar design note

**Status**: **DONE (2026-05-15)**. Landed as 4 commits: `8d14377` (k-ui behavior catalog), `d378b3d` (structural), `8d9648a` (sticky-left + z-index ladder), `45403f3` (demo wiring + VRT rebaseline). Browser-verified end-to-end. See `audit/journal/2026-05-13.md` "Phase 5" section for the post-mortem write-up.

## Problem

`<ChronixGantt>` currently renders a single chart pane: header + body, no
resource panel on the left. The reference demo has a tabular sidebar
(地区 / 基地 / 车间) listing each leaf resource's hierarchy across columns,
visually anchored to the left of the chart and pinned during horizontal
scroll. Rows in the sidebar align 1:1 with bar strips in the body, so
the user can read "this bar belongs to row X" by tracking horizontally
across the divider.

Phase 4.5 made the chart wrapper a single `overflow: auto` scrollport
with a sticky header. The Z mechanism extends to two axes — adding
a `position: sticky; left: 0` sidebar gives us a 3-pane layout (sidebar,
header, body) with all scroll-pinning handled by CSS, no JS sync.

The `RowSpec.columns: Readonly<Record<string, string | number | undefined>>`
field is already in the public IR — the demo's `sampleRows` populates
`{ name: '车间 A' }` etc. The sidebar simply has to render this map
column-by-column for each row.

## Approaches considered

### A. CSS grid wrapper, 2×2 sticky panes

```html
<div
  class="cx-gantt-wrapper"
  style="overflow: auto; display: grid; grid-template-columns: ${sidebarWidth}px 1fr;"
>
  <!-- top-left: sidebar header (sticky top + sticky left, z-index 3) -->
  <div class="cx-gantt-sidebar-header" style="position: sticky; top: 0; left: 0; z-index: 3;">
    ...column headers...
  </div>
  <!-- top-right: chart header (sticky top, z-index 2) -->
  <svg class="cx-gantt-header" style="position: sticky; top: 0; z-index: 2;">
    ...header rows + ticks...
  </svg>
  <!-- bottom-left: sidebar body (sticky left, z-index 1) -->
  <div class="cx-gantt-sidebar-body" style="position: sticky; left: 0; z-index: 1;">
    ...resource rows...
  </div>
  <!-- bottom-right: chart body -->
  <svg class="cx-gantt-body">...bars...</svg>
</div>
```

- **Pros**: One scroll container, no JS scroll-sync, four panes each
  pinned correctly by CSS. Extends Phase 4.5's Z mechanism naturally.
  Z-index ladder (3 > 2 > 1) ensures the top-left corner stays above
  the row labels and the time axis when both axes scroll.
- **Cons**: Sidebar rendered as HTML divs (not SVG); we now have two
  rendering models in one wrapper. Acceptable — sidebar is plain text,
  HTML's typography is the right tool.

### B. Reference's split-pane approach (separate scroll containers)

Reference has `.gantt-timeline-{header,body}-{left,right}` as four
independent panes inside a CSS grid, with JS code syncing scroll
positions between header-right and body-right (horizontal) and
body-left and body-right (vertical).

- **Pros**: Each pane owns its overflow; gives more knobs (e.g. you
  can hide the sidebar's vertical scrollbar while keeping the body's).
- **Cons**: Three scroll sync handlers to write + maintain. CSS sticky
  achieves the same UX with zero JS. Reference uses this approach
  largely for historical reasons (predates `position: sticky`).

### C. Separate `<ChronixResourceArea>` component

Render the sidebar as a sibling component that the consumer composes
manually next to `<ChronixGantt>`.

- **Pros**: Single-responsibility components; consumers wire scroll
  sync if they need it.
- **Cons**: Pushes the alignment + scroll-sync burden onto every
  consumer. Defeats the point of a "gantt component". Bundle as one
  component for now; users who want the panes separately can fork
  the render function.

**Recommendation**: A.

## Decision criteria

1. **API surface**: A keeps `<ChronixGantt>` as the single mountable
   unit; the sidebar appears when `columns` prop is set and disappears
   when not. Consumers who don't want a sidebar pay zero cost.
2. **Tree grouping** (heading levels via rowspan, like reference's
   "海口 → 空港维修基地 → 9车间"): NOT in v0. The current `RowSpec[]`
   is a flat list; supporting tree-grouping with `rowspan` merge
   cells requires a layout pre-pass that groups adjacent rows by
   shared column values. Park as v1.
3. **Sidebar width**: Per-column-width sum is the natural choice.
   `columns: ColumnSpec[]` where `ColumnSpec = { key: string; label: string; width: number }`.
   Total sidebar width = `sum(columns.map(c => c.width))`. v0 doesn't
   support resizable columns.
4. **Pointer interactions on the sidebar**: v0 has none. The sidebar
   is read-only display. Future: row-click to scroll the body to that
   row, expand/collapse for tree grouping.

## Component API after Phase 5

```ts
interface ColumnSpec {
  /** Key into `RowSpec.columns` map to read the cell value. */
  readonly key: string;
  /** Header label shown in the sidebar's top-left cell. */
  readonly label: string;
  /** Column width in CSS pixels. */
  readonly width: number;
}

<ChronixGantt
  :bars="bars"
  :rows="rows"
  :axis-input="axisInput"
  :columns="columns"        // NEW — optional. When omitted, no sidebar renders.
  ...
/>
```

Existing props stay. Existing event emits stay. The component renders
in two modes:

- **Without `columns`**: same DOM as Phase 4.5 (wrapper > header SVG +
  body SVG). No sidebar.
- **With `columns`**: wrapper switches to CSS grid; sidebar header
  (top-left) + sidebar body (bottom-left) added.

## Execution plan — 3 commits with browser-verify pauses

### Commit 1: structural — add sidebar div, no sticky yet

- Add `columns?: ColumnSpec[]` prop to `<ChronixGantt>`.
- When `columns` is set:
  - Render `<div class="cx-gantt-sidebar-header">` (top-left) with
    column-header cells, height = total header band height.
  - Render `<div class="cx-gantt-sidebar-body">` (bottom-left) with
    one row per strip, each row's height = `strip.height`, plus
    `gap: rowSpacing` between rows (matching the body's `rowSpacing`).
  - Each row contains one cell per column reading `row.columns[col.key]`.
  - Wrapper becomes `display: grid; grid-template-columns: ${sidebarWidth}px 1fr`
    when `columns` set; otherwise unchanged (`display: block`).
- No CSS sticky on the sidebar yet — it just sits in normal flow.
- ~10 new SFC tests asserting: sidebar header + body render; cells
  carry the right text from `row.columns[key]`; sidebar absent when
  `columns` not set; sidebar row heights match strip heights.
- ci-check green → commit + push → **PAUSE for browser verify**: load
  the example app with a `columns` prop wired, confirm the sidebar
  appears on the left with the right labels and heights.

### Commit 2: sticky-left + z-index layering

- Add inline `position: sticky; left: 0` on both sidebar elements.
- Add inline `z-index` ladder: sidebar-header `3`, chart-header `2`,
  sidebar-body `1`, body `auto`.
- Add opaque `background` on both sidebar elements (same reason as
  the header: keep body bars from bleeding through during horizontal
  scroll).
- ~3 new SFC tests asserting the inline contract: sidebar-header has
  `position: sticky; top: 0; left: 0`; sidebar-body has
  `position: sticky; left: 0`; z-index ladder is monotone.
- ci-check green → commit + push → **PAUSE for browser verify**:
  scroll horizontally (week / year view), confirm sidebar stays put.
  Scroll vertically, confirm sidebar header stays at top.
  Scroll diagonally, confirm the top-left corner stays in place
  while the other three panes scroll appropriately.

### Commit 3: example app wires `columns` + VRT update

- Add `columns` to the example app's `<ChronixGantt>` props: e.g.
  `[{ key: 'name', label: '车间', width: 100 }]`.
- Verify the demo at 8702 still looks coherent across all 6 views.
- Re-baseline the 5 chronix VRT PNGs to include the sidebar (PNGs
  grow by ~100px wide).
- Update `chronix-visual.spec.ts` if its `width: max-content` CSS
  override breaks the grid layout (CSS grid + `width: max-content`
  needs `grid-template-columns` honoring `auto` for max-content to
  propagate — may need an explicit override).
- ci-check green → commit + push → **PAUSE for user to review the 5
  new baselines.**

## Estimated scope

- Component refactor + props: ~2 hours
- Sticky positioning + z-index tuning: ~1 hour
- SFC tests: ~2 hours
- Example app wiring: ~30 min
- VRT rebaseline: ~30 min
- Journal + docs: ~30 min
- Total: ~6-7 hours focused work

## K-ui resource-panel behavior catalog (drift tracking)

Read from `packages/gantt/src/resource-timeline/ResourceList.tsx`
(573 lines, the reference's resource-panel implementation). Every
listed sub-behavior is mapped to chronix's current state:

- ✅ **done** — implemented in chronix Phase 5 v0.
- ⏸️ **parked** — explicit deferral with a target phase noted.
- ❌ **rejected** — intentionally not coming to chronix, reason stated.

Adding any new sub-behavior in chronix MUST update this catalog so
future maintainers see the full diff in one place. Removing a parked
item without delivering it MUST be justified here too — silent
drops are the failure mode this catalog exists to prevent.

| #   | k-ui behavior                                                                                                                             | chronix v0                                                                                         | Disposition                                                                                                                                                                                              |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Multi-column table with `<colgroup>` + `<tbody>`                                                                                          | actual `<table>` with `<colgroup>` + `<thead>` + `<tbody>` (switched in Phase 5.x for rowspan)     | ✅ done — Phase 5.x adopted the reference's exact DOM shape                                                                                                                                              |
| 2   | Per-column pixel widths or `auto`                                                                                                         | `ColumnSpec.width: number` (px only)                                                               | ✅ done for fixed widths; ❌ auto-width rejected (consumers compute and pass exact widths; keeps the layout deterministic for VRT)                                                                       |
| 3   | `rowSpan`-based group cells (parent value merged across N consecutive child rows)                                                         | `computeRowSpans()` pre-pass + `<td rowspan=N>` on the leading row; absorbed rows emit no DOM      | ✅ done — Phase 5.x (commit `e3362dc`)                                                                                                                                                                   |
| 4   | Expand/collapse state for groups (`expandedGroups: Set<string>`)                                                                          | n/a (no groups yet)                                                                                | ⏸️ parked — lands with #3                                                                                                                                                                                |
| 5   | Standalone group row mode (group nodes become `<tr colSpan=N>`)                                                                           | n/a                                                                                                | ⏸️ parked — lands with #3                                                                                                                                                                                |
| 6   | vGrouping mode (groups as rowSpan-merged columns vs separate rows)                                                                        | `ColumnSpec.group?: boolean` toggles the merge; reference auto-detects via any `group: true` col   | ✅ done — Phase 5.x (commit `e3362dc`)                                                                                                                                                                   |
| 7   | Custom cell content callback `colSpec.cellContent(resource)`                                                                              | v0 hard-codes `String(row.columns[key])`                                                           | ⏸️ parked — Phase 5.y "custom renderers". Needs `ColumnSpec.cellContent?: (row: RowSpec) => VNode \| string`                                                                                             |
| 8   | Custom group-cell content `colSpec.groupCellContent(groupValue)`                                                                          | n/a                                                                                                | ⏸️ parked — lands with #3 + #7                                                                                                                                                                           |
| 9   | Custom header content `colSpec.headerContent` + classNames + lifecycle hooks                                                              | v0 hard-codes `String(colSpec.label)`                                                              | ⏸️ parked — Phase 5.y "custom renderers" (covers header + cell)                                                                                                                                          |
| 10  | Resource fields lookup (`resourceFields[colSpec.field]`)                                                                                  | `row.columns[col.key]` (`RowSpec.columns` map)                                                     | ✅ done — equivalent. `colSpec.key` plays the role of k-ui's `field`                                                                                                                                     |
| 11  | Title/ID fallback when `col.field` unset (`resource.title \|\| getPublicId(resource.id)`)                                                 | v0 returns empty string for any missing key                                                        | ⏸️ parked — Phase 5.y. Pattern: `RowSpec.title?: string` plus an "isMain" column flag. Demo currently provides explicit cell values so no behavior gap visible                                           |
| 12  | `isMain` column flag (gets indented expander + Resources fallback label)                                                                  | v0 has no main-column concept                                                                      | ⏸️ parked — lands with #11                                                                                                                                                                               |
| 13  | Depth-based indent (`paddingLeft: 8 + depth * 16`)                                                                                        | n/a (no tree depth)                                                                                | ⏸️ parked — lands with #3                                                                                                                                                                                |
| 14  | Click-to-expand on group cells (`onClick: toggleGroup`)                                                                                   | n/a                                                                                                | ⏸️ parked — lands with #3                                                                                                                                                                                |
| 15  | Click-to-expand on resource rows (`onClick: toggleResource`)                                                                              | n/a                                                                                                | ⏸️ parked — lands with #3                                                                                                                                                                                |
| 16  | `resourceLabelContent` prop (component-level cell override)                                                                               | n/a                                                                                                | ⏸️ parked — Phase 5.y                                                                                                                                                                                    |
| 17  | Per-row pixel height matching body strips                                                                                                 | `<div style="height: ${strip.height}px">` per row, plus `gap: rowSpacing` between rows             | ✅ done                                                                                                                                                                                                  |
| 18  | Bold styling for group rows / group cells                                                                                                 | inline `font-weight: 600` on cells whose rowspan > 1; leaf cells stay at 400                       | ✅ done — Phase 5.x (commit `e3362dc`). Standalone group rows (parked at #5) still owe their bold variant                                                                                                |
| 19  | Background color via CSS variable `--gantt-neutral-bg-color`                                                                              | inline `background: #ffffff`                                                                       | ⏸️ parked — Phase 5.z "theme tokens". Hardcoded white for v0; consumer override requires `!important`                                                                                                    |
| 20  | Inner-cell "sticky cushion" (`gantt-datagrid-cell-cushion gantt-sticky` keeps group labels visible within their rowSpan area)             | n/a                                                                                                | ⏸️ parked — lands with #3                                                                                                                                                                                |
| 21  | State CSS classes (`gantt-resource-group-expanded`, `-collapsed`, `-has-children`)                                                        | n/a                                                                                                | ⏸️ parked — lands with #3                                                                                                                                                                                |
| 22  | `data-resource-id`, `data-group-id`, `data-row-index` attributes                                                                          | `data-row-id` on each sidebar row, `data-column-key` on each cell                                  | ✅ done — chronix uses `data-row-id` (mirrors `data-resource-id`); `data-group-id` parks with #3; `data-row-index` rejected (consumers can find rows by id, index is render-order-dependent and fragile) |
| 23  | Resizable column widths (drag column divider)                                                                                             | not present                                                                                        | ⏸️ parked — Phase 5.w "resizable columns". The reference's resize logic lives outside `ResourceList.tsx`; needs separate audit                                                                           |
| 24  | Inline SVG expander glyph (avoids missing-glyph boxes when fcicons webfont is absent)                                                     | n/a                                                                                                | ⏸️ parked — lands with #3                                                                                                                                                                                |
| 25  | Shared `sharedLayout` between header + body (`colWidthsPx` + `tableWidthPx`) ensures header column borders align with body column borders | header and body share `cols.map(c => c.width).join(' ')` template literal                          | ✅ done — same template applied to both grids, alignment by construction                                                                                                                                 |
| 26  | Resource list outer wrapper (`gantt-resource-list-outer`)                                                                                 | wrapper's grid track holds the sidebar; no extra outer div in chronix                              | ❌ rejected — chronix's wrapper grid is the structural equivalent; an outer div would be vestigial                                                                                                       |
| 27  | `tableLayout: 'fixed'` vs `'auto'` switch when `sharedLayout` is set                                                                      | CSS grid handles this implicitly — `gridTemplateColumns` of pixel values = fixed-layout equivalent | ✅ done — different mechanism, same outcome                                                                                                                                                              |

**Summary of catalog state (updated after Phase 5.x lands):**

- ✅ Done (11 items): #1, #2 (fixed-width slice), #3, #6, #10, #17, #18,
  #22 (chronix-equivalent attrs), #25, #27, plus the new rowspan-merge
  itself. Phase 5 v0 closed 8 items; Phase 5.x added #3, #6, #18, and
  upgraded #1 from "different DOM, same outcome" to "actual `<table>`".
- ⏸️ Tree-grouping leftovers (#4, #5, #8, #13, #14, #15, #20, #21, #24)
  — 9 items that depend on a tree pre-pass and/or expand/collapse
  state. None are exercised by the reference's vue3 demo, so they
  stay parked behind explicit observation: "no demo-side parity
  evidence". See `audit/PHASE_5_X_VGROUPING_DESIGN.md` for the
  evidence trace.
- ⏸️ Custom renderers (#7, #9, #11, #12, #16) — Phase 5.y. Pattern is
  the same `ColumnSpec.cellContent?` / etc.; demo's `String(...)`
  works for current data.
- ⏸️ Theming (#19) and resizable columns (#23) — independent parks.
- ❌ Rejected (2 items): #2 auto-width and #22 `data-row-index`.

Standing agenda for catalog-driven future work: Phase 5.y (custom
renderers), Phase 5.z (theme tokens), Phase 5.w (resizable columns),
and a possible follow-on for the parked tree-grouping leftovers IF a
future consumer demo exercises any of them.

## Open questions for the user

1. **Approve approach A?** Or prefer B (explicit per-pane scroll containers)?
2. **Column widths default**: should the wrapper auto-size to fit
   `sum(columns.width)`, or use `grid-template-columns: auto 1fr` (CSS
   grid resolves the first track to content width)? Recommend the
   latter for simplicity.
3. **Tree grouping in v0**: confirm we park rowspan-merge for a later
   phase. The current sample data is flat (`{ name: '车间 X' }` only,
   one column), so the flat-list design covers it.
4. **Sidebar row borders**: reference uses 1px row dividers. Recommend
   inline `border-bottom: 1px solid #e5e7eb` on each row to match.

---

This document is the source of truth for the design decision. Update
the status line at the top if the decision changes mid-implementation.
