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
  const section = document.querySelector('[data-testid="tool-panel-section"]');
  const headerEl = section.querySelector('.cx-table-header');
  const body = section.querySelector('.cx-table-body');
  const bodyFirstRow = section.querySelector('.cx-table-body .cx-table-row');
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width) };
  };
  const headers = Array.from(
    headerEl.querySelectorAll('.cx-table-row--header > .cx-table-header-cell'),
  ).map((c) => ({
    t: (c.querySelector('.cx-table-header-cell-label')?.textContent || c.textContent || '')
      .trim()
      .slice(0, 5),
    ...box(c),
    pinned: (c.className.match(/pinned[\w-]*/g) || []).join('|'),
  }));
  const bodies = Array.from(bodyFirstRow.children).map((c) => ({
    t: (c.textContent || '').trim().slice(0, 5),
    ...box(c),
    pinned: (c.className.match(/pinned[\w-]*/g) || []).join('|'),
  }));
  return {
    bodyScrollWidth: body.scrollWidth,
    bodyClientWidth: body.clientWidth,
    headerScrollLeft: headerEl.scrollLeft,
    headers,
    bodies,
  };
};

const browser = await chromium.launch();
for (const t of targets) {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  });
  await page.goto(t.url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="tool-panel-section"]');
  await page.waitForTimeout(1200);
  const d = await page.evaluate(MEASURE);
  console.log(`\n===== ${t.name} tool-panel =====`);
  console.log(`body scrollWidth=${d.bodyScrollWidth} clientWidth=${d.bodyClientWidth}`);
  console.log('headers:', JSON.stringify(d.headers));
  console.log('bodies :', JSON.stringify(d.bodies));
  const n = Math.max(d.headers.length, d.bodies.length);
  for (let i = 0; i < n; i++) {
    const h = d.headers[i];
    const b = d.bodies[i];
    if (h && b)
      console.log(
        `  col[${i}] ${h.t || b.t}: header w=${h.w} (l=${h.l}) | body w=${b.w} (l=${b.l}) | w-diff=${b.w - h.w} l-diff=${b.l - h.l}`,
      );
  }
  await page
    .locator('[data-testid="tool-panel-section"] .cx-table-wrapper')
    .first()
    .screenshot({ path: path.join(OUT, `${t.name}-toolpanel-note.png`) });
  await page.close();
}
await browser.close();
console.log('done ->', OUT);
