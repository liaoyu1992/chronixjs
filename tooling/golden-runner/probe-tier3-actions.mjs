import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'tmp-shots');

const targets = [
  { name: 'vue3', url: 'http://localhost:8711/' },
  { name: 'vue2', url: 'http://localhost:8712/' },
  { name: 'react', url: 'http://localhost:8713/' },
];

const MEASURE = () => {
  const section = document.querySelector('[data-testid="tier3-finale-section"]');
  if (!section) return { err: 'no section' };
  const headerEl = section.querySelector('.cx-table-header');
  const bodyFirstRow = section.querySelector('.cx-table-body .cx-table-row');
  const hCells = Array.from(
    headerEl.querySelectorAll('.cx-table-row--header > .cx-table-header-cell'),
  ).map((c) => {
    const r = c.getBoundingClientRect();
    return {
      t: (c.querySelector('.cx-table-header-cell-label')?.textContent || c.textContent || '')
        .trim()
        .slice(0, 8),
      l: Math.round(r.left),
      r: Math.round(r.right),
      w: Math.round(r.width),
    };
  });
  const bCells = Array.from(bodyFirstRow.children).map((c) => {
    const r = c.getBoundingClientRect();
    return {
      t: (c.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 12),
      l: Math.round(r.left),
      r: Math.round(r.right),
      w: Math.round(r.width),
    };
  });
  return { hCells, bCells };
};

const browser = await chromium.launch();
for (const t of targets) {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  });
  await page.goto(t.url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="tier3-finale-section"]');
  await page.waitForTimeout(1200);
  const d = await page.evaluate(MEASURE);
  console.log(`\n===== ${t.name} Tier3 =====`);
  console.log(`  header: ${JSON.stringify(d.hCells)}`);
  console.log(`  body:   ${JSON.stringify(d.bCells)}`);
  const n = Math.max(d.hCells.length, d.bCells.length);
  for (let i = 0; i < n; i++) {
    const h = d.hCells[i];
    const b = d.bCells[i];
    if (h && b)
      console.log(
        `  col[${i}] ${h.t}: header w=${h.w} (l=${h.l},r=${h.r}) | body w=${b.w} (l=${b.l},r=${b.r}) | wΔ=${b.w - h.w} lΔ=${b.l - h.l}`,
      );
  }
  await page
    .locator('[data-testid="tier3-finale-section"] .cx-table-wrapper')
    .first()
    .screenshot({ path: path.join(OUT, `${t.name}-tier3-actions.png`) });
  await page.close();
}
await browser.close();
console.log('done ->', OUT);
