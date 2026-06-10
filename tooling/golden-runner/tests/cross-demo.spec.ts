/**
 * **Phase 20.7: cross-demo screenshot verify — per-phase regression gate.**
 *
 * Runs ONLY when `CROSS_DEMO_RUN=true` env var is set (the
 * `pnpm cross-demo-verify` script + the `/phase-close` step 6.5
 * invocation). During normal `pnpm verify` the tests `test.skip()`
 * so the existing fast verify path doesn't depend on baselines
 * being present.
 *
 * For each registry scenario: captures chronix-side screenshot,
 * pixel-diffs vs the frozen baseline at
 * `goldens/cross-demo-baselines/<subdir>/<id>.png` with
 * `maxDiffPixelRatio: 0` + `threshold: 0.2` (CROSS_DEMO_TOLERANCE).
 *
 * Day-1 baseline-fail policy (per design doc): scenarios that
 * genuinely cannot meet the fixed tolerance get `test.fail()`-marked
 * here with a follow-up micro-phase number (e.g. `20.7.1`). Each
 * `test.fail()` entry MUST include a comment naming the follow-up
 * phase + a 1-line description of the visual gap. Removing the
 * `test.fail()` mark = the follow-up phase has been closed.
 *
 * NEVER raise per-scenario tolerance to make a test pass. The
 * registry uses one fixed tolerance globally so the bar stays
 * meaningful; soft tolerances are a graveyard pattern.
 */
import { expect, test } from '@playwright/test';

import {
  CROSS_DEMO_BASELINE_DIR,
  CROSS_DEMO_SCENARIOS,
  CROSS_DEMO_TOLERANCE,
} from '../src/cross-demo-scenarios.js';
import { captureCrossDemoScreenshot } from '../src/parity-helpers.js';

const VERIFY_ENABLED = process.env['CROSS_DEMO_RUN'] === 'true';

/**
 * **Phase 20.7.1 (follow-up): cross-demo body-region dimension mismatch.**
 *
 * Day-1 verify (2026-05-16) showed that ALL 12 `kind: 'cross'` scenarios
 * fail with the same dimensional offset: chronix renders the body at
 * 8736×1315 px vs reference's wrapper at 8737×1318 px (1-px narrower, 3-px
 * shorter). The mismatch is invariant across views + flags, which
 * pinpoints a single root cause in the capture rect, NOT 12 separate
 * regressions:
 *
 * - chronix's screenshot target is `svg.cx-gantt-body` (the SVG body
 *   element itself, no border / no wrapper padding).
 * - reference's screenshot target is `.gantt-timeline-body-wrapper` (a `div`
 *   wrapper that may include border / padding / a header overlap row).
 *
 * The two elements are not dimensionally equivalent. Two viable fixes
 * for Phase 20.7.1:
 *   (a) Adjust `captureCrossDemoScreenshot` to crop both sides to the
 *       calculated axis rect (deterministic dimensions, scrollbar-/
 *       chrome-independent).
 *   (b) Switch chronix's capture target to a wrapper that includes
 *       chronix's own header band so the wrapper-vs-wrapper compare
 *       is apples-to-apples.
 *
 * Until 20.7.1 lands, every `kind: 'cross'` scenario is `test.fail()`-
 * marked so the gate reports them as "expected to fail" — the gate
 * still catches a regression on the VRT side (13 scenarios) AND will
 * catch the moment 20.7.1's fix flips any cross scenario green
 * (Playwright reports "expected to fail, but passed" → the test.fail
 * mark must be removed and the cross-demo coverage activated).
 */
const PENDING_CROSS_DIMENSION_FIX = new Set<string>(
  CROSS_DEMO_SCENARIOS.filter((s) => s.kind === 'cross').map((s) => s.id),
);

test.describe('Phase 20.7 — cross-demo screenshot diff', () => {
  test.skip(!VERIFY_ENABLED, 'Set CROSS_DEMO_RUN=true to enable (use `pnpm cross-demo-verify`).');

  for (const scenario of CROSS_DEMO_SCENARIOS) {
    const baselineSubdir = scenario.kind === 'cross' ? 'reference' : 'chronix';
    // Playwright's `toMatchSnapshot` sanitizes `/` → `-` in the string
    // form of its arg (so `'a/b.png'` becomes `a-b.png`). Pass the
    // path as an array of segments instead — Playwright joins them
    // with the OS separator without sanitizing, preserving the
    // intended `cross-demo-baselines/<subdir>/<id>.png` layout that
    // `pnpm cross-demo-capture` writes to.
    const baselineSegments = [CROSS_DEMO_BASELINE_DIR, baselineSubdir, `${scenario.id}.png`];

    test(`${scenario.kind} :: ${scenario.id}`, async ({ browser }) => {
      if (PENDING_CROSS_DIMENSION_FIX.has(scenario.id)) {
        test.fail(
          true,
          'Phase 20.7.1: cross-demo body-region dimension mismatch (1-px width / 3-px height between chronix svg.cx-gantt-body and reference timeline-body-wrapper). Root-cause + fix pending — see test file header comment.',
        );
      }
      const buffer = await captureCrossDemoScreenshot('chronix', browser, scenario);
      expect(buffer).toMatchSnapshot(baselineSegments, CROSS_DEMO_TOLERANCE);
    });
  }
});
