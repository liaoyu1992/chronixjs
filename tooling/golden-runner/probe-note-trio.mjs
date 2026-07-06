import { chromium } from 'playwright';

// Measure header / filter / body cell widths for the 备注 (pinned-right) column
// across every table section on the page, plus text-overflow detection and the
// computed min-width / flex-shrink / overflow that govern whether a flex cell can
// shrink below its content.

const targets = [
  { name: 'vue3', url: 'http://localhost:8711/' },
  { name: 'vue2', url: 'http://localhost:8712/' },
  { name: 'react', url: 'http://localhost:8713/' },
];

// selectors for every table that may appear on the demo page
const SECTIONS = [
  { label: 'MAIN', sel: '.demo-page__table' },
  { label: 'TIER3', sel: '[data-testid="tier3-finale-section"]' },
  { label: 'TOOLPANEL', sel: '[data-testid="tool-panel-section"]' },
];

const probe = (sel) => {
  const section = document.querySelector(sel);
  if (!section) return { err: 'no section' };
  const headerEl = section.querySelector('.cx-table-header');
  const filterEl = section.querySelector('.cx-table-filter-row');
  const bodyEl = section.querySelector('.cx-table-body');
  if (!headerEl || !bodyEl) return { err: 'missing header/body' };

  // locate the 备注 / last leaf column header cell
  const leafHeaders = Array.from(
    headerEl.querySelectorAll('.cx-table-row--header > .cx-table-header-cell'),
  );
  if (!leafHeaders.length) return { err: 'no leaf headers' };
  const noteHeader =
    headerEl.querySelector('.cx-table-header-cell--pinned-right-first') ||
    headerEl.querySelector('.cx-table-header-cell--pinned-right') ||
    leafHeaders[leafHeaders.length - 1];
  const colId = noteHeader.getAttribute('data-col-id');

  const textW = (el) => {
    if (!el) return 0;
    const range = document.createRange();
    range.selectNodeContents(el);
    return Math.round(range.getBoundingClientRect().width);
  };
  const measure = (el) => {
    if (!el) return null;
    const s = getComputedStyle(el);
    const b = el.getBoundingClientRect();
    return {
      txt: (el.textContent || '').trim().slice(0, 12),
      l: Math.round(b.left),
      r: Math.round(b.right),
      w: Math.round(b.width),
      sw: el.scrollWidth,
      cw: el.clientWidth,
      textW: textW(el),
      minWidth: s.minWidth,
      flexShrink: s.flexShrink,
      overflow: s.overflow,
      whiteSpace: s.whiteSpace,
      textOverflow: s.textOverflow,
      boxSizing: s.boxSizing,
    };
  };

  // filter cell for same colId
  const filterCell = filterEl
    ? filterEl.querySelector(`.cx-table-filter-cell[data-col-id="${colId}"]`)
    : null;
  // body cells for same colId across first 5 visible rows
  const bodyCells = Array.from(
    bodyEl.querySelectorAll(`.cx-table-row .cx-table-cell[data-col-id="${colId}"]`),
  ).slice(0, 5);

  return {
    colId,
    header: measure(noteHeader),
    filter: measure(filterCell),
    bodies: bodyCells.map(measure),
  };
};

const browser = await chromium.launch();
for (const t of targets) {
  for (const vw of [1280, 900]) {
    const page = await browser.newPage({ viewport: { width: vw, height: 900 } });
    await page.goto(t.url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="tool-panel-section"]');
    await page.waitForTimeout(1200);
    console.log(`\n===== ${t.name} @${vw} =====`);
    for (const { label, sel } of SECTIONS) {
      await page.evaluate((s) => {
        const b = document.querySelector(s + ' .cx-table-body');
        if (b) b.scrollLeft = 0;
      }, sel);
      await page.waitForTimeout(200);
      const d = await page.evaluate(probe, sel);
      if (d.err) {
        console.log(`${label}: ${d.err}`);
        continue;
      }
      const h = d.header;
      const f = d.filter;
      const headerW = h?.w;
      const filterW = f?.w;
      const maxBodyW = Math.max(...d.bodies.map((b) => b.w));
      const overflows = d.bodies.filter((b) => b.textW > b.cw);
      const dwHF = (filterW ?? null) != null ? filterW - headerW : 'n/a';
      const dwHB = maxBodyW - headerW;
      const flag = dwHB !== 0 || (dwHF !== 'n/a' && dwHF !== 0) ? '  <<< MISALIGN' : '';
      console.log(
        `${label} col=${d.colId}: headerW=${headerW} filterW=${filterW} (Δf=${dwHF}) maxBodyW=${maxBodyW} (Δb=${dwHB}) overflows=${overflows.length}${flag}`,
      );
      if (flag) {
        console.log(
          `   header : w=${h.w} l=${h.l} r=${h.r} minW=${h.minWidth} shrink=${h.flexShrink} ov=${h.overflow} ws=${h.whiteSpace} box=${h.boxSizing}`,
        );
        if (f)
          console.log(
            `   filter : w=${f.w} l=${f.l} r=${f.r} minW=${f.minWidth} shrink=${f.flexShrink} ov=${f.overflow} ws=${f.whiteSpace} box=${f.boxSizing}`,
          );
        for (const b of d.bodies.slice(0, 3))
          console.log(
            `   body   : w=${b.w} l=${b.l} r=${b.r} sw=${b.sw} cw=${b.cw} textW=${b.textW} minW=${b.minWidth} shrink=${b.flexShrink} ov=${b.overflow} ws=${b.whiteSpace} box=${b.boxSizing} "${b.txt}"`,
          );
      }
    }
    await page.close();
  }
}
await browser.close();
