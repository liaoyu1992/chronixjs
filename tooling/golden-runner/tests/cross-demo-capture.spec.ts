/**
 * **Phase 20.7: one-time baseline capture for the cross-demo registry.**
 *
 * Runs ONLY when `CROSS_DEMO_CAPTURE=true` env var is set (the
 * `pnpm cross-demo-capture` script). During normal `pnpm verify` the
 * tests `test.skip()` so per-phase verify never re-captures
 * baselines (which would silently overwrite the frozen reference
 * and defeat regression detection).
 *
 * For each registry scenario:
 * - `kind: 'cross'` → captures k-ui side → writes to
 *   `goldens/cross-demo-baselines/kui/<id>.png`
 * - `kind: 'vrt'`   → captures chronix side → writes to
 *   `goldens/cross-demo-baselines/chronix/<id>.png`
 *
 * Direct `fs.writeFile` rather than Playwright's `--update-snapshots`
 * mechanism, because `toMatchSnapshot --update` would overwrite with
 * whatever side the verify spec captures (always chronix) — we need
 * the REFERENCE side written for cross scenarios.
 *
 * Re-run only when:
 * - First-time bootstrap of Phase 20.7
 * - k-ui upstream changes intentionally (cross baselines)
 * - A chronix-VRT scenario's expected rendering deliberately updated
 *   (vrt baselines, e.g. a chronix-only refactor of a toggle)
 *
 * In all 3 cases, manually review each PNG diff before committing.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { test } from '@playwright/test';

import { CROSS_DEMO_BASELINE_DIR, CROSS_DEMO_SCENARIOS } from '../src/cross-demo-scenarios.js';
import { captureCrossDemoScreenshot } from '../src/parity-helpers.js';

const CAPTURE_ENABLED = process.env['CROSS_DEMO_CAPTURE'] === 'true';

// Resolve goldens dir relative to this file so the test works
// regardless of the Playwright invocation cwd.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GOLDENS_DIR = path.resolve(__dirname, '..', 'goldens');

test.describe('Phase 20.7 — cross-demo baseline capture (one-time)', () => {
  test.skip(
    !CAPTURE_ENABLED,
    'Set CROSS_DEMO_CAPTURE=true to enable (use `pnpm cross-demo-capture`).',
  );

  for (const scenario of CROSS_DEMO_SCENARIOS) {
    const captureSource: 'kui' | 'chronix' = scenario.kind === 'cross' ? 'kui' : 'chronix';
    const baselineSubdir = scenario.kind === 'cross' ? 'kui' : 'chronix';
    const outRel = `${CROSS_DEMO_BASELINE_DIR}/${baselineSubdir}/${scenario.id}.png`;
    const outAbs = path.join(GOLDENS_DIR, outRel);

    test(`capture ${scenario.kind} :: ${scenario.id} (from ${captureSource})`, async ({
      browser,
    }) => {
      const buffer = await captureCrossDemoScreenshot(captureSource, browser, scenario);
      await mkdir(path.dirname(outAbs), { recursive: true });
      await writeFile(outAbs, buffer);
    });
  }
});
