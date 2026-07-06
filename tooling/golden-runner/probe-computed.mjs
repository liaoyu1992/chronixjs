import { chromium } from 'playwright';

// Definitive check: computed box-sizing + rendered width of GROUP vs LEAF-HEADER vs BODY
// cells for the 备注 column (main table) and 操作 column (tier3), in all 3 frameworks.
const targets = [
  { name: 'vue3', url: 'http://localhost:8711/' },
  { name: 'vue2', url: 'http://localhost:8712/' },
  { name: 'react', url: 'http://localhost:8713/' },
];

const INSPECT = ({ sel, colId }) => {
  const section = document.querySelector(sel);
  if (!section) return { err: 'no section' };
  const headerEl = section.querySelector('.cx-table-header');
  const bodyFirstRow = section.querySelector('.cx-table-body .cx-table-row');
  const cs = (el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      box: s.boxSizing,
      w: Math.round(r.width),
      declW: s.width,
      padL: s.paddingLeft,
      padR: s.paddingRight,
      borderL: s.borderLeftWidth,
      flex: s.flexShrink,
      minW: s.minWidth,
    };
  };
  // group cells covering this col (any level)
  const groupCells = Array.from(headerEl.querySelectorAll('.cx-table-header-group')).filter(
    (c) => c.getAttribute('style') || true,
  );
  const leafCell = headerEl.querySelector(
    `.cx-table-row--header > .cx-table-header-cell[data-col-id="${colId}"]`,
  );
  const bodyCell = bodyFirstRow.querySelector(`[data-col-id="${colId}"]`);
  // row container widths
  const headerRow = headerEl.querySelector('.cx-table-row--header');
  const bodyRow = bodyFirstRow;
  return {
    leaf: leafCell ? cs(leafCell) : null,
    body: bodyCell ? cs(bodyCell) : null,
    headerRowW: headerRow ? Math.round(headerRow.getBoundingClientRect().width) : null,
    headerRowDisplay: headerRow ? getComputedStyle(headerRow).display : null,
    bodyRowW: Math.round(bodyRow.getBoundingClientRect().width),
    bodyRowDisplay: getComputedStyle(bodyRow).display,
  };
};

const browser = await chromium.launch();
for (const t of targets) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(t.url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="tool-panel-section"]');
  await page.waitForTimeout(1500);
  console.log(`\n===== ${t.name} =====`);
  for (const [label, sel, colId] of [
    ['MAIN/备注', '.demo-page__table', 'note'],
    ['TIER3/操作', '[data-testid="tier3-finale-section"]', 'actions'],
  ]) {
    const d = await page.evaluate(INSPECT, { sel, colId });
    if (d.err) {
      console.log(`${label}: ${d.err}`);
      continue;
    }
    console.log(`${label}:`);
    console.log(
      `  row: header(w=${d.headerRowW} disp=${d.headerRowDisplay}) | body(w=${d.bodyRowW} disp=${d.bodyRowDisplay})`,
    );
    console.log(
      `  LEAF header: box=${d.leaf?.box} w=${d.leaf?.w} decl=${d.leaf?.declW} pad=${d.leaf?.padL}/${d.leaf?.padR} border=${d.leaf?.borderL} shrink=${d.leaf?.flex} minW=${d.leaf?.minW}`,
    );
    console.log(
      `  BODY cell : box=${d.body?.box} w=${d.body?.w} decl=${d.body?.declW} pad=${d.body?.padL}/${d.body?.padR} border=${d.body?.borderL} shrink=${d.body?.flex} minW=${d.body?.minW}`,
    );
  }
  await page.close();
}
await browser.close();
