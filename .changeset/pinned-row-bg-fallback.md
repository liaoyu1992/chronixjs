---
"@chronixjs/table-react": patch
"@chronixjs/table-vue2": patch
"@chronixjs/table-vue3": patch
---

Fix pinned-row background fallback so the pinned zone inherits the odd-row
background token instead of the generic `inherit`, matching the table's themed
row striping when `--cx-table-pinned-zone-bg` is unset.
