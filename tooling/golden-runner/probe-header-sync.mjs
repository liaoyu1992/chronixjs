import { chromium } from 'playwright';

const targets = [
  { name: 'vue3', url: 'http://localhost:8711/' },
  { name: 'vue2', url: 'http://localhost:8712/' },
  { name: 'react', url: 'http://localhost:8713/' },
];

const MEASURE = (sel) => {
  const section = document.querySelector(sel);
  if (!section) return { err: 'no section' };
  const headerEl = section.querySelector('.cx-table-header');
  const body = section.querySelector('.cx-table-body');
  const bodyFirstRow = section.querySelector('.cx-table-body .cx-table-row');
  if (!headerEl || !body || !bodyFirstRow)
    return { err: 'missing', hasBody: !!body, hasHeader: !!headerEl, hasRow: !!bodyFirstRow };
  const hCells = Array.from(
    headerEl.querySelectorAll('.cx-table-row--header > .cx-table-header-cell'),
  ).map((c) => {
    const r = c.getBoundingClientRect();
    return {
      t: (c.querySelector('.cx-table-header-cell-label')?.textContent || c.textContent || '')
        .trim()
        .slice(0, 6),
      l: Math.round(r.left),
      w: Math.round(r.width),
    };
  });
  const bCells = Array.from(bodyFirstRow.children).map((c) => {
    const r = c.getBoundingClientRect();
    return {
      t: (c.textContent || '').trim().slice(0, 6),
      l: Math.round(r.left),
      w: Math.round(r.width),
    };
  });
  return {
    bodySL: body.scrollLeft,
    headerSL: headerEl.scrollLeft,
    bodySW: body.scrollWidth,
    bodyCW: body.clientWidth,
    hCells,
    bCells,
  };
};

const browser = await chromium.launch();
for (const t of targets) {
  const page = await browser.newPage();
  await page.goto(t.url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="tool-panel-section"]');
  await page.waitForTimeout(1200);
  console.log(`\n===== ${t.name} =====`);
  for (const [label, sel] of [
    ['MAIN', '.demo-page__table'],
    ['TIER3', '[data-testid="tier3-finale-section"]'],
    ['TOOLP', '[data-testid="tool-panel-section"]'],
  ]) {
    await page.evaluate(
      (a) => {
        const b = document.querySelector(a[0] + ' .cx-table-body');
        if (b) b.scrollLeft = a[1];
      },
      [sel, 220],
    );
    await page.waitForTimeout(600);
    const d = await page.evaluate(MEASURE, sel);
    if (d.err) {
      console.log(`${label}: ${d.err}`);
      continue;
    }
    const synced = d.bodySL === d.headerSL;
    console.log(
      `${label}: bodySL=${d.bodySL} headerSL=${d.headerSL} synced=${synced} | bodySW=${d.bodySW} bodyCW=${d.bodyCW}`,
    );
    const n = Math.max(d.hCells.length, d.bCells.length);
    for (let i = 0; i < n; i++) {
      const h = d.hCells[i];
      const b = d.bCells[i];
      if (h && b) {
        const ld = b.l - h.l;
        const wd = b.w - h.w;
        if (Math.abs(ld) > 1 || Math.abs(wd) > 1)
          console.log(
            `   col[${i}] ${h.t}: hL=${h.l} bL=${b.l} (Δ=${ld}) | hW=${h.w} bW=${b.w} (Δ=${wd})`,
          );
      }
    }
  }
  await page.close();
}
await browser.close();
