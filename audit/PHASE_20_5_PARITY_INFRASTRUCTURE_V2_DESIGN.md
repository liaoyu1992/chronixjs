# Phase 20.5 — Parity infrastructure v2 (computed-style + per-channel snapshot helpers)

**Status**: **DONE (2026-05-16)**. Landed as 2 commits: `e93a746`
(design doc, 381 lines) → `003e73a` (implementation: parity-helpers
expansion + 17 unit tests). 17 new unit tests pass; existing 27
parity assertions + 5 chronix VRT baselines + 6 k-ui parity goldens
unchanged. Cumulative vitest 426 → 443. `/phase-close` gate walked
6/6 green before status flip. See `audit/journal/2026-05-13.md`
"Phase 20.5 + 20.6" section.

## Problem

Per the 2026-05-16 cadence audit, the 2.0 roadmap is ~100 phase with
quality preserved + UI alignment with k-ui. To get there each phase
must add **2-5 cross-demo parity assertions** vs the current 1-2 per
phase. That puts the target at **150-200 parity-spec assertions by
2.0** vs today's 27.

The current `extractBarsSnapshot` only captures `(x, y, width,
height, fill)` for bars, and each phase rewrites ad-hoc
`chart.evaluate(...)` for any other channel. Phase 18 wrote its own
DOM walker for dayCell labels. Phase 19 wrote inline pointer gestures
for SFC tests. Phase 20 added `fill` to bars-snapshot + `hexToRgbString`
helper. Each phase reinvents 50-100 LOC of DOM extraction.

Without a centralized snapshot library, the next 50 phases will:

1. Spend ~30 min each writing bespoke `chart.evaluate(...)` for their
   own channel
2. Drift on coordinate frames (body-wrapper vs chart-root vs
   timeline-body)
3. Drift on dedup logic (k-ui's inner-rect-vs-g handling)
4. Drift on tolerance / normalization (rgb vs hex vs hsl)
5. Drift on what counts as a "match" (per-field tolerance vs deep
   equality vs set-equality)

Phase 20.5 centralizes the snapshot layer so each downstream phase
adds ~5 LOC `expect(extractXxxSnapshot(...)).toMatchKui(...)` instead
of ~50 LOC of bespoke DOM walks.

## Reference behavior surface — full catalog

This phase is **infrastructure**, not a k-ui feature port. There's no
k-ui surface to enumerate. The catalog instead lists each DOM channel
that current + future parity tests need to extract:

| Channel                                                               | Current state                                                                     | This phase ports                                                                                   |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Bar geometry (x, y, w, h)                                             | ✅ `extractBarsSnapshot` (Phase 17)                                               | Stays; refactored to share core                                                                    |
| Bar fill                                                              | ✅ `extractBarsSnapshot.fill` (Phase 20)                                          | Stays; generalized to optional `computedStyle` field set                                           |
| Tick labels (text + position)                                         | 🟡 per-test ad-hoc (`extractRenderedTickRects`)                                   | ✅ port → `extractTicksSnapshot`                                                                   |
| Header cell labels (text + position + width)                          | 🟡 per-test ad-hoc DOM walker                                                     | ✅ port → `extractHeaderCellsSnapshot`                                                             |
| Sidebar rows + columns                                                | ❌ no extraction yet                                                              | ✅ port → `extractSidebarSnapshot`                                                                 |
| Computed style (fill / stroke / font / cursor / etc.)                 | 🟡 only `fill` extracted                                                          | ✅ port → optional `computedStyle: readonly (keyof CSSStyleDeclaration)[]` parameter per extractor |
| Per-channel diff (set-equality / position-tolerance / style-equality) | 🟡 `diffBarsSnapshots` does bars only                                             | ✅ port → generic `diffSnapshots(kui, chronix, schema)` with per-field tolerance                   |
| Interaction recording (pointer gestures captured + replayed)          | 🟡 1 manual recording at `tooling/golden-runner/recordings/progress-handle-drag/` | ⏸️ parked v2.x — adds with Phase 22 toolbar (first phase that needs button-click parity)           |
| VRT scenario matrix (`(viewId × scenarioFlag)` combinations)          | 🟡 5 baselines manually captured                                                  | ⏸️ parked — adds with Phase 21 todayLine (first phase that needs multiple flag combinations)       |

## Approach

### New snapshot helpers in `tooling/golden-runner/src/parity-helpers.ts`

```ts
/**
 * Phase 20.5: optional computed-style fields to include in any
 * snapshot. Each extractor takes this list and calls
 * `getComputedStyle()` per element, returning a `style` field with
 * just the requested keys. Empty list = skip computed style entirely
 * (cheap path; same as pre-20.5 behavior).
 */
export type ComputedStyleKey =
  | 'fill'
  | 'stroke'
  | 'strokeWidth'
  | 'opacity'
  | 'fontFamily'
  | 'fontSize'
  | 'fontWeight'
  | 'fontStyle'
  | 'color'
  | 'backgroundColor'
  | 'borderColor'
  | 'cursor'
  | 'visibility'
  | 'display'
  | 'transform'
  | 'transition';
// ... expanded as future phases need more

export interface SnapshotOptions {
  /** Which computed-style keys to capture. Empty = no style extraction. */
  readonly computedStyle?: readonly ComputedStyleKey[];
}

/**
 * Output of any `extractXxxSnapshot` helper. Generic enough that
 * future channels can extend the discriminator without touching the
 * core diff helper.
 */
export interface DomElementSnapshot {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly text?: string;
  /** Only present if `options.computedStyle` was non-empty. */
  readonly style?: Readonly<Record<ComputedStyleKey, string>>;
}
```

### Generalized extractors

```ts
/**
 * Existing bar extractor refactored to use the shared core + accept
 * `SnapshotOptions`. Backward-compatible: omitting `options`
 * produces the same `{ id, x, y, width, height, fill }` shape
 * pre-20.5 callers expect (fill is auto-included for legacy).
 */
export async function extractBarsSnapshot(
  source: 'kui' | 'chronix',
  chart: Locator,
  options?: SnapshotOptions,
): Promise<readonly DomBarSnapshot[]>;

/**
 * New: tick labels from the header band. k-ui:
 * `<text class="gantt-timeline-slot-label">` inside header `<g>`.
 * chronix: `<text class="cx-gantt-tick-label">` inside header SVG.
 *
 * Returns one entry per tick label, with `text` = label string,
 * `x` = leaf-text left edge relative to chart-root body-wrapper.
 * No dedup — tick labels are already 1:1 with rendered ticks.
 */
export async function extractTicksSnapshot(
  source: 'kui' | 'chronix',
  chart: Locator,
  options?: SnapshotOptions,
): Promise<readonly DomElementSnapshot[]>;

/**
 * New: header band outer cells (month labels above day ticks,
 * day labels above hour ticks). Same coordinate frame as ticks.
 */
export async function extractHeaderCellsSnapshot(
  source: 'kui' | 'chronix',
  chart: Locator,
  options?: SnapshotOptions,
): Promise<readonly DomElementSnapshot[]>;

/**
 * New: sidebar (resource panel) rows + columns. Returns one entry
 * per `<td>` (k-ui) / `<div>` cell (chronix). Width / height
 * relative to sidebar's left edge, NOT body-wrapper — sidebar has
 * its own coordinate system.
 */
export async function extractSidebarSnapshot(
  source: 'kui' | 'chronix',
  chart: Locator,
  options?: SnapshotOptions,
): Promise<readonly DomElementSnapshot[]>;
```

### Generic diff helper

```ts
/**
 * Per-channel tolerance for cross-demo diffs. Each numeric field
 * defaults to 1 px; `Infinity` skips the channel. The `style`
 * sub-object holds per-style-key tolerance — `Infinity` skips that
 * key; presence + equality match for non-numeric values
 * (most colors / cursor strings / font names).
 */
export interface SnapshotTolerance {
  readonly x?: number;
  readonly y?: number;
  readonly width?: number;
  readonly height?: number;
  readonly text?: 'exact' | 'set-equality' | 'skip';
  readonly style?: Readonly<Record<ComputedStyleKey, number | 'exact' | 'skip'>>;
}

export interface SnapshotDiff {
  readonly mismatches: readonly SnapshotMismatch[];
  readonly onlyInKui: readonly string[];
  readonly onlyInChronix: readonly string[];
}

export interface SnapshotMismatch {
  readonly id: string;
  readonly field: string;
  readonly kuiValue: unknown;
  readonly chronixValue: unknown;
  readonly delta?: number;
}

/**
 * Generic diff over any `DomElementSnapshot`-shaped pair. Pairs by
 * id (callers must ensure id parity — chronix's parity mode and
 * the demo's deterministic resource ids enable this). For each
 * paired element, checks each field against the per-field
 * tolerance.
 */
export function diffSnapshots(
  kui: readonly DomElementSnapshot[],
  chronix: readonly DomElementSnapshot[],
  tolerance?: SnapshotTolerance,
): SnapshotDiff;
```

Existing `diffBarsSnapshots` becomes a thin wrapper:

```ts
export function diffBarsSnapshots(
  kui: readonly DomBarSnapshot[],
  chronix: readonly DomBarSnapshot[],
  tolerance?: ParityTolerance, // unchanged shape
): ParityDiff {
  // Adapt to new generic diff under the hood; preserve the legacy
  // ParityDiff return shape so existing parity.spec.ts tests don't
  // need to change.
  const generic = diffSnapshots(
    kui as DomElementSnapshot[],
    chronix as DomElementSnapshot[],
    adaptTolerance(tolerance),
  );
  return adaptDiff(generic);
}
```

### Backward compatibility

All existing 27 parity assertions continue to pass without
modification because:

- `extractBarsSnapshot` default-call shape is unchanged
- `diffBarsSnapshots` signature + return shape is unchanged
- `hexToRgbString` is unchanged

New helpers are additive. Phase 21+ start using them.

### Selector strategy (per `source × channel`)

Centralized in a new `SELECTORS` map so all DOM walking knows the
canonical entry points:

```ts
const SELECTORS: Record<'kui' | 'chronix', Record<string, string>> = {
  kui: {
    bar: '[data-event-id]',
    bodyWrapper: '.gantt-timeline-body-wrapper',
    tick: '.gantt-timeline-slot-label',
    headerCell: '.gantt-timeline-header-row .gantt-timeline-header-cell',
    sidebarRow: 'tr[data-resource-id]',
    sidebarCell: 'tr[data-resource-id] td',
  },
  chronix: {
    bar: '[data-bar-id]',
    bodyWrapper: 'svg.cx-gantt-body',
    tick: '.cx-gantt-tick-label',
    headerCell: '.cx-gantt-header-cell',
    sidebarRow: '[data-row-id]',
    sidebarCell: '[data-row-id] [data-column-key]',
  },
};
```

This kills the "each phase looks up the selector ad-hoc" tax.

## Parity assertion plan — MANDATORY

This phase is parity infrastructure, not a feature port. Following
Phase 17's pattern:

**chronix-new — no parity assertion possible.** Rationale: Phase 20.5
adds helper functions; it does not change rendered DOM in either
demo. The first downstream phase using the new helpers (likely Phase
21 — todayLine + nowIndicator) will be the first concrete parity
assertion that exercises the v2 infrastructure.

This phase's quality bar instead is **internal correctness of the
helpers themselves**: snapshot extraction returns the right shape,
diff helper computes the right mismatches, computed-style filter
honors the input list. Verified by unit tests.

## Test coverage

- core: no new core code (the helpers live in `tooling/golden-runner/`)
- adapter: no new adapter code
- golden-runner unit tests: `tooling/golden-runner/src/parity-helpers.test.ts`
  (new file, ~10 tests):
  - `diffSnapshots`: pairs by id, mismatches per-channel, only-in lists
  - `diffSnapshots`: skips channels with `Infinity` tolerance
  - `diffSnapshots`: handles style equality for color strings
  - `diffSnapshots`: handles style numeric tolerance for font-size
  - Adapter (`diffBarsSnapshots`) preserves legacy `ParityDiff` shape
  - `hexToRgbString` round-trip for representative hex values
- parity.spec.ts: existing 27 assertions remain green (regression
  guard) — no new cross-demo tests in this phase; they land in
  Phase 21+

Drift-detection scope: the helpers are tested in isolation. Real
cross-demo correctness is verified the first time Phase 21+ uses
them against live demos.

## VRT impact

**None**. No rendered output changes.

## Execution plan — 1 commit + wrap-up

### Commit 1: `feat(golden-runner): centralized snapshot + diff infrastructure (Phase 20.5)`

- `tooling/golden-runner/src/parity-helpers.ts`: add `ComputedStyleKey`,
  `SnapshotOptions`, `DomElementSnapshot`, `SnapshotTolerance`,
  `SnapshotDiff`, `SnapshotMismatch` types
- `tooling/golden-runner/src/parity-helpers.ts`: new
  `extractTicksSnapshot`, `extractHeaderCellsSnapshot`,
  `extractSidebarSnapshot` helpers
- `tooling/golden-runner/src/parity-helpers.ts`: new `diffSnapshots`
  generic helper
- `tooling/golden-runner/src/parity-helpers.ts`: `SELECTORS` map
- `tooling/golden-runner/src/parity-helpers.ts`: refactor
  `extractBarsSnapshot` to use shared core + accept `SnapshotOptions`;
  preserve legacy default-call shape
- `tooling/golden-runner/src/parity-helpers.ts`: refactor
  `diffBarsSnapshots` to wrap `diffSnapshots`; preserve legacy
  `ParityDiff` return shape
- `tooling/golden-runner/src/parity-helpers.test.ts` (new): ~10 unit
  tests for the helpers
- **Anti-regression**: existing 27 parity assertions stay green
- **Browser verify**: nothing to verify in browser; helpers are
  pure functions over Playwright Locators

### Commit 2 (wrap-up — REQUIRES `/phase-close` invocation)

- Journal Phase 20.5 section
- Memory bump (test count, no phase-status entry since 20.5 is
  infrastructure)
- Status flip → DONE

## Estimated scope

- Type additions + selectors map: ~50 LOC (~30 min)
- `extractTicksSnapshot` + 2 cousins: ~120 LOC (~1.5 h)
- `diffSnapshots` generic: ~60 LOC (~1 h)
- Refactor existing helpers: ~30 LOC delta (~30 min)
- Unit tests (~10): ~150 LOC (~1 h)
- Wrap-up + `/phase-close`: ~30 min
- **Total: ~4 hours focused work, ~410 LOC**

## Open questions for the user

1. **Approve dropping interaction recording-replay + VRT matrix from this
   phase**? Both are useful but bigger. Interaction recording lands with
   Phase 22 (toolbar — first button-click parity). VRT matrix lands with
   Phase 21 (todayLine — first multi-flag scenario). Recommended: yes,
   defer.

2. **Approve generic `DomElementSnapshot` shape covering bars / ticks /
   headers / sidebar in one type**? Alternative: each channel has its
   own dedicated type. Generic shape is leaner (~30 LOC fewer types)
   but loses per-channel type safety (e.g. tick has no `fill` field
   conceptually). Recommended: generic with optional fields, matches
   the `getComputedStyle()` -> string-keyed-map pattern.

3. **Approve adding `ComputedStyleKey` as a string-literal union starting
   with ~15 keys**? Future phases extend the union as they need new
   keys. Alternative: accept any `keyof CSSStyleDeclaration`. Union is
   safer (catches typos at compile time). Recommended: union, expand
   in PRs as needed.

4. **Approve `SnapshotTolerance.style` as a per-key map with `'exact' |
'skip' | number` values**? Most style values are non-numeric strings
   (colors, cursor names, font families) where the only sensible
   tolerance is exact equality; the few numeric ones (font-size,
   stroke-width) might want per-pixel tolerance. Recommended: yes,
   union type.

5. **Approve preserving the legacy `DomBarSnapshot` + `ParityDiff` +
   `ParityTolerance` types** so existing 27 parity assertions don't need
   migration? Alternative: bulk-migrate to new types in the same
   commit. Preserving legacy is safer. Recommended: preserve.

6. **Approve single-commit implementation + wrap-up commit** per parity
   discipline? Recommended: yes.

Reply **按照推荐继续** to accept all defaults (defer recording-replay

- VRT matrix, generic snapshot shape, string-literal style keys,
  per-key style tolerance, preserve legacy types, single-commit impl).
