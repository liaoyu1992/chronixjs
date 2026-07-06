import { chromium } from 'playwright';

// Robustness proof: STRIP the demo's `.cx-table-header-cell, .cx-table-cell { box-sizing }`
// CSS rule at runtime, then measure alignment. If the adapter's INLINE boxSizing does its
// job, alignment holds (Δ=0) even with the demo CSS rule deleted.
const targets = [
  { name: 'vue3', url: 'http://localhost:8711/' },
  { name: 'vue2', url: 'http://localhost:8712/' },
  { name: 'react', url: 'http://localhost:8713/' },
];

const MEASURE = ({ sel, colId }) => {
  const section = document.querySelector(sel);
  const h = section.querySelector('.cx-table-header');
  const row = section.querySelector('.cx-table-body .cx-table-row');
  const hc = h.querySelector(
    `.cx-table-row--header > .cx-table-header-cell[data-col-id="${colId}"]`,
  );
  const bc = row.querySelector(`[data-col-id="${colId}"]`);
  const cs = (el) => getComputedStyle(el).boxSizing;
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width) };
  };
  return { hcBox: cs(hc), bcBox: cs(bc), h: box(hc), b: box(bc) };
};

const STRIP = () => {
  // delete every stylesheet rule that sets box-sizing on the table cell classes
  let removed = 0;
  for (const sheet of Array.from(document.styleSheets)) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    if (!rules) continue;
    const toRemove = [];
    for (let i = 0; i < rules.length; i++) {
      const r = rules[i];
      if (
        r.style &&
        r.style.boxSizing &&
        /cx-table-(header-cell|cell|filter-cell)/.test(r.selectorText || '')
      ) {
        toRemove.unshift(i);
      }
    }
    for (const i of toRemove) {
      sheet.deleteRule(i);
      removed++;
    }
  }
  return removed;
};

const browser = await chromium.launch();
for (const t of targets) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(t.url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="tool-panel-section"]');
  await page.waitForTimeout(1500);
  console.log(`\n===== ${t.name} =====`);
  const removed = await page.evaluate(STRIP);
  console.log(`stripped ${removed} demo box-sizing CSS rule(s)`);
  for (const [label, sel, colId] of [
    ['MAIN/备注', '.demo-page__table', 'note'],
    ['TIER3/操作', '[data-testid="tier3-finale-section"]', 'actions'],
  ]) {
    const d = await page.evaluate(MEASURE, { sel, colId });
    const dl = d.b.l - d.h.l,
      dr = d.b.r - d.h.r,
      dw = d.b.w - d.h.w;
    const ok = Math.abs(dl) <= 1 && Math.abs(dr) <= 1 && Math.abs(dw) <= 1;
    console.log(
      `${label}: header box-sizing=${d.hcBox} | body box-sizing=${d.bcBox} | Δl=${dl} Δr=${dr} Δw=${dw} → ${ok ? 'ALIGNED ✓' : 'MISALIGNED ✗'}`,
    );
  }
  await page.close();
}
await browser.close();
