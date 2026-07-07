import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('http://localhost:8711/', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.cx-table-wrapper');
await page.waitForTimeout(1200);

const data = await page.evaluate(() => {
  const wrap = document.querySelector('.cx-table-wrapper');
  const out = {};
  const hRow = wrap.querySelector('.cx-table-row--header');
  const fRow = wrap.querySelector('.cx-table-row--footer');
  for (const [name, row] of [
    ['HEADER', hRow],
    ['FOOTER', fRow],
  ]) {
    if (!row) {
      out[name] = null;
      continue;
    }
    const cs = getComputedStyle(row);
    const parent = row.parentElement;
    const pcs = parent ? getComputedStyle(parent) : null;
    out[name] = {
      rowRectW: row.getBoundingClientRect().width,
      rowDisplay: cs.display,
      rowFlexWrap: cs.flexWrap,
      rowJustify: cs.justifyContent,
      rowAlignItems: cs.alignItems,
      parentTag: parent?.tagName,
      parentClass: parent?.className,
      parentRectW: parent?.getBoundingClientRect().width,
      parentDisplay: pcs?.display,
      parentOverflowX: pcs?.overflowX,
      cells: Array.from(row.children).map((c, i) => {
        const ccs = getComputedStyle(c);
        return {
          i,
          w: Math.round(c.getBoundingClientRect().width * 10) / 10,
          flexGrow: ccs.flexGrow,
          flexShrink: ccs.flexShrink,
          flexBasis: ccs.flexBasis,
          width: ccs.width,
          boxSizing: ccs.boxSizing,
        };
      }),
    };
  }
  return out;
});

console.log(JSON.stringify(data, null, 1));
await browser.close();
