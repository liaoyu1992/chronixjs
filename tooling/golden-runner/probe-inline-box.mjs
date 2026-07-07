import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('http://localhost:8711/', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('[data-testid="tool-panel-section"]');
await page.waitForTimeout(1200);

const out = await page.evaluate(() => {
  const section = document.querySelector('.demo-page__table');
  const headerCell = section.querySelector(
    '.cx-table-row--header > .cx-table-header-cell[data-col-id="note"]',
  );
  const filterCell = section.querySelector('.cx-table-filter-cell[data-col-id="note"]');
  const bodyCell = section.querySelector('.cx-table-body .cx-table-cell[data-col-id="note"]');
  const read = (el, label) => {
    if (!el) return { label, missing: true };
    const cs = getComputedStyle(el);
    return {
      label,
      inlineStyle: el.getAttribute('style') || '',
      inlineHasBoxSizing: (el.getAttribute('style') || '').includes('box-sizing'),
      computedBoxSizing: cs.boxSizing,
      computedWidth: cs.width,
    };
  };
  return {
    header: read(headerCell, 'header'),
    filter: read(filterCell, 'filter'),
    body: read(bodyCell, 'body'),
  };
});
console.log(JSON.stringify(out, null, 2));
await browser.close();
