---
name: phase-close
description: Run the chronix phase-close gate — verifies that a phase has met all completeness criteria (parity assertion present or chronix-new declared, journal entry written, memory updated, design-doc status flipped) before it can be marked DONE. MUST be invoked before flipping `Status: DONE` in any audit/PHASE_*_DESIGN.md or adding a `## Phase N — DONE` section to audit/journal/. The skill is a checklist verifier, not an executor — it reports pass/fail per item and refuses to mark DONE until all items pass.
---

# /phase-close — chronix phase-close gate

This skill is invoked at the END of a phase, just before flipping
`Status: Approved (pending user reply)` to `Status: DONE (YYYY-MM-DD)`
in the phase design doc. Its purpose is to catch the discipline lapse
that produced `audit/PARITY_RECHECK.md` (2026-05-15): phases 7
through 16 closed without side-by-side reference-vs-chronix parity
assertions, and drift went undetected for ~15 phases.

## When NOT to invoke

- Mid-phase (between commits) — the skill is a close-time gate, not a
  per-commit linter. Run it once, when wrapping up.
- For audit-only commits (e.g. updating PARITY_RECHECK.md, fixing
  docs typos) — no phase boundary involved.
- For external commits (dependabot bumps, CI tweaks) — same.

## What the skill does — step by step

When invoked, walk through these checks in order. For each check, run
the listed commands / reads, then emit a `✅` / `❌` line. After all
checks, summarize as either `✅ Phase close gate PASSED. Safe to flip
Status to DONE.` or `❌ Phase close gate FAILED. Do NOT mark DONE
until the failing items are resolved.`

### 0. Locate the phase being closed

```bash
# Find the most recently modified audit/PHASE_*_DESIGN.md that's still
# Status: "Approved (pending user reply)" (i.e. not yet DONE).
ls -t D:/work/chronix/audit/PHASE_*_DESIGN.md | head -5
```

Read each candidate. The one with status `Approved (pending user
reply)` is the one being closed. Capture: phase number `<N>`, phase
title slug `<TITLE>`, design doc path.

If multiple candidates match — ask the user which phase is being
closed. If none match — report `❌ No phase-in-progress found` and
abort the skill.

### 1. Parity assertion check — MANDATORY

Open the design doc. Find the section `## Parity assertion plan`.

- If the section contains a non-empty table of assertion IDs:
  - For each assertion ID, grep `tooling/golden-runner/tests/parity.spec.ts`
    for that string. Every ID must be present.
  - `✅ Parity assertion plan: N/N assertions found in parity.spec.ts`
  - If any are missing: `❌ Parity assertion(s) missing from parity.spec.ts: <list>`
  - **Positive signal**: if the new test imports from
    `../src/parity-helpers.js` (the Phase 17 cross-demo helper),
    that's strong evidence the assertion follows the canonical
    `loadBothDemos` / `extractBarsSnapshot` / `diffBarsSnapshots`
    pattern. For pure-core algorithms the older "chronix in-process
    vs reference DOM" pattern (no helper import) is still valid.

- If the section instead contains the declaration `**chronix-new — no
parity assertion possible.**` followed by a non-empty rationale:
  - `✅ Parity: chronix-new declared with rationale`

- If the section is empty / missing / has neither a table nor a
  declaration:
  - `❌ Parity assertion plan section is empty or missing. Either list
parity assertions or declare chronix-new with rationale.`

### 2. Algorithm-code touched check

```bash
# Files this phase touched relative to the design doc commit.
git log --name-only --pretty=format: <design-doc-commit-sha>..HEAD \
  | grep -E '^(packages/gantt/src/(layout|interaction|render|api)/|adapters/vue3/src/)' \
  | grep -v '\.test\.ts$' \
  | sort -u
```

If this list is non-empty AND the parity plan section was the
chronix-new declaration (from check 1), warn:

- `⚠ Algorithm code modified but parity plan was chronix-new. Confirm
the rationale still applies — re-read it. (Not a hard fail; the
rationale may legitimately apply.)`

### 3. Journal entry check

```bash
ls D:/work/chronix/audit/journal/*.md
```

Read the most recent journal file. Look for a section starting with
`## Phase <N>` (matching the phase number) AND containing the
required sub-sections:

- `### Reference reading (Phase <N>)` — must be non-empty
- `### Mechanisms understood (Phase <N>)` — must be non-empty
- `### Chronix work derived (Phase <N>)` — must be non-empty
- `### Bugs / gotchas hit (Phase <N>)` — may be empty (no bugs is OK)
- `### Naming justifications (Phase <N>)` — must be non-empty if any
  new chronix-named symbols were introduced
- `### Open / parked (Phase <N>)` — may be empty if catalog was fully
  ✅-port

If all required sub-sections are present and non-empty:
`✅ Journal entry: Phase <N> section complete`

Else: `❌ Journal entry incomplete or missing. Required sub-sections:
<list of empty/missing>`

### 4. Memory file update check

Read `C:/Users/liaoyu/.claude/projects/d--work-reference/memory/project_gantt_rewrite_plan.md`.

Check that:

- The `description:` frontmatter field mentions the current phase
  number (e.g. `Phase <N> ... DONE`)
- The vitest total in the description matches the actual count from
  the most recent test run

```bash
cd D:/work/chronix && pnpm test 2>&1 | grep -E 'Tests\s+[0-9]+\s+passed' | tail -1
```

Compare the count in the description vs the actual. If different:
`❌ memory project_gantt_rewrite_plan.md description has stale test
count: <description-N> vs actual <run-N>`

Also check that `MEMORY.md` index line for this memory has the same
updated phase number / test count.

If both match:
`✅ Memory updated: description mentions Phase <N>, count matches`

### 5. Status flip readiness check

Verify the design doc's `Status:` line is still `Approved (pending
user reply)`. If it's already `DONE`, report:
`❌ Status already says DONE — this gate was bypassed. Verify
checks 1–4 manually.`

Otherwise: `✅ Status field is in pre-DONE state, ready to flip`.

### 6. ci-check freshness

```bash
cd D:/work/chronix && pnpm ci-check
```

If green:
`✅ ci-check green (format / lint / typecheck / test / build / audit:names)`

If red, fail the gate with the failing step:
`❌ ci-check failed at <step>. Resolve before closing.`

### 6.5 Cross-demo screenshot diff freshness — Phase 20.7

```bash
cd D:/work/chronix/tooling/golden-runner && pnpm cross-demo-verify
```

This runs the 25-scenario pixel-diff gate (12 cross vs reference baseline

- 13 vrt vs chronix self-baseline). Tolerance is fixed at
  `maxDiffPixelRatio: 0` + `threshold: 0.2` (pixel-perfect modulo AA).

Pre-conditions:

- Both demos must be running: reference at `http://localhost:8701/` AND
  chronix at `http://localhost:8702/`. If either is down, this step
  fails with a Playwright navigation timeout. Start them via
  `pnpm --filter @chronix/example-gantt-vue3 dev` (chronix) and the
  equivalent in reference's demo dir before retrying.
- Baselines must exist under
  `tooling/golden-runner/goldens/cross-demo-baselines/{reference,chronix}/<id>.png`.
  Missing baselines fail with "snapshot doesn't exist". If this
  happens, the phase was closed without baselines being captured —
  out-of-band failure. Run `pnpm cross-demo-capture` to bootstrap,
  manually review every generated PNG, commit them in a dedicated
  baseline commit, then re-run.

If green:
`✅ cross-demo screenshot diff (25 scenarios passed; X cross + Y vrt;
Z test.fail-passing as expected)`

If red (a scenario that was previously passing now fails):

- The current phase likely introduced a visual regression. Inspect
  the diff PNG (Playwright writes to `test-results/<test-name>/`)
  and decide whether to fix the regression in the current phase
  OR open a follow-up micro phase + add a `test.fail()` mark with
  the follow-up phase number.
- If a `test.fail()`-marked scenario unexpectedly passes (green
  inside a `test.fail()` block), Playwright reports it as a failure
  with `Expected to fail, but passed`. This is the GOOD case: the
  follow-up phase has been silently completed. Remove the
  `test.fail()` mark, refresh the baseline if needed, close the
  follow-up phase's tracking entry.
- If reference baselines changed (rare), refresh baselines via
  `pnpm cross-demo-capture`, PNG-by-PNG manual review, commit the
  refreshed baselines in a dedicated commit (NOT mixed with feature
  work), then re-verify.

Report `❌ cross-demo screenshot diff failed: <N> scenario(s)
unexpectedly failed: <list>` and refuse to flip Status to DONE.

## Final summary

After all 7 checks (6 standard + 6.5 cross-demo diff), output:

- All `✅`: `✅ Phase close gate PASSED for Phase <N>. Safe to flip
Status to DONE.` Then propose the exact `Status:` line edit + the
  exact MEMORY.md description-line edit. Do NOT make the edits
  automatically — the user invokes the skill to verify, and the user
  decides when to flip the status.

- Any `❌`: `❌ Phase close gate FAILED. <count> blocker(s):` followed
  by an ordered list of what needs to be fixed. Do NOT attempt to
  fix them automatically; report and let the user decide.

## Edge cases / fail-open behavior

- If git is dirty (uncommitted changes), check 2 may include
  uncommitted files. That's intentional — close-time should see all
  pending work.
- If the design doc has multiple phase numbers (e.g. design doc
  bundles two phases), ask the user which `<N>` is the target.
- If the user is closing an `audit/PHASE_*_DESIGN.md` that's marked
  `SKIPPED` (Phase 13, Phase 15 precedents), checks 1–3 don't apply
  — just verify the SKIPPED record explains why and confirm the
  MEMORY.md index line reflects the skip.

## Why this skill exists

`audit/PARITY_RECHECK.md` (2026-05-15) is the receipt for what
happens without this gate. Phases 7–16 each individually felt fine to
close — vitest green, chronix VRT idempotent, ci-check passing. But
the cross-phase pattern was that side-by-side reference-vs-chronix
verification got dropped silently. The 🔴 BLOCKING `weekendsVisible`
drift in axis-range-planner is the proof — it has zero references in
333 lines of planner code while the type docstring promises a real
filter. No vitest or VRT could have caught this; only a parity
assertion driving reference demo with `weekends: false` could.

This skill makes the parity gate explicit and checklist-driven so the
discipline survives across sessions and across the inevitable "just
mark it DONE, all the tests are green" pressure.
