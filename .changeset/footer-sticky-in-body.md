---
"@chronixjs/table": patch
"@chronixjs/table-vue3": patch
"@chronixjs/table-vue2": patch
"@chronixjs/table-react": patch
---

Three fixes + CSS architecture refactor for the footer aggregate row:

1. **Footer pinned-column background**: Pinned footer cells read
   `var(--cx-table-pinned-zone-bg, inherit)` via `pinnedCellStyle()`,
   which overrode the footer background and fell back to transparent.
   The footer container now sets `--cx-table-pinned-zone-bg` to the
   footer bg so every footer cell (aggregator or not) shows a uniform
   background.

2. **Footer pinned-column shadow**: Added `.cx-table-footer-cell` to
   the `--pinned-left-last` / `--pinned-right-first` box-shadow rules
   so the boundary separator renders on the footer row too.

3. **Ship base stylesheet from adapter**: The `cx-table-*` structural
   and visual CSS (flex layout, zebra striping, pinned shadows, filter
   row, pagination, tree chevrons, etc.) now ships from
   `@chronixjs/table` and is re-exported by each adapter via the
   `./styles.css` subpath. Consumers import it once:

   ```js
   import '@chronixjs/table-vue3/styles.css';
   ```

   This eliminates the copy-pasted ~1300-line CSS across the three
   example apps, which was the root cause of the missing footer rules.
   Adapter `sideEffects` changed from `false` to `["*.css"]`.
