# Phase 22.AUTOMATE — Catalog-completeness CI gate

**Status**: **DONE (2026-05-16)**. Landed as 2 commits: `dbb3c36` (design doc, 154 lines) + `bcb0c44` (Commit 1: baseline JSON 359 items + scanner 125 LOC + self-test 220 LOC + ci-check wiring + 6-alias backfill, 745 lines). chronix-new declaration (no parity assertion possible — infrastructure script, not a k-ui feature port). 5/5 self-test cases pass. `pnpm audit:catalog` scans 359 k-ui surface items × 32 audit files in milliseconds; wired as the 7th step of `pnpm ci-check` (after `audit:names`). `/phase-close` skill walked all 6 gates green. Silent-gap class structurally prevented: any future PHASE\_\*\_DESIGN.md that fails to disposition a k-ui surface item, or any new k-ui surface item added to baseline without a chronix disposition row, will fail CI. See `audit/journal/2026-05-13.md` "Phase 22.AUTOMATE" section.

## Problem

The silent-gap audit-sweep (2026-05-16, see [`SILENT_GAP_SWEEP_2026-05-16.md`](SILENT_GAP_SWEEP_2026-05-16.md)) found ~170 k-ui surface items with no chronix catalog row AND no PARITY*RECHECK disposition. Root cause: catalog discipline (per `feedback_no_logic_drift_from_kui.md`) is enforced by human-author care during PHASE*\*\_DESIGN.md writing, not by tooling. Author writes catalog ROWS for items they're thinking about that day; adjacent k-ui surface items get silently skipped.

Two existing chronix gates use the same enforcement pattern at lower levels:

- `scripts/check-banned-names.mjs` (`pnpm audit:names`) — banned identifier scan
- `/phase-close` skill — phase-boundary 7-gate check including parity assertion presence

Catalog completeness has no equivalent. This phase adds one.

## Reference (k-ui) behavior surface — full catalog

**chronix-new — no parity assertion possible.** Rationale: this phase adds infrastructure (a CI gate script + baseline file), not a k-ui feature port. There is no k-ui counterpart to enumerate.

## Approach

### Frozen baseline file

A new file `audit/KUI_SURFACE_BASELINE.json` enumerates every k-ui public surface item in scope for chronix coverage. Sourced from `SILENT_GAP_SWEEP_2026-05-16.md`'s enumeration.

```json
{
  "version": "2026-05-16",
  "description": "Frozen enumeration of k-ui public surface items chronix tracks. Each item must have a disposition in audit/PARITY_RECHECK.md OR a catalog row in some audit/PHASE_*_DESIGN.md. Updated when k-ui ships new surface items.",
  "surfaces": {
    "options": ["headerToolbar", "footerToolbar", "eventOverlap", "todayBgColor", ...],
    "theme": ["pageBgColor", "borderColor", "todayBgColor", ...],
    "args": ["EventContentArg", "EventClickArg", "DayHeaderContentArg", ...],
    "api": ["changeView", "next", "prev", "today", "gotoDate", "scrollToTime", ...],
    "viewSpec": ["type", "component", "buttonText", "dateProfileGeneratorClass", ...],
    "cssClasses": [".gantt-event", ".gantt-toolbar", ".gantt-timeline-today-line", ...]
  }
}
```

Each list is the bare item name; no semantics, no chronix mapping. The script only needs presence-detection.

### Script: `scripts/audit-catalog-completeness.mjs`

For each baseline item, scan `audit/**/*.md` and require the item name to appear in at least one file. Substring match (case-sensitive). Fail with the missing-item list if any.

```js
import { readFile, readdir } from 'node:fs/promises';
import { glob } from 'node:fs/promises'; // node 20+
// ... resolve ROOT, read baseline, build audit corpus, scan items

if (missing.length > 0) {
  console.error(`❌ ${missing.length} k-ui surface items lack chronix audit coverage:\n`);
  for (const { surface, item } of missing) {
    console.error(`  - [${surface}] ${item}`);
  }
  console.error(
    `\nFix: add a row in audit/PARITY_RECHECK.md disposition register OR a catalog row in some audit/PHASE_*_DESIGN.md.`,
  );
  process.exit(1);
}
console.log(`✓ catalog-completeness scan clean (${total} k-ui items, all dispositioned)`);
```

### Wiring

- `package.json` (root) — `"audit:catalog": "node scripts/audit-catalog-completeness.mjs"`
- `ci-check` script — append after `audit:names`:
  ```
  "ci-check": "pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm audit:names && pnpm audit:catalog"
  ```
- `turbo.json` — no change (the audit:catalog script doesn't go through turborepo)

### Coverage method — substring match, not strict table-row parsing

Rationale: `eventSelectedOverlayColor` appears in PARITY_RECHECK.md inside an HTML-rendered markdown table row, but also might appear as `\`eventSelectedOverlayColor\`` (backtick-wrapped) or inside a paragraph. A strict table-row parser would reject the latter; substring match accepts any mention. False-positive risk: a typo / commented-out / reject-rationale mention also counts as "covered". Accepted trade-off: false positives cost is "we think it's covered but it's not"; the bigger risk is silent gap (catalog miss → drift). Lenient match catches the bigger risk.

### Maintenance model

The baseline file is committed and human-maintained:

1. **k-ui adds new public option**: discovered via periodic re-audit. Add to baseline JSON; expect CI fail; add disposition.
2. **k-ui removes deprecated option**: remove from baseline. No-op for the gate.
3. **chronix adds chronix-new symbol** (e.g. `cx-gantt-link`): NOT in baseline (which is k-ui-only); no action needed.

The baseline IS the explicit enumeration of the k-ui surface chronix tracks; the script enforces 100% catalog coverage of that enumeration.

### Alternatives considered + rejected

- **Parse `d:/work/k-ui/packages/gantt/src/options.ts` directly each CI run**: rejected — adds k-ui repo as a hard dependency of chronix's CI; fragile when k-ui is moved/renamed.
- **Strict markdown-table-row parsing**: rejected per coverage-method rationale above.
- **Generate baseline from SILENT_GAP_SWEEP markdown automatically**: rejected — markdown is a presentation format; JSON is a contract. Duplication is intentional (the JSON is the source of truth for the gate, the markdown is the discussion document for humans).

## Parity assertion plan — MANDATORY

**chronix-new — no parity assertion possible.** Rationale: this phase adds a CI script + baseline data; it does not change rendered DOM, IR, transactions, or any algorithmic code path. There is no chronix vs k-ui behavior to compare. The script's correctness is verified by:

1. Running it against the current state — must produce 0 failures (silent-gap sweep just dispositioned every enumerated item)
2. A self-test fixture demonstrating "missing item" produces a non-zero exit code
3. A self-test fixture demonstrating "all items present" produces zero exit code

## Test coverage

- `scripts/audit-catalog-completeness.test.mjs` (new, ~5 tests):
  - `runs cleanly when every baseline item is present in audit corpus` — uses the actual baseline + audit/ files; must pass
  - `fails when a baseline item is missing` — constructs a temp baseline with a never-mentioned token; expects exit 1
  - `prints the missing item with surface label` — exit-1 stderr contains the right format
  - `parses the JSON baseline correctly` — validates baseline schema
  - `covers all 6 surfaces (options, theme, args, api, viewSpec, cssClasses)` — every surface is scanned
- No core or adapter changes.
- No parity-spec change.

## VRT impact

**None**. No rendered output changes.

## Execution plan — 1 commit + wrap-up

### Commit 1: `chore(audit): catalog-completeness CI gate (Phase 22.AUTOMATE)`

- `audit/KUI_SURFACE_BASELINE.json` (new) — frozen enumeration extracted from SILENT_GAP_SWEEP_2026-05-16.md
- `scripts/audit-catalog-completeness.mjs` (new) — the gate script
- `scripts/audit-catalog-completeness.test.mjs` (new) — self-test
- `package.json` — `audit:catalog` script + append to `ci-check`
- **Anti-regression**: existing 483 vitest + 31 parity assertions + 27 cross-demo stay green
- **Self-verify**: `pnpm audit:catalog` exits 0 against current state; intentional baseline edit (add a fake item) exits 1

### Commit 2 (wrap-up — REQUIRES `/phase-close` invocation)

- Journal Phase 22.AUTOMATE section
- Memory bump (description: catalog-completeness gate live; trust restored via tooling not discipline)
- Status flip → DONE

## Estimated scope

- Baseline JSON extraction from SILENT_GAP_SWEEP: ~45 min (~250 names across 6 surfaces, organized + reviewed)
- Script: ~30 min (~80 LOC including help-message + error formatting)
- Tests: ~30 min (~120 LOC, 5 cases)
- Wiring (`package.json` + maybe `turbo.json` no-op): ~10 min
- Self-verify + fix any flagged gaps: ~15 min
- Wrap-up + `/phase-close`: ~20 min
- **Total: ~2.5 hours**, ~250 LOC + ~250-item JSON baseline

## Open questions

Three load-bearing decisions (per `feedback_quality_acceleration.md`):

1. **Baseline scope: full ~250 items (Section A.1 through G in SILENT_GAP_SWEEP) vs MVP ~100 items (just options + theme + API; defer args + cssClasses to Phase 22.AUTOMATE.v2)?** Recommend **full**. Reasoning: user explicit ask "no audit-v2"; partial coverage leaves the same silent-gap class for arg shapes + CSS classes (already a known finder of gaps — `.gantt-day-today` matches `.todayBgColor` cluster pattern).

2. **Match strictness: substring (lenient) vs anchored word-boundary `\beventOverlap\b` (medium) vs strict markdown-table-cell parsing (strict)?** Recommend **substring**. Reasoning: minimizes false-negatives (the dangerous class). False positives (e.g. a banned-name mention in `BANNED_IDENTIFIERS.md` counting as "cataloged") are tolerable — the discussion still surfaces the item. Word-boundary is a possible MVP+ refinement if false positives become a problem.

3. **CI placement: 7th step of `ci-check` (post-`audit:names`) vs separate `pnpm audit:all` umbrella?** Recommend **7th step of `ci-check`**. Reasoning: every commit hook should fail on silent gaps — same urgency as banned-names + tests. Umbrella adds an indirection step without changing the gate's reach.

Reply **按照推荐继续** to accept all three (full baseline, substring match, ci-check 7th step) and proceed to Commit 1.
