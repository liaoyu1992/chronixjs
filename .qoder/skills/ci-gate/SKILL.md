---
name: ci-gate
description: Run the local pre-PR quality gate — typecheck, test, and build for the whole monorepo or a single @chronixjs package. Use before opening a PR, before marking a task done, or after non-trivial changes to confirm nothing regressed.
---

Run the Chronix verification gate. `$ARGUMENTS` is optional:

- **No argument** → run the full gate across all workspaces:

  ```bash
  NODE_OPTIONS=--max-old-space-size=4096 pnpm ci-check
  ```

  (`NODE_OPTIONS` is required — the full-tree prettier check OOMs the default 2 GB heap.)

- **A package name** (e.g. `/ci-gate @chronixjs/table`) → run scoped to that package. Also works with adapter/example names like `@chronixjs/table-vue3` or `@chronixjs/example-table-react`.

## When a package is given

1. If it is an **adapter** or **example**, build its core dependency first so typecheck sees fresh `dist` (adapters typecheck against the built core, not source):
   - `table-*` → build `@chronixjs/table` (+ `@chronixjs/table-server-side` if touched)
   - `gantt-*` → build `@chronixjs/gantt`
   - `ui-*` → build `@chronixjs/ui`
   ```bash
   pnpm --filter @chronixjs/<core> build
   ```
2. Then run the gate on the target:
   ```bash
   pnpm --filter <pkg> typecheck && pnpm --filter <pkg> test && pnpm --filter <pkg> build
   ```

## Rules

- Report each step's pass/fail. Do not mark the task done if any step fails.
- `@chronixjs/table` and `@chronixjs/table-server-side` tests run with `--retry=2`; a failure there may be intermittent — re-run once to confirm before investigating deeply.
- This gate covers correctness only. Visual parity (golden-runner Playwright) is separate; run it for algorithm-level changes.
