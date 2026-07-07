import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'tmp-shots');

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
});
await page.goto('http://localhost:8712/', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('[data-testid="tier3-finale-section"]');
await page.waitForTimeout(1500);

const d = await page.evaluate(() => {
  const section = document.querySelector('[data-testid="tier3-finale-section"]');
  const headerEl = section.querySelector('.cx-table-header');
  const bodyFirstRow = section.querySelector('.cx-table-body .cx-table-row');
  const headerCells = Array.from(
    headerEl.querySelectorAll('.cx-table-row--header > .cx-table-header-cell'),
  );
  const bodyCells = Array.from(bodyFirstRow.children);
  const detail = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return {
      l: Math.round(r.left),
      r: Math.round(r.right),
      w: Math.round(r.width),
      sw: el.scrollWidth,
      cw: el.clientWidth,
      boxSizing: s.boxSizing,
      display: s.display,
      flex: s.flex,
      cssWidth: s.width,
      minWidth: s.minWidth,
      maxWidth: s.maxWidth,
    };
  };
  const actionsHeader = headerCells[headerCells.length - 1];
  const actionsBody = bodyCells[bodyCells.length - 1];
  const buttons = actionsBody
    ? Array.from(
        actionsBody.querySelectorAll('button, .cx-table-cell-action, [class*="action"]'),
      ).map((b) => {
        const r = b.getBoundingClientRect();
        return { tag: b.tagName, cls: (b.className || '').slice(0, 30), w: Math.round(r.width) };
      })
    : [];
  // also dump every column header vs body width for full picture
  const allCols = headerCells.map((h, i) => ({
    t: (h.querySelector('.cx-table-header-cell-label')?.textContent || h.textContent || '')
      .trim()
      .slice(0, 6),
    hW: Math.round(h.getBoundingClientRect().width),
    bW: bodyCells[i] ? Math.round(bodyCells[i].getBoundingClientRect().width) : null,
  }));
  return {
    allCols,
    actionsHeader: actionsHeader
      ? { ...detail(actionsHeader), txt: (actionsHeader.textContent || '').trim() }
      : null,
    actionsBody: actionsBody
      ? {
          ...detail(actionsBody),
          txt: (actionsBody.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 20),
        }
      : null,
    buttons,
  };
});
console.log(JSON.stringify(d, null, 2));

await page
  .locator('[data-testid="tier3-finale-section"] .cx-table-wrapper')
  .first()
  .screenshot({ path: path.join(OUT, 'vue2-tier3-actions.png') });
await browser.close();
console.log('done ->', OUT);
