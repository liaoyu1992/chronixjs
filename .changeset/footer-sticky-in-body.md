---
"@chronixjs/table-vue3": patch
---

Fix footer aggregate row appearing below the horizontal scrollbar: move the
sticky footer from a wrapper-level sibling (below the body) to a
`position: sticky; bottom: 0` child inside the body scrollport so the body's
horizontal scrollbar renders below the footer instead of above it. Removes
the now-unnecessary `overflowX: hidden; overflowY: scroll` gutter + scrollLeft
mirroring on the footer (it scrolls naturally with the body). Bottom-pinned
rows are lifted by `footerHeight` when the footer is shown so they stack above
it without overlap.
