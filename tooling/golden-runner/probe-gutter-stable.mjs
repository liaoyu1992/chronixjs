import { chromium } from 'playwright';

// Force the body to RESERVE a scrollbar gutter (scrollbar-gutter: stable),
// emulating a classic Windows scrollbar, and measure whether the pinned-RIGHT
// body cell drifts left of the header cell.
const targets = [
  { name: 'vue3', url: 'http://localhost:8711/' },
  { name: 'vue2', url: 'http://localhost:8712/' },
  { name: 'react', url: 'http://localhost:8713/' },
];

const MEASURE = ({ sel, colId }) => {
  const section = document.querySelector(sel);
  if (!section) return { err: 'no section' };
  const headerEl = section.querySelector('.cx-table-header');
  const body = section.querySelector('.cx-table-body');
  const bodyFirstRow = section.querySelector('.cx-table-body .cx-table-row');
  if (!headerEl || !body || !bodyFirstRow) return { err: 'missing' };
  // reserve gutter on body, NOT on header — emulates classic scrollbar asymmetry
  body.style.scrollbarGutter = 'stable';
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width) };
  };
  const hc = headerEl.querySelector(
    `.cx-table-row--header > .cx-table-header-cell[data-col-id="${colId}"]`,
  );
  const bc = bodyFirstRow.querySelector(`[data-col-id="${colId}"]`);
  return {
    bodyGutter: body.offsetWidth - body.clientWidth,
    headerGutter: headerEl.offsetWidth - headerEl.clientWidth,
    headerVR: Math.round(headerEl.getBoundingClientRect().right),
    bodyVR: Math.round(body.getBoundingClientRect().right),
    hc: hc ? box(hc) : null,
    bc: bc ? box(bc) : null,
  };
};

const browser = await chromium.launch();
for (const t of targets) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(t.url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="tool-panel-section"]');
  await page.waitForTimeout(1500);
  console.log(`\n===== ${t.name} (body scrollbar-gutter:stable) =====`);
  for (const [label, sel, colId] of [
    ['MAIN/备注', '.demo-page__table', 'note'],
    ['TIER3/操作', '[data-testid="tier3-finale-section"]', 'actions'],
  ]) {
    const d = await page.evaluate(MEASURE, { sel, colId });
    if (d.err) {
      console.log(`${label}: ${d.err}`);
      continue;
    }
    console.log(
      `${label}: bodyGutter=${d.bodyGutter}px headerGutter=${d.headerGutter}px | headerVR=${d.headerVR} bodyVR=${d.bodyVR} diff=${d.bodyVR - d.headerVR}`,
    );
    if (d.hc && d.bc)
      console.log(
        `   header: l=${d.hc.l} r=${d.hc.r} w=${d.hc.w} | body: l=${d.bc.l} r=${d.bc.r} w=${d.bc.w}  → Δl=${d.bc.l - d.hc.l} Δr=${d.bc.r - d.hc.r} Δw=${d.bc.w - d.hc.w}`,
      );
  }
  await page.close();
}
await browser.close();
