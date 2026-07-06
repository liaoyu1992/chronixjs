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
  const bodyRows = Array.from(
    body.querySelectorAll(
      ':scope > .cx-table-body-content > .cx-table-row, :scope > .cx-table-row',
    ),
  );
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width) };
  };
  const detail = (el) => {
    if (!el) return null;
    const s = getComputedStyle(el);
    return {
      ...box(el),
      sw: el.scrollWidth,
      cw: el.clientWidth,
      whiteSpace: s.whiteSpace,
      overflow: s.overflow,
      textOverflow: s.textOverflow,
      paddingL: s.paddingLeft,
      paddingR: s.paddingRight,
      borderR: s.borderRightWidth,
    };
  };
  const noteHeader =
    headerEl.querySelector('.cx-table-header-cell--pinned-right-first') ||
    headerEl.querySelector('.cx-table-header-cell--pinned-right');
  const noteBodies = bodyRows.slice(0, 4).map((row) => {
    const c =
      row.querySelector('.cx-table-cell--pinned-right-first') ||
      row.querySelector('.cx-table-cell--pinned-right');
    return c ? { txt: (c.textContent || '').trim().slice(0, 12), ...detail(c) } : null;
  });
  return { bodyScrollLeft: body.scrollLeft, noteHeader: detail(noteHeader), noteBodies };
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
  for (const sl of [0, 220]) {
    await page.evaluate((x) => {
      document.querySelector('[data-testid="tool-panel-section"] .cx-table-body').scrollLeft = x;
    }, sl);
    await page.waitForTimeout(400);
    const d = await page.evaluate(MEASURE);
    console.log(`\n${t.name} scrollLeft=${sl}`);
    console.log(`  noteHeader: ${JSON.stringify(d.noteHeader)}`);
    d.noteBodies.forEach((b, i) => console.log(`  noteBody[${i}]: ${JSON.stringify(b)}`));
  }
  await page
    .locator('[data-testid="tool-panel-section"] .cx-table-wrapper')
    .first()
    .screenshot({ path: path.join(OUT, `${t.name}-tp-note2.png`) });
  await page.close();
}
await browser.close();
console.log('done ->', OUT);
