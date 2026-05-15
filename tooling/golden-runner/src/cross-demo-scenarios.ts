/**
 * **Phase 20.7: cross-demo screenshot diff scenario registry.**
 *
 * Two complementary registries sharing one file + one capture
 * pipeline:
 *
 * - `kind: 'cross'` — chronix screenshot pixel-diffed against k-ui
 *   baseline. Both demos render the same state via parity mode +
 *   URL flags that have a k-ui analog (currently view-toggle only,
 *   plus chronix-side flags that override into parity color so the
 *   visible rendering still matches). Catches: chronix drifting
 *   away from k-ui's visual contract.
 *
 * - `kind: 'vrt'` — chronix screenshot pixel-diffed against its own
 *   frozen baseline. Used for toggles k-ui doesn't have
 *   (`themedBars`, `umbrellaColor`, validators-on-but-no-interaction).
 *   Catches: chronix regressing against its own previous state.
 *
 * Tolerance is fixed globally: `maxDiffPixelRatio: 0` (no pixel may
 * "differ") + `threshold: 0.2` (per-pixel RGB distance ≤20% counts
 * as same — absorbs sub-pixel AA noise). "Pixel-perfect modulo AA."
 *
 * Scenarios that genuinely cannot meet that bar (real chronix bugs
 * or known-parked items per `audit/PARITY_RECHECK.md`) are
 * `test.fail()`-marked in `cross-demo.spec.ts` with a follow-up
 * micro-phase number — NOT given per-scenario tolerance bumps. This
 * prevents the registry from becoming a graveyard of soft tolerances.
 */

import type { ChronixViewId } from './parity-helpers.js';

/**
 * Discriminator for which baseline a scenario diffs against.
 *
 * `'cross'`: pixel-diff chronix screenshot vs k-ui baseline. Requires
 * `urlQuery` to be representable on BOTH demos (k-ui demo doesn't yet
 * expose the URL-config layer, so cross scenarios are limited to
 * combinations where k-ui's default rendering matches chronix's
 * parity-mode rendering of the same flags).
 *
 * `'vrt'`: pixel-diff chronix screenshot vs chronix baseline. Used
 * when k-ui has no analog for the chronix toggle (`themedBars`,
 * `umbrellaColor`) OR when the scenario uses chronix's own
 * (non-parity) sample data.
 */
export type CrossDemoScenarioKind = 'cross' | 'vrt';

export interface CrossDemoScenario {
  /**
   * Stable id. Used as the baseline filename (`<id>.png`) and the
   * Playwright test title. Must be filename-safe (lowercase
   * alphanumeric + `-`).
   */
  readonly id: string;

  /** See `CrossDemoScenarioKind`. */
  readonly kind: CrossDemoScenarioKind;

  /**
   * One-line description surfaced in test names + journal "Open /
   * parked" sub-section. Explain WHY this scenario is in the
   * registry — what drift class it catches.
   */
  readonly description: string;

  /**
   * Phase 20.6 URL query applied to chronix. Format: `key=value&key=value`
   * (no leading `?`). Empty string = no extra flags beyond what the
   * helper adds implicitly.
   *
   * Implicit flags (added by `captureCrossDemoScreenshot`):
   * - `kind: 'cross'`: `parity=true` is always prepended.
   * - `kind: 'vrt'`: nothing prepended.
   *
   * DO NOT include `parity=true` in cross scenarios' `urlQuery` —
   * the helper adds it. Asserted by `cross-demo-helpers.unit.spec.ts`.
   */
  readonly urlQuery: string;

  /**
   * View identifier. Used to look up the view-toggle button label
   * via `VIEW_TOGGLE_LABEL[viewId]` and click it on both demos
   * after page load. `'week'` is chronix's default load — the helper
   * skips the toggle click for week (k-ui demo's default may also
   * be week; toggle is idempotent regardless).
   */
  readonly viewId: ChronixViewId;
}

/**
 * **Phase 20.7: 25-scenario initial registry — 12 cross + 13 vrt.**
 *
 * The 25 are not random. Each one is justified by either: (1) a
 * distinct view-scale × parity-mode rendering target (scenarios 1–6),
 * (2) a Phase 20 styling toggle × parity mode (7–9), (3) a Phase 4
 * / 19 interaction toggle that should NOT visually change initial
 * paint (10–12), (4) a chronix-only API exercise (13–22), or (5) a
 * compound-toggle precedence stress (23–24).
 *
 * Future phases extend this list by 1–3 entries each. Removals are
 * rare (only when a feature is deprecated).
 */
export const CROSS_DEMO_SCENARIOS: readonly CrossDemoScenario[] = [
  // ─── Group 1: 12 cross-demo (k-ui baseline + chronix verify) ────

  {
    id: 'cross-week-default',
    kind: 'cross',
    description:
      'Default load: parity dataset, week view, default styling. The "everything should match" anchor.',
    urlQuery: '',
    viewId: 'week',
  },
  {
    id: 'cross-view-day',
    kind: 'cross',
    description: 'Day-view tick rendering (hour labels). Highest tick density.',
    urlQuery: '',
    viewId: 'day',
  },
  {
    id: 'cross-view-month',
    kind: 'cross',
    description: 'Month-view header band parity.',
    urlQuery: '',
    viewId: 'month',
  },
  {
    id: 'cross-view-season',
    kind: 'cross',
    description: 'Season view: longer axis, low tick density.',
    urlQuery: '',
    viewId: 'season',
  },
  {
    id: 'cross-view-half-year',
    kind: 'cross',
    description: 'Half-year axis stress.',
    urlQuery: '',
    viewId: 'halfYear',
  },
  {
    id: 'cross-view-year',
    kind: 'cross',
    description: 'Year axis — widest viewport, most tick subdivision.',
    urlQuery: '',
    viewId: 'year',
  },
  {
    id: 'cross-week-priorityCallback',
    kind: 'cross',
    description:
      'Phase 20 callback-driven per-bar color, parity palette (callback wired in parity mode so k-ui default matches).',
    urlQuery: 'priorityCallback=true',
    viewId: 'week',
  },
  {
    id: 'cross-view-day-priorityCallback',
    kind: 'cross',
    description: 'Callback × day-view density crossing.',
    urlQuery: 'priorityCallback=true',
    viewId: 'day',
  },
  {
    id: 'cross-view-month-priorityCallback',
    kind: 'cross',
    description: 'Callback × month-view crossing.',
    urlQuery: 'priorityCallback=true',
    viewId: 'month',
  },
  {
    id: 'cross-week-editable-off',
    kind: 'cross',
    description:
      'Drag/resize disabled. Initial paint should be identical to default; this guards interaction-state-not-leaking-into-paint.',
    urlQuery: 'editable=false',
    viewId: 'week',
  },
  {
    id: 'cross-week-selectable-off',
    kind: 'cross',
    description: 'Range-select disabled. Same rationale as editable-off.',
    urlQuery: 'selectable=false',
    viewId: 'week',
  },
  {
    id: 'cross-week-eventOverlap-on',
    kind: 'cross',
    description:
      'Phase 19 eventOverlap validator on. Should not change initial render (validators only fire during drag).',
    urlQuery: 'eventOverlap=true',
    viewId: 'week',
  },

  // ─── Group 2: 13 chronix-only VRT extensions (chronix self-baseline) ─

  {
    id: 'vrt-week-themedBars',
    kind: 'vrt',
    description:
      'Phase 20 themedBars prop (chronix-only API; k-ui has no equivalent). Overrides bar fill + border via component props.',
    urlQuery: 'themedBars=true',
    viewId: 'week',
  },
  {
    id: 'vrt-week-umbrellaColor',
    kind: 'vrt',
    description: 'Phase 20 barColor umbrella prop (chronix-only API). Sets both fill + stroke.',
    urlQuery: 'umbrellaColor=true',
    viewId: 'week',
  },
  {
    id: 'vrt-week-priorityCallback-no-parity',
    kind: 'vrt',
    description:
      "Same callback as cross-week-priorityCallback but on chronix's own (non-parity) sample data. Different bar layout, different palette interaction.",
    urlQuery: 'priorityCallback=true',
    viewId: 'week',
  },
  {
    id: 'vrt-view-day-themedBars',
    kind: 'vrt',
    description: 'themedBars × day axis.',
    urlQuery: 'themedBars=true',
    viewId: 'day',
  },
  {
    id: 'vrt-view-month-themedBars',
    kind: 'vrt',
    description: 'themedBars × month.',
    urlQuery: 'themedBars=true',
    viewId: 'month',
  },
  {
    id: 'vrt-view-year-themedBars',
    kind: 'vrt',
    description: 'themedBars × year (longest axis).',
    urlQuery: 'themedBars=true',
    viewId: 'year',
  },
  {
    id: 'vrt-view-day-umbrellaColor',
    kind: 'vrt',
    description: 'umbrellaColor × day.',
    urlQuery: 'umbrellaColor=true',
    viewId: 'day',
  },
  {
    id: 'vrt-week-eventConstraint',
    kind: 'vrt',
    description:
      'Phase 19 eventConstraint validator on. Initial paint should match default; this guards that.',
    urlQuery: 'eventConstraint=true',
    viewId: 'week',
  },
  {
    id: 'vrt-week-eventAllow',
    kind: 'vrt',
    description: 'Phase 19 eventAllow validator on.',
    urlQuery: 'eventAllow=true',
    viewId: 'week',
  },
  {
    id: 'vrt-week-selectAllow',
    kind: 'vrt',
    description: 'Phase 19 selectAllow validator on.',
    urlQuery: 'selectAllow=true',
    viewId: 'week',
  },
  {
    id: 'vrt-week-themedBars-editable-off',
    kind: 'vrt',
    description: 'Compound toggle stress: styling × interaction state.',
    urlQuery: 'themedBars=true&editable=false',
    viewId: 'week',
  },
  {
    id: 'vrt-week-priorityCallback-umbrellaColor',
    kind: 'vrt',
    description:
      'Compound styling: callback + umbrella. Tests precedence — callback should win for bar fill.',
    urlQuery: 'priorityCallback=true&umbrellaColor=true',
    viewId: 'week',
  },
  {
    id: 'vrt-view-month-priorityCallback-no-parity',
    kind: 'vrt',
    description:
      'priorityCallback × month on chronix data. Different from cross-view-month-priorityCallback (parity dataset).',
    urlQuery: 'priorityCallback=true',
    viewId: 'month',
  },
];

/**
 * **Phase 20.7: fixed pixel-diff tolerance for ALL 25 scenarios.**
 *
 * `maxDiffPixelRatio: 0` — no pixel may "differ" against the
 * baseline. `threshold: 0.2` (Playwright's default per-pixel RGB
 * distance) — absorbs sub-pixel anti-aliasing noise so individual
 * pixels only count as "different" when the color delta exceeds 20%.
 *
 * Net effect: "pixel-perfect modulo AA". Strict-but-achievable.
 * Scenarios that cannot meet this bar are `test.fail()`-marked
 * with a follow-up micro-phase reference; never given a softer
 * tolerance.
 */
export const CROSS_DEMO_TOLERANCE = {
  maxDiffPixelRatio: 0,
  threshold: 0.2,
} as const;

/**
 * Baseline subdirectory under the Playwright snapshot dir
 * (`tooling/golden-runner/goldens/`). One subdir per baseline
 * source — keeps cross-demo baselines distinct from the existing
 * 5 chronix VRT + 6 k-ui parity goldens at the goldens root.
 */
export const CROSS_DEMO_BASELINE_DIR = 'cross-demo-baselines';

/** Resolves to e.g. `cross-demo-baselines/kui/cross-week-default.png`. */
export function crossDemoBaselineRelPath(scenario: CrossDemoScenario): string {
  const subdir = scenario.kind === 'cross' ? 'kui' : 'chronix';
  return `${CROSS_DEMO_BASELINE_DIR}/${subdir}/${scenario.id}.png`;
}
