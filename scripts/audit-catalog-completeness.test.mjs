#!/usr/bin/env node
/**
 * Self-test for `scripts/audit-catalog-completeness.mjs`.
 *
 *   node scripts/audit-catalog-completeness.test.mjs
 *
 * Runs five assertions and exits non-zero on any failure. Designed as a
 * stand-alone executable (not a vitest test) because the scanner lives
 * in `scripts/` outside the workspace package boundary — vitest would
 * need a dedicated config. A plain Node script keeps the dependency
 * surface zero and matches `check-banned-names.mjs`'s pattern.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, '..');
const SCANNER = join(SCRIPT_DIR, 'audit-catalog-completeness.mjs');
const BASELINE = join(ROOT, 'audit', 'KUI_SURFACE_BASELINE.json');

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed += 1;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed += 1;
  }
}

function runScanner(env = {}) {
  // Returns { stdout, stderr, exitCode }. Never throws for non-zero
  // exit; the caller asserts.
  try {
    const stdout = execFileSync('node', [SCANNER], {
      cwd: ROOT,
      env: { ...process.env, ...env },
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (err) {
    return {
      stdout: err.stdout?.toString() ?? '',
      stderr: err.stderr?.toString() ?? '',
      exitCode: err.status ?? 1,
    };
  }
}

console.log('Phase 22.AUTOMATE self-test — audit-catalog-completeness.mjs');

check('runs cleanly when every baseline item is present in audit corpus', () => {
  const result = runScanner();
  if (result.exitCode !== 0) {
    throw new Error(
      `expected exit 0, got ${result.exitCode}. stdout: ${result.stdout} stderr: ${result.stderr}`,
    );
  }
  if (!/catalog-completeness scan clean/.test(result.stdout)) {
    throw new Error(
      `expected stdout to contain "catalog-completeness scan clean", got: ${result.stdout}`,
    );
  }
});

check('parses the JSON baseline correctly and reports a non-zero item count', () => {
  const result = runScanner();
  if (result.exitCode !== 0) {
    throw new Error(`scanner did not exit 0`);
  }
  const match = /\((\d+) k-ui items across (\d+) surfaces; (\d+) audit files scanned\)/.exec(
    result.stdout,
  );
  if (!match) {
    throw new Error(`stdout did not match expected scan-summary pattern: ${result.stdout}`);
  }
  const [, itemCount, surfaceCount, fileCount] = match;
  if (Number(itemCount) < 100) {
    throw new Error(`expected ≥100 baseline items, got ${itemCount}`);
  }
  if (Number(surfaceCount) !== 6) {
    throw new Error(`expected exactly 6 surfaces, got ${surfaceCount}`);
  }
  if (Number(fileCount) < 10) {
    throw new Error(`expected ≥10 audit files scanned, got ${fileCount}`);
  }
});

check('covers all 6 surfaces (options, theme, args, api, viewSpec, cssClasses)', () => {
  const baseline = JSON.parse(readFileSync(BASELINE, 'utf8'));
  const expectedSurfaces = ['options', 'theme', 'args', 'api', 'viewSpec', 'cssClasses'];
  const actualSurfaces = Object.keys(baseline.surfaces);
  for (const s of expectedSurfaces) {
    if (!actualSurfaces.includes(s)) {
      throw new Error(`baseline missing surface "${s}". Has: ${actualSurfaces.join(', ')}`);
    }
    if (!Array.isArray(baseline.surfaces[s]) || baseline.surfaces[s].length === 0) {
      throw new Error(`baseline.surfaces.${s} must be a non-empty array`);
    }
  }
});

check('fails with exit 1 when a baseline item is missing from audit corpus', () => {
  // Use a temp working dir with a synthetic baseline + audit set.
  const tempRoot = mkdtempSync(join(tmpdir(), 'chronix-cat-test-'));
  try {
    mkdirSync(join(tempRoot, 'audit'));
    mkdirSync(join(tempRoot, 'scripts'));
    // Copy the scanner verbatim (so it picks up the temp ROOT).
    const scannerSrc = readFileSync(SCANNER, 'utf8');
    writeFileSync(join(tempRoot, 'scripts', 'audit-catalog-completeness.mjs'), scannerSrc);
    // Synthetic baseline with one unmatched token.
    writeFileSync(
      join(tempRoot, 'audit', 'KUI_SURFACE_BASELINE.json'),
      JSON.stringify({
        version: '2026-05-16-test',
        description: 'test fixture',
        surfaces: {
          options: ['existingItem', 'definitelyMissingItem_zzzzzz_unique_token'],
          theme: [],
          args: [],
          api: [],
          viewSpec: [],
          cssClasses: [],
        },
      }),
    );
    // Audit corpus only mentions `existingItem`, not the missing one.
    writeFileSync(
      join(tempRoot, 'audit', 'fake-catalog.md'),
      '# Fake catalog\n\n- `existingItem`: dispositioned\n',
    );
    // Run the COPIED scanner against the temp root (it resolves ROOT via __dirname).
    const result = (() => {
      try {
        const stdout = execFileSync(
          'node',
          [join(tempRoot, 'scripts', 'audit-catalog-completeness.mjs')],
          {
            cwd: tempRoot,
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
          },
        );
        return { stdout, stderr: '', exitCode: 0 };
      } catch (err) {
        return {
          stdout: err.stdout?.toString() ?? '',
          stderr: err.stderr?.toString() ?? '',
          exitCode: err.status ?? 1,
        };
      }
    })();
    if (result.exitCode !== 1) {
      throw new Error(
        `expected exit 1 for missing item, got ${result.exitCode}. stderr: ${result.stderr}`,
      );
    }
    if (!/definitelyMissingItem_zzzzzz_unique_token/.test(result.stderr)) {
      throw new Error(`expected stderr to name the missing item, got: ${result.stderr}`);
    }
    if (!/lack chronix audit coverage/.test(result.stderr)) {
      throw new Error(
        `expected stderr to contain "lack chronix audit coverage", got: ${result.stderr}`,
      );
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

check('prints missing items grouped by surface label', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'chronix-cat-test-'));
  try {
    mkdirSync(join(tempRoot, 'audit'));
    mkdirSync(join(tempRoot, 'scripts'));
    writeFileSync(
      join(tempRoot, 'scripts', 'audit-catalog-completeness.mjs'),
      readFileSync(SCANNER, 'utf8'),
    );
    writeFileSync(
      join(tempRoot, 'audit', 'KUI_SURFACE_BASELINE.json'),
      JSON.stringify({
        version: '2026-05-16-test',
        description: 'test fixture',
        surfaces: {
          options: ['missingOptionXxxx_unique'],
          theme: ['missingThemeYyyy_unique'],
          args: [],
          api: [],
          viewSpec: [],
          cssClasses: [],
        },
      }),
    );
    writeFileSync(join(tempRoot, 'audit', 'empty.md'), '# Empty catalog\n');
    const result = (() => {
      try {
        execFileSync('node', [join(tempRoot, 'scripts', 'audit-catalog-completeness.mjs')], {
          cwd: tempRoot,
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe'],
        });
        return { exitCode: 0, stderr: '' };
      } catch (err) {
        return { exitCode: err.status ?? 1, stderr: err.stderr?.toString() ?? '' };
      }
    })();
    if (result.exitCode !== 1) {
      throw new Error(`expected exit 1, got ${result.exitCode}`);
    }
    if (!/\[options\]/.test(result.stderr)) {
      throw new Error(`expected "[options]" surface label in stderr, got: ${result.stderr}`);
    }
    if (!/\[theme\]/.test(result.stderr)) {
      throw new Error(`expected "[theme]" surface label in stderr, got: ${result.stderr}`);
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
