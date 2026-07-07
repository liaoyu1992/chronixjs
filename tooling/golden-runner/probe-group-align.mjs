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
  const section = document.querySelector('.demo-page__table');
  const headerEl = section.querySelector('.cx-table-header');
  const body = section.querySelector('.cx-table-body');
  const bodyFirstRow = section.querySelector('.cx-table-body .cx-table-row');
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width) };
  };
  const colHeaders = Array.from(
    headerEl.querySelectorAll(':scope > .cx-table-row--header > .cx-table-header-cell'),
  ).map((c) => ({
    t: (c.querySelector('.cx-table-header-cell-label')?.textContent || c.textContent || '')
      .trim()
      .slice(0, 5),
    ...box(c),
  }));
  const bodyCells = Array.from(bodyFirstRow.children).map((c) => ({
    t: (c.textContent || '').trim().slice(0, 5),
    ...box(c),
  }));
  const groupRows = Array.from(
    headerEl.querySelectorAll(':scope > .cx-table-row--header-group'),
  ).map((row) =>
    Array.from(row.querySelectorAll(':scope > .cx-table-header-group')).map((c) => ({
      t: (c.textContent || '').trim().slice(0, 6),
      ...box(c),
      bg: getComputedStyle(c).backgroundColor,
    })),
  );
  return { scrollLeft: body.scrollLeft, colHeaders, bodyCells, groupRows };
};

const browser = await chromium.launch();
for (const t of targets) {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  });
  await page.goto(t.url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.demo-page__table');
  await page.waitForTimeout(1200);
  const setScroll = (s) =>
    page.evaluate((x) => {
      document.querySelector('.demo-page__table .cx-table-body').scrollLeft = x;
    }, s);

  await setScroll(0);
  await page.waitForTimeout(300);
  const at0 = await page.evaluate(MEASURE);
  console.log(`\n===== ${t.name} scrollLeft=0 =====`);
  console.log('colH:', JSON.stringify(at0.colHeaders));
  console.log('body:', JSON.stringify(at0.bodyCells));
  at0.groupRows.forEach((gr, i) => console.log(`grp${i}:`, JSON.stringify(gr)));
  await page
    .locator('.demo-page__table .cx-table-header')
    .first()
    .screenshot({ path: path.join(OUT, `${t.name}-grp-l0.png`) });

  await setScroll(220);
  await page.waitForTimeout(500);
  const at220 = await page.evaluate(MEASURE);
  console.log(`\n===== ${t.name} scrollLeft=220 =====`);
  console.log('colH:', JSON.stringify(at220.colHeaders));
  at220.groupRows.forEach((gr, i) => console.log(`grp${i}:`, JSON.stringify(gr)));
  await page
    .locator('.demo-page__table .cx-table-header')
    .first()
    .screenshot({ path: path.join(OUT, `${t.name}-grp-l220.png`) });

  await page.close();
}
await browser.close();
console.log('done ->', OUT);
