#!/usr/bin/env node
/**
 * **Phase 113: cross-platform env-var launcher for chronix-table VRT specs.**
 *
 * Mirrors `run-cross-demo.mjs` for the table per-adapter VRT track.
 *
 * Usage (via pnpm scripts):
 *   node scripts/run-table-vrt.mjs capture   → TABLE_VRT_CAPTURE=true,
 *                                              runs table-vrt-capture.spec.ts
 *   node scripts/run-table-vrt.mjs verify    → TABLE_VRT_RUN=true,
 *                                              runs the 3 table-vrt-*.spec.ts
 *
 * Extra args after `<capture|verify>` forward to playwright:
 *   node scripts/run-table-vrt.mjs capture --grep vue3
 *   node scripts/run-table-vrt.mjs verify --grep default-load
 *
 * Pre-conditions (operator must satisfy):
 *  - For `capture`: the 3 demos must be running on ports 8711 / 8712 / 8713.
 *  - For `verify`: same demo precondition; baselines must already exist
 *    in `goldens/table-cross-demo-baselines/<adapter>/`. Missing baselines
 *    fail with Playwright's "snapshot does not exist" error.
 */
import { spawn } from 'node:child_process';

const mode = process.argv[2];
if (mode !== 'capture' && mode !== 'verify') {
  console.error(`Usage: node scripts/run-table-vrt.mjs <capture|verify>`);
  process.exit(2);
}

const envKey = mode === 'capture' ? 'TABLE_VRT_CAPTURE' : 'TABLE_VRT_RUN';
const specPattern =
  mode === 'capture'
    ? 'tests/table-vrt-capture.spec.ts'
    : 'tests/table-vrt-{vue3,vue2,react}.spec.ts';

const extraArgs = process.argv.slice(3);

const child = spawn('pnpm', ['exec', 'playwright', 'test', specPattern, ...extraArgs], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, [envKey]: 'true' },
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
