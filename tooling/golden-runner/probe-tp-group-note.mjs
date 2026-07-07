import { chromium } from 'playwright';

const targets = [
  { name: 'vue3', url: 'http://localhost:8711/' },
  { name: 'vue2', url: 'http://localhost:8712/' },
  { name: 'react', url: 'http://localhost:8713/' },
];
const MEASURE = () => {
  const section = document.querySelector('[data-testid="tool-panel-section"]');
  const headerEl = section.querySelector('.cx-table-header');
  const bodyFirstRow = section.querySelector('.cx-table-body .cx-table-row');
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width) };
  };
  const groupRows = Array.from(headerEl.querySelectorAll(':scope > .cx-table-row--header-group'));
  const grp = groupRows.map((row) =>
    Array.from(row.querySelectorAll(':scope > .cx-table-header-group')).map((c) => ({
      t: (c.textContent || '').trim().slice(0, 6) || '_',
      ...box(c),
    })),
  );
  const noteHeader =
    headerEl.querySelector('.cx-table-header-cell--pinned-right-first') ||
    headerEl.querySelector('.cx-table-header-cell--pinned-right');
  const noteBody =
    bodyFirstRow.querySelector('.cx-table-cell--pinned-right-first') ||
    bodyFirstRow.querySelector('.cx-table-cell--pinned-right');
  return {
    grp,
    noteHeader: noteHeader ? box(noteHeader) : null,
    noteBody: noteBody ? box(noteBody) : null,
  };
};
const browser = await chromium.launch();
for (const t of targets) {
  const page = await browser.newPage();
  await page.goto(t.url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="tool-panel-section"]');
  await page.waitForTimeout(1200);
  const d = await page.evaluate(MEASURE);
  console.log(`\n${t.name}:`);
  d.grp.forEach((row, i) => console.log(`  grp${i}: ${JSON.stringify(row)}`));
  console.log(`  noteHeader (备注 col): ${JSON.stringify(d.noteHeader)}`);
  console.log(`  noteBody   (备注 body): ${JSON.stringify(d.noteBody)}`);
  await page.close();
}
await browser.close();
