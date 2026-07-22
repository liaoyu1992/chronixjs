---
"@chronixjs/table": minor
"@chronixjs/table-vue3": minor
"@chronixjs/table-vue2": minor
"@chronixjs/table-react": minor
---

# Header sort indicator moved next to label + data column min-width enforced

## What changed

- **Sort indicator placement:** The header cell label's `flex` changed from `1` (grow to fill) to `0 1 auto` (shrink only). The column-header menu button (⋮) now uses `margin-left: auto` to push to the right edge. As a result, the sort indicator (▲/▼) sits immediately after the label text instead of being pushed to the far right next to the action buttons.
- **Data column minimum width:** New core helper `withHeaderMinWidth(col, options)` computes a floor that ensures a data column is wide enough to display its label + sort indicator + column-header menu button. The formula is `cellPaddingX * 2 + HEADER_MIN_LABEL_WIDTH + (sortable ? sort-indicator-width : 0) + (showColumnHeaderMenu ? menu-button-width : 0)`. All three adapters (vue3, vue2, react) now run columns through this helper in `effectiveColumns`, so the floor applies uniformly to initial layout, drag-resize, and autosize.
- **Action columns** are excluded from the header-content floor (they have their own explicit sizing).

## Migration

No action needed for most consumers. Columns that were previously resizable below ~57-81px (depending on sort/menu configuration) will now refuse to shrink below the header-content floor. Consumers who explicitly set `minWidth` below this floor will see it silently bumped.
