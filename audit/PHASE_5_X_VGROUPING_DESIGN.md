# Phase 5.x — vGrouping (rowSpan merge for sidebar columns)

**Status**: **DONE (2026-05-15)**. Landed as 3 commits: `ef4b301` (design doc), `e3362dc` (rowspan + table DOM + 13 tests), `969884e` (demo wiring + VRT rebaseline). Browser-verified: merged cells span the correct y-range, individual cells align with their bar rows, bold-vs-normal weight contrast matches the reference visually.

## Problem

The Phase 5 v0 sidebar renders every cell of every row, one per column. The
reference demo at port 8701 does NOT do that — when multiple consecutive
rows share the same value in a "group" column (e.g. region = "海口" for 20+
rows), the reference merges those cells into ONE cell with `rowSpan=20`,
producing a visually grouped layout: a single tall "海口" cell spanning all
its child rows, then a vertical divider, then the leaf cells (one per row).

The catalog entries this slice addresses (from
`audit/PHASE_5_RESOURCE_AREA_DESIGN.md`):

- #3 `rowSpan`-based group cells — ✅ promoted from parked to done
- #6 vGrouping mode (groups as rowSpan-merged columns) — ✅ promoted from parked to done
- #18 bold styling for group rows / group cells — ✅ promoted (bold ONLY for merged cells)

Items that the reference's vue3 demo doesn't exercise — staying parked,
each tagged with the observation that grounds the deferral:

- #4 expand/collapse state — reference demo always shows all groups
  expanded; no glyph rendered in any view
- #5 standalone group row mode — reference uses vGrouping; standalone
  group rows are an alternative mode toggled via the `isVGrouping=false`
  branch which the demo doesn't reach
- #13 depth-based indent — no `parentId`-driven hierarchy in the
  reference's resource list; grouping is value-based not tree-based
- #14 click-to-expand on group cells — depends on #4
- #15 click-to-expand on resource rows — depends on #4
- #20 sticky cushion inside cells — refinement on top of #4
- #21 state CSS classes — depends on #4
- #24 inline SVG expander glyph — depends on #4

The narrowed scope reflects "no drift from k-ui" honestly: the catalog's
tree-grouping group has 11 items, but the reference demo's vue3 example
exercises ONLY 3 of them. Implementing the other 8 would be over-engineering
behaviors that have no demo-side parity evidence.

## Approach

### Data shape — group flag on ColumnSpec

Extend `ColumnSpec` with an optional `group?: boolean` flag (matches
the reference's `ResourceColumnSpec.group`):

```ts
interface ColumnSpec {
  readonly key: string;
  readonly label: string;
  readonly width: number;
  readonly group?: boolean; // NEW — when true, consecutive rows sharing
  // this column's value merge into one cell
  // with rowSpan=N
}
```

A column with `group: true` participates in vGrouping; cells without it
render normally (one cell per row).

### rowSpans pre-pass

A pure function `computeRowSpans(rows, columns) -> number[][]` walks each
group column and emits a `rowSpans[colIndex][rowIndex]` matrix:

- `rowSpans[c][r] = N` (N > 1) — row r's cell c is the FIRST of a merged
  group spanning rows r..r+N-1. Render the cell with `rowSpan=N`.
- `rowSpans[c][r] = 0` — row r's cell c is ABSORBED by a previous row's
  rowSpan. Skip rendering this cell entirely.
- `rowSpans[c][r] = 1` — row r's cell c is INDIVIDUAL (default). Render
  one cell with no rowSpan.

For non-`group` columns, every cell is individual (rowSpan implicit 1).

Pseudocode for one column:

```
for r in 0..rows.length:
  if rowSpans[c][r] == 0: continue  // already absorbed
  let endR = r
  while endR + 1 < rows.length AND rows[endR+1].columns[col.key] === rows[r].columns[col.key]:
    rowSpans[c][endR+1] = 0
    endR += 1
  rowSpans[c][r] = endR - r + 1
```

Adjacency matters — rows must be consecutive. Rows with the same value
but separated by a different-valued row don't merge. This matches the
reference's behavior.

### Render model: from CSS grid to HTML table

The current sidebar-body uses `display: flex` with one `<div>` per row,
each row itself being a `display: grid` with column tracks. This doesn't
support rowSpan — CSS grid has no equivalent to HTML's `rowspan`
attribute (it has `grid-row: span N`, but it doesn't merge cell content
in the natural way HTML table cells do).

Switch the sidebar-body's DOM to an HTML `<table>`:

```html
<div class="cx-gantt-sidebar-body">
  <table>
    <colgroup>
      <col style="width: 35px" />
      <!-- region -->
      <col style="width: 70px" />
      <!-- base -->
      <col style="width: 100px" />
      <!-- workshop -->
    </colgroup>
    <tbody>
      <tr style="height: ${strip[0].height}px">
        <td rowspan="3">海口</td>
        <!-- merged 3 rows -->
        <td rowspan="2">海口基地</td>
        <!-- merged 2 rows -->
        <td>1车间</td>
      </tr>
      <tr style="height: ${strip[1].height}px">
        <!-- region cell absorbed -->
        <!-- base cell absorbed -->
        <td>2车间</td>
      </tr>
      <tr style="height: ${strip[2].height}px">
        <!-- region cell absorbed -->
        <td>空港维修基地</td>
        <!-- new group -->
        <td>3车间</td>
      </tr>
    </tbody>
  </table>
</div>
```

`<table>` is the right tool for rowSpan — that's literally what it exists
for. CSS grid wins for the wrapper (2-pane structural layout), HTML table
wins for the in-pane row data. They coexist cleanly in the wrapper grid:
the sidebar-body grid cell contains a single `<table>`.

The sidebar-header parallels: switch from `display: grid` to a `<table>`
with `<thead>` so column widths align between header and body. Both
tables use a shared `<colgroup>` (per-column widths) to guarantee
border alignment.

### Bold styling for merged cells

Per catalog #18: cells with `rowSpan > 1` get `font-weight: 600`. Cells
with `rowSpan === 1` (or implicit, the leaf workshop column) get normal
weight. This matches the reference's visual hierarchy.

### Sidebar row heights

`<table>` row heights are governed by `<tr style="height: ${strip.height}px">`
plus `cellPadding=0; cellSpacing=0` on the table. The reference also uses
exactly this pattern (per `ResourceList.tsx` line 88: `border-collapse:
collapse; table-layout: fixed`).

`border-collapse: collapse` is needed so the rowSpan cell's border doesn't
introduce vertical gaps that misalign with the body strips.

### Sticky behavior unchanged

The wrapper's 2×2 grid + sticky-left + z-index ladder land in Phase 5 v0
and don't change here. The new `<table>` sits inside the existing
`.cx-gantt-sidebar-body` div, which keeps its `position: sticky; left: 0`.

## Component API after Phase 5.x

```ts
interface ColumnSpec {
  readonly key: string;
  readonly label: string;
  readonly width: number;
  readonly group?: boolean; // NEW
}
```

`<ChronixGantt>` props unchanged. Existing `columns: ColumnSpec[]` accepts
the augmented shape; a `columns` array where no entry has `group: true`
renders identically to Phase 5 v0 (no rowSpan merges happen since no
column participates).

## Execution plan — 2 commits with browser-verify pause

### Commit 1: rowSpan computation + render switch from CSS grid to HTML table

- Add `group?: boolean` to `ColumnSpec`.
- Add a pure function in `chronix-gantt.ts` (or a small helper module if
  it gets too long): `computeRowSpans(rows, strips, columns)`.
- Switch `cx-gantt-sidebar-header` and `cx-gantt-sidebar-body` from div+grid
  to `<table>`. Header: `<thead>` with one `<th>` per column. Body:
  `<tbody>` with one `<tr>` per strip, cells emitted per the rowSpans
  matrix (skip absorbed cells, render rowSpan=N cells with the attribute).
- Bold weight on cells with `rowSpan > 1`.
- ~10 new SFC tests covering:
  - rowSpans matrix correctness on adjacent-shared-value sequences
  - rowSpans on non-adjacent shared values (separated by a different
    value — must NOT merge)
  - all-individual when no column has `group: true`
  - `rowSpan` attribute on the right `<td>` elements
  - absorbed cells return null (not in DOM)
  - bold weight on merged cells, normal weight on leaf cells
  - sidebar-body root is still a `.cx-gantt-sidebar-body` div, wrapping
    a `<table>` (preserves the sticky-left contract)
- All existing 97 SFC tests must still pass — existing single-column
  demo data uses `columns: [{ key: 'name', label: '车间', width: 120 }]`
  with no `group: true`, so its rendering is unchanged.
- ci-check green → commit + push → **PAUSE for browser verify** with a
  multi-column demo temporarily wired in `App.vue` to confirm visual
  rowSpan merge looks right.

### Commit 2: demo wires multi-column shared-value rows + VRT rebaseline

- Update `examples/gantt-vue3/src/sample-data.ts` to give each row a
  `region` field and a `base` field (in addition to the existing `name`).
  Pattern roughly matching the reference's data shape: cluster workshops
  under bases under regions.
- Update `App.vue`'s `columns` to:
  ```ts
  [
    { key: 'region', label: '地区', width: 60, group: true },
    { key: 'base', label: '基地', width: 100, group: true },
    { key: 'name', label: '车间', width: 120 },
  ];
  ```
- Rebaseline 5 chronix VRT PNGs to include the new 3-column merged
  sidebar (PNGs grow by ~160 px wide; previous +120 → +280 total over
  the no-sidebar baseline).
- ci-check green → commit + push → **PAUSE for user to review the 5 new
  baselines**.

## Estimated scope

- rowSpans pre-pass: ~1 hour
- DOM switch + render logic: ~2 hours
- SFC tests: ~2 hours
- Demo data + wiring: ~30 min
- VRT rebaseline: ~30 min
- Journal + docs: ~30 min
- Total: ~6-7 hours focused work

## Open questions for the user

1. **Approve the narrowed scope?** Only #3, #6, #18 land here; #4, #5,
   #13, #14, #15, #20, #21, #24 stay parked (reference demo doesn't
   exercise them).
2. **Sample data shape**: should I mirror the reference's airport / base
   / workshop hierarchy with similar value strings (海口 / 海口基地 / 1车间
   etc.), or invent a generic example? Recommend mirroring so the
   visual diff against the reference is easier to verify.
3. **Bold weight** on merged cells: confirm 600 (the catalog says so),
   or want a different weight?

Reply with **"go"** for default answers + start Commit 1, or adjust
before I proceed.
