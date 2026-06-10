/**
 * **Phase 113: chronix-table-react per-adapter VRT verify spec.**
 *
 * Mirrors `table-vrt-vue3.spec.ts` with adapter `'react'` + baseline
 * subdir `react/`. Demo URL: `localhost:8713` (override via
 * `CHRONIX_TABLE_REACT_DEMO_URL`).
 */
import { expect, test } from '@playwright/test';

import {
  TABLE_VRT_BASELINE_DIR,
  TABLE_VRT_SCENARIOS,
  TABLE_VRT_TOLERANCE,
} from '../src/table-cross-demo-scenarios.js';
import { captureTableVrtScreenshot } from '../src/table-parity-helpers.js';

const VERIFY_ENABLED = process.env['TABLE_VRT_RUN'] === 'true';

test.describe('Phase 113 — chronix-table VRT (react)', () => {
  test.skip(!VERIFY_ENABLED, 'Set TABLE_VRT_RUN=true to enable (use `pnpm table-vrt-verify`).');

  for (const scenario of TABLE_VRT_SCENARIOS) {
    const baselineSegments = [TABLE_VRT_BASELINE_DIR, 'react', `${scenario.id}.png`];

    test(`react :: ${scenario.id}`, async ({ browser }) => {
      const buffer = await captureTableVrtScreenshot('react', browser, scenario);
      expect(buffer).toMatchSnapshot(baselineSegments, TABLE_VRT_TOLERANCE);
    });
  }
});
