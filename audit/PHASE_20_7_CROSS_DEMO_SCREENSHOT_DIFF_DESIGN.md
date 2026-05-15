# Phase 20.7 — Cross-demo screenshot diff infrastructure

**Status**: **Approved (pending user reply)** — design only; no code yet.

## Problem

Phase 20.5 + 20.6 closed the discipline gap for **DOM-level** parity:
every algorithm-touching phase now adds a `parity.spec.ts` assertion
in ~5 LOC by reusing centralized snapshot helpers, and the demo's
toggle space is URL-addressable so any combination is reproducible by
URL alone.

But **DOM-level parity is not pixel-level parity**. The current 27
parity assertions verify bar `(x, width)`, computed `fill`, tick
text + bbox, sidebar column widths — they pair elements by id and
compare per-field. What they cannot catch:

1. **Inter-element layout artifacts** — a 1px gap between rows, a
   weekend-cell hue, an off-by-one between bar baseline and grid line.
   No single DOM channel notices these; the eye does.
2. **Z-order regressions** — a tooltip that paints behind a bar, a
   today-line that draws over text instead of under, a selection
   highlight that's covered by a sidebar shadow. DOM parity only
   checks each layer in isolation.
3. **Anti-aliasing / stroke regressions** — a 1.5px stroke that
   renders as 2px on the chronix side because of `transform: scale()`
   stacking, or a dashed pattern that loses one dash period.
4. **Cross-cutting CSS regressions** — Phase 10 theme tokens introduced
   ~40 CSS variables; any future restyle that breaks one variable
   would silently regress dozens of scenarios that the per-phase DOM
   parity tests don't reach.

The 2.0 roadmap (~80 more phases) will push CSS, layout, and
z-stacking surface area an order of magnitude beyond what 27 DOM
assertions cover. Per the 2026-05-16 cadence audit, the cheapest way
to scale parity coverage is a **pixel-level visual regression** layer
that complements the DOM-level layer.

This phase adds the infrastructure as **two complementary registries
sharing one capture pipeline**:

1. **Cross-demo diff** — chronix's screenshot pixel-diffed against
   k-ui's. Constraint: both demos must be put into the same state via
   URL flags + DOM clicks. Catches: chronix drifting away from k-ui's
   visual contract.
2. **Chronix-only VRT extension** — chronix's screenshot pixel-diffed
   against its own frozen baseline. Used for toggles k-ui doesn't have
   (`themedBars`, `umbrellaColor`, validators-on-but-no-interaction).
   Catches: chronix regressing against its own previous state.

Both registries share one scenario file, one capture script, one
verify script, one `/phase-close` gate step. Downstream phases extend
either registry depending on whether the toggle has a k-ui analog.

This phase does **not** retroactively add scenarios beyond the initial
25 — that's per-phase work consumed by Phase 21+.

## Reference (k-ui) behavior surface — full catalog

Phase 20.7 is **infrastructure**, not a k-ui feature port. There is
no k-ui reference behavior to enumerate. The catalog instead lists
each piece of infrastructure that future feature phases will consume:

| Item                                                              | Current state                                                                                                             | Phase 20.7 disposition                                                                                                                                         | Reason                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unified scenario registry — `(viewId × URL flags × kind)`         | 6 `VISUAL_SCENARIOS` entries in `scenarios.ts`, each = `{ id, viewToggleLabel? }`. No URL flags. No `kind` discriminator. | ✅ port → `CROSS_DEMO_SCENARIOS` registry with 25 entries: 12 `kind: 'cross'` + 13 `kind: 'vrt'`                                                               | Phase 20.6's URL-config layer is the canonical scenario language; one registry, two consumers.                                                                                                                                                                                                                                                                |
| k-ui baseline PNGs                                                | None — k-ui side is currently only used in `parity.spec.ts` for DOM extraction, never screenshot-captured                 | ✅ port → `tooling/golden-runner/cross-demo-baselines/kui/<scenario>.png` (one-time capture, 12 PNGs)                                                          | Reference is k-ui; capture once, freeze, version.                                                                                                                                                                                                                                                                                                             |
| chronix-VRT extension baselines                                   | 5 existing chronix VRT baselines under `goldens/chronix-*.png` (Phase 4–18 view scales)                                   | ✅ port → `tooling/golden-runner/cross-demo-baselines/chronix/<scenario>.png` (one-time capture, 13 PNGs)                                                      | Separate dir to avoid intermixing with the existing `chronix-visual.spec.ts` goldens.                                                                                                                                                                                                                                                                         |
| Pixel-diff assertion                                              | Existing `toHaveScreenshot` compares each demo against its own snapshot — not k-ui vs chronix                             | ✅ port → new `cross-demo.spec.ts` using `expect(buffer).toMatchSnapshot(<baseline>, { maxDiffPixelRatio, threshold })`                                        | Direct compare. Diverges from same-side VRT pattern.                                                                                                                                                                                                                                                                                                          |
| Per-scenario tolerance                                            | None today (chronix VRT is `0.001`, k-ui VRT is `0.001`)                                                                  | ✅ port → fixed `maxDiffPixelRatio: 0` + `threshold: 0.2` for ALL scenarios                                                                                    | Zero ratio = no pixel may differ. Threshold 0.2 (Playwright default) absorbs sub-pixel AA noise per-pixel. Strict but achievable.                                                                                                                                                                                                                             |
| Page-chrome hiding                                                | Already in `chronix-visual.spec.ts` via `addStyleTag`                                                                     | ✅ port → factor into shared helper, apply to **both** sides                                                                                                   | k-ui demo has its own surrounding chrome that bleeds into the screenshot if not hidden.                                                                                                                                                                                                                                                                       |
| Common screenshot target                                          | k-ui: `.gantt-timeline-body-wrapper`. chronix: `.cx-gantt-body`. Different roots, different dimensions.                   | ✅ port → screenshot **only** the timeline body (sidebar excluded) on each side; force `width: max-content` for full-axis capture                              | Sidebars differ in width (288 vs 240 px); cropping to body-only eliminates the dimension mismatch.                                                                                                                                                                                                                                                            |
| `pnpm cross-demo-verify` script                                   | None                                                                                                                      | ✅ port → new pnpm script under `tooling/golden-runner` runs all 25 scenarios                                                                                  | Mirrors existing `pnpm verify` / `pnpm chronix-verify` pattern.                                                                                                                                                                                                                                                                                               |
| `/phase-close` integration                                        | 6-step gate today                                                                                                         | ✅ port → add step 6.5: `pnpm cross-demo-verify` must pass (or each failing scenario is `test.fail()`-marked with a follow-up phase number) before status flip | Without this, downstream phases would silently introduce screenshot regressions.                                                                                                                                                                                                                                                                              |
| **Day-1 baseline fix-in-phase**                                   | Hypothetical                                                                                                              | ❌ rejected — Policy II adopted                                                                                                                                | At `maxDiffPixelRatio: 0`, an estimated 3–8 of the 12 cross-demo scenarios will fail first capture. Fixing all of them in this phase would balloon scope from ~4h to 8–15h, violating the "single-session, no batch" acceleration constraint. Each failing scenario instead becomes a follow-up micro-phase (20.7.1, 20.7.2, …) registered via `test.fail()`. |
| **Per-region diff masks**                                         | Hypothetical                                                                                                              | ⏸️ parked                                                                                                                                                      | Lands when a scenario genuinely needs sub-region control (no current need at `threshold: 0.2`).                                                                                                                                                                                                                                                               |
| **Cross-demo interaction replays** (drag a bar, screenshot after) | None                                                                                                                      | ⏸️ parked v2.x                                                                                                                                                 | Lands with Phase 22 toolbar (first phase needing button-click parity). Phase 20.5's catalog already deferred recording-replay; aligning here.                                                                                                                                                                                                                 |
| **Auto-refresh of k-ui baselines per milestone**                  | Hypothetical                                                                                                              | ❌ rejected                                                                                                                                                    | Auto-refresh masks the case where k-ui and chronix drift the same direction. Frozen + manual `pnpm cross-demo-capture` opt-in chosen instead.                                                                                                                                                                                                                 |

## Approach

### Scenario registry shape

A new module `tooling/golden-runner/src/cross-demo-scenarios.ts`
exports the unified registry. Each scenario carries:

```ts
export interface CrossDemoScenario {
  /** Stable id used in baseline filename + test name. */
  readonly id: string;
  /**
   * Discriminator:
   * - `'cross'`: pixel-diff chronix screenshot against k-ui baseline.
   *   Requires `urlQuery` representable on BOTH demos.
   * - `'vrt'`: pixel-diff chronix screenshot against chronix baseline.
   *   Used for chronix-only toggles (themedBars, umbrellaColor)
   *   that have no k-ui analog.
   */
  readonly kind: 'cross' | 'vrt';
  /** One-line description surfaced in test name. */
  readonly description: string;
  /**
   * Phase 20.6 URL query applied to chronix. For `kind: 'cross'` the
   * helper additionally clicks the k-ui-side equivalents during
   * page setup (currently view-toggle only; future cross-demo
   * toggles would extend the helper's k-ui-translation map).
   * For `kind: 'vrt'` only chronix opens; k-ui is not loaded.
   * Parity mode (`parity=true`) is implicit for `kind: 'cross'`
   * — DON'T include it in the urlQuery; the helper always adds it.
   */
  readonly urlQuery: string;
  /** View toggle button label clicked after page load. Same shape as `VisualScenario.viewToggleLabel`. */
  readonly viewToggleLabel?: string;
}
```

Note: `maxDiffPixelRatio` and `threshold` are NOT per-scenario fields.
They're fixed at `0` and `0.2` globally per the resolved Decision A.
If a future scenario truly cannot meet that bar (rare), it goes to
`test.fail()` with a follow-up phase number — not a tolerance bump.

### Initial registry — 25 scenarios

**Group 1: 12 `kind: 'cross'` scenarios** (k-ui baseline + chronix pixel-diff)

All run in parity mode (chronix `?parity=true` is implicit). k-ui demo
is in default state plus view-toggle. Constraint: every URL flag here
must produce visually-identical rendering on both sides when k-ui is
in default state — verified pre-capture.

| #   | id                                  | view     | chronix URL flags       | k-ui state                | Drift class targeted                                                   |
| --- | ----------------------------------- | -------- | ----------------------- | ------------------------- | ---------------------------------------------------------------------- |
| 1   | `cross-week-default`                | week     | (parity only)           | default + week            | Default load anchor: full-bar geometry, default fill, header layout.   |
| 2   | `cross-view-day`                    | day      | (parity only)           | default + day click       | Day-view tick rendering (hour labels), highest tick density.           |
| 3   | `cross-view-month`                  | month    | (parity only)           | default + month click     | Month-view header band layout.                                         |
| 4   | `cross-view-season`                 | season   | (parity only)           | default + season click    | Season view: long axis, low tick density.                              |
| 5   | `cross-view-half-year`              | halfYear | (parity only)           | default + half-year click | Half-year axis stress.                                                 |
| 6   | `cross-view-year`                   | year     | (parity only)           | default + year click      | Year axis — widest viewport, most subdivision.                         |
| 7   | `cross-week-priorityCallback`       | week     | `priorityCallback=true` | default + week            | Phase 20 callback-driven per-bar color, parity palette.                |
| 8   | `cross-view-day-priorityCallback`   | day      | `priorityCallback=true` | default + day click       | Callback × day-view density crossing.                                  |
| 9   | `cross-view-month-priorityCallback` | month    | `priorityCallback=true` | default + month click     | Callback × month-view crossing.                                        |
| 10  | `cross-week-editable-off`           | week     | `editable=false`        | default + week            | Drag/resize disabled; tests interaction-state-doesn't-leak-into-paint. |
| 11  | `cross-week-selectable-off`         | week     | `selectable=false`      | default + week            | Range-select disabled; same rationale.                                 |
| 12  | `cross-week-eventOverlap-on`        | week     | `eventOverlap=true`     | default + week            | Phase 19 validator on; tests validators-don't-leak-into-initial-paint. |

**Group 2: 13 `kind: 'vrt'` scenarios** (chronix self-baseline)

These exercise chronix-only toggles (`themedBars`, `umbrellaColor`)
and Phase 19 validators on non-week views, where there's no k-ui
analog. Baseline captured once from chronix master; future runs verify
chronix hasn't drifted from itself.

| #   | id                                          | view  | chronix URL flags                          | Why VRT (not cross)                                                                                          |
| --- | ------------------------------------------- | ----- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| 13  | `vrt-week-themedBars`                       | week  | `themedBars=true`                          | `themedBars` is a chronix-only prop API; k-ui has no equivalent.                                             |
| 14  | `vrt-week-umbrellaColor`                    | week  | `umbrellaColor=true`                       | `barColor` umbrella prop is chronix-only.                                                                    |
| 15  | `vrt-week-priorityCallback-no-parity`       | week  | `priorityCallback=true`                    | Same callback as #7, but on chronix's own sample data — different bar layout, different palette interaction. |
| 16  | `vrt-view-day-themedBars`                   | day   | `themedBars=true`                          | themedBars × day axis.                                                                                       |
| 17  | `vrt-view-month-themedBars`                 | month | `themedBars=true`                          | themedBars × month.                                                                                          |
| 18  | `vrt-view-year-themedBars`                  | year  | `themedBars=true`                          | themedBars × year (longest axis).                                                                            |
| 19  | `vrt-view-day-umbrellaColor`                | day   | `umbrellaColor=true`                       | umbrellaColor × day.                                                                                         |
| 20  | `vrt-week-eventConstraint`                  | week  | `eventConstraint=true`                     | Phase 19 constraint validator (initial paint should be identical to default; this guards that).              |
| 21  | `vrt-week-eventAllow`                       | week  | `eventAllow=true`                          | Phase 19 eventAllow validator.                                                                               |
| 22  | `vrt-week-selectAllow`                      | week  | `selectAllow=true`                         | Phase 19 selectAllow validator.                                                                              |
| 23  | `vrt-week-themedBars-editable-off`          | week  | `themedBars=true&editable=false`           | Compound toggle stress: styling × interaction state.                                                         |
| 24  | `vrt-week-priorityCallback-umbrellaColor`   | week  | `priorityCallback=true&umbrellaColor=true` | Compound styling: callback + umbrella. Tests precedence (callback should win).                               |
| 25  | `vrt-view-month-priorityCallback-no-parity` | month | `priorityCallback=true`                    | priorityCallback × month on chronix data. Different from #9 (parity dataset).                                |

### Helper additions to `parity-helpers.ts`

Two new exported helpers:

```ts
/**
 * **Phase 20.7: open one demo (k-ui OR chronix) and capture the
 * timeline-body screenshot.**
 *
 * Targets the body-wrapper element (not the chart-root) so the
 * sidebar — which has different widths in the two demos — is
 * excluded from the captured rect. Injects page-chrome-hiding CSS
 * before capture so the demo's surrounding header / sidebar /
 * banner don't leak in. Installs frozen clock, navigates, applies
 * scenario's URL flags + view-toggle click.
 *
 * For `source === 'kui'`, the helper currently only honors the
 * scenario's `viewToggleLabel` — k-ui demo doesn't yet expose the
 * full Phase 20.6 URL-config layer. When a future cross-demo
 * scenario needs a k-ui-side toggle beyond view, extend this helper's
 * k-ui-translation map (per scenario) and re-capture the baseline.
 *
 * Returns the PNG buffer. Caller pixel-diffs via
 * `expect(buffer).toMatchSnapshot(...)`.
 */
export async function captureCrossDemoScreenshot(
  source: 'kui' | 'chronix',
  browser: Browser,
  scenario: CrossDemoScenario,
): Promise<Buffer>;

/**
 * **Phase 20.7: page-chrome-hide CSS for the screenshot target.**
 * Source-specific selector list. Chronix selectors are inlined here;
 * k-ui selectors are sourced from `reference-dom-map.ts` per the
 * existing no-external-repo-refs rule.
 */
async function hidePageChrome(page: Page, source: 'kui' | 'chronix'): Promise<void>;
```

### Two-script workflow

**Tier 1 — baselines (one-time, manual).**

`pnpm cross-demo-capture` walks the registry and writes baselines:

- For each `kind: 'cross'` scenario: capture k-ui side → `cross-demo-baselines/kui/<id>.png`
- For each `kind: 'vrt'` scenario: capture chronix side → `cross-demo-baselines/chronix/<id>.png`

Run once at phase-end. Re-run only when k-ui upstream changes
intentionally (cross baselines) or when a chronix-VRT scenario's
expected rendering is deliberately updated (vrt baselines).

**Tier 2 — verify (every phase).**

`pnpm cross-demo-verify` runs `cross-demo.spec.ts`:

```ts
for (const scenario of CROSS_DEMO_SCENARIOS) {
  test(`${scenario.kind} :: ${scenario.id}`, async ({ browser }) => {
    const buffer = await captureCrossDemoScreenshot('chronix', browser, scenario);
    const baseline =
      scenario.kind === 'cross'
        ? `cross-demo-baselines/kui/${scenario.id}.png`
        : `cross-demo-baselines/chronix/${scenario.id}.png`;
    expect(buffer).toMatchSnapshot(baseline, {
      maxDiffPixelRatio: 0,
      threshold: 0.2,
    });
  });
}
```

Verify-only path is fast: 25 scenarios × one chronix capture each =
~75 sec. The k-ui side is never re-opened during verify — its
baselines are frozen PNGs.

### Day-1 baseline-fail handling — Policy II

At `maxDiffPixelRatio: 0`, an estimated 3–8 of the 12 `kind: 'cross'`
scenarios will fail their first verify (post-baseline-capture). This
is expected and is what makes the gate valuable. Resolution policy:

1. After Commit 2's k-ui baseline capture, run `pnpm cross-demo-verify`.
2. For each failing scenario, inspect the diff PNG. Categorize:
   - **(a) Real chronix bug**: chronix has a visual regression vs k-ui
     that the DOM parity layer didn't catch. Open a follow-up micro
     phase (20.7.1, 20.7.2, …) with a clear scope: fix the specific
     visual gap. Register the scenario as `test.fail()` in Phase 20.7
     itself with a `// follow-up: Phase 20.7.N — <description>`
     comment.
   - **(b) Known parked discrepancy**: scenario covers something
     chronix has deliberately not yet ported (e.g. resource-grouping
     row order from PARITY_RECHECK.md `🟡` items). Same `test.fail()`
     treatment with a pointer to the parked-item entry.
   - **(c) Demo state mismatch**: the k-ui side wasn't actually put
     into the equivalent state. Fix the capture helper's k-ui
     translation. Re-capture baseline. Re-verify.
3. Phase 20.7 wraps with all 25 tests passing (either truly green OR
   `test.fail()`-passing-because-expected-to-fail).
4. The journal's "Open / parked (Phase 20.7)" sub-section lists every
   `test.fail()`-marked scenario with its follow-up phase number.

This policy keeps Phase 20.7 scoped to infrastructure (per the
acceleration constraint) while still landing a usable gate. Each
follow-up micro phase is single-session and small (one scenario fix).

### Backward compatibility

- All existing 27 parity DOM assertions stay green; this phase adds a
  new test file (`cross-demo.spec.ts`), doesn't modify
  `parity.spec.ts`.
- The existing 5 chronix VRT + 6 k-ui parity goldens stay green —
  different snapshot dir (`cross-demo-baselines/` vs `goldens/`).
- `pnpm verify` / `pnpm chronix-verify` continue unchanged. The new
  `pnpm cross-demo-capture` / `pnpm cross-demo-verify` are additive.

### `/phase-close` integration

Add a new step **6.5** in `.claude/skills/phase-close/SKILL.md`,
between ci-check (step 6) and the final summary:

````markdown
### 6.5 Cross-demo screenshot diff freshness

​`bash
cd D:/work/chronix/tooling/golden-runner && pnpm cross-demo-verify
​`

If green: `✅ cross-demo screenshot diff (25 scenarios; X cross + Y vrt; Z test.fail-passing)`

If red, fail the gate with the failing scenario list. Suggested next steps:

- If the scenario is meant to be `test.fail()`-passing but instead
  green-passed: chronix improved. Remove the `test.fail()` mark,
  refresh the baseline, close the follow-up micro phase.
- If a previously-passing scenario newly fails: this phase introduced
  a regression. Investigate before closing.
- If k-ui upstream changed (rare), re-run `pnpm cross-demo-capture`
  to refresh the frozen k-ui baselines, manual PNG review, commit
  refreshed baselines in a dedicated commit.
````

## Parity assertion plan — MANDATORY

This phase is **parity infrastructure**, not a feature port.

**chronix-new — no parity assertion possible.** Rationale: Phase 20.7
adds testing infrastructure (scenario registry, screenshot capture
helper, pnpm scripts, baseline directories, `/phase-close` step 6.5).
It does **not** change rendered DOM or computed styles in either
demo, so there is no new behavior to assert side-by-side in
`parity.spec.ts`. The first downstream phase using this infrastructure
(Phase 21 — todayLine + nowIndicator) will register the first
new cross-demo scenarios.

The phase's quality bar is **three-pronged**:

1. **Internal correctness of the helpers** — `captureCrossDemoScreenshot`
   produces a screenshot of the expected element + the right
   dimensions; page-chrome is fully hidden; frozen-clock is honored.
   Verified by ~5 unit assertions in `cross-demo-helpers.unit.spec.ts`.
2. **End-to-end gate validation** — after capturing all 25 baselines,
   run `pnpm cross-demo-verify` on current chronix master. Document
   in the journal: how many scenarios pass green vs `test.fail()`-pass
   vs fail-with-follow-up.
3. **Fault-injection smoke test** — temporarily hardcode a chronix
   bar fill to a wrong color, re-run verify, confirm the diff catches
   the regression. Revert.

## Test coverage

- core: no new core code (helpers live in `tooling/golden-runner/`)
- adapter: no new adapter code
- golden-runner unit tests:
  `tooling/golden-runner/tests/cross-demo-helpers.unit.spec.ts`
  (new file, ~5 tests):
  - `CROSS_DEMO_SCENARIOS` has 25 entries with unique ids
  - 12 entries have `kind: 'cross'`, 13 have `kind: 'vrt'`
  - Each scenario's `urlQuery` is a parseable query string
  - Each scenario id is filename-safe
  - `kind: 'cross'` scenarios never include `parity=true` in
    `urlQuery` (helper adds it implicitly)
- golden-runner e2e:
  `tooling/golden-runner/tests/cross-demo.spec.ts` (new file, 25
  scenario tests, run via `pnpm cross-demo-verify`). Of these, the
  count of green vs `test.fail()`-passing is recorded in the journal
  but not asserted at file-load time (would couple the test file to
  changing follow-up status).
- existing parity.spec.ts (27 assertions): unchanged, all green
- existing chronix-visual.spec.ts (5 baselines): unchanged
- existing visual.spec.ts (6 k-ui parity goldens): unchanged

Drift-detection scope: the 25 scenarios cover each of the 6 view
scales × the most-visited Phase 4–20 toggles + their highest-value
crossings. **Not covered**: validators that fire during interaction
(eventOverlap actually rejecting a drop, etc.) — those need
interaction-replay, parked for Phase 22. **Not covered**: large-data
scaling (parity dataset is 25 bars × 32 rows; cases with 500+ bars
are out of scope v0). **Not covered**: chronix-only toggles cross-
diffed against k-ui — `themedBars` / `umbrellaColor` are pure VRT
(no k-ui analog). All documented under "Open / parked" in the journal.

## VRT impact

**None for existing baselines.** No rendered output changes in either
demo. The 25 new baselines live in a separate directory
(`tooling/golden-runner/cross-demo-baselines/`); they don't replace
or modify the existing 5 chronix VRT + 6 k-ui parity goldens.

## Execution plan — 2 commits + wrap-up

### Commit 1: `feat(golden-runner): scenario registry + cross-demo capture helper (Phase 20.7)`

- `tooling/golden-runner/src/cross-demo-scenarios.ts` (new): 25-scenario
  registry (12 cross + 13 vrt) + `CrossDemoScenario` type
- `tooling/golden-runner/src/parity-helpers.ts`: add
  `captureCrossDemoScreenshot` + private `hidePageChrome` helper.
  k-ui-side selectors sourced via existing `reference-dom-map.ts`
- `tooling/golden-runner/tests/cross-demo-helpers.unit.spec.ts` (new):
  ~5 unit tests for the registry shape

### Commit 2: `feat(golden-runner): cross-demo + chronix-vrt-extended verify + 25 baselines (Phase 20.7)`

- `tooling/golden-runner/tests/cross-demo.spec.ts` (new): 25 scenario
  tests using `expect(buffer).toMatchSnapshot(<baseline>, { maxDiffPixelRatio: 0, threshold: 0.2 })`
- `tooling/golden-runner/package.json`: add `cross-demo-capture` +
  `cross-demo-verify` scripts
- `tooling/golden-runner/cross-demo-baselines/kui/*.png` (new, 12
  PNGs): one-time k-ui capture via `pnpm cross-demo-capture`
- `tooling/golden-runner/cross-demo-baselines/chronix/*.png` (new, 13
  PNGs): one-time chronix capture via same script
- `.claude/skills/phase-close/SKILL.md`: add step 6.5 (cross-demo
  verify) between ci-check and final summary
- **Day-1 gate validation**: run `pnpm cross-demo-verify`. For each
  failing `kind: 'cross'` scenario, inspect diff PNG, categorize per
  Day-1 policy (real bug / parked discrepancy / state mismatch),
  apply `test.fail()` + follow-up phase number where appropriate.
- **Fault-injection**: temporarily hardcode chronix bar fill to a
  wrong color, re-run, confirm fail. Revert.
- **Journal pre-record**: tentative list of follow-up micro phases
  (20.7.1, 20.7.2, …) discovered during day-1 verify

### Commit 3 (wrap-up — REQUIRES `/phase-close` invocation)

- Journal Phase 20.7 section with the 6 mandatory sub-sections
  - "Open / parked" sub-section enumerates every `test.fail()`-marked
    scenario with its follow-up phase number + 1-line diff
    description
- Memory bump: update `project_gantt_rewrite_plan.md` description to
  mention Phase 20.7 + the new cross-demo verify gate + count of
  follow-up micro phases queued; update test count if any new vitest
  were added (likely 0; +5 Playwright unit tests in golden-runner are
  not part of the vitest count)
- Status flip → DONE in this file
- Invoke `/phase-close` and walk all 7 checks (6 standard + 6.5 new)

## Estimated scope

- Scenario registry + types: ~180 LOC (~1.5 h — 25 entries with
  per-scenario justification require care)
- `captureCrossDemoScreenshot` + `hidePageChrome`: ~120 LOC (~1 h)
- `cross-demo.spec.ts`: ~100 LOC (~0.5 h)
- `cross-demo-helpers.unit.spec.ts`: ~60 LOC (~0.5 h)
- `package.json` scripts: ~5 LOC (~5 min)
- `phase-close` SKILL update: ~30 LOC (~15 min)
- One-time baseline capture (12 k-ui + 13 chronix) + visual review:
  ~1 h
- Day-1 verify + categorize failures + apply `test.fail()` + draft
  follow-up phase list: ~1 h (depends on failure count)
- Fault-injection smoke test: ~15 min
- Wrap-up + `/phase-close`: ~30 min
- **Total: ~6 hours focused work, ~495 LOC + 25 PNG baselines**

## Resolved decisions

The 3 load-bearing decisions surfaced during design review:

### Decision A — `maxDiffPixelRatio` + `threshold`

**Resolved**: `maxDiffPixelRatio: 0` + `threshold: 0.2` (Playwright
default). Zero ratio = no pixel may "differ"; threshold 0.2 absorbs
per-pixel AA noise (≤20% RGB color distance is treated as same).
"Pixel-perfect modulo AA". Strict-but-achievable; failing scenarios
are real bugs / known-parked items, not tolerance-tuning targets.

### Decision B — Initial scenario count + composition

**Resolved**: 25 scenarios total = 12 `kind: 'cross'` (k-ui baseline +
chronix verify) + 13 `kind: 'vrt'` (chronix self-baseline for
chronix-only toggles where k-ui has no analog). Single registry, two
consumers. Composition table above.

### Decision C — k-ui baseline refresh policy

**Resolved**: Frozen + manual refresh via `pnpm cross-demo-capture`.
Auto-refresh rejected — it would mask same-direction drift between
both demos. Manual refresh is a natural review point when k-ui
upstream changes.

### Sub-decisions resolved during review

- **Day-1 fail policy** — Policy II (register failing scenarios as
  `test.fail()` with follow-up micro phase numbers; do NOT fix in
  Phase 20.7 itself). Preserves single-session phase scope per
  acceleration constraint.
- **Two registries, one capture pipeline** — chronix-only toggles
  (`themedBars`, `umbrellaColor`) cannot cross-diff against k-ui
  (no k-ui analog). Implemented as `kind: 'vrt'` in the same
  registry; shares helper + capture script + verify script with
  `kind: 'cross'`.
- **No per-scenario tolerance overrides** — all 25 use the same
  fixed `(0, 0.2)`. A scenario that can't meet that bar is
  `test.fail()`-marked, not tolerance-bumped. Prevents the
  registry from becoming a graveyard of soft tolerances.
