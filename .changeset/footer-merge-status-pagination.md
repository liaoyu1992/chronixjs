---
"@chronixjs/table": major
"@chronixjs/table-vue3": major
"@chronixjs/table-vue2": major
"@chronixjs/table-react": major
---

# Merge status bar + pagination into one footer row

The status bar and pagination footer are no longer two separate rows
below the body. They now share a single footer row: the status area
sits on the left, the pagination cluster (page buttons + page-size
select) sits on the right.

## Breaking changes

### 1. `paginationEnabled` renamed to `showPagination`

`paginationEnabled` is renamed `showPagination` to pair symmetrically
with `showStatusBar`. Its semantics are unchanged - it enables
client-side pagination AND shows the pagination cluster on the right
of the footer row.

```diff
- <ChronixTable paginationEnabled showStatusBar ... />
+ <ChronixTable showPagination showStatusBar ... />
```

Vue templates using kebab-case:

```diff
- :pagination-enabled="true"
+ :show-pagination="true"
```

### 2. Footer DOM structure changed

`.cx-table-status-bar` is no longer a standalone row between body and
pagination. It is now a child (`.cx-table-pagination-status
.cx-table-status-bar`) of the `.cx-table-pagination` footer row, so it
keeps its old class for CSS-override compatibility but loses its role
as a wrapper-level sibling.

The pagination root changed `role` from `navigation` to `group` (the
neutral grouping role), with `role="navigation"` moved down to the new
`.cx-table-pagination-cluster` wrapper that holds nav + meta.

CSS selectors that relied on `.cx-table-status-bar + .cx-table-pagination`
(sibling combinator) will no longer match and need updating.

### 3. Status bar default text format changed

`defaultStatusBarText` now always renders all three segments:

```
共 N 行，已选 M 行，筛选 K 行
```

Previously segments were conditionally omitted (`已选` only when
selected > 0, `过滤后` only when filtered != total). Custom
`statusBarRenderer` / `status-bar` slot consumers are unaffected.

### 4. Pagination "共 N 行" hidden when status bar is shown

When both `showStatusBar` and `showPagination` are on, the pagination
cluster hides its own "共 N 行" total label to avoid duplicating the
status bar's row-count summary. When `showStatusBar` is off, the
total label is shown as before.

## Theme tokens

- `statusBarHeight` default `28` -> `36` (taller to host both clusters)
- `statusBarBg` default `'#f4f6f8'` -> `'#fafbfc'` (aligns with legacy
  pagination background so the merged row reads as one bar)
- New `statusBarTextColor` (default `'#3a414a'`), emitted as
  `--cx-table-status-bar-text-color`

## Footer visibility

The footer row renders when `showStatusBar || showPagination`. When
both are `false`, the entire footer is omitted (previously each could
render independently).