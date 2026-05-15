#!/usr/bin/env node
/**
 * **Phase 20.7: cross-platform env-var launcher for cross-demo Playwright specs.**
 *
 * Avoids adding a `cross-env` devDep just to set one env var before
 * spawning Playwright. cmd.exe (Windows pnpm default) doesn't accept
 * the `KEY=VAL command` bash syntax; this thin Node wrapper sets the
 * env explicitly then spawns playwright with stdio inherited.
 *
 * Usage (via pnpm scripts):
 *   node scripts/run-cross-demo.mjs capture   → CROSS_DEMO_CAPTURE=true, runs cross-demo-capture.spec.ts
 *   node scripts/run-cross-demo.mjs verify    → CROSS_DEMO_RUN=true,     runs cross-demo.spec.ts
 *
 * The env vars are read by the gated `test.skip(...)` calls inside
 * each spec so the same spec files are inert during normal
 * `pnpm verify` (which doesn't set either var).
 */
import { spawn } from 'node:child_process';

const mode = process.argv[2];
if (mode !== 'capture' && mode !== 'verify') {
  console.error(`Usage: node scripts/run-cross-demo.mjs <capture|verify>`);
  process.exit(2);
}

const envKey = mode === 'capture' ? 'CROSS_DEMO_CAPTURE' : 'CROSS_DEMO_RUN';
const specFile =
  mode === 'capture' ? 'tests/cross-demo-capture.spec.ts' : 'tests/cross-demo.spec.ts';

// Forward any positional args after `<capture|verify>` to playwright.
// Useful for narrowing capture/verify to a subset, e.g.:
//   node scripts/run-cross-demo.mjs capture --grep todayLine
const extraArgs = process.argv.slice(3);

// Use `pnpm exec` so the locally-installed playwright CLI resolves
// without requiring it in PATH. Cross-platform via `shell: true`.
const child = spawn('pnpm', ['exec', 'playwright', 'test', specFile, ...extraArgs], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, [envKey]: 'true' },
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
