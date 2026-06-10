# Chronix Monorepo

## Overview

Chronix is a monorepo publishing framework-agnostic IR (Intermediate Representation) libraries with 3 framework adapters (Vue 3 / Vue 2 / React). Four major products:

| Product            | Package                       | Status              |
| ------------------ | ----------------------------- | ------------------- |
| chronix-gantt (R1) | `@chronixjs/gantt` + adapters | ✅ v0.1.0 published |
| chronix-table (R2) | `@chronixjs/table` + adapters | ✅ v0.1.0 published |
| chronix-ui (R3)    | `@chronixjs/ui` + adapters    | 🚧 Phase 33 DONE    |
| chronix-cx-kit     | `@chronixjs/cx-kit`           | ✅ v0.1.0 published |

## Workspace Layout

```text
packages/       — Core IR (cx-kit, gantt, table, ui)
adapters/       — Framework adapters ({product}-vue3, -vue2, -react)
examples/       — Demo apps per product per framework
tooling/        — Shared build/test infra (eslint-config, stylelint-config, golden-runner = Playwright)
scripts/        — Repo-level hooks (parity reminder)
```

## UI (R3) — Current State

Phase 33 DONE (2026-06-05). **85×3** adapter components shipped (Tier A 40 + Tier B 33 + Tier C 12).

### Key Architecture

- **Framework-agnostic core** (`packages/ui/`) — pure helpers + types + CSS
- **3 adapters** each ship a thin SFC wrapping core IR
- **Cookbook**: spec → class-list → styles → helper → index (5-file slice per component)
- **BEM naming**: `cx-ui-{component}` prefix with CSS var tokens
- **Sticky-flag style injection**: `ensureChronix*Styles()` with `data-chronix-ui="{name}"` dedup

### Demo Ports

| Product | Vue 3            | Vue 2.7          | React 18         |
| ------- | ---------------- | ---------------- | ---------------- |
| Gantt   | `localhost:8702` | `localhost:8703` | `localhost:8704` |
| Table   | `localhost:8711` | `localhost:8712` | `localhost:8713` |
| UI      | `localhost:8731` | `localhost:8732` | `localhost:8733` |

## Verification Gates

Every phase must pass:

1. Core typecheck + test + build (`packages/ui`)
2. 3 adapter typecheck + test (`adapters/ui-{vue3,vue2,react}`)
3. 3 demo typecheck (`examples/ui-{vue3,vue2,react}`)
4. Phase N Playwright parity + smoke
5. Phase N-1..N-2 regression Playwright

## Critical Rules

### Phase Discipline

- Every phase touching algorithm code adds a parity assertion or declares `chronix-new`
- `/phase-close` skill MUST run before marking DONE
- Never auto-publish to npm

## Test Commands

```bash
# Core
cd packages/ui && pnpm test && pnpm build

# Adapters
cd adapters/ui-vue3 && pnpm test
cd adapters/ui-vue2 && pnpm test
cd adapters/ui-react && pnpm test

# Playwright (requires demos running)
cd tooling/golden-runner && npx playwright test
```

## Build Order

Core must build before adapters typecheck (adapters import from `@chronixjs/ui` dist):

1. `cd packages/ui && pnpm build`
2. Adapter typecheck + test
3. Demo typecheck
