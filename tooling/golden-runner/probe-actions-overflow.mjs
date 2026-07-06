import { chromium } from 'playwright';

// Does the 操作 column's action-button row overflow its 180px cell?
const targets = [
  { name: 'vue3', url: 'http://localhost:8711/' },
  { name: 'vue2', url: 'http://localhost:8712/' },
  { name: 'react', url: 'http://localhost:8713/' },
];

const INSPECT = () => {
  const section = document.querySelector('[data-testid="tier3-finale-section"]');
  if (!section) return { err: 'no section' };
  const bodyFirstRow = section.querySelector('.cx-table-body .cx-table-row');
  const headerEl = section.querySelector('.cx-table-header');
  const bodyCell = bodyFirstRow.querySelector('[data-col-id="actions"]');
  const headerCell = headerEl.querySelector('.cx-table-header-cell[data-col-id="actions"]');
  if (!bodyCell || !headerCell) return { err: 'no actions cell' };
  const cs = getComputedStyle(bodyCell);
  const cellBox = bodyCell.getBoundingClientRect();
  // the actions container + each button
  const actionsEl =
    bodyCell.querySelector('.cx-table-cell-actions') ||
    bodyCell.querySelector('[class*="actions"]');
  const buttons = Array.from(bodyCell.querySelectorAll('button'));
  const lastBtn = buttons[buttons.length - 1];
  const firstBtn = buttons[0];
  const actionsBox = actionsEl ? actionsEl.getBoundingClientRect() : null;
  const out = {
    cellBox: {
      l: Math.round(cellBox.left),
      r: Math.round(cellBox.right),
      w: Math.round(cellBox.width),
    },
    cellOverflowX: cs.overflowX,
    cellPaddingL: cs.paddingLeft,
    cellPaddingR: cs.paddingR,
    headerBox: {
      l: Math.round(headerCell.getBoundingClientRect().left),
      r: Math.round(headerCell.getBoundingClientRect().right),
      w: Math.round(headerCell.getBoundingClientRect().width),
    },
    buttonsCount: buttons.length,
    firstBtnR: firstBtn ? Math.round(firstBtn.getBoundingClientRect().right) : null,
    lastBtnR: lastBtn ? Math.round(lastBtn.getBoundingClientRect().right) : null,
    lastBtnVisible: lastBtn ? getComputedStyle(lastBtn).display : null,
  };
  if (actionsBox)
    out.actionsBox = {
      l: Math.round(actionsBox.left),
      r: Math.round(actionsBox.right),
      w: Math.round(actionsBox.width),
    };
  out.contentOverflowsCellBy = out.lastBtnR ? out.lastBtnR - out.cellBox.r : null;
  return out;
};

const browser = await chromium.launch();
for (const t of targets) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(t.url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="tier3-finale-section"]');
  await page.waitForTimeout(1500);
  console.log(`\n===== ${t.name} TIER3 操作 =====`);
  const d = await page.evaluate(INSPECT);
  if (d.err) {
    console.log(d.err);
    await page.close();
    continue;
  }
  console.log(`  header box : l=${d.headerBox.l} r=${d.headerBox.r} w=${d.headerBox.w}`);
  console.log(
    `  body cell  : l=${d.cellBox.l} r=${d.cellBox.r} w=${d.cellBox.w}  overflowX=${d.cellOverflowX} pad=${d.cellPaddingL}/${d.cellPaddingR}`,
  );
  if (d.actionsBox)
    console.log(`  actionsRow : l=${d.actionsBox.l} r=${d.actionsBox.r} w=${d.actionsBox.w}`);
  console.log(
    `  buttons=${d.buttonsCount} firstBtnR=${d.firstBtnR} lastBtnR=${d.lastBtnR} (display=${d.lastBtnVisible})`,
  );
  console.log(`  >> last button overflows cell right edge by: ${d.contentOverflowsCellBy}px`);
  console.log(
    `  >> body cell vs header: Δl=${d.cellBox.l - d.headerBox.l} Δr=${d.cellBox.r - d.headerBox.r} Δw=${d.cellBox.w - d.headerBox.w}`,
  );
  await page.close();
}
await browser.close();
