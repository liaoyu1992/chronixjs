---
"@chronixjs/table-server-side": patch
"@chronixjs/table": patch
"@chronixjs/ui-vue3": patch
---

Fix SSR runtime warnings during docs:build: make `isServerSideSkeletonRowId`
defensive against undefined/null rowId, guard `getCellValue` against undefined
`row.data` via optional chaining, and move Vue3 NumberAnimation's
`startAnimation()` into `onMounted` so `requestAnimationFrame` is not called
during server-side rendering.
