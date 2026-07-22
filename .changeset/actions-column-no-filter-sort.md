---
"@chronixjs/table": minor
"@chronixjs/table-vue3": minor
"@chronixjs/table-vue2": minor
"@chronixjs/table-react": minor
---

# Actions columns no longer show filter or sort

Action columns (`ColumnSpec.actions` non-empty) now automatically have `sortable: false` and `filterable: false` enforced at the core level, regardless of what the consumer declared. This prevents meaningless filter inputs and sort indicators on button-only columns.

## What changed

- **New core helper `normalizeColumnSpec(col)`** in `@chronixjs/table`: when a column has a non-empty `actions` array, it forces `sortable` and `filterable` to `false`. Non-action columns pass through by reference (zero allocation).
- **All three adapters** (vue3, vue2, react) now run columns through `normalizeColumnSpec` in their `effectiveColumns` computed/memo, so the invariant applies uniformly to layout passes, filter/sort guards, and header rendering.
- **`SETTINGS_COLUMN_SPEC`** also gained `filterable: false` (it previously had `sortable: false` but was missing the filter flag).

## Migration

No action needed for consumers who did not explicitly enable `sortable: true` or `filterable: true` on an actions column. Consumers who did will see the filter input and sort indicator silently suppressed for those columns, which is the intended behavior.