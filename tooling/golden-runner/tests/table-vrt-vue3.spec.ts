/**
 * **Phase 113: chronix-table-vue3 per-adapter VRT verify spec.**
 *
 * Mirrors gantt's `parity.spec.ts` pattern but with self-baseline
 * `vrt`-only kind (no reference side). Runs ONLY when
 * `TABLE_VRT_RUN=true` env var is set (`pnpm table-vrt-verify`).
 *
 * Baseline path:
 *   `goldens/table-cross-demo-baselines/vue3/<scenario-id>.png`
 *
 * Each scenario captures the primary demo table screenshot from
 * `localhost:8711` (vue3 demo port; override via
 * `CHRONIX_TABLE_VUE3_DEMO_URL` env var).
 *
 * Day-1 policy: until baselines are captured via
 * `pnpm table-vrt-capture`, these tests fail with
 * "snapshot does not exist" — the env-var gate keeps that out of
 * normal `pnpm verify`.
 */
import { expect, test } from '@playwright/test';

import {
  TABLE_VRT_BASELINE_DIR,
  TABLE_VRT_SCENARIOS,
  TABLE_VRT_TOLERANCE,
} from '../src/table-cross-demo-scenarios.js';
import { captureTableVrtScreenshot } from '../src/table-parity-helpers.js';

const VERIFY_ENABLED = process.env['TABLE_VRT_RUN'] === 'true';

test.describe('Phase 113 — chronix-table VRT (vue3)', () => {
  test.skip(!VERIFY_ENABLED, 'Set TABLE_VRT_RUN=true to enable (use `pnpm table-vrt-verify`).');

  for (const scenario of TABLE_VRT_SCENARIOS) {
    const baselineSegments = [TABLE_VRT_BASELINE_DIR, 'vue3', `${scenario.id}.png`];

    test(`vue3 :: ${scenario.id}`, async ({ browser }) => {
      const buffer = await captureTableVrtScreenshot('vue3', browser, scenario);
      expect(buffer).toMatchSnapshot(baselineSegments, TABLE_VRT_TOLERANCE);
    });
  }
});
