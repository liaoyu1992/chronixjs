#!/usr/bin/env node
/**
 * Catalog-completeness scanner.
 *
 *   node scripts/audit-catalog-completeness.mjs
 *
 * For each k-ui public surface item in `audit/KUI_SURFACE_BASELINE.json`,
 * require the item name to appear (substring match, case-sensitive)
 * in at least one `audit/**\/*.md` file — either a
 * `PHASE_*_DESIGN.md` catalog row OR a `PARITY_RECHECK.md` disposition
 * row. Items missing from every audit doc indicate a silent gap
 * (feature exists upstream, chronix has neither implementation nor
 * recorded decision).
 *
 * Wired into `pnpm ci-check` as the 7th step (after `pnpm audit:names`).
 * Solves the silent-gap class by moving discipline from
 * human-authored catalog rows to CI enforcement.
 *
 * Maintenance: when k-ui ships a new public option / theme token /
 * arg shape / API method / CSS class, add it to the baseline JSON;
 * expect CI to fail; add a disposition row.
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE_PATH = join(ROOT, 'audit', 'KUI_SURFACE_BASELINE.json');
const AUDIT_DIR = join(ROOT, 'audit');

async function listMarkdownFiles(dir) {
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await listMarkdownFiles(full)));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      out.push(full);
    }
  }
  return out;
}

async function main() {
  const baselineRaw = await readFile(BASELINE_PATH, 'utf8');
  const baseline = JSON.parse(baselineRaw);

  if (typeof baseline !== 'object' || baseline === null || typeof baseline.surfaces !== 'object') {
    console.error(
      `❌ audit/KUI_SURFACE_BASELINE.json is malformed: missing top-level .surfaces object`,
    );
    process.exit(2);
  }

  const mdFiles = await listMarkdownFiles(AUDIT_DIR);
  if (mdFiles.length === 0) {
    console.error(`❌ no markdown files found under ${AUDIT_DIR}`);
    process.exit(2);
  }

  // Exclude the baseline JSON itself + this script's output samples from
  // the corpus so the script can't "self-satisfy" by listing items it's
  // about to flag. KUI_SURFACE_BASELINE.json is JSON not MD so already
  // excluded by extension filter; this is defensive.
  const corpusParts = await Promise.all(
    mdFiles.map(async (f) => {
      const content = await readFile(f, 'utf8');
      return content;
    }),
  );
  const corpus = corpusParts.join('\n\n');

  const missing = [];
  let totalItems = 0;
  for (const [surface, items] of Object.entries(baseline.surfaces)) {
    if (!Array.isArray(items)) {
      console.error(`❌ baseline.surfaces.${surface} is not an array`);
      process.exit(2);
    }
    for (const item of items) {
      totalItems += 1;
      if (typeof item !== 'string' || item.length === 0) {
        console.error(`❌ baseline.surfaces.${surface} contains a non-string item`);
        process.exit(2);
      }
      if (!corpus.includes(item)) {
        missing.push({ surface, item });
      }
    }
  }

  if (missing.length > 0) {
    console.error(
      `❌ ${missing.length} of ${totalItems} k-ui surface items lack chronix audit coverage:\n`,
    );
    const bySurface = new Map();
    for (const m of missing) {
      if (!bySurface.has(m.surface)) bySurface.set(m.surface, []);
      bySurface.get(m.surface).push(m.item);
    }
    for (const [surface, items] of bySurface) {
      console.error(`  [${surface}]`);
      for (const item of items) {
        console.error(`    - ${item}`);
      }
    }
    console.error(
      `\nFix: for each missing item, add either a catalog row in some audit/PHASE_*_DESIGN.md OR a disposition row in audit/PARITY_RECHECK.md. Substring match is case-sensitive.\n`,
    );
    console.error(
      `Baseline file: ${BASELINE_PATH}\nAudit corpus scanned: ${mdFiles.length} files under ${AUDIT_DIR}\n`,
    );
    process.exit(1);
  }

  console.log(
    `✓ catalog-completeness scan clean (${totalItems} k-ui items across ${Object.keys(baseline.surfaces).length} surfaces; ${mdFiles.length} audit files scanned)`,
  );
}

main().catch((err) => {
  console.error(`❌ scanner error:`, err);
  process.exit(2);
});
