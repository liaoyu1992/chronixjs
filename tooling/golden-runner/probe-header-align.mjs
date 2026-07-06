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

const DUMP = (sel) => {
  const section = document.querySelector(sel);
  const headerEl = section?.querySelector('.cx-table-header');
  const body = section?.querySelector('.cx-table-body');
  const bodyFirstRow = section?.querySelector('.cx-table-body .cx-table-row');
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width) };
  };
  // group rows (top to bottom)
  const groupRows = headerEl
    ? Array.from(headerEl.querySelectorAll(':scope > .cx-table-row--header-group')).map((row) =>
        Array.from(row.querySelectorAll(':scope > .cx-table-header-group')).map((c) => ({
          text: (c.textContent || '').trim().slice(0, 8),
          ...box(c),
        })),
      )
    : [];
  const colHeaders = headerEl
    ? Array.from(
        headerEl.querySelectorAll(':scope > .cx-table-row--header > .cx-table-header-cell'),
      ).map((c) => ({
        text: (c.querySelector('.cx-table-header-cell-label')?.textContent || c.textContent || '')
          .trim()
          .slice(0, 6),
        ...box(c),
        pinned: (c.className.match(/pinned[\w-]*/g) || []).join('|'),
      }))
    : [];
  const bodyCells = bodyFirstRow
    ? Array.from(bodyFirstRow.children).map((c) => ({
        text: (c.textContent || '').trim().slice(0, 6),
        ...box(c),
        pinned: (c.className.match(/pinned[\w-]*/g) || []).join('|'),
      }))
    : [];
  return { scrollLeft: body ? body.scrollLeft : null, groupRows, colHeaders, bodyCells };
};

const browser = await chromium.launch();
for (const t of targets) {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  });
  await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForSelector('[data-testid="tool-panel-section"]', { timeout: 15000 });
  await page.waitForTimeout(1200);
  console.log(`\n========== ${t.name} (main table) ==========`);
  const d = await page.evaluate(DUMP, '.demo-page__table');
  console.log('groupRows:', JSON.stringify(d.groupRows));
  console.log('colHeaders:', JSON.stringify(d.colHeaders));
  console.log('bodyCells :', JSON.stringify(d.bodyCells));
  // close-up screenshot of just the header area (group + leaf + 1 body row)
  try {
    const headerBox = await page
      .locator('.demo-page__table .cx-table-header')
      .first()
      .boundingBox();
    if (headerBox) {
      await page.screenshot({
        path: path.join(OUT, `${t.name}-header-area.png`),
        clip: {
          x: headerBox.x,
          y: headerBox.y,
          width: headerBox.width,
          height: headerBox.height + 60,
        },
      });
    }
  } catch {
    /* ignore */
  }
  await page.close();
}
await browser.close();
console.log('\ndone ->', OUT);
