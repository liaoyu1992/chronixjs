import { chromium } from 'playwright';

// Does the 备注 body cell's CONTENT overflow its box (text spill), making the
// body look "wider" than the header even though the boxes align?
const targets = [
  { name: 'vue3', url: 'http://localhost:8711/' },
  { name: 'vue2', url: 'http://localhost:8712/' },
  { name: 'react', url: 'http://localhost:8713/' },
];

const INSPECT = ({ sel, colId }) => {
  const section = document.querySelector(sel);
  if (!section) return { err: 'no section' };
  const bodyFirstRow = section.querySelector('.cx-table-body .cx-table-row');
  const headerEl = section.querySelector('.cx-table-header');
  const cell = bodyFirstRow.querySelector(`[data-col-id="${colId}"]`);
  const headerCell = headerEl.querySelector(
    `.cx-table-row--header > .cx-table-header-cell[data-col-id="${colId}"]`,
  );
  if (!cell || !headerCell) return { err: 'no cell' };
  const cs = getComputedStyle(cell);
  const hs = getComputedStyle(headerCell);
  // measure the actual rendered text content extent vs cell box
  const cellBox = cell.getBoundingClientRect();
  // find the deepest text node extent
  const range = document.createRange();
  range.selectNodeContents(cell);
  const textRect = range.getBoundingClientRect();
  return {
    colId,
    cellBox: {
      l: Math.round(cellBox.left),
      r: Math.round(cellBox.right),
      w: Math.round(cellBox.width),
    },
    textExtent: {
      l: Math.round(textRect.left),
      r: Math.round(textRect.right),
      w: Math.round(textRect.width),
    },
    textOverflowsRight: Math.round(textRect.right - cellBox.right),
    textOverflowsLeft: Math.round(cellBox.left - textRect.left),
    bodyOverflowX: cs.overflowX,
    bodyOverflow: cs.overflow,
    bodyWhiteSpace: cs.whiteSpace,
    bodyTextOverflow: cs.textOverflow,
    bodyWordBreak: cs.wordBreak,
    bodyWordWrap: cs.wordWrap,
    headerBox: {
      l: Math.round(headerCell.getBoundingClientRect().left),
      r: Math.round(headerCell.getBoundingClientRect().right),
      w: Math.round(headerCell.getBoundingClientRect().width),
    },
    headerOverflowX: hs.overflowX,
    headerWhiteSpace: hs.whiteSpace,
    cellText: (cell.textContent || '').trim().slice(0, 30),
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
    ['TOOLPANEL/备注', '[data-testid="tool-panel-section"]', 'note'],
    ['MAIN/备注', '.demo-page__table', 'note'],
  ]) {
    const d = await page.evaluate(INSPECT, { sel, colId });
    if (d.err) {
      console.log(`${label}: ${d.err}`);
      continue;
    }
    console.log(`${label} "${d.cellText}"`);
    console.log(`  body cell box: l=${d.cellBox.l} r=${d.cellBox.r} w=${d.cellBox.w}`);
    console.log(
      `  body text ext: l=${d.textExtent.l} r=${d.textExtent.r} w=${d.textExtent.w}  → overflows RIGHT by ${d.textOverflowsRight}px, LEFT by ${d.textOverflowsLeft}px`,
    );
    console.log(
      `  body css: overflowX=${d.bodyOverflowX} whiteSpace=${d.bodyWhiteSpace} textOverflow=${d.bodyTextOverflow} wordBreak=${d.bodyWordBreak}`,
    );
    console.log(
      `  hdr  box: l=${d.headerBox.l} r=${d.headerBox.r} w=${d.headerBox.w}  overflowX=${d.headerOverflowX} whiteSpace=${d.headerWhiteSpace}`,
    );
    console.log(
      `  box-aligned: ${d.cellBox.l === d.headerBox.l && d.cellBox.r === d.headerBox.r ? 'YES' : 'NO'}`,
    );
  }
  await page.close();
}
await browser.close();
