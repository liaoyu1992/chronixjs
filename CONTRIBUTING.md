# Contributing to chronix

Thanks for your interest. chronix is a monorepo of framework-agnostic component cores + per-framework adapters, with an emphasis on small surface-area pure helpers and feature-symmetric ports across Vue 3 + Vue 2.7 + React 18.

## Repository layout

```text
packages/
  cx-kit/          # headless UI primitives (virtual list, slider, color picker, autocomplete)
  gantt/           # framework-agnostic gantt core
  table/           # framework-agnostic table core
  ui/              # framework-agnostic UI component IR (85 components)
adapters/
  gantt-vue3/      # @chronixjs/gantt-vue3
  gantt-vue2/      # @chronixjs/gantt-vue2
  gantt-react/     # @chronixjs/gantt-react
  table-vue3/      # @chronixjs/table-vue3
  table-vue2/      # @chronixjs/table-vue2
  table-react/     # @chronixjs/table-react
  ui-vue3/         # @chronixjs/ui-vue3
  ui-vue2/         # @chronixjs/ui-vue2
  ui-react/        # @chronixjs/ui-react
examples/
  gantt-vue3/      # vite dev server @ http://localhost:8702
  gantt-vue2/      #                  @ http://localhost:8703
  gantt-react/     #                  @ http://localhost:8704
  table-vue3/      #                  @ http://localhost:8711
  table-vue2/      #                  @ http://localhost:8712
  table-react/     #                  @ http://localhost:8713
  ui-vue3/         #                  @ http://localhost:8731
  ui-vue2/         #                  @ http://localhost:8732
  ui-react/        #                  @ http://localhost:8733
tooling/
  eslint-config/   # shared ESLint flat config
  stylelint-config/
  golden-runner/   # cross-demo Playwright parity tests
```

## Prerequisites

- Node >= 20
- pnpm >= 9

## Common commands

```bash
pnpm install
pnpm dev              # all packages in watch + example dev servers
pnpm test             # vitest across all packages
pnpm build            # tsup build for publishable packages + vite build for examples
pnpm ci-check         # prettier --check + lint + typecheck + test + build
```

The `ci-check` script runs everything that gates a PR. Before opening a PR, make sure it passes.

Per-package commands (run via filter):

```bash
pnpm --filter @chronixjs/table typecheck
pnpm --filter @chronixjs/table-vue3 build
pnpm --filter @chronixjs/example-table-vue3 dev
```

## Test discipline

- Every new chronix-NEW pure helper ships with a `.test.ts` sibling.
- Every new SFC wiring (prop / emit / handle method) ships with 1-5 SFC unit tests per adapter.
- For algorithm-level changes, add a cross-demo parity assertion to `tooling/golden-runner/tests/` in the same commit.
- For chronix-NEW surface, declare it explicitly in the design doc.

## Style

- No `// eslint-disable-next-line` — fix the root cause.
- No `String(value)` on `unknown` — narrow via `typeof v === 'number'` etc.
- No `as HTMLInputElement` — use `querySelector<HTMLInputElement>('...')` or `target.closest<HTMLElement>('.foo')`.
- Prefer optional chain (`x?.y === ...`) over `x != null && x.y === ...`.
- Prefer nullish coalescing assignment (`x ??= ...`) over `if (x == null) x = ...`.
- `row.data['field']` — not `row.data.field` — for TS4111 compliance.
- Use `const` for narrowing-then-single-assignment locals (eslint `prefer-const`).
- React adapter: when a `useCallback` depends on another `useCallback`, hoist the dependency above the dependent (JS `const` doesn't hoist).

## Reporting bugs / requesting features

Open a GitHub issue at <https://github.com/liaoyu1992/chronixjs/issues>.

## License

By contributing, you agree your contributions will be licensed under the [MIT License](./LICENSE).
