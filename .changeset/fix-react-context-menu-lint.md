---
"@chronixjs/table-react": patch
---

Fix eslint failures in the React adapter's built-in context menu wiring.

- Replace empty arrow-function `useRef` placeholders (`() => {}`) with
  `() => undefined` so `@typescript-eslint/no-empty-function` no longer
  fires. The refs are still reassigned to their real implementations in a
  layout effect, so runtime behavior is unchanged.
- Drop a redundant non-null assertion (`effectiveContextMenu!.items`) that
  was already guarded by an `effectiveContextMenu != null` check one line
  above, satisfying `@typescript-eslint/no-unnecessary-type-assertion`.

No runtime or API change; this only restores green CI lint.
