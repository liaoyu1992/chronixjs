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

## Self-Evolution & Persistent Memory (claude-smart)

A hook-driven learning loop under `.claude/`. It observes tool usage, extracts
behavioral patterns + factual knowledge, and re-injects relevant memory at each
session start — no manual upkeep required.

### The closed loop

```
observe (every tool call) → analyze (session end) → evolve/extract → inject (next start)
```

| Hook (`.claude/settings.local.json`)  | When            | What it does                                                                                                    |
| ------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------- |
| `PreToolUse(Bash)` + `PostToolUse(*)` | every tool call | `hooks/observe.sh` → `bin/observe.py` appends a record to `data/observations/observations.jsonl`                |
| `Stop`                                | session end     | `hooks/stop-evolve.sh` runs: analyze-instincts → auto-evolve → extract-memory → promote-to-team                 |
| `SessionStart`                        | session start   | `hooks/session-inject.sh` recalls Top-5 memories (Ollama+Qdrant, else BM25) → writes `rules/injected-memory.md` |

`.claude/rules/*.md` is auto-loaded by Claude Code (same priority as `CLAUDE.md`),
so injected memory reaches the model automatically. Hooks are registered in
`.claude/settings.local.json` (local/non-imposing — not committed; copy them into
your own settings to opt in).

### Directory layout — Git-tracked vs local

| Path                                                | Git        | Purpose                                   |
| --------------------------------------------------- | ---------- | ----------------------------------------- |
| `bin/*.py`, `hooks/*.sh`, `memory/*.py`             | ✅ tracked | system code (portable)                    |
| `homunculus/instincts/team/*.md`                    | ✅ tracked | **team** instincts (curated, PR-reviewed) |
| `homunculus/instincts/personal/*.md`                | 🔒 local   | auto-generated personal instincts         |
| `data/` (observations + qdrant vectors)             | 🔒 local   | runtime data, rotated monthly             |
| `rules/injected-memory.md`, `rules/auto-evolved.md` | 🔒 local   | regenerated each session                  |
| `memory/raw/*.md`                                   | 🔒 local   | auto-extracted knowledge memories         |

### Add a memory by hand

Create `.claude/memory/<slug>.md`:

```markdown
---
name: build-core-first
description: Core must build before adapters typecheck
metadata:
  type: project # user | feedback | project | reference
created: '2026-06-15'
updated: '2026-06-15'
---

<body — 2-5 sentences>
```

TTL by type: `user`/`feedback` permanent, `project` 60d, `reference` 90d.

### Promote a personal instinct to the team

```bash
python3 .claude/bin/promote-to-team.py .claude          # refresh candidate list
cat .claude/homunculus/instincts/promote-candidates.md  # review (gitignored)
python3 .claude/bin/adopt-instinct.py .claude <id>      # draft team/<id>.md
# edit the draft (add Why/Example), then git add team/ + PR
```

### Prerequisites & Windows notes

- **Optional** Ollama + `nomic-embed-text` → semantic vector recall; without it the system
  degrades to BM25 keyword recall (observe/extract still work).
- **Optional** `qdrant-client` → Qdrant backend; otherwise NumPy flat-search.
- Verified on this machine: Python 3.14, `numpy`/`requests`/`pyyaml`/`qdrant-client`, Ollama ✓.
- The `Stop` AI path (`auto-analyze-instincts.py`) does a direct HTTPS POST to the
  Anthropic-compatible gateway (`$ANTHROPIC_BASE_URL/v1/messages`) — not a nested `claude -p`,
  which deadlocks against the live session's shared state. It follows the session's model
  (`$ANTHROPIC_DEFAULT_OPUS_MODEL` with `[1m]`-style markers stripped), overridable via
  `$CLAUDE_SMART_ANALYSIS_MODEL`, falling back to `claude-haiku-4-5-20251001`; transient failures
  (529/timeout) retry once, hard failures log to `data/observations/ai-analysis-errors.log`, and
  statistical extraction still runs regardless.
- **Windows note (chronix-local)**: `hooks/observe.sh` converts MSYS `/c/...` → `C:\...` via
  `cygpath` (pathlib otherwise mis-resolves to `C:\c\...`) — this wrapper is chronix-local, not yet
  upstream. The UTF-8 handling (observation readers use `errors="replace"`, stdin decoded as UTF-8
  bytes, `claude` resolved via `shutil.which`) now ships from upstream.

## CI & PR Flow

Owner (`liaoyu1992`) PRs are auto-merged: `Auto-approve admin PRs`
(`.github/workflows/auto-approve.yml`) approves via `BOT_REVIEWER_TOKEN`, then enables GitHub
auto-merge (squash + delete-branch). The PR merges automatically once the required
`verify (node 20/22)` checks pass. A failing `auto-approve` run usually means the
`BOT_REVIEWER_TOKEN` expired or lost scope — update the secret and `gh run rerun <id>`.
