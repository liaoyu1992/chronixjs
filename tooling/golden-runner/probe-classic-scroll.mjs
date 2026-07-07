import { chromium } from 'playwright';

// Force a CLASSIC scrollbar gutter on the body (overflow-y: scroll) and see
// whether the pinned-RIGHT header cell and body cell drift apart.
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
  // FORCE classic vertical scrollbar on body
  body.style.overflowY = 'scroll';
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width) };
  };
  const headerCell = headerEl.querySelector(
    `.cx-table-row--header > .cx-table-header-cell[data-col-id="${colId}"]`,
  );
  const bodyCell = bodyFirstRow.querySelector(`[data-col-id="${colId}"]`);
  return {
    bodyOffsetW: body.offsetWidth,
    bodyClientW: body.clientWidth,
    gutterPx: body.offsetWidth - body.clientWidth,
    headerVR: Math.round(headerEl.getBoundingClientRect().right),
    bodyVR: Math.round(body.getBoundingClientRect().right),
    headerCell: headerCell ? box(headerCell) : null,
    bodyCell: bodyCell ? box(bodyCell) : null,
  };
};

const browser = await chromium.launch();
for (const t of targets) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(t.url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="tool-panel-section"]');
  await page.waitForTimeout(1500);
  console.log(`\n===== ${t.name} (body forced overflow-y:scroll) =====`);
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
      `${label}: gutter=${d.gutterPx}px (offsetW=${d.bodyOffsetW} clientW=${d.bodyClientW}) | headerVR=${d.headerVR} bodyVR=${d.bodyVR} diff=${d.bodyVR - d.headerVR}`,
    );
    if (d.headerCell && d.bodyCell) {
      console.log(`   header: l=${d.headerCell.l} r=${d.headerCell.r} w=${d.headerCell.w}`);
      console.log(
        `   body  : l=${d.bodyCell.l} r=${d.bodyCell.r} w=${d.bodyCell.w}  → Δl=${d.bodyCell.l - d.headerCell.l} Δr=${d.bodyCell.r - d.headerCell.r} Δw=${d.bodyCell.w - d.headerCell.w}`,
      );
    }
  }
  await page.close();
}
await browser.close();
