import { chromium } from 'playwright';

// Hypothesis: a vertical scrollbar gutter in the body (when rows overflow
// vertically) shifts the pinned-RIGHT body cell left vs the header cell.
const targets = [
  { name: 'vue3', url: 'http://localhost:8711/' },
  { name: 'vue2', url: 'http://localhost:8712/' },
];

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
  const hView = box(headerEl);
  const bView = box(body);
  const leafHeaders = Array.from(
    headerEl.querySelectorAll('.cx-table-row--header > .cx-table-header-cell'),
  );
  const bodyCells = Array.from(bodyFirstRow.children);
  const lastHeader = leafHeaders[leafHeaders.length - 1];
  const lastBody = bodyCells[bodyCells.length - 1];
  const lh = lastHeader ? box(lastHeader) : null;
  const lb = lastBody ? box(lastBody) : null;
  return {
    hView,
    bView,
    clientHeight: body.clientHeight,
    scrollHeight: body.scrollHeight,
    offsetHeight: body.offsetHeight,
    // detect classic scrollbar gutter
    gutter: body.offsetWidth - body.clientWidth - (body.clientLeft || 0) * 0,
    vScroll: body.scrollHeight > body.clientHeight + 1,
    lastHeader: lh,
    lastBody: lb,
    lastHText: lastHeader ? (lastHeader.textContent || '').trim().slice(0, 8) : '',
    lastBText: lastBody ? (lastBody.textContent || '').trim().slice(0, 8) : '',
  };
};

const browser = await chromium.launch();
for (const t of targets) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 600 } }); // SHORT → force vertical scroll
  await page.goto(t.url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="tool-panel-section"]');
  await page.waitForTimeout(1500);
  console.log(`\n===== ${t.name} (viewport h=600) =====`);
  for (const [label, sel] of [
    ['MAIN (备注)', '.demo-page__table'],
    ['TIER3 (操作)', '[data-testid="tier3-finale-section"]'],
  ]) {
    const d = await page.evaluate(MEASURE, sel);
    if (d.err) {
      console.log(`${label}: ${d.err}`);
      continue;
    }
    console.log(
      `${label}: vScroll=${d.vScroll} body scrollH=${d.scrollHeight} clientH=${d.clientHeight} | headerVR=${d.hView.r} bodyVR=${d.bView.r} gutterDiff=${d.bView.r - d.hView.r}`,
    );
    if (d.lastHeader && d.lastBody) {
      console.log(
        `  lastCol "${d.lastHText}"/"${d.lastBText}": H l=${d.lastHeader.l} r=${d.lastHeader.r} w=${d.lastHeader.w} | B l=${d.lastBody.l} r=${d.lastBody.r} w=${d.lastBody.w}  Δl=${d.lastBody.l - d.lastHeader.l} Δr=${d.lastBody.r - d.lastHeader.r} Δw=${d.lastBody.w - d.lastHeader.w}`,
      );
    }
  }
  await page.close();
}
await browser.close();
