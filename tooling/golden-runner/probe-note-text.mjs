import { chromium } from 'playwright';

const targets = [
  { name: 'vue3', url: 'http://localhost:8711/' },
  { name: 'vue2', url: 'http://localhost:8712/' },
  { name: 'react', url: 'http://localhost:8713/' },
];
const probe = (sel) => {
  const section = document.querySelector(sel);
  if (!section) return { err: 'no section' };
  const headerEl = section.querySelector('.cx-table-header');
  const bodyRows = Array.from(section.querySelectorAll('.cx-table-body .cx-table-row'));
  const noteHeader =
    headerEl.querySelector('.cx-table-header-cell--pinned-right-first') ||
    headerEl.querySelector('.cx-table-header-cell--pinned-right');
  const textW = (el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return Math.round(range.getBoundingClientRect().width);
  };
  const analyze = (el) => {
    if (!el) return null;
    const s = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    return {
      txt: (el.textContent || '').trim().slice(0, 14),
      cellW: Math.round(box.width),
      sw: el.scrollWidth,
      cw: el.clientWidth,
      textW: textW(el),
      whiteSpace: s.whiteSpace,
      overflow: s.overflow,
      textOverflow: s.textOverflow,
      childTags: Array.from(el.children).map(
        (c) => c.tagName + '.' + (c.className || '').slice(0, 24),
      ),
    };
  };
  const noteBodies = bodyRows.map((row) => {
    const c =
      row.querySelector('.cx-table-cell--pinned-right-first') ||
      row.querySelector('.cx-table-cell--pinned-right');
    return c ? analyze(c) : null;
  });
  return { noteHeader: analyze(noteHeader), noteBodies };
};

const browser = await chromium.launch();
for (const t of targets) {
  const page = await browser.newPage();
  await page.goto(t.url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="tool-panel-section"]');
  await page.waitForTimeout(1200);
  console.log(`\n===== ${t.name} =====`);
  for (const [label, sel] of [
    ['MAIN', '.demo-page__table'],
    ['TOOLPANEL', '[data-testid="tool-panel-section"]'],
  ]) {
    for (const sl of [0, 220]) {
      await page.evaluate(
        (args) => {
          const b = document.querySelector(args[0] + ' .cx-table-body');
          if (b) b.scrollLeft = args[1];
        },
        [sel, sl],
      );
      await page.waitForTimeout(300);
      const d = await page.evaluate(probe, sel);
      if (d.err) {
        console.log(`${label} sl=${sl}: ${d.err}`);
        continue;
      }
      const overflows = d.noteBodies.filter((b) => b.textW > b.cw);
      console.log(
        `${label} sl=${sl}: header cellW=${d.noteHeader?.cellW} cw=${d.noteHeader?.cw} textW=${d.noteHeader?.textW} | body rows=${d.noteBodies.length}, maxTextW=${Math.max(...d.noteBodies.map((b) => b.textW))}, overflows=${overflows.length}`,
      );
      overflows.forEach((b) =>
        console.log(
          `   OVERFLOW: cellW=${b.cellW} cw=${b.cw} textW=${b.textW} sw=${b.sw} "${b.txt}"`,
        ),
      );
    }
  }
  await page.close();
}
await browser.close();
