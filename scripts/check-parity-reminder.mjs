#!/usr/bin/env node
/**
 * PreToolUse hook (Bash matcher): when a `git commit` is about to fire
 * and the staged changes include algorithm code under
 * `packages/gantt/src/{layout,interaction,render,api}/**` or
 * `adapters/vue3/src/**` (excluding `.test.ts` files), print a
 * one-paragraph reminder to verify parity assertions.
 *
 * This hook is INFORMATIONAL ONLY — it never blocks the commit. The
 * rationale: blocking would create false-positive lockouts for
 * refactor / style / chronix-new commits, and a habitual `--no-verify`
 * escape hatch would erode the banned-name check too. A printed
 * reminder is enough to catch the case where the parity discipline
 * (memory rule + design-doc template + /phase-close skill) all fail
 * silently.
 *
 * Why this hook exists: `audit/PARITY_RECHECK.md` (2026-05-15) found
 * that phases 7–16 committed algorithm changes without side-by-side
 * k-ui-vs-chronix parity assertions. One 🔴 BLOCKING drift went
 * undetected for ~15 phases (`weekendsVisible` plumbed-but-unused).
 * This hook is the last line of defense if every other layer in the
 * discipline (A=memory, B=skill, D=template) fails.
 *
 * Reads the hook payload JSON from stdin. On a match, prints the
 * reminder to STDERR (so Claude's transcript surfaces it) and exits
 * 0. On no match, exits 0 silently. On internal error (bad JSON, git
 * unavailable), exits 0 silently — fail-open so a misconfigured hook
 * never bricks the session.
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Repo root = parent of `scripts/` (this file lives in scripts/).
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function readStdinSync() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function parsePayload(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isCommitCommand(cmd) {
  if (typeof cmd !== 'string') return false;
  // Match `git commit` (with or without flags / heredoc / -m args).
  // Excludes `git commit --amend` deliberately: amend operates on an
  // already-committed change set, the reminder fired on the original
  // commit.
  if (!/(^|\s|;|&&|\|\|)git\s+commit\b/.test(cmd)) return false;
  if (/--amend\b/.test(cmd)) return false;
  return true;
}

function getStagedFiles() {
  try {
    const out = execSync('git diff --cached --name-only', {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return out.split(/\r?\n/).filter(Boolean);
  } catch {
    return [];
  }
}

const ALGORITHM_PATH_RE =
  /^(packages\/gantt\/src\/(layout|interaction|render|api)\/|adapters\/vue3\/src\/)[^/]*\.ts$/;

function isAlgorithmFile(path) {
  if (!ALGORITHM_PATH_RE.test(path)) return false;
  if (path.endsWith('.test.ts')) return false;
  // Index files re-export, not algorithm code.
  if (path.endsWith('/index.ts')) return false;
  return true;
}

function getStagedDiffSamples(paths) {
  // Pull a small diff sample for each touched algorithm file to help
  // the reader judge whether parity is in question. Cap to 3 files +
  // ~10 lines each to keep the reminder concise.
  const samples = [];
  for (const p of paths.slice(0, 3)) {
    try {
      const diff = execSync(`git diff --cached --unified=0 -- ${JSON.stringify(p)}`, {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      const lines = diff.split(/\r?\n/).slice(0, 10);
      if (lines.length > 0) samples.push({ path: p, sample: lines.join('\n') });
    } catch {
      // skip
    }
  }
  return samples;
}

function main() {
  const raw = readStdinSync();
  const payload = parsePayload(raw);
  if (!payload) return;

  if (payload.tool_name !== 'Bash') return;
  const cmd = payload.tool_input?.command;
  if (!isCommitCommand(cmd)) return;

  const staged = getStagedFiles();
  const algoTouched = staged.filter(isAlgorithmFile);
  if (algoTouched.length === 0) return;

  // Also check: is parity.spec.ts ALSO staged? If yes, the reminder is
  // less urgent (assertion likely being added in same commit). Still
  // print but with a softer tone.
  const paritySpecStaged = staged.includes('tooling/golden-runner/tests/parity.spec.ts');

  const lines = [];
  lines.push('');
  lines.push('⚠ chronix parity reminder');
  lines.push('');
  lines.push(`   This commit touches ${algoTouched.length} algorithm file(s):`);
  for (const p of algoTouched) lines.push(`     - ${p}`);
  lines.push('');
  if (paritySpecStaged) {
    lines.push(
      '   ✓ tooling/golden-runner/tests/parity.spec.ts is also staged — looks good.',
    );
    lines.push(
      '   Double-check the assertion drives BOTH the k-ui demo (port 8701) AND',
    );
    lines.push(
      '   the chronix demo (port 8702) with the SAME inputs, then diffs outputs.',
    );
  } else {
    lines.push(
      '   ⚠ tooling/golden-runner/tests/parity.spec.ts is NOT staged with this commit.',
    );
    lines.push(
      '   If this phase touches an algorithm with a k-ui counterpart, add a',
    );
    lines.push(
      '   side-by-side assertion to parity.spec.ts in this same commit.',
    );
    lines.push(
      '   If this phase is chronix-new (no k-ui counterpart), confirm the',
    );
    lines.push(
      '   `## Parity assertion plan` section in the design doc has the',
    );
    lines.push(
      '   `**chronix-new — no parity assertion possible.**` declaration.',
    );
  }
  lines.push('');
  lines.push(
    '   Run `/phase-close` before flipping the design doc Status to DONE.',
  );
  lines.push('   See audit/PARITY_RECHECK.md (2026-05-15) for the why.');
  lines.push('');

  process.stderr.write(lines.join('\n'));
  // Exit 0: informational only, never block.
  process.exit(0);
}

main();
