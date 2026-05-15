# Phase 17 — Side-by-side parity infrastructure (chronix demo parity mode + helper)

**Status**: **Approved (pending user reply)** — design only; no code yet.

## Problem

`audit/PARITY_RECHECK.md` (2026-05-15) is the post-mortem on why
chronix accumulated drift across Phases 7–16. The discipline fix
landed as 4 layers (memory rule, design template, `/phase-close`
skill, hook). But all four layers point at
`tooling/golden-runner/tests/parity.spec.ts` for the actual
assertions — and the existing pattern in parity.spec.ts is **chronix
function in-process vs k-ui demo DOM**. That pattern works for pure
core algorithms (axis, layout, link routing) but doesn't reach
adapter-level behaviors (sidebar resize, selection visual, drag
preview rendering, cross-row drop snap, slot rendering, sidebar
divider) where the algorithm lives in the Vue adapter and only
manifests in the rendered DOM.

For adapter-level parity, the only honest test is **drive both demos
with the same inputs, compare both rendered DOMs**. Today this is
impossible because the chronix demo ships its own sample data
(`bar-1, ...` on rows `workshop-a, ...`) that doesn't align with k-ui
demo's data (`event-1, ...` on rows `32, 25, ...`). Two demos with
different inputs produce different outputs — you can't tell drift
from data divergence.

Phase 17 closes this gap so future phases CAN write
`expect(chronixDom).toMatchKuiDom(scenario)` assertions in their
implementation commits:

1. **Chronix demo gains a `?parity=true` URL mode** that swaps the
   default sample data for a k-ui-equivalent dataset (32 resources +
   25 events with matching ids + matching start/end times).
2. **`tooling/golden-runner/src/parity-helpers.ts`** ships
   `loadBothDemos` / `extractBarsSnapshot` / `diffBarsSnapshots` /
   `formatParityDiff` helpers, codifying the new side-by-side
   pattern.
3. **One example cross-demo assertion** in `parity.spec.ts` proves
   the pattern works: bar X + width parity for day view across both
   rendered demos.

## Reference (k-ui) behavior surface — full catalog

This phase is **infrastructure**, not a new chronix feature port. It
doesn't add a chronix feature; it adds the verification framework
for future phases. There's no k-ui surface to enumerate.

The k-ui demo's _data shape_ is what chronix's parity mode mirrors.
Catalog of what parity mode replicates:

| Item                                                           | k-ui                                                                | Chronix v0 parity mode | Reason                                                                                                                                                                                                                |
| -------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 32 resources by id (`'32', '25', '16', ...`)                   | `RESOURCES[]` at `DemoApp.vue:23-410` (32 entries, mixed structure) | ✅ port (ids only)     | rowId is opaque to chronix; matching ids let cross-demo bar pairing work                                                                                                                                              |
| Resource hierarchy (`baseName` / `airportName`)                | k-ui groups by `baseName` for left panel                            | ⏸️ parked              | chronix has vGrouping (Phase 5.x) but doesn't ingest k-ui's nested resource tree; v0 parity uses flat rowId order = k-ui's RESOURCES array order                                                                      |
| Resource RENDER order (after k-ui's internal sort)             | k-ui resource panel sorts by baseName grouping                      | ⏸️ parked              | k-ui renders resources in baseName-grouped order, NOT in `RESOURCES[]` order. Chronix v0 parity mode renders in input order → Y will NOT match k-ui rendered Y. Only X + width are valid cross-demo comparisons in v0 |
| 25 events with `event-N` ids                                   | `generateTestEvents()` at `DemoApp.vue:691-1271`                    | ✅ port                | already mirrored in `parity.spec.ts:441-489` (`buildTestEvents`)                                                                                                                                                      |
| Event time anchors (`today + N days, H:M`)                     | computed from `new Date()` at module load                           | ✅ port                | use `todayLocalMidnight()` (existing in chronix sample-data) for the same anchor                                                                                                                                      |
| Resource columns (`airportName` / `baseName` / `workshopName`) | `resourceAreaColumns` at `DemoApp.vue:1273-1290`                    | ⏸️ parked              | chronix demo's existing 3 columns (`region` / `base` / `name`) serve the same purpose; column-content parity is a separate phase                                                                                      |
| Event colors / styles / dependencies                           | k-ui has `backgroundColor` / `extendedProps.dependencies` etc       | ⏸️ parked              | parity v0 compares geometry only, not event styling                                                                                                                                                                   |
| `weekendsVisible: true` (demo default)                         | demo wires this                                                     | ✅ port                | chronix axis input already accepts this flag (currently ignored — see PARITY_RECHECK 🔴 #1)                                                                                                                           |
| `editable: true` / `selectable: true`                          | demo wires both                                                     | ✅ port                | mirror chronix demo's existing toggles                                                                                                                                                                                |

## Approach

### Chronix demo parity mode — toggle via URL query

`examples/gantt-vue3/src/App.vue` reads URL on mount:

```ts
const isParityMode = new URLSearchParams(window.location.search).get('parity') === 'true';
```

When `isParityMode` is true:

- `bars.value` initialized from `sampleBarsParity` (the k-ui-equivalent
  dataset — 25 bars with `event-N` ids matching k-ui's events).
- `sampleRows` swaps for `sampleRowsParity` (32 rows with numeric
  string ids `'32', '25', ...` matching k-ui's RESOURCES).
- `columns` stays the same (the 3 chronix-demo columns —
  `region` / `base` / `name` — column content for parity rows is
  generic since chronix v0 doesn't replicate k-ui's per-resource
  metadata).

When `isParityMode` is false: unchanged. Existing demo behavior.

A small visual indicator (`<div class="cx-parity-mode-banner">`)
shows when parity mode is active, so it's visible to anyone manually
loading the URL.

### Parity-mode sample data — `examples/gantt-vue3/src/sample-data-parity.ts`

New file with:

```ts
export const PARITY_RESOURCE_IDS: readonly string[] = [
  '32',
  '25',
  '16',
  '17',
  '30',
  '23',
  '19',
  '20',
  '24',
  '22',
  '18',
  '26',
  '29',
  '21',
  '28',
  '31',
  '27',
  '33',
  '3',
  '4',
  '5',
  '6',
  '2',
  '7',
  '8',
  '14',
  '15',
  '13',
  '9',
  '10',
  '11',
  '12',
];

export const sampleRowsParity: readonly RowSpec[] = PARITY_RESOURCE_IDS.map((id) => ({
  id,
  columns: {
    region: '海口',
    base: '海口基地',
    name: id,
  },
}));

export function sampleBarsParity(todayMs: number): readonly BarSpec[] {
  return [
    parityBar('event-1', '32', -5, 8, -2, 18),
    parityBar('event-2', '25', -3, 9, +1, 17),
    // ... 23 more, same as parity.spec.ts:462-488
  ];
}
```

The 25-bar list is the same as `buildTestEvents` in
`parity.spec.ts:441-489`. We don't re-import from the test file
(test code can't be a demo runtime dependency) — we'll either
duplicate inline OR move the source-of-truth to a shared module
under `tooling/golden-runner/src/` and import from BOTH the demo
and the test.

**Recommended**: extract `parityEvents.ts` to
`tooling/golden-runner/src/parity-events.ts`. Both the chronix demo
and `parity.spec.ts` import from there. Single source of truth for
"the 25 events that constitute the parity dataset".

### Parity helper — `tooling/golden-runner/src/parity-helpers.ts`

API:

```ts
export const KUI_DEMO_URL = process.env['KUI_DEMO_URL'] ?? 'http://localhost:8701/';
export const CHRONIX_DEMO_URL = process.env['CHRONIX_DEMO_URL'] ?? 'http://localhost:8702/';

export type ChronixViewId = 'day' | 'week' | 'month' | 'season' | 'halfYear' | 'year';

export const VIEW_TOGGLE_LABEL: Record<ChronixViewId, string> = {
  day: '日',
  week: '周',
  month: '月',
  season: '季',
  halfYear: '半年',
  year: '年',
};

export interface ParityScenario {
  readonly id: string;
  readonly viewId: ChronixViewId;
}

export interface BothDemos {
  readonly kuiPage: Page;
  readonly chronixPage: Page;
  readonly kuiChart: Locator;
  readonly chronixChart: Locator;
}

/**
 * Opens k-ui demo + chronix demo (with `?parity=true`) in separate
 * BrowserContexts. Installs FROZEN_TIME_ISO clock on both. Switches
 * both to the scenario's view via toggle button. Returns the chart-
 * root Locator for each side.
 *
 * Caller MUST close `kuiPage.context()` + `chronixPage.context()` in
 * test cleanup (typically a `try / finally`).
 */
export async function loadBothDemos(browser: Browser, scenario: ParityScenario): Promise<BothDemos>;

export interface DomBarSnapshot {
  readonly id: string;
  /** Relative to chart-root left edge, px. */
  readonly x: number;
  /** Relative to chart-root top edge, px. */
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Extracts bar bbox data from either demo, normalized to a common
 * shape. k-ui: queries `[data-event-id]`. chronix: queries
 * `[data-bar-id]`. Coordinate frame: relative to the chart-root
 * Locator's bbox (so the bbox of the chrome around the chart
 * doesn't pollute comparisons).
 *
 * Filters: skips elements with `height < 4` (k-ui's progress
 * triangles are ~8px tall but other overlays could be thinner).
 * Dedupes by id, widest wins (handles overlay duplicates).
 */
export async function extractBarsSnapshot(
  source: 'kui' | 'chronix',
  chart: Locator,
): Promise<readonly DomBarSnapshot[]>;

export interface ParityTolerance {
  readonly x?: number;
  readonly y?: number;
  readonly width?: number;
  readonly height?: number;
}

export interface ParityMismatch {
  readonly barId: string;
  readonly field: 'x' | 'y' | 'width' | 'height';
  readonly kuiValue: number;
  readonly chronixValue: number;
  readonly delta: number;
}

export interface ParityDiff {
  readonly mismatches: readonly ParityMismatch[];
  readonly onlyInKui: readonly string[];
  readonly onlyInChronix: readonly string[];
}

/**
 * Diffs two bar snapshots. Pairs by id (parity mode ensures matching
 * id schemes). Returns per-bar per-field mismatches exceeding
 * tolerance + bars present on only one side.
 *
 * Default tolerance: { x: 1, y: 1, width: 1, height: 1 } (1px per
 * channel, the same threshold the existing slot-width parity tests
 * use).
 *
 * v0 caveat: skip the `y` channel by default (set tolerance.y to
 * Infinity OR omit) for cross-demo comparisons — chronix renders in
 * input order; k-ui renders in baseName-grouped order; Y will not
 * match until chronix gains a resource-hierarchy row sorter. The
 * helper supports per-channel tolerance so the caller chooses.
 */
export function diffBarsSnapshots(
  kui: readonly DomBarSnapshot[],
  chronix: readonly DomBarSnapshot[],
  tolerance?: ParityTolerance,
): ParityDiff;

/**
 * Formats a parity diff as a multi-line string suitable for
 * `console.warn` or assertion-failure messages. Lists mismatches
 * grouped by bar id with delta annotations, then onlyInKui /
 * onlyInChronix arrays.
 */
export function formatParityDiff(diff: ParityDiff): string;
```

### First cross-demo example — `parity.spec.ts` addition

```ts
test.describe('cross-demo parity (Phase 17 helper)', () => {
  test('day-view bar X + width parity across both rendered demos', async ({ browser }) => {
    const { kuiPage, chronixPage, kuiChart, chronixChart } = await loadBothDemos(browser, {
      id: 'day-view-bars',
      viewId: 'day',
    });
    try {
      const kuiSnap = await extractBarsSnapshot('kui', kuiChart);
      const chronixSnap = await extractBarsSnapshot('chronix', chronixChart);

      // Y is excluded — chronix v0 doesn't replicate k-ui's resource-
      // grouping render order. Cross-demo Y parity is a separate phase.
      const diff = diffBarsSnapshots(kuiSnap, chronixSnap, {
        x: 1,
        width: 1,
        y: Number.POSITIVE_INFINITY,
        height: Number.POSITIVE_INFINITY,
      });

      if (diff.mismatches.length || diff.onlyInKui.length || diff.onlyInChronix.length) {
        console.warn(formatParityDiff(diff));
      }
      expect(diff.mismatches).toEqual([]);
    } finally {
      await kuiPage.context().close();
      await chronixPage.context().close();
    }
  });
});
```

## Parity assertion plan — MANDATORY

| Assertion id (in parity.spec.ts)                           | Drives k-ui demo via                 | Drives chronix demo via                                  | Compares                                  | Tolerance                                         |
| ---------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------- |
| `day-view bar X + width parity across both rendered demos` | `loadBothDemos` → chart at port 8701 | `loadBothDemos` → chart at port 8702 with `?parity=true` | Per-bar `(x, width)` after id-paired diff | `x: 1px, width: 1px, y: skipped, height: skipped` |

(The full plan would add week/month/season/halfYear/year variants too,
but landing one in this phase proves the pattern. Subsequent phases
can extend.)

## Test coverage

- adapter: chronix demo unit test for parity-mode toggle (load demo
  with `?parity=true`, assert bar count = 25 + row count = 32) — likely
  a chronix-side vitest if happy-dom supports `URLSearchParams`, else
  manual browser-verify
- golden-runner: 1 new cross-demo assertion via `parity.spec.ts`
- No new core vitest (this phase doesn't change core algorithms)

## VRT impact

**None**. Parity mode is opt-in via URL; the existing 5 chronix VRT
baselines capture the demo at default mode (no `?parity=true` query),
so they're untouched. A future phase could ADD parity-mode VRT
baselines (e.g. `chronix/parity-view-day.png`) — out of scope for
this phase.

## Execution plan — 4 commits + wrap-up

### Commit 1: chronix demo parity mode + shared parity dataset

- New file `tooling/golden-runner/src/parity-events.ts` — exports
  `PARITY_RESOURCE_IDS` + `buildParityBars(todayMs)` (the 25-event
  function moved from inside `parity.spec.ts`).
- `parity.spec.ts` imports `buildParityBars` from the new module
  instead of inlining `buildTestEvents`.
- New file `examples/gantt-vue3/src/sample-data-parity.ts` — imports
  from `@chronixjs/golden-runner` (workspace-internal cross-package
  import), exports `sampleBarsParity` + `sampleRowsParity`.
- `examples/gantt-vue3/src/App.vue` — reads `?parity=true` URL
  query, swaps `bars` + `rows` data sources accordingly. Adds a
  small banner element when parity mode is active.
- Browser-verify: load `http://localhost:8702/?parity=true` →
  banner visible, 32 rows in sidebar, 25 bars rendered, bar ids
  match `event-N`.

### Commit 2: parity-helpers.ts + first cross-demo assertion

- New file `tooling/golden-runner/src/parity-helpers.ts` exporting
  `loadBothDemos` / `extractBarsSnapshot` / `diffBarsSnapshots` /
  `formatParityDiff` + supporting types.
- `parity.spec.ts` gains a new `test.describe('cross-demo parity
(Phase 17 helper)')` block with the day-view bar X + width parity
  assertion.
- Both demos must be running at port 8701 (k-ui) and 8702 (chronix
  with `?parity=true`) for the assertion to run. Document this in
  the test file header.
- Run the new assertion, confirm it passes (or report drift for the
  user to triage).

### Commit 3: discipline updates referencing the helper

- `audit/PHASE_TEMPLATE.md`: update the `## Parity assertion plan`
  section's example row to show the cross-demo helper pattern
  (instead of the abstract column headers).
- `.claude/skills/phase-close/SKILL.md`: update check 1 to mention
  the helper imports as a positive signal (parity.spec.ts adding a
  test that imports from `../src/parity-helpers.js` is strong
  evidence of correctly-written assertions).
- Memory `feedback_chronix_parity_discipline.md`: cite the helper +
  point at `parity-helpers.ts` for the canonical assertion shape.

### Commit 4: wrap-up

- `audit/journal/2026-05-13.md`: Phase 17 section.
- Memory `project_gantt_rewrite_plan.md`: test count, phase status
  updated.
- This doc's Status → DONE with commit shas.

## Estimated scope

- Design doc: this commit (~1 hour).
- Commit 1 (parity mode + shared dataset): ~2 hours.
- Commit 2 (helper + first cross-demo assertion): ~2.5 hours.
- Commit 3 (discipline updates): ~30 min.
- Commit 4 (wrap-up + /phase-close invocation): ~30 min.
- Browser verify + parity-test running: ~30 min.
- **Total: ~6.5 hours focused work.**

## Open questions for the user

1. **Approve `?parity=true` URL query as the parity-mode toggle?**
   Alternatives: env var (Vite `import.meta.env.VITE_PARITY=true`) or
   separate demo entry point (`/parity.html`). Recommended URL query:
   no build-time switching, easy to flip in a browser tab, matches
   k-ui demo's flag-via-URL precedent.

2. **Approve shared `parity-events.ts` in `tooling/golden-runner/src/`
   as the single source of truth?** Alternatives: copy/paste into
   chronix demo, or move to a new `@chronixjs/parity-fixtures`
   workspace package. Recommended `tooling/golden-runner/src/`:
   minimizes new packages; the cross-package import (golden-runner →
   chronix demo) follows the workspace pattern.

3. **Approve excluding the Y channel from v0 cross-demo bar parity?**
   Y differs because chronix renders rows in input order while k-ui
   re-sorts by baseName grouping. Recommended: yes, document the gap;
   add a row-hierarchy-aware sort later in a separate phase.

4. **Approve cross-demo helper carrying `kuiPage` / `chronixPage`
   ownership to the caller** (caller closes contexts in `finally`)
   rather than a higher-level fixture? Recommended: yes, explicit
   ownership matches Playwright idioms and avoids hidden test fixture
   state.

5. **Approve dropping `parityEvents` source-of-truth from
   `parity.spec.ts:441-489` (where `buildTestEvents` lives today)
   into the new shared module?** Recommended: yes, single source of
   truth eliminates the drift risk between the parity dataset and
   what tests use.

6. **Confirm no VRT baseline change?** Parity mode is opt-in via URL,
   so default-load baselines are unchanged.

Reply **按照推荐继续** to accept all defaults (URL query toggle,
shared dataset in golden-runner, Y excluded from v0, explicit context
ownership, dropped from parity.spec.ts inline).
