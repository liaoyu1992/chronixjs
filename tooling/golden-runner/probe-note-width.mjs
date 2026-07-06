import { chromium } from 'playwright';

// Measure pinned-RIGHT column alignment (备注 in main table, 操作 in tier3)
// between the header strip and the body's first row, plus the header vs body
// viewport right edges (to detect a scrollbar gutter desync).

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
  if (!headerEl || !body || !bodyFirstRow) return { err: 'missing' };
  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return { l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width) };
  };
  // header + body VIEWPORT boxes (the scroll containers themselves)
  const headerBox = rect(headerEl);
  const bodyBox = rect(body);
  // last leaf header cell (the pinned-right column header)
  const leafHeaders = Array.from(
    headerEl.querySelectorAll('.cx-table-row--header > .cx-table-header-cell'),
  );
  const lastHeader = leafHeaders[leafHeaders.length - 1];
  // last body cell of the first row (the pinned-right column body cell)
  const bodyCells = Array.from(bodyFirstRow.children);
  const lastBody = bodyCells[bodyCells.length - 1];
  // also the FIRST body/header cell + a center one for context
  const firstHeader = leafHeaders[0];
  const firstBody = bodyCells[0];
  return {
    headerViewport: headerBox,
    bodyViewport: bodyBox,
    gutterDiff: bodyBox.r - headerBox.r, // body right - header right
    firstHeader: firstHeader
      ? { ...rect(firstHeader), t: (firstHeader.textContent || '').trim().slice(0, 6) }
      : null,
    firstBody: firstBody
      ? { ...rect(firstBody), t: (firstBody.textContent || '').trim().slice(0, 6) }
      : null,
    lastHeader: lastHeader
      ? { ...rect(lastHeader), t: (lastHeader.textContent || '').trim().slice(0, 8) }
      : null,
    lastBody: lastBody
      ? { ...rect(lastBody), t: (lastBody.textContent || '').trim().slice(0, 8) }
      : null,
    bodySL: body.scrollLeft,
    bodySW: body.scrollWidth,
    bodyCW: body.clientWidth,
    bodyOffsetW: body.offsetWidth,
    headerOffsetW: headerEl.offsetWidth,
    headerScrollW: headerEl.scrollWidth,
  };
};

const browser = await chromium.launch();
for (const t of targets) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(t.url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="tool-panel-section"]');
  await page.waitForTimeout(1200);
  console.log(`\n===== ${t.name} =====`);
  for (const [label, sel] of [
    ['MAIN (备注 pinned R)', '.demo-page__table'],
    ['TIER3 (操作 pinned R)', '[data-testid="tier3-finale-section"]'],
  ]) {
    // measure at natural scrollLeft = 0 (no clamping)
    await page.evaluate((s) => {
      const b = document.querySelector(s + ' .cx-table-body');
      if (b) b.scrollLeft = 0;
    }, sel);
    await page.waitForTimeout(400);
    const d = await page.evaluate(MEASURE, sel);
    if (d.err) {
      console.log(`${label}: ${d.err}`);
      continue;
    }
    console.log(`${label}  [scrollLeft=${d.bodySL}]`);
    console.log(
      `  headerViewport: l=${d.headerViewport.l} r=${d.headerViewport.r} w=${d.headerViewport.w}`,
    );
    console.log(
      `  bodyViewport  : l=${d.bodyViewport.l} r=${d.bodyViewport.r} w=${d.bodyViewport.w}  (gutterDiff bodyR-headerR=${d.gutterDiff})`,
    );
    console.log(
      `  body: scrollW=${d.bodySW} clientW=${d.bodyCW} offsetW=${d.bodyOffsetW} | header: offsetW=${d.headerOffsetW} scrollW=${d.headerScrollW}`,
    );
    if (d.firstHeader && d.firstBody) {
      console.log(
        `  firstCol "${d.firstHeader.t}"/"${d.firstBody.t}": H l=${d.firstHeader.l} r=${d.firstHeader.r} w=${d.firstHeader.w} | B l=${d.firstBody.l} r=${d.firstBody.r} w=${d.firstBody.w}  Δl=${d.firstBody.l - d.firstHeader.l} Δr=${d.firstBody.r - d.firstHeader.r} Δw=${d.firstBody.w - d.firstHeader.w}`,
      );
    }
    if (d.lastHeader && d.lastBody) {
      console.log(
        `  lastCol  "${d.lastHeader.t}"/"${d.lastBody.t}": H l=${d.lastHeader.l} r=${d.lastHeader.r} w=${d.lastHeader.w} | B l=${d.lastBody.l} r=${d.lastBody.r} w=${d.lastBody.w}  Δl=${d.lastBody.l - d.lastHeader.l} Δr=${d.lastBody.r - d.lastHeader.r} Δw=${d.lastBody.w - d.lastHeader.w}`,
      );
    }
  }
  await page.close();
}
await browser.close();
