import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'tmp-shots');

const targets = [
  { name: 'vue3', url: 'http://localhost:8711/' },
  { name: 'vue2', url: 'http://localhost:8712/' },
];

// Measure group-row cells vs leaf-header cells vs body cells, column by column.
const MEASURE = (sel) => {
  const section = document.querySelector(sel);
  if (!section) return { err: 'no section' };
  const headerEl = section.querySelector('.cx-table-header');
  const body = section.querySelector('.cx-table-body');
  const bodyFirstRow = section.querySelector('.cx-table-body .cx-table-row');
  if (!headerEl || !body || !bodyFirstRow) return { err: 'missing' };
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width) };
  };
  const groupRows = Array.from(
    headerEl.querySelectorAll(':scope > .cx-table-row--header-group'),
  ).map((row) =>
    Array.from(row.querySelectorAll(':scope > .cx-table-header-group')).map((c) => ({
      t: (c.textContent || '').trim().slice(0, 10),
      ...box(c),
    })),
  );
  const leafHeaders = Array.from(
    headerEl.querySelectorAll('.cx-table-row--header > .cx-table-header-cell'),
  ).map((c) => ({
    t: (c.querySelector('.cx-table-header-cell-label')?.textContent || c.textContent || '')
      .trim()
      .slice(0, 6),
    ...box(c),
  }));
  const bodyCells = Array.from(bodyFirstRow.children).map((c) => ({
    t: (c.textContent || '').trim().slice(0, 6),
    ...box(c),
  }));
  return {
    groupRows,
    leafHeaders,
    bodyCells,
    bodySL: body.scrollLeft,
    bodySW: body.scrollWidth,
    bodyCW: body.clientWidth,
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
  console.log(`\n===== ${t.name} =====`);
  for (const [label, sel] of [['MAIN', '.demo-page__table']]) {
    const d = await page.evaluate(MEASURE, sel);
    if (d.err) {
      console.log(`${label}: ${d.err}`);
      continue;
    }
    console.log(`${label} scrollLeft=${d.bodySL} bodySW=${d.bodySW} bodyCW=${d.bodyCW}`);
    d.groupRows.forEach((gr, i) => {
      console.log(`  groupRow[${i}]:`);
      gr.forEach((c) => console.log(`     "${c.t}" l=${c.l} r=${c.r} w=${c.w}`));
    });
    console.log(`  leafHeaders:`);
    d.leafHeaders.forEach((c) => console.log(`     "${c.t}" l=${c.l} r=${c.r} w=${c.w}`));
    console.log(`  bodyCells (row0):`);
    d.bodyCells.forEach((c) => console.log(`     "${c.t}" l=${c.l} r=${c.r} w=${c.w}`));
    // screenshot the header + first body rows
    try {
      const hb = await page
        .locator(sel + ' .cx-table-header')
        .first()
        .boundingBox();
      if (hb) {
        await page.screenshot({
          path: path.join(OUT, `${t.name}-group-area.png`),
          clip: { x: hb.x, y: hb.y, width: hb.width, height: hb.height + 80 },
        });
        console.log(`  shot -> ${t.name}-group-area.png`);
      }
    } catch (e) {
      console.log('  shot err', e.message);
    }
  }
  await page.close();
}
await browser.close();
