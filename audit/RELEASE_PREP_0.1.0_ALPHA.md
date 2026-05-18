# 0.1.0-alpha.0 release prep — planning checklist

**Status**: **PLANNING** (no publish action taken; awaits user authorization per `feedback_npm_publish` memory). Last updated 2026-05-18.

## Why now

chronix has reached substantive feature-completeness for the 2.0 demo-parity roadmap:

- All P0 demo-parity items closed (5 DONE since 2026-05-15 recheck; 2 originally Planned-Phase-24 items DONE; 9 Defer-indefinite; 1 Reject).
- All explicit `Planned with phase number` entries except the now-retired Phase 22.1 are DONE: 22.2 / 22.AUTOMATE / 23 / 24 / 25 / 26 / 27 / 28.1 / 28.2 / 28.3 / 29 / 30, plus the cascade 27.1 / 28.2.1 / 28.2.2 / 28.3.1.
- 712/712 vitest (329 core + 372 vue3 adapter + 11 demo) + 32 golden-runner Playwright unit + 56 parity-spec assertions + 27/27 cross-demo verify + 50 ChronixTheme tokens + 361-item × 51-file catalog-completeness CI gate green.
- No 🔴 BLOCKING drift; no demo-parity gap.

Logical next step is making the library installable. This document records the gate checklist; it does NOT itself execute a publish.

## Version policy decision

- **Starting version**: `0.1.0-alpha.0` for both `@chronixjs/gantt` + `@chronixjs/gantt-vue3`.
- **npm dist-tag**: `alpha` (NOT `latest`). Users install via `pnpm add @chronixjs/gantt@alpha` + `@chronixjs/gantt-vue3@alpha`.
- **SemVer interpretation**: while in `0.x` series, minor bumps (`0.2.0`, `0.3.0`) may carry breaking changes; patch bumps (`0.1.1`) are bug-fixes only. The `alpha` tag amplifies this signal — APIs may shift without ceremony before `1.0.0`.
- **Path to stable**: `0.1.0-alpha.N` → `0.1.0-beta.N` (feature surface frozen; only fixes) → `0.1.0-rc.N` (no known bugs) → `1.0.0` (SemVer commitment).

## Pre-publish gate (must all pass before first `pnpm publish`)

### G1 — Package metadata audit

- [ ] **`@chronixjs/gantt/package.json`** — confirmed: `name` / `description` / `license: MIT` / `author: liaoyu1992` / `homepage` (subpath to packages/gantt) / `bugs.url` / `repository.directory` / `keywords` / `type: module` / `sideEffects: false` / `main` + `module` + `types` + `exports` / `files: ["dist", "README.md", "LICENSE"]` / `publishConfig.access: public`. Version bump `0.0.0 → 0.1.0-alpha.0`.
- [ ] **`@chronixjs/gantt-vue3/package.json`** — confirmed shape; ONE GAP: `files: ["dist", "LICENSE"]` is missing `"README.md"`. **Add `README.md` to `files` array AND create the README file** (gap below).
- [ ] **`@chronixjs/gantt-vue3` internal dep**: `"@chronixjs/gantt": "workspace:*"` — pnpm rewrites `workspace:*` to the resolved version at `pnpm publish` time (default `version: 0.1.0-alpha.0` → published `"@chronixjs/gantt": "0.1.0-alpha.0"`). Verify by running `pnpm publish --dry-run` from `adapters/vue3/` and inspecting the tarball's `package.json`.

### G2 — README content

- [ ] **Root `README.md`** — current copy says "Scaffolded — implementation in progress" for `@chronixjs/gantt`. Rewrite to reflect actual state: alpha-published gantt + Vue 3 adapter, link to package READMEs, install snippet (`@alpha` dist-tag), feature summary (6 views / drag-resize / dependency lines / progress / today-line / theme tokens / slot registry / imperative handle), test counts as evidence of maturity. Keep table-style "future packages" placeholder for `@chronixjs/table` / `@chronixjs/input`.
- [ ] **`packages/gantt/README.md`** — current is 15 lines, says "Scaffolded. Implementation in progress." Rewrite as full library README: install + quickstart (mount the component with minimal props) + concept overview (axisInput / bars / links / rows / slot registry / theme / handle) + link to monorepo for full surface + alpha-status banner.
- [ ] **`adapters/vue3/README.md`** — DOES NOT EXIST. Create it: install (`pnpm add @chronixjs/gantt-vue3@alpha vue`) + 30-line Vue SFC quickstart (`<ChronixGantt :bars :rows :links :axis-input @bar-drop>`) + composable usage (`useGanttLayout` / `useGanttPointer` / `useGanttSelection` for advanced wiring) + theme prop note + imperative handle access via template ref + alpha-status banner + link back to `@chronixjs/gantt` for core types.
- [ ] **Alpha-status banner content** (consistent across all three READMEs): "⚠️ alpha — APIs may change before 1.0. Published under the `alpha` npm dist-tag. Install with `@alpha`. SemVer-stable surface coming in 1.0.0."

### G3 — Exports / build artifacts

- [ ] **`packages/gantt`** dist: `tsup` already produces `dist/index.js` (ESM) + `dist/index.cjs` (CJS) + `dist/index.d.ts`. Re-run `pnpm --filter @chronixjs/gantt build` immediately before publish (memory rule `feedback_rebuild_dist_for_cross_package_changes`).
- [ ] **`adapters/vue3`** dist: same shape. Re-run `pnpm --filter @chronixjs/gantt-vue3 build` immediately before publish (depends on `@chronixjs/gantt` dist).
- [ ] **Verify tarball contents** via `pnpm publish --dry-run` from each package directory. Expected files in tarball: `dist/`, `README.md`, `LICENSE`, `package.json`. Should NOT include: `src/`, `tsconfig.json`, `tsup.config.ts`, `node_modules`, audit/test files. (The `files` array gates this.)

### G4 — Peer / runtime dependencies

- [ ] **`@chronixjs/gantt`** has no runtime dependencies (pure framework-agnostic core). Verify `dependencies: {}` in published `package.json` (currently absent; confirm not added).
- [ ] **`@chronixjs/gantt-vue3`** has `dependencies: { "@chronixjs/gantt": "workspace:*" }` (rewritten on publish) + `peerDependencies: { "vue": "^3.4.0" }`. Vue is correctly a peerDep (consumer brings their own Vue). Confirm no accidental runtime-dep on `@vue/test-utils` / `happy-dom` / `tsup` / `vitest` (devDeps only).

### G5 — Changeset for the alpha release

- [ ] **Create first changeset**: `pnpm changeset` interactively, OR write `.changeset/initial-alpha.md` manually with shape:

  ```markdown
  ---
  '@chronixjs/gantt': minor
  '@chronixjs/gantt-vue3': minor
  ---

  Initial alpha release. Framework-agnostic gantt core + Vue 3 adapter,
  feature-complete for the 2.0 demo-parity roadmap. APIs may shift
  before 1.0.0. Install with `@alpha` dist-tag.
  ```

- [ ] `pnpm changeset version` to apply (`0.0.0 → 0.1.0-alpha.0` on both, rewrites `workspace:*` consumer to `^0.1.0-alpha.0` in `gantt-vue3`'s published manifest).
- [ ] Inspect generated `CHANGELOG.md` files; commit version bump in a dedicated commit so the publish step is clean.

### G6 — Publish command (gated on user authorization)

- [ ] **NOT EXECUTED HERE.** Per `feedback_npm_publish` memory: every publish requires explicit per-release user approval.
- [ ] Reference command (for user to copy when authorized):
  ```bash
  # From repo root, after G1-G5 all green:
  pnpm -r build
  pnpm changeset publish --tag alpha
  ```
  `pnpm changeset publish` handles auth via `NPM_TOKEN` env or interactive `npm login`. The `--tag alpha` flag ensures `latest` stays unset (consumers must opt in via `@alpha`).
- [ ] **Confirm `NPM_TOKEN` secret** in GitHub if CI-based publish becomes preferred later. Current workflow file (`ci(release): remove auto-publish; workflow only opens version PR`) explicitly disables auto-publish; nothing to change unless user wants CI publishing.

### G7 — Post-publish smoke test

- [ ] From a scratch directory: `pnpm init -y && pnpm add @chronixjs/gantt@alpha @chronixjs/gantt-vue3@alpha vue` — confirms tarballs install + resolve.
- [ ] In a scratch Vue 3 vite app, import `<ChronixGantt>` from `@chronixjs/gantt-vue3`, render with the minimal example from the README, verify dev server boots + chart renders.
- [ ] Verify `https://www.npmjs.com/package/@chronixjs/gantt` page shows the README, version `0.1.0-alpha.0`, no `latest` tag, `alpha` tag present.

### G8 — Demo deployment (optional, post-publish)

- [ ] Static deploy `examples/gantt-vue3/dist` to GitHub Pages OR Vercel/Netlify so users can try chronix before installing. Candidate URL: `liaoyu1992.github.io/chronixjs/` or `chronixjs.dev`. **Not required for first publish**; linking back from npm/README adds adoption value. Vite static build via `pnpm --filter @chronixjs/example-gantt-vue3 build`.

## What this prep doc does NOT cover

- **`adapters/react`** + **`adapters/vue2`** — Phase 4+ scaffolding noted in memory but not yet ported. Out of scope for `0.1.0-alpha.0`.
- **API documentation site** (typedoc / vitepress) — README quickstarts are minimal; full API reference is a `0.2.0` or `0.1.0-beta` concern.
- **Test coverage / CI badge** in README — nice-to-have; not gating.
- **`@chronixjs/table`** / **`@chronixjs/input`** scaffolding — placeholder rows in root README only; no package directories yet.
- **Migration guide from `0.0.x` of any other library** — not applicable; chronix is its own surface.

## Open questions to revisit before publish

1. **Demo deployment URL** — defer to post-publish (G8). README link can be added in a follow-up patch.
2. **Whether to include `examples/` source in published tarball as documentation** — currently `examples/` is its own private workspace, not published. Recommend keeping it that way; the README quickstart + GitHub link to the example app dir is sufficient.
3. **Whether `@chronixjs/gantt-vue3` should declare a `peerDependenciesMeta.vue.optional: false`** to make pnpm warn loudly if vue is missing. Default behavior already warns; explicit `optional: false` is the safer signal for npm/yarn users.

## Estimated effort to G7-complete

- G1 package.json bumps + adapters/vue3 files-array fix: **15 min**.
- G2 three README rewrites: **90-120 min** (root simplest; gantt README needs a real quickstart; vue3 adapter README is brand-new).
- G3 dry-run + tarball inspection: **15 min**.
- G4 peer-dep audit: **5 min**.
- G5 changeset draft + version bump commit: **20 min**.
- G6 publish: **5 min** (user-gated).
- G7 smoke test: **30 min**.
- **Total: ~3-3.5h to first published `0.1.0-alpha.0`**, of which ~2h is README writing.

## Sequencing recommendation

Two natural sub-tasks, each commit-sized:

1. **Sub-task A** — G1 + G2 + G3 + G4 (metadata + READMEs + dist verification). Single session, 2-3h. Lands as a commit `chore(release): 0.1.0-alpha.0 prep — package metadata + READMEs + adapter README`. Re-runs `pnpm ci-check`. NO publish.
2. **Sub-task B** — G5 + G6 + G7 (changeset → version → publish → smoke test). User-gated; sequence at user's request, after sub-task A lands. Likely 1h of agent work + minutes of user-authorization gates.

Sub-task A is safe to start without further authorization (no publish, no irreversible action). Sub-task B requires explicit user "go" per `feedback_npm_publish`.

This doc is the artifact of pre-work step; the actual publish flow is two more decisions ("do sub-task A now?" + "do sub-task B now?") both surfaced to user.
