/**
 * **Phase 20.7: unit tests for the cross-demo scenario registry shape.**
 *
 * No browser fixture. Tests pure shape invariants: count, kind split,
 * id uniqueness + filename safety, urlQuery format, baseline path
 * resolution.
 *
 * The end-to-end browser-side correctness of `captureCrossDemoScreenshot`
 * is verified by Commit 2's `cross-demo.spec.ts` (the actual
 * 25-scenario run against the live demos). This unit suite catches
 * registry edits that break invariants without booting Playwright.
 */
import { expect, test } from '@playwright/test';

import {
  CROSS_DEMO_BASELINE_DIR,
  CROSS_DEMO_SCENARIOS,
  CROSS_DEMO_TOLERANCE,
  crossDemoBaselineRelPath,
} from '../src/cross-demo-scenarios.js';

test.describe('CROSS_DEMO_SCENARIOS — registry shape', () => {
  test('has 27 entries total (25 from Phase 20.7 + 2 from Phase 21)', () => {
    expect(CROSS_DEMO_SCENARIOS).toHaveLength(27);
  });

  test('splits 12 cross + 15 vrt (13 from Phase 20.7 + 2 Phase 21 todayLine)', () => {
    const cross = CROSS_DEMO_SCENARIOS.filter((s) => s.kind === 'cross');
    const vrt = CROSS_DEMO_SCENARIOS.filter((s) => s.kind === 'vrt');
    expect(cross).toHaveLength(12);
    expect(vrt).toHaveLength(15);
  });

  test('every scenario id is unique (case-sensitive)', () => {
    const ids = CROSS_DEMO_SCENARIOS.map((s) => s.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  test('every scenario id is unique case-insensitively (Windows-safe)', () => {
    // Windows + macOS default filesystems are case-insensitive but
    // case-preserving. Ids that differ only by case would collide
    // when written as `.png` baselines.
    const lowered = CROSS_DEMO_SCENARIOS.map((s) => s.id.toLowerCase());
    const unique = new Set(lowered);
    expect(unique.size).toBe(lowered.length);
  });

  test('every scenario id is filename-safe (alphanum + hyphen, any case)', () => {
    // Mixed case allowed so ids can mirror chronix URL flag names
    // verbatim (`priorityCallback`, `umbrellaColor`, etc.). Case
    // collisions are blocked by the Windows-safe uniqueness test
    // above.
    for (const scenario of CROSS_DEMO_SCENARIOS) {
      expect(scenario.id).toMatch(/^[a-zA-Z0-9-]+$/);
    }
  });

  test('cross scenario ids are prefixed with "cross-"; vrt with "vrt-"', () => {
    for (const scenario of CROSS_DEMO_SCENARIOS) {
      const expectedPrefix = scenario.kind === 'cross' ? 'cross-' : 'vrt-';
      expect(scenario.id.startsWith(expectedPrefix)).toBe(true);
    }
  });

  test('cross scenarios never include "parity=true" in urlQuery (helper adds it implicitly)', () => {
    for (const scenario of CROSS_DEMO_SCENARIOS) {
      if (scenario.kind === 'cross') {
        expect(scenario.urlQuery).not.toContain('parity=true');
        expect(scenario.urlQuery).not.toContain('parity=');
      }
    }
  });

  test('every urlQuery parses as a valid URLSearchParams (or is empty)', () => {
    for (const scenario of CROSS_DEMO_SCENARIOS) {
      if (scenario.urlQuery === '') continue;
      // URLSearchParams accepts empty + key=value&key=value patterns;
      // round-trip ensures no malformed keys / dangling `&`.
      const params = new URLSearchParams(scenario.urlQuery);
      const roundTripped = params.toString();
      expect(roundTripped.length).toBeGreaterThan(0);
      // Re-parsing the round-trip must produce the same key set as
      // the original — catches `?&foo=` or `&&` artifacts.
      const original = new URLSearchParams(scenario.urlQuery);
      const reSorted = [...original.keys()].sort();
      const tripSorted = [...new URLSearchParams(roundTripped).keys()].sort();
      expect(tripSorted).toEqual(reSorted);
    }
  });

  test('every scenario has a non-empty description', () => {
    for (const scenario of CROSS_DEMO_SCENARIOS) {
      expect(scenario.description.length).toBeGreaterThan(10);
    }
  });

  test('viewId is one of the 6 known view ids', () => {
    const validViews = new Set(['day', 'week', 'month', 'season', 'halfYear', 'year']);
    for (const scenario of CROSS_DEMO_SCENARIOS) {
      expect(validViews.has(scenario.viewId)).toBe(true);
    }
  });
});

test.describe('CROSS_DEMO_TOLERANCE — global fixed tolerance', () => {
  test('maxDiffPixelRatio is exactly 0 (no pixel may differ)', () => {
    expect(CROSS_DEMO_TOLERANCE.maxDiffPixelRatio).toBe(0);
  });

  test('threshold is 0.2 (Playwright default, absorbs sub-pixel AA noise)', () => {
    expect(CROSS_DEMO_TOLERANCE.threshold).toBe(0.2);
  });
});

test.describe('crossDemoBaselineRelPath', () => {
  test('cross scenarios resolve to cross-demo-baselines/kui/<id>.png', () => {
    const cross = CROSS_DEMO_SCENARIOS.find((s) => s.kind === 'cross');
    if (!cross) throw new Error('expected at least one cross scenario');
    expect(crossDemoBaselineRelPath(cross)).toBe(`${CROSS_DEMO_BASELINE_DIR}/kui/${cross.id}.png`);
  });

  test('vrt scenarios resolve to cross-demo-baselines/chronix/<id>.png', () => {
    const vrt = CROSS_DEMO_SCENARIOS.find((s) => s.kind === 'vrt');
    if (!vrt) throw new Error('expected at least one vrt scenario');
    expect(crossDemoBaselineRelPath(vrt)).toBe(`${CROSS_DEMO_BASELINE_DIR}/chronix/${vrt.id}.png`);
  });

  test('all 27 paths are unique', () => {
    const paths = CROSS_DEMO_SCENARIOS.map(crossDemoBaselineRelPath);
    const unique = new Set(paths);
    expect(unique.size).toBe(paths.length);
  });
});
