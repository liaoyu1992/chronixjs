/**
 * **Phase 113: one-time baseline capture for chronix-table per-adapter VRT.**
 *
 * Runs ONLY when `TABLE_VRT_CAPTURE=true` env var is set (the
 * `pnpm table-vrt-capture` script). Iterates all 3 adapters × all
 * scenarios and writes the captured PNG directly via `fs.writeFile`
 * (rather than Playwright's `--update-snapshots`, which would also
 * fire from the verify spec and overwrite).
 *
 * Per-scenario PNG path:
 *   `goldens/table-cross-demo-baselines/<adapter>/<scenario-id>.png`
 *
 * Pre-conditions (operator must satisfy):
 *  - vue3 demo running on `http://localhost:8711` (`pnpm -C examples/table-vue3 dev`)
 *  - vue2 demo running on `http://localhost:8712` (`pnpm -C examples/table-vue2 dev`)
 *  - react demo running on `http://localhost:8713` (`pnpm -C examples/table-react dev`)
 *
 * Override individual ports via env vars (see `table-parity-helpers.ts`):
 *  - `CHRONIX_TABLE_VUE3_DEMO_URL`
 *  - `CHRONIX_TABLE_VUE2_DEMO_URL`
 *  - `CHRONIX_TABLE_REACT_DEMO_URL`
 *
 * Narrow to a single adapter via `--grep`:
 *   pnpm table-vrt-capture --grep vue3
 *
 * Narrow to a single scenario via `--grep`:
 *   pnpm table-vrt-capture --grep default-load
 *
 * Re-run only when:
 *  - First-time bootstrap of Phase 113
 *  - Demo-app chrome / theme intentionally updated
 *  - A scenario's setup() updated to capture new state
 *
 * Manually review each PNG diff before committing the regenerated
 * baselines.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { test } from '@playwright/test';

import {
  TABLE_VRT_BASELINE_DIR,
  TABLE_VRT_SCENARIOS,
  type TableAdapter,
} from '../src/table-cross-demo-scenarios.js';
import { captureTableVrtScreenshot } from '../src/table-parity-helpers.js';

const CAPTURE_ENABLED = process.env['TABLE_VRT_CAPTURE'] === 'true';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GOLDENS_DIR = path.resolve(__dirname, '..', 'goldens');

const ADAPTERS: readonly TableAdapter[] = ['vue3', 'vue2', 'react'];

test.describe('Phase 113 — chronix-table VRT baseline capture (one-time)', () => {
  test.skip(
    !CAPTURE_ENABLED,
    'Set TABLE_VRT_CAPTURE=true to enable (use `pnpm table-vrt-capture`).',
  );

  for (const adapter of ADAPTERS) {
    for (const scenario of TABLE_VRT_SCENARIOS) {
      const outRel = `${TABLE_VRT_BASELINE_DIR}/${adapter}/${scenario.id}.png`;
      const outAbs = path.join(GOLDENS_DIR, outRel);

      test(`capture ${adapter} :: ${scenario.id}`, async ({ browser }) => {
        const buffer = await captureTableVrtScreenshot(adapter, browser, scenario);
        await mkdir(path.dirname(outAbs), { recursive: true });
        await writeFile(outAbs, buffer);
      });
    }
  }
});
