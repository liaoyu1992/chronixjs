# Phase 28.3.1 — Link parity fixture + cross-demo useLineEventColor assertions

**Status**: **DONE (2026-05-18)** — all 3 commits landed (`b75565b` Commit 2 fixture + demo wiring + `665ea29` Commit 3 2 parity assertions + per-event color fixture re-mirror) + Phase 28.2.2 hotfix (`9432c68`, separate concern bundled in same session) + this wrap-up. `/phase-close` skill walked 6/6 gates green; ci-check fully green; vitest 712 unchanged (Phase 28.3.1 added 0 new vitest — pure testing-infrastructure; Phase 28.2.2 hotfix added +4); parity-spec 54 → 56 (+2 useLineEventColor per-link stroke + marker-def); cross-demo verify 27/27 green WITHOUT incremental re-baseline (Phase 28.2.2's 15-PNG re-baseline absorbed any chronix-side parity-mode rendering delta); chronix-visual 5/5 unchanged. See `audit/journal/2026-05-13.md` "Phase 28.3.1" section for full wrap-up.

## Problem

Phase 28.3 (DONE 2026-05-17) shipped 4 chronix-additive link / bar customization surfaces:

- `barClassNamesCallback` — per-bar CSS-class callback
- `onLineCallback` — per-link render-time callback
- `useLineEventColor: boolean` — chart-wide toggle to color dependency lines by their source bar's resolved background
- `LINK_SLOT_NAME = 'link'` — slot for full per-link render replacement

Three of the four are inherently NOT cross-demo parity-testable: `barClassNamesCallback` + `onLineCallback` + link slot are consumer hooks the parity reference's demo doesn't wire. They are pinned by 19 adapter unit tests across `chronix-gantt-bar-classnames.test.ts` / `chronix-gantt-link-callbacks.test.ts` / `chronix-gantt-link-slot.test.ts`. Adequate.

**`useLineEventColor` is the exception** — the parity reference's demo
defaults it to `true` (`d:/work/k-ui/examples/gantt/vue3/src/DemoApp.vue:1300`)
and renders the 25-event × ~22-edge dependency graph with line strokes
inherited from each source bar's per-event `backgroundColor`. So when
chronix's demo runs with `?parity=true&useLineEventColor=true&priorityCallback=true`,
both sides should emit the same set of distinct line stroke colors —
and the same set of distinct `<marker>` def colors (one per
color-x-marker-shape pair).

The Phase 28.3 design doc explicitly carved out this case as a
deferred follow-up (line 5 of `audit/PHASE_28_3_BAR_CLASSNAMES_AND_LINK_CALLBACKS_DESIGN.md`):

> Cross-demo parity for `useLineEventColor` is now a Phase 28.3.1
> candidate […]. Parity-spec count stays at 51 (+0 instead of +2).

The blocker today is **the chronix parity fixture
(`buildParityEvents` at `tooling/golden-runner/src/parity-events.ts:113`)
carries no `LinkSpec[]`** — chronix's parity-mode demo therefore
renders 0 dependency lines (`App.vue:97` forces
`initialLinks = cfg.parity.value ? [] : sampleLinks`). With no
links on chronix's side, no cross-demo line-color comparison is
possible. The fixture-extension work fits cleanly in one phase
alongside the 2 cross-demo assertions; this design covers both.

**User-observable consequence today**: in chronix's parity mode,
the dependency-line render path (Phase 28.3) is fully implemented +
chronix-side adapter tests pass, but cross-demo parity coverage for
the source-bar-color → line-stroke-color chain is structurally
absent. Phase 28.3's PR comment ("[…] needs Phase 28.3.1 […] before
this assertion is meaningful") documents the gap.

Phase 28.3.1's role: extend the parity fixture with a curated
`LinkSpec[]` subset mirroring k-ui's dependency edges, thread it
through the chronix parity-mode demo, and add 2 cross-demo
assertions exercising `useLineEventColor: true`. After this phase,
the cascade `LinkSpec.colorOverride > useLineEventColor source bar > theme.linkDefaultColor`
is cross-demo-pinned at the DOM level on both stroke colors and
marker-def colors.

## Reference (k-ui) behavior surface — full catalog

Reference files audited:

- `d:/work/k-ui/examples/gantt/vue3/src/DemoApp.vue:741-1256` — the
  25 events' `extendedProps.dependencies: string[]` arrays. Each
  string is a source `event-N` id; the consuming event is the
  link's TARGET. The full edge count is ~22 (some events have
  multiple sources — e.g. `event-18.dependencies =
['event-3', 'event-9', 'event-11', 'event-14']` is 4 edges).
  Distribution: 7 events with no deps, 13 with 1 dep, 2 with 2 deps,
  1 with 4 deps.
- `d:/work/k-ui/examples/gantt/vue3/src/DemoApp.vue:746, 768, 788, 810`
  — per-event `backgroundColor: '#ff3b32' / '#ff9800' / '#2196f3' / '#4caf50'`.
  When `useLineEventColor: true`, each link's stroke inherits the
  source event's resolved background. So edge color = source bar
  color.
- `d:/work/k-ui/examples/gantt/vue3/src/DemoApp.vue:1300` —
  `const useLineEventColor = ref(true)`. **Demo default is true**
  (chronix demo default is false).
- `d:/work/k-ui/examples/gantt/vue3/src/DemoApp.vue:1574` —
  `useLineEventColor: useLineEventColor.value` passed into the
  reference component's prop bag.
- `d:/work/k-ui/examples/gantt/vue3/src/DemoApp.vue:2102` —
  checkbox `<input type="checkbox" :checked="useLineEventColor" @change="handleUseLineEventColorToggle" />`
  in the right-hand control panel. Programmatic Playwright toggle
  possible via standard checkbox interaction.
- `d:/work/k-ui/packages/gantt/src/resource-timeline/ResourceTimelineDependencies.tsx:2337-2339`
  — `if (useLineEventColor && fromEventDef) lineColor = this.getEventColor(fromEventDef, dependencyLineColor, fromResourceId)`.
  Resolution happens at color-collection time so marker defs get
  the correct color keys too.
- `D:/work/chronix/adapters/vue3/src/chronix-gantt.ts:2620-2730` —
  the chronix-side equivalent: `linkSpecById` lookup → per-link
  color cascade `colorOverride > useLineEventColor source → theme.linkDefaultColor`
  → `onLineCallback` override → marker `<defs>` collection from
  POST-callback resolved colors + custom markers.
- `D:/work/chronix/examples/gantt-vue3/src/App.vue:97` —
  `const initialLinks = cfg.parity.value ? [] : sampleLinks;`. The
  hard-coded `[]` in parity mode is the load-bearing gap.
- `D:/work/chronix/examples/gantt-vue3/src/App.vue:175-179` —
  `activeBarBackgroundCallback` already wires `samplePriorityCallback`
  when `cfg.priorityCallback.value` AND `cfg.parity.value` are both
  true. So in parity+priorityCallback mode, chronix bars get the
  same 3-color (high/medium/low) palette across both sides. This
  gives the multi-color stroke-set the useLineEventColor assertion
  needs.
- `D:/work/chronix/tooling/golden-runner/tests/parity.spec.ts:1072-1130`
  — existing `cross-demo callback parity` test already drives
  both sides with `parity=true&priorityCallback=true`. Phase 28.3.1
  builds on top: `parity=true&priorityCallback=true&useLineEventColor=true`.

### Mechanism (what `useLineEventColor: true` does on each side)

For each routed dependency line:

1. Resolve source bar's painted background color (chronix: from
   `barColorByBarId` lookup built per-render at
   `chronix-gantt.ts:2110-2115`; k-ui: via `getEventColor()` lookup).
2. Use that color as the line's stroke.
3. The marker (`<marker>` def referenced by `marker-end="url(...)"`)
   carries the same color so the arrow head matches the line shaft.

Cross-demo invariant: when both sides share the same per-event bar
colors (priorityCallback parity mode), they should produce the same
distinct stroke-color set across all rendered links + the same
distinct marker-fill set across all `<marker>` defs.

### Surface-level disposition table

| Item                                                                                  | k-ui                                                    | chronix v0                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 25 events × per-event `extendedProps.dependencies: string[]` (DAG, ~22 edges)         | `DemoApp.vue:741-1256`                                  | ⏸️ **gap (this phase)** — `parity-events.ts` carries no link fixture; chronix parity demo renders 0 links. Add curated subset (see Decision 1).                                                                                                                            |
| `useLineEventColor: ref(true)` chart-wide toggle                                      | `DemoApp.vue:1300`                                      | ✅ **already ported (Phase 28.3)** as `useLineEventColor: boolean` prop; chronix demo flag at `App.vue:88` (default `false`). Cross-demo asserts in TRUE mode require URL `?useLineEventColor=true` on chronix side; k-ui default true (no toggle needed).                 |
| Per-event `backgroundColor` (event-1: `#ff3b32` red, event-2: `#ff9800` orange, etc.) | `DemoApp.vue:746, 768, 788, 810, ...`                   | ✅ **already cross-demo-tested in parity mode** when `?priorityCallback=true&parity=true` — `samplePriorityCallback` palette (`PARITY_REFERENCE_COLOR` + 2-3 priority colors) matches k-ui per-bar; the existing `cross-demo callback parity` assertion pins bar-fill set. |
| Line stroke color inheritance from source bar                                         | `ResourceTimelineDependencies.tsx:2337-2339`            | ✅ **already ported (Phase 28.3)** at `chronix-gantt.ts:2647-2649`. Cross-demo coverage = THIS PHASE.                                                                                                                                                                      |
| Marker `<defs>` color emission keyed on POST-callback line color                      | k-ui builds marker defs per `(markerType × color)` pair | ✅ **already ported (Phase 28.3)** at `chronix-gantt.ts:2719-2751`. Cross-demo coverage = THIS PHASE.                                                                                                                                                                      |
| Link `routing: 'square' \| 'smooth'` per-link                                         | k-ui's DependencyLine `type`                            | ⏸️ **out of scope** — Phase 28.3 v0 deferred `routing` mutation in `onLineCallback`. Phase 28.3.1 link fixture picks ONE routing style for all parity links (default `'square'`) to avoid coupling parity coverage to routing-mutation work.                               |
| Mixed `marker: 'arrow' \| 'diamond' \| 'plus' \| ...` per-link                        | k-ui defaults to arrow                                  | ⏸️ **parked** — Phase 28.3.1 fixture uses single `marker: 'arrow'` (matches k-ui's demo default). Mixing markers in the parity fixture would inflate the marker-def-color set comparison without adding meaningful test signal — every (marker × color) combo emits a def. |
| `useLineEventColor: false` mode (each side uses theme default `dependencyLineColor`)  | k-ui must toggle checkbox at `DemoApp.vue:2102`         | ⏸️ **deferred (this phase)** — see Decision 2. v0 scope = TRUE mode only; FALSE mode is implicit from theme defaults + would require k-ui-side Playwright checkbox toggle.                                                                                                 |
| Bar `<text>` content parity (Phase 28.2)                                              | `DemoApp.vue:737, 759, ...`                             | ✅ **already cross-demo-tested (Phase 28.2)** via 3 bar-text count assertions.                                                                                                                                                                                             |
| Bar bbox parity (Phase 17)                                                            | existing                                                | ✅ **already cross-demo-tested** (`cross-demo day-view bars` etc.). Link fixture extension does NOT change bar geometry; existing assertions stay green.                                                                                                                   |

**Phase 28.3.1 net surface**: 1 ✅-extend gap (link fixture), 2
✅-add cross-demo assertions (stroke color set + marker-def color
set), 3 ⏸️-parked extras (routing variants / marker variants /
`useLineEventColor: false` mode — all re-prioritizable on demand).

### Naming alignment table

| k-ui                                                         | chronix Phase 28.3.1 fixture                                                                   |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `extendedProps.dependencies: string[]` (target's source ids) | `ParityLinkSpec.fromBarId` / `.toBarId` (chronix's link-shape orientation)                     |
| (no explicit id; k-ui derives `${from}-${to}`)               | `ParityLinkSpec.id` = `link-${from}-${to}` (matches Phase 8 chronix LinkSpec convention)       |
| `useLineEventColor` (ref)                                    | `useLineEventColor` (component prop — same name, Phase 28.3)                                   |
| (no explicit fixture builder; inline in `extendedProps`)     | `buildParityLinks(events)` helper alongside `buildParityEvents(todayMs)` in `parity-events.ts` |

### Cascading dispositions (other phases affected)

- **Phase 17** (parity fixture): non-breaking extension — adds a new
  exported `buildParityLinks` + `PARITY_LINK_SPECS` (or equivalent)
  alongside existing `buildParityEvents` + `PARITY_RESOURCE_IDS`.
  Existing parity assertions consume `buildParityEvents` only and
  are unaffected.
- **Phase 28.3** (link rendering): cross-demo coverage backfill. No
  source change to `chronix-gantt.ts` link block (Phase 28.3 already
  ships the resolution cascade). Two parity-spec assertions land at
  the end of the existing `parity.spec.ts` `describe` block,
  following Phase 27.1 / 28.2.1 patterns.
- **`PARITY_RECHECK.md`**: row added under section P3 (or similar)
  marking the originally-deferred useLineEventColor assertions
  CLOSED. No new chronix-new declarations (this is a port, not
  chronix-additive).
- **Chronix demo VRT baselines**: `cross-demo verify` may need 1-2
  re-baselines if the parity demo's link rendering now paints visible
  links in existing screenshot scenarios. Most existing scenarios run
  with `?parity=true` (no `useLineEventColor=true`), so chronix
  default-false means line strokes use `theme.linkDefaultColor` —
  visible new content in cross-demo PNGs. **Predicted re-baseline
  count: 5-12 PNGs** (any cross scenario that includes links in its
  capture rect; week/month/season views typically do). Existing
  k-ui-side baselines stay unchanged (k-ui already renders these
  links in every cross scenario).

## Approach

### §1 — Extend parity fixture (`tooling/golden-runner/src/parity-events.ts`)

Add a new exported shape + builder alongside the existing
`buildParityEvents`:

```ts
/**
 * Phase 28.3.1: per-link parity fixture entry. Cross-demo identity
 * tuple = `(fromBarId, toBarId)`; both sides resolve the same source
 * + target bar (parity events use stable `event-N` ids).
 */
export interface ParityLink {
  readonly id: string; // `link-${fromBarId}-${toBarId}`
  readonly fromBarId: string;
  readonly toBarId: string;
}

/**
 * Phase 28.3.1: curated subset of k-ui's ~22 dependency edges (per
 * `d:/work/k-ui/examples/gantt/vue3/src/DemoApp.vue:741-1256`).
 * Selection criteria (see Decision 1):
 *
 *   1. Cover edges where source events have DISTINCT bar colors
 *      (when priorityCallback parity mode active) — gives non-
 *      trivial stroke-color set.
 *   2. Span multiple resources (so links visibly route across rows
 *      in the captured viewport).
 *   3. Span multiple time ranges (so different views — day / week /
 *      month — exercise different subsets of routed links).
 *   4. Keep the count moderate (~8 edges) so parity assertions run
 *      fast and re-baseline burden stays small.
 */
export const PARITY_LINKS: readonly ParityLink[] = [
  // (Decision 1's recommended subset — see Decision 1 below for A/B/C scoping)
];

/**
 * Build the parity link set. Currently a static constant; the
 * function form mirrors `buildParityEvents` for future flexibility
 * (e.g. per-anchor filtering).
 */
export function buildParityLinks(): readonly ParityLink[] {
  return PARITY_LINKS;
}
```

### §2 — Wire parity links through chronix demo (`examples/gantt-vue3/src/sample-data-parity.ts` + `App.vue`)

Extend `sample-data-parity.ts`:

```ts
import {
  PARITY_RESOURCE_IDS,
  buildParityEvents,
  buildParityLinks, // NEW
  type ParityEvent,
  type ParityLink, // NEW
} from '@chronixjs/golden-runner/parity-events';

// ... existing parityEventToBar / sampleBarsParity unchanged ...

function parityLinkToSpec(link: ParityLink): LinkSpec {
  return {
    id: link.id,
    fromBarId: link.fromBarId,
    toBarId: link.toBarId,
    routing: 'square', // Decision: one routing for all parity links
    marker: 'arrow', // Decision: one marker for all parity links
  };
}

export const sampleLinksParity: readonly LinkSpec[] = buildParityLinks().map(parityLinkToSpec);
```

Update `App.vue:97`:

```ts
const initialLinks = cfg.parity.value ? sampleLinksParity : sampleLinks;
```

`?useLineEventColor` URL flag already wired via Phase 28.3
(`App.vue:88, 452`). No new demo schema entries needed.

### §3 — 2 cross-demo parity assertions (`tooling/golden-runner/tests/parity.spec.ts`)

Both assertions land at the end of the existing `describe` block,
alongside the existing Phase 23 / 25 / 28.x tests.

```ts
test('phase28.3-useLineEventColor link-stroke color set parity (week view)', async ({
  browser,
}) => {
  // Both demos run with parity=true + priorityCallback=true + useLineEventColor=true.
  // k-ui default useLineEventColor=true; chronix needs explicit URL flag.
  // priorityCallback parity mode = both sides paint bars in the same
  // 3-color palette. With useLineEventColor=true, each link inherits
  // its source bar's color → same distinct stroke-color SET on both
  // sides.
  //
  // Loader: extend loadBothDemos via the new `chronixUrlExtras` field
  // (see Decision 3). For v0 single-callsite, inline the demo loading
  // here (don't extend loadBothDemos signature).
  const { kuiPage, chronixPage, kuiChart, chronixChart } = await loadBothDemosWithExtras(browser, {
    id: 'phase28.3-useLineEventColor-link-color-week',
    viewId: 'week',
    chronixUrlExtras: 'useLineEventColor=true&priorityCallback=true',
  });
  try {
    const kuiStrokes = await kuiPage.evaluate(() => {
      const set = new Set<string>();
      document.querySelectorAll<SVGPathElement>('.gantt-dependency-line').forEach((p) => {
        set.add(getComputedStyle(p).stroke);
      });
      return [...set].sort();
    });
    const chronixStrokes = await chronixPage.evaluate(() => {
      const set = new Set<string>();
      document.querySelectorAll<SVGPathElement>('.cx-gantt-link').forEach((p) => {
        set.add(getComputedStyle(p).stroke);
      });
      return [...set].sort();
    });
    console.warn(
      `Phase 28.3.1 link-stroke set: kui=${JSON.stringify(kuiStrokes)} ` +
        `chronix=${JSON.stringify(chronixStrokes)}`,
    );
    expect(kuiStrokes.length, 'kui link stroke set empty').toBeGreaterThan(0);
    expect(chronixStrokes).toEqual(kuiStrokes);
  } finally {
    await kuiPage.context().close();
    await chronixPage.context().close();
  }
});

test('phase28.3-useLineEventColor marker-def color set parity (week view)', async ({ browser }) => {
  // Same demo state; assert that <marker> def fill colors form the
  // same set across sides. Each rendered link with a unique stroke
  // produces (potentially) a unique marker def color; the def set
  // mirrors the stroke set, modulo theme default + any orphan defs
  // emitted on the chronix side. Selector: <marker> inside <defs>;
  // attribute key: marker's child's `fill`.
  const { kuiPage, chronixPage } = await loadBothDemosWithExtras(browser, {
    id: 'phase28.3-useLineEventColor-marker-defs-week',
    viewId: 'week',
    chronixUrlExtras: 'useLineEventColor=true&priorityCallback=true',
  });
  try {
    const kuiMarkers = await kuiPage.evaluate(() => {
      const set = new Set<string>();
      document.querySelectorAll<SVGMarkerElement>('defs marker').forEach((m) => {
        m.querySelectorAll<SVGElement>('path, polygon, circle').forEach((c) => {
          const f = getComputedStyle(c).fill;
          if (f && f !== 'none') set.add(f);
        });
      });
      return [...set].sort();
    });
    const chronixMarkers = await chronixPage.evaluate(() => {
      const set = new Set<string>();
      document.querySelectorAll<SVGMarkerElement>('defs marker').forEach((m) => {
        m.querySelectorAll<SVGElement>('path, polygon, circle').forEach((c) => {
          const f = getComputedStyle(c).fill;
          if (f && f !== 'none') set.add(f);
        });
      });
      return [...set].sort();
    });
    console.warn(
      `Phase 28.3.1 marker-def set: kui=${JSON.stringify(kuiMarkers)} ` +
        `chronix=${JSON.stringify(chronixMarkers)}`,
    );
    expect(kuiMarkers.length, 'kui marker def set empty').toBeGreaterThan(0);
    expect(chronixMarkers).toEqual(kuiMarkers);
  } finally {
    await kuiPage.context().close();
    await chronixPage.context().close();
  }
});
```

### §4 — `loadBothDemos` extension (`tooling/golden-runner/src/parity-helpers.ts`)

The current `loadBothDemos` (line 107-160) hard-codes
`chronixPage.goto('/?parity=true')` — no path for extra URL flags.
Phase 28.3.1 needs `?parity=true&useLineEventColor=true&priorityCallback=true`
on the chronix side. Approach:

**Approach (recommended)**: extend `ParityScenario` with an optional
`chronixUrlExtras?: string` field; `loadBothDemos` appends it to
the chronix URL when present. Backwards-compatible (existing call
sites omit the field, behavior unchanged).

```ts
export interface ParityScenario {
  readonly id: string;
  readonly viewId: ChronixViewId;
  // Phase 28.3.1: additional `?key=val&key=val` URL params for the
  // chronix demo (k-ui side unchanged — k-ui demo has no URL config
  // layer). Used to drive chronix-only opt-ins like
  // `useLineEventColor=true&priorityCallback=true` while leaving
  // existing test call sites unmodified.
  readonly chronixUrlExtras?: string;
}

// Inside loadBothDemos, change line 137 from:
//   chronixPage.goto('/?parity=true')
// to:
//   chronixPage.goto(
//     scenario.chronixUrlExtras
//       ? `/?parity=true&${scenario.chronixUrlExtras}`
//       : '/?parity=true',
//   )
```

Both Phase 28.3.1 assertions consume the same `chronixUrlExtras`
value. No new helper function needed (`loadBothDemosWithExtras` in
the snippets above is shorthand for the same call with the field
populated).

## Alternatives considered

- **Decision A — Mirror ALL 22 k-ui dependency edges verbatim**.
  Reject for v0. Fully faithful but inflates the parity-spec
  runtime + cross-demo VRT re-baseline burden. Most edges target
  the same 3 source colors (priority cluster), so 5-10 edges give
  the same color-set coverage at lower cost. Re-prioritize if a
  per-edge geometry parity assertion lands (links-bbox parity).

- **Decision A' — Synthesize new minimal LinkSpec set (~3-5 edges)
  specifically for useLineEventColor, ignoring k-ui's DAG**.
  Reject. Re-using k-ui's edges keeps the parity-mode demo visually
  similar to the parity reference — useful for manual debugging and
  cross-demo VRT review. Synthetic edges would diverge from any
  k-ui screenshot for comparison.

- **Decision B — Add the parity link set to `App.vue` directly
  (skip the `parity-events.ts` exported builder)**. Reject. The
  `tooling/golden-runner` package is the single source of truth for
  parity-mode fixture data (rows + events today; links naturally
  belong there). Splitting would let chronix demo + parity-spec
  drift over time.

- **Decision C — Add cross-demo VRT baselines for the
  useLineEventColor TRUE state (new `vrt-week-useLineEventColor-on`
  scenario)**. Defer. The 2 set-equality assertions cover the
  cascade structurally; pixel-level visual coverage of the line
  stroke variation is incidental. Add when the chronix-side
  link-render path grows enough complexity that visual regressions
  would slip past the assertion (post-Phase-28.3-ish surface
  growth).

- **Toggle `useLineEventColor: false` mode in parity-spec too**.
  Defer. The FALSE case asserts "all lines use theme.linkDefaultColor"
  — true on both sides by Phase 28.3's cascade definition. Verifying
  it cross-demo requires (a) Playwright-toggling k-ui's checkbox at
  DemoApp.vue:2102 (no existing helper; new toggle infrastructure)
  OR (b) chronix-side explicit `useLineEventColor=false` URL flag
  (already the default, so this is just `?parity=true`). Asymmetric.
  Re-prioritize when k-ui-side toggle infrastructure is genuinely
  needed for another assertion.

- **Compare per-link stroke colors id-paired (not set-equality)**.
  Defer. Set equality is the load-bearing invariant (`useLineEventColor`
  is a chart-wide cascade, not per-link). Per-link pairing would
  require link bbox / start-end coord-resolution, which is a
  separate cross-demo channel (cross-demo link-geometry parity is
  not yet built). Set equality is faster + sufficient for the
  cascade-correctness check.

- **Use the same `cross-demo callback parity` test (parity.spec.ts:1072)
  and just add the `useLineEventColor` flag to it**. Reject. That
  test asserts BAR fill set equality, not link stroke. Adding the
  link assertion there would conflate two different render-layer
  invariants. Distinct test names + distinct concerns = clearer
  failure messages.

- **Mix `routing: 'square' | 'smooth'` and `marker: 'arrow' | 'diamond' | 'plus'`
  in the parity link set**. Reject for v0. Each (marker × color)
  pair emits a `<marker>` def, so mixing markers multiplies the
  def-set size without giving the assertion more signal (the
  cascade `useLineEventColor → color` is independent of marker
  type). Single `marker: 'arrow'` keeps the def set tractable +
  matches k-ui's demo default.

- **Move `useLineEventColor` default in chronix demo from `false`
  to `true`** (so chronix matches k-ui's demo default). Defer. Out of
  Phase 28.3.1 scope. Would also re-baseline most existing
  cross-demo VRT scenarios (any with bars + links visible). Standalone
  ergonomics question; re-prioritize when chronix-demo defaults
  audit lands.

## Parity assertion plan — MANDATORY

This phase modifies `tooling/golden-runner/src/parity-events.ts`
(fixture extension), `examples/gantt-vue3/src/sample-data-parity.ts`
(builder consumption), `examples/gantt-vue3/src/App.vue` (link
wiring), `tooling/golden-runner/src/parity-helpers.ts`
(`chronixUrlExtras` field), and `tooling/golden-runner/tests/parity.spec.ts`
(+2 assertions). No core `packages/gantt` source change; no
adapter source change. **This phase IS the parity-coverage
backfill for Phase 28.3.**

### Two new cross-demo parity assertions

| Assertion id                                                           | Drives k-ui demo via                                 | Drives chronix demo via                                                            | Compares                                                                                                                                                                                                                                                                                                                       | Tolerance    |
| ---------------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| `phase28.3-useLineEventColor link-stroke color set parity (week view)` | default load (k-ui's `useLineEventColor: ref(true)`) | `?parity=true&useLineEventColor=true&priorityCallback=true` via `chronixUrlExtras` | Set of distinct `<path class="cx-gantt-link">` / `<path class="gantt-dependency-line">` computed-style `stroke` values. With `useLineEventColor: true` on both sides + matching per-bar palette (priorityCallback parity), the line stroke color set should match exactly. Validates the source-bar-color → line-stroke chain. | Set equality |
| `phase28.3-useLineEventColor marker-def color set parity (week view)`  | same                                                 | same                                                                               | Set of distinct `<marker>` def fill values (read from each marker's child `<path>` / `<polygon>` / `<circle>` element's computed `fill`). Each (color × marker-type) pair emits one def per side; set equality validates the marker-def generation path consumes POST-cascade colors.                                          | Set equality |

The 2 assertions are paired (same demo state, two different DOM
channels). They could merge into one test but staying split keeps
each invariant distinct in the failure surface — if marker defs
diverge while strokes match, that's a different bug than the
reverse.

### Chronix-additive surfaces, no cross-demo parity

- `barClassNamesCallback`, `onLineCallback`, link slot — pinned
  by Phase 28.3's 19 adapter unit tests; chronix-additive consumer
  hooks; out of scope. The `parity.spec.ts:2118-2158` architectural-
  divergence comment block stays in place (and gets a 1-line
  update: "useLineEventColor coverage CLOSED Phase 28.3.1").

### Drift-detection scope

- **Covered**:
  - Source bar color → line stroke color resolution chain
    (`useLineEventColor` cascade).
  - Marker `<defs>` color emission for the post-cascade color set.
  - Phase 28.3 link-render code path's structural completeness
    (no orphan links on chronix side; no missing marker defs).
- **NOT covered (deferred)**:
  - Per-link bbox / path-coord parity (chronix-side LinkRouter
    output vs k-ui-side; geometry is a separate channel).
  - `useLineEventColor: false` cross-demo mode (deferred — would
    need k-ui-side checkbox-toggle infrastructure).
  - `colorOverride`-on-LinkSpec parity (chronix v0 parity links
    don't set `colorOverride`; would need fixture extension).
  - Marker shape variants (single `marker: 'arrow'` only).
- **NOT covered (adapter)**: chronix-only render-correctness for
  `barClassNamesCallback` / `onLineCallback` / link slot — pinned
  by Phase 28.3 adapter tests.

## Test coverage

This phase is testing-infrastructure-only — no new source code in
`packages/gantt` or `adapters/vue3`. Coverage is delivered via:

- **parity-spec** — `tooling/golden-runner/tests/parity.spec.ts`
  (+2 assertions, per the assertion plan above).
- **golden-runner unit** (optional, see Decision 1): if Decision 1
  scope A or B includes a non-trivial `buildParityLinks` helper
  (e.g. with per-anchor filtering), add 1-2 unit tests in
  `tooling/golden-runner/tests/parity-helpers.unit.spec.ts` pinning
  the returned shape + edge count. For v0 (static constant), the
  fixture is its own test surface (parity-spec consumes it and
  asserts non-zero link count on both sides).

No new adapter / core tests. No new ChronixTheme tokens. No new
component props.

### Expected counts after Phase 28.3.1

- **vitest 708 unchanged** (no new adapter / core tests).
- **parity-spec 54 → 56** (+2 useLineEventColor assertions).
- **ChronixTheme tokens 50 unchanged.**
- **golden-runner Playwright unit tests 32 unchanged** (or 32 →
  33-34 if Decision 1 scope warrants 1-2 fixture-shape tests).
- **cross-demo verify 27 → 27 in scenario count**; **5-12 PNG
  re-baselines** expected as the chronix parity-mode demo gains
  visible link strokes in existing screenshot scenarios.

## VRT impact

**Predicted re-baseline count**: **5-12 chronix-side `vrt-*.png`
PNGs**. Existing cross-demo scenarios that run with `?parity=true`
will gain rendered dependency lines on the chronix side (where
previously the array was empty). k-ui-side baselines (`cross-*.png`)
unchanged binary-identical — k-ui already paints these links in
every cross scenario today.

The lines render in
`theme.linkDefaultColor` (chronix demo default `useLineEventColor=false`),
so the new pixels are uniform-color stroke paths over the existing
bar backgrounds. Visual delta per scenario is bounded by the link
count visible in each scenario's capture rect.

`chronix-visual` baselines (5 PNGs) unaffected — those use
`sample-data.ts` (non-parity), which already renders `sampleLinks`
and is unchanged.

## Execution plan — 3 commits + wrap-up

### Commit 1 (design doc, this commit) — REQUIRES user review of 3 load-bearing decisions

Lands only `audit/PHASE_28_3_1_LINK_PARITY_FIXTURE_DESIGN.md`.
Awaits user confirmation of the 3 decisions at the bottom of this
file before implementation.

### Commit 2: Fixture extension + demo wiring + parity-helpers extension

- `tooling/golden-runner/src/parity-events.ts`: add `ParityLink`
  type + `PARITY_LINKS` constant (per Decision 1 scope) +
  `buildParityLinks()` helper. ~30 LOC.
- `examples/gantt-vue3/src/sample-data-parity.ts`: import
  `buildParityLinks` + `ParityLink`; add `parityLinkToSpec` helper +
  exported `sampleLinksParity`. ~15 LOC.
- `examples/gantt-vue3/src/App.vue`: change line 97 from
  `[] : sampleLinks` to `sampleLinksParity : sampleLinks`. 1 LOC.
- `tooling/golden-runner/src/parity-helpers.ts`: extend
  `ParityScenario` with `chronixUrlExtras?: string`; update
  `loadBothDemos` line 137 to append the extras. ~5 LOC.
- (Optional, Decision 1-dependent) golden-runner fixture-shape
  unit test if `buildParityLinks` non-trivial. ~30 LOC.
- Rebuild `@chronixjs/golden-runner` package's exports if needed
  (the package exports the fixture builder via
  `parity-events` subpath — confirm in `package.json` /
  `tsconfig.json`).
- Kill + restart chronix demo dev server (port 8702) so the demo
  picks up the new `sampleLinksParity` wiring.
- ci-check green (vitest 708 unchanged or +1-2 fixture tests).

### Commit 3: 2 parity-spec assertions + cross-demo VRT re-baseline

- `tooling/golden-runner/tests/parity.spec.ts`: +2 useLineEventColor
  assertions per the assertion plan. ~120 LOC including the
  comment blocks. Update the existing Phase 28.3 architectural-
  divergence comment at line 2118-2158 to note useLineEventColor
  CLOSED Phase 28.3.1.
- Run `parity.spec.ts` against the 2 new tests; iterate until
  green.
- Run `cross-demo verify`; re-capture chronix-side baselines that
  diff (predicted 5-12 PNGs).
- `audit/PARITY_RECHECK.md`: update the originally-deferred
  useLineEventColor row from "Phase 28.3.1 follow-up" to "DONE,
  YYYY-MM-DD".
- ci-check green; cross-demo-verify gate green (27/27 + new
  baselines).

### Commit 4 (wrap-up — REQUIRES `/phase-close` invocation)

Before flipping this design doc's Status to DONE OR adding the
"Phase 28.3.1 — DONE" section to `audit/journal/`, MUST invoke
`/phase-close` skill. The skill verifies the 6 standard gates.

- `audit/journal/2026-05-13.md` (continuation): "Phase 28.3.1 —
  Link parity fixture + cross-demo useLineEventColor assertions
  (DONE, YYYY-MM-DD)" section per the strict 6-sub-section
  template.
- `memory/project_gantt_rewrite_plan.md`: bump parity-spec 54 →
  56; add Phase 28.3.1 DONE marker; chronix-visual 5 unchanged;
  cross-demo-verify 27 unchanged (with 5-12 PNG re-baseline noted).
- `audit/PHASE_28_3_1_LINK_PARITY_FIXTURE_DESIGN.md` Status →
  DONE.

## Estimated scope

| Commit                                         | Hours   | LOC est.                                  |
| ---------------------------------------------- | ------- | ----------------------------------------- |
| 1 (design doc)                                 | 0.75    | this file (~500 LOC)                      |
| 2 (fixture + demo wiring + helpers extension)  | 1.0     | ~50 LOC src + ~30 LOC fixture-shape tests |
| 3 (2 parity-spec assertions + VRT re-baseline) | 1.5     | ~120 LOC + 5-12 PNG re-captures           |
| 4 (wrap-up)                                    | 0.25    | journal + memory + status flips           |
| **Total**                                      | **3.5** | ~700 LOC + 5-12 baseline PNGs             |

Within single-session discipline (per
`feedback_quality_acceleration.md` constraint #3). Matches the 3-4h
roadmap estimate.

## 4-dimension audit check

Per `feedback_4_dimension_audit_checklist.md`:

| Dimension                     | Coverage in Phase 28.3.1                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Options surface**           | Zero new options. `useLineEventColor` prop (Phase 28.3), parity-mode flag (Phase 17), priorityCallback flag (Phase 20) all already in place. New `chronixUrlExtras` field on `ParityScenario` is internal-to-tests surface, not a published API.                                                                                                          |
| **Render code**               | Zero changes. The link-render block at `chronix-gantt.ts:2598-2751` ships intact from Phase 28.3 — Phase 28.3.1 only adds the fixture data that exercises it cross-demo.                                                                                                                                                                                  |
| **Interaction code**          | Zero impact. Link rendering is `pointer-events: none` (Phase 8); no hit-test, no drag, no resize integration. Fixture extension adds dependency edges to the visible render, but doesn't introduce any new event paths.                                                                                                                                   |
| **Layout-algorithm pipeline** | Light impact — `LinkRouter` (pure layout pass) consumes the new `LinkSpec[]` and produces additional `RoutedLink[]` entries on the chronix parity-mode side. No `LinkRouter` source change; the router already handles N links. Same fixture-volume guarantee that already covered `sampleLinks` (default mode) covers `sampleLinksParity` (parity mode). |

The "fixture-only phase, no source change" property makes this a
purely additive change. The only risk surfaces are (a) the parity
fixture's per-link `(fromBarId, toBarId)` tuples must reference
events that exist in the parity event set (Decision 1's curated
subset must respect this), and (b) cross-demo VRT baseline
re-capture for the chronix-side scenarios that now show links.
Both are well-bounded.

## Open questions for the user — 3 load-bearing decisions

**1. Link fixture scope: A (mirror ALL ~22 k-ui dependency edges verbatim) / B (curated subset of ~8 edges chosen for color diversity + visual coverage across views) / C (synthesize minimal new LinkSpec set of ~4 edges purely for useLineEventColor coverage, decoupled from k-ui's DAG)** — recommend **B**.

- **A (full)**: 22 edges; full fidelity to k-ui's DAG; max signal
  for any future per-link parity assertion. **Cost**: longer
  parity-spec runtime (more `<marker>` defs to compare), larger
  cross-demo VRT re-baseline burden (every cross-demo scenario
  gains all ~22 links visible). +~60 LOC fixture vs B.
- **B (curated, recommended)**: ~8 edges selected for (1) source-
  color diversity in priorityCallback mode (~3 distinct source bar
  colors → ~3 distinct line stroke colors), (2) routes that span
  multiple resources (visible in week+ views), (3) routes whose
  source + target are both in the rendered viewport across day /
  week / month. Concrete candidates:
  - `event-1 → event-2` (red → orange)
  - `event-1 → event-4` (red → green)
  - `event-2 → event-3` (orange → blue, multi-color chain)
  - `event-4 → event-5` (color-fan-in)
  - `event-2 → event-5` (color-fan-in same target)
  - `event-7 → event-8` (different resource cluster)
  - `event-12 → event-13` (cross-aircraft type — '787' cluster)
  - `event-18 → event-19` (long-range chain, week+-visible only)
- **C (synthetic)**: ~4 edges ignoring k-ui's DAG. **Cost**:
  parity-demo visual diverges from parity reference, harder to
  spot-check manually. Saves ~15 LOC vs B. Loses visual-similarity
  benefit.

**Recommendation**: **B**. ~8 edges from k-ui's DAG hits the
color-diversity sweet spot without over-inflating the assertion
runtime or VRT re-baseline burden.

---

**2. Assertion count: A (2 assertions, both in `useLineEventColor: true` mode — link-stroke color set + marker-def color set, both week view) / B (4 assertions — A's 2 × {week, day} views for view-independence coverage) / C (3 assertions — A's 2 + a `useLineEventColor: false` link-stroke color set assertion confirming both sides fall back to theme default)** — recommend **A**.

- **A (recommended, matches memory entry)**: 2 assertions in week
  view. Memory's "2 cross-demo useLineEventColor 断言" matches.
  Phase 28.3 design's originally-planned 2 assertions are exactly
  these. ~120 LOC parity-spec + comment blocks. Validates the
  cascade structurally; pixel-level coverage handled by VRT.
- **B (view × channel)**: 4 assertions in {week, day} × {stroke
  set, marker-def set}. Doubles runtime + LOC; signal value low
  because the cascade is view-independent (same code path on both
  sides regardless of view). Defer until a view-specific link-
  render bug emerges.
- **C (with false-mode assertion)**: adds a 3rd assertion in
  `useLineEventColor: false` mode. **Cost**: requires k-ui-side
  checkbox toggle infrastructure (no existing helper; new selector
  - Playwright `.click()`). Asymmetric on the chronix side
    (chronix default is false; just `?parity=true`). Asserts a
    property already structurally true by Phase 28.3's cascade.
    Skip until k-ui-side toggle infra is needed elsewhere.

**Recommendation**: **A**. 2 assertions in week view, matching
Phase 28.3 design's original plan + memory entry.

---

**3. Demo URL-flag plumbing for `useLineEventColor`: A (extend `loadBothDemos` with `chronixUrlExtras?: string` field on `ParityScenario`; backwards-compatible, single shared call site) / B (add a separate `loadBothDemosWithFlags()` helper, leaving `loadBothDemos` untouched) / C (inline the chronix-side `page.goto('/?parity=true&...')` in each new test; no helper change)** — recommend **A**.

- **A (recommended)**: extend `ParityScenario` with optional
  `chronixUrlExtras?: string` field; `loadBothDemos` appends when
  present. Backwards-compatible (existing 30+ call sites omit the
  field, behavior unchanged). ~5 LOC change. Generalizes for
  future Phase 28.3.x-style "drive chronix with additional flags"
  test cases. Symmetric API (one helper, one signature, optional
  extension).
- **B (separate helper)**: new `loadBothDemosWithFlags()` that
  duplicates `loadBothDemos` body + adds the flag logic. **Cost**:
  duplicated browser-context wiring (~80 LOC). Splits future
  maintenance — 2 helpers to keep in sync.
- **C (inline)**: each new test calls `chronixPage.goto` directly,
  duplicating the k-ui-side `loadBothDemos` boilerplate. **Cost**:
  ~80 LOC inline per test × 2 tests = ~160 LOC vs ~5 LOC for A.
  Long-term: future opt-in flags duplicate again.

**Recommendation**: **A**. Optional field extension. Clean,
backwards-compatible, generalizes.

---

Reply **按推荐继续** to accept all three (B / A / A), or call out
any 1-3 to override.
