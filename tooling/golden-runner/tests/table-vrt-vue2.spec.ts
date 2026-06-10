/**
 * **Phase 113: chronix-table-vue2 per-adapter VRT verify spec.**
 *
 * Mirrors `table-vrt-vue3.spec.ts` with adapter `'vue2'` + baseline
 * subdir `vue2/`. Demo URL: `localhost:8712` (override via
 * `CHRONIX_TABLE_VUE2_DEMO_URL`).
 */
import { expect, test } from '@playwright/test';

import {
  TABLE_VRT_BASELINE_DIR,
  TABLE_VRT_SCENARIOS,
  TABLE_VRT_TOLERANCE,
} from '../src/table-cross-demo-scenarios.js';
import { captureTableVrtScreenshot } from '../src/table-parity-helpers.js';

const VERIFY_ENABLED = process.env['TABLE_VRT_RUN'] === 'true';

test.describe('Phase 113 — chronix-table VRT (vue2)', () => {
  test.skip(!VERIFY_ENABLED, 'Set TABLE_VRT_RUN=true to enable (use `pnpm table-vrt-verify`).');

  for (const scenario of TABLE_VRT_SCENARIOS) {
    const baselineSegments = [TABLE_VRT_BASELINE_DIR, 'vue2', `${scenario.id}.png`];

    test(`vue2 :: ${scenario.id}`, async ({ browser }) => {
      const buffer = await captureTableVrtScreenshot('vue2', browser, scenario);
      expect(buffer).toMatchSnapshot(baselineSegments, TABLE_VRT_TOLERANCE);
    });
  }
});
