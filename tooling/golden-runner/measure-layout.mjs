import { chromium } from 'playwright';

// Collected rows of interest inside the main table wrapper, with each cell's
// left/right/width in CSS pixels. Auto-discovers any element whose direct
// children all look like table cells, so header / header-group / filter /
// body / footer / pager rows are all caught without hard-coding selectors.
const ROW_CHILD_RE =
  /cx-table-(cell|header-cell|header-group|filter-cell|selection-cell|row-drag-cell|footer-cell|status-bar|pager)/;

const targets = [
  { name: 'vue3', url: 'http://localhost:8711/' },
  { name: 'vue2', url: 'http://localhost:8712/' },
  { name: 'react', url: 'http://localhost:8713/' },
];

const browser = await chromium.launch();
const fmt = (n) => (Math.round(n * 10) / 10).toFixed(1).padStart(7);

for (const t of targets) {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  });
  await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForSelector('.cx-table-wrapper', { timeout: 15000 });
  await page.waitForTimeout(1200);

  const report = await page.evaluate((childRe) => {
    const wrap = document.querySelector('.cx-table-wrapper');
    const wrect = wrap.getBoundingClientRect();
    const re = new RegExp(childRe);
    const all = Array.from(wrap.querySelectorAll('div'));
    const rows = [];
    const seen = new Set();
    for (const el of all) {
      const kids = Array.from(el.children);
      if (kids.length >= 2 && kids.every((k) => re.test(k.className?.toString?.() ?? ''))) {
        if (seen.has(el)) continue;
        seen.add(el);
        const rowClass =
          (el.className?.toString?.() ?? '').match(/cx-table-[a-z-]+/)?.[0] ?? el.className;
        const parentClass =
          el.parentElement?.className?.toString?.().match(/cx-table-[a-z-]+/)?.[0] ?? '';
        const cells = kids.map((c) => {
          const b = c.getBoundingClientRect();
          const cls =
            c.className.toString().match(/cx-table-[a-z-]+/)?.[0] ??
            c.className.toString().slice(0, 24);
          return { cls, left: b.left, right: b.right, w: b.width };
        });
        rows.push({ parent: parentClass, row: rowClass, cells });
      }
    }
    return { wrapLeft: wrect.left, wrapWidth: wrect.width, rows };
  }, ROW_CHILD_RE.source);

  console.log(
    `\n===== ${t.name} =====  wrapperLeft=${fmt(report.wrapLeft)} width=${fmt(report.wrapWidth)}  (${report.rows.length} rows discovered)`,
  );
  for (const r of report.rows) {
    const cells = r.cells
      .map(
        (c, i) =>
          `[${i}]${c.cls.replace('cx-table-', '').slice(0, 14).padEnd(15)}L${fmt(c.left - report.wrapLeft)} W${fmt(c.w)}`,
      )
      .join('  ');
    console.log(`${(r.row + '').replace('cx-table-', '').padEnd(22)}  ${cells}`);
  }
  await page.close();
}
await browser.close();
