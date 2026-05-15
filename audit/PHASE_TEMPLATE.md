# Phase N — \<title>

**Status**: **Approved (pending user reply)** — design only; no code yet.

> Copy this template when starting a new chronix phase. Replace `N` and
> `\<title>` and fill every required section. Sections marked **MANDATORY**
> cannot be omitted — `/phase-close` will fail if they're missing or
> empty.

## Problem

<!-- 1–3 paragraphs. What's the gap in chronix today? Why does it
matter? What's the parity-reference equivalent so the reader can
ground the discussion? -->

## Reference (k-ui) behavior surface — full catalog

<!-- MANDATORY. Walk the relevant k-ui files (cite path:lines).
Enumerate every sub-behavior in scope, with disposition:
  ✅ port      — chronix v0 will match
  ⏸️ parked    — chronix v0 will skip; document the path forward
  ❌ rejected  — chronix v0 will deliberately not have this
The catalog table is what protects against silent gaps. See
PARITY_RECHECK.md for the cost of skipping it.

Format:

| Item | k-ui | chronix v0 | Reason |
| ---- | ---- | ---------- | ------ |
| ...  | ✅   | ✅ port    | ...    |
-->

## Approach

<!-- API surface after this phase (props / emits / composables / etc.).
Internal mechanism notes (algorithm, data flow, edge cases).
Alternatives considered + why rejected.
Sample consumer code if API changes shape. -->

## Parity assertion plan — MANDATORY

<!-- This section is what closed the discipline gap exposed by
audit/PARITY_RECHECK.md (2026-05-15). Phase 7 through 16 skipped
this section because it didn't exist in the template; the result
was 1 🔴 BLOCKING drift + many 🟡 architectural divergences whose
blast radius was unknown.

Every phase touching algorithm code in:
  packages/gantt/src/{layout,interaction,render,api}/**
  adapters/vue3/src/**
MUST list at least one side-by-side k-ui-vs-chronix assertion to be
added to tooling/golden-runner/tests/parity.spec.ts in the SAME
commit as the implementation.

If the phase is genuinely chronix-new (no k-ui counterpart — e.g.
slot registry, selection model, sidebar resize), state:

  **chronix-new — no parity assertion possible.** Rationale: …

The rationale field is what /phase-close checks for: an empty
parity-assertion list with no chronix-new declaration blocks the
phase from being marked DONE. -->

| Assertion id (in parity.spec.ts) | Drives k-ui demo via | Drives chronix demo via | Compares | Tolerance |
| -------------------------------- | -------------------- | ----------------------- | -------- | --------- |

### Or — chronix-new declaration

<!-- Delete the table above and fill this block if no k-ui counterpart
exists. Otherwise delete this block. -->

**chronix-new — no parity assertion possible.** Rationale: …

## Test coverage

<!-- Vitest unit / SFC tests, plus the parity assertions from the
section above. Aim for one bullet per test file + count.

  - core: `packages/gantt/src/<area>/<file>.test.ts` (+N tests)
  - adapter: `adapters/vue3/src/<file>.test.ts` (+N tests)
  - parity: `tooling/golden-runner/tests/parity.spec.ts` (+M assertions)

Document drift-detection scope: which inputs do these assertions
cover? Which are NOT covered (e.g. host-toggled options the demo
doesn't exercise)? -->

## VRT impact

<!-- None expected? Or 5 baselines need rebaseline? If rebaseline,
explain the geometric / pixel change. If none, briefly justify why
(e.g. "runtime-only emits, no DOM"). -->

## Execution plan — \<N> commits + wrap-up

<!-- One commit per logical chunk. Each commit gets a heading + bullet
list of what lands. The LAST commit is always the wrap-up.

  ### Commit 1: <name>
  - ...
  - ...

  ### Commit 2 (wrap-up — REQUIRES /phase-close invocation)

  Before flipping this design doc's Status to DONE OR adding the
  "Phase N — DONE" section to audit/journal/, MUST invoke
  /phase-close skill (see .claude/skills/phase-close/SKILL.md). The
  skill verifies:
    - parity.spec.ts has the assertions listed above (or chronix-new
      declaration is present)
    - audit/journal/ has a Phase N section
    - memory project_gantt_rewrite_plan.md test count + phase status
      updated
    - audit/PHASE_<N>_<TITLE>_DESIGN.md status flipped to DONE -->

## Estimated scope

<!-- Hours per commit + total. Helps user gauge before approving. -->

## Open questions for the user

<!-- 5–10 numbered yes/no questions covering the recommended defaults.
End with: "Reply **按照推荐继续** to accept all defaults (...)." -->
