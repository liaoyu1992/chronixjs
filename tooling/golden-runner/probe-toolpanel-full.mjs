import { chromium } from 'playwright';

// Measure the TOOL-PANEL-SECTION table: group row vs leaf header vs body, column by column.
const targets = [
  { name: 'vue3', url: 'http://localhost:8711/' },
  { name: 'vue2', url: 'http://localhost:8712/' },
  { name: 'react', url: 'http://localhost:8713/' },
];

const MEASURE = () => {
  const section = document.querySelector('[data-testid="tool-panel-section"]');
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
      t: (c.textContent || '').trim().slice(0, 8),
      ...box(c),
    })),
  );
  const leaf = Array.from(
    headerEl.querySelectorAll('.cx-table-row--header > .cx-table-header-cell'),
  ).map((c) => ({
    t: (c.querySelector('.cx-table-header-cell-label')?.textContent || c.textContent || '')
      .trim()
      .slice(0, 6),
    ...box(c),
    pin: (c.className.match(/pinned[\w-]*/g) || []).join('|'),
  }));
  const bodyCells = Array.from(bodyFirstRow.children).map((c) => ({
    t: (c.textContent || '').trim().slice(0, 6),
    ...box(c),
    pin: (c.className.match(/pinned[\w-]*/g) || []).join('|'),
  }));
  const hView = box(headerEl);
  const bView = box(body);
  return {
    groupRows,
    leaf,
    bodyCells,
    hView,
    bView,
    bodySL: body.scrollLeft,
    bodySW: body.scrollWidth,
    bodyCW: body.clientWidth,
  };
};

const browser = await chromium.launch();
for (const t of targets) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(t.url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="tool-panel-section"]');
  await page.waitForTimeout(1500);
  console.log(`\n===== ${t.name} TOOL-PANEL-SECTION =====`);
  const d = await page.evaluate(MEASURE);
  if (d.err) {
    console.log(d.err);
    await page.close();
    continue;
  }
  console.log(
    `bodySL=${d.bodySL} bodySW=${d.bodySW} bodyCW=${d.bodyCW} | hView.r=${d.hView.r} bView.r=${d.bView.r} gutter=${d.bView.r - d.hView.r}`,
  );
  d.groupRows.forEach((gr, i) => {
    console.log(` group[${i}]:`);
    gr.forEach((c) => console.log(`   "${c.t}" l=${c.l} r=${c.r} w=${c.w}`));
  });
  console.log(` leafHeaders:`);
  d.leaf.forEach((c) => console.log(`   "${c.t}" l=${c.l} r=${c.r} w=${c.w} [${c.pin}]`));
  console.log(` bodyCells:`);
  d.bodyCells.forEach((c) => console.log(`   "${c.t}" l=${c.l} r=${c.r} w=${c.w} [${c.pin}]`));
  await page.close();
}
await browser.close();
