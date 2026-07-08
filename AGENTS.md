# AGENTS.md

This file provides guidance to the AI agent when working with code in this repository.

Chronix is a pnpm + Turborepo monorepo. Framework-agnostic cores live in `packages/` (`cx-kit`, `gantt`, `table`, `ui`, `table-server-side`); thin per-framework adapters live in `adapters/` (`{product}-{vue3,vue2,react}`); demo apps in `examples/`. Scoped as `@chronixjs/*`. Full layout and conventions: see `@CONTRIBUTING.md`.

## Commands

Package manager is **pnpm** (no npm/yarn). Orchestrator is Turborepo.

```bash
pnpm install
pnpm dev              # all packages in watch + dev servers
pnpm test             # vitest across all workspaces (via turbo)
pnpm build
pnpm ci-check         # full PR gate: format:check + lint + typecheck + test + build
```

Per-package work uses the filter (package names are `@chronixjs/<name>`):

```bash
pnpm --filter @chronixjs/table typecheck
pnpm --filter @chronixjs/table-vue3 build
pnpm --filter @chronixjs/example-table-vue3 dev
```

Run a single test file or name:

```bash
pnpm --filter @chronixjs/gantt exec vitest run src/path/to/file.test.ts
pnpm --filter @chronixjs/gantt exec vitest run -t "test name"
```

Note: `packages/table` and `packages/table-server-side` run with `--retry=2` — a failure there may be intermittent.

## Build order (critical)

`turbo.json` sets `dependsOn: ["^build"]` for `build`/`lint`/`typecheck`/`test`. **Adapters typecheck against the built `dist` of their core package**, not its source. After editing a core (`packages/ui/src`), rebuild it before adapter typechecks see the change:

```bash
pnpm --filter @chronixjs/ui build   # then adapter typecheck/test
```

## Code style

These deviate from defaults or are actively enforced — the AI will get them wrong without being told.

- **Always use `import type`** for type-only imports (eslint `consistent-type-imports` is `error`, inline fix style).
- No `// eslint-disable-next-line` — fix the root cause.
- No `String(value)` on `unknown` — narrow with `typeof`.
- No `as HTMLInputElement` casts — use `querySelector<HTMLInputElement>('...')`.
- `row.data['field']`, **not** `row.data.field` (`noPropertyAccessFromIndexSignature`, TS4111).
- Prefer optional chain (`x?.y`) and nullish-coalescing-assignment (`x ??= ...`).
- Unused vars/args must be `_`-prefixed. `no-explicit-any` is a warning.
- React adapter: hoist a `useCallback` above any `useCallback` that depends on it (JS `const` doesn't hoist).
- Prettier: single quotes, trailing comma `all`, 100 cols, 2-space, **LF endings** (`.gitattributes` enforces `eol=lf`; never introduce CRLF on Windows).
- Stylelint enforces BEM class names: `^(cx|chronix)(-[a-z0-9]+)+(__...)?(--...)?$`. UI uses `cx-ui-{component}`, gantt/table use `cx-gantt-*` / `cx-table-*`. Non-matching classes fail `pnpm stylelint`.
- TSConfig is very strict: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`. See `@tsconfig.base.json`.

## Testing

- Unit: Vitest. Vue adapters use `@vue/test-utils` + `happy-dom`; React adapters use `@testing-library/react` + `jsdom`.
- Every new pure helper ships a `.test.ts` sibling; every new SFC wiring ships 1–5 SFC tests per adapter.
- Visual/interaction parity: Playwright in `tooling/golden-runner` (`capture` writes baselines, `verify` compares; `maxDiffPixelRatio: 0.001`). Requires a demo running + `playwright install chromium`. Frozen time `2026-05-13T00:00:00Z`, viewport 1440×900, timezone `Asia/Shanghai`, locale `zh-CN`. Algorithm-level changes need a golden-runner parity assertion.

## Repo etiquette

- Target branch is **`main`**. (The release workflow and changeset config reference `master` — that is a stale bug, not a separate branch.)
- Squash merge. Commit messages follow Conventional Commits with scope, e.g. `fix(gantt): center time-axis tick labels`, `refactor(table): ...`, `chore(deps): ...`.
- Publishable package changes require a changeset: `pnpm changeset`. Never publish to npm directly; `pnpm release` (changesets) handles it.
- Owner/dependabot PRs auto-merge once CI passes.

## Gotchas

- **Do not remove the pnpm Vue hoist suppression** in `.npmrc` (`hoist-pattern[]=!vue`, `public-hoist-pattern[]=!vue`). Without it `vue-template-compiler@2.7` resolves the wrong Vue and fails. Vue 2.7 and Vue 3.5 coexist as sibling adapters.
- The full-tree `prettier --check` OOMs the default 2 GB heap. For local full checks set `NODE_OPTIONS=--max-old-space-size=4096` (CI does this).
- `.claude/` is a Claude Code-specific self-evolution system; it is not part of the build and is mostly gitignored. Ignore it unless explicitly working on it.
