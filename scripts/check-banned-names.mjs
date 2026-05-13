#!/usr/bin/env node
/**
 * Banned-identifier scanner.
 *
 *   node scripts/check-banned-names.mjs            # scan staged files (pre-commit)
 *   node scripts/check-banned-names.mjs --all      # scan whole tree (CI)
 *
 * Names live in audit/banned-names.txt (one per line, # for comments).
 * Matches are whole-word, case-sensitive. Hits print location and exit 1.
 *
 * Files exempt from scanning: anything under audit/, the script itself, lockfiles.
 */
import { execSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MODE_ALL = process.argv.includes('--all');

const BANNED_FILE = resolve(ROOT, 'audit', 'banned-names.txt');

const EXEMPT_PATH_FRAGMENTS = [
  `${sep}audit${sep}`,
  `${sep}scripts${sep}check-banned-names.mjs`,
  `${sep}node_modules${sep}`,
  `${sep}dist${sep}`,
  `${sep}.turbo${sep}`,
  `${sep}pnpm-lock.yaml`,
  `${sep}CHANGELOG.md`,
];

const SCANNED_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.cjs',
  '.jsx',
  '.vue',
  '.svelte',
  '.css',
  '.scss',
  '.html',
  '.md',
  '.json',
]);

function loadBanned() {
  const lines = readFileSync(BANNED_FILE, 'utf8').split(/\r?\n/);
  const names = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    names.push(line);
  }
  if (names.length === 0) {
    console.error('No banned identifiers loaded — refusing to silently pass.');
    process.exit(2);
  }
  return names;
}

function getStagedFiles() {
  try {
    const out = execSync('git diff --cached --name-only --diff-filter=ACMR', {
      encoding: 'utf8',
    });
    return out.split('\n').filter(Boolean);
  } catch (e) {
    console.error('git diff failed:', e.message);
    process.exit(2);
  }
}

function getTrackedFiles() {
  const out = execSync('git ls-files', { encoding: 'utf8' });
  return out.split('\n').filter(Boolean);
}

function isExempt(absPath) {
  for (const frag of EXEMPT_PATH_FRAGMENTS) {
    if (absPath.includes(frag)) return true;
  }
  return false;
}

function isScannable(file) {
  const dot = file.lastIndexOf('.');
  if (dot < 0) return false;
  return SCANNED_EXTENSIONS.has(file.slice(dot));
}

function buildPattern(names) {
  const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`\\b(${escaped.join('|')})\\b`);
}

function main() {
  const banned = loadBanned();
  const pattern = buildPattern(banned);

  const candidates = (MODE_ALL ? getTrackedFiles() : getStagedFiles())
    .filter(isScannable)
    .map((f) => resolve(ROOT, f))
    .filter((abs) => {
      try {
        return statSync(abs).isFile();
      } catch {
        return false;
      }
    })
    .filter((abs) => !isExempt(abs));

  const hits = [];
  for (const abs of candidates) {
    const text = readFileSync(abs, 'utf8');
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(pattern);
      if (m) {
        hits.push({ file: abs.replace(ROOT + sep, ''), line: i + 1, name: m[1], excerpt: lines[i].trim() });
      }
    }
  }

  if (hits.length === 0) {
    console.log(
      `✓ banned-identifier scan clean (${candidates.length} file${candidates.length === 1 ? '' : 's'})`,
    );
    return;
  }

  console.error('\n✗ Banned identifiers found:\n');
  for (const h of hits) {
    console.error(`  ${h.file}:${h.line}  →  ${h.name}`);
    console.error(`    ${h.excerpt}`);
  }
  console.error(
    `\nRefer to audit/BANNED_IDENTIFIERS.md for the chronix-native replacement.\n`,
  );
  process.exit(1);
}

main();
